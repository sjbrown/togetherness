// @vitest-environment jsdom
/**
 * shapes.test.js
 * Run with: npx vitest run
 *
 * Tests import directly from drawing.js — the same code path as index.html.
 * Sync is simulated with Y.encodeStateAsUpdate / Y.applyUpdate.
 * Runs under jsdom because listDrawings / _toSVGEl render live SVG DOM.
 */

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import {
  addDrawing, deleteDrawing, findDrawing,
  getGeom, _toSVGEl, listDrawings, CURRENT_SCHEMA, SHAPE_TYPES,
  selectModes, nextSelectMode, computeResize,
  getRotation, syncRotation,
  applyRotate, applyMoveCommit, applyMoveDom, previewResize, previewRotate, rotationCenter,
  resolveRotation, rotationTransform, getPivot,
  snapPivot, computePivot, pivotShift, pivotRayOpacities, PIVOT_RAYS, applyPivot,
  reconcileImportedTransform, parseTransformList, reconcileTransform,
  PIVOT_SNAP_FRACTION,
} from '../../src/drawing.js'
import { tablesAPI } from '../../src/tables.js'

// ── Sync helper ───────────────────────────────────────────────────────────────

function sync(docA, docB) {
  Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
}

// makeDoc() (tables.js) returns a bare Y.Doc now — everything below this
// file was written against the old {ydoc, yDrawing} shape, so wrap it once
// here rather than touching every call site.
function makeDoc() {
  const ydoc = tablesAPI.makeDoc()
  return { ydoc, yDrawing: ydoc.getXmlFragment('drawing') }
}

// ── Shape factory ─────────────────────────────────────────────────────────────
// `add` defaults to a rect. Pass type + matching geometry to get other types.
// e.g. add(doc, { type: 'circle', cx: 50, cy: 50, r: 30 })
// The rect defaults (x, y, width, height) are silently ignored for other types
// because addDrawing only reads attrs listed in SHAPE_TYPES[type].geomAttrs.

const uid = () => Math.random().toString(36).slice(2, 9)

function add(doc, overrides = {}) {
  const id = overrides.id ?? uid()
  addDrawing(doc.ydoc, doc.yDrawing, {
    id, type: 'rect', x: 10, y: 10, width: 100, height: 50,
    fill: '#c8f060', stroke: 'none', 'stroke-width': 0, opacity: 1,
    ...overrides,
  })
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// SHAPE_TYPES registry
// Pure functions — no doc needed.
// ─────────────────────────────────────────────────────────────────────────────

describe('SHAPE_TYPES registry', () => {
  test('rect and circle entries exist with required keys', () => {
    for (const type of ['rect', 'circle']) {
      const def = SHAPE_TYPES[type]
      expect(def).toBeDefined()
      expect(typeof def.tag).toBe('string')
      expect(typeof def.getBBox).toBe('function')
      expect(typeof def.label).toBe('function')
      expect(def.schema).toBeDefined()
      expect(def.schema.values).toBeDefined()
      expect(def.schema.types).toBeDefined()
    }
  })

  test('rect getBBox returns x/y/width/height from stored attributes', () => {
    const b = SHAPE_TYPES.rect.getBBox({ x: '10', y: '20', width: '100', height: '50' })
    expect(b).toEqual({ x: 10, y: 20, width: 100, height: 50 })
    expect(typeof b.x).toBe('number')
  })

  test('circle getBBox derives bounding box from cx/cy/r', () => {
    const b = SHAPE_TYPES.circle.getBBox({ cx: '50', cy: '60', r: '30' })
    expect(b).toEqual({ x: 20, y: 30, width: 60, height: 60 })
    expect(typeof b.x).toBe('number')
  })

  test('rect label shows dimensions', () => {
    const s = SHAPE_TYPES.rect.label({ x: '10', y: '20', width: '100', height: '50' })
    expect(s).toContain('100')
    expect(s).toContain('50')
  })

  test('stroke-width range is 0.5-10, excluding 0 — stroke is toggled off via the stroke color control (its "None" swatch), not by zeroing the width', () => {
    for (const type of ['rect', 'circle']) {
      expect(SHAPE_TYPES[type].schema.types['stroke-width']).toEqual({
        kind: 'number', min: 0.5, max: 10, step: 0.5, show: ['edit'],
      })
    }
  })

  test('circle label shows radius', () => {
    const s = SHAPE_TYPES.circle.label({ cx: '50', cy: '60', r: '30' })
    expect(s).toContain('30')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Basic operations
// ─────────────────────────────────────────────────────────────────────────────

describe('basic operations', () => {
  test('add a rect', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', fill: 'red' })
    expect(doc.yDrawing.length).toBe(1)
    expect(findDrawing(doc.yDrawing, 'a').getAttribute('fill')).toBe('red')
  })

  test('add a circle', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 60, r: 30 })
    expect(doc.yDrawing.length).toBe(1)
    const el = findDrawing(doc.yDrawing, 'c')
    expect(el.getAttribute('cx')).toBe('50')
    expect(el.getAttribute('cy')).toBe('60')
    expect(el.getAttribute('r')).toBe('30')
    // a circle must not store rect-specific attrs
    expect(el.getAttribute('width')).toBeUndefined()
    expect(el.getAttribute('height')).toBeUndefined()
  })

  test('delete a shape', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    deleteDrawing(doc.ydoc, doc.yDrawing, 'a')
    expect(doc.yDrawing.length).toBe(1)
    expect(findDrawing(doc.yDrawing, 'b')).not.toBeNull()
    expect(findDrawing(doc.yDrawing, 'a')).toBeNull()
  })

  test('delete removes the element from the fragment', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    expect(findDrawing(doc.yDrawing, 'a')).not.toBeNull()
    deleteDrawing(doc.ydoc, doc.yDrawing, 'a')
    expect(findDrawing(doc.yDrawing, 'a')).toBeNull()
  })

  test('edit a shape attribute', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', fill: 'red' })
    const el = findDrawing(doc.yDrawing, 'a')
    doc.ydoc.transact(() => el.setAttribute('fill', 'blue'))
    expect(findDrawing(doc.yDrawing, 'a').getAttribute('fill')).toBe('blue')
  })

  test('z-order: shapes render in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'bottom' })
    add(doc, { id: 'middle' })
    add(doc, { id: 'top' })
    const ids = listDrawings(doc.yDrawing).map(svgEl => svgEl.getAttribute("data-id"))
    expect(ids).toEqual(['bottom', 'middle', 'top'])
  })

  test('rect attributes are stored as SVG-native names', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', width: 200, height: 80 })
    const el = findDrawing(doc.yDrawing, 'a')
    expect(el.getAttribute('width')).toBe('200')
    expect(el.getAttribute('height')).toBe('80')
  })

  test('circle attributes are stored as SVG-native names', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 100, cy: 120, r: 45 })
    const el = findDrawing(doc.yDrawing, 'c')
    expect(el.getAttribute('cx')).toBe('100')
    expect(el.getAttribute('cy')).toBe('120')
    expect(el.getAttribute('r')).toBe('45')
  })

  test('element tag and id are set correctly', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    const yEl = findDrawing(doc.yDrawing, 'a')
    expect(yEl.nodeName).toBe('rect')
    expect(yEl.getAttribute('id')).toBe('a')
  })

  test('circle element has correct tag', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 50, r: 20 })
    expect(findDrawing(doc.yDrawing, 'c').nodeName).toBe('circle')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getGeom — raw bounding box from a rendered svgEl (PAD lives in the overlay)
