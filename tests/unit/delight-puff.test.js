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

describe('puffParticles with a direction', () => {
  // Angle of a particle's start point around the centre, undoing flatten.
  const angleOf = (p, cx, cy) => Math.atan2((p.y - cy) / PUFF.flatten, p.x - cx)
  const diff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

  it('places every particle within arc of the direction, even at the ends of rand', () => {
    for (const [direction, arc] of [[0, Math.PI / 2], [Math.PI / 2, Math.PI / 2], [-2.5, Math.PI / 3]]) {
      for (const r of [0, 0.5, 0.999]) {
        for (const p of puffParticles(10, 20, 80, 100, 1, { direction, arc, count: 4 }, () => r)) {
          expect(Math.abs(diff(angleOf(p, 10, 20), direction))).toBeLessThanOrEqual(arc / 2 + 1e-9)
          // and travels the same way it started
          expect(Math.abs(diff(Math.atan2(p.ty / PUFF.flatten, p.tx), direction))).toBeLessThanOrEqual(arc / 2 + 1e-9)
        }
      }
    }
  })

  it('defaults to a 90 degree arc', () => {
    expect(PUFF.arc).toBeCloseTo(Math.PI / 2)
    for (const p of puffParticles(0, 0, 80, 100, 1, { direction: 0 }, () => 0)) {
      expect(angleOf(p, 0, 0)).toBeCloseTo(-Math.PI / 4)
    }
  })
})

describe('the rise', () => {
  const mid = () => 0.5

  it('is its own value, scaled to the view, apart from the outward travel', () => {
    const [a] = puffParticles(0, 0, 80, 100, 1, { direction: 0, arc: 0 }, mid)
    expect(a.ty).toBeCloseTo(0)
    expect(a.rise).toBe(PUFF.rise)
    const [b] = puffParticles(0, 0, 80, 100, 2, { direction: 0, arc: 0 }, mid)
    expect(b.rise).toBe(PUFF.rise / 2)
  })

  it('takes as long as the puff unless riseMs says otherwise', () => {
    const [a] = puffParticles(0, 0, 80, 100, 1, {}, mid)
    expect(a.riseMs).toBe(a.ms)
    const [b] = puffParticles(0, 0, 80, 100, 1, { ms: 900, riseMs: 500 }, mid)
    expect(b.ms).toBe(900)
    expect(b.riseMs).toBe(500)
  })

  it('reaches the circle as --rise (upward) and --rise-ms', () => {
    document.body.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><g id="l"></g></svg>`
    const layer = document.getElementById('l')
    spawnPuff(layer, { x: 0, y: 0, w: 10, h: 10 }, 1, { count: 1, rise: 12, riseMs: 300, jitter: 0 })
    const c = layer.querySelector('circle')
    expect(c.style.getPropertyValue('--rise')).toBe('-12px')
    expect(c.style.getPropertyValue('--rise-ms')).toBe('300ms')
  })
})
