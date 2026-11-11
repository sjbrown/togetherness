/**
 * tests/unit/soft-lock-visual.test.js
 *
 * Unit tests for the "requested"/contested visual indicator (Commit 4):
 * overlay.js's independent decoration layer, driven by
 * soft_lock.js's getAllContestedElementIds, rendered via
 * Overlay.syncFromAwareness() → render().
 *
 * This indicator is deliberately NOT a selection mode — it's rendered
 * regardless of whether the element also has a SelectionModeLocal or
 * SelectionModeShared entry (or none at all), since contestedness is orthogonal
 * to who currently holds the element. These tests verify that independence
 * directly, alongside the basic contested/uncontested render behavior.
 *
 * Same harness pattern as multiselect.test.js (real overlay.js + jsdom, no
 * App boot).
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SelectionModeLocal,
  SelectionModeShared,
  localSelectionChanged,
  syncFromAwareness,
  render,
  init as overlayInit,
} from '../../src/overlay.js'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs></defs>
      <g id="selection_shared"></g>
      <g id="awareness"></g>
      <g id="selection_local"></g>
    </svg>
  `
}

function makeOverlayApp(bboxMap = {}) {
  return {
    user:          { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
    getViewScale:  () => 1,
    getBBox:       (id) => bboxMap[id] ?? null,
  }
}

const BBOX = { x: 10, y: 10, width: 50, height: 50 }

// Shorthand for the held (holding:true) portion of a `desired` field.
function held(elIds, claimedAt = {}) {
  const out = {}
  for (const elId of elIds) out[elId] = { ts: claimedAt[elId] ?? 0, holding: true }
  return out
}

// Shorthand for a single outstanding bid (holding:false) entry.
function bid(elId, ts) {
  return { [elId]: { ts, holding: false } }
}

beforeEach(() => {
  makeOverlayDOM()
  SelectionModeLocal.clear()
  SelectionModeShared.clear()
  // Reset the module-level _contestedIds by syncing against an empty
  // awareness snapshot — syncFromAwareness always recomputes it fresh.
  overlayInit(makeOverlayApp(), document.getElementById('canvas'))
  syncFromAwareness(new Map(), 0)
})

describe('requested indicator — basic presence', () => {
  test('an element with an outstanding acquisition request renders a requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 999) // 999 = "me", an uninvolved observer

    const rings = document.querySelectorAll('#selection_shared .requestedRing')
    expect(rings).toHaveLength(1)
  })

  test('an uncontested element renders no requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([[1, { desired: held(['goblin-1']) }]])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(0)
  })

  test('a holder with only a claim timestamp (no bid entry) renders no requestedRing', () => {
    // A held elId's claim timestamp lives in desired[elId].ts -- a held
    // elId with no bid entry at all is the normal, common case and
    // must not render as contested.
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { desired: held(['goblin-1'], { 'goblin-1': 500 }) }],
    ])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(0)
  })

  test('an element with null bbox is skipped without throwing', () => {
    overlayInit(makeOverlayApp({}), document.getElementById('canvas')) // no bbox for 'goblin-1'
    const states = new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    expect(() => syncFromAwareness(states, 999)).not.toThrow()
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(0)
  })

  test('multiple independently contested elements each get their own ring', () => {
    overlayInit(makeOverlayApp({ g1: BBOX, g2: { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    const states = new Map([
      [1, { desired: held(['g1', 'g2']) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(2)
  })
})

describe('requested indicator — independence from the selection modes', () => {
  test('coexists with a local selection ring when I am the contested holder', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['goblin-1'])) // I hold it locally
    const states = new Map([
      [1 /* me */, { desired: held(['goblin-1']) }],
      [2,          { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 1)

    expect(SelectionModeLocal.get('goblin-1')?.mode).toBe('local')
    expect(document.querySelectorAll('#selection_local .selRing')).toHaveLength(1)
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(1)
  })

  test('coexists with a remote selection ring when someone else holds the contested element', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1 /* Alice, not me */, { desired: held(['goblin-1']) }],
      [2 /* Bailey, not me */, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 999) // I'm neither Alice nor Bailey

    expect(SelectionModeShared.get('goblin-1')?.mode).toBe('remote')
    // Remote selection is now wrapped in <g class="remote-sel">; assert on
    // that group's presence rather than the individual ring/label children.
    expect(document.querySelectorAll('#selection_shared .remote-sel')).toHaveLength(1)
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(1)
  })

  test('renders even when the element has no selection-mode entry at all', () => {
    // e.g. neither the requester nor an observer has this element selected —
    // only the acquisition request itself exists.
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 999)
    SelectionModeShared.delete('goblin-1') // simulate no selection-mode entry
    render()
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(1)
  })
})

describe('requested indicator — clears when no longer contested', () => {
  test('a subsequent sync with the request gone removes the requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const contested = new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(contested, 999)
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(1)

    // Request resolved (promoted or aborted) — client 2 no longer has a
    // bid entry for it.
    const resolved = new Map([
      [1, { desired: null }],
      [2, { desired: held(['goblin-1']) }],
    ])
    syncFromAwareness(resolved, 999)
    expect(document.querySelectorAll('#selection_shared .requestedRing')).toHaveLength(0)
  })
})

