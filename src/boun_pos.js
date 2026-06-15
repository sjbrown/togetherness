/**
 * boun_pos.js — complete module for the Boundaries and Positions layer.
 *
 * Both element types are Y.XmlElement('g') siblings in the yBounPos fragment.
 * data-bounpos-type="boundary" | "pos-set" distinguishes them. Yjs treats
 * the fragment as opaque — all semantic dispatch lives here.
 *
 * Boundary Yjs structure:
 *   <g id name data-bounpos-type="boundary">
 *     <path d fill stroke stroke-width/>
 *     <text x y text-anchor font-family font-size fill>
 *       Y.XmlText(name)
 *
 * Position-set Yjs structure:
 *   <g id name data-bounpos-type="pos-set" data-snap-radius data-gen-type data-gen-param>
 *     <path d fill stroke stroke-dasharray stroke-width/>   ← extent rect
 *     <text x y text-anchor font-family font-size fill>
 *       Y.XmlText(name)
 *     <circle cx cy r/>   … N snap points
 *
 * ID formats:
 *   boundary:    tt-b-v1-XXXXX
 *   position set: tt-ps-v1-XXXXX
 */

import * as Y from 'yjs';
import { SNAP_POINT_GRADIENT_ID } from './defs.js';

export const LAYER = 'boundaries-positions';
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

// ── Grid math (pure — no Yjs, fully testable) ─────────────────────────────────

/**
 * Square grid: uniform x/y spacing.
 */
export function generateSquareGrid(origin, rows, cols, spacing) {
  const points = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({ cx: origin.x + col * spacing, cy: origin.y + row * spacing });
    }
  }
  return points;
}

/**
 * Pointy-top hex grid (redblobgames.com standard).
 *   colSpacing = hexSize * √3
 *   rowSpacing = hexSize * 1.5
 *   odd rows offset by hexSize * √3/2
 */
export function generateHexGrid(origin, rows, cols, hexSize) {
  const colSp       = hexSize * Math.sqrt(3);
  const rowSp       = hexSize * 1.5;
  const oddOffset   = colSp / 2;
  const points = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push({
        cx: origin.x + col * colSp + (row % 2) * oddOffset,
        cy: origin.y + row * rowSp,
      });
    }
  }
  return points;
}

/**
 * Fill an extent rect with snap points for genType / genParam.
 * Returns [{cx,cy}] clipped to the extent.
 */
export function gridFillExtent(x, y, w, h, genType, genParam) {
  const param = Number(genParam);
  if (genType === 'hex') {
    const hexSize = param;
    const colSp   = hexSize * Math.sqrt(3);
    const rowSp   = hexSize * 1.5;
    const cols    = Math.ceil(w / colSp) + 2;
    const rows    = Math.ceil(h / rowSp) + 2;
    return generateHexGrid({ x, y }, rows, cols, hexSize)
      .filter(p => p.cx >= x && p.cx <= x + w && p.cy >= y && p.cy <= y + h);
  }
  // square
  const spacing = param;
  const cols    = Math.ceil(w / spacing) + 1;
  const rows    = Math.ceil(h / spacing) + 1;
  return generateSquareGrid({ x, y }, rows, cols, spacing)
    .filter(p => p.cx >= x && p.cx <= x + w && p.cy >= y && p.cy <= y + h);
}

/**
 * Maximum snap radius before zones overlap within a single set.
 *   square: spacing / 2
 *   hex:    hexSize * √3/2  (= inradius / short radius)
 */
export function computeMaxSnapRadius(genType, genParam) {
  const param = Number(genParam);
  if (genType === 'hex') return (param * Math.sqrt(3)) / 2;
  return param / 2;
}

// ── Internal child-element helpers ────────────────────────────────────────────

function yChildByTag(yEl, tag) {
  return yEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === tag) ?? null;
}

function yTextContent(yEl) {
  // Read text content from the first Y.XmlText child of yEl.
  const yt = yEl?.toArray().find(n => n instanceof Y.XmlText);
  return yt?.toString() ?? '';
}

