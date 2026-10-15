/**
 * tests/unit/attention-formulas.test.js
 *
 * The pure formulas behind attention mode's drawing: origin intro and spin,
 * dot ring, trail segments, click sparks/flash/rings, trimming, sampling and
 * the dismissal hit test.
 */

import { describe, test, expect } from 'vitest'
import {
  T, originRadius, receiverIntroR0, originPhase, originSettled, dotRing,
  trailSegmentStyle, clickRng, clickSparks, clickFlash, clickRingStyle,
  clickLifeMs, exitFade, trimAttention, acceptsSample, insideOrigin,
} from '../../src/attention_mode.js'

const ageAt = (now) => (t) => now - t

describe('originRadius', () => {
  test('starts at r0 and settles at ORIGIN_R', () => {
    expect(originRadius(0, 250, 320)).toBe(320)
    expect(originRadius(250, 250, 320)).toBe(T.ORIGIN_R)
    expect(originRadius(10_000, 250, 320)).toBe(T.ORIGIN_R)
  })

  test('shrinks monotonically', () => {
    let prev = Infinity
    for (let a = 0; a <= 250; a += 25) {
      const r = originRadius(a, 250, 320)
      expect(r).toBeLessThanOrEqual(prev)
      prev = r
    }
  })

  test('a zero-length intro is already settled', () => {
    expect(originRadius(0, 0, 320)).toBe(T.ORIGIN_R)
  })
})

describe('receiverIntroR0', () => {
  test('reaches from the origin to the view centre, in sender px', () => {
    // 300-400-500 triangle, origin made at scale 2
    expect(receiverIntroR0([0, 0, 1, 2], [300, 400])).toBe(1000)
  })

  test('is never smaller than the sender intro radius', () => {
    expect(receiverIntroR0([0, 0, 1, 1], [1, 1])).toBe(T.ORIGIN_R * T.ORIGIN_INTRO_SCALE)
  })
})

describe('originPhase', () => {
  const t0 = 1_000_000

  test('spins at ORIGIN_SPIN while live, at full opacity', () => {
    const ph = originPhase([0, 0, t0, 1], ageAt(t0 + 2000))
    expect(ph.offset).toBeCloseTo(T.ORIGIN_SPIN * 2)
    expect(ph.opacity).toBe(1)
  })

  test('continues exactly from the live value at the moment of expiry', () => {
    const end = t0 + 1234
    const live    = originPhase([0, 0, t0, 1], ageAt(end))
    const expired = originPhase([0, 0, t0, 1, end], ageAt(end))
    expect(expired.offset).toBeCloseTo(live.offset, 9)
    expect(expired.opacity).toBe(1)
  })

  test('speed is continuous across expiry', () => {
    const end = t0 + 1000, h = 1
    const before = originPhase([0, 0, t0, 1], ageAt(end)).offset -
                   originPhase([0, 0, t0, 1], ageAt(end - h)).offset
    const after  = originPhase([0, 0, t0, 1, end], ageAt(end + h)).offset -
                   originPhase([0, 0, t0, 1, end], ageAt(end)).offset
    expect(after).toBeCloseTo(before, 3)
  })

  test('coasts half an EXIT_MS worth of spin, then holds', () => {
    const end = t0 + 1000
    const rest = originPhase([0, 0, t0, 1, end], ageAt(end + T.EXIT_MS))
    expect(rest.offset).toBeCloseTo(T.ORIGIN_SPIN * (1000 + T.EXIT_MS / 2) / 1000)
    expect(rest.opacity).toBeCloseTo(T.ORIGIN_EXPIRED_OPACITY)
    const later = originPhase([0, 0, t0, 1, end], ageAt(end + 60_000))
    expect(later).toEqual(rest)
  })

  test('originSettled only after the coast', () => {
    const end = t0 + 1000
    expect(originSettled([0, 0, t0, 1], ageAt(end + 9999))).toBe(false)
    expect(originSettled([0, 0, t0, 1, end], ageAt(end + T.EXIT_MS - 1))).toBe(false)
    expect(originSettled([0, 0, t0, 1, end], ageAt(end + T.EXIT_MS))).toBe(true)
  })
})

describe('dotRing', () => {
  test('sits ORIGIN_STROKE/2 + ORIGIN_DOT_GAP inside, with angle-preserving scale', () => {
    const d = dotRing(80)
    expect(d.rIn).toBe(80 - (T.ORIGIN_STROKE / 2 + T.ORIGIN_DOT_GAP))
    expect(d.a).toBeCloseTo(d.rIn / 80)
    // equal angular period for bars and dots
    const barPeriod = (T.ORIGIN_DASH + T.ORIGIN_GAP) / 80
    const dotPeriod = (T.ORIGIN_DASH + T.ORIGIN_GAP) * d.a / d.rIn
    expect(dotPeriod).toBeCloseTo(barPeriod)
  })

  test('is null once the ring would collapse', () => {
    expect(dotRing(T.ORIGIN_STROKE / 2 + T.ORIGIN_DOT_GAP)).toBeNull()
  })
})

