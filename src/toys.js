/**
 * toys.js — the toys layer: tool registry, CRDT operations, and the toy
 * behaviour contract (script activation, menu actions, lifecycle hooks).
 *
 * Data model — same as the drawing layer: a Y.XmlFragment of Y.XmlElement.
 * The CRDT tree IS the SVG tree, so internal toy edits (recolor, flip,
 * contents) merge at the attribute/child level.
 *
 *   yToys (XmlFragment)
 *     └─ <g class="toy" data-toy-id data-toy-type data-color>  ← placement + state
 *          └─ <svg x y width height viewBox>                   ← the live toy sub-document
 *               └─ ...toy content (defs, paths, tspans, <script>, ...)
 *
 * A toy's <script> nodes are part of that canonical tree (preserved through
 * import/export) but are never mirrored into live DOM — see mirror() below.
 * Activating them (running the code, wiring up menu actions and lifecycle
 * hooks) is a separate step, in the "Toy behaviour contract" section near
 * the bottom of this file.
 */
import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

import { number, bool } from './tools-schema.js';
import { runToyHandler } from './envelope.js';

// NOTE: envelope.js imports render()/yNodeFor()/registerYNode() from this
// file, so this is an intentional cycle — safe because neither side uses
// the other's bindings until a function runs later, well after both
// modules have finished loading.


// ── Toy-type registry ─────────────────────────────────────────────────────────
// Seed of the toy library. Only player_marker is wired up; dice/tokens/trays
// get added here as their behaviour comes online.
//   iconSvg — inner SVG markup for the tool button (paths/shapes drawn with
//             stroke=currentColor). NOT a unicode glyph:
//             svg('▲') renders nothing because there's no <text> node.
export const TOY_TYPES = {
  player_marker: {
    file: 'player_marker.svg', label: 'Player Marker',
    iconSvg: '<path d="M12 3l8 16H4z"/><circle cx="12" cy="13" r="2.5"/>',
  },
  dice_d6: {
    file: 'dice_d6.svg', label: 'D6',
    iconSvg: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3" fill="currentColor"/><circle cx="15" cy="15" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/>',
  },
  tray_sum: {
    file: 'tray_sum.svg', label: 'Sum Tray',
    iconSvg: '<rect x="3" y="5" width="18" height="14" rx="1.5"/><line x1="3" y1="15" x2="21" y2="15"/>',
  },
}


// Display size on the canvas. The toy's own viewBox is preserved, so the
// content scales to fit (preserveAspectRatio defaults to xMidYMid meet).
const DISPLAY = 64

// ── Color matrix ──────────────────────────────────────────────────────────────
// Recolorizes the toy's feColorMatrix filter to tint it with the player's
// color, matching the technique from togetherness/src/js/utils.js.
//
// The feColorMatrix "values" attribute is a 4×5 matrix applied to each pixel:
//   [R']   [r 0 0 0 0] [R]
//   [G'] = [g 0 0 0 0] [G]
//   [B']   [b 0 0 0 0] [B]
//   [A']   [0 0 0 1 0] [A]
//
// A white source pixel (1,1,1) becomes (r,g,b). Grey pixels scale linearly.
// The player_marker SVG is drawn in near-white (#f2f2f2) so the tint reads cleanly.
//
// If the color would be too dark (sum of RGB < 0.9, matching togetherness),
// we boost it to 50% lightness so the marker stays visible on dark backgrounds.

/**
 * Convert HSL (degrees, percent, percent) to RGB in [0, 1].
 * Pure function — no DOM required.
 */
export function hslToRgb(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [f(0), f(8), f(4)]
}

/**
 * Build the 20-value feColorMatrix string that tints any greyscale SVG to `color`.
 * `color` must be a CSS color string. Accepts hsl(…), #rrggbb, or rgb(…).
 *
 * Returns the values string ready for setAttribute('values', …).
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
 * Walk a Y.XmlElement tree and find a node by nodeName.
 * Returns the first match or null.
 */