// ── A conflicting claim — both peers briefly broadcast the same elId ───────
//
// Happens mid soft-lock handoff, before computeTickActions converges. My own
// ring and the peer's are drawn from separate maps into separate layers, so
// neither can clobber the other: both show until the claims converge.

describe('a peer claiming an element I also hold', () => {
  test('shows my ring and the peer\'s ring', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1'])) // I legitimately hold it

    syncFromAwareness(new Map([
      [1 /* me */, { desired: held(['die-1']) }],
      [2 /* other peer, conflicting broadcast for the same elId */, { desired: held(['die-1']) }],
    ]), 1)

    expect(SelectionModeLocal.get('die-1')?.mode).toBe('local')
    expect(SelectionModeShared.get('die-1')?.mode).toBe('remote')
    expect(document.querySelectorAll('#selection_local .selRing')).toHaveLength(1)
    expect(document.querySelectorAll('#selection_shared .remote-sel')).toHaveLength(1)
  })

  test('my ring survives the peer\'s claim arriving after it, and the peer\'s ring survives my deselect', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))
    const conflict = new Map([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-1']) }],
    ])
    syncFromAwareness(conflict, 1)
    expect(document.querySelectorAll('#selection_local .selRing')).toHaveLength(1)

    localSelectionChanged(new Set())
    expect(document.querySelectorAll('#selection_local .selRing')).toHaveLength(0)
    expect(document.querySelectorAll('#selection_shared .remote-sel')).toHaveLength(1)
  })

  test('remote still renders normally for elIds with no local conflict', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX, 'die-2': { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))

    const states = new Map([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-2']) }], // no conflict — different elId
    ])
    syncFromAwareness(states, 1)

    expect(SelectionModeLocal.get('die-1')?.mode).toBe('local')
    expect(SelectionModeShared.get('die-2')?.mode).toBe('remote')
    expect(SelectionModeShared.has('die-1')).toBe(false)
  })
})


// ── The request ring ────────────────────────────────────────────────────────
//
// A path in the requester's own gradient that ui.css's request-ring
// keyframes draw on via stroke-dashoffset. jsdom runs no CSS animation, so
// these assert what the browser animates from: geometry, stroke, and the
// negative animation-delay that starts a request already under way.

describe('request ring', () => {
  const NOW = 1_700_000_000_000
  const ALICE = { id: 'alice', name: 'Alice', color: '#2f80f0', gradient: { c1: '#2f80f0', c2: '#12b5c4', angle: 45 } }
  const BAILEY = { id: 'bailey', name: 'Bailey', color: '#ee4a82', gradient: { c1: '#ee4a82', c2: '#9a45f2', angle: 45 } }
  const layer = () => document.getElementById('selection_shared')
  const ring = () => layer().querySelector('.requestedRing')

  function observe({ requestAgeMs = 0, baileyUser = BAILEY, scale = 1 } = {}) {
    overlayInit({ ...makeOverlayApp({ 'goblin-1': BBOX }), getViewScale: () => scale }, document.getElementById('canvas'))
    syncFromAwareness(new Map([
      [1, { user: ALICE,      desired: held(['goblin-1']) }],
      [2, { user: baileyUser, desired: bid('goblin-1', NOW - requestAgeMs) }],
    ]), 999)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => vi.useRealTimers())

  test('is a path of length 1 in the requester\'s own gradient', () => {
    observe()
    expect(ring().localName).toBe('path')
    expect(ring().getAttribute('pathLength')).toBe('1')
    expect(ring().getAttribute('stroke')).toBe('url(#grad-bailey)')
    expect(layer().querySelectorAll('linearGradient')).toHaveLength(0)
  })

  test('starts at the top-left, 10 outside the element (clear of the holder\'s ring), with 6px corners', () => {
    observe()
    // BBOX is 10,10 50x50: the ring's box is 0,0 70x70.
    expect(ring().getAttribute('d')).toMatch(/^M 6 0 H 64 A 6 6 0 0 1 70 6 /)
  })

  test('is 6 screen px wide at any zoom', () => {
    observe({ scale: 2 })
    expect(ring().getAttribute('stroke-width')).toBe('3')
  })

  test('a request already under way starts that far into the animation', () => {
    observe({ requestAgeMs: 1500 })
    expect(ring().style.animationDelay).toBe('-1500ms')
  })

  test('a requester with no broadcast gradient gets a warn ring', () => {
    observe({ baileyUser: null })
    expect(ring().getAttribute('stroke')).toBe('var(--warn)')
  })

  test('the holder\'s ring keeps its own gradient while requested', () => {
    observe()
    expect(layer().querySelector('.remote-sel rect').getAttribute('stroke')).toBe('url(#grad-alice)')
  })

  test('the earliest of several requests is the one drawn', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const CASS = { id: 'cass', name: 'Cass', color: '#0a0', gradient: { c1: '#00aa00', c2: '#005500', angle: 90 } }
    syncFromAwareness(new Map([
      [1, { user: ALICE, desired: held(['goblin-1']) }],
      [3, { user: CASS,  desired: bid('goblin-1', NOW - 1000) }],
      [2, { user: BAILEY, desired: bid('goblin-1', NOW - 200) }],
    ]), 999)
    expect(layer().querySelectorAll('.requestedRing')).toHaveLength(1)
    expect(ring().getAttribute('stroke')).toBe('url(#grad-cass)')
  })
})
