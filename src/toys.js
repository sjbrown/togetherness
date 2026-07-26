/**
 * toys.js — the toys layer: tool registry, CRDT operations, and the toy
 * behaviour contract (script activation, menu actions, lifecycle hooks).
 *
 * Data model — same as the drawing layer: a Y.XmlFragment of Y.XmlElement.
 * The CRDT tree IS the SVG tree, so internal toy edits (recolor, flip,
 * contents) merge at the attribute/child level.
 *
 * yToys (XmlFragment)
 *  └─ <g class="toy" data-toy-id data-toy-type data-color>  ← placement + state
 *      └─ <svg x y width height viewBox>                    ← the live toy sub-document
 *          └─ ...toy content (defs, paths, tspans, <script>, ...)
 *      (optional)
 *          └─ ...class="contents_group"
 *            └─ ...toy content (dragged in sub-toys)
 *
 * A toy's <script> nodes are part of that canonical tree (preserved through
 * import/export) but are never mirrored into live DOM — see mirror() below.
 * Activating them (running the code, wiring up menu actions and lifecycle
 * hooks) is a separate step, in the "Toy behaviour contract" section
 *
 * ID format: tt-t-v1-XXXXX
 */
import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'
const ID_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHLMNPQRTUV2346789'

import { number, bool } from './tools-schema.js';
import { runToyHandler, runToyHandlerSync, runInEnvelopeSync, commitEnvelope, ENVELOPE_ORIGIN, DERIVED_ORIGIN, LIFECYCLE_ORIGIN } from './envelope.js';

// NOTE: envelope.js imports render()/yNodeFor()/registerYNode() from this
// file, so this is an intentional cycle — safe because neither side uses
// the other's bindings until a function runs later, well after both
// modules have finished loading.

// ── ID helpers ────────────────────────────────────────────────────────────────

function randomSlug(len = 5) {
  return Array.from({ length: len }, () =>
    ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  ).join('')
}

export function newToyId() {
  // tt (Togetherness Table) - t (toy) - v1 (version) - random slug
  return `tt-t-v1-${randomSlug()}`
}

const MIN_TOY_SIZE      = 30
const MAX_TOY_SIZE      = 420
const FALLBACK_TOY_SIZE = 64  // used when a dimension is missing/unparseable

function clampToySize(value) {
  const num = parseFloat(value)
  if (!Number.isFinite(num) || num < MIN_TOY_SIZE || num > MAX_TOY_SIZE) return FALLBACK_TOY_SIZE
  return num
}

// ── Color matrix ──────────────────────────────────────────────────────────────
// Recolorizes the toy's feColorMatrix filter to tint it with a new color
//
// The feColorMatrix "values" attribute is a 4×5 matrix applied to each pixel:
//   [R']   [r 0 0 0 0] [R]
//   [G'] = [g 0 0 0 0] [G]
//   [B']   [b 0 0 0 0] [B]
//   [A']   [0 0 0 1 0] [A]
//
// A white source pixel (1,1,1) becomes (r,g,b). Grey pixels scale linearly.
//
// If the color would be too dark (sum of RGB < 0.9), we boost it to 50%
// lightness so the black text stays visible.

/**
 * Convert HSL (degrees, percent, percent) to RGB in [0, 1].
 */
export function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/**
 * Build the 20-value feColorMatrix string that tints any grays SVG to `color`.
 * `color` must be a CSS color string. Accepts hsl(…), #rrggbb, or rgb(…).
 */
export function colorMatrixValues(color) {
  // Parse hsl(H, S%, L%) — our entityGradient always produces this format.
  const hslMatch = color.match(/hsl\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/)
  let r, g, b
  if (hslMatch) {
    ;[r, g, b] = hslToRgb(parseFloat(hslMatch[1]), parseFloat(hslMatch[2]), parseFloat(hslMatch[3]))
  } else {
    // Fallback: parse hex #rrggbb or #rgb
    const hex = color.replace('#', '')
    const full = hex.length === 3
      ? hex.split('').map(c => c + c).join('')
      : hex
    r = parseInt(full.slice(0,2), 16) / 255
    g = parseInt(full.slice(2,4), 16) / 255
    b = parseInt(full.slice(4,6), 16) / 255
  }
  // Boost very dark colors to 50% lightness so the marker stays visible
  if (r + g + b < 0.9) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    const hue = max === min ? 0
      : max === r ? ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6
      : max === g ? ((b - r) / (max - min) + 2) / 6
      :             ((r - g) / (max - min) + 4) / 6
    ;[r, g, b] = hslToRgb(hue * 360, 50, 50)
  }
  const f = v => v.toFixed(4)
  return `${f(r)} 0 0 0 0  ${f(g)} 0 0 0 0  ${f(b)} 0 0 0 0  0 0 0 1 0`
}

/**
 * Apply a color to all feColorMatrix nodes in the toy's Yjs tree.
 */
function applyColor(colorMatrices, color) {
  const values = colorMatrixValues(color)
  for (const matrix of colorMatrices) {
    matrix.setAttribute('values', values)
  }
}

// ── SVG import: DOM → Yjs XML ───────────────────────────────────────────────────

// Rewrite url(#id) references in an attribute value using the id map.
function rewriteUrlRefs(value, idMap) {
  return value.replace(/url\(#([^)\s]+)\)/g, (m, id) =>
    idMap.has(id) ? `url(#${idMap.get(id)})` : m)
}

// Recursively convert an SVG DOM element into a detached Y.XmlElement tree.
// - drops foreign-namespace elements/attrs (inkscape, sodipodi, dc, rdf, cc)
// - drops <script> nodes entirely — they never live in a toy's own
//   subtree; see "Script hoisting" below for where they actually go
// - namespaces every id and internal reference via idMap, so placed
//   instances don't collide on ids like #app-filter-colorize
// - if `refs` is given, collects direct refs to any feColorMatrix nodes
//   into refs.colorMatrices, since a detached tree can't be walked later
//   (toArray() throws until the tree is attached to a doc)
function elementToYXml(node, idMap, classAddMap, refs) {
  const yEl = new Y.XmlElement(node.localName)

  if (refs && node.localName === 'feColorMatrix') {
    refs.colorMatrices.push(yEl)
  }

  for (const attr of Array.from(node.attributes)) {
    // keep only SVG and xlink attributes
    if (attr.namespaceURI && attr.namespaceURI !== XLINK_NS) continue

    let value = attr.value
    if (attr.localName === 'id') {
      value = idMap.get(value) ?? value
    } else if (attr.localName === 'href' && value.startsWith('#')) {
      const ref = value.slice(1)
      if (idMap.has(ref)) value = '#' + idMap.get(ref)
    } else if (attr.localName === 'class') {
      // Add prefixed versions of special classnames alongside the originals.
      const classes = value.split(/\s+/).filter(Boolean)
      const allClasses = [...classes]
      for (const cls of classes) {
        if (classAddMap.has(cls)) {
          allClasses.push(classAddMap.get(cls))
        }
      }
      value = allClasses.join(' ')
    } else {
      value = rewriteUrlRefs(value, idMap)
    }
    yEl.setAttribute(attr.name, value)
  }

  const children = []
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) {                                   // ELEMENT_NODE
      if (child.namespaceURI && child.namespaceURI !== SVG_NS) continue
      if (child.localName === 'script') continue                  // hoisted, not embedded
      children.push(elementToYXml(child, idMap, classAddMap, refs))
    } else if (child.nodeType === 3 || child.nodeType === 4) {     // TEXT_NODE / CDATA_SECTION_NODE
      if (child.textContent.trim() !== '') children.push(new Y.XmlText(child.textContent))
    }
  }
  if (children.length) yEl.insert(0, children)
  return yEl
}

