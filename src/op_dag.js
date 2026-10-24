/**
 * op_dag.js — the operation log and the graph over it.
 *
 * Operations are immutable records in a Y.Map keyed by op id. A Y.Array
 * would assert that position means something; it doesn't. The edges are
 * the `parents` pointers, and the graph is computed from them, never
 * stored alongside them where the two could disagree.
 *
 * Everything below the storage helpers is pure: it takes any map-like with
 * .get and .values (a Y.Map or a plain Map) and touches no DOM and no
 * persistence.
 *
 * Operation {
 *   id, parents[], authorId, gesture, mutations[], ts, reverts?
 * }
 */

import * as Trace from './trace.js'

// ── storage ─────────────────────────────────────────────────────────────

export function getOps(ydoc, layer) {
  return ydoc.getMap(layer.opsKey)
}

export function appendOp(ydoc, layer, op) {
  if (!op?.id) throw new Error('appendOp: op.id is required')
  const ops = getOps(ydoc, layer)
  if (ops.has(op.id)) {
    Trace.op('append-duplicate', `${op.id} already in the log`, { layer: layer.name, id: op.id, gesture: op.gesture })
    return op
  }
  ops.set(op.id, op)
  // The whole op, mutations included — this is the inspectable wire packet.
  // It is already immutable plain data living in the Y.Map, so holding a
  // reference costs nothing beyond the pointer.
  Trace.op('append', `${op.gesture} entered the log as ${op.id}`, { layer: layer.name, ...op })
  return op
}

/** The layer's shared map of checkpoint snapshots, keyed by checkpoint op id. */
export function getContent(ydoc, layer) {
  return ydoc.getMap(layer.contentKey)
}

/**
 * Append a checkpoint op and its snapshot in one transaction. The op is
 * stored with empty mutations; the snapshot lives in the content map, where
 * it can be deleted without touching the immutable op (invariant 2).
 *
 * The same transaction deletes the content of every strict-ancestor
 * checkpoint that is not root-most (invariant 17), so a peer never sees the
 * new cut without the old content already gone, or the reverse.
 */
export function appendCheckpoint(ydoc, layer, op, content) {
  if (!op?.id) throw new Error('appendCheckpoint: op.id is required')
  const ops = getOps(ydoc, layer)
  if (ops.has(op.id)) {
    Trace.op('append-duplicate', `${op.id} already in the log`, { layer: layer.name, id: op.id, gesture: op.gesture })
    return op
  }
  const contentMap = getContent(ydoc, layer)
  const stored = { ...op, mutations: [] }
  ydoc.transact(() => {
    ops.set(op.id, stored)
    contentMap.set(op.id, content)
    for (const id of supersededContent(ops, contentMap, op.id)) contentMap.delete(id)
  })
  Trace.op('append', `${op.gesture} entered the log as ${op.id}`, { layer: layer.name, ...stored })
  return stored
}

/**
 * Checkpoints strictly behind `id` whose content is still held and is not
 * root-most. A checkpoint is root-most when no checkpoint sits in its own
 * ancestry: its content is what a projection falls back to when every newer
 * cut has lost its own, so it must outlive them all.
 */
function supersededContent(ops, contentMap, id) {
  const out = []
  for (const a of ancestors(ops, id)) {
    if (getOp(ops, a)?.gesture !== 'checkpoint' || !contentMap.has(a)) continue
    for (const b of ancestors(ops, a)) {
      if (getOp(ops, b)?.gesture === 'checkpoint') { out.push(a); break }
    }
  }
  return out
}

export function getOp(ops, id) {
  return ops?.get(id) ?? null
}

export function allOps(ops) {
  return [...ops.values()]
}

/** Snapshot a Y.Map of operations as a plain Map, for pure use. */
export function toOpMap(ops) {
  const out = new Map()
  for (const op of ops.values()) out.set(op.id, op)
  return out
}

// ── ancestry ────────────────────────────────────────────────────────────

const parentsOf = (ops, id) => getOp(ops, id)?.parents ?? []

/**
 * Every op reachable from id by following parents, id excluded. Visited
 * tracking makes a malformed cycle terminate instead of hanging. A parent
 * that is not in the log (pruned away) is neither returned nor followed, so
 * the result only ever holds ids that resolve.
 */
export function ancestors(ops, id) {
  const seen = new Set()
  const stack = [...parentsOf(ops, id)]
  while (stack.length) {
    const cur = stack.pop()
    if (cur == null || seen.has(cur) || !getOp(ops, cur)) continue
    seen.add(cur)
    for (const p of parentsOf(ops, cur)) stack.push(p)
  }
  return seen
}

