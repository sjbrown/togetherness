/**
 * toy-scripts.js — script extraction + evaluation for the toy contract
 *
 * Phase 3 preserved <script> nodes in the Yjs/SVG tree as inert document
 * citizens: they're part of the canonical document (round-trip safely
 * through export/import) but toys.js's mirror() never renders them into the
 * live DOM, so nothing executes on its own. This module is the activation
 * step: given a placed toy's Yjs tree, pull its script nodes out and run
 * them, once per toy type.
 *
 * "Once per toy type" (not once per instance): scripts define namespaces
 * (`var d6 = {...}`) that describe *behaviour*, identical for every d6 on
 * the table. Re-running them per-instance would be wasted work at best and
 * would stomp shared namespace objects (like `dice`, referenced by every
 * die type) at worst.
 *
 * Two script shapes, mirroring archive2025's toy files:
 *   - external:  <script src="js/dice_utils.js" data-namespace="dice"/>
 *                fetched once and evaluated once, deduped by URL — several
 *                toy types can share one helper namespace (dice_utils.js is
 *                pulled in by every die type) without re-fetching or
 *                re-evaluating it.
 *   - inline:    <script data-namespace="d6"><![CDATA[ var d6 = {...} ]]></script>
 *                evaluated directly from its CDATA text, once per toy type.
 *
 * Scripts are evaluated via indirect eval so top-level `var` declarations
 * land on globalThis exactly as they would from a real <script> tag — a
 * direct eval() call would instead run in this module's local scope. This
 * mirrors the "plain JavaScript + the DOM" contract described in
 * envelope.js: toy scripts are ordinary, unmodified JS.
 */
import * as Y from 'yjs'

// ── activation state ────────────────────────────────────────────────────────
// All module-level, and intentionally page-lifetime: namespaces are a
// window-global side effect, so activating a toy type twice in one session
// is meaningless work, not a correctness issue to guard per Y.Doc.

const _activatedTypes     = new Set()   // toyType -> settled (activation finished)
const _activationPromises = new Map()   // toyType -> in-flight/settled activation Promise
const _seenUrls           = new Set()   // resolved script URL -> already fetched+evaluated
const _namespacesByType   = new Map()   // toyType -> string[] (data-namespace values, in script order)

/** Test-only: reset all module-level activation state. */
export function _resetToyScriptState() {
  _activatedTypes.clear()
  _activationPromises.clear()
  _seenUrls.clear()
  _namespacesByType.clear()
}

/** Namespaces registered by a toy type's scripts, or [] if not yet activated. */
export function getNamespacesForType(toyType) {
  return _namespacesByType.get(toyType) ?? []
}

/** Whether a toy type's scripts have already been evaluated this session. */
export function isToyTypeActivated(toyType) {
  return _activatedTypes.has(toyType)
}

// ── extraction ───────────────────────────────────────────────────────────────

// yEl must be attached to a Y.Doc — toArray() on a detached fragment
// silently returns empty (see toys.js notes on this same gotcha).
function findScriptNodes(yEl, results = []) {
  if (!(yEl instanceof Y.XmlElement)) return results
  if (yEl.nodeName === 'script') results.push(yEl)
  for (const child of yEl.toArray()) findScriptNodes(child, results)
  return results
}

function inlineScriptText(yScript) {
  return yScript.toArray()
    .filter(c => c instanceof Y.XmlText)
    .map(c => c.toString())
    .join('')
}

function recordNamespace(toyType, namespace) {
  if (!namespace) return
  const list = _namespacesByType.get(toyType) ?? []
  if (!list.includes(namespace)) list.push(namespace)
  _namespacesByType.set(toyType, list)
}

// Indirect eval — see module doc comment for why this isn't a direct eval() call.
function evalGlobal(code) {
  ;(0, eval)(code)
}

async function activateScript(yScript, toyType) {
  recordNamespace(toyType, yScript.getAttribute('data-namespace'))

  const src = yScript.getAttribute('src')
  if (src) {
    // Toy script sources are relative to the toy's own file, which addToy
    // fetches from /toy/<file> — mirror that root so a toy's
    // src="js/dice_utils.js" resolves the same way its parent SVG did.
    const url = `/toy/${src}`
    if (_seenUrls.has(url)) return
    _seenUrls.add(url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`failed to load toy script ${url}: ${res.status}`)
    evalGlobal(await res.text())
  } else {
    const code = inlineScriptText(yScript)
    if (code.trim()) evalGlobal(code)
  }
}

/**
 * Extract and evaluate every <script> node in a placed toy's Yjs tree, once
 * per toy type. Safe to call for every rendered instance, and safe to call
 * concurrently — every caller for the same toyType gets back the *same*
 * Promise, so whichever call started the work, a later caller that needs
 * to know activation has actually finished (not just started) can await
 * this return value rather than relying on isToyTypeActivated(), which
 * only reflects a settled Promise. (This matters for Phase 4.5's
 * initialize() hook: toys.js's render() kicks activation off
 * fire-and-forget, but app.js's placement flow needs to await the real
 * completion before it can look up a namespace's initialize function.)
 *
 * yToyEl is the toy's <g> wrapper (or any attached node in its tree);
 * toyType is the value of its data-toy-type attribute.
 */
export function activateToyScripts(yToyEl, toyType) {
  if (!toyType) return Promise.resolve()
  const existing = _activationPromises.get(toyType)
  if (existing) return existing

  const promise = (async () => {
    for (const yScript of findScriptNodes(yToyEl)) {
      await activateScript(yScript, toyType)
    }
    _activatedTypes.add(toyType)
  })()
  _activationPromises.set(toyType, promise)
  return promise
}
