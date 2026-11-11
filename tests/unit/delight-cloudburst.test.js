/**
 * tests/unit/delight-cloudburst.test.js
 *
 * The cloudburst: ten puffs centred on each deleted toy, rising faster than
 * they spread, for the local player only.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { init, CLOUDBURST } from '../../src/delight_cloudburst.js'

describe('cloudburst', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  let svg, delightLayer, bus

  const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }))
  const puffs = () => [...delightLayer.querySelectorAll('circle.delight-puff')]

  beforeEach(() => {
    document.body.innerHTML = `<svg id="canvas" xmlns="${SVGNS}"><defs></defs><g id="delight-layer"></g></svg>`
    svg = document.getElementById('canvas')
    delightLayer = svg.querySelector('#delight-layer')
    bus = new EventTarget()
    init({
      getViewScale: () => 1,
      on: (type, handler) => {
        const l = (e) => handler(e.detail)
        bus.addEventListener(type, l)
        return () => bus.removeEventListener(type, l)
      },
    }, svg)
  })

  it('bursts ten puffs around each deleted toy’s centre', () => {
    emit('toy:gone', { toys: [
      { id: 'a', x: 100, y: 100, w: 80, h: 100 },
      { id: 'b', x: 400, y: 300, w: 80, h: 80 },
    ] })
    expect(puffs()).toHaveLength(20)
    const around = (x, y) => puffs().filter(c =>
      Math.hypot(+c.getAttribute('cx') - x, +c.getAttribute('cy') - y) <= 50 * CLOUDBURST.spread + 1e-9)
    expect(around(100, 100)).toHaveLength(10)
    expect(around(400, 300)).toHaveLength(10)
  })

  it('spreads all round, not in one direction', () => {
    emit('toy:gone', { toys: [{ id: 'a', x: 100, y: 100, w: 80, h: 100 }] })
    const xs = puffs().map(c => +c.getAttribute('cx'))
    const ys = puffs().map(c => +c.getAttribute('cy'))
    expect(Math.min(...xs)).toBeLessThan(100)
    expect(Math.max(...xs)).toBeGreaterThan(100)
    expect(Math.min(...ys)).toBeLessThan(100)
    expect(Math.max(...ys)).toBeGreaterThan(100)
  })

  it('climbs faster than it spreads', () => {
    expect(CLOUDBURST.riseMs).toBeLessThan(CLOUDBURST.ms)
    emit('toy:gone', { toys: [{ id: 'a', x: 0, y: 0, w: 80, h: 80 }] })
    for (const c of puffs()) {
      expect(parseFloat(c.style.getPropertyValue('--rise-ms'))).toBeLessThan(parseFloat(c.style.getPropertyValue('--puff-ms')))
      expect(parseFloat(c.style.getPropertyValue('--rise'))).toBeLessThan(0)
    }
  })

  it('does nothing when motion is reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    emit('toy:gone', { toys: [{ id: 'a', x: 100, y: 100, w: 80, h: 100 }] })
    expect(puffs()).toHaveLength(0)
    vi.unstubAllGlobals()
  })

  it('a second init drops the first subscription', () => {
    const first = bus
    init({ getViewScale: () => 1, on: () => () => {} }, svg)
    first.dispatchEvent(new CustomEvent('toy:gone', { detail: { toys: [{ id: 'a', x: 0, y: 0, w: 10, h: 10 }] } }))
    expect(puffs()).toHaveLength(0)
  })
})
