/**
 * tests/unit/delight-skid.test.js
 *
 * The move puff: a small dust puff where each moved toy now rests, for the
 * local player only, leaving the toys themselves untouched.
 */

// @vitest-environment jsdom
import { describe, it, test, expect, beforeEach, vi } from 'vitest'
import { init, puffDistFor, MIN_PUFF_DIST, MAX_PUFF_DIST, MAX_AT_TRAVEL } from '../../src/delight_skid.js'

describe('puffDistFor', () => {
  test('starts at the floor, 50, for no travel', () => {
    expect(puffDistFor(0)).toBe(50)
    expect(MIN_PUFF_DIST).toBe(50)
  })

  test('grows linearly, reaching 180 at 800', () => {
    expect(puffDistFor(400)).toBeCloseTo((MIN_PUFF_DIST + MAX_PUFF_DIST) / 2)
    expect(MAX_AT_TRAVEL).toBe(800)
    expect(puffDistFor(800)).toBe(180)
  })

  test('holds at the ceiling past 800', () => {
    expect(puffDistFor(5000)).toBe(MAX_PUFF_DIST)
  })

  test('only ever grows with travel', () => {
    let prev = 0
    for (let d = 0; d <= 1000; d += 25) {
      expect(puffDistFor(d)).toBeGreaterThanOrEqual(prev)
      prev = puffDistFor(d)
    }
  })
})

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

  describe('kicks the puff forward, within 90 degrees of the direction of travel', () => {
    const starts = () => puffs().map(c => ({ x: +c.getAttribute('cx'), y: +c.getAttribute('cy') }))
    const travel = () => puffs().map(c => ({ x: parseFloat(c.style.getPropertyValue('--tx')), y: parseFloat(c.style.getPropertyValue('--ty')) }))

    it('a move to the right puffs to the right', () => {
      toysLayer.append(toy('a', 300, 100, 80, 100))
      for (let i = 0; i < 20; i++) {
        emit('toy:move:place', { pressId: i, moves: [{ id: 'a', from: { x: 100, y: 100 }, x: 300, y: 100 }] })
      }
      expect(puffs()).toHaveLength(60)
      for (const p of starts()) expect(p.x).toBeGreaterThan(300)
      for (const t of travel()) {
        expect(t.x).toBeGreaterThan(0)
        expect(Math.abs(t.y)).toBeLessThanOrEqual(t.x * 0.8 + 1e-9)   // within 45deg, after flatten
      }
    })

    it('a move straight down puffs downward', () => {
      toysLayer.append(toy('a', 100, 300, 80, 100))
      for (let i = 0; i < 20; i++) {
        emit('toy:move:place', { pressId: i, moves: [{ id: 'a', from: { x: 100, y: 100 }, x: 100, y: 300 }] })
      }
      for (const p of starts()) expect(p.y).toBeGreaterThan(300)
    })

    it('a move that ends where it began puffs all round', () => {
      toysLayer.append(toy('a', 100, 100, 80, 100))
      emit('toy:move:place', { pressId: 1, moves: [{ id: 'a', from: { x: 100, y: 100 }, x: 100, y: 100 }] })
      const xs = starts().map(p => p.x)
      expect(Math.max(...xs)).toBeGreaterThan(100)
      expect(Math.min(...xs)).toBeLessThan(100)
    })
  })

  describe('puffs further the further the toy went', () => {
    // A rightward move keeps every particle within 45deg of +x, so its
    // horizontal travel is between cos(45deg) and 1 of the full distance,
    // times the puff's own +/-20% jitter.
    const txs = () => puffs().map(c => parseFloat(c.style.getPropertyValue('--tx')))
    const moveRight = (by, pressId = 1) => emit('toy:move:place', {
      pressId, moves: [{ id: 'a', from: { x: 100, y: 100 }, x: 100 + by, y: 100 }],
    })

    it('a short move gives a short puff', () => {
      toysLayer.append(toy('a', 120, 100, 80, 100))
      moveRight(20)
      for (const tx of txs()) expect(tx).toBeLessThanOrEqual(puffDistFor(20) * 1.2)
    })

    it('a move of 800px or more puffs at the ceiling', () => {
      toysLayer.append(toy('a', 1000, 100, 80, 100))
      for (let i = 0; i < 10; i++) moveRight(900, i)
      for (const tx of txs()) {
        expect(tx).toBeGreaterThanOrEqual(MAX_PUFF_DIST * Math.SQRT1_2 * 0.8)
        expect(tx).toBeLessThanOrEqual(MAX_PUFF_DIST * 1.2)
      }
    })

    it('measures the toy\u2019s travel and the puff\u2019s in screen px, so zoom doesn\u2019t change the look', () => {
      init({ getViewScale: () => 2, on: (type, handler) => {
        const l = (e) => handler(e.detail)
        bus.addEventListener(type, l)
        return () => bus.removeEventListener(type, l)
      } }, svg)
      toysLayer.append(toy('a', 500, 100, 80, 100))
      for (let i = 0; i < 10; i++) moveRight(400, i)   // 800 screen px at 2x
      for (const tx of txs()) {
        expect(tx).toBeGreaterThanOrEqual(MAX_PUFF_DIST * Math.SQRT1_2 * 0.8 / 2)
        expect(tx).toBeLessThanOrEqual(MAX_PUFF_DIST * 1.2 / 2)
      }
    })
  })

  describe('on a cancelled drag', () => {
    it('skids at the pointer, kicked along the pointer\u2019s travel', () => {
      for (let i = 0; i < 10; i++) {
        emit('toy:move:cancel', { pressId: i, pointer: { from: { x: 100, y: 100 }, x: 300, y: 100 } })
      }
      expect(puffs()).toHaveLength(30)
      for (const c of puffs()) {
        expect(+c.getAttribute('cx')).toBe(300)
        expect(+c.getAttribute('cy')).toBe(100)
        expect(parseFloat(c.style.getPropertyValue('--tx'))).toBeGreaterThan(0)
      }
    })

    it('does nothing for a tap, which has no pointer path', () => {
      emit('toy:move:cancel', { pressId: 1, pointer: null })
      expect(puffs()).toHaveLength(0)
    })
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
