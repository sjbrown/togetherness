/**
 * tests/unit/selection.test.js
 *
 * Tests for the pure local selection-intent state transitions in
 * src/selection.js. No DOM, no Yjs, no Awareness, no App — plain state in,
 * plain state out. The App-integration equivalents (real App.select, real
 * DOM, real awareness) live in soft-lock.integration.test.js; this file is
 * where the state-transition *logic itself* should be pinned down, the
 * same split soft-lock.js/soft-lock.test.js already use for the
 * cross-client resolution half of the protocol.
 */

import { describe, test, expect } from 'vitest'
import {
  EMPTY_STATE,
  request,
  abandonPendingRequests,
  reassertClaim,
  unclaim,
  clearClaims,
  select,
  toggle,
  commitMultiSelect,
  applyTickActions,
  shape,
  soleHeldId,
  enterMode,
  reconcileMode,
} from '../../src/selection.js'

const notHeld = () => false
const heldBy = (heldId) => (id) => id === heldId

// Shorthand for a state whose `desired` map is built from a plain
// { id: ts, ... } shape, all holding:true. No mode active unless a
// test adds one afterward.
function stateWith(heldMap, activeMode = null) {
  const desired = {}
  for (const [id, ts] of Object.entries(heldMap)) desired[id] = { ts, holding: true }
  return { desired, activeMode }
}

describe('request()', () => {
  test('adds a fresh bidding entry', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    expect(s1).toEqual({ desired: { 'die-1': { ts: 100, holding: false } }, activeMode: null })
  })

  test('write-once: a second request for the same id is a no-op (timestamp untouched)', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    const s2 = request(s1, 'die-1', { now: 999 })
    expect(s2).toBe(s1) // same reference: nothing changed
    expect(s2.desired['die-1']).toEqual({ ts: 100, holding: false })
  })

  test('a second request for a different id coexists with the first', () => {
    const s1 = request(EMPTY_STATE, 'die-1', { now: 100 })
    const s2 = request(s1, 'die-2', { now: 200 })
    expect(s2.desired).toEqual({
      'die-1': { ts: 100, holding: false },
      'die-2': { ts: 200, holding: false },
    })
  })

  test('a no-op if id is already held (shouldn\'t normally be called this way)', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(request(s0, 'die-1', { now: 999 })).toBe(s0)
  })
})

describe('abandonPendingRequests()', () => {
  test('drops every bid when no id is excepted, leaving claims untouched', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true }, 'die-2': { ts: 100, holding: false } }, activeMode: null }
    expect(abandonPendingRequests(s0)).toEqual({ desired: { 'die-1': { ts: 1, holding: true } }, activeMode: null })
  })

  test('keeps only the excepted bid', () => {
    const s0 = { desired: { 'die-1': { ts: 100, holding: false }, 'die-2': { ts: 200, holding: false } }, activeMode: null }
    expect(abandonPendingRequests(s0, 'die-2')).toEqual({ desired: { 'die-2': { ts: 200, holding: false } }, activeMode: null })
  })

  test('no-ops (same reference) when there are no bids', () => {
    expect(abandonPendingRequests(EMPTY_STATE)).toBe(EMPTY_STATE)
    expect(abandonPendingRequests(stateWith({ 'die-1': 1 }))).toEqual(stateWith({ 'die-1': 1 }))
  })

  test('no-ops (same reference) when the only bid is already the excepted one', () => {
    const s0 = { desired: { 'die-1': { ts: 100, holding: false } }, activeMode: null }
    expect(abandonPendingRequests(s0, 'die-1')).toBe(s0)
  })
})

describe('reassertClaim()', () => {
  test('refreshes an already-held id\'s timestamp', () => {
    const s0 = stateWith({ 'die-1': 100 })
    const s1 = reassertClaim(s0, 'die-1', { now: 500 })
    expect(s1.desired['die-1']).toEqual({ ts: 500, holding: true })
  })

  test('no-ops (same reference) for an id not currently held', () => {
    const s0 = stateWith({ 'die-1': 100 })
    expect(reassertClaim(s0, 'die-2', { now: 500 })).toBe(s0)
  })

  test('no-ops (same reference) for an id that is only a bid, not held', () => {
    const s0 = { desired: { 'die-1': { ts: 100, holding: false } }, activeMode: null }
    expect(reassertClaim(s0, 'die-1', { now: 500 })).toBe(s0)
  })
})

