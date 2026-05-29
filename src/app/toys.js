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

import * as Y from 'yjs'

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

// ── Toy-type registry ─────────────────────────────────────────────────────────
// Seed of the toy library. Only player_marker is wired up; dice/tokens/trays
// get added here as their behaviour comes online.
export const TOY_TYPES = {
  player_marker: { file: 'player_marker.svg', label: 'Player Marker', icon: '▲' },
}

// Display size on the canvas. The toy's own viewBox is preserved, so the
// content scales to fit (preserveAspectRatio defaults to xMidYMid meet).
const DISPLAY = 64

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
function elementToYXml(node, idMap) {
  const yEl = new Y.XmlElement(node.localName)

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
      children.push(elementToYXml(child, idMap))
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
 */
export function svgTextToYXml(svgText, prefix) {
  const dom  = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = dom.documentElement

  const idMap = new Map()
  for (const el of [root, ...root.querySelectorAll('[id]')]) {
    const id = el.getAttribute('id')
    if (id) idMap.set(id, prefix + id)
  }

  const ySvg = elementToYXml(root, idMap)
  if (!root.getAttribute('viewBox')) {
    const w = parseFloat(root.getAttribute('width'))  || 100
    const h = parseFloat(root.getAttribute('height')) || 100
    ySvg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  }
  return ySvg
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
  const ySvg = svgTextToYXml(await res.text(), `${id}__`)

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
  yToys.toArray().forEach(g => {
    if (!(g instanceof Y.XmlElement)) return
    const id = g.getAttribute('data-toy-id')
    results.push({ el: g, id, toyType: g.getAttribute('data-toy-type'), meta: yToyMeta.get(id) ?? {} })
  })
  return results
}
