/**
 * op_layers.js — the registry of op layers.
 *
 * An op layer is one DAG: its own ops map, checkpoint content map, local
 * tips, checkpoints and pruning. A layer is described once, by data, and
 * the op machinery reads the descriptor; no op_*.js file knows which layers
 * exist. An op never belongs to two layers, and a gesture never spans two.
 *
 * Descriptor {
 *   name, selector, layerDataId,
 *   opsKey, contentKey,           // names of the layer's two Y.Maps
 *   headKey(tableId), mergeKey(tableId),   // per-table localStorage keys
 *   hooks: {
 *     afterCapture(records, layerEl, opts) → more records, captured inside
 *                                            the gesture's own op
 *     afterProject(ydoc, layerEl)          → runs after any projection,
 *                                            rebuild or adopt
 *   }
 * }
 */

/** Stamped on a layer's root element; the envelope scopes to it. */
export const LAYER_MARKER = 'data-op-layer'

const registry = new Map()

const NO_HOOKS = {
  afterCapture: () => [],
  afterProject: () => {},
}

export function defineOpLayer(desc) {
  for (const k of ['name', 'selector', 'layerDataId', 'opsKey', 'contentKey', 'headKey', 'mergeKey']) {
    if (!desc?.[k]) throw new Error(`defineOpLayer: ${k} is required`)
  }
  const layer = Object.freeze({ ...desc, hooks: { ...NO_HOOKS, ...(desc.hooks ?? {}) } })
  registry.set(layer.name, layer)
  return layer
}

export function getOpLayer(name) {
  const layer = registry.get(name)
  if (!layer) throw new Error(`getOpLayer: no op layer named "${name}"`)
  return layer
}

export const opLayers = () => [...registry.values()]

/** The name of the layer a root element was stamped for, for trace events. */
export const layerNameOf = (layerEl) => layerEl?.getAttribute?.(LAYER_MARKER) ?? null

/**
 * Stamp the layer's root element with its data-id (what checkpoint content
 * targets) and the marker the envelope scopes to. Returns layerEl.
 */
export function ensureLayerId(layerEl, layer) {
  if (!layerEl) return layerEl
  if (!layerEl.getAttribute('data-id')) layerEl.setAttribute('data-id', layer.layerDataId)
  if (layerEl.getAttribute(LAYER_MARKER) !== layer.name) layerEl.setAttribute(LAYER_MARKER, layer.name)
  return layerEl
}
