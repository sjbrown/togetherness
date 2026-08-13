/**
 * tests/helpers/svg-ctm-polyfill.js
 *
 * jsdom has no layout engine, so it doesn't implement
 * SVGGraphicsElement.getScreenCTM()/getCTM() at all (calling either throws
 * "Not implemented"). Production code (src/toys.js: getPositionsMeta,
 * getSnapPoints, ownersAtPoint, directOccupantIds) calls getScreenCTM() to
 * convert a toy's local tt_positions coordinates into toys-layer space,
 * correctly handling toys whose SVG viewBox differs from their
 * width/height.
 *
 * A pure identity-matrix stub isn't good enough here: toys are placed with
 * a real x/y offset on their own <svg> (see getGeom), and existing tests
 * assert on canvas-space snap points that include that offset. So this
 * polyfill actually walks the element's ancestor chain and composes:
 *
 *   - each ancestor's `transform` attribute (translate/scale/matrix/rotate
 *     — the forms this codebase uses)
 *   - each ancestor <svg>'s own x/y + viewBox-to-width/height scaling
 *     ('xMidYMid meet', the SVG default and the only mode this codebase
 *     uses — same math as getInnerAnchor in src/toys.js)
 *
 * This is real (if partial) CTM math, not a stand-in — it's exercised by
 * both the historical geom-offset cases (1:1 viewBox, e.g. chip.svg) and
 * the whole reason this landed: a toy's width/height changed independently
 * of its viewBox (e.g. an enlarged supply.svg).
 *
 * Two elements never sharing a common ancestor (e.g. a detached fragment
 * vs. one attached elsewhere) will each get a matrix relative to their own
 * tree's root — composing them via layerEl^-1 * localEl is only meaningful
 * when both live in the same tree, exactly as in a real browser.
 *
 * Imported for side effects only. Safe to import under vitest's default
 * 'node' environment too — everything is guarded behind `typeof
 * SVGElement !== 'undefined'`, so it's a no-op there.
 */

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

// result = m1 ∘ m2 (m2 applied to the point first, then m1) — matches
// DOMMatrix/SVGMatrix's `m1.multiply(m2)` convention.
function matMul(m1, m2) {
  return {
    a: m1.a * m2.a + m1.c * m2.b,
    b: m1.b * m2.a + m1.d * m2.b,
    c: m1.a * m2.c + m1.c * m2.d,
    d: m1.b * m2.c + m1.d * m2.d,
    e: m1.a * m2.e + m1.c * m2.f + m1.e,
    f: m1.b * m2.e + m1.d * m2.f + m1.f,
  }
}

function matInverse(m) {
  const det = m.a * m.d - m.b * m.c
  if (!det) return { ...IDENTITY }
  return {
    a: m.d / det, b: -m.b / det, c: -m.c / det, d: m.a / det,
    e: (m.c * m.f - m.d * m.e) / det, f: (m.b * m.e - m.a * m.f) / det,
  }
}

function withMethods(m) {
  return {
    ...m,
    inverse() { return withMethods(matInverse(m)) },
    multiply(other) { return withMethods(matMul(m, other ? { ...IDENTITY, ...other } : IDENTITY)) },
  }
}

function parseTransformAttr(str) {
  let m = { ...IDENTITY }
  if (!str) return m
  const re = /(\w+)\s*\(([^)]*)\)/g
  let match
  while ((match = re.exec(str))) {
    const fn = match[1]
    const args = match[2].trim().split(/[\s,]+/).filter(Boolean).map(Number)
    let mm = { ...IDENTITY }
    if (fn === 'translate') {
      mm = { a: 1, b: 0, c: 0, d: 1, e: args[0] || 0, f: args.length > 1 ? args[1] : 0 }
    } else if (fn === 'scale') {
      const sx = args[0] ?? 1
      const sy = args.length > 1 ? args[1] : sx
      mm = { a: sx, b: 0, c: 0, d: sy, e: 0, f: 0 }
    } else if (fn === 'matrix' && args.length === 6) {
      mm = { a: args[0], b: args[1], c: args[2], d: args[3], e: args[4], f: args[5] }
    } else if (fn === 'rotate') {
      const rad = (args[0] || 0) * Math.PI / 180
      const cos = Math.cos(rad), sin = Math.sin(rad)
      const rot = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 }
      if (args.length >= 3) {
        const [, cx, cy] = args
        mm = matMul(matMul({ a: 1, b: 0, c: 0, d: 1, e: cx, f: cy }, rot),
                     { a: 1, b: 0, c: 0, d: 1, e: -cx, f: -cy })
      } else {
        mm = rot
      }
    }
    m = matMul(m, mm)
  }
  return m
}

// Maps points expressed in svgNode's viewBox coordinate system into
// svgNode's own local box (the frame its `transform` attribute, if any,
// operates within) — 'xMidYMid meet' scaling, centred, matching
// getInnerAnchor's math in src/toys.js.
function viewBoxMatrix(svgNode) {
  const outX = parseFloat(svgNode.getAttribute('x')) || 0
  const outY = parseFloat(svgNode.getAttribute('y')) || 0
  const outW = parseFloat(svgNode.getAttribute('width')) || 0
  const outH = parseFloat(svgNode.getAttribute('height')) || 0
  const vbAttr = svgNode.getAttribute('viewBox')
  if (!vbAttr || !outW || !outH) return { ...IDENTITY, e: outX, f: outY }

  const [vbX, vbY, vbW, vbH] = vbAttr.trim().split(/[\s,]+/).map(Number)
  if (!vbW || !vbH) return { ...IDENTITY, e: outX, f: outY }

  const scale = Math.min(outW / vbW, outH / vbH)
  const offsetX = (outW - vbW * scale) / 2
  const offsetY = (outH - vbH * scale) / 2
  return {
    a: scale, b: 0, c: 0, d: scale,
    e: outX + offsetX - vbX * scale,
    f: outY + offsetY - vbY * scale,
  }
}

function computeCTM(el) {
  let m = { ...IDENTITY }
  let node = el
  while (node && node.nodeType === 1) {
    const t = node.getAttribute && node.getAttribute('transform')
    if (t) m = matMul(parseTransformAttr(t), m)
    if (node.tagName && node.tagName.toLowerCase() === 'svg') {
      m = matMul(viewBoxMatrix(node), m)
    }
    node = node.parentNode
  }
  return m
}

if (typeof SVGElement !== 'undefined') {
  if (!SVGElement.prototype.getScreenCTM) {
    SVGElement.prototype.getScreenCTM = function () { return withMethods(computeCTM(this)) }
  }
  if (!SVGElement.prototype.getCTM) {
    SVGElement.prototype.getCTM = function () { return withMethods(computeCTM(this)) }
  }
}
