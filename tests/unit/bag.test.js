// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import {
  TOYS_LAYER, addToyDom, activateAllToyScriptsDom, reparentToyDom, findEl,
  getRadialItems, invokeMenuAction, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { buildSpokes } from '../../src/ui_radial.js'
import { getOps } from '../../src/op_dag.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'test-table'
const AUTHOR  = 'tester'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// The real, production toy files, as supply.test.js does.
const BAG_SVG  = fs.readFileSync(path.join(TOY_DIR, 'bag.svg'), 'utf8')
const CHIP_SVG = fs.readFileSync(path.join(TOY_DIR, 'chip.svg'), 'utf8')
const TRAY_JS  = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.bag
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/bag.svg')    return { ok: true, text: async () => BAG_SVG }
    if (url === 'toy/chip.svg')   return { ok: true, text: async () => CHIP_SVG }
    if (url === 'toy/js/tray.js') return { ok: true, text: async () => TRAY_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

// A bag holding `count` chips.
async function bagOf(count) {
  const ydoc = new Y.Doc()
  const layerEl = freshLayer()
  addToyDom(ydoc, layerEl, { id: 'bag1', toyType: 'bag', x: 100, y: 100, color: '#fff' }, BAG_SVG)
  for (let i = 0; i < count; i++) {
    addToyDom(ydoc, layerEl, { id: `chip${i}`, toyType: 'chip', x: 100, y: 100, color: '#fff' }, CHIP_SVG)
    reparentToyDom(layerEl, `chip${i}`, 'bag1')
  }
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  return { ydoc, layerEl, bagEl: findEl(layerEl, 'bag1') }
}

const loose = (layerEl) => layerEl.querySelectorAll(':scope > [data-toy-type="chip"]').length
const takeRadial = (bagEl) => getRadialItems(bagEl).find(i => i.key === 'Take').radial['How many']

describe('bag radial menu', () => {
  test("Take's max is the number of things in the bag", async () => {
    const { bagEl } = await bagOf(3)
    expect(takeRadial(bagEl)).toMatchObject({ min: 1, max: 3, default: 1 })
  })

  test('an empty bag greys Take out, with a range that still lays out', async () => {
    const { bagEl } = await bagOf(0)
    const items = getRadialItems(bagEl)
    expect(items.find(i => i.key === 'Take').enabled).toBe(false)
    expect(takeRadial(bagEl)).toMatchObject({ min: 1, max: 1 })
    expect(buildSpokes(items).error).toBeUndefined()
  })

  test('Take and Shake both get spokes', async () => {
    const { bagEl } = await bagOf(2)
    expect(buildSpokes(getRadialItems(bagEl)).spokes.map(s => s.key)).toEqual(['Take', 'Shake'])
  })

  test('Take with num: 2 pulls two out, in one op', async () => {
    const { ydoc, layerEl, bagEl } = await bagOf(3)
    const opsBefore = getOps(ydoc, TOYS_LAYER).size

    invokeMenuAction(ydoc, layerEl, bagEl, 'bag', 'Take', undefined, AUTHOR, TABLE, { num: 2 })

    expect(loose(layerEl)).toBe(2)
    expect(takeRadial(bagEl).max).toBe(1)
    expect(getOps(ydoc, TOYS_LAYER).size).toBe(opsBefore + 1)
  })

  test('asking for more than the bag holds takes what is there', async () => {
    const { ydoc, layerEl, bagEl } = await bagOf(2)

    invokeMenuAction(ydoc, layerEl, bagEl, 'bag', 'Take', undefined, AUTHOR, TABLE, { num: 5 })

    expect(loose(layerEl)).toBe(2)
  })

  test('a plain Take, with no pick, takes one', async () => {
    const { ydoc, layerEl, bagEl } = await bagOf(3)

    invokeMenuAction(ydoc, layerEl, bagEl, 'bag', 'Take', undefined, AUTHOR, TABLE)

    expect(loose(layerEl)).toBe(1)
  })
})
