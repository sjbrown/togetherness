/**
 * core CRDT operations for togetherness
 *
 * The CRDT operations (addDrawing, deleteDrawing, findDrawing, SHAPE_TYPES) are pure
 * functions over Yjs types — no DOM, importable anywhere.
 *
 * The rendering helpers (_toSVGEl, getGeom, listDrawings) ARE DOM-coupled: they
 * mirror Yjs nodes into live SVG elements. They require a DOM (browser or jsdom).
 */

import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// ── BBox helpers (private) ────────────────────────────────────────────────────
function rectGetBBox(a)   { return { x: +a.x,         y: +a.y,         width: +a.width,  height: +a.height }; }
function circleGetBBox(a) { return { x: +a.cx - +a.r, y: +a.cy - +a.r, width: 2 * +a.r, height: 2 * +a.r }; }

// ── Shape-type registry ───────────────────────────────────────────────────────
// Each entry has:
//   tag     — SVG element name (also the Y.XmlElement nodeName)
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
    // `rotate` maps to data-rotate rather than a bare `rotate` attribute:
    // SVG already gives `rotate` a different meaning on <text>, so a
    // data- name keeps the degree count unambiguously ours.
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

/**
 * Add a drawing element to the doc.
 * attrs: { id, type, ...all schema keys }
 * `type` is required and must be a key of SHAPE_TYPES. All writable keys are
 * determined by the type's schema (everything except id/type).
 */
export function addDrawing(ydoc, yDrawing, attrs) {
  const { type } = attrs;
  if (!type) throw new Error('addDrawing: attrs.type is required');
  const def = SHAPE_TYPES[type];
  if (!def) throw new Error(`unknown shape type: ${type}`);

  const el = new Y.XmlElement(def.tag);
  const defaults = def.schema.values;
  const attrMap  = def.attrMap ?? {};
  ydoc.transact(() => {
    el.setAttribute('id', String(attrs.id));
    for (const k of Object.keys(def.schema.types)) {
      if (k === 'id' || k === 'type') continue;
      const v = attrs[k] ?? defaults[k];
      if (v != null) el.setAttribute(attrMap[k] ?? k, String(v));
    }
    yDrawing.insert(yDrawing.length, [el]);
  });
  return el;
}

/**
 * Delete a drawing element by id. Returns true if found and deleted.
 */
export function deleteDrawing(ydoc, yDrawing, id) {
  const idx = yDrawing.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yDrawing.delete(idx, 1);
  });
  return true;
}

/**
 * Find a Y.XmlElement by id. Returns null if not found.
 */
export function findDrawing(yDrawing, id) {
  return yDrawing.toArray().find(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  ) ?? null;
}

/**
 * Mirror a Y.XmlElement tree into a live, SVG-namespaced DOM element.
 * Uses createElementNS (not toDOM/DOMParser) so the SVG namespace and tag-name
 * case are preserved. <script> nodes are never mirrored for live rendering —
 * pass { includeScripts: true } only for export.
 */
function mirror(yNode, opts = {}) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString());
  if (!(yNode instanceof Y.XmlElement)) return null;
  if (yNode.nodeName === 'script' && !opts.includeScripts) return null;
  const el = document.createElementNS(SVG_NS, yNode.nodeName);
  const attrs = yNode.getAttributes();
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k]);
    else                    el.setAttribute(k, attrs[k]);
  }
  yNode.toArray().forEach(child => {
    const dom = mirror(child, opts);
    if (dom) el.appendChild(dom);
  });
  return el;
}

/**
 * Render a shape Y.XmlElement to an SVG DOM element, stamped with the handles
 * app.js needs: data-id (the shape id), data-module="drawing", and a
 * plain SVG id="{id}" so that overlay.js <use href="#{id}"> can
 * reference the element for drag-ghost rendering without touching its geometry.
 */