describe('unclaim() / clearClaims()', () => {
  test('unclaim drops a single held id, leaving the rest', () => {
    const s0 = stateWith({ 'die-1': 1, 'die-2': 2 })
    expect(unclaim(s0, 'die-1').desired).toEqual({ 'die-2': { ts: 2, holding: true } })
  })

  test('unclaim no-ops (same reference) for an id not held', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(unclaim(s0, 'die-2')).toBe(s0)
  })

  test('unclaim no-ops (same reference) for an id that is only a bid', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: false } }, activeMode: null }
    expect(unclaim(s0, 'die-1')).toBe(s0)
  })

  test('clearClaims drops every claim, leaves bids untouched', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true }, 'die-2': { ts: 2, holding: true }, 'die-3': { ts: 3, holding: false } }, activeMode: null }
    expect(clearClaims(s0)).toEqual({ desired: { 'die-3': { ts: 3, holding: false } }, activeMode: null })
  })

  test('clearClaims no-ops (same reference) when there are no claims', () => {
    expect(clearClaims(EMPTY_STATE)).toBe(EMPTY_STATE)
  })
})

describe('select()', () => {
  test('selecting a free id replaces the whole selection with just that id', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = select(s0, 'die-2', { isHeldByOther: notHeld, now: 100 })
    expect(s1).toEqual({ desired: { 'die-2': { ts: 100, holding: true } }, activeMode: null })
  })

  test('selecting null deselects everything', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(select(s0, null, { isHeldByOther: notHeld })).toEqual(EMPTY_STATE)
  })

  test('selecting a held-by-other id clears the current selection and queues a request instead of claiming', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = select(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 100 })
    expect(s1).toEqual({ desired: { 'die-2': { ts: 100, holding: false } }, activeMode: null })
  })

  test('reclicking the SAME held-by-other id does not refresh its request timestamp (write-once)', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, 'die-1', { isHeldByOther: heldBy('die-1'), now: 999 })
    expect(s1.desired['die-1']).toEqual({ ts: 100, holding: false })
  })

  // The reported bug: client requests a held toy, then before that
  // request resolves, clicks a different, unheld toy. The stale request
  // must not survive to be silently promoted by a later tick.
  test('switching to a different unheld id abandons a stale pending request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    expect(s0.desired).toEqual({ 'die-1': { ts: 100, holding: false } }) // sanity: bid is outstanding

    const s1 = select(s0, 'die-2', { isHeldByOther: notHeld, now: 200 })
    expect(s1).toEqual({ desired: { 'die-2': { ts: 200, holding: true } }, activeMode: null })
  })

  // Same regression, different trigger: switching to a DIFFERENT
  // held-by-other id while a request for the first one is still pending.
  test('switching to a different held-by-other id abandons the earlier request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 200 })
    expect(s1).toEqual({ desired: { 'die-2': { ts: 200, holding: false } }, activeMode: null })
  })

  test('deselecting (id=null) also abandons any outstanding request', () => {
    const s0 = select(EMPTY_STATE, 'die-1', { isHeldByOther: heldBy('die-1'), now: 100 })
    const s1 = select(s0, null, { isHeldByOther: notHeld })
    expect(s1).toEqual(EMPTY_STATE)
  })

  // select() itself never touches .activeMode -- an intermediate reseed
  // mid-transition would wrongly reset a same-id reselect's mode.
  // Reseeding happens once, on the final result.
  test('re-selecting the SAME sole id leaves an active mode untouched, once reconciled', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    // A different defaultMode is passed on purpose -- it must be ignored,
    // since die-1 is still the id being tracked.
    const s1 = reconcileMode(select(s0, 'die-1', { isHeldByOther: notHeld, now: 500 }), 'sel-move')
    expect(s1.activeMode).toEqual({ id: 'die-1', mode: 'sel-resize' })
    expect(s1.desired['die-1'].ts).toBe(500) // still refreshed
  })

  test('selecting a DIFFERENT id reseeds the active mode to the new id\'s default, once reconciled', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    const s1 = reconcileMode(select(s0, 'die-2', { isHeldByOther: notHeld, now: 500 }), 'sel-move')
    expect(s1.activeMode).toEqual({ id: 'die-2', mode: 'sel-move' })
  })
})

