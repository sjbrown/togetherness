import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import {
  ensureJoined, compareAuthority, isAuthoritative, resetJoinSequenceToSelf,
} from '../../src/authority.js'

function makeJoinSeq() {
  const ydoc = new Y.Doc()
  return { ydoc, yJoinSequence: ydoc.getArray('joinSequence') }
}

describe('ensureJoined', () => {
  test('appends a fresh id', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'tt-p-v1-01-aaa')
    expect(yJoinSequence.toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('is idempotent — calling again for the same id does not re-append', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'tt-p-v1-01-aaa')
    ensureJoined(ydoc, yJoinSequence, 'tt-p-v1-01-aaa')
    ensureJoined(ydoc, yJoinSequence, 'tt-p-v1-01-aaa')
    expect(yJoinSequence.toArray()).toEqual(['tt-p-v1-01-aaa'])
  })

  test('preserves join order across multiple distinct peers', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    ensureJoined(ydoc, yJoinSequence, 'peer-B')
    ensureJoined(ydoc, yJoinSequence, 'peer-C')
    expect(yJoinSequence.toArray()).toEqual(['peer-A', 'peer-B', 'peer-C'])
  })

  test('a returning peer (reload) keeps its original position, not appended again', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    ensureJoined(ydoc, yJoinSequence, 'peer-B')
    // Simulate peer-A reloading and re-joining.
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    expect(yJoinSequence.toArray()).toEqual(['peer-A', 'peer-B'])
  })
})

describe('ensureJoined — concurrent joins across two replicas', () => {
  test('two peers joining concurrently converge to the same order on both replicas', () => {
    const { ydoc: docA, yJoinSequence: seqA } = makeJoinSeq()
    const docB = new Y.Doc()
    const seqB = docB.getArray('joinSequence')

    // Neither peer has seen the other yet — both append concurrently.
    ensureJoined(docA, seqA, 'peer-A')
    ensureJoined(docB, seqB, 'peer-B')

    // Sync both directions.
    const updateA = Y.encodeStateAsUpdate(docA)
    const updateB = Y.encodeStateAsUpdate(docB)
    Y.applyUpdate(docA, updateB)
    Y.applyUpdate(docB, updateA)

    expect(seqA.toArray()).toEqual(seqB.toArray())
    expect(seqA.toArray().sort()).toEqual(['peer-A', 'peer-B'])
  })

  test('a peer joining after sync does not duplicate an already-synced entry', () => {
    const { ydoc: docA, yJoinSequence: seqA } = makeJoinSeq()
    const docB = new Y.Doc()
    const seqB = docB.getArray('joinSequence')

    ensureJoined(docA, seqA, 'peer-A')
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))

    // peer-B now sees peer-A already joined; peer-B joins for real, and
    // redundantly calls ensureJoined for peer-A too (e.g. a stale retry).
    ensureJoined(docB, seqB, 'peer-A')
    ensureJoined(docB, seqB, 'peer-B')

    expect(seqB.toArray()).toEqual(['peer-A', 'peer-B'])
  })
})

describe('compareAuthority / isAuthoritative', () => {
  test('earlier joiner is authoritative over a later joiner', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    ensureJoined(ydoc, yJoinSequence, 'peer-B')

    expect(compareAuthority(yJoinSequence, 'peer-A', 'peer-B')).toBeLessThan(0)
    expect(compareAuthority(yJoinSequence, 'peer-B', 'peer-A')).toBeGreaterThan(0)
    expect(isAuthoritative(yJoinSequence, 'peer-A', 'peer-B')).toBe(true)
    expect(isAuthoritative(yJoinSequence, 'peer-B', 'peer-A')).toBe(false)
  })

  test('comparing an id against itself is 0 and not authoritative over itself', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    expect(compareAuthority(yJoinSequence, 'peer-A', 'peer-A')).toBe(0)
    expect(isAuthoritative(yJoinSequence, 'peer-A', 'peer-A')).toBe(false)
  })

  test('a known peer always outranks an unrecorded one', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    expect(isAuthoritative(yJoinSequence, 'peer-A', 'peer-ghost')).toBe(true)
    expect(isAuthoritative(yJoinSequence, 'peer-ghost', 'peer-A')).toBe(false)
  })

  test('two unrecorded ids compare equal', () => {
    const { yJoinSequence } = makeJoinSeq()
    expect(compareAuthority(yJoinSequence, 'ghost-1', 'ghost-2')).toBe(0)
  })
})

describe('resetJoinSequenceToSelf', () => {
  test('clears every existing entry and leaves only soleId', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    ensureJoined(ydoc, yJoinSequence, 'peer-B')
    ensureJoined(ydoc, yJoinSequence, 'peer-C')

    resetJoinSequenceToSelf(ydoc, yJoinSequence, 'peer-B')

    expect(yJoinSequence.toArray()).toEqual(['peer-B'])
  })

  test('works on an already-empty joinSequence', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    resetJoinSequenceToSelf(ydoc, yJoinSequence, 'peer-A')
    expect(yJoinSequence.toArray()).toEqual(['peer-A'])
  })

  test('the sole surviving entry is authoritative over everyone else post-reset', () => {
    const { ydoc, yJoinSequence } = makeJoinSeq()
    ensureJoined(ydoc, yJoinSequence, 'peer-A')
    ensureJoined(ydoc, yJoinSequence, 'peer-B')
    resetJoinSequenceToSelf(ydoc, yJoinSequence, 'peer-B')

    // peer-A joined the source table earlier, but is gone from this branch's
    // joinSequence entirely now — peer-B (the forking user) is authoritative.
    expect(isAuthoritative(yJoinSequence, 'peer-B', 'peer-A')).toBe(true)
  })
})
