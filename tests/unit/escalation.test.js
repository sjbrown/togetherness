// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'
import { resolveConflictWinner, revertBundle } from '../../src/escalation.js'

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

describe('revertBundle', () => {
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

    // The bundle's touched-set includes BOTH the pre-existing container
    // (touched as record.target, not created by this commit) and B's own
    // new child — matching what touchedSetFromRecords actually produces
    // for a childList insertion.
    const loserBundle = bundle({
      clientID: ydocB.clientID, clock: child._item.id.clock, authorId: 'peer-B',
      touched: [containerKey, childKey],
    })
    ydocA.transact(() => revertBundle(ydocA, loserBundle))

    // Container survives (shared, pre-existing, created by A) — only B's
    // own new child (created by this exact commit) is gone.
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

    // Peer A and Peer B each concurrently drop their own die into the tray.
    const dieA = new Y.XmlElement('die')
    ydocA.transact(() => { tray.insert(0, [dieA]) })
    const dieB = new Y.XmlElement('die')
    ydocB.transact(() => { trayOnB.insert(0, [dieB]) })

    // Sync.
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
    expect(winner).toBe(bundleA) // peer-A joined first
    expect(loser).toBe(bundleB)

    // Every peer applies the same deterministic revert independently —
    // simulate both A and B doing so on their own replicas.
    ydocA.transact(() => revertBundle(ydocA, loser))
    ydocB.transact(() => revertBundle(ydocB, loser))

    for (const [ydoc, yToys] of [[ydocA, yToysA], [ydocB, yToysB]]) {
      const trayNode = yToys.toArray()[0]
      expect(trayNode.toArray().length).toBe(1) // only the winner's die remains
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