function findYNode(yEl, nodeName) {
  if (!(yEl instanceof Y.XmlElement)) return null
  if (yEl.nodeName === nodeName) return yEl
  for (const child of yEl.toArray()) {
    const hit = findYNode(child, nodeName)
    if (hit) return hit
  }
  return null
}

/**
 * Apply a player color to all feColorMatrix nodes in the toy's Yjs tree.
 * Uses the direct refs captured during elementToYXml so no tree-walk
 * on detached nodes is needed (toArray on detached throws).
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
// - preserves <script> nodes as inert document citizens (see module header)
// - namespaces every id and internal reference via idMap, so placed
//   instances don't collide on ids like #app-filter-colorize
// - if `refs` is given, collects direct refs to any feColorMatrix nodes
//   into refs.colorMatrices, since a detached tree can't be walked later
//   (toArray() throws until the tree is attached to a doc)
function elementToYXml(node, idMap, refs) {
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
    } else {
      value = rewriteUrlRefs(value, idMap)
    }
    yEl.setAttribute(attr.name, value)
  }

  const children = []
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === 1) {                                   // ELEMENT_NODE
      if (child.namespaceURI && child.namespaceURI !== SVG_NS) continue
      children.push(elementToYXml(child, idMap, refs))
    } else if (child.nodeType === 3 || child.nodeType === 4) {     // TEXT_NODE / CDATA_SECTION_NODE
      if (child.textContent.trim() !== '') children.push(new Y.XmlText(child.textContent))
    }
  }
  if (children.length) yEl.insert(0, children)
  return yEl
}

/**
 * Parse a toy SVG file's text into a detached Y.XmlElement rooted at <svg>,
 * with all internal ids namespaced by `prefix`. Synthesizes a viewBox from
 * width/height if the file lacks one (so display sizing scales the content).
 *
 * Returns { ySvg, colorMatrices } where colorMatrices is an array of direct
 * refs to any feColorMatrix nodes, usable immediately via setAttribute without
 * needing to walk the detached tree (which throws on toArray).
 */
