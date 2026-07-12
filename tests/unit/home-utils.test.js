// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { mirrorYNode, buildThumbSVG, THUMB_W, THUMB_H } from '../../src/home-utils.js'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal toy <g> element in the SVG namespace, matching isToyG(). */
function makeToyGEl({ x = 10, y = 20, w = 64, h = 80, withTransform = false } = {}) {
  const SVG_NS = 'http://www.w3.org/2000/svg'
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('class',           'toy')
  g.setAttribute('data-toy-id',     'test-toy')
  g.setAttribute('data-toy-type',   'dice_d6')
  g.setAttribute('data-id',        'test-toy')
  g.setAttribute('data-module', 'toys')
  if (withTransform) g.setAttribute('transform', 'rotate(-8,105,100)')
  const inner = document.createElementNS(SVG_NS, 'svg')
  inner.setAttribute('x',      x)
  inner.setAttribute('y',      y)
  inner.setAttribute('width',  w)
  inner.setAttribute('height', h)
  inner.setAttribute('viewBox', `0 0 80 100`)
  g.appendChild(inner)
  return g
}

/**
 * All Y.XmlElement/XmlText nodes must be attached to a Y.Doc before their
 * data can be read (getAttributes, toArray, toString all return empty/throw
 * on detached nodes). This helper builds a minimal toy <g> tree inside a
 * throwaway Y.Doc's XmlFragment and returns the attached root element.
 */
function makeToyYXml() {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('toys')

  const g = new Y.XmlElement('g')
  g.setAttribute('class',         'toy')
  g.setAttribute('data-toy-id',   'ytoy')
  g.setAttribute('data-toy-type', 'dice_d6')
  g.setAttribute('transform',     'rotate(-8,105,100)')

  const svg = new Y.XmlElement('svg')
  svg.setAttribute('x',      '73')
  svg.setAttribute('y',      '60')
  svg.setAttribute('width',  '64')
  svg.setAttribute('height', '80')

  const defs   = new Y.XmlElement('defs')
  const filter = new Y.XmlElement('filter')
  filter.setAttribute('id', 'col')
  const fe = new Y.XmlElement('feColorMatrix')
  fe.setAttribute('type',   'matrix')
  fe.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0')

  // Build bottom-up then attach top-down into the doc
  filter.insert(0, [fe])
  defs.insert(0, [filter])
  svg.insert(0, [defs])
  g.insert(0, [svg])
  frag.insert(0, [g])  // attach to doc — makes all descendants readable

  return g
}

/**
 * Build an attached Y.XmlElement of the given nodeName with optional attrs
 * and children, inside a throwaway Y.Doc.
 */
function makeYEl(nodeName, attrs = {}, children = []) {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('test')
  const el   = new Y.XmlElement(nodeName)
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
  if (children.length) el.insert(0, children)
  frag.insert(0, [el])
  return el
}

/**
 * Build an attached Y.XmlText inside a throwaway Y.Doc.
 */
function makeYText(str) {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('test')
  const yt   = new Y.XmlText(str)
  frag.insert(0, [yt])
  return yt
}

// ── mirrorYNode ───────────────────────────────────────────────────────────────