describe('trailSegmentStyle', () => {
  test('fresh slow segment: thickest, opaque, pure c1', () => {
    const s = trailSegmentStyle(0, 0)
    expect(s.width).toBe(T.TRAIL_MAX_W)
    expect(s.alpha).toBe(1)
    expect(s.c2Pct).toBe(0)
  })

  test('a fast segment is thinner than a slow one of the same age', () => {
    expect(trailSegmentStyle(100, 200).width).toBeLessThan(trailSegmentStyle(100, 0).width)
  })

  test('reaches full c2 at TRAIL_C2_AT of the fade', () => {
    expect(trailSegmentStyle(T.TRAIL_FADE_MS * T.TRAIL_C2_AT, 0).c2Pct).toBeCloseTo(100)
  })

  test('is gone once faded', () => {
    expect(trailSegmentStyle(T.TRAIL_FADE_MS, 0)).toBeNull()
  })
})

describe('clicks', () => {
  test('the spark pattern is a function of the click tuple alone', () => {
    const a = clickSparks(200, clickRng(10, 20, 1_791_000_000_123))
    const b = clickSparks(200, clickRng(10, 20, 1_791_000_000_123))
    const c = clickSparks(200, clickRng(11, 20, 1_791_000_000_123))
    expect(a).toEqual(b)
    expect(a).not.toEqual(c)
    expect(a).toHaveLength(T.CLICK_SPARKS)
  })

  test('sparks fly outward and burn out', () => {
    const early = clickSparks(50, clickRng(0, 0, 5))
    const late  = clickSparks(600, clickRng(0, 0, 5))
    for (let i = 0; i < early.length; i++) {
      expect(late[i].head).toBeGreaterThan(early[i].head)
      expect(late[i].width).toBeLessThan(early[i].width)
      expect(late[i].tail).toBeLessThanOrEqual(late[i].head)
    }
    expect(clickSparks(T.CLICK_MS, clickRng(0, 0, 5))).toEqual([])
  })

  test('flash and rings draw only inside their lifetimes', () => {
    expect(clickFlash(0)).toBeNull()
    expect(clickFlash(T.CLICK_FLASH_MS / 2)).not.toBeNull()
    expect(clickFlash(T.CLICK_FLASH_MS)).toBeNull()
    expect(clickRingStyle(T.CLICK_RING_DELAY_MS / 2, 1)).toBeNull()
    expect(clickRingStyle(T.CLICK_RING_DELAY_MS + 10, 1)).not.toBeNull()
  })

  test('clickLifeMs covers the last ring', () => {
    expect(clickLifeMs()).toBe(T.CLICK_MS + (T.CLICK_RINGS - 1) * T.CLICK_RING_DELAY_MS)
    expect(clickRingStyle(clickLifeMs(), T.CLICK_RINGS - 1)).toBeNull()
  })
})

describe('exitFade', () => {
  test('falls from 1 to 0 over EXIT_MS', () => {
    expect(exitFade(0)).toBe(1)
    expect(exitFade(T.EXIT_MS / 2)).toBeCloseTo(0.5)
    expect(exitFade(T.EXIT_MS)).toBe(0)
  })
})

describe('trimAttention', () => {
  test('drops what no longer draws, keeping the rest', () => {
    const now = 100_000
    const att = {
      trail:  [[0, 0, now - T.TRAIL_FADE_MS - 1], [1, 1, now - 10]],
      clicks: [[0, 0, now - clickLifeMs() - 1], [1, 1, now - 10]],
      last: now, scale: 1,
    }
    const out = trimAttention(att, now)
    expect(out.trail).toEqual([[1, 1, now - 10]])
    expect(out.clicks).toEqual([[1, 1, now - 10]])
    expect(out.last).toBe(now)
  })

  test('caps by count, keeping the newest', () => {
    const now = 100_000
    const trail = Array.from({ length: T.MAX_TRAIL + 5 }, (_, i) => [i, 0, now])
    const out = trimAttention({ trail, clicks: [], last: now, scale: 1 }, now)
    expect(out.trail).toHaveLength(T.MAX_TRAIL)
    expect(out.trail[0][0]).toBe(5)
  })
})

describe('acceptsSample', () => {
  test('first sample, far enough, or late enough', () => {
    expect(acceptsSample(null, 0, 0, 0)).toBe(true)
    const prev = { sx: 0, sy: 0, t: 0 }
    expect(acceptsSample(prev, T.TRAIL_MIN_DIST, 0, 1)).toBe(true)
    expect(acceptsSample(prev, 1, 0, T.TRAIL_MIN_MS)).toBe(true)
    expect(acceptsSample(prev, 1, 0, 1)).toBe(false)
  })

  test('never for a pointer that has not moved', () => {
    expect(acceptsSample({ sx: 5, sy: 5, t: 0 }, 5, 5, 10_000)).toBe(false)
  })
})

describe('insideOrigin', () => {
  test('uses the drawn radius in canvas units at the origin scale', () => {
    const o = [100, 100, 1, 2]            // radius ORIGIN_R / 2 canvas units
    expect(insideOrigin(o, 100 + T.ORIGIN_R / 2, 100)).toBe(true)
    expect(insideOrigin(o, 100 + T.ORIGIN_R / 2 + 1, 100)).toBe(false)
  })
})
