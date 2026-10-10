/**
 * drawing.js — the drawing layer, an op layer (DRAWING_LAYER).
 *
 * Every write is a DOM operation on the live #drawing-layer, run inside a
 * gesture (OpLayer.runGesture) so the envelope captures it as one operation.
 * Nothing here touches Yjs directly; the op log is the replicated state.
 * Requires a DOM (browser or jsdom).
 */

import { normalizeAngle, computeRotate, computeResizeCornerRect, rotatePoint } from './geometry.js';
import { defineOpLayer } from './op_layers.js';
import * as OpLayer from './op_layer.js';

const SVG_NS   = 'http://www.w3.org/2000/svg';

// ── BBox helpers (private) ────────────────────────────────────────────────────
function rectGetBBox(a)   { return { x: +a.x,         y: +a.y,         width: +a.width,  height: +a.height }; }
function circleGetBBox(a) { return { x: +a.cx - +a.r, y: +a.cy - +a.r, width: 2 * +a.r, height: 2 * +a.r }; }

// ── Shape-type registry ───────────────────────────────────────────────────────
// Each entry has:
//   tag     — SVG element name
//   label   — fn(attrs) → short text for the shape-list row
//   getBBox — fn(attrs) → {x,y,width,height}
//   schema  — full ttStateSchema for this type; values are defaults,
//             types entries carry `show` arrays to control which UI surfaces
//             render each field:
//               show absent / []          — never shown (geometry, internal ids)
//               show includes 'add'       — Tools panel
//               show includes 'edit'      — Edit panel
//               show includes 'addQuick'  — toolOpts popup
//
// Adding a shape type = adding one entry here (plus a button).

export const SHAPE_TYPES = {
  rect: {
    tag:     'rect',
    label:   a => `${a.width}×${a.height} @ ${a.x},${a.y}`,
    getBBox: rectGetBBox,
    iconUrl: 'drawing/rect.svg',
    // attrMap: schema key → actual SVG attribute name (where they differ)
    attrMap: { 'corner-r': 'rx', rotate: 'data-rotate', 'pivot-x': 'data-pivot-x', 'pivot-y': 'data-pivot-y' },
    schema: {
      label: 'Rectangle',
      values: {
        id: '', type: 'rect',
        x: 0, y: 0, width: 120, height: 80, rotate: 0, 'pivot-x': 0.5, 'pivot-y': 0.5,
        fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 8,
      },
      types: {
        id:             { show: [] },
        type:           { show: [] },
        x:              { show: [] },
        y:              { show: [] },
        width:          { show: [] },
        height:         { show: [] },
        rotate:         { show: [] },
        'pivot-x':      { show: [] },
        'pivot-y':      { show: [] },
        fill:           { kind: 'color-hslo',                          show: ['add', 'edit', 'addQuick'] },
        stroke:         { kind: 'color-hslo',                          show: ['edit'] },
        'stroke-width': { kind: 'number', min: 0.5, max: 10, step: 0.5, show: ['edit'] },
        'corner-r':     { kind: 'number', min: 0, max: 40, step: 2,   show: ['edit'] },
      },
    },
  },
  circle: {
    tag:     'circle',
    label:   a => `r${a.r} @ ${a.cx},${a.cy}`,
    getBBox: circleGetBBox,
    iconUrl: 'drawing/circle.svg',
    schema: {
      label: 'Circle',
      values: {
        id: '', type: 'circle',
        cx: 0, cy: 0, r: 46,
        fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5,
      },
      types: {
        id:             { show: [] },
        type:           { show: [] },
        cx:             { show: [] },
        cy:             { show: [] },
        r:              { show: [] },
        fill:           { kind: 'color-hslo',                          show: ['add', 'edit', 'addQuick'] },
        stroke:         { kind: 'color-hslo',                          show: ['edit'] },
        'stroke-width': { kind: 'number', min: 0.5, max: 10, step: 0.5, show: ['edit'] },
      },
    },
  },
};

// ── Shape operations ──────────────────────────────────────────────────────────
// Each takes the layer element or a shape element and mutates the live DOM.
// Callers wrap them in a gesture (see makeLayerAPI and the batch functions).

/**
 * Append a drawing element to the layer.
 * attrs: { id, type, ...all schema keys }
 * `type` is required and must be a key of SHAPE_TYPES. All writable keys are
 * determined by the type's schema (everything except id/type). The derived
 * `transform` is written here too, so the element is complete in one op.
 */
export function addDrawingDom(layerEl, attrs) {
  const { type } = attrs;
  if (!type) throw new Error('addDrawing: attrs.type is required');
  const def = SHAPE_TYPES[type];
  if (!def) throw new Error(`unknown shape type: ${type}`);

  const el = document.createElementNS(SVG_NS, def.tag);
  const defaults = def.schema.values;
  const attrMap  = def.attrMap ?? {};
  el.setAttribute('id', String(attrs.id));
  el.setAttribute('data-id', String(attrs.id));
  el.setAttribute('data-module', 'drawing');
  for (const k of Object.keys(def.schema.types)) {
    if (k === 'id' || k === 'type') continue;
    const v = attrs[k] ?? defaults[k];
    if (v != null) el.setAttribute(attrMap[k] ?? k, String(v));
  }
  layerEl.appendChild(el);
  syncRotation(el);
  return el;
}