describe('mirrorYNode', () => {
  test('returns null for non-XmlElement, non-XmlText input', () => {
    expect(mirrorYNode(Y, null)).toBeNull()
    expect(mirrorYNode(Y, undefined)).toBeNull()
    expect(mirrorYNode(Y, 42)).toBeNull()
    expect(mirrorYNode(Y, {})).toBeNull()
  })

  test('returns a text node for Y.XmlText', () => {
    const yt  = makeYText('hello world')
    const dom = mirrorYNode(Y, yt)
    expect(dom.nodeType).toBe(Node.TEXT_NODE)
    expect(dom.textContent).toBe('hello world')
  })

  test('returns null for script elements', () => {
    const script = makeYEl('script', { src: 'evil.js' })
    expect(mirrorYNode(Y, script)).toBeNull()
  })

  test('preserves element nodeName exactly — no lowercasing', () => {
    const fe  = makeYEl('feColorMatrix', { type: 'matrix' })
    const dom = mirrorYNode(Y, fe)
    // The critical assertion: feColorMatrix must not become fecolormatrix
    expect(dom.nodeName).toBe('feColorMatrix')
  })

  test('copies attributes onto the DOM element', () => {
    const rect = makeYEl('rect', { x: '10', y: '20', width: '100', fill: '#ff0000' })
    const dom  = mirrorYNode(Y, rect)
    expect(dom.getAttribute('x')).toBe('10')
    expect(dom.getAttribute('y')).toBe('20')
    expect(dom.getAttribute('width')).toBe('100')
    expect(dom.getAttribute('fill')).toBe('#ff0000')
  })

  test('recursively mirrors children', () => {
    // Build the tree attached to a doc
    const ydoc  = new Y.Doc()
    const frag  = ydoc.getXmlFragment('test')

    const title = new Y.XmlElement('title')
    title.insert(0, [new Y.XmlText('my circle')])
    const child = new Y.XmlElement('circle')
    child.setAttribute('r', '5')
    child.insert(0, [title])
    const g = new Y.XmlElement('g')
    g.insert(0, [child])
    frag.insert(0, [g])

    const dom = mirrorYNode(Y, g)
    expect(dom.nodeName).toBe('g')
    expect(dom.children.length).toBe(1)
    expect(dom.children[0].nodeName).toBe('circle')
    expect(dom.children[0].getAttribute('r')).toBe('5')
    expect(dom.children[0].children[0].nodeName).toBe('title')
    expect(dom.children[0].children[0].textContent).toBe('my circle')
  })

  test('mirrors a full toy tree with feColorMatrix preserving case', () => {
    const yG  = makeToyYXml()
    const dom = mirrorYNode(Y, yG)

    expect(dom.nodeName).toBe('g')
    expect(dom.getAttribute('class')).toBe('toy')

    const innerSvg = dom.querySelector('svg')
    expect(innerSvg).not.toBeNull()

    // feColorMatrix must survive mirroring with correct case
    const fe = dom.querySelector('feColorMatrix')
    expect(fe).not.toBeNull()
    expect(fe.nodeName).toBe('feColorMatrix')
    expect(fe.getAttribute('type')).toBe('matrix')
  })

  test('skips script children during recursion', () => {
    const ydoc  = new Y.Doc()
    const frag  = ydoc.getXmlFragment('test')
    const g      = new Y.XmlElement('g')
    const script = new Y.XmlElement('script')
    const circle = new Y.XmlElement('circle')
    g.insert(0, [script, circle])
    frag.insert(0, [g])

    const dom = mirrorYNode(Y, g)
    // script is skipped; only circle survives
    expect(dom.children.length).toBe(1)
    expect(dom.children[0].nodeName).toBe('circle')
  })
})

// ── buildThumbSVG ─────────────────────────────────────────────────────────────

