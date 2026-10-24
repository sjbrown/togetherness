// @vitest-environment jsdom
/**
 * tests/unit/op-history.test.js
 *
 * The undo list as a projection of the op log (which rows exist, who undid
 * them, which are blocked by later work), and the subject and before/after
 * a row shows, read from the layer's DOM.
 */

import { describe, test, expect } from 'vitest'
import { historyRows, HIDDEN_GESTURES, subjectId, subjectOf, previewStates } from '../../src/op_history.js'
import { projectTips } from '../../src/op_checkpoint.js'

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

const SVG_NS = 'http://www.w3.org/2000/svg'

function el(name, attrs = {}, children = []) {
  const e = document.createElementNS(SVG_NS, name)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  for (const c of children) e.appendChild(c)
  return e
}
const layer = (...children) => el('g', { 'data-id': 'layer' }, children)
const die = (x = '0') => el('g', { 'data-id': 'die1', 'data-toy-type': 'die', x }, [
  el('text', { 'data-id': 'face1' }),
])

const attrOp = (id, name, oldValue, newValue) =>
  ({ mutations: [{ t: 'attr', target: { id }, name, ns: null, oldValue, newValue }] })
const childOp = (target, added, removed) =>
  ({ mutations: [{ t: 'child', target: { id: target }, added, removed, prevSibling: null, nextSibling: null }] })
const ser = (id, type) => ({ el: 'g', at: [['data-id', id], ['data-toy-type', type]] })

describe('subjectId', () => {
  test('attr: the target; text: its parent; child: the node added or removed', () => {
    expect(subjectId(attrOp('die1', 'x', '0', '5'))).toBe('die1')
    expect(subjectId({ mutations: [{ t: 'text', target: { parentId: 'face1', index: 0 }, oldValue: 'a', newValue: 'b' }] })).toBe('face1')
    expect(subjectId(childOp('layer', [ser('die1', 'die')], []))).toBe('die1')
    expect(subjectId(childOp('layer', [], [ser('card1', 'card')]))).toBe('card1')
  })

  test('a child entry with no element falls back to its container', () => {
    expect(subjectId(childOp('tray', [{ tx: 'hi' }], []))).toBe('tray')
  })

  test('an op with no mutations has no subject', () => {
    expect(subjectId({ mutations: [] })).toBeNull()
  })
})

describe('subjectOf', () => {
  test('a toy reads as its type and id', () => {
    expect(subjectOf(attrOp('die1', 'x', '0', '5'), layer(die()))).toBe('die die1')
  })

  test('an element inside a toy names the toy', () => {
    const op = { mutations: [{ t: 'text', target: { parentId: 'face1', index: 0 }, oldValue: '1', newValue: '2' }] }
    expect(subjectOf(op, layer(die()))).toBe('die die1')
  })

  test('an element that is not a toy shows its id alone', () => {
    const l = layer(el('rect', { 'data-id': 'r1' }))
    expect(subjectOf(attrOp('r1', 'width', '1', '2'), l)).toBe('r1')
  })

  test('an element that is gone shows its id alone', () => {
    expect(subjectOf(childOp('layer', [], [ser('card1', 'card')]), layer())).toBe('card1')
  })
})

