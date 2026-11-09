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

// #selection_shared is reconciled too, and an open request keeps the
// animation-delay it was first drawn with, so its CSS animation runs on.
describe('#selection_shared keeps its nodes across renders', () => {
  const NOW = 1_700_000_000_000
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => vi.useRealTimers())

  const CASS = { id: 'cass', gradient: { c1: '#00aa00' } }
  const bidTick = (bidTs = NOW - 1000) => syncFromAwareness(new Map([
    [2, { user: PEER, desired: held('die-2') }],
    [3, { user: CASS, desired: { 'die-2': { ts: bidTs, holding: false } } }],
  ]), 1)
  const request = () => selectionShared().querySelector('[data-key="request:die-2"]')

  test('an unchanged request keeps its ring and animation-delay as time passes', () => {
    bidTick()
    const ring = request()
    expect(ring.style.animationDelay).toBe('-1000ms')
    vi.setSystemTime(NOW + 500)
    render()
    expect(request()).toBe(ring)
    expect(ring.style.animationDelay).toBe('-1000ms')
  })

  test('a peer\'s new claim adds its ring and leaves the others\' nodes alone', () => {
    bidTick()
    const ring = selectionShared().querySelector('[data-key="remote:die-2"]')
    const req = request()
    syncFromAwareness(new Map([
      [2, { user: PEER, desired: { ...held('die-2'), ...held('die-5') } }],
      [3, { user: CASS, desired: { 'die-2': { ts: NOW - 1000, holding: false } } }],
    ]), 1)
    expect(selectionShared().querySelector('[data-key="remote:die-2"]')).toBe(ring)
    expect(request()).toBe(req)
    expect(selectionShared().querySelector('[data-key="remote:die-5"]')).not.toBeNull()
  })

  test('a resolved request\'s ring goes, and a later request on the same element starts from its own age', () => {
    bidTick()
    syncFromAwareness(new Map([[2, { user: PEER, desired: held('die-2') }]]), 1)
    expect(request()).toBeNull()

    vi.setSystemTime(NOW + 2000)
    bidTick(NOW + 1500)
    expect(request().style.animationDelay).toBe('-500ms')
  })
})
