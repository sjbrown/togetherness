/**
 * selection.js — pure state-transition functions for this client's own
 * selection (claims) and outstanding soft-lock acquisition bids
 * (pendingRequests).
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
 * State shape, mirrored by awareness's own selection/pendingRequests
 * fields (see soft-lock.js's file header):
 *
 *   { claims: { [elId]: number }, pendingRequests: { [elId]: number } }
 *
 * Every function here is total and side-effect-free: same inputs, same
 * output, every time. A branch that changes nothing returns the identical
 * `claims`/`pendingRequests` object it was given (not just an
 * equal-by-value copy) — app.js relies on that reference equality to
 * decide, cheaply, which side effects actually need to run.
 */

export const EMPTY_STATE = { claims: {}, pendingRequests: {} };

// ── Internal helpers ─────────────────────────────────────────────────────

function withClaims(state, claims) {
  return { claims, pendingRequests: state.pendingRequests };
}

function withPendingRequests(state, pendingRequests) {
  return { claims: state.claims, pendingRequests };
}

// ── Public transitions ───────────────────────────────────────────────────

// Advisory soft-lock request: write this client's own acquisition entry
// for `id`. Write-once — a client cannot cancel or re-issue its own
// pending request once sent, so this is a no-op if one is already
// outstanding for this id.
export function request(state, id, { now = Date.now() } = {}) {
  if (state.pendingRequests[id] != null) return state;
  return withPendingRequests(state, { ...state.pendingRequests, [id]: now });
}

// Drop every outstanding pending request except (optionally) one to keep.
// select() is exclusive (single-select): moving the committed selection to
// something else means any other outstanding bid is no longer wanted and
// must not survive to resolve later, on a tick after the selection has
// already moved on. `exceptId` lets a reclick of the SAME held-by-other id
// keep its existing request untouched (write-once, see request() above).
export function abandonPendingRequests(state, exceptId = null) {
  const keys = Object.keys(state.pendingRequests);
  if (keys.length === 0) return state;
  if (keys.length === 1 && keys[0] === exceptId) return state;
  const pendingRequests = exceptId != null && state.pendingRequests[exceptId] != null
    ? { [exceptId]: state.pendingRequests[exceptId] }
    : {};
  return withPendingRequests(state, pendingRequests);
}

// Refresh this client's claim timestamp for a single already-held elId,
// without touching the rest of the current multi-selection. No-op if `id`
// is not currently held.
export function reassertClaim(state, id, { now = Date.now() } = {}) {
  if (!(id in state.claims)) return state;
  return withClaims(state, { ...state.claims, [id]: now });
}

// Remove a single id from the committed selection. No-op if not held.
export function unclaim(state, id) {
  if (!(id in state.claims)) return state;
  const claims = { ...state.claims };
  delete claims[id];
  return withClaims(state, claims);
}

// Drop every claim this client currently holds. Leaves pendingRequests
// untouched — callers that also want to abandon outstanding bids call
// abandonPendingRequests() explicitly (select() does this; a plain
// deselect-to-empty via toggle() deliberately doesn't).
export function clearClaims(state) {
  if (Object.keys(state.claims).length === 0) return state;
  return withClaims(state, {});
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
    // Replace the whole selection with just this one id. Also handles
    // re-clicking a held-by-self element as a rebuttal gesture — it gets
    // a fresh timestamp here.
    let next = withClaims(state, { [id]: now });
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
// no-op with respect to pendingRequests.
export function toggle(state, id, { isHeldByOther, now = Date.now() } = {}) {
  if (id in state.claims) return unclaim(state, id);
  if (isHeldByOther(id)) return request(state, id, { now }); // claims untouched
  return withClaims(state, { ...state.claims, [id]: now });
}

// Replace (or, if additive, union) the committed selection with exactly
// `ids`, preserving each already-held id's existing claim timestamp and
// stamping a fresh one only for newly-added ids. Callers handle the
// 0-id/1-id cases via select(null)/select(id) instead — this is for the
// genuine N>1 case.
export function commitMultiSelect(state, ids, { now = Date.now() } = {}) {
  const claims = {};
  for (const id of ids) claims[id] = id in state.claims ? state.claims[id] : now;
  return withClaims(state, claims);
}

// Applies one soft-lock tick's resolution (soft-lock.js's
// computeTickActions() output) onto local state: promote won acquisitions,
// drop lost/rebutted bids, release elements another client has won.
export function applyTickActions(state, { elIdsToAcquire, elIdsToDropRequest, elIdsToRelease }, { now = Date.now() } = {}) {
  const claims = { ...state.claims };
  const pendingRequests = { ...state.pendingRequests };
  for (const id of elIdsToAcquire) { claims[id] = now; delete pendingRequests[id]; }
  for (const id of elIdsToDropRequest) { delete pendingRequests[id]; }
  for (const id of elIdsToRelease) { delete claims[id]; delete pendingRequests[id]; }
  return { claims, pendingRequests };
}
