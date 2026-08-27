/**
 * tests/unit/bowstring-resize-mode.integration.test.js
 *
 * Regression: clicking a resizable toy (tray_sum, bag — anything whose
 * toys.js selectModes() reports both 'sel-action' and 'sel-resize') a
 * second time to enter resize mode left its SE corner still answering to
 * the bowstring handle instead of the resize-corner handle. overlay.js's
 * render() already stops drawing the action square the moment the id
 * enters 'sel-resize'/'sel-resize-r' mode (see its `entry.mode === 'local'`
 * guard), but
 * App.startBowstringAt — which canvas.js's pointerdown consults BEFORE
 * ordinary/resize hit-testing — never checked resize mode itself, so the
 * live gesture kept firing even though nothing was drawn there any more.
 *
 * Fix: App.startBowstringAt bails out as soon as `_resizeModeId === id`.
 *
 * Same boot fixture as soft-lock.integration.test.js / undo-selection.
 * integration.test.js: a single real App instance, real Yjs doc, real
 * Awareness, real DOM. ui.js and canvas.js are mocked.
 */

// @vitest-environment jsdom
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
  restorePanelState:  vi.fn(),
}))

vi.mock('../../src/canvas.js', () => ({
  init:                    vi.fn(),
  getView:                 vi.fn(() => ({ x: 0, y: 0, scale: 1 })),
  leaderId:                vi.fn(),
  setParams:               vi.fn(),
  setTool:                 vi.fn(),
  wireShapeClicks:         vi.fn(),
  syncBackgroundTransform: vi.fn(),
}))

// A stand-in for tray_sum.svg — real toyType (so TOY_TYPES[toyType] exists
// and addToy's fetch resolves), but pared down to the one thing this test
// cares about: the tt-mode-resize class that makes toys.js's selectModes()
// report 'sel-resize' alongside 'sel-action'. The fetch mock below serves
// this content for whatever toyType is requested.
const RESIZABLE_TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" class="tt-mode-resize" id="tray_sum">
  <g id="layer1" class="colorable">
    <rect id="tray_bg" x="0" y="0" width="120" height="120"/>
  </g>
</svg>`

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
        <g id="delight-layer" pointer-events="none"></g>
      </svg>
    </div>
  `
  return document.getElementById('canvas')
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => RESIZABLE_TOY_SVG })))
  _clearSvgTextCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Boots a real App instance exactly as index.html does.
async function bootApp() {
  const svgEl = makeCanvasDOM()
  const { boot, App } = await import('../../src/app.js')
  const { tablesAPI } = await import('../../src/tables.js')
  const ydoc  = tablesAPI.makeDoc()
  const layerEl = svgEl.querySelector('#toys-layer')
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const myGrad = { c1: '#0f0', c2: '#0a0', angle: 45 }

  await addToy(ydoc, layerEl, { id: 'tray-1', toyType: 'tray_sum', x: 100, y: 100, color: '#abc' })

  awareness.setLocalState({ id: 'bailey', color: myGrad.c1, grad: myGrad, cursor: null, desired: {} })

  boot({
    ydoc,
    awareness, provider: { on: vi.fn(), signalingConns: [] },
    myId: 'bailey', myGrad, tableId: 'test-room', isCreator: true,
    svgElement: svgEl, displayName: 'Bailey',
  })

  return { App, ydoc, svgEl }
}

describe('bowstring vs. resize mode on a resizable toy (tray_sum/bag-like)', () => {
  test('plain selection still offers the bowstring at the SE corner', async () => {
    const { App } = await bootApp()
    App.select('tray-1')

    const geo = App.getBBox('tray-1')
    // Mirrors delight.js's bowstringOrigin: SE corner + PAD(6).
    const point = { x: geo.x + geo.width + 6, y: geo.y + geo.height + 6 }

    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, point)).toBe(true)
    App.endBowstring({ pointerId: 1 })
  })

  test('entering resize mode stops the SE corner from starting a bowstring gesture', async () => {
    const { App } = await bootApp()
    App.select('tray-1')
    App.nextSelectionMode('tray-1')
    expect(App.getResizeModeId()).toBe('tray-1')

    const geo = App.getBBox('tray-1')
    const point = { x: geo.x + geo.width + 6, y: geo.y + geo.height + 6 }

    // Same point that fired the bowstring before resize mode — now it must
    // decline, so canvas.js falls through to the resize-corner hit-test.
    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, point)).toBe(false)
  })

  test('the resize-corner hit-test itself still recognizes the SE corner once in resize mode', async () => {
    const { App } = await bootApp()
    App.select('tray-1')
    App.nextSelectionMode('tray-1')

    const geo = App.getBBox('tray-1')
    const corner = App.getResizeCorner('tray-1', geo.x + geo.width, geo.y + geo.height)

    // Overlay.hitTestResizeCorner returns an index into resizeCorners's
    // [NW, NE, SE, SW] order — 2 is SE, the corner nearest the bowstring's
    // resting spot.
    expect(corner).toBe(2)
  })

})
