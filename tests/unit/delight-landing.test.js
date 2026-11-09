/**
 * tests/unit/delight-landing.test.js
 *
 * The toy-landing squash and stretch: its timing math, and the DOM
 * lifecycle in #delight-layer — including that the real toy in #toys-layer
 * is never modified, only hidden by a page stylesheet rule that leaves it
 * hittable.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SQUASH, SQUASH_MS, HOLD_EXTRA, HOLD_MS, STRETCH, STRETCH_MS, PUFF,
  pressDeform, releaseDeform, releaseMs, settleMsFor, scaleFor, puffParticles,
  init, press, release, attach, cancel,
} from '../../src/delight_landing.js'

describe('pressDeform', () => {
  it('starts at rest', () => {
    expect(pressDeform(0)).toBeCloseTo(0)
  })

  it('reaches -SQUASH at SQUASH_MS', () => {
    expect(pressDeform(SQUASH_MS)).toBeCloseTo(-SQUASH)
  })

  it('deepens to -(SQUASH + HOLD_EXTRA) while held, and no further', () => {
    expect(pressDeform(SQUASH_MS + HOLD_MS)).toBeCloseTo(-(SQUASH + HOLD_EXTRA))
    expect(pressDeform(SQUASH_MS + HOLD_MS * 5)).toBeCloseTo(-(SQUASH + HOLD_EXTRA))
  })

  it('only ever squashes deeper as the hold goes on', () => {
    let prev = 0
    for (let t = 0; t <= SQUASH_MS + HOLD_MS; t += 10) {
      const d = pressDeform(t)
      expect(d).toBeLessThanOrEqual(prev + 1e-12)
      prev = d
    }
  })
})

describe('releaseDeform', () => {
  const d0 = -0.15

  it('starts from the press depth', () => {
    expect(releaseDeform(0, d0)).toBe(d0)
  })

  it('reaches STRETCH at STRETCH_MS', () => {
    expect(releaseDeform(STRETCH_MS, d0)).toBeCloseTo(STRETCH)
  })

  it('overshoots back past rest once, as a damped spring', () => {
    const ds = []
    for (let t = STRETCH_MS; t < releaseMs(); t += 5) ds.push(releaseDeform(t, d0))
    expect(Math.min(...ds)).toBeLessThan(0)
    expect(Math.min(...ds)).toBeGreaterThan(-STRETCH)
  })

  it('is exactly at rest once releaseMs has passed', () => {
    expect(releaseDeform(releaseMs(), d0)).toBe(0)
    expect(releaseDeform(releaseMs() + 1000, d0)).toBe(0)
  })

  it('settles in well under a second', () => {
    expect(releaseMs()).toBeGreaterThan(STRETCH_MS)
    expect(releaseMs()).toBeLessThan(1000)
  })

  it('has nothing to settle from a negligible amplitude', () => {
    expect(settleMsFor(0)).toBe(0)
  })
})

describe('scaleFor', () => {
  it('spreads when squashed and shrinks when stretched', () => {
    expect(scaleFor(0)).toBe(1)
    expect(scaleFor(-SQUASH)).toBeCloseTo(1 + SQUASH)
    expect(scaleFor(STRETCH)).toBeCloseTo(1 - STRETCH)
  })

  it('never reaches zero or flips', () => {
    expect(scaleFor(5)).toBeGreaterThan(0)
  })
})

describe('puffParticles', () => {
  const mid = () => 0.5   // no jitter

  it('makes PUFF.count particles', () => {
    expect(puffParticles(0, 0, 80, 100, 1)).toHaveLength(PUFF.count)
  })

  it('starts on a flattened ring around the centre and travels outward', () => {
    const ring = 50 * PUFF.spread
    for (const p of puffParticles(10, 20, 80, 100, 1, mid)) {
      const nx = (p.x - 10) / ring, ny = (p.y - 20) / (ring * PUFF.flatten)
      expect(Math.hypot(nx, ny)).toBeCloseTo(1)
      expect(Math.sign(p.tx)).toBe(Math.sign(Math.round((p.x - 10) * 1e6)))
      expect(p.r1).toBeCloseTo(p.r0 * PUFF.grow)
      expect(p.ms).toBe(PUFF.ms)
    }
  })

  it('keeps screen-px sizes constant across zoom', () => {
    const [a] = puffParticles(0, 0, 80, 100, 1, mid)
    const [b] = puffParticles(0, 0, 80, 100, 2, mid)
    expect(b.r0).toBeCloseTo(a.r0 / 2)
    expect(b.tx).toBeCloseTo(a.tx / 2)
    expect(b.x).toBeCloseTo(a.x)
  })
})

describe('landing lifecycle', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  let svg, toysLayer, delightLayer

  function toy(id, x, y, w, h) {
    const g = document.createElementNS(SVGNS, 'g')
    g.setAttribute('class', 'toy')
    g.setAttribute('id', id)
    g.setAttribute('data-id', id)
    const s = document.createElementNS(SVGNS, 'svg')
    s.setAttribute('x', x - w / 2); s.setAttribute('y', y - h / 2)
    s.setAttribute('width', w); s.setAttribute('height', h)
    g.appendChild(s)
    return g
  }
  const hideRules = () => document.getElementById('landing-hide-rules').textContent
  const advance = (ms) => vi.advanceTimersByTime(ms)

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'performance'] })
    document.head.innerHTML = ''
    document.body.innerHTML = `
      <svg id="canvas" xmlns="${SVGNS}">
        <defs><filter id="landing-puff"><feGaussianBlur stdDeviation="1"/></filter></defs>
        <g id="toys-layer"></g>
        <g id="delight-layer"></g>
      </svg>`
    svg = document.getElementById('canvas')
    toysLayer = svg.querySelector('#toys-layer')
    delightLayer = svg.querySelector('#delight-layer')
    init({ getViewScale: () => 2 }, svg)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('squashes a ghost at the press point while held', () => {
    const ghost = toy('ghost', 50, 60, 80, 100)
    const L = press(50, 60, ghost)
    expect(delightLayer.querySelector('.landing')).not.toBeNull()
    expect(ghost.parentNode).not.toBeNull()

    advance(SQUASH_MS + HOLD_MS)
    const m = ghost.parentNode.getAttribute('transform').match(/^translate\(50 60\) scale\(([\d.]+)\) translate\(-50 -60\)$/)
    expect(+m[1]).toBeCloseTo(1 + SQUASH + HOLD_EXTRA, 3)
    cancel(L)
  })

  it('swaps in a <use> of the real toy, hides it by rule, then cleans up', () => {
    const L = press(50, 60, toy('ghost', 50, 60, 80, 100))
    advance(200)
    release(L)
    expect(delightLayer.querySelectorAll('.landing-puff')).toHaveLength(PUFF.count)

    const real = toy('tt-t-v1-abc', 50, 60, 80, 100)
    toysLayer.appendChild(real)
    const before = real.outerHTML
    attach(L, real)

    const use = delightLayer.querySelector('.landing use')
    expect(use.getAttribute('href')).toBe('#tt-t-v1-abc')
    expect(delightLayer.querySelector('.landing [data-id]')).toBeNull()
    expect(hideRules()).toContain('#toys-layer [data-id="tt-t-v1-abc"]')
    expect(hideRules()).toContain('opacity: 0')

    advance(releaseMs() + 50)
    expect(delightLayer.querySelector('.landing')).toBeNull()
    expect(hideRules()).toBe('')
    expect(real.outerHTML).toBe(before)
  })

  it('without a ghost, waits for the real toy before starting the release', () => {
    const L = press(50, 60, null)
    release(L)
    advance(releaseMs() + 50)
    expect(delightLayer.querySelector('.landing')).not.toBeNull()
    expect(delightLayer.querySelectorAll('.landing-puff')).toHaveLength(0)

    const real = toy('tt-t-v1-late', 50, 60, 80, 100)
    toysLayer.appendChild(real)
    attach(L, real)
    expect(delightLayer.querySelectorAll('.landing-puff')).toHaveLength(PUFF.count)
    advance(releaseMs() + 50)
    expect(delightLayer.querySelector('.landing')).toBeNull()
  })

  it('holds the ghost past the end of the release until the real toy arrives', () => {
    const L = press(50, 60, toy('ghost', 50, 60, 80, 100))
    release(L)
    advance(releaseMs() + 50)
    expect(delightLayer.querySelector('.landing')).not.toBeNull()

    const real = toy('tt-t-v1-slow', 50, 60, 80, 100)
    toysLayer.appendChild(real)
    attach(L, real)
    advance(20)
    expect(delightLayer.querySelector('.landing')).toBeNull()
    expect(hideRules()).toBe('')
  })

  it('a cancelled press fades out and places nothing', () => {
    const L = press(50, 60, toy('ghost', 50, 60, 80, 100))
    advance(100)
    cancel(L)
    advance(500)
    expect(delightLayer.querySelector('.landing')).toBeNull()
    expect(delightLayer.querySelectorAll('.landing-puff')).toHaveLength(0)
    expect(hideRules()).toBe('')
  })

  it('sets the puff blur in screen px', () => {
    const L = press(50, 60, toy('ghost', 50, 60, 80, 100))
    release(L)
    expect(svg.querySelector('#landing-puff feGaussianBlur').getAttribute('stdDeviation')).toBe(String(PUFF.blur / 2))
    cancel(L)
  })

  it('does nothing when motion is reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    expect(press(50, 60, toy('ghost', 50, 60, 80, 100))).toBeNull()
    expect(delightLayer.querySelector('.landing')).toBeNull()
    vi.unstubAllGlobals()
  })

  it('release, attach and cancel accept a null landing', () => {
    expect(() => { release(null); attach(null, null); cancel(null) }).not.toThrow()
  })
})
