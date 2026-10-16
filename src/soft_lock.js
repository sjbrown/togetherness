/**
 * soft_lock.js — pure derivation functions for the "soft lock" element
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
 *   desired: { [elId: string]: { ts: number, holding: boolean } }
 *
 * One entry per elId a client wants: an id is either present-and-holding
 * or present-and-bidding
 *
 * `holding: true`: elId is part of this client's committed selection.
 *                  `ts` is the last-claimed time -- set on select, promotion,
 *                  or a deliberate reclick
 *
 * `holding: false`: not yet held, but bidding to acquire it.
 *                  `ts` is fixed at the bid's start.
 *                  The entry is deleted the moment it resolves, win or lose
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
 * The clientId currently holding `elId`, or null if nobody holds it.
 * Assumes at most one holder at a time (the invariant this whole protocol
 * exists to make usually-true, not guaranteed — if two clients somehow
 * both hold elId, the first one encountered wins — callers needing to
 * detect that specific case should use getOtherHoldersOf instead).
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {number | null}
 */
export function getHolderClientId(elId, awarenessStates) {
  let holder = null;
  awarenessStates.forEach((state, clientId) => {
    if (holder !== null) return;
    if (state?.desired?.[elId]?.holding) {
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
 * Every clientId (excluding myClientId) currently holding elId. Unlike
 * getHolderClientId (which assumes at most one true holder and returns the
 * first one found), this deliberately does NOT assume single-holder — it's
 * used specifically to detect the case where that invariant has
 * (temporarily or buggily) broken and more than one client currently
 * believes it holds the same element.
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
    if (state?.desired?.[elId]?.holding) {
      others.push(clientId);
    }
  });
  return others;
}

/**
 * `clientId`'s own claim timestamp for elId — how recently they last
 * claimed it. 0 if they don't currently hold it (including if they're
 * merely bidding for it), or hold it but never stamped a claim (shouldn't
 * happen)
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @param {number} clientId
 * @returns {number}
 */
export function getClaimTimestamp(elId, awarenessStates, clientId) {
  const entry = awarenessStates.get(clientId)?.desired?.[elId];
  return entry?.holding ? entry.ts : 0;
}

// ── Request queries ──────────────────────────────────────────────────────────

/**
 * Every outstanding acquisition bid for elId, across all clients — every
 * desired[elId] entry with holding:false, by construction always a bid
 * so no held-by-same-client disambiguation is needed.
 *
 * @param {string} elId
 * @param {Map<number, object>} awarenessStates
 * @returns {RequestEntry[]}
 */
export function getAcquirersOf(elId, awarenessStates) {
  const acquirers = [];
  awarenessStates.forEach((state, clientId) => {
    const entry = state?.desired?.[elId];
    if (entry && entry.holding === false) acquirers.push({ clientId, ts: entry.ts });
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
    const desired = state?.desired;
    if (!desired) return;
    for (const [elId, entry] of Object.entries(desired)) {
      if (entry && entry.holding === false) contested.add(elId);
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
 *      timestamp (refreshed by a deliberate re-click, i.e. the "bathroom"
 *      defense gesture) is at least as recent as the winning acquirer's
 *      request, the holder's claim rebuts it.
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
 *   - Acquirer side: for each of my own desired entries with holding:false
 *     whose window has elapsed, if I'm the resolved winner I should
 *     acquire it; otherwise (rebutted, or lost a tie-break to another
 *     acquirer) I should drop my own bid for it.
 *   - Holder side: for each elId I currently hold (holding:true) —
 *       (a) if resolution finds a winning acquirer whose window has
 *           elapsed, release it (the common case);
 *       (b) otherwise, as a fallback: if some OTHER client also currently
 *           holds this elId (a durable conflict, which can arise even when
 *           (a) finds no acquirer — a successful acquirer's own bid entry
 *           is deleted immediately upon promotion, so by the time my tick
 *           runs there may be no bid left to resolve against), compare
 *           claim timestamps directly: whoever claimed it more recently
 *           keeps it. A client that never explicitly (re-)claimed it has
 *           no claim timestamp, treated as 0, and always loses to a client
 *           with an actual claim. Genuine ties (including 0-vs-0 — e.g.
 *           two clients simultaneously plain-selecting a previously free
 *           element) fall back to a deterministic clientId comparison.
 *
 * @param {{ myClientId: number, awarenessStates: Map<number, object>, now: number }} args
 * @returns {{
 *   elIdsToAcquire: string[],
 *   elIdsToDropRequest: string[],
 *   elIdsToRelease: string[],
 * }}
 */
export function computeTickActions({ myClientId, awarenessStates, now }) {
  const myDesired = awarenessStates.get(myClientId)?.desired ?? {};
  const mySelectedIds = Object.keys(myDesired).filter((id) => myDesired[id].holding);
  const myPendingRequests = Object.fromEntries(
    Object.entries(myDesired).filter(([, entry]) => !entry.holding).map(([id, entry]) => [id, entry.ts]),
  );

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

// ── Request animation ────────────────────────────────────────────────────────
//
// While a request is open, two rings animate over the same cycle, driven by
// a single "vanish" value v in [0, 1] (0 = the full gradient ring, 1 =
// colours pushed into the far corner, ring nearly gone):
//
//   - the holder's ring fades:     v rises with ease-in
//   - the requester's ring grows:  v falls linearly, from the opposite corner
//
// A cycle is the request window plus a buffer, and repeats. The buffer holds
// the final frame so a tick or a slow network that resolves the request a
// little late doesn't visibly restart the animation.

export const RING_WIDTH = 4;       // requester ring stroke
export const FADE_END = 0.92;      // how far the colours are pushed at v = 1
export const LOOP_BUFFER_MS = 1000;
export const CYCLE_MS = REQUEST_WINDOW_MS + LOOP_BUFFER_MS;

const FRAME_SAMPLES = 24;

export const easeLinear = (p) => p;
export const easeInQuad = (p) => p * p;

// v as a function of window progress p
export const fadeVanish = (p) => easeInQuad(p);
export const growVanish = (p) => 1 - easeLinear(p);

/**
 * Offsets of the two moving stops at vanish value v. Stops 0 and 1 are
 * transparent and stop 3 is pinned at 1, so the colours live in [b, 1].
 */
export function vanishOffsets(v, end = FADE_END) {
  const a = end * v;
  const ramp = 0.02 + 0.1 * v * (1 - v);
  return { a, b: Math.min(a + ramp, 0.995) };
}

// Position within the repeating cycle for a request that is `elapsedMs`
// old. Negative ages (a peer's clock ahead of ours) count as just started.
export function cycleMs(elapsedMs) {
  return Math.max(0, elapsedMs) % CYCLE_MS;
}

// 0..1 across the request window, held at 1 through the buffer.
export function windowProgress(elapsedMs) {
  return Math.min(1, cycleMs(elapsedMs) / REQUEST_WINDOW_MS);
}

// Gap, in ms, over which the cycle's wrap-around is drawn when keyframes
// start mid-cycle; keyTimes must stay increasing, so it can't be zero.
const WRAP_MS = 3;

function lerpAt(ts, vs, t) {
  for (let i = 1; i < ts.length; i++) {
    if (t <= ts[i]) return vs[i - 1] + (vs[i] - vs[i - 1]) * ((t - ts[i - 1]) / (ts[i] - ts[i - 1]));
  }
  return vs[vs.length - 1];
}

/**
 * Keyframes for animating the two moving stops' `offset` over one cycle,
 * starting `phaseMs` into it: the window sampled in FRAME_SAMPLES steps,
 * then a flat hold to the end of the cycle, then the wrap back to the start.
 * Returns semicolon-joined strings ready for a SMIL <animate>.
 *
 * Starting mid-cycle is done by rotating the keyframes rather than by
 * backdating the animation's begin time: a dynamically inserted <animate>
 * with a begin in the past is never scheduled by the browser, so it would
 * sit on its first frame. The rotated cycle is seamless at its own repeat
 * point and carries the real wrap as a near-instant step inside it.
 */
export function vanishFrames(vOfProgress, phaseMs = 0, end = FADE_END) {
  const ts = [];
  const as = [];
  const bs = [];
  for (let i = 0; i <= FRAME_SAMPLES; i++) {
    const { a, b } = vanishOffsets(vOfProgress(i / FRAME_SAMPLES), end);
    ts.push(i / FRAME_SAMPLES * REQUEST_WINDOW_MS);
    as.push(a);
    bs.push(b);
  }
  ts.push(CYCLE_MS);
  as.push(as[as.length - 1]);
  bs.push(bs[bs.length - 1]);

  let phase = ((phaseMs % CYCLE_MS) + CYCLE_MS) % CYCLE_MS;
  if (CYCLE_MS - phase < 2 * WRAP_MS) phase = 0;

  const times = [0];
  const aVals = [phase === 0 ? as[0] : lerpAt(ts, as, phase)];
  const bVals = [phase === 0 ? bs[0] : lerpAt(ts, bs, phase)];
  const push = (t, a, b) => { times.push(t); aVals.push(a); bVals.push(b); };

  if (phase === 0) {
    for (let i = 1; i < ts.length; i++) push(ts[i], as[i], bs[i]);
  } else {
    for (let i = 1; i < ts.length - 1; i++) {
      if (ts[i] > phase) push(ts[i] - phase, as[i], bs[i]);
    }
    const last = ts.length - 1;
    const holdEnd = CYCLE_MS - phase - WRAP_MS;
    if (holdEnd > times[times.length - 1]) push(holdEnd, as[last], bs[last]);
    push(CYCLE_MS - phase, as[0], bs[0]);
    for (let i = 1; i < ts.length - 1; i++) {
      if (ts[i] < phase) push(CYCLE_MS - phase + ts[i], as[i], bs[i]);
    }
    push(CYCLE_MS, aVals[0], bVals[0]);
  }

  const join = (xs) => xs.map((x) => +x.toFixed(4)).join(';');
  return { keyTimes: join(times.map((t) => t / CYCLE_MS)), a: join(aVals), b: join(bVals) };
}
