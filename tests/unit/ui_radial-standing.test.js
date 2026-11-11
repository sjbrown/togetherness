// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildSpokes, openStanding, standingActive, moveStanding, pressStanding, INNER_R, OUTER_R,
} from '../../src/ui_radial.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const MID_R = (INNER_R + OUTER_R) / 2

// Spots fill in SPOT_ORDER (4, 3, ...), so the second item holds spot 3,
// which spans bearings 90..135; 112.5 is its middle.
const spotThree = (r) => {
  const a = (112.5 - 90) * Math.PI / 180
  return { x: 100 + r * Math.cos(a), y: 100 + r * Math.sin(a) }
}

let host, onPick
beforeEach(() => {
  host = document.createElementNS(SVG_NS, 'g')
  onPick = vi.fn()
  const items = [
    { namespace: 'ns', key: 'First', label: 'First', enabled: true, radial: true },
    { namespace: 'ns', key: 'Second', label: 'Second', enabled: true, radial: true },
  ]
  openStanding(host, { spokes: buildSpokes(items).spokes, origin: { x: 100, y: 100 }, scale: 1, onPick })
})

describe('standing menu', () => {
  it('is drawn and stays open until a press', () => {
    expect(standingActive()).toBe(true)
    expect(host.querySelector('.radial-menu.show')).not.toBeNull()
    moveStanding(spotThree(MID_R))
    expect(standingActive()).toBe(true)
  })

  it('a press on a spoke hands its pick to onPick and closes', () => {
    pressStanding(spotThree(MID_R))
    expect(onPick).toHaveBeenCalledTimes(1)
    expect(onPick.mock.calls[0][0].spoke.key).toBe('Second')
    expect(standingActive()).toBe(false)
  })

  it('a press elsewhere closes without firing', () => {
    pressStanding({ x: 100, y: 100 })
    expect(onPick).not.toHaveBeenCalled()
    expect(standingActive()).toBe(false)
  })

  it('opening another replaces the first', () => {
    vi.useFakeTimers()
    openStanding(host, { spokes: [], origin: { x: 0, y: 0 }, scale: 1, onPick: () => {} })
    vi.advanceTimersByTime(500)
    vi.useRealTimers()
    expect(host.querySelectorAll('.radial-menu').length).toBe(1)
  })
})
