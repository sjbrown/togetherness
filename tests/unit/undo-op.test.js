// @vitest-environment jsdom
/**
 * tests/unit/undo-op.test.js
 *
 * Undo and redo aimed at a chosen op instead of the newest: the op_layer
 * entry points behind the history panel's row buttons.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { TOYS_LAYER, runGesture } from '../../src/toys.js'
import { ensureLayerId } from '../../src/op_layers.js'
import * as OpLayer from '../../src/op_layer.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const TABLE  = 'undo-op-table'

let clock
beforeEach(() => {
  localStorage.clear()
  clock = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => (clock += 10))
})
afterEach(() => { vi.restoreAllMocks() })

function setup() {
  const ydoc = new Y.Doc()
  const el = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  const gesture = (name, authorId, fn) => {
    const { op } = runGesture(ydoc, el, fn, { gesture: name, authorId, tableId: TABLE })
    return op
  }
  const place = (id, authorId = 'alice') => gesture('place', authorId, () => {
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('data-id', id)
    g.setAttribute('x', '0')
    el.appendChild(g)
  })
  const setX = (id, x, authorId = 'alice') => gesture('move', authorId, () => {
    el.querySelector(`[data-id="${id}"]`).setAttribute('x', String(x))
  })
  const xOf = (id) => el.querySelector(`[data-id="${id}"]`)?.getAttribute('x')
  const undoOp = (opId, actor = 'alice') => OpLayer.undoOp(ydoc, TOYS_LAYER, el, TABLE, actor, opId)
  const redoOp = (opId, actor = 'alice') => OpLayer.redoOp(ydoc, TOYS_LAYER, el, TABLE, actor, opId)
  const rows = (actor = 'alice') => OpLayer.historyOf(ydoc, TOYS_LAYER, TABLE, actor)
  return { ydoc, el, place, setX, xOf, undoOp, redoOp, rows }
}

describe('undoOp / redoOp', () => {
  test('undoes an op that is not the newest', () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5)
    t.place('token')
    expect(t.undoOp(m1.id)).not.toBeNull()
    expect(t.xOf('die')).toBe('0')
    expect(t.el.querySelector('[data-id="token"]')).not.toBeNull()
  })

  test("undoes someone else's op", () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5, 'bob')
    const undo = t.undoOp(m1.id, 'alice')
    expect(undo).toMatchObject({ authorId: 'alice', reverts: m1.id, gesture: 'undo:move' })
    expect(t.xOf('die')).toBe('0')
  })

  test('refuses while later live work contends with the op', () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5)
    const m2 = t.setX('die', 9, 'bob')
    expect(t.undoOp(m1.id)).toBeNull()
    expect(t.xOf('die')).toBe('9')

    expect(t.undoOp(m2.id)).not.toBeNull()
    expect(t.undoOp(m1.id)).not.toBeNull()
    expect(t.xOf('die')).toBe('0')
  })

  test('refuses an op that is already undone, and ids that are not rows', () => {
    const t = setup()
    const p = t.place('die')
    const m1 = t.setX('die', 5)
    t.undoOp(m1.id)
    expect(t.undoOp(m1.id)).toBeNull()
    expect(t.undoOp('no-such-op')).toBeNull()
    expect(p.id).toBeTruthy()
  })

  test('redo reverts the undo, and only for the author of the undo', () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5, 'bob')
    const undo = t.undoOp(m1.id, 'alice')

    expect(t.redoOp(m1.id, 'bob')).toBeNull()
    expect(t.xOf('die')).toBe('0')

    const redo = t.redoOp(m1.id, 'alice')
    expect(redo).toMatchObject({ authorId: 'alice', reverts: undo.id, gesture: 'redo:move' })
    expect(t.xOf('die')).toBe('5')
    expect(t.rows('alice').find(r => r.id === m1.id).active).toBe(true)
  })

  test('the row says who undid it', () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5, 'bob')
    t.undoOp(m1.id, 'alice')
    expect(t.rows('bob').find(r => r.id === m1.id)).toMatchObject({ active: false, undoneBy: 'alice' })
  })

  test('refuses when the inverse no longer applies', () => {
    const t = setup()
    t.place('die')
    const m1 = t.setX('die', 5)
    t.el.querySelector('[data-id="die"]').remove()
    expect(t.undoOp(m1.id)).toBeNull()
  })
})
