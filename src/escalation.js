/**
 * escalation.js — TODO #11 step 6: what to DO once conflict.js has
 * detected a conflict. Deliberately a separate module from conflict.js,
 * which is detection only by its own explicit design (see conflict.js's
 * module doc comment) — this is the resolution half: deciding who wins,
 * reverting the loser's own contribution out of the shared document, and
 * (not yet built beyond the predicate itself) forking whatever that
 * revert can't recover.
 *
 * Three pieces:
 *   - resolveConflictWinner — authority ordering for a detected pair,
 *     using each bundle's self-reported authorId (see conflict.js's
 *     recordReactionBundle) against tables.js's joinSequence.
 *   - revertBundle — delete the loser's own structural insertions, AND
 *     restore any pre-existing content the loser's own commit removed, if
 *     a matching revert snapshot (snapshot.js) is still available.
 *   - needsEscalation — whether revertBundle, run against a given losing
 *     bundle, would leave content unrecovered (a removal with no matching
 *     snapshot) and so needs branch escalation on top. Pure detection —
 *     doesn't fork anything itself; see its own doc comment for why only
 *     the losing peer's own client can meaningfully act on a true result.
 *
 * revertBundle's insertion-delete half is idempotent by construction —
 * deleting an already-deleted Yjs item is a safe no-op, so every peer that
 * independently detects the same conflict can call this with the same
 * bundle, redundantly, with no coordination. Its restoration half is NOT
 * automatically idempotent the same way — restoring is an INSERT, and Yjs
 * never deduplicates inserts by content, so two peers each independently
 * restoring the same snapshot would create two separate, genuinely
 * distinct dice, not one. See revertBundle's own doc comment for how this
 * is (partially) addressed.
 */

import * as Y from 'yjs'
import { tablesAPI } from './tables.js'
import { getRevertSnapshots, restoreYNodeFromSnapshot } from './snapshot.js'

const { isAuthoritative } = tablesAPI

/**
 * Given two conflicting bundles (as scanForConflicts pairs them), return
 * { winner, loser } using tables.js's joinSequence-based authority
 * ordering over each bundle's own authorId.
 *
 * Returns null — rather than guessing — if either bundle has no authorId
 * (a bundle recorded before authorId existed, or by a caller with no
 * identity to give; see conflict.js's recordReactionBundle) or if both
 * bundles somehow share one (shouldn't happen: areConcurrent already
 * treats same-author bundles as never concurrent, so scanForConflicts
 * should never hand this function such a pair — checked anyway, since
 * silently picking an arbitrary winner for a case that indicates a bug
 * elsewhere is worse than refusing).
 */
export function resolveConflictWinner(ydoc, bundleA, bundleB) {
  if (!bundleA.authorId || !bundleB.authorId) return null
  if (bundleA.authorId === bundleB.authorId) return null
  return isAuthoritative(ydoc, bundleA.authorId, bundleB.authorId)
    ? { winner: bundleA, loser: bundleB }
    : { winner: bundleB, loser: bundleA }
}

/**
 * Resolve a touched-set item-id key ("client:clock") back to its live Yjs
 * node — or null if it's already gone (deleted by someone else, or
 * garbage-collected). Same {client,clock} -> live-node mechanism Yjs's own
 * createRelativePosition uses internally. Also used to resolve a
 * snapshot's parentKey back to a live node — same mechanism, same
 * function, different caller.
 */
function resolveItemKey(ydoc, key) {
  const [client, clock] = key.split(':').map(Number)
  let item
  try {
    item = Y.getItem(ydoc.store, Y.createID(client, clock))
  } catch {
    return null // never existed on this replica, or already GC'd away entirely
  }
  if (!item || item.deleted) return null
  return item.content?.type ?? null
}

/**
 * Whether authorId's one revert-snapshot slot actually protects THIS exact
 * bundle ({clientID, clock} match), not a stale leftover from some other,
 * unrelated later commit by the same peer that simply hasn't been evicted
 * yet. Shared by restoreFromSnapshot and needsEscalation — the two places
 * that need the identical answer to "is a snapshot genuinely available for
 * this bundle," so they can't drift apart from each other over time.
 */
function hasMatchingSnapshot(ydoc, bundle) {
  const stored = getRevertSnapshots(ydoc).get(bundle.authorId)
  return !!(stored
    && stored.bundleStamp?.clientID === bundle.clientID
    && stored.bundleStamp?.clock === bundle.clock)
}

/**
 * Restore a losing bundle's own removed pre-existing content, if a
 * matching revert snapshot is available (snapshot.js) — the earlier
 * "clone-before-delete" capture in envelope.js's commitEnvelope. Called
 * from revertBundle; not exported on its own.
 *
 * A mismatch (see hasMatchingSnapshot) means restoration genuinely isn't
 * available for this bundle, not an error — see snapshot.js's "(revertable
 * commit buffer size) = (number of peers)" rule; this is that rule's cost,
 * paid honestly rather than papered over. It's also exactly the condition
 * needsEscalation (below) checks for — the two must be called in that
 * order (needsEscalation first) if a caller wants both answers, since this
 * function CONSUMES the snapshot on success, and asking needsEscalation
 * afterward would see "no snapshot" and wrongly report true even though
 * restoration just succeeded.
 *
 * Consumes the snapshot on success (deletes it from the slot, in the same
 * transaction as the restoring insert) so a second call for the same
 * bundle — by this peer reprocessing, or by another peer whose call
 * happens after this one's eviction has synced to them — finds nothing
 * and correctly no-ops, rather than inserting a second copy. This closes
 * the sequential-reprocessing case.
 *
 * It does NOT close every case: two peers who both read "snapshot still
 * present" before either's eviction has propagated to the other will both
 * restore, producing two distinct Yjs items from two independent inserts
 * — Yjs never deduplicates inserts by content, so nothing after the fact
 * merges them back into one. This is a real, if narrow, residual gap:
 * closing it fully needs actual coordination (a claim/lock primitive) that
 * doesn't exist here. Worth knowing, not currently solved.
 */
