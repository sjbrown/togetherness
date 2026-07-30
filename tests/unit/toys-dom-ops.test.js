/**
 * tests/unit/toys-dom-ops.test.js
 *
 * The DOM-side counterparts of the toys layer's Yjs writers and readers.
 * Each is checked against the Yjs original where one exists, so the swap
 * doesn't silently change behaviour.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  addToy, render, findToy, getTtState, toysData,
  addToyDom, buildToyDom, svgTextToDom,
  applyResizeDom, applyResizeCommit, applyMoveDom, applyMoveCommit,
  findToyDom, listToysDom, toysDataDom, getTtStateDom, editDom,
  _getScriptsFragment,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
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
  _clearSvgTextCache(); clearYNodeMap(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

const bareLayer = () => {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  return el
}

/** The same toy, placed both ways, for behaviour comparison. */
async function bothWays(attrs, svgText) {
  const ydoc  = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')
  await addToy(ydoc, yToys, attrs)
  const yLayer = bareLayer()
  render(yToys, yLayer)

  const domLayer = bareLayer()
  addToyDom(new Y.Doc(), domLayer, attrs, svgText)

  return { yLayer, domLayer, ydoc, yToys }
}

describe('svgTextToDom', () => {
  test('namespaces ids per instance, like svgTextToYXml', () => {
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

  test('produces the same wrapper attributes the Yjs path does', async () => {
    const { yLayer, domLayer } = await bothWays(attrs, D6_SVG)
    const yG = yLayer.querySelector('[data-toy-id="die1"]')
    const dG = domLayer.querySelector('[data-toy-id="die1"]')

    for (const name of ['class', 'data-toy-id', 'data-toy-type', 'data-color']) {
      expect(dG.getAttribute(name)).toBe(yG.getAttribute(name))
    }
  })

  test('positions the embedded <svg> identically', async () => {
    const { yLayer, domLayer } = await bothWays(attrs, D6_SVG)
    const ySvg = yLayer.querySelector('[data-toy-id="die1"] > svg')
    const dSvg = domLayer.querySelector('[data-toy-id="die1"] > svg')

    for (const name of ['x', 'y', 'width', 'height']) {
      expect(dSvg.getAttribute(name)).toBe(ySvg.getAttribute(name))
    }
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

describe('applyMoveDom matches applyMoveCommit', () => {
  test('same resulting x/y', async () => {
    const attrs = { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' }
    const { yLayer, domLayer, ydoc, yToys } = await bothWays(attrs, D6_SVG)

    applyMoveCommit(ydoc, findToy(yToys, 'die1'), 250, 175)
    const reY = bareLayer(); render(yToys, reY)
    applyMoveDom(domLayer.querySelector('[data-toy-id="die1"]'), 250, 175)

    const ySvg = reY.querySelector('[data-toy-id="die1"] > svg')
    const dSvg = domLayer.querySelector('[data-toy-id="die1"] > svg')
    expect(dSvg.getAttribute('x')).toBe(ySvg.getAttribute('x'))
    expect(dSvg.getAttribute('y')).toBe(ySvg.getAttribute('y'))
  })
})

describe('applyResizeDom matches applyResizeCommit', () => {
  test('same x/y/width/height/viewBox', async () => {
    const attrs = { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' }
    const { yLayer, domLayer, ydoc, yToys } = await bothWays(attrs, TRAY_SUM_SVG)

    applyResizeCommit(ydoc, findToy(yToys, 'tray1'), 10, 20, 300, 200)
    const reY = bareLayer(); render(yToys, reY)
    applyResizeDom(domLayer.querySelector('[data-toy-id="tray1"]'), 10, 20, 300, 200)

    const ySvg = reY.querySelector('[data-toy-id="tray1"] > svg')
    const dSvg = domLayer.querySelector('[data-toy-id="tray1"] > svg')
    for (const name of ['x', 'y', 'width', 'height', 'viewBox']) {
      expect(dSvg.getAttribute(name)).toBe(ySvg.getAttribute(name))
    }
  })

  test('carries wh_follow_resize elements along', async () => {
    const attrs = { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' }
    const { domLayer } = await bothWays(attrs, TRAY_SUM_SVG)
    const toyEl = domLayer.querySelector('[data-toy-id="tray1"]')

    applyResizeDom(toyEl, 0, 0, 300, 200)
    for (const el of toyEl.querySelectorAll('.tray1__tt_wh_follow_resize')) {
      expect(el.getAttribute('width')).toBe('300')
      expect(el.getAttribute('height')).toBe('200')
    }
  })

  test('clamps absurd dimensions the same way', async () => {
    const attrs = { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' }
    const { domLayer, ydoc, yToys } = await bothWays(attrs, TRAY_SUM_SVG)

    applyResizeCommit(ydoc, findToy(yToys, 'tray1'), 0, 0, 1, 1)
    const reY = bareLayer(); render(yToys, reY)
    applyResizeDom(domLayer.querySelector('[data-toy-id="tray1"]'), 0, 0, 1, 1)

    expect(domLayer.querySelector('[data-toy-id="tray1"] > svg').getAttribute('width'))
      .toBe(reY.querySelector('[data-toy-id="tray1"] > svg').getAttribute('width'))
  })
})

describe('DOM readers match their Yjs counterparts', () => {
  test('getTtStateDom matches getTtState', async () => {
    const attrs = { id: 'die1', toyType: 'dice_d6', x: 40, y: 60, color: '#00ff00' }
    const { domLayer, yToys } = await bothWays(attrs, D6_SVG)
    expect(getTtStateDom(domLayer.querySelector('[data-toy-id="die1"]')))
      .toEqual(getTtState(findToy(yToys, 'die1')))
  })

  test('toysDataDom matches toysData', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#abc' })

    const layerEl = bareLayer()
    render(yToys, layerEl)
    expect(toysDataDom(layerEl)).toEqual(toysData(yToys))
  })

  test('findToyDom finds a top-level toy', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    const layerEl = bareLayer()
    render(yToys, layerEl)
    expect(findToyDom(layerEl, 'die1')).toBeTruthy()
    expect(findToyDom(layerEl, 'nope')).toBeNull()
  })

  test('findToyDom does not reach into a container, matching findToy', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    await addToy(ydoc, yToys, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, yToys, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })

    const layerEl = bareLayer()
    render(yToys, layerEl)
    const contents = layerEl.querySelector('[data-toy-id="tray1"] .tt_contents')
    contents.appendChild(layerEl.querySelector('[data-toy-id="die1"]'))

    expect(findToyDom(layerEl, 'die1')).toBeNull()
    expect(listToysDom(layerEl).map(el => el.getAttribute('data-toy-id'))).toEqual(['tray1'])
  })

  test('getTtStateDom reflects an editDom colour change', async () => {
    const attrs = { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#ffffff' }
    const { domLayer } = await bothWays(attrs, D6_SVG)
    const toyEl = domLayer.querySelector('[data-toy-id="die1"]')

    editDom(toyEl, { color: '#123456' })
    expect(getTtStateDom(toyEl).color).toBe('#123456')
  })
})
