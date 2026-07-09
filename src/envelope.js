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
 *   Toys.render(yToys, layerEl)   // correctness by construction — see 3.6
 *
 * or, as one call:
 *
 *   await runToyHandler(ydoc, yToys, layerEl, toyEl, () => handler.run(toyEl))
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

// Tracks whether any envelope is currently open. This is a building block
// for the app.js-side render policy (Phase 4): while an async handler's
// envelope is open, remote-origin renders should be deferred rather than
// tearing the DOM mid-handler. Wiring that deferral into app.js's
// onToysChanged observer is out of scope for this commit — isEnvelopeOpen()
// just gives that future code something to check.
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
 * via the observer callback (not just takeRecords()) because a pending
 * microtask callback would otherwise silently drain the queue between
 * awaits.
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
 * Yjs transaction tagged with origin 'envelope'. Records whose target falls
 * outside toyEl's own subtree are never translated — they're reverted on
 * the DOM (using the record's old value) and logged loudly instead, treating
 * a toy mutating another toy as a bug, for now (may be considered valid in
 * the future)
 *
 * Pass { debug: true } (or run with ?debug=1 in the URL) to also throw once
 * any out-of-scope mutations were found, after all of them have been
 * reverted — useful during toy-script development, too disruptive for
 * normal play.
 *
 * Returns { applied, violations } — violations is the list of reverted
 * out-of-scope records, for callers that want to surface something to the
 * user beyond the console warning.
 */
export function commitEnvelope(ydoc, toyEl, records, opts = {}) {
  const debug      = opts.debug ?? urlDebugFlag()
  const violations = []

  ydoc.transact(() => {
    for (const record of records) {
      if (!isInScope(toyEl, record.target)) {
        violations.push(record)
        continue
      }
      applyRecord(record)
    }
  }, 'envelope')

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

/**
 * Re-render the toys layer from Yjs after an envelope commit. We don't try
 * to preserve whatever DOM state the handler's mutations left behind (e.g.
 * mid-flight animations) — correctness by construction, from the canonical
 * Yjs tree, wins over preserving transient DOM state. Incremental patching
 * (skip re-render when nothing actually changed, or when the transaction's
 * origin is 'envelope' and this client made it) is backlogged as perf work.
 */
export function renderAfterCommit(yToys, layerEl) {
  renderToysLayer(yToys, layerEl)
}

// ── convenience: the whole pipeline in one call ─────────────────────────────

/**
 * Run a toy handler under the envelope, translate its mutations into Yjs,
 * and re-render the toys layer from the resulting Yjs state. This is the
 * shape Phase 4 (script activation) will call for every handler invocation.
 */
export async function runToyHandler(ydoc, yToys, layerEl, toyEl, fn, opts = {}) {
  const records = await runInEnvelope(toyEl, fn)
  const result  = commitEnvelope(ydoc, toyEl, records, opts)
  renderAfterCommit(yToys, layerEl)
  return result
}
