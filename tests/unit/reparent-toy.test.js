// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import * as Toys from '../../src/toys.js'
import {
  addToy, _clearSvgTextCache, reparentToyDom,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

// Real production assets, same convention as tray.test.js/dice-d6.test.js.
const PLAYER_MARKER_SVG = fs.readFileSync(path.join(TOY_DIR, 'player_marker.svg'), 'utf8')
const TRAY_SUM_SVG      = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS           = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

beforeEach(() => {
  _clearSvgTextCache()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/toy/player_marker.svg') return { ok: true, text: async () => PLAYER_MARKER_SVG }
    if (url === '/toy/tray_sum.svg')      return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === '/toy/js/tray.js')        return { ok: true, text: async () => TRAY_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

describe('reparentToyDom — validation', () => {
  test('throws if the toy itself is not found', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    expect(() => reparentToyDom(layerEl, 'nope', 'tray1')).toThrow(/toy not found/)
  })

  test('throws if the target container is not found', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'die1', toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    expect(() => reparentToyDom(layerEl, 'die1', 'nope')).toThrow(/target not found/)
  })

  test('throws if the target has no .tt_contents', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'a', toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'b', toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    expect(() => reparentToyDom(layerEl, 'a', 'b')).toThrow(/no \.tt_contents/)
  })

  test('refuses to move a toy into itself', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    expect(() => reparentToyDom(layerEl, 'tray1', 'tray1')).toThrow(/cannot move .* into itself/)
  })

  test('refuses to move a toy into its own contained toy (would disconnect the subtree)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'outer', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'inner', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    reparentToyDom(layerEl, 'inner', 'outer') // inner now lives inside outer
    expect(() => reparentToyDom(layerEl, 'outer', 'inner')).toThrow(/cannot move .* into itself or one of its own contained toys/)
  })
})

describe('reparentToyDom — the move itself', () => {
  test('moves the toy element into the target\'s tt_contents (DOM)', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'die1', toyType: 'player_marker', x: 0, y: 0, color: '#fff' })

    const dieEl  = layerEl.querySelector('[data-id="die1"]')
    const trayEl = layerEl.querySelector('[data-id="tray1"]')

    const returned = reparentToyDom(layerEl, 'die1', 'tray1')

    expect(returned).toBe(dieEl) // same DOM node, relocated — not a clone
    expect(Toys.getContentsGroup(trayEl).contains(dieEl)).toBe(true)
    expect(layerEl.querySelector(':scope > [data-id="die1"]')).toBeNull() // no longer top-level
  })

  test('moves back to top level when containerElId is null', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'die1', toyType: 'player_marker', x: 0, y: 0, color: '#fff' })
    reparentToyDom(layerEl, 'die1', 'tray1')

    reparentToyDom(layerEl, 'die1', null)

    expect(layerEl.querySelector(':scope > [data-id="die1"]')).not.toBeNull()
  })

  test('a doubly-nested move (tray into tray) resolves both levels of containment', async () => {
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    await addToy(ydoc, layerEl, { id: 'outer', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'inner', toyType: 'tray_sum', x: 0, y: 0, color: '#fff' })
    await addToy(ydoc, layerEl, { id: 'die1',  toyType: 'player_marker', x: 0, y: 0, color: '#fff' })

    reparentToyDom(layerEl, 'inner', 'outer')
    reparentToyDom(layerEl, 'die1', 'inner')

    const outerEl = layerEl.querySelector('[data-id="outer"]')
    const innerEl = layerEl.querySelector('[data-id="inner"]')
    const dieEl   = layerEl.querySelector('[data-id="die1"]')
    expect(Toys.getContentsGroup(outerEl).contains(innerEl)).toBe(true)
    expect(Toys.getContentsGroup(innerEl).contains(dieEl)).toBe(true)
  })
})