// ─────────────────────────────────────────────────────────────────────────────

describe('selectModes / nextSelectMode', () => {
  const rectEl   = () => document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  const circleEl = () => document.createElementNS('http://www.w3.org/2000/svg', 'circle')
  const lineEl   = () => document.createElementNS('http://www.w3.org/2000/svg', 'line')

  test('selectModes: sel-move plus rects support sel-resize/sel-rotate-pivot, circles sel-resize-r', () => {
    expect(selectModes(rectEl())).toEqual(['sel-move', 'sel-resize', 'sel-rotate-pivot'])
    expect(selectModes(circleEl())).toEqual(['sel-move', 'sel-resize-r'])
    expect(selectModes(lineEl())).toEqual(['sel-move'])
  })

  test('nextSelectMode cycles a rect sel-move -> sel-resize -> sel-rotate-pivot -> sel-move', () => {
    const el = rectEl()
    expect(nextSelectMode(el, null)).toBe('sel-move')
    expect(nextSelectMode(el, 'sel-move')).toBe('sel-resize')
    expect(nextSelectMode(el, 'sel-resize')).toBe('sel-rotate-pivot')
    expect(nextSelectMode(el, 'sel-rotate-pivot')).toBe('sel-move')
  })

  test('nextSelectMode cycles a circle through sel-move <-> sel-resize-r', () => {
    const el = circleEl()
    expect(nextSelectMode(el, null)).toBe('sel-move')
    expect(nextSelectMode(el, 'sel-move')).toBe('sel-resize-r')
    expect(nextSelectMode(el, 'sel-resize-r')).toBe('sel-move')
  })

  test('nextSelectMode always offers sel-move for a shape with no other selection modes', () => {
    expect(nextSelectMode(lineEl(), null)).toBe('sel-move')
  })
})

describe('computeResize', () => {
  // Corner indices: 0=NW, 1=NE, 2=SE, 3=SW.
  const startRect = { x: 100, y: 100, width: 200, height: 150 } // right=300, bottom=250

  // Full corner-by-corner coverage of the shared corner-opposite-fixed
  // algorithm (same fixture numbers) lives in tests/unit/geometry.test.js
  // now — this just checks the 'sel-resize' mode routes there at all, and
  // wires MIN_RECT_RESIZE_SIZE through as the clamp floor.
  test('sel-resize: routes to the shared corner algorithm with rects’ own minimum size', () => {
    const rect = computeResize('sel-resize', startRect, 2, 50, 50)
    expect(rect).toEqual({ x: 100, y: 100, width: 30, height: 30 }) // MIN_RECT_RESIZE_SIZE
  })

  test('sel-resize-r: grows a centered radius toward the pointer, ignoring corner', () => {
    const circleRect = { x: 100, y: 100, width: 80, height: 80 } // centre (140,140)
    const rect = computeResize('sel-resize-r', circleRect, 2, 220, 140)
    expect(rect).toEqual({ x: 60, y: 60, width: 160, height: 160 }) // r=80, centre unchanged
  })

  test('sel-resize-r: clamps to the minimum radius rather than collapsing to a point', () => {
    const circleRect = { x: 100, y: 100, width: 80, height: 80 }
    const rect = computeResize('sel-resize-r', circleRect, 2, 140, 140) // pointer AT the centre
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBe(rect.width)
  })
})

