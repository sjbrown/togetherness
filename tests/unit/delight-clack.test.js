/**
 * tests/unit/delight-clack.test.js
 *
 * The snap clack: 5–8 radial lines around a toy that ended on a snap point,
 * outer ends within 100px of its centre, local only.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { init, clackLines, MIN_LINES, MAX_LINES, MAX_EXTENT, MS } from '../../src/delight_clack.js'

describe('clackLines', () => {
  it('makes 5 to 8 lines, never reaching past 100px from the centre', () => {
    const counts = new Set()
    for (let i = 0; i < 200; i++) {
      const lines = clackLines(50, 60, 1)
      counts.add(lines.length)
      expect(lines.length).toBeGreaterThanOrEqual(MIN_LINES)
      expect(lines.length).toBeLessThanOrEqual(MAX_LINES)
      for (const l of lines) {
        const outer = Math.hypot(l.x2 - 50, l.y2 - 60)
        const inner = Math.hypot(l.x1 - 50, l.y1 - 60)
        expect(outer).toBeLessThanOrEqual(MAX_EXTENT + 1e-9)
        expect(inner).toBeLessThan(outer)
      }
    }
    expect(counts.size).toBe(4)
  })

  it('divides screen px by the view scale', () => {
    for (const l of clackLines(0, 0, 2)) expect(Math.hypot(l.x2, l.y2)).toBeLessThanOrEqual(MAX_EXTENT / 2 + 1e-9)
  })

  it('is deterministic for a given rand', () => {
    expect(clackLines(0, 0, 1, () => 0.5)).toEqual(clackLines(0, 0, 1, () => 0.5))
  })
})

describe('clack', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  let svg, layer, bus

  const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }))
  const lines = () => [...layer.querySelectorAll('polygon.delight-clack')]

  beforeEach(() => {
    document.body.innerHTML = `<svg id="canvas" xmlns="${SVGNS}"><g id="toys-layer"></g><g id="delight-layer"></g></svg>`
    svg = document.getElementById('canvas')
    layer = svg.querySelector('#delight-layer')
    bus = new EventTarget()
    init({
      user: { id: 'u1', color: '#f00', gradient: { c1: '#f00', c2: '#00f', angle: 90 } },
      getViewScale: () => 1,
      on: (type, handler) => {
        const l = (e) => handler(e.detail)
        bus.addEventListener(type, l)
        return () => bus.removeEventListener(type, l)
      },
    }, svg)
  })

  it('draws lines for each snapped toy, in the delight layer only', () => {
    const before = svg.querySelector('#toys-layer').innerHTML
    emit('toy:move:snap', { pressId: 1, moves: [{ id: 'a', x: 100, y: 100 }, { id: 'b', x: 300, y: 100 }] })
    expect(lines().length).toBeGreaterThanOrEqual(2 * MIN_LINES)
    expect(lines().length).toBeLessThanOrEqual(2 * MAX_LINES)
    expect(svg.querySelector('#toys-layer').innerHTML).toBe(before)
  })

  it('animates over 300ms and removes each line when it ends', () => {
    expect(MS).toBe(300)
    emit('toy:move:snap', { pressId: 1, moves: [{ id: 'a', x: 10, y: 10 }] })
    const [first] = lines()
    expect(first.style.getPropertyValue('--clack-ms')).toBe('300ms')
    expect(first.style.transformOrigin).toBe('10px 10px')
    for (const l of lines()) l.dispatchEvent(new Event('animationend'))
    expect(lines()).toHaveLength(0)
  })

  it('fills the lines with the player’s gradient', () => {
    emit('toy:move:snap', { pressId: 1, moves: [{ id: 'a', x: 10, y: 10 }] })
    for (const l of lines()) expect(l.getAttribute('fill')).toBe('url(#grad-u1)')
  })

  it('does nothing under reduced motion', () => {
    globalThis.matchMedia = () => ({ matches: true })
    try {
      emit('toy:move:snap', { pressId: 1, moves: [{ id: 'a', x: 10, y: 10 }] })
      expect(lines()).toHaveLength(0)
    } finally { delete globalThis.matchMedia }
  })
})
