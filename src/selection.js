/**
 * selection.js — pure state-transition functions for this client's own
 * selection intent: which elements it wants, and its relationship to each
 * (already holding it, or bidding to acquire it).
 *
 * Sibling to soft-lock.js: soft-lock.js derives facts from OTHER clients'
 * awareness broadcasts (who holds what, who's contesting what, who should
 * win a tick's resolution); this module decides how THIS client's own
 * local state changes in response to a gesture (select, toggle, request,
 * or applying a tick's resolution). Neither module touches the DOM, Yjs,
 * or Awareness — app.js applies the state these functions return and
 * drives every side effect (Overlay rendering, awareness broadcast,
 * resize-mode/action-affordance bookkeeping) from the diff between old
 * and new state.
 *
 * State shape, mirrored by awareness's own `desired` field (see
 * soft-lock.js's file header):
 *
 *   { desired: { [elId]: { ts: number, holding: boolean } } }
 *
 * There is exactly one record per elId this client wants, not two parallel
 * maps that have to be kept disjoint by convention — an id is either
 * present-and-holding or present-and-bidding, never both, because there is
 * only one slot for it. This is what fixed the bug that prompted this
 * design: a stale bid for an abandoned id used to be able to outlive the
 * selection moving on to something else, because "what I hold" and "what
 * I'm bidding on" were two independently-mutated maps and nothing forced
 * them to agree. Now every function below returns a single map, so
 * "abandon everything except what's in the new desired set" is just
 * "build the new map without copying old entries forward" — impossible to
 * forget at a call site the way clearing a second map was.
 *
 * Every function here is total and side-effect-free: same inputs, same
 * output, every time. A branch that changes nothing returns the identical
 * `desired` object it was given (not just an equal-by-value copy) — app.js
 * relies on that reference equality to decide, cheaply, whether anything
 * needs to be broadcast at all.
 */

export const EMPTY_STATE = { desired: {} };

// ── Internal helpers ─────────────────────────────────────────────────────

function withDesired(state, desired) {
  return { desired };
}

function heldIds(state) {
  return Object.keys(state.desired).filter((id) => state.desired[id].holding);
}

function biddingIds(state) {
  return Object.keys(state.desired).filter((id) => state.desired[id].holding === false);
}

// ── Public transitions ───────────────────────────────────────────────────

// Advisory soft-lock request: write this client's own acquisition entry
// for `id`. Write-once — a client cannot cancel or re-issue its own
// pending request once sent, so this is a no-op if `id` already has any
// entry at all (whether that's an existing bid, or — shouldn't normally
// happen, since callers only request ids they don't hold — a claim).
export function request(state, id, { now = Date.now() } = {}) {
  if (state.desired[id] != null) return state;
  return withDesired(state, { ...state.desired, [id]: { ts: now, holding: false } });
}

// Drop every outstanding bid (holding:false entry) except (optionally) one
// to keep, leaving actual claims (holding:true) untouched. select() is
// exclusive (single-select): moving the committed selection to something
// else means any other outstanding bid is no longer wanted and must not
// survive to resolve later, on a tick after the selection has already
// moved on. `exceptId` lets a reclick of the SAME held-by-other id keep
// its existing bid untouched (write-once, see request() above).
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

// Drop every claim this client currently holds. Leaves outstanding bids
// untouched — callers that also want to abandon those call
// abandonPendingRequests() explicitly (select() does this; a plain
// deselect-to-empty via toggle() deliberately doesn't).
export function clearClaims(state) {
  const held = heldIds(state);
  if (held.length === 0) return state;
  const desired = { ...state.desired };
  for (const id of held) delete desired[id];
  return withDesired(state, desired);
}

// Exclusive single-select: replace the whole committed selection with just
// `id` (or clear it, if `id` is falsy). `isHeldByOther(id)` is supplied by
// the caller, since holder-ship is a fact about OTHER clients' live
// awareness state, not part of this module's own pure state.
export function select(state, id, { isHeldByOther, now = Date.now() } = {}) {
  if (id && isHeldByOther(id)) {
    // Plain click on a held-by-other element is a request. Shift wasn't
    // held, so any selection currently held is cleared, and any stale bid
    // for a DIFFERENT id is abandoned — but not one already outstanding
    // for this same id (write-once; see request()).
    let next = clearClaims(state);
    next = abandonPendingRequests(next, id);
    next = request(next, id, { now });
    return next;
  }
  if (id) {
    // Replace the whole selection with just this one id, dropping every
    // other claim AND every other bid. Also handles re-clicking a
    // held-by-self element as a rebuttal gesture (fresh timestamp here),
    // and claiming an id that happened to have a stale bid of its own
    // (the new holding:true entry below simply overwrites it).
    let next = clearClaims(state);
    next = withDesired(next, { ...next.desired, [id]: { ts: now, holding: true } });
    next = abandonPendingRequests(next);
    return next;
  }
  return abandonPendingRequests(clearClaims(state));
}

// Toggle a single id in/out of the current selection.
// If the result is N===0: deselect. N===1: single-select. N>1: multi-select.
//
// Shift-clicking a held-by-other element queues a request for it,
// independent of and alongside whatever else is already held or pending.
// Shift-clicking a held-by-self element is a plain deselect toggle, and a
// no-op with respect to other bids.
export function toggle(state, id, { isHeldByOther, now = Date.now() } = {}) {
  if (state.desired[id]?.holding) return unclaim(state, id);
  if (isHeldByOther(id)) return request(state, id, { now }); // claims untouched
  return withDesired(state, { ...state.desired, [id]: { ts: now, holding: true } });
}

// Replace (or, if additive, union) the committed selection with exactly
// `ids`, preserving each already-held id's existing claim timestamp and
// stamping a fresh one only for newly-added ids. Any bid for an id outside
// the new set — or for an id now inside it, since box-select candidates
// are never held-by-other (see getBoxCandidates) — is dropped, since it
// only ever fell out of `desired` above by not being carried forward.
// Callers handle the 0-id/1-id cases via select(null)/select(id) instead
// — this is for the genuine N>1 case.
export function commitMultiSelect(state, ids, { now = Date.now() } = {}) {
  const desired = {};
  for (const id of ids) {
    const existing = state.desired[id];
    desired[id] = { ts: existing?.holding ? existing.ts : now, holding: true };
  }
  return withDesired(state, desired);
}

// Applies one soft-lock tick's resolution (soft-lock.js's
// computeTickActions() output) onto local state: promote won acquisitions,
// drop lost/rebutted bids, release elements another client has won.
export function applyTickActions(state, { elIdsToAcquire, elIdsToDropRequest, elIdsToRelease }, { now = Date.now() } = {}) {
  const desired = { ...state.desired };
  for (const id of elIdsToAcquire) desired[id] = { ts: now, holding: true };
  for (const id of elIdsToDropRequest) delete desired[id];
  for (const id of elIdsToRelease) delete desired[id];
  return withDesired(state, desired);
}