// ── Script hoisting ──────────────────────────────────────────────────────
//
// A toy's <script> tags never become part of its own Yjs subtree (see
// elementToYXml above). Two kinds, two different fates:
//   - src= (e.g. dice_utils.js) — never persisted at all. Fetched fresh off
//     the network every session (activateToyScripts, below), so whatever's
//     currently on disk is always what runs — freshness by construction,
//     no document involvement needed.
//   - inline (code lives nowhere but this one .svg template, e.g. d6's own
//     roll logic) — hoisted once into the document's own `scripts`
//     fragment, keyed by namespace, so a placed instance's behavior
//     survives even if this deployment's copy of the template is later
//     unreachable (a different deployment, a renamed/removed toyType, a
//     custom user-authored toy with no file on disk at all). One shared
//     copy per namespace, not one embedded copy per instance.
//
// Written once per document: if a namespace is already present, a later
// placement doesn't overwrite it. Two peers placing the very first-ever
// instance of a brand new toy type at the same moment could race and
// technically write different content for the same key (LWW) — accepted
// as an extremely rare edge case, not worth building conflict machinery
// for (an identical script from two provenances is the overwhelmingly
// common case, and isn't a conflict at all).

const SCRIPTS_KEY = 'scripts'

function getScriptsFragment(ydoc) {
  return ydoc.getXmlFragment(SCRIPTS_KEY)
}

/** Test-only: the document's hoisted-scripts fragment. */
export function _getScriptsFragment(ydoc) {
  return getScriptsFragment(ydoc)
}

/**
 * A toy SVG template's own <script> tags (direct children of the root
 * <svg> only — a template never has another toy's subtree nested inside
 * it the way a live, played-with document does), as plain data:
 * { namespace, src, code }[]. code is '' for a src-referenced script.
 */
export function extractScripts(root) {
  return Array.from(root.querySelectorAll(':scope > script')).map(el => ({
    namespace: el.getAttribute('data-namespace'),
    src:       el.getAttribute('src'),
    code:      el.getAttribute('src') ? '' : el.textContent,
  }))
}

/**
 * Hoist a template's inline scripts (src-referenced ones are skipped —
 * nothing to persist) into the document's scripts fragment, one per
 * namespace, only if that namespace isn't already present. Call from
 * inside the same transaction that places the toy.
 *
 * Records data-toy-type alongside data-namespace, so a foreign toyType —
 * one with no local TOY_TYPES entry, and therefore no file to fetch —
 * can still recover its own scripts later (see scriptsForType) by
 * filtering this fragment on toyType instead of activating by namespace
 * directly. Assumes inline namespace ↔ toyType is 1:1, true of every real
 * toy today (d6 only ever means dice_d6, tray_sum only ever means
 * tray_sum) — a future namespace shared inline across multiple toyTypes
 * would only be recoverable this way for whichever toyType hoisted it
 * first, same accepted-rare-edge-case tradeoff as the LWW collision itself.
 */
export function hoistInlineScripts(ydoc, toyType, scripts) {
  const yScripts = getScriptsFragment(ydoc)
  for (const { namespace, src, code } of scripts) {
    if (src || !namespace) continue
    if (yScripts.toArray().some(el => el.getAttribute('data-namespace') === namespace)) continue
    const yScript = new Y.XmlElement('script')
    yScript.setAttribute('data-namespace', namespace)
    yScript.setAttribute('data-toy-type', toyType)
    yScript.insert(0, [new Y.XmlText(code)])
    yScripts.insert(yScripts.length, [yScript])
  }
}

/**
 * Parse a toy SVG file's text into a detached Y.XmlElement rooted at <svg>
 *
 * Returns { ySvg, colorMatrices, width, height, scripts }
 */
export function svgTextToYXml(svgText, prefix) {
  const dom  = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = dom.documentElement

  // idMap is { 'foo': 'tt-t-v1-12a34__foo', 'bar': 'tt-t-v1-12a34__bar'}
  const idMap = new Map()
  for (const el of [root, ...root.querySelectorAll('[id]')]) {
    const id = el.getAttribute('id')
    if (id) idMap.set(id, prefix + id)
  }

  const classAddMap = new Map([
    ['contents_group', prefix + 'contents_group'],
    ['wh_follow_resize', prefix + 'wh_follow_resize'],
    ['tt_colored', prefix + 'tt_colored'],
    ['tt_color_filter', prefix + 'tt_color_filter'],
    ['tspan_name', prefix + 'tspan_name'],
    ['hit_plate', prefix + 'hit_plate'],
  ])

  const refs = { colorMatrices: [] }
  const ySvg = elementToYXml(root, idMap, classAddMap, refs)
  const width  = parseFloat(root.getAttribute('width'))  || 100
  const height = parseFloat(root.getAttribute('height')) || 100
  // Synthesize a viewBox from width/height if the file
  // lacks one (so display sizing scales the content).
  if (!root.getAttribute('viewBox')) {
    ySvg.setAttribute('viewBox', `0 0 ${width} ${height}`)
  }
  const scripts = extractScripts(root)
  return { ySvg, colorMatrices: refs.colorMatrices, width, height, scripts }
}

// ── Toy operations ────────────────────────────────────────────────────────────

// Cache of raw SVG text keyed by toy type. Populated on first fetch; subsequent
// placements of the same toy type skip the network round-trip and re-parse
// locally (cheap) instead of re-fetching (potentially slow / rate-limited).
const _svgTextCache = new Map()  // toyType → svgText string

/** Clear the SVG template cache. Intended for tests only. */
export function _clearSvgTextCache() { _svgTextCache.clear() }

/**
 * Place a toy on the table synchronously from already-fetched SVG text.
 * The cache must be warm for this toyType — call addToy() if unsure.
 * attrs: { id, toyType, x, y, color }  (x,y is the center point)
 */
export function addToySync(ydoc, yToys, attrs, svgText) {
  const { id, toyType, x, y, color } = attrs
  const prefix = `${id}__`
  const { ySvg, colorMatrices, width: nativeWidth, height: nativeHeight, scripts } = svgTextToYXml(svgText, prefix)

  // Tint the toy's colorize filter with the color before insertion.
  // The matrix values are set on the direct refs captured during import,
  // so the color is part of the CRDT state from the moment the toy is placed.
  if (color) applyColor(colorMatrices, color)

  ydoc.transact(() => {
    hoistInlineScripts(ydoc, toyType, scripts)

    const width  = clampToySize(nativeWidth)
    const height = clampToySize(nativeHeight)
    ySvg.setAttribute('x',      String(x - width / 2))
    ySvg.setAttribute('y',      String(y - height / 2))
    ySvg.setAttribute('width',  String(width))
    ySvg.setAttribute('height', String(height))

    const g = new Y.XmlElement('g')
    g.setAttribute('class',         'toy')
    g.setAttribute('data-toy-id',   id)
    g.setAttribute('data-toy-type', toyType)
    g.setAttribute('data-color',    color ?? '#888')
    g.insert(0, [ySvg])

    yToys.insert(yToys.length, [g])
  })
}

/**
 * Fetch a toyType's SVG template text, using/warming _svgTextCache.
 * Throws if toyType isn't registered in TOY_TYPES or the fetch fails.
 */
async function fetchToySvgText(toyType) {
  let svgText = _svgTextCache.get(toyType)
  if (svgText) return svgText
  const def = TOY_TYPES[toyType]
  if (!def) throw new Error(`unknown toy type: ${toyType}`)
  const res = await fetch(`/toy/${def.file}`)
  if (!res.ok) throw new Error(`failed to load ${def.file}: ${res.status}`)
  svgText = await res.text()
  _svgTextCache.set(toyType, svgText)
  return svgText
}

/**
 * Place a toy on the table. Fetches the toy's SVG file on first use and
 * caches it; subsequent placements of the same toy type are cache hits
 * attrs: { id, toyType, x, y, color }  (x,y is the center point)
 */
