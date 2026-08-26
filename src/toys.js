/**
 * toys.js — the toys layer: tool registry, CRDT operations, and the toy
 * behaviour contract (script activation, menu actions, lifecycle hooks).
 *
 * Data model — same as the drawing layer: a Y.XmlFragment of Y.XmlElement.
 * The CRDT tree IS the SVG tree, so internal toy edits (recolor, flip,
 * contents) merge at the attribute/child level.
 *
 * yToys (XmlFragment)
 *  └─ <g class="toy" data-id data-toy-type data-color>  ← placement + state
 *      └─ <svg x y width height viewBox>                    ← the live toy sub-document
 *          └─ ...toy content (defs, paths, tspans, <script>, ...)
 *      (optional)
 *          └─ ...class="tt_contents"
 *            └─ ...toy content (dragged in sub-toys)
 *
 * A toy's <script> nodes are part of that canonical tree (preserved through
 * import/export) but are never part of the live DOM. Activating them
 * (running the code, wiring up menu actions and lifecycle hooks) is a
 * separate step, in the "Toy behaviour contract" section
 *
 * ID format: tt-t-v1-XXXXX
 */
import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'
const ID_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHLMNPQRTUV2346789'

import { runInEnvelope, commitGesture, isInsideEnvelope } from './envelope.js';
export { isInsideEnvelope };
import { consumeParents, setHead, getHead, addMergeTip } from './op_head.js';
import { getOps, appendOp, getOp, heads, labelBranches, branchAuthors, forkJoinSequence, toyUndoRedoStacks } from './op_dag.js';
import { invert as invertWire, apply as applyWire } from './op_wire_mutation.js';
import { checkpointOp, projectFrom, buildForkSeed, isCheckpoint } from './op_checkpoint.js';
import { receiveOp, advanceTo } from './op_replay.js';

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

// Rewrite url(#id) references in an attribute value using the id map.
function rewriteUrlRefs(value, idMap) {
  return value.replace(/url\(#([^)\s]+)\)/g, (m, id) =>
    idMap.has(id) ? `url(#${idMap.get(id)})` : m)
}

const EMPTY_MAP = new Map()

/**
 * Normalise one element arriving from outside the document (a toy template,
 * an imported .svg) into the attribute list it should carry inside it.
 *
 * ctx.idMap namespaces ids and the internal references that point at them;
 * ctx.classAddMap adds prefixed aliases alongside the tt_* classes;
 * ctx.prefix + ctx.accum.sequenceNumber mints identifiers for elements that
 * arrive without one. Returns [name, value] pairs, id first, so a caller can
 * apply them to a Y.XmlElement or a DOM node.
 *
 * Every element leaves here with a data-id. It is seeded from the element's
 * own id on first import and never rewritten afterwards, so later edits to
 * id (which belongs to the user) leave identity alone.
 */
export function parseForeignNode(node, ctx = {}) {
  const {
    prefix      = '',
    idMap       = EMPTY_MAP,
    classAddMap = EMPTY_MAP,
    accum,
    mintId      = true,
    keepForeign = false,
  } = ctx

  const mint = () => prefix + (accum ? accum.sequenceNumber++ : '')

  let elementId = node.getAttribute('id')
  if (elementId) elementId = idMap.get(elementId) ?? elementId
  else if (mintId) elementId = mint()

  let dataId = node.getAttribute('data-id')
  if (dataId) dataId = idMap.get(dataId) ?? dataId
  dataId = dataId || elementId || mint()

  const attrs = []
  if (elementId) attrs.push(['id', elementId])

  for (const attr of Array.from(node.attributes)) {
    if (!keepForeign && attr.namespaceURI && attr.namespaceURI !== XLINK_NS) continue

    const name = attr.localName
    if (name === 'id' || name === 'data-id') continue

    let value = attr.value
    if (name === 'href' && value.startsWith('#')) {
      const ref = value.slice(1)
      if (idMap.has(ref)) value = '#' + idMap.get(ref)
    } else if (name === 'class') {
      const classes = value.split(/\s+/).filter(Boolean)
      const allClasses = [...classes]
      for (const cls of classes) {
        if (classAddMap.has(cls)) allClasses.push(classAddMap.get(cls))
      }
      value = allClasses.join(' ')
    } else {
      value = rewriteUrlRefs(value, idMap)
    }
    attrs.push([attr.name, value])
  }

  attrs.push(['data-id', dataId])
  return attrs
}

/**
 * Recursively normalise an already-placed toy <g> arriving from outside
 * the document — loaded back in from a previously exported .svg — into a
 * fresh DOM subtree that satisfies the data-id invariant. Never mutates
 * el; the caller is free to read scripts off the original afterwards.
 *
 * Unlike svgTextToYXml (which places a *fresh* toy from its template and
 * namespaces every id against a fresh instance prefix), a reimported toy
 * already carries whatever namespacing it was placed with — so this
 * leaves idMap/classAddMap empty by default and mintId off.
 * parseForeignNode's data-id fallback still fires per element, which only
 * matters for a hand-crafted or pre-B1 file that never carried one.
 *
 * <script> children are always dropped — never part of a toy's own Yjs
 * subtree, live or at rest (see "Script hoisting"). Hoisting them into the
 * document is the caller's job, via extractScripts + hoistInlineScripts,
 * before or after calling this; order doesn't matter since el is untouched.
 */
export function normalizeForeignToySubtree(el, ctx) {
  // A fresh accum per top-level call keeps minted data-ids unique within
  // one import without the caller having to thread a counter through.
  // Recursive calls pass ctx explicitly and reuse it, so the counter is
  // shared across the whole subtree rather than reset at every node.
  const cx = ctx ?? {
    prefix:      `tt-t-${Math.random().toString(36).slice(2, 7)}__`,
    accum:       { sequenceNumber: 0 },
    mintId:      false,
    keepForeign: true,
  }

  const out = document.createElementNS(SVG_NS, el.localName)
  for (const [name, value] of parseForeignNode(el, cx)) {
    if (name === 'xlink:href') out.setAttributeNS(XLINK_NS, 'href', value)
    else                       out.setAttribute(name, value)
  }
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === 1) {
      if (child.namespaceURI && child.namespaceURI !== SVG_NS) continue
      if (child.localName === 'script') continue
      out.appendChild(normalizeForeignToySubtree(child, cx))
    } else if (child.nodeType === 3 || child.nodeType === 4) {
      if (child.textContent.trim() !== '') out.appendChild(document.createTextNode(child.textContent))
    }
  }
  return out
}

/**
 * Toy contract for a DOM element arriving from outside the document (an
 * imported .svg's toys-layer child): <g class="toy" data-toy-type> with
 * ≥1 <svg> child. Anything else found directly inside #toys-layer is
 * invalid.
 *
 * data-id, id=, data-module, and .$() are never checked here and never
 * required — they're rendering/dispatch conveniences recomputed fresh by
 * the renderer at every depth, every time, not part of the on-disk
 * contract.
 */
export function isForeignToyG(el) {
  return el.localName === 'g' &&
         el.classList.contains('toy') &&
         el.getAttribute('data-toy-type') &&
         el.querySelector(':scope > svg')
}

/**
 * The whole toy-import contract for one #toys-layer child, in one call —
 * this is the only thing a caller outside toys.js needs to know about a
 * reimported toy.
 *
 * Returns { parsedNode, scripts }. parsedNode is null when el doesn't
 * satisfy the toy contract (isForeignToyG) — the caller's only signal for
 * "not a toy", nothing else about the contract leaks out. On success,
 * parsedNode is el's subtree normalised for the data-id invariant
 * (normalizeForeignToySubtree) with any embedded <script>s already
 * stripped, and those scripts have already been hoisted into ydoc's own
 * scripts fragment — same as at placement time (addToy) — since
 * hoisting needs data-toy-type, which is exactly the kind of toy-contract
 * detail a caller storing/exporting documents shouldn't have to read.
 * scripts is returned too, for a caller that wants to know what was found
 * without re-deriving it.
 */
export function parseForeignToy(ydoc, el) {
  if (!isForeignToyG(el)) return { parsedNode: null, scripts: [] }

  const innerSvg = el.querySelector(':scope > svg')
  const scripts  = innerSvg ? extractScripts(innerSvg) : []
  if (scripts.length) hoistInlineScripts(ydoc, el.getAttribute('data-toy-type'), scripts)

  return { parsedNode: normalizeForeignToySubtree(el), scripts }
}

/**
 * Address a node so a peer can find the same one in its own tree.
 *
 * An element answers with its data-id. A text node cannot carry one, so it
 * answers with its parent's data-id and its position among that parent's
 * childNodes. Returns null for anything unaddressable — a text node whose
 * parent has no data-id, an element that was never stamped.
 */
export function nodeRef(node) {
  if (!node) return null
  if (node.nodeType === 1) {
    const id = node.getAttribute('data-id')
    return id ? { id } : null
  }
  if (node.nodeType === 3 || node.nodeType === 4) {
    const parent = node.parentNode
    if (!parent || parent.nodeType !== 1) return null
    const parentId = parent.getAttribute('data-id')
    if (!parentId) return null
    return { parentId, index: Array.prototype.indexOf.call(parent.childNodes, node) }
  }
  return null
}

