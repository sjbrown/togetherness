/**
 * tests/unit/drawing-rotate-mode.integration.test.js
 *
 * Rects are rotatable: a third click on a sole-selected rect cycles past
 * 'sel-resize' into 'sel-rotate' and shows round corner handles; dragging
 * one and releasing commits a snapped angle. This exercises the whole path
 * through the real App bus — getRotateModeId/getRotateHandle/startRotate/
 * rotate/commitRotate — the rotate twin of the resize plumbing covered by
 * boun_pos_resize.test.js.
 *
 * Same boot fixture as that file: one real App instance, real Yjs doc, real
 * DOM. ui.js and canvas.js are mocked.
 */

// @vitest-environment jsdom
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { _clearSvgTextCache } from '../../src/toys.js'

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

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
  _clearSvgTextCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

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

// A 200x200 square at (100,100) — centre (200,200), so every corner sits on
// a 45° diagonal and the expected angles are readable by eye.
async function bootWithSquare() {
  const booted = await bootApp()
  booted.App.setLayer('drawing')
  booted.App.commitDrawing({ type: 'rect', x: 100, y: 100, width: 200, height: 200, fill: '#c8941e' })
  const id = booted.ydoc.getXmlFragment('drawing').toArray()[0].getAttribute('id')
  booted.App.select(id)
  return { ...booted, id }
}

const yRect = (ydoc, id) =>
  ydoc.getXmlFragment('drawing').toArray().find(n => n.getAttribute('id') === id)

describe('rotate is the third mode in a rect’s cycle', () => {
  test('a fresh selection is in neither resize nor rotate mode', async () => {
    const { App } = await bootWithSquare()
    expect(App.getResizeModeId()).toBeNull()
    expect(App.getRotateModeId()).toBeNull()
  })

  test('one click gives resize, a second gives rotate, a third returns to move', async () => {
    const { App, id } = await bootWithSquare()

    App.nextSelectionMode(id)
    expect(App.getResizeModeId()).toBe(id)
    expect(App.getRotateModeId()).toBeNull()

    App.nextSelectionMode(id)
    expect(App.getRotateModeId()).toBe(id)
    expect(App.getResizeModeId()).toBeNull()

    App.nextSelectionMode(id)
    expect(App.getRotateModeId()).toBeNull()
    expect(App.getResizeModeId()).toBeNull()
  })

  test('a circle never reaches rotate mode — it has no rotate handles to offer', async () => {
    const { App, ydoc } = await bootApp()
    App.setLayer('drawing')
    App.commitDrawing({ type: 'circle', cx: 200, cy: 200, r: 50, fill: '#5a7ea8' })
    const id = ydoc.getXmlFragment('drawing').toArray()[0].getAttribute('id')
    App.select(id)

    App.nextSelectionMode(id) // sel-resize-r
    expect(App.getResizeModeId()).toBe(id)
    App.nextSelectionMode(id) // back to sel-move
    expect(App.getRotateModeId()).toBeNull()
    expect(App.getResizeModeId()).toBeNull()
  })
})

