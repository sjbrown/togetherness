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

  return { App, ydoc, svgEl, awareness }
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

  test('a rect uses the placeable-pivot variant; sel-rotate is reserved for toys', async () => {
    const { App, awareness, id } = await bootWithSquare()
    App.nextSelectionMode(id)
    App.nextSelectionMode(id)
    // The mode name is what peers see on the wire, so it is the contract.
    expect(awareness.getLocalState().mode).toBe('sel-rotate-pivot')
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
    // The middle is the pivot handle's home, so it answers there now.
    expect(App.getRotateHandle(id, geo.x + geo.width / 2, geo.y + geo.height / 2)).toBe('pivot')
    // Somewhere on the shape that is neither a corner nor the pivot.
    expect(App.getRotateHandle(id, geo.x + geo.width / 4, geo.y + geo.height / 2)).toBeNull()
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
  // Where a point in the shape's own unrotated space actually lands on the
  // canvas, once its rotation is applied. The corner the user is NOT dragging
  // has to come out of a resize at the same canvas point it went in at —
  // that is what "the opposite corner stays fixed" means to someone looking
  // at the screen.
  const onCanvas = (yEl, local) => {
    const n   = (k) => Number(yEl.getAttribute(k))
    const deg = Number(yEl.getAttribute('data-rotate') ?? 0)
    const cx  = n('x') + n('width') / 2
    const cy  = n('y') + n('height') / 2
    const r   = deg * Math.PI / 180
    const dx  = local.x - cx, dy = local.y - cy
    return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) }
  }
  const nw = (yEl) => ({ x: Number(yEl.getAttribute('x')), y: Number(yEl.getAttribute('y')) })

  // applyResize rounds x/y/width/height to whole numbers before they reach the
  // document, so the anchor can land up to about a pixel off the exact answer.
  // That is the rounding, not the correction — without the correction it slides
  // tens of pixels (see the naive case in the commit message's numbers).
  const expectAnchorHeld = (before, after) => {
    const now = onCanvas(after, nw(after))
    expect(Math.abs(now.x - before.x)).toBeLessThan(1)
    expect(Math.abs(now.y - before.y)).toBeLessThan(1)
  }

  // Turn the rect, then cycle back round to resize mode.
  async function rotatedThenResizing(commitAt) {
    const b = await bootWithSquare()
    b.App.nextSelectionMode(b.id)
    b.App.nextSelectionMode(b.id)
    b.App.startRotate(b.id, 2)
    b.App.commitRotate(b.id, 2, commitAt.x, commitAt.y)
    b.App.nextSelectionMode(b.id)
    b.App.nextSelectionMode(b.id)
    expect(b.App.getResizeModeId()).toBe(b.id)
    return b
  }

  test('the pointer is measured in the shape\u2019s own turned frame, not the screen\u2019s', async () => {
    const { App, ydoc, id } = await rotatedThenResizing({ x: 100, y: 300 })  // 90°
    // At 90° the SE handle is drawn where the NE corner's unrotated position
    // would be — down and left of centre on screen.
    expect(App.getResizeCorner(id, 94, 306)).toBe(2)

    App.startResize(id, 2)
    // Screen (50, 350) is local (350, 350) once un-rotated by the 90°.
    App.commitResize(id, 2, 50, 350)

    const yEl = yRect(ydoc, id)
    expect(yEl.getAttribute('width')).toBe('250')
    expect(yEl.getAttribute('height')).toBe('250')
    expect(yEl.getAttribute('data-rotate')).toBe('90')
  })

  test('the opposite corner stays put on the canvas, not just in local space', async () => {
    const { App, ydoc, id } = await rotatedThenResizing({ x: 100, y: 300 })  // 90°
    const anchorBefore = onCanvas(yRect(ydoc, id), nw(yRect(ydoc, id)))

    App.startResize(id, 2)
    App.commitResize(id, 2, 50, 350)

    expectAnchorHeld(anchorBefore, yRect(ydoc, id))
  })

  test('holds at an angle that is not a quarter turn, where the slide is worst', async () => {
    // 45°: the pivot shift and the rotation compound instead of cancelling.
    const { App, ydoc, id } = await rotatedThenResizing({ x: 200, y: 400 })
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('45')
    const anchorBefore = onCanvas(yRect(ydoc, id), nw(yRect(ydoc, id)))

    const corner = App.getResizeCorner(id, ...Object.values(
      // the SE handle's screen position at 45°, padded out like the overlay draws it
      (() => { const g = App.getBBox(id); const c = { x: g.x + g.width / 2, y: g.y + g.height / 2 }
               const d = { x: g.width / 2 + 6, y: g.height / 2 + 6 }
               const r = Math.PI / 4
               return { x: c.x + d.x * Math.cos(r) - d.y * Math.sin(r),
                        y: c.y + d.x * Math.sin(r) + d.y * Math.cos(r) } })()))
    expect(corner).toBe(2)

    App.startResize(id, corner)
    App.commitResize(id, corner, 260, 420)

    expect(Number(yRect(ydoc, id).getAttribute('width'))).toBeGreaterThan(200)
    expectAnchorHeld(anchorBefore, yRect(ydoc, id))
  })

  test('an unrotated rect is untouched by the correction — plain local-space resize', async () => {
    const { App, ydoc, id } = await bootWithSquare()
    App.nextSelectionMode(id)
    App.startResize(id, 2)
    App.commitResize(id, 2, 350, 350)

    const yEl = yRect(ydoc, id)
    expect(yEl.getAttribute('x')).toBe('100')
    expect(yEl.getAttribute('y')).toBe('100')
    expect(yEl.getAttribute('width')).toBe('250')
    expect(yEl.getAttribute('height')).toBe('250')
  })
})

