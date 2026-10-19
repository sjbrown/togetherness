import { describe, it, expect } from 'vitest'
import {
  paramSpec, defaultParams, buildSpokes, spotAngles, pickAt, defaultPick, samePick, cubicBezier,
  INNER_R, OUTER_R, MAX_SEGMENTS,
} from '../../src/ui_radial.js'

// A point at screen-px radius r along compass bearing deg (0 = north, clockwise).
function at(r, deg) {
  const a = (deg - 90) * Math.PI / 180
  return [r * Math.cos(a), r * Math.sin(a)]
}
// The bearing at the middle of spot n.
const spotMid = (n) => (n - 1) * 45 + 22.5
const MID_R = (INNER_R + OUTER_R) / 2

const item = (key, radial, enabled = true) => ({ namespace: 'ns', key, label: key, enabled, radial })

describe('paramSpec', () => {
  it('treats radial: true as a spoke with no parameter', () => {
    expect(paramSpec(true)).toEqual({ ok: true, param: null })
  })

  it('segments a small integer range, one value per segment', () => {
    const { ok, param } = paramSpec({ 'How many': { param: 'num', type: 'integer', default: 2, min: 1, max: 5 } })
    expect(ok).toBe(true)
    expect(param).toMatchObject({ label: 'How many', name: 'num', segmented: true, default: 2, values: [1, 2, 3, 4, 5] })
  })

  it('honours an integer step when segmenting', () => {
    const { param } = paramSpec({ N: { param: 'n', type: 'integer', min: 0, max: 20, step: 5 } })
    expect(param.values).toEqual([0, 5, 10, 15, 20])
  })

  it(`renders an integer range of more than ${MAX_SEGMENTS} values float-style`, () => {
    const { param } = paramSpec({ Sides: { param: 's', type: 'integer', min: 1, max: MAX_SEGMENTS + 1 } })
    expect(param.segmented).toBe(false)
    expect(param.values).toBeNull()
  })

  it('keeps exactly MAX_SEGMENTS values segmented', () => {
    const { param } = paramSpec({ N: { param: 'n', type: 'integer', min: 1, max: MAX_SEGMENTS } })
    expect(param.segmented).toBe(true)
  })

  it('never segments a float', () => {
    const { param } = paramSpec({ F: { param: 'f', type: 'float', min: 0, max: 1, step: 0.1, default: 0.5 } })
    expect(param).toMatchObject({ segmented: false, step: 0.1, default: 0.5 })
  })

  it('segments an enum, using labels for display when given', () => {
    const { param } = paramSpec({ Style: { param: 's', type: 'enum', values: ['a', 'b'], labels: ['A', 'B'], default: 'b' } })
    expect(param).toMatchObject({ segmented: true, values: ['a', 'b'], labels: ['A', 'B'], default: 'b' })
  })

  it('falls back to min, or the first enum value, when the default is missing or out of range', () => {
    expect(paramSpec({ N: { param: 'n', type: 'integer', min: 3, max: 6 } }).param.default).toBe(3)
    expect(paramSpec({ N: { param: 'n', type: 'integer', min: 3, max: 6, default: 99 } }).param.default).toBe(6)
    expect(paramSpec({ E: { param: 'e', type: 'enum', values: ['x', 'y'], default: 'z' } }).param.default).toBe('x')
  })

  it.each([
    ['a non-object', 'yes'],
    ['two parameters', { A: { param: 'a', type: 'integer', min: 0, max: 1 }, B: { param: 'b', type: 'integer', min: 0, max: 1 } }],
    ['no parameters', {}],
    ['a missing param name', { A: { type: 'integer', min: 0, max: 1 } }],
    ['min >= max', { A: { param: 'a', type: 'integer', min: 2, max: 2 } }],
    ['an empty enum', { A: { param: 'a', type: 'enum', values: [] } }],
    ['mismatched enum labels', { A: { param: 'a', type: 'enum', values: ['x'], labels: ['X', 'Y'] } }],
    ['an unknown type', { A: { param: 'a', type: 'colour' } }],
  ])('rejects %s', (_, radial) => {
    const r = paramSpec(radial)
    expect(r.ok).toBe(false)
    expect(r.error).toEqual(expect.any(String))
  })
})

describe('defaultParams', () => {
  it('is empty for an action with no radial, or a plain spoke', () => {
    expect(defaultParams(undefined)).toEqual({})
    expect(defaultParams(true)).toEqual({})
  })

  it('maps the parameter name to its default', () => {
    expect(defaultParams({ 'How many': { param: 'num', type: 'integer', default: 1, min: 1, max: 5 } })).toEqual({ num: 1 })
  })

  it('is empty for an invalid radial rather than throwing', () => {
    expect(defaultParams({ A: { type: 'nope' } })).toEqual({})
  })
})

