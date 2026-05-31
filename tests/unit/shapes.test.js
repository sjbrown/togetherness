/**
 * shapes.test.js
 * Run with: npx vitest run
 *
 * Tests import directly from shapes.js — the same code path as index.html.
 * Sync is simulated with Y.encodeStateAsUpdate / Y.applyUpdate.
 */

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import {
  addShape, deleteShape, findShape,
  selectionGeometry, listShapes, CURRENT_SCHEMA, SHAPE_TYPES,
} from '../../src/app/shapes.js'
import { makeDoc } from '../../src/app/app.js'

// ── Sync helper ───────────────────────────────────────────────────────────────

function sync(docA, docB) {
  Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
}

// ── Shape factory ─────────────────────────────────────────────────────────────
// `add` defaults to a rect. Pass type + matching geometry to get other types.
// e.g. add(doc, { type: 'circle', cx: 50, cy: 50, r: 30 })
// The rect defaults (x, y, width, height) are silently ignored for other types
// because addShape only reads attrs listed in SHAPE_TYPES[type].geomAttrs.

const uid = () => Math.random().toString(36).slice(2, 9)

function add(doc, overrides = {}) {
  const id = overrides.id ?? uid()
  addShape(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, {
    id, x: 10, y: 10, width: 100, height: 50,
    fill: '#c8f060', stroke: 'none', strokeWidth: 0, opacity: 1,
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
      expect(Array.isArray(def.geomAttrs)).toBe(true)
      expect(typeof def.fromDrag).toBe('function')
      expect(typeof def.bbox).toBe('function')
      expect(typeof def.label).toBe('function')
    }
  })

  test('rect fromDrag maps drag box to x/y/width/height', () => {
    const geom = SHAPE_TYPES.rect.fromDrag({ x: 10, y: 20, w: 100, h: 50 })
    expect(geom).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  test('circle fromDrag inscribes circle in drag box', () => {
    const geom = SHAPE_TYPES.circle.fromDrag({ x: 0, y: 0, w: 100, h: 60 })
    expect(geom.cx).toBe(50)           // centered horizontally
    expect(geom.cy).toBe(30)           // centered vertically
    expect(geom.r).toBe(30)            // inscribed: min(100, 60) / 2
    // circle stays within the drag box
    expect(geom.cx - geom.r).toBeGreaterThanOrEqual(0)
    expect(geom.cx + geom.r).toBeLessThanOrEqual(100)
    expect(geom.cy - geom.r).toBeGreaterThanOrEqual(0)
    expect(geom.cy + geom.r).toBeLessThanOrEqual(60)
  })

  test('circle fromDrag with square drag box produces expected radius', () => {
    const geom = SHAPE_TYPES.circle.fromDrag({ x: 5, y: 5, w: 80, h: 80 })
    expect(geom.r).toBe(40)
    expect(geom.cx).toBe(45)
    expect(geom.cy).toBe(45)
  })

  test('rect bbox returns x/y/width/height from stored attributes', () => {
    const b = SHAPE_TYPES.rect.bbox({ x: '10', y: '20', width: '100', height: '50' })
    expect(b).toEqual({ x: 10, y: 20, width: 100, height: 50 })
    expect(typeof b.x).toBe('number')
  })

  test('circle bbox derives bounding box from cx/cy/r', () => {
    const b = SHAPE_TYPES.circle.bbox({ cx: '50', cy: '60', r: '30' })
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
    expect(findShape(doc.yDrawing, 'a').getAttribute('fill')).toBe('red')
  })

  test('add a circle', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 60, r: 30 })
    expect(doc.yDrawing.length).toBe(1)
    const el = findShape(doc.yDrawing, 'c')
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
    deleteShape(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
    expect(doc.yDrawing.length).toBe(1)
    expect(findShape(doc.yDrawing, 'b')).not.toBeNull()
    expect(findShape(doc.yDrawing, 'a')).toBeNull()
  })

  test('delete also removes sidecar meta', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', author: 'alice' })
    expect(doc.yDrawingMeta.get('a')?.author).toBe('alice')
    deleteShape(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
    expect(doc.yDrawingMeta.get('a')).toBeUndefined()
  })

  test('edit a shape attribute', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', fill: 'red' })
    const el = findShape(doc.yDrawing, 'a')
    doc.ydoc.transact(() => el.setAttribute('fill', 'blue'))
    expect(findShape(doc.yDrawing, 'a').getAttribute('fill')).toBe('blue')
  })

  test('z-order: shapes render in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'bottom' })
    add(doc, { id: 'middle' })
    add(doc, { id: 'top' })
    const ids = listShapes(doc.yDrawing, doc.yDrawingMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['bottom', 'middle', 'top'])
  })

  test('rect attributes are stored as SVG-native names', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', width: 200, height: 80 })
    const el = findShape(doc.yDrawing, 'a')
    expect(el.getAttribute('width')).toBe('200')
    expect(el.getAttribute('height')).toBe('80')
  })

  test('circle attributes are stored as SVG-native names', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 100, cy: 120, r: 45 })
    const el = findShape(doc.yDrawing, 'c')
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
// selectionGeometry — bounding box and PAD
// ─────────────────────────────────────────────────────────────────────────────

