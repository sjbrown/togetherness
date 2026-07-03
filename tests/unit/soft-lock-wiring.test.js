/**
 * tests/unit/soft-lock-wiring.test.js
 *
 * Tests for the gesture-wiring branch logic added to app.js's select(),
 * toggleSelection(), and getBoxCandidates() — the App bus methods that
 * decide whether a click/shift-click/box-select should perform a normal
 * selection change or invoke a soft-lock request (src/soft-lock.js).
 *
 * app.js's App bus is not unit-tested as a black box anywhere in this repo
 * (see canvas-select.test.js, which stubs App entirely) because it can only
 * be exercised after boot() wires up a live SVG document, Yjs doc, and
 * awareness instance. Following the same approach awareness-schema.test.js
 * uses for overlay.js's read logic, these tests mirror the exact decision
 * logic from app.js's select/toggleSelection/getBoxCandidates against real
 * y-protocols Awareness instances, so the branching can be verified without
 * booting the full app.
 *
 * The mirrored logic below must be kept in sync with app.js by hand; a
 * comment at each mirror function points back to what it mirrors.
 */

import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, beforeEach } from 'vitest'
import { isElementHeldByOther, isElementContested } from '../../src/soft-lock.js'

// ── Test harness: two independent Awareness instances sharing a states view ──
//
// Real y-protocols Awareness objects only know their own local state; to
// simulate what one client "sees" of another's broadcast state without a
// network, we merge each instance's local state into a single Map the way
// awareness.getStates() would after sync. This is enough to exercise the
// pure read-side logic under test; it does not test wire propagation
// (that's sync.integration.test.js's job).
function mergedStates(...awarenesses) {
  const map = new Map()
  for (const aw of awarenesses) {
    const local = aw.getLocalState()
    if (local) map.set(aw.clientID, local)
  }
  return map
}

describe('select() branch logic (mirrors app.js App.select)', () => {
  let aliceDoc, aliceAw, baileyDoc, baileyAw

  beforeEach(() => {
    aliceDoc  = new Y.Doc()
    aliceAw   = new awarenessProtocol.Awareness(aliceDoc)
    baileyDoc = new Y.Doc()
    baileyAw  = new awarenessProtocol.Awareness(baileyDoc)
  })

  // Mirrors: App.select(id) — the branch that decides request vs. plain select.
  // Returns { action: 'request' | 'select', reassert: boolean } describing
  // what app.js's select() would do, without performing the awareness writes.
  function decideSelect(id, myAw, otherAwarenesses) {
    if (!id) return { action: 'select', reassert: false }
    const states = mergedStates(myAw, ...otherAwarenesses)
    if (isElementHeldByOther(id, states, myAw.clientID)) {
      return { action: 'request', reassert: false }
    }
    const reassert = isElementContested(id, states)
    return { action: 'select', reassert }
  }

  test('clicking a free element selects normally, no reassertion', () => {
    const decision = decideSelect('goblin-1', baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'select', reassert: false })
  })

  test('clicking an element held by another peer requests it, does not select', () => {
    aliceAw.setLocalStateField('selection', { 'goblin-1': 0 })
    const decision = decideSelect('goblin-1', baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'request', reassert: false })
  })

  test('clicking my own held-and-uncontested element selects normally, no reassertion', () => {
    baileyAw.setLocalStateField('selection', { 'goblin-1': 0 })
    const decision = decideSelect('goblin-1', baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'select', reassert: false })
  })

  test('re-clicking my own held element while contested triggers reassertion', () => {
    baileyAw.setLocalStateField('selection', { 'goblin-1': 0 })
    aliceAw.setLocalStateField('pendingRequests', { 'goblin-1': 1000 }) // Alice acquiring
    const decision = decideSelect('goblin-1', baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'select', reassert: true })
  })

  test('deselecting (id=null) is always a plain select, never a request', () => {
    const decision = decideSelect(null, baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'select', reassert: false })
  })
})