describe('previewStates', () => {
  // A die whose face is a tspan's text, built the way a roll writes it
  // (textContent replaces the text node), as a real chain of ops.
  const rollLog = () => {
    const swap = (from, to) => [{ t: 'child', target: { id: 'ts1' }, added: [{ tx: to }], removed: [{ tx: from }], prevSibling: null, nextSibling: null }]
    const place = childOp('layer', [{
      el: 'g', at: [['data-id', 'die1'], ['data-toy-type', 'die']],
      ch: [{ el: 'text', at: [['data-id', 't1']], ch: [{ el: 'tspan', at: [['data-id', 'ts1']], ch: [{ tx: '6' }] }] }],
    }], []).mutations
    const ops = new Map()
    const add = (id, parents, mutations) => ops.set(id, { id, parents, authorId: 'a', gesture: 'g', mutations, ts: ops.size + 1 })
    add('p', [], place)
    add('r1', ['p'], swap('6', '2'))
    add('r2', ['r1'], swap('2', '5'))
    return ops
  }
  const shown = (ops, tip) => {
    const l = layer()
    projectTips(l, ops, new Map(), [tip])
    return l
  }
  const face = (el) => el.querySelector('[data-id="ts1"]').textContent

  test('a roll previews as the face it replaced and the face it wrote, even after a later roll', () => {
    const ops = rollLog()
    const l = shown(ops, 'r2')
    expect(face(l)).toBe('5')

    const first = previewStates(ops.get('r1'), l, { ops, content: new Map() })
    expect(face(first.before)).toBe('6')
    expect(face(first.after)).toBe('2')

    const second = previewStates(ops.get('r2'), l, { ops, content: new Map() })
    expect(face(second.before)).toBe('2')
    expect(face(second.after)).toBe('5')
  })

  test('the layer being shown is not touched', () => {
    const ops = rollLog()
    const l = shown(ops, 'r2')
    previewStates(ops.get('r1'), l, { ops, content: new Map() })
    expect(face(l)).toBe('5')
  })

  test('an attribute change is the same whether or not a later op moved it again', () => {
    const ops = new Map()
    const add = (id, parents, mutations) => ops.set(id, { id, parents, authorId: 'a', gesture: 'g', mutations, ts: ops.size + 1 })
    add('p', [], childOp('layer', [ser('die1', 'die')], []).mutations)
    add('m1', ['p'], attrOp('die1', 'x', null, '5').mutations)
    add('m2', ['m1'], attrOp('die1', 'x', '5', '9').mutations)
    const l = shown(ops, 'm2')
    const p = previewStates(ops.get('m1'), l, { ops, content: new Map() })
    expect(p.before.getAttribute('x')).toBeNull()
    expect(p.after.getAttribute('x')).toBe('5')
  })

  test('a place has nothing before it', () => {
    const ops = new Map([['p', { id: 'p', parents: [], authorId: 'a', gesture: 'place', ts: 1, mutations: childOp('layer', [ser('die1', 'die')], []).mutations }]])
    const p = previewStates(ops.get('p'), shown(ops, 'p'), { ops, content: new Map() })
    expect(p.before).toBeNull()
    expect(p.after.getAttribute('data-toy-type')).toBe('die')
  })

  test('a delete has nothing after it', () => {
    const ops = new Map()
    ops.set('p', { id: 'p', parents: [], authorId: 'a', gesture: 'place', ts: 1, mutations: childOp('layer', [ser('die1', 'die')], []).mutations })
    ops.set('d', { id: 'd', parents: ['p'], authorId: 'a', gesture: 'delete', ts: 2, mutations: childOp('layer', [], [ser('die1', 'die')]).mutations })
    const p = previewStates(ops.get('d'), shown(ops, 'd'), { ops, content: new Map() })
    expect(p.before.getAttribute('data-id')).toBe('die1')
    expect(p.after).toBeNull()
  })

  test('an element inside a toy previews as the whole toy', () => {
    const ops = rollLog()
    ops.set('c', { id: 'c', parents: ['r2'], authorId: 'a', gesture: 'g', ts: 9, mutations: attrOp('t1', 'fill', null, 'blue').mutations })
    const p = previewStates(ops.get('c'), shown(ops, 'c'), { ops, content: new Map() })
    expect(p.before.getAttribute('data-toy-type')).toBe('die')
  })

  test('mutations that cannot apply give no preview', () => {
    const ops = new Map([['m', { id: 'm', parents: [], authorId: 'a', gesture: 'g', ts: 1, mutations: attrOp('gone', 'x', '0', '5').mutations }]])
    expect(previewStates(ops.get('m'), layer(), { ops, content: new Map() })).toBeNull()
  })
})
