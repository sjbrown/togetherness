/**
 * selection.js — pure state-transition functions for this client's own
 * selection intent: which elements it wants, and its relationship to each
 * (already holding it, or bidding to acquire it).
 *
 * Every function takes a state and returns a new one. None touch the
 * DOM, Yjs, or Awareness, and none know what an element actually is.
 *
 * State shape -- a `desired` map for negotiated claims and bids, plus
 * one locally-owned mode slot:
 *
 *   {
 *     desired: { [elId]: { ts: number, holding: boolean } },
 *     activeMode: { id: string, mode: string } | null,
 *   }
 *
 * Exactly one record per elId: an id is either held or bidding, never
 * both, since there's only one slot for it to occupy.
 *
 * activeMode is a second selection-gated slot, never negotiated with
 * other clients -- active only while its id is the sole held selection.
 * Mode strings (sel-move, sel-resize, ...) are opaque here, never
 * parsed or judged, always carrying their own `sel-` prefix already.
 *
 * Invariant: activeMode is null iff shape(state) isn't 'single'. A
 * fresh single selection is seeded with its own default mode
 * immediately, never left null waiting for a click.
 *
 * Every function is total and side-effect-free. A no-op branch returns
 * the identical state (or sub-value) it was given, so callers can diff
 * by reference alone.
 */

export const EMPTY_STATE = { desired: {}, activeMode: null };

// ── Internal helpers ─────────────────────────────────────────────────────

function withDesired(state, desired) {
  return { desired, activeMode: state.activeMode };
}

function heldIds(state) {
  return Object.keys(state.desired).filter((id) => state.desired[id].holding);
}

function biddingIds(state) {
  return Object.keys(state.desired).filter((id) => state.desired[id].holding === false);
}

// ── Selection shape ──────────────────────────────────────────────────────

// The cardinality of the committed selection.
export function shape(state) {
  const n = heldIds(state).length;
  return n === 0 ? 'empty' : n === 1 ? 'single' : 'multi';
}

// The single held id, or null if the selection is empty or a multi-select.
export function soleHeldId(state) {
  const ids = heldIds(state);
  return ids.length === 1 ? ids[0] : null;
}

// ── Public transitions ───────────────────────────────────────────────────

// Advisory soft-lock request for `id`. Write-once: a no-op if `id`
// already has any entry, bid or claim.
export function request(state, id, { now = Date.now() } = {}) {
  if (state.desired[id] != null) return state;
  return withDesired(state, { ...state.desired, [id]: { ts: now, holding: false } });
}

// Drops every outstanding bid except (optionally) one to keep; claims
// are untouched. `exceptId` preserves a reclick's existing bid for the
// same id (write-once).
export function abandonPendingRequests(state, exceptId = null) {
  const bidding = biddingIds(state);
  if (bidding.length === 0) return state;
  if (bidding.length === 1 && bidding[0] === exceptId) return state;
  const desired = { ...state.desired };
  for (const id of bidding) {
    if (id !== exceptId) delete desired[id];
  }
  return withDesired(state, desired);
}

// Refresh this client's claim timestamp for a single already-held elId,
// without touching the rest of the current multi-selection. No-op if `id`
// is not currently held.
export function reassertClaim(state, id, { now = Date.now() } = {}) {
  if (!state.desired[id]?.holding) return state;
  return withDesired(state, { ...state.desired, [id]: { ts: now, holding: true } });
}

// Remove a single id from the committed selection. No-op if not held
// (including if it's merely a bid — unclaiming isn't how a bid is dropped).
export function unclaim(state, id) {
  if (!state.desired[id]?.holding) return state;
  const desired = { ...state.desired };
  delete desired[id];
  return withDesired(state, desired);
}

// Drops every claim; leaves bids untouched. Callers that also want
// those gone call abandonPendingRequests() explicitly.
export function clearClaims(state) {
  const held = heldIds(state);
  if (held.length === 0) return state;
  const desired = { ...state.desired };
  for (const id of held) delete desired[id];
  return withDesired(state, desired);
}