function setYTextContent(ydoc, yEl, newText) {
  // Update or create the Y.XmlText child of yEl within the current transaction.
  const existing = yEl?.toArray().find(n => n instanceof Y.XmlText);
  if (existing) {
    existing.delete(0, existing.length);
    existing.insert(0, newText);
  } else if (yEl) {
    yEl.insert(yEl.length, [new Y.XmlText(newText)]);
  }
}

// ── CRDT operations — boundaries ─────────────────────────────────────────────

// ── Type registry ─────────────────────────────────────────────────────────────
// One entry per tool name. Everything that differs between a boundary, a square
// grid, and a hex grid lives here.
//
// Fields:
//   bounPosType  — the data-bounpos-type value written to Yjs ('boundary'|'pos-set')
//   label        — human label for the schema / layer panel
//   iconUrl      — path to the tool icon SVG (fetched by ui.js iconFor())
//   newId()      — returns { id, name } for a fresh element
//   genType      — 'square'|'hex'|null (null for boundaries)
//   schema       — ttStateSchema shape: { label, values, types }
//   create(ydoc, yBounPos, yBounPosMeta, params) — CRDT write
//   toSVGEl(yG)  — Yjs node → live DOM element
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
    create(ydoc, yBounPos, yBounPosMeta, { id, name, x, y, w, h, author }) {
      const d  = rectToPath(x, y, w, h);
      const tx = x + w;
      const ty = y - 5;
      const yG = new Y.XmlElement('g');
      const yPath = new Y.XmlElement('path');
      const yText = new Y.XmlElement('text');
      ydoc.transact(() => {
        yG.setAttribute('id',                id);
        yG.setAttribute('name',              name);
        yG.setAttribute('data-bounpos-type', 'boundary');
        yPath.setAttribute('d',            d);
        yPath.setAttribute('fill',         'none');
        yPath.setAttribute('stroke',       'white');
        yPath.setAttribute('stroke-width', '2');
        yText.setAttribute('x',           String(tx));
        yText.setAttribute('y',           String(ty));
        yText.setAttribute('text-anchor', 'end');
        yText.setAttribute('font-family', 'ui-monospace, monospace');
        yText.setAttribute('font-size',   '12');
        yText.setAttribute('fill',        'white');
        yText.insert(0, [new Y.XmlText(name)]);
        yG.insert(0, [yPath, yText]);
        yBounPos.insert(yBounPos.length, [yG]);
        yBounPosMeta.set(id, { author, name, type: 'boundary', created: Date.now() });
      });
      return yG;
    },
    toSVGEl(yG) {
      const id   = yG.getAttribute('id')   ?? '';
      const name = yG.getAttribute('name') ?? id;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('id',               `yid-${id}`);
      g.setAttribute('data-yid',         id);
      g.setAttribute('data-module',      'boun_pos');
      g.setAttribute('data-bounpos-type','boundary');
      g.setAttribute('name',             name);
      for (const child of yG.toArray()) {
        if (!(child instanceof Y.XmlElement)) continue;
        if (child.nodeName === 'path') {
          const path = document.createElementNS(SVG_NS, 'path');
          path.setAttribute('d',            child.getAttribute('d') ?? '');
          path.setAttribute('fill',         'none');
          path.setAttribute('stroke',       'white');
          path.setAttribute('stroke-width', '2');
          g.appendChild(path);
        } else if (child.nodeName === 'text') {
          const text = document.createElementNS(SVG_NS, 'text');
          text.setAttribute('x',                  child.getAttribute('x') ?? '0');
          text.setAttribute('y',                  child.getAttribute('y') ?? '0');
          text.setAttribute('text-anchor',        child.getAttribute('text-anchor') ?? 'end');
          text.setAttribute('font-family',        child.getAttribute('font-family') ?? 'ui-monospace, monospace');
          text.setAttribute('font-size',          child.getAttribute('font-size') ?? '12');
          text.setAttribute('fill',               child.getAttribute('fill') ?? 'white');
          text.setAttribute('data-boundary-name', name);
          text.textContent = yTextContent(child) || name;
          g.appendChild(text);
        }
      }
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
      values: { type: 'pos-set', name: '', snapRadius: 30, spacing: 80 },
      types: {
        type:       { show: [] },
        name:       { kind: 'string', show: ['add', 'edit'] },
        snapRadius: { kind: 'number', min: 1, max: 40, step: 1, show: ['edit'] },
        spacing:    { kind: 'number', min: 20, max: 200, step: 4, show: ['addQuick'] },
      },
    },
    create(ydoc, yBounPos, yBounPosMeta, params) {
      return _createPositionSet(ydoc, yBounPos, yBounPosMeta, params);
    },
    toSVGEl(yG) { return _positionSetToSVGEl(yG); },
  },

  'pos-grid-hex': {
    bounPosType: 'pos-set',
    label:       'Hex Grid',
    iconUrl:     'boun_pos/pos-grid-hex.svg',
    newId:       newPositionSetId,
    genType:     'hex',
    schema: {
      label:  'Hex Grid',
      values: { type: 'pos-set', name: '', snapRadius: 30, 'hex-size': 40 },
      types: {
        type:        { show: [] },
        name:        { kind: 'string', show: ['add', 'edit'] },
        snapRadius:  { kind: 'number', min: 1, max: 35, step: 1, show: ['edit'] },
        'hex-size':  { kind: 'number', min: 15, max: 100, step: 5, show: ['addQuick'] },
      },
    },
    create(ydoc, yBounPos, yBounPosMeta, params) {
      return _createPositionSet(ydoc, yBounPos, yBounPosMeta, params);
    },
    toSVGEl(yG) { return _positionSetToSVGEl(yG); },
  },
};