export function svgTextToYXml(svgText, prefix) {
  const dom  = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = dom.documentElement

  const idMap = new Map()
  for (const el of [root, ...root.querySelectorAll('[id]')]) {
    const id = el.getAttribute('id')
    if (id) idMap.set(id, prefix + id)
  }

  const refs = { colorMatrices: [] }
  const ySvg = elementToYXml(root, idMap, refs)
  if (!root.getAttribute('viewBox')) {
    const w = parseFloat(root.getAttribute('width'))  || 100
    const h = parseFloat(root.getAttribute('height')) || 100
    ySvg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  }
  return { ySvg, colorMatrices: refs.colorMatrices }
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
 * attrs: { id, toyType, x, y, color, author }  (x,y is the center point)
 */
export function addToySync(ydoc, yToys, attrs, svgText) {
  const { id, toyType, x, y, color } = attrs
  const prefix = `${id}__`
  const { ySvg, colorMatrices } = svgTextToYXml(svgText, prefix)

  // Tint the toy's colorize filter with the player's color before insertion.
  // The matrix values are set on the direct refs captured during import,
  // so the color is part of the CRDT state from the moment the toy is placed.
  if (color) applyColor(colorMatrices, color)

  ydoc.transact(() => {
    // size + center the embedded sub-document on (x, y)
    ySvg.setAttribute('x',      String(x - DISPLAY / 2))
    ySvg.setAttribute('y',      String(y - DISPLAY / 2))
    ySvg.setAttribute('width',  String(DISPLAY))
    ySvg.setAttribute('height', String(DISPLAY))

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
 * Place a toy on the table. Fetches the toy's SVG file on first use and
 * caches it; subsequent placements of the same toy type are cache hits and
 * skip the network round-trip.
 * attrs: { id, toyType, x, y, color }  (x,y is the center point)
 */
export async function addToy(ydoc, yToys, attrs) {
  const { toyType } = attrs
  const def = TOY_TYPES[toyType]
  if (!def) throw new Error(`unknown toy type: ${toyType}`)

  let svgText = _svgTextCache.get(toyType)
  if (!svgText) {
    const res = await fetch(`/toy/${def.file}`)
    if (!res.ok) throw new Error(`failed to load ${def.file}: ${res.status}`)
    svgText = await res.text()
    _svgTextCache.set(toyType, svgText)
  }
  addToySync(ydoc, yToys, attrs, svgText)
}

/**
 * Whether a Y.XmlElement is a placed toy's wrapper — a <g class="toy"
 * data-toy-id data-toy-type> — the same shape at every nesting depth,
 * whether at the top of the toys layer or inside a tray's .contents_group.
 */
function isToyG(yEl) {
  if (!(yEl instanceof Y.XmlElement) || yEl.nodeName !== 'g') return false
  return (yEl.getAttribute('class') || '').split(/\s+/).includes('toy')
}

/**
 * A placed toy's .contents_group Y.XmlElement (the tray-type-specific
 * container nested toys live in — see reparentToy below), or null if
 * toyG isn't a tray (no such container in its own SVG markup).
 */
function findContentsGroupYEl(toyG) {
  const svg = toyG.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  if (!svg) return null
  return svg.toArray().find(c =>
    c instanceof Y.XmlElement && c.nodeName === 'g' &&
    (c.getAttribute('class') || '').split(/\s+/).includes('contents_group')
  ) ?? null
}

/**
 * Locate a placed toy anywhere in the toys tree — at the top level of
 * yToys, or nested arbitrarily deep inside other toys' .contents_group
 * containers — returning { yEl, parent, index } (parent is whichever
 * Y.XmlFragment/Y.XmlElement directly holds it, index is its position
 * there) so callers can both read and splice it out. Returns null if no
 * toy with this id exists anywhere in the tree.
 */
function findToyLocation(container, id) {
  const children = container.toArray()
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (!isToyG(child)) continue
    if (child.getAttribute('data-toy-id') === id) return { yEl: child, parent: container, index: i }
    const contentsGroup = findContentsGroupYEl(child)
    if (contentsGroup) {
      const found = findToyLocation(contentsGroup, id)
      if (found) return found
    }
  }
  return null
}

/**
 * Whether toyG is targetId itself, or has targetId anywhere among its own
 * (arbitrarily nested) contained toys — the cycle check reparentToy needs
 * before moving toyG into what might be one of its own descendants.
 */
function toyContains(toyG, targetId) {
  if (toyG.getAttribute('data-toy-id') === targetId) return true
  const contentsGroup = findContentsGroupYEl(toyG)
  if (!contentsGroup) return false
  return contentsGroup.toArray().some(child => isToyG(child) && toyContains(child, targetId))
}

/**
 * Remove a toy by id — searches the whole toys tree, including nested
 * inside trays. Returns true if found.
 */
export function deleteToy(ydoc, yToys, id) {
  const location = findToyLocation(yToys, id)
  if (!location) return false
  ydoc.transact(() => {
    location.parent.delete(location.index, 1)
  })
  return true
}

/**
 * Find a toy's <g> wrapper by id — searches the whole toys tree, including
 * nested inside trays. Returns null if not found.
 */
export function findToy(yToys, id) {
  return findToyLocation(yToys, id)?.yEl ?? null
}

/**
 * Move a placed toy to a new position in the containment tree: either into
 * a tray's .contents_group (targetTrayId given), or back to the top level
 * of the toys layer (targetTrayId null/undefined). This is a structural
 * Yjs operation, not a DOM one — the caller (app.js's drag-end handling,
 * phase 5.3) is responsible for deciding *whether* to reparent (geometry
 * hit-testing against placed trays); this function only performs the move
 * once that decision is made.
 *
 * Implementation: yEl.clone() deep-copies the toy's entire subtree (its
 * embedded <svg>, every attribute, every descendant — including its own
 * .contents_group if it's itself a tray, so moving a tray moves everything
 * inside it too) as fresh, detached Yjs items, then the original is
 * deleted and the clone is inserted at the destination — all in one
 * transaction. Known trade-off: this destroys CRDT identity for the moved
 * subtree. A concurrent remote edit targeting the old items (e.g. another
 * peer rolling a die at the exact moment it's dragged into a tray) is lost
 * — it was mutating Yjs items that get deleted here, not the fresh clone.
 * Accepted for tabletop semantics: reparenting is a rare, deliberate
 * placement action, not a hot path needing fine-grained merge.
 *
 * Throws (loud failure, not a silent no-op) if: id doesn't exist anywhere
 * in the tree; targetTrayId doesn't exist; targetTrayId has no
 * .contents_group (i.e. isn't a tray-shaped toy); or targetTrayId is id
 * itself or one of id's own (possibly nested) contained toys — moving a
 * toy into its own descendant would disconnect that subtree from the doc
 * entirely, so this is refused rather than silently losing data.
 *
 * Returns the newly-inserted (cloned) Y.XmlElement.
 */
export function reparentToy(ydoc, yToys, id, targetTrayId) {
  const location = findToyLocation(yToys, id)
  if (!location) throw new Error(`[toys] reparentToy: toy not found: ${id}`)
  const { yEl, parent, index } = location

  let targetFragment
  if (targetTrayId == null) {
    targetFragment = yToys
  } else {
    if (toyContains(yEl, targetTrayId)) {
      throw new Error(`[toys] reparentToy: cannot move ${id} into itself or one of its own contained toys (${targetTrayId})`)
    }
    const targetLocation = findToyLocation(yToys, targetTrayId)
    if (!targetLocation) throw new Error(`[toys] reparentToy: target tray not found: ${targetTrayId}`)
    const contentsGroup = findContentsGroupYEl(targetLocation.yEl)
    if (!contentsGroup) throw new Error(`[toys] reparentToy: target ${targetTrayId} has no .contents_group (not a tray?)`)
    targetFragment = contentsGroup
  }

  let movedEl
  ydoc.transact(() => {
    const clone = yEl.clone()
    parent.delete(index, 1)
    targetFragment.insert(targetFragment.length, [clone])
    movedEl = clone
  })
  return movedEl
}



/**
 * Bounding box for a rendered toy svgEl, read from its embedded <svg> child's
 * x/y/width/height. Returns { x, y, width, height } (Numbers) or null.
 * No PAD — callers apply padding if they want a selection box.
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
 * it: x = center - DISPLAY/2, y = center - DISPLAY/2.
 * Returns { x, y } in canvas-space, or { x: 0, y: 0 } if the geom is unavailable.
 */
export function getAnchor(svgEl) {
  const geom = getGeom(svgEl)
  if (!geom) return { x: 0, y: 0 }
  return { x: geom.x + geom.width / 2, y: geom.y + geom.height / 2 }
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * Hit-test a toy's drop position against every other placed top-level tray
 * currently rendered in layerEl (the toys layer's DOM group), returning the
 * id of the first one whose geometry overlaps the dragged toy's would-be
 * bounding box — or null if none does. (rx, ry) is the drop centre point,
 * matching the anchor convention getAnchor/applyMoveCommit already use.
 *
 * Only top-level toys are considered, both as the dragged element and as
 * candidate trays. This isn't a simplification of convenience: only
 * top-level toys carry data-yid (see _toSVGEl — only listToys()'s top-level
 * walk stamps it, nested toys don't), and this hit test is entirely
 * DOM/data-yid driven, so a nested tray couldn't be found here even if the
 * loop tried. A nested toy also has no data-yid to drag by in the first
 * place — closing that is a separate, larger interactivity gap (see the
 * phase 5.2 notes), not something this function works around.
 *
 * A tray is recognized the same way tray.js's own get_numeric_value does:
 * its embedded <svg> (a direct child of the <g data-yid> wrapper) carries
 * class 'tray'.
 */
export function findDropTargetTray(layerEl, draggedId, rx, ry) {
  if (!layerEl) return null
  const draggedEl = layerEl.querySelector(`:scope > [data-yid="${draggedId}"]`)
  const draggedGeom = getGeom(draggedEl)
  if (!draggedGeom) return null
  const draggedRect = {
    x: rx - draggedGeom.width / 2, y: ry - draggedGeom.height / 2,
    width: draggedGeom.width, height: draggedGeom.height,
  }

  for (const el of layerEl.querySelectorAll(':scope > [data-yid]')) {
    const trayId = el.getAttribute('data-yid')
    if (trayId === draggedId) continue
    const ownSvg = el.querySelector(':scope > svg')
    if (!ownSvg?.classList.contains('tray')) continue
    const trayGeom = getGeom(el)
    if (trayGeom && rectsOverlap(draggedRect, trayGeom)) return trayId
  }
  return null
}


/**
 * Commit a toy move to the Yjs doc in a single transaction.
 * Called once on pointerup — never during drag.
 * (cx, cy) is the centre point; the embedded <svg> is offset by -DISPLAY/2.
 */
export function applyMoveCommit(ydoc, yToy, cx, cy) {
  if (!yToy) return
  const ySvg = yToy.toArray()[0]
  if (!ySvg) return
  const half = Math.round(parseFloat(ySvg.getAttribute('width') ?? String(DISPLAY)) / 2)
  ydoc.transact(() => {
    ySvg.setAttribute('x', String(cx - half))
    ySvg.setAttribute('y', String(cy - half))
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
  const half = Math.round(parseFloat(domSvg.getAttribute('width') ?? String(DISPLAY)) / 2)
  domSvg.setAttribute('x', cx - half)
  domSvg.setAttribute('y', cy - half)
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
 * Script nodes are never mirrored for live rendering — pass
 * { includeScripts: true } only for export, where nothing executes either
 * (it's a detached document being serialized, not attached to the page).
 */
function mirror(yNode, opts = {}) {
  if (yNode instanceof Y.XmlText) {
    const textNode = document.createTextNode(yNode.toString())
    _yNodeByDom.set(textNode, yNode)
    return textNode
  }
  if (!(yNode instanceof Y.XmlElement)) return null
  if (yNode.nodeName === 'script' && !opts.includeScripts) return null
  const el = document.createElementNS(SVG_NS, yNode.nodeName)
  _yNodeByDom.set(el, yNode)
  const attrs = yNode.getAttributes()
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k])
    else                    el.setAttribute(k, attrs[k])
  }
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
 * Render a toy's <g> wrapper to an SVG DOM element, stamped with the handles
 * app.js needs: data-yid (the toy id), data-module="toys", a plain SVG
 * id="yid-{id}" so overlay.js <use href="#yid-{id}"> can reference it for
 * drag-ghost rendering, and `.$()` for toy-scoped id lookups (see above).
 */
export function _toSVGEl(yEl, opts = {}) {
  const el = mirror(yEl, opts)
  if (el && el.setAttribute) {
    const id = yEl.getAttribute('data-toy-id')
    el.setAttribute('id',              `yid-${id}`)
    el.setAttribute('data-yid',        id)
    el.setAttribute('data-module', 'toys')
    attachScopedLookup(el, id)
  }
  return el
}


/**
 * All placed toys, in z-order. Each entry is a rendered SVG element
 * stamped with data-yid + data-module.
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
  const id      = svgEl.getAttribute('data-yid')
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
    label:   TOY_TYPES['player_marker'].label,
    iconUrl: 'toy/player_marker.svg',
    layer:   'toys',
    defaults: { fill: '#a85e5e', label: '', size: 24 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Token color', show: ['add', 'edit', 'addQuick'] },
      number('size', 'Size', { min: 12, max: 64, step: 4 }),
      bool('showLabel', 'Show name label'),
    ],
  },
  {
    name:    'd6',
    toyType: 'dice_d6',
    label:   TOY_TYPES['dice_d6'].label,
    iconUrl: 'toy/dice_d6.svg',
    layer:   'toys',
    defaults: { fill: '#a8905e' },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Die color', show: ['add', 'edit', 'addQuick'] },
    ],
  },
  {
    name:    'tray_sum',
    toyType: 'tray_sum',
    label:   TOY_TYPES['tray_sum'].label,
    iconUrl: 'toy/tray_sum.svg',
    layer:   'toys',
    defaults: { fill: '#5e7ea8' },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Tray color', show: ['add', 'edit', 'addQuick'] },
    ],
  },
];

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * Recursively collect all Y.XmlElement nodes with a given nodeName
 * from a placed (attached) toy tree.  Safe to call on attached nodes only —
 * toArray() throws on detached fragments.
 */
function findAllYNodes(yEl, nodeName, results = []) {
  if (!(yEl instanceof Y.XmlElement)) return results;
  if (yEl.nodeName === nodeName) results.push(yEl);
  for (const child of yEl.toArray()) findAllYNodes(child, nodeName, results);
  return results;
}

/**
 * Return the ttStateSchema for a rendered toy element.
 * Color is read from the data-color attribute on the <g> wrapper, which is
 * part of the Yjs tree and always in sync with the CRDT state.
 */
export function getTtStateSchema(svgEl) {
  return {
    color: svgEl.getAttribute('data-color') ?? '#888',
    types: {
      color: 'color-hsl',   // hsl only — toy opacity is not user-editable
    },
  };
}

/**
 * Snapshot the full serialisable state of a placed toy Y.XmlElement (<g>).
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
  const size    = ySvg ? Number(ySvg.getAttribute('width') ?? DISPLAY) : DISPLAY;
  // Center point (matches getAnchor convention)
  const cx = x + size / 2;
  const cy = y + size / 2;
  return { id, toyType, color, cx, cy };
}

/**
 * Write a ttState snapshot back into the Yjs toys fragment.
 * Async — must fetch the toy SVG file to reconstruct the full tree.
 * Used by undo/redo to restore deleted toys.
 */
export async function applyTtState(ydoc, yToys, state) {
  if (!state?.id || !state?.toyType) return;
  const existing = findToy(yToys, state.id);
  if (existing) {
    // Only update position if toy already exists.
    applyMoveCommit(ydoc, existing, state.cx, state.cy);
  } else {
    await addToy(ydoc, yToys, {
      id:      state.id,
      toyType: state.toyType,
      x:       state.cx,
      y:       state.cy,
      color:   state.color ?? '#888',
    });
  }
}

/**
 * Apply an editData object to a placed toy.
 * Currently only `color` is editable: all feColorMatrix nodes in the toy's
 * Yjs tree are updated and data-color on the <g> wrapper is kept in sync.
 * Called by App.commitEdit — never called directly from the UI.
 */
export function edit(ydoc, yToy, editData) {
  if (!yToy) return;
  const { color } = editData;
  if (color === undefined) return;
  const colorMatrices = findAllYNodes(yToy, 'feColorMatrix');
  const values = colorMatrixValues(color);
  ydoc.transact(() => {
    for (const m of colorMatrices) m.setAttribute('values', values);
    yToy.setAttribute('data-color', color);
  });
}

// ── Toy behaviour contract ──────────────────────────────────────────────────
//
// A toy's <script> nodes (preserved in the Yjs tree, never mirrored — see
// module header) define behaviour: menu actions and lifecycle hooks, as a
// named object on globalThis. This section is that contract's three parts:
// activation (run the scripts), menu (surface + invoke actions), and
// lifecycle (run initialize() once per placed instance).
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

// Bridged onto globalThis (not just exported) because toy behaviour scripts
// run via indirect eval into global scope (see evalGlobal below) and can't
// import this module's bindings. Generic containers — tray.js's
// evaluate_sub_element is the first user — use this to resolve a contained
// toy's own value: look up its declared namespaces by data-toy-type, then
// ask each for getValue(). Set once, at module load; same lifetime as the
// activation state above.
globalThis.getNamespacesForType = getNamespacesForType

/** Whether a toy type's scripts have already been evaluated this session. */
export function isToyTypeActivated(toyType) {
  return _activatedTypes.has(toyType)
}

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

// Indirect eval, so top-level `var` lands on globalThis like a real
// <script> tag would — a direct eval() call runs in this module's scope.
function evalGlobal(code) {
  ;(0, eval)(code)
}

async function activateScript(yScript, toyType) {
  recordNamespace(toyType, yScript.getAttribute('data-namespace'))

  const src = yScript.getAttribute('src')
  if (src) {
    const url = `/toy/${src}`
    if (_seenScriptUrls.has(url)) return
    _seenScriptUrls.add(url)
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
 * per toy type. Safe to call for every rendered instance and concurrently —
 * every caller for the same toyType shares one Promise, so a caller that
 * needs real completion (not just "started") can await this return value
 * rather than trusting isToyTypeActivated(), which only reflects a settled
 * Promise.
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

// ── lifecycle ────────────────────────────────────────────────────────────

/**
 * Run every activated namespace's initialize(elem), if present, for a
 * freshly placed toy instance — inside an envelope, so any mutations it
 * makes commit to Yjs like any other handler. Runs once per instance, at
 * genuine placement only: never on load/import or remote sync, since those
 * toys already went through initialize() once, in whichever session first
 * placed them. Callers are responsible for only calling this at placement
 * and for having already awaited activateToyScripts() — this function has
 * no per-instance guard of its own.
 *
 * archive2025's initialize(elem, prototype) took a second argument copying
 * config from a reference node, feeding a config-dialog flow master
 * doesn't have (a placed toy's initial state comes from its ttState options
 * instead). `prototype` is deliberately never passed — a namespace's own
 * initialize() just receives undefined for it, which is the same guard
 * archive2025 authors already needed for a prototype-less call.
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

/**
 * Every tray id whose .contents_group contains yNode (or yNode itself, if
 * yNode IS a .contents_group) — ordered innermost to outermost
 * (From Yjs tree's .parent chain, not the DOM).
 *
 * Used to find which tray(s), if any, need their contents_change_handler
 * re-run after a local change
 */
export function findAncestorTrayIds(yNode) {
  const ids = []
  let node = yNode
  while (node) {
    const isContentsGroup = node instanceof Y.XmlElement && node.nodeName === 'g' &&
      (node.getAttribute('class') || '').split(/\s+/).includes('contents_group')
    if (isContentsGroup) {
      const trayG = node.parent?.parent // contents_group -> tray's own <svg> -> tray's <g>
      const trayId = trayG instanceof Y.XmlElement ? trayG.getAttribute('data-toy-id') : null
      if (trayId) ids.push(trayId)
    }
    node = node.parent
  }
  return ids
}

/**
 * Run every activated namespace's contents_change_handler(elem), if
 * present, for toyType — inside an envelope, so a recomputed result
 * (e.g. a tray's sum) commits back to Yjs like any other handler mutation,
 * and syncs to peers.
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
  })
}

/**
 * Render the toys layer: clear layerEl, mirror every placed toy, then
 * kick off script activation (fire-and-forget — render() must stay
 * synchronous) for any toy type seen for the first time. activateToyScripts
 * is a no-op for already-activated types, so calling it per-instance on
 * every render is cheap and correct rather than needing its own gate here.
 */
export function render(yToys, layerEl) {
  layerEl.innerHTML = '';
  listToys(yToys).forEach(svgEl => {
    svgEl.style.cursor = 'grab';
    layerEl.appendChild(svgEl);
  });
  yToys.toArray().forEach(yEl => {
    if (!(yEl instanceof Y.XmlElement)) return
    const toyType = yEl.getAttribute('data-toy-type')
    if (!toyType || isToyTypeActivated(toyType)) return
    activateToyScripts(yEl, toyType).catch(err => {
      console.error(`[toys] script activation failed for toy type "${toyType}"`, err)
    })
  })
}

/**
 * makeLayerAPI — returns the canonical LayerAPI for the toys layer, closing
 * over (ydoc, yToys) so app.js can dispatch by layer type without
 * re-passing the fragment on every call.
 *
 * Note: applyTtState (and transitively the add-path inside it) is async,
 * matching addToy's network fetch for the toy's SVG template on first use.
 * Callers already handle this — see App.undo / deleteMultiSelected, which
 * detect a Promise return and chain .then()/.catch().
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
    applyTtState:    (state)         => applyTtState(ydoc, yToys, state),  // async
    edit:            (yEl, editData) => edit(ydoc, yEl, editData),
    listData:        ()              => toysData(yToys),
    render:          (layerEl)       => render(yToys, layerEl),
  };
}