describe('getGeom', () => {
  // Helper: render a shape to its svgEl the same way listDrawings does.
  const elFor = (doc, id) => _toSVGEl(findDrawing(doc.yDrawing, id))

  test('returns numeric values for rect, not string-concatenated', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 20, y: 30, width: 100, height: 50 })
    const geo = getGeom(elFor(doc, 'a'))
    expect(geo).toEqual({ x: 20, y: 30, width: 100, height: 50 })
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('returns correct bbox for circle', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 60, r: 30 })
    const geo = getGeom(elFor(doc, 'c'))
    // bbox: x = cx-r, y = cy-r, w = 2r, h = 2r
    expect(geo).toEqual({ x: 20, y: 30, width: 60, height: 60 })
    expect(typeof geo.x).toBe('number')
  })

  test('rect returns exact shape geometry (no padding)', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 5, y: 10, width: 200, height: 80 })
    const geo = getGeom(elFor(doc, 'a'))
    expect(geo).toEqual({ x: 5, y: 10, width: 200, height: 80 })
  })

  test('circle returns exact bounding box (no padding)', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 100, cy: 100, r: 40 })
    const geo = getGeom(elFor(doc, 'c'))
    expect(geo).toEqual({ x: 60, y: 60, width: 80, height: 80 })
  })

  test('returns null for element with unregistered tag', () => {
    // An SVG element whose tag isn't in SHAPE_TYPES has no geometry def.
    const tri = document.createElementNS('http://www.w3.org/2000/svg', 'triangle')
    expect(getGeom(tri)).toBeNull()
  })

  test('returns null for nullish input', () => {
    expect(getGeom(null)).toBeNull()
    expect(getGeom(undefined)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// listDrawings
// ─────────────────────────────────────────────────────────────────────────────

describe('listDrawings', () => {
  test('returns shapes in z-order by default', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    add(doc, { id: 'c' })
    const ids = listDrawings(doc.yDrawing).map(svgEl => svgEl.getAttribute("data-id"))
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  test('lists shapes of mixed types in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'r', type: 'rect' })
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 50, r: 20 })
    const shapes = listDrawings(doc.yDrawing)
    expect(shapes).toHaveLength(2)
    expect(shapes[0].getAttribute('data-id')).toBe('r')
    expect(shapes[1].getAttribute('data-id')).toBe('c')
    // tagName reflects the actual SVG tag
    expect(shapes[0].tagName).toBe('rect')
    expect(shapes[1].tagName).toBe('circle')
  })

  test('skips non-element nodes', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    const shapes = listDrawings(doc.yDrawing)
    expect(shapes).toHaveLength(1)
    expect(shapes.every(svgEl => svgEl && svgEl.nodeType === 1)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRDT convergence
// ─────────────────────────────────────────────────────────────────────────────

describe('convergence', () => {
  test('concurrent adds on two peers — both survive after sync', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'from-peer1' })
    add(peer2, { id: 'from-peer2' })

    sync(peer1.ydoc, peer2.ydoc)

    expect(peer1.yDrawing.length).toBe(2)
    expect(peer2.yDrawing.length).toBe(2)

    const ids1 = listDrawings(peer1.yDrawing).map(svgEl => svgEl.getAttribute("data-id")).sort()
    const ids2 = listDrawings(peer2.yDrawing).map(svgEl => svgEl.getAttribute("data-id")).sort()
    expect(ids1).toEqual(ids2)
    expect(ids1).toContain('from-peer1')
    expect(ids1).toContain('from-peer2')
  })

  test('both peers converge to identical state after sync', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'a' })
    add(peer2, { id: 'b' })
    sync(peer1.ydoc, peer2.ydoc)

    const state1 = Y.encodeStateAsUpdate(peer1.ydoc)
    const state2 = Y.encodeStateAsUpdate(peer2.ydoc)
    expect(Buffer.from(state1).toString('hex')).toBe(Buffer.from(state2).toString('hex'))
  })

  test('concurrent attribute edits on same shape — both applied independently', () => {
    const peer1 = makeDoc()
    add(peer1, { id: 'shared', fill: 'red', x: 10 })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)

    // Partition
    const el1 = findDrawing(peer1.yDrawing, 'shared')
    const el2 = findDrawing(peer2.yDrawing, 'shared')
    peer1.ydoc.transact(() => el1.setAttribute('fill', 'blue'))
    peer2.ydoc.transact(() => el2.setAttribute('x', '99'))

    sync(peer1.ydoc, peer2.ydoc)

    expect(findDrawing(peer1.yDrawing, 'shared').getAttribute('fill')).toBe('blue')
    expect(findDrawing(peer1.yDrawing, 'shared').getAttribute('x')).toBe('99')
    expect(findDrawing(peer2.yDrawing, 'shared').getAttribute('fill')).toBe('blue')
    expect(findDrawing(peer2.yDrawing, 'shared').getAttribute('x')).toBe('99')
  })

  test('concurrent delete on one peer, edit on other — delete wins', () => {
    const peer1 = makeDoc()
    add(peer1, { id: 'doomed', fill: 'red' })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)

    deleteDrawing(peer1.ydoc, peer1.yDrawing, 'doomed')
    const el2 = findDrawing(peer2.yDrawing, 'doomed')
    peer2.ydoc.transact(() => el2.setAttribute('fill', 'blue'))

    sync(peer1.ydoc, peer2.ydoc)

    expect(peer1.yDrawing.length).toBe(0)
    expect(peer2.yDrawing.length).toBe(0)
  })

  test('three-way merge — all peers converge', () => {
    const peers = [makeDoc(), makeDoc(), makeDoc()]

    add(peers[0], { id: 'p0' })
    add(peers[1], { id: 'p1' })
    add(peers[2], { id: 'p2' })

    sync(peers[0].ydoc, peers[1].ydoc)
    sync(peers[1].ydoc, peers[2].ydoc)
    sync(peers[0].ydoc, peers[2].ydoc)

    const lengths = peers.map(p => p.yDrawing.length)
    expect(lengths).toEqual([3, 3, 3])

    const idSets = peers.map(p =>
      listDrawings(p.yDrawing).map(svgEl => svgEl.getAttribute("data-id")).sort().join(',')
    )
    expect(idSets[0]).toBe(idSets[1])
    expect(idSets[1]).toBe(idSets[2])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Z-order
// ─────────────────────────────────────────────────────────────────────────────

describe('z-order', () => {
  test('delete + re-append moves an element to the end of the fragment', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    add(doc, { id: 'c' })

    // Bring 'a' to front
    const old   = findDrawing(doc.yDrawing, 'a')
    const attrs = old.getAttributes()
    doc.ydoc.transact(() => {
      deleteDrawing(doc.ydoc, doc.yDrawing, 'a')
      addDrawing(doc.ydoc, doc.yDrawing, {
        ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, isNaN(v) ? v : Number(v)])),
        type: old.nodeName,
      })
    })

    const ids = listDrawings(doc.yDrawing).map(svgEl => svgEl.getAttribute("data-id"))
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  test('concurrent adds produce consistent z-order on both peers', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'p1-shape' })
    add(peer2, { id: 'p2-shape' })
    sync(peer1.ydoc, peer2.ydoc)

    const order1 = listDrawings(peer1.yDrawing).map(svgEl => svgEl.getAttribute("data-id"))
    const order2 = listDrawings(peer2.yDrawing).map(svgEl => svgEl.getAttribute("data-id"))
    expect(order1).toEqual(order2)
    expect(order1.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Rotation
// Stored as a degree count (data-rotate); the SVG transform is derived from
// it plus the shape's current geometry, never stored.
// ─────────────────────────────────────────────────────────────────────────────

// snapAngle/normalizeAngle/computeRotate now live in geometry.js — see
// tests/unit/geometry.test.js.

describe('rotation on the DOM', () => {
  const rectDom = (attrs = {}) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    for (const [k, v] of Object.entries({ x: 50, y: 50, width: 100, height: 100, ...attrs })) {
      el.setAttribute(k, String(v))
    }
    return el
  }

  test('getRotation reads data-rotate, defaulting to 0', () => {
    expect(getRotation(rectDom())).toBe(0)
    expect(getRotation(rectDom({ 'data-rotate': '45' }))).toBe(45)
    expect(getRotation(null)).toBe(0)
  })

  test('rotationCenter defaults to the centre of the unrotated bbox', () => {
    expect(rotationCenter({ x: 50, y: 50, width: 100, height: 200 })).toEqual({ cx: 100, cy: 150 })
  })

  test('rotationCenter resolves any pivot as fractions of the bbox', () => {
    const geom = { x: 50, y: 50, width: 100, height: 200 }
    expect(rotationCenter(geom, { fx: 0, fy: 0 })).toEqual({ cx: 50, cy: 50 })    // NW
    expect(rotationCenter(geom, { fx: 0, fy: 1 })).toEqual({ cx: 50, cy: 250 })   // SW
    expect(rotationCenter(geom, { fx: 1.5, fy: 0.5 })).toEqual({ cx: 200, cy: 150 }) // outside
  })

  test('a pivot expressed as fractions rides a resize, an absolute point would not', () => {
    const pivot = getPivot(rectDom())
    const before = rotationCenter({ x: 0, y: 0, width: 100, height: 100 }, pivot)
    const after  = rotationCenter({ x: 0, y: 0, width: 200, height: 200 }, pivot)
    expect(before).toEqual({ cx: 50, cy: 50 })
    expect(after).toEqual({ cx: 100, cy: 100 })
  })

  test('resolveRotation is null for an unrotated shape, { deg, cx, cy } otherwise', () => {
    expect(resolveRotation(rectDom())).toBeNull()
    expect(resolveRotation(rectDom({ 'data-rotate': '30' }))).toEqual({ deg: 30, cx: 100, cy: 100 })
  })

  test('rotationTransform formats a resolved rotation, and null stays null', () => {
    expect(rotationTransform({ deg: 30, cx: 100, cy: 100 })).toBe('rotate(30 100 100)')
    expect(rotationTransform(null)).toBeNull()
  })

  test('syncRotation derives a transform about the shape centre', () => {
    const el = rectDom({ 'data-rotate': '30' })
    syncRotation(el)
    expect(el.getAttribute('transform')).toBe('rotate(30 100 100)')
  })

  test('a rotation of 0 carries no transform at all', () => {
    const el = rectDom({ 'data-rotate': '0' })
    syncRotation(el)
    expect(el.getAttribute('transform')).toBeNull()
  })

  test('a shape with no data-rotate keeps whatever transform its author gave it', () => {
    const el = rectDom({ transform: 'rotate(30 100 100)' })
    syncRotation(el)
    expect(el.getAttribute('transform')).toBe('rotate(30 100 100)')
  })

  test('a shape whose rotation went back to 0 sheds the transform it had', () => {
    const el = rectDom({ 'data-rotate': '30' })
    syncRotation(el)
    previewRotate(el, 0)
    expect(el.getAttribute('transform')).toBeNull()
  })

  test('_toSVGEl renders the stored rotation as a transform', () => {
    const doc = makeDoc()
    add(doc, { id: 'r1', x: 0, y: 0, width: 100, height: 60, rotate: 45 })
    const el = _toSVGEl(findDrawing(doc.yDrawing, 'r1'))
    expect(el.getAttribute('data-rotate')).toBe('45')
    expect(el.getAttribute('transform')).toBe('rotate(45 50 30)')
  })

  test('the pivot follows the shape — previewResize re-centres the transform', () => {
    const el = rectDom({ 'data-rotate': '45' })
    syncRotation(el)
    expect(el.getAttribute('transform')).toBe('rotate(45 100 100)')
    previewResize(el, 50, 50, 200, 200)
    expect(el.getAttribute('transform')).toBe('rotate(45 150 150)')
  })

  test('previewRotate sets both the stored degrees and the derived transform', () => {
    const el = rectDom()
    previewRotate(el, 90)
    expect(el.getAttribute('data-rotate')).toBe('90')
    expect(el.getAttribute('transform')).toBe('rotate(90 100 100)')
  })

  test('previewResize on a circle keeps the centre and derives r from the bbox', () => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    previewResize(el, 60, 60, 80, 80)
    expect(el.getAttribute('cx')).toBe('100')
    expect(el.getAttribute('cy')).toBe('100')
    expect(el.getAttribute('r')).toBe('40')
  })
})

