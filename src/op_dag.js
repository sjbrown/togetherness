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
 *   id, parents[], authorId, gesture, mutations[], ts
 * }
 */

const OPS_KEY = 'ops'

// ── storage ─────────────────────────────────────────────────────────────

export function getOps(ydoc) {
  return ydoc.getMap(OPS_KEY)
}

export function appendOp(ydoc, op) {
  if (!op?.id) throw new Error('appendOp: op.id is required')
  const ops = getOps(ydoc)
  if (ops.has(op.id)) return op
  ops.set(op.id, op)
  return op
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
 * tracking makes a malformed cycle terminate instead of hanging.
 */
export function ancestors(ops, id) {
  const seen = new Set()
  const stack = [...parentsOf(ops, id)]
  while (stack.length) {
    const cur = stack.pop()
    if (cur == null || seen.has(cur)) continue
    seen.add(cur)
    for (const p of parentsOf(ops, cur)) stack.push(p)
  }
  return seen
}

const ancestorsInclusive = (ops, id) => {
  const s = ancestors(ops, id)
  s.add(id)
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

// ── ordering ────────────────────────────────────────────────────────────

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