/**
 * Inverse of nodeRef, resolved against rootEl (which may itself be the
 * addressed element). Returns null when the ref names something absent —
 * the caller decides whether that is fatal.
 */
export function resolveRef(ref, rootEl) {
  if (!ref || !rootEl) return null
  const findById = (id) =>
    (rootEl.getAttribute?.('data-id') === id)
      ? rootEl
      : rootEl.querySelector(`[data-id="${id}"]`)

  if (ref.id !== undefined) return findById(ref.id)

  if (ref.parentId !== undefined) {
    const parent = findById(ref.parentId)
    if (!parent) return null
    const child = parent.childNodes[ref.index]
    return (child && (child.nodeType === 3 || child.nodeType === 4)) ? child : null
  }
  return null
}

// ── Script hoisting ──────────────────────────────────────────────────────
//
// A toy's <script> tags never become part of its own DOM subtree.
// Two kinds, two different fates:
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

// ── Toy operations ────────────────────────────────────────────────────────────

// Cache of raw SVG text keyed by toy type. Populated on first fetch; subsequent
// placements of the same toy type skip the network round-trip and re-parse
// locally (cheap) instead of re-fetching (potentially slow / rate-limited).
const _svgTextCache = new Map()  // toyType → svgText string

/** Clear the SVG template cache. Intended for tests only. */
export function _clearSvgTextCache() { _svgTextCache.clear() }

/**
 * Parse a toy SVG template into a detached DOM <svg>, namespaced per
 * instance the same way svgTextToYXml does.
 *
 * Returns { svgEl, colorMatrices, width, height, scripts }.
 */