describe('selectionGeometry', () => {
  test('returns numeric values for rect, not string-concatenated', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 20, y: 30, width: 100, height: 50 })
    const geo = selectionGeometry(doc.yDrawing, 'a', 3)
    expect(geo).toEqual({ x: 17, y: 27, width: 106, height: 56 })
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('returns correct bbox for circle', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 60, r: 30 })
    const geo = selectionGeometry(doc.yDrawing, 'c', 0)
    // bbox: x = cx-r, y = cy-r, w = 2r, h = 2r
    expect(geo).toEqual({ x: 20, y: 30, width: 60, height: 60 })
    expect(typeof geo.x).toBe('number')
  })

  test('circle selectionGeometry applies PAD correctly', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 60, r: 30 })
    const geo = selectionGeometry(doc.yDrawing, 'c', 3)
    expect(geo).toEqual({ x: 17, y: 27, width: 66, height: 66 })
  })

  test('returns null for unknown shapeId', () => {
    const doc = makeDoc()
    expect(selectionGeometry(doc.yDrawing, 'nonexistent')).toBeNull()
  })

  test('rect PAD=0 returns exact shape geometry', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 5, y: 10, width: 200, height: 80 })
    const geo = selectionGeometry(doc.yDrawing, 'a', 0)
    expect(geo).toEqual({ x: 5, y: 10, width: 200, height: 80 })
  })

  test('circle PAD=0 returns exact bounding box', () => {
    const doc = makeDoc()
    add(doc, { id: 'c', type: 'circle', cx: 100, cy: 100, r: 40 })
    const geo = selectionGeometry(doc.yDrawing, 'c', 0)
    expect(geo).toEqual({ x: 60, y: 60, width: 80, height: 80 })
  })

  test('returns null for element with unregistered tag', () => {
    // Bypass addShape to insert an element whose tag isn't in SHAPE_TYPES.
    const doc = makeDoc()
    const tri = new Y.XmlElement('triangle')
    doc.ydoc.transact(() => {
      tri.setAttribute('id', 't1')
      doc.yDrawing.insert(doc.yDrawing.length, [tri])
    })
    expect(selectionGeometry(doc.yDrawing, 't1')).toBeNull()
  })

  test('string concat would have produced wrong result for rect (documents the bug)', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 20, y: 30, width: 100, height: 50 })
    const el    = findShape(doc.yDrawing, 'a')
    const attrs = el.getAttributes()
    const PAD   = 3
    // This is what the code did before the fix — string concat
    expect(attrs.width  + PAD * 2).toBe('1006')
    expect(attrs.height + PAD * 2).toBe('506')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// listShapes
// ─────────────────────────────────────────────────────────────────────────────

