/**
 * tests/unit/selection_local.test.js
 *
 * selection_local.js applies selection.js transitions to this client's live
 * state, calls the app's hooks, and broadcasts `desired` / `mode`.
 */

import { describe, test, expect, beforeEach } from 'vitest'
import * as Selection from '../../src/selection.js'
import * as SelectionLocal from '../../src/selection_local.js'

let log
let awareness

beforeEach(() => {
  log = []
  awareness = {
    fields: {},
    setLocalStateField(k, v) { this.fields[k] = v; log.push(['broadcast', k]) },
  }
  SelectionLocal.init({
    awareness,
    defaultModeFor: (id) => `sel-default-${id}`,
    onHeldChanged:  (held, prevHeld) => log.push(['held', [...held], prevHeld]),
    onModeChanged:  () => log.push(['mode', SelectionLocal.activeMode()]),
  })
})

const notHeld = { isHeldByOther: () => false }
const select = (id) => SelectionLocal.apply(Selection.select(SelectionLocal.state(), id, { ...notHeld, now: 100 }))

describe('selection_local', () => {
  test('a new sole selection is seeded with its default mode, and the hook runs before both broadcasts', () => {
    select('a')
    expect(SelectionLocal.heldIds()).toEqual(['a'])
    expect(SelectionLocal.soleHeldId()).toBe('a')
    expect(SelectionLocal.isHeld('a')).toBe(true)
    expect(SelectionLocal.activeMode()).toEqual({ id: 'a', mode: 'sel-default-a' })
    expect(log).toEqual([['held', ['a'], []], ['broadcast', 'desired'], ['broadcast', 'mode']])
    expect(awareness.fields).toEqual({ desired: { a: { ts: 100, holding: true } }, mode: 'sel-default-a' })
  })

  test('the hook is handed the previous held ids', () => {
    select('a')
    log = []
    select('b')
    expect(log[0]).toEqual(['held', ['b'], ['a']])
  })

  test('a mode-only change calls onModeChanged and broadcasts only the mode', () => {
    select('a')
    log = []
    SelectionLocal.apply(Selection.enterMode(SelectionLocal.state(), 'a', 'sel-resize'))
    expect(log).toEqual([['mode', { id: 'a', mode: 'sel-resize' }], ['broadcast', 'mode']])
  })

  test('a bid broadcasts only desired and calls no hook', () => {
    SelectionLocal.apply(Selection.request(SelectionLocal.state(), 'x', { now: 5 }))
    expect(log).toEqual([['broadcast', 'desired']])
    expect(SelectionLocal.isHeld('x')).toBe(false)
    expect(awareness.fields.desired).toEqual({ x: { ts: 5, holding: false } })
  })

  test('reassertClaims refreshes held ids only, and broadcasts only desired', () => {
    SelectionLocal.apply(Selection.commitMultiSelect(SelectionLocal.state(), ['a', 'b'], { now: 1 }))
    log = []
    SelectionLocal.reassertClaims(['a', 'b', 'not-held'], { now: 9 })
    expect(log).toEqual([['broadcast', 'desired']])
    expect(awareness.fields.desired).toEqual({ a: { ts: 9, holding: true }, b: { ts: 9, holding: true } })
  })

  test('a transition that changes nothing broadcasts nothing', () => {
    select('a')
    log = []
    SelectionLocal.apply(SelectionLocal.state())
    SelectionLocal.unclaim(['not-held'])
    expect(log).toEqual([])
  })

  test('unclaim and clearClaims empty the selection and clear the mode', () => {
    SelectionLocal.apply(Selection.commitMultiSelect(SelectionLocal.state(), ['a', 'b', 'c']))
    SelectionLocal.unclaim(['a', 'b'])
    expect(SelectionLocal.heldIds()).toEqual(['c'])
    expect(SelectionLocal.activeMode()).toEqual({ id: 'c', mode: 'sel-default-c' })
    SelectionLocal.clearClaims()
    expect(SelectionLocal.heldIds()).toEqual([])
    expect(SelectionLocal.activeMode()).toBeNull()
    expect(awareness.fields.mode).toBeNull()
  })

  test('awarenessFields is a copy of desired plus the mode string', () => {
    select('a')
    const fields = SelectionLocal.awarenessFields()
    expect(fields).toEqual({ desired: { a: { ts: 100, holding: true } }, mode: 'sel-default-a' })
    fields.desired.z = {}
    expect(SelectionLocal.state().desired.z).toBeUndefined()
  })

  test('init starts from an empty selection', () => {
    select('a')
    SelectionLocal.init({ awareness, defaultModeFor: () => null, onHeldChanged: () => {}, onModeChanged: () => {} })
    expect(SelectionLocal.heldIds()).toEqual([])
    expect(SelectionLocal.activeMode()).toBeNull()
  })
})
