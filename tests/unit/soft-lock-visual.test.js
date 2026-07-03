/**
 * tests/unit/soft-lock-visual.test.js
 *
 * Unit tests for the "requested"/contested visual indicator (Commit 4):
 * overlay.js's independent decoration layer, driven by
 * soft-lock.js's getAllContestedElementIds, rendered via
 * Overlay.syncFromAwareness() → render().
 *
 * This indicator is deliberately NOT a SelectionMode `kind` — it's rendered
 * regardless of whether the element also has a 'local' or 'remote'
 * SelectionMode entry (or none at all), since contestedness is orthogonal
 * to who currently holds the element. These tests verify that independence
 * directly, alongside the basic contested/uncontested render behavior.
 *
 * Same harness pattern as multiselect.test.js (real overlay.js + jsdom, no
 * App boot).
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  SelectionMode,
  localSelectionChanged,
  syncFromAwareness,
  init as overlayInit,
} from '../../src/overlay.js'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs>
        <linearGradient id="local-sel-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop id="local-sel-grad-stop0" offset="0%"   stop-color="#5a7ea8"></stop>
          <stop id="local-sel-grad-stop1" offset="100%" stop-color="#3a5e88"></stop>
        </linearGradient>
      </defs>
      <g id="overlay-layer"></g>
    </svg>
  `
}

function makeOverlayApp(bboxMap = {}) {
  return {
    getMyColor:    () => '#5a7ea8',
    getMyGradient: () => ({ c1: '#5a7ea8', c2: '#3a5e88', angle: 45 }),
    getViewScale:  () => 1,
    getBBox:       (id) => bboxMap[id] ?? null,
  }
}

const BBOX = { x: 10, y: 10, width: 50, height: 50 }

beforeEach(() => {
  makeOverlayDOM()
  SelectionMode.clear()
  // Reset the module-level _contestedIds by syncing against an empty
  // awareness snapshot — syncFromAwareness always recomputes it fresh.
  overlayInit(makeOverlayApp(), document.getElementById('canvas'))
  syncFromAwareness(new Map(), 0)
})

describe('requested indicator — basic presence', () => {
  test('an element with an outstanding acquisition request renders a requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { selection: { 'goblin-1': 0 } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    syncFromAwareness(states, 999) // 999 = "me", an uninvolved observer

    const rings = document.querySelectorAll('#overlay-layer .requestedRing')
    expect(rings).toHaveLength(1)
  })

  test('an uncontested element renders no requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([[1, { selection: { 'goblin-1': 0 } }]])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })

  test('a holder with only a claim timestamp (no pendingRequests entry) renders no requestedRing', () => {
    // A held elId's claim timestamp lives directly in selection[elId] now
    // (pendingRequests is exclusively outstanding acquisition bids — see
    // soft-lock.js). A held elId with a claim timestamp and no
    // pendingRequests entry at all is the normal, common case and must not
    // render as contested.
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { selection: { 'goblin-1': 500 } }],
    ])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })

  test('an element with null bbox is skipped without throwing', () => {
    overlayInit(makeOverlayApp({}), document.getElementById('canvas')) // no bbox for 'goblin-1'
    const states = new Map([
      [1, { selection: { 'goblin-1': 0 } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    expect(() => syncFromAwareness(states, 999)).not.toThrow()
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })

  test('multiple independently contested elements each get their own ring', () => {
    overlayInit(makeOverlayApp({ g1: BBOX, g2: { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    const states = new Map([
      [1, { selection: { 'g1': 0, 'g2': 0 } }],
      [2, { selection: null, pendingRequests: { g1: 1000 } }],
      [3, { selection: null, pendingRequests: { g2: 1200 } }],
    ])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(2)
  })
})

describe('requested indicator — independence from SelectionMode kind', () => {
  test('coexists with a local selection ring when I am the contested holder', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['goblin-1'])) // I hold it locally
    const states = new Map([
      [1 /* me */, { selection: { 'goblin-1': 0 } }],
      [2,          { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('goblin-1')?.kind).toBe('local')
    expect(document.querySelectorAll('#overlay-layer .selRing')).toHaveLength(1)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)
  })

  test('coexists with a remote selection ring when someone else holds the contested element', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1 /* Alice, not me */, { selection: { 'goblin-1': 0 } }],
      [2 /* Bailey, not me */, { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    syncFromAwareness(states, 999) // I'm neither Alice nor Bailey

    expect(SelectionMode.get('goblin-1')?.kind).toBe('remote')
    // Remote selection is now wrapped in <g class="remote-sel">; assert on
    // that group's presence rather than the individual ring/label children.
    expect(document.querySelectorAll('#overlay-layer .remote-sel')).toHaveLength(1)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)
  })

  test('renders even when the element has no SelectionMode entry at all', () => {
    // e.g. neither the requester nor an observer has this element selected —
    // only the acquisition request itself exists.
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1, { selection: { 'goblin-1': 0 } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    syncFromAwareness(states, 999)
    SelectionMode.delete('goblin-1') // simulate no SelectionMode entry
    // (SelectionMode entries come from local/remote selection state, which
    // is independent of _contestedIds — re-syncing without re-deriving
    // SelectionMode shows the requestedRing still renders standalone.)

    // Re-render is triggered by any Overlay call; syncFromAwareness both
    // rebuilds SelectionMode remote entries AND re-renders, so call it again
    // with the same states to exercise a fresh render after the manual delete.
    syncFromAwareness(states, 999)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)
  })
})

