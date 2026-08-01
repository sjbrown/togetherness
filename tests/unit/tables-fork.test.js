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

const { generateForkTableId, forkLiveDoc, deterministicClientId } = tablesAPI

describe('deterministicClientId', () => {
  test('the same bytes produce the same id', () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5])
    expect(deterministicClientId(bytes)).toBe(deterministicClientId(bytes))
  })

  test('different bytes produce different ids', () => {
    const a = deterministicClientId(new Uint8Array([1, 2, 3]))
    const b = deterministicClientId(new Uint8Array([1, 2, 4]))
    expect(a).not.toBe(b)
  })

  test('is a non-negative 32-bit integer, valid as a Y.Doc clientID', () => {
    const id = deterministicClientId(new Uint8Array([9, 9, 9]))
    expect(Number.isInteger(id)).toBe(true)
    expect(id).toBeGreaterThanOrEqual(0)
    expect(id).toBeLessThanOrEqual(0xffffffff)
  })

  test('setting it on two independent docs makes their next edit encode identically', () => {
    // The actual property this function exists for, isolated from
    // forkLiveDoc's own logic: without it, two fresh Y.Docs (even with
    // identical prior history) encode "the same" next edit differently,
    // because each mints its own random clientID by default.
    const src = new Y.Doc()
    src.getArray('x').push([1, 2, 3])
    const srcBytes = Y.encodeStateAsUpdate(src)

    const build = () => {
      const doc = new Y.Doc()
      Y.applyUpdate(doc, srcBytes)
      doc.clientID = deterministicClientId(srcBytes)
      doc.getArray('y').push(['same edit'])
      return Y.encodeStateAsUpdate(doc)
    }

    expect(build()).toEqual(build())
  })
})

