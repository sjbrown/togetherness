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
} from '../../src/drawing.js'
import { makeDoc } from '../../src/app.js'

// ── Sync helper ───────────────────────────────────────────────────────────────

function sync(docA, docB) {
  Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
}

// ── Shape factory ─────────────────────────────────────────────────────────────
// `add` defaults to a rect. Pass type + matching geometry to get other types.
// e.g. add(doc, { type: 'circle', cx: 50, cy: 50, r: 30 })
// The rect defaults (x, y, width, height) are silently ignored for other types
// because addDrawing only reads attrs listed in SHAPE_TYPES[type].geomAttrs.

const uid = () => Math.random().toString(36).slice(2, 9)

function add(doc, overrides = {}) {
  const id = overrides.id ?? uid()
  addDrawing(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, {
    id, type: 'rect', x: 10, y: 10, width: 100, height: 50,
    fill: '#c8f060', stroke: 'none', 'stroke-width': 0, opacity: 1,
    author: 'test-peer',
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
    deleteDrawing(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
    expect(doc.yDrawing.length).toBe(1)
    expect(findDrawing(doc.yDrawing, 'b')).not.toBeNull()
    expect(findDrawing(doc.yDrawing, 'a')).toBeNull()
  })

  test('delete also removes sidecar meta', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', author: 'alice' })
    expect(doc.yDrawingMeta.get('a')?.author).toBe('alice')
    deleteDrawing(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
    expect(doc.yDrawingMeta.get('a')).toBeUndefined()
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
    const ids = listDrawings(doc.yDrawing, doc.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid"))
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

  test('author, type, and created are stored on sidecar', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', author: 'alice' })
    const meta = doc.yDrawingMeta.get('a')
    expect(meta?.author).toBe('alice')
    expect(meta?.type).toBe('rect')
    expect(meta?.created).toBeTypeOf('number')
  })

  test('circle type is stored on sidecar', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 50, r: 20 })
    expect(doc.yDrawingMeta.get('c')?.type).toBe('circle')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getGeom — raw bounding box from a rendered svgEl (PAD lives in the overlay)
// ─────────────────────────────────────────────────────────────────────────────

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
    const ids = listDrawings(doc.yDrawing, doc.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid"))
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  test('lists shapes of mixed types in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'r', type: 'rect' })
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 50, r: 20 })
    const shapes = listDrawings(doc.yDrawing, doc.yDrawingMeta)
    expect(shapes).toHaveLength(2)
    expect(shapes[0].svgEl.getAttribute('data-yid')).toBe('r')
    expect(shapes[1].svgEl.getAttribute('data-yid')).toBe('c')
    // tagName reflects the actual SVG tag
    expect(shapes[0].svgEl.tagName).toBe('rect')
    expect(shapes[1].svgEl.tagName).toBe('circle')
  })

  test('newestFirst sorts by created timestamp', () => {
    const doc = makeDoc()
    add(doc, { id: 'old' })
    doc.yDrawingMeta.set('old', { author: 'x', type: 'rect', created: 1000 })
    add(doc, { id: 'new' })
    doc.yDrawingMeta.set('new', { author: 'x', type: 'rect', created: 3000 })
    add(doc, { id: 'mid' })
    doc.yDrawingMeta.set('mid', { author: 'x', type: 'rect', created: 2000 })

    const ids = listDrawings(doc.yDrawing, doc.yDrawingMeta, { newestFirst: true })
      .map(({ svgEl }) => svgEl.getAttribute("data-yid"))
    expect(ids).toEqual(['new', 'mid', 'old'])
  })

  test('skips non-element nodes', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    const shapes = listDrawings(doc.yDrawing, doc.yDrawingMeta)
    expect(shapes).toHaveLength(1)
    expect(shapes.every(({ svgEl }) => svgEl && svgEl.nodeType === 1)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRDT convergence
// ─────────────────────────────────────────────────────────────────────────────

describe('convergence', () => {
  test('concurrent adds on two peers — both survive after sync', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'from-peer1', author: 'peer1' })
    add(peer2, { id: 'from-peer2', author: 'peer2' })

    sync(peer1.ydoc, peer2.ydoc)

    expect(peer1.yDrawing.length).toBe(2)
    expect(peer2.yDrawing.length).toBe(2)

    const ids1 = listDrawings(peer1.yDrawing, peer1.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid")).sort()
    const ids2 = listDrawings(peer2.yDrawing, peer2.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid")).sort()
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

    deleteDrawing(peer1.ydoc, peer1.yDrawing, peer1.yDrawingMeta, 'doomed')
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
      listDrawings(p.yDrawing, p.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid")).sort().join(',')
    )
    expect(idSets[0]).toBe(idSets[1])
    expect(idSets[1]).toBe(idSets[2])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Z-order
// ─────────────────────────────────────────────────────────────────────────────

describe('z-order', () => {
  test('bring to front: delete + re-append moves shape to top', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    add(doc, { id: 'c' })

    // Bring 'a' to front
    const old   = findDrawing(doc.yDrawing, 'a')
    const attrs = old.getAttributes()
    const meta  = doc.yDrawingMeta.get('a')
    doc.ydoc.transact(() => {
      deleteDrawing(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
      addDrawing(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, {
        ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, isNaN(v) ? v : Number(v)])),
        type: meta?.type ?? 'rect',
        author: meta?.author ?? 'unknown',
      })
    })

    const ids = listDrawings(doc.yDrawing, doc.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid"))
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  test('concurrent adds produce consistent z-order on both peers', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'p1-shape' })
    add(peer2, { id: 'p2-shape' })
    sync(peer1.ydoc, peer2.ydoc)

    const order1 = listDrawings(peer1.yDrawing, peer1.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid"))
    const order2 = listDrawings(peer2.yDrawing, peer2.yDrawingMeta).map(({ svgEl }) => svgEl.getAttribute("data-yid"))
    expect(order1).toEqual(order2)
    expect(order1.length).toBe(2)
  })
})
