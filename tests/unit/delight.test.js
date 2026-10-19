import { describe, it, expect } from 'vitest'
import {
  MAX_PULL,
  spinSpeedFor,
  stringWidthFor,
  wobbleAmpFor,
  snapDurationFor,
  stringPathD,
  bowstringOrigin,
  hitTestBowstring,
  chargeOpacityFor,
  chargeRadiusFor,
  MAX_CHARGE_RADIUS,
} from '../../src/delight.js'

describe('spinSpeedFor — fast at the origin, stopped at max pull', () => {
  it('is at full speed (4 rot/sec) sitting on the origin', () => {
    expect(spinSpeedFor(0)).toBe(4 * 360)
  })

  it('reaches exactly zero at MAX_PULL', () => {
    expect(spinSpeedFor(MAX_PULL)).toBe(0)
  })

  it('clamps to zero past MAX_PULL rather than going negative', () => {
    expect(spinSpeedFor(MAX_PULL * 3)).toBe(0)
  })

  it('falls off linearly — half speed at half pull', () => {
    expect(spinSpeedFor(MAX_PULL / 2)).toBeCloseTo(4 * 360 / 2)
  })

  it('treats a negative distance as the origin', () => {
    expect(spinSpeedFor(-10)).toBe(4 * 360)
  })
})

describe('stringWidthFor — tapers from handle width to a thread', () => {
  it('starts at the handle\u2019s own width so the string reads as continuous', () => {
    expect(stringWidthFor(0)).toBe(22)
  })

  it('bottoms out at the thread width at MAX_PULL', () => {
    expect(stringWidthFor(MAX_PULL)).toBeCloseTo(0.75)
  })

  it('never goes below the thread width past MAX_PULL', () => {
    expect(stringWidthFor(MAX_PULL * 2)).toBeCloseTo(0.75)
  })

  it('decreases monotonically', () => {
    const widths = [0, 50, 100, 150, 200].map(stringWidthFor)
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeLessThan(widths[i - 1])
    }
  })
})

describe('wobbleAmpFor — only a thin, fast-moving string shakes', () => {
  it('is zero below 60% of MAX_PULL no matter how fast the pointer moves', () => {
    expect(wobbleAmpFor(MAX_PULL * 0.59, 999)).toBe(0)
  })

  it('is zero at any pull distance if the pointer is stationary', () => {
    expect(wobbleAmpFor(MAX_PULL, 0)).toBe(0)
  })

  it('grows with velocity once past the threshold', () => {
    const slow = wobbleAmpFor(MAX_PULL, 0.5)
    const fast = wobbleAmpFor(MAX_PULL, 2)
    expect(fast).toBeGreaterThan(slow)
  })

  it('caps the velocity contribution at 14', () => {
    expect(wobbleAmpFor(MAX_PULL, 10_000)).toBe(14)
  })

  it('ramps in from the 60% threshold rather than jumping', () => {
    const justPast = wobbleAmpFor(MAX_PULL * 0.61, 3)
    expect(justPast).toBeGreaterThan(0)
    expect(justPast).toBeLessThan(wobbleAmpFor(MAX_PULL, 3))
  })
})

describe('snapDurationFor — longer pulls take longer to snap back', () => {
  it('has a floor duration for a zero-distance snap', () => {
    expect(snapDurationFor(0)).toBeCloseTo(260 / 1.6)
  })

  it('increases with pull distance', () => {
    expect(snapDurationFor(200)).toBeGreaterThan(snapDurationFor(50))
  })

  it('clamps the distance term, so an absurd pull does not take forever', () => {
    expect(snapDurationFor(MAX_PULL * 1.4)).toBe(snapDurationFor(MAX_PULL * 50))
  })
})

describe('stringPathD', () => {
  const origin = { x: 100, y: 100 }

  it('is a straight line when there is no wobble', () => {
    expect(stringPathD(origin, 150, 100, 0)).toBe('M100 100 L150 100')
  })

  it('collapses to a straight line at sub-pixel distance even if wobble is passed', () => {
    expect(stringPathD(origin, 100.1, 100, 5)).toBe('M100 100 L100.1 100')
  })

  it('becomes a quadratic with a perpendicular control point when wobbling', () => {
    // Pull straight right: the perpendicular is straight down (nx=0, ny=1),
    // so a wobble of 10 pushes the control point to y = mid + 10.
    expect(stringPathD(origin, 200, 100, 10)).toBe('M100 100 Q150 110 200 100')
  })

  it('flips the control point with the sign of the wobble', () => {
    expect(stringPathD(origin, 200, 100, -10)).toBe('M100 100 Q150 90 200 100')
  })

  it('takes the perpendicular of a vertical pull too', () => {
    // Pull straight down: perpendicular is straight left (nx=-1, ny=0).
    expect(stringPathD(origin, 100, 200, 10)).toBe('M100 100 Q90 150 100 200')
  })
})

