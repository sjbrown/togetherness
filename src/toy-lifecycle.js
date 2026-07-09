/**
 * toy-lifecycle.js — per-instance lifecycle hooks for the toy contract
 *
 * Phase 4.1's script activation runs once per toy TYPE (whichever instance
 * happens to trigger it first). Phase 4.3's menu actions run whenever the
 * user invokes one. initialize(elem) is a third shape: it runs exactly
 * once per toy INSTANCE, at the moment that instance is placed — never
 * again for that instance, and never for a toy loaded from a saved
 * document or synced in from a remote peer, since those toys already went
 * through initialize() once, in whichever session first placed them.
 *
 * archive2025's initialize(elem, prototype) took a second argument: a
 * reference DOM node to copy config from, feeding its own config-dialog
 * flow (pick options, then clone them onto the placed instance).  Master
 * doesn't have that flow — a placed toy's initial state comes from its
 * ttState options (Tools panel / addQuick), set before placement — so
 * `prototype` is deliberately never passed here. A namespace's own
 * initialize(elem, prototype) simply receives undefined for it; d6's
 * `if (!prototype) return` is exactly the guard archive2025 authors
 * already needed for that case, so nothing extra is required of them.
 */
import { runToyHandler } from './envelope.js'
import { getNamespacesForType } from './toy-scripts.js'

/**
 * Run every activated namespace's initialize(elem), if present, for a
 * freshly placed toy — inside an envelope, so any DOM mutations
 * initialize() makes commit to Yjs like any other handler.
 *
 * Callers must ensure the toy's namespaces are already activated (see
 * toy-scripts.js's activateToyScripts) before calling this — initialize()
 * reads namespaces off getNamespacesForType() directly, and an
 * uninitialized/still-loading namespace here would simply mean nothing to
 * call, not an error.
 *
 * Callers are also responsible for only calling this once, at genuine
 * placement (see app.js's commitToy) — this module has no per-instance
 * "already initialized" state to guard against a second call itself,
 * unlike toy-scripts.js's per-type tracking.
 */
export async function initializeToy(ydoc, yToys, layerEl, svgEl, toyType) {
  const initializers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.initialize === 'function')
  if (!initializers.length) return

  await runToyHandler(ydoc, yToys, layerEl, svgEl, () => {
    initializers.forEach(ns => ns.initialize(svgEl))
  })
}
