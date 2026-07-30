// Tests for tables.js's live-doc forking
//
// Scoped deliberately: generateForkTableId is pure (no IndexedDB at all,
// takes update bytes directly rather than a live doc — see its own doc
// comment for why that's a correctness fix, not a style choice) and fully
// tested here. forkLiveDoc's own validation (throws without a
// forkingUserId) is tested too, since that check runs before anything
// touches persistence. forkLiveDoc's actual end-to-end behavior — does it
// really write a working table via openTablePersistenceSynced — is NOT
// tested here: jsdom (this project's test environment) has no indexedDB
// at all (typeof indexedDB === 'undefined'), and fake-indexeddb is a
// dependency this project has already, deliberately, not taken on (see
// forkTable, which has the identical gap and always has). That path stays
// verified only by Playwright e2e, the same as forkTable's own.

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { tablesAPI } from '../../src/tables.js'

const { generateForkTableId, forkLiveDoc } = tablesAPI

describe('generateForkTableId', () => {
  test('matches the expected id shape', async () => {
    const ydoc = new Y.Doc()
    const id = await generateForkTableId(Y.encodeStateAsUpdate(ydoc))
    expect(id).toMatch(/^tt-F-v1-[0-9a-f]{12}$/)
  })

  test('is deterministic — the same bytes hashed twice give the same id', async () => {
    const ydoc = new Y.Doc()
    ydoc.getXmlFragment('toys').insert(0, [new Y.XmlElement('g')])
    const update = Y.encodeStateAsUpdate(ydoc)
    const id1 = await generateForkTableId(update)
    const id2 = await generateForkTableId(update)
    expect(id1).toBe(id2)
  })

  test('two peers with genuinely different content get different ids', async () => {
    const ydocA = new Y.Doc()
    ydocA.getXmlFragment('toys').insert(0, [new Y.XmlElement('g')])
    const ydocB = new Y.Doc()
    ydocB.getXmlFragment('toys').insert(0, [new Y.XmlElement('circle')])

    const idA = await generateForkTableId(Y.encodeStateAsUpdate(ydocA))
    const idB = await generateForkTableId(Y.encodeStateAsUpdate(ydocB))
    expect(idA).not.toBe(idB)
  })

  test('the actual scenario: two peers who fully synced with EACH OTHER (but diverged from a third) converge on the identical id, with no coordination', async () => {
    // Mirrors the "Making inserts idempotent" scenario discussed in
    // CONCURRENCY_AND_BRANCHING.md: Bob and Clyde stayed synced with each other through a
    // partition that excluded Alice. By the time either forks, their
    // divergent state is content-identical — verified this converges to
    // identical BYTES (not just equivalent content) before ever writing
    // this function; see the empirical check this was built from.
    const bobDoc = new Y.Doc()
    const bobToys = bobDoc.getXmlFragment('toys')
    for (let i = 0; i < 5; i++) {
      const el = new Y.XmlElement('g')
      el.setAttribute('id', 'bob-' + i)
      bobDoc.transact(() => { bobToys.insert(bobToys.length, [el]) })
    }

    // Clyde starts from Bob's state (they'd already synced with each
    // other before the partition began) and makes no further changes of
    // his own — same effective content, arrived at independently.
    const clydeDoc = new Y.Doc()
    Y.applyUpdate(clydeDoc, Y.encodeStateAsUpdate(bobDoc))

    const bobId   = await generateForkTableId(Y.encodeStateAsUpdate(bobDoc))
    const clydeId = await generateForkTableId(Y.encodeStateAsUpdate(clydeDoc))
    expect(bobId).toBe(clydeId)
  })

  test('takes bytes directly, not a live doc — so a caller captures exactly one snapshot no matter what happens to the doc afterward', async () => {
    // The actual bug this signature prevents: if this took a ydoc and
    // encoded internally, the id computed here could silently diverge
    // from bytes a caller encodes separately after this resolves (its
    // only await), since anything could mutate the doc in that gap. Bytes
    // in means there's only ever one snapshot in play, by construction.
    const ydoc = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    yToys.insert(0, [new Y.XmlElement('g')])
    const capturedUpdate = Y.encodeStateAsUpdate(ydoc)

    const idPromise = generateForkTableId(capturedUpdate) // await pending...
    yToys.insert(1, [new Y.XmlElement('circle')]) // ...doc mutates in the gap...
    const id = await idPromise

    // ...but the id still reflects the ORIGINAL captured bytes, not
    // whatever the doc looks like now.
    const idFromOriginalBytesAgain = await generateForkTableId(capturedUpdate)
    expect(id).toBe(idFromOriginalBytesAgain)
  })
})

describe('forkLiveDoc — validation (no IndexedDB reached)', () => {
  test('throws without a forkingUserId, before touching persistence at all', async () => {
    const ydoc = new Y.Doc()
    await expect(forkLiveDoc(ydoc, undefined)).rejects.toThrow(/forkingUserId is required/)
    await expect(forkLiveDoc(ydoc, null)).rejects.toThrow(/forkingUserId is required/)
    await expect(forkLiveDoc(ydoc, '')).rejects.toThrow(/forkingUserId is required/)
  })
})
