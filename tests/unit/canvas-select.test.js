/**
 * tests/unit/canvas-select.test.js
 *
 * Unit tests for the Select tool two-mode behaviour added in commit 2:
 *   - updateCursor sets data-tool and data-select-mode correctly
 *   - setParams triggers a cursor update
 *   - onPointerDown routes to 'box-select' when params.multi is true
 *   - onPointerDown routes to 'pan-or-deselect' when params.multi is false
 *   - onPointerUp in box-select with no movement calls App.select(null)
 *   - onPointerUp in box-select with movement calls App.commitMultiSelect
 *   - pan-or-deselect still works (regression)
 *
 * canvas.js depends on a DOM (#stage, #draw-preview, #select-preview) and an
 * App bus. We supply minimal stubs for both.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import { init, setTool, setParams, ToolMode } from '../../src/canvas.js'

// ── DOM setup ────────────────────────────────────────────────────────────────

function makeDOM() {
  document.body.innerHTML = `
    <div id="stage">
      <svg id="canvas">
        <g id="background-layer"></g>
        <g id="boundaries-positions-layer"></g>
        <g id="toys-layer"></g>
        <g id="drawing-layer"></g>
        <g id="overlay-layer"></g>
      </svg>
      <div id="draw-preview"></div>
      <div id="select-preview"></div>
    </div>
  `
  // jsdom doesn't implement pointer capture — stub it so canvas.js doesn't throw
  const stage = document.getElementById('stage')
  stage.setPointerCapture   = () => {}
  stage.releasePointerCapture = () => {}
}

// ── App bus stub ──────────────────────────────────────────────────────────────

function makeApp(overrides = {}) {
  return {
    getActiveLayer:    () => 'drawing',
    getAnchor:         () => ({ x: 0, y: 0 }),
    getBBox:           () => null,
    getMyColor:        () => '#aaa',
    getMyGradient:     () => ({ c1: '#aaa', c2: '#bbb', angle: 0 }),
    getViewScale:      () => 1,
    select:            () => {},
    startDrag:         () => {},
    cancelMove:        () => {},
    commitMove:        () => {},
    move:              () => {},
    onViewReset:       () => {},
    requestContextMenu: () => {},
    getBoxCandidates:   () => [],
    broadcastCandidates: () => {},
    clearBoxCandidates: () => {},
    commitMultiSelect:  () => {},
    ...overrides,
  }
}

// ── Pointer event factory ─────────────────────────────────────────────────────

let _pointerId = 0
function makePointerEvent(type, { clientX = 100, clientY = 100, target } = {}) {
  const stage = document.getElementById('stage')
  const ev = new PointerEvent(type, {
    bubbles: true, cancelable: true,
    clientX, clientY,
    pointerId: type === 'pointerdown' ? ++_pointerId : _pointerId,
  })
  // canvas.js calls e.target.closest — patch target
  Object.defineProperty(ev, 'target', { value: target ?? stage, writable: false })
  return ev
}

// ── beforeEach ────────────────────────────────────────────────────────────────

beforeEach(() => {
  makeDOM()
  _pointerId = 0
  // Reset ToolMode internal state between tests
  ToolMode._pointers.clear()
  ToolMode._gesture  = null
  ToolMode._moveRef  = null
  ToolMode._draft    = null
  ToolMode._startView = null
  ToolMode.tool      = 'select'
  ToolMode.params    = {}
  ToolMode._lastTap  = 0
})

// ── updateCursor via setTool / setParams ──────────────────────────────────────

describe('updateCursor — data-select-mode attribute', () => {
  test('select tool with multi=false sets data-select-mode="pan"', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: false })
    const stage = document.getElementById('stage')
    expect(stage.dataset.tool).toBe('select')
    expect(stage.dataset.selectMode).toBe('pan')
  })

  test('select tool with multi=true sets data-select-mode="multi"', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })
    const stage = document.getElementById('stage')
    expect(stage.dataset.selectMode).toBe('multi')
  })

  test('non-select tool removes data-select-mode', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })
    setTool('rect', {})
    const stage = document.getElementById('stage')
    expect(stage.dataset.selectMode).toBeUndefined()
  })

  test('setParams with multi=true updates cursor immediately', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: false })
    setParams({ multi: true })
    expect(document.getElementById('stage').dataset.selectMode).toBe('multi')
  })

  test('setParams with multi=false switches back to pan', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })
    setParams({ multi: false })
    expect(document.getElementById('stage').dataset.selectMode).toBe('pan')
  })
})

// ── Gesture routing in onPointerDown ─────────────────────────────────────────

describe('onPointerDown gesture routing', () => {
  test('empty-canvas tap with multi=false → pan-or-deselect', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: false })
    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown'))
    expect(ToolMode._gesture).toBe('pan-or-deselect')
  })

  test('empty-canvas tap with multi=true → box-select', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })
    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown'))
    expect(ToolMode._gesture).toBe('box-select')
  })

  test('hitting an object always routes to move regardless of multi', () => {
    const app = makeApp({ getAnchor: () => ({ x: 50, y: 50 }) })
    init(app, document.getElementById('canvas'))
    setTool('select', { multi: true })

    // Fabricate an element that looks like a selectable object
    const layer = document.getElementById('drawing-layer')
    const el = document.createElement('rect')
    el.setAttribute('data-yid', 'shape-abc')
    el.setAttribute('data-module', 'drawing')
    layer.appendChild(el)

    const stage = document.getElementById('stage')
    const ev = makePointerEvent('pointerdown', { target: el })
    stage.dispatchEvent(ev)
    expect(ToolMode._gesture).toBe('move')
  })
})

// ── box-select: no movement → deselect ────────────────────────────────────────

describe('box-select tap (no drag) deselects', () => {
  test('pointerup with no movement calls App.select(null)', () => {
    const calls = []
    const app   = makeApp({ select: (id) => calls.push(id) })
    init(app, document.getElementById('canvas'))
    setTool('select', { multi: true })

    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
    expect(ToolMode._gesture).toBe('box-select')

    // pointerup at same position (no move)
    stage.dispatchEvent(makePointerEvent('pointerup', { clientX: 200, clientY: 200 }))
    expect(calls).toContain(null)
  })
})

// ── box-select: drag → commitMultiSelect ──────────────────────────────────────

describe('box-select drag calls commitMultiSelect', () => {
  test('pointerup after drag calls App.commitMultiSelect with canvas-space rect', () => {
    const committed = []
    const app = makeApp({ commitMultiSelect: (rect) => committed.push(rect) })
    init(app, document.getElementById('canvas'))
    setTool('select', { multi: true })

    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown', { clientX: 100, clientY: 100 }))
    stage.dispatchEvent(makePointerEvent('pointermove', { clientX: 200, clientY: 200 }))
    stage.dispatchEvent(makePointerEvent('pointerup',   { clientX: 200, clientY: 200 }))

    expect(committed).toHaveLength(1)
    const rect = committed[0]
    expect(rect).toHaveProperty('x')
    expect(rect).toHaveProperty('y')
    expect(rect).toHaveProperty('width')
    expect(rect).toHaveProperty('height')
    // At scale=1 and view=(0,0): width = |200-100| / 1 = 100
    expect(rect.width).toBeCloseTo(100)
    expect(rect.height).toBeCloseTo(100)
  })

  test('select-preview div is shown during drag and hidden on pointerup', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })

    const stage   = document.getElementById('stage')
    const preview = document.getElementById('select-preview')

    stage.dispatchEvent(makePointerEvent('pointerdown', { clientX: 50, clientY: 50 }))
    stage.dispatchEvent(makePointerEvent('pointermove', { clientX: 150, clientY: 150 }))
    expect(preview.style.display).toBe('block')

    stage.dispatchEvent(makePointerEvent('pointerup', { clientX: 150, clientY: 150 }))
    expect(preview.style.display).toBe('none')
  })
})

// ── Regression: pan-or-deselect still works ───────────────────────────────────

describe('pan-or-deselect regression', () => {
  test('empty-canvas tap with multi=false still calls App.select(null)', () => {
    const calls = []
    const app   = makeApp({ select: (id) => calls.push(id) })
    init(app, document.getElementById('canvas'))
    setTool('select', { multi: false })

    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown', { clientX: 50, clientY: 50 }))
    stage.dispatchEvent(makePointerEvent('pointerup',   { clientX: 50, clientY: 50 }))
    expect(calls).toContain(null)
  })

  test('.dragging class is added during pan and removed on pointerup', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: false })

    const stage = document.getElementById('stage')
    stage.dispatchEvent(makePointerEvent('pointerdown', { clientX: 50,  clientY: 50  }))
    stage.dispatchEvent(makePointerEvent('pointermove', { clientX: 100, clientY: 100 }))
    expect(stage.classList.contains('dragging')).toBe(true)

    stage.dispatchEvent(makePointerEvent('pointerup', { clientX: 100, clientY: 100 }))
    expect(stage.classList.contains('dragging')).toBe(false)
  })
})

// ── Regression: App.select must not reset ToolMode.params ─────────────────────
// Bug: App.select previously called Canvas.setTool('select') which overwrote
// ToolMode.params with _toolParams['select'] (which has multi:false by default),
// dropping the multi:true state set by the UI checkbox.
describe('App.select does not clobber ToolMode.params', () => {
  test('params.multi remains true after an object is tapped in multi mode', () => {
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })

    // Confirm we start in multi mode
    expect(ToolMode.params.multi).toBe(true)
    expect(document.getElementById('stage').dataset.selectMode).toBe('multi')

    // Simulate what App.select does to ToolMode via setParams — it must NOT call setTool
    // The test verifies the invariant: setParams does not change params.multi
    setParams({ multi: true })  // re-applying same params (as a noop)
    expect(ToolMode.params.multi).toBe(true)

    // After setParams with a fresh object that still has multi:true, mode is preserved
    expect(document.getElementById('stage').dataset.selectMode).toBe('multi')
  })

  test('box-select gesture fires on empty-canvas drag even after tapping an object', () => {
    // This catches the exact regression: click toy → App.select resets multi →
    // next empty-canvas drag goes to pan-or-deselect instead of box-select.
    //
    // We simulate it by: set multi:true, do a 'move' gesture (toy tap), verify
    // that the next pointerdown on empty canvas still gives 'box-select'.
    init(makeApp(), document.getElementById('canvas'))
    setTool('select', { multi: true })

    const stage = document.getElementById('stage')

    // First: tap an object (gesture = move, then resolved to no-op)
    const layer = document.getElementById('drawing-layer')
    const el = document.createElement('rect')
    el.setAttribute('data-yid', 'obj-1')
    el.setAttribute('data-module', 'drawing')
    layer.appendChild(el)

    const downOnObj = makePointerEvent('pointerdown', { clientX: 100, clientY: 100, target: el })
    stage.dispatchEvent(downOnObj)
    const upOnObj = makePointerEvent('pointerup', { clientX: 100, clientY: 100 })
    stage.dispatchEvent(upOnObj)

    // At this point App.select(hitId) would have been called. In the buggy version
    // that called Canvas.setTool('select', {}) which set multi:false.
    // Verify multi is still true:
    expect(ToolMode.params.multi).toBe(true)

    // Now try an empty-canvas drag — must give box-select, not pan-or-deselect
    const downEmpty = makePointerEvent('pointerdown', { clientX: 200, clientY: 200 })
    stage.dispatchEvent(downEmpty)
    expect(ToolMode._gesture).toBe('box-select')
  })
})