export async function addToy(ydoc, yToys, attrs) {
  const svgText = await fetchToySvgText(attrs.toyType)
  addToySync(ydoc, yToys, attrs, svgText)
}

/**
 * Whether a Y.XmlElement is a toy's wrapper:
    <g class="toy" data-toy-id data-toy-type>
 */
function isToyG(yEl) {
  if (!(yEl instanceof Y.XmlElement) || yEl.nodeName !== 'g') return false
  return (yEl.getAttribute('class') || '').split(/\s+/).includes('toy')
}


/**
 * Find all Y.XmlElement descendants of `yEl` that carry the
 * `className`
 *
 * Returns an array (possibly empty), in depth-first document order.
 */
function yClassSelector(yEl, className) {
  const matching = []
  const walk = (_yEl) => {
    for (const child of _yEl.toArray()) {
      if (!(child instanceof Y.XmlElement)) continue
      const classes = (child.getAttribute('class') || '').split(/\s+/).filter(Boolean)
      if (classes.includes(className)) matching.push(child)
      walk(child)
    }
  }
  walk(yEl)
  return matching
}

/**
 *   '#foo'              → { attr: 'id', value: 'foo' }
 *   '[data-foo="bar"]'  → { attr: 'data-foo', value: 'bar' }
 */
function parseYSelector(selector) {
  let m
  if ((m = selector.match(/^#(.+)$/))) return { attr: 'id', value: m[1] }
  if ((m = selector.match(/^\[([\w:-]+)="([^"]*)"\]$/))) return { attr: m[1], value: m[2] }
  throw new Error(`[toys] yExactSelector: unsupported selector: ${selector}`)
}

/**
 * Walk yEl (itself, then its descendants, depth-first) for the first
 * Y.XmlElement matching `selector`
 *  - id selector ('#foo')
 *  - exact-attribute selector ('[data-foo="bar"]')
 *
 * Returns:
 * posContext is false (default)
 *  - the matching Y.XmlElement (or null)
 * posContext is true
 *  - { yEl, parent, index } (or null)
 */
function yExactSelector(yEl, selector, posContext = false) {
  const { attr, value } = parseYSelector(selector)
  const matches = (el) => el instanceof Y.XmlElement && el.getAttribute(attr) === value

  if (matches(yEl)) {
    return posContext ? { yEl, parent: null, index: -1 } : yEl
  }

  const walk = (container) => {
    const children = container.toArray()
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!(child instanceof Y.XmlElement)) continue
      if (matches(child)) {
        return posContext ? { yEl: child, parent: container, index: i } : child
      }
      const found = walk(child)
      if (found) return found
    }
    return null
  }
  return walk(yEl)
}


/**
 * Remove a toy element from the DOM by id — searches the whole toys tree,
 * including nested. A DOM operation, like every other structural toy
 * mutation now. Call from inside runInEnvelope(Sync); this function
 * doesn't open its own envelope, so it composes with whatever else the
 * caller wants folded into the same transaction (a batch delete — see
 * app.js's deleteMultiSelected, which already wraps its own calls in one
 * outer ydoc.transact()). Returns true if found and removed, false
 * otherwise.
 *
 * Deliberately does NOT run the contents_change_handler cascade itself
 * (unlike reparentToyDom's callers) — matching the old pure-Yjs
 * deleteToy's behavior, a delete relies on the observer-driven fallback
 * cascade to recompute any container a removed toy was sitting in.
 */
export function deleteToyDom(layerEl, id) {
  const el = layerEl.querySelector(`[data-id="${id}"]`)
  if (!el) return false
  el.remove()
  return true
}

/**
 * Convenience wrapper over deleteToyDom for callers (mainly tests, and the
 * shared LayerAPI) that just want "delete this toy" as one self-contained
 * atomic action. Renders a scratch layer from the current Yjs state,
 * removes inside an envelope, commits. Same external contract the old
 * pure-Yjs deleteToy had.
 */
export function deleteToy(ydoc, yToys, id) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  render(yToys, layerEl)
  let found = false
  const records = runInEnvelopeSync(layerEl, () => { found = deleteToyDom(layerEl, id) })
  if (!found) return false
  commitEnvelope(ydoc, records)
  return true
}

/**
 * Find a toy's <g> wrapper by id — searches the whole toys tree, including
 * nested inside containers. Returns null if not found.
 */
export function findToy(yToys, id) {
  return yExactSelector(yToys, `[data-toy-id="${id}"]`)
}

/**
 * Move a toy to a new position in the containment tree: either into a
 * .contents_group, or back to the top level of the toys layer
 * (containerElId null/undefined).
 *
 * A DOM operation, like every other structural toy mutation now — NOT a
 * pure Yjs write. Call from inside runInEnvelope(Sync); this function
 * doesn't open its own envelope, so it composes with whatever else the
 * caller wants folded into the same transaction (a reposition, a
 * contents_change_handler cascade — see commitMove's drop-into-container
 * path in app.js). envelope.js's MutationObserver captures the move as
 * ordinary childList records (removed from the old parent, added to the
 * new); commitEnvelope translates it into Yjs the same way it translates
 * any other structural mutation — no special-casing needed here at all,
 * because a toy's own Yjs subtree can no longer contain anything the DOM
 * doesn't also have (scripts are hoisted out entirely at placement time —
 * see "Script hoisting" above) — so rebuilding the moved subtree fresh
 * from the DOM loses nothing. The moved toy's CRDT identity is NOT
 * preserved (a fresh Yjs subtree, same as the old clone-based
 * implementation this replaces) — its content always is.
 *
 * Returns the moved DOM element (the same node, relocated — not a clone;
 * DOM elements don't need cloning to change parents).
 *
 * Throws if:
 *  - id's own element isn't found in layerEl
 *  - containerElId is given but not found in layerEl
 *  - containerElId's own element has no .contents_group
 *  - containerElId is id itself, or one of id's own contained toys
 *    (moving a toy into its own descendant would disconnect that subtree
 *    from the document entirely, so this is refused)
 */
export function reparentToyDom(layerEl, id, containerElId) {
  const el = layerEl.querySelector(`[data-id="${id}"]`)
  if (!el) throw new Error(`[toys] reparentToy: toy not found: ${id}`)

  let targetGroup
  if (containerElId == null) {
    targetGroup = layerEl
  } else {
    if (containerElId === id || el.querySelector(`[data-id="${containerElId}"]`)) {
      throw new Error(`[toys] reparentToy: cannot move ${id} into itself or one of its own contained toys (${containerElId})`)
    }
    const targetEl = layerEl.querySelector(`[data-id="${containerElId}"]`)
    if (!targetEl) {
      throw new Error(`[toys] reparentToy: target not found: ${containerElId}`)
    }
    const contentsGroup = getContentsGroup(targetEl)
    if (!contentsGroup) {
      throw new Error(`[toys] reparentToy: target ${containerElId} has no .contents_group`)
    }
    targetGroup = contentsGroup
  }

  targetGroup.appendChild(el) // also removes el from its old parent — native DOM behavior
  return el
}

/**
 * Convenience wrapper over reparentToyDom for callers (mainly tests) that
 * just want "move this toy" as one self-contained atomic action, without
 * composing it with other DOM mutations the way commitMove does. Renders a
 * scratch layer from the current Yjs state, moves the toy inside an
 * envelope, commits, and returns the resulting Yjs node at its new
 * location (findToy(yToys, id)) — same external contract the old
 * pure-Yjs reparentToy had, so existing callers don't need to change.
 */
export function reparentToy(ydoc, yToys, id, containerElId) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  render(yToys, layerEl)
  const records = runInEnvelopeSync(layerEl, () => {
    reparentToyDom(layerEl, id, containerElId)
  })
  commitEnvelope(ydoc, records)
  return findToy(yToys, id)
}



/**
 * Bounding box for a rendered toy svgEl, read from its embedded <svg> child's
 * x/y/width/height. Returns { x, y, width, height } or null.
 */
export function getGeom(svgEl) {
  const svg = svgEl?.tagName === 'svg' ? svgEl : svgEl?.querySelector?.('svg')
  if (!svg) return null
  const x = parseFloat(svg.getAttribute('x'))
  const y = parseFloat(svg.getAttribute('y'))
  const w = parseFloat(svg.getAttribute('width'))
  const h = parseFloat(svg.getAttribute('height'))
  if ([x, y, w, h].some(Number.isNaN)) return null
  return { x, y, width: w, height: h }
}

/**
 * The drag anchor for a toy is its centre point — matching how addToy places
 * it: x = center - width/2, y = center - height/2 (the toy's own native size).
 * Returns { x, y } in canvas-space, or { x: 0, y: 0 } if geom is unavailable.
 */
export function getAnchor(svgEl) {
  const geom = getGeom(svgEl)
  if (!geom) return { x: 0, y: 0 }
  return { x: geom.x + geom.width / 2, y: geom.y + geom.height / 2 }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width &&
         y >= rect.y && y <= rect.y + rect.height
}

/**
 * Hit-test a toy's drop position against every top-level
 * .contents_group-having element.
 * 
 * Returns the id of the first such element whose bounds contain the
 * dragged toy's centre point — or null if none does.
 *
 *  - (rx, ry) is the drop centre point
 *
 * Only top-level toys are considered — nested toys (e.g. a tray inside a
 * bag) are deliberately out of scope.
 *
 */
export function findDropTarget(layerEl, draggedId, rx, ry) {
  if (!layerEl) return null
  const draggedEl = layerEl.querySelector(`:scope > [data-id="${draggedId}"]`)
  if (!draggedEl) return null

  for (const el of layerEl.querySelectorAll(':scope > [data-id]')) {
    const targetId = el.getAttribute('data-id')
    // Don't match the element itself
    if (targetId === draggedId) continue
    // Only consider .contents_group-having elements
    if (!getContentsGroup(el)) continue

    const targetGeom = getGeom(el)
    if (targetGeom && pointInRect(rx, ry, targetGeom)) return targetId
  }
  return null
}

export function getContentsGroup(domEl) {
  return domEl.querySelector(`.${domEl.id}__contents_group`)
}

export function selectModes(domEl) {
  const ownSvg = domEl?.querySelector?.(':scope > svg')
  let modes = []
  if (!!ownSvg?.classList.contains('tt-mode-resize')) {
    modes.push('resize')
  }
  if (!!ownSvg?.classList.contains('tt-mode-rummage')) {
    modes.push('rummage')
  }
  return modes
}


/**
 * Commit a toy move to the Yjs doc in a single transaction.
 */
export function applyMoveCommit(ydoc, yToy, cx, cy) {
  if (!yToy) return
  const ySvg = yToy.toArray()[0]
  if (!ySvg) return
  // (cx, cy) is the centre point; the embedded <svg> is offset by
  // (-width/2, -height/2) using the toy's own w & h
  const halfW = Math.round(parseFloat(ySvg.getAttribute('width')  ?? String(FALLBACK_TOY_SIZE)) / 2)
  const halfH = Math.round(parseFloat(ySvg.getAttribute('height') ?? String(FALLBACK_TOY_SIZE)) / 2)
  ydoc.transact(() => {
    ySvg.setAttribute('x', String(cx - halfW))
    ySvg.setAttribute('y', String(cy - halfH))
  })
}

/**
 * Apply a toy move to a live DOM element only — no Yjs write.
 * domEl is the rendered <g> wrapper; updates the embedded <svg> x/y directly.
 * (cx, cy) is the centre anchor point.
 */
export function applyMoveDom(domEl, cx, cy) {
  if (!domEl) return
  const domSvg = domEl.querySelector?.('svg')
  if (!domSvg) return
  const halfW = Math.round(parseFloat(domSvg.getAttribute('width')  ?? String(FALLBACK_TOY_SIZE)) / 2)
  const halfH = Math.round(parseFloat(domSvg.getAttribute('height') ?? String(FALLBACK_TOY_SIZE)) / 2)
  domSvg.setAttribute('x', cx - halfW)
  domSvg.setAttribute('y', cy - halfH)
}

// Resize corner indices — shared with overlay.js's corner-handle geometry
// (Overlay.resizeCorners returns points in this same order) so canvas.js's
// hit-test result can be passed straight through to computeResizeRect
// without any translation.
export const RESIZE_CORNER_NW = 0
export const RESIZE_CORNER_NE = 1
export const RESIZE_CORNER_SE = 2
export const RESIZE_CORNER_SW = 3

const MIN_RESIZE_SIZE = MIN_TOY_SIZE // never let a drag shrink a toy below this
const MAX_RESIZE_SIZE = 4000         // generous sanity cap

function clampResizeDim(value) {
  return Math.min(MAX_RESIZE_SIZE, Math.max(MIN_RESIZE_SIZE, Math.round(value)))
}

/**
 * Pure geometry for a corner-drag resize: given the toy's rect at drag
 * start and the corner being dragged, compute the new { x, y, width,
 * height } for the current pointer position (px, py), keeping the corner
 * OPPOSITE the dragged one fixed in place. Clamps width/height to
 * MIN_RESIZE_SIZE (never lets the dragged corner cross the fixed one) —
 * the fixed corner itself never moves.
 */
export function computeResizeRect(startRect, corner, px, py) {
  const { x, y, width, height } = startRect
  const left = x, top = y, right = x + width, bottom = y + height

  switch (corner) {
    case RESIZE_CORNER_NW: {
      const newLeft = Math.min(px, right - MIN_RESIZE_SIZE)
      const newTop  = Math.min(py, bottom - MIN_RESIZE_SIZE)
      return { x: newLeft, y: newTop, width: right - newLeft, height: bottom - newTop }
    }
    case RESIZE_CORNER_NE: {
      const newTop = Math.min(py, bottom - MIN_RESIZE_SIZE)
      return { x: left, y: newTop, width: Math.max(px - left, MIN_RESIZE_SIZE), height: bottom - newTop }
    }
    case RESIZE_CORNER_SW: {
      const newLeft = Math.min(px, right - MIN_RESIZE_SIZE)
      return { x: newLeft, y: top, width: right - newLeft, height: Math.max(py - top, MIN_RESIZE_SIZE) }
    }
    case RESIZE_CORNER_SE:
    default: {
      return { x: left, y: top, width: Math.max(px - left, MIN_RESIZE_SIZE), height: Math.max(py - top, MIN_RESIZE_SIZE) }
    }
  }
}

/**
 * Commit a toy resize to the Yjs doc in a single transaction.
 * (x, y) is the new top-left; (width, height) the new
 * native size — both in canvas-space, already computed by
 * computeResizeRect.
 */
export function applyResizeCommit(ydoc, yToy, x, y, width, height) {
  if (!yToy) return
  const ySvg = yToy.toArray()[0]
  if (!ySvg) return
  const toyId = yToy.getAttribute('data-toy-id')
  if (!toyId) return
  const w = clampResizeDim(width)
  const h = clampResizeDim(height)
  ydoc.transact(() => {
    ySvg.setAttribute('x', String(Math.round(x)))
    ySvg.setAttribute('y', String(Math.round(y)))
    ySvg.setAttribute('width',  String(w))
    ySvg.setAttribute('height', String(h))
    ySvg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    for (const el of yClassSelector(ySvg, `${toyId}__wh_follow_resize`)) {
      el.setAttribute('width',  String(w))
      el.setAttribute('height', String(h))
    }
  })
}


/**
 * yNode ↔ DOM registry.
 * Populated during mirror() so app code can resolve a rendered DOM node
 * (e.g. a deep <tspan> the user clicked) back to the Y.XmlElement/Y.XmlText
 * that produced it. Rebuilt naturally on every render, since mirror() runs
 * on every render. WeakMap keys are DOM nodes, so entries for discarded
 * elements are garbage-collected automatically — no manual eviction needed.
 */
let _yNodeByDom = new WeakMap()

/** Look up the Y.XmlElement/Y.XmlText that a rendered DOM node mirrors, or undefined. */
export function yNodeFor(domNode) {
  return _yNodeByDom.get(domNode)
}

/** Reset the yNode↔DOM registry. Intended for test isolation only. */
export function clearYNodeMap() {
  _yNodeByDom = new WeakMap()
}

/**
 * Register a DOM node ↔ Y node mapping directly. Used by envelope.js when
 * translating handler-created DOM nodes (via storage.js's domToY) into the
 * Yjs tree — those nodes never pass through mirror(), so nothing else would
 * add them to the registry, and later mutations on them (e.g. a follow-up
 * setAttribute) would be unresolvable without this.
 */
export function registerYNode(domNode, yNode) {
  _yNodeByDom.set(domNode, yNode)
}

/**
 * Mirror a Y.XmlElement tree into a live, SVG-namespaced DOM element.
 * We can't use Y.XmlElement.toDOM() (HTML namespace, won't render as SVG) nor
 * toString()+DOMParser (lowercases tag names like feColorMatrix and drops the
 * xmlns:xlink declaration). The recursive createElementNS walk preserves both.
 * Never encounters a <script> node to worry about mirroring — a toy's own
 * subtree can't contain one; see "Script hoisting" above.
 */
function mirror(yNode, opts = {}) {
  if (yNode instanceof Y.XmlText) {
    const textNode = document.createTextNode(yNode.toString())
    _yNodeByDom.set(textNode, yNode)
    return textNode
  }
  if (!(yNode instanceof Y.XmlElement)) return null
  const el = document.createElementNS(SVG_NS, yNode.nodeName)
  _yNodeByDom.set(el, yNode)
  const attrs = yNode.getAttributes()
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k])
    else                    el.setAttribute(k, attrs[k])
  }
  // Every toy wrapper (including nested) gets the rendering handles stamped
  if (isToyG(yNode)) stampToyHandles(el, yNode)
  yNode.toArray().forEach(child => {
    const dom = mirror(child, opts)
    if (dom) el.appendChild(dom)
  })
  return el
}

