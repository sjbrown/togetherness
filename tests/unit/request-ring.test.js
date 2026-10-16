import { describe, test, expect } from 'vitest'
import { gradientVector } from '../../src/entity_gradient.js'
import {
  CYCLE_MS, FADE_END, LOOP_BUFFER_MS,
  fadeVanish, growVanish, vanishOffsets, cycleMs, windowProgress, vanishFrames,
} from '../../src/request_ring.js'
import { REQUEST_WINDOW_MS } from '../../src/soft_lock.js'

const nums = (s) => s.split(';').map(Number)

describe('vanishOffsets', () => {
  test('v=0 is the full ring: the transparent stops collapse to the start', () => {
    const { a, b } = vanishOffsets(0)
    expect(a).toBe(0)
    expect(b).toBeCloseTo(0.02, 5)
  })

  test('v=1 pushes the colours into the last few percent', () => {
    const { a, b } = vanishOffsets(1)
    expect(a).toBeCloseTo(FADE_END, 5)
    expect(b).toBeGreaterThan(a)
    expect(b).toBeLessThan(1)
  })

  test('stops stay ordered and inside [0, 1] across the whole range', () => {
    for (let i = 0; i <= 100; i++) {
      const { a, b } = vanishOffsets(i / 100)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(b).toBeGreaterThanOrEqual(a)
      expect(b).toBeLessThanOrEqual(1)
    }
  })

  test('a custom end limits how far the colours retreat', () => {
    expect(vanishOffsets(1, 0.5).a).toBeCloseTo(0.5, 5)
  })
})

describe('curves', () => {
  test('fade eases in: slow at first, faster later', () => {
    expect(fadeVanish(0)).toBe(0)
    expect(fadeVanish(0.5)).toBeCloseTo(0.25, 5)
    expect(fadeVanish(1)).toBe(1)
  })

  test('grow runs the other way, linearly: nearly gone at the bid, full at the deadline', () => {
    expect(growVanish(0)).toBe(1)
    expect(growVanish(0.5)).toBeCloseTo(0.5, 5)
    expect(growVanish(1)).toBe(0)
  })
})

describe('cycle timing', () => {
  test('the cycle is the request window plus the buffer', () => {
    expect(CYCLE_MS).toBe(REQUEST_WINDOW_MS + LOOP_BUFFER_MS)
  })

  test('progress rises across the window and holds through the buffer', () => {
    expect(windowProgress(0)).toBe(0)
    expect(windowProgress(REQUEST_WINDOW_MS / 2)).toBeCloseTo(0.5, 5)
    expect(windowProgress(REQUEST_WINDOW_MS)).toBe(1)
    expect(windowProgress(REQUEST_WINDOW_MS + LOOP_BUFFER_MS - 1)).toBe(1)
  })

  test('the cycle repeats instead of ending', () => {
    expect(windowProgress(CYCLE_MS)).toBe(0)
    expect(windowProgress(CYCLE_MS + REQUEST_WINDOW_MS / 2)).toBeCloseTo(0.5, 5)
    expect(cycleMs(3 * CYCLE_MS + 250)).toBe(250)
  })

  test('a request stamped in the future (clock skew) counts as just started', () => {
    expect(cycleMs(-500)).toBe(0)
    expect(windowProgress(-500)).toBe(0)
  })
})

describe('vanishFrames', () => {
  const fade = vanishFrames(fadeVanish)
  const grow = vanishFrames(growVanish)

  test('key times run from 0 to 1, strictly increasing', () => {
    const kt = nums(fade.keyTimes)
    expect(kt[0]).toBe(0)
    expect(kt[kt.length - 1]).toBe(1)
    for (let i = 1; i < kt.length; i++) expect(kt[i]).toBeGreaterThan(kt[i - 1])
  })

  test('every track has one value per key time', () => {
    for (const f of [fade, grow]) {
      const n = nums(f.keyTimes).length
      expect(nums(f.a)).toHaveLength(n)
      expect(nums(f.b)).toHaveLength(n)
    }
  })

  test('the window ends at its share of the cycle, then the last frame is held', () => {
    const kt = nums(fade.keyTimes)
    const a = nums(fade.a)
    expect(kt[kt.length - 2]).toBeCloseTo(REQUEST_WINDOW_MS / CYCLE_MS, 3)
    expect(a[a.length - 1]).toBe(a[a.length - 2])
  })

  test('fade starts as the full ring and ends nearly gone', () => {
    const a = nums(fade.a)
    expect(a[0]).toBe(0)
    expect(a[a.length - 1]).toBeCloseTo(FADE_END, 3)
  })

  test('grow starts nearly gone and ends as the full ring', () => {
    const a = nums(grow.a)
    expect(a[0]).toBeCloseTo(FADE_END, 3)
    expect(a[a.length - 1]).toBe(0)
  })

  test('fade lags a linear sweep midway (ease-in), grow does not', () => {
    const mid = (f) => nums(f.a)[12]
    expect(mid(fade)).toBeCloseTo(FADE_END * 0.25, 3)
    expect(mid(grow)).toBeCloseTo(FADE_END * 0.5, 3)
  })
})

describe('gradientVector', () => {
  test('90° runs left to right across the box', () => {
    expect(gradientVector(90)).toEqual({ x1: 0, y1: 0.5, x2: 1, y2: 0.5 })
  })

  test('45° runs from the bottom-left corner to the top-right', () => {
    const v = gradientVector(45)
    expect(v.x1).toBeLessThan(v.x2)
    expect(v.y1).toBeGreaterThan(v.y2)
    expect(v.x1 + v.x2).toBeCloseTo(1, 5)
    expect(v.y1 + v.y2).toBeCloseTo(1, 5)
  })
})