export function svgTextToDom(svgText, prefix) {
  const dom  = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const root = dom.documentElement

  const idMap = new Map()
  for (const el of [root, ...root.querySelectorAll('[id]')]) {
    const id = el.getAttribute('id')
    if (id) idMap.set(id, prefix + id)
  }

  const classAddMap = new Map([
    ['tt_contents',          prefix + 'tt_contents'],
    ['tt_positions',         prefix + 'tt_positions'],
    ['tt_wh_follow_resize',  prefix + 'tt_wh_follow_resize'],
    ['tt_colored',           prefix + 'tt_colored'],
    ['tt_color_filter',      prefix + 'tt_color_filter'],
    ['tt_name',              prefix + 'tt_name'],
    ['tt_hit_plate',         prefix + 'tt_hit_plate'],
  ])

  const scripts = extractScripts(root)
  const ctx = { prefix, idMap, classAddMap, accum: { sequenceNumber: 0 } }
  const svgEl = normalizeForeignToySubtree(root, ctx)

  const width  = parseFloat(root.getAttribute('width'))  || 100
  const height = parseFloat(root.getAttribute('height')) || 100
  if (!svgEl.getAttribute('viewBox')) svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`)

  const colorMatrices = [...svgEl.querySelectorAll('feColorMatrix')]
  return { svgEl, colorMatrices, width, height, scripts }
}

/**
 * Build a toy's rendered <g> wrapper, ready to insert into the layer.
 * attrs: { id, toyType, x, y, color } — x,y is the centre point.
 */
export function buildToyDom(attrs, svgText) {
  const { id, toyType, x, y, color } = attrs
  const { svgEl, colorMatrices, width: nativeWidth, height: nativeHeight, scripts } =
    svgTextToDom(svgText, `${id}__`)

  if (color) {
    const values = colorMatrixValues(color)
    for (const m of colorMatrices) m.setAttribute('values', values)
  }

  const width  = clampToySize(nativeWidth)
  const height = clampToySize(nativeHeight)
  svgEl.setAttribute('x',      String(x - width / 2))
  svgEl.setAttribute('y',      String(y - height / 2))
  svgEl.setAttribute('width',  String(width))
  svgEl.setAttribute('height', String(height))

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class',         'toy')
  g.setAttribute('data-toy-type', toyType)
  g.setAttribute('data-color',    color ?? '#888')
  g.setAttribute('data-id',       id)
  g.setAttribute('id',            id)
  g.setAttribute('data-module',   'toys')
  g.appendChild(svgEl)
  attachScopedLookup(g, id)

  return { toyEl: g, scripts }
}

/**
 * Place a toy into the live layer. Hoists the template's inline scripts
 * into ydoc, then appends the wrapper. Call from inside runInEnvelope.
 */
export function addToyDom(ydoc, layerEl, attrs, svgText) {
  const { toyEl, scripts } = buildToyDom(attrs, svgText)
  hoistInlineScripts(ydoc, attrs.toyType, scripts)
  layerEl.appendChild(toyEl)
  return toyEl
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
  const res = await fetch(`toy/${def.file}`)
  if (!res.ok) throw new Error(`failed to load ${def.file}: ${res.status}`)
  svgText = await res.text()
  _svgTextCache.set(toyType, svgText)
  return svgText
}

/**
 * Place a toy directly onto a layer's DOM. Fetches the toy's SVG file on
 * first use and caches it; subsequent placements of the same toy type are
 * cache hits. attrs: { id, toyType, x, y, color } (x,y is the center point).
 *
 * Not a gesture — nothing is committed to the op log. This exists for
 * building up a layerEl's contents before a checkpoint is taken (table
 * genesis, seeding a scratch layer for tests) — see placeToy for the
 * gesture-committing counterpart used once a table is live.
 */
export async function addToy(ydoc, layerEl, attrs) {
  const svgText = await fetchToySvgText(attrs.toyType)
  return addToyDom(ydoc, layerEl, attrs, svgText)
}

/**
 * <g class="toy" data-toy-type="...">,
 */
function isToyBoundaryEl(el) {
  return !!el?.hasAttribute?.('data-toy-type') &&
         (el.tagName === 'g' || el.classList?.contains('toy'))
}

/**
 * Clone toy's DOM, recursing into any nested toy instances
 * found inside it.
 * Every id — and every url(#...)/href referencing one — is rewritten
 *
 * <script> children are dropped, since every toyType involved is already
 * activated
 *
 * cloned accumulates { id, toyType, el } for every toy instance created,
 * root and nested alike, post-order (a nested toy is pushed before its
 * container).
 */
function cloneToyBoundary(sourceEl, newId, cloned) {
  const sourceId  = sourceEl.getAttribute('data-id')
  const oldPrefix = `${sourceId}__`
  const newPrefix = `${newId}__`
  const toyType   = sourceEl.getAttribute('data-toy-type')
  const color     = sourceEl.getAttribute('data-color')

  // Both id and data-id go through the same map: every source element
  // already carries a data-id (stamped at its own original placement),
  // and parseForeignNode's default behaviour is to copy that verbatim.
  // That would cause problems, the source subtree staying live in the document
  // right alongside its clone.
  const idMap = new Map()
  const mapId = (id) => {
    const suffix = id.startsWith(oldPrefix) ? id.slice(oldPrefix.length) : id
    idMap.set(id, newPrefix + suffix)
  }
  const sourceSvg = sourceEl.querySelector(':scope > svg')
  if (sourceSvg.getAttribute('id')) mapId(sourceSvg.getAttribute('id'))
  if (sourceSvg.getAttribute('data-id')) mapId(sourceSvg.getAttribute('data-id'))
  ;(function collectOwnIds(el) {
    // idMap covers only ids in THIS instance's own scope. The walk
    // stops at any nested toy boundary -- that gets its own scope via the
    // recursive cloneToyBoundary call in cloneNode, not this one.
    for (const child of el.children) {
      if (isToyBoundaryEl(child)) continue
      if (child.getAttribute('id')) mapId(child.getAttribute('id'))
      if (child.getAttribute('data-id')) mapId(child.getAttribute('data-id'))
      collectOwnIds(child)
    }
  })(sourceSvg)

  const ctx = {
    prefix: newPrefix, idMap, classAddMap: EMPTY_MAP,
    accum: { sequenceNumber: 0 }, mintId: false, keepForeign: true,
  }
  const cloneNode = (node) => {
    if (node !== sourceSvg && isToyBoundaryEl(node)) {
      return cloneToyBoundary(node, newToyId(), cloned)
    }
    const out = document.createElementNS(SVG_NS, node.localName)
    for (const [name, value] of parseForeignNode(node, ctx)) {
      if (name === 'xlink:href') out.setAttributeNS(XLINK_NS, 'href', value)
      else                       out.setAttribute(name, value)
    }
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === 1) {
        if (child.namespaceURI && child.namespaceURI !== SVG_NS) continue
        if (child.localName === 'script') continue
        out.appendChild(cloneNode(child))
      } else if (child.nodeType === 3 || child.nodeType === 4) {
        if (child.textContent.trim() !== '') out.appendChild(document.createTextNode(child.textContent))
      }
    }
    return out
  }
  const svgEl = cloneNode(sourceSvg)

  // swap out a *stale* prefixed class left over from the source's
  // own placement.
  // Sweep those separately so the clone doesn't carry classes pointing back
  // at its source's namespace.
  for (const el of [svgEl, ...svgEl.querySelectorAll('[class]')]) {
    const classes = el.getAttribute('class')
    if (!classes?.includes(oldPrefix)) continue
    el.setAttribute('class', classes.split(/\s+/)
      .map(c => c.startsWith(oldPrefix) ? newPrefix + c.slice(oldPrefix.length) : c)
      .join(' '))
  }

  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class',         'toy')
  g.setAttribute('data-toy-type', toyType)
  if (color) g.setAttribute('data-color', color)
  g.setAttribute('data-id',       newId)
  g.setAttribute('id',            newId)
  g.setAttribute('data-module',   'toys')
  g.appendChild(svgEl)
  attachScopedLookup(g, newId)

  cloned.push({ id: newId, toyType, el: g })
  return g
}

/**
 * clone cloneeEl under a fresh id, placed via clonerEl's own .tt_target
 * marker if present.
 * Then re-run initialize() on every cloned instance.
 */
export function toyCloneToy(ydoc, layerEl, clonerEl, cloneeEl, opts = {}) {
  const target = clonerEl?.querySelector?.('.tt_target')
  const { x, y } = target ? getInnerAnchor(clonerEl, target) : getAnchor(clonerEl)
  const newId = newToyId()

  const { result } = ensureEnvelope(ydoc, layerEl, () => {
    const built = addClonedToyDom(layerEl, cloneeEl, newId, x, y)
    for (const { toyType, el } of built.cloned) runInitializers(el, toyType)
    return built
  }, { gesture: 'clone', ...opts })

  return { id: newId, cloned: result.cloned }
}

/**
 * Deep-clone an already-placed toy under a fresh id, nested toys and
 * all — the "duplicate this specific instance, live state and all"
 * counterpart to buildToyDom's "instantiate a fresh one from its
 * template". Used by supply-style toys (see src/toy/supply.svg) that
 * hand back a copy of whatever they're holding rather than conjuring a
 * blank instance.
 *
 * (x, y) is the new root instance's centre point in canvas space;
 * width/height carry over unchanged from the source
 *
 * Returns { toyEl, cloned }, where cloned lists every toy instance this
 * produced ({ id, toyType, el })
 */
export function cloneToyDom(sourceEl, newId, x, y) {
  const cloned = []
  const toyEl  = cloneToyBoundary(sourceEl, newId, cloned)
  const svgEl  = toyEl.querySelector(':scope > svg')
  const width  = parseFloat(svgEl.getAttribute('width'))  || FALLBACK_TOY_SIZE
  const height = parseFloat(svgEl.getAttribute('height')) || FALLBACK_TOY_SIZE
  svgEl.setAttribute('x', String(x - width / 2))
  svgEl.setAttribute('y', String(y - height / 2))
  return { toyEl, cloned }
}

/** Clone + append, mirroring addToyDom's relationship to buildToyDom. */
export function addClonedToyDom(layerEl, sourceEl, newId, x, y) {
  const result = cloneToyDom(sourceEl, newId, x, y)
  layerEl.appendChild(result.toyEl)
  return result
}


/**
 * Remove a toy element from the DOM by id — searches the whole toys tree,
 * including nested. A DOM operation, like every other structural toy
 * mutation now. Call from inside runInEnvelope; this function
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
 * Move a toy to a new position in the containment tree: either into a
 * .tt_contents, or back to the top level of the toys layer
 *
 * Returns the moved DOM element
 *
 * Throws if:
 *  - id's own element isn't found in layerEl
 *  - containerElId is given but not found in layerEl
 *  - containerElId's own element has no .tt_contents
 *  - containerElId is id itself, or one of id's own contained toys
 *
 * Also directly (synchronously) runs contents_change_handler for the
 * container being entered and, if el was already sitting inside one, the
 * container being left
 * Note, there's also an end-of-gesture scan (runContentsChangeCascadeInto)
 * called by runGesture as a backstop
 */
export function reparentToyDom(layerEl, id, containerElId) {
  const el = layerEl.querySelector(`[data-id="${id}"]`)
  if (!el) throw new Error(`[toys] reparentToy: toy not found: ${id}`)
  const elSvg = el.tagName === 'svg' ? el : el.querySelector('svg')
  if (!elSvg) throw new Error(`[toys] reparentToy: toy > svg not found: ${id}`)

  const previousContainerId = immediateContainingId(el)
  const previousContainerEl = previousContainerId && layerEl.querySelector(`[data-id="${previousContainerId}"]`)
  const previousContainerGeom = previousContainerEl && getGeom(previousContainerEl)
  const priorLocalX = parseFloat(elSvg.getAttribute('x')) || 0
  const priorLocalY = parseFloat(elSvg.getAttribute('y')) || 0

  let targetGroup
  let landingPosition = null
  let newContainerId = null
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
      throw new Error(`[toys] reparentToy: target ${containerElId} has no .tt_contents`)
    }
    targetGroup = contentsGroup

    // If the target container exposes its own tt_positions circle
    // (getLandingPosition), el's own x/y are set so its centre lands there
    landingPosition = getLandingPosition(targetEl)
    newContainerId = containerElId
  }

  targetGroup.appendChild(el) // also removes el from its old parent — native DOM behavior

  if (landingPosition) {
    const w = parseFloat(elSvg.getAttribute('width'))  || 0
    const h = parseFloat(elSvg.getAttribute('height')) || 0
    elSvg.setAttribute('x', String(landingPosition.x - w / 2))
    elSvg.setAttribute('y', String(landingPosition.y - h / 2))
  } else if (containerElId == null && previousContainerGeom) {
    elSvg.setAttribute('x', String(previousContainerGeom.x + priorLocalX))
    elSvg.setAttribute('y', String(previousContainerGeom.y + priorLocalY))
  }

  if (newContainerId && newContainerId !== previousContainerId) {
    runContentsChangeHandlersFor(layerEl.querySelector(`[data-id="${newContainerId}"]`))
  }
  if (previousContainerId && previousContainerId !== newContainerId) {
    runContentsChangeHandlersFor(layerEl.querySelector(`[data-id="${previousContainerId}"]`))
  }

  return el
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

/**
 * Canvas-space centre of innerEl, an element living somewhere inside
 * toyRootEl's embedded <svg>
 * Replicates the browser's default 'xMidYMid meet' viewBox scaling.
 *
 * innerEl must carry cx/cy (circle/ellipse) or x/y(+width/height)
 * anything else — or a missing/malformed viewBox — falls back to the
 * toy's own overall anchor via getAnchor().
 */
export function getInnerAnchor(toyRootEl, innerEl) {
  const outerSvg = toyRootEl?.tagName === 'svg' ? toyRootEl : toyRootEl?.querySelector?.('svg')
  if (!outerSvg || !innerEl) return getAnchor(toyRootEl)

  const outX = parseFloat(outerSvg.getAttribute('x'))      || 0
  const outY = parseFloat(outerSvg.getAttribute('y'))      || 0
  const outW = parseFloat(outerSvg.getAttribute('width'))  || 0
  const outH = parseFloat(outerSvg.getAttribute('height')) || 0
  const vb = (outerSvg.getAttribute('viewBox') || `0 0 ${outW} ${outH}`).trim().split(/[\s,]+/).map(Number)
  const [vbX, vbY, vbW, vbH] = vb
  if (!outW || !outH || !vbW || !vbH) return getAnchor(toyRootEl)

  const scale   = Math.min(outW / vbW, outH / vbH)
  const offsetX = (outW - vbW * scale) / 2
  const offsetY = (outH - vbH * scale) / 2

  let cx, cy
  if (innerEl.hasAttribute('cx')) {
    cx = parseFloat(innerEl.getAttribute('cx')) || 0
    cy = parseFloat(innerEl.getAttribute('cy')) || 0
  } else if (innerEl.hasAttribute('x')) {
    cx = (parseFloat(innerEl.getAttribute('x')) || 0) + (parseFloat(innerEl.getAttribute('width'))  || 0) / 2
    cy = (parseFloat(innerEl.getAttribute('y')) || 0) + (parseFloat(innerEl.getAttribute('height')) || 0) / 2
  } else {
    return getAnchor(toyRootEl)
  }

  return { x: outX + offsetX + (cx - vbX) * scale, y: outY + offsetY + (cy - vbY) * scale }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.width &&
         y >= rect.y && y <= rect.y + rect.height
}

/**
 * Hit-test a toy's drop position against every top-level
 * .tt_contents-having element.
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
    // Only consider .tt_contents-having elements
    if (!getContentsGroup(el)) continue

    const targetGeom = getGeom(el)
    if (targetGeom && pointInRect(rx, ry, targetGeom)) return targetId
  }
  return null
}

export function getContentsGroup(domEl) {
  return domEl.querySelector(`.${domEl.id}__tt_contents`)
}

export function getLandingPosition(containerEl) {
  const containerId = containerEl?.getAttribute('data-id')
  const circle = containerId && containerEl.querySelector(`.${containerId}__tt_positions circle`)
  if (!circle) return null
  return {
    x: parseFloat(circle.getAttribute('cx')) || 0,
    y: parseFloat(circle.getAttribute('cy')) || 0,
  }
}

/**
 * Matrix mapping points in localEl's own coordinate space into layerEl's
 * coordinate space: layerEl^-1 * localEl, via getScreenCTM().
 *
 * getScreenCTM() is the one SVG API that correctly folds in a toy's
 * viewBox-to-width/height scaling (e.g. a supply toy whose width/height
 * were bumped up while its viewBox stayed put) plus any nested <g>
 * transforms, at any depth — no hand-rolled 'xMidYMid meet' math needed.
 * "Screen space" here is just the one coordinate frame every SVG element
 * is guaranteed to share; the whole conversion collapses to a single
 * matrix multiply, not a real round trip through pixels.
 *
 * Returns null if either element isn't attached to a rendered SVG
 * (getScreenCTM() returns null in that case).
 */
function localToLayerMatrix(localEl, layerEl) {
  const layerCtm = layerEl?.getScreenCTM?.()
  const localCtm = localEl?.getScreenCTM?.()
  if (!layerCtm || !localCtm) return null
  return layerCtm.inverse().multiply(localCtm)
}

/**
 * domEl's tt_positions circles, converted into layerEl's coordinate space.
 *
 * layerInv is layerEl's inverted screen CTM, precomputed once by the
 * caller and passed in — getScreenCTM() forces layout, so callers that
 * loop over many owners (getSnapPoints, ownersAtPoint, directOccupantIds)
 * should look it up once per call rather than once per owner.
 */
function getPositionsMeta(domEl, layerInv) {
  const NULL = { g: null, name: null, snapRadius: null, circles: null, canvasCircles: null }
  const g = domEl?.querySelector?.(`.${domEl.id}__tt_positions`) ?? null
  if (!g) return NULL

  const circles = g.querySelectorAll(`circle`)
  if (!circles.length) return NULL
  const c0 = circles[0]
  const snapRadius = Number(g.getAttribute('data-snap-radius') ?? c0.getAttribute('r'))
  const name = g.getAttribute('name') || '';

  const groupCtm = g.getScreenCTM?.()
  const m = layerInv && groupCtm ? layerInv.multiply(groupCtm) : null
  if (!m) return NULL
  const scale = Math.hypot(m.a, m.b)

  const canvasCircles = []
  circles.forEach((c) => {
    const cx = Number(c.getAttribute('cx') ?? 0)
    const cy = Number(c.getAttribute('cy') ?? 0)
    canvasCircles.push({
      id: c.getAttribute('id') ?? '',
      r: Number(c.getAttribute('r') ?? 0) * scale,
      cx: cx * m.a + cy * m.c + m.e,
      cy: cx * m.b + cy * m.d + m.f,
    })
  })
  return { g, name, snapRadius, circles, canvasCircles }
}

/**
 * Scan the toys layer for top-level toys offering a tt_positions pos-set
 */
export function getSnapPoints(layerEl) {
  const points = []
  const layerInv = layerEl?.getScreenCTM?.()?.inverse?.() ?? null

  for (const ownerEl of layerEl.querySelectorAll(':scope > [data-id]')) {
    const ownerId = ownerEl.getAttribute('data-id')
    const { g, canvasCircles, name } = getPositionsMeta(ownerEl, layerInv)
    if (!g) continue

    for (const c of canvasCircles) {
      points.push({ cx: c.cx, cy: c.cy, snapRadius: c.r, circleId: c.id, ownerId, name })
    }
  }

  return points
}

// ── positions bookkeeping (self-contained — no caller-supplied ownership) ──



/**
 * { ownerId, positionId } for every OTHER toy's tt_positions point that
 * sits exactly on (cx, cy)
 * A single owner can appear more than once if it happens to have more than
 * one circle at the same coordinate.
 */
function ownersAtPoint(layerEl, cx, cy, excludeId) {
  const matches = []
  const layerInv = layerEl?.getScreenCTM?.()?.inverse?.() ?? null

  for (const el of layerEl.querySelectorAll(':scope > [data-id]')) {
    const ownerId = el.getAttribute('data-id')
    if (ownerId === excludeId) continue

    const { g, canvasCircles } = getPositionsMeta(el, layerInv)
    if (!g) continue

    for (const c of canvasCircles ) {
      if (c.cx === cx && c.cy === cy) {
        matches.push({ ownerId, positionId: c.id })
      }
    }
  }
  return matches
}

/** Ids of every top-level toy currently sitting exactly on one of el's OWN tt_positions points. */
function directOccupantIds(layerEl, hostEl) {
  const toyIdsAt = function(circle) {
    const excludeId = hostEl.getAttribute('data-id')
    const ids = []
    for (const el of layerEl.querySelectorAll(':scope > [data-id]')) {
      const id = el.getAttribute('data-id')
      if (id === excludeId || !getGeom(el)) continue
      const anchor = getAnchor(el)
      if (anchor.x === circle.cx && anchor.y === circle.cy) ids.push(id)
    }
    return ids
  }

  const layerInv = layerEl?.getScreenCTM?.()?.inverse?.() ?? null
  const { g, canvasCircles } = getPositionsMeta(hostEl, layerInv)
  if (!g) return []

  const ids = new Set()
  for (const c of canvasCircles) {
    for (const id of toyIdsAt(c)) ids.add(id)
  }
  return [...ids]
}

export function departingPositionEvents(layerEl, el) {
  if (!layerEl || !el || !getGeom(el)) return []
  const selfId = el.getAttribute('data-id')
  const anchor = getAnchor(el)
  const events = []
  for (const { ownerId, positionId } of ownersAtPoint(layerEl, anchor.x, anchor.y, selfId)) {
    events.push({ fnName: 'on_position_vacated', elemId: ownerId, positionId, ownerId, movingId: selfId })
    events.push({ fnName: 'on_depart_position', elemId: selfId,  positionId, ownerId, movingId: selfId })
  }
  return events
}

export function arrivingPositionEvents(layerEl, el, x, y) {
  if (!layerEl || !el) return []
  const selfId = el.getAttribute('data-id')
  const events = []
  for (const { ownerId, positionId } of ownersAtPoint(layerEl, x, y, selfId)) {
    events.push({ fnName: 'on_position_occupied', elemId: ownerId, positionId, ownerId, movingId: selfId })
    events.push({ fnName: 'on_arrive_position', elemId: selfId,  positionId, ownerId, movingId: selfId })
  }
  return events
}

/**
 * Bring el to the topmost z-order among top-level toys, then recursively
 * do the same for whatever's currently stacked on el's OWN tt_positions —
 * and for whatever's stacked on THEIR positions, and so on down the whole
 * stack. Each level is promoted in its existing relative order to the
 * others at that level, so siblings never swap places, only rise as a
 * group above whatever they're stacked on.
 *
 * A DOM-only reorder: appendChild within the same parent changes paint
 * order without touching any attributes, so this doesn't disturb anything
 * else about the promoted elements. `seen` guards against a malformed/
 * cyclic stacking relationship recursing forever.
 */
export function promoteZOrder(layerEl, el, seen = new Set()) {
  if (!layerEl || !el) return
  const toyId = el.getAttribute('data-id')
  if (seen.has(toyId)) return
  seen.add(toyId)

  const occupantIds = new Set(directOccupantIds(layerEl, el))
  layerEl.appendChild(el) // el itself → topmost (so far)

  if (!occupantIds.size) return
  // Promote occupants in their existing relative order (not occupantIds'
  // discovery order, which follows circle/DOM-scan order, not z-order).
  const inOrder = [...layerEl.querySelectorAll(':scope > [data-id]')]
    .filter(o => occupantIds.has(o.getAttribute('data-id')))
  for (const occupant of inOrder) promoteZOrder(layerEl, occupant, seen)
}

/**
 * Move el to new centre (x, y), carrying its whole stack along with it —
 * whatever's sitting on el's tt_positions, and whatever's sitting on
 * THEIR positions, recursively — so a stack moves as one rigid body
 * rather than the base sliding out from under everything on top of it.
 *
 * Every member's offset is computed from a single upfront traversal (el's
 * own geometry, unchanged at this point) before anything is actually
 * moved, so later members in the walk never read another member's
 * already-updated position.
 */
export function moveToyAndStack(layerEl, el, x, y) {
  if (!el) return
  if (!getGeom(el)) { applyMoveDom(el, x, y); return }
  const anchor = getAnchor(el)
  const dx = x - anchor.x
  const dy = y - anchor.y

  const stack = []
  const seen = new Set()
  const collect = (member) => {
    const id = member.getAttribute('data-id')
    if (seen.has(id)) return
    seen.add(id)
    stack.push(member)
    if (!layerEl) return
    for (const occId of directOccupantIds(layerEl, member)) {
      const occEl = layerEl.querySelector(`:scope > [data-id="${occId}"]`)
      if (occEl) collect(occEl)
    }
  }
  collect(el)

  const targets = stack.map(member => {
    const hasGeom = !!getGeom(member)
    const a = hasGeom ? getAnchor(member) : null
    return { member, cx: a ? a.x + dx : x, cy: a ? a.y + dy : y }
  })
  for (const { member, cx, cy } of targets) applyMoveDom(member, cx, cy)
}

export function selectModes(domEl) {
  const ownSvg = domEl?.querySelector?.(':scope > svg')
  let modes = ['action']
  if (!!ownSvg?.classList.contains('tt-mode-resize')) {
    modes.push('resize')
  }
  if (!!ownSvg?.classList.contains('tt-mode-rummage')) {
    modes.push('rummage')
  }
  return modes
}

// Which selection mode a second click should cycle domEl into, given the
// mode it's currently in (or null). 'action' isn't part of this cycle --
// it's the static affordance shown alongside the ordinary selection ring,
// not something a click enters/exits. 'rummage' is a real capability tag
// some toy SVGs already carry (tt-mode-rummage, on trays/bags/supply) but
// has no gesture or rendering behind it yet, so it's deliberately excluded
// from the cycle for now: a rummage-capable container still just cycles
// resize -> none -> resize, the same as any other resizable toy, until
// rummage mode actually exists here.
export function nextSelectMode(domEl, currentKind) {
  if (!selectModes(domEl).includes('resize')) return null
  return currentKind === 'resize' ? null : 'resize'
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
 * Apply a resize to a live DOM element only — no Yjs write.
 * domEl is the rendered <g> wrapper.
 */
export function applyResizeDom(domEl, x, y, width, height) {
  if (!domEl) return
  const domSvg = domEl.querySelector?.('svg')
  if (!domSvg) return
  const toyId = domEl.getAttribute('data-id')
  const w = clampResizeDim(width)
  const h = clampResizeDim(height)

  domSvg.setAttribute('x', String(Math.round(x)))
  domSvg.setAttribute('y', String(Math.round(y)))
  domSvg.setAttribute('width',  String(w))
  domSvg.setAttribute('height', String(h))
  domSvg.setAttribute('viewBox', `0 0 ${w} ${h}`)

  if (!toyId) return
  for (const el of domSvg.querySelectorAll(`.${toyId}__tt_wh_follow_resize`)) {
    el.setAttribute('width',  String(w))
    el.setAttribute('height', String(h))
  }
}

// ── scoped id lookup for toy handler code ($) ───────────────────────────────
//
// Ids are namespaced per instance (see elementToYXml) so placed toys never
// collide, but that means a bare selector like '#pie4', the natural way
// to write toy handler code, won't match. rootEl.$(selector) rewrites
// every #token in the selector to the instance's namespaced id first, then
// queries from the toy's root <g>. A handler holding a nested element can
// reach it via elem.closest('g.toy').$(...)
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

/** A toy's rendered <g> wrapper, by toy id. Top level only, like findToy. */
export function findToyDom(layerEl, id) {
  return layerEl?.querySelector(`:scope > [data-id="${id}"]`) ?? null
}

/** Every top-level toy wrapper in z-order. */
export function listToysDom(layerEl) {
  return layerEl ? [...layerEl.querySelectorAll(':scope > g.toy')] : []
}

export function toysDataDom(layerEl) {
  return listToysDom(layerEl).map(toyData)
}

/** getTtState against the rendered DOM rather than the Yjs tree. */
export function getTtStateDom(toyEl) {
  if (!toyEl) return null
  const id      = toyEl.getAttribute('data-id')
  const toyType = toyEl.getAttribute('data-toy-type')
  const color   = toyEl.getAttribute('data-color') ?? '#888'
  const svgEl   = toyEl.querySelector(':scope > svg')
  const x       = svgEl ? Number(svgEl.getAttribute('x') ?? 0) : 0
  const y       = svgEl ? Number(svgEl.getAttribute('y') ?? 0) : 0
  const width   = svgEl ? Number(svgEl.getAttribute('width')  ?? FALLBACK_TOY_SIZE) : FALLBACK_TOY_SIZE
  const height  = svgEl ? Number(svgEl.getAttribute('height') ?? FALLBACK_TOY_SIZE) : FALLBACK_TOY_SIZE
  return { id, toyType, color, cx: x + width / 2, cy: y + height / 2 }
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
    options: [],
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
    name:    'chip',
    toyType: 'chip',
    file: 'chip.svg',
    label: 'Chip',
    iconUrl: 'toy/chip.svg',
    layer:   'toys',
    defaults: { fill: '#f8f8e5', value: 5 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Chip color', show: ['add', 'edit', 'addQuick'] },
      { kind: 'number', key: 'value', label: 'Chip value', min: 1, max: 25, step: 1, show: ['add'] },
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
  {
    name:    'supply',
    toyType: 'supply',
    file: 'supply.svg',
    label: 'Supply',
    iconUrl: 'toy/supply.svg',
    layer:   'toys',
    defaults: { fill: '#fafafa' },
    options: [
      { },
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
    name:    'token_glass',
    toyType: 'token_glass',
    file: 'token_glass.svg',
    label: 'Token',
    iconUrl: 'toy/token_glass.svg',
    layer:   'toys',
    defaults: { fill: '#fa2020', value: 0 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Token color', show: ['add', 'edit', 'addQuick'] },
      { kind: 'number', key: 'value', label: 'Token style', min: 0, max: 24, step: 1, show: ['add'] },
    ],
  },
  {
    name:    'single_poker_card',
    toyType: 'single_poker_card',
    file: 'single_poker_card.svg',
    label: 'Poker Card',
    iconUrl: 'toy/single_poker_card.svg',
    layer:   'toys',
    defaults: { fill: '#fa2020', suit: 1, rank: 1 },
    options: [
      { kind: 'color-hsl', key: 'fill', label: 'Back color', show: ['add', 'edit', 'addQuick'] },
      { kind: 'number', key: 'suit', label: 'Suit', min: 1, max: 4, step: 1, show: ['add'] },
      { kind: 'number', key: 'rank', label: 'Rank', min: 1, max: 13, step: 1, show: ['add'] },
    ],
  },
];
export const TOY_TYPES = {
  player_marker: TOOLS[0],
  dice_d6: TOOLS[1],
  chip: TOOLS[2],
  bag: TOOLS[3],
  supply: TOOLS[4],
  tray_sum: TOOLS[5],
  token_glass: TOOLS[6],
  single_poker_card: TOOLS[7],
  stack: {
    name:    'stack',
    toyType: 'stack',
    file: 'stack.svg',
    label: 'Stack',
    iconUrl: 'toy/stack.svg',
    layer:   'toys',
    defaults: {},
    options: [],
  },
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * A toy's own namespace(s) may define `editableFields(elem)`, returning
 * extra { values, types } beyond the generic color/name fields below — see
 * single_poker_card's suit/rank sliders. First namespace that defines it
 * wins; { values: {}, types: {} } if none do.
 */
function toyEditableFields(svgEl, toyType) {
  const ns = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .find(ns => ns && typeof ns.editableFields === 'function')
  return ns ? ns.editableFields(svgEl) : { values: {}, types: {} }
}

/**
 * Return the ttStateSchema for a rendered toy element.
 * Color is read from the data-color attribute on the <g> wrapper, which is
 * part of the Yjs tree and always in sync with the CRDT state.
 */
export function getTtStateSchema(svgEl) {
  const toyId = svgEl.getAttribute?.('data-id')
  if (!toyId) return null
  // Find elem's own '.tt_name' element — boundary-safe via id-prefix
  // matching, don't accidentally match a tt_contents-contained toy.
  const nameEl = svgEl.querySelector(`.${toyId}__tt_name`)
  function isColorable() {
    return svgEl.querySelector(`.${toyId}__tt_color_filter`) !== null
  }
  const { values: extraValues, types: extraTypes } =
    toyEditableFields(svgEl, svgEl.getAttribute('data-toy-type'))

  return {
    color: svgEl.getAttribute('data-color') ?? '#888',
    ...(nameEl ? { name: nameEl.textContent ?? '' } : {}),
    ...extraValues,
    types: {
      ...(isColorable(svgEl) ? { color: 'color-hsl' } : {}),   // hsl only — toy opacity is not user-editable
      ...(nameEl ? { name: { kind: 'string', show: ['edit'] } } : {}),
      ...extraTypes,
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
  const id      = yToy.getAttribute('data-id');
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
 * content-mutating toy operation now. Call from inside runInEnvelope;
 * this function doesn't open its own envelope.
 *   color — every one of the toy's own feColorMatrix nodes is updated and
 *           data-color on the toy's own wrapper is kept in sync.
 *   name  — the toy's own .tt_name text is overwritten (boundary-safe
 *           the same way — a container inside a container keeps its own name).
 */
export function editDom(toyEl, editData) {
  if (!toyEl) return
  const toyId = toyEl.getAttribute('data-id')
  if (!toyId) return
  const { color, name, ...rest } = editData

  if (color !== undefined) {
    const values = colorMatrixValues(color)
    toyEl.querySelectorAll(`.${toyId}__tt_color_filter`).forEach(filterEl => {
      filterEl.querySelectorAll(':scope > feColorMatrix').forEach(m => m.setAttribute('values', values))
    })
    toyEl.setAttribute('data-color', color)
  }
  if (name !== undefined) {
    const nameEl = toyEl.querySelector(`.${toyId}__tt_name`)
    if (nameEl) nameEl.textContent = String(name)
  }
  // Any remaining keys are a toy-defined editable field (see
  // toyEditableFields above) — hand them to whichever namespace declared
  // applyEdit, if any.
  if (Object.keys(rest).length) {
    const toyType = toyEl.getAttribute('data-toy-type')
    const ns = getNamespacesForType(toyType)
      .map(nsName => globalThis[nsName])
      .find(ns => ns && typeof ns.applyEdit === 'function')
    ns?.applyEdit(toyEl, rest)
  }
}

/**
 * Preview an edit on a detached ghost clone (see overlay.js's ghost
 * system, used via App.previewEdit) — mutates ghostEl's own attributes
 * directly, never touches Yjs. Unlike drawing.js's shapes, toy editData
 * keys map straight onto DOM attributes with no aliasing, so this is a
 * plain attribute-per-key loop.
 */
export function previewEdit(ghostEl, editData) {
  for (const [key, value] of Object.entries(editData)) {
    ghostEl.setAttribute(key, value)
  }
  // A toy-defined applyEdit (see toyEditableFields) also gets a shot at the
  // ghost — its own clone of the real toy, attribute-per-key isn't enough
  // to preview e.g. single_poker_card's suit/rank, which repaint several
  // descendant nodes together.
  const toyType = ghostEl.getAttribute?.('data-toy-type')
  const ns = getNamespacesForType(toyType)
    .map(nsName => globalThis[nsName])
    .find(ns => ns && typeof ns.applyEdit === 'function')
  ns?.applyEdit(ghostEl, editData)
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
    const url = `toy/${src}`
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

export function init(ydoc) {
  for (const toyType of Object.keys(TOY_TYPES)) {
    activateToyScripts(ydoc, toyType).catch(err => {
      console.error(`[toys] warm activation failed for toy type "${toyType}"`, err)
    })
  }
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

// ── gesture-triggered cascade (DOM-only, no Yjs until the final commit) ────
//
// invokeMenuAction / initializeToy use these.
//
// These walk the live DOM directly and never re-render, because a gesture's
// handler and everything it cascades into mutate the same live DOM in place
//
// nothing here is ever stale relative to Yjs, because nothing here depends on
// Yjs at all until the one commitEnvelope call at the very end.

/**
 * The IMMEDIATE (innermost) tt_contents-owning toy id for a DOM node —
 * or the node itself, if it IS a .tt_contents — or null.
 *
 * Deliberately
 * stops at the first match rather than walking the whole ancestor chain.
 * so that first match can react to any changes and then further ancestors
 * will get a chance to react to THOSE changes.
 */
function immediateContainingId(node) {
  let el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement
  while (el) {
    if (el.classList?.contains('tt_contents')) {
      // tt_contents -> container's own <svg> -> container's <g data-id>
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
 * Run containerEl's own contents_change_handler(s), if its toy type has
 * any registered — a plain, direct, synchronous call, not tied to any
 * mutation-record scanning. Used both by the generic end-of-gesture
 * cascade below and directly by reparentToyDom, so a reparent's own
 * container reaction doesn't have to wait for that scan to discover it.
 */
function runContentsChangeHandlersFor(containerEl) {
  if (!containerEl) return
  const handlers = getNamespacesForType(containerEl.getAttribute('data-toy-type'))
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.contents_change_handler === 'function')
  handlers.forEach(ns => ns.contents_change_handler(containerEl))
}

/**
 * Run the contents_change_handler cascade against the live DOM,
 * appending every record it produces into allRecords.
 *
 * (allRecords is mutated in place —
 * the caller feeds this to ONE final commitEnvelope call, so the gesture
 * and its whole cascade land as a single Yjs transaction, single undo
 * step).
 *
 * Each round resolves only the IMMEDIATE containing container for whatever
 * changed in the round before it
 *
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
      const records = runInEnvelope(containerEl, () => {
        runContentsChangeHandlersFor(containerEl)
      })
      stepRecords.push(...records)
    }
    allRecords.push(...stepRecords)
    toCheck = stepRecords
  }
}

/**
 * Run the relevant handler for each event in this gesture's
 * position events, invoked when a toy is placed onto (or
 * moves off of) another toy's position.
 */
function runPositionsChangeCascadeInto(allRecords, layerEl, events) {
  if (!events || !events.length) return
  const seen = new Set()
  const stepRecords = []
  for (const { fnName, elemId, positionId, ownerId, movingId } of events) {
    if (!fnName) continue

    // De-duplicate - run a handler AT MOST ONCE
    // A single element can legitimately receive more than one distinct
    // position event in one gesture (e.g. an occupant departing one
    // position and arriving at another).
    const dedupeKey = `${elemId}|${fnName}|${positionId}|${movingId}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const elem = layerEl.querySelector(`[data-id="${elemId}"]`)
    if (!elem) continue // e.g. deleted mid-gesture
    const handlers = getNamespacesForType(elem.getAttribute('data-toy-type'))
      .map(name => globalThis[name])
      .filter(ns => ns && typeof ns[fnName] === 'function')
    if (!handlers.length) continue
    const records = runInEnvelope(elem, () => {
      handlers.forEach(ns => ns[fnName](elem, positionId, ownerId, movingId))
    })
    stepRecords.push(...records)
  }
  if (!stepRecords.length) return
  allRecords.push(...stepRecords)
  // Let any DOM changes the position handlers made cascade into containers
  // the same way any other gesture mutation would.
  runContentsChangeCascadeInto(allRecords, layerEl)
}

