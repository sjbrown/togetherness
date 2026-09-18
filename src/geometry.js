/**
 * geometry.js — shape-agnostic pure geometry: rotation-angle arithmetic and
 * corner-drag resize math. No DOM, no Yjs, no notion of a shape type or a
 * toy — every function here takes plain numbers/rects and returns plain
 * numbers/rects, which is what lets drawing.js, toys.js, and boun_pos.js
 * share one implementation instead of three copies of the same switch
 * statement.
 */

/** Degrees in [0, 360). */
export function normalizeAngle(deg) {
  const d = Number(deg) || 0;
  return ((d % 360) + 360) % 360;
}

// Historical default (drawing.js's own rect snap grain), kept so a caller
// that omits snapDeg sees no change. Every real caller (app.js, each
// layer's own rotate gesture) passes its own value explicitly; this default
// is only ever exercised by a test calling these functions directly.
const DEFAULT_SNAP_DEG = 15;

/**
 * Snap deg to the nearest multiple of snapDeg. A snapDeg of 0 (or less)
 * means free rotation — the angle passes through unsnapped.
 */
export function snapAngle(deg, snapDeg = DEFAULT_SNAP_DEG) {
  const step = Number(snapDeg);
  if (!(step > 0)) return normalizeAngle(deg);
  return normalizeAngle(Math.round(Number(deg) / step) * step);
}

/**
 * Pure geometry for a corner-drag rotation: the angle from centre out to
 * the pointer, less the angle out to the corner that was grabbed, so that
 * corner stays under the pointer. The result is absolute, not a delta —
 * the rotation a shape had when the drag began is already implied by
 * where the grabbed corner started. Snapped to snapDeg.
 *
 * centre is the canvas-space {cx, cy} to turn about, captured at drag
 * start rather than re-derived here, so this stays pure and a pivot
 * anywhere other than the middle needs no change. corner is
 * 0=NW/1=NE/2=SE/3=SW into startRect; px/py are canvas-space.
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

// ── Corner-drag resize ──────────────────────────────────────────────────────

/**
 * Pure geometry for a corner-drag resize: given a rect at drag start and
 * the corner being dragged (0=NW/1=NE/2=SE/3=SW), compute the new
 * { x, y, width, height } for the current pointer position (px, py),
 * keeping the corner OPPOSITE the dragged one fixed in place. width/height
 * are clamped to minSize so the dragged corner can never cross the fixed
 * one — the fixed corner itself never moves. minSize is a required
 * argument rather than a default: each layer (rect, toy, boun_pos) picks
 * its own floor, and none of them is the geometrically "right" one.
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