// Helper used by both pos-set variants.
function _createPositionSet(ydoc, yBounPos, yBounPosMeta,
  { id, name, snapRadius, genType, genParam, x, y, w, h, circles, author }) {
  const d  = rectToPath(x, y, w, h);
  const tx = x + w;
  const ty = y - 5;
  const yG       = new Y.XmlElement('g');
  const yPath    = new Y.XmlElement('path');
  const yText    = new Y.XmlElement('text');
  const yCircles = (circles ?? []).map(({ cx, cy }) => {
    const c = new Y.XmlElement('circle');
    c.setAttribute('cx', String(Math.round(cx)));
    c.setAttribute('cy', String(Math.round(cy)));
    c.setAttribute('r',  String(Math.round(snapRadius)));
    return c;
  });
  ydoc.transact(() => {
    yG.setAttribute('id',               id);
    yG.setAttribute('name',             name);
    yG.setAttribute('data-bounpos-type', 'pos-set');
    yG.setAttribute('data-snap-radius',  String(Math.round(snapRadius)));
    yG.setAttribute('data-gen-type',    genType);
    yG.setAttribute('data-gen-param',   String(Math.round(genParam)));
    yPath.setAttribute('d',                d);
    yPath.setAttribute('fill',             'none');
    yPath.setAttribute('stroke',           'rgba(255,255,255,0.5)');
    yPath.setAttribute('stroke-dasharray', '4 2');
    yPath.setAttribute('stroke-width',     '1');
    yText.setAttribute('x',           String(tx));
    yText.setAttribute('y',           String(ty));
    yText.setAttribute('text-anchor', 'end');
    yText.setAttribute('font-family', 'ui-monospace, monospace');
    yText.setAttribute('font-size',   '12');
    yText.setAttribute('fill',        'rgba(255,255,255,0.7)');
    yText.insert(0, [new Y.XmlText(name)]);
    yG.insert(0, [yPath, yText, ...yCircles]);
    yBounPos.insert(yBounPos.length, [yG]);
    yBounPosMeta.set(id, { author, name, type: 'pos-set', snapRadius, genType, genParam, created: Date.now() });
  });
  return yG;
}

