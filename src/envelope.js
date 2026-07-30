/**
 * envelope.js — mutation capture & translation for toy handler code
 *
 * We want to enable toy behaviour scripts (sometimes written by users),
 * and provide a sensible, standard surface to write those scripts against,
 * so {plain JavaScript + the DOM} is the clear winner.
 *
 * Toy behaviour scripts (dice, trays, tokens, ...) run against the
 * mirrored (live) DOM of the whole toys layer.
 *
 * But the Yjs tree, not the DOM, is the canonical document, so how do we
 * square this? Answer: runInEnvelopeSync lets a handler mutate the DOM as
 * if it owned it, then translates whatever it did back into a single Yjs
 * transaction:
 *
 *   const records = runInEnvelopeSync(toyEl, () => handler.run(toyEl))
 *   commitEnvelope(ydoc, records)
 *
 * or, as one call:
 *
 *   runToyHandlerSync(ydoc, yToys, layerEl, toyEl, () => handler.run(toyEl))
 *
 * Neither form re-renders. In the app, rendering is the Yjs observer's job
 * — it already runs synchronously inside commitEnvelope's transaction and
 * rewires click handling that a bare re-render here would miss (see the
 * note above runToyHandlerSync). Callers with no such observer can render
 * explicitly via renderAfterCommit.
 *
 * Benefits to this design:
   - a MutationObserver is transparent (handler code is unmodified, ordinary
     DOM code),
   - gets geometry right for free (getBBox etc. all keep working)
   - doesn't need escape-proofing like a proxy wrapper
 *
 * Handlers are synchronous only — no await, no setTimeout, no fetch, no
 * promise. runInEnvelopeSync throws if a handler returns a thenable.
 */

import * as Y from 'yjs'
import { yNodeFor, registerYNode, render as renderToysLayer } from './toys.js'
import { domToY } from './storage.js'
import { serialize as serializeRecords } from './op_wire_mutation.js'
import { appendOp } from './op_dag.js'
import { isReplaying } from './op_replay.js'
import { ENVELOPE_ORIGIN, LIFECYCLE_ORIGIN } from './origins.js'

const XLINK_NS = 'http://www.w3.org/1999/xlink'

// ── Yjs transaction origins ──────────────────────────────────
//
// Every envelope commit tags its Yjs transaction with an origin so the
// UndoManager can decide what belongs on the undo stack.
// Re-exported here since most callers already import LIFECYCLE_ORIGIN from
// this module.
export { ENVELOPE_ORIGIN, LIFECYCLE_ORIGIN }

const MUTATION_OPTS = {
  attributes:            true,
  attributeOldValue:     true,
  childList:             true,
  subtree:               true,
  characterData:         true,
  characterDataOldValue: true,
}

// ── raw mutation capture ──────────────────────────────────────────────

/**
 * Run fn() while watching the toys layer for DOM mutations, then return the
 * raw MutationRecord[] produced. No Yjs translation happens here.
 *
 * Observes the enclosing #toys-layer element — found via closest() from
 * toyEl, so a handler reaching anywhere else in the layer (a die grabbing
 * a sibling die, a tray reaching into a contained toy) is still captured.
 *
 * Synchronous handlers only: if fn returns a thenable we throw rather than
 * silently drop the mutations it would make after its first await — a loud
 * failure, not a silent fallback.
 */
export function runInEnvelopeSync(toyEl, fn) {
  // Applying a peer's operation mutates our DOM too; capturing that would
  // make two peers generate operations at each other forever.
  if (isReplaying()) {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelopeSync: handler returned a Promise; synchronous handlers only')
    }
    return []
  }
  // scopeEl falls back to toyEl's parent, then toyEl itself, to support
  // e.g. a detached toy in a unit test
  const scopeEl = toyEl.closest?.('#toys-layer') ?? toyEl.parentNode ?? toyEl
  const records = []
  const observer = new MutationObserver(muts => records.push(...muts))
  observer.observe(scopeEl, MUTATION_OPTS)
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelopeSync: handler returned a Promise; synchronous handlers only')
    }
  } finally {
    records.push(...observer.takeRecords())
    observer.disconnect()
  }
  return records
}

