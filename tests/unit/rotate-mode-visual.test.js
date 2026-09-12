/**
 * tests/unit/rotate-mode-visual.test.js
 *
 * The 'sel-rotate' decoration overlay.js draws, and the rule that a rotated
 * element's selection furniture rides the same rotation the element itself
 * carries (getBBox stays unrotated — see overlay.js's decorRotation).
 *
 * Same harness pattern as drop-target-hover.test.js: real overlay.js + jsdom,
 * no App boot.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  localSelectionChanged,
  setSelectionMode,
  hitTestSelectionHandle,
  resizeCorners,
  init as overlayInit,
} from '../../src/overlay.js'

const BBOX = { x: 100, y: 100, width: 200, height: 100 }

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs></defs>
      <g id="overlay-layer"></g>
    </svg>
  `
}

// App.getRotation answers with a RESOLVED rotation — { deg, cx, cy } — so
// overlay.js never derives a pivot itself. `centre` defaults to the middle
// of BBOX; pass another to stand in for a pivot the user has moved.
function boot({ rotation = 0, centre = { cx: 200, cy: 150 } } = {}) {
  makeOverlayDOM()
  overlayInit({
    user:         { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
    getViewScale: () => 1,
    getBBox:      (id) => (id === 'rect1' ? BBOX : null),
    getRotation:  (id) => (id === 'rect1' && rotation ? { deg: rotation, ...centre } : null),
  }, document.getElementById('canvas'))
}

function enter(mode) {
  localSelectionChanged(['rect1'])
  setSelectionMode('rect1', mode)
}

const handles = () => document.querySelectorAll('#overlay-layer .handle')

beforeEach(() => boot())

describe('rotate handles are visually distinct from sel-resize handles', () => {
  test('four corner handles, one per corner, same positions as resize mode', () => {
    enter('sel-rotate-pivot')
    const hs = [...handles()]
    expect(hs).toHaveLength(4)
    expect(hs.map(h => h.getAttribute('data-corner'))).toEqual(['nw', 'ne', 'se', 'sw'])

    const corners = resizeCorners(BBOX)
    hs.forEach((h, i) => {
      const disc = h.querySelector('circle')
      expect(Number(disc.getAttribute('cx'))).toBe(corners[i].x)
      expect(Number(disc.getAttribute('cy'))).toBe(corners[i].y)
    })
  })

  test('rotate handles are round discs, resize handles are squares', () => {
    enter('sel-rotate-pivot')
    expect(document.querySelectorAll('#overlay-layer .handle circle')).toHaveLength(4)
    expect(document.querySelectorAll('#overlay-layer rect.handle')).toHaveLength(0)

    enter('sel-resize')
    expect(document.querySelectorAll('#overlay-layer rect.handle')).toHaveLength(4)
    expect(document.querySelectorAll('#overlay-layer .handle circle')).toHaveLength(0)
  })

  test('each rotate handle carries the circular-arrow glyph — the cue that says "spin"', () => {
    enter('sel-rotate-pivot')
    for (const h of handles()) {
      expect(h.querySelectorAll('.rotateGlyph').length).toBeGreaterThan(0)
    }
    enter('sel-resize')
    expect(document.querySelectorAll('#overlay-layer .rotateGlyph')).toHaveLength(0)
  })

  test('the handle class is what canvas.js and the CSS cursor hang off', () => {
    enter('sel-rotate-pivot')
    for (const h of handles()) expect(h.classList.contains('rotateHandle')).toBe(true)
  })

  // 'sel-rotate' is the fixed-pivot variant (toys); 'sel-rotate-pivot' the
  // one whose pivot the user can place (rects). Only the pivot differs, so
  // the decoration must be identical.
  test('the fixed-pivot and placeable-pivot modes draw the same decoration', () => {
    enter('sel-rotate')
    const fixed = document.getElementById('overlay-layer').innerHTML
    enter('sel-rotate-pivot')
    expect(document.getElementById('overlay-layer').innerHTML).toBe(fixed)
  })
})

describe('hitTestSelectionHandle in rotate mode', () => {
  const scale = 1

  test('returns the corner index under the pointer, like resize mode does', () => {
    const corners = resizeCorners(BBOX)
    for (const mode of ['sel-rotate', 'sel-rotate-pivot']) {
      corners.forEach((c, i) => {
        expect(hitTestSelectionHandle(mode, BBOX, c.x, c.y, scale)).toBe(i)
      })
    }
  })

  test('returns null well away from every corner', () => {
    expect(hitTestSelectionHandle('sel-rotate', BBOX, 200, 150, scale)).toBeNull()
    expect(hitTestSelectionHandle('sel-rotate-pivot', BBOX, 200, 150, scale)).toBeNull()
  })
})

describe('a rotated element’s furniture rides its rotation', () => {
  test('no transform at all when the element is unrotated — no extra node for the common case', () => {
    enter('sel-rotate-pivot')
    expect(document.querySelectorAll('#overlay-layer g[transform]')).toHaveLength(0)
  })

  test('ring and handles sit in one group turned about the element centre', () => {
    boot({ rotation: 30 })
    enter('sel-rotate-pivot')
    const groups = [...document.querySelectorAll('#overlay-layer g[transform]')]
    expect(groups).toHaveLength(1)
    // centre of BBOX: (200, 150)
    expect(groups[0].getAttribute('transform')).toBe('rotate(30 200 150)')
    expect(groups[0].querySelectorAll('.handle')).toHaveLength(4)
    expect(groups[0].querySelectorAll('.selRing')).toHaveLength(1)
  })

  test('the plain selection ring rotates too, so it hugs the shape rather than its bounds', () => {
    boot({ rotation: 45 })
    localSelectionChanged(['rect1'])
    const group = document.querySelector('#overlay-layer g[transform]')
    expect(group.getAttribute('transform')).toBe('rotate(45 200 150)')
    expect(group.querySelectorAll('.selRing')).toHaveLength(1)
  })

  test('the furniture turns about the pivot App reports, not the bbox middle', () => {
    // Stands in for a user-placed pivot on the NW corner of BBOX.
    boot({ rotation: 30, centre: { cx: 100, cy: 100 } })
    enter('sel-rotate-pivot')
    expect(document.querySelector('#overlay-layer g[transform]').getAttribute('transform'))
      .toBe('rotate(30 100 100)')
  })

  test('resize mode on an already-rotated element rotates its handles as well', () => {
    boot({ rotation: 90 })
    enter('sel-resize')
    const group = document.querySelector('#overlay-layer g[transform]')
    expect(group.getAttribute('transform')).toBe('rotate(90 200 150)')
    expect(group.querySelectorAll('rect.handle')).toHaveLength(4)
  })
})
