/**
 * rotation.js — the rotation model toys and drawing shapes share.
 *
 * Rotation is a plain degree count on data-rotate, never a baked transform:
 * the transform is derived as `rotate(deg cx cy)` about a pivot, so a move or
 * resize re-pivots for free by calling syncRotation afterwards. Geometry
 * (getGeom) always stays in the element's own UNROTATED space; a caller
 * needing canvas-space geometry rotates the point itself.
 *
 * A pivot is fractions of the element's own bbox ({fx:0.5,fy:0.5} = centre),
 * not canvas coordinates, so it survives a move or resize. Drawing shapes
 * store a placeable one on data-pivot-x/y; toys always turn about their
 * centre and pass CENTER_PIVOT. Snap steps, and whether an element may
 * rotate at all, belong to each layer.
 */

export const ROTATE_ATTR  = 'data-rotate'
export const PIVOT_X_ATTR = 'data-pivot-x'
export const PIVOT_Y_ATTR = 'data-pivot-y'

export const CENTER_PIVOT = Object.freeze({ fx: 0.5, fy: 0.5 })

const clamp01 = n => Math.min(1, Math.max(0, n))

/** An element's rotation in degrees (0 when it has none). */
export function getRotation(el) {
  return parseFloat(el?.getAttribute?.(ROTATE_ATTR)) || 0
}

/** An element's stored pivot, defaulting to its centre. Clamped, to defend against hand-edited values out of range. */
export function getPivot(el) {
  const fx = parseFloat(el?.getAttribute?.(PIVOT_X_ATTR))
  const fy = parseFloat(el?.getAttribute?.(PIVOT_Y_ATTR))
  if (!Number.isFinite(fx) && !Number.isFinite(fy)) return CENTER_PIVOT
  return {
    fx: Number.isFinite(fx) ? clamp01(fx) : 0.5,
    fy: Number.isFinite(fy) ? clamp01(fy) : 0.5,
  }
}

/** The canvas-space point an element rotates about, for a given pivot. */
export function rotationCenter(geom, pivot = CENTER_PIVOT) {
  return geom
    ? { cx: geom.x + pivot.fx * geom.width, cy: geom.y + pivot.fy * geom.height }
    : { cx: 0, cy: 0 }
}

/** An element's rotation resolved against geometry: { deg, cx, cy }, or null when unrotated. */
export function resolveRotation(el, geom, pivot = getPivot(el)) {
  const deg = getRotation(el)
  if (!deg) return null
  return { deg, ...rotationCenter(geom, pivot) }
}

/** Format a resolved rotation as an SVG transform, or null for none. */
export function rotationTransform(rot) {
  return rot ? `rotate(${rot.deg} ${rot.cx} ${rot.cy})` : null
}

/**
 * Project an element's stored rotation onto it as a transform. Called after
 * every geometry write so the pivot tracks the element rather than the
 * position it had when the rotation was set. No data-rotate means the
 * transform isn't ours — a hand-authored or imported SVG can carry its own,
 * and rewriting it would throw the author's geometry away.
 */
export function syncRotation(el, geom, pivot = getPivot(el)) {
  if (!el?.hasAttribute?.(ROTATE_ATTR)) return
  const transform = rotationTransform(resolveRotation(el, geom, pivot))
  if (transform) el.setAttribute('transform', transform)
  else           el.removeAttribute('transform')
}
