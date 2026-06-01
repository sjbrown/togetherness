// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getToysLayer, svgTextToYXml, addToy, deleteToy, listToys, findToy, toyGeometry, TOY_TYPES,
  hslToRgb, colorMatrixValues,
} from '../../src/app/toys.js'

// ── Fixtures & helpers ──────────────────────────────────────────────────────

const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink"
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
     width="80" height="100" id="token_solidcolor" inkscape:version="0.92">
  <defs>
    <filter id="app-filter-colorize"><feColorMatrix id="recolorize-filter-matrix" type="matrix" values="1 0 0 0 0"/></filter>
    <linearGradient id="grad"><stop offset="0"/></linearGradient>
  </defs>
  <sodipodi:namedview id="namedview1" inkscape:zoom="4"/>
  <script type="text/javascript"><![CDATA[ var token_solidcolor = { menu: {} } ]]></script>
  <g id="layer1" filter="url(#app-filter-colorize)" inkscape:label="strip-me" class="colorable">
    <circle id="token_front" r="34" cx="40" cy="45" style="fill:url(#grad);filter:url(#app-filter-colorize)"/>
    <text id="label"><tspan id="ts">5</tspan></text>
    <use id="ref" xlink:href="#token_front"/>
  </g>
</svg>`

// First descendant (or self) whose nodeName matches.
function find(yEl, nodeName) {
  if (yEl.nodeName === nodeName) return yEl
  for (const c of yEl.toArray()) {
    if (c instanceof Y.XmlElement) {
      const hit = find(c, nodeName)
      if (hit) return hit
    }
  }
  return null
}

// svgTextToYXml returns { ySvg, colorMatrices }; reading ySvg throws until integrated.
// Integrate into a throwaway doc, then return the readable root.
function importRoot(svgText, prefix) {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('test')
  const { ySvg } = svgTextToYXml(svgText, prefix)
  ydoc.transact(() => frag.insert(0, [ySvg]))
  return frag.toArray()[0]
}

function sync(a, b) {
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
}

// addToy fetches the toy file; stub it to return our fixture.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

// ─────────────────────────────────────────────────────────────────────────────
// svgTextToYXml — the SVG importer (the real new machinery)
// ─────────────────────────────────────────────────────────────────────────────

describe('svgTextToYXml', () => {
  test('namespaces the root id', () => {
    expect(importRoot(TOY_SVG, 'P__').getAttribute('id')).toBe('P__token_solidcolor')
  })

  test('namespaces descendant ids', () => {
    expect(find(importRoot(TOY_SVG, 'P__'), 'circle').getAttribute('id')).toBe('P__token_front')
  })

  test('rewrites url(#id) references in attributes', () => {
    const g = find(importRoot(TOY_SVG, 'P__'), 'g')
    expect(g.getAttribute('filter')).toBe('url(#P__app-filter-colorize)')
  })

  test('rewrites url(#id) references inside style', () => {
    const style = find(importRoot(TOY_SVG, 'P__'), 'circle').getAttribute('style')
    expect(style).toContain('url(#P__grad)')
    expect(style).toContain('url(#P__app-filter-colorize)')
  })

  test('rewrites xlink:href fragment references', () => {
    expect(find(importRoot(TOY_SVG, 'P__'), 'use').getAttribute('xlink:href')).toBe('#P__token_front')
  })

  test('drops <script> elements', () => {
    expect(find(importRoot(TOY_SVG, 'P__'), 'script')).toBeNull()
  })

  test('drops foreign-namespace elements (sodipodi/inkscape)', () => {
    expect(find(importRoot(TOY_SVG, 'P__'), 'namedview')).toBeNull()
  })

  test('drops foreign-namespace attributes', () => {
    const root = importRoot(TOY_SVG, 'P__')
    expect(root.getAttribute('inkscape:version')).toBeUndefined()
    expect(find(root, 'g').getAttribute('inkscape:label')).toBeUndefined()
  })

  test('preserves element text content', () => {
    const tspan = find(importRoot(TOY_SVG, 'P__'), 'tspan')
    expect(tspan.toArray()[0].toString()).toBe('5')
  })

  test('synthesizes a viewBox from width/height when absent', () => {
    expect(importRoot(TOY_SVG, 'P__').getAttribute('viewBox')).toBe('0 0 80 100')
  })

  test('preserves an existing viewBox', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" width="100" height="100" id="m"><circle/></svg>`
    expect(importRoot(svg, 'P__').getAttribute('viewBox')).toBe('0 0 26 26')
  })

  test('two instances with different prefixes do not collide', () => {
    const a = importRoot(TOY_SVG, 'A__')
    const b = importRoot(TOY_SVG, 'B__')
    expect(find(a, 'circle').getAttribute('id')).toBe('A__token_front')
    expect(find(b, 'circle').getAttribute('id')).toBe('B__token_front')
    expect(find(a, 'g').getAttribute('filter')).toBe('url(#A__app-filter-colorize)')
    expect(find(b, 'g').getAttribute('filter')).toBe('url(#B__app-filter-colorize)')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getToysLayer
// ─────────────────────────────────────────────────────────────────────────────

describe('getToysLayer', () => {
  test('returns the toys fragment and meta map for the doc', () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    expect(yToys).toBe(ydoc.getXmlFragment('toys'))
    expect(yToyMeta).toBe(ydoc.getMap('toyMeta'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// addToy / deleteToy / listToys
// ─────────────────────────────────────────────────────────────────────────────

describe('addToy', () => {
  test('places a <g> wrapper carrying placement + app metadata', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 100, y: 200, color: '#abc', author: 'alice' })

    expect(yToys.length).toBe(1)
    const g = yToys.toArray()[0]
    expect(g.nodeName).toBe('g')
    expect(g.getAttribute('class')).toBe('toy')
    expect(g.getAttribute('data-toy-id')).toBe('t1')
    expect(g.getAttribute('data-toy-type')).toBe('player_marker')
  })

  test('embeds an <svg> sub-document sized and centered on (x, y)', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 100, y: 200, color: '#abc', author: 'alice' })

    const svg = find(yToys.toArray()[0], 'svg')
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('width')).toBe('64')
    expect(svg.getAttribute('height')).toBe('64')
    expect(svg.getAttribute('x')).toBe('68')   // 100 - 64/2
    expect(svg.getAttribute('y')).toBe('168')  // 200 - 64/2
  })

  test('records author/type/color/created on the sidecar', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#abc', author: 'alice' })

    const meta = yToyMeta.get('t1')
    expect(meta.author).toBe('alice')
    expect(meta.toyType).toBe('player_marker')
    expect(meta.color).toBe('#abc')
    expect(meta.created).toBeTypeOf('number')
  })

  test('ids inside the embedded toy are namespaced by instance id', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#abc', author: 'alice' })
    expect(find(yToys.toArray()[0], 'circle').getAttribute('id')).toBe('t1__token_front')
  })

  test('throws on unknown toy type and writes nothing', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await expect(
      addToy(ydoc, yToys, yToyMeta, { id: 'x', toyType: 'nope', x: 0, y: 0, author: 'a' })
    ).rejects.toThrow(/unknown toy type/)
    expect(yToys.length).toBe(0)
  })

  test('throws when the toy file cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await expect(
      addToy(ydoc, yToys, yToyMeta, { id: 'x', toyType: 'player_marker', x: 0, y: 0, author: 'a' })
    ).rejects.toThrow(/failed to load/)
    expect(yToys.length).toBe(0)
  })
})

