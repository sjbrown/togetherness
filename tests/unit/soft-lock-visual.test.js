/**
 * tests/unit/soft-lock-visual.test.js
 *
 * Unit tests for the "requested"/contested visual indicator (Commit 4):
 * overlay.js's independent decoration layer, driven by
 * soft_lock.js's getAllContestedElementIds, rendered via
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
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SelectionMode,
  localSelectionChanged,
  syncFromAwareness,
  init as overlayInit,
} from '../../src/overlay.js'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs></defs>
      <g id="overlay-layer"></g>
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
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 999) // 999 = "me", an uninvolved observer

    const rings = document.querySelectorAll('#overlay-layer .requestedRing')
    expect(rings).toHaveLength(1)
  })

  test('an uncontested element renders no requestedRing', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([[1, { desired: held(['goblin-1']) }]])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
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

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })

  test('an element with null bbox is skipped without throwing', () => {
    overlayInit(makeOverlayApp({}), document.getElementById('canvas')) // no bbox for 'goblin-1'
    const states = new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    expect(() => syncFromAwareness(states, 999)).not.toThrow()
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(0)
  })

  test('multiple independently contested elements each get their own ring', () => {
    overlayInit(makeOverlayApp({ g1: BBOX, g2: { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    const states = new Map([
      [1, { desired: held(['g1', 'g2']) }],
      [2, { desired: bid('g1', 1000) }],
      [3, { desired: bid('g2', 1200) }],
    ])
    syncFromAwareness(states, 999)

    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(2)
  })
})

describe('requested indicator — independence from SelectionMode mode', () => {
  test('coexists with a local selection ring when I am the contested holder', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['goblin-1'])) // I hold it locally
    const states = new Map([
      [1 /* me */, { desired: held(['goblin-1']) }],
      [2,          { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('goblin-1')?.mode).toBe('local')
    expect(document.querySelectorAll('#overlay-layer .selRing')).toHaveLength(1)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)
  })

  test('coexists with a remote selection ring when someone else holds the contested element', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const states = new Map([
      [1 /* Alice, not me */, { desired: held(['goblin-1']) }],
      [2 /* Bailey, not me */, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(states, 999) // I'm neither Alice nor Bailey

    expect(SelectionMode.get('goblin-1')?.mode).toBe('remote')
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
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
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
      [1, { desired: held(['goblin-1']) }],
      [2, { desired: bid('goblin-1', 1000) }],
    ])
    syncFromAwareness(contested, 999)
    expect(document.querySelectorAll('#overlay-layer .requestedRing')).toHaveLength(1)

    // Request resolved (promoted or aborted) — client 2 no longer has a
    // bid entry for it.
    const resolved = new Map([
      [1, { desired: null }],
      [2, { desired: held(['goblin-1']) }],
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
      [1 /* me */, { desired: held(['die-1']) }],
      [2 /* other peer, conflicting broadcast for the same elId */, { desired: held(['die-1']) }],
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('die-1')?.mode).toBe('local')
    expect(document.querySelectorAll('#overlay-layer .selRing')).toHaveLength(1)
  })

  test('both sides of a symmetric conflict independently keep their own local ring', () => {
    // Client 1's own view: sees itself as local, peer 2's claim as would-be
    // remote but suppressed by precedence.
    overlayInit(makeOverlayApp({ 'die-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))
    syncFromAwareness(new Map([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-1']) }],
    ]), 1)
    expect(SelectionMode.get('die-1')?.mode).toBe('local')

    // Client 2's own view (separate overlay instance state — SelectionMode
    // is module-level, so simulate by clearing and reinitializing as if we
    // were client 2): local takes precedence for THEM too, symmetrically.
    SelectionMode.clear()
    localSelectionChanged(new Set(['die-1']))
    syncFromAwareness(new Map([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-1']) }],
    ]), 2)
    expect(SelectionMode.get('die-1')?.mode).toBe('local')
  })

  test('remote still renders normally for elIds with no local conflict', () => {
    overlayInit(makeOverlayApp({ 'die-1': BBOX, 'die-2': { ...BBOX, x: 200 } }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['die-1']))

    const states = new Map([
      [1, { desired: held(['die-1']) }],
      [2, { desired: held(['die-2']) }], // no conflict — different elId
    ])
    syncFromAwareness(states, 1)

    expect(SelectionMode.get('die-1')?.mode).toBe('local')
    expect(SelectionMode.get('die-2')?.mode).toBe('remote')
  })
})


// ── Request animation: requester's ring grows, holder's ring fades ─────────
//
// Both are gradients whose stops carry SMIL animations. jsdom doesn't run
// SMIL, so these assert the structure the browser animates from, plus the
// static offsets the request's age puts the stops at.

describe('request animation', () => {
  const NOW = 1_700_000_000_000
  const ALICE = { id: 'alice', name: 'Alice', color: '#2f80f0', gradient: { c1: '#2f80f0', c2: '#12b5c4', angle: 45 } }
  const BAILEY = { id: 'bailey', name: 'Bailey', color: '#ee4a82', gradient: { c1: '#ee4a82', c2: '#9a45f2', angle: 45 } }
  const layer = () => document.getElementById('overlay-layer')
  const grad = (id) => layer().querySelector(`linearGradient[id="${id}"]`)
  const stops = (g) => [...g.querySelectorAll('stop')]
  const strokeOf = (sel) => layer().querySelector(sel).getAttribute('stroke')

  function observe({ requestAgeMs = 0, aliceUser = ALICE, baileyUser = BAILEY } = {}) {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    syncFromAwareness(new Map([
      [1, { user: aliceUser,  desired: held(['goblin-1']) }],
      [2, { user: baileyUser, desired: bid('goblin-1', NOW - requestAgeMs) }],
    ]), 999)
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  test('the requested ring is stroked by a gradient built from the requester\'s colours', () => {
    observe()
    expect(strokeOf('.requestedRing')).toBe('url(#req-grow-goblin-1)')
    const g = stops(grad('req-grow-goblin-1'))
    expect(g).toHaveLength(4)
    // reversed colour order: the full ring still reads c1 -> c2, but emerges from the c2 end
    expect(g[0].getAttribute('stop-color')).toBe(BAILEY.gradient.c2)
    expect(g[3].getAttribute('stop-color')).toBe(BAILEY.gradient.c1)
  })

  test('the grow gradient runs against the requester\'s own gradient direction', () => {
    observe()
    const lg = grad('req-grow-goblin-1')
    // angle 45 normally runs bottom-left -> top-right; grown from the other end
    expect(+lg.getAttribute('x1')).toBeGreaterThan(+lg.getAttribute('x2'))
    expect(+lg.getAttribute('y1')).toBeLessThan(+lg.getAttribute('y2'))
  })

  test('the requested ring sits on the selection-ring rectangle, 4px wide', () => {
    observe()
    const ring = layer().querySelector('.requestedRing')
    expect(+ring.getAttribute('x')).toBe(BBOX.x - 6)
    expect(+ring.getAttribute('width')).toBe(BBOX.width + 12)
    expect(ring.getAttribute('stroke-width')).toBe('4')
    expect(ring.getAttribute('rx')).toBe('4')
  })

  test('a remote holder\'s ring is stroked by a fading gradient in the holder\'s colours', () => {
    observe()
    expect(strokeOf('.remote-sel rect')).toBe('url(#req-fade-goblin-1)')
    const lg = grad('req-fade-goblin-1')
    const g = stops(lg)
    expect(g[0].getAttribute('stop-color')).toBe(ALICE.gradient.c1)
    expect(g[3].getAttribute('stop-color')).toBe(ALICE.gradient.c2)
    expect(+lg.getAttribute('x1')).toBeLessThan(+lg.getAttribute('x2'))
  })

  test('my own selection ring fades when someone requests what I hold', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    localSelectionChanged(new Set(['goblin-1']))
    syncFromAwareness(new Map([
      [1, { desired: held(['goblin-1']) }],
      [2, { user: BAILEY, desired: bid('goblin-1', NOW) }],
    ]), 1)

    expect(strokeOf('.selRing')).toBe('url(#req-fade-goblin-1)')
    expect(stops(grad('req-fade-goblin-1'))[0].getAttribute('stop-color')).toBe('#5a7ea8')
    expect(strokeOf('.requestedRing')).toBe('url(#req-grow-goblin-1)')
  })

  test('without a request the rings keep their normal gradients and no defs are added', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'), { id: 'me' })
    localSelectionChanged(new Set(['goblin-1']))
    syncFromAwareness(new Map([[1, { desired: held(['goblin-1']) }]]), 1)

    expect(strokeOf('.selRing')).toBe('url(#grad-me)')
    expect(layer().querySelectorAll('defs, linearGradient')).toHaveLength(0)
  })

  test('the moving stops carry looping animations over the request window plus its buffer', () => {
    observe()
    for (const id of ['req-grow-goblin-1', 'req-fade-goblin-1']) {
      const [, s1, s2] = stops(grad(id))
      for (const stop of [s1, s2]) {
        const anims = stop.querySelectorAll('animate')
        expect(anims).toHaveLength(1)
        expect(anims[0].getAttribute('attributeName')).toBe('offset')
        expect(anims[0].getAttribute('repeatCount')).toBe('indefinite')
        expect(anims[0].getAttribute('dur')).toBe('4s')
      }
    }
  })

  test('a request already half through its window starts the stops half-way, not from zero', () => {
    observe({ requestAgeMs: 1500 })
    const [, grow1] = stops(grad('req-grow-goblin-1'))
    const [, fade1] = stops(grad('req-fade-goblin-1'))
    // grow: v = 1 - 0.5; fade: v = 0.5^2. Offsets are end * v.
    expect(+grow1.getAttribute('offset')).toBeCloseTo(0.92 * 0.5, 3)
    expect(+fade1.getAttribute('offset')).toBeCloseTo(0.92 * 0.25, 3)
    // begins now (a backdated begin is never scheduled); the keyframes start at that phase instead
    const anim = grow1.querySelector('animate')
    expect(anim.getAttribute('begin')).toBe('0.001s')
    expect(+anim.getAttribute('values').split(';')[0]).toBeCloseTo(0.92 * 0.5, 2)
  })

  test('the phase wraps with the cycle instead of running off the end', () => {
    observe({ requestAgeMs: 4000 + 1500 })
    const [, grow1] = stops(grad('req-grow-goblin-1'))
    expect(+grow1.getAttribute('offset')).toBeCloseTo(0.92 * 0.5, 3)
  })

  test('a requester with no broadcast gradient gets a static warn ring and no gradient', () => {
    observe({ baileyUser: null })
    expect(strokeOf('.requestedRing')).toBe('var(--warn)')
    expect(grad('req-grow-goblin-1')).toBeNull()
    expect(layer().querySelectorAll('.requestedRing')).toHaveLength(1)
  })

  test('with reduced motion preferred, the rings are static and unanimated', () => {
    vi.stubGlobal('matchMedia', (q) => ({ matches: q.includes('reduce'), media: q }))
    observe({ requestAgeMs: 1500 })
    expect(layer().querySelectorAll('animate')).toHaveLength(0)
    expect(+stops(grad('req-grow-goblin-1'))[1].getAttribute('offset')).toBe(0)
  })

  test('the earliest of several requests drives the animation', () => {
    overlayInit(makeOverlayApp({ 'goblin-1': BBOX }), document.getElementById('canvas'))
    const CASS = { id: 'cass', name: 'Cass', color: '#0a0', gradient: { c1: '#00aa00', c2: '#005500', angle: 90 } }
    syncFromAwareness(new Map([
      [1, { user: ALICE, desired: held(['goblin-1']) }],
      [3, { user: CASS,  desired: bid('goblin-1', NOW - 1000) }],
      [2, { user: BAILEY, desired: bid('goblin-1', NOW - 200) }],
    ]), 999)
    expect(layer().querySelectorAll('.requestedRing')).toHaveLength(1)
    expect(stops(grad('req-grow-goblin-1'))[0].getAttribute('stop-color')).toBe(CASS.gradient.c2)
  })
})
