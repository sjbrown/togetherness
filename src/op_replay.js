/**
 * op_replay.js — applying operations that arrived from a peer.
 *
 * Replay applies an operation's recorded mutations. It never re-runs the
 * handler that produced them, so a die's Math.random() ran once, on the
 * peer that rolled it, and its result is data here.
 */

import { apply as applyWire } from './op_wire_mutation.js'
import { getOp, isAncestor, lca, ancestorsInclusive, totalOrder, pathFrom, heads } from './op_dag.js'
import { projectFrom, projectTips, nearestCheckpoint, isCheckpoint, deltaMutations } from './op_checkpoint.js'
import { maximalTips } from './op_head.js'
import * as Trace from './trace.js'

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

export const SUBSEQUENT  = 'subsequent'
export const MERGED      = 'merged'
export const REBUILT     = 'rebuilt'
export const CONFLICTING = 'conflicting'
export const KNOWN       = 'known'

/** Collect every element data-id in a serialized subtree, recursively. */
function idsIn(nodes, out = new Set()) {
  for (const n of nodes ?? []) {
    if (n.tx !== undefined) continue
    const id = (n.at ?? []).find(([name]) => name === 'data-id')?.[1]
    if (id) out.add(id)
    idsIn(n.ch, out)
  }
  return out
}

/** The per-child key for one top-level added/removed node of a `child`
 * mutation: its own data-id, or `t:<parentId>` for a text node, which has
 * none. */
function childKey(node, parentId) {
  if (node.tx !== undefined) return `t:${parentId}`
  const id = (node.at ?? []).find(([name]) => name === 'data-id')?.[1]
  return id ? `e:${id}` : `t:${parentId}`
}

/**
 * Which refs an operation touches, as comparable strings.
 *
 * `structural` is keyed PER CHILD — the top-level node a `child` mutation
 * added or removed, by its own data-id (or `t:<parentId>` for a bare text
 * node) — so two branches conflict only when they touch the *same* child,
 * not merely the same container. `parents` is the per-container set: the
 * ids of every node a `child` mutation targeted, which is what makes two
 * concurrent inserts under one parent order-sensitive even when they don't
 * conflict (orderSensitive, below, and the canonical rebuild it triggers).
 *
 * `valued` covers attribute writes and text writes, keyed by attribute
 * name or text position, as before. `textParents` separately names the
 * parent of every text write, because a text ref's `{parentId, index}` can
 * point at a different node once the other side has changed that parent's
 * child list — text vs. structure under the same parent is a conflict,
 * and that can't be seen from `valued` or `parents` alone.
 *
 * `removedIds`/`addedIds`/`targetIds` are unchanged: they drive the
 * delete-vs-edit check, which addresses nodes rather than containers.
 */
export function touchedBy(op) {
  const parents = new Set()
  const structural = new Set()
  const childTouches = []
  const textParents = new Set()
  const valued = new Set()
  const removedIds = new Set()
  const addedIds = new Set()
  const targetIds = new Set()

  for (const m of op?.mutations ?? []) {
    if (m.t === 'child') {
      const parentKey = m.target?.id
      if (parentKey !== undefined) { parents.add(parentKey); targetIds.add(parentKey) }
      for (const node of m.removed ?? []) {
        const key = childKey(node, parentKey)
        structural.add(key)
        childTouches.push({ key, kind: 'removed' })
      }
      for (const node of m.added ?? []) {
        const key = childKey(node, parentKey)
        structural.add(key)
        childTouches.push({ key, kind: 'added' })
      }
      idsIn(m.removed, removedIds)
      idsIn(m.added, addedIds)
    } else if (m.t === 'text') {
      valued.add(`t:${m.target?.parentId}:${m.target?.index}#text`)
      if (m.target?.parentId !== undefined) {
        textParents.add(m.target.parentId)
        targetIds.add(m.target.parentId)
      }
    } else if (m.t === 'attr') {
      valued.add(`e:${m.target?.id}#${m.name}`)
      if (m.target?.id !== undefined) targetIds.add(m.target.id)
    }
  }
  return { parents, structural, childTouches, textParents, valued, removedIds, addedIds, targetIds }
}

