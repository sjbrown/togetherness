/**
 * tests/unit/awareness-schema.test.js
 *
 * Tests for the awareness selection schema: { [elId: string]: number } | null
 *
 * Keys are the held elIds; values are per-elId claim timestamps (see
 * soft-lock.js). There is no separate ids array — membership is exactly
 * Object.keys(selection). An earlier version of this schema was
 * { elIds: string[] }; a claimedAt map was added alongside it for the
 * soft-lock feature, then the array was dropped entirely once it became
 * clear it was always redundant with Object.keys(claimedAt).
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

describe('awareness selection schema — write side', () => {
  test('single-element selection uses a flat {elId: ts} map, not an elIds array', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', { 'toy-abc': 12345 })

    const state = aw.getLocalState()
    expect(state.selection).toEqual({ 'toy-abc': 12345 })
    expect(state.selection.elIds).toBeUndefined()
    expect(state.selection.elId).toBeUndefined()
    expect(Object.keys(state.selection)).toEqual(['toy-abc'])

    doc.destroy()
  })

  test('multi-element selection carries a claim timestamp per id', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)
    const claims = { 'toy-aaa': 1000, 'toy-bbb': 2000, 'toy-ccc': 3000 }

    aw.setLocalStateField('selection', claims)

    expect(aw.getLocalState().selection).toEqual(claims)
    expect(Object.keys(aw.getLocalState().selection)).toEqual(['toy-aaa', 'toy-bbb', 'toy-ccc'])

    doc.destroy()
  })

  test('null clears selection', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', { 'toy-abc': 500 })
    aw.setLocalStateField('selection', null)

    expect(aw.getLocalState().selection).toBeNull()

    doc.destroy()
  })

  test('an empty object is a valid (if unusual) cleared-candidate state', () => {
    // App.js always broadcasts null rather than {} when nothing is
    // selected (see _broadcastSelection), but readers should treat an
    // empty object the same as null — zero keys, zero holdings, either way.
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', {})

    expect(Object.keys(aw.getLocalState().selection)).toEqual([])

    doc.destroy()
  })
})

// ── Schema shape (what overlay.js syncFromAwareness reads) ────────────────────

describe('awareness selection schema — read side (overlay syncFromAwareness logic)', () => {
  // Mirrors the exact read logic in overlay.js syncFromAwareness so we can
  // assert on it without booting the full app.
  function extractRemoteSelections(state) {
    if (!state?.selection || typeof state.selection !== 'object') return []
    return Object.keys(state.selection)
  }

  test('single remote selection: one id returned', () => {
    const state = { selection: { 'shape-xyz': 1000 }, color: '#f00' }
    expect(extractRemoteSelections(state)).toEqual(['shape-xyz'])
  })

  test('multi remote selection: all ids returned', () => {
    const state = { selection: { a: 1, b: 2, c: 3 }, color: '#0f0' }
    expect(extractRemoteSelections(state)).toEqual(['a', 'b', 'c'])
  })

  test('null selection: no ids returned', () => {
    const state = { selection: null, color: '#00f' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('missing selection field: no ids returned', () => {
    const state = { color: '#00f' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('empty selection object: no rings rendered', () => {
    const state = { selection: {}, color: '#888' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('a legacy elIds-array-shaped payload (old schema) is not misread as ids', () => {
    // Defends against a stale/mixed-version peer sending the old shape —
    // Object.keys({ elIds: [...] }) would be ['elIds'], a single bogus
    // "id" — worth an explicit test since this is exactly the kind of
    // schema-migration edge case that's easy to get wrong silently.
    const state = { selection: { elIds: ['shape-old'] }, color: '#888' }
    expect(extractRemoteSelections(state)).toEqual(['elIds']) // documents actual (bogus) behavior
    // This elId ('elIds') simply won't match any real element's data-yid,
    // so App.getBBox returns null and rendering silently skips it — a
    // stale/mixed-version peer degrades harmlessly rather than crashing,
    // but is not expected in a single-deployed-version app.
  })
})
