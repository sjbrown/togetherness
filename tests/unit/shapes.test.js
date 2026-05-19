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
  makeDoc, addShape, deleteShape, findShape,
  selectionGeometry, listShapes, runMigrations, CURRENT_SCHEMA,
} from '../../src/app/shapes.js'

// ── Sync helper ───────────────────────────────────────────────────────────────

function sync(docA, docB) {
  Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
}

// ── Shape factory ─────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

function add(doc, overrides = {}) {
  const id = overrides.id ?? uid()
  addShape(doc.ydoc, doc.yTable, doc.yShapeMeta, {
    id, x: 10, y: 10, width: 100, height: 50,
    fill: '#c8f060', stroke: 'none', strokeWidth: 0, opacity: 1,
    author: 'test-peer',
    ...overrides,
  })
  return id
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic operations
// ─────────────────────────────────────────────────────────────────────────────

describe('basic operations', () => {
  test('add a shape', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', fill: 'red' })
    expect(doc.yTable.length).toBe(1)
    expect(findShape(doc.yTable, 'a').getAttribute('fill')).toBe('red')
  })

  test('delete a shape', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    add(doc, { id: 'b' })
    deleteShape(doc.ydoc, doc.yTable, doc.yShapeMeta, 'a')
    expect(doc.yTable.length).toBe(1)
    expect(findShape(doc.yTable, 'b')).not.toBeNull()
    expect(findShape(doc.yTable, 'a')).toBeNull()
  })

  test('delete also removes sidecar meta', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', author: 'alice' })
    expect(doc.yShapeMeta.get('a')?.author).toBe('alice')
    deleteShape(doc.ydoc, doc.yTable, doc.yShapeMeta, 'a')
    expect(doc.yShapeMeta.get('a')).toBeUndefined()
  })

  test('edit a shape attribute', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', fill: 'red' })
    const el = findShape(doc.yTable, 'a')
    doc.ydoc.transact(() => el.setAttribute('fill', 'blue'))
    expect(findShape(doc.yTable, 'a').getAttribute('fill')).toBe('blue')
  })

  test('z-order: shapes render in insertion order', () => {
    const doc = makeDoc()
    add(doc, { id: 'bottom' })
    add(doc, { id: 'middle' })
    add(doc, { id: 'top' })
    const ids = listShapes(doc.yTable, doc.yShapeMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['bottom', 'middle', 'top'])
  })

  test('attributes are stored as SVG-native names', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', width: 200, height: 80 })
    const el = findShape(doc.yTable, 'a')
    // must be 'width'/'height', not 'w'/'h'
    expect(el.getAttribute('width')).toBe('200')
    expect(el.getAttribute('height')).toBe('80')
  })

  test('author and created are stored on sidecar', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', author: 'alice' })
    const el = findShape(doc.yTable, 'a')
    expect(doc.yShapeMeta.get('a')?.author).toBe('alice')
    expect(doc.yShapeMeta.get('a')?.created).toBeTypeOf('number')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// selectionGeometry — the overlay bug
// ─────────────────────────────────────────────────────────────────────────────

describe('selectionGeometry', () => {
  test('returns numeric values, not string-concatenated', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 20, y: 30, width: 100, height: 50 })
    const geo = selectionGeometry(doc.yTable, 'a', 3)
    expect(geo).toEqual({ x: 17, y: 27, width: 106, height: 56 })
    // all values must be numbers
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('returns null for unknown shapeId', () => {
    const doc = makeDoc()
    expect(selectionGeometry(doc.yTable, 'nonexistent')).toBeNull()
  })

  test('PAD=0 returns exact shape geometry', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 5, y: 10, width: 200, height: 80 })
    const geo = selectionGeometry(doc.yTable, 'a', 0)
    expect(geo).toEqual({ x: 5, y: 10, width: 200, height: 80 })
  })

  test('string concat would have produced wrong result (documents the bug)', () => {
    const doc = makeDoc()
    add(doc, { id: 'a', x: 20, y: 30, width: 100, height: 50 })
    const el = findShape(doc.yTable, 'a')
    const attrs = el.getAttributes()
    const PAD = 3
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
    const ids = listShapes(doc.yTable, doc.yShapeMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['a', 'b', 'c'])
  })

  test('newestFirst sorts by created timestamp', () => {
    const doc = makeDoc()
    // manipulate created timestamps directly in sidecar
    add(doc, { id: 'old' })
    doc.yShapeMeta.set('old', { author: 'x', created: 1000 })
    add(doc, { id: 'new' })
    doc.yShapeMeta.set('new', { author: 'x', created: 3000 })
    add(doc, { id: 'mid' })
    doc.yShapeMeta.set('mid', { author: 'x', created: 2000 })

    const ids = listShapes(doc.yTable, doc.yShapeMeta, { newestFirst: true })
      .map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['new', 'mid', 'old'])
  })

  test('skips non-element nodes', () => {
    const doc = makeDoc()
    add(doc, { id: 'a' })
    // yTable may contain text nodes in some Yjs versions — listShapes must skip them
    const shapes = listShapes(doc.yTable, doc.yShapeMeta)
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

    expect(peer1.yTable.length).toBe(2)
    expect(peer2.yTable.length).toBe(2)

    const ids1 = listShapes(peer1.yTable, peer1.yShapeMeta).map(({ attrs }) => attrs.id).sort()
    const ids2 = listShapes(peer2.yTable, peer2.yShapeMeta).map(({ attrs }) => attrs.id).sort()
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
    const el1 = findShape(peer1.yTable, 'shared')
    const el2 = findShape(peer2.yTable, 'shared')
    peer1.ydoc.transact(() => el1.setAttribute('fill', 'blue'))
    peer2.ydoc.transact(() => el2.setAttribute('x', '99'))

    sync(peer1.ydoc, peer2.ydoc)

    expect(findShape(peer1.yTable, 'shared').getAttribute('fill')).toBe('blue')
    expect(findShape(peer1.yTable, 'shared').getAttribute('x')).toBe('99')
    expect(findShape(peer2.yTable, 'shared').getAttribute('fill')).toBe('blue')
    expect(findShape(peer2.yTable, 'shared').getAttribute('x')).toBe('99')
  })

  test('concurrent delete on one peer, edit on other — delete wins', () => {
    const peer1 = makeDoc()
    add(peer1, { id: 'doomed', fill: 'red' })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)

    deleteShape(peer1.ydoc, peer1.yTable, peer1.yShapeMeta, 'doomed')
    const el2 = findShape(peer2.yTable, 'doomed')
    peer2.ydoc.transact(() => el2.setAttribute('fill', 'blue'))

    sync(peer1.ydoc, peer2.ydoc)

    expect(peer1.yTable.length).toBe(0)
    expect(peer2.yTable.length).toBe(0)
  })

  test('three-way merge — all peers converge', () => {
    const peers = [makeDoc(), makeDoc(), makeDoc()]

    add(peers[0], { id: 'p0' })
    add(peers[1], { id: 'p1' })
    add(peers[2], { id: 'p2' })

    sync(peers[0].ydoc, peers[1].ydoc)
    sync(peers[1].ydoc, peers[2].ydoc)
    sync(peers[0].ydoc, peers[2].ydoc)

    const lengths = peers.map(p => p.yTable.length)
    expect(lengths).toEqual([3, 3, 3])

    const idSets = peers.map(p =>
      listShapes(p.yTable, p.yShapeMeta).map(({ attrs }) => attrs.id).sort().join(',')
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
    const old = findShape(doc.yTable, 'a')
    const attrs = old.getAttributes()
    const meta  = doc.yShapeMeta.get('a')
    doc.ydoc.transact(() => {
      deleteShape(doc.ydoc, doc.yTable, doc.yShapeMeta, 'a')
      addShape(doc.ydoc, doc.yTable, doc.yShapeMeta, {
        ...Object.fromEntries(Object.entries(attrs).map(([k,v]) => [k, isNaN(v) ? v : Number(v)])),
        author: meta?.author ?? 'unknown',
      })
    })

    const ids = listShapes(doc.yTable, doc.yShapeMeta).map(({ attrs }) => attrs.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  test('concurrent adds produce consistent z-order on both peers', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    add(peer1, { id: 'p1-shape' })
    add(peer2, { id: 'p2-shape' })
    sync(peer1.ydoc, peer2.ydoc)

    const order1 = listShapes(peer1.yTable, peer1.yShapeMeta).map(({ attrs }) => attrs.id)
    const order2 = listShapes(peer2.yTable, peer2.yShapeMeta).map(({ attrs }) => attrs.id)
    expect(order1).toEqual(order2)
    expect(order1.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Schema migration
// ─────────────────────────────────────────────────────────────────────────────

describe('schema migration', () => {
  test('already at current schema — migration is a no-op', () => {
    const doc = makeDoc()
    doc.ydoc.transact(() => doc.yMeta.set('schemaVersion', CURRENT_SCHEMA))
    add(doc, { id: 'existing' })

    runMigrations(doc.ydoc, doc.yMeta, doc.yTable)

    expect(doc.yTable.length).toBe(1)
    expect(doc.yMeta.get('schemaVersion')).toBe(CURRENT_SCHEMA)
  })
})