const intersects = (a, b) => {
  for (const x of a) if (b.has(x)) return true
  return false
}

/** Every container a set of (non-checkpoint) ops touched with a `child`
 * mutation — shared gathering code for `conflicts`' text-vs-structure check
 * and for `orderSensitive`. */
function gatherParents(ops, ids) {
  const parents = new Set()
  for (const id of ids) {
    const op = getOp(ops, id)
    if (isCheckpoint(op)) continue
    for (const p of touchedBy(op).parents) parents.add(p)
  }
  return parents
}

/**
 * Do two sets of operations contend?
 *
 * - Structural, per child: two sides conflict on a child key only when
 *   both touch it AND at least one of them re-adds it (moves or inserts
 *   it) rather than only removing it. Two sides that both only remove the
 *   same child — the double-delete case — merge: applying a removal whose
 *   target is already gone does nothing (apply() already skips a missing
 *   victim).
 * - Valued: the same attribute, or the same text position, on both sides.
 * - Text vs. structure under the same parent: one side writes a text
 *   position, the other changes that same parent's child list. The text
 *   ref's index can point at a different node once the child list has
 *   moved, and no replay order fixes that — coarse and rare, since toys
 *   keep text in <tspan>s.
 * - Delete vs. edit: one side's *net* removal of a node — removed and not
 *   re-added on that same side — against the other side addressing that
 *   node or anything inside it. Checked both directions to keep
 *   classification symmetric between peers.
 */
export function conflicts(ops, idsA, idsB) {
  const gather = (ids) => {
    const valued = new Set()
    const removedIds = new Set(), addedIds = new Set(), targetIds = new Set()
    const childRemoved = new Set(), childAdded = new Set()
    const textParents = new Set()
    for (const id of ids) {
      const op = getOp(ops, id)
      if (isCheckpoint(op)) continue
      const t = touchedBy(op)
      for (const r of t.valued) valued.add(r)
      for (const r of t.removedIds) removedIds.add(r)
      for (const r of t.addedIds) addedIds.add(r)
      for (const r of t.targetIds) targetIds.add(r)
      for (const p of t.textParents) textParents.add(p)
      for (const c of t.childTouches) {
        if (c.kind === 'removed') childRemoved.add(c.key)
        else childAdded.add(c.key)
      }
    }
    const netRemoved = new Set([...removedIds].filter(id => !addedIds.has(id)))
    const childKeys = new Set([...childRemoved, ...childAdded])
    const onlyRemoved = new Set([...childRemoved].filter(k => !childAdded.has(k)))
    return { valued, netRemoved, targetIds, childKeys, onlyRemoved, textParents }
  }
  const a = gather(idsA)
  const b = gather(idsB)

  const sharedChildKeys = [...a.childKeys].filter(k => b.childKeys.has(k))
  const structuralConflict = sharedChildKeys.some(k => !(a.onlyRemoved.has(k) && b.onlyRemoved.has(k)))

  const aParents = gatherParents(ops, idsA)
  const bParents = gatherParents(ops, idsB)
  const textVsStructure = intersects(a.textParents, bParents) || intersects(b.textParents, aParents)

  return structuralConflict || textVsStructure || intersects(a.valued, b.valued)
    || intersects(a.netRemoved, b.targetIds) || intersects(b.netRemoved, a.targetIds)
}

/**
 * Not a conflict, but not safe to apply in arrival order either: the two
 * sides have `child` mutations under the SAME parent (even when they don't
 * touch the same child), so no arrival order settles sibling order the
 * same way on both peers. A canonical rebuild is what resolves this.
 */
export function orderSensitive(ops, idsA, idsB) {
  return intersects(gatherParents(ops, idsA), gatherParents(ops, idsB))
}

const normalizeTips = (tipsOrHead) =>
  (Array.isArray(tipsOrHead) ? tipsOrHead : (tipsOrHead == null ? [] : [tipsOrHead])).filter(id => id != null)