describe('buildThumbSVG', () => {
  test('returns an SVG element with correct dimensions', () => {
    const svg = buildThumbSVG('room-abc', 'img/bg_slatehex.png', 1384, 998, null)
    expect(svg.nodeName).toBe('svg')
    expect(svg.getAttribute('width')).toBe(String(THUMB_W))
    expect(svg.getAttribute('height')).toBe(String(THUMB_H))
    expect(svg.getAttribute('viewBox')).toBe(`0 0 ${THUMB_W} ${THUMB_H}`)
  })

  test('has class table-thumb', () => {
    const svg = buildThumbSVG('room-abc', 'img/bg.png', 800, 600, null)
    expect(svg.getAttribute('class')).toBe('table-thumb')
  })

  test('pattern id is unique per roomId', () => {
    const svg1 = buildThumbSVG('room-aaa', 'img/bg.png', 800, 600, null)
    const svg2 = buildThumbSVG('room-bbb', 'img/bg.png', 800, 600, null)
    const pat1 = svg1.querySelector('pattern').getAttribute('id')
    const pat2 = svg2.querySelector('pattern').getAttribute('id')
    expect(pat1).not.toBe(pat2)
    // Each bg rect references its own pattern
    expect(svg1.querySelector('rect').getAttribute('fill')).toBe(`url(#${pat1})`)
    expect(svg2.querySelector('rect').getAttribute('fill')).toBe(`url(#${pat2})`)
  })

  test('pattern id is derived from roomId with non-alphanumerics stripped', () => {
    const svg = buildThumbSVG('cool-table-01abc', 'img/bg.png', 800, 600, null)
    const patId = svg.querySelector('pattern').getAttribute('id')
    expect(patId).toBe('tp-cooltable01abc')
  })

  test('background image href and scaled dimensions are set on the <image>', () => {
    const bgUrl = 'img/bg_greenfelt.png'
    const svg   = buildThumbSVG('r1', bgUrl, 800, 600, null)
    const img   = svg.querySelector('image')
    expect(img.getAttribute('href')).toBe(bgUrl)
    // scale = max(150/800, 100/600) = max(0.1875, 0.1667) = 0.1875
    // pw = round(800 * 0.1875) = 150, ph = round(600 * 0.1875) = 113
    expect(Number(img.getAttribute('width'))).toBe(150)
    expect(Number(img.getAttribute('height'))).toBe(113)
  })

  test('background covers the full thumbnail (wider bg)', () => {
    // Wide bg: scale driven by height
    const svg = buildThumbSVG('r2', 'img/bg.png', 1384, 998, null)
    const img = svg.querySelector('image')
    // scale = max(150/1384, 100/998) ≈ max(0.1084, 0.1002) = 0.1084
    const scale = Math.max(THUMB_W / 1384, THUMB_H / 998)
    expect(Number(img.getAttribute('width'))).toBe(Math.round(1384 * scale))
    expect(Number(img.getAttribute('height'))).toBe(Math.round(998 * scale))
  })

  test('works without a toy (toyGEl = null) — no crash, no toy in output', () => {
    const svg = buildThumbSVG('r3', 'img/bg.png', 800, 600, null)
    expect(svg.querySelector('g.toy')).toBeNull()
    // Still has bg rect
    expect(svg.querySelector('rect')).not.toBeNull()
  })

  test('toy is appended and transform is stripped', () => {
    const toyEl = makeToyGEl({ withTransform: true })
    expect(toyEl.getAttribute('transform')).toBeTruthy()

    const svg = buildThumbSVG('r4', 'img/bg.png', 800, 600, toyEl)
    const g   = svg.querySelector('g.toy')
    expect(g).not.toBeNull()
    expect(g.getAttribute('transform')).toBeNull()
  })

  test('inner svg x/y are centred in the thumbnail', () => {
    const toyEl = makeToyGEl({ x: 999, y: 999, w: 64, h: 80 })
    buildThumbSVG('r5', 'img/bg.png', 800, 600, toyEl)
    const inner = toyEl.querySelector('svg')
    expect(Number(inner.getAttribute('x'))).toBe(Math.round((THUMB_W - 64) / 2))
    expect(Number(inner.getAttribute('y'))).toBe(Math.round((THUMB_H - 80) / 2))
  })

  test('inner svg x/y use fallback dimensions when width/height missing', () => {
    const SVG_NS = 'http://www.w3.org/2000/svg'
    const g = document.createElementNS(SVG_NS, 'g')
    g.setAttribute('class', 'toy')
    const inner = document.createElementNS(SVG_NS, 'svg')
    // No width/height attributes — fallback to 64×80
    g.appendChild(inner)
    buildThumbSVG('r6', 'img/bg.png', 800, 600, g)
    expect(Number(inner.getAttribute('x'))).toBe(Math.round((THUMB_W - 64) / 2))
    expect(Number(inner.getAttribute('y'))).toBe(Math.round((THUMB_H - 80) / 2))
  })

  test('toy with non-standard size is centred correctly', () => {
    const toyEl = makeToyGEl({ w: 100, h: 100 })
    buildThumbSVG('r7', 'img/bg.png', 800, 600, toyEl)
    const inner = toyEl.querySelector('svg')
    expect(Number(inner.getAttribute('x'))).toBe(Math.round((THUMB_W - 100) / 2))
    expect(Number(inner.getAttribute('y'))).toBe(Math.round((THUMB_H - 100) / 2))
  })
})
