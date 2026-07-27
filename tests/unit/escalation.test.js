// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'
import { resolveConflictWinner, revertBundle } from '../../src/escalation.js'
import { recordRevertSnapshot, getRevertSnapshots, snapshotYNode } from '../../src/snapshot.js'

const { ensureJoined } = tablesAPI

function bundle({ clientID, clock, authorId, touched }) {
  return { clientID, clock, authorId, touched, beforeState: {}, origin: 'envelope', ts: 0 }
}

describe('resolveConflictWinner', () => {
  test('picks the earlier joiner as winner', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')

    const a = bundle({ clientID: 1, clock: 1, authorId: 'peer-A', touched: [] })
    const b = bundle({ clientID: 2, clock: 1, authorId: 'peer-B', touched: [] })

    const result = resolveConflictWinner(ydoc, a, b)
    expect(result.winner).toBe(a)
    expect(result.loser).toBe(b)
  })

  test('order of arguments does not change the outcome', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')

    const a = bundle({ clientID: 1, clock: 1, authorId: 'peer-A', touched: [] })
    const b = bundle({ clientID: 2, clock: 1, authorId: 'peer-B', touched: [] })

    const result = resolveConflictWinner(ydoc, b, a)
    expect(result.winner).toBe(a)
    expect(result.loser).toBe(b)
  })

  test('returns null if either bundle has no authorId', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')

    const a = bundle({ clientID: 1, clock: 1, authorId: 'peer-A', touched: [] })
    const bNoAuthor = bundle({ clientID: 2, clock: 1, authorId: undefined, touched: [] })

    expect(resolveConflictWinner(ydoc, a, bNoAuthor)).toBeNull()
    expect(resolveConflictWinner(ydoc, bNoAuthor, a)).toBeNull()
  })

  test('returns null if both bundles somehow share an authorId', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')

    const a = bundle({ clientID: 1, clock: 1, authorId: 'peer-A', touched: [] })
    const b = bundle({ clientID: 2, clock: 2, authorId: 'peer-A', touched: [] })

    expect(resolveConflictWinner(ydoc, a, b)).toBeNull()
  })
})

