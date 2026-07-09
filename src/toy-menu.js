/**
 * toy-menu.js — menu/action surface for the toy contract
 *
 * An activated toy namespace (toy-scripts.js) may expose a `menu` object:
 *
 *   var d6 = {
 *     menu: {
 *       'Roll': {
 *         eventName: 'die_roll',
 *         applicable: (dieNode) => true,
 *         handler: function (evt) { return dice.roll_handler(this, 6) },
 *       },
 *       'Turn Up': {
 *         eventName: 'die_turn_up',
 *         applicable: (dieNode) => true,
 *         uiLabel: (dieNode) => `Turn to ${next(dieNode)}`,
 *         handler: function (evt) { return dice.turn_handler(this, 6) },
 *       },
 *     },
 *   }
 *
 * This module turns that convention into two things app.js/ui.js can use
 * without knowing anything about toy internals:
 *
 *   - getMenuActions(svgEl)  — the toy's currently-applicable actions, as
 *                              plain data (no functions), for rendering.
 *   - invokeMenuAction(...)  — runs a chosen action's handler inside an
 *                              envelope (envelope.js) and commits the
 *                              result to Yjs.
 *
 * Menu entries are read live off `window[namespace]` on every call — toy
 * scripts are evaluated once (toy-scripts.js), but their `menu` object is
 * re-read fresh each time getMenuActions()/invokeMenuAction() runs, so a
 * script that mutates its own menu at runtime is respected without this
 * module needing to know.
 */
import { runToyHandler } from './envelope.js'
import { getNamespacesForType } from './toy-scripts.js'

// A toy's namespaces are read in the order toy-scripts.js recorded them
// (i.e. script order in the SVG source), so menu entries appear in a
// stable, predictable order across renders.
function namespacesFor(toyType) {
  return getNamespacesForType(toyType)
    .map(name => ({ name, ns: globalThis[name] }))
    .filter(({ ns }) => ns && typeof ns === 'object' && ns.menu)
}

/**
 * The toy's currently-applicable menu actions, as plain data:
 *   { namespace, key, eventName, label }[]
 *
 * `applicable(svgEl)` is evaluated now, at read time — entries whose
 * applicable() returns false are omitted entirely, not just disabled
 * ("applicable filters" per the toy contract). Entries with no applicable
 * are always included. `label` resolves uiLabel (string or function(svgEl))
 * if present, falling back to the menu key itself.
 */
export function getMenuActions(svgEl) {
  const toyType = svgEl?.getAttribute?.('data-toy-type')
  if (!toyType) return []
  const actions = []
  for (const { name, ns } of namespacesFor(toyType)) {
    for (const [key, entry] of Object.entries(ns.menu)) {
      if (typeof entry.applicable === 'function' && !entry.applicable(svgEl)) continue
      const label = typeof entry.uiLabel === 'function' ? entry.uiLabel(svgEl)
                  : (entry.uiLabel ?? key)
      actions.push({ namespace: name, key, eventName: entry.eventName, label })
    }
  }
  return actions
}

/**
 * Invoke a toy's menu action by (namespace, key) — the identifiers
 * getMenuActions() handed back. Re-validates applicable() before running,
 * since UI state may be stale by the time the user clicks (another peer's
 * move could have changed the toy in between). Runs the handler inside an
 * envelope and commits its DOM mutations to Yjs as a single transaction —
 * see envelope.js's runToyHandler for the full pipeline.
 */
export async function invokeMenuAction(ydoc, yToys, layerEl, svgEl, namespace, key, evt) {
  const ns    = globalThis[namespace]
  const entry = ns?.menu?.[key]
  if (!entry || typeof entry.handler !== 'function') {
    throw new Error(`[toy-menu] no such menu action: ${namespace}.${key}`)
  }
  if (typeof entry.applicable === 'function' && !entry.applicable(svgEl)) {
    throw new Error(`[toy-menu] menu action not applicable: ${namespace}.${key}`)
  }
  return runToyHandler(ydoc, yToys, layerEl, svgEl, () => entry.handler.call(svgEl, evt))
}
