/**
 * authority.js — deterministic conflict-arbitration ordering (TODO #11, step 3).
 *
 * `joinSequence` is an append-only Y.Array living in the document, recording
 * each peer's persistent id (user.js's `localId`, e.g. `tt-p-v1-DD-XXX`) in
 * join order. It is NOT keyed on `ydoc.clientID` — clientID is a fresh
 * random number every session, which would silently reshuffle authority on
 * every reload. `localId` survives reloads and reconnects, which the design
 * requires: a partitioned peer must remain arbitrable when it comes back
 * (see concurrency_branching.md, "Authority ordering" / "Pruning: no").
 *
 * Because it's a Y.Array, insertion order is CRDT-ordered and identical on
 * every peer. Two peers appending concurrently (both joining before seeing
 * each other) degrade automatically to Yjs's own tie-break for concurrent
 * inserts — deterministic, and a case where no human could perceive a
 * "first" anyway.
 *
 * This module only builds the ordering primitive. It is not yet consulted
 * by any conflict-resolution logic — that's touched-set construction (TODO
 * #11 step 4) and fast-path resolution (step 5).
 */

/**
 * Append myId to yJoinSequence, guarded: only if not already present.
 * Safe to call every session (reload, reconnect) — a returning peer keeps
 * its original position rather than being appended again and losing its
 * earlier-joined authority.
 */
export function ensureJoined(ydoc, yJoinSequence, myId) {
  if (yJoinSequence.toArray().includes(myId)) return;
  ydoc.transact(() => {
    // Re-check inside the transaction in case something else already
    // appended this id while this call was in flight (e.g. a duplicate
    // ensureJoined call from a second boot path). Concurrent joins from
    // *other* peers are a different id and never collide with this guard.
    if (yJoinSequence.toArray().includes(myId)) return;
    yJoinSequence.push([myId]);
  });
}

/**
 * Compare two peer ids by join order.
 *
 * Returns a negative number if idA is authoritative over idB (idA joined
 * earlier), positive if idB is authoritative over idA, 0 if the ids are
 * equal.
 *
 * An id missing from joinSequence entirely sorts last — an unrecorded peer
 * never outranks a recorded one. This can happen transiently (e.g. querying
 * before a fresh peer's own ensureJoined() has landed locally) but should
 * not persist once every live peer has joined. Two unrecorded ids compare
 * equal; callers needing a total order in that case have no signal here to
 * break the tie with.
 */
export function compareAuthority(yJoinSequence, idA, idB) {
  if (idA === idB) return 0;
  const seq = yJoinSequence.toArray();
  const iA = seq.indexOf(idA);
  const iB = seq.indexOf(idB);
  if (iA === -1 && iB === -1) return 0;
  if (iA === -1) return 1;
  if (iB === -1) return -1;
  return iA - iB;
}

/**
 * True if idA is authoritative over idB (idA joined joinSequence earlier).
 */
export function isAuthoritative(yJoinSequence, idA, idB) {
  return compareAuthority(yJoinSequence, idA, idB) < 0;
}

/**
 * Reset yJoinSequence to contain ONLY soleId, discarding every other entry.
 *
 * Used when forking a table (see concurrency_branching.md, "The branch
 * (fork) operation"): forking copies the whole source document — including
 * joinSequence, and thus every player who was ever on the source table —
 * via Y.encodeStateAsUpdate. Left untouched, that would make the source
 * table's other players outrank the forking user on their own brand-new
 * branch (they joined the *source* table earlier), even though they've
 * never seen this branch and may not even know it exists. A fresh branch's
 * authority ordering should start clean, with the forking user as its sole
 * — and therefore authoritative — member.
 */
export function resetJoinSequenceToSelf(ydoc, yJoinSequence, soleId) {
  ydoc.transact(() => {
    if (yJoinSequence.length > 0) yJoinSequence.delete(0, yJoinSequence.length);
    yJoinSequence.push([soleId]);
  });
}