describe('listShapes', () => {
  test('returns shapes in z-order by default', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    add(doc, { id: 'c' })
    const ids = listShapes(doc.yDrawing, doc.yDrawingMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  test('lists shapes of mixed types in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'r', type: 'rect' })
    add(doc, { id: 'c', type: 'circle', cx: 50, cy: 50, r: 20 })
    const shapes = listShapes(doc.yDrawing, doc.yDrawingMeta)
    expect(shapes).toHaveLength(2)
    expect(shapes[0].attrs.id).toBe('r')
    expect(shapes[1].attrs.id).toBe('c')
    // el.nodeName reflects the actual SVG tag
    expect(shapes[0].el.nodeName).toBe('rect')
    expect(shapes[1].el.nodeName).toBe('circle')
  })

  test('newestFirst sorts by created timestamp', () => {
    const doc = makeDoc()
    add(doc, { id: 'old' })
    doc.yDrawingMeta.set('old', { author: 'x', type: 'rect', created: 1000 })
    add(doc, { id: 'new' })
    doc.yDrawingMeta.set('new', { author: 'x', type: 'rect', created: 3000 })
    add(doc, { id: 'mid' })
    doc.yDrawingMeta.set('mid', { author: 'x', type: 'rect', created: 2000 })

    const ids = listShapes(doc.yDrawing, doc.yDrawingMeta, { newestFirst: true })
      .map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['new', 'mid', 'old'])
  })

  test('skips non-element nodes', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    const shapes = listShapes(doc.yDrawing, doc.yDrawingMeta)
    expect(shapes.every(({ el }) => el instanceof Y.XmlElement)).toBe(true)
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

    const ids1 = listShapes(peer1.yDrawing, peer1.yDrawingMeta).map(({ attrs }) => attrs.id).sort()
    const ids2 = listShapes(peer2.yDrawing, peer2.yDrawingMeta).map(({ attrs }) => attrs.id).sort()
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
    const el1 = findShape(peer1.yDrawing, 'shared')
    const el2 = findShape(peer2.yDrawing, 'shared')
    peer1.ydoc.transact(() => el1.setAttribute('fill', 'blue'))
    peer2.ydoc.transact(() => el2.setAttribute('x', '99'))

    sync(peer1.ydoc, peer2.ydoc)

    expect(findShape(peer1.yDrawing, 'shared').getAttribute('fill')).toBe('blue')
    expect(findShape(peer1.yDrawing, 'shared').getAttribute('x')).toBe('99')
    expect(findShape(peer2.yDrawing, 'shared').getAttribute('fill')).toBe('blue')
    expect(findShape(peer2.yDrawing, 'shared').getAttribute('x')).toBe('99')
  })

  test('concurrent delete on one peer, edit on other — delete wins', () => {
    const peer1 = makeDoc()
    add(peer1, { id: 'doomed', fill: 'red' })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)

    deleteShape(peer1.ydoc, peer1.yDrawing, peer1.yDrawingMeta, 'doomed')
    const el2 = findShape(peer2.yDrawing, 'doomed')
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
      listShapes(p.yDrawing, p.yDrawingMeta).map(({ attrs }) => attrs.id).sort().join(',')
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
    const old   = findShape(doc.yDrawing, 'a')
    const attrs = old.getAttributes()
    const meta  = doc.yDrawingMeta.get('a')
    doc.ydoc.transact(() => {
      deleteShape(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, 'a')
      addShape(doc.ydoc, doc.yDrawing, doc.yDrawingMeta, {
        ...Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, isNaN(v) ? v : Number(v)])),
        author: meta?.author ?? 'unknown',
      })
    })

    const ids = listShapes(doc.yDrawing, doc.yDrawingMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  test('concurrent adds produce consistent z-order on both peers', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'p1-shape' })
    add(peer2, { id: 'p2-shape' })
    sync(peer1.ydoc, peer2.ydoc)

    const order1 = listShapes(peer1.yDrawing, peer1.yDrawingMeta).map(({ attrs }) => attrs.id)
    const order2 = listShapes(peer2.yDrawing, peer2.yDrawingMeta).map(({ attrs }) => attrs.id)
    expect(order1).toEqual(order2)
    expect(order1.length).toBe(2)
  })
})
