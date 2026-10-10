/**
 * boun_pos.js — complete module for the Boundaries and Positions layer, an op
 * layer (BOUN_POS_LAYER).
 *
 * Both element types are <g> siblings in #boun_pos-layer.
 * data-bounpos-type="boundary" | "pos-set" distinguishes them. Every write is
 * a DOM operation on the live layer, run inside a gesture (OpLayer.runGesture)
 * so the envelope captures it as one operation; the op log is the replicated
 * state. Requires a DOM (browser or jsdom).
 *
 * World position = children's local coordinates + the group's
 * transform="translate(tx, ty)" (absent means 0, 0). A move changes only the
 * transform; elements created before this layout have absolute children and
 * no transform, and read the same way.
 *
 * Boundary structure:
 *   <g id data-id data-module name data-bounpos-type="boundary" transform>
 *     <path d/>
 *     <text x y>name</text>
 *
 * Position-set structure:
 *   <g id data-id data-module name data-bounpos-type="pos-set" transform data-snap-radius data-gen-type data-gen-x-spacing data-gen-y-spacing>
 *     <path d/>   ← extent rect
 *     <text x y>name</text>
 *     <circle cx cy r/>   … N snap points
 *
 * ID formats:
 *   boundary:    tt-b-v1-XXXXX
 *   position set: tt-ps-v1-XXXXX
 */

import { computeResizeCornerRect } from './geometry.js';
import { defineOpLayer } from './op_layers.js';
import * as OpLayer from './op_layer.js';

const SVG_NS   = 'http://www.w3.org/2000/svg';
const ID_CHARS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHLMNPQRTUV2346789';

// ── ID helpers ────────────────────────────────────────────────────────────────

function randomSlug(len = 3) {
  return Array.from({ length: len }, () =>
    ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  ).join('');
}

export function newBoundaryId() {
  const slug = randomSlug();
  return { id: `tt-b-v1-${slug}`, name: 'toy' };
}

export function newPositionSetId() {
  const slug = randomSlug();
  return { id: `tt-ps-v1-${slug}`, name: 'toy' };
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

export function rectToPath(x, y, w, h) {
  const x2 = x + w, y2 = y + h;
  return `M${x},${y} L${x2},${y} L${x2},${y2} L${x},${y2} Z`;
}

export function pathToRect(d) {
  const nums = (d.match(/[-\d.]+/g) ?? []).map(Number);
  const [x, y, x2, , , y2] = nums;
  return { x, y, w: x2 - x, h: y2 - y };
}

const TRANSLATE_RE = /^\s*translate\(\s*(-?[\d.]+(?:e-?\d+)?)(?:[\s,]+(-?[\d.]+(?:e-?\d+)?))?\s*\)\s*$/i;

// Reads el's translate(tx, ty) from a DOM element. Anything
// other than a bare translate is read as (0, 0) and left alone: these
// elements never carry rotate or scale, so an imported transform of another
// shape isn't ours to interpret.
export function translationOf(el) {
  const m = TRANSLATE_RE.exec(el?.getAttribute?.('transform') ?? '');
  if (!m) return { tx: 0, ty: 0 };
  return { tx: Number(m[1]), ty: Number(m[2] ?? 0) };
}

function translateAttr(tx, ty) {
  return `translate(${tx}, ${ty})`;
}

// Path rect in the element's local coordinates, and in world coordinates.
function localRectOf(pathEl, fallback = 'M0,0 L0,0 L0,0 L0,0 Z') {
  return pathToRect(pathEl?.getAttribute('d') ?? fallback);
}

function worldRectOf(el, pathEl) {
  const r = localRectOf(pathEl);
  const { tx, ty } = translationOf(el);
  return { x: r.x + tx, y: r.y + ty, w: r.w, h: r.h };
}

export function toolParamsToCreateParams(genType, toolParams, {x, y, w, h}) {
  let xSpacing;
  let ySpacing;
  if (genType.search('hex') > -1) {
    xSpacing = toolParams['xSpacing'] ?? 40
    ySpacing = toolParams['ySpacing'] ?? 40
  } else {
    // Allow the 'spacing' parameter in the quickOptions
    xSpacing = toolParams['spacing'] ?? toolParams['xSpacing'] ?? 80
    ySpacing = toolParams['spacing'] ?? toolParams['ySpacing'] ?? 80
  }
  const sLevel = toolParams['snapRadius'] ?? 2;
  const snapRadius = snapRadiusLevelToRadius(sLevel, genType, xSpacing, ySpacing)
  const circles    = gridFillExtent(x, y, w, h, genType, xSpacing, ySpacing)
  return { snapRadius, xSpacing, ySpacing, circles }
}

/**
 * Compute the circle positions + shared radius for genType/xSpacing/
 * ySpacing within an extent rect ({x,y,w,h}), at the given snapRadius
 * level (1-4)
 * Exposed separately (pure) so a live preview can compute the
 * identical result without writing anything
 */
export function computeGridPositions(extent, genType, xSpacing, ySpacing, snapRadiusLevel) {
  const { x, y, w, h } = extent;
  const circles = gridFillExtent(x, y, w, h, genType, xSpacing, ySpacing);
  const r = snapRadiusLevelToRadius(snapRadiusLevel ?? 2, genType, xSpacing, ySpacing);
  return { circles, r };
}

// Regenerates el's grid attributes and circles against its path's own extent,
// in the element's local coordinates.
function rebuildPositionSetGrid(el, { genType, xSpacing, ySpacing, snapRadiusLevel }) {
  const path = childByTag(el, 'path');
  if (!path) return;

  const extent = pathToRect(path.getAttribute('d') ?? 'M0,0 L100,0 L100,100 L0,100 Z');
  const { circles, r } = computeGridPositions(extent, genType, xSpacing, ySpacing, snapRadiusLevel);

  el.setAttribute('data-gen-type',      genType);
  el.setAttribute('data-gen-x-spacing', String(Math.round(xSpacing)));
  el.setAttribute('data-gen-y-spacing', String(Math.round(ySpacing)));
  el.setAttribute('data-snap-radius',   String(Math.round(r)));

  for (const child of [...el.children]) {
    if (child.localName === 'circle') child.remove();
  }
  for (const { cx, cy } of circles) el.appendChild(makeCircle(cx, cy, r));
}

// ── Grid math (pure, fully testable) ─────────────────────────────

export function generateSquareGrid(origin, rows, cols, xSpacing, ySpacing = xSpacing) {
  const points = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        cx: origin.x + col * xSpacing,
        cy: origin.y + row * ySpacing,
      });
    }
  }
  return points;
}