// ── scoped id lookup for toy handler code ($) ───────────────────────────────
//
// Ids are namespaced per instance (see elementToYXml) so placed toys never
// collide, but that means a bare selector like '#pie4' — the natural way
// to write toy handler code — won't match. rootEl.$(selector) rewrites
// every #token in the selector to the instance's namespaced id first, then
// queries from the toy's root <g>. A handler holding a nested element can
// reach it via elem.closest('[data-toy-id]').$(...).
const ID_TOKEN_RE = /#([\w-]+)/g

function rewriteSelector(selector, toyId) {
  const prefix = `${toyId}__`
  return selector.replace(ID_TOKEN_RE, (_, token) => `#${prefix}${token}`)
}

function attachScopedLookup(rootEl, toyId) {
  rootEl.$ = selector => rootEl.querySelector(rewriteSelector(selector, toyId))
  return rootEl
}

/**
 * Stamp the rendering handles app.js needs onto a mirrored toy <g>
 * Called by mirror() for every toy wrapper it encounters, at any nesting
 * depth — not just the top level.
 */
function stampToyHandles(el, yNode) {
  const id = yNode.getAttribute('data-toy-id')
  el.setAttribute('id',              id)
  el.setAttribute('data-id',         id)
  el.setAttribute('data-module', 'toys')
  attachScopedLookup(el, id)
}

