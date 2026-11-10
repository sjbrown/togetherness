/**
 * tests/unit/delight-puff.test.js
 *
 * The shared dust puff: particle geometry, and spawning into a layer.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { PUFF, PUFF_FILTER_ID, puffParticles, spawnPuff } from '../../src/delight_puff.js'

describe('puffParticles', () => {
  const mid = () => 0.5   // no jitter

  it('makes PUFF.count particles', () => {
    expect(puffParticles(0, 0, 80, 100, 1)).toHaveLength(PUFF.count)
  })

  it('starts on a flattened ring around the centre and travels outward', () => {
    const ring = 50 * PUFF.spread
    for (const p of puffParticles(10, 20, 80, 100, 1, {}, mid)) {
      const nx = (p.x - 10) / ring, ny = (p.y - 20) / (ring * PUFF.flatten)
      expect(Math.hypot(nx, ny)).toBeCloseTo(1)
      expect(Math.sign(p.tx)).toBe(Math.sign(Math.round((p.x - 10) * 1e6)))
      expect(p.r1).toBeCloseTo(p.r0 * PUFF.grow)
      expect(p.ms).toBe(PUFF.ms)
    }
  })

  it('keeps screen-px sizes constant across zoom', () => {
    const [a] = puffParticles(0, 0, 80, 100, 1, {}, mid)
    const [b] = puffParticles(0, 0, 80, 100, 2, {}, mid)
    expect(b.r0).toBeCloseTo(a.r0 / 2)
    expect(b.tx).toBeCloseTo(a.tx / 2)
    expect(b.x).toBeCloseTo(a.x)
  })
})

describe('puffParticles overrides', () => {
  it('takes any default as an override', () => {
    const ps = puffParticles(0, 0, 80, 100, 1, { count: 3, ms: 200, jitter: 0 })
    expect(ps).toHaveLength(3)
    for (const p of ps) expect(p.ms).toBe(200)
  })
})

describe('spawnPuff', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  let svg, layer

  beforeEach(() => {
    document.body.innerHTML = `<svg xmlns="${SVGNS}"><g id="delight-layer"></g></svg>`
    svg = document.querySelector('svg')
    layer = svg.querySelector('#delight-layer')
  })

  it('adds one self-removing circle per particle', () => {
    spawnPuff(layer, { x: 10, y: 20, w: 80, h: 100 }, 1, { count: 3 })
    const circles = layer.querySelectorAll('circle.delight-puff')
    expect(circles).toHaveLength(3)
    const fade = new Event('animationend')
    fade.animationName = 'delight-puff-fade'
    circles[0].dispatchEvent(fade)
    expect(layer.querySelectorAll('circle.delight-puff')).toHaveLength(2)
  })

  it('injects its blur filter once, at the view scale', () => {
    spawnPuff(layer, { x: 0, y: 0, w: 10, h: 10 }, 2)
    spawnPuff(layer, { x: 0, y: 0, w: 10, h: 10 }, 2)
    const filters = svg.querySelectorAll(`#${PUFF_FILTER_ID}`)
    expect(filters).toHaveLength(1)
    expect(filters[0].namespaceURI).toBe(SVGNS)
    expect(filters[0].querySelector('feGaussianBlur').getAttribute('stdDeviation')).toBe(String(PUFF.blur / 2))
  })
})
