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
 * Awareness schema:
 *
 *   selection: { [elId: string]: number } | null
 *   pendingRequests: { [elId]: number } | null
 *
 * `selection[elId]` is this client's own timestamp for "when did I most
 * recently claim elId" — set whenever elId enters this client's own
 * selection (initial select, a tick's promotion, or a deliberate re-click
 * of an already-held element, which naturally refreshes it — no separate
 * "reassert" bookkeeping needed). Membership (which elIds I hold) and claim
 * recency (since when) are the same piece of data now, not two — an
 * earlier design carried a separate `elIds` array alongside `claimedAt`,
 * but the array was always redundant with Object.keys(claimedAt), so it
 * was dropped. This also removes the redundancy's failure mode: nothing
 * can hold a stale elId in one field while the other has already moved on.
 *
 * `pendingRequests[elId]` exists ONLY while a client is actively trying to
 * acquire an elId it does not yet hold — deleted the moment that bid is
 * resolved, win or lose. It is never a retention signal, and deliberately
 * has the same {elId: number} shape as `selection` for consistency.
 *
 * All functions here are pure: given a snapshot (a Map<clientId, state>, as
 * returned by awareness.getStates()), they compute derived facts with no
 * side effects, no timers, no writes. The imperative tick/promotion logic
 * that *acts* on these facts lives in the App layer, not here.
 */

export const REQUEST_WINDOW_MS = 3000;

/** @typedef {{ clientId: number, ts: number }} RequestEntry */

// ── Basic element-ownership queries ─────────────────────────────────────────

/**
 * The clientId currently holding `elId` in its committed `selection`, or
 * null if nobody holds it. Assumes at most one holder at a time (the
 * invariant this whole protocol exists to make usually-true, not guaranteed
 * — if two clients somehow both list elId, the first one encountered wins
 * — callers needing to detect that specific case should use
 * getOtherHoldersOf instead).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {number | null}
 */
export function getHolderClientId(elId, awarenessStates) {
  let holder = null;
  awarenessStates.forEach((state, clientId) => {
    if (holder !== null) return;
    if (state?.selection && elId in state.selection) {
      holder = clientId;
    }
  });
  return holder;
}

/**
 * True if `elId` is currently held by some client other than `myClientId`.
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

/**
 * Every clientId (excluding myClientId) whose own committed selection
 * currently contains elId. Unlike getHolderClientId (which assumes at most
 * one true holder and returns the first one found), this deliberately does
 * NOT assume single-holder — it's used specifically to detect the case
 * where that invariant has (temporarily or buggily) broken and more than
 * one client currently believes it holds the same element.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @param {number} myClientId
 * @returns {number[]}
 */
export function getOtherHoldersOf(elId, awarenessStates, myClientId) {
  const others = [];
  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    if (state?.selection && elId in state.selection) {
      others.push(clientId);
    }
  });
  return others;
}

/**
 * `clientId`'s own claim timestamp for elId — how recently they last
 * claimed it in their own selection. 0 if they don't currently hold it, or
 * hold it but never stamped a claim (shouldn't happen for a real holder,
 * treated safely as "no claim" rather than throwing).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @param {number} clientId
 * @returns {number}
 */
export function getClaimTimestamp(elId, awarenessStates, clientId) {
  return awarenessStates.get(clientId)?.selection?.[elId] ?? 0;
}

// ── Request queries ──────────────────────────────────────────────────────────

/**
 * Every outstanding acquisition bid for elId, across all clients.
 * pendingRequests entries are always acquisition bids by construction — see
 * file header — so no held-by-same-client disambiguation is needed here.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {RequestEntry[]}
 */
export function getAcquirersOf(elId, awarenessStates) {
  const acquirers = [];
  awarenessStates.forEach((state, clientId) => {
    const ts = state?.pendingRequests?.[elId];
    if (typeof ts === 'number') acquirers.push({ clientId, ts });
  });
  return acquirers;
}

/**
 * True if `elId` currently has any outstanding acquisition request — i.e.
 * should render as the contested/'requested' ring.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {boolean}
 */
export function isElementContested(elId, awarenessStates) {
  return getAcquirersOf(elId, awarenessStates).length > 0;
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
  awarenessStates.forEach((state) => {
    if (!state?.pendingRequests) return;
    for (const elId of Object.keys(state.pendingRequests)) {
      contested.add(elId);
    }
  });
  return contested;
}

// ── Winner resolution ────────────────────────────────────────────────────────