describe('generateForkTableId', () => {
  test('matches the expected id shape', async () => {
    const ydoc = new Y.Doc()
    const id = await generateForkTableId(Y.encodeStateAsUpdate(ydoc))
    expect(id).toMatch(/^tt-T-v1-[0-9a-f]{12}$/)
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
  test('throws without orderedIds, before touching persistence at all', async () => {
    const ydoc = new Y.Doc()
    await expect(forkLiveDoc(ydoc, undefined)).rejects.toThrow(/orderedIds is required/)
    await expect(forkLiveDoc(ydoc, null)).rejects.toThrow(/orderedIds is required/)
    await expect(forkLiveDoc(ydoc, [])).rejects.toThrow(/orderedIds is required/)
  })
})

describe('resetJoinSequence ordering, reset-before-hash', () => {
  // This is the property the whole content-hash naming scheme exists for
  // (§6.5's "load-bearing, not cosmetic"): two peers independently
  // forking the identical branch — same orderedIds, computed from shared
  // branch data — must produce byte-identical fork content, and therefore
  // the identical table id, with zero coordination between them.
  test('two docs, same orderedIds, produce byte-identical Y.encodeStateAsUpdate output', async () => {
    // bobDoc is the only doc actually authored — clydeDoc is derived from
    // its real update bytes, the same way the "actual scenario" test above
    // does it. Two INDEPENDENTLY authored docs (fresh Y.Doc(), same
    // operations replayed on each) do NOT produce identical bytes even for
    // logically identical content — each Y.Doc mints its own random
    // internal clientID, and that id is baked into every encoded update.
    // Real peers never hit this: Bob and Clyde's docs converged through
    // normal Yjs sync, which is exactly what applyUpdate reproduces here.
    const bobDoc = new Y.Doc()
    bobDoc.getArray('joinSequence').push(['alice', 'bob', 'clyde'])
    const el = new Y.XmlElement('g')
    el.setAttribute('id', 'shared')
    bobDoc.getXmlFragment('toys').insert(0, [el])

    const clydeDoc = new Y.Doc()
    Y.applyUpdate(clydeDoc, Y.encodeStateAsUpdate(bobDoc))

    const orderedIds = ['bob', 'clyde'] // both compute this identically from shared branch data

    // Reach into forkLiveDoc's own logic without IndexedDB: replicate the
    // pre-persistence steps directly, since openTablePersistenceSynced
    // needs indexedDB (unavailable in jsdom — see this file's header).
    const seedForkDoc = (liveDoc) => {
      const forkDoc = new Y.Doc()
      const baseUpdate = Y.encodeStateAsUpdate(liveDoc)
      Y.applyUpdate(forkDoc, baseUpdate)
      forkDoc.clientID = deterministicClientId(baseUpdate)
      const seq = forkDoc.getArray('joinSequence')
      seq.delete(0, seq.length)
      seq.push(orderedIds)
      return forkDoc
    }

    const bobFork   = seedForkDoc(bobDoc)
    const clydeFork = seedForkDoc(clydeDoc)

    const bobBytes   = Y.encodeStateAsUpdate(bobFork)
    const clydeBytes = Y.encodeStateAsUpdate(clydeFork)
    expect(bobBytes).toEqual(clydeBytes)

    const bobId   = await generateForkTableId(bobBytes)
    const clydeId = await generateForkTableId(clydeBytes)
    expect(bobId).toBe(clydeId)
  })

  test('an opsSeed replaces the toys op log wholesale, not just adds to it', () => {
    // forkLiveDoc's own opsSeed branch, replicated directly — same
    // IndexedDB constraint as the test above.
    const sourceDoc = new Y.Doc()
    const ops = sourceDoc.getMap('ops')
    ops.set('leader-op-1', { id: 'leader-op-1', parents: [], gesture: 'checkpoint' })
    ops.set('splitter-op-1', { id: 'splitter-op-1', parents: [], gesture: 'checkpoint' })
    const baseUpdate = Y.encodeStateAsUpdate(sourceDoc)

    const forkDoc = new Y.Doc()
    Y.applyUpdate(forkDoc, baseUpdate)
    forkDoc.clientID = deterministicClientId(baseUpdate)
    expect(forkDoc.getMap('ops').size).toBe(2) // inherited everything, including the leader's op

    const opsSeed = {
      genesis: { id: 'new-genesis', parents: [], gesture: 'checkpoint' },
      rebasedOps: [{ id: 'splitter-op-1', parents: ['new-genesis'], gesture: 'move' }],
    }

    const forkOps = forkDoc.getMap('ops')
    forkDoc.transact(() => {
      forkOps.clear()
      forkOps.set(opsSeed.genesis.id, opsSeed.genesis)
      for (const op of opsSeed.rebasedOps) forkOps.set(op.id, op)
    })

    const finalIds = [...forkDoc.getMap('ops').keys()]
    expect(finalIds.sort()).toEqual(['new-genesis', 'splitter-op-1'])
    expect(finalIds).not.toContain('leader-op-1') // the leader branch's op did not survive the prune
  })

  test('two peers pruning to the same opsSeed produce byte-identical ops content', () => {
    const sourceDoc = new Y.Doc()
    sourceDoc.getMap('ops').set('leader-op-1', { id: 'leader-op-1', parents: [] })
    const baseUpdate = Y.encodeStateAsUpdate(sourceDoc)

    const opsSeed = { genesis: { id: 'g', parents: [] }, rebasedOps: [{ id: 's1', parents: ['g'] }] }

    const pruneCopy = () => {
      const doc = new Y.Doc()
      Y.applyUpdate(doc, baseUpdate)
      doc.clientID = deterministicClientId(baseUpdate)
      const opsMap = doc.getMap('ops')
      doc.transact(() => {
        opsMap.clear()
        opsMap.set(opsSeed.genesis.id, opsSeed.genesis)
        for (const op of opsSeed.rebasedOps) opsMap.set(op.id, op)
      })
      return Y.encodeStateAsUpdate(doc)
    }

    expect(pruneCopy()).toEqual(pruneCopy())
  })
})
