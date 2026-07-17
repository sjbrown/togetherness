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
import { runToyHandler } from './envelope.js';

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
// - preserves <script> nodes as inert document citizens
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
      children.push(elementToYXml(child, idMap, classAddMap, refs))
    } else if (child.nodeType === 3 || child.nodeType === 4) {     // TEXT_NODE / CDATA_SECTION_NODE
      if (child.textContent.trim() !== '') children.push(new Y.XmlText(child.textContent))
    }
  }
  if (children.length) yEl.insert(0, children)
  return yEl
}

/**
 * Parse a toy SVG file's text into a detached Y.XmlElement rooted at <svg>
 *
 * Returns { ySvg, colorMatrices, width, height }
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
  return { ySvg, colorMatrices: refs.colorMatrices, width, height }
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
  const { ySvg, colorMatrices, width: nativeWidth, height: nativeHeight } = svgTextToYXml(svgText, prefix)

  // Tint the toy's colorize filter with the color before insertion.
  // The matrix values are set on the direct refs captured during import,
  // so the color is part of the CRDT state from the moment the toy is placed.
  if (color) applyColor(colorMatrices, color)

  ydoc.transact(() => {
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
 * Place a toy on the table. Fetches the toy's SVG file on first use and
 * caches it; subsequent placements of the same toy type are cache hits
 * attrs: { id, toyType, x, y, color }  (x,y is the center point)
 */
