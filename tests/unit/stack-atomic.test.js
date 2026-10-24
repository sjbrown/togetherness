// @vitest-environment jsdom
/**
 * tests/unit/stack-atomic.test.js
 *
 * Pressing a chip's Stack button is one gesture: placing the stack, running
 * its initialize (which pulls the chips in) and moving the chips commit as a
 * single menu:chip.Stack operation, so one undo puts the table back.
 *
 * Runs the real chip.svg, stack.svg and container.js through the real
 * events.js, with the same small stub App/UI supply.test.js uses.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import * as Toys from '../../src/toys.js'
import * as Events from '../../src/events.js'
import { getOps } from '../../src/op_dag.js'

const { TOYS_LAYER, addToyDom, activateToyScripts, invokeMenuAction, undoToyGesture, redoToyGesture,
        _clearSvgTextCache, _resetToyScriptState } = Toys

const SVG_NS  = 'http://www.w3.org/2000/svg'
const TABLE   = 'stack-table'
const AUTHOR  = 'tester'
const TOY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/toy')
const read = (f) => fs.readFileSync(path.join(TOY_DIR, f), 'utf8')
const FILES = { 'toy/chip.svg': 'chip.svg', 'toy/stack.svg': 'stack.svg', 'toy/js/container.js': 'js/container.js' }

let unbind
beforeEach(() => {
  localStorage.clear()
  _clearSvgTextCache()
  _resetToyScriptState()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (!FILES[url]) throw new Error(`unexpected fetch: ${url}`)
    return { ok: true, text: async () => read(FILES[url]) }
  }))
})
afterEach(() => { unbind?.(); vi.unstubAllGlobals() })

async function setup({ warmStack = true } = {}) {
  const ydoc = new Y.Doc()
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)

  const place = (id, x) => addToyDom(ydoc, layerEl, { id, toyType: 'chip', x, y: 300, color: '#dd2222' }, read('chip.svg'))
  const a = place('chipA', 100)
  const b = place('chipB', 112)
  a.setAttribute('data-below', 'chipB'); a.setAttribute('data-above', '')
  b.setAttribute('data-above', 'chipA'); b.setAttribute('data-below', '')

  await activateToyScripts(ydoc, 'chip')
  if (warmStack) await activateToyScripts(ydoc, 'stack')

  const logs = []
  const fakeApp = {
    getYdoc: () => ydoc, user: { id: AUTHOR }, getTableId: () => TABLE,
    addLog: (msg, kind) => logs.push({ msg, kind }),
    getSelectedIds: () => [], clearSelection: () => {},
  }
  const svgEl = { querySelector: (sel) => sel === '#toys-layer' ? layerEl : layerEl.querySelector(sel) }
  unbind = Events.init(fakeApp, svgEl, Toys, { toast: () => {}, refreshFromDoc: () => {} })

  const ops = () => [...getOps(ydoc, TOYS_LAYER).values()].sort((x, y) => x.ts - y.ts)
  const topLevel = () => [...layerEl.children].map(e => e.getAttribute('data-id'))
  const pressStack = () => invokeMenuAction(ydoc, layerEl, a, 'chip', 'Stack', undefined, AUTHOR, TABLE)
  return { ydoc, layerEl, ops, topLevel, pressStack, logs }
}

describe('Stack on two chips', () => {
  test('is one operation, named for the button, that holds the stack and the chips moving in', async () => {
    const t = await setup()
    t.pressStack()

    const made = t.ops()
    expect(made.map(o => o.gesture)).toEqual(['menu:chip.Stack'])
    const stackEl = t.layerEl.querySelector('[data-toy-type="stack"]')
    expect(stackEl).not.toBeNull()
    expect(t.topLevel()).toEqual([stackEl.getAttribute('data-id')])
    expect(stackEl.querySelectorAll(':scope .tt_contents > .toy').length).toBe(2)
  })

  test('the sum updates as a text edit, not a replaced text node, so a peer never doubles it', async () => {
    const t = await setup()
    t.pressStack()
    const tspan = t.layerEl.querySelector('[data-toy-type="stack"] .tspan_sum')
    expect(tspan.childNodes.length).toBe(1)
    const sumId = tspan.getAttribute('data-id')
    const wire = t.ops().flatMap(o => o.mutations ?? [])
    const asChild = wire.filter(m => m.t === 'child' && m.target?.id === sumId)
    expect(asChild).toEqual([])
  })

  test('one undo puts both chips back on the table and removes the stack', async () => {
    const t = await setup()
    t.pressStack()
    expect(undoToyGesture(t.ydoc, t.layerEl, TABLE, AUTHOR)).toBeTruthy()

    expect(t.topLevel().sort()).toEqual(['chipA', 'chipB'])
    expect(t.layerEl.querySelector('[data-toy-type="stack"]')).toBeNull()
  })

  test('redo brings the stack back with the chips inside it', async () => {
    const t = await setup()
    t.pressStack()
    undoToyGesture(t.ydoc, t.layerEl, TABLE, AUTHOR)
    expect(redoToyGesture(t.ydoc, t.layerEl, TABLE, AUTHOR)).toBeTruthy()

    const stackEl = t.layerEl.querySelector('[data-toy-type="stack"]')
    expect(t.topLevel()).toEqual([stackEl.getAttribute('data-id')])
    expect(stackEl.querySelectorAll(':scope .tt_contents > .toy').length).toBe(2)
  })

  test('when the stack toy is not loaded yet it is still placed, as separate operations, and says so', async () => {
    const t = await setup({ warmStack: false })
    t.pressStack()
    await vi.waitFor(() => expect(t.layerEl.querySelector('[data-toy-type="stack"]')).not.toBeNull())
    await vi.waitFor(() => expect(t.layerEl.querySelectorAll('[data-toy-type="stack"] .tt_contents > .toy').length).toBe(2))

    expect(t.ops().map(o => o.gesture)).toEqual(expect.arrayContaining(['place', 'initialize']))
    expect(t.logs.some(l => /not loaded/.test(l.msg))).toBe(true)
  })
})