export const LAYER_DATA_ID = 'tt-layer-toys'

export function ensureLayerId(layerEl) {
  if (layerEl && !layerEl.getAttribute('data-id')) layerEl.setAttribute('data-id', LAYER_DATA_ID)
  return layerEl
}

/**
 * Run fn() against the live DOM (inside an envelope observing layerEl),
 * then run whatever handler cascade fn's mutations
 * trigger, then commit the whole thing — the gesture and its entire
 * cascade, however many rounds — as ONE operation.
 * No re-rendering anywhere in this: the DOM stays authoritative and
 * current for every step, and nothing is committed until that final call.
 *
 * This is the shared machinery behind invokeMenuAction/
 * initializeToy (below) — also exported directly for a caller whose
 * gesture isn't a toy handler at all (see app.js's)
 * but still needs the exact same "one atomic operation, cascade included"
 * treatment.
 */
export function runGesture(ydoc, layerEl, fn, opts = {}) {
  ensureLayerId(layerEl)
  const allRecords = runInEnvelope(layerEl, fn)
  runContentsChangeCascadeInto(allRecords, layerEl)
  runPositionsChangeCascadeInto(allRecords, layerEl, opts.positionEvents)

  const { tableId } = opts
  let op = null
  if (tableId) {
    op = commitGesture(ydoc, allRecords, {
      gesture:  opts.gesture ?? 'gesture',
      authorId: opts.authorId ?? null,
      parents:  consumeParents(tableId),
    })
    if (op) {
      setHead(tableId, op.id)
      markProjectedAt(layerEl, op.id)
    }
  }
  return { op }
}

