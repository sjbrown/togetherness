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
