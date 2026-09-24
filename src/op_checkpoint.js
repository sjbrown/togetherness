/**
 * op_checkpoint.js — turning a layer's current contents into an operation,
 * and a branch's operations back into a layer.
 *
 * A checkpoint is an ordinary operation whose mutations insert a whole
 * subtree into an empty layer. Genesis, import, periodic compaction and a
 * fork's seed are all the same primitive, and its payload is the same
 * serialization export writes.
 *
 * Projecting a branch is: clear the layer, apply the nearest ancestor
 * checkpoint, replay forward. No inverses and no snapshots — applying a
 * set of operations to a known base is idempotent by construction.
 */

import { serializeNode, apply as applyWire, ensureIds } from './op_wire_mutation.js'
import { ancestors, ancestorsInclusive, getOp, isAncestor, pathFrom, totalOrder } from './op_dag.js'
import { ensureLayerId, LAYER_DATA_ID } from './toys.js'
import * as Trace from './trace.js'

export { ensureLayerId, LAYER_DATA_ID }
export const CHECKPOINT_GESTURE = 'checkpoint'

// Below this many ops since the last checkpoint, writing a new one isn't
// worth it — replaying a handful of operations is cheap, and a checkpoint
// op costs a full serialized layer. Triggers should check this before
// doing anything else.
export const CHECKPOINT_MIN_OPS = 10

/**
 * How many operations stand between headId and its nearest checkpoint
 * (or genesis, if it has none). This is the only number the "is it worth
 * checkpointing" decision needs — it says nothing about *when*, only
 * about whether a checkpoint right now would do any good.
 */
export function opsSinceCheckpoint(ops, headId) {
  if (headId == null) return 0
  const base = nearestCheckpoint(ops, headId)
  return pathFrom(ops, base, headId).length
}

/**
 * Whether a checkpoint at headId would be worth writing. Callers still
 * decide *when* to ask — this only answers whether asking now would pay
 * off, per CHECKPOINT_MIN_OPS.
 */
export function shouldCheckpoint(ops, headId) {
  return opsSinceCheckpoint(ops, headId) > CHECKPOINT_MIN_OPS
}