/**
 * Run fn(), guaranteeing its mutations land inside exactly one open
 * envelope — never zero (silently lost), never two (independently
 * captured and committed twice, replaying as duplicated DOM — see chat
 * notes on the nested-envelope clone-duplication bug this exists to
 * rule out generically, rather than call-site by call-site).
 *
 * If already inside an envelope (a toy handler's own request-event
 * dispatch, itself inside invokeMenuAction's or a cascade's own
 * envelope), fn just runs and folds in — nothing commits here, and
 * opts.gesture is never used for anything, because there is no "here"
 * to name; fn's mutations become part of whatever the ENCLOSING
 * envelope eventually commits under. If nothing encloses it, this opens
 * and commits its own single runGesture instead, so the mutation is
 * never silently dropped rather than duplicated. This is an envelope
 * guarantee, not a gesture guarantee — it never promises fn's work
 * becomes its own named, identifiable op; only that it's captured
 * exactly once.
 *
 * Returns { result, op } — result is fn()'s return value either way;
 * op is the committed operation, or null when this folded into an
 * enclosing envelope instead of committing one of its own.
 */
export function ensureEnvelope(ydoc, layerEl, fn, opts = {}) {
  if (isInsideEnvelope()) return { result: fn(), op: null }
  let result
  const { op } = runGesture(ydoc, layerEl, () => { result = fn() }, opts)
  return { result, op }
}

