/**
 * tests/unit/attention-render.test.js
 *
 * Drawing scene items into #attention-layer: the origin's bars, dots and
 * gradient fill, trails, clicks, draw order and gradient lifetime.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import { T, FANCY, createRenderer, sceneAnimating, dotRing } from '../../src/attention_mode.js'

let layer, r

beforeEach(() => {
  document.body.innerHTML = '<svg><g id="attention-layer"></g></svg>'
  layer = document.getElementById('attention-layer')
  r = createRenderer(layer)
})

const settled = () => Infinity
const colors = { c1: 'hsl(10, 80%, 40%)', c2: 'hsl(30, 80%, 40%)' }
const originItem = (over = {}) => ({
  kind: 'origin', userId: 'bob', colors, fade: 1, intro: null, ageOf: settled,
  origin: [100, 200, 1000, 2, 2000], ...over,
})
const liveItem = (over = {}) => ({
  kind: 'live', userId: 'bob', colors, fade: 1, ageOf: (t) => 5000 - t,
  att: { trail: [[0, 0, 4900], [50, 0, 4950], [60, 0, 5000]], clicks: [[10, 10, 4901]], last: 5000, scale: 1 },
  ...over,
})

describe('origin', () => {
  test('bars circle with the gradient fill, and a dot ring scaled to the same angles', () => {
    r.draw([originItem()])
    const [bars, dots] = layer.querySelectorAll('.attention-fx circle')
    const k = 1 / 2
    expect(+bars.getAttribute('r')).toBe(T.ORIGIN_R * k)
    expect(bars.getAttribute('stroke')).toBe(colors.c1)
    expect(bars.getAttribute('fill')).toBe('url(#attn-grad-bob)')
    expect(bars.getAttribute('stroke-dasharray')).toBe(`${T.ORIGIN_DASH * k} ${T.ORIGIN_GAP * k}`)
    const { rIn, a } = dotRing(T.ORIGIN_R)
    expect(+dots.getAttribute('r')).toBe(rIn * k)
    expect(dots.getAttribute('fill')).toBe('none')
    expect(dots.getAttribute('stroke-dasharray')).toBe(`${T.ORIGIN_DASH * k * a} ${T.ORIGIN_GAP * k * a}`)
    expect(+dots.getAttribute('stroke-dashoffset')).toBeCloseTo(+bars.getAttribute('stroke-dashoffset') * a)
  })

  test('an expired origin settles at ORIGIN_EXPIRED_OPACITY', () => {
    r.draw([originItem({ fade: 0.5 })])
    const g = layer.querySelector('.attention-fx > g')
    expect(+g.getAttribute('opacity')).toBeCloseTo(0.5 * T.ORIGIN_EXPIRED_OPACITY)
  })

  test('the gradient is transparent at the core, c2 mid-way, c1 at the rim', () => {
    r.draw([originItem()])
    const stops = [...layer.querySelectorAll('defs #attn-grad-bob stop')]
    expect(stops.map((s) => [s.getAttribute('stop-color'), +s.getAttribute('stop-opacity')])).toEqual([
      [colors.c2, 0], [colors.c2, T.ORIGIN_FILL_OPACITY], [colors.c1, T.ORIGIN_FILL_OPACITY],
    ])
    expect(+stops[1].getAttribute('offset')).toBe(T.ORIGIN_GRAD_MID)
  })

  test('gradients survive redraws and are removed with their last origin', () => {
    r.draw([originItem()])
    const grad = layer.querySelector('#attn-grad-bob')
    r.draw([originItem()])
    expect(layer.querySelector('#attn-grad-bob')).toBe(grad)
    r.draw([])
    expect(layer.querySelector('#attn-grad-bob')).toBeNull()
    expect(layer.querySelector('.attention-fx').children).toHaveLength(0)
  })
})

describe('live', () => {
  test('draws trail segments with a c1→c2 mix, and click sparks', () => {
    r.draw([liveItem()])
    const lines = [...layer.querySelectorAll('.attention-fx line')]
    expect(lines.length).toBeGreaterThan(2)
    expect(lines[0].style.stroke).toContain('color-mix')
  })

  test('every origin is drawn under every trail', () => {
    r.draw([liveItem(), originItem({ userId: 'carol' })])
    const groups = [...layer.querySelectorAll('.attention-fx > g')]
    expect(groups[0].querySelector('circle[fill^="url"]')).not.toBeNull()
  })
})

describe('fancy explosion', () => {
  const fancyAt = (ageMs) => liveItem({
    ageOf: (t) => 10_000 + ageMs - t,
    att: { trail: [], clicks: [[10, 20, 10_000]], last: 10_000, scale: 2 },
  })

  test('replaces the normal explosion for a click whose t % FANCY_EVERY is 0', () => {
    r.draw([fancyAt(10)])
    expect(layer.querySelectorAll('.attention-fx line')).toHaveLength(0)       // no sparks
    expect(layer.querySelector('.attention-fx filter feTurbulence')).not.toBeNull()
  })

  test('sits on the click, scaled to the sender zoom, in the player colours', () => {
    r.draw([fancyAt(T.CLICK_MS)])            // into the blast
    const g = layer.querySelector('.attention-fx g[transform]')
    expect(g.getAttribute('transform')).toBe(`translate(10 20) scale(${T.FANCY_SCALE / 2}) translate(-200 -200)`)
    const stops = [...g.querySelectorAll('stop')]
    expect(stops.map((s) => [+s.getAttribute('offset'), s.getAttribute('stop-color')]))
      .toEqual([[0.73, colors.c1], [1, colors.c2]])
    expect(g.querySelector('path[fill-rule="evenodd"]').getAttribute('fill')).toMatch(/^url\(#attn-fancy-0-g\)$/)
  })

  test('smoke uses c2 and the ignition cross stays white', () => {
    const smokeAge = (FANCY.ignF + FANCY.blastF + FANCY.shockF + 2) * 1000 / FANCY.fps
    r.draw([fancyAt(smokeAge)])
    const rings = layer.querySelectorAll('.attention-fx g[fill="none"] circle')
    expect(rings).toHaveLength(FANCY.smokeN)
    expect(rings[0].getAttribute('stroke')).toBe(colors.c2)
    r.draw([fancyAt(0)])
    expect(layer.querySelector('.attention-fx g[fill="#ffffff"] rect')).not.toBeNull()
  })
})

describe('sceneAnimating', () => {
  test('a settled, unfaded origin is still; anything live, fading, intro-ing or coasting is not', () => {
    expect(sceneAnimating([originItem()])).toBe(false)
    expect(sceneAnimating([liveItem()])).toBe(true)
    expect(sceneAnimating([originItem({ fade: 0.9 })])).toBe(true)
    expect(sceneAnimating([originItem({ intro: { age: 10, ms: 250, r0Px: 300 } })])).toBe(true)
    expect(sceneAnimating([originItem({ origin: [0, 0, 1000, 1] , ageOf: (t) => 10 })])).toBe(true)
  })
})
