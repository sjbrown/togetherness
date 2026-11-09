/**
 * tests/unit/overlay-layers.test.js
 *
 * Which <g> each overlay decoration lands in, and which ones an awareness
 * tick redraws. #selection_local is drawn from this client's own state only,
 * so syncFromAwareness must leave its nodes alone; #selection_shared only
 * changes with peers' claims and requests; #awareness changes every tick.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SelectionModeLocal,
  SelectionModeShared,
  localSelectionChanged,
  setSelectionMode,
  startDragPlaceholder,
  endDragPlaceholder,
  setDropTargetHover,
  syncFromAwareness,
  render,
  init as overlayInit,
} from '../../src/overlay.js'

const BBOX = { x: 10, y: 10, width: 50, height: 50 }
let geo = {} // per-test bbox overrides
const PEER = { id: 'bailey', name: 'Bailey', color: '#ee4a82', gradient: { c1: '#ee4a82', c2: '#9a45f2', angle: 45 } }

const selectionShared = () => document.getElementById('selection_shared')
const awareness       = () => document.getElementById('awareness')
const selectionLocal  = () => document.getElementById('selection_local')

beforeEach(() => {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs></defs>
      <g id="selection_shared"></g>
      <g id="awareness"></g>
      <g id="selection_local"></g>
    </svg>
  `
  SelectionModeLocal.clear()
  SelectionModeShared.clear()
  geo = {}
  overlayInit({
    user:         { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
    getViewScale: () => 1,
    getBBox:      (id) => (id.startsWith('die-') ? (geo[id] ?? BBOX) : null),
    hasToyActions: () => false,
  }, document.getElementById('canvas'), { id: 'me' })
  syncFromAwareness(new Map(), 1)
})

const held = (elId) => ({ [elId]: { ts: 0, holding: true } })

// One awareness tick: I hold die-1; the peer holds die-2, may bid on die-3,
// and is dragging die-4 to `dragX`.
function tick({ dragX = 0, peerBid = false, peerHolds = 'die-2' } = {}) {
  const desired = { ...held(peerHolds), ...(peerBid ? { 'die-3': { ts: 0, holding: false } } : {}) }
  syncFromAwareness(new Map([
    [1, { desired: held('die-1') }],
    [2, { user: PEER, desired, drag: { elId: 'die-4', bboxX: dragX, bboxY: 0 } }],
  ]), 1)
}

describe('overlay layers', () => {
  test('my rings go to #selection_local, a peer\'s to #selection_shared, a peer\'s drag to #awareness', () => {
    localSelectionChanged(new Set(['die-1']))
    tick({ peerBid: true })

    expect(selectionLocal().querySelectorAll('.selRing')).toHaveLength(1)
    expect(selectionLocal().querySelectorAll('.remote-sel, .requestedRing, use')).toHaveLength(0)

    expect(selectionShared().querySelectorAll('.remote-sel')).toHaveLength(1)
    expect(selectionShared().querySelectorAll('.requestedRing')).toHaveLength(1)
    expect(selectionShared().querySelectorAll('.selRing, use')).toHaveLength(0)

    expect(awareness().querySelectorAll('use[href="#die-4"]')).toHaveLength(2) // placeholder + ghost
    expect(awareness().querySelectorAll('.remote-sel')).toHaveLength(1)         // the drag ring
    expect(awareness().querySelectorAll('.selRing, .requestedRing')).toHaveLength(0)
  })

  test('a movement-only tick redraws #awareness and leaves both selection layers\' nodes in place', () => {
    localSelectionChanged(new Set(['die-1']))
    tick({ dragX: 0, peerBid: true })
    const myRing = selectionLocal().querySelector('.selRing')
    const peerRing = selectionShared().querySelector('.remote-sel')
    const request = selectionShared().querySelector('.requestedRing')
    const ghost = awareness().querySelector('use')

    tick({ dragX: 5, peerBid: true })

    expect(selectionLocal().querySelector('.selRing')).toBe(myRing)
    expect(selectionShared().querySelector('.remote-sel')).toBe(peerRing)
    expect(selectionShared().querySelector('.requestedRing')).toBe(request)
    expect(awareness().querySelector('use')).not.toBe(ghost)
  })

  test('a change in a peer\'s claims redraws #selection_shared', () => {
    tick()
    const peerRing = selectionShared().querySelector('.remote-sel')
    tick({ peerHolds: 'die-5' })
    expect(selectionShared().querySelector('.remote-sel')).not.toBe(peerRing)
  })

  test('a new request redraws #selection_shared', () => {
    tick()
    expect(selectionShared().querySelectorAll('.requestedRing')).toHaveLength(0)
    tick({ peerBid: true })
    expect(selectionShared().querySelectorAll('.requestedRing')).toHaveLength(1)
  })

  test('a full render rebuilds #awareness and keeps both selection layers\' nodes', () => {
    localSelectionChanged(new Set(['die-1']))
    tick()
    const myRing = selectionLocal().querySelector('.selRing')
    const peerRing = selectionShared().querySelector('.remote-sel')
    const ghost = awareness().querySelector('use')
    render()
    expect(selectionLocal().querySelector('.selRing')).toBe(myRing)
    expect(selectionShared().querySelector('.remote-sel')).toBe(peerRing)
    expect(awareness().querySelector('use')).not.toBe(ghost)
  })
})

// #selection_shared is reconciled too, and an open request is redrawn from
// the clock it was first drawn with, so its SMIL animation is never touched.
describe('#selection_shared keeps its nodes across renders', () => {
  const NOW = 1_700_000_000_000
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => vi.useRealTimers())

  const bidTick = (peerHolds = 'die-2') => syncFromAwareness(new Map([
    [2, { user: PEER, desired: held(peerHolds) }],
    [3, { user: { id: 'cass', gradient: { c1: '#00aa00', c2: '#005500' } }, desired: { 'die-2': { ts: NOW - 1000, holding: false } } }],
  ]), 1)

  test('an unchanged request keeps its ring and gradient, attribute for attribute, as time passes', () => {
    bidTick()
    const request = selectionShared().querySelector('[data-key="request:die-2"]')
    const animate = request.querySelector('animate')
    const values = animate.getAttribute('values')
    vi.setSystemTime(NOW + 500)
    render()
    expect(selectionShared().querySelector('[data-key="request:die-2"]')).toBe(request)
    expect(request.querySelector('animate')).toBe(animate)
    expect(animate.getAttribute('values')).toBe(values)
  })

  test('a peer\'s new claim adds its ring and leaves the others\' nodes alone', () => {
    bidTick()
    const ring = selectionShared().querySelector('[data-key="remote:die-2"]')
    const request = selectionShared().querySelector('[data-key="request:die-2"]')
    syncFromAwareness(new Map([
      [2, { user: PEER, desired: { ...held('die-2'), ...held('die-5') } }],
      [3, { user: { id: 'cass', gradient: { c1: '#00aa00' } }, desired: { 'die-2': { ts: NOW - 1000, holding: false } } }],
    ]), 1)
    expect(selectionShared().querySelector('[data-key="remote:die-2"]')).toBe(ring)
    expect(selectionShared().querySelector('[data-key="request:die-2"]')).toBe(request)
    expect(selectionShared().querySelector('[data-key="remote:die-5"]')).not.toBeNull()
  })

  test('a resolved request\'s group goes, and a later request on the same element starts its own clock', () => {
    bidTick()   // 1000ms old when first drawn
    const first = selectionShared().querySelector('[data-key="request:die-2"] animate').getAttribute('values')
    syncFromAwareness(new Map([[2, { user: PEER, desired: held('die-2') }]]), 1)
    expect(selectionShared().querySelector('[data-key="request:die-2"]')).toBeNull()

    vi.setSystemTime(NOW + 2000)
    syncFromAwareness(new Map([
      [2, { user: PEER, desired: held('die-2') }],
      [3, { user: { id: 'cass', gradient: { c1: '#00aa00' } }, desired: { 'die-2': { ts: NOW + 1500, holding: false } } }],
    ]), 1)  // 500ms old when first drawn
    const second = selectionShared().querySelector('[data-key="request:die-2"] animate').getAttribute('values')
    expect(second).not.toBe(first)
  })
})

// #selection_local is reconciled, not rebuilt: a node that is still wanted
// keeps its identity, so CSS transitions and animations on it run once.
describe('#selection_local keeps its nodes across renders', () => {
  const group = (elId) => selectionLocal().querySelector(`[data-key="sel:${elId}"]`)

  test('a moved element\'s ring is the same node, patched to the new geometry', () => {
    localSelectionChanged(new Set(['die-1']))
    const ring = selectionLocal().querySelector('.selRing')
    geo['die-1'] = { ...BBOX, x: 100 }
    render()
    expect(selectionLocal().querySelector('.selRing')).toBe(ring)
    expect(ring.getAttribute('x')).toBe(String(100 - 6))
  })

  test('a mode change keeps the element\'s group and ring, and swaps its handles', () => {
    localSelectionChanged(new Set(['die-1']))
    const g = group('die-1')
    const ring = g.querySelector('.selRing')
    setSelectionMode('die-1', 'sel-resize')
    expect(group('die-1')).toBe(g)
    expect(g.querySelector('.selRing')).toBe(ring)
    expect(g.querySelectorAll('.handle')).toHaveLength(4)
    const handle = g.querySelector('.handle')
    setDropTargetHover('die-2')
    expect(g.querySelector('.handle')).toBe(handle)
  })

  test('deselecting removes the element\'s group; other elements\' groups stay', () => {
    localSelectionChanged(new Set(['die-1', 'die-2']))
    const g2 = group('die-2')
    localSelectionChanged(new Set(['die-2']))
    expect(group('die-1')).toBeNull()
    expect(group('die-2')).toBe(g2)
  })

  test('a retained drag ghost stays put, below and above the right things', () => {
    localSelectionChanged(new Set(['die-1']))
    startDragPlaceholder('die-1')
    const kids = () => [...selectionLocal().children]
    const before = kids()
    setDropTargetHover('die-2')
    const after = kids()
    // [placeholder, ring group, drop target, ghost, drag ring]
    expect(after.filter((n) => before.includes(n))).toEqual(before)
    expect(after.map((n) => n.getAttribute('data-key') ?? n.localName))
      .toEqual(['use', 'sel:die-1', 'drop-target', 'use', 'rect'])
    endDragPlaceholder('die-1')
    expect(kids().map((n) => n.getAttribute('data-key'))).toEqual(['sel:die-1', 'drop-target'])
  })
})