/**
 * Invoke a toy's menu action by (namespace, key) — the identifiers
 * getMenuActions() handed back. Re-validates applicable() first (UI state
 * may be stale — another peer's move could land between render and click).
 * Runs the handler inside an envelope, on the current tick, with any
 * container reaction the handler triggers folded into the SAME transaction
 * as the handler's own commit — one transaction, one undo step, no window
 * where the action landed but its reaction hadn't yet.
 *
 */
export function invokeMenuAction(ydoc, layerEl, svgEl, namespace, key, evt, authorId, tableId) {
  const ns    = globalThis[namespace]
  const entry = ns?.menu?.[key]
  if (!entry || typeof entry.handler !== 'function') {
    throw new Error(`[toys] no such menu action: ${namespace}.${key}`)
  }
  if (typeof entry.applicable === 'function' && !entry.applicable(svgEl)) {
    throw new Error(`[toys] menu action not applicable: ${namespace}.${key}`)
  }
  let result
  /*
   * Note: Wrapped in an outer, unlabeled ydoc.transact() so a folded caller's
   * commit lands under null, the same as every other folded call site (see
   * undo_redo.js's "Atomicity" note).
   */
  ydoc.transact(() => {
    result = runGesture(ydoc, layerEl, () => entry.handler.call(svgEl, evt),
      { gesture: `menu:${namespace}.${key}`, authorId, tableId })
  })
  return result
}