// ── translation, easy cases ───────────────────────────────────────────

// The Yjs tree stores xlink:href under the literal key "xlink:href",
// not split by namespace — mirror that convention in reverse here.
function yAttrKey(record) {
  return record.attributeNamespace === XLINK_NS
    ? `xlink:${record.attributeName}`
    : record.attributeName
}

function currentAttrValue(el, record) {
  return record.attributeNamespace
    ? el.getAttributeNS(record.attributeNamespace, record.attributeName)
    : el.getAttribute(record.attributeName)
}

function applyAttributeRecord(record) {
  const yEl = yNodeFor(record.target)
  if (!yEl) return false
  const newVal = currentAttrValue(record.target, record)
  const key    = yAttrKey(record)
  if (newVal === null) yEl.removeAttribute(key)
  else                 yEl.setAttribute(key, newVal)
  return true
}

function applyCharacterDataRecord(record) {
  const yText = yNodeFor(record.target)
  if (!yText) return false
  const newVal = record.target.data ?? ''
  yText.delete(0, yText.length)
  if (newVal) yText.insert(0, newVal)
  return true
}

// ── translation, structural cases ─────────────────────────────────────

// Mirrors domToY's own node-type filter (storage.js), so DOM-index →
// Y-index counting lines up with what domToY actually produced.
function isMirrorable(node) {
  if (node.nodeType === Node.ELEMENT_NODE) return true
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    return node.textContent.trim() !== ''
  }
  return false
}

// domToY() converts a whole subtree in one call, so nothing gets registered
// in the yNode ↔ DOM WeakMap along the way. Walk the two trees in lockstep
// afterwards and register every corresponding pair, so later mutations
// against nodes deeper in a handler-created subtree (e.g. a follow-up
// setAttribute on a freshly-appended child) can still resolve back to Yjs.
function registerTree(domNode, yNode) {
  registerYNode(domNode, yNode)
  if (!(yNode instanceof Y.XmlElement)) return
  const yChildren   = yNode.toArray()
  const domChildren = Array.from(domNode.childNodes).filter(isMirrorable)
  domChildren.forEach((domChild, i) => {
    if (yChildren[i]) registerTree(domChild, yChildren[i])
  })
}

// Y-index for domNode's position among parentDom.childNodes: the count of
// preceding siblings that are already registered in the yNode ↔ DOM registry.
// Unregistered siblings (whitespace text, comments, …) are skipped, matching
// what domToY would have produced for the parent already.
// Y-index for inserting domNode into yParent. Anchored on the nearest DOM
// sibling (in either direction) that's already registered in the yNode↔DOM
// registry, rather than counted from raw DOM position — mirror() skips
// <script> nodes, so a toy's Y children and its mirrored DOM children can
// diverge in length. Counting mirrored DOM siblings alone would miscompute
// the index whenever an unmirrored node (a <script>) sits before the
// insertion point: inserting before the first *visible* child would land
// at Y-index 0, ahead of that <script>, instead of the correct index 1.
// Preferring the next sibling (insert-before semantics, matching
// insertBefore/appendChild) also means an appended-at-the-end node lands
// after any trailing unmirrored siblings too, not just the visible ones.
function yInsertIndex(yParent, domNode) {
  for (let next = domNode.nextSibling; next; next = next.nextSibling) {
    const yNext = yNodeFor(next)
    if (!yNext) continue
    const idx = yParent.toArray().indexOf(yNext)
    if (idx !== -1) return idx
  }
  return yParent.length
}

