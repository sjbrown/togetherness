// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, clearYNodeMap, _clearSvgTextCache, findToy } from '../../src/toys.js'
import {
  snapshotYNode, restoreYNodeFromSnapshot, captureRevertSnapshot,
  getRevertSnapshots, recordRevertSnapshot,
  isRevertsEnabled, setRevertsEnabled,
} from '../../src/snapshot.js'

const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')
const PLAYER_MARKER_SVG = fs.readFileSync(path.join(TOY_DIR, 'player_marker.svg'), 'utf8')

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => PLAYER_MARKER_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

// Recursively compare snapshot shapes (attributes + structure), since two
// independently-built Y.XmlElement trees are never === or deep-equal in
// Yjs's own sense (different item ids), but should be structurally
// identical after a round trip.
function shapesMatch(a, b) {
  if (a === null || b === null) return a === b
  if (a.nodeName !== b.nodeName) return false
  if (a.nodeName === '#text') return a.text === b.text
  if (JSON.stringify(a.attributes) !== JSON.stringify(b.attributes)) return false
  if (a.children.length !== b.children.length) return false
  return a.children.every((child, i) => shapesMatch(child, b.children[i]))
}

// Yjs XML nodes only return real data from getAttributes()/toArray()/
// toString() once attached to a Y.Doc — a detached node reads back empty
// (and Yjs logs a warning). restoreYNodeFromSnapshot deliberately returns
// a detached tree (matching storage.js's domToY, always used the same
// way: build detached, then insert into a real parent immediately) — so
// every test here attaches before asserting, the same way any real caller
// (envelope.js, escalation.js) would.
function attach(yNode) {
  const ydoc = new Y.Doc()
  ydoc.getXmlFragment('scratch').insert(0, [yNode])
  return yNode
}

describe('snapshotYNode / restoreYNodeFromSnapshot — round-trip fidelity', () => {
  beforeEach(() => setRevertsEnabled(true))
  test('a simple element with attributes, no children', () => {
    const original = attach(new Y.XmlElement('g'))
    original.setAttribute('class', 'toy')
    original.setAttribute('data-color', '#e33')

    const snapshot = snapshotYNode(original)
    const restored  = attach(restoreYNodeFromSnapshot(snapshot))

    expect(restored.nodeName).toBe('g')
    expect(restored.getAttributes()).toEqual({ class: 'toy', 'data-color': '#e33' })
  })

  test('an empty element — no attributes, no children', () => {
    const original = attach(new Y.XmlElement('g'))
    const restored = attach(restoreYNodeFromSnapshot(snapshotYNode(original)))
    expect(restored.nodeName).toBe('g')
    expect(restored.getAttributes()).toEqual({})
    expect(restored.toArray()).toEqual([])
  })

  test('text content (Y.XmlText)', () => {
    const original = attach(new Y.XmlText('hello world'))
    const snapshot  = snapshotYNode(original)
    expect(snapshot).toEqual({ nodeName: '#text', text: 'hello world' })
    const restored = attach(restoreYNodeFromSnapshot(snapshot))
    expect(restored).toBeInstanceOf(Y.XmlText)
    expect(restored.toString()).toBe('hello world')
  })

  test('nested structure, several levels deep', () => {
    const grandchild = new Y.XmlElement('circle')
    grandchild.setAttribute('r', '5')
    const child = new Y.XmlElement('g')
    child.setAttribute('class', 'inner')
    child.insert(0, [grandchild])
    const root = attach(new Y.XmlElement('svg'))
    root.setAttribute('width', '64')
    root.insert(0, [child])

    const restored = attach(restoreYNodeFromSnapshot(snapshotYNode(root)))
    expect(restored.getAttributes()).toEqual({ width: '64' })
    const restoredChild = restored.toArray()[0]
    expect(restoredChild.nodeName).toBe('g')
    expect(restoredChild.getAttributes()).toEqual({ class: 'inner' })
    const restoredGrandchild = restoredChild.toArray()[0]
    expect(restoredGrandchild.nodeName).toBe('circle')
    expect(restoredGrandchild.getAttributes()).toEqual({ r: '5' })
  })

  test('mixed children — elements and text together', () => {
    const tspan = new Y.XmlElement('tspan')
    tspan.insert(0, [new Y.XmlText('42')])
    const root = attach(new Y.XmlElement('text'))
    root.insert(0, [tspan])

    const restored = attach(restoreYNodeFromSnapshot(snapshotYNode(root)))
    const restoredTspan = restored.toArray()[0]
    expect(restoredTspan.nodeName).toBe('tspan')
    expect(restoredTspan.toArray()[0].toString()).toBe('42')
  })

  test('a real toy asset\'s full subtree round-trips structurally identical', async () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#e33' })

    const original = findToy(yToys, 't1')
    const snapshot  = snapshotYNode(original)
    const restored  = attach(restoreYNodeFromSnapshot(snapshot))
    const roundTrippedSnapshot = snapshotYNode(restored)

    // Not === (fresh Yjs items, as always) and not the same object, but
    // structurally identical: same attributes, same nesting, all the way
    // down — filter, feColorMatrix, both shadow ellipses, the marker path.
    expect(restored).not.toBe(original)
    expect(shapesMatch(snapshot, roundTrippedSnapshot)).toBe(true)
    expect(snapshot.attributes['data-color']).toBe('#e33')
  })
})

