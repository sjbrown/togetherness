/**
 * tests/unit/awareness-schema.test.js
 *
 * Tests for the awareness selection schema migration:
 *   { elId: string } → { elIds: string[] }
 *
 * These are pure unit tests against y-protocols/awareness directly —
 * no WebSocket server, no WebRTC, no DOM. They verify:
 *   - the schema shape App.select() must write
 *   - the schema shape overlay.js syncFromAwareness() must read
 *
 * They do NOT test cross-client propagation (that's sync.integration.test.js).
 */

import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect } from 'vitest'

// ── Schema shape (what app.js writes) ────────────────────────────────────────

describe('awareness selection schema — write side', () => {
  test('single-element selection uses elIds array, not elId string', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', { elIds: ['toy-abc'] })

    const state = aw.getLocalState()
    expect(state.selection.elIds).toEqual(['toy-abc'])
    expect(state.selection.elId).toBeUndefined()

    doc.destroy()
  })

  test('multi-element selection carries all ids', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)
    const ids = ['toy-aaa', 'toy-bbb', 'toy-ccc']

    aw.setLocalStateField('selection', { elIds: ids })

    expect(aw.getLocalState().selection.elIds).toEqual(ids)

    doc.destroy()
  })

  test('null clears selection', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', { elIds: ['toy-abc'] })
    aw.setLocalStateField('selection', null)

    expect(aw.getLocalState().selection).toBeNull()

    doc.destroy()
  })

  test('empty elIds array is a valid cleared-candidate state', () => {
    const doc = new Y.Doc()
    const aw  = new awarenessProtocol.Awareness(doc)

    aw.setLocalStateField('selection', { elIds: [] })

    const state = aw.getLocalState()
    expect(state.selection.elIds).toEqual([])

    doc.destroy()
  })
})

// ── Schema shape (what overlay.js syncFromAwareness reads) ────────────────────

describe('awareness selection schema — read side (overlay syncFromAwareness logic)', () => {
  // Mirrors the exact read logic in overlay.js syncFromAwareness so we can
  // assert on it without booting the full app.
  function extractRemoteSelections(state) {
    if (!Array.isArray(state?.selection?.elIds) || !state.selection.elIds.length) return []
    return state.selection.elIds
  }

  test('single remote selection: one id returned', () => {
    const state = { selection: { elIds: ['shape-xyz'] }, color: '#f00' }
    expect(extractRemoteSelections(state)).toEqual(['shape-xyz'])
  })

  test('multi remote selection: all ids returned', () => {
    const state = { selection: { elIds: ['a', 'b', 'c'] }, color: '#0f0' }
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

  test('old elId schema (guard): not mistakenly read as elIds', () => {
    // If old-schema state somehow arrives, extractRemoteSelections must not
    // return it — Array.isArray(undefined) is false, so it's safely ignored.
    const state = { selection: { elId: 'shape-old' }, color: '#888' }
    expect(extractRemoteSelections(state)).toEqual([])
  })

  test('empty elIds: no rings rendered', () => {
    const state = { selection: { elIds: [] }, color: '#888' }
    expect(extractRemoteSelections(state)).toEqual([])
  })
})
