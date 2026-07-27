/**
 * escalation.js — TODO #11 step 6: what to DO once conflict.js has
 * detected a conflict. Deliberately a separate module from conflict.js,
 * which is detection only by its own explicit design (see conflict.js's
 * module doc comment) — this is the resolution half: deciding who wins,
 * and reverting the loser's own contribution out of the shared document.
 *
 * Two pieces:
 *   - resolveConflictWinner — authority ordering for a detected pair,
 *     using each bundle's self-reported authorId (see conflict.js's
 *     recordReactionBundle) against tables.js's joinSequence.
 *   - revertBundle — delete the loser's own structural insertions, AND
 *     restore any pre-existing content the loser's own commit removed, if
 *     a matching revert snapshot (snapshot.js) is still available.
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
 * Restore a losing bundle's own removed pre-existing content, if a
 * matching revert snapshot is available (snapshot.js) — the earlier
 * "clone-before-delete" capture in envelope.js's commitEnvelope. Called
 * from revertBundle; not exported on its own.
 *
 * "Matching" means the snapshot's own bundleStamp equals this bundle's
 * exact {clientID, clock} — since the one-slot-per-authorId rule means an
 * unrelated LATER commit by the same peer could have evicted the snapshot
 * that actually protected THIS commit, leaving a stale snapshot (or none)
 * in that peer's slot. A mismatch means restoration genuinely isn't
 * available for this bundle, not an error — see snapshot.js's "(revertable
 * commit buffer size) = (number of peers)" rule; this is that rule's cost,
 * paid honestly rather than papered over.
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
  const snapshots = getRevertSnapshots(ydoc)
  const stored = snapshots.get(bundle.authorId)
  if (!stored) return
  if (stored.bundleStamp?.clientID !== bundle.clientID || stored.bundleStamp?.clock !== bundle.clock) return

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
 * Revert a losing bundle: delete every item in its touched-set that the
 * bundle's OWN commit actually created (item.id.client === bundle.clientID)
 * from wherever it currently lives, THEN restore any pre-existing content
 * that same commit removed, if a matching snapshot is still available (see
 * restoreFromSnapshot above). Pre-existing nodes the bundle merely
 * touched — read, or wrote an attribute on, without removing — are left
 * alone throughout: see the module doc comment for why that's the correct
 * scope, not a gap.
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
  for (const key of bundle.touched) {
    const yNode = resolveItemKey(ydoc, key)
    if (!yNode) continue
    if (yNode._item.id.client !== bundle.clientID) continue
    const parent = yNode.parent
    if (!parent || typeof parent.toArray !== 'function') continue
    const idx = parent.toArray().indexOf(yNode)
    if (idx !== -1) parent.delete(idx, 1)
  }

  restoreFromSnapshot(ydoc, bundle)
}