export function _toSVGEl(yEl, opts = {}) {
  return mirror(yEl, opts)
}


/**
 * All placed toys, in z-order. Each entry is a rendered SVG element
 * stamped with data-id + data-module.
 * Pass { includeScripts: true } to also mirror <script> nodes — for export
 * only; normal rendering always omits them so nothing executes.
 */
export function listToys(yToys, opts = {}) {
  const results = []
  yToys.toArray().forEach(yEl => {
    if (!(yEl instanceof Y.XmlElement)) return
    results.push(_toSVGEl(yEl, opts))
  })
  return results
}

/**
 * Summarise a rendered toy svgEl as a plain layer-object descriptor.
 */
function toyData(svgEl) {
  const id      = svgEl.getAttribute('data-id')
  const toyType = svgEl.getAttribute('data-toy-type') ?? 'toy'
  const color   = svgEl.getAttribute('data-color') ?? '#888'
  return {
    id,
    label: toyType.replace(/_/g, ' '),
    fill:  color,
    kind:  toyType,
  }
}

/**
 * All toys as layer-object descriptors, in z-order.
 * Used by app.js getLayerObjects — keeps toy internals out of the app bus.
 */
export function toysData(yToys) {
  return listToys(yToys).map(toyData)
}

export const TOOLS = [
  {
    name:    'marker',
    toyType: 'player_marker',
    file: 'player_marker.svg',
    label: 'Player Marker',
    iconUrl: 'toy/player_marker.svg',
    layer:   'toys',
    defaults: { label: '', size: 24 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Token color', show: ['add', 'edit', 'addQuick'] },
      number('size', 'Size', { min: 12, max: 64, step: 4 }),
      bool('showLabel', 'Show name label'),
    ],
  },
  {
    name:    'd6',
    toyType: 'dice_d6',
    file: 'dice_d6.svg',
    label: 'D6',
    iconUrl: 'toy/dice_d6.svg',
    layer:   'toys',
    defaults: { fill: '#f8f8e5' },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Die color', show: ['add', 'edit', 'addQuick'] },
    ],
  },
  {
    name:    'tray_sum',
    toyType: 'tray_sum',
    file: 'tray_sum.svg',
    label: 'Sum Tray',
    iconUrl: 'toy/tray_sum.svg',
    layer:   'toys',
    defaults: { fill: '#fefed8' },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Tray color', show: ['add', 'edit', 'addQuick'] },
    ],
  },
  {
    name:    'bag',
    toyType: 'bag',
    file: 'bag.svg',
    label: 'Bag',
    iconUrl: 'toy/bag.svg',
    layer:   'toys',
    defaults: { fill: '#311' },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Bag color', show: ['add', 'edit', 'addQuick'] },
    ],
  },
];
export const TOY_TYPES = {
  player_marker: TOOLS[0],
  dice_d6: TOOLS[1],
  tray_sum: TOOLS[2],
  bag: TOOLS[3],
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * Return the ttStateSchema for a rendered toy element.
 * Color is read from the data-color attribute on the <g> wrapper, which is
 * part of the Yjs tree and always in sync with the CRDT state.
 */
export function getTtStateSchema(svgEl) {
  const toyId = svgEl.getAttribute?.('data-toy-id')
  if (!toyId) return null
  // Find elem's own '.tspan_name' element — boundary-safe via id-prefix
  // matching, don't accidentally match a contents_group-contained toy.
  const nameEl = svgEl.querySelector(`.${toyId}__tspan_name`)
  function isColorable() {
    return svgEl.querySelector(`.${toyId}__tt_color_filter`) !== null
  }

  return {
    color: svgEl.getAttribute('data-color') ?? '#888',
    ...(nameEl ? { name: nameEl.textContent ?? '' } : {}),
    types: {
      ...(isColorable(svgEl) ? { color: 'color-hsl' } : {}),   // hsl only — toy opacity is not user-editable
      ...(nameEl ? { name: { kind: 'string', show: ['edit'] } } : {}),
    },
  };
}

/**
 * Snapshot the full serialisable state of a toy Y.XmlElement (<g>).
 * Captures the position from the inner <svg> child. Author/created are omitted;
 * those are provenance, not element state.
 */
export function getTtState(yToy) {
  if (!yToy) return null;
  const id      = yToy.getAttribute('data-toy-id');
  const toyType = yToy.getAttribute('data-toy-type');
  const color   = yToy.getAttribute('data-color') ?? '#888';
  const ySvg    = yToy.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg');
  const x       = ySvg ? Number(ySvg.getAttribute('x') ?? 0) : 0;
  const y       = ySvg ? Number(ySvg.getAttribute('y') ?? 0) : 0;
  const width   = ySvg ? Number(ySvg.getAttribute('width')  ?? FALLBACK_TOY_SIZE) : FALLBACK_TOY_SIZE;
  const height  = ySvg ? Number(ySvg.getAttribute('height') ?? FALLBACK_TOY_SIZE) : FALLBACK_TOY_SIZE;
  // Center point (matches getAnchor convention)
  const cx = x + width / 2;
  const cy = y + height / 2;
  return { id, toyType, color, cx, cy };
}


/**
 * Edit a toy's own color and/or name — a DOM operation, like every other
 * content-mutating toy operation now. Call from inside runInEnvelope(Sync);
 * this function doesn't open its own envelope.
 *   color — every one of the toy's own feColorMatrix nodes is updated and
 *           data-color on the toy's own wrapper is kept in sync.
 *   name  — the toy's own .tspan_name text is overwritten (boundary-safe
 *           the same way — a container inside a container keeps its own name).
 */
export function editDom(toyEl, editData) {
  if (!toyEl) return
  const toyId = toyEl.getAttribute('data-id')
  if (!toyId) return
  const { color, name } = editData
  if (color === undefined && name === undefined) return

  if (color !== undefined) {
    const values = colorMatrixValues(color)
    toyEl.querySelectorAll(`.${toyId}__tt_color_filter`).forEach(filterEl => {
      filterEl.querySelectorAll(':scope > feColorMatrix').forEach(m => m.setAttribute('values', values))
    })
    toyEl.setAttribute('data-color', color)
  }
  if (name !== undefined) {
    const nameEl = toyEl.querySelector(`.${toyId}__tspan_name`)
    if (nameEl) nameEl.textContent = String(name)
  }
}

/**
 * Convenience wrapper over editDom for callers (mainly tests, and the
 * shared LayerAPI's Yjs-node-based contract) that just want to edit a toy
 * given its Yjs node rather than a live DOM element. Renders a scratch
 * layer from the current Yjs state, edits inside an envelope, commits.
 * Same external contract the old pure-Yjs edit had.
 */
export function edit(ydoc, yToy, editData) {
  if (!yToy) return
  const toyId = yToy.getAttribute('data-toy-id')
  if (!toyId) return
  const yToys   = ydoc.getXmlFragment('toys')
  const layerEl = document.createElementNS(SVG_NS, 'g')
  render(yToys, layerEl)
  const toyEl = layerEl.querySelector(`[data-id="${toyId}"]`)
  const records = runInEnvelopeSync(layerEl, () => editDom(toyEl, editData))
  commitEnvelope(ydoc, records)
}

// ── Toy behaviour contract ──────────────────────────────────────────────────
//
// A toy's <script> tags (hoisted out to the document's own `scripts`
// fragment, or fetched fresh off disk — see "Script hoisting" above; never
// part of the toy's own subtree) define behaviour: menu actions and
// lifecycle hooks, as a named object on globalThis. This section is that
// contract's three parts: activation (run the scripts), menu (surface +
// invoke actions), and lifecycle (run initialize() once per placed
// instance).
//
// Example, what a toy's own <script> looks like:
//
//   var d6 = {
//     menu: {
//       'Roll': {
//         eventName: 'die_roll',
//         applicable: (dieNode) => true,
//         handler: function (evt) { return dice.roll_handler(this, 6) },
//       },
//     },
//     initialize: function (elem, prototype) { ... },
//   }

// ── activation ───────────────────────────────────────────────────────────

// Module-level and page-lifetime: namespaces are a window-global side
// effect, so activating a toy type twice in one session is meaningless
// work, not a correctness issue to guard per Y.Doc.
const _activatedTypes     = new Set()   // toyType -> settled (activation finished)
const _activationPromises = new Map()   // toyType -> in-flight/settled activation Promise
const _seenScriptUrls     = new Set()   // resolved script URL -> already fetched+evaluated
const _namespacesByType   = new Map()   // toyType -> string[] (data-namespace values, in script order)

/** Test-only: reset all module-level activation state. */
export function _resetToyScriptState() {
  _activatedTypes.clear()
  _activationPromises.clear()
  _seenScriptUrls.clear()
  _namespacesByType.clear()
}

/** Namespaces registered by a toy type's scripts, or [] if not yet activated. */
export function getNamespacesForType(toyType) {
  return _namespacesByType.get(toyType) ?? []
}

// Bridged onto globalThis because toy behaviour scripts
// run via indirect eval into global scope (see evalGlobal below) and can't
// import this module's bindings.
// Generic containers use this to resolve a contained
// toy's own value: look up its declared namespaces by data-toy-type, then
// ask each for getValue().
// TODO: consider globalThis.getNamespacesForEl which takes a dom element
globalThis.getNamespacesForType = getNamespacesForType

/** Whether a toy type's scripts have already been evaluated this session. */
export function isToyTypeActivated(toyType) {
  return _activatedTypes.has(toyType)
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

// Indirect eval, so top-level `var` lands on globalThis like a real
// <script> tag would — a direct eval() call runs in this module's scope.
function evalGlobal(code) {
  ;(0, eval)(code)
}

async function activateScript({ namespace, src, code }, toyType) {
  recordNamespace(toyType, namespace)

  if (src) {
    const url = `/toy/${src}`
    if (_seenScriptUrls.has(url)) return
    _seenScriptUrls.add(url)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`failed to load toy script ${url}: ${res.status}`)
    evalGlobal(await res.text())
  } else if (code.trim()) {
    evalGlobal(code)
  }
}

/**
 * The scripts a toyType needs to activate, as plain data: { namespace,
 * src, code }[]. Prefers the current template on disk — a
 * TOY_TYPES-registered toyType re-fetches (or reads from _svgTextCache,
 * warmed once per session) and re-parses it fresh every session, which is
 * also exactly what gives an inline script its freshness: there's no
 * separate "check for updates" step, re-parsing the current file every
 * session already picks up whatever's currently on disk. Falls back to
 * the document's own `scripts` fragment only for a toyType with no local
 * file to fetch at all (a foreign/unregistered toyType — a different
 * deployment's custom toy, or one since removed/renamed here).
 */
async function scriptsForType(ydoc, toyType) {
  if (TOY_TYPES[toyType]) {
    const svgText = await fetchToySvgText(toyType)
    const root = new DOMParser().parseFromString(svgText, 'image/svg+xml').documentElement
    return extractScripts(root)
  }
  return getScriptsFragment(ydoc).toArray()
    .filter(el => el.getAttribute('data-toy-type') === toyType)
    .map(el => ({
      namespace: el.getAttribute('data-namespace'),
      src:       null,
      code:      inlineScriptText(el),
    }))
}

/**
 * Activate every script a toy type needs, once per toy type per session.
 * Safe to call for every rendered instance and concurrently — every
 * caller for the same toyType shares one Promise, so a caller that needs
 * real completion (not just "started") can await this return value
 * rather than trusting isToyTypeActivated(), which only reflects a
 * settled Promise.
 */
export function activateToyScripts(ydoc, toyType) {
  if (!toyType) return Promise.resolve()
  const existing = _activationPromises.get(toyType)
  if (existing) return existing

  const promise = (async () => {
    const scripts = await scriptsForType(ydoc, toyType)
    for (const script of scripts) {
      await activateScript(script, toyType)
    }
    _activatedTypes.add(toyType)
  })()
  _activationPromises.set(toyType, promise)
  return promise
}

// ── menu ─────────────────────────────────────────────────────────────────

function namespacesFor(toyType) {
  return getNamespacesForType(toyType)
    .map(name => ({ name, ns: globalThis[name] }))
    .filter(({ ns }) => ns && typeof ns === 'object' && ns.menu)
}

/**
 * A toy's currently-applicable menu actions, as plain data:
 *   { namespace, key, eventName, label }[]
 * applicable(svgEl) is evaluated now — entries that fail it are omitted
 * entirely. label resolves uiLabel (string or function(svgEl)), falling
 * back to the menu key.
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
 * getMenuActions() handed back. Re-validates applicable() first (UI state
 * may be stale — another peer's move could land between render and click).
 * Runs the handler inside an envelope and commits its DOM mutations to
 * Yjs as one transaction.
 */
export async function invokeMenuAction(ydoc, yToys, layerEl, svgEl, namespace, key, evt) {
  const ns    = globalThis[namespace]
  const entry = ns?.menu?.[key]
  if (!entry || typeof entry.handler !== 'function') {
    throw new Error(`[toys] no such menu action: ${namespace}.${key}`)
  }
  if (typeof entry.applicable === 'function' && !entry.applicable(svgEl)) {
    throw new Error(`[toys] menu action not applicable: ${namespace}.${key}`)
  }
  return runToyHandler(ydoc, yToys, layerEl, svgEl, () => entry.handler.call(svgEl, evt))
}

// ── gesture-triggered cascade (DOM-only, no Yjs until the final commit) ────
//
// invokeMenuActionSync / initializeToySync use these.
//
// These walk the live DOM directly and never re-render, because a gesture's
// handler and everything it cascades into mutate the same live DOM in place
//
// nothing here is ever stale relative to Yjs, because nothing here depends on
// Yjs at all until the one commitEnvelope call at the very end.

/**
 * The IMMEDIATE (innermost) contents_group-owning toy id for a DOM node —
 * or the node itself, if it IS a .contents_group — or null.
 *
 * Deliberately
 * stops at the first match rather than walking the whole ancestor chain.
 * so that first match can react to any changes and then further ancestors
 * will get a chance to react to THOSE changes.
 */
function immediateContainingId(node) {
  let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement
  while (el) {
    if (el.classList?.contains('contents_group')) {
      // contents_group -> container's own <svg> -> container's <g data-id>
      const containerG = el.parentElement?.parentElement
      return containerG?.getAttribute?.('data-id') ?? null
    }
    el = el.parentElement
  }
  return null
}

/**
 * Every container immediately affected by a MutationRecord[], in
 * first-seen order, deduplicated.
 */
function affectedContainerIdsFromRecords(records) {
  const ids = []
  const seenThisRound = new Set()
  for (const record of records) {
    const id = immediateContainingId(record.target)
    if (id && !seenThisRound.has(id)) { seenThisRound.add(id); ids.push(id) }
  }
  return ids
}

/**
 * Run the contents_change_handler cascade against the live DOM,
 * appending every record it produces into allRecords.
 *
 * (allRecords is mutated in place —
 * the caller feeds this to ONE final commitEnvelope call, so the gesture
 * and its whole cascade land as a single Yjs transaction, single undo
 * step, single touched-set/bundle).
 *
 * Each round resolves only the IMMEDIATE containing container for whatever
 * changed in the round before it
 *
 * Each container's handler runs AT MOST ONCE per gesture.
 * If a cycle is detected, we log loudly (console.error) and skip
 */
function runContentsChangeCascadeInto(allRecords, layerEl) {
  const seen = new Set()
  let toCheck = allRecords
  while (toCheck.length) {
    const candidateIds = affectedContainerIdsFromRecords(toCheck)
    const freshIds  = candidateIds.filter(id => !seen.has(id))
    const repeatIds = candidateIds.filter(id => seen.has(id))
    if (repeatIds.length) {
      console.error(`[toys] contents_change_handler would need to re-run this gesture for: ${repeatIds.join(', ')} — skipped (runs at most once per gesture)`)
    }
    if (!freshIds.length) break

    const stepRecords = []
    for (const containerId of freshIds) {
      seen.add(containerId)
      const containerEl = layerEl.querySelector(`[data-id="${containerId}"]`)
      if (!containerEl) continue // e.g. the container itself was deleted mid-cascade
      const handlers = getNamespacesForType(containerEl.getAttribute('data-toy-type'))
        .map(name => globalThis[name])
        .filter(ns => ns && typeof ns.contents_change_handler === 'function')
      if (!handlers.length) continue
      const records = runInEnvelopeSync(containerEl, () => {
        handlers.forEach(ns => ns.contents_change_handler(containerEl))
      })
      stepRecords.push(...records)
    }
    allRecords.push(...stepRecords)
    toCheck = stepRecords
  }
}

/**
 * Run fn() against the live DOM (inside an envelope observing layerEl),
 * then run whatever contents_change_handler cascade fn's mutations
 * trigger, then translate the whole thing — the gesture and its entire
 * cascade, however many rounds — into Yjs in ONE commitEnvelope call. No
 * re-rendering anywhere in this: nothing here touches Yjs until that
 * final call, so the DOM stays authoritative and current for every step.
 *
 * This is the shared machinery behind invokeMenuActionSync/
 * initializeToySync (below) — also exported directly for a caller whose
 * gesture isn't a toy handler at all (app.js's commitMove folds a
 * drag-drop reparent + reposition through this too) but still needs the
 * exact same "one atomic transaction, cascade included" treatment.
 *
 * Not itself wrapped in a ydoc.transact() — callers that need the
 * "commits under null, same as every other folded call site" behavior
 * (see undo_redo.js's "Atomicity" note) provide their own outer wrap, the
 * same way invokeMenuActionSync does below.
 */
export function runGestureSync(ydoc, layerEl, fn, opts = {}) {
  const allRecords = runInEnvelopeSync(layerEl, fn)
  runContentsChangeCascadeInto(allRecords, layerEl)
  return commitEnvelope(ydoc, allRecords, opts)
}

/**
 * Synchronous sibling of invokeMenuAction. Same validation and effect, but
 * on the current tick, and with any container reaction the handler triggers
 * folded into the SAME transaction as the handler's own commit — one
 * transaction, one undo step, no window where the action landed but its
 * reaction hadn't yet.
 *
 * Note: Wrapped in an outer, unlabeled ydoc.transact(): commitEnvelope's
 * own nested transact() call has its origin argument ignored (Yjs only
 * honors the outermost call's origin), so the merged transaction commits
 * under null regardless of the ENVELOPE_ORIGIN passed below
 */
export function invokeMenuActionSync(ydoc, yToys, layerEl, svgEl, namespace, key, evt) {
  const ns    = globalThis[namespace]
  const entry = ns?.menu?.[key]
  if (!entry || typeof entry.handler !== 'function') {
    throw new Error(`[toys] no such menu action: ${namespace}.${key}`)
  }
  if (typeof entry.applicable === 'function' && !entry.applicable(svgEl)) {
    throw new Error(`[toys] menu action not applicable: ${namespace}.${key}`)
  }
  let result
  ydoc.transact(() => {
    result = runGestureSync(ydoc, layerEl, () => entry.handler.call(svgEl, evt), { origin: ENVELOPE_ORIGIN })
  })
  return result
}

// ── lifecycle ────────────────────────────────────────────────────────────

/**
 * Run every activated namespace's initialize(elem), if present, for a
 * freshly placed toy instance — inside an envelope, so any mutations it
 * makes commit to Yjs like any other handler.
 *
 * Runs once per instance, at placement only.
 *
 * Callers are responsible for only calling this at placement
 */
export async function initializeToy(ydoc, yToys, layerEl, svgEl, toyType) {
  const initializers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.initialize === 'function')
  if (!initializers.length) return

  await runToyHandler(ydoc, yToys, layerEl, svgEl, () => {
    initializers.forEach(ns => ns.initialize(svgEl))
  }, { origin: LIFECYCLE_ORIGIN })
}

