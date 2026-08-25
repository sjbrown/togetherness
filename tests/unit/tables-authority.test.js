// Authority-ordering tests for tables.js's joinSequence functions (moved
// here from a standalone authority.js — see tables.js's "Join sequence
// (authority ordering)" section). The Y.Array itself is private to
// tables.js; these tests peek at it via ydoc.getArray('joinSequence')
// directly only to assert on internal state, the way any white-box test
// would — production code never does this, only tablesAPI's exported
// functions (ensureJoined, compareAuthority, isAuthoritative,
// resetJoinSequence), which all take a ydoc, never the raw array.

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'

const { ensureJoined, compareAuthority, isAuthoritative, resetJoinSequence } = tablesAPI

// White-box only: production code never calls this directly.
function rawJoinSequence(ydoc) {
  return ydoc.getArray('joinSequence')
}

describe('ensureJoined', () => {
  test('the creator appends a fresh id to an empty joinSequence', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'tt-p-v1-01-aaa', { isCreator: true })
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('a joiner (isCreator: false) defers on an empty joinSequence instead of inserting', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-B')
    expect(rawJoinSequence(ydoc).toArray()).toEqual([])
  })

  test('a deferred joiner catches up once the array changes — e.g. the creator syncs in', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-B') // defers: joinSequence is still empty
    expect(rawJoinSequence(ydoc).toArray()).toEqual([])

    // The creator's entry arrives (e.g. over the wire, mid-session).
    rawJoinSequence(ydoc).push(['peer-A'])

    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A', 'peer-B'])
  })

  test('is idempotent — calling again for the same id does not re-append', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'tt-p-v1-01-aaa', { isCreator: true })
    ensureJoined(ydoc, 'tt-p-v1-01-aaa', { isCreator: true })
    ensureJoined(ydoc, 'tt-p-v1-01-aaa', { isCreator: true })
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('preserves join order across multiple distinct peers', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    ensureJoined(ydoc, 'peer-B')
    ensureJoined(ydoc, 'peer-C')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A', 'peer-B', 'peer-C'])
  })

  test('a returning peer (reload) keeps its original position, not appended again', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    ensureJoined(ydoc, 'peer-B')
    // Simulate peer-A reloading and re-joining.
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A', 'peer-B'])
  })
})

describe('ensureJoined — concurrent joins across two replicas', () => {
  test('the creator always lands first, even when a joiner races ahead of sync', () => {
    const docA = new Y.Doc() // the table's creator
    const docB = new Y.Doc() // a joiner, arriving before docA's entry syncs in

    ensureJoined(docA, 'peer-A', { isCreator: true })
    ensureJoined(docB, 'peer-B') // defers: docB's local joinSequence is still empty

    // docA's entry reaches docB first, firing docB's deferred retry — which
    // appends peer-B locally, after peer-A.
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
    // A real WebRTC session keeps syncing after that first exchange, so
    // docB's now-complete state reaches docA too.
    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))

    const seqA = rawJoinSequence(docA).toArray()
    const seqB = rawJoinSequence(docB).toArray()
    expect(seqA).toEqual(seqB)
    expect(seqA).toEqual(['peer-A', 'peer-B'])
  })

  test('two non-creator joiners racing an already-synced creator tie-break arbitrarily but consistently', () => {
    const docA = new Y.Doc()
    ensureJoined(docA, 'peer-A', { isCreator: true })

    const docB = new Y.Doc()
    const docC = new Y.Doc()
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))
    Y.applyUpdate(docC, Y.encodeStateAsUpdate(docA))

    // Both joiners see peer-A already present, so neither defers — they
    // race each other, not the creator.
    ensureJoined(docB, 'peer-B')
    ensureJoined(docC, 'peer-C')

    const updateB = Y.encodeStateAsUpdate(docB)
    const updateC = Y.encodeStateAsUpdate(docC)
    Y.applyUpdate(docB, updateC)
    Y.applyUpdate(docC, updateB)

    const seqB = rawJoinSequence(docB).toArray()
    const seqC = rawJoinSequence(docC).toArray()
    expect(seqB).toEqual(seqC)
    expect(seqB[0]).toBe('peer-A')
    expect([...seqB.slice(1)].sort()).toEqual(['peer-B', 'peer-C'])
  })

  test('a peer joining after sync does not duplicate an already-synced entry', () => {
    const docA = new Y.Doc()
    const docB = new Y.Doc()

    ensureJoined(docA, 'peer-A', { isCreator: true })
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))

    // peer-B now sees peer-A already joined; peer-B joins for real, and
    // redundantly calls ensureJoined for peer-A too (e.g. a stale retry).
    ensureJoined(docB, 'peer-A')
    ensureJoined(docB, 'peer-B')

    expect(rawJoinSequence(docB).toArray()).toEqual(['peer-A', 'peer-B'])
  })
})

describe('compareAuthority / isAuthoritative', () => {
  test('earlier joiner is authoritative over a later joiner', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    ensureJoined(ydoc, 'peer-B')

    expect(compareAuthority(ydoc, 'peer-A', 'peer-B')).toBeLessThan(0)
    expect(compareAuthority(ydoc, 'peer-B', 'peer-A')).toBeGreaterThan(0)
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-B')).toBe(true)
    expect(isAuthoritative(ydoc, 'peer-B', 'peer-A')).toBe(false)
  })

  test('comparing an id against itself is 0 and not authoritative over itself', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    expect(compareAuthority(ydoc, 'peer-A', 'peer-A')).toBe(0)
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-A')).toBe(false)
  })

  test('a known peer always outranks an unrecorded one', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-ghost')).toBe(true)
    expect(isAuthoritative(ydoc, 'peer-ghost', 'peer-A')).toBe(false)
  })

  test('two unrecorded ids compare equal', () => {
    const ydoc = new Y.Doc()
    expect(compareAuthority(ydoc, 'ghost-1', 'ghost-2')).toBe(0)
  })
})

describe('resetJoinSequence', () => {
  test('clears every existing entry and leaves only the given ids, in order', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    ensureJoined(ydoc, 'peer-B')
    ensureJoined(ydoc, 'peer-C')

    resetJoinSequence(ydoc, ['peer-B'])

    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-B'])
  })

  test('accepts more than one id, in the order given', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    resetJoinSequence(ydoc, ['peer-C', 'peer-B'])
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-C', 'peer-B'])
  })

  test('works on an already-empty joinSequence', () => {
    const ydoc = new Y.Doc()
    resetJoinSequence(ydoc, ['peer-A'])
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A'])
  })

  test('the sole surviving entry is authoritative over everyone else post-reset', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A', { isCreator: true })
    ensureJoined(ydoc, 'peer-B')
    resetJoinSequence(ydoc, ['peer-B'])

    // peer-A joined the source table earlier, but is gone from this branch's
    // joinSequence entirely now — peer-B (the forking user) is authoritative.
    expect(isAuthoritative(ydoc, 'peer-B', 'peer-A')).toBe(true)
  })

  test('with several ids, earlier in the array is authoritative — inherited order intact', () => {
    const ydoc = new Y.Doc()
    resetJoinSequence(ydoc, ['peer-B', 'peer-C'])
    expect(isAuthoritative(ydoc, 'peer-B', 'peer-C')).toBe(true)
    expect(isAuthoritative(ydoc, 'peer-C', 'peer-B')).toBe(false)
  })
})