// Exclusive single-select: replaces the whole selection with just `id`
// (or clears it if falsy). `isHeldByOther` is supplied since
// holder-ship isn't part of this module's own state.
export function select(state, id, { isHeldByOther, now = Date.now() } = {}) {
  if (id && isHeldByOther(id)) {
    // A held-by-other click is a request: clear the current selection,
    // abandon any stale bid for a different id, keep one already
    // outstanding for this id (write-once).
    let next = clearClaims(state);
    next = abandonPendingRequests(next, id);
    next = request(next, id, { now });
    return next;
  }
  if (id) {
    // Replace the whole selection with just this id, dropping every
    // other claim and bid. A reclick refreshes the timestamp; a stale
    // bid on this id is simply overwritten.
    let next = clearClaims(state);
    next = withDesired(next, { ...next.desired, [id]: { ts: now, holding: true } });
    next = abandonPendingRequests(next);
    return next;
  }
  return abandonPendingRequests(clearClaims(state));
}

// Toggle a single id in/out of the selection. N=0: deselect. N=1:
// single-select. N>1: multi-select.
//
// A held-by-other shift-click queues a request alongside whatever else
// is held. A held-by-self shift-click is a plain deselect.
export function toggle(state, id, { isHeldByOther, now = Date.now() } = {}) {
  if (state.desired[id]?.holding) return unclaim(state, id);
  if (isHeldByOther(id)) return request(state, id, { now }); // claims untouched
  return withDesired(state, { ...state.desired, [id]: { ts: now, holding: true } });
}

// Replaces the selection with exactly `ids`, keeping each held id's
// existing timestamp and stamping fresh ones for new ids. Any bid
// outside the set is dropped. For the genuine N>1 case only.
export function commitMultiSelect(state, ids, { now = Date.now() } = {}) {
  const desired = {};
  for (const id of ids) {
    const existing = state.desired[id];
    desired[id] = { ts: existing?.holding ? existing.ts : now, holding: true };
  }
  return withDesired(state, desired);
}

// Applies one tick's resolution onto local state: promote won
// acquisitions, drop lost bids, release elements another client won.
export function applyTickActions(state, { elIdsToAcquire, elIdsToDropRequest, elIdsToRelease }, { now = Date.now() } = {}) {
  const desired = { ...state.desired };
  for (const id of elIdsToAcquire) desired[id] = { ts: now, holding: true };
  for (const id of elIdsToDropRequest) delete desired[id];
  for (const id of elIdsToRelease) delete desired[id];
  return withDesired(state, desired);
}

// ── Selection-gated mode ─────────────────────────────────────────────────

// Enters `mode` for `id`, valid only while `id` is the sole held
// selection. `mode` is trusted as already vetted by the caller. No-op
// if the precondition fails or nothing would change.
export function enterMode(state, id, mode) {
  if (mode == null || !state.desired[id]?.holding || shape(state) !== 'single') return state;
  if (state.activeMode?.id === id && state.activeMode.mode === mode) return state;
  return { desired: state.desired, activeMode: { id, mode } };
}

// Restores the invariant after a transition changes the held set: null
// when not 'single', seeded to defaultMode when freshly or newly
// single, otherwise left alone.
//
// If defaultMode is null, activeMode stays null rather than becoming a
// malformed entry with a null mode.
//
// Call once, on a transition's FINAL result -- not on an intermediate
// state inside a composite transition, or a same-id reselect could be
// wrongly reseeded.
export function reconcileMode(state, defaultMode) {
  const soleId = soleHeldId(state);
  if (soleId && state.activeMode?.id === soleId) return state;
  if (!soleId || defaultMode == null) return state.activeMode ? { desired: state.desired, activeMode: null } : state;
  return { desired: state.desired, activeMode: { id: soleId, mode: defaultMode } };
}