// ── lifecycle ────────────────────────────────────────────────────────────

/**
 * Run every activated namespace's initialize(elem), if present, for a
 * freshly placed/cloned toy instance
 */
export function runInitializers(svgEl, toyType, initArgs) {
  const initializers = getNamespacesForType(toyType)
    .map(name => globalThis[name])
    .filter(ns => ns && typeof ns.initialize === 'function')
  initializers.forEach(ns => ns.initialize(svgEl, initArgs))
}

export function initializeToy(ydoc, layerEl, svgEl, toyType, authorId, tableId, initArgs) {
  if (!getNamespacesForType(toyType).some(name => typeof globalThis[name]?.initialize === 'function')) return
  ydoc.transact(() => {
    runGesture(ydoc, layerEl, () => {
      runInitializers(svgEl, toyType, initArgs)
    }, { gesture: 'initialize', authorId, tableId })
  })
}

/**
 * Scans a rendered layer for every distinct data-toy-type present and
 * activates each once per session. A toy synced in rather than placed
 * locally would render its markup and attributes fine — the color widget
 * doesn't need a namespace — but its menu would stay permanently empty,
 * since getMenuActions reads globalThis[namespace].menu and nothing had
 * ever populated it.
 */
export function activateAllToyScriptsDom(ydoc, layerEl) {
  if (!layerEl) return
  const seen = new Set()
  for (const el of layerEl.querySelectorAll('[data-toy-type]')) {
    const toyType = el.getAttribute('data-toy-type')
    if (!toyType || seen.has(toyType) || isToyTypeActivated(toyType)) continue
    seen.add(toyType)
    activateToyScripts(ydoc, toyType).catch(err => {
      console.error(`[toys] script activation failed for toy type "${toyType}"`, err)
    })
  }
}

/**
 * Bring the layer to the state the op log describes.
 *
 * An empty log means this table predates the log (or is brand new): render
 * from the Yjs tree once and freeze the result as the genesis checkpoint,
 * so there is always a checkpoint at the root to project from.
 *
 * Returns the head it left the layer at.
 *
 * isCreator matters only on the "the log is empty" path, and it has to be
 * the same signal index.html already uses to decide whether to mint a
 * fresh table id: !location.hash, computed once, at the top of boot.
 * "My local ops map has nothing in it" is NOT that signal — it's also
 * true for a joiner who arrived before the creator's genesis has synced
 * in, and minting a checkpoint there forks the table's history before
 * anyone has done anything. Two peers can't both create the same table;
 * exactly one of them generated the hash the other one joined.
 *
 * A non-creator with an empty log takes no genesis and returns null —
 * there is nothing yet to project, and inventing something would be
 * exactly the bug this guards against. The caller re-renders once the
 * real genesis arrives (see app.js's ops-Map observer).
 */
export function projectLayer(ydoc, layerEl, { tableId, authorId, isCreator = false } = {}) {
  ensureLayerId(layerEl)
  const ops = getOps(ydoc)

  if (ops.size === 0) {
    if (!isCreator) return null
    const genesis = checkpointOp(layerEl, { authorId, parents: [] })
    appendOp(ydoc, genesis)
    if (tableId) setHead(tableId, genesis.id)
    markProjectedAt(layerEl, genesis.id)
    return genesis.id
  }

  const head = (tableId && getHead(tableId)) ?? null
  const target = (head && getOp(ops, head)) ? head : (heads(ops)[0] ?? null)
  if (!target) return null

  // Already showing this state — reprojecting would discard a DOM that
  // gestures and remote operations have been maintaining in place.
  if (projectedAt(layerEl) === target) return target

  projectFrom(layerEl, ops, target)
  activateAllToyScriptsDom(ydoc, layerEl)
  if (tableId) setHead(tableId, target)
  markProjectedAt(layerEl, target)
  return target
}

export const HEAD_MARKER = 'data-tt-head'

/** Which operation the layer's DOM currently reflects. */
export const projectedAt = (layerEl) => layerEl?.getAttribute(HEAD_MARKER) ?? null

export function markProjectedAt(layerEl, opId) {
  if (layerEl && opId) layerEl.setAttribute(HEAD_MARKER, opId)
  return layerEl
}

/**
 * Place a toy via the DOM, as a gesture.
 *
 * The template fetch is async and happens first, outside the envelope —
 * the gesture itself has to stay synchronous, and the fetch is not part
 * of what the gesture did.
 */
export async function placeToy(ydoc, layerEl, attrs, opts = {}) {
  const svgText = await fetchToySvgText(attrs.toyType)
  let toyEl = null
  runGesture(ydoc, layerEl, () => {
    toyEl = addToyDom(ydoc, layerEl, attrs, svgText)
  }, { gesture: 'place', ...opts })
  activateToyScripts(ydoc, attrs.toyType)
  return toyEl
}

/**
 * Commit pre-parsed foreign toy elements — storage.js's populateFromSvgDoc,
 * live-table branch — onto a live layer as one gesture, chaining onto the
 * current op-log head the same way placeToy does for a single toy. Named
 * importToys rather than import: the latter is a reserved word and can't
 * be a function identifier.
 */
export function importToys(ydoc, layerEl, toyEls, opts = {}) {
  if (!toyEls?.length) return null
  const result = runGesture(ydoc, layerEl, () => {
    toyEls.forEach(el => layerEl.appendChild(el))
  }, { gesture: 'import', ...opts })
  activateAllToyScriptsDom(ydoc, layerEl)
  return result
}

/**
 * Apply one arriving operation to the toys layer, keeping the head, any
 * merge tips, and the projection marker (render()'s idempotence check)
 * all consistent with what actually happened.
 *
 * True only if every wire entry's target resolves against layerEl right
 * now. Read-only — touches nothing. apply() applies entries one at a
 * time and throws on the first unresolvable target, which can leave
 * earlier entries in a batch already mutated with nothing committed to
 * describe it; undo needs to know *before* touching anything, since a
 * half-applied inverse with no corresponding operation is exactly the
 * silent-divergence apply() is designed to refuse, just reached a
 * different way.
 */
function canApplyWire(wire, layerEl) {
  for (const entry of wire ?? []) {
    if (!resolveRef(entry.target, layerEl)) return false
  }
  return true
}

/**
 * Undo/redo, backed by op_dag.toyUndoRedoStacks — a real undo/redo stack,
 * reconstructed by replaying this author's own ops rather than a single
 * backward pointer walk. That distinction matters: skipping past an
 * 'undo' op and continuing to its *parent* doesn't reach an older
 * action — an undo's parent IS the op it just inverted, by construction,
 * so that walk just finds the same thing again. Repeated Undo presses
 * need the full stack simulation to reach progressively older gestures
 * instead of toggling between the last two.
 *
 * Both skip checkpoints inherently (toyUndoRedoStacks never pushes one):
 * a genesis checkpoint is authored to whoever took it, so on a fresh
 * table it would otherwise look like "my most recent op" with nothing
 * else having happened yet — but it isn't a user action, it's
 * "reconstruct this state from scratch." Undoing it would mean deleting
 * everything.
 */
function applyToyUndoRedo(ydoc, layerEl, tableId, authorId, targetId, verb) {
  if (!targetId) return null
  const ops = getOps(ydoc)
  const target = getOp(ops, targetId)
  const inverseMutations = invertWire(target.mutations)
  if (!canApplyWire(inverseMutations, layerEl)) return null

  // Strip one leading 'undo:'/'redo:' from the target's own gesture, so
  // the new tag always names the ORIGINAL real action — 'undo:move',
  // 'redo:move' — never nests ('redo:undo:move'), no matter how many
  // times something gets toggled back and forth. This is what lets a
  // caller show a real label ("undid: move") instead of "undid: undo".
  const describedGesture = target.gesture.replace(/^(undo|redo):/, '')

  const result = runGesture(ydoc, layerEl, () => {
    applyWire(inverseMutations, layerEl)
  }, { gesture: `${verb}:${describedGesture}`, authorId, tableId })

  return result.op ?? null
}

