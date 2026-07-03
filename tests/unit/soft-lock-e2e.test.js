/**
 * tests/unit/soft-lock-e2e.test.js
 *
 * Real end-to-end reproduction of the soft-lock "click a held element"
 * flow, booting the ACTUAL App bus (src/app.js) — not a mirror or a hand
 * -copied re-implementation — the way index.html really does:
 *
 *   awareness.setLocalState({ id, color, grad, cursor: null, selection: null })
 *   boot({ ydoc, yMeta, yToys, yDrawing, yBounPos, awareness, ... })
 *
 * This exists because soft-lock-wiring.test.js (Commit 2) and
 * soft-lock-visual.test.js (Commit 4) both mirror app.js's/overlay.js's
 * logic in hand-written pure functions, which cannot catch a bug where the
 * *real* code diverges from the mirror. This file calls the real
 * `App.select()` and asserts on the real rendered DOM.
 *
 * ui.js and canvas.js are mocked out (this is not an input-gesture test —
 * canvas-select.test.js covers gesture-to-App-call wiring separately); only
 * app.js, overlay.js, soft-lock.js, toys.js, and real y-protocols Awareness
 * are live.
 */

// @vitest-environment jsdom
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, _clearSvgTextCache } from '../../src/toys.js'

vi.mock('../../src/ui.js', () => ({
  init:               vi.fn(),
  onSelectionChanged: vi.fn(),
  onToolChanged:      vi.fn(),
  refreshFromDoc:     vi.fn(),
  setIdentity:        vi.fn(),
  showPopover:        vi.fn(),
  toast:              vi.fn(),
  updatePeersPanel:   vi.fn(),
}))

vi.mock('../../src/canvas.js', () => ({
  init:            vi.fn(),
  getView:         vi.fn(() => ({ x: 0, y: 0, scale: 1 })),
  leaderId:        vi.fn(),
  setParams:       vi.fn(),
  setTool:         vi.fn(),
  wireShapeClicks: vi.fn(),
}))

const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="token_solidcolor">
  <g id="layer1" class="colorable">
    <circle id="token_front" r="34" cx="40" cy="45"/>
  </g>