describe('revertBundle — deleting the loser\'s own insertions', () => {
  test('deletes an item the bundle\'s own commit created', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const container = new Y.XmlElement('g')
    ydoc.transact(() => { yToys.insert(0, [container]) })

    const child = new Y.XmlElement('die')
    let clock
    ydoc.transact(() => {
      container.insert(0, [child])
      clock = Y.getState(ydoc.store, ydoc.clientID) - 1 // the child's own clock
    })
    const key = `${ydoc.clientID}:${clock}`

    const loserBundle = bundle({ clientID: ydoc.clientID, clock, authorId: 'peer-B', touched: [key] })
    ydoc.transact(() => revertBundle(ydoc, loserBundle))

    expect(container.toArray().length).toBe(0)
  })

  test('does NOT delete a pre-existing shared node the bundle merely touched', () => {
    // Container created on peer A; the "loser" bundle represents peer B's
    // own commit inserting a child into A's pre-existing container — the
    // real cross-peer shape this matters for (a single-doc/single-client
    // test can't actually distinguish "created by me" from "pre-existing",
    // since everything would share one clientID).
    const ydocA = new Y.Doc()
    const yToysA = ydocA.getXmlFragment('toys')
    const container = new Y.XmlElement('g')
    ydocA.transact(() => { yToysA.insert(0, [container]) })
    const containerKey = `${container._item.id.client}:${container._item.id.clock}`

    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))
    const yToysB = ydocB.getXmlFragment('toys')
    const containerOnB = yToysB.toArray()[0]

    const child = new Y.XmlElement('die')
    ydocB.transact(() => { containerOnB.insert(0, [child]) })
    const childKey = `${child._item.id.client}:${child._item.id.clock}`

    Y.applyUpdate(ydocA, Y.encodeStateAsUpdate(ydocB))

    const loserBundle = bundle({
      clientID: ydocB.clientID, clock: child._item.id.clock, authorId: 'peer-B',
      touched: [containerKey, childKey],
    })
    ydocA.transact(() => revertBundle(ydocA, loserBundle))

    const containerOnA = yToysA.toArray()[0]
    expect(containerOnA).toBe(container)
    expect(container.toArray().length).toBe(0)
  })

  test('two peers, the canonical race: reverting the loser removes only their own die', () => {
    const ydocA = new Y.Doc()
    const yToysA = ydocA.getXmlFragment('toys')
    ensureJoined(ydocA, 'peer-A')
    ensureJoined(ydocA, 'peer-B')
    const tray = new Y.XmlElement('g')
    ydocA.transact(() => { yToysA.insert(0, [tray]) })

    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))
    const yToysB = ydocB.getXmlFragment('toys')
    const trayOnB = yToysB.toArray()[0]

    const dieA = new Y.XmlElement('die')
    ydocA.transact(() => { tray.insert(0, [dieA]) })
    const dieB = new Y.XmlElement('die')
    ydocB.transact(() => { trayOnB.insert(0, [dieB]) })

    Y.applyUpdate(ydocA, Y.encodeStateAsUpdate(ydocB))
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))

    const trayKey = `${tray._item.id.client}:${tray._item.id.clock}`
    const bundleA = bundle({
      clientID: ydocA.clientID, clock: dieA._item.id.clock, authorId: 'peer-A',
      touched: [trayKey, `${ydocA.clientID}:${dieA._item.id.clock}`],
    })
    const bundleB = bundle({
      clientID: ydocB.clientID, clock: dieB._item.id.clock, authorId: 'peer-B',
      touched: [trayKey, `${ydocB.clientID}:${dieB._item.id.clock}`],
    })

    const { winner, loser } = resolveConflictWinner(ydocA, bundleA, bundleB)
    expect(winner).toBe(bundleA)
    expect(loser).toBe(bundleB)

    ydocA.transact(() => revertBundle(ydocA, loser))
    ydocB.transact(() => revertBundle(ydocB, loser))

    for (const [, yToys] of [[ydocA, yToysA], [ydocB, yToysB]]) {
      const trayNode = yToys.toArray()[0]
      expect(trayNode.toArray().length).toBe(1)
      expect(trayNode.toArray()[0].nodeName).toBe('die')
    }
  })

  test('is idempotent — reverting the same bundle twice does not throw or double-delete', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const container = new Y.XmlElement('g')
    ydoc.transact(() => { yToys.insert(0, [container]) })
    const child = new Y.XmlElement('die')
    ydoc.transact(() => { container.insert(0, [child]) })
    const key = `${child._item.id.client}:${child._item.id.clock}`

    const loserBundle = bundle({ clientID: ydoc.clientID, clock: child._item.id.clock, authorId: 'peer-B', touched: [key] })

    expect(() => {
      ydoc.transact(() => revertBundle(ydoc, loserBundle))
      ydoc.transact(() => revertBundle(ydoc, loserBundle))
    }).not.toThrow()
    expect(container.toArray().length).toBe(0)
  })

  test('a touched-set key for an already-nonexistent item is silently skipped, not an error', () => {
    const ydoc = new Y.Doc()
    const fakeBundle = bundle({ clientID: ydoc.clientID, clock: 0, authorId: 'peer-B', touched: ['999999:0'] })
    expect(() => { ydoc.transact(() => revertBundle(ydoc, fakeBundle)) }).not.toThrow()
  })
})