/**
 * Synchronous sibling of initializeToy.
 * Same effect, same one-time-at-placement contract, but on the current
 * tick, with any container reaction folded into the same transaction
 *
 * Ordinarily there's nothing to fold. But initialize() has the freedom
 * to mutate anything in toys-layer.
 */
export function initializeToySync(ydoc, yToys, layerEl, svgEl, toyType) {
  const initializers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.initialize === 'function')
  if (!initializers.length) return

  ydoc.transact(() => {
    runGestureSync(ydoc, layerEl, () => {
      initializers.forEach(ns => ns.initialize(svgEl))
    }, { origin: LIFECYCLE_ORIGIN })
  })
}

/**
 * Every container id ancestor of yNode
 * (or yNode itself, if yNode IS a .contents_group), ordered innermost
 * to outermost (From Yjs tree's .parent chain, not the DOM).
 *
 * Used to percolate up contents_change_handler runs after a local change
 */
export function findAncestorContainerIds(yNode) {
  const ids = []
  let node = yNode
  while (node) {
    const isContentsGroup = node instanceof Y.XmlElement && node.nodeName === 'g' &&
      (node.getAttribute('class') || '').split(/\s+/).includes('contents_group')
    if (isContentsGroup) {
      const containerG = node.parent?.parent // contents_group -> container's own <svg> -> container's <g>
      const containerId = containerG instanceof Y.XmlElement ? containerG.getAttribute('data-toy-id') : null
      if (containerId) ids.push(containerId)
    }
    node = node.parent
  }
  return ids
}

