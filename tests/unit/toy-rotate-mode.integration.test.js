/**
 * tests/unit/toy-rotate-mode.integration.test.js
 *
 * Toy rotation: a toy whose own embedded <svg> declares class
 * "tt_able_rotate" (chip, single_poker_card in the real templates) offers
 * a 'sel-rotate' select mode, cycling in alongside 'sel-action' (and
 * 'sel-resize', for a toy that also has that). Unlike a rect's
 * 'sel-rotate-pivot', a toy always turns about its own fixed centre — no
 * placeable pivot, no pivot handle — so this exercises the plain
 * 'sel-rotate' path end to end through the real App: the same
 * getRotateModeId/getRotateHandle/startRotate/rotate/commitRotate
 * plumbing drawing-rotate-mode.integration.test.js covers for rects, now
 * proven to also drive a toy.
 *
 * Same boot fixture as bowstring-resize-mode.integration.test.js: a
 * single real App instance, real Yjs doc, real DOM, a fetch-mocked
 * stand-in SVG (a real toyType so TOY_TYPES lookup succeeds; content pared
 * to the one class the whole test cares about). ui.js and canvas.js are
 * mocked.
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

// A stand-in for chip.svg — real toyType 'chip' (so TOY_TYPES['chip']
// exists and addToy's fetch resolves), pared down to the one thing this
// test cares about: tt_able_rotate on the root <svg>. 100x100 so the
// centre and corner math below stays readable. The fetch mock below serves
// this content for whatever toyType is requested.
const ROTATABLE_TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" class="chip tt_able_rotate" id="chip">
  <g id="layer1" class="colorable">
    <circle id="chip_face" r="48" cx="50" cy="50"/>
  </g>
</svg>`

// A second stand-in with NEITHER tt-mode-resize NOR tt_able_rotate — most
// toys (dice, player markers, ...) — to prove the class gate actually
// withholds 'sel-rotate' rather than it always being on.
const PLAIN_TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" class="dice_d6" id="dice_d6">
  <g id="layer1" class="colorable"><rect id="body" x="0" y="0" width="80" height="100"/></g>
</svg>`

let _servedSvg = ROTATABLE_TOY_SVG

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
  _servedSvg = ROTATABLE_TOY_SVG
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => _servedSvg })))
  _clearSvgTextCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

// Boots a real App instance exactly as index.html does, with one 100x100
// rotatable toy ('chip-1') placed centred at (100, 100) — so its bbox is
// x=50,y=50,width=100,height=100 and its centre is exactly (100, 100).
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

async function inRotateMode() {
  const booted = await bootApp()
  booted.App.select('chip-1')
  booted.App.nextSelectionMode('chip-1')   // sel-action -> sel-rotate
  expect(booted.App.getRotateModeId()).toBe('chip-1')
  return booted
}

const toyG = (svgEl, id) => svgEl.querySelector(`[data-id="${id}"]`)

describe('sel-rotate is offered for a tt_able_rotate toy, gated by the class', () => {
  test('a fresh selection is in neither resize nor rotate mode', async () => {
    const { App } = await bootApp()
    App.select('chip-1')
    expect(App.getResizeModeId()).toBeNull()
    expect(App.getRotateModeId()).toBeNull()
  })

  test('one click cycles sel-action -> sel-rotate -> sel-action — no resize step, chip has none', async () => {
    const { App } = await bootApp()
    App.select('chip-1')

    App.nextSelectionMode('chip-1')
    expect(App.getRotateModeId()).toBe('chip-1')
    expect(App.getResizeModeId()).toBeNull()

    App.nextSelectionMode('chip-1')
    expect(App.getRotateModeId()).toBeNull()
  })

  test('a toy with neither tt-mode-resize nor tt_able_rotate never reaches rotate mode', async () => {
    _servedSvg = PLAIN_TOY_SVG
    const { App } = await bootApp()
    App.select('chip-1')   // id is just a label here; content is the plain fixture
    App.nextSelectionMode('chip-1')
    expect(App.getRotateModeId()).toBeNull()
    expect(App.getResizeModeId()).toBeNull()
  })

  test('the toys layer’s snap default is 45°, distinct from the drawing layer’s 15°', async () => {
    const { App } = await bootApp()
    expect(App.getRotateSnapDeg('toys')).toBe(45)
    expect(App.getRotateSnapDeg('drawing')).toBe(15)
  })
})

describe('dragging a toy’s rotate handle', () => {
  test('getRotateHandle finds the corner handles just outside the toy', async () => {
    const { App, id } = { ...(await inRotateMode()), id: 'chip-1' }
    const geo = App.getBBox(id)
    expect(geo).toEqual({ x: 50, y: 50, width: 100, height: 100 })
    // [NW, NE, SE, SW], each just outside its corner.
    expect(App.getRotateHandle(id, geo.x - 6, geo.y - 6)).toBe(0)
    expect(App.getRotateHandle(id, geo.x + geo.width + 6, geo.y + geo.height + 6)).toBe(2)
    expect(App.getRotateHandle(id, geo.x + geo.width / 2, geo.y + geo.height / 2)).toBeNull()
  })

  test('commits a snapped angle to the toy’s outer <g> — 45° steps, not 15°', async () => {
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)               // SE corner, grabbed at 45° from centre (100,100)
    App.rotate(id, 2, 50, 150)           // drag it round to the SW screen position
    App.commitRotate(id, 2, 50, 150)

    expect(toyG(svgEl, id).getAttribute('data-rotate')).toBe('90')
  })

  test('the committed angle lands on a 45° step, never a 15° one', async () => {
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    // ~8° past the SE corner's 45° start — well inside 45°'s snap well,
    // but past what a 15° grain (rects' default) would have kept at 15.
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 145, 160)
    expect(toyG(svgEl, id).getAttribute('data-rotate')).toBe('0')
  })

  test('the rendered toy carries the derived transform about its own centre', async () => {
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 50, 150)   // 90°, per the ground-truth case above

    expect(toyG(svgEl, id).getAttribute('transform')).toBe('rotate(90 100 100)')
  })

  test('cancelling mid-drag leaves the doc untouched', async () => {
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)
    App.rotate(id, 2, 50, 150)
    App.cancelRotate()

    expect(toyG(svgEl, id).getAttribute('data-rotate')).toBeNull()
  })

  test('the toy stays in rotate mode after a commit, ready for another drag', async () => {
    const { App } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 50, 150)
    expect(App.getRotateModeId()).toBe(id)
  })

  test('rotation survives a subsequent move, re-pivoting on the new centre — the pivot never changes, but it does follow', async () => {
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 50, 150)   // 90°

    App.startDrag(id)
    App.commitMove(id, 300, 300)

    expect(toyG(svgEl, id).getAttribute('data-rotate')).toBe('90')
    expect(toyG(svgEl, id).getAttribute('transform')).toBe('rotate(90 300 300)')
  })

  test('the ghost mid-drag already shows the turned toy, not stuck at rotate(deg 0 0)', async () => {
    // The actual bug this feature surfaced: overlay.js's ghost-rotate path
    // used to assume a rect's own shape-keyed getGeom, which returns null
    // for a toy's <g> — collapsing the ghost's pivot to the SVG origin
    // instead of the toy's own centre. Regression-checked directly against
    // the live ghost DOM, not just the post-commit result.
    const { App, svgEl } = await inRotateMode()
    const id = 'chip-1'
    App.startRotate(id, 2)
    App.rotate(id, 2, 50, 150)   // mid-drag — not yet committed

    const ghost = svgEl.querySelector('#overlay-layer [opacity="0.85"][data-rotate]')
    expect(ghost).not.toBeNull()
    expect(ghost.getAttribute('transform')).toBe('rotate(90 100 100)')
    App.cancelRotate()
  })
})
