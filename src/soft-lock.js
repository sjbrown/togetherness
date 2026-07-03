/**
 * soft-lock.js — pure derivation functions for the "soft lock" element
 * request protocol (advisory, whole-element granularity).
 *
 * Design context (see project discussion): Togetherness is genuinely P2P
 * with no server/authority, so this is advisory etiquette signaling, not
 * enforcement. It assumes goodwill (no cheaters/griefers). It exists to
 * reduce accidental concurrent-peer collisions ("the bathroom case") —
 * not to prevent malicious ones.
 *
 * Awareness schema addition, sibling to the existing `selection` field:
 *
 *   pendingRequests: null | { [elId: string]: number }   // elId -> ts (ms)
 *
 * Interpretation, per (clientId, elId) pair — derived structurally, never
 * stored explicitly:
 *   - retention   (holder re-asserting): elId is a key in that client's own
 *     `pendingRequests` AND appears in that client's own `elIds`.
 *   - acquisition (someone else requesting): elId is a key in that client's
 *     own `pendingRequests` but does NOT appear in that client's own `elIds`.
 *
 * All functions here are pure: given a snapshot (a Map<clientId, state>, as
 * returned by awareness.getStates()), they compute derived facts with no
 * side effects, no timers, no writes. The imperative tick/promotion logic
 * that *acts* on these facts (mutating local awareness state) lives in the
 * App layer, not here.
 */

export const REQUEST_WINDOW_MS = 3000;

/** @typedef {{ clientId: number, ts: number }} RequestEntry */

// ── Basic element-ownership queries ─────────────────────────────────────────

/**
 * The clientId currently holding `elId` in its committed `elIds` selection,
 * or null if nobody holds it. Assumes at most one holder at a time (the
 * invariant this whole protocol exists to make usually-true, not guaranteed —
 * if two clients somehow both list elId, the first one encountered wins;
 * callers should not rely on this for anything beyond advisory UI).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {number | null}
 */
export function getHolderClientId(elId, awarenessStates) {
  let holder = null;
  awarenessStates.forEach((state, clientId) => {
    if (holder !== null) return;
    if (Array.isArray(state?.elIds) && state.elIds.includes(elId)) {
      holder = clientId;
    }
  });
  return holder;
}

/**
 * True if `elId` is currently held by some client other than `myClientId`.
 * Used by gesture-wiring code (Commit 2) to decide whether a rubber-band
 * sweep should silently exclude an element, or whether a click should be
 * treated as a request instead of a plain select.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @param {number} myClientId
 * @returns {boolean}
 */
export function isElementHeldByOther(elId, awarenessStates, myClientId) {
  const holder = getHolderClientId(elId, awarenessStates);
  return holder !== null && holder !== myClientId;
}

// ── Request classification ──────────────────────────────────────────────────

/**
 * Classify every pendingRequests entry across all awareness states that
 * targets `elId`, splitting into retainers (the holder re-asserting it)
 * and acquirers (other clients requesting it).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {{ retainers: RequestEntry[], acquirers: RequestEntry[] }}
 */
export function collectRequestsForElement(elId, awarenessStates) {
  const retainers = [];
  const acquirers = [];

  awarenessStates.forEach((state, clientId) => {
    const ts = state?.pendingRequests?.[elId];
    if (typeof ts !== 'number') return;

    const isHeldByThisClient = Array.isArray(state?.elIds) && state.elIds.includes(elId);
    if (isHeldByThisClient) {
      retainers.push({ clientId, ts });
    } else {
      acquirers.push({ clientId, ts });
    }
  });

  return { retainers, acquirers };
}

/**
 * True if `elId` currently has any outstanding acquisition request — i.e.
 * should render as the contested/'requested' ring. A lone retention entry
 * with no acquirer is not itself contested (it can only exist transiently,
 * for one tick, immediately after an acquirer's own request has already
 * been cleared elsewhere).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {boolean}
 */
export function isElementContested(elId, awarenessStates) {
  const { acquirers } = collectRequestsForElement(elId, awarenessStates);
  return acquirers.length > 0;
}

/**
 * Every elId across all clients that currently has at least one outstanding
 * acquisition request. Convenience for rendering code that needs to sweep
 * "what's contested right now" rather than checking one elId at a time.
 *
 * @param {Map<number, object>} awarenessStates
 * @returns {Set<string>}
 */
export function getAllContestedElementIds(awarenessStates) {
  const contested = new Set();
  // An elId is contested iff some client's pendingRequests entry for it
  // names an elId that client does NOT hold (i.e. an acquisition, not a
  // retention).
  awarenessStates.forEach((state) => {
    if (!state?.pendingRequests) return;
    for (const elId of Object.keys(state.pendingRequests)) {
      const heldByThisClient = Array.isArray(state?.elIds) && state.elIds.includes(elId);
      if (!heldByThisClient) contested.add(elId);
    }
  });
  return contested;
}

// ── Winner resolution (tie-break rule) ──────────────────────────────────────

/**
 * Given the retainers/acquirers for one element, decide the winning
 * acquirer per the agreed tie-break rule:
 *
 *   1. Among acquirers, the earliest ts wins (first request observed);
 *      exact ts ties broken by lowest clientId, for determinism.
 *   2. If any retainer's ts is >= that winning acquirer's ts, the holder's
 *      retention rebuts it — the holder keeps the element (return null).
 *   3. If there are no acquirers at all, return null (nothing to resolve).
 *
 * This function does not consult wall-clock time or the 3s window — callers
 * decide when to invoke it, typically once
 * `isRequestWindowElapsed(winner, now)` is true for a tentative winner.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {RequestEntry | null} the winning acquirer, or null if the
 *   holder's retention defeats every acquirer (or there were none).
 */
export function resolveElementWinner(elId, awarenessStates) {
  const { retainers, acquirers } = collectRequestsForElement(elId, awarenessStates);
  if (acquirers.length === 0) return null;

  const winner = [...acquirers].sort((a, b) => a.ts - b.ts || a.clientId - b.clientId)[0];

  const rebuttedBy = retainers.some((r) => r.ts >= winner.ts);
  if (rebuttedBy) return null;

  return winner;
}

/**
 * Has this acquirer's 3s request window elapsed as of `now`?
 * Pure wrapper around REQUEST_WINDOW_MS so callers don't hardcode it.
 *
 * @param {RequestEntry} acquirer
 * @param {number} now
 * @returns {boolean}
 */
export function isRequestWindowElapsed(acquirer, now) {
  return now - acquirer.ts >= REQUEST_WINDOW_MS;
}
