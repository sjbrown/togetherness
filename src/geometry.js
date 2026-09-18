/**
 * geometry.js — shape-agnostic pure geometry: rotation-angle arithmetic and
 * corner-drag resize math. No DOM, no Yjs, no shape-type or toy awareness.
 * corner, where a function takes one, is always 0=NW/1=NE/2=SE/3=SW.
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