export const ancestorsInclusive = (ops, id) => {
  const s = ancestors(ops, id)
  if (getOp(ops, id)) s.add(id)
  return s
}

export function isAncestor(ops, maybeAncestorId, id) {
  if (maybeAncestorId === id) return false
  return ancestors(ops, id).has(maybeAncestorId)
}

/** Tips: ops that no other op claims as a parent. */
export function heads(ops) {
  const claimed = new Set()
  for (const op of ops.values()) {
    for (const p of op.parents ?? []) claimed.add(p)
  }
  return [...ops.values()].map(op => op.id).filter(id => !claimed.has(id)).sort()
}

/**
 * Lowest common ancestor of two ops: a shared ancestor that no other
 * shared ancestor descends from. A DAG can offer several; the tie is
 * broken by id so every peer picks the same one. null when they share
 * nothing.
 */
export function lca(ops, a, b) {
  const inA = ancestorsInclusive(ops, a)
  const inB = ancestorsInclusive(ops, b)
  const common = [...inA].filter(id => inB.has(id))
  if (!common.length) return null

  const lowest = common.filter(id => !common.some(other => other !== id && isAncestor(ops, id, other)))
  return lowest.sort()[0] ?? null
}

/**
 * Whether id's ancestry reaches a parent that is not in the log before it
 * reaches a checkpoint. A checkpoint is a legal root whatever its parents,
 * so a path stops there. An id that is not in the log is not an orphan, there
 * is nothing to ignore. `memo` (id → bool) lets a caller checking several
 * ids share the work.
 */
export function isOrphan(ops, id, memo = new Map()) {
  if (memo.has(id)) return memo.get(id)
  const start = getOp(ops, id)
  if (!start) return false
  const seen = new Set()
  const stack = [start]
  let orphan = false
  while (stack.length && !orphan) {
    const op = stack.pop()
    if (seen.has(op.id)) continue
    seen.add(op.id)
    if (memo.get(op.id) === true) { orphan = true; break }
    if (op.gesture === 'checkpoint' || memo.get(op.id) === false) continue
    for (const p of op.parents ?? []) {
      const parent = getOp(ops, p)
      if (!parent) { orphan = true; break }
      stack.push(parent)
    }
  }
  memo.set(id, orphan)
  if (!orphan) for (const seenId of seen) memo.set(seenId, false)
  return orphan
}

/**
 * The maximal non-orphan ops in the log: the tips every peer can agree are
 * live, ignoring branches whose fork point was pruned. Non-orphan ops are
 * closed under ancestry, so a non-orphan op's parents are all non-orphan.
 */
export function sharedTips(ops) {
  const memo = new Map()
  const live = [...ops.values()].filter(op => !isOrphan(ops, op.id, memo))
  const claimed = new Set()
  for (const op of live) for (const p of op.parents ?? []) claimed.add(p)
  return live.map(op => op.id).filter(id => !claimed.has(id)).sort()
}

// ── ordering ────────────────────────────────────────────────────────────

/**
 * Whether an op is in effect: no op that is itself active reverts it. An
 * undo reverts a real gesture, a redo reverts an undo, so the recursion
 * settles every sequence of undos and redos. `memo` (id → bool) is per call
 * and also holds the reverts index, so callers checking many ids share it.
 */
const REVERTERS = Symbol('reverters')

export function isActive(ops, id, memo = new Map()) {
  if (!memo.has(REVERTERS)) {
    const byTarget = new Map()
    for (const op of ops.values()) {
      if (op.reverts == null) continue
      if (!byTarget.has(op.reverts)) byTarget.set(op.reverts, [])
      byTarget.get(op.reverts).push(op.id)
    }
    memo.set(REVERTERS, byTarget)
  }
  if (memo.has(id)) return memo.get(id)
  memo.set(id, true) // a malformed revert cycle terminates instead of recursing
  const active = !(memo.get(REVERTERS).get(id) ?? []).some(rid => isActive(ops, rid, memo))
  memo.set(id, active)
  return active
}

/** The ops in the union ancestry of tipIds, as a plain Map. */
export function ancestryView(ops, tipIds) {
  const view = new Map()
  for (const tip of tipIds ?? []) {
    for (const id of ancestorsInclusive(ops, tip)) view.set(id, getOp(ops, id))
  }
  return view
}

/** The real gesture at the root of op's revert chain, or null if it is gone. */
export function revertRoot(ops, op) {
  const seen = new Set()
  let cur = op
  while (cur?.reverts != null && !seen.has(cur.id)) {
    seen.add(cur.id)
    cur = getOp(ops, cur.reverts)
  }
  return cur && cur.reverts == null ? cur : null
}

