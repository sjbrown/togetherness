/**
 * tests/unit/drop-target-hover.test.js
 *
 * Unit tests for the drop-target hover indicator (phase 5.3): overlay.js's
 * independent decoration, driven directly by App.move() during a toy drag
 * (not by SelectionMode or awareness — see setDropTargetHover).
 *
 * Same harness pattern as soft-lock-visual.test.js (real overlay.js +
 * jsdom, no App boot).
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  setDropTargetHover,
  init as overlayInit,
} from '../../src/overlay.js'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs>
        <linearGradient id="local-sel-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop id="local-sel-grad-stop0" offset="0%"   stop-color="#5a7ea8"></stop>
          <stop id="local-sel-grad-stop1" offset="100%" stop-color="#3a5e88"></stop>
        </linearGradient>
      </defs>
      <g id="overlay-layer"></g>
    </svg>
  `
}

function makeOverlayApp(bboxMap = {}) {
  return {
    getMyColor:    () => '#5a7ea8',
    getMyGradient: () => ({ c1: '#5a7ea8', c2: '#3a5e88', angle: 45 }),
    getViewScale:  () => 1,
    getBBox:       (id) => bboxMap[id] ?? null,
  }
}

const BBOX = { x: 10, y: 10, width: 200, height: 150 }

beforeEach(() => {
  makeOverlayDOM()
  overlayInit(makeOverlayApp({ tray1: BBOX }), document.getElementById('canvas'))
  setDropTargetHover(null) // _dropTargetTrayId is module state; clear leftovers from a prior test
})

describe('drop-target hover — basic presence', () => {
  test('setDropTargetHover(id) renders a dropTargetRing at that tray\u2019s bbox', () => {
    setDropTargetHover('tray1')

    const rings = document.querySelectorAll('#overlay-layer .dropTargetRing')
    expect(rings).toHaveLength(1)
  })

  test('setDropTargetHover(null) renders no ring', () => {
    setDropTargetHover('tray1')
    setDropTargetHover(null)

    expect(document.querySelectorAll('#overlay-layer .dropTargetRing')).toHaveLength(0)
  })

  test('never rendered by default (before any drag)', () => {
    expect(document.querySelectorAll('#overlay-layer .dropTargetRing')).toHaveLength(0)
  })

  test('switching hover to a different tray id replaces the ring, not adds a second one', () => {
    overlayInit(makeOverlayApp({ tray1: BBOX, tray2: { ...BBOX, x: 400 } }), document.getElementById('canvas'))
    setDropTargetHover('tray1')
    setDropTargetHover('tray2')

    expect(document.querySelectorAll('#overlay-layer .dropTargetRing')).toHaveLength(1)
  })

  test('an id with no bbox (not currently rendered) is skipped without throwing', () => {
    expect(() => setDropTargetHover('nope')).not.toThrow()
    expect(document.querySelectorAll('#overlay-layer .dropTargetRing')).toHaveLength(0)
  })

  test('is a no-op re-render when the id hasn\u2019t changed (idempotent while hovering the same tray across pointermoves)', () => {
    setDropTargetHover('tray1')
    const ringBefore = document.querySelector('#overlay-layer .dropTargetRing')
    setDropTargetHover('tray1')
    const ringAfter = document.querySelector('#overlay-layer .dropTargetRing')

    // render() rebuilds the whole overlay layer via innerHTML = '', so a
    // *real* re-render would produce a new element instance; same instance
    // proves the no-change guard actually skipped it.
    expect(ringAfter).toBe(ringBefore)
  })
})

describe('drop-target hover — visual distinction from the requested/contested indicator', () => {
  test('uses the amber --warn palette but does not pulse (no <animate>, unlike requestedRing)', () => {
    setDropTargetHover('tray1')
    const ring = document.querySelector('#overlay-layer .dropTargetRing')

    expect(ring.getAttribute('stroke')).toBe('var(--warn)')
    expect(ring.getAttribute('fill')).toBe('var(--warn-soft)')
    expect(ring.querySelector('animate')).toBeNull()
  })
})
