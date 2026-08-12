/**
 * op_replay.js — applying operations that arrived from a peer.
 *
 * Replay applies an operation's recorded mutations. It never re-runs the
 * handler that produced them, so a die's Math.random() ran once, on the
 * peer that rolled it, and its result is data here.
 */

import { apply as applyWire } from './op_wire_mutation.js'
import { getOp, isAncestor, lca, pathFrom, heads } from './op_dag.js'
import { projectFrom } from './op_checkpoint.js'

let _suppressed = false

/** True while a remote operation is being applied. */
export const isReplaying = () => _suppressed

/**
 * Run fn with capture suppressed. The envelope checks this and drops what
 * it sees, so applying a peer's operation never produces one of our own.
 */
export function withSuppressedCapture(fn) {
  const prev = _suppressed
  _suppressed = true
  try { return fn() } finally { _suppressed = prev }
}

// ── classification ──────────────────────────────────────────────────────

export const SUBSEQUENT = 'subsequent'
export const CONCURRENT = 'concurrent'
export const CONFLICTING = 'conflicting'
export const KNOWN = 'known'

/**
 * Which refs an operation touches, as comparable strings, split by the
 * kind of touch: a childList change to a node is structural and contends
 * with another peer's structural change to the same node; two attribute
 * writes contend only on the same attribute.
 */
export function touchedBy(op) {
  const structural = new Set()
  const valued = new Set()

  for (const m of op?.mutations ?? []) {
    const ref = m.target?.id !== undefined
      ? `e:${m.target.id}`
      : `t:${m.target?.parentId}:${m.target?.index}`

    if (m.t === 'child')      structural.add(ref)
    else if (m.t === 'text')  valued.add(`${ref}#text`)
    else if (m.t === 'attr')  valued.add(`${ref}#${m.name}`)
  }
  return { structural, valued }
}

const intersects = (a, b) => {
  for (const x of a) if (b.has(x)) return true
  return false
}

/**
 * Do two sets of operations contend? Deliberately narrow: a structural
 * change to the same node from both sides, or the same attribute or text
 * position written on both sides. Concurrent edits to different nodes, or
 * to different attributes of one node, merge without complaint.
 */
export function conflicts(ops, idsA, idsB) {
  const gather = (ids) => {
    const structural = new Set(), valued = new Set()
    for (const id of ids) {
      const t = touchedBy(getOp(ops, id))
      for (const r of t.structural) structural.add(r)
      for (const r of t.valued) valued.add(r)
    }
    return { structural, valued }
  }
  const a = gather(idsA)
  const b = gather(idsB)
  return intersects(a.structural, b.structural) || intersects(a.valued, b.valued)
}

/**
 * How an arriving operation relates to the local head.
 * Returns { kind, lca } — lca only for the concurrent kinds.
 */
export function classify(ops, headId, incomingId) {
  if (incomingId === headId) return { kind: KNOWN, lca: headId }
  if (headId == null) return { kind: SUBSEQUENT, lca: null }
  if (!getOp(ops, incomingId)) return { kind: KNOWN, lca: null }

  if (isAncestor(ops, incomingId, headId)) return { kind: KNOWN, lca: incomingId }
  if (isAncestor(ops, headId, incomingId)) return { kind: SUBSEQUENT, lca: headId }

  const base = lca(ops, headId, incomingId)
  const mine = pathFrom(ops, base, headId)
  const theirs = pathFrom(ops, base, incomingId)

  return {
    kind: conflicts(ops, mine, theirs) ? CONFLICTING : CONCURRENT,
    lca: base,
  }
}

// ── application ─────────────────────────────────────────────────────────

/**
 * Bring layerEl from headId to targetId. A descendant target replays only
 * the missing operations; anything else rebuilds from the nearest
 * checkpoint, which is what makes adopting another branch cheap to reason
 * about — no inverses, no snapshots.
 *
 * Returns the new head.
 */
export function advanceTo(layerEl, ops, headId, targetId, joinSequence = []) {
  return withSuppressedCapture(() => {
    if (headId != null && (headId === targetId || isAncestor(ops, headId, targetId))) {
      const path = pathFrom(ops, headId, targetId, joinSequence)
      for (const id of path) {
        applyWire(getOp(ops, id).mutations ?? [], layerEl)
      }
    } else {
      projectFrom(layerEl, ops, targetId, joinSequence)
    }
    return targetId
  })
}

/** Every tip in the log, for a caller deciding what to converge on. */
export const tips = (ops) => heads(ops)

/**
 * Apply a concurrent, non-conflicting arrival directly — safe, since by
 * construction it touches nothing the local head's own path touches.
 * Does not move the primary head: neither op is the other's ancestor, so
 * there is no single id that names "both". The caller is expected to
 * remember incomingId as a merge tip (op_head.addMergeTip) so it becomes
 * an extra parent next time this peer commits — that commit, not this
 * application, is what actually joins the branches in the graph.
 */
export function mergeConcurrent(layerEl, op) {
  return withSuppressedCapture(() => applyWire(op?.mutations ?? [], layerEl))
}

export const RECEIVED_KNOWN      = 'received-known'
export const RECEIVED_SUBSEQUENT = 'received-subsequent'
export const RECEIVED_MERGED     = 'received-merged'
export const RECEIVED_CONFLICT   = 'received-conflict'

/**
 * The single entry point for an arriving operation: classify it against
 * the local head, apply it if that's safe, and report what happened.
 *
 * - known: nothing to do.
 * - subsequent: DOM advances, head moves.
 * - concurrent, non-conflicting: DOM absorbs it via mergeConcurrent, head
 *   stays put, incomingId is returned as a mergeTip for the caller to
 *   persist (op_head.addMergeTip) — this function has no table id to key
 *   storage on, so it reports rather than writes.
 * - conflicting: nothing is applied. The caller resolves via the branch
 *   dialog; lca and both tips are returned for that.
 */
export function receiveOp(layerEl, ops, headId, incomingId, joinSequence = []) {
  const { kind, lca: base } = classify(ops, headId, incomingId)

  if (kind === KNOWN) {
    return { result: RECEIVED_KNOWN, head: headId, mergeTip: null, lca: base }
  }
  if (kind === SUBSEQUENT) {
    const head = advanceTo(layerEl, ops, headId, incomingId, joinSequence)
    return { result: RECEIVED_SUBSEQUENT, head, mergeTip: null, lca: base }
  }
  if (kind === CONCURRENT) {
    mergeConcurrent(layerEl, getOp(ops, incomingId))
    return { result: RECEIVED_MERGED, head: headId, mergeTip: incomingId, lca: base }
  }
  return { result: RECEIVED_CONFLICT, head: headId, mergeTip: null, lca: base, tips: [headId, incomingId] }
}
