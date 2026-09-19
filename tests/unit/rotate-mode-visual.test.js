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
  hitTestPivot,
  handleCursor,
  resizeCorners,
  setPivotPreview,
  startDragPlaceholder,
  updateLocalDragGhost,
  endDragPlaceholder,
  startResizeGhost,
  updateRotateGhost,
  endResizeGhost,
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
function boot({ rotation = 0, centre = { cx: 200, cy: 150 }, pivot = { fx: 0.5, fy: 0.5 } } = {}) {
  makeOverlayDOM()
  setPivotPreview(null, null)   // module state — clear anything a prior test left
  overlayInit({
    user:         { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
    getViewScale: () => 1,
    getBBox:      (id) => (id === 'rect1' ? BBOX : null),
    getRotation:  (id) => (id === 'rect1' && rotation ? { deg: rotation, ...centre } : null),
    getPivot:     (id) => (id === 'rect1'
      ? { ...pivot, cx: BBOX.x + pivot.fx * BBOX.width, cy: BBOX.y + pivot.fy * BBOX.height }
      : null),
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
  // one whose pivot the user can place (rects). They share every bit of
  // rotate furniture; the placeable variant just adds the pivot handle.
  test('the two rotate modes draw identical corner handles and ring', () => {
    const furniture = () => [...document.querySelectorAll('#overlay-layer .handle, #overlay-layer .selRing')]
      .map(n => n.outerHTML).join('')
    enter('sel-rotate')
    const fixed = furniture()
    enter('sel-rotate-pivot')
    expect(furniture()).toBe(fixed)
  })

  test('only the placeable variant adds a pivot handle on top', () => {
    enter('sel-rotate')
    expect(document.querySelectorAll('#overlay-layer .pivotHandle')).toHaveLength(0)
    enter('sel-rotate-pivot')
    expect(document.querySelectorAll('#overlay-layer .pivotHandle')).toHaveLength(1)
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

// ─────────────────────────────────────────────────────────────────────────────
// Handle cursors. A handle is drawn turned with its shape, so the direction it
// drags along turns with it — the cursor is computed per render rather than
// pinned per corner in CSS.
// ─────────────────────────────────────────────────────────────────────────────

describe('handleCursor', () => {
  const CORNERS = ['nw', 'ne', 'se', 'sw']

  test('a resize corner shows the radius it stretches along', () => {
    for (const c of CORNERS) expect(handleCursor(c, 0, 'resize')).toBe(`${c}-resize`)
  })

  test('a rotate corner shows the tangent it travels along — the other diagonal', () => {
    expect(handleCursor('nw', 0, 'rotate')).toBe('ne-resize')
    expect(handleCursor('ne', 0, 'rotate')).toBe('nw-resize')
    expect(handleCursor('se', 0, 'rotate')).toBe('sw-resize')
    expect(handleCursor('sw', 0, 'rotate')).toBe('se-resize')
  })

  test('the tangent is always square to the radius, at any angle', () => {
    const idx = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
    for (const deg of [0, 45, 90, 135, 180, 225, 270, 315]) {
      for (const c of CORNERS) {
        const r = idx.indexOf(handleCursor(c, deg, 'resize').replace('-resize', ''))
        const t = idx.indexOf(handleCursor(c, deg, 'rotate').replace('-resize', ''))
        expect(Math.abs(r - t) % 4).toBe(2)   // 90° apart, either way round
      }
    }
  })

  test('a quarter turn steps every cursor a quarter of the way round', () => {
    expect(handleCursor('nw', 90, 'resize')).toBe('ne-resize')
    expect(handleCursor('ne', 90, 'resize')).toBe('se-resize')
    expect(handleCursor('se', 90, 'resize')).toBe('sw-resize')
    expect(handleCursor('sw', 90, 'resize')).toBe('nw-resize')
  })

  test('a half turn puts each corner on the same axis it started on', () => {
    // nw-resize and se-resize name the same diagonal, so 180° reads identically.
    expect(handleCursor('nw', 180, 'resize')).toBe('se-resize')
    expect(handleCursor('se', 180, 'resize')).toBe('nw-resize')
  })

  test('a full turn comes back to where it started', () => {
    for (const c of CORNERS) {
      expect(handleCursor(c, 360, 'resize')).toBe(handleCursor(c, 0, 'resize'))
      expect(handleCursor(c, 360, 'rotate')).toBe(handleCursor(c, 0, 'rotate'))
    }
  })

  test('angles between steps round to the nearest 45°, which is as fine as cursors go', () => {
    expect(handleCursor('nw', 20, 'resize')).toBe('nw-resize')   // rounds to 0
    expect(handleCursor('nw', 25, 'resize')).toBe('n-resize')    // rounds to 45
  })

  test('a negative or over-turned angle still lands in range', () => {
    expect(handleCursor('nw', -90, 'resize')).toBe('sw-resize')
    expect(handleCursor('nw', 450, 'resize')).toBe('ne-resize')
  })

  test('an unknown corner or mode has no cursor to offer', () => {
    expect(handleCursor('r', 0, 'resize')).toBeNull()
    expect(handleCursor('nw', 0, 'spin')).toBeNull()
  })
})

describe('handles carry their cursor inline, so it can follow the rotation', () => {
  const cursors = () => Object.fromEntries(
    [...document.querySelectorAll('#overlay-layer .handle')]
      .map(h => [h.getAttribute('data-corner'), h.style.cursor]))

  test('resize handles on an unrotated shape read like any resize handle', () => {
    boot()
    enter('sel-resize')
    expect(cursors()).toEqual({ nw: 'nw-resize', ne: 'ne-resize', se: 'se-resize', sw: 'sw-resize' })
  })

  test('rotate handles on an unrotated shape sit square to those', () => {
    boot()
    enter('sel-rotate-pivot')
    expect(cursors()).toEqual({ nw: 'ne-resize', ne: 'nw-resize', se: 'sw-resize', sw: 'se-resize' })
  })

  test('a turned shape turns its resize cursors with it', () => {
    boot({ rotation: 90 })
    enter('sel-resize')
    // At 90° the handle still labelled nw is drawn at the north-east position.
    expect(cursors()).toEqual({ nw: 'ne-resize', ne: 'se-resize', se: 'sw-resize', sw: 'nw-resize' })
  })

  test('a turned shape turns its rotate cursors with it', () => {
    boot({ rotation: 90 })
    enter('sel-rotate-pivot')
    expect(cursors()).toEqual({ nw: 'se-resize', ne: 'ne-resize', se: 'nw-resize', sw: 'sw-resize' })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The pivot handle. A centre dot plus eight radiating lines in four
// symmetric pairs, one pair per quadrant. A whole quadrant's pair fades
// together as the pivot nears the edge that quadrant leans toward — which is
// what lets it share the corners with the rotate handles instead of pushing
// them out of the way.
// ─────────────────────────────────────────────────────────────────────────────

const pivotRays = () => document.querySelectorAll('#overlay-layer .pivotHandle line')
// .pivotGlyph, not just any circle: the handle also carries an invisible
// hit-target circle (for the hover cursor) at the same coordinates.
const pivotDot  = () => document.querySelector('#overlay-layer .pivotHandle circle.pivotGlyph')

describe('the pivot handle', () => {
  test('is drawn in sel-rotate-pivot and nowhere else', () => {
    boot(); enter('sel-rotate-pivot')
    expect(document.querySelectorAll('#overlay-layer .pivotHandle')).toHaveLength(1)

    enter('sel-rotate')
    expect(document.querySelectorAll('#overlay-layer .pivotHandle')).toHaveLength(0)
    enter('sel-resize')
    expect(document.querySelectorAll('#overlay-layer .pivotHandle')).toHaveLength(0)
  })

  test('sits at the pivot point App reports', () => {
    boot({ pivot: { fx: 0, fy: 1 } }); enter('sel-rotate-pivot')
    expect(Number(pivotDot().getAttribute('cx'))).toBe(BBOX.x)
    expect(Number(pivotDot().getAttribute('cy'))).toBe(BBOX.y + BBOX.height)
  })

  test('shows all eight rays at the centre', () => {
    boot(); enter('sel-rotate-pivot')
    expect(pivotRays()).toHaveLength(8)
  })

  test('drops the two left-quadrant pairs at the left edge, keeping both right pairs', () => {
    boot({ pivot: { fx: 0, fy: 0.5 } }); enter('sel-rotate-pivot')
    expect(pivotRays()).toHaveLength(4)
  })

  test('keeps only the one pair pointing into the shape at a corner', () => {
    boot({ pivot: { fx: 0, fy: 0 } }); enter('sel-rotate-pivot')
    expect(pivotRays()).toHaveLength(2)
  })

  test('a faded ray is drawn at reduced opacity, not simply dropped', () => {
    boot({ pivot: { fx: 0.25, fy: 0.5 } }); enter('sel-rotate-pivot')
    const opacities = [...pivotRays()].map(r => Number(r.getAttribute('opacity')))
    expect(opacities).toContain(0.5)
    expect(opacities.filter(o => o === 1).length).toBeGreaterThan(0)
  })

  test('no ray reaches a corner’s rotate handle once the pivot is parked on it', () => {
    // The collision this design exists to avoid: measure every ray endpoint
    // against the rotate handle nearest the pivot.
    boot({ pivot: { fx: 0, fy: 0 } }); enter('sel-rotate-pivot')
    const [nw] = resizeCorners(BBOX)
    for (const line of pivotRays()) {
      const d = Math.hypot(Number(line.getAttribute('x2')) - nw.x, Number(line.getAttribute('y2')) - nw.y)
      expect(d).toBeGreaterThan(12)   // the rotate handle's own grab radius
    }
  })

  test('rides the rotation with the rest of the furniture', () => {
    boot({ rotation: 30, pivot: { fx: 0, fy: 0 } }); enter('sel-rotate-pivot')
    const group = document.querySelector('#overlay-layer g[transform]')
    expect(group.querySelectorAll('.pivotHandle')).toHaveLength(1)
  })

  test('a drag preview moves the handle without touching the committed pivot', () => {
    boot(); enter('sel-rotate-pivot')
    expect(Number(pivotDot().getAttribute('cx'))).toBe(BBOX.x + BBOX.width / 2)

    setPivotPreview('rect1', { fx: 0, fy: 0 })
    expect(Number(pivotDot().getAttribute('cx'))).toBe(BBOX.x)
    expect(pivotRays()).toHaveLength(2)

    setPivotPreview(null, null)
    expect(Number(pivotDot().getAttribute('cx'))).toBe(BBOX.x + BBOX.width / 2)
  })

  test('carries an invisible circle sized to the real hit radius, so hovering it shows the cursor', () => {
    // The rays/dot opt out of pointer-events (see icons.js), and a <g> has no
    // paintable geometry of its own — without a painted, non-glyph shape here,
    // .pivotHandle's `cursor: crosshair` rule never has anything to hover.
    boot({ pivot: { fx: 0, fy: 0 } }); enter('sel-rotate-pivot')
    const hit = document.querySelector('#overlay-layer .pivotHandle circle:not(.pivotGlyph)')
    expect(hit).not.toBeNull()
    expect(hit.getAttribute('fill')).toBe('transparent')

    const cx = Number(hit.getAttribute('cx'))
    const cy = Number(hit.getAttribute('cy'))
    const r = Number(hit.getAttribute('r'))
    const pt = { cx: BBOX.x, cy: BBOX.y }
    expect(hitTestPivot(pt, cx + r - 0.5, cy, 1)).toBe(true)
    expect(hitTestPivot(pt, cx + r + 0.5, cy, 1)).toBe(false)
  })
})

describe('hit-testing the pivot', () => {
  const pt = { cx: 200, cy: 150 }

  test('a point on the handle is a hit; one well away is not', () => {
    expect(hitTestPivot(pt, 200, 150, 1)).toBe(true)
    expect(hitTestPivot(pt, 260, 150, 1)).toBe(false)
    expect(hitTestPivot(null, 200, 150, 1)).toBe(false)
  })

  test('sel-rotate-pivot reports the pivot before the corner it is parked on', () => {
    const [nw] = resizeCorners(BBOX)
    const onNW = { cx: nw.x, cy: nw.y }
    // Same point hits the corner when no pivot is offered...
    expect(hitTestSelectionHandle('sel-rotate-pivot', BBOX, nw.x, nw.y, 1)).toBe(0)
    // ...and the pivot when one is sitting there.
    expect(hitTestSelectionHandle('sel-rotate-pivot', BBOX, nw.x, nw.y, 1, onNW)).toBe('pivot')
  })

  test('corners still answer when the pivot is elsewhere', () => {
    const [, ne] = resizeCorners(BBOX)
    const centre = { cx: 200, cy: 150 }
    expect(hitTestSelectionHandle('sel-rotate-pivot', BBOX, ne.x, ne.y, 1, centre)).toBe(1)
  })

  test('the fixed-pivot mode never reports a pivot, even if one is passed', () => {
    expect(hitTestSelectionHandle('sel-rotate', BBOX, 200, 150, 1, { cx: 200, cy: 150 })).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The sel-move drag ghost's dashed selection ring, on a rotated shape.
//
// The ghost itself is a <use href="#elId" transform="translate(dx,dy)">: the
// referenced element's own transform="rotate(deg cx cy)" (unmoved — it's
// still the committed DOM element) rotates it about its ORIGINAL center, and
// the outer translate then slides that already-rotated shape as a rigid
// body. The ring is a plain <rect> with no such element to inherit a
// transform from, so it has to be given the equivalent transform by hand.
// ─────────────────────────────────────────────────────────────────────────────

describe('drag ghost ring on a rotated shape', () => {
  const ring = () => document.querySelector('#overlay-layer .drag-ring')

  test('an unrotated shape’s ring carries no transform, as before', () => {
    boot({ rotation: 0 })
    startDragPlaceholder('rect1')
    updateLocalDragGhost('rect1', 10, -5)
    expect(ring().getAttribute('transform')).toBeNull()
    endDragPlaceholder('rect1')
  })

  test('a rotated shape’s ring picks up the same rotation, about the unshifted center, before any drag movement', () => {
    boot({ rotation: 90, centre: { cx: 200, cy: 150 } })
    startDragPlaceholder('rect1')
    updateLocalDragGhost('rect1', 0, 0)
    expect(ring().getAttribute('transform')).toBe('rotate(90 200 150)')
    endDragPlaceholder('rect1')
  })

  test('as the ghost is dragged, the ring’s rotation center shifts by the same (dx, dy) as the ghost’s own translate', () => {
    boot({ rotation: 90, centre: { cx: 200, cy: 150 } })
    startDragPlaceholder('rect1')
    updateLocalDragGhost('rect1', 15, -8)
    expect(ring().getAttribute('transform')).toBe('rotate(90 215 142)')
    endDragPlaceholder('rect1')
  })

  test('the ring’s own x/y/width/height are unaffected — only a transform is added on top', () => {
    boot({ rotation: 45, centre: { cx: 200, cy: 150 } })
    startDragPlaceholder('rect1')
    updateLocalDragGhost('rect1', 10, 10)
    const r = ring()
    // BBOX = {x:100,y:100,width:200,height:100}; PAD is overlay.js's own
    // constant (6) — same geometry math as the unrotated case, dx/dy baked
    // straight into position exactly as it always has been.
    expect(r.getAttribute('x')).toBe(String(100 + 10 - 6))
    expect(r.getAttribute('y')).toBe(String(100 + 10 - 6))
    expect(r.getAttribute('width')).toBe(String(200 + 12))
    expect(r.getAttribute('height')).toBe(String(100 + 12))
    endDragPlaceholder('rect1')
  })

  test('ending the drag leaves no stale ring behind', () => {
    boot({ rotation: 30 })
    startDragPlaceholder('rect1')
    updateLocalDragGhost('rect1', 5, 5)
    endDragPlaceholder('rect1')
    expect(ring()).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// updateRotateGhost — the live-drag ghost's own rotation, shared by every
// rotatable layer's resize/rotate ghost pair (_resizeGhosts). Reads/writes
// data-rotate directly and resolves the transform via drawing.js's
// resolveRotation called WITH an explicit geom, which is pure
// attribute-plus-arithmetic with zero dependency on the ghost's tagName —
// true of a cloned <rect> (drawing) exactly as much as a cloned <g> wrapping
// an <svg> (toys). This pins that generality directly, for both shapes,
// rather than relying only on drawing-rotate-mode/toy-rotate-mode's
// integration coverage of the gesture that drives it.
// ─────────────────────────────────────────────────────────────────────────────

describe('updateRotateGhost', () => {
  const SVGNS = 'http://www.w3.org/2000/svg'
  const GEO = { x: 100, y: 100, width: 200, height: 100 }   // centre (200, 150)

  function bootWithLiveEl(liveEl) {
    document.body.innerHTML = `
      <svg id="canvas">
        <defs></defs>
        <g id="overlay-layer"></g>
      </svg>
    `
    document.getElementById('canvas').appendChild(liveEl)
    setPivotPreview(null, null)
    const id = liveEl.getAttribute('data-id')
    // id-aware, not a blanket () => GEO: SelectionMode is overlay.js module
    // state that outlives any one test (earlier describe blocks in this file
    // leave a 'rect1' entry behind), so a fake that answered for EVERY id
    // would render an extra, geometry-less ghost/ring for that leftover
    // entry too — and .selRing would then match two elements, not one.
    overlayInit({
      user:         { id: 'me', name: 'Me', color: '#5a7ea8', gradient: { c1: '#5a7ea8', c2: '#3a5e88', angle: 45 } },
      getViewScale: () => 1,
      getBBox:      (i) => (i === id ? GEO : null),
      getRotation:  () => null,
    }, document.getElementById('canvas'))
  }

  const liveGhost = () => document.querySelector('#overlay-layer [opacity="0.85"]')

  test('a drawing-layer rect ghost rotates about the explicit geom’s centre', () => {
    const rect = document.createElementNS(SVGNS, 'rect')
    rect.setAttribute('data-id', 'shape1')
    Object.entries(GEO).forEach(([k, v]) => rect.setAttribute(k, v))
    bootWithLiveEl(rect)

    startResizeGhost('shape1')
    updateRotateGhost('shape1', 90, GEO)

    const ghost = liveGhost()
    expect(ghost.tagName).toBe('rect')
    expect(ghost.getAttribute('data-rotate')).toBe('90')
    expect(ghost.getAttribute('transform')).toBe('rotate(90 200 150)')
    endResizeGhost('shape1')
  })

  test('a toy-shaped <g> ghost ALSO rotates about the explicit geom’s centre — the bug this generalization fixes', () => {
    // Before the fix, this delegated to drawing.js's previewRotate, which
    // falls back to drawing.js's own shape-keyed getGeom() when no geom is
    // given — undefined for a <g>, collapsing the pivot to (0, 0) instead
    // of the toy's actual centre.
    const g = document.createElementNS(SVGNS, 'g')
    g.setAttribute('data-id', 'toy1')
    g.setAttribute('data-module', 'toys')
    const svg = document.createElementNS(SVGNS, 'svg')
    Object.entries(GEO).forEach(([k, v]) => svg.setAttribute(k, v))
    g.appendChild(svg)
    bootWithLiveEl(g)

    startResizeGhost('toy1')
    updateRotateGhost('toy1', 90, GEO)

    const ghost = liveGhost()
    expect(ghost.tagName).toBe('g')
    expect(ghost.getAttribute('data-rotate')).toBe('90')
    expect(ghost.getAttribute('transform')).toBe('rotate(90 200 150)')   // NOT rotate(90 0 0)
    endResizeGhost('toy1')
  })

  test('a negative/over-turned angle is normalized before it is stored', () => {
    const rect = document.createElementNS(SVGNS, 'rect')
    rect.setAttribute('data-id', 'shape1')
    Object.entries(GEO).forEach(([k, v]) => rect.setAttribute(k, v))
    bootWithLiveEl(rect)

    startResizeGhost('shape1')
    updateRotateGhost('shape1', -30, GEO)
    expect(liveGhost().getAttribute('data-rotate')).toBe('330')
    endResizeGhost('shape1')
  })

  test('a rotation of 0 leaves the ghost with no transform', () => {
    const rect = document.createElementNS(SVGNS, 'rect')
    rect.setAttribute('data-id', 'shape1')
    Object.entries(GEO).forEach(([k, v]) => rect.setAttribute(k, v))
    bootWithLiveEl(rect)

    startResizeGhost('shape1')
    updateRotateGhost('shape1', 0, GEO)
    expect(liveGhost().getAttribute('transform')).toBeNull()
    endResizeGhost('shape1')
  })

  test('the ghost’s ring tracks the same rotation, on the geom the gesture is previewing', () => {
    const rect = document.createElementNS(SVGNS, 'rect')
    rect.setAttribute('data-id', 'shape1')
    Object.entries(GEO).forEach(([k, v]) => rect.setAttribute(k, v))
    bootWithLiveEl(rect)

    startResizeGhost('shape1')
    updateRotateGhost('shape1', 45, GEO)

    const ring = document.querySelector('#overlay-layer .selRing')
    expect(ring.getAttribute('transform')).toBe('rotate(45 200 150)')
    endResizeGhost('shape1')
  })
})
