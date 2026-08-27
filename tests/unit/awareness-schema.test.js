/**
 * tests/unit/awareness-schema.test.js
 *
 * Tests for the awareness desired schema:
 *   { [elId]: { ts: number, holding: boolean } }
 *
 * One record per elId a client wants: holding:true is a committed claim
 * (ts = last claimed), holding:false is an outstanding bid (ts = when it
 * started). Membership and holding-vs-bidding are both read off this map.
 *
 * app.js's own convention is to always write a plain object -- `{}`
 * when nothing is desired, never null. Reads still tolerate a null or
 * missing value, since a foreign or older client may send either.
 *
 * These tests verify the shape that App.select() must write and the shape
 * that overlay.js syncFromAwareness() must read.
 *
 * They do NOT test cross-client propagation (that's sync.integration.test.js).
 */

import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect } from 'vitest'

// ── Schema shape (what app.js writes) ────────────────────────────────────────

describe('awareness desired schema — write side', () => {
  test('single-element selection uses a flat {elId: {ts, holding}} map, not an elIds array', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', { 'toy-abc': { ts: 12345, holding: true } })

    const state = aw.getLocalState()
    expect(state.desired).toEqual({ 'toy-abc': { ts: 12345, holding: true } })
    expect(state.desired.elIds).toBeUndefined()
    expect(state.desired.elId).toBeUndefined()
    expect(Object.keys(state.desired)).toEqual(['toy-abc'])

    doc.destroy()
  })

  test('multi-element selection carries a claim timestamp per id', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)
    const claims = {
      'toy-aaa': { ts: 1000, holding: true },
      'toy-bbb': { ts: 2000, holding: true },
      'toy-ccc': { ts: 3000, holding: true },
    }

    aw.setLocalStateField('desired', claims)

    expect(aw.getLocalState().desired).toEqual(claims)
    expect(Object.keys(aw.getLocalState().desired)).toEqual(['toy-aaa', 'toy-bbb', 'toy-ccc'])

    doc.destroy()
  })

  test('a bid (holding:false) is distinguishable from a claim on the same shape', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', { 'toy-abc': { ts: 500, holding: false } })

    expect(aw.getLocalState().desired['toy-abc'].holding).toBe(false)

    doc.destroy()
  })

  test('the underlying field can still be explicitly nulled (a library capability app.js no longer uses)', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', { 'toy-abc': { ts: 500, holding: true } })
    aw.setLocalStateField('desired', null)

    expect(aw.getLocalState().desired).toBeNull()

    doc.destroy()
  })

  test('an empty object is the canonical cleared-desired state app.js broadcasts', () => {
    // App.js always broadcasts {} rather than null when nothing is
    // desired — "desired = {}" reads as "I desire the empty set."
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', {})

    expect(Object.keys(aw.getLocalState().desired)).toEqual([])

    doc.destroy()
  })
})

// ── Schema shape (what overlay.js syncFromAwareness reads) ────────────────────

describe('awareness desired schema — read side (overlay syncFromAwareness logic)', () => {
  // Mirrors the exact read logic in overlay.js syncFromAwareness so we can
  // assert on it without booting the full app: only holding:true entries
  // render as a remote selection ring.
  function extractRemoteSelections(state) {
    if (!state?.desired || typeof state.desired !== 'object') return []
    return Object.keys(state.desired).filter((elId) => state.desired[elId].holding)
  }

  test('single remote selection: one id returned', () => {
    const state = { desired: { 'shape-xyz': { ts: 1000, holding: true } }, color: '#f00' }
    expect(extractRemoteSelections(state)).toEqual(['shape-xyz'])
  })

  test('multi remote selection: all ids returned', () => {
    const state = {
      desired: {
        a: { ts: 1, holding: true },
        b: { ts: 2, holding: true },
        c: { ts: 3, holding: true },
      },
      color: '#0f0',
    }
    expect(extractRemoteSelections(state)).toEqual(['a', 'b', 'c'])
  })

  // This client's own writes are never null (see the write-side describe
  // block above), but a foreign/older peer's could still be — the reader
  // must tolerate it regardless of what we ourselves send.
  test('null desired: no ids returned', () => {
    const state = { desired: null, color: '#00f' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('missing desired field: no ids returned', () => {
    const state = { color: '#00f' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('empty desired object: no rings rendered', () => {
    const state = { desired: {}, color: '#888' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('a bid (holding:false) is not read as a selection ring', () => {
    // Bids render via the separate contested/'requested' ring instead
    // (getAllContestedElementIds in soft-lock.js), not as a selection ring.
    const state = { desired: { 'shape-xyz': { ts: 1000, holding: false } }, color: '#f00' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('a mix of held and bidding entries returns only the held ones', () => {
    const state = {
      desired: {
        'shape-held':   { ts: 1000, holding: true },
        'shape-bid':    { ts: 2000, holding: false },
      },
      color: '#f00',
    }
    expect(extractRemoteSelections(state)).toEqual(['shape-held'])
  })
})

// ── Candidates field — structurally separate from desired ────────────────────

describe('awareness schema: candidates field is separate from desired', () => {
  test('a client can have both desired and candidates simultaneously', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    // Committed holdings in desired...
    aw.setLocalStateField('desired', { 'toy-held': { ts: 12345, holding: true } })
    // ...and a concurrent rubber-band sweep in candidates.
    aw.setLocalStateField('candidates', ['toy-a', 'toy-b'])

    const state = aw.getLocalState()
    expect(Object.keys(state.desired)).toEqual(['toy-held'])
    expect(state.candidates).toEqual(['toy-a', 'toy-b'])
    // The two fields are independent — candidates never affected desired.
    expect(state.desired['toy-a']).toBeUndefined()

    doc.destroy()
  })

  test('clearing candidates does not touch desired', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', { 'toy-held': { ts: 12345, holding: true } })
    aw.setLocalStateField('candidates', ['toy-a', 'toy-b'])
    aw.setLocalStateField('candidates', null)

    const state = aw.getLocalState()
    expect(state.candidates).toBeNull()
    expect(Object.keys(state.desired)).toEqual(['toy-held'])

    doc.destroy()
  })

  test('the old design would have wiped selection when candidates were cleared — documents the bug being fixed', () => {
    // Under the old broadcastCandidates, ids were stamped into `selection`
    // with Date.now() timestamps, then clearBoxCandidates set `selection`
    // to null. This test shows what that looked like, and why it was wrong:
    // a committed holding was silently wiped by an unrelated sweep-clear.
    // The field is called `desired` now, but the historical bug and its
    // fix (candidates gets its own field) are unchanged.
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('desired', { 'toy-held': { ts: 12345, holding: true } }) // committed
    aw.setLocalStateField('desired', { // old broadcastCandidates
      'toy-a': { ts: Date.now(), holding: true },
      'toy-b': { ts: Date.now(), holding: true },
    })
    // At this point, 'toy-held' is gone from the broadcast — the commitment
    // was silently erased by the sweep. Any concurrent request on 'toy-held'
    // would have resolved with no holder during the sweep.

    aw.setLocalStateField('desired', null) // old clearBoxCandidates
    expect(aw.getLocalState().desired).toBeNull()
    // 'toy-held' is permanently lost from the broadcast even though the user
    // never deselected it. The fix: candidates gets its own field.

    doc.destroy()
  })
})
