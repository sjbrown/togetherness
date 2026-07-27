// Tests for tables.js's live-doc forking (TODO #11, branch escalation).
//
// Scoped deliberately: generateForkTableId is pure (no IndexedDB at all)
// and fully tested here. forkLiveDoc's own validation (throws without a
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
    const id = await generateForkTableId(ydoc)
    expect(id).toMatch(/^tt-F-v1-[0-9a-f]{12}$/)
  })

  test('is deterministic — the same doc hashed twice gives the same id', async () => {
    const ydoc = new Y.Doc()
    ydoc.getXmlFragment('toys').insert(0, [new Y.XmlElement('g')])
    const id1 = await generateForkTableId(ydoc)
    const id2 = await generateForkTableId(ydoc)
    expect(id1).toBe(id2)
  })

  test('two peers with genuinely different content get different ids', async () => {
    const ydocA = new Y.Doc()
    ydocA.getXmlFragment('toys').insert(0, [new Y.XmlElement('g')])
    const ydocB = new Y.Doc()
    ydocB.getXmlFragment('toys').insert(0, [new Y.XmlElement('circle')])

    const idA = await generateForkTableId(ydocA)
    const idB = await generateForkTableId(ydocB)
    expect(idA).not.toBe(idB)
  })

  test('the actual scenario: two peers who fully synced with EACH OTHER (but diverged from a third) converge on the identical id, with no coordination', async () => {
    // Mirrors concurrency_branching.md's "Making inserts idempotent"
    // scenario: Bob and Clyde stayed synced with each other through a
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

    const bobId   = await generateForkTableId(bobDoc)
    const clydeId = await generateForkTableId(clydeDoc)
    expect(bobId).toBe(clydeId)
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
