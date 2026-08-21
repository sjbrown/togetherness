/**
 * tests/unit/attr-ghost.test.js
 *
 * overlay.js's attribute-preview ghost (startAttrGhost/updateAttrGhost/
 * endAttrGhost) — the mechanism behind App.previewField (app.js), which
 * lets an Edit-panel field (e.g. a <range-ticked> stroke-width slider)
 * show a live preview on the canvas without writing to Yjs on every drag
 * tick. Same rationale, and same harness pattern (real overlay.js +
 * jsdom, no App boot), as drop-target-hover.test.js / resize.test.js.
 *
 * app.js's previewField/commitFieldPreview/cancelFieldPreview themselves
 * are untested here by convention — see this project's established
 * pattern of not importing app.js in unit tests (e.g.
 * toy-position-snap.test.js's header) and instead testing the primitives
 * it orchestrates. Real end-to-end drag behavior is verified separately
 * in a browser.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest'
import {
  startAttrGhost, updateAttrGhost, endAttrGhost,
  init as overlayInit,
} from '../../src/overlay.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function makeOverlayDOM() {
  document.body.innerHTML = `
    <svg id="canvas">
      <defs>
        <linearGradient id="local-sel-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop id="local-sel-grad-stop0" offset="0%"   stop-color="#5a7ea8"></stop>
          <stop id="local-sel-grad-stop1" offset="100%" stop-color="#3a5e88"></stop>
        </linearGradient>
      </defs>
      <g id="drawing-layer"></g>
      <g id="overlay-layer"></g>
    </svg>
  `
}

function makeOverlayApp() {
  return {
    getMyColor:    () => '#5a7ea8',
    getMyGradient: () => ({ c1: '#5a7ea8', c2: '#3a5e88', angle: 45 }),
    getViewScale:  () => 1,
    getBBox:       () => null,
  }
}

// Mirrors a real drawing-layer rect: data-id directly on the shape, no
// wrapper (see drawing.js's _toSVGEl) — unlike toys, which wrap in <g>.
function placeRect(id, attrs = {}) {
  const rect = document.createElementNS(SVG_NS, 'rect')
  rect.setAttribute('data-id', id)
  rect.setAttribute('id', id)
  rect.setAttribute('data-module', 'drawing')
  rect.setAttribute('stroke-width', '1.5')
  for (const [k, v] of Object.entries(attrs)) rect.setAttribute(k, v)
  document.getElementById('drawing-layer').appendChild(rect)
  return rect
}

beforeEach(() => {
  makeOverlayDOM()
  overlayInit(makeOverlayApp(), document.getElementById('canvas'))
  endAttrGhost('shape1') // _attrGhosts is module state; clear leftovers from a prior test
})

describe('startAttrGhost', () => {
  test('clones the live element into #overlay-layer, stripping its id', () => {
    placeRect('shape1')
    startAttrGhost('shape1')

    const ghosts = [...document.querySelectorAll('#overlay-layer rect')]
    expect(ghosts).toHaveLength(1)
    expect(ghosts[0].hasAttribute('id')).toBe(false)
    expect(ghosts[0]).not.toBe(document.getElementById('shape1')) // a clone, not the real node
  })

  test('also adds a dim placeholder <use> referencing the real element', () => {
    placeRect('shape1')
    startAttrGhost('shape1')

    const use = document.querySelector('#overlay-layer use')
    expect(use).not.toBeNull()
    expect(use.getAttribute('href')).toBe('#shape1')
    expect(use.getAttribute('filter')).toBe('url(#drag-placeholder-filter)')
  })

  test('is a no-op if the element cannot be found', () => {
    startAttrGhost('does-not-exist')
    expect(document.querySelectorAll('#overlay-layer *')).toHaveLength(0)
  })

  test('is idempotent — a second call for the same id does not add a second ghost', () => {
    placeRect('shape1')
    startAttrGhost('shape1')
    startAttrGhost('shape1')
    expect(document.querySelectorAll('#overlay-layer rect')).toHaveLength(1)
  })
})

describe('updateAttrGhost', () => {
  test('sets the attribute on the ghost clone only — the real element is untouched', () => {
    placeRect('shape1')
    startAttrGhost('shape1')

    updateAttrGhost('shape1', 'stroke-width', 6)

    const ghost = document.querySelector('#overlay-layer rect')
    expect(ghost.getAttribute('stroke-width')).toBe('6')
    expect(document.getElementById('shape1').getAttribute('stroke-width')).toBe('1.5') // real element, unchanged
  })

  test('is a no-op if no ghost was started for that id', () => {
    placeRect('shape1')
    expect(() => updateAttrGhost('shape1', 'stroke-width', 6)).not.toThrow()
    expect(document.querySelectorAll('#overlay-layer *')).toHaveLength(0)
  })

  test('can be called many times in a row without re-adding DOM nodes (cheap per-tick update)', () => {
    placeRect('shape1')
    startAttrGhost('shape1')
    for (const v of [2, 3, 4, 5, 6]) updateAttrGhost('shape1', 'stroke-width', v)
    expect(document.querySelectorAll('#overlay-layer rect')).toHaveLength(1)
    expect(document.querySelector('#overlay-layer rect').getAttribute('stroke-width')).toBe('6')
  })
})

describe('endAttrGhost', () => {
  test('removes both the ghost clone and the placeholder', () => {
    placeRect('shape1')
    startAttrGhost('shape1')
    updateAttrGhost('shape1', 'stroke-width', 6)

    endAttrGhost('shape1')

    expect(document.querySelectorAll('#overlay-layer *')).toHaveLength(0)
  })

  test('is a no-op if no ghost is active for that id', () => {
    expect(() => endAttrGhost('shape1')).not.toThrow()
  })

  test('a later startAttrGhost for the same id works again after ending — not permanently stuck', () => {
    placeRect('shape1')
    startAttrGhost('shape1')
    endAttrGhost('shape1')
    startAttrGhost('shape1')
    expect(document.querySelectorAll('#overlay-layer rect')).toHaveLength(1)
  })
})
