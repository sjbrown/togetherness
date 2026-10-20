/**
 * op_preview.js — what a history row names, and what it changed.
 *
 * Both read the layer's DOM and an op's recorded mutations, nothing else. No
 * layer is special-cased: the subject is whichever element the op's first
 * mutation addresses, and the preview is that element as the layer had it
 * before and after the op.
 */

import { apply, invert } from './op_wire_mutation.js'

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
 * where it does not exist. `live` says whether the layer currently shows the
 * op's effect. The other side is that layer with the op, or its inverse,
 * applied to a copy. Null overall when the mutations no longer apply.
 */
export function previewStates(op, layerEl, { live }) {
  const id = subjectId(op)
  if (id == null || !layerEl) return null
  const current = layerEl.cloneNode(true)
  const other = layerEl.cloneNode(true)
  try {
    apply(live ? invert(op.mutations) : op.mutations, other)
  } catch {
    return null
  }
  const [before, after] = live ? [other, current] : [current, other]
  return { before: subjectIn(before, id), after: subjectIn(after, id) }
}