</svg>`

// Same #canvas structure as src/index.html — real layer containers +
// #local-sel-grad, since app.js/overlay.js throw loudly (or silently fail
// to find things) if these are missing, matching the actual boot fixture.
function makeCanvasDOM() {
  document.body.innerHTML = `
    <div id="stage">
      <svg id="canvas" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="local-sel-grad" x1="0" y1="0.5" x2="1" y2="0.5">
            <stop id="local-sel-grad-stop0" offset="0%"   stop-color="#5a7ea8"></stop>
            <stop id="local-sel-grad-stop1" offset="100%" stop-color="#3a5e88"></stop>
          </linearGradient>
        </defs>
        <g id="background-layer"></g>
        <g id="boundaries-positions-layer"></g>
        <g id="toys-layer"></g>
        <g id="drawing-layer"></g>
        <g id="overlay-layer" pointer-events="none"></g>
      </svg>
    </div>
  `
  return document.getElementById('canvas')
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
  _clearSvgTextCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Boots a real App instance (Peer B) exactly as index.html does, and
// returns { App, ydoc, yToys, awareness }.
async function bootPeerB() {
  const svgEl = makeCanvasDOM()
  const { boot, makeDoc, App } = await import('../../src/app.js')
  const { ydoc, yMeta, yToys, yDrawing, yBounPos } = makeDoc()
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const myGrad = { c1: '#0f0', c2: '#0a0', angle: 45 }

  // Exactly index.html's initialization order: setLocalState BEFORE boot().
  awareness.setLocalState({ id: 'bailey', color: myGrad.c1, grad: myGrad, cursor: null, selection: null })

  boot({
    ydoc, yMeta, yToys, yDrawing, yBounPos,
    awareness, provider: { on: vi.fn() },
    myId: 'bailey', myGrad, roomId: 'test-room',
    svgElement: svgEl, displayName: 'Bailey',
  })

  await addToy(ydoc, yToys, { id: 'die-1', toyType: 'player_marker', x: 0, y: 0, color: '#abc' })

  return { App, ydoc, yToys, awareness }
}

// Simulates a remote peer (Alice) selecting `elId`, by encoding a real
// awareness update from a throwaway Awareness instance and applying it to
// Bailey's real (booted) awareness — the same mechanism a real WebRTC
// provider uses, without needing an actual network.
function simulateRemoteSelection(bobAwareness, elId) {
  const aliceDoc = new Y.Doc()
  const aliceAw  = new awarenessProtocol.Awareness(aliceDoc)
  aliceAw.setLocalState({ id: 'alice', color: '#f00', grad: null, cursor: null, selection: { [elId]: Date.now() } })
  const update = awarenessProtocol.encodeAwarenessUpdate(aliceAw, [aliceAw.clientID])
  awarenessProtocol.applyAwarenessUpdate(bobAwareness, update, 'network')
  return aliceAw
}

describe('soft-lock e2e — clicking a held element (real App.select, real DOM)', () => {
  test('shows a requestedRing on the requester\'s own screen immediately, no network round-trip needed', async () => {
    const { App, awareness } = await bootPeerB()
    simulateRemoteSelection(awareness, 'die-1')

    expect(App.isHeldByOther('die-1')).toBe(true) // sanity: the setup is correct

    App.select('die-1') // the REAL function — this is Bailey clicking Alice's die

    expect(App.getSelectedIds()).toEqual([]) // request, not a select
    const rings = document.querySelectorAll('#overlay-layer .requestedRing')
    expect(rings).toHaveLength(1)
  })

  test('does not start a local drag ghost for a held element (regression check for the canvas.js fix)', async () => {
    const { App, awareness } = await bootPeerB()
    simulateRemoteSelection(awareness, 'die-1')

    App.select('die-1')
    App.startDrag('die-1') // even if a caller ignored the guard, startDrag itself should refuse

    // No local drag ring (drag-ring class) should appear — startDrag's own
    // isHeldByOther guard should have no-op'd.
    expect(document.querySelectorAll('#overlay-layer .drag-ring')).toHaveLength(0)
    expect(awareness.getLocalState()?.drag).toBeUndefined()
  })
})

describe('soft-lock e2e — local cleanup must precede broadcast (ordering regression)', () => {
  test('deselecting an elId a remote peer also holds correctly shows their remote ring, not nothing', async () => {
    // Reproduces a real live bug: setLocalStateField fires the awareness
    // 'change' event SYNCHRONOUSLY, which can trigger syncFromAwareness
    // before the caller has a chance to clean up its own stale local
    // SelectionMode entry. syncFromAwareness's local-takes-precedence guard
    // (added for a different bug) would then see the still-present stale
    // 'local' entry and skip assigning 'remote' — and nothing afterward
    // re-triggers that decision, leaving the elId with NO ring at all
    // rather than the correct remote one. Only a real end-to-end test with
    // the actual synchronous event cascade can catch this — hand-built-Map
    // tests that call syncFromAwareness directly bypass the ordering
    // entirely and would pass either way.
    const { App, awareness } = await bootPeerB()

    App.select('die-1') // Bailey holds it locally — 'local' SelectionMode entry exists
    expect(App.getSelectedIds()).toEqual(['die-1'])

    // Now Alice ALSO broadcasts holding the same elId (however that
    // conflict arose in practice — e.g. Alice's own tick promoted it while
    // Bailey's screen hadn't yet released — the mechanism doesn't matter
    // for this test; what matters is Bailey's client now sees a conflict).
    simulateRemoteSelection(awareness, 'die-1')

    // Bailey deselects — this is the exact call sequence that broadcasts
    // (triggering a synchronous syncFromAwareness) before this fix ensured
    // local cleanup happens first.
    App.select(null)

    expect(App.getSelectedIds()).toEqual([])
    expect(document.querySelectorAll('#overlay-layer .selRing')).toHaveLength(0) // no longer local
    expect(document.querySelectorAll('#overlay-layer .remote-sel')).toHaveLength(1) // correctly shows Alice's ring
  })

  test('toggleSelection deselect-to-empty also correctly reveals the remote ring', async () => {
    const { App, awareness } = await bootPeerB()

    App.select('die-1')
    simulateRemoteSelection(awareness, 'die-1')

    App.toggleSelection('die-1') // toggling off my only selected id

    expect(App.getSelectedIds()).toEqual([])
    expect(document.querySelectorAll('#overlay-layer .remote-sel')).toHaveLength(1)
  })
})

describe('soft-lock e2e — oscillation regression (real trace, real tick)', () => {
  test('deselecting a promoted element does not silently re-acquire it on the next tick', async () => {
    vi.useFakeTimers()
    try {
      const { App, awareness } = await bootPeerB()
      simulateRemoteSelection(awareness, 'die-1') // Alice holds it

      // Under fake timers, Date.now() is frozen between synchronous calls —
      // advance a moment so Alice's claim timestamp and Bailey's upcoming
      // request timestamp are distinctly ordered, exactly as real wall-clock
      // execution always naturally guarantees (Alice selected first,
      // chronologically, before Bailey could possibly request it).
      await vi.advanceTimersByTimeAsync(10)

      App.select('die-1') // Bailey requests it (held by another peer)
      expect(App.getSelectedIds()).toEqual([])

      // Advance past the 3s request window — Bailey's real tick (a real
      // setInterval, not a mirrored function) should promote it.
      // Advance past the 3s request window — Bailey's real tick (a real
      // setInterval, not a mirrored function) should promote it. Ticks
      // fire on a 250ms cadence anchored to boot time, not to the request
      // timestamp, so the margin here needs to clear a full extra tick
      // cycle past the 3s window, not just 3s exactly.
      await vi.advanceTimersByTimeAsync(3500)
      expect(App.getSelectedIds()).toEqual(['die-1']) // sanity: acquisition worked

      // Bailey deliberately deselects.
      App.select(null)
      expect(App.getSelectedIds()).toEqual([])

      // Under the old design, App.select(null) never cleared the leftover
      // pendingRequests entry from the original request (it lived on,
      // reused as a makeshift retention timestamp). On the very next tick,
      // that orphaned entry — now that die-1 was no longer in Bailey's own
      // selection — got reclassified as a fresh acquisition bid, and the
      // tick silently re-acquired what was just deliberately let go of,
      // forever. Advancing through several more tick cycles here proves
      // that can't happen anymore: claimedAt lives inside selection itself,
      // so deselecting removes it in the same operation, by construction.
      await vi.advanceTimersByTimeAsync(3000)
      expect(App.getSelectedIds()).toEqual([])

      await vi.advanceTimersByTimeAsync(5000)
      expect(App.getSelectedIds()).toEqual([])

      // The broadcast state itself must be clean too, not just the local
      // getter — nothing lingering for a future tick (mine or anyone
      // else's) to misinterpret.
      const myState = awareness.getLocalState()
      expect(myState?.selection).toBeFalsy()
      expect(myState?.pendingRequests).toBeFalsy()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('soft-lock e2e — multi-select claim defense regression (real trace)', () => {
  // Reproduces a real live bug: A holds two dice in a multi-selection. B
  // requests one of them. A clicks that die to defend it — but since it's
  // already part of a multi-selection, the click goes through
  // App.startMultiDrag (canvas.js), never App.select(), which is the only
  // other place a claim gets refreshed. Without the App.reassertClaim wiring
  // added for this fix, A's claim on that die silently never refreshes, and
  // B's request succeeds despite A visibly clicking to keep it.
  function makeBobRequester(bobAwareness) {
    const bobDoc = new Y.Doc()
    const bobAw  = new awarenessProtocol.Awareness(bobDoc)
    bobAw.setLocalState({ id: 'bob', color: '#00f', grad: null, cursor: null, selection: null })
    return {
      request(elId) {
        bobAw.setLocalStateField('pendingRequests', { [elId]: Date.now() })
        const update = awarenessProtocol.encodeAwarenessUpdate(bobAw, [bobAw.clientID])
        awarenessProtocol.applyAwarenessUpdate(bobAwareness, update, 'network')
      },
    }
  }

  test('clicking a multi-selected die to defend it prevents a pending request from succeeding', async () => {
    vi.useFakeTimers()
    try {
      const { App, awareness, ydoc, yToys } = await bootPeerB()
      await addToy(ydoc, yToys, { id: 'die-2', toyType: 'player_marker', x: 50, y: 0, color: '#abc' })

      // A selects two dice via a real multi-select.
      App.select('die-1')
      App.toggleSelection('die-2')
      expect(App.getSelectedIds().sort()).toEqual(['die-1', 'die-2'])

      // Small gap so Bob's request timestamp is distinctly later than A's
      // original claim — real wall-clock execution always guarantees this;
      // under fake timers, two Date.now() calls with nothing but
      // synchronous code between them return the identical frozen value.
      await vi.advanceTimersByTimeAsync(10)

      const bob = makeBobRequester(awareness)
      bob.request('die-1')

      // A moment later, A clicks die-1 (already part of A's multi-selection)
      // to defend it — the real gesture is canvas.js's multi-move branch,
      // which calls exactly this.
      await vi.advanceTimersByTimeAsync(500)
      App.reassertClaim('die-1')

      // Advance well past Bob's original request window.
      await vi.advanceTimersByTimeAsync(4000)

      // A must still hold both dice — the defend gesture worked.
      expect(App.getSelectedIds().sort()).toEqual(['die-1', 'die-2'])
    } finally {
      vi.useRealTimers()
    }
  })

  test('control: WITHOUT the defend click, the same request succeeds (proves the test is meaningful)', async () => {
    vi.useFakeTimers()
    try {
      const { App, awareness, ydoc, yToys } = await bootPeerB()
      await addToy(ydoc, yToys, { id: 'die-2', toyType: 'player_marker', x: 50, y: 0, color: '#abc' })

      App.select('die-1')
      App.toggleSelection('die-2')

      await vi.advanceTimersByTimeAsync(10)

      const bob = makeBobRequester(awareness)
      bob.request('die-1')

      // No reassertClaim this time — A never defends it.
      await vi.advanceTimersByTimeAsync(4500)

      expect(App.getSelectedIds()).toEqual(['die-2']) // die-1 lost to Bob
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('soft-lock e2e — long single-element drag claim refresh', () => {
  // Complements the multi-select fix above: a drag long enough to outlast
  // the 3s request window should keep defending itself via App.move's
  // throttled reassertClaim call, the same way an active multi-select drag
  // does. select()/startDrag already stamp a fresh claim at gesture start,
  // so both tests below start Bob's request shortly AFTER that — the thing
  // under test is specifically whether ongoing move() calls keep the claim
  // fresh past that point, not the initial claim itself.
  function makeBobRequester(bobAwareness) {
    const bobDoc = new Y.Doc()
    const bobAw  = new awarenessProtocol.Awareness(bobDoc)
    bobAw.setLocalState({ id: 'bob', color: '#00f', grad: null, cursor: null, selection: null })
    return {
      request(elId) {
        bobAw.setLocalStateField('pendingRequests', { [elId]: Date.now() })
        const update = awarenessProtocol.encodeAwarenessUpdate(bobAw, [bobAw.clientID])
        awarenessProtocol.applyAwarenessUpdate(bobAwareness, update, 'network')
      },
    }
  }

  test('periodic move() calls during a genuinely ongoing drag keep defending it', async () => {
    vi.useFakeTimers()
    try {
      const { App, awareness } = await bootPeerB()
      App.select('die-1')
      App.startDrag('die-1')

      await vi.advanceTimersByTimeAsync(10)
      makeBobRequester(awareness).request('die-1')

      // A real, ongoing drag: move() keeps firing, spaced past the
      // throttle interval, well past Bob's original 3s window.
      for (let i = 0; i < 5; i++) {
        await vi.advanceTimersByTimeAsync(1100) // > CLAIM_REFRESH_THROTTLE_MS
        App.move('die-1', i, i)
      }

      expect(App.getSelectedIds()).toEqual(['die-1']) // still holding — defended
    } finally {
      vi.useRealTimers()
    }
  })

  test('control: no further move() calls after the request arrives — the claim goes stale and is lost', async () => {
    // Isolates the mechanism: same starting claim, same request timing —
    // the only difference is whether move() ever fires again afterward.
    vi.useFakeTimers()
    try {
      const { App, awareness } = await bootPeerB()
      App.select('die-1')
      App.startDrag('die-1')

      await vi.advanceTimersByTimeAsync(10)
      makeBobRequester(awareness).request('die-1')

      // No more move() calls — the drag is nominally still "active"
      // (commitMove/cancelMove never ran) but nothing refreshes the claim.
      await vi.advanceTimersByTimeAsync(5500)

      expect(App.getSelectedIds()).toEqual([]) // lost to Bob
    } finally {
      vi.useRealTimers()
    }
  })
})