export function undoToyGesture(ydoc, layerEl, tableId, authorId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  const { undoTargetId } = toyUndoRedoStacks(ops, head, authorId)
  return applyToyUndoRedo(ydoc, layerEl, tableId, authorId, undoTargetId, 'undo')
}

export function redoToyGesture(ydoc, layerEl, tableId, authorId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  const { redoTargetId } = toyUndoRedoStacks(ops, head, authorId)
  return applyToyUndoRedo(ydoc, layerEl, tableId, authorId, redoTargetId, 'redo')
}

/**
 * Delete several toys as one gesture, one operation — not one runGesture
 * call per id. commitGesture has no free nested-transaction collapsing the
 * way Y.UndoManager gives drawing/boundaries; a loop of individual
 * L.delete(id) calls would mint N separate operations, and undo only ever
 * reverses "my most recent one" — a multi-delete would need N separate undo
 * presses to fully reverse instead of one. Used by app.js's
 * deleteMultiSelected when the (uniform, since a selection can never span
 * layers) selection is toys.
 *
 * Returns the resulting operation, or null if nothing was actually deleted
 * (every id already gone).
 */
export function deleteToysBatch(ydoc, layerEl, ids, { authorId, tableId } = {}) {
  let deletedAny = false
  const result = runGesture(ydoc, layerEl, () => {
    for (const id of ids) {
      if (deleteToyDom(layerEl, id)) deletedAny = true
    }
  }, { gesture: 'delete-batch', authorId, tableId })
  return deletedAny ? (result.op ?? null) : null
}

/**
 * Move several toys as one gesture, one operation. Same reasoning as
 * deleteToysBatch. moves: [{ id, x, y }] — x/y are the same centre-point
 * convention applyMoveDom/applyMoveCommit already use.
 *
 * Each move also promotes that toy (and, recursively, whatever's stacked
 * on its own tt_positions) to the topmost z-order, same as
 * applyMoveCommit's single-toy path — so multi-dragging a stack still
 * brings it to front. In array order, so the last move in the batch ends
 * up on top of the others.
 *
 * Unlike applyMoveCommit, this does NOT carry occupant stacks along
 * positionally, and does NOT run the positions_change_handler cascade —
 * only single-toy moves get that full treatment for now.
 */
export function moveToysBatch(ydoc, layerEl, moves, { authorId, tableId } = {}) {
  let movedAny = false
  const result = runGesture(ydoc, layerEl, () => {
    for (const { id, x, y } of moves) {
      const el = findToyDom(layerEl, id)
      if (!el) continue
      promoteZOrder(layerEl, el)
      applyMoveDom(el, x, y)
      movedAny = true
    }
  }, { gesture: 'move-batch', authorId, tableId })
  return movedAny ? (result.op ?? null) : null
}

/**
 * Cheap existence checks for the undo/redo buttons' enabled state — no DOM
 * needed, no mutation. canApplyWire's resolvability check still runs at
 * actual undo/redo time, so a button can be enabled and the press can still
 * turn out to be a no-op if the target vanished between the check and the
 * click; that's an acceptable, minor imprecision most editors share.
 */
export function canUndoToyGesture(ydoc, tableId, authorId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  return toyUndoRedoStacks(ops, head, authorId).undoTargetId != null
}

export function canRedoToyGesture(ydoc, tableId, authorId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  return toyUndoRedoStacks(ops, head, authorId).redoTargetId != null
}

/**
 * Move this peer's own view of the toys layer to targetHeadId, regardless
 * of whether it's a descendant of the current head or a genuinely
 * different branch this peer never had. Used when resolving a conflict:
 * every peer — whether or not they authored anything on the losing side —
 * ends up looking at the leader. The session never "leaves" the shared
 * table; a fork is a separate table entirely, a background event, not a
 * navigation away from this one.
 */
export function adoptToyBranch(ydoc, layerEl, targetHeadId, tableId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  advanceTo(layerEl, ops, head, targetHeadId)
  activateAllToyScriptsDom(ydoc, layerEl)
  if (tableId) setHead(tableId, targetHeadId)
  markProjectedAt(layerEl, targetHeadId)
}

export function receiveToyOp(ydoc, layerEl, opId, tableId) {
  const ops = getOps(ydoc)
  const head = tableId ? getHead(tableId) : null
  const out = receiveOp(layerEl, ops, head, opId)

  if (out.result !== 'received-known' && out.result !== 'received-conflict') {
    activateAllToyScriptsDom(ydoc, layerEl)
  }
  if (out.head && out.head !== head) {
    if (tableId) setHead(tableId, out.head)
    markProjectedAt(layerEl, out.head)
  }
  if (out.mergeTip && tableId) addMergeTip(tableId, out.mergeTip)

  return out
}

/**
 * Decide what a conflicting arrival means for THIS peer, without
 * touching any DOM or ydoc: label leader/splitter (op_dag.labelBranches),
 * then check whether authorId contributed to the splitter.
 *
 * A bystander (didn't) just needs to know which branch is the leader, to
 * adopt it silently. A peer who authored on the splitter needs a fork —
 * orderedIds is ready to hand to tables.js's forkLiveDoc; opsSeed is NOT
 * computed here (it needs a real projected layer, real DOM work, only
 * worth doing in the fork case)
 */
export function resolveToyBranchConflict(ydoc, tips, { authorId, joinSequence = [] } = {}) {
  const ops = getOps(ydoc)
  const { leader, splitter, lca } = labelBranches(ops, tips[0], tips[1], joinSequence)
  const authors = branchAuthors(ops, splitter, lca)

  if (!authors.has(authorId)) {
    return { leader, splitter, lca, authoredSplitter: false }
  }

  return {
    leader, splitter, lca, authoredSplitter: true,
    orderedIds: forkJoinSequence(joinSequence, authors),
  }
}

/**
 * The DOM-touching half of resolving a conflict this peer is on the
 * losing side of: project a scratch layer to lca (buildForkSeed needs a
 * real layer to checkpoint from) and build the fork's seed content.
 * Only worth calling when resolveToyBranchConflict reported
 * authoredSplitter: true.
 */
export function buildToyForkSeed(ydoc, lca, splitter, { authorId, joinSequence = [] } = {}) {
  const ops = getOps(ydoc)
  const scratch = document.createElementNS(SVG_NS, 'g')
  projectFrom(scratch, ops, lca, joinSequence)
  return buildForkSeed(ops, lca, splitter, scratch, { authorId, joinSequence })
}

/**
 * makeLayerAPI — the canonical LayerAPI for the toys layer.
 *
 * getLayerEl returns the live #toys-layer. Everything here reads and
 * writes that DOM; writes run inside runGesture so the envelope
 * captures them. The contract app.js relies on is that whatever find()
 * returns is what the other methods accept — here, a rendered <g>.
 */
export function makeLayerAPI(ydoc, getLayerEl, myId, tableId, isCreator = false) {  const layer = () => (typeof getLayerEl === 'function' ? getLayerEl() : getLayerEl)
  const gesture = (name, fn, extraOpts = {}) =>
    runGesture(ydoc, layer(), fn, { gesture: name, authorId: myId, tableId, ...extraOpts })

  return {
    find:            (id)            => findToyDom(layer(), id),
    delete:          (id)            => gesture('delete', () => deleteToyDom(layer(), id)),
    getGeom,
    getAnchor,
    getTtState:      getTtStateDom,
    getTtStateSchema,
    selectModes,
    nextSelectMode,
    applyMoveCommit: (el, x, y) => {
      const layerEl = layer()
      const oldAnchor = getAnchor(el)
      const moved = oldAnchor.x !== x || oldAnchor.y !== y
      const positionEvents = moved
        ? [...departingPositionEvents(layerEl, el), ...arrivingPositionEvents(layerEl, el, x, y)]
        : []
      return gesture('move', () => {
        promoteZOrder(layerEl, el)          // step 2: el + its whole stack, to the front
        moveToyAndStack(layerEl, el, x, y)  // step 4: el + its whole stack, to the new spot
      }, { positionEvents })                // step 5: runGesture's own cascade
    },
    applyResize:     (el, x, y, w, h) => gesture('resize', () => applyResizeDom(el, x, y, w, h)),
    edit:            (el, editData)  => gesture('edit',   () => editDom(el, editData)),
    previewEdit,
    listData:        ()              => toysDataDom(layer()),
    render:          (layerEl)       => projectLayer(ydoc, layerEl, { tableId, authorId: myId, isCreator }),
    receive:         (layerEl, opId) => receiveToyOp(ydoc, layerEl, opId, tableId),
  };
}