describe('placing the pivot', () => {
  const yAttr = (ydoc, id, k) => Number(yRect(ydoc, id).getAttribute(k))

  // Where a point in the shape's own space lands on the canvas, read straight
  // off the document.
  const onCanvas = (yEl, local) => {
    const n    = (k) => Number(yEl.getAttribute(k))
    const deg  = Number(yEl.getAttribute('data-rotate') ?? 0)
    const fx   = Number(yEl.getAttribute('data-pivot-x') ?? 0.5)
    const fy   = Number(yEl.getAttribute('data-pivot-y') ?? 0.5)
    const cx   = n('x') + fx * n('width'), cy = n('y') + fy * n('height')
    const r    = deg * Math.PI / 180
    const dx   = local.x - cx, dy = local.y - cy
    return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) }
  }
  const nw = (yEl) => ({ x: Number(yEl.getAttribute('x')), y: Number(yEl.getAttribute('y')) })

  async function inPivotMode() {
    const b = await bootWithSquare()
    b.App.nextSelectionMode(b.id)
    b.App.nextSelectionMode(b.id)
    expect(b.App.getRotateModeId()).toBe(b.id)
    return b
  }

  test('the pivot handle is reported where the pivot is, and answers the hit test', async () => {
    const { App, id } = await inPivotMode()
    expect(App.getPivot(id)).toEqual({ fx: 0.5, fy: 0.5, cx: 200, cy: 200 })
    expect(App.getRotateHandle(id, 200, 200)).toBe('pivot')
  })

  test('a drag writes fractions of the shape, snapped to a notable point', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.movePivot(id, 104, 297)          // near the SW corner of a 100,100 200x200 rect
    App.commitPivot(id, 104, 297)

    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0')
    expect(yRect(ydoc, id).getAttribute('data-pivot-y')).toBe('1')
  })

  test('placing a pivot on an UNROTATED shape moves nothing', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, 100, 300)

    expect(yAttr(ydoc, id, 'x')).toBe(100)
    expect(yAttr(ydoc, id, 'y')).toBe(100)
  })

  test('placing a pivot on a ROTATED shape leaves it exactly where it was', async () => {
    const { App, ydoc, id } = await inPivotMode()
    // Turn it first.
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 100, 300)          // 90°
    const before = onCanvas(yRect(ydoc, id), nw(yRect(ydoc, id)))

    App.nextSelectionMode(id); App.nextSelectionMode(id); App.nextSelectionMode(id)
    expect(App.getRotateModeId()).toBe(id)
    App.startPivotDrag(id)
    // Canvas (100, 300) on a shape turned 90°; the handle is drawn inside the
    // rotated furniture, so the drop point is un-rotated into the shape's own
    // frame before it becomes fractions — landing on the SE corner locally.
    App.commitPivot(id, 100, 300)

    const after = yRect(ydoc, id)
    expect(after.getAttribute('data-pivot-x')).toBe('1')
    expect(after.getAttribute('data-pivot-y')).toBe('1')
    // x/y moved to compensate...
    expect(yAttr(ydoc, id, 'x')).not.toBe(100)
    // ...precisely so the shape did not.
    const now = onCanvas(after, nw(after))
    expect(Math.abs(now.x - before.x)).toBeLessThan(1)
    expect(Math.abs(now.y - before.y)).toBeLessThan(1)
  })

  test('the new pivot is what the next rotation turns about', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, 100, 100)              // NW corner
    expect(App.getPivot(id)).toMatchObject({ fx: 0, fy: 0, cx: 100, cy: 100 })

    App.startRotate(id, 2)
    App.commitRotate(id, 2, 300, 100)          // drag the SE corner up to the NE
    expect(yRect(ydoc, id).getAttribute('data-rotate')).toBe('315')
  })

  test('reset puts the pivot back in the middle', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, 100, 100)
    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0')

    App.resetPivot(id)
    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0.5')
    expect(yRect(ydoc, id).getAttribute('data-pivot-y')).toBe('0.5')
  })

  test('reset holds a rotated shape in place, same as a drag does', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, 100, 100)              // pivot to the NW corner
    // A commit leaves the element in the same mode, and sel-rotate-pivot
    // drives both gestures — no cycling needed between them.
    App.startRotate(id, 2)
    App.commitRotate(id, 2, 300, 100)          // turn it about that corner

    const before = onCanvas(yRect(ydoc, id), nw(yRect(ydoc, id)))
    App.resetPivot(id)
    const after = yRect(ydoc, id)

    expect(after.getAttribute('data-pivot-x')).toBe('0.5')
    const now = onCanvas(after, nw(after))
    expect(Math.abs(now.x - before.x)).toBeLessThan(1)
    expect(Math.abs(now.y - before.y)).toBeLessThan(1)
  })

  test('reset on an already-centred pivot is a no-op, not a redundant write', async () => {
    const { App, ydoc, id } = await inPivotMode()
    const before = yRect(ydoc, id).getAttribute('x')
    App.resetPivot(id)
    expect(yRect(ydoc, id).getAttribute('x')).toBe(before)
  })

  test('reset does nothing outside pivot mode', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, 100, 100)
    App.nextSelectionMode(id)                  // leave sel-rotate-pivot
    App.resetPivot(id)
    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0')
  })

  test('cancelling a pivot drag writes nothing', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.movePivot(id, 100, 300)
    App.cancelPivot()

    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0.5')
    expect(yAttr(ydoc, id, 'x')).toBe(100)
  })

  test('the snap tolerance is a settable seam, like the rotate step', async () => {
    const { App, ydoc, id } = await inPivotMode()
    expect(App.getPivotSnapFraction()).toBeCloseTo(0.08)

    App.setPivotSnapFraction(0)                // free placement
    App.startPivotDrag(id)
    App.commitPivot(id, 120, 140)              // 10% / 20% in — would have snapped to the corner
    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0.1')
    expect(yRect(ydoc, id).getAttribute('data-pivot-y')).toBe('0.2')

    App.setPivotSnapFraction(0.08)
  })

  test('a pivot dragged beyond the shape is clamped to its edge, never outside', async () => {
    const { App, ydoc, id } = await inPivotMode()
    App.startPivotDrag(id)
    App.commitPivot(id, -9999, 9999)

    expect(yRect(ydoc, id).getAttribute('data-pivot-x')).toBe('0')
    expect(yRect(ydoc, id).getAttribute('data-pivot-y')).toBe('1')
  })
})
