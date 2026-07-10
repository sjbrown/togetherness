// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import { addToy, clearYNodeMap, _clearSvgTextCache,
         _resetToyScriptState, getNamespacesForType } from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Exercise the real, production toy files — not fixtures — same convention
// as tests/unit/dice-d6.test.js.
const TRAY_SUM_SVG = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG         = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS  = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

const getToysLayer = (ydoc) => ({ yToys: ydoc.getXmlFragment('toys') })

function renderLayer(yToys) {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  Toys.render(yToys, layerEl)
  return layerEl
}

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === '/toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

async function placeAndActivate(ydoc, yToys, toyType, id) {
  await addToy(ydoc, yToys, { id, toyType, x: 0, y: 0, color: '#fff' })
  const layerEl = renderLayer(yToys)
  await new Promise(r => setTimeout(r, 0)) // flush render()'s fire-and-forget script activation
  return { layerEl, toyEl: layerEl.querySelector(`[data-yid="${id}"]`) }
}

beforeEach(() => {
  _clearSvgTextCache()
  clearYNodeMap()
  _resetToyScriptState()
  delete globalThis.tray
  delete globalThis.tray_sum
  delete globalThis.dice
  delete globalThis.d6
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => {
  vi.unstubAllGlobals()
  // Restore the real toys.js-bridged lookup — one test below intentionally
  // overrides globalThis.getNamespacesForType to isolate evaluate_sub_element,
  // and since toys.js only installs the real one once at module load, it
  // would otherwise stay stubbed for every later test in this file.
  globalThis.getNamespacesForType = getNamespacesForType
})

describe('tray.js + tray_sum — script activation', () => {
  test('placing a tray_sum defines window.tray and window.tray_sum, loaded like dice_utils.js', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    await placeAndActivate(ydoc, yToys, 'tray_sum', 't1')

    expect(typeof globalThis.tray.visit_contents_group).toBe('function')
    expect(typeof globalThis.tray.getValue).toBe('function')
    expect(typeof globalThis.tray.get_numeric_value).toBe('function')
    expect(typeof globalThis.tray_sum.contents_change_handler).toBe('function')
    expect(getNamespacesForType('tray_sum')).toEqual(['tray', 'tray_sum'])
  })

  test('tray_sum is placeable via TOY_TYPES / TOOLS, matching the d6 registry pattern', () => {
    expect(Toys.TOY_TYPES.tray_sum).toEqual({
      file: 'tray_sum.svg', label: 'Sum Tray',
      iconSvg: expect.any(String),
    })
    const tool = Toys.TOOLS.find(t => t.toyType === 'tray_sum')
    expect(tool).toBeTruthy()
    expect(tool.layer).toBe('toys')
  })
})

describe('tray.js — visit_contents_group', () => {
  function makeTrayWithContents(childIds) {
    const elem  = document.createElementNS(SVG_NS, 'g')
    const group = document.createElementNS(SVG_NS, 'g')
    group.classList.add('contents_group')
    elem.appendChild(group)
    const children = childIds.map(id => {
      const child = document.createElementNS(SVG_NS, 'g')
      child.classList.add('toy')
      child.setAttribute('data-toy-id', id)
      group.appendChild(child)
      return child
    })
    return { elem, group, children }
  }

  test('visits each direct .toy child of .contents_group, in order', () => {
    ;(0, eval)(TRAY_JS)
    const { elem, children } = makeTrayWithContents(['a', 'b', 'c'])
    const seen = []
    tray.visit_contents_group(elem, (child) => seen.push(child.getAttribute('data-toy-id')))
    expect(seen).toEqual(['a', 'b', 'c'])
  })

  test('does not descend into a nested tray\u2019s own contents_group (direct children only)', () => {
    ;(0, eval)(TRAY_JS)
    const { elem, group } = makeTrayWithContents(['a'])
    // a nested tray placed inside, itself containing another toy
    const nestedTray = document.createElementNS(SVG_NS, 'g')
    nestedTray.classList.add('toy')
    nestedTray.setAttribute('data-toy-id', 'nested-tray')
    const nestedGroup = document.createElementNS(SVG_NS, 'g')
    nestedGroup.classList.add('contents_group')
    const buried = document.createElementNS(SVG_NS, 'g')
    buried.classList.add('toy')
    buried.setAttribute('data-toy-id', 'buried')
    nestedGroup.appendChild(buried)
    nestedTray.appendChild(nestedGroup)
    group.appendChild(nestedTray)

    const seen = []
    tray.visit_contents_group(elem, (child) => seen.push(child.getAttribute('data-toy-id')))
    expect(seen).toEqual(['a', 'nested-tray']) // 'buried' excluded
  })

  test('is a no-op (never throws) when elem has no .contents_group', () => {
    ;(0, eval)(TRAY_JS)
    const elem = document.createElementNS(SVG_NS, 'g')
    expect(() => tray.visit_contents_group(elem, () => { throw new Error('should not be called') })).not.toThrow()
  })
})

