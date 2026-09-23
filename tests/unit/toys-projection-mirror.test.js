// @vitest-environment jsdom
/**
 * tests/unit/toys-projection-mirror.test.js
 *
 * The toys layer is on the op log: the live DOM is one projection of it,
 * and projectFrom from a fresh scratch layer must produce a byte-identical
 * one. If it doesn't, something wrote to the live layer outside an
 * envelope — the same class of leak CONCURRENCY_AND_BRANCHING.md's model
 * exists to rule out, and the one this task's other five commits remove
 * from the drawing/boundaries layers.
 *
 * Runs a real sequence of gestures (place, move, resize, rotate, edit,
 * delete, reparent, menu action) through the LayerAPI / runGesture, then
 * compares serializeNode() of every child between the live layer and a
 * scratch layer projected from the recorded op log.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  placeToy, makeLayerAPI, activateAllToyScriptsDom, runGesture,
  reparentToyDom, applyMoveDom, getMenuActions, invokeMenuAction,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'
import { projectFrom } from '../../src/op_checkpoint.js'
import { getHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

const TABLE  = 'projection-mirror-table'
const AUTHOR = 'user-a'

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice; delete globalThis.d6
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

test(
  'projectFrom onto a scratch layer is byte-identical to the live layer after a full gesture sequence',
  async () => {
    const ydoc    = new Y.Doc()
    const layerEl = freshLayer()

    // place
    await placeToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' },
      { authorId: AUTHOR, tableId: TABLE })
    await placeToy(ydoc, layerEl, { id: 'die2', toyType: 'dice_d6', x: 40, y: 40, color: '#fff' },
      { authorId: AUTHOR, tableId: TABLE })
    await placeToy(ydoc, layerEl, { id: 'tray1', toyType: 'tray_sum', x: 100, y: 100, color: '#fff' },
      { authorId: AUTHOR, tableId: TABLE })

    activateAllToyScriptsDom(ydoc, layerEl)
    await new Promise(r => setTimeout(r, 0))

    const L = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE)

    // move
    L.applyMoveCommit(L.find('die1'), 60, 60)
    // resize
    L.applyResize(L.find('tray1'), 100, 100, 260, 180)
    // rotate
    L.applyRotate(L.find('die1'), 45)
    // edit
    L.edit(L.find('die1'), { color: '#123456' })
    // delete
    L.delete('die2')

    // reparent into a container — one atomic gesture, same shape as
    // commitMove's drop-into-tray composition.
    const containerEl = layerEl.querySelector('[data-id="tray1"]')
    runGesture(ydoc, layerEl, () => {
      reparentToyDom(layerEl, 'die1', 'tray1')
      applyMoveDom(layerEl.querySelector('[data-id="die1"]'), 10, 10)
    }, { gesture: 'reparent', authorId: AUTHOR, tableId: TABLE })

    // menu action
    const dieEl = layerEl.querySelector('[data-id="die1"]')
    const roll  = getMenuActions(dieEl).find(a => a.eventName === 'die_roll')
    invokeMenuAction(ydoc, layerEl, dieEl, roll.namespace, roll.key, undefined, AUTHOR, TABLE)

    // Project the recorded log onto a fresh scratch layer and compare.
    const scratch = freshLayer()
    projectFrom(scratch, getOps(ydoc), getHead(TABLE))

    const liveChildren    = [...layerEl.children].map(serializeNode)
    const scratchChildren = [...scratch.children].map(serializeNode)
    expect(scratchChildren).toEqual(liveChildren)
  },
)
