/**
 * snapshot.js — TODO #11: capturing a Yjs node's full content before it's
 * deleted, so a peer who later discovers a revert should have preserved it
 * (rather than just discarding it) can reconstruct the content. Not the
 * original CRDT identity — nothing here, or anywhere else in this project,
 * ever preserves identity across a delete-and-recreate (a move, an import,
 * a revert are all the same in that respect) — but the actual content,
 * from data that reached every peer, rather than DOM or MutationRecord
 * content that never crosses the wire at all (see concurrency_branching.md
 * for why that's not just inconvenient but structurally impossible).
 *
 * Two halves:
 *   - snapshotYNode / restoreYNodeFromSnapshot — a lossless, recursive,
 *     plain-JS <-> Yjs mirror. The inverse of storage.js's domToY, just
 *     operating on live Yjs directly instead of DOM — there's no DOM
 *     involved in capturing OR restoring here at all.
 *   - getRevertSnapshots / captureRevertSnapshot / recordRevertSnapshot —
 *     the synced, bounded (one slot per authorId — the "(revertable
 *     commit buffer size) = number of peers" rule) storage for these
 *     snapshots. Writing a peer's second qualifying commit evicts their
 *     first slot's contents; that's deliberate, not a bug to fix later —
 *     it's what keeps the buffer's size bounded by peer count rather than
 *     by how much anyone's done.
 */

import * as Y from 'yjs'

export const REVERT_SNAPSHOTS_KEY = 'revertSnapshots'

/** The shared, synced revert-snapshot map for a document. */
export function getRevertSnapshots(ydoc) {
  return ydoc.getMap(REVERT_SNAPSHOTS_KEY)
}

// Same stable-identity mechanism conflict.js's touched-set uses — a node's
// own backing Item id, or null for a node with no attached item (a still-
// detached fragment, or a root fragment like yToys itself, which has no
// backing Item of its own — used here for parentKey when the parent is
// yToys directly, i.e. a top-level toy).
function itemKey(yNode) {
  const item = yNode?._item
  if (!item) return null
  return `${item.id.client}:${item.id.clock}`
}

/**
 * Recursively mirror a live Y.XmlElement/Y.XmlText into a plain,
 * JSON-serializable JS object — content only, no identity (item ids are
 * never part of the snapshot; restoring always creates fresh items, the
 * same as every other reconstruction in this project).
 */
export function snapshotYNode(yNode) {
  if (yNode instanceof Y.XmlText) {
    return { nodeName: '#text', text: yNode.toString() }
  }
  if (!(yNode instanceof Y.XmlElement)) return null
  return {
    nodeName: yNode.nodeName,
    attributes: yNode.getAttributes(),
    children: yNode.toArray().map(snapshotYNode).filter(Boolean),
  }
}

/**
 * The inverse of snapshotYNode: build a fresh, detached Y.XmlElement/
 * Y.XmlText tree from a snapshot object. Caller inserts the result
 * wherever it belongs — this function doesn't touch the doc, matching
 * storage.js's domToY (which also just returns a detached tree).
 */
export function restoreYNodeFromSnapshot(snapshot) {
  if (!snapshot) return null
  if (snapshot.nodeName === '#text') {
    return new Y.XmlText(snapshot.text)
  }
  const yEl = new Y.XmlElement(snapshot.nodeName)
  for (const [key, value] of Object.entries(snapshot.attributes ?? {})) {
    yEl.setAttribute(key, value)
  }
  const children = (snapshot.children ?? []).map(restoreYNodeFromSnapshot).filter(Boolean)
  if (children.length) yEl.insert(0, children)
  return yEl
}

/**
 * Capture everything needed to later restore yNode, given its current
 * parent. Call BEFORE the caller deletes yNode from that parent — this is
 * the same clone-before-delete ordering already verified (empirically —
 * see envelope.js) for script preservation: capturing after delete would
 * find nothing, since this project's docs use Yjs's default gc:true,
 * which strips a deleted item's content synchronously, in the same
 * transaction that deleted it.
 *
 * index is yNode's current position among parent's children — best
 * effort: by the time a restore actually happens, other siblings may have
 * come and gone, so a consumer should clamp it to parent's current length
 * rather than trust it exactly.
 */
export function captureRevertSnapshot(yNode, parent) {
  return {
    parentKey: itemKey(parent),
    index: parent?.toArray?.().indexOf(yNode) ?? 0,
    content: snapshotYNode(yNode),
  }
}

/**
 * Record (or overwrite) the one revert-snapshot slot for authorId.
 * bundleStamp ({clientID, clock} — the same causal stamp
 * recordReactionBundle puts on the bundle this snapshot protects) lets a
 * later consumer (escalation.js's revertBundle) confirm a stored snapshot
 * actually matches the specific commit being reverted, rather than being
 * a stale leftover from some other, unrelated later commit by the same
 * peer that simply hasn't been evicted by a third commit yet.
 */
export function recordRevertSnapshot(ydoc, authorId, bundleStamp, snapshot) {
  if (!authorId) return
  getRevertSnapshots(ydoc).set(authorId, {
    authorId,
    bundleStamp,
    parentKey: snapshot.parentKey,
    index: snapshot.index,
    content: snapshot.content,
    ts: Date.now(),
  })
}
