/**
 * op_history.js — the undo list, computed from the operation log.
 *
 * One row per real gesture in the ancestry of this peer's tips, newest
 * first. Nothing here is stored: whether a row is live or undone, and who
 * undid it, comes from the `reverts` chains (op_dag.isActive), so every peer
 * derives the same list from the same log. Pure; no DOM.
 *
 * A row is blocked while a later live op contends with it. Undoing it would
 * write its old values over that op's work, or remove an element that op
 * edits, so the row offers no button until the later work is undone.
 */

import { ancestryView, isActive, totalOrder } from './op_dag.js'
import { touchedBy, conflicts } from './op_replay.js'
import { isCheckpoint } from './op_checkpoint.js'

/** Gestures that are bookkeeping, not something a person did. */
export const HIDDEN_GESTURES = new Set(['checkpoint', 'initialize', 'contents_change'])

const isRow = (op) =>
  op && !isCheckpoint(op) && op.reverts == null
    && !HIDDEN_GESTURES.has(op.gesture) && !/^(undo|redo):/.test(op.gesture)

const intersects = (a, b) => {
  for (const x of a) if (b.has(x)) return true
  return false
}

// Newest first by the author's own clock, ties by op id.
const newer = (a, b) => (a.ts - b.ts) || (a.id > b.id ? 1 : a.id < b.id ? -1 : 0)

/**
 * The rows for the ancestry of tipIds.
 *
 *   id, op, authorId, gesture, ts
 *   active      in effect (no active op reverts it)
 *   reverterId  the active undo op that reverted it, when not active
 *   undoneBy    that undo op's author
 *   blockedBy   ids of later live ops it contends with
 *   canUndo     active and not blocked
 *   canRedo     undone by actorId's own undo, and not blocked
 *
 * Blockers are only computed for the first `limit` rows.
 */
export function historyRows(ops, tipIds, { joinSequence = [], actorId = null, limit = Infinity } = {}) {
  const view = ancestryView(ops, tipIds)
  // Ordered with the hidden ops in place: they sit between real ones in the
  // chain, and dropping them first would leave the real ops unordered.
  const order = totalOrder(view, [...view.keys()], joinSequence).filter(id => isRow(view.get(id)))

  const memo = new Map()
  const live = new Set(order.filter(id => isActive(view, id, memo)))

  const reverterOf = new Map()
  for (const op of view.values()) {
    if (op.reverts == null || !isActive(view, op.id, memo)) continue
    const prior = reverterOf.get(op.reverts)
    if (!prior || newer(op, prior) > 0) reverterOf.set(op.reverts, op)
  }

  // Everything an op addresses. Two ops can only contend if these overlap,
  // which keeps the full conflicts() check to a handful of pairs.
  const touched = new Map()
  const touchOf = (id) => {
    if (!touched.has(id)) {
      const t = touchedBy(view.get(id))
      touched.set(id, { ...t, refs: new Set([...t.targetIds, ...t.addedIds, ...t.removedIds]) })
    }
    return touched.get(id)
  }
  const contends = (xId, lId) => {
    const x = touchOf(xId), l = touchOf(lId)
    if (!intersects(x.refs, l.refs)) return false
    return conflicts(view, [xId], [lId]) || intersects(x.addedIds, l.targetIds)
  }

  const rows = []
  for (let i = order.length - 1; i >= 0 && rows.length < limit; i--) {
    const op = view.get(order[i])
    const active = live.has(op.id)
    const blockedBy = order.slice(i + 1).filter(id => live.has(id) && contends(op.id, id))
    const reverter = active ? null : reverterOf.get(op.id) ?? null
    rows.push({
      id: op.id,
      op,
      authorId: op.authorId,
      gesture: op.gesture,
      ts: op.ts,
      active,
      reverterId: reverter?.id ?? null,
      undoneBy: reverter?.authorId ?? null,
      blockedBy,
      canUndo: active && !blockedBy.length,
      canRedo: !active && !blockedBy.length && reverter != null
        && reverter.authorId === actorId && reverter.gesture.startsWith('undo:'),
    })
  }
  return rows
}