/**
 * How an arriving operation relates to this peer's LOCAL TIPS — head plus
 * merge tips, rather than the head alone. "What I have" is the
 * inclusive ancestry of the whole set: a descendant of a merge tip must
 * not be treated as brand new just because it isn't a descendant of the
 * primary head (that was a real bug — a merge tip's own ancestry got
 * re-applied whole on top of a later op that already included it).
 *
 * `tips` accepts a bare id, an array, or null/undefined, so a caller with
 * no merge tips can keep passing a single head id.
 *
 * have = inclusive ancestry of localTips
 * D    = inclusive ancestry(incoming) − have         — everything new
 * H'   = ops in `have` that are NOT an ancestor of every op in D — i.e.
 *        ops this peer holds that are concurrent with something new.
 *        Computed as have − (the intersection of every d∈D's inclusive
 *        ancestry), so this never re-walks the whole log per d — D is
 *        usually one or two ops, and each is walked once.
 *
 * KNOWN        — D is empty.
 * CONFLICTING  — conflicts(H', D). (apply nothing)
 * SUBSEQUENT   — H' is empty: every op this peer has is an ancestor of
 *                everything new, so every local tip is an ancestor of
 *                incoming.
 * REBUILT      — H' non-empty, and orderSensitive(H', D): a canonical
 *                rebuild is needed to agree on sibling order.
 * MERGED       — H' non-empty, not order-sensitive: D applies as deltas
 *                on top of the current DOM in any order.
 *
 * Returns { kind, D } — D is everything new, for the caller to apply.
 * Pairwise lca/tips reporting for CONFLICTING is the caller's job
 * (receiveOp) — the branch dialog (labelBranches, handleToyBranchConflict)
 * expects a head-vs-incoming pair, and N-way conflicts stay unhandled.
 */
export function classify(ops, tips, incomingId, joinSequence = []) {
  const localTipsArr = maximalTips(ops, normalizeTips(tips))
  if (!getOp(ops, incomingId)) return { kind: KNOWN, D: [] }

  if (!localTipsArr.length) return { kind: SUBSEQUENT, D: [incomingId] }

  const have = new Set()
  for (const t of localTipsArr) for (const a of ancestorsInclusive(ops, t)) have.add(a)

  if (have.has(incomingId)) return { kind: KNOWN, D: [] }

  const D = [...ancestorsInclusive(ops, incomingId)].filter(id => !have.has(id))
  if (!D.length) return { kind: KNOWN, D: [] }

  let commonOfD = null
  for (const d of D) {
    const s = ancestorsInclusive(ops, d)
    commonOfD = commonOfD == null ? s : new Set([...commonOfD].filter(x => s.has(x)))
  }
  const Hp = [...have].filter(h => !commonOfD.has(h))

  if (conflicts(ops, Hp, D)) return { kind: CONFLICTING, D }
  if (!Hp.length) return { kind: SUBSEQUENT, D }
  if (orderSensitive(ops, Hp, D)) return { kind: REBUILT, D }
  return { kind: MERGED, D }
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
      // The path IS the order of application — the one thing about replay
      // that is impossible to infer from the resulting DOM.
      Trace.op('advance', `replaying ${path.length} operation${path.length === 1 ? '' : 's'}`, () => ({
        mode: 'replay', from: headId, to: targetId,
        path: path.map((id, i) => ({ i, id, gesture: getOp(ops, id)?.gesture ?? null,
                                     authorId: getOp(ops, id)?.authorId ?? null })),
      }))
      for (const id of path) {
        applyWire(deltaMutations(getOp(ops, id)), layerEl)
      }
    } else {
      Trace.op('advance', 'rebuilding from the nearest checkpoint',
        { mode: 'project', from: headId, to: targetId })
      projectFrom(layerEl, ops, targetId, joinSequence)
    }
    return targetId
  })
}

/** Every tip in the log, for a caller deciding what to converge on. */
export const tips = (ops) => heads(ops)

/** Apply a set of arrived ops as deltas, in totalOrder, on top of the
 * current DOM — safe for SUBSEQUENT and MERGED, where nothing in the set
 * is order-sensitive against what's already there. */
