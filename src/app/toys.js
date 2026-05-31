/**
 * toys.js — toys-layer tool registry
 *
 * Authority for which tools exist on the 'toys' layer (player markers, dice)
 * and what options each exposes. ui.js asks App for this; it never hard-codes
 * marker/d6.
 *
 * Toys are the game-specific objects: tokens players move around the map,
 * dice they roll. Like tools-shapes.js, this file describes the *palette*;
 *
 */
/**
 * toys.js — CRDT operations for the toys layer
 *
 * Unlike shapes.js, this module is browser-coupled: importing a toy needs
 * DOMParser (to parse the SVG file) and addToy needs fetch (to load it).
 * The pure, unit-testable part is svgTextToYXml + the id-rewriting helpers
 * (jsdom provides DOMParser under vitest).
 *
 * Data model — same as the drawing layer: a Y.XmlFragment of Y.XmlElement.
 * The CRDT tree IS the SVG tree, so internal toy edits (recolor, flip,
 * contents) merge at the attribute/child level.
 *
 *   yToys (XmlFragment)
 *     └─ <g class="toy" data-toy-id data-toy-type>   ← placement + app metadata
 *          └─ <svg x y width height viewBox>          ← the live toy sub-document
 *               └─ ...toy content (defs, paths, tspans, ...)
 *
 * yToyMeta sidecar (Y.Map): id → { author, toyType, color, created }
 */
import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

import { swatches, stepper, toggle } from './tools-schema.js';

const svg = (inner) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;


// ── Toy-type registry ─────────────────────────────────────────────────────────
// Seed of the toy library. Only player_marker is wired up; dice/tokens/trays
// get added here as their behaviour comes online.
export const TOY_TYPES = {
  player_marker: { file: 'player_marker.svg', label: 'Player Marker', icon: '▲' },
  dice_d6:       { file: 'dice_d6.svg',       label: 'D6',            icon: '⚄' },
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

// ── Layer accessor ────────────────────────────────────────────────────────────
export function getToysLayer(ydoc) {
  return {
    yToys:    ydoc.getXmlFragment('toys'),
    yToyMeta: ydoc.getMap('toyMeta'),
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
// - drops <script> (behaviour is handled separately via the sandbox, later)
// - namespaces every id and every internal reference via idMap, so multiple
//   placed instances don't collide on ids like #app-filter-colorize
// - if `refs` is provided, pushes direct Y.XmlElement refs for any
//   feColorMatrix nodes into refs.colorMatrices so callers can setAttribute
//   immediately without walking the detached tree (which throws on toArray).
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
      if (child.localName === 'script') continue
      children.push(elementToYXml(child, idMap, refs))
    } else if (child.nodeType === 3) {                            // TEXT_NODE
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

/**
 * Place a toy on the table. Async: fetches the toy file and imports it.
 * attrs: { id, toyType, x, y, color, author }  (x,y is the center point)
 */
export async function addToy(ydoc, yToys, yToyMeta, attrs) {
  const { id, toyType, x, y, color, author } = attrs
  const def = TOY_TYPES[toyType]
  if (!def) throw new Error(`unknown toy type: ${toyType}`)

  const res = await fetch(`/toy/${def.file}`)
  if (!res.ok) throw new Error(`failed to load ${def.file}: ${res.status}`)
  const prefix = `${id}__`
  const { ySvg, colorMatrices } = svgTextToYXml(await res.text(), prefix)

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
    g.insert(0, [ySvg])

    yToys.insert(yToys.length, [g])
    yToyMeta.set(id, { author, toyType, color, created: Date.now() })
  })
}

/**
 * Remove a toy by id. Returns true if found.
 */
export function deleteToy(ydoc, yToys, yToyMeta, id) {
  const idx = yToys.toArray().findIndex(
    g => g instanceof Y.XmlElement && g.getAttribute('data-toy-id') === id
  )
  if (idx === -1) return false
  ydoc.transact(() => {
    yToys.delete(idx, 1)
    yToyMeta.delete(id)
  })
  return true
}

/**
 * Find a toy's <g> wrapper by id. Returns null if not found.
 */
export function findToy(yToys, id) {
  return yToys.toArray().find(
    g => g instanceof Y.XmlElement && g.getAttribute('data-toy-id') === id
  ) ?? null
}

/**
 * Bounding box for a toy's selection overlay, with PAD applied.
 * Read from the embedded <svg>'s x/y/width/height. Returns
 * { x, y, width, height } (Numbers) or null if not found.
 */
export function toyGeometry(yToys, id, PAD = 4) {
  const g = findToy(yToys, id)
  if (!g) return null
  const svg = g.toArray().find(e => e instanceof Y.XmlElement && e.nodeName === 'svg')
  if (!svg) return null
  const x = parseFloat(svg.getAttribute('x'))
  const y = parseFloat(svg.getAttribute('y'))
  const w = parseFloat(svg.getAttribute('width'))
  const h = parseFloat(svg.getAttribute('height'))
  if ([x, y, w, h].some(Number.isNaN)) return null
  return { x: x - PAD, y: y - PAD, width: w + PAD * 2, height: h + PAD * 2 }
}

/**
 * All placed toys as { el, id, toyType, meta }, in z-order (insertion order).
 */
export function listToys(yToys, yToyMeta) {
  const results = []
  yToys.toArray().forEach(yEl => {
    if (!(yEl instanceof Y.XmlElement)) return
    const id = yEl.getAttribute('data-toy-id')
    results.push({ el: yEl, id, toyType: yEl.getAttribute('data-toy-type'), meta: yToyMeta.get(id) ?? {} })
  })
  return results
}

export const TOOLS = [
  {
    name:  'marker',
    label: TOY_TYPES['player_marker'].label,
    icon: svg(TOY_TYPES['player_marker'].icon),
    layer: 'toys',
    defaults: { fill: '#a85e5e', label: '', size: 24 },
    options: [
      swatches('fill', 'Token color'),
      stepper('size', 'Size', { min: 12, max: 64, step: 4 }),
      toggle('showLabel', 'Show name label'),
    ],
  },
  {
    name:  'd6',
    label: TOY_TYPES['dice_d6'].label,
    icon: svg(TOY_TYPES['dice_d6'].icon),
    layer: 'toys',
    defaults: { fill: '#a8905e', faces: 6 },
    options: [
      swatches('fill', 'Die color'),
      stepper('faces', 'Faces', { min: 4, max: 20, step: 2 }),
      toggle('autoRoll', 'Roll on drop'),
    ],
  },
];


