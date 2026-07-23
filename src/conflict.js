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
 * TODO: Detection only. What to DO about a detected conflict (fast-path
 * in-place resolution vs. branch escalation) is TODO #11 steps 5/6 — not
 * decided here.
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

/**
 * Build the touched-node-set for a committed envelope, from the raw
 * MutationRecord[] it produced. Must be called AFTER the records have been
 * applied to the Yjs doc — a freshly-inserted node has no backing Item,
 * until its insert op has actually landed.
 *
 * Granularity is node-level: each record's target, plus every added/
 * removed node, contributes at most one entry.
 *
 * Returns a Map<idKeyString, {client, clock}>
 */
export function touchedSetFromRecords(records) {
  const touched = new Map()
  const add = (node) => {
    const yNode = yNodeFor(node)
    const id = itemId(yNode)
    if (id) touched.set(idKey(id), id)
  }
  for (const record of records) {
    add(record.target)
    record.addedNodes?.forEach(add)
    record.removedNodes?.forEach(add)
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
 * No-op (returns null) if the touched-set is empty.
 */
export function recordReactionBundle(ydoc, tr, origin, touched) {
  if (touched.size === 0) return null

  const bundle = {
    clientID:    ydoc.clientID,
    clock:       Y.getState(ydoc.store, ydoc.clientID),
    beforeState: Object.fromEntries(tr.beforeState),
    touched:     [...touched.keys()],
    origin,
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
  const bSet = new Set(b.touched)
  return a.touched.some(k => bSet.has(k))
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
