// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  svgTextToYXml, addToy, deleteToy, listToys, findToy, TOY_TYPES, TOOLS,
  getGeom, _toSVGEl, getTtStateSchema, edit, reparentToy,
  hslToRgb, colorMatrixValues,
  _clearSvgTextCache, _resetToyScriptState,
  yNodeFor, clearYNodeMap,
  newToyId,
} from '../../src/toys.js'

const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Real assets — needed for the name/color tests below, which depend on
// tray_sum's actual .name_container/.tspan_name and .colorable structure
// (the generic TOY_SVG fixture above has neither).
const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS        = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG         = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS  = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

// Local accessor for the toys fragment + meta map. The production code creates
// these via makeDoc() in app.js; tests just need a thin equivalent.
const getToysLayer = (ydoc) => ({
  yToys: ydoc.getXmlFragment('toys'),
})

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
  <script type="text/javascript" src="js/dice_utils.js" data-namespace="dice" id="script_dice_utils"/>
  <script type="text/javascript" data-namespace="token_solidcolor" id="script_token_solidcolor"><![CDATA[ var token_solidcolor = { menu: {} } ]]></script>
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

// All descendants (or self) whose nodeName matches.
function findAll(yEl, nodeName, out = []) {
  if (yEl.nodeName === nodeName) out.push(yEl)
  for (const c of yEl.toArray()) {
    if (c instanceof Y.XmlElement) findAll(c, nodeName, out)
  }
  return out
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
  _clearSvgTextCache()
  clearYNodeMap()
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

// ── ID helpers ─────────────────────────────────────────────────────────────────

describe('newToyId', () => {
  test('id starts with tt-t-v1-', () => {
    expect(newToyId().slice(0, 8)).toBe('tt-t-v1-')
  })

  test('successive calls produce distinct ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newToyId()))
    expect(ids.size).toBe(50)
  })
})

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

  test('preserves <script> elements, their attrs, and CDATA text', () => {
    const scripts = findAll(importRoot(TOY_SVG, 'P__'), 'script')
    expect(scripts.length).toBe(2)

    const srcScript = scripts.find(s => s.getAttribute('src'))
    expect(srcScript.getAttribute('src')).toBe('js/dice_utils.js')
    expect(srcScript.getAttribute('data-namespace')).toBe('dice')

    const inlineScript = scripts.find(s => s.getAttribute('data-namespace') === 'token_solidcolor')
    expect(inlineScript.toArray()[0].toString()).toContain('token_solidcolor')
  })

  test('namespaces script ids like any other id', () => {
    const scripts = findAll(importRoot(TOY_SVG, 'P__'), 'script')
    expect(scripts.map(s => s.getAttribute('id'))).toEqual(
      expect.arrayContaining(['P__script_dice_utils', 'P__script_token_solidcolor'])
    )
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
// addToy / deleteToy / listToys
// ─────────────────────────────────────────────────────────────────────────────

describe('addToy', () => {
  test('places a <g> wrapper carrying placement + app metadata', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 100, y: 200, color: '#abc' })

    expect(yToys.length).toBe(1)
    const g = yToys.toArray()[0]
    expect(g.nodeName).toBe('g')
    expect(g.getAttribute('class')).toBe('toy')
    expect(g.getAttribute('data-toy-id')).toBe('t1')
    expect(g.getAttribute('data-toy-type')).toBe('player_marker')
    expect(g.getAttribute('data-color')).toBe('#abc')
  })

  test('embeds an <svg> sub-document sized and centered on (x, y), using the file\u2019s own native size (TOY_SVG is 80\u00d7100)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 100, y: 200, color: '#abc' })

    const svg = find(yToys.toArray()[0], 'svg')
    expect(svg).toBeTruthy()
    expect(svg.getAttribute('width')).toBe('80')
    expect(svg.getAttribute('height')).toBe('100')
    expect(svg.getAttribute('x')).toBe('60')   // 100 - 80/2
    expect(svg.getAttribute('y')).toBe('150')  // 200 - 100/2
  })

  test('records data-toy-type and data-color on the <g> wrapper', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(200, 80%, 50%)' })

    const g = yToys.toArray()[0]
    expect(g.getAttribute('data-toy-type')).toBe('player_marker')
    expect(g.getAttribute('data-color')).toBe('hsl(200, 80%, 50%)')
  })

  test('getTtState captures color from the <g> data-color attribute', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(200, 80%, 50%)' })
    const { getTtState } = await import('../../src/toys.js')
    const state = getTtState(yToys.toArray()[0])
    expect(state.color).toBe('hsl(200, 80%, 50%)')
  })

  test('ids inside the embedded toy are namespaced by instance id', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#abc' })
    expect(find(yToys.toArray()[0], 'circle').getAttribute('id')).toBe('t1__token_front')
  })

  test('throws on unknown toy type and writes nothing', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await expect(
      addToy(ydoc, yToys, { id: 'x', toyType: 'nope', x: 0, y: 0 })
    ).rejects.toThrow(/unknown toy type/)
    expect(yToys.length).toBe(0)
  })

  test('throws when the toy file cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await expect(
      addToy(ydoc, yToys, { id: 'x', toyType: 'player_marker', x: 0, y: 0 })
    ).rejects.toThrow(/failed to load/)
    expect(yToys.length).toBe(0)
  })
})