export function _toSVGEl(yEl, opts = {}) {
  const el = mirror(yEl, opts);
  if (el && el.setAttribute) {
    const id = yEl.getAttribute('id');
    el.setAttribute('id',              id);
    el.setAttribute('data-id',         id);
    el.setAttribute('data-module', 'drawing');
    syncRotation(el);
  }
  return el;
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
// A shape stores its rotation as a plain degree count (schema key `rotate`,
// SVG attribute data-rotate) and never as a baked transform. The transform is
// derived — `rotate(deg cx cy)` about the shape's own centre — so a move or a
// resize re-pivots for free: everything that writes geometry calls
// syncRotation() afterwards and the pivot follows.
//
// getGeom() deliberately stays in the shape's UNROTATED local space. Callers
// that need screen/canvas-space geometry (hit-testing a handle, drawing a
// selection ring) rotate the point or the decoration themselves, using
// getRotation() — keeping one bbox definition instead of two.

// Default rotation step. Every function that snaps takes snapDeg as an
// argument defaulting to this, so a per-table or per-user increment can be
// threaded through without touching the geometry.
export const ROTATE_SNAP_DEG = 15;

const ROTATE_ATTR = 'data-rotate';

/** Degrees in [0, 360). */
export function normalizeAngle(deg) {
  const d = Number(deg) || 0;
  return ((d % 360) + 360) % 360;
}

/**
 * Snap deg to the nearest multiple of snapDeg. A snapDeg of 0 (or less)
 * means free rotation — the angle passes through unsnapped.
 */
export function snapAngle(deg, snapDeg = ROTATE_SNAP_DEG) {
  const step = Number(snapDeg);
  if (!(step > 0)) return normalizeAngle(deg);
  return normalizeAngle(Math.round(Number(deg) / step) * step);
}

/**
 * A transform this module didn't write — an imported or hand-authored shape
 * whose geometry can't be expressed as degrees (see reconcileTransform's
 * third outcome). Rotating it would replace that transform and throw the
 * author's work away, so rotation isn't offered at all. Move and resize stay
 * available: they write x/y/width/height and syncRotation leaves the
 * transform alone, so nothing is lost.
 */
export function hasForeignTransform(svgEl) {
  return !!svgEl?.hasAttribute?.('transform') && !svgEl.hasAttribute(ROTATE_ATTR);
}

/** A rendered shape's rotation in degrees (0 when it has none). */
export function getRotation(svgEl) {
  return parseFloat(svgEl?.getAttribute?.(ROTATE_ATTR)) || 0;
}

// Where a shape's pivot sits, as fractions of its own bbox: {fx: 0.5, fy: 0.5}
// is the centre, {fx: 0, fy: 1} the bottom-left corner. Fractions rather than
// canvas-space coordinates for the same reason the rotation is degrees — a
// point expressed against the shape survives a move and a resize, an absolute
// one goes stale on both.
const CENTER_PIVOT = { fx: 0.5, fy: 0.5 };

const PIVOT_X_ATTR = 'data-pivot-x';
const PIVOT_Y_ATTR = 'data-pivot-y';

const clamp01 = n => Math.min(1, Math.max(0, n));

/**
 * A shape's pivot, defaulting to its centre. Clamped on READ, not just on
 * write: a pivot outside the shape is the lever-arm rotation this app
 * deliberately doesn't offer, so a hand-edited or imported value out of
 * range is corrected at the boundary rather than trusted.
 */
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

/**
 * A shape's rotation resolved against geometry: { deg, cx, cy }, or null
 * when it isn't rotated. The single place degrees and pivot are turned into
 * the concrete point everything else rotates about — overlay.js turns
 * selection furniture with it, app.js un-rotates pointers through it, and
 * syncRotation writes it onto the element.
 */
export function resolveRotation(svgEl, geom = getGeom(svgEl)) {
  const deg = getRotation(svgEl);
  if (!deg) return null;
  return { deg, ...rotationCenter(geom, getPivot(svgEl)) };
}

// ── Pivot placement ──────────────────────────────────────────────────────────

// How close (in fractions of the bbox) a dragged pivot has to come to one of
// the nine notable points before it snaps: the four corners, the four edge
// midpoints, and the centre. Same shape as ROTATE_SNAP_DEG — an argument
// everywhere, so the tolerance can be made a setting without touching any of
// the geometry.
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
 * How far a shape must move to stay put when its pivot changes.
 *
 * The rendered transform is derived from (degrees, pivot), so moving the
 * pivot of an already-turned shape re-derives it about a new point and the
 * shape jumps. Translating by R(delta) - delta, where delta is how far the
 * pivot moved, cancels that exactly. Zero when the shape isn't turned, so
 * placing a pivot on an unrotated shape changes nothing visible and only
 * sets up the next rotation.
 *
 * The same correction a resize needs — see app.js — since both move the
 * point the shape turns about.
 */
export function pivotShift(geom, fromPivot, toPivot, deg) {
  if (!deg || !geom) return { dx: 0, dy: 0 };
  const from = rotationCenter(geom, fromPivot);
  const to   = rotationCenter(geom, toPivot);
  const dx   = to.cx - from.cx;
  const dy   = to.cy - from.cy;
  const rad  = deg * Math.PI / 180;
  return {
    dx: dx * Math.cos(rad) - dy * Math.sin(rad) - dx,
    dy: dx * Math.sin(rad) + dy * Math.cos(rad) - dy,
  };
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
// strength while the pivot is at or beyond the middle, linearly to nothing
// at the edge. Only the SIGN of dir is used — magnitude is irrelevant, which
// is what lets this double as an axis fade (old cardinal rays, dir = 0/±1)
// and a quadrant fade (new rays, dir = a fractional sin/cos) with no change.
function rayAxisOpacity(f, dir) {
  if (!dir) return 1;                       // this ray doesn't lean on this axis
  return clamp01((dir < 0 ? f : 1 - f) / 0.5);
}

/**
 * How visible each of the eight rays is for a pivot at (fx, fy). Every ray
 * has both a horizontal and a vertical lean now (see PIVOT_RAYS), so both
 * axes always attenuate and multiply — which means the two rays sharing a
 * quadrant (same sign of dx, same sign of dy) always fade IDENTICALLY,
 * however differently they're angled within that quadrant. In effect the
 * fade is per-quadrant: at fx=0 (left edge) every ray leaning left (NW's and
 * SW's four rays) is gone and every ray leaning right stays exactly as it
 * was.
 *
 * This is what keeps the pivot handle legible against the rotate handles
 * instead of moving them out of its way: by the time the pivot reaches a
 * corner, both rays of every OTHER quadrant have faded out, and only the
 * pair pointing back into the shape from that corner's own quadrant is left.
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

/**
 * Pure geometry for a corner-drag rotation: the angle from the shape's
 * pivot out to the pointer, less the angle out to the corner that was
 * grabbed, so that corner stays under the pointer. Snapped to snapDeg.
 *
 * The result is absolute, not a delta — the rotation the shape had when
 * the drag began is already implied by where the grabbed corner started.
 *
 * centre is the canvas-space {cx, cy} to turn about, captured at drag start
 * (see rotationCenter) rather than re-derived here, so this stays pure and a
 * pivot anywhere other than the middle needs no change.
 *
 * corner is a RESIZE_CORNER_* index (0=NW/1=NE/2=SE/3=SW). px/py are
 * canvas-space. The corner angle is taken from the unpadded bbox corner,
 * which is a fraction of a degree off the padded handle overlay.js draws;
 * snapping absorbs it.
 */
export function computeRotate(startRect, centre, corner, px, py, snapDeg = ROTATE_SNAP_DEG) {
  const { x, y, width, height } = startRect;
  const { cx, cy } = centre;
  const corners = [
    { x: x,         y: y },          // NW
    { x: x + width, y: y },          // NE
    { x: x + width, y: y + height }, // SE
    { x: x,         y: y + height }, // SW
  ];
  const grab = corners[corner] ?? corners[2];
  const grabAngle = Math.atan2(grab.y - cy, grab.x - cx);
  const nowAngle  = Math.atan2(py - cy, px - cx);
  return snapAngle((nowAngle - grabAngle) * 180 / Math.PI, snapDeg);
}

/**
 * Commit a rotation to the Yjs doc in a single transaction — the rotate
 * counterpart of applyResize. Shapes whose schema has no `rotate` key
 * (circles, where it would be invisible anyway) are a no-op.
 */
export function applyRotate(ydoc, yEl, deg) {
  if (!yEl) return;
  if (!SHAPE_TYPES[yEl.nodeName]?.schema.types.rotate) return;
  ydoc.transact(() => {
    yEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(deg)));
  });
}

