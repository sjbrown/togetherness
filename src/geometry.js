/**
 * geometry.js — shape-agnostic geometry: rotation-angle arithmetic, the
 * rotation model toys and drawing shapes share, and corner-drag resize math.
 * No Yjs, no shape-type or toy awareness. The rotation model reads and
 * writes attributes on an element it is given; nothing here creates or
 * queries DOM. corner, where a function takes one, is always
 * 0=NW/1=NE/2=SE/3=SW.
 */

/** Degrees in [0, 360). */
export function normalizeAngle(deg) {
  const d = Number(deg) || 0;
  return ((d % 360) + 360) % 360;
}

// Only exercised when a caller omits snapDeg; every production caller
// passes its own value explicitly.
const DEFAULT_SNAP_DEG = 15;

/** Nearest multiple of snapDeg. snapDeg <= 0 means free, unsnapped rotation. */
export function snapAngle(deg, snapDeg = DEFAULT_SNAP_DEG) {
  const step = Number(snapDeg);
  if (!(step > 0)) return normalizeAngle(deg);
  return normalizeAngle(Math.round(Number(deg) / step) * step);
}

/**
 * Corner-drag rotation: angle from centre to the pointer, less the angle
 * to the grabbed corner, so that corner stays under the pointer -- an
 * absolute angle, not a delta. centre is captured at drag start so a pivot
 * off-middle needs no special case.
 */
export function computeRotate(startRect, centre, corner, px, py, snapDeg = DEFAULT_SNAP_DEG) {
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
 * Rotate pt by deg (SVG's clockwise-in-screen-space sense) about (cx, cy) --
 * cx/cy default to 0 so the same call rotates a bare vector. A no-op
 * (returns pt) when rot is null/undefined, so a caller with an unresolved
 * rotation needs no guard of its own.
 */
export function rotatePoint(pt, rot) {
  if (!rot) return pt;
  const { deg, cx = 0, cy = 0 } = rot;
  const rad = deg * Math.PI / 180;
  const dx = pt.x - cx, dy = pt.y - cy;
  return {
    x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  };
}

// ── Corner-drag resize ──────────────────────────────────────────────────────

/**
 * Corner-drag resize: the corner OPPOSITE the dragged one stays fixed;
 * width/height clamp to minSize so the drag can never cross it. minSize
 * has no default -- each layer (rect, toy, boun_pos) picks its own floor.
 */
export function computeResizeCornerRect(startRect, corner, px, py, minSize) {
  const { x, y, width, height } = startRect;
  const left = x, top = y, right = x + width, bottom = y + height;

  switch (corner) {
    case 0: { // NW
      const newLeft = Math.min(px, right - minSize);
      const newTop  = Math.min(py, bottom - minSize);
      return { x: newLeft, y: newTop, width: right - newLeft, height: bottom - newTop };
    }
    case 1: { // NE
      const newTop = Math.min(py, bottom - minSize);
      return { x: left, y: newTop, width: Math.max(px - left, minSize), height: bottom - newTop };
    }
    case 3: { // SW
      const newLeft = Math.min(px, right - minSize);
      return { x: newLeft, y: top, width: right - newLeft, height: Math.max(py - top, minSize) };
    }
    case 2: // SE
    default: {
      return { x: left, y: top, width: Math.max(px - left, minSize), height: Math.max(py - top, minSize) };
    }
  }
}

// ── Rotation model ──────────────────────────────────────────────────────────
// Rotation is a plain degree count on data-rotate, never a baked transform:
// the transform is derived as `rotate(deg cx cy)` about a pivot, so a move or
// resize re-pivots for free by calling syncRotation afterwards. Geometry
// (getGeom) always stays in the element's own UNROTATED space; a caller
// needing canvas-space geometry rotates the point itself.
//
// A pivot is fractions of the element's own bbox ({fx:0.5,fy:0.5} = centre),
// not canvas coordinates, so it survives a move or resize. Drawing shapes
// store a placeable one on data-pivot-x/y; toys always turn about their
// centre and pass CENTER_PIVOT. Snap steps, and whether an element may
// rotate at all, belong to each layer.

export const ROTATE_ATTR  = 'data-rotate';
export const PIVOT_X_ATTR = 'data-pivot-x';
export const PIVOT_Y_ATTR = 'data-pivot-y';

export const CENTER_PIVOT = Object.freeze({ fx: 0.5, fy: 0.5 });

const clamp01 = n => Math.min(1, Math.max(0, n));

/** An element's rotation in degrees (0 when it has none). */
export function getRotation(el) {
  return parseFloat(el?.getAttribute?.(ROTATE_ATTR)) || 0;
}

/** An element's stored pivot, defaulting to its centre. Clamped, to defend against hand-edited values out of range. */
export function getPivot(el) {
  const fx = parseFloat(el?.getAttribute?.(PIVOT_X_ATTR));
  const fy = parseFloat(el?.getAttribute?.(PIVOT_Y_ATTR));
  if (!Number.isFinite(fx) && !Number.isFinite(fy)) return CENTER_PIVOT;
  return {
    fx: Number.isFinite(fx) ? clamp01(fx) : 0.5,
    fy: Number.isFinite(fy) ? clamp01(fy) : 0.5,
  };
}

/** The canvas-space point an element rotates about, for a given pivot. */
export function rotationCenter(geom, pivot = CENTER_PIVOT) {
  return geom
    ? { cx: geom.x + pivot.fx * geom.width, cy: geom.y + pivot.fy * geom.height }
    : { cx: 0, cy: 0 };
}

/** An element's rotation resolved against geometry: { deg, cx, cy }, or null when unrotated. */
export function resolveRotation(el, geom, pivot = getPivot(el)) {
  const deg = getRotation(el);
  if (!deg) return null;
  return { deg, ...rotationCenter(geom, pivot) };
}

/** Format a resolved rotation as an SVG transform, or null for none. */
export function rotationTransform(rot) {
  return rot ? `rotate(${rot.deg} ${rot.cx} ${rot.cy})` : null;
}

/**
 * Project an element's stored rotation onto it as a transform. Called after
 * every geometry write so the pivot tracks the element rather than the
 * position it had when the rotation was set. No data-rotate means the
 * transform isn't ours — a hand-authored or imported SVG can carry its own,
 * and rewriting it would throw the author's geometry away.
 */
export function syncRotation(el, geom, pivot = getPivot(el)) {
  if (!el?.hasAttribute?.(ROTATE_ATTR)) return;
  const transform = rotationTransform(resolveRotation(el, geom, pivot));
  if (transform) el.setAttribute('transform', transform);
  else           el.removeAttribute('transform');
}