describe('applyRotate', () => {
  test('writes a normalized degree count that survives sync', () => {
    const a = makeDoc()
    const b = makeDoc()
    add(a, { id: 'r1' })
    sync(a.ydoc, b.ydoc)

    applyRotate(a.ydoc, findDrawing(a.yDrawing, 'r1'), -30)
    sync(a.ydoc, b.ydoc)
    expect(findDrawing(b.yDrawing, 'r1').getAttribute('data-rotate')).toBe('330')
  })

  test('is a no-op for a shape type whose schema has no rotate key', () => {
    const doc = makeDoc()
    add(doc, { id: 'c1', type: 'circle', cx: 50, cy: 50, r: 30 })
    const yEl = findDrawing(doc.yDrawing, 'c1')
    applyRotate(doc.ydoc, yEl, 45)
    expect(yEl.getAttribute('data-rotate')).toBeUndefined()
  })

  test('a rotated rect keeps its rotation across a move', () => {
    const doc = makeDoc()
    add(doc, { id: 'r1', x: 0, y: 0, width: 100, height: 60, rotate: 45 })
    const yEl = findDrawing(doc.yDrawing, 'r1')
    applyMoveCommit(doc.ydoc, yEl, 200, 200)
    const el = _toSVGEl(yEl)
    expect(el.getAttribute('transform')).toBe('rotate(45 250 230)')
  })
})

