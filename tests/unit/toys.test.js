// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  svgTextToDom, addToy, addToyDom, deleteToyDom, TOY_TYPES, TOOLS,
  getGeom, getTtStateSchema, editDom, previewEdit, reparentToyDom, findToyDom,
  hslToRgb, colorMatrixValues, selectModes, nextSelectMode,
  _clearSvgTextCache, _resetToyScriptState, activateAllToyScriptsDom,
  newToyId, _getScriptsFragment, initializeToy,
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
const CHIP_SVG       = fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8')
const TOKEN_GLASS_SVG = fs.readFileSync(path.join(TOY_DIR, 'token_glass.svg'), 'utf8')
const SINGLE_POKER_CARD_SVG = fs.readFileSync(path.join(TOY_DIR, 'single_poker_card.svg'), 'utf8')

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

// First descendant matching a tag name.
const find = (root, tagName) => root.querySelector(tagName)
// All descendants matching a tag name.
const findAll = (root, tagName) => [...root.querySelectorAll(tagName)]

// svgTextToDom returns { svgEl, ... } — a real, immediately-readable DOM element.
function importRoot(svgText, prefix) {
  return svgTextToDom(svgText, prefix).svgEl
}

function sync(a, b) {
  Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
  Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
}

// addToy fetches the toy file; stub it to return our fixture.
beforeEach(() => {
  _clearSvgTextCache()
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
// svgTextToDom — the SVG importer
// ─────────────────────────────────────────────────────────────────────────────

describe('svgTextToDom — namespacing, url rewriting, viewBox synthesis', () => {
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
    const XLINK_NS = 'http://www.w3.org/1999/xlink'
    expect(find(importRoot(TOY_SVG, 'P__'), 'use').getAttributeNS(XLINK_NS, 'href')).toBe('#P__token_front')
  })

  test('extracts <script> elements as data, never into the toy\u2019s own subtree', () => {
    const { scripts } = svgTextToDom(TOY_SVG, 'P__')
    expect(scripts.length).toBe(2)

    const srcScript = scripts.find(s => s.src)
    expect(srcScript.src).toBe('js/dice_utils.js')
    expect(srcScript.namespace).toBe('dice')
    expect(srcScript.code).toBe('')

    const inlineScript = scripts.find(s => s.namespace === 'token_solidcolor')
    expect(inlineScript.code).toContain('token_solidcolor')

    // Never in the toy's own subtree itself, live or at rest — see toys.js,
    // "Script hoisting".
    expect(findAll(importRoot(TOY_SVG, 'P__'), 'script').length).toBe(0)
  })

  test('drops foreign-namespace elements (sodipodi/inkscape)', () => {
    expect(find(importRoot(TOY_SVG, 'P__'), 'namedview')).toBeNull()
  })

  test('drops foreign-namespace attributes', () => {
    const root = importRoot(TOY_SVG, 'P__')
    expect(root.getAttribute('inkscape:version')).toBeNull()
    expect(find(root, 'g').getAttribute('inkscape:label')).toBeNull()
  })

  test('preserves element text content', () => {
    const tspan = find(importRoot(TOY_SVG, 'P__'), 'tspan')
    expect(tspan.textContent).toBe('5')
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

  test('assigns IDs to elements that lack them', () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" id="root">
  <defs>
    <filter id="filter1">
      <feColorMatrix type="matrix"/>
    </filter>
  </defs>
  <g id="has-id">
    <circle r="10"/>
    <rect width="20" height="20"/>
    <text>No ID</text>
  </g>
  <g>
    <ellipse cx="50" cy="50" rx="10" ry="5"/>
  </g>
</svg>`
    const root = importRoot(svg, 'P__')
    const gs = findAll(root, 'g')
    const circles = findAll(root, 'circle')
    const rects = findAll(root, 'rect')
    const texts = findAll(root, 'text')
    const ellipses = findAll(root, 'ellipse')

    // Elements that had IDs should be prefixed
    expect(find(root, 'filter').getAttribute('id')).toMatch(/^P__filter1/)
    expect(gs[0].getAttribute('id')).toMatch(/^P__has-id/)

    // Elements that lacked IDs should now have generated ones
    expect(circles[0].getAttribute('id')).toMatch(/^P__\d+$/)
    expect(rects[0].getAttribute('id')).toMatch(/^P__\d+$/)
    expect(texts[0].getAttribute('id')).toMatch(/^P__\d+$/)
    expect(ellipses[0].getAttribute('id')).toMatch(/^P__\d+$/)
    expect(gs[1].getAttribute('id')).toMatch(/^P__\d+$/)

    // All generated IDs should be unique
    const allIds = [circles, rects, texts, ellipses, [gs[1]]].flat().map(el => el.getAttribute('id'))
    expect(new Set(allIds).size).toBe(allIds.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// addToy / deleteToyDom / toysDataDom
// ─────────────────────────────────────────────────────────────────────────────
//
// addToy's own wrapper-attribute/positioning/id-namespacing/script-hoisting
// behavior is comprehensively covered in toys-dom-ops.test.js (it shares
// buildToyDom with addToyDom) -- kept here is what isn't covered there:
// the reject-and-write-nothing failure paths, deleteToyDom's own return
// contract, and the "scripts never in the toy's own DOM" property.

describe('addToy', () => {
  test('throws on unknown toy type and places nothing', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    await expect(
      addToy(ydoc, layerEl, { id: 'x', toyType: 'nope', x: 0, y: 0 })
    ).rejects.toThrow(/unknown toy type/)
    expect(layerEl.children.length).toBe(0)
  })

  test('throws when the toy file cannot be loaded', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    await expect(
      addToy(ydoc, layerEl, { id: 'x', toyType: 'player_marker', x: 0, y: 0 })
    ).rejects.toThrow(/failed to load/)
    expect(layerEl.children.length).toBe(0)
  })
})

describe('deleteToyDom', () => {
  test('removes the toy <g> from the layer', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })
    await addToy(ydoc, layerEl, { id: 't2', toyType: 'player_marker', x: 0, y: 0 })

    expect(deleteToyDom(layerEl, 't1')).toBe(true)
    expect(layerEl.children.length).toBe(1)
    expect(layerEl.children[0].getAttribute('data-id')).toBe('t2')
  })

  test('returns false for an unknown id', () => {
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    expect(deleteToyDom(layerEl, 'nope')).toBe(false)
  })
})

describe('toysDataDom / scripts stay out of the toy\'s own DOM', () => {
  test('scripts are never in a placed toy\'s own DOM \u2014 hoisted to the document instead', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    // Not in the mirrored DOM used for on-screen rendering...
    expect(toyEl.querySelector('script')).toBeNull()
    // ...hoisted into the document's own scripts fragment instead.
    expect(_getScriptsFragment(ydoc).toArray().length).toBe(1) // just the inline 'd6'
  })
})

describe('scoped lookup ($)', () => {
  test('rewrites a bare #id to the toy-instance-namespaced id and finds it', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const found = toyEl.$('#token_front')
    expect(found).not.toBeNull()
    expect(found.getAttribute('id')).toBe('t1__token_front')
  })

  test('rewrites every #token in a compound selector, leaving classes alone', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const found = toyEl.$('#label #ts')
    expect(found).not.toBeNull()
    expect(found.getAttribute('id')).toBe('t1__ts')
  })

  test('returns null when the rewritten id has no match, same as querySelector', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    expect(toyEl.$('#does_not_exist')).toBeNull()
  })

  test('two instances of the same type resolve to their own ids, not the other\u2019s', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const elA = await addToy(ydoc, layerEl, { id: 'a', toyType: 'player_marker', x: 0, y: 0 })
    const elB = await addToy(ydoc, layerEl, { id: 'b', toyType: 'player_marker', x: 0, y: 0 })

    expect(elA.$('#token_front').getAttribute('id')).toBe('a__token_front')
    expect(elB.$('#token_front').getAttribute('id')).toBe('b__token_front')
  })

  test('.$() is only on the toy root; a nested element reaches it via closest()', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0 })

    const nested = toyEl.querySelector('#t1__ts')
    expect(nested.$).toBeUndefined()

    const root = nested.closest('[data-toy-type]')
    expect(root).toBe(toyEl)
    expect(root.$('#token_front').getAttribute('id')).toBe('t1__token_front')
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

  test('returns numeric bbox centered on the placement point', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 100, y: 200 })
    const geo = getGeom(toyEl)
    expect(geo).toEqual({ x: 100 - TOY_WIDTH / 2, y: 200 - TOY_HEIGHT / 2, width: TOY_WIDTH, height: TOY_HEIGHT })
    expect(typeof geo.x).toBe('number')
    expect(typeof geo.width).toBe('number')
  })

  test('returns the exact embedded svg bounds', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 50, y: 80 })
    const geo = getGeom(toyEl)
    expect(geo.x).toBe(50 - TOY_WIDTH / 2)
    expect(geo.y).toBe(80 - TOY_HEIGHT / 2)
    expect(geo.width).toBe(TOY_WIDTH)
    expect(geo.height).toBe(TOY_HEIGHT)
  })

  test('returns null for a missing toy / nullish input', () => {
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    expect(getGeom(layerEl.querySelector('[data-id="nope"]'))).toBeNull()
    expect(getGeom(null)).toBeNull()
  })

  test('returns correct geometry after the embedded svg is repositioned', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 100, y: 100 })

    // simulate a drag: mutate the embedded svg's x and y directly
    const svg = toyEl.querySelector('svg')
    svg.setAttribute('x', '200')
    svg.setAttribute('y', '300')

    const geo = getGeom(toyEl)
    expect(geo.x).toBe(200)
    expect(geo.y).toBe(300)
  })

  test('geometry from two instances does not bleed between them', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyA = await addToy(ydoc, layerEl, { id: 'a', toyType: 'player_marker', x: 100, y: 100 })
    const toyB = await addToy(ydoc, layerEl, { id: 'b', toyType: 'player_marker', x: 400, y: 400 })

    const geoA = getGeom(toyA)
    const geoB = getGeom(toyB)
    expect(geoA.x).toBe(100 - TOY_WIDTH / 2)
    expect(geoB.x).toBe(400 - TOY_WIDTH / 2)
    expect(geoA.x).not.toBe(geoB.x)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Movement — a committed drag ends up at the embedded <svg>'s x/y. The
// concurrent-move/recolor/converge properties these used to also check
// relied on Yjs XmlFragment's fine-grained attribute-merge CRDT — toys
// don't sync that way anymore (DOM + op log, with the deliberately-designed
// conflict system in toys-layer-api.test.js's resolveToyBranchConflict /
// buildToyForkSeed / adoptToyBranch blocks), so that part is redundant with
// that real coverage now, not a property of movement specifically.
// ─────────────────────────────────────────────────────────────────────────────

function commitMove(toyEl, x, y) {
  const svg = toyEl?.querySelector('svg')
  if (!svg) return false
  svg.setAttribute('x', String(x))
  svg.setAttribute('y', String(y))
  return true
}

describe('selectModes / nextSelectMode', () => {
  // selectModes reads classes off the toy's own embedded <svg>
  // (domEl.querySelector(':scope > svg')) -- a minimal <g><svg class="..">
  // wrapper is enough to exercise it without going through addToy/fetch.
  function makeToyDom(classes = []) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    if (classes.length) svg.setAttribute('class', classes.join(' '))
    g.appendChild(svg)
    return g
  }

  test('selectModes always includes action, plus resize/rummage per class', () => {
    expect(selectModes(makeToyDom())).toEqual(['action'])
    expect(selectModes(makeToyDom(['tt-mode-resize']))).toEqual(['action', 'resize'])
    expect(selectModes(makeToyDom(['tt-mode-resize', 'tt-mode-rummage']))).toEqual(['action', 'resize', 'rummage'])
  })

  test('nextSelectMode cycles sel-action <-> sel-resize for a resizable toy', () => {
    const domEl = makeToyDom(['tt-mode-resize'])
    expect(nextSelectMode(domEl, null)).toBe('sel-action')
    expect(nextSelectMode(domEl, 'sel-action')).toBe('sel-resize')
    expect(nextSelectMode(domEl, 'sel-resize')).toBe('sel-action')
  })

  test('nextSelectMode always offers sel-action for a toy with no resize capability', () => {
    const domEl = makeToyDom()
    expect(nextSelectMode(domEl, null)).toBe('sel-action')
    expect(nextSelectMode(domEl, 'sel-action')).toBe('sel-action')
  })

  // Rummage has no gesture/rendering behind it yet (see selectModeCycle's own
  // comment) -- a tray/bag/supply-like toy that declares BOTH capabilities
  // must still only cycle sel-action <-> sel-resize, not surface rummage.
  test('nextSelectMode skips rummage even when the toy declares both capabilities', () => {
    const domEl = makeToyDom(['tt-mode-resize', 'tt-mode-rummage'])
    expect(nextSelectMode(domEl, null)).toBe('sel-action')
    expect(nextSelectMode(domEl, 'sel-action')).toBe('sel-resize')
    expect(nextSelectMode(domEl, 'sel-resize')).toBe('sel-action')
  })
})

describe('movement', () => {
  // TOY_SVG (top of file) is 80x100 — addToy places it at x = cx - 40, y = cy - 50.
  const TOY_WIDTH  = 80
  const TOY_HEIGHT = 100

  test('committing a move updates the embedded svg position', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't', toyType: 'player_marker', x: 100, y: 100 })
    expect(toyEl.querySelector('svg').getAttribute('x')).toBe(String(100 - TOY_WIDTH / 2))

    commitMove(toyEl, 200, 250)
    const svg = toyEl.querySelector('svg')
    expect(svg.getAttribute('x')).toBe('200')
    expect(svg.getAttribute('y')).toBe('250')
  })

  test('getGeom reflects the moved position', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't', toyType: 'player_marker', x: 100, y: 100 })
    commitMove(toyEl, 300, 0)
    const geo = getGeom(toyEl)
    expect(geo).toEqual({ x: 300, y: 0, width: TOY_WIDTH, height: TOY_HEIGHT })
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
  test('very dark color is boosted (sum of RGB ≥ 0.9)', () => {
    const m = parseMatrix(colorMatrixValues('hsl(0, 0%, 5%)'))
    expect(m[0] + m[5] + m[10]).toBeGreaterThanOrEqual(0.9)
  })
  test('hex #ff0000 → pure red', () => {
    const m = parseMatrix(colorMatrixValues('#ff0000'))
    expect(m[0]).toBeCloseTo(1, 2); expect(m[5]).toBeCloseTo(0, 2); expect(m[10]).toBeCloseTo(0, 2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// applyColor (via addToy)
// ─────────────────────────────────────────────────────────────────────────────

describe('applyColor (via addToy)', () => {
  test('feColorMatrix values are set after placement (red)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, {
      id: 't1', toyType: 'player_marker', x: 100, y: 100,
      color: 'hsl(0, 100%, 50%)',
    })
    const m = toyEl.querySelector('feColorMatrix').getAttribute('values').trim().split(/\s+/).map(Number)
    expect(m[0]).toBeCloseTo(1, 2)
    expect(m[5]).toBeCloseTo(0, 2)
    expect(m[10]).toBeCloseTo(0, 2)
  })

  test('two players get different feColorMatrix values', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toy1 = await addToy(ydoc, layerEl, { id: 'p1', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(0, 100%, 50%)' })
    const toy2 = await addToy(ydoc, layerEl, { id: 'p2', toyType: 'player_marker', x: 0, y: 0, color: 'hsl(240, 100%, 50%)' })

    const m1 = toy1.querySelector('feColorMatrix').getAttribute('values').trim().split(/\s+/).map(Number)
    const m2 = toy2.querySelector('feColorMatrix').getAttribute('values').trim().split(/\s+/).map(Number)
    expect(m1[0]).toBeGreaterThan(m1[10])   // red: R > B
    expect(m2[10]).toBeGreaterThan(m2[0])   // blue: B > R
  })

  test('placement without a color leaves default matrix values', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const toyEl = await addToy(ydoc, layerEl, { id: 't1', toyType: 'player_marker', x: 0, y: 0, color: undefined })
    // default from the TOY_SVG fixture: '1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0'
    expect(toyEl.querySelector('feColorMatrix').getAttribute('values')).toContain('1 0 0 0 0')
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
      if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
      if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
      if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
      if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  test('getTtStateSchema includes color for a placed tray_sum — data-driven on its own feColorMatrix, not its toyType', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const trayEl = await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#5e7ea8' })

    const traySchema = getTtStateSchema(trayEl)
    expect(traySchema.types).toHaveProperty('color', 'color-hsl')
    expect(traySchema.color).toBe('#5e7ea8')
  })

  test('editDom() writes a new name into a tray_sum\'s own .tspan_name', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const trayEl = await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })

    editDom(trayEl, { name: 'loot' })

    expect(getTtStateSchema(trayEl).name).toBe('loot')
  })

  test('editing an outer tray\'s color/name never reaches a tray nested inside it (id-prefix isolation, not just structural nesting)', async () => {
    // A tray-in-tray is the sharper case than die-in-tray above: the inner
    // toy ALSO carries its own .tt_color_filter and .tspan_name, so this
    // proves isColorable/findOwnNameEl are matching on the OUTER tray's own
    // id-prefixed class (${outerToyId}__tt_color_filter etc.) and not just
    // finding "a" tt_color_filter/tspan_name anywhere in the subtree.
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    await addToy(ydoc, layerEl, { id: 'outer', toyType: 'tray_sum', x: 0, y: 0, color: '#5e7ea8' })
    await addToy(ydoc, layerEl, { id: 'inner', toyType: 'tray_sum', x: 0, y: 0, color: '#a8905e' })
    editDom(layerEl.querySelector('[data-id="inner"]'), { name: 'inner-loot' })
    reparentToyDom(layerEl, 'inner', 'outer')

    const innerBefore = getTtStateSchema(layerEl.querySelector('[data-id="inner"]'))
    expect(innerBefore.name).toBe('inner-loot')

    editDom(layerEl.querySelector('[data-id="outer"]'), { color: 'hsl(0, 100%, 50%)', name: 'outer-loot' })

    const outerAfter = getTtStateSchema(layerEl.querySelector('[data-id="outer"]'))
    const innerAfter = getTtStateSchema(layerEl.querySelector('[data-id="inner"]'))
    expect(outerAfter.name).toBe('outer-loot')       // outer got its own edit
    expect(innerAfter.name).toBe('inner-loot')       // inner's own name untouched
    expect(innerAfter.color).toBe(innerBefore.color) // inner's own color untouched
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// chip: Tools panel value range slider (1-25) → initialize(elem, options)
// ─────────────────────────────────────────────────────────────────────────────
//
// app.js's commitToy passes every tool option through as initializeToy's
// initArgs, as a plain { color, ...options } object (color always present,
// even though chip's own initialize doesn't read it — see app.js's
// commitToy) — untested directly here (see this project's convention of
// exercising toys.js's own lifecycle contract instead of importing app.js).
// This covers chip.svg's side of that contract: options.value on placement
// overwrites the template's default tspan text; the clone path (which
// calls initialize with no initArgs at all — see supply.test.js) must keep
// working, i.e. no initArgs must leave the tspan exactly as placed.
describe('chip: value from the Tools panel range slider (real assets)', () => {
  const AUTHOR = 'tester'
  const TABLE  = 'test-table'

  beforeEach(() => {
    _resetToyScriptState()
    delete globalThis.chip
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/chip.svg') return { ok: true, text: async () => CHIP_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  test('options.value sets the tspan to that value, overwriting the template default ("5")', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const chipEl = await addToy(ydoc, layerEl, { id: 'chip1', toyType: 'chip', x: 0, y: 0, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0)) // flush fire-and-forget script activation

    initializeToy(ydoc, layerEl, chipEl, 'chip', AUTHOR, TABLE, { color: '#fff', value: 17 })

    expect(chipEl.querySelector('tspan').textContent).toBe('17')
  })

  test('no initArgs (e.g. the clone path) leaves the tspan at its placed value', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const chipEl = await addToy(ydoc, layerEl, { id: 'chip1', toyType: 'chip', x: 0, y: 0, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    initializeToy(ydoc, layerEl, chipEl, 'chip', AUTHOR, TABLE)

    expect(chipEl.querySelector('tspan').textContent).toBe('5') // template default, untouched
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// token_glass: Tools panel value range slider (0-24) → initialize(elem, options)
// ─────────────────────────────────────────────────────────────────────────────
//
// Same contract as chip above: app.js's commitToy forwards the active
// tool's params as an { color, value } initArgs object. token_glass.svg's
// own side of it picks which of its 24 .game-icon faces
// (data-token-style-index 1-24) is visible — or, for 0, hides all of them.
// That 0 case matters: it's the same "nothing showing" state increment()
// already leaves you in after cycling Value+1 past the last face, so 0 has
// to mean the same thing on placement as it does mid-game.
describe('token_glass: value from the Tools panel range slider (real assets)', () => {
  const AUTHOR = 'tester'
  const TABLE  = 'test-table'

  beforeEach(() => {
    _resetToyScriptState()
    delete globalThis.token_glass
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/token_glass.svg') return { ok: true, text: async () => TOKEN_GLASS_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  async function placedToken(ydoc, layerEl) {
    const tokenEl = await addToy(ydoc, layerEl, { id: 'tok1', toyType: 'token_glass', x: 0, y: 0, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0)) // flush fire-and-forget script activation
    return tokenEl
  }
  const visibleIndex = tokenEl => {
    const vis = tokenEl.querySelector('.game-icon:not([display="none"])')
    return vis ? Number(vis.getAttribute('data-token-style-index')) : null
  }

  test('options.value of 0 hides every .game-icon — the null case', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const tokenEl = await placedToken(ydoc, layerEl)

    initializeToy(ydoc, layerEl, tokenEl, 'token_glass', AUTHOR, TABLE, { color: '#fff', value: 0 })

    expect(visibleIndex(tokenEl)).toBeNull()
  })

  test('options.value of N shows only the .game-icon at data-token-style-index N', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const tokenEl = await placedToken(ydoc, layerEl)

    initializeToy(ydoc, layerEl, tokenEl, 'token_glass', AUTHOR, TABLE, { color: '#fff', value: 12 })

    expect(visibleIndex(tokenEl)).toBe(12)
    const hidden = [...tokenEl.querySelectorAll('.game-icon')].filter(el => el.getAttribute('data-token-style-index') !== '12')
    expect(hidden.every(el => el.getAttribute('display') === 'none')).toBe(true)
  })

  test('no initArgs (e.g. the clone path) leaves the template default untouched — no face visible', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const tokenEl = await placedToken(ydoc, layerEl)

    initializeToy(ydoc, layerEl, tokenEl, 'token_glass', AUTHOR, TABLE)

    // token_glass.svg's own template ships every .game-icon display:none —
    // increment()'s first click is what reveals face 1. That's the same
    // null case value 0 produces, so leaving it alone on a no-initArgs
    // call (e.g. clone) is already correct.
    expect(visibleIndex(tokenEl)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// single_poker_card: Tools panel suit/rank sliders → initialize(elem, options),
// and Edit panel suit/rank sliders → editableFields()/applyEdit() (real assets)
// ─────────────────────────────────────────────────────────────────────────────
//
// Like chip/token_glass above, app.js's commitToy forwards every tool
// option as one { color, ...options } object — single_poker_card just
// reads two keys (suit, rank) off it instead of one. This block covers
// single_poker_card's own side of that contract, plus its
// editableFields/applyEdit hooks — toys.js's generic
// getTtStateSchema/editDom/previewEdit delegate any non-color/name field
// to whichever namespace declares them.
describe('single_poker_card: suit/rank from the Tools + Edit panel sliders (real assets)', () => {
  beforeEach(() => {
    _resetToyScriptState()
    delete globalThis.single_poker_card
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'toy/single_poker_card.svg') return { ok: true, text: async () => SINGLE_POKER_CARD_SVG }
      throw new Error(`unexpected fetch: ${url}`)
    }))
  })

  async function placedCard(ydoc, layerEl, id = 'card1') {
    const cardEl = await addToy(ydoc, layerEl, { id, toyType: 'single_poker_card', x: 0, y: 0, color: '#fff' })
    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0)) // flush fire-and-forget script activation
    return cardEl
  }

  test('an { suit, rank } options bag paints the matching face and records both numbers on the toy', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cardEl = await placedCard(ydoc, layerEl)

    initializeToy(ydoc, layerEl, cardEl, 'single_poker_card', 'tester', 'test-table', { color: '#fff', suit: 3, rank: 11 })

    expect(cardEl.querySelector('.tspan_suit').textContent).toBe('♦')
    expect(cardEl.querySelector('.tspan_rank').textContent).toBe('J')
    expect(cardEl.dataset.suit).toBe('3')
    expect(cardEl.dataset.rank).toBe('11')
  })

  test('no initArgs (e.g. the clone path) still deals a valid, in-range card', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cardEl = await placedCard(ydoc, layerEl)

    initializeToy(ydoc, layerEl, cardEl, 'single_poker_card', 'tester', 'test-table')

    expect(Number(cardEl.dataset.suit)).toBeGreaterThanOrEqual(1)
    expect(Number(cardEl.dataset.suit)).toBeLessThanOrEqual(4)
    expect(Number(cardEl.dataset.rank)).toBeGreaterThanOrEqual(1)
    expect(Number(cardEl.dataset.rank)).toBeLessThanOrEqual(13)
  })

  test('getTtStateSchema merges in suit/rank as edit-mode range fields, reading the card\'s current values', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cardEl = await placedCard(ydoc, layerEl)
    initializeToy(ydoc, layerEl, cardEl, 'single_poker_card', 'tester', 'test-table', { color: '#fff', suit: 2, rank: 7 })

    const schema = getTtStateSchema(cardEl)

    expect(schema.suit).toBe(2)
    expect(schema.rank).toBe(7)
    expect(schema.types.suit).toEqual({ kind: 'number', min: 1, max: 4, step: 1, show: ['edit'] })
    expect(schema.types.rank).toEqual({ kind: 'number', min: 1, max: 13, step: 1, show: ['edit'] })
  })

  test('editDom({ suit, rank }) repaints an already-placed card via applyEdit — the real commit path', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cardEl = await placedCard(ydoc, layerEl)
    initializeToy(ydoc, layerEl, cardEl, 'single_poker_card', 'tester', 'test-table', { color: '#fff', suit: 1, rank: 1 })

    editDom(cardEl, { rank: 13 })

    expect(cardEl.querySelector('.tspan_rank').textContent).toBe('K')
    expect(cardEl.dataset.rank).toBe('13') // committed
    expect(cardEl.dataset.suit).toBe('1')  // untouched — only rank was in editData
  })

  test('previewEdit({ suit, rank }) repaints a detached ghost clone without touching the real card', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const cardEl = await placedCard(ydoc, layerEl)
    initializeToy(ydoc, layerEl, cardEl, 'single_poker_card', 'tester', 'test-table', { color: '#fff', suit: 1, rank: 1 })
    const ghostEl = cardEl.cloneNode(true)

    previewEdit(ghostEl, { suit: 4, rank: 13 })

    expect(ghostEl.querySelector('.tspan_suit').textContent).toBe('♠')
    expect(cardEl.querySelector('.tspan_suit').textContent).toBe('♥') // real card untouched
  })
})