function applyDeltas(layerEl, ops, ids, joinSequence) {
  const order = totalOrder(ops, ids, joinSequence)
  return withSuppressedCapture(() => {
    for (const id of order) applyWire(deltaMutations(getOp(ops, id)), layerEl)
    return order
  })
}

export const RECEIVED_KNOWN      = 'received-known'
export const RECEIVED_SUBSEQUENT = 'received-subsequent'
export const RECEIVED_MERGED     = 'received-merged'
export const RECEIVED_REBUILT    = 'received-rebuilt'
export const RECEIVED_CONFLICT   = 'received-conflict'

/**
 * The single entry point for an arriving operation: classify it against
 * this peer's local tips (head plus merge tips), apply it if that's
 * safe, and report what happened.
 *
 * - known: nothing to do.
 * - subsequent: DOM advances (deltas in totalOrder), head becomes
 *   incoming, merge tips clear.
 * - merged: D applies as deltas directly on top of the current DOM; head
 *   stays, merge tips become the new maximal tip set minus the head — the
 *   next local commit is what folds them into the graph as parents
 *   (op_head.consumeParents).
 * - rebuilt: the DOM is order-sensitive against what arrived, so it's
 *   reset to the latest cut checkpoint and replayed (projectTips) rather
 *   than patched; head stays, merge tips update the same way as merged.
 *   The caller (toys.js's receiveToyOp) may write a merge checkpoint
 *   parented on this same tip set right after — when it does, the merge
 *   tips collapse immediately instead of waiting for the next commit.
 * - conflicting: nothing is applied. The caller resolves via the branch
 *   dialog; classification here stays pairwise against the primary head —
 *   N-way conflicts stay unhandled — so lca and tips are reported the
 *   same shape as before.
 */
export function receiveOp(layerEl, ops, headId, incomingId, joinSequence = [], mergeTipIds = []) {
  const localTipsArr = maximalTips(ops, [headId, ...(mergeTipIds ?? [])])
  const { kind, D } = classify(ops, localTipsArr, incomingId, joinSequence)

  Trace.op('classify', `${incomingId} is ${kind} relative to local tips`, () => ({
    incoming: incomingId, tips: localTipsArr, kind,
    gesture:  getOp(ops, incomingId)?.gesture ?? null,
    authorId: getOp(ops, incomingId)?.authorId ?? null,
  }), kind === CONFLICTING ? 'warn' : 'info')

  if (kind === KNOWN) {
    return { result: RECEIVED_KNOWN, head: headId, mergeTip: null, mergeTips: mergeTipIds ?? [] }
  }

  if (kind === CONFLICTING) {
    const base = headId != null ? lca(ops, headId, incomingId) : null
    return {
      result: RECEIVED_CONFLICT, head: headId, mergeTip: null, mergeTips: mergeTipIds ?? [],
      lca: base, tips: [headId, incomingId],
    }
  }

  if (kind === SUBSEQUENT) {
    applyDeltas(layerEl, ops, D, joinSequence)
    return { result: RECEIVED_SUBSEQUENT, head: incomingId, mergeTip: null, mergeTips: [] }
  }

  const newTips = maximalTips(ops, [...localTipsArr, incomingId])
  const newMergeTips = newTips.filter(t => t !== headId)

  if (kind === MERGED) {
    applyDeltas(layerEl, ops, D, joinSequence)
    return { result: RECEIVED_MERGED, head: headId, mergeTip: incomingId, mergeTips: newMergeTips }
  }

  // REBUILT
  withSuppressedCapture(() => projectTips(layerEl, ops, newTips, joinSequence))
  Trace.op('rebuild', `rebuilt ${newTips.length} tip${newTips.length === 1 ? '' : 's'}`, () => ({
    tips: newTips, cut: nearestCheckpoint(ops, newTips), incoming: incomingId,
  }))
  return { result: RECEIVED_REBUILT, head: headId, mergeTip: incomingId, mergeTips: newMergeTips }
}