describe('captureRevertSnapshot', () => {
  beforeEach(() => setRevertsEnabled(true))
  test('parentKey is null when the parent is a root fragment (top-level toy)', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const toy = new Y.XmlElement('g')
    ydoc.transact(() => { yToys.insert(0, [toy]) })

    const { parentKey } = captureRevertSnapshot(toy, yToys)
    expect(parentKey).toBeNull()
  })

  test('parentKey is the parent\'s own item-id key when nested', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const container = new Y.XmlElement('g')
    const child = new Y.XmlElement('die')
    ydoc.transact(() => {
      yToys.insert(0, [container])
      container.insert(0, [child])
    })

    const { parentKey } = captureRevertSnapshot(child, container)
    expect(parentKey).toBe(`${container._item.id.client}:${container._item.id.clock}`)
  })

  test('index reflects the node\'s current position among siblings', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const a = new Y.XmlElement('a')
    const b = new Y.XmlElement('b')
    const c = new Y.XmlElement('c')
    ydoc.transact(() => { yToys.insert(0, [a, b, c]) })

    expect(captureRevertSnapshot(a, yToys).index).toBe(0)
    expect(captureRevertSnapshot(b, yToys).index).toBe(1)
    expect(captureRevertSnapshot(c, yToys).index).toBe(2)
  })

  test('content matches snapshotYNode exactly', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const toy = new Y.XmlElement('g')
    toy.setAttribute('data-toy-id', 'tt-t-v1-abc12')
    ydoc.transact(() => { yToys.insert(0, [toy]) })

    const { content } = captureRevertSnapshot(toy, yToys)
    expect(content).toEqual(snapshotYNode(toy))
  })
})