function _positionSetToSVGEl(yG) {
  const id      = yG.getAttribute('id')               ?? '';
  const name    = yG.getAttribute('name')              ?? id;
  const snapR   = yG.getAttribute('data-snap-radius')  ?? '30';
  const genType = yG.getAttribute('data-gen-type')     ?? 'square';
  const genParam = yG.getAttribute('data-gen-param')   ?? '80';
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',               `yid-${id}`);
  g.setAttribute('data-yid',         id);
  g.setAttribute('data-module',      'boun_pos');
  g.setAttribute('data-bounpos-type','pos-set');
  g.setAttribute('name',             name);
  g.setAttribute('data-snap-radius', snapR);
  g.setAttribute('data-gen-type',    genType);
  g.setAttribute('data-gen-param',   genParam);
  for (const child of yG.toArray()) {
    if (!(child instanceof Y.XmlElement)) continue;
    if (child.nodeName === 'path') {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d',                child.getAttribute('d') ?? '');
      path.setAttribute('fill',             'none');
      path.setAttribute('stroke',           'rgba(255,255,255,0.5)');
      path.setAttribute('stroke-dasharray', '4 2');
      path.setAttribute('stroke-width',     '1');
      g.appendChild(path);
    } else if (child.nodeName === 'text') {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x',           child.getAttribute('x') ?? '0');
      text.setAttribute('y',           child.getAttribute('y') ?? '0');
      text.setAttribute('text-anchor', child.getAttribute('text-anchor') ?? 'end');
      text.setAttribute('font-family', child.getAttribute('font-family') ?? 'ui-monospace, monospace');
      text.setAttribute('font-size',   child.getAttribute('font-size') ?? '12');
      text.setAttribute('fill',        child.getAttribute('fill') ?? 'rgba(255,255,255,0.7)');
      text.textContent = yTextContent(child) || name;
      g.appendChild(text);
    } else if (child.nodeName === 'circle') {
      const circle = document.createElementNS(SVG_NS, 'circle');
      circle.setAttribute('cx',   child.getAttribute('cx') ?? '0');
      circle.setAttribute('cy',   child.getAttribute('cy') ?? '0');
      circle.setAttribute('r',    child.getAttribute('r')  ?? snapR);
      circle.setAttribute('fill', `url(#${SNAP_POINT_GRADIENT_ID})`);
      g.appendChild(circle);
    }
  }
  return g;
}

// ── Elevated layer API ────────────────────────────────────────────────────────

/**
 * Convenience wrappers — kept for call sites that name a specific type.
 * Internally both delegate to BOUNPOS_TYPES[toolName].create().
 */
export function addBoundary(ydoc, yBounPos, yBounPosMeta, params) {
  return BOUNPOS_TYPES.boundary.create(ydoc, yBounPos, yBounPosMeta, params);
}

export function createPositionSetElement(ydoc, yBounPos, yBounPosMeta, params) {
  return _createPositionSet(ydoc, yBounPos, yBounPosMeta, params);
}

export function addPositionSet(ydoc, yBounPos, yBounPosMeta,
  { x, y, w, h, toolName, toolParams, author }) {
  const def      = BOUNPOS_TYPES[toolName];
  if (!def) return null;
  const genType  = def.genType;
  const genParam = genType === 'hex'
    ? (toolParams['hex-size'] ?? 40)
    : (toolParams['spacing']  ?? 80);
  const rawRadius  = toolParams['snapRadius'] ?? 30;
  const snapRadius = Math.min(rawRadius, computeMaxSnapRadius(genType, genParam));
  const circles    = gridFillExtent(x, y, w, h, genType, genParam);
  if (circles.length === 0) return null;
  const { id, name } = def.newId();
  def.create(ydoc, yBounPos, yBounPosMeta,
    { id, name, snapRadius, genType, genParam, x, y, w, h, circles, author });
  return { id, name, genType };
}

function _toSVGEl(yG) {
  const bounPosType = yG.getAttribute('data-bounpos-type') ?? 'boundary';
  const def = Object.values(BOUNPOS_TYPES).find(d => d.bounPosType === bounPosType && d.genType === (yG.getAttribute('data-gen-type') ?? null))
    ?? Object.values(BOUNPOS_TYPES).find(d => d.bounPosType === bounPosType)
    ?? BOUNPOS_TYPES.boundary;
  return def.toSVGEl(yG);
}