describe('parseTransformList', () => {
  const near = (m, expected) => m.forEach((n, i) => expect(n).toBeCloseTo(expected[i], 5))

  test('reads a three-argument rotate — the form CSS has no equivalent of', () => {
    near(parseTransformList('rotate(90 100 100)'), [0, 1, -1, 0, 200, 0])
  })

  test('composes a whole list left to right', () => {
    near(parseTransformList('translate(10 5) scale(2)'), [2, 0, 0, 2, 10, 5])
  })

  test('accepts comma separators and a bare matrix', () => {
    near(parseTransformList('matrix(1,0,0,1,7,8)'), [1, 0, 0, 1, 7, 8])
  })

  test('handles every term an editor might emit', () => {
    for (const t of ['translate(5)', 'scale(2)', 'rotate(30)', 'skewX(10)', 'skewY(10)']) {
      expect(parseTransformList(t)).not.toBeNull()
    }
  })

  test('refuses a list it does not fully understand rather than acting on half of it', () => {
    expect(parseTransformList('rotate(30) wobble(3)')).toBeNull()
    expect(parseTransformList('translate(nope)')).toBeNull()
    expect(parseTransformList('')).toBeNull()
    expect(parseTransformList(null)).toBeNull()
  })
})

describe('reconcileTransform', () => {
  const geom = { x: 100, y: 100, width: 200, height: 120 }
  // Where the shape's corners land under a raw matrix, vs under what the
  // document would hold after reconciling. Those must agree, or the import
  // moved the shape.
  const corners = (g) => [[g.x, g.y], [g.x + g.width, g.y], [g.x + g.width, g.y + g.height], [g.x, g.y + g.height]]
  const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
  const asRendered = (out) => {
    const g = { ...geom, x: out.x, y: out.y }
    return parseTransformList(`rotate(${out.rotate ?? 0} ${g.x + g.width / 2} ${g.y + g.height / 2})`)
        ?? [1, 0, 0, 1, 0, 0]
  }
  const worstDrift = (matrix, out) => {
    const R = asRendered(out), g = { ...geom, x: out.x, y: out.y }
    return Math.max(...corners(geom).map((p, i) => {
      const theirs = apply(matrix, p), ours = apply(R, corners(g)[i])
      return Math.hypot(theirs[0] - ours[0], theirs[1] - ours[1])
    }))
  }

  test('no transform at all leaves everything as it was', () => {
    expect(reconcileTransform(geom, 45, null)).toEqual({ rotate: 45, x: 100, y: 100, transform: null })
  })

  test('our own derived copy is recognised and dropped, changing nothing', () => {
    const m = parseTransformList('rotate(45 200 160)')
    const out = reconcileTransform(geom, 45, m)
    expect(out.rotate).toBeCloseTo(45, 9)
    expect(out.x).toBeCloseTo(100, 9)
    expect(out.y).toBeCloseTo(100, 9)
    expect(out.transform).toBeNull()
    expect(worstDrift(m, out)).toBeLessThan(1e-9)
  })

  test('an external rotation is recovered into the degrees', () => {
    const m = parseTransformList('rotate(60 200 160)')
    const out = reconcileTransform(geom, 45, m)   // document still said 45
    expect(out.rotate).toBeCloseTo(60, 9)
    expect(worstDrift(m, out)).toBeLessThan(1e-9)
  })

  test('a rotation about some OTHER point becomes our rotation plus a move', () => {
    const m = parseTransformList('rotate(60 100 100)')   // about the top-left
    const out = reconcileTransform(geom, 45, m)
    expect(out.rotate).toBeCloseTo(60, 9)
    expect(out.x).not.toBeCloseTo(100, 3)
    expect(worstDrift(m, out)).toBeLessThan(1e-9)
  })

  test('a rotate and a move in one matrix recovers both', () => {
    const m = parseTransformList('translate(40 25) rotate(60 200 160)')
    const out = reconcileTransform(geom, 45, m)
    expect(out.rotate).toBeCloseTo(60, 9)
    expect(out.x).toBeCloseTo(140, 9)
    expect(out.y).toBeCloseTo(125, 9)
    expect(worstDrift(m, out)).toBeLessThan(1e-9)
  })

  test('a hand-edited list of several terms composes before it is read', () => {
    const m = parseTransformList('rotate(20 200 160) rotate(20 0 0)')
    const out = reconcileTransform(geom, 45, m)
    expect(out.rotate).toBeCloseTo(40, 9)   // neither term alone
    expect(worstDrift(m, out)).toBeLessThan(1e-9)
  })

  test('scale is not expressible as degrees, so the file keeps its own transform', () => {
    const m = parseTransformList('scale(1.5) rotate(60 200 160)')
    const out = reconcileTransform(geom, 45, m)
    expect(out.rotate).toBeNull()
    expect(out.transform).toEqual(m)
    expect(out.x).toBe(100)
  })

  test('so are skew and flip', () => {
    for (const t of ['skewX(10)', 'scale(-1 1)']) {
      const out = reconcileTransform(geom, 45, parseTransformList(t))
      expect(out.rotate).toBeNull()
      expect(out.transform).not.toBeNull()
    }
  })
})