export async function addToy(ydoc, yToys, attrs) {
  const { toyType } = attrs
  let svgText = _svgTextCache.get(toyType)
  if (!svgText) {
    const def = TOY_TYPES[toyType]
    if (!def) throw new Error(`unknown toy type: ${toyType}`)
    const res = await fetch(`/toy/${def.file}`)
    if (!res.ok) throw new Error(`failed to load ${def.file}: ${res.status}`)
    svgText = await res.text()
    _svgTextCache.set(toyType, svgText)
  }
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

function findContentsGroupYEl(toyG) {
  const svg = toyG.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  if (!svg) return null
  return svg.toArray().find(c =>
    c instanceof Y.XmlElement && c.nodeName === 'g' &&
    (c.getAttribute('class') || '').split(/\s+/).includes('contents_group')
  ) ?? null
}

/**
 * Locate a toy anywhere in the toys tree — at the top level of
 * yToys, or nested arbitrarily deep inside other toys' .contents_group
 * containers
 * Returns { yEl, parent, index }
 *   parent - whichever Y.XmlFragment/Y.XmlElement directly holds it
 *   index  - its position there
 * So callers can both read and splice it out.
 * Returns null if no toy with this id exists anywhere in the tree.
 */
function findToyLocation(container, id) {
  const children = container.toArray()
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    if (!isToyG(child)) continue
    if (child.getAttribute('data-toy-id') === id) {
      return { yEl: child, parent: container, index: i }
    }
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
 * (arbitrarily nested) contained toys
 */
function toyContains(toyG, targetId) {
  if (toyG.getAttribute('data-toy-id') === targetId) return true
  const contentsGroup = findContentsGroupYEl(toyG)
  if (!contentsGroup) return false
  return contentsGroup.toArray().some(child => isToyG(child) && toyContains(child, targetId))
}

/**
 * Remove a toy by id — searches the whole toys tree, including nested
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
 * Move a toy to a new position in the containment tree: either into
 * a tray's .contents_group (targetTrayId given), or back to the top level
 * of the toys layer (targetTrayId null/undefined).
 * This is a structural Yjs operation, not a DOM one
 *
 * We accept that peers doing a concurrent remote edit targeting the old
 * items will be lost
 *  - We should have had a soft-lock in the first place
 *  - Reparenting is rare and deliberate
 *
 * Returns the newly-inserted (cloned) Y.XmlElement.
 */
export function reparentToy(ydoc, yToys, id, targetTrayId) {
  const location = findToyLocation(yToys, id)
  if (!location) throw new Error(`[toys] reparentToy: toy not found: ${id}`)
  const { yEl, parent, index } = location

  /*
  * Throws if:
  *  - id doesn't exist anywhere in the tree
  *  - targetTrayId doesn't exist
  *  - targetTrayId has no .contents_group
  *  - targetTrayId is id itself or one of id's own descendant toys
  *    - moving a toy into its own descendant would disconnect that subtree
  *      from the doc entirely, so this is refused
  */
  let targetFragment
  if (targetTrayId == null) {
    targetFragment = yToys
  } else {
    if (toyContains(yEl, targetTrayId)) {
      throw new Error(`[toys] reparentToy: cannot move ${id} into itself or one of its own contained toys (${targetTrayId})`)
    }
    const targetLocation = findToyLocation(yToys, targetTrayId)
    if (!targetLocation) {
      throw new Error(`[toys] reparentToy: target tray not found: ${targetTrayId}`)
    }
    const contentsGroup = findContentsGroupYEl(targetLocation.yEl)
    if (!contentsGroup) {
      throw new Error(`[toys] reparentToy: target ${targetTrayId} has no .contents_group`)
    }
    targetFragment = contentsGroup
  }

  /*
  *  YJS-TRANSACTION-OPENED
  *  - yEl.clone() to deep-copy
  *  - Entire subtree is now fresh, detached Yjs items
  *  - Delete original
  *  - CRDT identity is destroyed for the moved subtree.
  *  - Clone inserted at destination
  * YJS-TRANSACTION-CLOSED
  *
  */
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

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x &&
         a.y < b.y + b.height && a.y + a.height > b.y
}

/**
 * Hit-test a toy's drop position against every top-level tray
 * Returns id of the first tray whose geometry overlaps the dragged
 * toy's would-be bounding box — or null if none does.
 *
 *  - (rx, ry) is the drop centre point
 *
 * Only top-level toys/trays are considered — nested toys (e.g. a tray
 * inside a tray) are deliberately out of scope.
 *
 * TODO: use toy center point, not overlap test
 *
 * TODO: trays are recognized by class-contains-tray.  Expand this to
 *       generic containers - anything that has .contents_group
 */
export function findDropTargetTray(layerEl, draggedId, rx, ry) {
  if (!layerEl) return null
  const draggedEl = layerEl.querySelector(`:scope > [data-id="${draggedId}"]`)
  const draggedGeom = getGeom(draggedEl)
  if (!draggedGeom) return null
  const draggedRect = {
    x: rx - draggedGeom.width / 2, y: ry - draggedGeom.height / 2,
    width: draggedGeom.width, height: draggedGeom.height,
  }

  for (const el of layerEl.querySelectorAll(':scope > [data-id]')) {
    const trayId = el.getAttribute('data-id')
    if (trayId === draggedId) continue
    if (!isTrayEl(el)) continue
    const trayGeom = getGeom(el)
    if (trayGeom && rectsOverlap(draggedRect, trayGeom)) return trayId
  }
  return null
}

/**
 * Whether a rendered toy <g data-id> wrapper is a tray -- i.e. its own
 * embedded <svg> carries the `tray` class.
 */
export function isTrayEl(domEl) {
  const ownSvg = domEl?.querySelector?.(':scope > svg')
  return !!ownSvg?.classList.contains('tray')
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
export const RESIZE_CORNER_TL = 0
export const RESIZE_CORNER_TR = 1
export const RESIZE_CORNER_BL = 2
export const RESIZE_CORNER_BR = 3

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
    case RESIZE_CORNER_TL: {
      const newLeft = Math.min(px, right - MIN_RESIZE_SIZE)
      const newTop  = Math.min(py, bottom - MIN_RESIZE_SIZE)
      return { x: newLeft, y: newTop, width: right - newLeft, height: bottom - newTop }
    }
    case RESIZE_CORNER_TR: {
      const newTop = Math.min(py, bottom - MIN_RESIZE_SIZE)
      return { x: left, y: newTop, width: Math.max(px - left, MIN_RESIZE_SIZE), height: bottom - newTop }
    }
    case RESIZE_CORNER_BL: {
      const newLeft = Math.min(px, right - MIN_RESIZE_SIZE)
      return { x: newLeft, y: top, width: right - newLeft, height: Math.max(py - top, MIN_RESIZE_SIZE) }
    }
    case RESIZE_CORNER_BR:
    default: {
      return { x: left, y: top, width: Math.max(px - left, MIN_RESIZE_SIZE), height: Math.max(py - top, MIN_RESIZE_SIZE) }
    }
  }
}

/**
 * Find a toy's #resizable_bg nested <svg> Y node, if it has one
 * Returns null for toy types that don't have one
 * (resize only ever touches it when present).
 *
 * svgTextToYXml namespaces every id in the source file by `${toyId}__` on
 * import (so two placed instances of the * same toy type never collide) -- the
 * literal string "resizable_bg" is never actually the id in the Yjs tree;
 * They all get transformed into `${toyId}__resizable_bg`.
 */
function findResizableBgYEl(ySvg, toyId) {
  const prefixedId = `${toyId}__resizable_bg`
  return ySvg.toArray().find(c =>
    c instanceof Y.XmlElement && c.nodeName === 'svg' && c.getAttribute('id') === prefixedId
  ) ?? null
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
  const w = clampResizeDim(width)
  const h = clampResizeDim(height)
  ydoc.transact(() => {
    ySvg.setAttribute('x', String(Math.round(x)))
    ySvg.setAttribute('y', String(Math.round(y)))
    ySvg.setAttribute('width',  String(w))
    ySvg.setAttribute('height', String(h))
    ySvg.setAttribute('viewBox', `0 0 ${w} ${h}`)
    const bg = findResizableBgYEl(ySvg, yToy.getAttribute('data-toy-id'))
    if (bg) {
      // purposefully avoid changing the bg viewBox
      bg.setAttribute('width',  String(w))
      bg.setAttribute('height', String(h))
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
];
export const TOY_TYPES = {
  player_marker: TOOLS[0],
  dice_d6: TOOLS[1],
  tray_sum: TOOLS[2],
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * Recursively collect all Y.XmlElement nodes with a given nodeName
 * from a placed (attached) toy tree.  Safe to call on attached nodes only —
 * toArray() throws on detached fragments.
 *
 * isRoot is true only for the initial call — every recursive call passes
 * false. So the *first* toy wrapper visited (the root itself, e.g. a
 * tray's own <g class="toy">) is exempt, but the next one found anywhere
 * below it (e.g. a die placed inside) trips the isRoot===false && isToyG
 * check and returns immediately, before its own children are ever visited.
 * That's what keeps a tray's own feColorMatrix search from reaching into
 * a die's feColorMatrix — the walk stops one level above it, at the die's
 * own <g class="toy"> boundary. Same boundary findScriptNodes respects.
 */
function findAllYNodes(yEl, nodeName, results = [], isRoot = true) {
  if (!(yEl instanceof Y.XmlElement)) return results;
  if (yEl.nodeName === nodeName) results.push(yEl);
  if (!isRoot && isToyG(yEl)) return results;
  for (const child of yEl.toArray()) findAllYNodes(child, nodeName, results, false);
  return results;
}

/**
 * Whether svgEl's own toy has any feColorMatrix nodes of its own to
 * recolor — data-driven, so every colorable toy (any tray type, dice,
 * markers, anything future) picks this up for free, rather than
 * hardcoding toy-type names. Deliberately boundary-safe (via
 * findAllYNodes's isRoot guard): a tray with a colorable die placed
 * inside it is not itself considered colorable on that basis alone.
 */
function isColorable(svgEl) {
  const yToy = yNodeFor(svgEl)
  if (!yToy) return false
  return findAllYNodes(yToy, 'feColorMatrix').length > 0
}

/**
 * Find elem's own '.tspan_name' element — boundary-safe, so a container
 * toy with no name of its own never surfaces a nested toy's name
 * instead. Same convention as tray.js's own _findOwn in src/toy/js/tray.js
 * (kept independent rather than shared: one is DOM-side app code, the
 * other DOM-side toy-behaviour code, and they run in different contexts).
 */
function findOwnNameEl(elem) {
  for (const child of elem.children) {
    if (child.classList.contains('tspan_name')) return child
    if (child.classList.contains('toy')) continue // a nested toy's own subtree — not elem's
    const found = findOwnNameEl(child)
    if (found) return found
  }
  return null
}

/**
 * Return the ttStateSchema for a rendered toy element.
 * Color is read from the data-color attribute on the <g> wrapper, which is
 * part of the Yjs tree and always in sync with the CRDT state.
 */
export function getTtStateSchema(svgEl) {
  const nameEl = findOwnNameEl(svgEl)
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
 * Find yEl's own '.tspan_name' node — boundary-safe (via findAllYNodes's
 * isRoot guard), so a tray containing another tray never finds the
 * nested tray's name instead of its own.
 */
function findOwnNameYNode(yToy) {
  return findAllYNodes(yToy, 'tspan').find(t =>
    (t.getAttribute('class') || '').split(/\s+/).includes('tspan_name')
  ) ?? null;
}

/** Overwrite yEl's Y.XmlText content in place, creating one if absent. */
function setYTextContent(yEl, newText) {
  const existing = yEl?.toArray().find(n => n instanceof Y.XmlText);
  if (existing) {
    existing.delete(0, existing.length);
    existing.insert(0, newText);
  } else if (yEl) {
    yEl.insert(yEl.length, [new Y.XmlText(newText)]);
  }
}

/**
 * Apply an editData object to a toy. Called by App.commitEdit — never
 * called directly from the UI.
 *   color — all of the toy's own feColorMatrix nodes are updated (boundary-
 *           safe: never reaches into a nested toy's colorable parts) and
 *           data-color on the <g> wrapper is kept in sync.
 *   name  — the toy's own '.tspan_name' text is overwritten (boundary-safe
 *           the same way — a tray inside a tray keeps its own name).
 */
export function edit(ydoc, yToy, editData) {
  if (!yToy) return;
  const { color, name } = editData;
  if (color === undefined && name === undefined) return;
  ydoc.transact(() => {
    if (color !== undefined) {
      const colorMatrices = findAllYNodes(yToy, 'feColorMatrix');
      const values = colorMatrixValues(color);
      for (const m of colorMatrices) m.setAttribute('values', values);
      yToy.setAttribute('data-color', color);
    }
    if (name !== undefined) {
      const nameNode = findOwnNameYNode(yToy);
      if (nameNode) setYTextContent(nameNode, String(name));
    }
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

/**
 * Walk yEl's subtree collecting <script> nodes
 *  - isRoot guards against descending into a *nested* toy's subtree
 */
function findScriptNodes(yEl, results = [], isRoot = true) {
  if (!(yEl instanceof Y.XmlElement)) return results
  if (yEl.nodeName === 'script') { results.push(yEl); return results }
  if (!isRoot && isToyG(yEl)) return results
  for (const child of yEl.toArray()) findScriptNodes(child, results, false)
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
 * Extract and evaluate every <script> node in a toy's Yjs tree, once
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
 * doesn't have (a toy's initial state comes from its ttState options
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
 * Every tray id ancestor of yNode
 * (or yNode itself, if yNode IS a .contents_group), ordered innermost
 * to outermost (From Yjs tree's .parent chain, not the DOM).
 *
 * Used to percolate up contents_change_handler runs after a local change
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
 * Render the toys layer: clear layerEl, mirror every toy, then
 * kick off script activation
 */
export function render(yToys, layerEl) {
  layerEl.innerHTML = '';
  listToys(yToys).forEach(svgEl => {
    svgEl.style.cursor = 'grab';
    layerEl.appendChild(svgEl);
  });
  // (fire-and-forget — render() must stay synchronous)
  activateAllToyScripts(yToys);
}

/**
 * Recursively activate every distinct toyType found anywhere in the toys
 * tree (top-level and nested) each on its own <g>, so findScriptNodes
 * only ever walks that specific toy's own immediate content
 *
 * Guards against re-activating already-seen toys
 */
function activateAllToyScripts(yToys) {
  function walk(yEl) {
    if (!(yEl instanceof Y.XmlElement)) return
    if (isToyG(yEl)) {
      const toyType = yEl.getAttribute('data-toy-type')
      if (toyType && !isToyTypeActivated(toyType)) {
        activateToyScripts(yEl, toyType).catch(err => {
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
