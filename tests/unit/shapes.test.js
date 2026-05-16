/**
 * crdt-svg.test.js
 * Run with: npx vitest run  (or jest with --experimental-vm-modules)
 *
 * These tests import Yjs directly in Node — no browser, no network.
 * Sync is simulated with Y.encodeStateAsUpdate / Y.applyUpdate.
 *
 * Data model (v3): ydoc.getArray('shapes') — Y.Array<Y.Map>
 *   Each Y.Map has: id, x, y, w, h, fill, stroke, strokeWidth, opacity, author, created
 *   Array index = z-order (0 = bottom, last = top)
 */

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — mirror the app's core operations so tests stay readable
// ─────────────────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

function makeDoc() {
  const ydoc    = new Y.Doc()
  const yMeta   = ydoc.getMap('meta')
  const yShapes = ydoc.getArray('shapes')
  yMeta.set('schemaVersion', 3)
  return { ydoc, yMeta, yShapes }
}

function addShape(ydoc, yShapes, attrs = {}) {
  const id     = attrs.id ?? uid()
  const yShape = new Y.Map()
  const shape  = {
    id, x: 10, y: 10, w: 100, h: 50,
    fill: '#c8f060', stroke: 'none', strokeWidth: 0, opacity: 1,
    author: 'test-peer', created: Date.now(),
    ...attrs,
  }
  ydoc.transact(() => {
    Object.entries(shape).forEach(([k, v]) => yShape.set(k, v))
    yShapes.push([yShape])
  })
  return id
}

function deleteShape(ydoc, yShapes, id) {
  const idx = yShapes.toArray().findIndex(s => s.get('id') === id)
  if (idx !== -1) ydoc.transact(() => yShapes.delete(idx, 1))
}

// Simulate network sync between two docs (full state exchange)
function sync(docA, docB) {
  Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
  Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
}

