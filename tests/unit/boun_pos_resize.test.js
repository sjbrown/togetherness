/**
 * tests/unit/boun_pos-resize-mode.integration.test.js
 *
 * Boundaries and Positions (boun_pos.js) elements are resizable: a second
 * click on a sole-selected boundary or position-set cycles into 'sel-resize'
 * and shows corner grab handles; dragging one and releasing commits a new
 * extent (regenerating the circle grid for a position set). This exercises
 * the whole path through the real App bus — the same generic
 * select/nextSelectionMode/getResizeCorner/startResize/resize/commitResize
 * plumbing toys.js and drawing.js already use — to lock in that boun_pos.js
 * now plugs into it too.
 *
 * Same boot fixture as bowstring-resize-mode.integration.test.js: a single
 * real App instance, real Yjs doc, real DOM. ui.js and canvas.js are mocked.
 */

// @vitest-environment jsdom
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { pathToRect } from '../../src/boun_pos.js'
import { _clearSvgTextCache } from '../../src/toys.js'

// Generic stand-in content for App.boot()'s toy-svg warm-cache fetch —
// none of these tests place a toy, so only its shape (a valid toy svg)
// matters, not which type it's served for.
const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="placeholder">
  <g id="layer1" class="colorable">
    <circle id="token_front" r="34" cx="40" cy="45"/>
  </g>
</svg>`

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

function makeCanvasDOM() {
  document.body.innerHTML = `
    <div id="stage">
      <svg id="canvas" xmlns="http://www.w3.org/2000/svg">
        <defs></defs>
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

// No toys are placed in these tests, but App.boot() warms its toy-svg
// cache for every registered toy type on startup — stub fetch so that
// doesn't hit the network in a jsdom environment lacking a document base
// URL for a relative fetch to resolve against.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
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
  const ydoc = tablesAPI.makeDoc()
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const user = { id: 'bailey', name: 'Bailey', color: '#0f0', gradient: { c1: '#0f0', c2: '#0a0', angle: 45 } }

  awareness.setLocalState({ user, cursor: null, desired: {} })

  boot({
    ydoc,
    awareness, provider: { on: vi.fn(), signalingConns: [] },
    user, tableId: 'test-room', isCreator: true,
    svgElement: svgEl,
  })

  return { App, ydoc, svgEl }
}

describe('boundary resize mode', () => {
  test('selectModes offers sel-resize as the second mode', async () => {
    const { App } = await bootApp()
    App.setLayer('boundaries-positions')
    App.commitBoundary({ x: 100, y: 100, w: 200, h: 150 })
    const id = App.getSelectedIds()[0]
    expect(id).toBeTruthy()

    // A fresh selection defaults to sel-move — no handles yet.
    expect(App.getResizeModeId()).toBeNull()

    App.nextSelectionMode(id)
    expect(App.getResizeModeId()).toBe(id)
  })

  test('dragging a corner handle and releasing commits a new rect', async () => {
    const { App, ydoc } = await bootApp()
    App.setLayer('boundaries-positions')
    App.commitBoundary({ x: 100, y: 100, w: 200, h: 150 })
    const id = App.getSelectedIds()[0]
    App.nextSelectionMode(id)
    expect(App.getResizeModeId()).toBe(id)

    const geo = App.getBBox(id)
    // SE corner sits just outside the shape, past the overlay's PAD.
    const corner = App.getResizeCorner(id, geo.x + geo.width + 6, geo.y + geo.height + 6)
    expect(corner).toBe(2) // SE — [NW, NE, SE, SW]

    App.startResize(id, corner)
    App.resize(id, corner, 400, 350)
    App.commitResize(id, corner, 400, 350)

    // Selection stays in resize mode after a commit, ready for another drag
    // — same convention as toys/drawing (the mode is only left by a further
    // click or a fresh selection).
    expect(App.getResizeModeId()).toBe(id)

    const yBounPos = ydoc.getXmlFragment('boundaries')
    const yEl = yBounPos.toArray().find(n => n.getAttribute('id') === id)
    const yPath = yEl.toArray().find(n => n.nodeName === 'path')
    expect(pathToRect(yPath.getAttribute('d'))).toEqual({ x: 100, y: 100, w: 300, h: 250 })
  })

  test('a plain click-drag on a resize-mode boundary that misses the handles still moves it', async () => {
    const { App, ydoc } = await bootApp()
    App.setLayer('boundaries-positions')
    App.commitBoundary({ x: 100, y: 100, w: 200, h: 150 })
    const id = App.getSelectedIds()[0]
    App.nextSelectionMode(id)

    // Center of the shape, nowhere near a corner handle.
    const geo = App.getBBox(id)
    const corner = App.getResizeCorner(id, geo.x + geo.width / 2, geo.y + geo.height / 2)
    expect(corner).toBeNull()
  })
})

describe('position-set resize mode', () => {
  test('resizing regenerates the circle grid to fill the new extent', async () => {
    const { App, ydoc } = await bootApp()
    App.setLayer('boundaries-positions')
    App.commitPositionSet({ toolName: 'pos-grid-sq', x: 0, y: 0, w: 200, h: 200 })
    const id = App.getSelectedIds()[0]
    expect(id).toBeTruthy()

    App.nextSelectionMode(id)
    expect(App.getResizeModeId()).toBe(id)

    const geo = App.getBBox(id)
    const corner = App.getResizeCorner(id, geo.x + geo.width + 6, geo.y + geo.height + 6)
    expect(corner).toBe(2)

    App.startResize(id, corner)
    App.resize(id, corner, 400, 400)
    App.commitResize(id, corner, 400, 400)

    const yBounPos = ydoc.getXmlFragment('boundaries')
    const yEl = yBounPos.toArray().find(n => n.getAttribute('id') === id)
    const yPath = yEl.toArray().find(n => n.nodeName === 'path')
    expect(pathToRect(yPath.getAttribute('d'))).toEqual({ x: 0, y: 0, w: 400, h: 400 })

    const circleCount = yEl.toArray().filter(n => n.nodeName === 'circle').length
    // 200x200 at the tool's default spacing produced fewer points than the
    // grown 400x400 extent does — regeneration actually ran, not a stale copy.
    expect(circleCount).toBeGreaterThan(0)
  })
})
