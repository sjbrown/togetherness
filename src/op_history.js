/**
 * op_history.js — the undo list, and what each of its rows says.
 *
 * historyRows is a projection of the operation log: one row per real
 * gesture in the ancestry of this peer's tips, newest first. Nothing in it
 * is stored: whether a row is live or undone, and who undid it, comes from
 * the `reverts` chains (op_dag.isActive), so every peer derives the same
 * list from the same log. It is pure and touches no DOM.
 *
 * A row is blocked while a later live op contends with it. Undoing it would
 * write its old values over that op's work, or remove an element that op
 * edits, so the row offers no button until the later work is undone.
 *
 * An undone row also waits on earlier undone ops that contend with it.
 * Redoing it replays its mutations against the state it was made from, and
 * with the earlier work still undone that state is not there: a roll would
 * try to remove a face that is not showing and add its own beside the
 * current one.
 *
 * Below it, subjectOf and previewStates read a layer's DOM to name a row's
 * subject and to show it before and after the op. No layer is special-cased:
 * the subject is whichever element the op's first mutation addresses.
 */

import { ancestryView, isActive, totalOrder } from './op_dag.js'
import { touchedBy, conflicts } from './op_replay.js'
import { isCheckpoint, projectTips } from './op_checkpoint.js'
import { apply } from './op_wire_mutation.js'

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
 *   waitingOn   ids of earlier undone ops it contends with (undone rows only)
 *   canUndo     active and not blocked
 *   canRedo     undone by actorId's own undo, and neither blocked nor waiting
 *
 * Blockers are only computed for the first `limit` rows; `only` narrows the
 * result to that one op id.
 */
export function historyRows(ops, tipIds, { joinSequence = [], actorId = null, limit = Infinity, only = null } = {}) {
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
    if (only != null && order[i] !== only) continue
    const op = view.get(order[i])
    const active = live.has(op.id)
    const blockedBy = order.slice(i + 1).filter(id => live.has(id) && contends(op.id, id))
    const waitingOn = active ? [] : order.slice(0, i).filter(id => !live.has(id) && contends(id, op.id))
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
      waitingOn,
      canUndo: active && !blockedBy.length,
      canRedo: !active && !blockedBy.length && !waitingOn.length && reverter != null
        && reverter.authorId === actorId && reverter.gesture.startsWith('undo:'),
    })
  }
  return rows
}

// ── subject and preview (read the layer's DOM) ──────────────────────────

const dataIdOf = (s) => s?.at?.find(([n]) => n === 'data-id')?.[1] ?? null

/** The data-id of the element an op's first mutation is about. */
export function subjectId(op) {
  for (const m of op?.mutations ?? []) {
    if (m.t === 'child') return dataIdOf(m.added?.[0] ?? m.removed?.[0]) ?? m.target?.id ?? null
    if (m.t === 'attr')  return m.target?.id ?? null
    if (m.t === 'text')  return m.target?.parentId ?? null
  }
  return null
}

const findById = (root, id) =>
  root.getAttribute?.('data-id') === id
    ? root
    : root.querySelector(`[data-id="${String(id).replace(/"/g, '\\"')}"]`)

/**
 * "{data-toy-type} {data-id}" for the subject as the layer shows it now, or
 * the bare id when the element or its type is not there.
 */
export function subjectOf(op, layerEl) {
  const id = subjectId(op)
  if (id == null) return ''
  const el = layerEl && findById(layerEl, id)
  const toy = el?.closest('[data-toy-type]')
  return toy ? `${toy.getAttribute('data-toy-type')} ${toy.getAttribute('data-id')}` : id
}

const subjectIn = (root, id) => {
  const el = findById(root, id)
  return el ? (el.closest('[data-toy-type]') ?? el).cloneNode(true) : null
}

/**
 * The subject before and after an op, as detached copies; null for a side
 * where it does not exist. "Before" is the layer projected to the op's
 * parents and "after" is that with the op applied, both on a scratch copy,
 * so later work on the same element cannot bleed into either side. Null
 * overall when the op no longer applies.
 */
export function previewStates(op, layerEl, { ops, content, joinSequence = [] }) {
  const id = subjectId(op)
  if (id == null || !layerEl) return null
  const scratch = layerEl.cloneNode(false)
  try {
    projectTips(scratch, ops, content, op.parents ?? [], joinSequence)
    const before = subjectIn(scratch, id)
    apply(op.mutations, scratch)
    return { before, after: subjectIn(scratch, id) }
  } catch {
    return null
  }
}