describe('tray.js — getValue / getUnderstoodNumber', () => {
  function makeTrayWithResult(text) {
    const elem = document.createElementNS(SVG_NS, 'g')
    const resultContainer = document.createElementNS(SVG_NS, 'svg')
    resultContainer.classList.add('result_container')
    const tspan = document.createElementNS(SVG_NS, 'tspan')
    tspan.classList.add('tspan_result')
    tspan.textContent = text
    resultContainer.appendChild(tspan)
    elem.appendChild(resultContainer)
    return elem
  }

  test('reads the trimmed text content of .tspan_result', () => {
    ;(0, eval)(TRAY_JS)
    const elem = makeTrayWithResult('  12  ')
    expect(tray.getValue(elem)).toBe('12')
  })

  test('throws when there is no result tspan (no null guard on this branch\u2019s getValue)', () => {
    ;(0, eval)(TRAY_JS)
    const elem = document.createElementNS(SVG_NS, 'g')
    expect(() => tray.getValue(elem)).toThrow()
  })

  test('getUnderstoodNumber parses numbers and FATE +/- faces, else null', () => {
    ;(0, eval)(TRAY_JS)
    expect(tray.getUnderstoodNumber('7')).toBe(7)
    expect(tray.getUnderstoodNumber('+')).toBe(1)
    expect(tray.getUnderstoodNumber('-')).toBe(-1)
    expect(tray.getUnderstoodNumber('blank')).toBeNull()
  })
})

describe('tray.js — get_numeric_value', () => {
  // A d6-shaped contained toy: <g class="toy" data-toy-type="dice_d6"><svg>...<tspan>N</tspan></svg></g>
  function makeDieToy(value, toyType = 'dice_d6') {
    const wrapper = document.createElementNS(SVG_NS, 'g')
    wrapper.classList.add('toy')
    wrapper.setAttribute('data-toy-type', toyType)
    const svg = document.createElementNS(SVG_NS, 'svg')
    const tspan = document.createElementNS(SVG_NS, 'tspan')
    tspan.textContent = String(value)
    svg.appendChild(tspan)
    wrapper.appendChild(svg)
    return wrapper
  }

  test('falls back to the topmost numeric tspan when the toy type has no getValue namespace', () => {
    ;(0, eval)(TRAY_JS)
    const die = makeDieToy(4, 'unregistered_toy_type')
    expect(tray.get_numeric_value(die)).toBe(4)
  })

  test('unrecognized content contributes 0, never NaN', () => {
    ;(0, eval)(TRAY_JS)
    const wrapper = document.createElementNS(SVG_NS, 'g')
    wrapper.classList.add('toy')
    wrapper.setAttribute('data-toy-type', 'unregistered_toy_type')
    expect(tray.get_numeric_value(wrapper)).toBe(0)
  })

  test('uses the toy type\u2019s own namespace getValue() when one is registered (evaluate_sub_element)', () => {
    ;(0, eval)(DICE_UTILS_JS)
    ;(0, eval)(TRAY_JS)
    globalThis.getNamespacesForType = (toyType) => (toyType === 'dice_d6' ? ['dice'] : [])
    // dice.getValue sums tspans within the toy's own <svg> — give it two,
    // so this only passes if evaluate_sub_element (not the raw fallback,
    // which stops at the first/topmost tspan) is really being used.
    const wrapper = document.createElementNS(SVG_NS, 'g')
    wrapper.classList.add('toy')
    wrapper.setAttribute('data-toy-type', 'dice_d6')
    const svg = document.createElementNS(SVG_NS, 'svg')
    const t1 = document.createElementNS(SVG_NS, 'tspan'); t1.textContent = '3'
    const t2 = document.createElementNS(SVG_NS, 'tspan'); t2.textContent = '4'
    svg.append(t1, t2)
    wrapper.appendChild(svg)

    expect(tray.get_numeric_value(wrapper)).toBe(7) // 3 + 4, via dice.getValue
  })

  test('a nested tray contributes its own displayed (result tspan) value, not a raw tspan scan', () => {
    ;(0, eval)(TRAY_JS)
    const nestedTray = document.createElementNS(SVG_NS, 'g')
    nestedTray.classList.add('toy')
    nestedTray.setAttribute('data-toy-type', 'tray_sum')
    const svg = document.createElementNS(SVG_NS, 'svg')
    svg.classList.add('tray_sum', 'tray')
    const resultContainer = document.createElementNS(SVG_NS, 'svg')
    resultContainer.classList.add('result_container')
    const resultTspan = document.createElementNS(SVG_NS, 'tspan')
    resultTspan.classList.add('tspan_result')
    resultTspan.textContent = '9'
    resultContainer.appendChild(resultTspan)
    svg.appendChild(resultContainer)
    nestedTray.appendChild(svg)

    expect(tray.get_numeric_value(nestedTray)).toBe(9)
  })
})

describe('tray_sum — contents_change_handler', () => {
  test('sums every contained die\u2019s value and writes it to the result tspan', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { toyEl } = await placeAndActivate(ydoc, yToys, 'tray_sum', 'tray1')

    // Hand-build two dice-shaped children directly inside the rendered
    // tray's contents_group (phase 5.2's reparentToy op is what will do
    // this for real — this test exercises the handler in isolation).
    const group = toyEl.querySelector('.contents_group')
    ;[5, 2].forEach((value, i) => {
      const child = document.createElementNS(SVG_NS, 'g')
      child.classList.add('toy')
      child.setAttribute('data-toy-type', 'dice_d6')
      const svg = document.createElementNS(SVG_NS, 'svg')
      const tspan = document.createElementNS(SVG_NS, 'tspan')
      tspan.textContent = String(value)
      svg.appendChild(tspan)
      child.appendChild(svg)
      group.appendChild(child)
    })

    globalThis.tray_sum.contents_change_handler(toyEl)

    expect(toyEl.querySelector('.tspan_result').textContent).toBe('7')
  })

  test('an empty tray sums to 0', async () => {
    const ydoc = new Y.Doc()
    const { yToys } = getToysLayer(ydoc)
    const { toyEl } = await placeAndActivate(ydoc, yToys, 'tray_sum', 'tray1')

    globalThis.tray_sum.contents_change_handler(toyEl)

    expect(toyEl.querySelector('.tspan_result').textContent).toBe('0')
  })
})
