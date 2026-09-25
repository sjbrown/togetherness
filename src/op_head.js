/**
 * op_head.js — which operation(s) this peer's DOM currently reflects.
 *
 * Per-peer, per-table, and deliberately not in the shared document.
 */

import { getOp, isAncestor } from './op_dag.js'

const KEY_PREFIX = 'tt_head_'

const key = (tableId) => `${KEY_PREFIX}${tableId}`

const store = () => {
  try { return globalThis.localStorage ?? null } catch { return null }
}

export function getHead(tableId) {
  if (!tableId) return null
  try { return store()?.getItem(key(tableId)) ?? null } catch { return null }
}

export function setHead(tableId, opId) {
  if (!tableId) return
  try {
    if (opId == null) store()?.removeItem(key(tableId))
    else              store()?.setItem(key(tableId), opId)
  } catch { /* private mode, quota — the head recomputes from the log */ }
}

export function clearHead(tableId) {
  setHead(tableId, null)
}

/**
 * Extra tips folded in by a non-conflicting arrival (see op_replay's
 * receiveOp, the MERGED/REBUILT results): applied to the DOM already, but
 * not yet the primary head, since neither op is an ancestor of the other.
 * They become additional parents the next time this peer commits — that
 * commit is what actually joins the branches in the graph. A REBUILT
 * result may instead write a merge checkpoint (op_checkpoint's
 * mergeCheckpointOp) on the spot, parented on this same tip set; when it
 * does, these merge tips collapse immediately, so it's no longer only the
 * next local commit that joins branches in the graph.
 */
const mergeKey = (tableId) => `${KEY_PREFIX}merge_${tableId}`

export function getMergeTips(tableId) {
  if (!tableId) return []
  try {
    const raw = store()?.getItem(mergeKey(tableId))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function addMergeTip(tableId, opId) {
  if (!tableId || !opId) return
  const tips = getMergeTips(tableId)
  if (tips.includes(opId)) return
  try { store()?.setItem(mergeKey(tableId), JSON.stringify([...tips, opId])) } catch { /* ignore */ }
}

/** Replace the whole merge-tip list — used once a receive computes the new
 * maximal tip set directly, rather than accreting one tip at a time. */
export function setMergeTips(tableId, tips) {
  if (!tableId) return
  const clean = [...new Set((tips ?? []).filter(Boolean))]
  try {
    if (!clean.length) store()?.removeItem(mergeKey(tableId))
    else store()?.setItem(mergeKey(tableId), JSON.stringify(clean))
  } catch { /* ignore */ }
}

export function clearMergeTips(tableId) {
  if (!tableId) return
  try { store()?.removeItem(mergeKey(tableId)) } catch { /* ignore */ }
}

/**
 * The maximal subset of `ids`: no id in the result is an ancestor of
 * another, and every id resolves in the log. This is what "this peer's
 * position in the DAG" means once it is a set rather than a single head —
 * "what I have" is the inclusive ancestry of the whole set, and every place
 * that used to reason from the head alone (classification, delta paths,
 * boot projection) reasons from this instead.
 */
export function maximalTips(ops, ids) {
  const present = [...new Set((ids ?? []).filter(id => id != null && getOp(ops, id)))]
  return present.filter(id => !present.some(other => other !== id && isAncestor(ops, id, other)))
}

/** This peer's local tips: head plus merge tips, kept maximal. */
export function localTips(tableId, ops) {
  return maximalTips(ops, [getHead(tableId), ...getMergeTips(tableId)])
}

/**
 * The parents for this peer's next local commit: the primary head plus
 * any merge tips picked up since, then clears the tips — the commit about
 * to be made is what folds them into the graph, so once it's built there
 * is nothing left pending.
 */
export function consumeParents(tableId) {
  const head = getHead(tableId)
  const tips = getMergeTips(tableId)
  clearMergeTips(tableId)
  return [head, ...tips].filter(Boolean)
}
