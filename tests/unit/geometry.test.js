/**
 * geometry.test.js
 *
 * Direct tests for geometry.js's pure functions — rotation-angle
 * arithmetic and corner-drag resize math shared by drawing.js, toys.js,
 * and boun_pos.js. No DOM, no Yjs; run with: npx vitest run
 */

import { describe, test, expect } from 'vitest'
import {
  normalizeAngle, snapAngle, computeRotate, computeResizeCornerRect, rotatePoint,
} from '../../src/geometry.js'

describe('snapAngle / normalizeAngle', () => {
  test('snaps to the nearest multiple of the default 15° step', () => {
    expect(snapAngle(7)).toBe(0)
    expect(snapAngle(8)).toBe(15)
    expect(snapAngle(37)).toBe(30)
    expect(snapAngle(38)).toBe(45)
  })

  test('the step is an argument, not a constant — a caller can pass its own', () => {
    expect(snapAngle(38, 90)).toBe(0)
    expect(snapAngle(50, 90)).toBe(90)
    expect(snapAngle(7, 5)).toBe(5)
  })

  test('a step of 0 means free rotation — the angle passes through unsnapped', () => {
    expect(snapAngle(37.5, 0)).toBeCloseTo(37.5)
  })

  test('normalizes into [0, 360) so a snap that lands on 360 reads as 0', () => {
    expect(normalizeAngle(-15)).toBe(345)
    expect(normalizeAngle(360)).toBe(0)
    expect(normalizeAngle(725)).toBe(5)
    expect(snapAngle(-8)).toBe(345)
    expect(snapAngle(358)).toBe(0)
  })
})

describe('rotatePoint', () => {
  test('is a no-op with no rotation', () => {
    expect(rotatePoint({ x: 5, y: 7 }, null)).toEqual({ x: 5, y: 7 })
  })

  test('turns a point 90° clockwise about its centre (SVG’s rotate() sense)', () => {
    const p = rotatePoint({ x: 110, y: 100 }, { deg: 90, cx: 100, cy: 100 })
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(110)
  })

  test('leaves the pivot itself fixed', () => {
    const p = rotatePoint({ x: 100, y: 100 }, { deg: 45, cx: 100, cy: 100 })
    expect(p.x).toBeCloseTo(100)
    expect(p.y).toBeCloseTo(100)
  })

  test('cx/cy default to 0, rotating a bare vector about the origin', () => {
    const p = rotatePoint({ x: 10, y: 0 }, { deg: 90 })
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(10)
  })
})

describe('computeRotate', () => {
  // A square, so every corner sits on a diagonal and the arithmetic is
  // checkable by eye. centre (100, 100).
  const startRect = { x: 50, y: 50, width: 100, height: 100 }
  const mid = { cx: 100, cy: 100 }

  test('pointer left on the grabbed corner means no rotation', () => {
    expect(computeRotate(startRect, mid, 2, 150, 150)).toBe(0)  // SE corner
    expect(computeRotate(startRect, mid, 0, 50, 50)).toBe(0)    // NW corner
  })

  test('the grabbed corner follows the pointer — a quarter turn reads as 90°', () => {
    // SE corner starts at 45° from centre; pointer moved to 135° (SW side).
    expect(computeRotate(startRect, mid, 2, 50, 150)).toBe(90)
  })

  test('each corner measures from its own start, so all four agree on the angle', () => {
    // Every corner dragged a quarter turn clockwise gives the same 90°.
    expect(computeRotate(startRect, mid, 0, 150, 50)).toBe(90)  // NW → NE position
    expect(computeRotate(startRect, mid, 1, 150, 150)).toBe(90) // NE → SE position
    expect(computeRotate(startRect, mid, 3, 50, 50)).toBe(90)   // SW → NW position
  })

  test('the raw angle is snapped to the step before it is returned', () => {
    const rect = { x: 0, y: 0, width: 200, height: 200 }
    const c    = { cx: 100, cy: 100 }
    // ~10° past the SE corner's 45° — snaps down to 0 at 15°, up to 45 at 40°.
    expect(computeRotate(rect, c, 2, 100, 200)).toBe(45)
    expect(computeRotate(rect, c, 2, 200, 190, 90)).toBe(0)
  })

  test('counter-clockwise rotation comes back normalized, never negative', () => {
    expect(computeRotate(startRect, mid, 2, 150, 50)).toBe(270)
  })

  test('the centre is an argument, so an off-centre pivot needs no change here', () => {
    // Turning about the NW corner instead of the middle: the SE corner
    // starts at 45° from it too (square), but a quarter turn about a
    // different point is still a quarter turn.
    const nw = { cx: 50, cy: 50 }
    expect(computeRotate(startRect, nw, 2, 150, 150)).toBe(0)
    expect(computeRotate(startRect, nw, 2, -50, 150)).toBe(90)
  })
})

describe('computeResizeCornerRect — corner-opposite-fixed resize', () => {
  // Same fixture as tests/unit/resize.test.js's computeResizeRect
  // (toys.js's own thin wrapper around this), so the numbers are already
  // independently verified.
  const startRect = { x: 100, y: 100, width: 200, height: 150 } // right=300, bottom=250
  const minSize = 30

  test('SE corner: opposite (NW) corner stays fixed, dragged corner follows the pointer', () => {
    const rect = computeResizeCornerRect(startRect, 2, 340, 260, minSize)
    expect(rect).toEqual({ x: 100, y: 100, width: 240, height: 160 })
  })

  test('NW corner: opposite (SE) corner stays fixed', () => {
    const rect = computeResizeCornerRect(startRect, 0, 80, 90, minSize)
    expect(rect).toEqual({ x: 80, y: 90, width: 220, height: 160 })
  })

  test('NE corner: bottom-left stays fixed — x never moves, only width/y/height', () => {
    const rect = computeResizeCornerRect(startRect, 1, 360, 80, minSize)
    expect(rect).toEqual({ x: 100, y: 80, width: 260, height: 170 })
  })

  test('SW corner: top-right stays fixed — y never moves, only x/width/height', () => {
    const rect = computeResizeCornerRect(startRect, 3, 60, 300, minSize)
    expect(rect).toEqual({ x: 60, y: 100, width: 240, height: 200 })
  })

  test('never lets the dragged corner cross the fixed one — clamped to minSize', () => {
    const rect = computeResizeCornerRect(startRect, 2, 50, 50, minSize)
    expect(rect).toEqual({ x: 100, y: 100, width: minSize, height: minSize })
  })

  test('the fixed corner never moves even when the drag clamps', () => {
    const rect = computeResizeCornerRect(startRect, 0, 500, 500, minSize)
    expect(rect.x + rect.width).toBe(300)  // SE corner unchanged
    expect(rect.y + rect.height).toBe(250)
    expect(rect.width).toBe(minSize)
    expect(rect.height).toBe(minSize)
  })

  test('an unrecognized corner index falls back to SE, same as the default branch', () => {
    const bySE  = computeResizeCornerRect(startRect, 2, 340, 260, minSize)
    const byAny = computeResizeCornerRect(startRect, 99, 340, 260, minSize)
    expect(byAny).toEqual(bySE)
  })

  test('minSize is a required argument — every layer supplies its own, not a shared default', () => {
    const looser = computeResizeCornerRect(startRect, 2, 50, 50, 10)
    expect(looser.width).toBe(10)
    expect(looser.height).toBe(10)
  })
})