let _counter = 0
const mintOpId = () =>
  `tt-op-${Date.now().toString(36)}-${(_counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const isCheckpoint = (op) => op?.gesture === CHECKPOINT_GESTURE

/** A checkpoint contributes nothing as a delta — only projectFrom's base,
 * onto a layer it just cleared, applies its mutations. */
export const deltaMutations = (op) => (isCheckpoint(op) ? [] : (op?.mutations ?? []))

/**
 * The most recent checkpoint anywhere in the log, by wall-clock ts —
 * not scoped to any one head or branch. Used for idle-checkpoint timing,
 * where "how long since *a* checkpoint landed" is a global fact: any
 * peer's checkpoint resets the clock for all of them, same as any peer's
 * op advances the shared log. Returns null if the log has none yet.
 */
export function lastCheckpointTs(ops) {
  let latest = null
  for (const op of ops.values()) {
    if (!isCheckpoint(op)) continue
    if (latest == null || op.ts > latest) latest = op.ts
  }
  return latest
}

/**
 * Freeze a layer's current contents as an operation. Reads the live DOM,
 * which is a faithful projection already — replaying the log to rebuild
 * something we are holding would be ceremony.
 *
 * opId and ts are accepted so a caller that needs two peers to produce
 * byte-identical output (seeding a forked table) can supply them.
 */
export function checkpointOp(layerEl, { authorId, parents = [], id, ts = Date.now() } = {}) {
  ensureLayerId(layerEl)
  ensureIds(layerEl)

  const added = []
  for (const child of Array.from(layerEl.childNodes)) {
    const s = serializeNode(child)
    if (s) added.push(s)
  }

  return {
    id: id ?? mintOpId(),
    parents,
    authorId,
    gesture: CHECKPOINT_GESTURE,
    ts,
    mutations: added.length
      ? [{
          t: 'child',
          target: { id: layerEl.getAttribute('data-id') },
          added,
          removed: [],
          prevSibling: null,
          nextSibling: null,
        }]
      : [],
  }
}

const normalizeTips = (tipsOrHead) =>
  (Array.isArray(tipsOrHead) ? tipsOrHead : (tipsOrHead == null ? [] : [tipsOrHead])).filter(id => id != null)

/** The union of every tip's inclusive ancestry. */
function unionAncestry(ops, tips) {
  const union = new Set()
  for (const t of tips) {
    union.add(t)
    for (const a of ancestors(ops, t)) union.add(a)
  }
  return union
}

/**
 * A checkpoint C is a cut of `reachable` (a tip set's union ancestry) when
 * every op in `reachable` is an ancestor of C, is C, or is a descendant of
 * C — i.e. C is comparable to everything, so it names a single moment
 * every branch in the set has passed through (or not yet reached).
 */
function isCut(ops, candidateId, reachable) {
  for (const id of reachable) {
    if (id === candidateId) continue
    if (!isAncestor(ops, candidateId, id) && !isAncestor(ops, id, candidateId)) return false
  }
  return true
}

/**
 * The projection base for a tip set: the latest checkpoint that is a cut
 * of the union of every tip's ancestry (see isCut above). Cuts within one
 * set are totally ordered, so "latest" is unambiguous; genesis always
 * qualifies since it is an ancestor of everything.
 *
 * Single-tip callers (the common case — one local head, no merge tips) get
 * the old per-branch behaviour back: pass a bare id, or a one-element array.
 * null when the reachable set has no checkpoint at all.
 */
export function nearestCheckpoint(ops, tipsOrHead) {
  const tips = normalizeTips(tipsOrHead)
  if (!tips.length) return null

  const reachable = unionAncestry(ops, tips)
  const marks = [...reachable].filter(id => isCheckpoint(getOp(ops, id)))
  if (!marks.length) return null

  const cuts = marks.filter(id => isCut(ops, id, reachable))
  if (!cuts.length) return null

  const latest = cuts.filter(id => !cuts.some(other => other !== id && isAncestor(ops, id, other)))
  return latest.sort()[0] ?? null
}

/** Apply a list of operation ids to the layer, in the order given. */
export function applyOps(layerEl, ops, ids) {
  for (const id of ids) {
    const op = getOp(ops, id)
    if (!op) throw new Error(`applyOps: no operation ${id}`)
    applyWire(op.mutations ?? [], layerEl)
  }
  return layerEl
}

/**
 * Rebuild the layer so it reflects the given tip set. Clears first, so
 * calling this twice with the same tips leaves the same DOM. This is what
 * makes projection a function of the tip set alone: replay is
 *   1. clear the layer
 *   2. apply the latest cut checkpoint's content
 *   3. apply the union of every tip's ancestry, minus the cut's own
 *      ancestry, in totalOrder
 * so two peers who converge on the same tips compute the same DOM no
 * matter what order they received the operations in.
 */
export function projectTips(layerEl, ops, tipIds, joinSequence = []) {
  ensureLayerId(layerEl)
  while (layerEl.firstChild) layerEl.removeChild(layerEl.firstChild)

  const tips = normalizeTips(tipIds)
  if (!tips.length) {
    Trace.op('project-empty', 'nothing to project — no tips', { tips: [] })
    return layerEl
  }

  const union = unionAncestry(ops, tips)
  const base = nearestCheckpoint(ops, tips)
  const baseAncestry = base == null ? new Set() : ancestorsInclusive(ops, base)
  const remaining = [...union].filter(id => !baseAncestry.has(id) && getOp(ops, id))
  const path = totalOrder(ops, remaining, joinSequence)

  Trace.op('project',
    `rebuilt from ${base ? 'checkpoint' : 'nothing'} + ${path.length} operation${path.length === 1 ? '' : 's'}`,
    () => ({
      tips,
      checkpoint: base,
      path: path.map((id, i) => ({ i, id, gesture: getOp(ops, id)?.gesture ?? null,
                                   authorId: getOp(ops, id)?.authorId ?? null })),
    }))

  if (base) applyOps(layerEl, ops, [base])
  for (const id of path) {
    applyWire(deltaMutations(getOp(ops, id)), layerEl)
  }
  return layerEl
}

/** The one-tip case of projectTips — kept for the fork seed and existing callers. */
export function projectFrom(layerEl, ops, headId, joinSequence = []) {
  return projectTips(layerEl, ops, headId == null ? [] : [headId], joinSequence)
}

// ── forking ─────────────────────────────────────────────────────────────

// FNV-1a, 32-bit, synchronous. A fork's genesis id only needs one
// property — two peers hashing the same content land on the same id —
// not cryptographic collision-resistance or async crypto.subtle: it's
// never shown to a person and never used to name anything externally
// (compare tables.js's generateForkTableId, which is both of those and
// earns SHA-256 accordingly).
function deterministicSuffix(seedString) {
  let h = 0x811c9dc5
  for (let i = 0; i < seedString.length; i++) {
    h ^= seedString.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

/**
 * The seed content for a forked table.
 * A genesis checkpoint of the branch point, authored deterministically so
 * two peers independently forking the same branch produce byte-identical
 * seed content.
 * Both splitting peers land on the same table id
 *
 * ops/joinSequence describe the parent table and are read-only. layerEl
 * must already be projected to lcaId — building that projection needs a
 * real DOM, which is the caller's to provide, not this function's to
 * assume it can create headlessly.
 *
 * Returns { genesis, rebasedOps } as plain data. No ydoc is touched here;
 * the caller seeds a fresh table's own ops Map with
 * [genesis, ...rebasedOps].
 */
export function buildForkSeed(ops, lcaId, splitterTipId, layerEl, { authorId, joinSequence = [] } = {}) {
  const draft = checkpointOp(layerEl, { authorId, parents: [] })
  const genesis = {
    ...draft,
    id: `tt-op-ck-${deterministicSuffix(JSON.stringify(draft.mutations))}`,
    ts: getOp(ops, lcaId)?.ts ?? 0,
  }

  const rebasedOps = pathFrom(ops, lcaId, splitterTipId, joinSequence).map(opId => {
    const op = getOp(ops, opId)
    return { ...op, parents: op.parents.map(p => (p === lcaId ? genesis.id : p)) }
  })

  return { genesis, rebasedOps }
}
