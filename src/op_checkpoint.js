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
import { ancestors, getOp, isAncestor, pathFrom } from './op_dag.js'
import { ensureLayerId, LAYER_DATA_ID } from './toys.js'
import * as Trace from './trace.js'

export { ensureLayerId, LAYER_DATA_ID }
export const CHECKPOINT_GESTURE = 'checkpoint'

let _counter = 0
const mintOpId = () =>
  `tt-op-${Date.now().toString(36)}-${(_counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const isCheckpoint = (op) => op?.gesture === CHECKPOINT_GESTURE

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

/**
 * The most recent checkpoint at or behind headId: the one no other
 * checkpoint in that ancestry descends from. null when the branch has
 * none and must be replayed from nothing.
 */
export function nearestCheckpoint(ops, headId) {
  if (headId == null) return null
  const reachable = ancestors(ops, headId)
  reachable.add(headId)

  const marks = [...reachable].filter(id => isCheckpoint(getOp(ops, id)))
  if (!marks.length) return null

  const latest = marks.filter(id => !marks.some(other => other !== id && isAncestor(ops, id, other)))
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
 * Rebuild the layer so it reflects headId. Clears first, so calling this
 * twice with the same head leaves the same DOM.
 */
export function projectFrom(layerEl, ops, headId, joinSequence = []) {
  ensureLayerId(layerEl)
  while (layerEl.firstChild) layerEl.removeChild(layerEl.firstChild)

  if (headId == null) {
    Trace.op('project-empty', 'nothing to project — no head', { head: null })
    return layerEl
  }

  const base = nearestCheckpoint(ops, headId)
  const path = pathFrom(ops, base, headId, joinSequence)
  Trace.op('project',
    `rebuilt from ${base ? 'checkpoint' : 'nothing'} + ${path.length} operation${path.length === 1 ? '' : 's'}`,
    () => ({
      head: headId,
      checkpoint: base,
      path: path.map((id, i) => ({ i, id, gesture: getOp(ops, id)?.gesture ?? null,
                                   authorId: getOp(ops, id)?.authorId ?? null })),
    }))

  if (base) {
    applyOps(layerEl, ops, [base])
    applyOps(layerEl, ops, path)
  } else {
    applyOps(layerEl, ops, path)
  }
  return layerEl
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