/** Remove a drawing element by id. Returns true if found and removed. */
export function deleteDrawingDom(layerEl, id) {
  const el = findDrawingDom(layerEl, id);
  if (!el) return false;
  el.remove();
  return true;
}

/** The layer's child with this data-id, or null. */
export function findDrawingDom(layerEl, id) {
  for (const el of layerEl?.children ?? []) {
    if (el.getAttribute('data-id') === id) return el;
  }
  return null;
}

/**
 * Bounding box for a rendered shape svgEl, resolved per shape type so circles
 * work too. Returns { x, y, width, height } (Numbers) or null. No PAD.
 */
export function getGeom(svgEl) {
  const def = SHAPE_TYPES[svgEl?.tagName];
  if (!def) return null;
  const a = {};
  for (const k of Object.keys(def.schema.types)) a[k] = svgEl.getAttribute(k);
  return def.getBBox(a);
}

// ── Rotation ─────────────────────────────────────────────────────────────────
// Rotation is a plain degree count (schema key `rotate`, attribute
// data-rotate), never a baked transform -- the transform is derived as
// `rotate(deg cx cy)`, so a move or resize re-pivots for free by calling
// syncRotation() afterwards. getGeom() always stays in the shape's own
// UNROTATED space; a caller needing canvas-space geometry rotates the point
// itself via getRotation().

// Rects' own rotation step, in degrees; threaded through explicitly on
// every call rather than a shared default.
export const ROTATE_SNAP_DEG = 15;

const ROTATE_ATTR = 'data-rotate';

/** A transform this module didn't write -- created by external software or hand-authored */
export function hasForeignTransform(svgEl) {
  return !!svgEl?.hasAttribute?.('transform') && !svgEl.hasAttribute(ROTATE_ATTR);
}

/** A rendered shape's rotation in degrees (0 when it has none). */
export function getRotation(svgEl) {
  return parseFloat(svgEl?.getAttribute?.(ROTATE_ATTR)) || 0;
}

// A pivot is fractions of the shape's own bbox ({fx:0.5,fy:0.5} = centre),
// not canvas coordinates, so it survives a move or resize.
const CENTER_PIVOT = { fx: 0.5, fy: 0.5 };

const PIVOT_X_ATTR = 'data-pivot-x';
const PIVOT_Y_ATTR = 'data-pivot-y';

const clamp01 = n => Math.min(1, Math.max(0, n));

/** A shape's pivot, defaulting to its centre. Always clamp the return value to defend against hand-edited values out of range */
export function getPivot(svgEl) {
  const fx = parseFloat(svgEl?.getAttribute?.(PIVOT_X_ATTR));
  const fy = parseFloat(svgEl?.getAttribute?.(PIVOT_Y_ATTR));
  if (!Number.isFinite(fx) && !Number.isFinite(fy)) return CENTER_PIVOT;
  return {
    fx: Number.isFinite(fx) ? clamp01(fx) : 0.5,
    fy: Number.isFinite(fy) ? clamp01(fy) : 0.5,
  };
}

/** The canvas-space point a shape rotates about, for a given pivot. */
export function rotationCenter(geom, pivot = CENTER_PIVOT) {
  return geom
    ? { cx: geom.x + pivot.fx * geom.width, cy: geom.y + pivot.fy * geom.height }
    : { cx: 0, cy: 0 };
}

/** A shape's rotation resolved against geometry: { deg, cx, cy }, or null when unrotated. */
export function resolveRotation(svgEl, geom = getGeom(svgEl)) {
  const deg = getRotation(svgEl);
  if (!deg) return null;
  return { deg, ...rotationCenter(geom, getPivot(svgEl)) };
}

// ── Pivot placement ──────────────────────────────────────────────────────────

// How close (in fractions of the bbox) a dragged pivot has to come to one of
// the nine notable points before it snaps.
export const PIVOT_SNAP_FRACTION = 0.08;

const NOTABLE = [0, 0.5, 1];

/**
 * Snap a pivot to the nearest notable point on each axis independently, so a
 * drag near the left edge locks to the edge without also locking vertically.
 * A tolerance of 0 (or less) means free placement.
 */