describe('dragging a rotate handle', () => {
  // Cycle into rotate mode and return the NE handle's corner index.
  async function inRotateMode() {
    const booted = await bootWithSquare()
    booted.App.nextSelectionMode(booted.id)
    booted.App.nextSelectionMode(booted.id)
    expect(booted.App.getRotateModeId()).toBe(booted.id)
    return booted
  }

  test('getRotateHandle finds the corner handles just outside the shape', async () => {
    const { App, id } = await inRotateMode()
    const geo = App.getBBox(id)
    // [NW, NE, SE, SW], each PAD outside its corner.
    expect(App.getRotateHandle(id, geo.x - 6, geo.y - 6)).toBe(0)
    expect(App.getRotateHandle(id, geo.x + geo.width + 6, geo.y + geo.height + 6)).toBe(2)
    expect(App.getRotateHandle(id, geo.x + geo.width / 2, geo.y + geo.height / 2)).toBeNull()
  })

  test('getRotateHandle returns nothing while the element is in resize mode', async () => {
    const { App, id } = await bootWithSquare()
    App.nextSelectionMode(id) // sel-resize only
    const geo = App.getBBox(id)
    expect(App.getRotateHandle(id, geo.x + geo.width + 6, geo.y + geo.height + 6)).toBeNull()
  })

  test('commits a snapped angle to the doc — a quarter turn of the SE corner is 90°', async () => {
    const { App, ydoc, id } = await inRotateMode()
    App.startRotate(id, 2)              // SE corner, at 45° from centre (200,200)
    App.rotate(id, 2, 100, 300)         // drag it round to 135°
    App.commitRotate(id, 2, 100, 300)

    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('90')
  })

  test('the committed angle lands on a 15° step, never between them', async () => {
    const { App, ydoc, id } = await inRotateMode()
    // ~4° past the SE corner's 45°, which snaps back to 0.
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 293, 307)
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('0')

    // ~11° past, which snaps up to 15.
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 280, 316)
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('15')
  })

  test('the snap step is a settable seam, not a hard-coded 15', async () => {
    const { App, ydoc, id } = await inRotateMode()
    expect(App.getRotateSnapDeg()).toBe(15)

    App.setRotateSnapDeg(90)
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 280, 316)   // ~11° — far from 90, so snaps to 0
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('0')

    App.setRotateSnapDeg(5)
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 280, 316)
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('10')

    App.setRotateSnapDeg(15)
  })

  test('the rendered rect carries the derived transform about its own centre', async () => {
    const { App, svgEl, id } = await inRotateMode()
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 100, 300)

    const domEl = svgEl.querySelector(`[data-id="${id}"]`)
    expect(domEl.getAttribute('transform')).toBe('rotate(90 200 200)')
  })

  test('cancelling mid-drag leaves the doc untouched', async () => {
    const { App, ydoc, id } = await inRotateMode()
    App.startRotate(id, 2)
    App.rotate(id, 2, 100, 300)
    App.cancelRotate()

    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('0')
  })

  test('the element stays in rotate mode after a commit, ready for another drag', async () => {
    const { App, id } = await inRotateMode()
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 100, 300)
    expect(App.getRotateModeId()).toBe(id)
  })

  test('rotation survives a subsequent move, re-pivoting on the new centre', async () => {
    const { App, ydoc, svgEl, id } = await inRotateMode()
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 100, 300)

    App.startDrag(id)
    App.commitMove(id, 300, 300)

    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('90')
    expect(svgEl.querySelector(`[data-id="${id}"]`).getAttribute('transform'))
      .toBe('rotate(90 400 400)')
  })
})

describe('resizing an already-rotated rect', () => {
  test('the pointer is measured in the shape’s own turned frame, not the screen’s', async () => {
    const { App, ydoc, id } = await bootWithSquare()
    // Turn it a quarter turn, then resize by its (now rotated) SE handle.
    App.nextSelectionMode(id)
    App.nextSelectionMode(id)
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 100, 300)   // 90°

    // Back round the cycle into resize mode.
    App.nextSelectionMode(id)
    App.nextSelectionMode(id)
    expect(App.getResizeModeId()).toBe(id)

    // At 90°, the SE handle is drawn where the NE corner's unrotated
    // position would be — down and left of centre on screen.
    const corner = App.getRotateHandle(id, 0, 0) // wrong mode: nothing
    expect(corner).toBeNull()
    expect(App.getResizeCorner(id, 94, 306)).toBe(2)

    App.startResize(id, 2)
    // Screen (50, 350) is local (350, 350) once un-rotated by the 90°.
    App.commitResize(id, 2, 50, 350)

    const yEl = yRect(ydoc, id)
    // Local-space SE drag: the top-left stays put and the box grows by 50
    // on each side, even though the screen-space drag was down-and-left.
    expect(yEl.getAttribute('x')).toBe('100')
    expect(yEl.getAttribute('y')).toBe('100')
    expect(yEl.getAttribute('width')).toBe('250')
    expect(yEl.getAttribute('height')).toBe('250')
    expect(yEl.getAttribute('data-rotate')).toBe('90')
  })
})
