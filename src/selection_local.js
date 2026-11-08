/**
 * selection_local.js — this client's own selection intent, live.
 *
 * Holds the { desired, activeMode } state that selection.js transforms,
 * applies each transition to it, and broadcasts the result over awareness
 * as `desired` and `mode`. What a changed selection means to the rest of
 * the app is the caller's, through the hooks given to init().
 *
 * desired: { [elId]: { ts: number, holding: boolean } }
 *   holding:true  — in my committed selection (ts = last claimed)
 *   holding:false — a bid to acquire an element someone else holds
 *                   (ts = when the bid started)
 *
 * activeMode: { id, mode } | null — the selection-gated mode for the sole
 *   held id. Null iff the held set isn't a single element. Broadcast via
 *   the awareness `mode` field verbatim.
 */

import * as Selection from './selection.js';

let _state          = Selection.EMPTY_STATE;
let _awareness      = null;
let _defaultModeFor = () => null;
let _onHeldChanged  = () => {};
let _onModeChanged  = () => {};

/**
 * defaultModeFor(id)            — the mode a fresh sole selection of id starts in
 * onHeldChanged(held, prevHeld) — the held-id SET changed; held is a Set,
 *                                 prevHeld the previous ids as an array
 * onModeChanged()               — only activeMode changed
 * Both hooks run before the change is broadcast.
 */
export function init({ awareness, defaultModeFor, onHeldChanged, onModeChanged }) {
  _state          = Selection.EMPTY_STATE;
  _awareness      = awareness;
  _defaultModeFor = defaultModeFor;
  _onHeldChanged  = onHeldChanged;
  _onModeChanged  = onModeChanged;
}

export const state      = () => _state;
export const activeMode = () => _state.activeMode;
export const soleHeldId = () => Selection.soleHeldId(_state);
export const isHeld     = (id) => _state.desired[id]?.holding === true;

// The elIds I currently hold (a snapshot array, not a live view).
export function heldIds() {
  return Object.keys(_state.desired).filter((id) => _state.desired[id].holding);
}

// The awareness fields this module owns, for a full setLocalState.
export function awarenessFields() {
  return { desired: { ..._state.desired }, mode: _state.activeMode ? _state.activeMode.mode : null };
}

function sameIdSet(a, b) {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

function broadcastDesired() {
  _awareness.setLocalStateField('desired', { ..._state.desired });
}

function broadcastMode() {
  _awareness.setLocalStateField('mode', _state.activeMode ? _state.activeMode.mode : null);
}

// Makes a selection.js transition's result the current state.
export function apply(rawNext) {
  const soleId = Selection.soleHeldId(rawNext);
  // Reconcile runs first, unconditionally, so no caller has to remember
  // that a mode can be invalidated by a changed held set.
  const next = Selection.reconcileMode(rawNext, soleId ? _defaultModeFor(soleId) : null);
  const desiredChanged = next.desired !== _state.desired;
  const modeChanged = next.activeMode !== _state.activeMode;
  if (!desiredChanged && !modeChanged) return;

  const prevHeld = heldIds();
  _state = next;
  const held = heldIds();

  // a held-set change re-renders and re-broadcasts both fields,
  // a mode-only change re-renders and re-broadcasts the mode,
  // a bid-only or timestamp-only change just broadcasts.
  if (desiredChanged && !sameIdSet(prevHeld, held)) {
    _onHeldChanged(new Set(held), prevHeld);
    broadcastDesired();
    broadcastMode();
  } else if (modeChanged) {
    _onModeChanged();
    broadcastMode();
  } else {
    broadcastDesired();
  }
}

// Remove specific elIds from the committed selection.
export function unclaim(ids) {
  let next = _state;
  for (const id of ids) next = Selection.unclaim(next, id);
  apply(next);
}

// Clear the committed selection entirely.
export function clearClaims() {
  apply(Selection.clearClaims(_state));
}

// Refresh the claim timestamp on each already-held id in `ids`.
export function reassertClaims(ids, { now = Date.now() } = {}) {
  let next = _state;
  for (const id of ids) next = Selection.reassertClaim(next, id, { now });
  apply(next);
}