export function snapPivot(fx, fy, tolerance = PIVOT_SNAP_FRACTION) {
  const snap1 = (f) => {
    if (!(tolerance > 0)) return clamp01(f);
    // Nearest within tolerance, not the first found: the notable points are
    // 0.5 apart, so a tolerance above 0.25 puts a value in range of two of
    // them and picking by order would snap to the wrong one.
    let best = null, bestGap = Infinity;
    for (const n of NOTABLE) {
      const gap = Math.abs(f - n);
      if (gap <= tolerance && gap < bestGap) { best = n; bestGap = gap; }
    }
    return best ?? clamp01(f);
  };
  return { fx: snap1(fx), fy: snap1(fy) };
}

/**
 * Pure geometry for a pivot drag: canvas-space (px, py) expressed as
 * fractions of startRect, clamped inside the shape and snapped. Unlike
 * Inkscape, a pivot can never leave the shape's own box — which also bounds
 * how far pivotShift() below can ever move anything.
 */
export function computePivot(startRect, px, py, tolerance = PIVOT_SNAP_FRACTION) {
  const fx = startRect.width  ? (px - startRect.x) / startRect.width  : 0.5;
  const fy = startRect.height ? (py - startRect.y) / startRect.height : 0.5;
  return snapPivot(clamp01(fx), clamp01(fy), tolerance);
}

/**
 * How far a shape must move to stay put when its pivot changes. The
 * rendered transform derives from (degrees, pivot), so moving the pivot of
 * an already-turned shape re-derives it about a new point and the shape
 * jumps; translating by R(delta) - delta, where delta is how far the pivot
 * moved, cancels that exactly. Zero when the shape isn't turned.
 */
export function pivotShift(geom, fromPivot, toPivot, deg) {
  if (!deg || !geom) return { dx: 0, dy: 0 };
  const from = rotationCenter(geom, fromPivot);
  const to   = rotationCenter(geom, toPivot);
  const dx   = to.cx - from.cx;
  const dy   = to.cy - from.cy;
  const shifted = rotatePoint({ x: dx, y: dy }, { deg });
  return { dx: shifted.x - dx, dy: shifted.y - dy };
}

// The eight directions the pivot handle radiates in: two per quadrant,
// symmetric about that quadrant's diagonal (NE/SE/SW/NW at 45/135/225/315°,
// measured clockwise from north) and offset ±30° from it — 15° and 75°
// either side of NE's 45°, and so on round the compass. None sits on a
// cardinal axis, which is what lets every ray fade as a whole QUADRANT (see
// pivotRayOpacities) rather than each ray needing its own per-axis case.
const PIVOT_RAY_ANGLES = [15, 75, 105, 165, 195, 255, 285, 345];
export const PIVOT_RAYS = PIVOT_RAY_ANGLES.map(deg => {
  const rad = deg * Math.PI / 180;
  return { dx: Math.sin(rad), dy: -Math.cos(rad) };
});

// A ray fades as the pivot approaches the edge its quadrant sits on: full
// strength at or beyond the middle, linearly to nothing at the edge. Only
// the SIGN of dir matters, not its magnitude.
function rayAxisOpacity(f, dir) {
  if (!dir) return 1;                       // this ray doesn't lean on this axis
  return clamp01((dir < 0 ? f : 1 - f) / 0.5);
}

/**
 * Visibility of each of the eight rays for a pivot at (fx, fy). Both axes
 * attenuate and multiply, so the two rays sharing a quadrant always fade
 * identically: by the time the pivot reaches a corner, only that corner's
 * own quadrant pair is still visible, keeping the handle legible against
 * the rotate handles instead of needing to move them out of its way.
 */
export function pivotRayOpacities(fx, fy) {
  return PIVOT_RAYS.map(({ dx, dy }) => ({
    dx, dy,
    opacity: rayAxisOpacity(fx, dx) * rayAxisOpacity(fy, dy),
  }));
}

/** Format a resolved rotation as an SVG transform, or null for none. */
export function rotationTransform(rot) {
  return rot ? `rotate(${rot.deg} ${rot.cx} ${rot.cy})` : null;
}

/**
 * Project a shape's stored rotation onto its live DOM element as a
 * transform. Called after every geometry write so the pivot tracks the
 * shape rather than the position it had when the rotation was set.
 */
export function syncRotation(domEl) {
  if (!domEl?.setAttribute) return;
  // No data-rotate means this shape's transform isn't ours — a hand-authored
  // or imported SVG can carry its own, and rewriting it would silently
  // throw the author's geometry away.
  if (!domEl.hasAttribute?.(ROTATE_ATTR)) return;
  const transform = rotationTransform(resolveRotation(domEl));
  if (transform) domEl.setAttribute('transform', transform);
  else           domEl.removeAttribute('transform');
}

/** Commit a rotation. A shape whose schema has no `rotate` key (circles) is a no-op. */
export function applyRotateDom(domEl, deg) {
  if (!domEl) return;
  if (!SHAPE_TYPES[domEl.tagName]?.schema.types.rotate) return;
  domEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(deg)));
  syncRotation(domEl);
}

// ── Transform reconciliation (import) ────────────────────────────────────────
// A file from another editor can disagree with itself: its transform is
// what that editor actually did, its degrees are what we last thought.
// Dropping the transform outright would throw the edit away, so it has to
// be proved ours before it goes.