describe('deleteToy', () => {
  test('removes the toy and its sidecar meta', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, author: 'a' })
    await addToy(ydoc, yToys, yToyMeta, { id: 't2', toyType: 'player_marker', x: 0, y: 0, author: 'a' })

    expect(deleteToy(ydoc, yToys, yToyMeta, 't1')).toBe(true)
    expect(yToys.length).toBe(1)
    expect(yToyMeta.get('t1')).toBeUndefined()
    expect(yToys.toArray()[0].getAttribute('data-toy-id')).toBe('t2')
  })

  test('returns false for an unknown id', () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    expect(deleteToy(ydoc, yToys, yToyMeta, 'nope')).toBe(false)
  })
})

describe('listToys', () => {
  test('returns placed toys in z-order with element, type, and meta', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#111', author: 'alice' })
    await addToy(ydoc, yToys, yToyMeta, { id: 't2', toyType: 'player_marker', x: 0, y: 0, color: '#222', author: 'bob' })

    const toys = listToys(yToys, yToyMeta)
    expect(toys.map(t => t.svgEl.getAttribute('data-yid'))).toEqual(['t1', 't2'])
    expect(toys[0].svgEl.getAttribute('data-toy-type')).toBe('player_marker')
    expect(toys[0].svgEl.tagName).toBe('g')
    expect(toys[0].meta.author).toBe('alice')
    expect(toys[1].meta.color).toBe('#222')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRDT convergence — the property that justifies XmlFragment over Y.Map
// ─────────────────────────────────────────────────────────────────────────────

describe('convergence', () => {
  test('concurrent placements on two peers both survive after sync', async () => {
    const p1 = new Y.Doc(); const t1 = getToysLayer(p1)
    const p2 = new Y.Doc(); const t2 = getToysLayer(p2)

    await addToy(p1, t1.yToys, t1.yToyMeta, { id: 'a', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })
    await addToy(p2, t2.yToys, t2.yToyMeta, { id: 'b', toyType: 'player_marker', x: 0, y: 0, author: 'p2' })

    sync(p1, p2)

    expect(t1.yToys.length).toBe(2)
    expect(t2.yToys.length).toBe(2)
    const ids1 = t1.yToys.toArray().map(g => g.getAttribute('data-toy-id')).sort()
    const ids2 = t2.yToys.toArray().map(g => g.getAttribute('data-toy-id')).sort()
    expect(ids1).toEqual(['a', 'b'])
    expect(ids2).toEqual(['a', 'b'])
  })

  test('concurrent edits to different parts of one toy merge (not last-write-wins)', async () => {
    const p1 = new Y.Doc(); const t1 = getToysLayer(p1)
    await addToy(p1, t1.yToys, t1.yToyMeta, { id: 'shared', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })

    const p2 = new Y.Doc(); const t2 = getToysLayer(p2)
    sync(p1, p2)

    // partition: p1 recolors the inner circle; p2 moves the embedded svg
    p1.transact(() => find(t1.yToys.toArray()[0], 'circle').setAttribute('fill', '#f00'))
    p2.transact(() => find(t2.yToys.toArray()[0], 'svg').setAttribute('x', '99'))

    sync(p1, p2)

    for (const t of [t1, t2]) {
      expect(find(t.yToys.toArray()[0], 'circle').getAttribute('fill')).toBe('#f00')
      expect(find(t.yToys.toArray()[0], 'svg').getAttribute('x')).toBe('99')
    }
  })

  test('both peers converge to byte-identical state', async () => {
    const p1 = new Y.Doc(); const t1 = getToysLayer(p1)
    const p2 = new Y.Doc(); const t2 = getToysLayer(p2)
    await addToy(p1, t1.yToys, t1.yToyMeta, { id: 'a', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })
    await addToy(p2, t2.yToys, t2.yToyMeta, { id: 'b', toyType: 'player_marker', x: 0, y: 0, author: 'p2' })
    sync(p1, p2)
    const s1 = Buffer.from(Y.encodeStateAsUpdate(p1)).toString('hex')
    const s2 = Buffer.from(Y.encodeStateAsUpdate(p2)).toString('hex')
    expect(s1).toBe(s2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// findToy
// ─────────────────────────────────────────────────────────────────────────────

describe('findToy', () => {
  test('returns the <g> wrapper for a known id', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, author: 'a' })
    const g = findToy(yToys, 't1')
    expect(g).not.toBeNull()
    expect(g.nodeName).toBe('g')
    expect(g.getAttribute('data-toy-id')).toBe('t1')
  })

  test('returns null for an unknown id', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    expect(findToy(yToys, 'nope')).toBeNull()
  })

  test('returns null on an empty fragment', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    expect(findToy(yToys, 't1')).toBeNull()
  })

  test('finds the correct toy among several', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 'a', toyType: 'player_marker', x: 0, y: 0, author: 'x' })
    await addToy(ydoc, yToys, yToyMeta, { id: 'b', toyType: 'player_marker', x: 0, y: 0, author: 'x' })
    await addToy(ydoc, yToys, yToyMeta, { id: 'c', toyType: 'player_marker', x: 0, y: 0, author: 'x' })
    expect(findToy(yToys, 'b').getAttribute('data-toy-id')).toBe('b')
    expect(findToy(yToys, 'c').getAttribute('data-toy-id')).toBe('c')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// toyGeometry
// ─────────────────────────────────────────────────────────────────────────────

describe('toyGeometry', () => {
  // addToy places the embedded <svg> at x = cx - DISPLAY/2, y = cy - DISPLAY/2
  // with width = height = DISPLAY (64). toyGeometry reads those attrs and pads.
  const DISPLAY = 64

  test('returns numeric bbox centered on placement point with PAD applied', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 100, y: 200, author: 'a' })
    const geo = toyGeometry(yToys, 't1', 4)
    const svgX = 100 - DISPLAY / 2   // 68
    const svgY = 200 - DISPLAY / 2   // 168
    expect(geo).toEqual({ x: svgX - 4, y: svgY - 4, width: DISPLAY + 8, height: DISPLAY + 8 })
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('PAD=0 returns the exact embedded svg bounds', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 50, y: 80, author: 'a' })
    const geo = toyGeometry(yToys, 't1', 0)
    expect(geo.x).toBe(50 - DISPLAY / 2)
    expect(geo.y).toBe(80 - DISPLAY / 2)
    expect(geo.width).toBe(DISPLAY)
    expect(geo.height).toBe(DISPLAY)
  })

  test('returns null for an unknown toy id', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    expect(toyGeometry(yToys, 'nope')).toBeNull()
  })

  test('returns correct geometry after the embedded svg is repositioned', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 100, y: 100, author: 'a' })

    // simulate a drag: mutate the embedded svg's x and y directly in the CRDT
    const g   = findToy(yToys, 't1')
    const svg = g.toArray().find(e => e instanceof Y.XmlElement && e.nodeName === 'svg')
    ydoc.transact(() => {
      svg.setAttribute('x', '200')
      svg.setAttribute('y', '300')
    })

    const geo = toyGeometry(yToys, 't1', 0)
    expect(geo.x).toBe(200)
    expect(geo.y).toBe(300)
  })

  test('geometry from two instances does not bleed between them', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 'a', toyType: 'player_marker', x: 100, y: 100, author: 'x' })
    await addToy(ydoc, yToys, yToyMeta, { id: 'b', toyType: 'player_marker', x: 400, y: 400, author: 'x' })

    const geoA = toyGeometry(yToys, 'a', 0)
    const geoB = toyGeometry(yToys, 'b', 0)
    expect(geoA.x).toBe(100 - DISPLAY / 2)
    expect(geoB.x).toBe(400 - DISPLAY / 2)
    expect(geoA.x).not.toBe(geoB.x)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Movement — dragging commits the final position to the embedded <svg>'s x/y.