export function findEl(yBounPos, id) {
  return yBounPos.toArray().find(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  ) ?? null;
}

export function deleteEl(ydoc, yBounPos, yBounPosMeta, id) {
  const idx = yBounPos.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yBounPos.delete(idx, 1);
    yBounPosMeta.delete(id);
  });
  return true;
}

export function applyMoveCommit(ydoc, yEl, x, y) {
  if (!yEl) return;
  const type  = yEl.getAttribute('data-bounpos-type') ?? 'boundary';
  const yPath = yChildByTag(yEl, 'path');
  const yText = yChildByTag(yEl, 'text');
  if (!yPath) return;

  const { x: oldX, y: oldY, w, h } = pathToRect(
    yPath.getAttribute('d') ?? 'M0,0 L0,0 L0,0 L0,0 Z'
  );
  const dx = x - oldX;
  const dy = y - oldY;

  ydoc.transact(() => {
    yPath.setAttribute('d', rectToPath(x, y, w, h));
    if (yText) {
      yText.setAttribute('x', String(x + w));
      yText.setAttribute('y', String(y - 5));
    }
    if (type === 'pos-set') {
      for (const child of yEl.toArray()) {
        if (!(child instanceof Y.XmlElement) || child.nodeName !== 'circle') continue;
        child.setAttribute('cx', String(Math.round(Number(child.getAttribute('cx') ?? 0) + dx)));
        child.setAttribute('cy', String(Math.round(Number(child.getAttribute('cy') ?? 0) + dy)));
      }
    }
  });
}

/**
 * Render the entire Boundaries and Positions layer into layerEl.
 * app.js calls this; it never iterates yBounPos directly.
 */
export function renderLayer(yBounPos, yBounPosMeta, layerEl) {
  layerEl.innerHTML = '';
  for (const node of yBounPos.toArray()) {
    if (!(node instanceof Y.XmlElement)) continue;
    const svgEl = _toSVGEl(node);
    if (svgEl) layerEl.appendChild(svgEl);
  }
}

/**
 * All elements as layer-object descriptors for the layers panel.
 */
export function layerData(yBounPos, yBounPosMeta) {
  const results = [];
  for (const node of yBounPos.toArray()) {
    if (!(node instanceof Y.XmlElement)) continue;
    const id   = node.getAttribute('id');
    const name = node.getAttribute('name') ?? id;
    const kind = node.getAttribute('data-bounpos-type') ?? 'boundary';
    results.push({ id, label: name, fill: 'none', kind });
  }
  return results;
}

export function metaFor(yBounPosMeta, id) {
  return yBounPosMeta.get(id) ?? null;
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
  const { x, y, w, h } = pathToRect(d);
  return { x, y, width: w, height: h };
}

