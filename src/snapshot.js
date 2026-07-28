/**
 * snapshot.js — capturing a Yjs node's full content before it's
 * deleted, so a peer who later discovers a revert should have preserved it
 * (rather than just discarding it) can reconstruct the content.
 *
 * Not the original CRDT identity — but the actual content,
 * from data that reached every peer.
 *
 * Two halves:
 *   - snapshotYNode / restoreYNodeFromSnapshot — a lossless, recursive,
 *     plain-JS <-> Yjs mirror. The inverse of storage.js's domToY, just
 *     operating on live Yjs directly instead of DOM
 *   - getRevertSnapshots / captureRevertSnapshot / recordRevertSnapshot —
 *     the synced storage for these snapshots.
 *     Bounded size: one-slot-per-author.
 *     Writing a peer's second qualifying commit evicts their earlier one.
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
 * never part of the snapshot; restoring always creates fresh items)
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
 * Y.XmlText tree from a snapshot object.
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
 * parent. Call BEFORE the caller deletes yNode from that parent.
 * Capturing after delete would find nothing, due to Yjs's default gc:true,
 *
 * index is yNode's current position among parent's children
 * (best effort -- siblings may have come and gone in the meantime)
 */
export function captureRevertSnapshot(yNode, parent) {
  return {
    parentKey: itemKey(parent),
    index: parent?.toArray?.().indexOf(yNode) ?? 0,
    content: snapshotYNode(yNode),
  }
}

/**
 * Record (or overwrite) the revert-snapshot slot for authorId.
 *
 * bundleStamp {clientID, clock} lets a later consumer confirm a
 * stored snapshot matches the specific commit being reverted,
 * rather than being a stale leftover from some other, unrelated
 * later commit by the same* peer that simply hasn't been evicted
 * by a third commit yet.
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