describe('toggleSelection() branch logic (mirrors app.js App.toggleSelection)', () => {
  let aliceAw, baileyAw

  beforeEach(() => {
    aliceAw  = new awarenessProtocol.Awareness(new Y.Doc())
    baileyAw = new awarenessProtocol.Awareness(new Y.Doc())
  })

  // Mirrors: App.toggleSelection(id) — the three-way branch (deselect /
  // request / add). `mySelectedIds` stands in for the local _selectedIds Set.
  function decideToggle(id, mySelectedIds, myAw, otherAwarenesses) {
    if (mySelectedIds.has(id)) return { action: 'deselect' }
    const states = mergedStates(myAw, ...otherAwarenesses)
    if (isElementHeldByOther(id, states, myAw.clientID)) return { action: 'request' }
    return { action: 'add' }
  }

  test('shift-clicking a free, unselected element adds it', () => {
    const decision = decideToggle('goblin-1', new Set(), baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'add' })
  })

  test('shift-clicking an element I already have selected deselects (toggle-off)', () => {
    const decision = decideToggle('goblin-1', new Set(['goblin-1']), baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'deselect' })
  })

  test('shift-clicking an element held by another peer requests it, does not add', () => {
    aliceAw.setLocalStateField('selection', { 'goblin-1': 0 })
    const decision = decideToggle('goblin-1', new Set(), baileyAw, [aliceAw])
    expect(decision).toEqual({ action: 'request' })
  })

  test('shift-clicking two held elements in sequence requests both independently', () => {
    aliceAw.setLocalStateField('selection', { 'g1': 0, 'g2': 0, 'g3': 0 })
    const d1 = decideToggle('g1', new Set(), baileyAw, [aliceAw])
    const d2 = decideToggle('g2', new Set(), baileyAw, [aliceAw])
    expect(d1).toEqual({ action: 'request' })
    expect(d2).toEqual({ action: 'request' })
    // g3 untouched — Bailey never shift-clicked it.
  })
})

describe('getBoxCandidates() filtering (mirrors app.js App.getBoxCandidates)', () => {
  let aliceAw, baileyAw

  beforeEach(() => {
    aliceAw  = new awarenessProtocol.Awareness(new Y.Doc())
    baileyAw = new awarenessProtocol.Awareness(new Y.Doc())
  })

  // Mirrors: App.getBoxCandidates(rect) — the `.filter(id => !isHeldByOther)`
  // step, applied after AABB containment (containment itself is covered by
  // multiselect.test.js's boxCandidates/fullyInside tests and is not
  // soft-lock's concern).
  function filterHeldByOther(candidateIds, myAw, otherAwarenesses) {
    const states = mergedStates(myAw, ...otherAwarenesses)
    return candidateIds.filter((id) => !isElementHeldByOther(id, states, myAw.clientID))
  }

  test('box-select excludes elements held by another peer', () => {
    aliceAw.setLocalStateField('selection', { 'g2': 0 })
    const result = filterHeldByOther(['g1', 'g2', 'g3'], baileyAw, [aliceAw])
    expect(result).toEqual(['g1', 'g3'])
  })

  test('box-select includes elements I already hold myself', () => {
    baileyAw.setLocalStateField('selection', { 'g2': 0 })
    const result = filterHeldByOther(['g1', 'g2', 'g3'], baileyAw, [aliceAw])
    expect(result).toEqual(['g1', 'g2', 'g3'])
  })

  test('box-select never invokes a request — held elements are just dropped, not queued', () => {
    // No pendingRequests field should ever be relevant here; the filter
    // step has no side effect and reads no acquisition state at all.
    aliceAw.setLocalStateField('selection', { 'g1': 0 })
    const result = filterHeldByOther(['g1'], baileyAw, [aliceAw])
    expect(result).toEqual([])
    expect(baileyAw.getLocalState()?.pendingRequests).toBeUndefined()
  })

  test('box-select with nothing held returns every candidate unchanged', () => {
    const result = filterHeldByOther(['g1', 'g2'], baileyAw, [aliceAw])
    expect(result).toEqual(['g1', 'g2'])
  })
})
