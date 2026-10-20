// @vitest-environment jsdom
/**
 * tests/unit/op-preview.test.js
 *
 * The subject a history row names and the before/after copies it previews.
 */
import { describe, test, expect } from 'vitest'
import { subjectId, subjectOf, previewStates } from '../../src/op_preview.js'

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
  test('a live attribute change: before is the old value, after the current one', () => {
    const l = layer(die('5'))
    const p = previewStates(attrOp('die1', 'x', '0', '5'), l, { live: true })
    expect(p.before.getAttribute('x')).toBe('0')
    expect(p.after.getAttribute('x')).toBe('5')
    expect(l.querySelector('[data-id="die1"]').getAttribute('x')).toBe('5')   // the layer is untouched
  })

  test('an undone attribute change: before is current, after the redone value', () => {
    const p = previewStates(attrOp('die1', 'x', '0', '5'), layer(die('0')), { live: false })
    expect(p.before.getAttribute('x')).toBe('0')
    expect(p.after.getAttribute('x')).toBe('5')
  })

  test('a live place has nothing before it', () => {
    const op = childOp('layer', [ser('die1', 'die')], [])
    const p = previewStates(op, layer(die()), { live: true })
    expect(p.before).toBeNull()
    expect(p.after.getAttribute('data-toy-type')).toBe('die')
  })

  test('a live delete has nothing after it', () => {
    const op = childOp('layer', [], [{ ...ser('die1', 'die'), ch: [] }])
    const p = previewStates(op, layer(), { live: true })
    expect(p.before.getAttribute('data-id')).toBe('die1')
    expect(p.after).toBeNull()
  })

  test('an element inside a toy previews as the whole toy', () => {
    const op = { mutations: [{ t: 'attr', target: { id: 'face1' }, name: 'fill', ns: null, oldValue: 'red', newValue: 'blue' }] }
    const p = previewStates(op, layer(die()), { live: true })
    expect(p.before.getAttribute('data-toy-type')).toBe('die')
  })

  test('mutations that no longer apply give no preview', () => {
    expect(previewStates(attrOp('gone', 'x', '0', '5'), layer(), { live: true })).toBeNull()
  })
})