/**
 * Run every activated namespace's contents_change_handler(elem), if
 * present, for toyType — inside an envelope
 *
 * Committed under DERIVED_ORIGIN
 *
 * No-op if toyType has no contents_change_handler-providing namespace.
 */
export async function runContentsChangeHandler(ydoc, yToys, layerEl, svgEl, toyType) {
  const handlers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.contents_change_handler === 'function')
  if (!handlers.length) return

  await runToyHandler(ydoc, yToys, layerEl, svgEl, () => {
    handlers.forEach(ns => ns.contents_change_handler(svgEl))
  }, { origin: DERIVED_ORIGIN })
}

/**
 * Synchronous sibling of runContentsChangeHandler. Same effect — run
 * toyType's contents_change_handler(s) under an envelope, committed under
 * DERIVED_ORIGIN — but on the current tick, so when called from inside an
 * open ydoc.transact its commit folds into that transaction rather than
 * landing a microtask later in its own. No-op if toyType has no
 * contents_change_handler namespace.
 */
export function runContentsChangeHandlerSync(ydoc, yToys, layerEl, svgEl, toyType) {
  const handlers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.contents_change_handler === 'function')
  if (!handlers.length) return

  runToyHandlerSync(ydoc, yToys, layerEl, svgEl, () => {
    handlers.forEach(ns => ns.contents_change_handler(svgEl))
  }, { origin: DERIVED_ORIGIN })
}