describe('getRevertSnapshots / recordRevertSnapshot', () => {
  beforeEach(() => setRevertsEnabled(true))
  test('writes to the slot keyed by authorId', () => {
    const ydoc = new Y.Doc()
    const bundleStamp = { clientID: 123, clock: 5 }
    const snapshot = { parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] } }

    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob', bundleStamp, snapshot))

    const stored = getRevertSnapshots(ydoc).get('tt-p-v1-01-bob')
    expect(stored.authorId).toBe('tt-p-v1-01-bob')
    expect(stored.bundleStamp).toEqual(bundleStamp)
    expect(stored.parentKey).toBeNull()
    expect(stored.index).toBe(0)
    expect(stored.content).toEqual(snapshot.content)
    expect(typeof stored.ts).toBe('number')
  })

  test('a second commit by the same peer evicts the first — one slot per authorId, not per commit', () => {
    const ydoc = new Y.Doc()
    const firstSnapshot  = { parentKey: null, index: 0, content: { nodeName: 'g', attributes: { id: 'first' }, children: [] } }
    const secondSnapshot = { parentKey: null, index: 1, content: { nodeName: 'g', attributes: { id: 'second' }, children: [] } }

    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob', { clientID: 1, clock: 5 }, firstSnapshot))
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob', { clientID: 1, clock: 9 }, secondSnapshot))

    expect(getRevertSnapshots(ydoc).size).toBe(1)
    const stored = getRevertSnapshots(ydoc).get('tt-p-v1-01-bob')
    expect(stored.bundleStamp).toEqual({ clientID: 1, clock: 9 })
    expect(stored.content.attributes.id).toBe('second')
  })

  test('different peers get independent slots', () => {
    const ydoc = new Y.Doc()
    const snapshot = { parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] } }

    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-alice', { clientID: 1, clock: 1 }, snapshot))
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob',   { clientID: 2, clock: 1 }, snapshot))

    expect(getRevertSnapshots(ydoc).size).toBe(2)
  })

  test('no-op (does not throw, writes nothing) when authorId is missing', () => {
    const ydoc = new Y.Doc()
    const snapshot = { parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] } }
    expect(() => {
      ydoc.transact(() => recordRevertSnapshot(ydoc, undefined, { clientID: 1, clock: 1 }, snapshot))
    }).not.toThrow()
    expect(getRevertSnapshots(ydoc).size).toBe(0)
  })

  test('the synced map converges identically across two replicas', () => {
    const ydocA = new Y.Doc()
    const snapshot = { parentKey: null, index: 0, content: { nodeName: 'g', attributes: { id: 'x' }, children: [] } }
    ydocA.transact(() => recordRevertSnapshot(ydocA, 'tt-p-v1-01-bob', { clientID: 1, clock: 1 }, snapshot))

    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))

    expect(getRevertSnapshots(ydocB).get('tt-p-v1-01-bob').content.attributes.id).toBe('x')
  })
})

describe('isRevertsEnabled / setRevertsEnabled — the experimental kill switch', () => {
  // _revertsEnabled is module-level state, persisting across tests in this
  // file — reset to the default after each test so this describe block
  // doesn't leak a disabled state into whatever runs next.
  beforeEach(() => setRevertsEnabled(true))
  afterEach(() => setRevertsEnabled(true))

  test('defaults to enabled — matches this mechanism\'s existing, already-shipped behavior', () => {
    expect(isRevertsEnabled()).toBe(true)
  })

  test('getRevertSnapshots returns a real, synced map when enabled', () => {
    const ydoc = new Y.Doc()
    const snapshots = getRevertSnapshots(ydoc)
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob', { clientID: 1, clock: 1 }, {
      parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] },
    }))
    expect(snapshots.get('tt-p-v1-01-bob')).toBeTruthy()

    // And it's the real, synced ydoc map — visible from a second replica.
    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydoc))
    expect(getRevertSnapshots(ydocB).get('tt-p-v1-01-bob')).toBeTruthy()
  })

  test('getRevertSnapshots returns an empty, throwaway map when disabled', () => {
    const ydoc = new Y.Doc()
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'tt-p-v1-01-bob', { clientID: 1, clock: 1 }, {
      parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] },
    }))
    expect(getRevertSnapshots(ydoc).size).toBe(1) // present while enabled

    setRevertsEnabled(false)

    expect(getRevertSnapshots(ydoc).size).toBe(0) // hidden while disabled — even though it's still really there
    expect(getRevertSnapshots(ydoc).get('tt-p-v1-01-bob')).toBeUndefined()
  })

})