describe('bowstringOrigin — the south-east-most corner of the selection ring', () => {
  const geo = { x: 0, y: 0, width: 100, height: 100 }

  it('sits at the padded bottom-right of the geo box', () => {
    expect(bowstringOrigin({ x: 10, y: 20, width: 100, height: 50 }))
      .toEqual({ x: 116, y: 76 })
  })

  it('stays on the plain SE corner at 90°, where a ring corner lands there', () => {
    const origin = bowstringOrigin(geo, { deg: 90, cx: 50, cy: 50 })
    expect(origin.x).toBeCloseTo(106)
    expect(origin.y).toBeCloseTo(106)
  })

  it('moves to the toy’s own NW corner at 180°, which is now bottom-right on screen', () => {
    const origin = bowstringOrigin(geo, { deg: 180, cx: 50, cy: 50 })
    expect(origin.x).toBeCloseTo(106)
    expect(origin.y).toBeCloseTo(106)
  })

  it('picks the corner with the largest x + y on a non-square box', () => {
    // 200x20 box about (100,10); 90° turns it into a tall strip, and the
    // furthest-SE corner is the one that started at NE.
    const origin = bowstringOrigin({ x: 0, y: 0, width: 200, height: 20 }, { deg: 90, cx: 100, cy: 10 })
    expect(origin.x).toBeCloseTo(100 + 16)
    expect(origin.y).toBeCloseTo(10 + 106)
  })

  it('breaks a 45° tie toward the corner lower on screen', () => {
    // At 45° on a square ring the S and E corners tie on x + y.
    const origin = bowstringOrigin(geo, { deg: 45, cx: 50, cy: 50 })
    const r = 56 * Math.SQRT2
    expect(origin.x).toBeCloseTo(50)
    expect(origin.y).toBeCloseTo(50 + r)
  })

  it('treats deg 0 as unrotated', () => {
    expect(bowstringOrigin(geo, { deg: 0, cx: 50, cy: 50 }))
      .toEqual(bowstringOrigin(geo))
  })

  it('is unchanged from the no-rotation case when rot is explicitly null', () => {
    const g = { x: 10, y: 20, width: 100, height: 50 }
    expect(bowstringOrigin(g, null)).toEqual(bowstringOrigin(g))
  })
})

describe('hitTestBowstring', () => {
  const geo = { x: 0, y: 0, width: 100, height: 100 }
  const origin = bowstringOrigin(geo) // { x: 106, y: 106 }

  it('hits dead centre', () => {
    expect(hitTestBowstring(geo, origin.x, origin.y, 1)).toBe(true)
  })

  it('hits just inside the square\u2019s edge', () => {
    expect(hitTestBowstring(geo, origin.x + 10, origin.y + 10, 1)).toBe(true)
  })

  it('misses just outside the square', () => {
    expect(hitTestBowstring(geo, origin.x + 12, origin.y, 1)).toBe(false)
  })

  it('misses the opposite corner of the toy entirely', () => {
    expect(hitTestBowstring(geo, geo.x, geo.y, 1)).toBe(false)
  })

  it('grows its canvas-space hit box as the view zooms out', () => {
    // At scale 0.5 the 22px square covers 44 canvas units, so a point 20
    // units out — a miss at scale 1 — now lands inside it.
    expect(hitTestBowstring(geo, origin.x + 20, origin.y, 1)).toBe(false)
    expect(hitTestBowstring(geo, origin.x + 20, origin.y, 0.5)).toBe(true)
  })

  describe('on a rotated toy', () => {
    const rot = { deg: 180, cx: 50, cy: 50 }
    const seMost = bowstringOrigin(geo, rot) // (106, 106)
    const ownSE = { x: -6, y: -6 } // the toy's own SE corner, now top-left on screen

    it('hits at the south-east-most corner', () => {
      expect(hitTestBowstring(geo, seMost.x, seMost.y, 1, rot)).toBe(true)
    })

    it('misses the toy’s own rotated SE corner', () => {
      expect(hitTestBowstring(geo, ownSE.x, ownSE.y, 1, rot)).toBe(false)
    })
  })
})


describe('chargeOpacityFor — the clone fades in, then holds', () => {
  it('is fully transparent the instant the press lands', () => {
    expect(chargeOpacityFor(0)).toBe(0)
  })

  it('is half faded in at 250ms', () => {
    expect(chargeOpacityFor(250)).toBeCloseTo(0.5)
  })

  it('reaches full opacity at exactly 500ms', () => {
    expect(chargeOpacityFor(500)).toBe(1)
  })

  it('holds at full opacity indefinitely rather than looping or fading back', () => {
    expect(chargeOpacityFor(5_000)).toBe(1)
    expect(chargeOpacityFor(60_000)).toBe(1)
  })

  it('clamps a negative elapsed time to transparent', () => {
    expect(chargeOpacityFor(-100)).toBe(0)
  })

  it('increases monotonically across the fade', () => {
    const steps = [0, 100, 200, 300, 400, 500].map(chargeOpacityFor)
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeGreaterThan(steps[i - 1])
    }
  })
})

