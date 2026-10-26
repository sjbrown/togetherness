// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { test, expect, vi, afterEach } from 'vitest'
import { ensureLayerId } from '../../src/op_layers.js'
import * as Toys from '../../src/toys.js'
import * as Events from '../../src/events.js'
import { getOps } from '../../src/op_dag.js'
import * as OpLayer from '../../src/op_layer.js'

const { TOYS_LAYER, addToyDom, activateToyScripts, invokeMenuAction, _clearSvgTextCache, _resetToyScriptState } = Toys
const SVG_NS = 'http://www.w3.org/2000/svg'
const TOY_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/toy')
const read = (f) => fs.readFileSync(path.join(TOY_DIR, f), 'utf8')
const FILES = { 'toy/chip.svg': 'chip.svg', 'toy/stack.svg': 'stack.svg', 'toy/js/container.js': 'js/container.js' }

afterEach(() => vi.unstubAllGlobals())

function mk(ydoc) {
  const layerEl = document.createElementNS(SVG_NS, 'g'); layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)
  const place = (id, x) => addToyDom(ydoc, layerEl, { id, toyType: 'chip', x, y: 300, color: '#dd2222' }, read('chip.svg'))
  const a = place('chipA', 100), b = place('chipB', 112)
  a.setAttribute('data-below', 'chipB'); a.setAttribute('data-above', '')
  b.setAttribute('data-above', 'chipA'); b.setAttribute('data-below', '')
  return { layerEl, a }
}
/**
 * An entry that adds a node must carry it as it was when it was inserted,
 * because the entries after it replay the node's later history on top.
 */
test("a peer receiving the Stack operation ends up with the same toys and sum as the peer that pressed it", async () => {
  _clearSvgTextCache(); _resetToyScriptState()
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, text: async () => read(FILES[url]) })))
  const ydoc = new Y.Doc()
  const P2 = mk(ydoc)
  await activateToyScripts(ydoc, 'chip'); await activateToyScripts(ydoc, 'stack')
  const P1 = mk(new Y.Doc())
  const fakeApp = { getYdoc: () => ydoc, user: { id: 'p2' }, getTableId: () => 'T', addLog() {}, getSelectedIds: () => [], clearSelection() {} }
  const unbind = Events.init(fakeApp, { querySelector: (s) => s === '#toys-layer' ? P2.layerEl : P2.layerEl.querySelector(s) }, Toys, { toast() {}, refreshFromDoc() {} })
  invokeMenuAction(ydoc, P2.layerEl, P2.a, 'chip', 'Stack', undefined, 'p2', 'T')
  unbind()

  const ops = [...getOps(ydoc, TOYS_LAYER).values()].sort((x, y) => x.ts - y.ts)
  for (const o of ops) OpLayer.receiveLayerOp(ydoc, TOYS_LAYER, P1.layerEl, o.id, 'T2')

  const toys = (peer) => [...peer.layerEl.querySelectorAll('.toy')]
    .map(e => `${e.getAttribute('data-id')} in ${e.parentNode.closest('.toy')?.getAttribute('data-id') ?? 'layer'}`).sort()
  const sum = (peer) => peer.layerEl.querySelector('.tspan_sum').textContent
  expect(sum(P2)).toBe('10')
  expect(toys(P2).length).toBe(3)
  expect(toys(P1)).toEqual(toys(P2))
  expect(sum(P1)).toBe(sum(P2))
})