export function getAnchor(svgEl) {
  const geom = getGeom(svgEl);
  return geom ? { x: geom.x, y: geom.y } : { x: 0, y: 0 };
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

export function getTtStateSchema(svgElOrType) {
  // Resolve to a BOUNPOS_TYPES key.
  // Accepts: tool name ('boundary','pos-grid-sq','pos-grid-hex'),
  //          bounPosType string ('boundary','pos-set'), or a DOM element.
  let toolName;
  if (typeof svgElOrType === 'string') {
    // Direct tool name lookup first
    if (BOUNPOS_TYPES[svgElOrType]) {
      toolName = svgElOrType;
    } else {
      // bounPosType string — pick first matching tool entry
      toolName = Object.keys(BOUNPOS_TYPES)
        .find(k => BOUNPOS_TYPES[k].bounPosType === svgElOrType) ?? 'boundary';
    }
  } else {
    const bounPosType = svgElOrType?.getAttribute?.('data-bounpos-type') ?? 'boundary';
    const genType     = svgElOrType?.getAttribute?.('data-gen-type') ?? null;
    toolName = Object.keys(BOUNPOS_TYPES).find(k => {
      const d = BOUNPOS_TYPES[k];
      return d.bounPosType === bounPosType && (genType ? d.genType === genType : d.genType === null || d.genType === 'square');
    }) ?? 'boundary';
  }

  const def    = BOUNPOS_TYPES[toolName];
  const schema = def.schema;

  if (!svgElOrType || typeof svgElOrType === 'string') {
    return { label: schema.label, ...schema.values, types: schema.types };
  }

  // Element present — read current values.
  const bounPosType = svgElOrType.getAttribute('data-bounpos-type') ?? 'boundary';
  const name        = svgElOrType.getAttribute('name') ?? '';
  if (bounPosType === 'pos-set') {
    const genType   = svgElOrType.getAttribute('data-gen-type')  ?? 'square';
    const genParam  = Number(svgElOrType.getAttribute('data-gen-param') ?? 80);
    const maxR      = Math.floor(computeMaxSnapRadius(genType, genParam));
    const snapRadius = Number(svgElOrType.getAttribute('data-snap-radius') ?? 30);
    return {
      label: schema.label,
      type: 'pos-set',
      name,
      snapRadius,
      types: {
        ...schema.types,
        snapRadius: { ...schema.types.snapRadius, max: maxR },
      },
    };
  }
  return { label: schema.label, type: 'boundary', name, types: schema.types };
}

/**
 * Snapshot the full serialisable state of a bounPos Y.XmlElement (<g>).
 * Extracts geometry from the child <path> d attribute, so no DOM is needed.
 * Author/created are omitted — those are provenance, not element state.
 */
export function getTtState(yEl) {
  if (!yEl) return null;
  const id          = yEl.getAttribute('id');
  const bounPosType = yEl.getAttribute('data-bounpos-type') ?? 'boundary';
  const name        = yEl.getAttribute('name') ?? id;
  const yPath       = yChildByTag(yEl, 'path');
  const d           = yPath?.getAttribute('d') ?? 'M0,0 L100,0 L100,100 L0,100 Z';
  const { x, y, w, h } = pathToRect(d);
  const state = { id, bounPosType, name, x, y, w, h };
  if (bounPosType === 'pos-set') {
    state.snapRadius = Number(yEl.getAttribute('data-snap-radius') ?? 30);
    state.genType    = yEl.getAttribute('data-gen-type')  ?? 'square';
    state.genParam   = Number(yEl.getAttribute('data-gen-param') ?? 80);
  }
  return state;
}


function createBounPos(state, ydoc, yBounPos, yBounPosMeta) {
  if (state.bounPosType === 'pos-set') {
    const circles = gridFillExtent(state.x, state.y, state.w, state.h, state.genType, state.genParam);
    createPositionSetElement(ydoc, yBounPos, yBounPosMeta, {
      id:         state.id,
      name:       state.name,
      snapRadius: state.snapRadius ?? 30,
      genType:    state.genType,
      genParam:   state.genParam,
      x:          state.x,
      y:          state.y,
      w:          state.w,
      h:          state.h,
      circles,
      author:     undefined,
    });
  } else {
    addBoundary(ydoc, yBounPos, yBounPosMeta, {
      id:     state.id,
      name:   state.name,
      x:      state.x,
      y:      state.y,
      w:      state.w,
      h:      state.h,
      author: undefined,
    });
  }
}

/**
 * Write a ttState snapshot back into the Yjs bounPos fragment.
 * Used by undo/redo to reconstruct deleted boundaries and position sets.
 */
export function applyTtState(ydoc, yBounPos, yBounPosMeta, state) {
  if (!state?.bounPosType) {
    console.error('invalid bounPos state')
    return;
  }
  if (!state?.id) {
    createBounPos(state, ydoc, yBounPos, yBounPosMeta);
  } else {
    editBounPos(state, ydoc, yBounPos, yBounPosMeta);
  }
}

export function editBounPos(state, ydoc, yBounPos, yBounPosMeta) {
  // Note 'state' might be partial - only update attrs that are present
  const existing = findEl(yBounPos, state.id);
  if (!existing) {
    console.error('bounPos state id not found')
    return
  }

  // Update in place — only write keys present in the state snapshot.
  const type = existing.getAttribute('data-bounpos-type');
  ydoc.transact(() => {
    if (state.name !== undefined) {
      existing.setAttribute('name', String(state.name));
      const yText = yChildByTag(existing, 'text');
      if (yText) setYTextContent(ydoc, yText, String(state.name));
      const meta = yBounPosMeta.get(state.id) ?? {};
      yBounPosMeta.set(state.id, { ...meta, name: state.name });
    }
    if (state.snapRadius !== undefined && type === 'pos-set') {
      const genType  = existing.getAttribute('data-gen-type')  ?? 'square';
      const genParam = Number(existing.getAttribute('data-gen-param') ?? 80);
      const maxR     = computeMaxSnapRadius(genType, genParam);
      const r        = Math.round(Math.min(Math.max(1, Number(state.snapRadius)), maxR));
      existing.setAttribute('data-snap-radius', String(r));
      for (const child of existing.toArray()) {
        if (child instanceof Y.XmlElement && child.nodeName === 'circle') {
          child.setAttribute('r', String(r));
        }
      }
    }
  });
  if (state.x !== undefined) {
    applyMoveCommit(ydoc, existing, state.x, state.y);
  }
}

export function edit(id, editData, ydoc, yBounPos, yBounPosMeta) {
  return editBounPos({id, ...editData}, ydoc, yBounPos, yBounPosMeta);
}

// ── Drag context helpers ──────────────────────────────────────────────────────

/**
 * Scan yBounPos for boundaries whose name ∈ toyClasses.
 * Applies the start-inside filter: returns null if no matched boundary
 * contains the anchor point (toy moves freely when outside all its boundaries).
 */
export function computeBoundaryRects(yBounPos, toyClasses, anchor) {
  if (!toyClasses || toyClasses.size === 0) return null;
  const rects = [];
  for (const node of yBounPos.toArray()) {
    if (!(node instanceof Y.XmlElement)) continue;
    if ((node.getAttribute('data-bounpos-type') ?? 'boundary') === 'pos-set') continue;
    const name = node.getAttribute('name');
    if (!name || !toyClasses.has(name)) continue;
    const yPath = yChildByTag(node, 'path');
    if (!yPath) continue;
    const d = yPath.getAttribute('d');
    if (!d) continue;
    const { x, y, w, h } = pathToRect(d);
    rects.push({ x, y, w, h });
  }
  if (rects.length === 0) return null;
  const startsInside = rects.some(
    r => anchor.x >= r.x && anchor.x <= r.x + r.w &&
         anchor.y >= r.y && anchor.y <= r.y + r.h
  );
  return startsInside ? rects : null;
}

/**
 * Scan yBounPos for pos-sets whose name ∈ toyClasses.
 * Returns a flat array of {cx, cy, snapRadius} for all matching snap points.
 */
export function computePositionSnapPoints(yBounPos, toyClasses) {
  if (!toyClasses || toyClasses.size === 0) return [];
  const points = [];
  for (const node of yBounPos.toArray()) {
    if (!(node instanceof Y.XmlElement)) continue;
    if (node.getAttribute('data-bounpos-type') !== 'pos-set') continue;
    const name = node.getAttribute('name');
    if (!name || !toyClasses.has(name)) continue;
    const snapRadius = Number(node.getAttribute('data-snap-radius') ?? 30);
    for (const child of node.toArray()) {
      if (!(child instanceof Y.XmlElement) || child.nodeName !== 'circle') continue;
      points.push({
        cx: Number(child.getAttribute('cx') ?? 0),
        cy: Number(child.getAttribute('cy') ?? 0),
        snapRadius,
      });
    }
  }
  return points;
}

/*
export const layerAPI = {
  add: addBounPos,
  del: deleteEl,
  find: findEl,
  list: () => {console.error('not implemented')},
  edit: edit,
  geomFor: getGeom,
  anchorFor: getAnchor,
  ttStateFor: getTtState,
  ttStateSchemaForType: getTtStateSchema
  getData: 
}
*/