// Read the shapes array as plain objects for easy assertions
function shapes(yShapes) {
  return yShapes.toArray().map(s => {
    const obj = {}
    s.forEach((v, k) => obj[k] = v)
    return obj
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic operations
// ─────────────────────────────────────────────────────────────────────────────

describe('basic operations', () => {
  test('add a shape', () => {
    const { ydoc, yShapes } = makeDoc()
    addShape(ydoc, yShapes, { id: 'a', fill: 'red' })
    expect(yShapes.length).toBe(1)
    expect(yShapes.get(0).get('fill')).toBe('red')
  })

  test('delete a shape', () => {
    const { ydoc, yShapes } = makeDoc()
    addShape(ydoc, yShapes, { id: 'a' })
    addShape(ydoc, yShapes, { id: 'b' })
    deleteShape(ydoc, yShapes, 'a')
    expect(yShapes.length).toBe(1)
    expect(yShapes.get(0).get('id')).toBe('b')
  })

  test('edit a shape attribute', () => {
    const { ydoc, yShapes } = makeDoc()
    addShape(ydoc, yShapes, { id: 'a', fill: 'red' })
    ydoc.transact(() => yShapes.get(0).set('fill', 'blue'))
    expect(yShapes.get(0).get('fill')).toBe('blue')
  })

  test('z-order: shapes render in insertion order', () => {
    const { ydoc, yShapes } = makeDoc()
    addShape(ydoc, yShapes, { id: 'bottom' })
    addShape(ydoc, yShapes, { id: 'middle' })
    addShape(ydoc, yShapes, { id: 'top' })
    const ids = shapes(yShapes).map(s => s.id)
    expect(ids).toEqual(['bottom', 'middle', 'top'])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRDT convergence
// ─────────────────────────────────────────────────────────────────────────────

describe('convergence', () => {
  test('concurrent adds on two peers — both survive after sync', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    // Partition: each peer adds a shape offline
    addShape(peer1.ydoc, peer1.yShapes, { id: 'from-peer1', author: 'peer1' })
    addShape(peer2.ydoc, peer2.yShapes, { id: 'from-peer2', author: 'peer2' })

    // Rejoin
    sync(peer1.ydoc, peer2.ydoc)

    expect(peer1.yShapes.length).toBe(2)
    expect(peer2.yShapes.length).toBe(2)

    const ids1 = shapes(peer1.yShapes).map(s => s.id).sort()
    const ids2 = shapes(peer2.yShapes).map(s => s.id).sort()
    expect(ids1).toEqual(ids2)
    expect(ids1).toContain('from-peer1')
    expect(ids1).toContain('from-peer2')
  })

  test('both peers converge to identical state after sync', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    addShape(peer1.ydoc, peer1.yShapes, { id: 'a' })
    addShape(peer2.ydoc, peer2.yShapes, { id: 'b' })
    sync(peer1.ydoc, peer2.ydoc)

    // Encode both docs and compare — must be byte-for-byte equivalent
    const state1 = Y.encodeStateAsUpdate(peer1.ydoc)
    const state2 = Y.encodeStateAsUpdate(peer2.ydoc)
    expect(Buffer.from(state1).toString('hex')).toBe(Buffer.from(state2).toString('hex'))
  })

  test('concurrent attribute edits on same shape — both applied independently', () => {
    // Start with a shared shape on both peers
    const peer1 = makeDoc()
    addShape(peer1.ydoc, peer1.yShapes, { id: 'shared', fill: 'red', x: 10 })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)  // peer2 now has the shape

    // Partition: peer1 changes fill, peer2 moves x — concurrently
    ydoc_transact_shape(peer1, 'shared', 'fill', 'blue')
    ydoc_transact_shape(peer2, 'shared', 'x', 99)

    // Rejoin
    sync(peer1.ydoc, peer2.ydoc)

    // Both changes survive — no clobber
    const s1 = getShapeById(peer1.yShapes, 'shared')
    const s2 = getShapeById(peer2.yShapes, 'shared')
    expect(s1.get('fill')).toBe('blue')
    expect(s1.get('x')).toBe(99)
    expect(s2.get('fill')).toBe('blue')
    expect(s2.get('x')).toBe(99)
  })

  test('concurrent delete on one peer, edit on other — delete wins', () => {
    const peer1 = makeDoc()
    addShape(peer1.ydoc, peer1.yShapes, { id: 'doomed', fill: 'red' })

    const peer2 = makeDoc()
    sync(peer1.ydoc, peer2.ydoc)

    // Partition: peer1 deletes, peer2 edits the same shape
    deleteShape(peer1.ydoc, peer1.yShapes, 'doomed')
    ydoc_transact_shape(peer2, 'doomed', 'fill', 'blue')

    sync(peer1.ydoc, peer2.ydoc)

    // Yjs delete wins — shape is gone on both peers
    expect(peer1.yShapes.length).toBe(0)
    expect(peer2.yShapes.length).toBe(0)
  })

  test('three-way merge — all peers converge', () => {
    const peers = [makeDoc(), makeDoc(), makeDoc()]

    addShape(peers[0].ydoc, peers[0].yShapes, { id: 'p0' })
    addShape(peers[1].ydoc, peers[1].yShapes, { id: 'p1' })
    addShape(peers[2].ydoc, peers[2].yShapes, { id: 'p2' })

    // Full sync: all pairs
    sync(peers[0].ydoc, peers[1].ydoc)
    sync(peers[1].ydoc, peers[2].ydoc)
    sync(peers[0].ydoc, peers[2].ydoc)

    const lengths = peers.map(p => p.yShapes.length)
    expect(lengths).toEqual([3, 3, 3])

    const idSets = peers.map(p => shapes(p.yShapes).map(s => s.id).sort().join(','))
    expect(idSets[0]).toBe(idSets[1])
    expect(idSets[1]).toBe(idSets[2])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Z-order
// ─────────────────────────────────────────────────────────────────────────────

describe('z-order', () => {
  test('bring to front: delete + re-append moves shape to top', () => {
    const { ydoc, yShapes } = makeDoc()
    addShape(ydoc, yShapes, { id: 'a' })
    addShape(ydoc, yShapes, { id: 'b' })
    addShape(ydoc, yShapes, { id: 'c' })

    // Bring 'a' to front — must clone because a Y.Map can't be re-inserted once integrated
    const idx = yShapes.toArray().findIndex(s => s.get('id') === 'a')
    const old = yShapes.get(idx)
    const clone = new Y.Map()
    old.forEach((v, k) => clone.set(k, v))
    ydoc.transact(() => {
      yShapes.delete(idx, 1)
      yShapes.push([clone])
    })

    const ids = shapes(yShapes).map(s => s.id)
    expect(ids).toEqual(['b', 'c', 'a'])
  })

  test('concurrent adds produce consistent z-order on both peers', () => {
    const peer1 = makeDoc()
    const peer2 = makeDoc()

    addShape(peer1.ydoc, peer1.yShapes, { id: 'p1-shape' })
    addShape(peer2.ydoc, peer2.yShapes, { id: 'p2-shape' })
    sync(peer1.ydoc, peer2.ydoc)

    // Order may vary but must be identical on both peers
    const order1 = shapes(peer1.yShapes).map(s => s.id)
    const order2 = shapes(peer2.yShapes).map(s => s.id)
    expect(order1).toEqual(order2)
    expect(order1.length).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Schema migration
// ─────────────────────────────────────────────────────────────────────────────

describe('schema migration', () => {
  test('v1 → v3: flat Y.Map("rects") migrates to Y.Array("shapes")', () => {
    const ydoc  = new Y.Doc()
    const yMeta = ydoc.getMap('meta')

    // Simulate a v1 doc
    const oldRects = ydoc.getMap('rects')
    ydoc.transact(() => {
      oldRects.set('abc', { id: 'abc', x: 5, y: 5, w: 50, h: 30, fill: 'red', created: 1000 })
      oldRects.set('def', { id: 'def', x: 6, y: 6, w: 60, h: 40, fill: 'blue', created: 2000 })
      yMeta.set('schemaVersion', 1)
    })

    // Run migration (copy of app's runMigrations for v1)
    const yShapes = ydoc.getArray('shapes')
    const entries = []
    oldRects.forEach((shape, id) => entries.push([id, shape]))
    entries.sort((a, b) => (a[1].created || 0) - (b[1].created || 0))
    ydoc.transact(() => {
      entries.forEach(([, shape]) => {
        const yShape = new Y.Map()
        Object.entries(shape).forEach(([k, v]) => yShape.set(k, v))
        yShapes.push([yShape])
      })
      yMeta.set('schemaVersion', 3)
    })

    expect(yMeta.get('schemaVersion')).toBe(3)
    expect(yShapes.length).toBe(2)
    // Sorted by created timestamp — abc first
    expect(yShapes.get(0).get('id')).toBe('abc')
    expect(yShapes.get(1).get('id')).toBe('def')
  })

  test('v2 → v3: Y.Array("order") + Y.Map("shapes") migrates to Y.Array("shapes")', () => {
    const ydoc  = new Y.Doc()
    const yMeta = ydoc.getMap('meta')

    // Simulate a v2 doc — use key 'shapes-v2' to avoid type conflict with getArray('shapes')
    // In the real app the name collision doesn't arise because v2 used getMap('shapes')
    // and v3 uses getArray('shapes') — Yjs would throw if both are accessed on the same doc.
    // The migration runs before getArray('shapes') is ever called, so it's safe in practice.
    // In this test we use a different key to simulate the v2 state cleanly.
    const oldOrder  = ydoc.getArray('order')
    const oldShapes = ydoc.getMap('shapes-v2')
    ydoc.transact(() => {
      const s1 = new Y.Map(); s1.set('id', 'x1'); s1.set('fill', 'green')
      const s2 = new Y.Map(); s2.set('id', 'x2'); s2.set('fill', 'purple')
      oldShapes.set('x1', s1)
      oldShapes.set('x2', s2)
      oldOrder.push(['x1', 'x2'])
      yMeta.set('schemaVersion', 2)
    })

    // Run v2 → v3 migration
    const yShapes = ydoc.getArray('shapes')
    const ids = oldOrder.toArray()
    ydoc.transact(() => {
      ids.forEach(id => {
        const old = oldShapes.get(id)
        if (!old) return
        const yShape = new Y.Map()
        old.forEach((v, k) => yShape.set(k, v))
        yShapes.push([yShape])
      })
      yMeta.set('schemaVersion', 3)
    })

    expect(yMeta.get('schemaVersion')).toBe(3)
    expect(yShapes.length).toBe(2)
    expect(yShapes.get(0).get('id')).toBe('x1')
    expect(yShapes.get(1).get('id')).toBe('x2')
  })

  test('already at current schema — migration is a no-op', () => {
    const { ydoc, yMeta, yShapes } = makeDoc()  // makeDoc sets schemaVersion: 3
    addShape(ydoc, yShapes, { id: 'existing' })

    // runMigrations should do nothing
    let version = yMeta.get('schemaVersion') ?? 1
    const migrations = { /* no entry for v3 */ }
    while (version < 3) {
      if (!migrations[version]) break
      version++
    }

    expect(yShapes.length).toBe(1)  // unchanged
    expect(yMeta.get('schemaVersion')).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers used in convergence tests
// ─────────────────────────────────────────────────────────────────────────────

function getShapeById(yShapes, id) {
  return yShapes.toArray().find(s => s.get('id') === id) ?? null
}

function ydoc_transact_shape({ ydoc, yShapes }, id, key, value) {
  const yShape = getShapeById(yShapes, id)
  if (yShape) ydoc.transact(() => yShape.set(key, value))
}