/**
 * Pointy-top hex grid (redblobgames.com standard).
 */
export function generateHexGrid(origin, rows, cols, xSpacing, ySpacing) {
  const oddOffset = xSpacing / 2;
  const points = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        cx: origin.x + col * xSpacing + (row % 2) * oddOffset,
        cy: origin.y + row * ySpacing,
      });
    }
  }
  return points;
}

/**
 * Flat-top hex grid (redblobgames.com standard).
 */
export function generateFlatHexGrid(origin, rows, cols, xSpacing, ySpacing) {
  const oddOffset = ySpacing / 2;
  const points = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      points.push({
        cx: origin.x + col * xSpacing,
        cy: origin.y + row * ySpacing + (col % 2) * oddOffset,
      });
    }
  }
  return points;
}

function gridSpacingFromInput(genType, input = {}) {
  if (input.xSpacing !== undefined || input.ySpacing !== undefined) {
    const xSpacing = Number(input.xSpacing ?? input.ySpacing ?? input.spacing ?? input['hex-size'] ?? 80);
    const ySpacing = Number(input.ySpacing ?? input.xSpacing ?? input.spacing ?? input['hex-size'] ?? xSpacing);
    return { xSpacing, ySpacing };
  }

  const legacy = Number(input.spacing ?? input['hex-size'] ?? input.genParam ?? 80);
  if (genType === 'hex') {
    // Pointy-top:
    // *   colSpacing = hexSize * √3
    // *   rowSpacing = hexSize * 1.5
    // *   odd rows offset by hexSize * √3/2
    return { xSpacing: legacy * Math.sqrt(3), ySpacing: legacy * 1.5 };
  }
  if (genType === 'flat-hex') {
    // Flat-top:
    // *   colSpacing = hexSize * 1.5
    // *   rowSpacing = hexSize * √3
    // *   odd columns offset by hexSize * √3/2
    return { xSpacing: legacy * 1.5, ySpacing: legacy * Math.sqrt(3) };
  }
  return { xSpacing: legacy, ySpacing: legacy };
}

/**
 * Fill an extent rect with snap points for genType / genParam.
 * Returns [{cx,cy}] clipped to the extent.
 */
export function gridFillExtent(x, y, w, h, genType, xSpacing, ySpacing) {
  if (genType === 'hex') {
    const cols = Math.ceil(w / xSpacing) + 2;
    const rows = Math.ceil(h / ySpacing) + 2;
    return generateHexGrid({ x, y }, rows, cols, xSpacing, ySpacing)
      .filter(p => p.cx >= x && p.cx <= x + w && p.cy >= y && p.cy <= y + h);
  }

  if (genType === 'flat-hex') {
    const cols = Math.ceil(w / xSpacing) + 2;
    const rows = Math.ceil(h / ySpacing) + 2;
    return generateFlatHexGrid({ x, y }, rows, cols, xSpacing, ySpacing)
      .filter(p => p.cx >= x && p.cx <= x + w && p.cy >= y && p.cy <= y + h);
  }

  const cols = Math.ceil(w / xSpacing) + 1;
  const rows = Math.ceil(h / ySpacing) + 1;
  return generateSquareGrid({ x, y }, rows, cols, xSpacing, ySpacing)
    .filter(p => p.cx >= x && p.cx <= x + w && p.cy >= y && p.cy <= y + h);
}

