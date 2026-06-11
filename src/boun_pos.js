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

const SVG_NS   = 'http://www.w3.org/2000/svg';
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

// ── ID helpers ────────────────────────────────────────────────────────────────

function randomSlug(len = 5) {
  return Array.from({ length: len }, () =>
    ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  ).join('');
}

export function newBoundaryId() {
  const name = randomSlug();
  return { id: `tt-b-v1-${name}`, name };
}

export function newPositionSetId() {
  const name = randomSlug();
  return { id: `tt-ps-v1-${name}`, name };
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

export function addBoundary(ydoc, yBounPos, yBounPosMeta, { id, name, x, y, w, h, author }) {
  const d  = rectToPath(x, y, w, h);
  const tx = x + w;          // text x: upper-right corner of boundary
  const ty = y - 5;          // text y: just above the line

  const yG    = new Y.XmlElement('g');
  const yPath = new Y.XmlElement('path');
  const yText = new Y.XmlElement('text');

  ydoc.transact(() => {
    yG.setAttribute('id',               id);
    yG.setAttribute('name',             name);
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
}

// ── CRDT operations — position sets ──────────────────────────────────────────

export function createPositionSetElement(ydoc, yBounPos, yBounPosMeta,
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

/**
 * Create a new position set from draw parameters.
 * Computes genType, genParam, snapRadius, and grid circles; calls createPositionSetElement.
 * Returns { id, name, genType } or null if extent too small.
 * Call this from app.js commit handler; app handles undo/history/logs/selection.
 */
export function addPositionSet(ydoc, yBounPos, yBounPosMeta,
  { x, y, w, h, toolName, toolParams, author }) {
  // Derive genType and genParam from toolName + toolParams
  const genType = toolName === 'pos-grid-hex' ? 'hex' : 'square';
  const genParam = genType === 'hex'
    ? (toolParams['hex-size'] ?? 40)
    : (toolParams['spacing'] ?? 80);

  // Compute snapRadius clamped to max
  const rawRadius = toolParams['snapRadius'] ?? 30;
  const snapRadius = Math.min(rawRadius, computeMaxSnapRadius(genType, genParam));

  // Generate grid circles
  const circles = gridFillExtent(x, y, w, h, genType, genParam);
  if (circles.length === 0) return null;  // extent too small

  // Create position set with all computed values
  const { id, name } = newPositionSetId();
  createPositionSetElement(ydoc, yBounPos, yBounPosMeta,
    { id, name, snapRadius, genType, genParam, x, y, w, h, circles, author });

  return { id, name, genType };
}

// ── Unified CRDT operations ───────────────────────────────────────────────────

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

/**
/**
 * Commit a move. Translates <path> d, <text> x/y, and (for pos-sets) all
 * <circle> cx/cy — all in one transaction.
 * x, y = new top-left corner of the element's bounding rect.
 */
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

// ── DOM rendering ─────────────────────────────────────────────────────────────

function _boundaryToSVGEl(yG) {
  const id   = yG.getAttribute('id')   ?? '';
  const name = yG.getAttribute('name') ?? id;

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',               `yid-${id}`);
  g.setAttribute('data-yid',         id);
  g.setAttribute('data-layer-type',  'boundaries-positions');
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
      text.setAttribute('fill',              child.getAttribute('fill') ?? 'white');
      text.setAttribute('data-boundary-name', name);
      text.textContent = yTextContent(child) || name;
      g.appendChild(text);
    }
  }
  return g;
}

function _positionSetToSVGEl(yG) {
  const id      = yG.getAttribute('id')          ?? '';
  const name    = yG.getAttribute('name')         ?? id;
  const snapR   = yG.getAttribute('data-snap-radius')  ?? '30';
  const genType = yG.getAttribute('data-gen-type') ?? 'square';
  const genParam = yG.getAttribute('data-gen-param') ?? '80';

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',               `yid-${id}`);
  g.setAttribute('data-yid',         id);
  g.setAttribute('data-layer-type',  'boundaries-positions');
  g.setAttribute('data-bounpos-type','pos-set');
  g.setAttribute('name',             name);
  g.setAttribute('data-snap-radius',      snapR);
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

function _toSVGEl(yG) {
  const type = yG.getAttribute('data-bounpos-type');
  return type === 'pos-set' ? _positionSetToSVGEl(yG) : _boundaryToSVGEl(yG);
}

// ── Elevated layer API ────────────────────────────────────────────────────────

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
  const type = typeof svgElOrType === 'string'
    ? svgElOrType
    : (svgElOrType?.getAttribute?.('data-bounpos-type') ?? 'boundary');

  if (type === 'pos-set') {
    const snapRadius = typeof svgElOrType === 'string' ? 30
      : Number(svgElOrType?.getAttribute('data-snap-radius') ?? 30);
    const genType  = typeof svgElOrType === 'string' ? 'square'
      : (svgElOrType?.getAttribute('data-gen-type') ?? 'square');
    const genParam = typeof svgElOrType === 'string' ? 80
      : Number(svgElOrType?.getAttribute('data-gen-param') ?? 80);
    const maxR = Math.floor(computeMaxSnapRadius(genType, genParam));
    const name = typeof svgElOrType === 'string' ? ''
      : (svgElOrType?.getAttribute('name') ?? '');
    return {
      label: 'Position Set',
      type,
      name,
      snapRadius: snapRadius,
      types: {
        type:           { show: [] },
        name:           { kind: 'string', show: ['add', 'edit'] },
        snapRadius:  { kind: 'number', min: 1, max: maxR, step: 1, show: ['edit'] },
      },
    };
  }

  // boundary
  const name = typeof svgElOrType === 'string' ? ''
    : (svgElOrType?.getAttribute('name') ?? '');
  return {
    label: 'Boundary',
    type,
    name,
    types: {
      type: { show: [] },
      name: { kind: 'string', show: ['add', 'edit'] },
    },
  };
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
  toSVG:,
  fromSVG:,
}
*/