// ── Transform reconciliation (import) ────────────────────────────────────────
// A shape's rotation lives in the document as a degree count and the SVG
// transform is derived from it. An export carries both, so a file that comes
// back from another editor can disagree with itself: the transform is what
// that editor actually did, the degrees are what we last thought. Dropping
// the transform (which is what the document does with its OWN derived copy)
// would throw their edit away, so it has to be proved ours before it goes.

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
 * with. Returns what the document should hold: { rotate, x, y, transform }.
 * `transform` is null when the shape's own degrees fully describe it, and
 * the original matrix when they can't.
 *
 * Three outcomes:
 *   - the transform is the one we would have derived: ours, dropped.
 *   - it is a pure rotation about some other point, or with a move on top:
 *     both are recovered. The angle becomes the shape's own, and whatever
 *     translation is left over is folded into x/y, where this app keeps
 *     position anyway. Lossless.
 *   - it scales, skews or flips: not expressible as degrees, so the file's
 *     transform is kept verbatim and the stale rotation is dropped. The
 *     shape renders exactly as authored and simply isn't ours to turn (see
 *     selectModes, which stops offering rotate mode for it).
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
 * Commit a pivot placement. The compensating x/y ride in the SAME
 * transaction as the pivot itself: they are one user action, and a peer that
 * saw only half of it would watch the shape jump and come back.
 */
