/**
 * envelope.js — mutation capture & translation for toy handler code
 *
 * We want to enable toy behaviour scripts (sometimes written by users),
 * and provide a sensible, standard surface to write those scripts against,
 * so {plain JavaScript + the DOM} is the clear winner.
 *
 * Toy behaviour scripts (dice, trays, tokens, ...) run against the
 * mirrored (live) DOM of their toy.
 *
 * But the Yjs tree, not the DOM, is the canonical document, so how do we
 * square this? Answer: runInEnvelope lets a handler mutate the DOM as if
 * it owned it, then translates whatever it did back into a single Yjs
 * transaction:
 *
 *   const records = await runInEnvelope(toyEl, () => handler.run(toyEl))
 *   commitEnvelope(ydoc, toyEl, records)
 *
 * or, as one call:
 *
 *   await runToyHandler(ydoc, yToys, layerEl, toyEl, () => handler.run(toyEl))
 *
 * Neither form re-renders. In the app, rendering is the Yjs observer's job
 * — it already runs synchronously inside commitEnvelope's transaction and
 * rewires click handling that a bare re-render here would miss (see the
 * note above runToyHandler). Callers with no such observer can render
 * explicitly via renderAfterCommit.
 *
 * Benefits to this design:
   - a MutationObserver is transparent (handler code is unmodified, ordinary
     DOM code),
   - gets geometry right for free (getBBox etc. all keep working)
   - doesn't need escape-proofing like a proxy wrapper
 */

import * as Y from 'yjs'
import { yNodeFor, registerYNode, render as renderToysLayer } from './toys.js'
import { domToY } from './storage.js'

const XLINK_NS = 'http://www.w3.org/1999/xlink'

// ── Yjs transaction origins ──────────────────────────────────
//
// Every envelope commit tags its Yjs transaction with an origin so the
// UndoManager can decide what belongs on the undo stack.
//
//   ENVELOPE_ORIGIN — a toy handler ran: a die's Roll, a tray's Roll All.
//
//   DERIVED_ORIGIN — a tray recomputed its own elements due to something
//     in its contents_group changing.
//
//   LIFECYCLE_ORIGIN — a toy's one-time initialize() side effects at
//     placement. If the placement is undone the whole toy is removed, so
//     these writes never need an independent undo step either. Untracked.
//
export const ENVELOPE_ORIGIN  = 'envelope'
export const DERIVED_ORIGIN   = 'toy-derived'
export const LIFECYCLE_ORIGIN = 'toy-lifecycle'

// Diagnostic strictness — opt-in via ?debug=1 in the URL, same convention as
// app.js. A function (not a cached const) so tests can toggle it per-case
// via history.pushState, and callers can override via opts.debug.
function urlDebugFlag() {
  return typeof location !== 'undefined'
    && new URLSearchParams(location.search).get('debug') === '1'
}

const MUTATION_OPTS = {
  attributes:            true,
  attributeOldValue:     true,
  childList:             true,
  subtree:               true,
  characterData:         true,
  characterDataOldValue: true,
}

// ── raw mutation capture ──────────────────────────────────────────────

// Tracks whether any envelope is currently open. Not yet consumed anywhere:
// the intent is for app.js's toys-layer observer to defer a remote-origin
// render while a local async handler's envelope is still open, rather than
// tearing the DOM out from under it mid-handler. TODO: wire that check in.
let _openCount = 0
export function isEnvelopeOpen() {
  return _openCount > 0
}

/**
 * Run fn() while watching the toys layer for DOM mutations, then return the
 * raw MutationRecord[] produced. No Yjs translation happens here.
 *
 * Observes the enclosing #toys-layer element — found via closest(),
 * so that a * handler reaching outside its own toy,
 * e.g. a dice grabbing a sibling dice, or reaching up and out of its'
 * containing tray, is still captured for scope enforcement in commitEnvelope.
 *
 * Async note:
 * the async contract lives here: if fn() returns a Promise, it's awaited
 * before the observer is disconnected, so mutations made after later
 * `await`s inside the handler are still captured. Records are accumulated
 * via the observer callback (not just takeRecords()), otherwise a pending
 * microtask callback would silently drain the queue between awaits.
 *
 * TODO: Let's walk that back. I've decided async "user" code is a bad idea.
 *       Disallow async code in fn.
 *
 */
export async function runInEnvelope(toyEl, fn) {
  // scopeEl falls back to toyEl's parent, then toyEl itself, to support
  // e.g. a detached toy in a unit test
  const scopeEl = toyEl.closest?.('#toys-layer') ?? toyEl.parentNode ?? toyEl
  const records = []
  const observer = new MutationObserver(muts => records.push(...muts))
  observer.observe(scopeEl, MUTATION_OPTS)
  _openCount++
  try {
    const result = fn()
    if (result && typeof result.then === 'function') await result
  } finally {
    records.push(...observer.takeRecords())
    observer.disconnect()
    _openCount--
  }
  return records
}

/**
 * Synchronous sibling of runInEnvelope: run fn() while watching the toys
 * layer, then return the raw MutationRecord[] with no Promise in between.
 *
 * runInEnvelope is async only so it can await an async handler; but its body
 * already runs synchronously for a synchronous fn (the records are gathered
 * before it returns), so the only thing the async wrapper adds for a sync
 * handler is a microtask before the caller sees the records. That microtask
 * is exactly what breaks nested-transaction collapse: a reaction committed a
 * microtask later lands in its OWN Yjs transaction rather than folding into
 * the one that triggered it (see concurrency_branching.md / TODO #11). This
 * variant keeps everything on the current tick so commitEnvelope's transact
 * can nest into an already-open one.
 *
 * Synchronous handlers only: if fn returns a thenable we throw rather than
 * silently drop the mutations it would make after its first await. That is
 * the "no async handler code" regulation the branching design depends on —
 * a loud failure, not a silent fallback.
 */
