/**
 * tests/unit/canvas-tap-gestures.test.js
 *
 * Covers tap-based gestures on the canvas:
 *   - Two-finger pinch must never trigger resetView(), even though the two
 *     fingers lift off as separate, closely-spaced pointerup events.
 *   - Double-click/double-tap resets the view.
 *   - Triple-click/triple-tap does NOT reset the view; it notifies via
 *     App.onTripleTap() instead.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { init, setTool, resetView, ToolMode } from '../../src/canvas.js'

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
    onTripleTap:       vi.fn(),
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
    enterResizeMode:    () => {},
    exitResizeMode:     () => {},
    startResize:        () => {},
    resize:             () => {},
    commitResize:       () => {},
    cancelResize:       () => {},
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
    expect(app.onTripleTap).not.toHaveBeenCalled()
  })

  test('triple-click on empty canvas does NOT reset the view, and notifies onTripleTap', () => {
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
    expect(app.onTripleTap).toHaveBeenCalledTimes(1)
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
    expect(app.onTripleTap).not.toHaveBeenCalled()
  })
})
