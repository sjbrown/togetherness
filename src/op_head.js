/**
 * op_head.js — which operation this peer's DOM currently reflects.
 *
 * Per-peer, per-table, and deliberately not in the shared document: two
 * peers sitting on different heads is a branch, not an error, and putting
 * the head in the doc would make it a contended value.
 */

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
 * Extra tips folded in by a concurrent-but-non-conflicting arrival (see
 * op_replay's mergeConcurrent): applied to the DOM already, but not yet
 * the primary head, since neither op is an ancestor of the other. They
 * become additional parents the next time this peer commits — that
 * commit is what actually joins the branches in the graph.
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

export function clearMergeTips(tableId) {
  if (!tableId) return
  try { store()?.removeItem(mergeKey(tableId)) } catch { /* ignore */ }
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
