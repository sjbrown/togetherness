// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as Radial from '../../src/radial.js'

const SVGNS = 'http://www.w3.org/2000/svg'
const item = (key, radial, enabled = true) => ({ namespace: 'ns', key, label: key, enabled, radial })

let host
beforeEach(() => {
  document.body.innerHTML = ''
  const svg = document.createElementNS(SVGNS, 'svg')
  host = document.createElementNS(SVGNS, 'g')
  host.appendChild(document.createElementNS(SVGNS, 'g'))   // stands in for the bowstring chrome
  svg.appendChild(host)
  document.body.appendChild(svg)
})

function openWith(items, opts = {}) {
  const { spokes } = Radial.buildSpokes(items)
  return Radial.open(host, { spokes, origin: { x: 100, y: 100 }, scale: 1, paint: { grad: 'url(#g)', stop: '#f00' }, ...opts })
}

const spokeGroups = (state) => [...state.group.querySelectorAll(':scope > .spoke')]

describe('Radial.open', () => {
  it('inserts the menu under the bowstring chrome, hidden until shown', () => {
    const state = openWith([item('A', true)])
    expect(host.firstChild).toBe(state.group)
    expect(state.group.classList.contains('show')).toBe(false)
    Radial.show(state)
    expect(state.group.classList.contains('show')).toBe(true)
  })

  it('carries the player paint as custom properties', () => {
    const state = openWith([item('A', true)])
    expect(state.group.style.getPropertyValue('--radial-grad')).toBe('url(#g)')
    expect(state.group.style.getPropertyValue('--radial-stop')).toBe('#f00')
  })

  it('draws one group per spoke and one segment per value', () => {
    const state = openWith([
      item('Take', { N: { param: 'n', type: 'integer', min: 1, max: 5 } }),
      item('Flip', true),
    ])
    const [take, flip] = spokeGroups(state)
    expect(take.querySelectorAll('.spoke-seg')).toHaveLength(5)
    expect(flip.querySelectorAll('.spoke-seg')).toHaveLength(1)
  })

  it('pre-fills the default action at its default value as hovered', () => {
    const state = openWith([item('Take', { N: { param: 'n', type: 'integer', min: 1, max: 5, default: 2 } })])
    const [take] = spokeGroups(state)
    expect(take.classList.contains('hover')).toBe(true)
    const segs = [...take.querySelectorAll('.spoke-seg')]
    expect(segs.map(s => s.classList.contains('hover'))).toEqual([false, true, false, false, false])
    expect(take.querySelector('.label-band')).not.toBeNull()
  })

  it('pre-fills a plain default spoke too', () => {
    const state = openWith([item('Roll', true)])
    expect(spokeGroups(state)[0].querySelector('.spoke-seg.hover')).not.toBeNull()
  })

  it('omits every highlight on a non-applicable spoke', () => {
    const state = openWith([
      item('Take', { N: { param: 'n', type: 'integer', min: 1, max: 3 } }, false),
      item('Spin', { D: { param: 'd', type: 'float', min: 0, max: 1 } }, false),
      item('Other', true),
    ])
    const [take, spin] = spokeGroups(state)
    for (const g of [take, spin]) {
      expect(g.classList.contains('disabled')).toBe(true)
      expect(g.classList.contains('hover')).toBe(false)
      expect(g.querySelector('.spoke-outline, .seg-default, .float-default, .label-band, .hover')).toBeNull()
    }
  })
})

describe('Radial.setPick', () => {
  it('moves the hover off the default onto the pick', () => {
    const items = [item('A', true), item('B', { N: { param: 'n', type: 'integer', min: 1, max: 3 } })]
    const state = openWith(items)
    const b = state.spokes[1]
    Radial.setPick(state, { spoke: b, params: { n: 3 }, index: 2, t: null })
    const [ga, gb] = spokeGroups(state)
    expect(ga.classList.contains('hover')).toBe(false)
    expect([...gb.querySelectorAll('.spoke-seg')].map(s => s.classList.contains('hover'))).toEqual([false, false, true])
  })
})

describe('Radial.close', () => {
  it('removes a menu that never showed at once', () => {
    const state = openWith([item('A', true)])
    Radial.close(state)
    expect(state.group.isConnected).toBe(false)
  })

  it('fades a shown menu before removing it', () => {
    vi.useFakeTimers()
    const state = openWith([item('A', true)])
    Radial.show(state)
    Radial.close(state)
    expect(state.group.isConnected).toBe(true)
    expect(state.group.classList.contains('show')).toBe(false)
    vi.advanceTimersByTime(Radial.FADE_MS)
    expect(state.group.isConnected).toBe(false)
    vi.useRealTimers()
  })
})

describe('Radial.launchChosen', () => {
  it('copies the picked shape and its text as separate groups, then removes them', () => {
    const state = openWith([item('Take', { N: { param: 'n', type: 'integer', min: 1, max: 3, default: 2 } })])
    const remove = Radial.launchChosen(state, host, { x: 200, y: 150 }, 300, Radial.cubicBezier(0.34, 1.56, 0.64, 1))
    const arrows = host.querySelectorAll(':scope > .radial-arrow')
    expect(arrows).toHaveLength(2)
    expect(arrows[0].querySelector('path.spoke-seg')).not.toBeNull()
    expect(arrows[1].querySelector('text.seg-text').textContent).toBe('2')
    remove()
    expect(host.querySelectorAll('.radial-arrow')).toHaveLength(0)
  })

  it('does nothing when nothing is hovered', () => {
    const state = openWith([item('Roll'), item('A', true)])
    Radial.launchChosen(state, host, { x: 0, y: 0 }, 300, (t) => t)
    expect(host.querySelectorAll('.radial-arrow')).toHaveLength(0)
  })
})
