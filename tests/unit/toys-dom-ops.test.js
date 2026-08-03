/**
 * tests/unit/toys-dom-ops.test.js
 *
 * The toys layer's DOM writers and readers: building, moving, resizing,
 * editing, and reading a placed toy directly against the live DOM. (Used
 * to be checked against Yjs originals for parity during the DOM
 * migration; those originals are gone now that toys are DOM/op-log based
 * throughout, so these assert the DOM behaviour directly.)
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  addToy, addToyDom, buildToyDom, svgTextToDom,
  applyResizeDom, applyMoveDom,
  findToyDom, listToysDom, toysDataDom, getTtStateDom, editDom,
  _getScriptsFragment,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

const bareLayer = () => {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  return el
}

describe('svgTextToDom', () => {
  test('namespaces ids per instance', () => {
    const { svgEl } = svgTextToDom(D6_SVG, 'die1__')
    for (const el of svgEl.querySelectorAll('[id]')) {
      expect(el.getAttribute('id').startsWith('die1__')).toBe(true)
    }
  })

  test('adds prefixed aliases for the tt_ classes', () => {
    const { svgEl } = svgTextToDom(TRAY_SUM_SVG, 'tray1__')
    expect(svgEl.querySelector('.tray1__tt_contents')).toBeTruthy()
  })

  test('reports the template’s native size', () => {
    const { width, height } = svgTextToDom(D6_SVG, 'd__')
    expect(width).toBeGreaterThan(0)
    expect(height).toBeGreaterThan(0)
  })

  test('extracts scripts rather than embedding them', () => {
    const { svgEl, scripts } = svgTextToDom(D6_SVG, 'd__')
    expect(svgEl.querySelector('script')).toBeNull()
    expect(scripts.length).toBeGreaterThan(0)
  })

  test('every element in the result carries a data-id', () => {
    const { svgEl } = svgTextToDom(D6_SVG, 'd__')
    const unstamped = [svgEl, ...svgEl.querySelectorAll('*')]
      .filter(el => !el.getAttribute('data-id'))
    expect(unstamped).toEqual([])
  })
})

describe('buildToyDom / addToyDom', () => {
  const attrs = { id: 'die1', toyType: 'dice_d6', x: 100, y: 50, color: '#ff0000' }

  test('wrapper carries class/data-toy-id/data-toy-type/data-color', () => {
    const { toyEl } = buildToyDom(attrs, D6_SVG)
    expect(toyEl.getAttribute('class')).toBe('toy')
    expect(toyEl.getAttribute('data-toy-id')).toBe('die1')
    expect(toyEl.getAttribute('data-toy-type')).toBe('dice_d6')
    expect(toyEl.getAttribute('data-color')).toBe('#ff0000')
  })

  test('centres the toy on (x, y)', () => {
    const { toyEl } = buildToyDom(attrs, D6_SVG)
    const svgEl = toyEl.querySelector('svg')
    const w = Number(svgEl.getAttribute('width'))
    const h = Number(svgEl.getAttribute('height'))
    expect(Number(svgEl.getAttribute('x')) + w / 2).toBe(100)
    expect(Number(svgEl.getAttribute('y')) + h / 2).toBe(50)
  })

  test('tints the colour filter at placement time', () => {
    const { toyEl } = buildToyDom(attrs, D6_SVG)
    const matrix = toyEl.querySelector('feColorMatrix')
    if (matrix) expect(matrix.getAttribute('values')).toBeTruthy()
  })

  test('hoists the template’s scripts into ydoc', () => {
    const ydoc = new Y.Doc()
    addToyDom(ydoc, bareLayer(), attrs, D6_SVG)
    const hoisted = _getScriptsFragment(ydoc).toArray()
    expect(hoisted.length).toBeGreaterThan(0)
  })

  test('stamps the handles app.js dispatches on', () => {
    const { toyEl } = buildToyDom(attrs, D6_SVG)
    expect(toyEl.getAttribute('data-id')).toBe('die1')
    expect(toyEl.getAttribute('data-module')).toBe('toys')
    expect(typeof toyEl.$).toBe('function')
  })

  test('the scoped $ lookup resolves a namespaced id', () => {
    const { toyEl } = buildToyDom(attrs, D6_SVG)
    const anyId = toyEl.querySelector('[id]')?.getAttribute('id')
    if (anyId) {
      const bare = anyId.replace('die1__', '')
      expect(toyEl.$(`#${bare}`)).toBeTruthy()
    }
  })

  test('two placements of one type collide on nothing', () => {
    const layerEl = bareLayer()
    const ydoc = new Y.Doc()
    addToyDom(ydoc, layerEl, { ...attrs, id: 'die1' }, D6_SVG)
    addToyDom(ydoc, layerEl, { ...attrs, id: 'die2' }, D6_SVG)
    const ids = [...layerEl.querySelectorAll('[data-id]')].map(el => el.getAttribute('data-id'))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('applyMoveDom', () => {
  test('centers the toy on the new (cx, cy)', () => {
    const layerEl = bareLayer()
    const { toyEl } = buildToyDom({ id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' }, D6_SVG)
    layerEl.appendChild(toyEl)

    applyMoveDom(toyEl, 250, 175)

    const svg = toyEl.querySelector('svg')
    const w = Number(svg.getAttribute('width'))
    const h = Number(svg.getAttribute('height'))
    expect(Number(svg.getAttribute('x')) + w / 2).toBe(250)
    expect(Number(svg.getAttribute('y')) + h / 2).toBe(175)
  })
})

describe('DOM readers', () => {
  test('getTtStateDom reports id/type/color/centre', () => {
    const { toyEl } = buildToyDom(
      { id: 'die1', toyType: 'dice_d6', x: 40, y: 60, color: '#00ff00' }, D6_SVG)
    expect(getTtStateDom(toyEl)).toMatchObject({
      id: 'die1', toyType: 'dice_d6', color: '#00ff00', cx: 40, cy: 60,
    })
  })

  test('toysDataDom lists placed toys in z-order with element, type, and meta', () => {
    const layerEl = bareLayer()
    const ydoc = new Y.Doc()
    addToyDom(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' }, D6_SVG)
    addToyDom(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#abc' }, TRAY_SUM_SVG)

    const data = toysDataDom(layerEl)
    expect(data.map(d => d.id)).toEqual(['die1', 'tray1'])
    expect(data[1].kind).toBe('tray_sum')
    expect(data[1].fill).toBe('#abc')
  })

  test('findToyDom finds a top-level toy', () => {
    const layerEl = bareLayer()
    const ydoc = new Y.Doc()
    addToyDom(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' }, D6_SVG)
    expect(findToyDom(layerEl, 'die1')).toBeTruthy()
    expect(findToyDom(layerEl, 'nope')).toBeNull()
  })

  test('findToyDom does not reach into a container (top level only)', () => {
    const layerEl = bareLayer()
    const ydoc = new Y.Doc()
    addToyDom(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' }, TRAY_SUM_SVG)
    addToyDom(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' }, D6_SVG)

    const contents = layerEl.querySelector('[data-toy-id="tray1"] .tt_contents')
    contents.appendChild(layerEl.querySelector('[data-toy-id="die1"]'))

    expect(findToyDom(layerEl, 'die1')).toBeNull()
    expect(listToysDom(layerEl).map(el => el.getAttribute('data-toy-id'))).toEqual(['tray1'])
  })

  test('getTtStateDom reflects an editDom colour change', () => {
    const { toyEl } = buildToyDom(
      { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#ffffff' }, D6_SVG)

    editDom(toyEl, { color: '#123456' })
    expect(getTtStateDom(toyEl).color).toBe('#123456')
  })
})
