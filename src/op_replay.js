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
      for (const id of pathFrom(ops, headId, targetId, joinSequence)) {
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