function applyChildListRecord(record) {
  const yParent = yNodeFor(record.target)
  if (!yParent) return false

  // Removals first, so the addition index math below reflects the tree as
  // it stands right now rather than as it stood before this record's removals.
  for (const domNode of record.removedNodes) {
    const yNode = yNodeFor(domNode)
    if (!yNode) continue
    const idx = yParent.toArray().indexOf(yNode)
    if (idx !== -1) yParent.delete(idx, 1)
  }

  // Additions, in DOM order, so a handler that appends several children in
  // one go lands them in the right order even though each yInsertIndex call
  // depends on the previous addition already being registered.
  // registerTree runs AFTER insertion: a still-detached Y.XmlElement's
  // toArray() silently returns empty, so walking its children for 
  // registration only works once it's actually attached to the doc.
  for (const domNode of record.addedNodes) {
    const yNode = domToY(domNode)
    if (!yNode) continue
    const idx = yInsertIndex(yParent, domNode)
    yParent.insert(idx, [yNode])
    registerTree(domNode, yNode)
  }
  return true
}

function applyRecord(record) {
  if      (record.type === 'attributes')    return applyAttributeRecord(record)
  else if (record.type === 'characterData') return applyCharacterDataRecord(record)
  else if (record.type === 'childList')     return applyChildListRecord(record)
  return false
}

// ── commit ───────────────────────────────────────────────────────────────

/**
 * Translate a MutationRecord[] (as produced by runInEnvelopeSync) into a
 * single Yjs transaction tagged with an origin.
 *
 * Returns { applied } — applied is the record count.
 */
export function commitEnvelope(ydoc, records, opts = {}) {
  const origin = opts.origin ?? ENVELOPE_ORIGIN

  ydoc.transact(() => {
    for (const record of records) applyRecord(record)
  }, origin)

  return { applied: records.length }
}

/**
 * Turn a captured batch into an operation and append it to the log.
 * parents is the head this gesture was made against; the caller advances
 * its own head to the returned op's id.
 *
 * Returns null for an empty batch — a gesture that changed nothing is not
 * an operation.
 */
export function commitGesture(ydoc, records, { gesture = 'gesture', authorId = null, parents = [], id, ts } = {}) {
  const mutations = serializeRecords(records)
  if (!mutations.length) return null

  const op = {
    id: id ?? mintOpId(),
    parents: parents.filter(p => p != null),
    authorId,
    gesture,
    mutations,
    ts: ts ?? Date.now(),
  }
  appendOp(ydoc, op)
  return op
}

let _opCounter = 0
const mintOpId = () =>
  `tt-op-${Date.now().toString(36)}-${(_opCounter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

// ── post-commit render policy ─────────────────────────────────────────
//
// commitEnvelope's ydoc.transact(...) fires every observer registered on
// yToys — including the app's own toys-layer observer — synchronously,
// before transact() returns. In the app, that observer already rebuilds
// the layer *and* rewires click handling for the new elements. A second,
// bare rebuild here would run after that one, replacing its output with
// elements nothing has attached listeners to — the toy would go dead to
// clicks until some unrelated change happened to re-render it again.
//
// So runToyHandlerSync does not render on its own: rendering is owned by
// whatever is watching the Yjs doc. A caller with no such observer
// (a standalone script, a test) can still render explicitly — that's
// what renderAfterCommit is for — but it's opt-in, not automatic.

/**
 * Re-render the toys layer from Yjs. Exposed for callers with no Yjs
 * observer of their own driving renders (tests, standalone scripts) — the
 * live app relies on its own toys-layer observer instead; see the note
 * above runToyHandlerSync.
 */
export function renderAfterCommit(yToys, layerEl) {
  renderToysLayer(yToys, layerEl)
}

// ── convenience: the whole pipeline in one call ─────────────────────────────

/**
 * Run a synchronous toy handler under the envelope and commit its
 * mutations in one transaction, all on the current tick. commitEnvelope is
 * already synchronous, so when this is called from inside an already-open
 * ydoc.transact, its commit nests and collapses into that transaction.
 * Throws if fn is async.
 *
 * layerEl is accepted so callers already holding it don't need a separate
 * import just to pass it elsewhere; it's currently unused here.
 */
export function runToyHandlerSync(ydoc, yToys, layerEl, toyEl, fn, opts = {}) {
  const records = runInEnvelopeSync(toyEl, fn)
  return commitEnvelope(ydoc, records, opts)
}
