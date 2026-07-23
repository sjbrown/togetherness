// Authority-ordering tests for tables.js's joinSequence functions (moved
// here from a standalone authority.js — see tables.js's "Join sequence
// (authority ordering)" section). The Y.Array itself is private to
// tables.js; these tests peek at it via ydoc.getArray('joinSequence')
// directly only to assert on internal state, the way any white-box test
// would — production code never does this, only tablesAPI's exported
// functions (ensureJoined, compareAuthority, isAuthoritative,
// resetJoinSequenceToSelf), which all take a ydoc, never the raw array.

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'

const { ensureJoined, compareAuthority, isAuthoritative, resetJoinSequenceToSelf } = tablesAPI

// White-box only: production code never calls this directly.
function rawJoinSequence(ydoc) {
  return ydoc.getArray('joinSequence')
}

describe('ensureJoined', () => {
  test('appends a fresh id', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'tt-p-v1-01-aaa')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('is idempotent — calling again for the same id does not re-append', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'tt-p-v1-01-aaa')
    ensureJoined(ydoc, 'tt-p-v1-01-aaa')
    ensureJoined(ydoc, 'tt-p-v1-01-aaa')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('preserves join order across multiple distinct peers', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')
    ensureJoined(ydoc, 'peer-C')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A', 'peer-B', 'peer-C'])
  })

  test('a returning peer (reload) keeps its original position, not appended again', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')
    // Simulate peer-A reloading and re-joining.
    ensureJoined(ydoc, 'peer-A')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A', 'peer-B'])
  })
})

describe('ensureJoined — concurrent joins across two replicas', () => {
  test('two peers joining concurrently converge to the same order on both replicas', () => {
    const docA = new Y.Doc()
    const docB = new Y.Doc()

    // Neither peer has seen the other yet — both append concurrently.
    ensureJoined(docA, 'peer-A')
    ensureJoined(docB, 'peer-B')

    // Sync both directions.
    const updateA = Y.encodeStateAsUpdate(docA)
    const updateB = Y.encodeStateAsUpdate(docB)
    Y.applyUpdate(docA, updateB)
    Y.applyUpdate(docB, updateA)

    const seqA = rawJoinSequence(docA).toArray()
    const seqB = rawJoinSequence(docB).toArray()
    expect(seqA).toEqual(seqB)
    expect([...seqA].sort()).toEqual(['peer-A', 'peer-B'])
  })

  test('a peer joining after sync does not duplicate an already-synced entry', () => {
    const docA = new Y.Doc()
    const docB = new Y.Doc()

    ensureJoined(docA, 'peer-A')
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
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')

    expect(compareAuthority(ydoc, 'peer-A', 'peer-B')).toBeLessThan(0)
    expect(compareAuthority(ydoc, 'peer-B', 'peer-A')).toBeGreaterThan(0)
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-B')).toBe(true)
    expect(isAuthoritative(ydoc, 'peer-B', 'peer-A')).toBe(false)
  })

  test('comparing an id against itself is 0 and not authoritative over itself', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    expect(compareAuthority(ydoc, 'peer-A', 'peer-A')).toBe(0)
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-A')).toBe(false)
  })

  test('a known peer always outranks an unrecorded one', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    expect(isAuthoritative(ydoc, 'peer-A', 'peer-ghost')).toBe(true)
    expect(isAuthoritative(ydoc, 'peer-ghost', 'peer-A')).toBe(false)
  })

  test('two unrecorded ids compare equal', () => {
    const ydoc = new Y.Doc()
    expect(compareAuthority(ydoc, 'ghost-1', 'ghost-2')).toBe(0)
  })
})

describe('resetJoinSequenceToSelf', () => {
  test('clears every existing entry and leaves only soleId', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')
    ensureJoined(ydoc, 'peer-C')

    resetJoinSequenceToSelf(ydoc, 'peer-B')

    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-B'])
  })

  test('works on an already-empty joinSequence', () => {
    const ydoc = new Y.Doc()
    resetJoinSequenceToSelf(ydoc, 'peer-A')
    expect(rawJoinSequence(ydoc).toArray()).toEqual(['peer-A'])
  })

  test('the sole surviving entry is authoritative over everyone else post-reset', () => {
    const ydoc = new Y.Doc()
    ensureJoined(ydoc, 'peer-A')
    ensureJoined(ydoc, 'peer-B')
    resetJoinSequenceToSelf(ydoc, 'peer-B')

    // peer-A joined the source table earlier, but is gone from this branch's
    // joinSequence entirely now — peer-B (the forking user) is authoritative.
    expect(isAuthoritative(ydoc, 'peer-B', 'peer-A')).toBe(true)
  })
})
