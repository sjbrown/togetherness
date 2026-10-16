/**
 * tests/unit/canvas-tap-gestures.test.js
 *
 * Covers tap-based gestures on the canvas:
 *   - Two-finger pinch must never trigger resetView(), even though the two
 *     fingers lift off as separate, closely-spaced pointerup events.
 *   - Double-click/double-tap resets the view.
 *   - Triple-click/triple-tap does NOT reset the view; with the select
 *     tool its third press enters attention mode instead.
 *   - In attention mode presses and moves go to attention, and a press on
 *     an expired origin is consumed by its dismissal.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { init, setTool, resetView, ToolMode } from '../../src/canvas.js'

function makeDOM() {
  document.body.innerHTML = `
    <div id="stage">
      <svg id="canvas">
        <g id="background-layer"></g>
        <g id="boun_pos-layer"></g>
        <g id="toys-layer"></g>
        <g id="drawing-layer"></g>
        <g id="overlay-layer"></g>
      </svg>
      <div id="draw-preview"></div>
      <div id="select-preview"></div>
    </div>
  `
  const stage = document.getElementById('stage')
  stage.setPointerCapture   = () => {}
  stage.releasePointerCapture = () => {}
}

function makeApp(overrides = {}) {
  return {
    getActiveLayer:    () => 'drawing',
    getAnchor:         () => ({ x: 0, y: 0 }),
    getBBox:           () => null,
    getMyColor:        () => '#aaa',
    getMyGradient:     () => ({ c1: '#aaa', c2: '#bbb', angle: 0 }),
    getViewScale:      () => 1,
    getSelectedIds:    () => [],
    select:            () => {},
    startDrag:         () => {},
    cancelMove:        () => {},
    commitMove:        () => {},
    move:              () => {},
    onViewReset:       vi.fn(),
    attentionActive:   () => false,
    attentionEnter:    vi.fn(),
    attentionMove:     vi.fn(),
    attentionPress:    vi.fn(),
    attentionDismissAt: () => false,
    requestContextMenu: () => {},
    getBoxCandidates:   () => [],
    broadcastCandidates: () => {},
    clearBoxCandidates: () => {},
    commitMultiSelect:  () => {},
    toggleSelection:    () => {},
    startMultiDrag:     () => {},
    reassertClaim:      () => {},
    moveMulti:          () => {},
    commitMultiMove:    () => {},
    cancelMultiMove:    () => {},
    getResizeModeId:    () => null,
    getResizeCorner:    () => null,
    startBowstringAt:   () => false,
    moveBowstring:      () => {},
    endBowstring:       () => {},
    nextSelectionMode:  () => {},
    startResize:        () => {},
    resize:             () => {},
    commitResize:       () => {},
    cancelResize:       () => {},
    getRotateModeId:    () => null,
    getRotateHandle:    () => null,
    startRotate:        () => {},
    rotate:             () => {},
    commitRotate:       () => {},
    cancelRotate:       () => {},
    startPivotDrag:     () => {},
    movePivot:          () => {},
    commitPivot:        () => {},
    cancelPivot:        () => {},
    ...overrides,
  }
}

function makePointerEvent(type, { pointerId, clientX = 100, clientY = 100, target } = {}) {
  const stage = document.getElementById('stage')
  const ev = new PointerEvent(type, {
    bubbles: true, cancelable: true,
    clientX, clientY,
    pointerId,
  })
  Object.defineProperty(ev, 'target', { value: target ?? stage, writable: false })
  return ev
}

function tap(stage, { pointerId = 1, clientX = 100, clientY = 100 } = {}) {
  stage.dispatchEvent(makePointerEvent('pointerdown', { pointerId, clientX, clientY }))
  stage.dispatchEvent(makePointerEvent('pointerup',   { pointerId, clientX, clientY }))
}

beforeEach(() => {
  makeDOM()
  resetView()
  ToolMode._pointers.clear()
  ToolMode._gesture   = null
  ToolMode._moveRef   = null
  ToolMode._draft     = null
  ToolMode._startView = null
  ToolMode.tool       = 'select'
  ToolMode.params     = {}
  ToolMode._lastTap   = 0
  ToolMode._wasPinch  = false
  ToolMode._tapCount  = 0
  clearTimeout(ToolMode._tapTimer)
  ToolMode._tapTimer  = null
})

describe('pinch-zoom vs. tap disambiguation', () => {
  test('two-finger pinch releasing as two close pointerups never resets the view', async () => {
    vi.useFakeTimers()
    const stage = document.getElementById('stage')
    const app = makeApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    stage.dispatchEvent(makePointerEvent('pointerdown', { pointerId: 1, clientX: 100, clientY: 100 }))
    stage.dispatchEvent(makePointerEvent('pointerdown', { pointerId: 2, clientX: 200, clientY: 100 }))
    stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 80,  clientY: 100 }))
    stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 2, clientX: 220, clientY: 100 }))

    // Fingers lift a few ms apart, both well within the double-tap window.
    stage.dispatchEvent(makePointerEvent('pointerup', { pointerId: 1, clientX: 80,  clientY: 100 }))
    stage.dispatchEvent(makePointerEvent('pointerup', { pointerId: 2, clientX: 220, clientY: 100 }))

    vi.advanceTimersByTime(400)
    vi.useRealTimers()

    expect(app.onViewReset).not.toHaveBeenCalled()
  })

  test('double-click on empty canvas resets the view', () => {
    vi.useFakeTimers()
    const stage = document.getElementById('stage')
    const app = makeApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1 })
    tap(stage, { pointerId: 2 })

    vi.advanceTimersByTime(400)
    vi.useRealTimers()

    expect(app.onViewReset).toHaveBeenCalledTimes(1)
    expect(app.attentionEnter).not.toHaveBeenCalled()
  })

  test('triple-click on empty canvas does NOT reset the view, and enters attention', () => {
    vi.useFakeTimers()
    const stage = document.getElementById('stage')
    const app = makeApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1 })
    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })

    vi.advanceTimersByTime(400)
    vi.useRealTimers()

    expect(app.onViewReset).not.toHaveBeenCalled()
    expect(app.attentionEnter).toHaveBeenCalledTimes(1)
  })

  test('a drag between two taps does not count as part of a tap sequence', () => {
    vi.useFakeTimers()
    const stage = document.getElementById('stage')
    const app = makeApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1, clientX: 100, clientY: 100 })

    // A real drag: down, move, up (moved flag set)
    stage.dispatchEvent(makePointerEvent('pointerdown', { pointerId: 2, clientX: 100, clientY: 100 }))
    stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 2, clientX: 300, clientY: 300 }))
    stage.dispatchEvent(makePointerEvent('pointerup',   { pointerId: 2, clientX: 300, clientY: 300 }))

    tap(stage, { pointerId: 3, clientX: 100, clientY: 100 })

    vi.advanceTimersByTime(400)
    vi.useRealTimers()

    // Only ever a single tap in a row (1, then drag breaks it, then 1) — never 2 or 3.
    expect(app.onViewReset).not.toHaveBeenCalled()
    expect(app.attentionEnter).not.toHaveBeenCalled()
  })
})

describe('attention mode', () => {
  // A fake attention that turns on when entered.
  function attentionApp(overrides = {}) {
    let on = false
    return makeApp({
      attentionActive: () => on,
      attentionEnter:  vi.fn(() => { on = true }),
      select:          vi.fn(),
      ...overrides,
    })
  }

  test('enters on the third press itself, with canvas and client coordinates', () => {
    const stage = document.getElementById('stage')
    const app = attentionApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1, clientX: 40, clientY: 50 })
    tap(stage, { pointerId: 2, clientX: 42, clientY: 51 })
    stage.dispatchEvent(makePointerEvent('pointerdown', { pointerId: 3, clientX: 44, clientY: 52 }))

    expect(app.attentionEnter).toHaveBeenCalledWith(44, 52, 44, 52)
  })

  test('a press made with another tool does not count toward the triple-click', () => {
    const stage = document.getElementById('stage')
    const app = attentionApp({ commitToy: () => {}, updateAddCursor: () => {}, clearAddCursor: () => {} })
    init(app, document.getElementById('canvas'))
    setTool('d6', {})
    tap(stage, { pointerId: 1 })            // places a toy
    setTool('select', {})
    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })
    expect(app.attentionEnter).not.toHaveBeenCalled()
    setTool('select', {})                   // re-selecting the same tool keeps the sequence
    tap(stage, { pointerId: 4 })
    expect(app.attentionEnter).toHaveBeenCalledTimes(1)
  })

  test('three quick clicks in different places do not enter it', () => {
    const stage = document.getElementById('stage')
    const app = attentionApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1, clientX: 100, clientY: 100 })
    tap(stage, { pointerId: 2, clientX: 300, clientY: 100 })
    tap(stage, { pointerId: 3, clientX: 500, clientY: 100 })

    expect(app.attentionEnter).not.toHaveBeenCalled()
  })

  test('other tools never enter it', () => {
    const stage = document.getElementById('stage')
    const app = attentionApp({ commitDrawing: () => {}, commitToy: () => {}, updateAddCursor: () => {} })
    init(app, document.getElementById('canvas'))
    setTool('rect', {})

    tap(stage, { pointerId: 1 })
    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })

    expect(app.attentionEnter).not.toHaveBeenCalled()
  })

  test('while on, presses and moves go to attention, not the table', () => {
    const stage = document.getElementById('stage')
    const app = attentionApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})
    tap(stage, { pointerId: 1 })
    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })
    app.select.mockClear()

    stage.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: 9, clientX: 70, clientY: 80 }))
    expect(app.attentionMove).toHaveBeenLastCalledWith(70, 80, 70, 80)

    tap(stage, { pointerId: 4, clientX: 15, clientY: 25 })
    expect(app.attentionPress).toHaveBeenCalledWith(15, 25)
    expect(app.select).not.toHaveBeenCalled()
  })

  test('attention presses never build a new tap sequence', () => {
    vi.useFakeTimers()
    const stage = document.getElementById('stage')
    const app = attentionApp()
    init(app, document.getElementById('canvas'))
    setTool('select', {})
    tap(stage, { pointerId: 1 })
    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })
    tap(stage, { pointerId: 4 })
    tap(stage, { pointerId: 5 })
    vi.advanceTimersByTime(400)
    vi.useRealTimers()

    expect(app.onViewReset).not.toHaveBeenCalled()
    expect(app.attentionEnter).toHaveBeenCalledTimes(1)
  })

  test('a press on an expired origin is consumed, but counts toward a triple-click', () => {
    const stage = document.getElementById('stage')
    let origin = true
    const app = attentionApp({ attentionDismissAt: vi.fn(() => { const hit = origin; origin = false; return hit }) })
    init(app, document.getElementById('canvas'))
    setTool('select', {})

    tap(stage, { pointerId: 1 })
    expect(app.attentionDismissAt).toHaveBeenCalledTimes(1)
    expect(app.select).not.toHaveBeenCalled()

    tap(stage, { pointerId: 2 })
    tap(stage, { pointerId: 3 })
    expect(app.attentionEnter).toHaveBeenCalledTimes(1)
  })
})