/**
 * Maximum snap radius before zones overlap within a single set.
 *   square: spacing / 2
 *   hex:    hexSize * √3/2  (= inradius / short radius)
 */
export function computeMaxSnapRadius(genType, xSpacing, ySpacing) {
  const x = Number(xSpacing);
  const y = Number(ySpacing);

  if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return 0;

  if (genType === 'hex') {
    const nearest = Math.min(x, Math.sqrt((x / 2) ** 2 + y ** 2));
    return nearest / 2;
  }

  if (genType === 'flat-hex') {
    const nearest = Math.min(x, y, Math.sqrt(x ** 2 + (y / 2) ** 2));
    return nearest / 2;
  }

  return Math.min(x, y) / 2;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function snapRadiusLevelToRadius(level, genType, xSpacing, ySpacing) {
  const maxR = computeMaxSnapRadius(genType, xSpacing, ySpacing);
  const pct  = clamp(Number(level ?? 2), 1, 4) / 4;
  return Math.round(maxR * pct);
}

function snapRadiusStateToRadius(value, genType, xSpacing, ySpacing) {
  const maxR = computeMaxSnapRadius(genType, xSpacing, ySpacing);
  const n = Number(value ?? 0);
  if (!Number.isFinite(maxR) || maxR <= 0) return 0;
  if (n <= 4) return snapRadiusLevelToRadius(n, genType, xSpacing, ySpacing);
  return Math.round(Math.min(n, maxR));
}

function snapRadiusRadiusToLevel(radius, genType, xSpacing, ySpacing) {
  const maxR = computeMaxSnapRadius(genType, xSpacing, ySpacing);
  if (!Number.isFinite(maxR) || maxR <= 0) return 2;
  return clamp(Math.round((Number(radius ?? 0) / maxR) * 4), 1, 4);
}

// ── Internal child-element helpers ────────────────────────────────────────────

function childByTag(el, tag) {
  for (const c of el?.children ?? []) if (c.localName === tag) return c;
  return null;
}

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function makeCircle(cx, cy, r) {
  return svgEl('circle', { cx: Math.round(cx), cy: Math.round(cy), r: Math.round(r) });
}

// Change a <text>'s label in place: the existing text node's data when there
// is one, so the envelope records a text mutation, else a fresh text node.
function setTextContent(textEl, newText) {
  const node = [...textEl.childNodes].find(n => n.nodeType === 3);
  if (node) node.data = newText;
  else textEl.appendChild(document.createTextNode(newText));
}

// The <g>, <path> and <text> shared by both element types, in local
// coordinates with the label at the top-right corner.
function buildGroup(bounPosType, { id, name, x, y, w, h }) {
  const g = svgEl('g', {
    id,
    'data-id':           id,
    'data-module':       'boun_pos',
    name,
    'data-bounpos-type': bounPosType,
    transform:           translateAttr(x, y),
  });
  g.appendChild(svgEl('path', { d: rectToPath(0, 0, w, h) }));
  const text = svgEl('text', { x: w, y: -5 });
  text.appendChild(document.createTextNode(name));
  g.appendChild(text);
  return g;
}

// ── Type registry ─────────────────────────────────────────────────────────────
// One entry per tool name. Everything that differs between a boundary, a square
// grid, and a hex grid lives here.
//
// Fields:
//   bounPosType  — the data-bounpos-type value on the element ('boundary'|'pos-set')
//   label        — human label for the schema / layer panel
//   iconUrl      — path to the tool icon SVG (fetched by ui.js iconFor())
//   newId()      — returns { id, name } for a fresh element
//   genType      — 'square'|'hex'|null (null for boundaries)
//   schema       — ttStateSchema shape: { label, values, types }
//   create(layerEl, params) — build the element and append it to the layer
//                             (call inside a gesture)
//
// app.js builds the tool registry from Object.entries(BOUNPOS_TYPES).
export const BOUNPOS_TYPES = {
  boundary: {
    bounPosType: 'boundary',
    label:       'Boundary',
    iconUrl:     'boun_pos/boundary.svg',
    newId:       newBoundaryId,
    genType:     null,
    schema: {
      label:  'Boundary',
      values: { type: 'boundary', name: '' },
      types: {
        type: { show: [] },
        name: { kind: 'string', show: ['add', 'edit'] },
      },
    },
    create(layerEl, params) {
      const g = buildGroup('boundary', params);
      layerEl.appendChild(g);
      return g;
    },
  },

  'pos-grid-sq': {
    bounPosType: 'pos-set',
    label:       'Square Grid',
    iconUrl:     'boun_pos/pos-grid-sq.svg',
    newId:       newPositionSetId,
    genType:     'square',
    schema: {
      label:  'Square Grid',
      values: { type: 'pos-set', name: '', snapRadius: 2, spacing: 80, xSpacing: 80, ySpacing: 80 },
      types: {
        type:       { show: [] },
        name:       { kind: 'string', show: ['add', 'edit'] },
        snapRadius: { kind: 'number', min: 1, max: 4, step: 1, show: ['edit'] },
        spacing:    { kind: 'number', min: 20, max: 200, step: 4, show: ['addQuick'] },
        xSpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
        ySpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
      },
    },
    create(layerEl, params) {
      return _createPositionSet(layerEl, params);
    },
  },

  'pos-grid-hex': {
    bounPosType: 'pos-set',
    label:       'Point Top Hex Grid',
    iconUrl:     'boun_pos/pos-grid-hex.svg',
    newId:       newPositionSetId,
    genType:     'hex',
    schema: {
      label:  'Point Top Hex Grid',
      values: { type: 'pos-set', name: '', snapRadius: 2, xSpacing: 70, ySpacing: 60 },
      types: {
        type:       { show: [] },
        name:       { kind: 'string', show: ['add', 'edit'] },
        snapRadius: { kind: 'number', min: 1, max: 4, step: 1, show: ['edit'] },
        xSpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
        ySpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
      },
    },
    create(layerEl, params) {
      return _createPositionSet(layerEl, params);
    },
  },
  
  'pos-grid-flat-hex': {
    bounPosType: 'pos-set',
    label:       'Flat Top Hex Grid',
    iconUrl:     'boun_pos/pos-grid-hex.svg',
    newId:       newPositionSetId,
    genType:     'flat-hex',
    schema: {
      label:  'Flat Top Hex Grid',
      values: { type: 'pos-set', name: '', snapRadius: 2, xSpacing: 60, ySpacing: 70 },
      types: {
        type:       { show: [] },
        name:       { kind: 'string', show: ['add', 'edit'] },
        snapRadius: { kind: 'number', min: 1, max: 4, step: 1, show: ['edit'] },
        xSpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
        ySpacing:   { kind: 'number', min: 30, max: 200, step: 1, show: ['edit'] },
      },
    },
    create(layerEl, params) {
      return _createPositionSet(layerEl, params);
    },
  },
};

// Helper used by all pos-set variants.
function _createPositionSet(layerEl,
  { id, name, snapRadius, genType, xSpacing, ySpacing, x, y, w, h, circles }) {
  const g = buildGroup('pos-set', { id, name, x, y, w, h });
  g.setAttribute('data-snap-radius',   String(Math.round(snapRadius)));
  g.setAttribute('data-gen-type',      genType);
  g.setAttribute('data-gen-x-spacing', String(Math.round(xSpacing)));
  g.setAttribute('data-gen-y-spacing', String(Math.round(ySpacing)));
  // Callers pass circles in world coordinates; they're stored relative to (x, y).
  for (const { cx, cy } of circles ?? []) g.appendChild(makeCircle(cx - x, cy - y, snapRadius));
  layerEl.appendChild(g);
  return g;
}

// ── Element operations ────────────────────────────────────────────────────────

export function findEl(layerEl, id) {
  for (const el of layerEl?.children ?? []) {
    if (el.getAttribute('data-id') === id) return el;
  }
  return null;
}

export function deleteEl(layerEl, id) {
  const el = findEl(layerEl, id);
  if (!el) return false;
  el.remove();
  return true;
}

export function applyMoveCommit(el, x, y) {
  if (!el) return;
  const path = childByTag(el, 'path');
  if (!path) return;

  const { x: localX, y: localY } = localRectOf(path);
  el.setAttribute('transform', translateAttr(x - localX, y - localY));
}

const MIN_BOUNPOS_RESIZE_SIZE = 30; // Can't resize below this limit

export function computeResize(mode, startRect, corner, px, py) {
  return computeResizeCornerRect(startRect, corner, px, py, MIN_BOUNPOS_RESIZE_SIZE);
}

/**
 * Commit a corner-drag resize to the live element.
 * For a pos-set, also regenerates the circle grid
 */
export function applyResize(el, x, y, width, height) {
  if (!el) return;
  const type = el.getAttribute('data-bounpos-type') ?? 'boundary';
  const path = childByTag(el, 'path');
  const text = childByTag(el, 'text');
  if (!path) return;

  el.setAttribute('transform', translateAttr(x, y));
  path.setAttribute('d', rectToPath(0, 0, width, height));
  if (text) {
    text.setAttribute('x', String(width));
    text.setAttribute('y', '-5');
  }

  if (type === 'pos-set') {
    const genType = el.getAttribute('data-gen-type') ?? 'square';
    const { xSpacing, ySpacing } = gridSpacingFromInput(genType, {
      xSpacing: el.getAttribute('data-gen-x-spacing'),
      ySpacing: el.getAttribute('data-gen-y-spacing'),
      genParam: el.getAttribute('data-gen-param'),
    });
    const snapRadiusLevel = snapRadiusRadiusToLevel(
      Number(el.getAttribute('data-snap-radius') ?? 30),
      genType, xSpacing, ySpacing
    );
    // rebuildPositionSetGrid reads its extent off the path's own 'd' —
    // already updated above, so it regenerates the grid against the NEW
    // rect, not the pre-resize one.
    rebuildPositionSetGrid(el, { genType, xSpacing, ySpacing, snapRadiusLevel });
  }
}

/**
 * All elements as layer-object descriptors for the layers panel.
 */
export function layerData(layerEl) {
  const results = [];
  for (const node of layerEl?.children ?? []) {
    const id   = node.getAttribute('id');
    const name = node.getAttribute('name') ?? id;
    const kind = node.getAttribute('data-bounpos-type') ?? 'boundary';
    results.push({ id, label: name, fill: 'none', kind });
  }
  return results;
}

// ── Geometry queries ──────────────────────────────────────────────────────────

/**
 * Bounding box from the <path> child — works for both element types.
 */
export function getGeom(svgEl) {
  const path = svgEl?.querySelector?.('path');
  if (!path) return null;
  const d = path.getAttribute('d');
  if (!d) return null;
  const { x, y, w, h } = worldRectOf(svgEl, path);
  return { x, y, width: w, height: h };
}

export function getAnchor(svgEl) {
  const geom = getGeom(svgEl);
  return geom ? { x: geom.x, y: geom.y } : { x: 0, y: 0 };
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

function _resolveBounPosToolName(svgElOrType) {
  if (typeof svgElOrType === 'string') {
    // Direct tool name lookup first
    if (BOUNPOS_TYPES[svgElOrType]) return svgElOrType;
    // bounPosType string — pick first matching tool entry
    return Object.keys(BOUNPOS_TYPES)
      .find(k => BOUNPOS_TYPES[k].bounPosType === svgElOrType)
      ?? 'boundary';
  }

  const bounPosType = svgElOrType?.getAttribute?.('data-bounpos-type') ?? 'boundary';
  const genType     = svgElOrType?.getAttribute?.('data-gen-type') ?? null;

  return Object.keys(BOUNPOS_TYPES).find(k => {
    const d = BOUNPOS_TYPES[k];
    return d.bounPosType === bounPosType &&
      (genType ? d.genType === genType : d.genType === null || d.genType === 'square');
  }) ?? 'boundary';
}

export function getTtStateSchema(svgElOrType) {
  // Resolve to a BOUNPOS_TYPES key.
  // Accepts: tool name ('boundary','pos-grid-sq','pos-grid-hex','pos-grid-flat-hex'),
  //          bounPosType string ('boundary','pos-set'), or a DOM element.
  let toolName;
  if (typeof svgElOrType === 'string') {
    if (BOUNPOS_TYPES[svgElOrType]) {
      toolName = svgElOrType;
    } else {
      toolName = Object.keys(BOUNPOS_TYPES)
        .find(k => BOUNPOS_TYPES[k].bounPosType === svgElOrType) ?? 'boundary';
    }
  } else {
    const bounPosType = svgElOrType?.getAttribute?.('data-bounpos-type') ?? 'boundary';
    const genType     = svgElOrType?.getAttribute?.('data-gen-type') ?? null;
    toolName = Object.keys(BOUNPOS_TYPES).find(k => {
      const d = BOUNPOS_TYPES[k];
      return d.bounPosType === bounPosType &&
        (genType ? d.genType === genType : d.genType === null || d.genType === 'square');
    }) ?? 'boundary';
  }

  const def    = BOUNPOS_TYPES[toolName];
  const schema = def.schema;

  if (!svgElOrType || typeof svgElOrType === 'string') {
    return { label: schema.label, ...schema.values, types: schema.types };
  }

  const bounPosType = svgElOrType.getAttribute('data-bounpos-type') ?? 'boundary';
  const name        = svgElOrType.getAttribute('name') ?? '';

  if (bounPosType === 'pos-set') {
    const genType = svgElOrType.getAttribute('data-gen-type') ?? 'square';
    const { xSpacing, ySpacing } = gridSpacingFromInput(genType, {
      xSpacing: svgElOrType.getAttribute('data-gen-x-spacing'),
      ySpacing: svgElOrType.getAttribute('data-gen-y-spacing'),
      genParam: svgElOrType.getAttribute('data-gen-param'),
    });
    const snapRadius = snapRadiusRadiusToLevel(
      svgElOrType.getAttribute('data-snap-radius') ?? 30,
      genType,
      xSpacing,
      ySpacing
    );

    return {
      label: schema.label,
      type: 'pos-set',
      name,
      xSpacing,
      ySpacing,
      snapRadius,
      types: schema.types,
    };
  }

  return { label: schema.label, type: 'boundary', name, types: schema.types };
}


/**
 * Snapshot the full serialisable state of a bounPos element (<g>).
 * Extracts geometry from the child <path> d attribute and the group's
 * transform. Author/created are omitted — those are provenance, not element
 * state.
 */
export function getTtState(el) {
  if (!el) return null;
  const id          = el.getAttribute('id');
  const bounPosType = el.getAttribute('data-bounpos-type') ?? 'boundary';
  const name        = el.getAttribute('name') ?? id;
  const path        = childByTag(el, 'path');
  const { x, y, w, h } = path
    ? worldRectOf(el, path)
    : { x: 0, y: 0, w: 100, h: 100 };
  const state = { id, bounPosType, name, x, y, w, h };

  if (bounPosType === 'pos-set') {
    const genType = el.getAttribute('data-gen-type') ?? 'square';
    const { xSpacing, ySpacing } = gridSpacingFromInput(genType, {
      xSpacing: el.getAttribute('data-gen-x-spacing'),
      ySpacing: el.getAttribute('data-gen-y-spacing'),
      genParam: el.getAttribute('data-gen-param'),
    });

    state.genType    = genType;
    state.xSpacing   = xSpacing;
    state.ySpacing   = ySpacing;
    state.snapRadius = snapRadiusRadiusToLevel(
      el.getAttribute('data-snap-radius') ?? 30,
      genType,
      xSpacing,
      ySpacing
    );
  }

  return state;
}

function createBounPos(state, layerEl) {
  if (state.bounPosType === 'pos-set') {
    const { xSpacing, ySpacing } = gridSpacingFromInput(state.genType, state);
    const circles = gridFillExtent(state.x, state.y, state.w, state.h, state.genType, xSpacing, ySpacing);

    _createPositionSet(layerEl, {
      id:         state.id,
      name:       state.name,
      snapRadius: snapRadiusStateToRadius(state.snapRadius ?? 10, state.genType, xSpacing, ySpacing),
      genType:    state.genType,
      xSpacing,
      ySpacing,
      x:          state.x,
      y:          state.y,
      w:          state.w,
      h:          state.h,
      circles,
    });
  } else {
    BOUNPOS_TYPES.boundary.create(layerEl, {
      id:     state.id,
      name:   state.name,
      x:      state.x,
      y:      state.y,
      w:      state.w,
      h:      state.h,
    });
  }
}

/**
 * Write a ttState snapshot back onto the layer: edits the element if it
 * exists, creates it if not.
 */
export function applyTtState(layerEl, state) {
  if (!state?.bounPosType) {
    console.error('invalid bounPos state')
    return;
  }
  if (!state?.id) {
    createBounPos(state, layerEl);
  } else {
    editBounPos(state, layerEl);
  }
}

export function editBounPos(state, layerEl) {
  // Note 'state' might be partial - only update attrs that are present
  const existing = findEl(layerEl, state.id);
  if (!existing) {
    console.error('bounPos state id not found')
    return
  }

  editEl(existing, state);

  if (state.x !== undefined) {
    applyMoveCommit(existing, state.x, state.y);
  }
}

/**
 * Canonical LayerAPI edit signature: edit(el, editData). Only keys present
 * in editData are written: a label rename changes the name attribute and the
 * <text>'s text node, a grid-parameter change regenerates the circles.
 */
export function editEl(el, editData) {
  if (!el) return;
  const type = el.getAttribute('data-bounpos-type') ?? 'boundary';

  if (editData.name !== undefined) {
    el.setAttribute('name', String(editData.name));
    const text = childByTag(el, 'text');
    if (text) setTextContent(text, String(editData.name));
  }

  if (type === 'pos-set' && (
    editData.snapRadius !== undefined ||
    editData.xSpacing !== undefined ||
    editData.ySpacing !== undefined ||
    editData.genType !== undefined
  )) {
    const genType = editData.genType ?? el.getAttribute('data-gen-type') ?? 'square';
    const { xSpacing, ySpacing } = gridSpacingFromInput(genType, {
      xSpacing: editData.xSpacing ?? el.getAttribute('data-gen-x-spacing'),
      ySpacing: editData.ySpacing ?? el.getAttribute('data-gen-y-spacing'),
      genParam: el.getAttribute('data-gen-param'),
    });

    rebuildPositionSetGrid(el, {
      genType,
      xSpacing,
      ySpacing,
      snapRadiusLevel: editData.snapRadius ?? snapRadiusRadiusToLevel(
        Number(el.getAttribute('data-snap-radius') ?? 30),
        genType,
        xSpacing,
        ySpacing
      ),
    });
  }
}

// Replaces ghostEl's <circle> children with fresh ones at `circles`
function _rebuildGhostCircles(ghostEl, circles, r) {
  const existing = [...ghostEl.querySelectorAll(':scope > circle')];
  // Reuse the first existing circle as a template so per-circle
  // attributes like the gradient fill survive
  const template = existing[0] ?? null;
  for (const c of existing) c.remove();
  for (const { cx, cy } of circles) {
    const circle = template ? template.cloneNode(true) : document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', Math.round(cx));
    circle.setAttribute('cy', Math.round(cy));
    circle.setAttribute('r',  Math.round(r));
    ghostEl.appendChild(circle);
  }
}

/**
 * Preview an edit on a detached ghost clone
 */
export function previewEdit(ghostEl, editData) {
  if (ghostEl.getAttribute('data-bounpos-type') !== 'pos-set') return;
  if (editData.xSpacing === undefined && editData.ySpacing === undefined && editData.snapRadius === undefined) return;

  const current = getTtStateSchema(ghostEl);
  const genType = ghostEl.getAttribute('data-gen-type') ?? 'square';
  // Whichever of the three keys aren't present in editData are read
  // off ghostEl's own current attributes
  const xSpacing        = editData.xSpacing   ?? current.xSpacing;
  const ySpacing        = editData.ySpacing   ?? current.ySpacing;
  const snapRadiusLevel = editData.snapRadius ?? current.snapRadius;
  const ghostPath = ghostEl.querySelector(':scope > path');
  if (!ghostPath?.getAttribute('d')) return;
  // Circles are written in the ghost's local coordinates.
  const extent = localRectOf(ghostPath);
  const { circles, r } = computeGridPositions(
    extent,
    genType, xSpacing, ySpacing, snapRadiusLevel
  );

  _rebuildGhostCircles(ghostEl, circles, r);
}

/**
 * Preview a corner-drag resize on a detached ghost clone
 */
export function previewResize(ghostEl, x, y, width, height) {
  const path = ghostEl.querySelector(':scope > path');
  ghostEl.setAttribute('transform', translateAttr(x, y));
  if (path) path.setAttribute('d', rectToPath(0, 0, width, height));
  const text = ghostEl.querySelector(':scope > text');
  if (text) {
    text.setAttribute('x', String(width));
    text.setAttribute('y', '-5');
  }

  if (ghostEl.getAttribute('data-bounpos-type') !== 'pos-set') return;

  const current = getTtStateSchema(ghostEl);
  const genType = ghostEl.getAttribute('data-gen-type') ?? 'square';
  const { circles, r } = computeGridPositions(
    { x: 0, y: 0, w: width, h: height },
    genType, current.xSpacing, current.ySpacing, current.snapRadius
  );

  _rebuildGhostCircles(ghostEl, circles, r);
}

// ── Drag context helpers ──────────────────────────────────────────────────────

/**
 * Scan layerEl for boundaries whose name ∈ toyClasses.
 * Applies the start-inside filter: returns null if no matched boundary
 * contains the anchor point (toy moves freely when outside all its boundaries).
 * Rects are in world coordinates.
 */
export function computeBoundaryRects(layerEl, toyClasses, anchor) {
  if (!toyClasses || toyClasses.size === 0) return null;
  const rects = [];
  for (const node of layerEl?.children ?? []) {
    if ((node.getAttribute('data-bounpos-type') ?? 'boundary') === 'pos-set') continue;
    const name = node.getAttribute('name');
    if (!name || !toyClasses.has(name)) continue;
    const path = childByTag(node, 'path');
    if (!path) continue;
    if (!path.getAttribute('d')) continue;
    rects.push(worldRectOf(node, path));
  }
  if (rects.length === 0) return null;
  const startsInside = rects.some(
    r => anchor.x >= r.x && anchor.x <= r.x + r.w &&
         anchor.y >= r.y && anchor.y <= r.y + r.h
  );
  return startsInside ? rects : null;
}

// Snap points in world coordinates.
export function getSnapPoints(layerEl) {
  const points = [];
  for (const node of layerEl?.children ?? []) {
    if (node.getAttribute('data-bounpos-type') !== 'pos-set') continue;
    const name = node.getAttribute('name');
    const snapRadius = Number(node.getAttribute('data-snap-radius') ?? 30);
    const { tx, ty } = translationOf(node);
    for (const child of node.children) {
      if (child.localName !== 'circle') continue;
      const cx = Number(child.getAttribute('cx') ?? 0) + tx;
      const cy = Number(child.getAttribute('cy') ?? 0) + ty;
      points.push({ cx, cy, name, snapRadius });
    }
  }
  return points;
}

export function selectModes(_domEl) {
  return ['sel-move', 'sel-resize'];
}

export function nextSelectMode(_domEl, currentMode) {
  const cycle = selectModes(_domEl);
  const i = cycle.indexOf(currentMode);
  return cycle[(i + 1) % cycle.length];
}

// ── The layer ─────────────────────────────────────────────────────────────────

export const BOUN_POS_LAYER = defineOpLayer({
  name:        'boun_pos',
  selector:    '#boun_pos-layer',
  layerDataId: 'tt-layer-boun_pos',
  opsKey:      'ops:boun_pos',
  contentKey:  'checkpointContent:boun_pos',
  headKey:     (tableId) => `tt_head_boun_pos_${tableId}`,
  mergeKey:    (tableId) => `tt_head_merge_boun_pos_${tableId}`,
});

export const runGesture = (ydoc, layerEl, fn, opts) =>
  OpLayer.runGesture(ydoc, BOUN_POS_LAYER, layerEl, fn, opts);
export const projectLayer = (ydoc, layerEl, opts) =>
  OpLayer.projectLayer(ydoc, BOUN_POS_LAYER, layerEl, opts);

// ── Batch gestures ────────────────────────────────────────────────────────────
// A multi-select action is one gesture, one operation.

/** Delete several elements as one gesture. Returns the op, or null if none existed. */
export function deleteBoundariesBatch(ydoc, layerEl, ids, { authorId, tableId } = {}) {
  let deletedAny = false;
  const result = runGesture(ydoc, layerEl, () => {
    for (const id of ids) {
      if (deleteEl(layerEl, id)) deletedAny = true;
    }
  }, { gesture: 'delete-batch', authorId, tableId });
  return deletedAny ? (result.op ?? null) : null;
}

/**
 * Move several elements as one gesture. moves: [{ id, x, y }] -- x/y are the
 * anchor convention applyMoveCommit uses. Returns the op, or null if none moved.
 */
export function moveBoundariesBatch(ydoc, layerEl, moves, { authorId, tableId } = {}) {
  let movedAny = false;
  const result = runGesture(ydoc, layerEl, () => {
    for (const { id, x, y } of moves) {
      const el = findEl(layerEl, id);
      if (!el) continue;
      applyMoveCommit(el, x, y);
      movedAny = true;
    }
  }, { gesture: 'move-batch', authorId, tableId });
  return movedAny ? (result.op ?? null) : null;
}

/**
 * Commit pre-parsed foreign elements onto a live layer as one gesture --
 * storage.js's populateFromSvgDoc, live-table branch. An element whose id
 * collides with one already on the layer is re-id'd: data-id is the op
 * log's primary key.
 */
export function importBoundaries(ydoc, layerEl, els, opts = {}) {
  if (!els?.length) return null;
  return runGesture(ydoc, layerEl, () => {
    for (const el of els) {
      const id = el.getAttribute('data-id');
      if (!id || findEl(layerEl, id)) {
        const fresh = 'import_' + Math.random().toString(36).slice(2, 7);
        el.setAttribute('id', fresh);
        el.setAttribute('data-id', fresh);
      }
      layerEl.appendChild(el);
    }
  }, { gesture: 'import', ...opts });
}

/**
 * makeLayerAPI -- the canonical LayerAPI for the Boundaries and Positions
 * layer.
 *
 * getLayerEl returns the live #boun_pos-layer. Everything here
 * reads and writes that DOM; writes run inside runGesture so the envelope
 * captures them. Whatever find() returns is what the other methods accept.
 */
export function makeLayerAPI(ydoc, getLayerEl, user, tableId, isCreator = false) {
  const layer = () => (typeof getLayerEl === 'function' ? getLayerEl() : getLayerEl);
  const gesture = (name, fn) =>
    runGesture(ydoc, layer(), fn, { gesture: name, authorId: user.id, tableId });

  return {
    find:             (id)               => findEl(layer(), id),
    add:              (toolName, params) => {
      let el = null;
      gesture('add', () => { el = BOUNPOS_TYPES[toolName].create(layer(), params); });
      return el;
    },
    delete:           (id)               => {
      let deleted = false;
      gesture('delete', () => { deleted = deleteEl(layer(), id); });
      return deleted;
    },
    getGeom,
    getAnchor,
    getTtState,
    getTtStateSchema,
    selectModes,
    nextSelectMode,
    computeResize,
    applyMoveCommit:  (el, x, y)         => gesture('move',   () => applyMoveCommit(el, x, y)),
    applyResize:      (el, x, y, w, h)   => gesture('resize', () => applyResize(el, x, y, w, h)),
    applyTtState:     (state)            => gesture('edit',   () => applyTtState(layer(), state)),
    edit:             (el, editData)     => gesture('edit',   () => editEl(el, editData)),
    previewEdit,
    previewResize,
    listData:         ()                 => layerData(layer()),
    render:           (layerEl, joinSequence = []) =>
                        projectLayer(ydoc, layerEl, { tableId, authorId: user.id, isCreator, joinSequence }),
  };
}