export function runInEnvelopeSync(toyEl, fn) {
  const scopeEl = toyEl.closest?.('#toys-layer') ?? toyEl.parentNode ?? toyEl
  const records = []
  const observer = new MutationObserver(muts => records.push(...muts))
  observer.observe(scopeEl, MUTATION_OPTS)
  _openCount++
  try {
    const result = fn()
    if (result && typeof result.then === 'function') {
      throw new Error('[envelope] runInEnvelopeSync: handler returned a Promise; synchronous handlers only')
    }
  } finally {
    records.push(...observer.takeRecords())
    observer.disconnect()
    _openCount--
  }
  return records
}

// ── scope enforcement ─────────────────────────────────────────────────

function isInScope(toyEl, node) {
  return node === toyEl || toyEl.contains(node)
}

function revertAttributeRecord(record) {
  const { target, attributeName, attributeNamespace, oldValue } = record
  if (attributeNamespace) {
    if (oldValue === null) target.removeAttributeNS(attributeNamespace, attributeName)
    else                    target.setAttributeNS(attributeNamespace, attributeName, oldValue)
  } else {
    if (oldValue === null) target.removeAttribute(attributeName)
    else                    target.setAttribute(attributeName, oldValue)
  }
}

function revertCharacterDataRecord(record) {
  record.target.data = record.oldValue ?? ''
}

function revertChildListRecord(record) {
  record.addedNodes.forEach(n => { n.parentNode?.removeChild(n) })
  record.removedNodes.forEach(n => { record.target.insertBefore(n, record.nextSibling) })
}

function revertRecord(record) {
  if      (record.type === 'attributes')    revertAttributeRecord(record)
  else if (record.type === 'characterData') revertCharacterDataRecord(record)
  else if (record.type === 'childList')     revertChildListRecord(record)
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
  // toArray() silently returns empty (see toys.js notes on detached
  // fragments), so walking its children for registration only works once
  // it's actually attached to the doc.
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
 * Translate a MutationRecord[] (as produced by runInEnvelope) into a single
 * Yjs transaction tagged with an origin. Records whose target falls
 * outside toyEl's own subtree are never translated — they're reverted on
 * the DOM (using the record's old value) and logged loudly instead, treating
 * a toy mutating another toy as a bug, for now (will be valid in the future)
 *
 * Pass { debug: true } (or run with ?debug=1 in the URL) to also throw once
 * any out-of-scope mutations were found, after all of them have been
 * reverted — useful during toy-script development.
 *
 * Returns { applied, violations } — violations is the list of reverted
 * out-of-scope records, for callers that want to surface something to the
 * user beyond the console warning.
 */
export function commitEnvelope(ydoc, toyEl, records, opts = {}) {
  const debug      = opts.debug ?? urlDebugFlag()
  const origin     = opts.origin ?? ENVELOPE_ORIGIN
  const violations = []

  ydoc.transact(() => {
    for (const record of records) {
      if (!isInScope(toyEl, record.target)) {
        violations.push(record)
        continue
      }
      applyRecord(record)
    }
  }, origin)

  // Reverse order: each record's oldValue/nextSibling is only correct
  // relative to the state right before that mutation happened. Reverting
  // forward would, e.g., leave an attribute at an intermediate value instead
  // of the pre-envelope one, or hand insertBefore a nextSibling reference
  // that a later (but earlier-reverted) record already detached.
  for (const record of [...violations].reverse()) {
    console.warn('[envelope] reverting out-of-scope mutation from toy handler', record)
    revertRecord(record)
  }
  if (debug && violations.length) {
    throw new Error(`[envelope] ${violations.length} out-of-scope mutation(s) from toy handler`)
  }

  return { applied: records.length - violations.length, violations }
}

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
// So runToyHandler does not render on its own: rendering is owned by
// whatever is watching the Yjs doc. A caller with no such observer
// (a standalone script, a test) can still render explicitly — that's
// what renderAfterCommit is for — but it's opt-in, not automatic.

/**
 * Re-render the toys layer from Yjs. Exposed for callers with no Yjs
 * observer of their own driving renders (tests, standalone scripts) — the
 * live app relies on its own toys-layer observer instead; see the note
 * above runToyHandler.
 */
export function renderAfterCommit(yToys, layerEl) {
  renderToysLayer(yToys, layerEl)
}

// ── convenience: the whole pipeline in one call ─────────────────────────────

/**
 * Run a toy handler under the envelope and translate its mutations into a
 * single Yjs transaction. Does not render — see the note above
 * renderAfterCommit for why. layerEl is accepted (rather than dropped from
 * the signature) so callers already holding it don't need a separate
 * import just to pass it elsewhere; it's currently unused here.
 */
export async function runToyHandler(ydoc, yToys, layerEl, toyEl, fn, opts = {}) {
  const records = await runInEnvelope(toyEl, fn)
  return commitEnvelope(ydoc, toyEl, records, opts)
}

/**
 * Synchronous sibling of runToyHandler. Same contract, no Promise: run a
 * synchronous handler under the envelope and commit its mutations in one
 * transaction, all on the current tick. commitEnvelope is already
 * synchronous — the only async link was runInEnvelope, replaced here by
 * runInEnvelopeSync — so when this is called from inside an already-open
 * ydoc.transact, its commit nests and collapses into that transaction (see
 * concurrency_branching.md / TODO #11). Throws if fn is async.
 */
export function runToyHandlerSync(ydoc, yToys, layerEl, toyEl, fn, opts = {}) {
  const records = runInEnvelopeSync(toyEl, fn)
  return commitEnvelope(ydoc, toyEl, records, opts)
}
