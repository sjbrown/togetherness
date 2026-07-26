/**
 * escalation.js — TODO #11 step 6: what to DO once conflict.js has
 * detected a conflict. Deliberately a separate module from conflict.js,
 * which is detection only by its own explicit design (see conflict.js's
 * module doc comment) — this is the resolution half: deciding who wins,
 * and reverting the loser's own contribution out of the shared document.
 *
 * Two pieces so far:
 *   - resolveConflictWinner — authority ordering for a detected pair,
 *     using each bundle's self-reported authorId (see conflict.js's
 *     recordReactionBundle) against tables.js's joinSequence.
 *   - revertBundle — delete the loser's own contribution from wherever it
 *     currently lives in the doc.
 *
 * revertBundle's scope, deliberately: it undoes STRUCTURAL INSERTIONS the
 * losing bundle's own commit made (new toys, new text nodes — the
 * garbling-relevant case), not attribute-only edits to pre-existing nodes.
 * That's not a shortcut so much as matching where the problem actually is:
 * concurrent attribute writes on the same existing node already resolve
 * fine via Yjs's own last-write-wins (see concurrency_branching.md, "Two
 * transaction classes") — there's nothing there that NEEDS reverting.
 * Deletions the losing bundle made aren't handled yet either (undoing a
 * delete means restoring what was removed, which needs an inverse-op
 * ledger this doesn't have) — a known gap, not a silent one: see the
 * module-level TODO below.
 *
 * TODO: revertBundle doesn't undo a losing bundle's own DELETIONS (only
 * its insertions) — restoring removed content needs an inverse-op ledger
 * captured at commit time, which doesn't exist yet. Until it does, a
 * conflict whose losing side's contribution was "I removed something"
 * rather than "I added something" won't be fully reverted.
 */

import * as Y from 'yjs'
import { tablesAPI } from './tables.js'
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
 * createRelativePosition uses internally.
 */
function resolveTouchedItem(ydoc, key) {
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
 * Revert a losing bundle: delete every item in its touched-set that the
 * bundle's OWN commit actually created (item.id.client === bundle.clientID)
 * from wherever it currently lives. Pre-existing nodes the bundle merely
 * touched — read, or wrote an attribute on — are deliberately left alone:
 * see the module doc comment for why that's the correct scope, not a gap.
 *
 * Must be called from inside a ydoc.transact() — this performs raw
 * structural deletes directly, not an envelope-captured DOM operation:
 * there's no live DOM to mirror a remote peer's touched items against in
 * general, since the losing bundle might be a peer this replica only ever
 * saw as synced Yjs ops.
 *
 * Idempotent by construction: every peer that independently detects the
 * same conflict calls this with the same bundle, and deleting an
 * already-deleted item is a safe no-op (resolveTouchedItem returns null
 * for it) — so it's safe for the loser, the winner, and every other peer
 * to all redundantly call this without coordinating who goes first.
 */
export function revertBundle(ydoc, bundle) {
  for (const key of bundle.touched) {
    const yNode = resolveTouchedItem(ydoc, key)
    if (!yNode) continue
    if (yNode._item.id.client !== bundle.clientID) continue
    const parent = yNode.parent
    if (!parent || typeof parent.toArray !== 'function') continue
    const idx = parent.toArray().indexOf(yNode)
    if (idx !== -1) parent.delete(idx, 1)
  }
}