describe('deleteToy', () => {
  test('removes the toy <g> from the fragment', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(ydoc, yToys, { id: 't2', toyType: 'player_marker', x: 0, y: 0 })

    expect(deleteToy(ydoc, yToys, 't1')).toBe(true)
    expect(yToys.length).toBe(1)
    expect(yToys.toArray()[0].getAttribute('data-toy-id')).toBe('t2')
  })

  test('returns false for an unknown id', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    expect(deleteToy(ydoc, yToys, 'nope')).toBe(false)
  })
})

describe('listToys', () => {
  test('returns placed toys in z-order with element, type, and meta', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: '#111' })
    await addToy(ydoc, yToys, { id: 't2', toyType: 'player_marker', x: 0, y: 0, color: '#222' })

    const toys = listToys(yToys)
    expect(toys.map(svgEl => svgEl.getAttribute('data-id'))).toEqual(['t1', 't2'])
    expect(toys[0].getAttribute('data-toy-type')).toBe('player_marker')
    expect(toys[0].tagName).toBe('g')
    expect(toys[0].getAttribute('data-color')).toBe('#111')
    expect(toys[1].getAttribute('data-color')).toBe('#222')
  })

  test('rendered DOM never contains <script>, even though the Yjs tree does', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    // The Yjs tree carries the script...
    expect(findAll(findToy(yToys, 't1'), 'script').length).toBe(2)
    // ...but the mirrored DOM used for on-screen rendering never does.
    const [toyEl] = listToys(yToys)
    expect(toyEl.querySelector('script')).toBeNull()
  })

  test('{ includeScripts: true } mirrors scripts too — for export only', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const [toyEl] = listToys(yToys, { includeScripts: true })
    const scripts = toyEl.querySelectorAll('script')
    expect(scripts.length).toBe(2)
  })
})

describe('scoped lookup ($)', () => {
  test('rewrites a bare #id to the toy-instance-namespaced id and finds it', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const toyEl = _toSVGEl(findToy(yToys, 't1'))
    const found = toyEl.$('#token_front')
    expect(found).not.toBeNull()
    expect(found.getAttribute('id')).toBe('t1__token_front')
  })

  test('rewrites every #token in a compound selector, leaving classes alone', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const toyEl = _toSVGEl(findToy(yToys, 't1'))
    const found = toyEl.$('#label #ts')
    expect(found).not.toBeNull()
    expect(found.getAttribute('id')).toBe('t1__ts')
  })

  test('returns null when the rewritten id has no match, same as querySelector', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const toyEl = _toSVGEl(findToy(yToys, 't1'))
    expect(toyEl.$('#does_not_exist')).toBeNull()
  })

  test('two instances of the same type resolve to their own ids, not the other\u2019s', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'a', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(ydoc, yToys, { id: 'b', toyType: 'player_marker', x: 0, y: 0 })

    const elA = _toSVGEl(findToy(yToys, 'a'))
    const elB = _toSVGEl(findToy(yToys, 'b'))
    expect(elA.$('#token_front').getAttribute('id')).toBe('a__token_front')
    expect(elB.$('#token_front').getAttribute('id')).toBe('b__token_front')
  })

  test('.$() is only on the toy root; a nested element reaches it via closest()', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const toyEl = _toSVGEl(findToy(yToys, 't1'))
    const nested = toyEl.querySelector('#t1__ts')
    expect(nested.$).toBeUndefined()

    const root = nested.closest('[data-toy-id]')
    expect(root).toBe(toyEl)
    expect(root.$('#token_front').getAttribute('id')).toBe('t1__token_front')
  })
})

