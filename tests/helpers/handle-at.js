/**
 * tests/helpers/handle-at.js
 *
 * jsdom has no hit-testing (no elementFromPoint), but canvas.js dispatches
 * a press by the [data-handle] element under the pointer. handleAt() stands
 * in for the browser here: which handle, if any, a press at canvas-space
 * (x, y) would land on, given what overlay.js has drawn into
 * #selection_local. Painted rects and circles count; glyphs and fill="none"
 * shapes don't, and the last one in document order is on top.
 *
 * Returns { handle, corner } — data-handle, and data-corner as canvas.js's
 * cornerOf() reads it (0-3 for NW, NE, SE, SW; 'r'; or undefined) — or
 * null. e2e (tests/e2e/handles.spec.js) checks the real hit areas.
 */

import './svg-ctm-polyfill.js'

const CORNERS = ['nw', 'ne', 'se', 'sw']

function contains(shape, x, y) {
  const n = (k) => Number(shape.getAttribute(k))
  if (shape.localName === 'rect') return x >= n('x') && x <= n('x') + n('width') && y >= n('y') && y <= n('y') + n('height')
  if (shape.localName === 'circle') return Math.hypot(x - n('cx'), y - n('cy')) <= n('r')
  return false
}

export function handleAt(svgEl, x, y) {
  const layer = svgEl.querySelector('#selection_local')
  const lm = layer.getScreenCTM()
  const screen = { x: lm.a * x + lm.c * y + lm.e, y: lm.b * x + lm.d * y + lm.f }
  const shapes = [...layer.querySelectorAll('rect, circle')].filter((s) =>
    s.closest('[data-handle]') &&
    s.getAttribute('fill') !== 'none' &&
    !s.classList.contains('pivotGlyph') && !s.classList.contains('rotateGlyph'))
  for (const shape of shapes.reverse()) {
    const m = shape.getScreenCTM().inverse()
    const lx = m.a * screen.x + m.c * screen.y + m.e
    const ly = m.b * screen.x + m.d * screen.y + m.f
    if (!contains(shape, lx, ly)) continue
    const el = shape.closest('[data-handle]')
    const c = el.dataset.corner
    return { handle: el.dataset.handle, corner: c === 'r' ? 'r' : (c ? CORNERS.indexOf(c) : undefined) }
  }
  return null
}

// The corner of a [data-handle=`handle`] element a press at (x, y) lands on,
// or null when it lands on anything else.
export function cornerAt(svgEl, handle, x, y) {
  const h = handleAt(svgEl, x, y)
  return h?.handle === handle ? h.corner : null
}