describe('requested indicator — clears when no longer contested', () => {
  test('a subsequent sync with the request gone removes the requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const contested = new Map([
      [1, { selection: { 'goblin-1': 0 } }],
      [2, { selection: null, pendingRequests: { 'goblin-1': 1000 } }],
    ])
    syncFromAwareness(contested, 999)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)

    // Request resolved (promoted or aborted) — client 2 no longer has a
    // pendingRequests entry for it.
    const resolved = new Map([
      [1, { selection: null }],
      [2, { selection: { 'goblin-1': 0 }, pendingRequests: null }],
    ])
    syncFromAwareness(resolved, 999)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })
})

// ── Regression — local selection must never be clobbered by a conflicting
//    remote broadcast for the same elId ─────────────────────────────────────
//
// Reproduces a visual bug observed live: two peers briefly, genuinely both
// broadcast the same elId in their selection (e.g. mid soft-lock handoff,
// before the data layer converges via computeTickActions). syncFromAwareness's
// remote-selection loop previously overwrote an existing 'local' SelectionMode
// entry unconditionally — so my own screen would show the OTHER peer's dashed
// ring instead of my own, even though my own selection data still held it.
// Both peers seeing "the other peer's dashed ring" simultaneously was exactly
// the reported symptom. Fix mirrors the precedence rule setHoverCandidates
// already applies for candidate-vs-local.

describe('local selection precedence over a conflicting remote broadcast', () => {
  test('local entry survives when a remote peer broadcasts the same elId', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1'])) // I legitimately hold it

    const states = new Map([
      [1 /* me */, { selection: { 'die-1': 0 } }],
      [2 /* other peer, conflicting broadcast for the same elId */, { selection: { 'die-1': 0 } }],
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('die-1')?.kind).toBe('local')
    expect(document.querySelectorAll('#overlay-layer .selRing')).toHaveLength(1)
  })

  test('both sides of a symmetric conflict independently keep their own local ring', () => {
    // Client 1's own view: sees itself as local, peer 2's claim as would-be
    // remote but suppressed by precedence.
    overlayInit(makeOverlayApp({ 'die-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))
    syncFromAwareness(new Map([
      [1, { selection: { 'die-1': 0 } }],
      [2, { selection: { 'die-1': 0 } }],
    ]), 1)
    expect(SelectionMode.get('die-1')?.kind).toBe('local')

    // Client 2's own view (separate overlay instance state — SelectionMode
    // is module-level, so simulate by clearing and reinitializing as if we
    // were client 2): local takes precedence for THEM too, symmetrically.
    SelectionMode.clear()
    localSelectionChanged(new Set(['die-1']))
    syncFromAwareness(new Map([
      [1, { selection: { 'die-1': 0 } }],
      [2, { selection: { 'die-1': 0 } }],
    ]), 2)
    expect(SelectionMode.get('die-1')?.kind).toBe('local')
  })

  test('remote still renders normally for elIds with no local conflict', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX, 'die-2': { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))

    const states = new Map([
      [1, { selection: { 'die-1': 0 } }],
      [2, { selection: { 'die-2': 0 } }], // no conflict — different elId
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('die-1')?.kind).toBe('local')
    expect(SelectionMode.get('die-2')?.kind).toBe('remote')
  })
})
