/**
 * toys.js — toys-layer tool registry
 *
 * Authority for which tools exist on the 'toys' layer (player markers, dice)
 * and what options each exposes. ui.js asks App for this; it never hard-codes
 * marker/d6.
 *
 * Toys are the game-specific objects: tokens players move around the map,
 * dice they roll.
 *
 */
/**
 * toys.js — CRDT operations for the toys layer
 *
 * Data model — same as the drawing layer: a Y.XmlFragment of Y.XmlElement.
 * The CRDT tree IS the SVG tree, so internal toy edits (recolor, flip,
 * contents) merge at the attribute/child level.
 *
 *   yToys (XmlFragment)
 *     └─ <g class="toy" data-toy-id data-toy-type data-color>  ← placement + state
 *          └─ <svg x y width height viewBox>                   ← the live toy sub-document
 *               └─ ...toy content (defs, paths, tspans, ...)
 */
import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

import { number, bool } from './tools-schema.js';



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
 * Remove a toy by id. Returns true if found.
 */
export function deleteToy(ydoc, yToys, id) {
  const idx = yToys.toArray().findIndex(
    g => g instanceof Y.XmlElement && g.getAttribute('data-toy-id') === id
  )
  if (idx === -1) return false
  ydoc.transact(() => {
    yToys.delete(idx, 1)
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
 * Mirror a Y.XmlElement tree into a live, SVG-namespaced DOM element.
 * We can't use Y.XmlElement.toDOM() (HTML namespace, won't render as SVG) nor
 * toString()+DOMParser (lowercases tag names like feColorMatrix and drops the
 * xmlns:xlink declaration). The recursive createElementNS walk preserves both.
 * Script nodes are never mirrored.
 */
function mirror(yNode) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString())
  if (!(yNode instanceof Y.XmlElement)) return null
  if (yNode.nodeName === 'script') return null
  const el = document.createElementNS(SVG_NS, yNode.nodeName)
  const attrs = yNode.getAttributes()
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k])
    else                    el.setAttribute(k, attrs[k])
  }
  yNode.toArray().forEach(child => {
    const dom = mirror(child)
    if (dom) el.appendChild(dom)
  })
  return el
}

/**
 * Render a toy's <g> wrapper to an SVG DOM element, stamped with the handles
 * app.js needs: data-yid (the toy id), data-module="toys", and a plain SVG
 * id="yid-{id}" so overlay.js <use href="#yid-{id}"> can reference it for
 * drag-ghost rendering.
 */
export function _toSVGEl(yEl) {
  const el = mirror(yEl)
  if (el && el.setAttribute) {
    const id = yEl.getAttribute('data-toy-id')
    el.setAttribute('id',              `yid-${id}`)
    el.setAttribute('data-yid',        id)
    el.setAttribute('data-module', 'toys')
  }
  return el
}


/**
 * All placed toys as { svgEl }
 * Each svgEl is a rendered SVG element with data-yid + data-module stamped.
 */
export function listToys(yToys) {
  const results = []
  yToys.toArray().forEach(yEl => {
    if (!(yEl instanceof Y.XmlElement)) return
    results.push({ svgEl: _toSVGEl(yEl) })
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
  return listToys(yToys).map(({ svgEl }) => toyData(svgEl))
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
  };
}
