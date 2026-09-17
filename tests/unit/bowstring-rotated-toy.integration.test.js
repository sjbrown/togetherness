/**
 * tests/unit/bowstring-rotated-toy.integration.test.js
 *
 * Regression: a rotated toy's action handle (the bowstring square at the
 * SE corner of its selection ring) doesn't get clicks or drags. overlay.js
 * draws the resting square at the shape's UNROTATED SE corner and wraps
 * the whole selection decor group in a `rotate(deg cx cy)` transform (see
 * overlay.js's decorGroup/render()) — so on screen, the square ends up at
 * the ROTATED position. But App.startBowstringAt (which canvas.js's
 * pointerdown consults before ordinary hit-testing) and delight.js's own
 * live-gesture chrome both measured against the raw UNROTATED corner, with
 * no rotation compensation at all. A click on the visible (rotated) square
 * landed on empty canvas; a click on the old (rotated-away) corner would
 * have hit it, but nothing draws there any more.
 *
 * Fix: delight.js's bowstringOrigin/hitTestBowstring/startBowstring all
 * take the same { deg, cx, cy } App.getRotation returns and rotate the SE
 * corner the same way overlay.js's decorGroup does; App.startBowstringAt
 * passes it through.
 *
 * Same boot fixture as bowstring-resize-mode.integration.test.js: a single
 * real App instance, real Yjs doc, real Awareness, real DOM. ui.js and
 * canvas.js are mocked.
 */

// @vitest-environment jsdom
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, applyRotateDom, _clearSvgTextCache } from '../../src/toys.js'
import { bowstringOrigin } from '../../src/delight.js'

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
  restoreLayerState:  vi.fn(),
  saveLayerState:     vi.fn(),
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

// A stand-in for chip.svg — real toyType (so TOY_TYPES[toyType] exists and
// addToy's fetch resolves), pared down to the one thing this test cares
// about: the tt_able_rotate class that makes toys.js's selectModes()
// report 'sel-rotate' alongside 'sel-action'.
const ROTATABLE_TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" class="chip tt_able_rotate" id="chip">
  <circle cx="50" cy="50" r="50"/>
</svg>`

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

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => ROTATABLE_TOY_SVG })))
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
  const user = { id: 'bailey', name: 'Bailey', color: '#0f0', gradient: { c1: '#0f0', c2: '#0a0', angle: 45 } }

  await addToy(ydoc, layerEl, { id: 'chip-1', toyType: 'chip', x: 100, y: 100, color: '#abc' })

  awareness.setLocalState({ user, cursor: null, desired: {} })

  boot({
    ydoc,
    awareness, provider: { on: vi.fn(), signalingConns: [] },
    user, tableId: 'test-room', isCreator: true,
    svgElement: svgEl,
  })

  return { App, ydoc, svgEl }
}

describe('bowstring handle on a rotated toy (chip-like)', () => {
  test('unrotated: the bowstring still fires at the plain SE corner (sanity)', async () => {
    const { App } = await bootApp()
    App.select('chip-1')

    const geo = App.getBBox('chip-1')
    const point = { x: geo.x + geo.width + 6, y: geo.y + geo.height + 6 }

    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, point)).toBe(true)
    App.endBowstring({ pointerId: 1 })
  })

  test('rotated 90°: a click at the OLD un-rotated corner misses — nothing is drawn there any more', async () => {
    const { App, svgEl } = await bootApp()
    App.select('chip-1')

    const chipEl = svgEl.querySelector('[data-id="chip-1"]')
    applyRotateDom(chipEl, 90)

    const geo = App.getBBox('chip-1') // still the unrotated bbox
    const stalePoint = { x: geo.x + geo.width + 6, y: geo.y + geo.height + 6 }

    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, stalePoint)).toBe(false)
  })

  test('rotated 90°: a click where the handle is actually drawn fires the bowstring', async () => {
    const { App, svgEl } = await bootApp()
    App.select('chip-1')

    const chipEl = svgEl.querySelector('[data-id="chip-1"]')
    applyRotateDom(chipEl, 90)

    const geo = App.getBBox('chip-1')
    const rot = App.getRotation('chip-1')
    expect(rot?.deg).toBe(90) // sanity: the rotation really took

    // Same math overlay.js's decorGroup uses to place the resting square on
    // screen — this is what the user actually clicks on.
    const onScreenPoint = bowstringOrigin(geo, rot)

    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, onScreenPoint)).toBe(true)
    App.endBowstring({ pointerId: 1 })
  })

  test('rotated 90°: the live gesture’s own handle chrome starts at the rotated point too', async () => {
    const { App, svgEl } = await bootApp()
    App.select('chip-1')

    const chipEl = svgEl.querySelector('[data-id="chip-1"]')
    applyRotateDom(chipEl, 90)

    const geo = App.getBBox('chip-1')
    const rot = App.getRotation('chip-1')
    const onScreenPoint = bowstringOrigin(geo, rot)

    expect(App.startBowstringAt({ pointerId: 1, clientX: 0, clientY: 0 }, onScreenPoint)).toBe(true)

    // delight.js draws its live handle chrome at the gesture's own origin —
    // find the handle group it just built and check it landed on the same
    // rotated point, not the stale unrotated one.
    const delightLayer = svgEl.querySelector('#delight-layer')
    const handle = delightLayer.querySelector('.handleGroup')
    expect(handle.getAttribute('transform')).toBe(`translate(${onScreenPoint.x} ${onScreenPoint.y})`)

    App.endBowstring({ pointerId: 1 })
  })
})