const MATRIX_EPSILON = 1e-6;

const IDENTITY = [1, 0, 0, 1, 0, 0];

// [a b c d e f] x [a b c d e f], in SVG's column-vector convention.
function matMul(m, n) {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

function termMatrix(name, a) {
  const rad = d => d * Math.PI / 180;
  switch (name) {
    case 'matrix':    return a.length === 6 ? a : null;
    case 'translate': return [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    case 'scale':     return [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    case 'skewX':     return [1, 0, Math.tan(rad(a[0] ?? 0)), 1, 0, 0];
    case 'skewY':     return [1, Math.tan(rad(a[0] ?? 0)), 0, 1, 0, 0];
    case 'rotate': {
      const [deg, cx = 0, cy = 0] = a;
      const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
      return matMul(matMul([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    default: return null;
  }
}

/**
 * Parse an SVG transform list into a single matrix, or null if any term is
 * unrecognised (better to treat the whole thing as foreign than to silently
 * drop a term and act on a partial reading).
 *
 * Hand-rolled because there is nothing to borrow: DOMMatrix parses the CSS
 * grammar, not SVG's (no three-argument rotate), and jsdom implements
 * neither it nor SVGElement.transform.baseVal.
 */
export function parseTransformList(str) {
  if (typeof str !== 'string' || !str.trim()) return null;
  const re = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let out = IDENTITY, seen = 0, m;
  while ((m = re.exec(str)) !== null) {
    const args = m[2].trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (args.some(n => !Number.isFinite(n))) return null;
    const term = termMatrix(m[1], args);
    if (!term) return null;
    out = matMul(out, term);
    seen++;
  }
  return seen ? out : null;
}

/**
 * Reconcile a shape's stored rotation against the transform a file arrived
 * with. Returns { rotate, x, y, transform } — transform is null when the
 * shape's own degrees fully describe it, the original matrix when they
 * can't. Three outcomes:
 *   - the transform is the one we would have derived: ours, dropped.
 *   - it's a pure rotation about some other point, or with a move on top:
 *     both are recovered losslessly, the angle onto rotate and any leftover
 *     translation folded into x/y.
 *   - it scales, skews or flips: not expressible as degrees, so the file's
 *     transform is kept verbatim and the stale rotation is dropped.
 */
export function reconcileTransform(geom, storedDeg, matrix) {
  const base = { rotate: storedDeg, x: geom.x, y: geom.y, transform: null };
  if (!matrix) return base;

  const [a, b, c, d, e, f] = matrix;
  const isPureRotation =
    Math.abs(a * a + b * b - 1) < MATRIX_EPSILON &&   // unit scale
    Math.abs(a * c + b * d)     < MATRIX_EPSILON &&   // no skew
    Math.abs(a * d - b * c - 1) < MATRIX_EPSILON;     // no flip
  if (!isPureRotation) return { rotate: null, x: geom.x, y: geom.y, transform: matrix };

  const deg = normalizeAngle(Math.atan2(b, a) * 180 / Math.PI);

  // Whatever translation is left once the rotation about our own pivot is
  // accounted for. Zero when the matrix is exactly the one we derived.
  const { cx, cy } = rotationCenter(geom, { fx: 0.5, fy: 0.5 });
  const rotatedCx  = a * cx + c * cy;
  const rotatedCy  = b * cx + d * cy;
  const dx = e - (cx - rotatedCx);
  const dy = f - (cy - rotatedCy);

  return { rotate: deg, x: geom.x + dx, y: geom.y + dy, transform: null };
}

/**
 * Commit a pivot placement. The compensating x/y ride in the SAME gesture as
 * the pivot itself: they are one user action, and a peer that saw only half
 * of it would watch the shape jump and come back.
 */
export function applyPivotDom(domEl, fx, fy, x, y) {
  if (!domEl) return;
  if (!SHAPE_TYPES[domEl.tagName]?.schema.types['pivot-x']) return;
  domEl.setAttribute(PIVOT_X_ATTR, String(clamp01(fx)));
  domEl.setAttribute(PIVOT_Y_ATTR, String(clamp01(fy)));
  domEl.setAttribute('x', String(Math.round(x)));
  domEl.setAttribute('y', String(Math.round(y)));
  syncRotation(domEl);
}

/** DOM-only pivot preview for a ghost clone — the rotate/resize counterpart. */
export function previewPivot(ghostEl, fx, fy) {
  if (!ghostEl?.setAttribute) return;
  ghostEl.setAttribute(PIVOT_X_ATTR, String(clamp01(fx)));
  ghostEl.setAttribute(PIVOT_Y_ATTR, String(clamp01(fy)));
  syncRotation(ghostEl);
}

/**
 * Settle a freshly imported shape's rotation against the transform it
 * arrived with. A shape with no `rotate` of ours is left completely
 * alone: its transform is the author's.
 */
export function reconcileImportedTransform(el) {
  if (el?.getAttribute?.(ROTATE_ATTR) == null) return;
  const def = SHAPE_TYPES[el.localName];
  if (!def) return;

  const attrs = {};
  for (const k of Object.keys(def.schema.types)) {
    attrs[k] = el.getAttribute((def.attrMap ?? {})[k] ?? k);
  }
  const geom = def.getBBox(attrs);
  if (!Number.isFinite(geom?.width)) return;

  // Present but unreadable is foreign by definition (we can't have written
  // it), unlike "no transform at all" -- which parseTransformList also
  // reports as null, so check the raw attribute to tell them apart.
  const raw    = el.getAttribute('transform');
  const matrix = parseTransformList(raw);
  if (raw != null && !matrix) {
    el.removeAttribute(ROTATE_ATTR);
    return;
  }

  const out = reconcileTransform(geom, getRotation(el), matrix);

  el.setAttribute('x', String(Math.round(out.x)));
  el.setAttribute('y', String(Math.round(out.y)));

  if (out.rotate == null) {
    el.removeAttribute(ROTATE_ATTR);
    if (out.transform) el.setAttribute('transform', formatMatrix(out.transform));
    else if (el.getAttribute('transform') != null) el.removeAttribute('transform');
    return;
  }
  el.setAttribute(ROTATE_ATTR, String(normalizeAngle(out.rotate)));
  syncRotation(el);
}

function formatMatrix(m) {
  return `matrix(${m.map(n => +n.toFixed(6)).join(' ')})`;
}

/**
 * The "anchor" is the canvas-space point that tracks the pointer during a drag:
 *   rect   → top-left corner  { x, y }
 *   circle → centre           { x: cx, y: cy }
 *
 * canvas.js captures this on pointerdown, computes the pointer-to-anchor offset,
 * and passes (anchor + offset delta) back to applyMove on every pointermove.
 * Neither canvas.js nor app.js needs to know which attribute names are involved.
 */
export function getAnchor(svgEl) {
  const tag = svgEl?.tagName;
  if (tag === 'rect') {
    return {
      x: parseFloat(svgEl.getAttribute('x'))  || 0,
      y: parseFloat(svgEl.getAttribute('y'))  || 0,
    };
  }
  if (tag === 'circle') {
    return {
      x: parseFloat(svgEl.getAttribute('cx')) || 0,
      y: parseFloat(svgEl.getAttribute('cy')) || 0,
    };
  }
  // Fallback: top-left of bounding box
  const geom = getGeom(svgEl);
  return geom ? { x: geom.x, y: geom.y } : { x: 0, y: 0 };
}

/**
 * Every mode svgEl can be in, in cycle order, fully `sel-`-prefixed.
 * 'sel-move' is the default every shape shows with no click; rects/
 * circles each add their one resize-family mode after it. Rects rotate as
 * 'sel-rotate-pivot' — the placeable-pivot variant — unless they carry a
 * foreign transform, which drops rotate mode entirely.
 */
export function selectModes(svgEl) {
  const tag = svgEl?.tagName;
  if (tag === 'rect')   return hasForeignTransform(svgEl)
    ? ['sel-move', 'sel-resize']
    : ['sel-move', 'sel-resize', 'sel-rotate-pivot'];
  if (tag === 'circle') return ['sel-move', 'sel-resize-r'];
  return ['sel-move'];
}

/**
 * The next mode svgEl should show, given the mode it's currently in
 * (pass null for "nothing yet, what should this show automatically").
 */
export function nextSelectMode(svgEl, currentMode) {
  const cycle = selectModes(svgEl);
  const i = cycle.indexOf(currentMode);
  return cycle[(i + 1) % cycle.length];
}

const MIN_CIRCLE_R = 15  // never let a radius-drag shrink a circle below this
const MAX_CIRCLE_R = 2000 // generous sanity cap

function clampCircleR(r) {
  return Math.min(MAX_CIRCLE_R, Math.max(MIN_CIRCLE_R, r))
}

/**
 * Pure geometry for the single-handle radius drag: given the circle's bbox
 * at drag start and the current pointer position (px, py), compute the new
 * bbox with the SAME centre and a radius equal to the pointer's distance
 * from that centre (clamped to MIN_CIRCLE_R/MAX_CIRCLE_R). Returned in the
 * same {x, y, width, height} bbox shape applyResize/updateResizeGhost
 * already expect, so the rest of the resize pipeline (shared with rects'
 * corner-drag) doesn't need to know shapes differ.
 */
export function computeResizeRadiusRect(startRect, px, py) {
  const cx = startRect.x + startRect.width  / 2;
  const cy = startRect.y + startRect.height / 2;
  const r  = clampCircleR(Math.hypot(px - cx, py - cy));
  return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
}

const MIN_RECT_RESIZE_SIZE = 30 // never let a corner-drag shrink a rect below this

// Which resize math a live drag/commit needs, by mode
export function computeResize(mode, startRect, corner, px, py) {
  return mode === 'sel-resize-r'
    ? computeResizeRadiusRect(startRect, px, py)
    : computeResizeCornerRect(startRect, corner, px, py, MIN_RECT_RESIZE_SIZE);
}

/**
 * Commit a resize. rect and circle -- type-branching lives here, callers are
 * type-agnostic. x, y, width, height are the new bbox in canvas-space (for
 * circle, computeResizeRadiusRect's centre-preserving bbox). The integer
 * counterpart of previewResize.
 */
export function applyResizeDom(domEl, x, y, width, height) {
  if (!domEl) return;
  const tag = domEl.tagName;
  if (tag === 'rect') {
    domEl.setAttribute('x',      String(Math.round(x)));
    domEl.setAttribute('y',      String(Math.round(y)));
    domEl.setAttribute('width',  String(Math.round(width)));
    domEl.setAttribute('height', String(Math.round(height)));
  } else if (tag === 'circle') {
    const r = width / 2;
    domEl.setAttribute('cx', String(Math.round(x + r)));
    domEl.setAttribute('cy', String(Math.round(y + r)));
    domEl.setAttribute('r',  String(Math.round(r)));
  }
  syncRotation(domEl);
}

/**
 * Commit a move to a live DOM element (inside a gesture). Type-branching
 * lives here; the derived transform follows the new anchor.
 *
 * domEl — live SVG DOM element (no-op if null)
 * x, y  — new anchor position in canvas-space
 */
export function applyMoveDom(domEl, x, y) {
  if (!domEl) return;
  const tag = domEl.tagName;
  if (tag === 'rect') {
    domEl.setAttribute('x', x);
    domEl.setAttribute('y', y);
  } else if (tag === 'circle') {
    domEl.setAttribute('cx', x);
    domEl.setAttribute('cy', y);
  }
  syncRotation(domEl);
}

/**
 * Summarise a rendered shape svgEl as a plain layer-object descriptor.
 */
function shapeData(svgEl) {
  const attrs = {};
  for (const at of svgEl.attributes) attrs[at.name] = at.value;
  const type = svgEl.localName;
  const def  = SHAPE_TYPES[type];
  return {
    id:    attrs['data-id'],
    label: def ? def.label(attrs) : type,
    fill:  attrs.fill ?? '#888',
    kind:  type,
  };
}

/**
 * All drawing elements as layer-object descriptors, in z-order.
 * Used by app.js getLayerObjects — keeps drawing internals out of the app bus.
 */
export function drawingsData(layerEl) {
  return [...layerEl.children].map(shapeData);
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * Return the ttStateSchema for a drawing element (or defaults if no element given).
 * When called with an svgEl, values are read from live DOM attributes.
 * When called without an argument (or with a type string), returns schema defaults.
 *
 * The `types` object carries `show` arrays so each UI surface knows which fields
 * to render:
 *   show includes 'add'       → Tools panel
 *   show includes 'edit'      → Edit panel
 *   show includes 'addQuick'  → toolOpts popup
 *   show: []                  → not rendered anywhere (internal/geometry)
 */
export function getTtStateSchema(svgElOrType) {
  const type = typeof svgElOrType === 'string'
    ? svgElOrType
    : (svgElOrType?.getAttribute?.('data-type') ?? svgElOrType?.tagName ?? 'rect');
  const def = SHAPE_TYPES[type];
  if (!def) {
    // Unknown type (e.g. 'select', a toy/bounPos tool name) — not a drawing
    // type, so this module has no schema to offer. Let the caller fall
    // back to its own tool registry.
    if (typeof svgElOrType === 'string' || !svgElOrType) return null;
  }
  const shapeDef = def ?? SHAPE_TYPES.rect;
  const { schema } = shapeDef;
  const reverseMap = Object.fromEntries(Object.entries(shapeDef.attrMap ?? {}).map(([k, v]) => [v, k]));
  if (!svgElOrType || typeof svgElOrType === 'string') {
    const { id: _id, type: _type, ...rest } = schema.values;
    return { label: schema.label, ...rest, types: schema.types };
  }
  // Element present — read current values from DOM, mapping SVG attr names back to schema keys.
  const values = {};
  for (const k of Object.keys(schema.types)) {
    if (k === 'id' || k === 'type') continue;  // internal
    const svgAttr = (shapeDef.attrMap ?? {})[k] ?? k;
    values[k] = svgElOrType.getAttribute(svgAttr) ?? schema.values[k];
  }
  return { label: schema.label, ...values, types: schema.types };
}

/**
 * Snapshot the full serialisable state of a drawing element.
 * Reads all schema keys from its attributes (mapping SVG attr names to schema keys).
 */
export function getTtState(domEl) {
  if (!domEl) return null;
  const type = domEl.tagName;
  const def  = SHAPE_TYPES[type];
  if (!def) return null;
  const state = { type };
  for (const k of Object.keys(def.schema.types)) {
    const svgAttr = (def.attrMap ?? {})[k] ?? k;
    const v = domEl.getAttribute(svgAttr) ?? domEl.getAttribute(k);
    if (v != null) state[k] = v;
  }
  return state;
}

/**
 * Write a ttState snapshot back onto the layer: updates the element if it
 * exists, creates it if not.
 */
export function applyTtStateDom(layerEl, state) {
  if (!state?.id || !state?.type) return;
  const existing = findDrawingDom(layerEl, state.id);
  if (!existing) {
    addDrawingDom(layerEl, state);
    return;
  }
  for (const [k, v] of Object.entries(state)) {
    if (k === 'id' || k === 'type') continue;
    existing.setAttribute(k, String(v));
  }
  syncRotation(existing);
}

/**
 * Apply an editData object to a drawing element. Only keys present in
 * editData are written. Called by App.commitEdit.
 */
export function editDom(domEl, editData) {
  if (!domEl) return;
  const attrMap = SHAPE_TYPES[domEl.tagName]?.attrMap ?? {};
  for (const [k, v] of Object.entries(editData)) {
    domEl.setAttribute(attrMap[k] ?? k, String(v));
  }
  syncRotation(domEl);
}

/**
 * Apply a live resize to a detached ghost clone — DOM only, never recorded.
 * (x, y, width, height) is the bbox form computeResize returns; for a
 * circle that's the centre-preserving bbox.
 */
export function previewResize(ghostEl, x, y, width, height) {
  const tag = ghostEl?.tagName;
  if (tag === 'rect') {
    ghostEl.setAttribute('x',      x);
    ghostEl.setAttribute('y',      y);
    ghostEl.setAttribute('width',  width);
    ghostEl.setAttribute('height', height);
  } else if (tag === 'circle') {
    const r = width / 2;
    ghostEl.setAttribute('cx', x + r);
    ghostEl.setAttribute('cy', y + r);
    ghostEl.setAttribute('r',  r);
  } else {
    return;
  }
  syncRotation(ghostEl);
}

/**
 * Apply a live rotation to a detached ghost clone — DOM only, never recorded.
 * The counterpart of previewResize for the rotate gesture.
 */
export function previewRotate(ghostEl, deg) {
  if (!ghostEl?.setAttribute) return;
  ghostEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(deg)));
  syncRotation(ghostEl);
}

export function previewEdit(ghostEl, editData) {
  const attrMap = SHAPE_TYPES[ghostEl.tagName]?.attrMap ?? {};
  for (const [key, value] of Object.entries(editData)) {
    ghostEl.setAttribute(attrMap[key] ?? key, value);
  }
}

// ── The layer ─────────────────────────────────────────────────────────────────

export const DRAWING_LAYER = defineOpLayer({
  name:        'drawing',
  selector:    '#drawing-layer',
  layerDataId: 'tt-layer-drawing',
  opsKey:      'ops:drawing',
  contentKey:  'checkpointContent:drawing',
  headKey:     (tableId) => `tt_head_drawing_${tableId}`,
  mergeKey:    (tableId) => `tt_head_merge_drawing_${tableId}`,
});

export const runGesture = (ydoc, layerEl, fn, opts) =>
  OpLayer.runGesture(ydoc, DRAWING_LAYER, layerEl, fn, opts);
export const projectLayer = (ydoc, layerEl, opts) =>
  OpLayer.projectLayer(ydoc, DRAWING_LAYER, layerEl, opts);
export const receiveDrawingOp = (ydoc, layerEl, opId, tableId, joinSequence) =>
  OpLayer.receiveLayerOp(ydoc, DRAWING_LAYER, layerEl, opId, tableId, joinSequence);

// ── Batch gestures ────────────────────────────────────────────────────────────
// A multi-select action is one gesture, one operation: a loop of single
// gestures would mint N operations and need N undo presses.

/** Delete several shapes as one gesture. Returns the op, or null if none existed. */
export function deleteDrawingsBatch(ydoc, layerEl, ids, { authorId, tableId } = {}) {
  let deletedAny = false;
  const result = runGesture(ydoc, layerEl, () => {
    for (const id of ids) {
      if (deleteDrawingDom(layerEl, id)) deletedAny = true;
    }
  }, { gesture: 'delete-batch', authorId, tableId });
  return deletedAny ? (result.op ?? null) : null;
}

/**
 * Move several shapes as one gesture. moves: [{ id, x, y }] -- x/y are the
 * anchor convention applyMoveDom uses. Returns the op, or null if none moved.
 */
export function moveDrawingsBatch(ydoc, layerEl, moves, { authorId, tableId } = {}) {
  let movedAny = false;
  const result = runGesture(ydoc, layerEl, () => {
    for (const { id, x, y } of moves) {
      const el = findDrawingDom(layerEl, id);
      if (!el) continue;
      applyMoveDom(el, x, y);
      movedAny = true;
    }
  }, { gesture: 'move-batch', authorId, tableId });
  return movedAny ? (result.op ?? null) : null;
}

const DUPLICATE_OFFSET = 22;

/**
 * A copy of srcEl's state, offset down-right and under a new id, as
 * addDrawingDom attrs. Null for an element that isn't one of our shapes.
 */
function duplicateAttrs(srcEl, newId) {
  const state = getTtState(srcEl);
  if (!state) return null;
  const attrs = { ...state, id: newId };
  for (const [k, v] of Object.entries(state)) {
    if (k === 'x' || k === 'y' || k === 'cx' || k === 'cy') attrs[k] = +v + DUPLICATE_OFFSET;
  }
  return attrs;
}

/**
 * Duplicate several shapes as one gesture. newId() mints each copy's id.
 * Returns { op, newIds }; op is null when nothing was duplicated.
 */
export function duplicateDrawingsBatch(ydoc, layerEl, ids, { authorId, tableId, newId } = {}) {
  const newIds = [];
  const result = runGesture(ydoc, layerEl, () => {
    for (const id of ids) {
      const srcEl = findDrawingDom(layerEl, id);
      const attrs = srcEl && duplicateAttrs(srcEl, newId());
      if (!attrs) continue;
      addDrawingDom(layerEl, attrs);
      newIds.push(attrs.id);
    }
  }, { gesture: 'duplicate', authorId, tableId });
  return { op: newIds.length ? (result.op ?? null) : null, newIds };
}

/**
 * Commit pre-parsed foreign shapes onto a live layer as one gesture --
 * storage.js's populateFromSvgDoc, live-table branch. A shape whose id
 * collides with one already on the layer is re-id'd: data-id is the op
 * log's primary key (invariant 1).
 */
export function importDrawings(ydoc, layerEl, els, opts = {}) {
  if (!els?.length) return null;
  return runGesture(ydoc, layerEl, () => {
    for (const el of els) {
      const id = el.getAttribute('data-id');
      if (!id || findDrawingDom(layerEl, id)) {
        const fresh = 'import_' + Math.random().toString(36).slice(2, 7);
        el.setAttribute('id', fresh);
        el.setAttribute('data-id', fresh);
      }
      layerEl.appendChild(el);
    }
  }, { gesture: 'import', ...opts });
}

/**
 * makeLayerAPI -- the canonical LayerAPI for the drawing layer.
 *
 * getLayerEl returns the live #drawing-layer. Everything here reads and
 * writes that DOM; writes run inside runGesture so the envelope captures
 * them. Whatever find() returns is what the other methods accept.
 */
export function makeLayerAPI(ydoc, getLayerEl, user, tableId, isCreator = false) {
  const layer = () => (typeof getLayerEl === 'function' ? getLayerEl() : getLayerEl);
  const gesture = (name, fn) =>
    runGesture(ydoc, layer(), fn, { gesture: name, authorId: user.id, tableId });

  return {
    find:            (id)            => findDrawingDom(layer(), id),
    add:             (attrs)         => {
      let el = null;
      gesture('draw', () => { el = addDrawingDom(layer(), attrs); });
      return el;
    },
    delete:          (id)            => {
      let deleted = false;
      gesture('delete', () => { deleted = deleteDrawingDom(layer(), id); });
      return deleted;
    },
    getGeom,
    getAnchor,
    getTtState,
    getTtStateSchema,
    selectModes,
    nextSelectMode,
    computeResize,
    getRotation,
    resolveRotation,
    rotationCenter:  (svgEl, geom) => rotationCenter(geom, getPivot(svgEl)),
    getPivot,
    computeRotate,
    computePivot,
    pivotShift,
    previewResize,
    previewRotate,
    previewPivot,
    applyMoveCommit: (el, x, y)       => gesture('move',   () => applyMoveDom(el, x, y)),
    applyResize:     (el, x, y, w, h) => gesture('resize', () => applyResizeDom(el, x, y, w, h)),
    applyRotate:     (el, deg)        => gesture('rotate', () => applyRotateDom(el, deg)),
    applyPivot:      (el, fx, fy, x, y) => gesture('pivot', () => applyPivotDom(el, fx, fy, x, y)),
    applyTtState:    (state)          => gesture('edit',   () => applyTtStateDom(layer(), state)),
    edit:            (el, editData)   => gesture('edit',   () => editDom(el, editData)),
    previewEdit,
    listData:        ()               => drawingsData(layer()),
    render:          (layerEl, joinSequence = []) =>
                       projectLayer(ydoc, layerEl, { tableId, authorId: user.id, isCreator, joinSequence }),
    receive:         (layerEl, opId, joinSequence = []) =>
                       receiveDrawingOp(ydoc, layerEl, opId, tableId, joinSequence),
  };
}