// These exercise the CRDT contract the drag handler relies on (the handler
// itself lives in index.html; here we assert the data-level behaviour).
// ─────────────────────────────────────────────────────────────────────────────

// Mirror of index.html's drag-commit: set the embedded svg x/y in one transact.
function commitMove(ydoc, yToys, id, x, y) {
  const svg = embeddedSvg(yToys, id)
  if (!svg) return false
  ydoc.transact(() => { svg.setAttribute('x', String(x)); svg.setAttribute('y', String(y)) })
  return true
}
function embeddedSvg(yToys, id) {
  const g = findToy(yToys, id)
  return g?.toArray().find(e => e instanceof Y.XmlElement && e.nodeName === 'svg') ?? null
}

describe('movement', () => {
  const DISPLAY = 64

  test('committing a move updates the embedded svg position', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't', toyType: 'player_marker', x: 100, y: 100, author: 'a' })
    expect(embeddedSvg(yToys, 't').getAttribute('x')).toBe(String(100 - DISPLAY / 2))

    commitMove(ydoc, yToys, 't', 200, 250)
    const svg = embeddedSvg(yToys, 't')
    expect(svg.getAttribute('x')).toBe('200')
    expect(svg.getAttribute('y')).toBe('250')
  })

  test('toyGeometry reflects the moved position', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't', toyType: 'player_marker', x: 100, y: 100, author: 'a' })
    commitMove(ydoc, yToys, 't', 300, 0)
    const geo = toyGeometry(yToys, 't', 0)
    expect(geo).toEqual({ x: 300, y: 0, width: DISPLAY, height: DISPLAY })
  })

  test('a move syncs to a peer', async () => {
    const p1 = new Y.Doc(); const a = getToysLayer(p1)
    await addToy(p1, a.yToys, a.yToyMeta, { id: 't', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })
    const p2 = new Y.Doc(); const b = getToysLayer(p2)
    sync(p1, p2)

    commitMove(p1, a.yToys, 't', 500, 600)
    sync(p1, p2)

    const svg = embeddedSvg(b.yToys, 't')
    expect(svg.getAttribute('x')).toBe('500')
    expect(svg.getAttribute('y')).toBe('600')
  })

  test('concurrent move and recolor on the same toy both survive', async () => {
    const p1 = new Y.Doc(); const a = getToysLayer(p1)
    await addToy(p1, a.yToys, a.yToyMeta, { id: 't', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })
    const p2 = new Y.Doc(); const b = getToysLayer(p2)
    sync(p1, p2)

    // p1 moves the toy; p2 recolors its inner circle — different sub-nodes
    commitMove(p1, a.yToys, 't', 123, 456)
    p2.transact(() => find(b.yToys.toArray()[0], 'circle').setAttribute('fill', '#0f0'))

    sync(p1, p2)

    for (const layer of [a.yToys, b.yToys]) {
      expect(embeddedSvg(layer, 't').getAttribute('x')).toBe('123')
      expect(find(layer.toArray()[0], 'circle').getAttribute('fill')).toBe('#0f0')
    }
  })

  test('concurrent moves converge identically on both peers', async () => {
    const p1 = new Y.Doc(); const a = getToysLayer(p1)
    await addToy(p1, a.yToys, a.yToyMeta, { id: 't', toyType: 'player_marker', x: 0, y: 0, author: 'p1' })
    const p2 = new Y.Doc(); const b = getToysLayer(p2)
    sync(p1, p2)

    commitMove(p1, a.yToys, 't', 10, 10)
    commitMove(p2, b.yToys, 't', 90, 90)
    sync(p1, p2)

    const svgA = embeddedSvg(a.yToys, 't')
    const svgB = embeddedSvg(b.yToys, 't')
    expect(svgA.getAttribute('x')).toBe(svgB.getAttribute('x'))
    expect(svgA.getAttribute('y')).toBe(svgB.getAttribute('y'))
    expect(Buffer.from(Y.encodeStateAsUpdate(p1)).toString('hex'))
      .toBe(Buffer.from(Y.encodeStateAsUpdate(p2)).toString('hex'))
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hslToRgb
// ─────────────────────────────────────────────────────────────────────────────

describe('hslToRgb', () => {
  test('pure red hsl(0, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(0, 100, 50)
    expect(r).toBeCloseTo(1, 2); expect(g).toBeCloseTo(0, 2); expect(b).toBeCloseTo(0, 2)
  })
  test('pure green hsl(120, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(120, 100, 50)
    expect(r).toBeCloseTo(0, 2); expect(g).toBeCloseTo(1, 2); expect(b).toBeCloseTo(0, 2)
  })
  test('pure blue hsl(240, 100%, 50%)', () => {
    const [r, g, b] = hslToRgb(240, 100, 50)
    expect(r).toBeCloseTo(0, 2); expect(g).toBeCloseTo(0, 2); expect(b).toBeCloseTo(1, 2)
  })
  test('white hsl(0, 0%, 100%)', () => {
    const [r, g, b] = hslToRgb(0, 0, 100)
    expect(r).toBeCloseTo(1, 2); expect(g).toBeCloseTo(1, 2); expect(b).toBeCloseTo(1, 2)
  })
  test('black hsl(0, 0%, 0%)', () => {
    const [r, g, b] = hslToRgb(0, 0, 0)
    expect(r).toBeCloseTo(0, 2); expect(g).toBeCloseTo(0, 2); expect(b).toBeCloseTo(0, 2)
  })
  test('output values are in [0, 1]', () => {
    for (const [h, s, l] of [[30,80,40],[200,60,70],[300,100,20]]) {
      const [r, g, b] = hslToRgb(h, s, l)
      for (const v of [r, g, b]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// colorMatrixValues
// ─────────────────────────────────────────────────────────────────────────────

describe('colorMatrixValues', () => {
  function parseMatrix(str) { return str.trim().split(/\s+/).map(Number) }

  test('produces a 20-value string', () => {
    expect(parseMatrix(colorMatrixValues('hsl(0, 100%, 50%)')).length).toBe(20)
  })
  test('red hsl(0,100%,50%) → R≈1, G≈0, B≈0', () => {
    const m = parseMatrix(colorMatrixValues('hsl(0, 100%, 50%)'))
    expect(m[0]).toBeCloseTo(1, 2); expect(m[5]).toBeCloseTo(0, 2); expect(m[10]).toBeCloseTo(0, 2)
  })
  test('blue hsl(240,100%,50%) → R≈0, B≈1', () => {
    const m = parseMatrix(colorMatrixValues('hsl(240, 100%, 50%)'))
    expect(m[0]).toBeCloseTo(0, 2); expect(m[10]).toBeCloseTo(1, 2)
  })
  test('alpha row is always 0 0 0 1 0', () => {
    const m = parseMatrix(colorMatrixValues('hsl(120, 80%, 40%)'))
    expect(m[15]).toBe(0); expect(m[16]).toBe(0); expect(m[17]).toBe(0)
    expect(m[18]).toBe(1); expect(m[19]).toBe(0)
  })
  test('all non-diagonal values in RGB rows are 0', () => {
    const m = parseMatrix(colorMatrixValues('hsl(200, 60%, 55%)'))
    for (const i of [1,2,3,4,6,7,8,9,11,12,13,14]) expect(m[i]).toBe(0)
  })
  test('very dark color is boosted (sum of RGB ≥ 0.9)', () => {
    const m = parseMatrix(colorMatrixValues('hsl(0, 0%, 5%)'))
    expect(m[0] + m[5] + m[10]).toBeGreaterThanOrEqual(0.9)
  })
  test('hex #ff0000 → pure red', () => {
    const m = parseMatrix(colorMatrixValues('#ff0000'))
    expect(m[0]).toBeCloseTo(1, 2); expect(m[5]).toBeCloseTo(0, 2); expect(m[10]).toBeCloseTo(0, 2)
  })
  test('hex #0000ff → pure blue', () => {
    const m = parseMatrix(colorMatrixValues('#0000ff'))
    expect(m[0]).toBeCloseTo(0, 2); expect(m[10]).toBeCloseTo(1, 2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// applyColor (via addToy)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyColor (via addToy)', () => {
  function getMatrixEl(yToys) {
    function find(el, name) {
      if (!(el instanceof Y.XmlElement)) return null
      if (el.nodeName === name) return el
      for (const c of el.toArray()) { const h = find(c, name); if (h) return h }
      return null
    }
    return find(yToys.toArray()[0], 'feColorMatrix')
  }

  test('feColorMatrix values are set after placement (red)', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, {
      id: 't1', toyType: 'player_marker', x: 100, y: 100,
      color: 'hsl(0, 100%, 50%)', author: 'alice',
    })
    const m = getMatrixEl(yToys).getAttribute('values').trim().split(/\s+/).map(Number)
    expect(m[0]).toBeCloseTo(1, 2)
    expect(m[5]).toBeCloseTo(0, 2)
    expect(m[10]).toBeCloseTo(0, 2)
  })

  test('two players get different feColorMatrix values', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 'p1', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(0, 100%, 50%)', author: 'alice' })
    await addToy(ydoc, yToys, yToyMeta, { id: 'p2', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(240, 100%, 50%)', author: 'bob' })

    function getMatrix(g) {
      function find(el, name) {
        if (!(el instanceof Y.XmlElement)) return null
        if (el.nodeName === name) return el
        for (const c of el.toArray()) { const h = find(c, name); if (h) return h }
        return null
      }
      return find(g, 'feColorMatrix')
    }
    const [g1, g2] = yToys.toArray()
    const m1 = getMatrix(g1).getAttribute('values').trim().split(/\s+/).map(Number)
    const m2 = getMatrix(g2).getAttribute('values').trim().split(/\s+/).map(Number)
    expect(m1[0]).toBeGreaterThan(m1[10])   // red: R > B
    expect(m2[10]).toBeGreaterThan(m2[0])   // blue: B > R
  })

  test('color matrix syncs to a peer unchanged', async () => {
    const p1 = new Y.Doc(); const a = getToysLayer(p1)
    await addToy(p1, a.yToys, a.yToyMeta, { id: 't', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(120, 80%, 40%)', author: 'alice' })
    const p2 = new Y.Doc(); const b = getToysLayer(p2)
    Y.applyUpdate(p2, Y.encodeStateAsUpdate(p1))
    function getMatrix(yToys) {
      function find(el, name) {
        if (!(el instanceof Y.XmlElement)) return null
        if (el.nodeName === name) return el
        for (const c of el.toArray()) { const h = find(c, name); if (h) return h }
        return null
      }
      return find(yToys.toArray()[0], 'feColorMatrix')
    }
    expect(getMatrix(a.yToys).getAttribute('values')).toBe(getMatrix(b.yToys).getAttribute('values'))
  })

  test('placement without a color leaves default matrix values', async () => {
    const ydoc = new Y.Doc()
    const { yToys, yToyMeta } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, yToyMeta, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: undefined, author: 'alice' })
    // default from the TOY_SVG fixture: '1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0'
    expect(getMatrixEl(yToys).getAttribute('values')).toContain('1 0 0 0 0')
  })
})