/**
 * Decide the winning acquirer for elId, if any:
 *
 *   1. Among outstanding acquirers, the earliest request ts wins; exact ts
 *      ties broken by lowest clientId, for determinism.
 *   2. If elId currently has a holder, and that holder's OWN claim
 *      timestamp (selection[elId] — refreshed by a deliberate
 *      re-click, i.e. the "bathroom" defense gesture) is at least as recent
 *      as the winning acquirer's request, the holder's claim rebuts it.
 *   3. If there are no acquirers at all, return null.
 *
 * Does not consult wall-clock time or the 3s window — callers decide when
 * to invoke it, typically once isRequestWindowElapsed(winner, now) is true.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {RequestEntry | null}
 */
export function resolveElementWinner(elId, awarenessStates) {
  const acquirers = getAcquirersOf(elId, awarenessStates);
  if (acquirers.length === 0) return null;

  const winner = [...acquirers].sort((a, b) => a.ts - b.ts || a.clientId - b.clientId)[0];

  const holderId = getHolderClientId(elId, awarenessStates);
  if (holderId !== null) {
    const holderClaimTs = getClaimTimestamp(elId, awarenessStates, holderId);
    if (holderClaimTs >= winner.ts) return null;
  }

  return winner;
}

/**
 * Has this acquirer's 3s request window elapsed as of `now`?
 *
 * @param {RequestEntry} acquirer
 * @param {number} now
 * @returns {boolean}
 */
export function isRequestWindowElapsed(acquirer, now) {
  return now - acquirer.ts >= REQUEST_WINDOW_MS;
}

// ── Tick state machine ───────────────────────────────────────────────────────

/**
 * Pure decision function for one client's periodic soft-lock tick. Given a
 * full awareness snapshot (including this client's own broadcast state)
 * and the current time, decides what this client's own state should
 * become. Performs no writes; the caller (App's tick loop) applies the
 * returned diff to local state and re-broadcasts.
 *
 *   - Acquirer side: for each of my own pendingRequests entries whose
 *     window has elapsed, if I'm the resolved winner I should acquire it;
 *     otherwise (rebutted, or lost a tie-break to another acquirer) I
 *     should drop my own request for it.
 *   - Holder side: for each elId I currently hold —
 *       (a) if resolution finds a winning acquirer whose window has
 *           elapsed, release it (the common case);
 *       (b) otherwise, as a fallback: if some OTHER client's own selection
 *           also currently contains this elId (a durable conflict, which
 *           can arise even when (a) finds no acquirer — a successful
 *           acquirer's own pendingRequests entry is deleted immediately
 *           upon promotion, so by the time my tick runs there may be
 *           nothing left in pendingRequests to resolve against), compare
 *           claim timestamps directly via selection[elId]: whoever
 *           claimed it more recently keeps it. A client that never
 *           explicitly (re-)claimed it has no entry, treated as 0, and
 *           always loses to a client with an actual claim. Genuine ties
 *           (including 0-vs-0 — e.g. two clients simultaneously
 *           plain-selecting a previously free element) fall back to a
 *           deterministic clientId comparison.
 *
 * @param {{ myClientId: number, awarenessStates: Map<number, object>, now: number }} args
 * @returns {{
 *   elIdsToAcquire: string[],
 *   elIdsToDropRequest: string[],
 *   elIdsToRelease: string[],
 * }}
 */
export function computeTickActions({ myClientId, awarenessStates, now }) {
  const myState = awarenessStates.get(myClientId) ?? {};
  const mySelectedIds = new Set(Object.keys(myState.selection ?? {}));
  const myPendingRequests = myState.pendingRequests ?? {};

  const elIdsToAcquire = [];
  const elIdsToDropRequest = [];
  const elIdsToRelease = [];

  // Acquirer side.
  for (const [elId, ts] of Object.entries(myPendingRequests)) {
    if (!isRequestWindowElapsed({ ts }, now)) continue;
    const winner = resolveElementWinner(elId, awarenessStates);
    if (winner && winner.clientId === myClientId) {
      elIdsToAcquire.push(elId);
    } else {
      elIdsToDropRequest.push(elId);
    }
  }

  // Holder side.
  for (const elId of mySelectedIds) {
    const winner = resolveElementWinner(elId, awarenessStates);
    if (winner && isRequestWindowElapsed(winner, now)) {
      elIdsToRelease.push(elId);
      continue;
    }
    const otherHolders = getOtherHoldersOf(elId, awarenessStates, myClientId);
    if (otherHolders.length === 0) continue;

    const myClaimTs = getClaimTimestamp(elId, awarenessStates, myClientId);
    const otherClaimTs = Math.max(
      0,
      ...otherHolders.map((id) => getClaimTimestamp(elId, awarenessStates, id)),
    );
    if (otherClaimTs > myClaimTs) {
      elIdsToRelease.push(elId);
    } else if (otherClaimTs === myClaimTs && Math.min(myClientId, ...otherHolders) !== myClientId) {
      elIdsToRelease.push(elId);
    }
  }

  return { elIdsToAcquire, elIdsToDropRequest, elIdsToRelease };
}
