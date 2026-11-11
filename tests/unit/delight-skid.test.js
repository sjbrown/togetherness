/**
 * tests/unit/delight-skid.test.js
 *
 * The move puff: a small dust puff where each moved toy now rests, for the
 * local player only, leaving the toys themselves untouched.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { init } from '../../src/delight_skid.js'

describe('skid', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  let svg, toysLayer, delightLayer, bus

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
  const emit = (type, detail) => bus.dispatchEvent(new CustomEvent(type, { detail }))
  const puffs = () => [...delightLayer.querySelectorAll('circle.delight-puff')]

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="canvas" xmlns="${SVGNS}">
        <defs></defs>
        <g id="toys-layer"></g>
        <g id="delight-layer"></g>
      </svg>`
    svg = document.getElementById('canvas')
    toysLayer = svg.querySelector('#toys-layer')
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

  it('puffs three particles around each moved toy’s resting centre', () => {
    toysLayer.append(toy('a', 100, 100, 80, 100), toy('b', 300, 100, 80, 80))
    const before = toysLayer.innerHTML
    emit('toy:move:place', { pressId: 1, moves: [{ id: 'a', x: 100, y: 100 }, { id: 'b', x: 300, y: 100 }] })

    expect(puffs()).toHaveLength(6)
    const near = (cx) => puffs().filter(c => Math.abs(+c.getAttribute('cx') - cx) <= 50)
    expect(near(100)).toHaveLength(3)
    expect(near(300)).toHaveLength(3)
    expect(toysLayer.innerHTML).toBe(before)
  })

  it('ignores the rest of the toy:move:* signals', () => {
    toysLayer.append(toy('a', 100, 100, 80, 100))
    emit('toy:move:press', { pressId: 2, moves: [{ id: 'a', from: { x: 100, y: 100 } }] })
    emit('toy:move:release', { pressId: 2 })
    emit('toy:move:cancel', { pressId: 2 })
    expect(puffs()).toHaveLength(0)
  })

  it('does nothing when motion is reduced', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    toysLayer.append(toy('a', 100, 100, 80, 100))
    emit('toy:move:place', { pressId: 1, moves: [{ id: 'a', x: 100, y: 100 }] })
    expect(puffs()).toHaveLength(0)
    vi.unstubAllGlobals()
  })

  it('a second init drops the first subscription', () => {
    const first = bus
    init({ getViewScale: () => 1, on: () => () => {} }, svg)
    toysLayer.append(toy('a', 100, 100, 80, 100))
    first.dispatchEvent(new CustomEvent('toy:move:place', { detail: { pressId: 1, moves: [{ id: 'a', x: 100, y: 100 }] } }))
    expect(puffs()).toHaveLength(0)
  })
})
