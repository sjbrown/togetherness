/**
 * tests/unit/undo-selection.integration.test.js
 *
 * Regression: moving a toy, then pressing Undo, left the selection ring
 * (selRing) rendered at the pre-undo position — the claim itself still
 * pointed at the toy, but the geometry it was drawn from no longer matched
 * reality. Fix: App.undo()/App.redo() abandon all selection claims
 * unconditionally, the same way a plain click on empty canvas does
 * (_clearClaims — see App.select's null-id branch).
 *
 * Same boot fixture as soft-lock.integration.test.js: a single real App
 * instance, real Yjs doc, real Awareness, real DOM. ui.js and canvas.js
 * are mocked — this isn't a gesture test, just app.js/overlay.js/toys.js
 * wiring for the claim-clearing behaviour itself.
 */

// @vitest-environment jsdom
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  addToy, findToyDom, applyMoveDom, runGesture, _clearSvgTextCache,
} from '../../src/toys.js'

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

const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="player_marker">
  <g id="layer1" class="colorable">
    <circle id="token_front" r="34" cx="40" cy="45"/>
  </g>
</svg>`

// Same #canvas structure as src/index.html — app.js/overlay.js throw
// loudly (or silently fail to find things) if these are missing.
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
  const ydoc  = tablesAPI.makeDoc()
  const layerEl = svgEl.querySelector('#toys-layer')
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const myGrad = { c1: '#0f0', c2: '#0a0', angle: 45 }

  await addToy(ydoc, layerEl, { id: 'die-1', toyType: 'player_marker', x: 0, y: 0, color: '#abc' })

  awareness.setLocalState({ id: 'bailey', color: myGrad.c1, grad: myGrad, cursor: null, desired: null })

  boot({
    ydoc,
    awareness, provider: { on: vi.fn(), signalingConns: [] },
    myId: 'bailey', myGrad, tableId: 'test-room', isCreator: true,
    svgElement: svgEl, displayName: 'Bailey',
  })

  return { App, ydoc, svgEl }
}

describe('App.undo / App.redo abandon selection claims', () => {
  test('undoing a move clears the current selection', async () => {
    const { App, ydoc, svgEl } = await bootApp()
    const layerEl = svgEl.querySelector('#toys-layer')

    // A real, undoable gesture authored by this client — a move, exactly
    // the scenario in the bug report.
    const el = findToyDom(layerEl, 'die-1')
    runGesture(ydoc, layerEl, () => applyMoveDom(el, 300, 300), {
      gesture: 'move', authorId: 'bailey', tableId: 'test-room',
    })

    App.select('die-1')
    expect(App.getSelectedIds()).toEqual(['die-1'])

    App.undo()

    expect(App.getSelectedIds()).toEqual([])
  })

  test('redoing also clears the current selection', async () => {
    const { App, ydoc, svgEl } = await bootApp()
    const layerEl = svgEl.querySelector('#toys-layer')

    const el = findToyDom(layerEl, 'die-1')
    runGesture(ydoc, layerEl, () => applyMoveDom(el, 300, 300), {
      gesture: 'move', authorId: 'bailey', tableId: 'test-room',
    })

    App.undo()          // sets up something to redo
    App.select('die-1')
    expect(App.getSelectedIds()).toEqual(['die-1'])

    App.redo()

    expect(App.getSelectedIds()).toEqual([])
  })

  test('undo with nothing to undo still clears selection', async () => {
    const { App } = await bootApp()

    App.select('die-1')
    expect(App.getSelectedIds()).toEqual(['die-1'])

    App.undo() // no toy gesture and no drawing/bounds history exists

    expect(App.getSelectedIds()).toEqual([])
  })
})