function restoreFromSnapshot(ydoc, bundle) {
  if (!hasMatchingSnapshot(ydoc, bundle)) return
  const snapshots = getRevertSnapshots(ydoc)
  const stored = snapshots.get(bundle.authorId)

  const restoredNode = restoreYNodeFromSnapshot(stored.content)
  if (!restoredNode) return

  // parentKey null means the snapshot's parent was a root fragment (see
  // captureRevertSnapshot) — this module only ever reverts toy bundles, so
  // that's always yToys specifically, not a generic "any root fragment".
  const parent = stored.parentKey === null
    ? ydoc.getXmlFragment('toys')
    : resolveItemKey(ydoc, stored.parentKey)
  if (!parent || typeof parent.insert !== 'function') return

  const currentLength = parent.toArray?.().length ?? 0
  const index = Math.max(0, Math.min(stored.index, currentLength))
  parent.insert(index, [restoredNode])
  snapshots.delete(bundle.authorId) // consume — see doc comment above
}

/**
 * Whether a losing bundle needs branch escalation — i.e. whether
 * revertBundle, run against it right now, would leave content
 * unrecovered. True exactly when BOTH:
 *   - the bundle's own touched-set still has at least one entry whose
 *     final `mutation` is `'removed'` (conflict.js's touchedSetFromRecords
 *     — a commit that reparented something ends up `'added'`, not
 *     `'removed'`, so an ordinary reparent conflict never trips this; only
 *     a commit that genuinely removed something and never got it back
 *     within its own records does), AND
 *   - no snapshot is available to recover that removal (hasMatchingSnapshot).
 *
 * A bundle that never removed anything needs no escalation regardless —
 * revertBundle's delete-the-insertions half is always complete on its own
 * for that case, nothing was ever at risk of going unrecovered.
 *
 * Must be called BEFORE revertBundle for the same bundle, not after — see
 * restoreFromSnapshot's doc comment for why calling it afterward can give
 * a false positive (the snapshot legitimately consumed by a successful
 * restore looks identical, from here, to one that was never there).
 *
 * Pure — makes no Yjs writes, decides nothing about who forks or when.
 * That's the caller's job (only the loser's own peer can meaningfully
 * fork; see the module doc comment).
 */
export function needsEscalation(ydoc, bundle) {
  const hasUnrecoveredRemoval = Object.values(bundle.touched).some(({ mutation }) => mutation === 'removed')
  if (!hasUnrecoveredRemoval) return false
  return !hasMatchingSnapshot(ydoc, bundle)
}

/**
 * Revert a losing bundle: delete every item this bundle's own commit
 * actually ADDED (its `touched` entry's own `mutation === 'added'` — see
 * conflict.js's touchedSetFromRecords) from wherever it currently lives,
 * THEN restore any pre-existing content that same commit removed
 * (`mutation === 'removed'`), if a matching snapshot is still available
 * (see restoreFromSnapshot above). Pre-existing nodes the bundle merely
 * touched — read, or wrote an attribute on, without adding or removing —
 * are left alone throughout: see the module doc comment for why that's
 * the correct scope, not a gap.
 *
 * `mutation` is checked, not `item.id.client === bundle.clientID` (an
 * earlier version of this function used that instead) — the two aren't
 * the same question. clientID only tells you the item was created by
 * this PEER, at some point, ever; mutation tells you it was created by
 * THIS COMMIT specifically. A peer's own touched-set can legitimately
 * reference an item they created in some earlier, unrelated commit —
 * touched only because this commit happened to read or write an
 * attribute on it — and the clientID check would have wrongly deleted
 * that too. touchedSetFromRecords's own "last mutation wins" ordering is
 * what makes checking `mutation` here correct: a reparent's node ends up
 * tagged 'added' even though the SAME commit also removed a stale
 * reference to it, because 'added' is genuinely what happened to it last.
 *
 * Must be called from inside a ydoc.transact() — this performs raw
 * structural deletes/inserts directly, not an envelope-captured DOM
 * operation: there's no live DOM to mirror a remote peer's touched items
 * against in general, since the losing bundle might be a peer this
 * replica only ever saw as synced Yjs ops.
 *
 * The deletion half is idempotent by construction (see module doc
 * comment); the restoration half is idempotent against sequential
 * reprocessing (consumes the snapshot on success) but not against two
 * peers both restoring before either's eviction has synced — see
 * restoreFromSnapshot's doc comment for the honest limit here.
 */
export function revertBundle(ydoc, bundle) {
  for (const [key, { mutation }] of Object.entries(bundle.touched)) {
    if (mutation !== 'added') continue
    const yNode = resolveItemKey(ydoc, key)
    if (!yNode) continue
    const parent = yNode.parent
    if (!parent || typeof parent.toArray !== 'function') continue
    const idx = parent.toArray().indexOf(yNode)
    if (idx !== -1) parent.delete(idx, 1)
  }

  restoreFromSnapshot(ydoc, bundle)
}