export function applyPivot(ydoc, yEl, fx, fy, x, y) {
  if (!yEl) return;
  if (!SHAPE_TYPES[yEl.nodeName]?.schema.types['pivot-x']) return;
  ydoc.transact(() => {
    yEl.setAttribute(PIVOT_X_ATTR, String(clamp01(fx)));
    yEl.setAttribute(PIVOT_Y_ATTR, String(clamp01(fy)));
    yEl.setAttribute('x', String(Math.round(x)));
    yEl.setAttribute('y', String(Math.round(y)));
  });
}

/** DOM-only pivot preview for a ghost clone — the rotate/resize counterpart. */
export function previewPivot(ghostEl, fx, fy) {
  if (!ghostEl?.setAttribute) return;
  ghostEl.setAttribute(PIVOT_X_ATTR, String(clamp01(fx)));
  ghostEl.setAttribute(PIVOT_Y_ATTR, String(clamp01(fy)));
  syncRotation(ghostEl);
}

/**
 * Settle a freshly imported shape's rotation against the transform it arrived
 * with, writing back whatever the document should actually hold. Called by
 * storage.js for every drawing element on import.
 *
 * A shape with no `rotate` of ours is left completely alone: its transform is
 * the author's, and syncRotation already declines to manage it.
 */
export function reconcileImportedTransform(yEl) {
  if (yEl?.getAttribute?.(ROTATE_ATTR) == null) return;
  const def = SHAPE_TYPES[yEl.nodeName];
  if (!def) return;

  const attrs = {};
  for (const k of Object.keys(def.schema.types)) {
    attrs[k] = yEl.getAttribute((def.attrMap ?? {})[k] ?? k);
  }
  const geom = def.getBBox(attrs);
  if (!Number.isFinite(geom?.width)) return;

  // A transform present but unreadable is foreign by definition — we cannot
  // have written it — so it stays exactly as the file spelled it, and our now
  // meaningless degrees go instead. Distinguished from "no transform at all",
  // which parseTransformList also reports as null.
  const raw    = yEl.getAttribute('transform');
  const matrix = parseTransformList(raw);
  if (raw != null && !matrix) {
    yEl.removeAttribute(ROTATE_ATTR);
    return;
  }

  const out = reconcileTransform(geom, getRotationFromAttr(yEl), matrix);

  if (out.rotate == null) yEl.removeAttribute(ROTATE_ATTR);
  else                    yEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(out.rotate)));
  if (out.transform)      yEl.setAttribute('transform', formatMatrix(out.transform));
  else if (yEl.getAttribute('transform') != null) yEl.removeAttribute('transform');
  yEl.setAttribute('x', String(Math.round(out.x)));
  yEl.setAttribute('y', String(Math.round(out.y)));
}

