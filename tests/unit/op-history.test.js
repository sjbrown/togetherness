/**
 * tests/unit/op-history.test.js
 *
 * The undo list as a projection of the op log: which rows exist, who undid
 * them, and which ones are blocked by later work.
 */

import { describe, test, expect } from 'vitest'
import { historyRows, HIDDEN_GESTURES } from '../../src/op_history.js'

const attr = (id, name, oldValue, newValue) =>
  ({ t: 'attr', target: { id }, name, ns: null, oldValue, newValue })
const place = (layerId, id) =>
  ({ t: 'child', target: { id: layerId }, added: [{ el: 'g', at: [['data-id', id]] }], removed: [], prevSibling: null, nextSibling: null })

/** A linear log: each spec is [id, authorId, gesture, mutations, extra?]. */
function linear(...specs) {
  const ops = new Map()
  let prev = null
  specs.forEach(([id, authorId, gesture, mutations = [], extra = {}], i) => {
    ops.set(id, { id, parents: prev ? [prev] : [], authorId, gesture, mutations, ts: i + 1, ...extra })
    prev = id
  })
  return { ops, tip: prev }
}

const rows = (log, opts) => historyRows(log.ops, [log.tip], opts)
const ids = (rs) => rs.map(r => r.id)

describe('which rows exist', () => {
  test('real gestures only, newest first', () => {
    const log = linear(
      ['c0', 'a', 'checkpoint'],
      ['p1', 'a', 'place', [place('layer', 'die')]],
      ['i1', 'a', 'initialize', [attr('die', 'data-n', null, '1')]],
      ['m1', 'b', 'move', [attr('die', 'x', '1', '2')]],
      ['u1', 'a', 'undo:move', [attr('die', 'x', '2', '1')], { reverts: 'm1' }],
    )
    expect(ids(rows(log))).toEqual(['m1', 'p1'])
  })

  test('the hidden set names the bookkeeping gestures', () => {
    expect([...HIDDEN_GESTURES].sort()).toEqual(['checkpoint', 'contents_change', 'initialize'])
  })

  test('ops outside the ancestry of the tips are left out', () => {
    const log = linear(
      ['p1', 'a', 'place', [place('layer', 'die')]],
      ['m1', 'a', 'move', [attr('die', 'x', '1', '2')]],
    )
    log.ops.set('side', { id: 'side', parents: ['p1'], authorId: 'b', gesture: 'move', mutations: [], ts: 9 })
    expect(ids(rows(log))).toEqual(['m1', 'p1'])
  })

  test('limit keeps the newest rows', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('d1', 'x', '1', '2')]],
      ['m2', 'a', 'move', [attr('d2', 'x', '1', '2')]],
      ['m3', 'a', 'move', [attr('d3', 'x', '1', '2')]],
    )
    expect(ids(rows(log, { limit: 2 }))).toEqual(['m3', 'm2'])
  })

  test('a row carries its author, gesture and op', () => {
    const log = linear(['m1', 'bob', 'menu:die.roll', [attr('die', 'face', '3', '5')]])
    const [r] = rows(log)
    expect(r).toMatchObject({ id: 'm1', authorId: 'bob', gesture: 'menu:die.roll', ts: 1, active: true })
    expect(r.op.id).toBe('m1')
  })
})

describe('live and undone', () => {
  const undone = () => linear(
    ['m1', 'bob', 'move', [attr('die', 'x', '1', '2')]],
    ['u1', 'alice', 'undo:move', [attr('die', 'x', '2', '1')], { reverts: 'm1' }],
  )

  test('an undone row is inactive and names who undid it', () => {
    const [r] = rows(undone())
    expect(r).toMatchObject({ id: 'm1', active: false, undoneBy: 'alice', reverterId: 'u1' })
  })

  test('a redo makes the row live again', () => {
    const log = undone()
    log.ops.set('r1', { id: 'r1', parents: ['u1'], authorId: 'alice', gesture: 'redo:move', mutations: [], ts: 3, reverts: 'u1' })
    const [r] = historyRows(log.ops, ['r1'])
    expect(r).toMatchObject({ id: 'm1', active: true, undoneBy: null, reverterId: null })
  })

  test('only the author of the undo can redo it', () => {
    const [mine] = rows(undone(), { actorId: 'alice' })
    const [theirs] = rows(undone(), { actorId: 'bob' })
    expect(mine.canRedo).toBe(true)
    expect(theirs.canRedo).toBe(false)
    expect(mine.canUndo).toBe(false)
  })

  test('a live row can be undone by anyone', () => {
    const log = linear(['m1', 'bob', 'move', [attr('die', 'x', '1', '2')]])
    expect(rows(log, { actorId: 'alice' })[0]).toMatchObject({ canUndo: true, canRedo: false })
  })
})

describe('blocked by later work', () => {
  test('a later live edit of the same attribute blocks the older one', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('die', 'x', '1', '2')]],
      ['m2', 'b', 'move', [attr('die', 'x', '2', '3')]],
    )
    const [newest, oldest] = rows(log)
    expect(newest).toMatchObject({ id: 'm2', blockedBy: [], canUndo: true })
    expect(oldest).toMatchObject({ id: 'm1', blockedBy: ['m2'], canUndo: false })
  })

  test('undoing the later edit unblocks the older one', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('die', 'x', '1', '2')]],
      ['m2', 'b', 'move', [attr('die', 'x', '2', '3')]],
      ['u2', 'a', 'undo:move', [attr('die', 'x', '3', '2')], { reverts: 'm2' }],
    )
    const byId = Object.fromEntries(rows(log).map(r => [r.id, r]))
    expect(byId.m1).toMatchObject({ blockedBy: [], canUndo: true })
    expect(byId.m2).toMatchObject({ active: false, blockedBy: [] })
  })

  test('different attributes of the same element do not block', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('die', 'x', '1', '2')]],
      ['m2', 'b', 'menu:die.roll', [attr('die', 'face', '3', '5')]],
    )
    expect(rows(log).every(r => r.canUndo)).toBe(true)
  })

  test('different elements do not block', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('d1', 'x', '1', '2')]],
      ['m2', 'b', 'move', [attr('d2', 'x', '1', '2')]],
    )
    expect(rows(log).every(r => r.canUndo)).toBe(true)
  })

  test('a place is blocked by later work on the element it created', () => {
    const log = linear(
      ['p1', 'a', 'place', [place('layer', 'die')]],
      ['m1', 'b', 'move', [attr('die', 'x', '1', '2')]],
    )
    const byId = Object.fromEntries(rows(log).map(r => [r.id, r]))
    expect(byId.p1.blockedBy).toEqual(['m1'])
    expect(byId.m1.canUndo).toBe(true)
  })

  test('an undone row is blocked from redo by later live work', () => {
    const log = linear(
      ['m1', 'a', 'move', [attr('die', 'x', '1', '2')]],
      ['u1', 'a', 'undo:move', [attr('die', 'x', '2', '1')], { reverts: 'm1' }],
      ['m2', 'b', 'move', [attr('die', 'x', '1', '9')]],
    )
    const byId = Object.fromEntries(rows(log, { actorId: 'a' }).map(r => [r.id, r]))
    expect(byId.m1).toMatchObject({ active: false, blockedBy: ['m2'], canRedo: false })
  })
})
