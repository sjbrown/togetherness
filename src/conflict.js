/**
 * conflict.js
 * touched-set construction + concurrent-reaction overlap detection
 *
 * Every commitEnvelope() call records a "reaction bundle" describing what
 * it just touched and when, into a synced `reactionLog` Y.Array — every
 * origin alike (ENVELOPE_ORIGIN, DERIVED_ORIGIN, LIFECYCLE_ORIGIN).
 *
 * Any peer
 * can then scan that log — after its own commit, or after a remote update
 * integrates — for other bundles whose touched-set overlaps AND which are
 * causally concurrent with the new one
 *
 */

import * as Y from 'yjs'
import { yNodeFor } from './toys.js'

export const REACTION_LOG_KEY = 'reactionLog'

/** The shared, synced reaction-bundle log for a document. */
export function getReactionLog(ydoc) {
  return ydoc.getArray(REACTION_LOG_KEY)
}

// Stable cross-replica identity for a Yjs node: its own backing Item's id
// ({client, clock}) — the same mechanism Yjs's own createRelativePosition
// uses internally
// Returns null for a node with no attached item: a still-detached fragment,
// or the root yToys fragment itself, which has no backing Item of its own.
function itemId(yNode) {
  const item = yNode?._item
  if (!item) return null
  return { client: item.id.client, clock: item.id.clock }
}

function idKey({ client, clock }) {
  return `${client}:${clock}`
}

// A touched node's own human-readable identity, for inspection/debugging
// only — never used to resolve or compare items (the Map's own key,
// "client:clock", is the only thing anything resolves an item by). A
// toy's own data-id if it has one, else the plain DOM id, else just the
// nodeName (a die's own <g> has a data-id; a bare tspan/text node inside
// it usually doesn't, so it falls through to "tspan"/"#text" — good
// enough for now, revisit if that's ever not enough to tell touched
// entries apart at a glance).
function domIdFor(node) {
  if (node?.nodeType === Node.ELEMENT_NODE) {
    return node.getAttribute('data-id') || node.getAttribute('id') || node.nodeName
  }
  return node?.nodeName ?? null
}

/**
 * Build the touched-node map for a committed envelope, from the raw
 * MutationRecord[] it produced. Must be called AFTER the records have been
 * applied to the Yjs doc — a freshly-inserted node has no backing Item
 * until its insert op has actually landed.
 *
 * Returns a Map<idKeyString, {domId, mutation}> — a small, purpose-built
 * distillation of MutationRecord, not another ad-hoc reimplementation of
 * it scattered across call sites: everything that needs "just the
 * touched ids" can still do `.keys()`; everything that needs to know
 * whether something was added, removed, or merely touched can filter on
 * `.mutation` right here, in one place a developer can actually inspect,
 * instead of that distinction disappearing into a bare id set.
 *
 * `mutation` is `'added'`/`'removed'` for a node appearing in a record's
 * addedNodes/removedNodes, or the record's own MutationRecord.type
 * (`'attributes'`/`'characterData'`/`'childList'`) for record.target
 * itself.
 *
 * Records are processed in order, each entry OVERWRITING any earlier one
 * for the same item — the final mutation for a given item is whatever
 * actually happened to it LAST within this commit. This is what makes a
 * reparent (removed from its old parent, added to its new one, same
 * commit) correctly end up tagged 'added', not 'removed': the node didn't
 * vanish, it moved. Conversely, a node that's genuinely gone by the end
 * of the commit (deleted, or moved away with nothing put back) keeps its
 * `'removed'` tag — that's the signal `escalation.js` needs to tell "this
 * commit's content is fully accounted for by its own records" from "this
 * commit removed something a snapshot needs to cover."
 */
export function touchedSetFromRecords(records) {
  const touched = new Map()
  const set = (node, mutation) => {
    const yNode = yNodeFor(node)
    const id = itemId(yNode)
    if (!id) return
    touched.set(idKey(id), { domId: domIdFor(node), mutation })
  }
  for (const record of records) {
    set(record.target, record.type)
    record.addedNodes?.forEach(n => set(n, 'added'))
    record.removedNodes?.forEach(n => set(n, 'removed'))
  }
  return touched
}

/**
 * Record a bundle for a just-committed envelope. Call from INSIDE the same
 * ydoc.transact(...) that applied the commit, so the bundle
 * commits atomically with the changes it describes.
 *
 * The causal stamp is {clientID, clock}:
 *   - clientID is this peer's own ydoc.clientID.
 *   - clock is Y.getState(ydoc.store, ydoc.clientID), immediately after
 *     this transaction's own ops were applied
 *
 * beforeState (tr.beforeState, a Map<client, clock>) is the state vector
 * at the moment this transaction (or, potentially the outer transaction)
 * began.  Represents causal-knowledge boundary every other
 * bundle's concurrency is judged against.
 *
 * authorId is the committing peer's own persistent user.js localId — NOT
 * the same thing as clientID (Yjs's own ephemeral, per-session numeric
 * id). Authority ordering (tables.js's isAuthoritative/joinSequence) is
 * keyed on localId, so a bundle needs to self-report it directly: there's
 * no separate lookup structure anywhere that maps one to the other, and
 * deliberately so — a peer's clientID is only ever meaningful to that
 * peer's own live session, while the bundle itself is synced data other
 * peers need to resolve the author of long after that session (or that
 * peer) may be gone. Self-describing avoids needing a second structure to
 * keep reachable and in sync with the bundle it describes. May be
 * undefined for callers that don't have an identity to hand (tests,
 * mainly) — comparison code should treat a missing authorId as unable to
 * resolve authority, not crash.
 *
 * No-op (returns null) if the touched-set is empty.
 */
export function recordReactionBundle(ydoc, tr, origin, touched, authorId) {
  if (touched.size === 0) return null

  const bundle = {
    clientID:    ydoc.clientID,
    clock:       Y.getState(ydoc.store, ydoc.clientID),
    beforeState: Object.fromEntries(tr.beforeState),
    touched:     Object.fromEntries(touched),
    origin,
    authorId,
    ts:          Date.now(),
  }
  getReactionLog(ydoc).push([bundle])
  return bundle
}

/**
 * True if bundle `a`'s commit was already causally known to bundle `b` at
 * the moment `b`'s transaction began — i.e. `a` "happened before" `b`.
 */
function happenedBefore(a, b) {
  return (b.beforeState[a.clientID] ?? 0) >= a.clock
}

/**
 * True if two bundles are the same recorded commit
 * (used to exclude a bundle from "matching against itself")
 */
export function sameBundle(a, b) {
  return a.clientID === b.clientID && a.clock === b.clock
}

/**
 * True if bundles a and b are causally concurrent: neither had integrated
 * the other's commit when it started.
 */
export function areConcurrent(a, b) {
  if (a.clientID === b.clientID) return false
  return !happenedBefore(a, b) && !happenedBefore(b, a)
}

/**
 * True if two bundles' touched-sets share at least one node.
 */
export function touchedSetsOverlap(a, b) {
  return Object.keys(a.touched).some(k => k in b.touched)
}

/**
 * Scan a reaction log for existing bundles that conflict with newBundle: a
 * different causally-concurrent author whose touched-set overlaps.
 * Returns the list of conflicting bundles (empty if none).
 *
 * Callers decide what (if anything) to do with the result.
 */
export function scanForConflicts(reactionLogEntries, newBundle) {
  return reactionLogEntries.filter(other =>
    !sameBundle(other, newBundle) &&
    areConcurrent(other, newBundle) &&
    touchedSetsOverlap(other, newBundle)
  )
}