/** Degrees off a Yjs element's own attribute (getRotation wants a DOM node). */
function getRotationFromAttr(yEl) {
  return parseFloat(yEl.getAttribute(ROTATE_ATTR)) || 0;
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
 * circles each add their one resize-family mode after it.
 *
 * Rects rotate as 'sel-rotate-pivot' — the variant whose pivot the user can
 * place. 'sel-rotate' is the fixed-pivot variant, which toys will use. A
 * shape carrying a transform of someone else's is not offered either: see
 * hasForeignTransform.
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

/**
 * Commit a move to the Yjs doc in a single transaction.
 * Called once on pointerup.
 * All shape-type branching lives here; callers are type-agnostic.
 *
 * ydoc — Y.Doc
 * yEl  — Y.XmlElement (no-op if null/missing)
 * x, y — new anchor position in canvas-space (integers expected)
 */
export function applyMoveCommit(ydoc, yEl, x, y) {
  if (!yEl) return;
  const tag = yEl.nodeName;
  ydoc.transact(() => {
    if (tag === 'rect') {
      yEl.setAttribute('x', String(x));
      yEl.setAttribute('y', String(y));
    } else if (tag === 'circle') {
      yEl.setAttribute('cx', String(x));
      yEl.setAttribute('cy', String(y));
    }
  });
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

/**
 * Pure geometry for a rect's corner-drag resize: given the rect at drag
 * start and the corner being dragged (0=NW/1=NE/2=SE/3=SW), compute the
 * new bbox for pointer (px, py), keeping the opposite corner fixed.
 */
function computeResizeCornerRect(startRect, corner, px, py) {
  const { x, y, width, height } = startRect;
  const left = x, top = y, right = x + width, bottom = y + height;

  switch (corner) {
    case 0: { // NW
      const newLeft = Math.min(px, right - MIN_RECT_RESIZE_SIZE);
      const newTop  = Math.min(py, bottom - MIN_RECT_RESIZE_SIZE);
      return { x: newLeft, y: newTop, width: right - newLeft, height: bottom - newTop };
    }
    case 1: { // NE
      const newTop = Math.min(py, bottom - MIN_RECT_RESIZE_SIZE);
      return { x: left, y: newTop, width: Math.max(px - left, MIN_RECT_RESIZE_SIZE), height: bottom - newTop };
    }
    case 3: { // SW
      const newLeft = Math.min(px, right - MIN_RECT_RESIZE_SIZE);
      return { x: newLeft, y: top, width: right - newLeft, height: Math.max(py - top, MIN_RECT_RESIZE_SIZE) };
    }
    case 2: // SE
    default: {
      return { x: left, y: top, width: Math.max(px - left, MIN_RECT_RESIZE_SIZE), height: Math.max(py - top, MIN_RECT_RESIZE_SIZE) };
    }
  }
}

// Which resize math a live drag/commit needs, by mode
export function computeResize(mode, startRect, corner, px, py) {
  return mode === 'sel-resize-r'
    ? computeResizeRadiusRect(startRect, px, py)
    : computeResizeCornerRect(startRect, corner, px, py);
}

/**
 * Commit a resize to the Yjs doc in a single transaction. rect and circle —
 * mirrors applyMoveCommit's shape (type-branching lives here, callers are
 * type-agnostic). x, y, width, height are the new bbox in canvas-space
 * (for circle, computeResizeRadiusRect's centre-preserving bbox).
 */
export function applyResize(ydoc, yEl, x, y, width, height) {
  if (!yEl) return;
  const tag = yEl.nodeName;
  ydoc.transact(() => {
    if (tag === 'rect') {
      yEl.setAttribute('x',      String(Math.round(x)));
      yEl.setAttribute('y',      String(Math.round(y)));
      yEl.setAttribute('width',  String(Math.round(width)));
      yEl.setAttribute('height', String(Math.round(height)));
    } else if (tag === 'circle') {
      const r = width / 2;
      yEl.setAttribute('cx', String(Math.round(x + r)));
      yEl.setAttribute('cy', String(Math.round(y + r)));
      yEl.setAttribute('r',  String(Math.round(r)));
    }
  });
}

/**
 * Apply a move to a live DOM element only — no Yjs write.
 * Used for direct DOM manipulation outside the drag-ghost path (e.g. snap-back
 * on cancel when not using <use>-based ghosts). Type-branching lives here.
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
 * Iterate all XmlElement children in z-order (bottom to top).
 * Returns an array of rendered SVG elements, each stamped with
 * data-id + data-module.
 */
export function listDrawings(yDrawing, opts = {}) {
  const results = [];
  for (let node = yDrawing.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    results.push(_toSVGEl(node, opts));
  }
  return results;
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
export function drawingsData(yDrawing) {
  return listDrawings(yDrawing).map(shapeData);
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
 * Snapshot the full serialisable state of a drawing Y.XmlElement.
 * Reads all schema keys from Yjs attributes (mapping SVG attr names to schema keys).
 */
export function getTtState(yEl) {
  if (!yEl) return null;
  const type = yEl.nodeName;
  const def  = SHAPE_TYPES[type];
  if (!def) return null;
  const attrs     = yEl.getAttributes();
  const reverseMap = Object.fromEntries(Object.entries(def.attrMap ?? {}).map(([k, v]) => [v, k]));
  const state = { type };
  for (const k of Object.keys(def.schema.types)) {
    const svgAttr = (def.attrMap ?? {})[k] ?? k;
    if (attrs[svgAttr] != null) state[k] = attrs[svgAttr];
    else if (attrs[k]   != null) state[k] = attrs[k];
  }
  return state;
}

/**
 * Write a ttState snapshot back into the Yjs drawing fragment.
 * Creates the element if it doesn't exist; updates it if it does.
 */
export function applyTtState(ydoc, yDrawing, state) {
  if (!state?.id || !state?.type) return;
  const existing = findDrawing(yDrawing, state.id);
  if (existing) {
    ydoc.transact(() => {
      for (const [k, v] of Object.entries(state)) {
        if (k === 'id' || k === 'type') continue;
        existing.setAttribute(k, String(v));
      }
    });
  } else {
    addDrawing(ydoc, yDrawing, state);
  }
}

/**
 * Apply an editData object to a drawing Yjs element.
 * Only keys present in editData are written; unknown keys are ignored.
 * Called by App.commitEdit
 */
export function edit(ydoc, yEl, editData) {
  if (!yEl) return;
  ydoc.transact(() => {
    for (const [k, v] of Object.entries(editData)) {
      yEl.setAttribute(k, String(v));
    }
  });
}

/**
 * Apply a live resize to a detached ghost clone — DOM only, no Yjs write.
 * Mirrors boun_pos.js's previewResize so overlay.js can hand any layer's
 * ghost the same (x, y, width, height) without knowing how each shape
 * stores its geometry. (x, y, width, height) is the bbox form
 * computeResize returns; for a circle that's the centre-preserving bbox.
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
 * Apply a live rotation to a detached ghost clone — DOM only, no Yjs write.
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

/**
 * Render the drawing layer: clear layerEl, then mirror every drawing element
 * as a live SVG node with the layer's interaction cursor applied.
 */
export function render(yDrawing, layerEl) {
  layerEl.innerHTML = '';
  listDrawings(yDrawing).forEach(svgEl => {
    svgEl.style.cursor = 'pointer';
    layerEl.appendChild(svgEl);
  });
}

/**
 * makeLayerAPI — returns the canonical LayerAPI for the drawing layer,
 * closing over (ydoc, yDrawing) so app.js can dispatch by layer type
 * without re-passing the fragment on every call.
 */
export function makeLayerAPI(ydoc, yDrawing) {
  return {
    find:            (id)            => findDrawing(yDrawing, id),
    delete:          (id)            => deleteDrawing(ydoc, yDrawing, id),
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
    applyMoveCommit: (yEl, x, y)     => applyMoveCommit(ydoc, yEl, x, y),
    applyResize:     (yEl, x, y, w, h) => applyResize(ydoc, yEl, x, y, w, h),
    applyRotate:     (yEl, deg)      => applyRotate(ydoc, yEl, deg),
    applyPivot:      (yEl, fx, fy, x, y) => applyPivot(ydoc, yEl, fx, fy, x, y),
    applyTtState:    (state)         => applyTtState(ydoc, yDrawing, state),
    edit:            (yEl, editData) => edit(ydoc, yEl, editData),
    previewEdit,
    listData:        ()              => drawingsData(yDrawing),
    render:          (layerEl)       => render(yDrawing, layerEl),
  };
}