describe('yNodeFor / clearYNodeMap', () => {
  test('resolves a deep rendered DOM element back to its Y.XmlElement', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const [toyEl] = listToys(yToys)
    const tspanDom = toyEl.querySelector('tspan')
    expect(tspanDom).toBeTruthy()

    const yTspan = yNodeFor(tspanDom)
    expect(yTspan).toBeInstanceOf(Y.XmlElement)
    expect(yTspan.nodeName).toBe('tspan')
    // Same node found by walking the Yjs tree directly for the same id.
    expect(yTspan.getAttribute('id')).toBe('t1__ts')
    expect(yTspan).toBe(find(findToy(yToys, 't1'), 'tspan'))
  })

  test('resolves the mirrored text node inside a tspan back to its Y.XmlText', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const [toyEl] = listToys(yToys)
    const textDom = toyEl.querySelector('tspan').firstChild
    expect(textDom.nodeType).toBe(Node.TEXT_NODE)

    const yText = yNodeFor(textDom)
    expect(yText).toBeInstanceOf(Y.XmlText)
    expect(yText.toString()).toBe('5')
  })

  test('returns undefined for a DOM node that was never mirrored', () => {
    const orphan = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    expect(yNodeFor(orphan)).toBeUndefined()
  })

  test('clearYNodeMap() drops prior entries', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const [toyEl] = listToys(yToys)
    const tspanDom = toyEl.querySelector('tspan')
    expect(yNodeFor(tspanDom)).toBeTruthy()

    clearYNodeMap()
    expect(yNodeFor(tspanDom)).toBeUndefined()
  })

  test('re-rendering repopulates the map for the new DOM nodes', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const [firstRender] = listToys(yToys)
    const [secondRender] = listToys(yToys)
    const firstTspan  = firstRender.querySelector('tspan')
    const secondTspan = secondRender.querySelector('tspan')

    expect(firstTspan).not.toBe(secondTspan)
    expect(yNodeFor(firstTspan)).toBeTruthy()
    expect(yNodeFor(secondTspan)).toBeTruthy()
    expect(yNodeFor(firstTspan)).toBe(yNodeFor(secondTspan)) // same underlying Y.XmlElement
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// CRDT convergence — the property that justifies XmlFragment over Y.Map
// ─────────────────────────────────────────────────────────────────────────────

describe('convergence', () => {
  test('concurrent placements on two peers both survive after sync', async () => {
    const p1 = new Y.Doc(); const t1 = getToysLayer(p1)
    const p2 = new Y.Doc(); const t2 = getToysLayer(p2)

    await addToy(p1, t1.yToys, { id: 'a', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(p2, t2.yToys, { id: 'b', toyType: 'player_marker', x: 0, y: 0 })

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
    await addToy(p1, t1.yToys, { id: 'shared', toyType: 'player_marker', x: 0, y: 0 })

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
    await addToy(p1, t1.yToys, { id: 'a', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(p2, t2.yToys, { id: 'b', toyType: 'player_marker', x: 0, y: 0 })
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
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })
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
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'a', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(ydoc, yToys, { id: 'b', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(ydoc, yToys, { id: 'c', toyType: 'player_marker', x: 0, y: 0 })
    expect(findToy(yToys, 'b').getAttribute('data-toy-id')).toBe('b')
    expect(findToy(yToys, 'c').getAttribute('data-toy-id')).toBe('c')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getGeom — raw bbox from a rendered toy svgEl (PAD lives in the overlay)
// ─────────────────────────────────────────────────────────────────────────────

describe('getGeom (toys)', () => {
  // addToy places the embedded <svg> at x = cx - width/2, y = cy - height/2,
  // using the toy's own native size — TOY_SVG (see top of file) is 80x100,
  // not square, so width/height are tracked separately here on purpose.
  // getGeom reads those attrs off the rendered svgEl — no padding.
  const TOY_WIDTH  = 80
  const TOY_HEIGHT = 100
  const elFor = (yToys, id) => _toSVGEl(findToy(yToys, id))

  test('returns numeric bbox centered on the placement point', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 100, y: 200 })
    const geo = getGeom(elFor(yToys, 't1'))
    expect(geo).toEqual({ x: 100 - TOY_WIDTH / 2, y: 200 - TOY_HEIGHT / 2, width: TOY_WIDTH, height: TOY_HEIGHT })
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('returns the exact embedded svg bounds', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 50, y: 80 })
    const geo = getGeom(elFor(yToys, 't1'))
    expect(geo.x).toBe(50 - TOY_WIDTH / 2)
    expect(geo.y).toBe(80 - TOY_HEIGHT / 2)
    expect(geo.width).toBe(TOY_WIDTH)
    expect(geo.height).toBe(TOY_HEIGHT)
  })

  test('returns null for a missing toy / nullish input', () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    expect(getGeom(elFor(yToys, 'nope'))).toBeNull()
    expect(getGeom(null)).toBeNull()
  })

  test('returns correct geometry after the embedded svg is repositioned', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 100, y: 100 })

    // simulate a drag: mutate the embedded svg's x and y directly in the CRDT
    const g   = findToy(yToys, 't1')
    const svg = g.toArray().find(e => e instanceof Y.XmlElement && e.nodeName === 'svg')
    ydoc.transact(() => {
      svg.setAttribute('x', '200')
      svg.setAttribute('y', '300')
    })

    // re-render after the mutation
    const geo = getGeom(elFor(yToys, 't1'))
    expect(geo.x).toBe(200)
    expect(geo.y).toBe(300)
  })

  test('geometry from two instances does not bleed between them', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'a', toyType: 'player_marker', x: 100, y: 100 })
    await addToy(ydoc, yToys, { id: 'b', toyType: 'player_marker', x: 400, y: 400 })

    const geoA = getGeom(elFor(yToys, 'a'))
    const geoB = getGeom(elFor(yToys, 'b'))
    expect(geoA.x).toBe(100 - TOY_WIDTH / 2)
    expect(geoB.x).toBe(400 - TOY_WIDTH / 2)
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
  // TOY_SVG (top of file) is 80x100 — addToy places it at x = cx - 40, y = cy - 50.
  const TOY_WIDTH  = 80
  const TOY_HEIGHT = 100

  test('committing a move updates the embedded svg position', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't', toyType: 'player_marker', x: 100, y: 100 })
    expect(embeddedSvg(yToys, 't').getAttribute('x')).toBe(String(100 - TOY_WIDTH / 2))

    commitMove(ydoc, yToys, 't', 200, 250)
    const svg = embeddedSvg(yToys, 't')
    expect(svg.getAttribute('x')).toBe('200')
    expect(svg.getAttribute('y')).toBe('250')
  })

  test('getGeom reflects the moved position', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't', toyType: 'player_marker', x: 100, y: 100 })
    commitMove(ydoc, yToys, 't', 300, 0)
    const geo = getGeom(_toSVGEl(findToy(yToys, 't')))
    expect(geo).toEqual({ x: 300, y: 0, width: TOY_WIDTH, height: TOY_HEIGHT })
  })

  test('a move syncs to a peer', async () => {
    const p1 = new Y.Doc(); const a = getToysLayer(p1)
    await addToy(p1, a.yToys, { id: 't', toyType: 'player_marker', x: 0, y: 0 })
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
    await addToy(p1, a.yToys, { id: 't', toyType: 'player_marker', x: 0, y: 0 })
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
    await addToy(p1, a.yToys, { id: 't', toyType: 'player_marker', x: 0, y: 0 })
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
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, {
      id: 't1', toyType: 'player_marker', x: 100, y: 100,
      color: 'hsl(0, 100%, 50%)',
    })
    const m = getMatrixEl(yToys).getAttribute('values').trim().split(/\s+/).map(Number)
    expect(m[0]).toBeCloseTo(1, 2)
    expect(m[5]).toBeCloseTo(0, 2)
    expect(m[10]).toBeCloseTo(0, 2)
  })

  test('two players get different feColorMatrix values', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'p1', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(0, 100%, 50%)' })
    await addToy(ydoc, yToys, { id: 'p2', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(240, 100%, 50%)' })

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
    await addToy(p1, a.yToys, { id: 't', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(120, 80%, 40%)' })
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
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: undefined })
    // default from the TOY_SVG fixture: '1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0'
    expect(getMatrixEl(yToys).getAttribute('values')).toContain('1 0 0 0 0')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// tray_sum: color option + editable name — real tray_sum/dice_d6 assets
// ─────────────────────────────────────────────────────────────────────────────
//
// The generic TOY_SVG fixture above has a feColorMatrix but no
// .name_container/.tspan_name, so it can't exercise the name field — and
// since color eligibility is now data-driven (isColorable, keyed off actual
// feColorMatrix presence) rather than a toyType string check, these tests
// need the real assets to mean anything.
describe('tray_sum: color option + editable name (real assets)', () => {
  beforeEach(() => {
    _resetToyScriptState()
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
      if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
      if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
      if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  test('TOOLS.tray_sum now has a color-hsl option, same as marker/d6', () => {
    const trayTool   = TOOLS.find(t => t.toyType === 'tray_sum')
    const d6Tool      = TOOLS.find(t => t.toyType === 'dice_d6')
    const markerTool = TOOLS.find(t => t.toyType === 'player_marker')

    expect(trayTool.options.some(o => o.kind === 'color-hsl')).toBe(true)
    expect(d6Tool.options.some(o => o.kind === 'color-hsl')).toBe(true)
    expect(markerTool.options.some(o => o.kind === 'color-hsl')).toBe(true)
  })

  test('getTtStateSchema includes color for a placed tray_sum — data-driven on its own feColorMatrix, not its toyType', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#5e7ea8' })

    const traySchema = getTtStateSchema(_toSVGEl(findToy(yToys, 'tray1')))
    expect(traySchema.types).toHaveProperty('color', 'color-hsl')
    expect(traySchema.color).toBe('#5e7ea8')
  })

  test('getTtStateSchema includes an editable name for tray_sum (has a .tspan_name) but not for dice_d6 (no name)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, yToys, { id: 'die1',  toyType: 'dice_d6',  x: 0, y: 0, color: '#fff' })

    const traySchema = getTtStateSchema(_toSVGEl(findToy(yToys, 'tray1')))
    const dieSchema   = getTtStateSchema(_toSVGEl(findToy(yToys, 'die1')))

    expect(traySchema.types).toHaveProperty('name', { kind: 'string', show: ['edit'] })
    expect(traySchema.name).toBe('sum') // tray_sum.svg's default tspan_name text
    expect(dieSchema.types).not.toHaveProperty('name')
  })

  test('edit() writes a new name into a tray_sum\'s own .tspan_name', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })

    edit(ydoc, findToy(yToys, 'tray1'), { name: 'loot' })

    const traySchema = getTtStateSchema(_toSVGEl(findToy(yToys, 'tray1')))
    expect(traySchema.name).toBe('loot')
  })

  test('editing a tray\'s color/name never reaches a die nested inside it (boundary-safe)', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 300, y: 300, color: '#5e7ea8' })
    await addToy(ydoc, yToys, { id: 'die1',  toyType: 'dice_d6',  x: 300, y: 300, color: '#a8905e' })

    reparentToy(ydoc, yToys, 'die1', 'tray1') // die1 now lives in tray1's contents_group — a pure Yjs-tree move, no render needed

    const dieBefore = getTtStateSchema(_toSVGEl(findToy(yToys, 'die1')))

    edit(ydoc, findToy(yToys, 'tray1'), { color: 'hsl(0, 100%, 50%)', name: 'loot' })

    const dieAfter = getTtStateSchema(_toSVGEl(findToy(yToys, 'die1')))
    expect(dieAfter.color).toBe(dieBefore.color) // untouched by the tray's recolor
    expect(dieAfter.types).not.toHaveProperty('name') // dice never had a name field to begin with
  })
})