/**
 * Given the Y nodes a transaction touched, return the ids of every
 * container whose contents changed, ordered innermost-first (deeper
 * containers recompute before their ancestors, so an outer container reads
 * its inner container's fresh result). This is the same depth computation
 * app.js's observer does over its `events`, but sourced from any array of
 * changed Y nodes — e.g. `[...transaction.changed.keys()]`, available
 * *inside* the triggering transaction — so the cascade can run there and
 * fold in. A single changed node already yields its whole ancestor-
 * container chain via findAncestorContainerIds, so a drop into a nested
 * container resolves both containers from one entry.
 */
export function affectedContainerIdsInnerFirst(changedYNodes) {
  const depthById = new Map()
  for (const node of changedYNodes) {
    const chain = findAncestorContainerIds(node) // innermost first
    chain.forEach((containerId, i) => {
      const depth = chain.length - i
      if (depth > (depthById.get(containerId) ?? -1)) depthById.set(containerId, depth)
    })
  }
  return [...depthById.keys()].sort((a, b) => depthById.get(b) - depthById.get(a))
}

/**
 * Run the contents_change_handler cascade synchronously for `containerIds`
 * (innermost-first — see affectedContainerIdsInnerFirst). Re-renders
 * layerEl before each container so an outer container reads the inner
 * container's just-committed result. Each handler commits under
 * DERIVED_ORIGIN; when this runs inside an
 * open transaction those commits collapse into it, making a placement and
 * its reaction one atomic transaction. When run from an observer (no open
 * transaction), each is its own DERIVED transaction instead — same end
 * state, just not folded.
 */
export function runContentsChangeCascadeSync(ydoc, yToys, layerEl, containerIds) {
  for (const containerId of containerIds) {
    render(yToys, layerEl)
    const containerEl = layerEl.querySelector(`[data-id="${containerId}"]`)
    const ycontainer  = findToy(yToys, containerId)
    if (!containerEl || !ycontainer) continue // e.g. the container itself was deleted in the same transaction
    runContentsChangeHandlerSync(ydoc, yToys, layerEl, containerEl, ycontainer.getAttribute('data-toy-type'))
  }
}

/**
 * Render the toys layer: clear layerEl, mirror every toy, then
 * kick off script activation
 */
export function render(yToys, layerEl) {
  registerYNode(layerEl, yToys);
  layerEl.innerHTML = '';
  listToys(yToys).forEach(svgEl => {
    svgEl.style.cursor = 'grab';
    layerEl.appendChild(svgEl);
  });
  // (fire-and-forget — render() must stay synchronous)
  activateAllToyScripts(yToys.doc, yToys);
}

/**
 * Recursively activate every distinct toyType found anywhere in the toys
 * tree (top-level and nested), each once per session.
 * Guards against re-activating already-seen toys.
 */
function activateAllToyScripts(ydoc, yToys) {
  function walk(yEl) {
    if (!(yEl instanceof Y.XmlElement)) return
    if (isToyG(yEl)) {
      const toyType = yEl.getAttribute('data-toy-type')
      if (toyType && !isToyTypeActivated(toyType)) {
        activateToyScripts(ydoc, toyType).catch(err => {
          console.error(`[toys] script activation failed for toy type "${toyType}"`, err)
        })
      }
    }
    yEl.toArray().forEach(walk)
  }
  yToys.toArray().forEach(walk)
}

/**
 * makeLayerAPI — returns the canonical LayerAPI for the toys layer, closing
 * over (ydoc, yToys) so app.js can dispatch by layer type without
 * re-passing the fragment on every call.
 */
export function makeLayerAPI(ydoc, yToys) {
  return {
    find:            (id)            => findToy(yToys, id),
    delete:          (id)            => deleteToy(ydoc, yToys, id),
    getGeom,
    getAnchor,
    getTtState,
    getTtStateSchema,
    applyMoveCommit: (yEl, x, y)     => applyMoveCommit(ydoc, yEl, x, y),
    edit:            (yEl, editData) => edit(ydoc, yEl, editData),
    listData:        ()              => toysData(yToys),
    render:          (layerEl)       => render(yToys, layerEl),
  };
}