describe('reconcileImportedTransform', () => {
  const imported = (attrs) => {
    const doc = makeDoc()
    const yEl = new Y.XmlElement('rect')
    for (const [k, v] of Object.entries({ id: 'r1', x: 100, y: 100, width: 200, height: 120, ...attrs })) {
      yEl.setAttribute(k, String(v))
    }
    doc.yDrawing.insert(0, [yEl])
    reconcileImportedTransform(yEl)
    return yEl
  }

  test('an untouched export round-trips completely unchanged', () => {
    const yEl = imported({ 'data-rotate': '45', transform: 'rotate(45 200 160)' })
    expect(yEl.getAttribute('data-rotate')).toBe('45')
    expect(yEl.getAttribute('transform')).toBeUndefined()
    expect(yEl.getAttribute('x')).toBe('100')
    expect(yEl.getAttribute('y')).toBe('100')
  })

  test('an external editor\u2019s rotation AND move both survive', () => {
    const yEl = imported({ 'data-rotate': '45', transform: 'translate(40 25) rotate(60 200 160)' })
    expect(Number(yEl.getAttribute('data-rotate'))).toBeCloseTo(60, 6)
    expect(yEl.getAttribute('x')).toBe('140')
    expect(yEl.getAttribute('y')).toBe('125')
    expect(yEl.getAttribute('transform')).toBeUndefined()
  })

  test('a transform we cannot express keeps the file\u2019s own, and drops our stale degrees', () => {
    const yEl = imported({ 'data-rotate': '45', transform: 'matrix(1.41 0.35 -0.35 1.41 40 25)' })
    expect(yEl.getAttribute('data-rotate')).toBeUndefined()
    expect(yEl.getAttribute('transform')).toContain('matrix(')
    // ...and with no data-rotate, render leaves it exactly alone.
    expect(_toSVGEl(yEl).getAttribute('transform')).toContain('matrix(')
  })

  test('a shape with no rotation of ours is never touched', () => {
    const yEl = imported({ transform: 'skewX(10)' })
    expect(yEl.getAttribute('transform')).toBe('skewX(10)')
    expect(yEl.getAttribute('data-rotate')).toBeUndefined()
  })

  test('an unparseable transform is treated as foreign, not silently dropped', () => {
    const yEl = imported({ 'data-rotate': '45', transform: 'rotate(30) wobble(3)' })
    expect(yEl.getAttribute('transform')).toBe('rotate(30) wobble(3)')   // verbatim
    expect(yEl.getAttribute('data-rotate')).toBeUndefined()              // ours goes instead
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Pivot placement
// Stored as fractions of the bbox so it survives a move and a resize, clamped
// inside the shape (no lever-arm rotation), and compensated on commit so
// placing it never moves the shape.
// ─────────────────────────────────────────────────────────────────────────────

describe('getPivot', () => {
  const rectDom = (attrs = {}) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    return el
  }

  test('defaults to the centre when the shape says nothing', () => {
    expect(getPivot(rectDom())).toEqual({ fx: 0.5, fy: 0.5 })
    expect(getPivot(null)).toEqual({ fx: 0.5, fy: 0.5 })
  })

  test('reads the stored fractions', () => {
    expect(getPivot(rectDom({ 'data-pivot-x': '0', 'data-pivot-y': '1' }))).toEqual({ fx: 0, fy: 1 })
  })

  test('one axis given, the other still defaults', () => {
    expect(getPivot(rectDom({ 'data-pivot-x': '0.25' }))).toEqual({ fx: 0.25, fy: 0.5 })
  })

  test('clamps on READ, so a hand-edited value outside the shape is corrected at the boundary', () => {
    expect(getPivot(rectDom({ 'data-pivot-x': '2.5', 'data-pivot-y': '-4' }))).toEqual({ fx: 1, fy: 0 })
  })
})

describe('snapPivot', () => {
  test('locks onto the nine notable points — corners, edge midpoints, centre', () => {
    expect(PIVOT_SNAP_FRACTION).toBe(0.08)
    expect(snapPivot(0.03, 0.97)).toEqual({ fx: 0, fy: 1 })
    expect(snapPivot(0.52, 0.47)).toEqual({ fx: 0.5, fy: 0.5 })
  })

  test('each axis snaps on its own, so a drag near the left edge does not also lock vertically', () => {
    expect(snapPivot(0.02, 0.31)).toEqual({ fx: 0, fy: 0.31 })
  })

  test('leaves anything outside the tolerance where it is', () => {
    expect(snapPivot(0.3, 0.7)).toEqual({ fx: 0.3, fy: 0.7 })
  })

  test('the tolerance is an argument, and 0 means free placement', () => {
    expect(snapPivot(0.03, 0.03, 0)).toEqual({ fx: 0.03, fy: 0.03 })
    expect(snapPivot(0.3, 0.3, 0.4)).toEqual({ fx: 0.5, fy: 0.5 })
  })

  test('a tolerance wide enough to reach two notable points takes the nearer one', () => {
    // 0.3 is within 0.4 of both 0 and 0.5; 0.5 is nearer.
    expect(snapPivot(0.3, 0.2, 0.4)).toEqual({ fx: 0.5, fy: 0 })
  })
})

describe('computePivot', () => {
  const rect = { x: 100, y: 100, width: 200, height: 100 }

  test('expresses a canvas point as fractions of the shape', () => {
    expect(computePivot(rect, 150, 125, 0)).toEqual({ fx: 0.25, fy: 0.25 })
  })

  test('clamps inside the shape — unlike Inkscape, the pivot never leaves the box', () => {
    expect(computePivot(rect, -500, 9999, 0)).toEqual({ fx: 0, fy: 1 })
  })

  test('snaps once inside, so dragging near the centre lands exactly on it', () => {
    expect(computePivot(rect, 203, 148)).toEqual({ fx: 0.5, fy: 0.5 })
  })
})

describe('PIVOT_RAYS layout', () => {
  // Compass degrees clockwise from north, as specified: a symmetric pair
  // either side of each quadrant's own diagonal (45/135/225/315°), offset
  // ±30° from it.
  const EXPECTED_DEGREES = [15, 75, 105, 165, 195, 255, 285, 345]

  const compassDeg = ({ dx, dy }) => {
    const deg = Math.atan2(dx, -dy) * 180 / Math.PI   // inverse of dx=sin,dy=-cos
    return ((deg % 360) + 360) % 360
  }

  test('eight rays at the specified angles, none on a cardinal axis', () => {
    const degrees = PIVOT_RAYS.map(compassDeg).sort((a, b) => a - b)
    expect(degrees).toHaveLength(8)
    degrees.forEach((d, i) => expect(d).toBeCloseTo(EXPECTED_DEGREES[i], 6))
  })

  test('every ray leans on both axes — none is purely horizontal or vertical', () => {
    for (const { dx, dy } of PIVOT_RAYS) {
      expect(dx).not.toBe(0)
      expect(dy).not.toBe(0)
    }
  })

  test('each pair spans 60° within its quadrant, with 30° gaps at the cardinal directions between quadrants', () => {
    const degrees = PIVOT_RAYS.map(compassDeg).sort((a, b) => a - b)
    // 15→75 (60, within NE), 75→105 (30, the gap at east), 105→165 (60, within SE), ...
    const gaps = degrees.map((d, i) => (degrees[(i + 1) % 8] - d + 360) % 360)
    expect(gaps).toEqual([60, 30, 60, 30, 60, 30, 60, 30])
  })

  test('every ray is a unit vector', () => {
    for (const { dx, dy } of PIVOT_RAYS) expect(Math.hypot(dx, dy)).toBeCloseTo(1, 10)
  })
})

describe('pivotRayOpacities', () => {
  // Which quadrant a ray belongs to, by the sign of its lean — this is what
  // fading is actually keyed on, not the ray's exact angle within it.
  const quadrant = ({ dx, dy }) => `${dx < 0 ? 'W' : 'E'}${dy < 0 ? 'N' : 'S'}`
  const byQuadrant = (fx, fy) => {
    const out = {}
    for (const r of pivotRayOpacities(fx, fy)) (out[quadrant(r)] ??= []).push(r.opacity)
    return out
  }

  test('all eight rays are full strength at the centre', () => {
    expect(pivotRayOpacities(0.5, 0.5).map(r => r.opacity)).toEqual(Array(8).fill(1))
  })

  test('two rays land in each of the four quadrants', () => {
    const q = byQuadrant(0.5, 0.5)
    expect(Object.keys(q).sort()).toEqual(['EN', 'ES', 'WN', 'WS'])
    for (const rays of Object.values(q)) expect(rays).toHaveLength(2)
  })

  // The user's own example: at [0, 0.5], the left quadrants vanish and the
  // right quadrants stay exactly as they were.
  test('at [0, 0.5] the left quadrants’ lines are invisible, the right quadrants’ visible', () => {
    const q = byQuadrant(0, 0.5)
    expect(q.WN).toEqual([0, 0])
    expect(q.WS).toEqual([0, 0])
    expect(q.EN).toEqual([1, 1])
    expect(q.ES).toEqual([1, 1])
  })

  test('symmetrically for the right edge, top edge, and bottom edge', () => {
    expect(byQuadrant(1, 0.5).EN).toEqual([0, 0])
    expect(byQuadrant(1, 0.5).WN).toEqual([1, 1])
    expect(byQuadrant(0.5, 0).EN).toEqual([0, 0])
    expect(byQuadrant(0.5, 0).ES).toEqual([1, 1])
    expect(byQuadrant(0.5, 1).ES).toEqual([0, 0])
    expect(byQuadrant(0.5, 1).EN).toEqual([1, 1])
  })

  test('at a corner, only the pair in that corner’s own quadrant survives', () => {
    const q = byQuadrant(0, 0)   // NW corner
    expect(q.WN).toEqual([0, 0])
    expect(q.WS).toEqual([0, 0])
    expect(q.EN).toEqual([0, 0])
    expect(q.ES).toEqual([1, 1])   // the pair pointing back into the shape
  })

  test('at each corner, only the exact opposite quadrant survives — the other three are gone', () => {
    // This is the whole point: nothing is left to collide with that corner's
    // rotate handle, so the handles never have to move out of the way.
    for (const [fx, fy, survivor] of [[0, 0, 'ES'], [1, 0, 'WS'], [1, 1, 'WN'], [0, 1, 'EN']]) {
      const q = byQuadrant(fx, fy)
      for (const key of ['EN', 'ES', 'WN', 'WS']) {
        if (key === survivor) expect(q[key]).toEqual([1, 1])
        else                  expect(q[key]).toEqual([0, 0])
      }
    }
  })

  test('both rays sharing a quadrant fade identically, whatever their exact angle within it', () => {
    const q = byQuadrant(0.2, 0.3)
    for (const rays of Object.values(q)) expect(rays[0]).toBeCloseTo(rays[1], 10)
  })

  test('fades linearly rather than switching off at a threshold', () => {
    expect(byQuadrant(0.25, 0.5).WN[0]).toBeCloseTo(0.5)
    expect(byQuadrant(0.125, 0.5).WN[0]).toBeCloseTo(0.25)
  })
})

describe('pivotShift — placing a pivot never moves the shape', () => {
  const geom = { x: 100, y: 100, width: 200, height: 120 }

  // Where a point in the shape's own space lands on the canvas, for a given
  // pivot and angle.
  const onCanvas = (p, pivot, deg) => {
    const cx = geom.x + pivot.fx * geom.width
    const cy = geom.y + pivot.fy * geom.height
    const r  = deg * Math.PI / 180
    const dx = p.x - cx, dy = p.y - cy
    return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) }
  }

  test('is zero for an unrotated shape — the pivot only matters to the NEXT rotation', () => {
    expect(pivotShift(geom, { fx: 0.5, fy: 0.5 }, { fx: 0, fy: 1 }, 0)).toEqual({ dx: 0, dy: 0 })
  })

  test('is zero when the pivot did not actually move', () => {
    const s = pivotShift(geom, { fx: 0.5, fy: 0.5 }, { fx: 0.5, fy: 0.5 }, 37)
    expect(s.dx).toBeCloseTo(0, 10)
    expect(s.dy).toBeCloseTo(0, 10)
  })

  test('cancels the jump exactly, at an angle that is not a quarter turn', () => {
    const from = { fx: 0.5, fy: 0.5 }, to = { fx: 0, fy: 1 }, deg = 37
    const corner = { x: geom.x, y: geom.y }
    const before = onCanvas(corner, from, deg)

    // Without the shift the shape swings to a new place...
    const naive = onCanvas(corner, to, deg)
    expect(Math.hypot(naive.x - before.x, naive.y - before.y)).toBeGreaterThan(10)

    // ...and with it, the shape is exactly where it was.
    const { dx, dy } = pivotShift(geom, from, to, deg)
    const moved = { x: corner.x + dx, y: corner.y + dy }
    const shifted = { ...geom, x: geom.x + dx, y: geom.y + dy }
    const cx = shifted.x + to.fx * shifted.width, cy = shifted.y + to.fy * shifted.height
    const r = deg * Math.PI / 180
    const ddx = moved.x - cx, ddy = moved.y - cy
    const after = { x: cx + ddx * Math.cos(r) - ddy * Math.sin(r), y: cy + ddx * Math.sin(r) + ddy * Math.cos(r) }

    expect(after.x).toBeCloseTo(before.x, 10)
    expect(after.y).toBeCloseTo(before.y, 10)
  })

  test('grows with the angle — a half turn needs twice the offset of the pivot move', () => {
    const s = pivotShift(geom, { fx: 0.5, fy: 0.5 }, { fx: 0, fy: 0.5 }, 180)
    expect(s.dx).toBeCloseTo(200, 6)   // pivot moved -100; a half turn doubles it back
    expect(s.dy).toBeCloseTo(0, 6)
  })
})

describe('applyPivot', () => {
  test('writes the pivot and the compensating position together, and syncs', () => {
    const a = makeDoc(), b = makeDoc()
    add(a, { id: 'r1', x: 100, y: 100, width: 200, height: 120, rotate: 37 })
    sync(a.ydoc, b.ydoc)

    applyPivot(a.ydoc, findDrawing(a.yDrawing, 'r1'), 0, 1, 140.4, 125.7)
    sync(a.ydoc, b.ydoc)

    const yEl = findDrawing(b.yDrawing, 'r1')
    expect(yEl.getAttribute('data-pivot-x')).toBe('0')
    expect(yEl.getAttribute('data-pivot-y')).toBe('1')
    expect(yEl.getAttribute('x')).toBe('140')   // rounded, like every other geometry write
    expect(yEl.getAttribute('y')).toBe('126')
  })

  test('clamps what it stores, so nothing out of range reaches the document', () => {
    const doc = makeDoc()
    add(doc, { id: 'r1' })
    applyPivot(doc.ydoc, findDrawing(doc.yDrawing, 'r1'), -3, 8, 0, 0)
    const yEl = findDrawing(doc.yDrawing, 'r1')
    expect(yEl.getAttribute('data-pivot-x')).toBe('0')
    expect(yEl.getAttribute('data-pivot-y')).toBe('1')
  })

  test('is a no-op for a shape type with no pivot in its schema', () => {
    const doc = makeDoc()
    add(doc, { id: 'c1', type: 'circle', cx: 50, cy: 50, r: 30 })
    const yEl = findDrawing(doc.yDrawing, 'c1')
    applyPivot(doc.ydoc, yEl, 0, 0, 10, 10)
    expect(yEl.getAttribute('data-pivot-x')).toBeUndefined()
  })

  test('the pivot rides a resize — fractions keep a corner pivot on the corner', () => {
    const doc = makeDoc()
    add(doc, { id: 'r1', x: 0, y: 0, width: 100, height: 100, rotate: 0, 'pivot-x': 0, 'pivot-y': 1 })
    const el = _toSVGEl(findDrawing(doc.yDrawing, 'r1'))
    expect(rotationCenter(getGeom(el), getPivot(el))).toEqual({ cx: 0, cy: 100 })

    previewResize(el, 0, 0, 300, 300)
    expect(rotationCenter(getGeom(el), getPivot(el))).toEqual({ cx: 0, cy: 300 })
  })
})

describe('a foreign transform is never claimed', () => {
  const rectWith = (attrs) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v))
    return el
  }

  test('rotate mode is not offered for a shape whose transform is not ours', () => {
    expect(selectModes(rectWith({ transform: 'skewX(10)' })))
      .toEqual(['sel-move', 'sel-resize'])
  })

  test('move and resize stay available — neither of them touches the transform', () => {
    const el = rectWith({ x: 0, y: 0, width: 100, height: 100, transform: 'skewX(10)' })
    applyMoveDom(el, 50, 50)
    previewResize(el, 50, 50, 200, 200)
    expect(el.getAttribute('transform')).toBe('skewX(10)')
  })

  test('a shape of ours keeps the full cycle even though it has a transform', () => {
    const el = rectWith({ x: 0, y: 0, width: 100, height: 100, 'data-rotate': '45' })
    syncRotation(el)
    expect(el.getAttribute('transform')).toBe('rotate(45 50 50)')
    expect(selectModes(el)).toEqual(['sel-move', 'sel-resize', 'sel-rotate-pivot'])
  })

  test('a plain shape with no transform at all is unaffected', () => {
    expect(selectModes(rectWith({}))).toEqual(['sel-move', 'sel-resize', 'sel-rotate-pivot'])
  })
})