describe('revertBundle — restoring the loser\'s removed pre-existing content', () => {
  test('restores content from a matching snapshot, at the recorded parent and index', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const before = new Y.XmlElement('g')
    const after  = new Y.XmlElement('g')
    ydoc.transact(() => { yToys.insert(0, [before, after]) })

    // Simulate: a top-level die (originally at index 1, between "before"
    // and "after") got reparented away — envelope.js would have snapshot
    // this before deleting it. Build that snapshot directly here.
    const dieSnapshot = { nodeName: 'g', attributes: { 'data-toy-id': 'die2', x: '340' }, children: [] }
    const bundleStamp = { clientID: 999, clock: 42 }
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'peer-B', bundleStamp, {
      parentKey: null, index: 1, content: dieSnapshot,
    }))

    const loserBundle = bundle({ clientID: 999, clock: 42, authorId: 'peer-B', touched: [] })
    ydoc.transact(() => revertBundle(ydoc, loserBundle))

    const names = yToys.toArray()
    expect(names.length).toBe(3)
    expect(names[1].getAttributes()).toEqual({ 'data-toy-id': 'die2', x: '340' }) // restored, at index 1
    expect(names[0]).toBe(before)
    expect(names[2]).toBe(after)
  })

  test('restores into a nested parent (not just top level)', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const container = new Y.XmlElement('g')
    ydoc.transact(() => { yToys.insert(0, [container]) })
    const containerKey = `${container._item.id.client}:${container._item.id.clock}`

    const dieSnapshot = { nodeName: 'g', attributes: { 'data-toy-id': 'die3' }, children: [] }
    const bundleStamp = { clientID: 999, clock: 7 }
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'peer-B', bundleStamp, {
      parentKey: containerKey, index: 0, content: dieSnapshot,
    }))

    const loserBundle = bundle({ clientID: 999, clock: 7, authorId: 'peer-B', touched: [] })
    ydoc.transact(() => revertBundle(ydoc, loserBundle))

    expect(container.toArray().length).toBe(1)
    expect(container.toArray()[0].getAttribute('data-toy-id')).toBe('die3')
  })

  test('does NOT restore when the stored snapshot protects a different (stale) commit', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')

    ydoc.transact(() => recordRevertSnapshot(ydoc, 'peer-B', { clientID: 999, clock: 42 }, {
      parentKey: null, index: 0, content: { nodeName: 'g', attributes: {}, children: [] },
    }))

    // A DIFFERENT commit by the same peer — different clock — is what's
    // actually being reverted here.
    const loserBundle = bundle({ clientID: 999, clock: 999, authorId: 'peer-B', touched: [] })
    ydoc.transact(() => revertBundle(ydoc, loserBundle))

    expect(yToys.toArray().length).toBe(0) // nothing restored — mismatch
    expect(getRevertSnapshots(ydoc).get('peer-B')).toBeTruthy() // untouched — still there for whatever it actually protects
  })

  test('does NOT restore when there is no snapshot at all', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const loserBundle = bundle({ clientID: 999, clock: 1, authorId: 'peer-B', touched: [] })
    expect(() => { ydoc.transact(() => revertBundle(ydoc, loserBundle)) }).not.toThrow()
    expect(yToys.toArray().length).toBe(0)
  })

  test('consumes the snapshot on success — a second revertBundle call for the same bundle does not duplicate', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const bundleStamp = { clientID: 999, clock: 42 }
    ydoc.transact(() => recordRevertSnapshot(ydoc, 'peer-B', bundleStamp, {
      parentKey: null, index: 0, content: { nodeName: 'g', attributes: { id: 'die2' }, children: [] },
    }))
    const loserBundle = bundle({ clientID: 999, clock: 42, authorId: 'peer-B', touched: [] })

    ydoc.transact(() => revertBundle(ydoc, loserBundle))
    expect(getRevertSnapshots(ydoc).has('peer-B')).toBe(false) // consumed

    ydoc.transact(() => revertBundle(ydoc, loserBundle)) // reprocessed — same bundle, sequentially

    expect(yToys.toArray().length).toBe(1) // still just one die2, not two
  })

  test('the full scenario: a reparented die is restored to its original top-level position on revert', () => {
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const tray = new Y.XmlElement('g')
    const die2 = new Y.XmlElement('g')
    die2.setAttribute('data-toy-id', 'die2')
    die2.setAttribute('x', '340')
    ydoc.transact(() => { yToys.insert(0, [tray, die2]) }) // die2 starts top-level, at index 1

    // The reparent: snapshot die2's pre-move content/position (as
    // envelope.js's commitEnvelope would, before deleting it), then
    // actually move it into the tray, simulating the post-move state.
    // clock is captured against the doc's OWN real clientID throughout —
    // a bundle's clientID has to match what Yjs actually assigned to the
    // items it created, not an arbitrary stand-in.
    const bundleStamp = { clientID: ydoc.clientID, clock: 100 }
    let die2MovedClock
    ydoc.transact(() => {
      recordRevertSnapshot(ydoc, 'peer-B', bundleStamp, {
        parentKey: null, index: 1, content: snapshotYNode(die2),
      })
      yToys.delete(1, 1) // remove die2 from top level
      const die2Moved = new Y.XmlElement('g') // fresh identity, matching a real reparent
      die2Moved.setAttribute('data-toy-id', 'die2')
      die2Moved.setAttribute('x', '999') // the NEW (post-drop) position
      tray.insert(0, [die2Moved])
      die2MovedClock = die2Moved._item.id.clock
    })

    expect(tray.toArray().length).toBe(1) // die2 currently sitting in the tray

    const loserBundle = bundle({
      clientID: ydoc.clientID, clock: 100, authorId: 'peer-B',
      touched: [`${ydoc.clientID}:${die2MovedClock}`], // die2's post-move item, created by this bundle
    })
    ydoc.transact(() => revertBundle(ydoc, loserBundle))

    // Removed from the tray (deleted — created by this bundle)...
    expect(tray.toArray().length).toBe(0)
    // ...and restored to the top level, at its original position, with
    // its ORIGINAL (pre-drop) x — not the 999 it had just before revert.
    expect(yToys.toArray().length).toBe(2)
    const restored = yToys.toArray()[1]
    expect(restored.getAttribute('data-toy-id')).toBe('die2')
    expect(restored.getAttribute('x')).toBe('340')
  })

  test('KNOWN LIMITATION: two peers restoring concurrently (before either\'s eviction syncs) both insert — producing two copies, not one', () => {
    // This is the residual gap documented in escalation.js's own doc
    // comment: restoration is an insert, and Yjs never deduplicates
    // inserts by content, so "check snapshot present, then insert" isn't
    // atomic across two independent peers who haven't synced with each
    // other yet. Demonstrated here, not just asserted in prose.
    const ydocA = new Y.Doc()
    const yToysA = ydocA.getXmlFragment('toys')
    const bundleStamp = { clientID: 999, clock: 42 }
    ydocA.transact(() => recordRevertSnapshot(ydocA, 'peer-B', bundleStamp, {
      parentKey: null, index: 0, content: { nodeName: 'g', attributes: { id: 'die2' }, children: [] },
    }))

    const ydocB = new Y.Doc()
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA)) // B syncs BEFORE either restores
    const yToysB = ydocB.getXmlFragment('toys')

    const loserBundle = bundle({ clientID: 999, clock: 42, authorId: 'peer-B', touched: [] })

    // Both peers independently see the snapshot present and restore — NOT
    // syncing with each other in between, simulating genuine concurrency.
    ydocA.transact(() => revertBundle(ydocA, loserBundle))
    ydocB.transact(() => revertBundle(ydocB, loserBundle))

    // Now they sync.
    Y.applyUpdate(ydocA, Y.encodeStateAsUpdate(ydocB))
    Y.applyUpdate(ydocB, Y.encodeStateAsUpdate(ydocA))

    // Two distinct items, not one — the known limitation, made concrete.
    expect(yToysA.toArray().length).toBe(2)
    expect(yToysB.toArray().length).toBe(2)
  })
})
