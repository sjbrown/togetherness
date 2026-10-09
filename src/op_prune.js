/**
 * op_prune.js — lagged pruning of the operation log.
 *
 * A peer that writes a checkpoint may delete every op strictly behind an
 * older cut, the prune root, along with those ops' content entries. The
 * root is chosen so that live play never needs anything behind it: it must
 * have been seen at least PRUNE_AGE_MS ago and must not be the newest cut.
 * Every delete passes through assertPrunable.
 */

import { ancestors, getOp, getOps, getContent } from './op_dag.js'
import { cutsOf, checkpointOp, projectTips, isCheckpoint } from './op_checkpoint.js'
import { maximalTips } from './op_head.js'
import * as Trace from './trace.js'

export const PRUNE_AGE_MS = 10 * 60 * 1000
export const PRUNE_MIN_CUTS_BACK = 2

let _ageMs = PRUNE_AGE_MS
export function _setPruneAgeForTests(ms) { _ageMs = ms ?? PRUNE_AGE_MS }

// ── first sight ─────────────────────────────────────────────────────────

// When this peer first saw each checkpoint. Memory only: a checkpoint's own
// ts is another peer's clock, so age is measured on ours, and a page load
// starts every checkpoint's clock again.
const firstSeen = new Map()

export function noteSeen(id) {
  if (id != null && !firstSeen.has(id)) firstSeen.set(id, Date.now())
}

/** A checkpoint nobody noted is first seen now, so it reads as brand new. */
export function ageOf(id) {
  noteSeen(id)
  return Date.now() - firstSeen.get(id)
}

/** Boot: every checkpoint already in the loaded log counts as just seen. */
export function noteAllSeen(ops) {
  firstSeen.clear()
  for (const op of ops.values()) if (isCheckpoint(op)) noteSeen(op.id)
}

// ── choosing the root ───────────────────────────────────────────────────

/** The cuts of a tip set, oldest first. Cuts are totally ordered, so fewer
 * ancestors means older. */
function cutsOldestFirst(ops, tips) {
  return cutsOf(ops, tips).sort((a, b) => ancestors(ops, a).size - ancestors(ops, b).size)
}

const newerCuts = (cuts, id) => cuts.length - 1 - cuts.indexOf(id)

/**
 * The newest cut that is old enough and has a newer cut behind it, or null.
 * Content is not required here: prune rebuilds the root's snapshot when the
 * content map no longer holds it.
 */
export function choosePruneRoot(ops, tips) {
  const cuts = cutsOldestFirst(ops, tips)
  for (let i = cuts.length - PRUNE_MIN_CUTS_BACK; i >= 0; i--) {
    if (ageOf(cuts[i]) >= _ageMs) return cuts[i]
  }
  return null
}

/**
 * Throws, before anything is deleted, if deleting `ids` with `root` as the
 * prune root would break invariant 15: ids must all be strict ancestors of
 * root and none a local tip, and root must be a cut with content, old
 * enough, and not the newest.
 */
export function assertPrunable(ops, contents, ids, root, localTips) {
  const fail = (why) => { throw new Error(`assertPrunable: ${why}`) }

  if (!isCheckpoint(getOp(ops, root))) fail(`${root} is not a checkpoint in the log`)
  if (!contents.has(root)) fail(`${root} has no content`)
  if (ageOf(root) < _ageMs) fail(`${root} was first seen less than ${_ageMs}ms ago`)

  const cuts = cutsOldestFirst(ops, localTips)
  if (!cuts.includes(root)) fail(`${root} is not a cut of the local tips`)
  if (newerCuts(cuts, root) < PRUNE_MIN_CUTS_BACK - 1) fail(`${root} is the newest cut`)

  const behind = ancestors(ops, root)
  for (const id of ids) {
    if (id === root) fail(`${id} is the prune root`)
    if (localTips.includes(id)) fail(`${id} is a local tip`)
    if (!behind.has(id)) fail(`${id} is not a strict ancestor of ${root}`)
  }
}

// ── pruning ─────────────────────────────────────────────────────────────

/** The snapshot of the layer as of `rootId`, for a root whose own content
 * was already dropped. Replays from the nearest cut that still has some. */
function rebuildContent(scratch, ops, content, rootId, joinSequence) {
  projectTips(scratch, ops, content, [rootId], joinSequence)
  return checkpointOp(scratch, { authorId: null, parents: [] }).content
}

/**
 * Delete everything strictly behind the prune root, in one transaction.
 * `scratch` is a detached layer element used only when the root's content
 * has to be rebuilt. Returns { root, deleted } or null if there was nothing
 * to do.
 */
export function prune(ydoc, tips, { scratch = null, joinSequence = [] } = {}) {
  const ops = getOps(ydoc)
  const content = getContent(ydoc)
  const localTips = maximalTips(ops, tips)

  const root = choosePruneRoot(ops, localTips)
  if (root == null) return null
  const ids = [...ancestors(ops, root)]
  if (!ids.length) return null

  let snapshot = content.get(root)
  if (snapshot == null) {
    if (!scratch) return null
    snapshot = rebuildContent(scratch, ops, content, root, joinSequence)
  }

  assertPrunable(ops, { has: (id) => id === root || content.has(id) }, ids, root, localTips)

  ydoc.transact(() => {
    if (!content.has(root)) content.set(root, snapshot)
    for (const id of ids) {
      ops.delete(id)
      content.delete(id)
    }
  })
  Trace.op('prune', `pruned ${ids.length} operation${ids.length === 1 ? '' : 's'} behind ${root}`,
    { root, deleted: ids.length })
  return { root, deleted: ids.length }
}