describe('toggle()', () => {
  test('adds a free id to the selection, alongside whatever is already held', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = toggle(s0, 'die-2', { isHeldByOther: notHeld, now: 100 })
    expect(s1.desired).toEqual({
      'die-1': { ts: 1, holding: true },
      'die-2': { ts: 100, holding: true },
    })
  })

  test('removes an already-held id (plain deselect toggle)', () => {
    const s0 = stateWith({ 'die-1': 1, 'die-2': 2 })
    const s1 = toggle(s0, 'die-1', { isHeldByOther: notHeld })
    expect(s1.desired).toEqual({ 'die-2': { ts: 2, holding: true } })
  })

  test('shift-clicking a held-by-other id queues a request alongside the existing selection, untouched', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = toggle(s0, 'die-2', { isHeldByOther: heldBy('die-2'), now: 100 })
    expect(s1.desired).toEqual({
      'die-1': { ts: 1, holding: true },
      'die-2': { ts: 100, holding: false },
    })
  })

  test('deselecting a held-by-self id is a no-op with respect to other bids', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true }, 'die-2': { ts: 2, holding: false } }, activeMode: null }
    const s1 = toggle(s0, 'die-1', { isHeldByOther: notHeld })
    expect(s1.desired['die-2']).toEqual({ ts: 2, holding: false })
  })
})

describe('commitMultiSelect()', () => {
  test('claims every id fresh when none were previously held', () => {
    const s1 = commitMultiSelect(EMPTY_STATE, ['die-1', 'die-2'], { now: 100 })
    expect(s1.desired).toEqual({
      'die-1': { ts: 100, holding: true },
      'die-2': { ts: 100, holding: true },
    })
  })

  test('preserves existing claim timestamps for already-held ids', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = commitMultiSelect(s0, ['die-1', 'die-2'], { now: 100 })
    expect(s1.desired).toEqual({
      'die-1': { ts: 1, holding: true },
      'die-2': { ts: 100, holding: true },
    })
  })

  test('drops ids no longer included (non-additive replace)', () => {
    const s0 = stateWith({ 'die-1': 1, 'die-2': 2 })
    const s1 = commitMultiSelect(s0, ['die-2', 'die-3'], { now: 100 })
    expect(s1.desired).toEqual({
      'die-2': { ts: 2, holding: true },
      'die-3': { ts: 100, holding: true },
    })
  })

  test('drops a stale bid for an id outside the new set', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true }, 'die-9': { ts: 9, holding: false } }, activeMode: null }
    const s1 = commitMultiSelect(s0, ['die-1', 'die-2'], { now: 100 })
    expect(s1.desired).toEqual({
      'die-1': { ts: 1, holding: true },
      'die-2': { ts: 100, holding: true },
    })
  })
})

describe('applyTickActions()', () => {
  test('promotes an acquired id into claims and clears its bid', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: false } }, activeMode: null }
    const s1 = applyTickActions(s0, { elIdsToAcquire: ['die-1'], elIdsToDropRequest: [], elIdsToRelease: [] }, { now: 500 })
    expect(s1).toEqual({ desired: { 'die-1': { ts: 500, holding: true } }, activeMode: null })
  })

  test('drops a lost/rebutted request without touching claims', () => {
    const s0 = { desired: { 'die-2': { ts: 2, holding: true }, 'die-1': { ts: 1, holding: false } }, activeMode: null }
    const s1 = applyTickActions(s0, { elIdsToAcquire: [], elIdsToDropRequest: ['die-1'], elIdsToRelease: [] }, { now: 500 })
    expect(s1).toEqual({ desired: { 'die-2': { ts: 2, holding: true } }, activeMode: null })
  })

  test('releases a held id', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: null }
    const s1 = applyTickActions(s0, { elIdsToAcquire: [], elIdsToDropRequest: [], elIdsToRelease: ['die-1'] }, { now: 500 })
    expect(s1).toEqual({ desired: {}, activeMode: null })
  })
})

describe('shape() / soleHeldId()', () => {
  test('empty when nothing is held', () => {
    expect(shape(EMPTY_STATE)).toBe('empty')
    expect(soleHeldId(EMPTY_STATE)).toBeNull()
  })

  test('single when exactly one id is held', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(shape(s0)).toBe('single')
    expect(soleHeldId(s0)).toBe('die-1')
  })

  test('multi when more than one id is held', () => {
    const s0 = stateWith({ 'die-1': 1, 'die-2': 2 })
    expect(shape(s0)).toBe('multi')
    expect(soleHeldId(s0)).toBeNull()
  })

  test('a bid alone does not count toward shape', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: false } }, activeMode: null }
    expect(shape(s0)).toBe('empty')
  })
})