/**
 * -1 if idA is authoritative over idB, 1 if idB is, 0 if equal.
 * An id missing from the sequence sorts last.
 */
export function compareAuthority(seq, idA, idB) {
  if (idA === idB) return 0
  const iA = seq.indexOf(idA)
  const iB = seq.indexOf(idB)
  if (iA === -1 && iB === -1) return 0
  if (iA === -1) return 1
  if (iB === -1) return -1
  return iA - iB
}

/**
 * Topological order over `ids`, with concurrent ops broken by author
 * authority and then by op id. Deterministic on every peer.
 *
 * This is a presentation order — an activity log, a reproducible
 * iteration. It says nothing about which of two concurrent ops happened
 * first, and nothing may be merged on the strength of it.
 */
export function totalOrder(ops, ids, joinSequence = []) {
  const want = new Set(ids)
  const tieBreak = (x, y) => {
    const ax = getOp(ops, x)?.authorId
    const ay = getOp(ops, y)?.authorId
    const byAuthor = compareAuthority(joinSequence, ax, ay)
    return byAuthor !== 0 ? byAuthor : (x < y ? -1 : x > y ? 1 : 0)
  }

  const ready = [...want].filter(id =>
    (parentsOf(ops, id)).every(p => !want.has(p))).sort(tieBreak)

  const out = []
  const placed = new Set()
  const remaining = new Set(want)

  while (ready.length) {
    const next = ready.shift()
    if (placed.has(next)) continue
    out.push(next)
    placed.add(next)
    remaining.delete(next)

    const freed = [...remaining].filter(id =>
      !placed.has(id) &&
      !ready.includes(id) &&
      parentsOf(ops, id).every(p => !want.has(p) || placed.has(p)))
    for (const id of freed) ready.push(id)
    ready.sort(tieBreak)
  }

  // A cycle, or a parent outside `ids` that never resolves, would strand
  // the rest; append them deterministically rather than losing them.
  if (remaining.size) out.push(...[...remaining].sort(tieBreak))
  return out
}

/**
 * The operations to apply to get from the state at `fromId` to the state
 * at `toId`: everything in toId's ancestry that isn't already in fromId's,
 * in a deterministic order. fromId null means from nothing.
 */
export function pathFrom(ops, fromId, toId, joinSequence = []) {
  if (toId == null) return []
  const have = fromId == null ? new Set() : ancestorsInclusive(ops, fromId)
  const need = [...ancestorsInclusive(ops, toId)].filter(id => !have.has(id) && getOp(ops, id))
  return totalOrder(ops, need, joinSequence)
}

// ── branches ────────────────────────────────────────────────────────────

/**
 * The authors with a contribution on the branch running from lcaId
 * (exclusive) up to tipId (inclusive). Unordered — ordering a fork's
 * joinSequence is the parent sequence's job, not the graph's.
 */
export function branchAuthors(ops, tipId, lcaId) {
  const have = lcaId == null ? new Set() : ancestorsInclusive(ops, lcaId)
  const out = new Set()
  for (const id of ancestorsInclusive(ops, tipId)) {
    if (have.has(id)) continue
    const author = getOp(ops, id)?.authorId
    if (author) out.add(author)
  }
  return out
}

/**
 * A forked table's joinSequence: the parent sequence filtered to the
 * branch's contributors, keeping their inherited relative order. Anyone
 * in the set but absent from the parent sequence sorts last, by id.
 */
export function forkJoinSequence(joinSequence, authorSet) {
  const want = authorSet instanceof Set ? authorSet : new Set(authorSet)
  const inherited = joinSequence.filter(id => want.has(id))
  const absent = [...want].filter(id => !joinSequence.includes(id)).sort()
  return [...inherited, ...absent]
}

/**
 * Which of two conflicting tips the table follows. The branch holding the
 * earliest-joining author leads; the other splits. Ties fall to the tip
 * ids so every peer agrees without communicating.
 */
export function labelBranches(ops, tipA, tipB, joinSequence = []) {
  const base = lca(ops, tipA, tipB)

  // With no LCA (disjoint components) each side ranks over its whole ancestry.
  const rank = (tip) => {
    let best = Infinity
    for (const author of branchAuthors(ops, tip, base)) {
      const i = joinSequence.indexOf(author)
      if (i !== -1 && i < best) best = i
    }
    return best
  }

  const rA = rank(tipA)
  const rB = rank(tipB)
  if (rA !== rB) {
    return rA < rB ? { leader: tipA, splitter: tipB, lca: base }
                   : { leader: tipB, splitter: tipA, lca: base }
  }
  return tipA < tipB ? { leader: tipA, splitter: tipB, lca: base }
                     : { leader: tipB, splitter: tipA, lca: base }
}