describe('buildSpokes', () => {
  it('fills spots 4, 3, 5, 2, 1, 6 in declaration order', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'].map(k => item(k, true))
    expect(buildSpokes(items).spokes.map(s => s.spot)).toEqual([4, 3, 5, 2, 1, 6])
  })

  it('skips actions without a radial when assigning spots', () => {
    const { spokes } = buildSpokes([item('plain'), item('a', true), item('b', true)])
    expect(spokes.map(s => [s.key, s.spot])).toEqual([['a', 4], ['b', 3]])
  })

  it('is an authoring error past six spokes', () => {
    const items = Array.from({ length: 7 }, (_, i) => item(`k${i}`, true))
    expect(buildSpokes(items).error).toMatch(/7 .*maximum is 6/)
  })

  it('reports an invalid radial with the action key', () => {
    expect(buildSpokes([item('Bad', { A: { type: 'nope' } })]).error).toMatch(/^Bad: /)
  })

  it('marks the first applicable action as the default, spoke or not', () => {
    const { spokes } = buildSpokes([item('a', true, false), item('b', true), item('c', true)])
    expect(spokes.map(s => s.isDefault)).toEqual([false, true, false])
  })

  it('has no default spoke when the default action declares no radial', () => {
    const { spokes } = buildSpokes([item('plain'), item('a', true)])
    expect(spokes.some(s => s.isDefault)).toBe(false)
  })

  it('keeps a non-applicable spoke in its spot, disabled', () => {
    const { spokes } = buildSpokes([item('a', true), item('b', true, false), item('c', true)])
    expect(spokes.map(s => [s.spot, s.enabled])).toEqual([[4, true], [3, false], [5, true]])
  })
})

describe('spotAngles', () => {
  it('starts spot 1 at north and runs clockwise in 45° steps', () => {
    expect(spotAngles(1)).toEqual({ a0: -90, a1: -45, mid: -67.5 })
    expect(spotAngles(6)).toEqual({ a0: 135, a1: 180, mid: 157.5 })
  })
})

describe('pickAt', () => {
  const { spokes } = buildSpokes([
    item('Take', { 'How many': { param: 'num', type: 'integer', default: 1, min: 1, max: 5 } }),  // spot 4
    item('Scale', { F: { param: 'f', type: 'float', min: 0, max: 2, step: 0.5, default: 1 } }),  // spot 3
    item('Flip', true),                                                                          // spot 5
    item('Off', true, false),                                                                    // spot 2
  ])

  it('picks nothing inside the inner radius', () => {
    expect(pickAt(spokes, ...at(INNER_R - 1, spotMid(4)))).toBeNull()
  })

  it('picks nothing in the NW quadrant', () => {
    expect(pickAt(spokes, ...at(MID_R, 315))).toBeNull()
  })

  it('picks nothing on an empty spot or a non-applicable spoke', () => {
    expect(pickAt(spokes, ...at(MID_R, spotMid(1)))).toBeNull()
    expect(pickAt(spokes, ...at(MID_R, spotMid(2)))).toBeNull()
  })

  it('picks a segment by distance, min at the inside', () => {
    const band = (OUTER_R - INNER_R) / 5
    expect(pickAt(spokes, ...at(INNER_R + band * 0.5, spotMid(4))).params).toEqual({ num: 1 })
    expect(pickAt(spokes, ...at(INNER_R + band * 2.5, spotMid(4)))).toMatchObject({ params: { num: 3 }, index: 2 })
  })

  it('picks the max value past the outer radius, staying on the spoke', () => {
    expect(pickAt(spokes, ...at(OUTER_R + 80, spotMid(4))).params).toEqual({ num: 5 })
  })

  it('quantises a float to its step', () => {
    const p = pickAt(spokes, ...at(INNER_R + (OUTER_R - INNER_R) * 0.6, spotMid(3)))
    expect(p.params).toEqual({ f: 1 })
    expect(p.t).toBeCloseTo(0.5)
  })

  it('picks a plain spoke with no params', () => {
    expect(pickAt(spokes, ...at(MID_R, spotMid(5)))).toMatchObject({ params: {}, index: null })
  })
})

describe('defaultPick', () => {
  it('is the default spoke at its default value', () => {
    const { spokes } = buildSpokes([item('Take', { N: { param: 'n', type: 'integer', default: 3, min: 1, max: 5 } })])
    expect(defaultPick(spokes)).toMatchObject({ params: { n: 3 }, index: 2 })
  })

  it('covers a plain default spoke', () => {
    const { spokes } = buildSpokes([item('Roll', true)])
    expect(defaultPick(spokes)).toMatchObject({ params: {} })
  })

  it('is null when the default action has no spoke', () => {
    const { spokes } = buildSpokes([item('Roll'), item('Other', true)])
    expect(defaultPick(spokes)).toBeNull()
  })
})

describe('samePick', () => {
  it('compares spoke and params', () => {
    const s = {}
    expect(samePick({ spoke: s, params: { n: 1 } }, { spoke: s, params: { n: 1 } })).toBe(true)
    expect(samePick({ spoke: s, params: { n: 1 } }, { spoke: s, params: { n: 2 } })).toBe(false)
    expect(samePick(null, null)).toBe(true)
    expect(samePick(null, { spoke: s, params: {} })).toBe(false)
  })
})

describe('cubicBezier', () => {
  it('pins the endpoints', () => {
    const f = cubicBezier(0.34, 1.56, 0.64, 1)
    expect(f(0)).toBe(0)
    expect(f(1)).toBe(1)
  })

  it('overshoots for the snap-back curve', () => {
    const f = cubicBezier(0.34, 1.56, 0.64, 1)
    const peak = Math.max(...Array.from({ length: 99 }, (_, i) => f((i + 1) / 100)))
    expect(peak).toBeGreaterThan(1)
  })

  it('is linear for the linear curve', () => {
    const f = cubicBezier(1 / 3, 1 / 3, 2 / 3, 2 / 3)
    expect(f(0.25)).toBeCloseTo(0.25, 4)
  })

  it('front-loads an ease-out', () => {
    expect(cubicBezier(0, 0, 0.58, 1)(0.5)).toBeGreaterThan(0.5)
  })
})