describe('enterMode()', () => {
  test('enters a mode for the sole held id', () => {
    const s0 = stateWith({ 'die-1': 1 })
    const s1 = enterMode(s0, 'die-1', 'sel-resize')
    expect(s1.activeMode).toEqual({ id: 'die-1', mode: 'sel-resize' })
  })

  test('no-op (same reference) when the id is not held at all', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(enterMode(s0, 'die-2', 'sel-resize')).toBe(s0)
  })

  test('no-op (same reference) when the id is only a bid, not held', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: false } }, activeMode: null }
    expect(enterMode(s0, 'die-1', 'sel-resize')).toBe(s0)
  })

  test('no-op (same reference) when the selection is multi, even for a held id in it', () => {
    const s0 = stateWith({ 'die-1': 1, 'die-2': 2 })
    expect(enterMode(s0, 'die-1', 'sel-resize')).toBe(s0)
  })

  test('no-op (same reference) when mode is null', () => {
    const s0 = stateWith({ 'die-1': 1 })
    expect(enterMode(s0, 'die-1', null)).toBe(s0)
  })

  test('no-op (same reference) re-entering the identical id+mode already active', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    expect(enterMode(s0, 'die-1', 'sel-resize')).toBe(s0)
  })

  test('entering a different mode for the same id replaces the active mode', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    const s1 = enterMode(s0, 'die-1', 'sel-rummage')
    expect(s1.activeMode).toEqual({ id: 'die-1', mode: 'sel-rummage' })
  })

  test('can enter the default mode explicitly, same as any other mode string', () => {
    // enterMode doesn't distinguish "the default" from any other mode --
    // that's just a mode string like any other from this function's POV.
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    const s1 = enterMode(s0, 'die-1', 'sel-move')
    expect(s1.activeMode).toEqual({ id: 'die-1', mode: 'sel-move' })
  })
})

describe('reconcileMode()', () => {
  // Invariant under test throughout this block: activeMode is null iff
  // shape isn't 'single'.

  test('no-ops (same reference) on an empty state', () => {
    expect(reconcileMode(EMPTY_STATE, 'sel-move')).toBe(EMPTY_STATE)
  })

  test('no-ops (same reference) when already tracking the sole held id, regardless of defaultMode', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    // A different defaultMode is passed here on purpose: an id already
    // being tracked is never second-guessed back toward the default.
    expect(reconcileMode(s0, 'sel-move')).toBe(s0)
  })

  test('seeds activeMode to defaultMode for a fresh single selection', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: null }
    const s1 = reconcileMode(s0, 'sel-move')
    expect(s1.activeMode).toEqual({ id: 'die-1', mode: 'sel-move' })
  })

  test('reseeds activeMode with the new defaultMode when the sole id changed', () => {
    const s0 = { desired: { 'die-2': { ts: 2, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    const s1 = reconcileMode(s0, 'sel-action')
    expect(s1.activeMode).toEqual({ id: 'die-2', mode: 'sel-action' })
  })

  // Regression: a layer with no modes of its own must leave activeMode
  // null rather than seeding a malformed { id, mode: null } entry,
  // which would wipe out the plain ring already drawn for it.
  test('leaves activeMode null for a fresh single selection when defaultMode is null', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true } }, activeMode: null }
    expect(reconcileMode(s0, null)).toBe(s0)
  })

  test('drops a stale tracked mode down to null if reseeding is needed but defaultMode is null', () => {
    const s0 = { desired: { 'die-2': { ts: 2, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    expect(reconcileMode(s0, null).activeMode).toBeNull()
  })

  test('clears the mode when nothing is held anymore', () => {
    const s0 = { desired: {}, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    expect(reconcileMode(s0, 'sel-move').activeMode).toBeNull()
  })

  test('clears the mode when its id is now only a bid', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: false } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    expect(reconcileMode(s0, 'sel-move').activeMode).toBeNull()
  })

  test('clears the mode when the selection grew to multi', () => {
    const s0 = { desired: { 'die-1': { ts: 1, holding: true }, 'die-2': { ts: 2, holding: true } }, activeMode: { id: 'die-1', mode: 'sel-resize' } }
    expect(reconcileMode(s0, 'sel-move').activeMode).toBeNull()
  })
})
