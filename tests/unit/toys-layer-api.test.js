/**
 * tests/unit/toys-layer-api.test.js
 *
 * The toys LayerAPI is what app.js dispatches through. Its contract: what
 * find() returns is what every other method accepts. It now returns a
 * rendered <g>, reads come from the DOM, and writes are DOM mutations run
 * under an envelope so they still reach Yjs.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  makeLayerAPI, projectLayer, placeToy, addToy, render, findToy, getTtState,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'
import { getHead } from '../../src/op_head.js'
import { apply as applyWire, invert } from '../../src/op_wire_mutation.js'

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

/** A live doc plus its rendered layer, wired the way app.js wires them. */
async function setup(...toys) {
  const ydoc  = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')
  for (const [id, toyType] of toys) {
    await addToy(ydoc, yToys, { id, toyType, x: 100, y: 100, color: '#ffffff' })
  }
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  render(yToys, layerEl)
  await new Promise(r => setTimeout(r, 0))

  const L = makeLayerAPI(ydoc, () => layerEl, 'user-a')
  return { ydoc, yToys, layerEl, L }
}

describe('find', () => {
  test('returns the rendered <g>, not a Yjs node', async () => {
    const { L } = await setup(['die1', 'dice_d6'])
    const el = L.find('die1')
    expect(el.nodeType).toBe(1)
    expect(el.localName).toBe('g')
    expect(el.getAttribute('data-toy-id')).toBe('die1')
  })

  test('null for an unknown id', async () => {
    const { L } = await setup(['die1', 'dice_d6'])
    expect(L.find('nope')).toBeNull()
  })

  test('resolves against the layer as it is now, not as it was at construction', async () => {
    const { L, ydoc, yToys, layerEl } = await setup(['die1', 'dice_d6'])
    await addToy(ydoc, yToys, { id: 'die2', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    render(yToys, layerEl)
    expect(L.find('die2')).toBeTruthy()
  })
})

describe('reads come from the DOM', () => {
  test('getTtState matches the Yjs original', async () => {
    const { L, yToys } = await setup(['die1', 'dice_d6'])
    expect(L.getTtState(L.find('die1'))).toEqual(getTtState(findToy(yToys, 'die1')))
  })

  test('listData lists placed toys', async () => {
    const { L } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    expect(L.listData().map(d => d.id).sort()).toEqual(['die1', 'tray1'])
  })

  test('getGeom and getAnchor accept what find returns', async () => {
    const { L } = await setup(['die1', 'dice_d6'])
    const el = L.find('die1')
    expect(L.getGeom(el)).toBeTruthy()
    expect(L.getAnchor(el)).toBeTruthy()
  })
})

describe('writes mutate the DOM and reach Yjs', () => {
  test('applyMoveCommit moves the toy and persists', async () => {
    const { L, yToys, layerEl } = await setup(['die1', 'dice_d6'])
    L.applyMoveCommit(L.find('die1'), 300, 400)

    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 300, cy: 400 })

    const fresh = document.createElementNS(SVG_NS, 'g')
    fresh.id = 'toys-layer'
    render(yToys, fresh)
    expect(getTtState(findToy(yToys, 'die1'))).toMatchObject({ cx: 300, cy: 400 })
  })

  test('applyResize resizes and persists', async () => {
    const { L, yToys } = await setup(['tray1', 'tray_sum'])
    L.applyResize(L.find('tray1'), 10, 20, 300, 200)

    const svgEl = L.find('tray1').querySelector('svg')
    expect(svgEl.getAttribute('width')).toBe('300')

    const ySvg = findToy(yToys, 'tray1').toArray()[0]
    expect(ySvg.getAttribute('width')).toBe('300')
  })

  test('edit changes colour and persists', async () => {
    const { L, yToys } = await setup(['die1', 'dice_d6'])
    L.edit(L.find('die1'), { color: '#123456' })

    expect(L.getTtState(L.find('die1')).color).toBe('#123456')
    expect(findToy(yToys, 'die1').getAttribute('data-color')).toBe('#123456')
  })

  test('delete removes the toy and persists', async () => {
    const { L, yToys } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    L.delete('die1')

    expect(L.find('die1')).toBeNull()
    expect(findToy(yToys, 'die1')).toBeFalsy()
    expect(findToy(yToys, 'tray1')).toBeTruthy()
  })

  test('a move survives a re-render from Yjs', async () => {
    const { L, yToys, layerEl } = await setup(['die1', 'dice_d6'])
    L.applyMoveCommit(L.find('die1'), 250, 175)
    render(yToys, layerEl)
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 250, cy: 175 })
  })
})

describe('a peer receives what the LayerAPI wrote', () => {
  test('an edit syncs to a second doc', async () => {
    const { L, ydoc } = await setup(['die1', 'dice_d6'])
    L.edit(L.find('die1'), { color: '#abcdef' })

    const peer = new Y.Doc()
    Y.applyUpdate(peer, Y.encodeStateAsUpdate(ydoc))
    expect(findToy(peer.getXmlFragment('toys'), 'die1').getAttribute('data-color')).toBe('#abcdef')
  })
})

describe('gestures also land in the operation log', () => {
  const TABLE = 'test-table'

  beforeEach(() => localStorage.clear())

  async function withLog(...toys) {
    const { ydoc, yToys, layerEl } = await setup(...toys)
    return { ydoc, yToys, layerEl, L: makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE) }
  }

  test('a move appends an operation and advances the head', async () => {
    const { ydoc, L } = await withLog(['die1', 'dice_d6'])
    expect(getHead(TABLE)).toBeNull()

    L.applyMoveCommit(L.find('die1'), 300, 400)

    const ops = [...getOps(ydoc).values()]
    expect(ops.length).toBe(1)
    expect(ops[0].gesture).toBe('move')
    expect(ops[0].authorId).toBe('user-a')
    expect(ops[0].mutations.length).toBeGreaterThan(0)
    expect(getHead(TABLE)).toBe(ops[0].id)
  })

  test('a second gesture parents onto the first', async () => {
    const { ydoc, L } = await withLog(['die1', 'dice_d6'])
    L.applyMoveCommit(L.find('die1'), 10, 10)
    const first = getHead(TABLE)
    L.applyMoveCommit(L.find('die1'), 20, 20)
    const second = getHead(TABLE)

    expect(second).not.toBe(first)
    expect(getOps(ydoc).get(second).parents).toEqual([first])
  })

  test('the recorded mutations replay onto a peer', async () => {
    const { ydoc, layerEl, L } = await withLog(['die1', 'dice_d6'])
    L.applyMoveCommit(L.find('die1'), 250, 175)

    const op = getOps(ydoc).get(getHead(TABLE))
    const peer = layerEl.cloneNode(true)
    // undo the move on the clone so it stands at the pre-gesture state
    applyWire(invert(op.mutations), peer)
    applyWire(op.mutations, peer)

    expect(peer.querySelector('[data-toy-id="die1"] > svg').getAttribute('x'))
      .toBe(layerEl.querySelector('[data-toy-id="die1"] > svg').getAttribute('x'))
  })

  test('without a tableId, no operation is recorded', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a')  // no tableId
    L.applyMoveCommit(L.find('die1'), 5, 5)
    expect([...getOps(ydoc).values()].length).toBe(0)
  })

  test('a delete is recorded too', async () => {
    const { ydoc, L } = await withLog(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    L.delete('die1')
    const op = getOps(ydoc).get(getHead(TABLE))
    expect(op.gesture).toBe('delete')
  })
})

describe('projectLayer', () => {
  const TABLE = 'proj-table'
  beforeEach(() => localStorage.clear())

  test('an empty log takes genesis from the Yjs tree', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    const before = layerEl.innerHTML

    const head = projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })

    const ops = [...getOps(ydoc).values()]
    expect(ops.length).toBe(1)
    expect(ops[0].gesture).toBe('checkpoint')
    expect(head).toBe(ops[0].id)
    expect(getHead(TABLE)).toBe(head)
    expect(layerEl.innerHTML).toBe(before)
  })

  test('genesis reproduces the layer on a peer that has only the log', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })

    const fresh = document.createElementNS(SVG_NS, 'g')
    fresh.id = 'toys-layer'
    projectLayer(ydoc, fresh, { tableId: 'peer-table', authorId: 'user-b' })

    expect(fresh.innerHTML).toBe(layerEl.innerHTML)
  })

  test('projecting twice is idempotent', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    const once = layerEl.innerHTML
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    expect(layerEl.innerHTML).toBe(once)
  })

  test('a gesture after genesis projects onto a fresh layer', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })

    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE)
    L.applyMoveCommit(L.find('die1'), 321, 123)

    const fresh = document.createElementNS(SVG_NS, 'g')
    fresh.id = 'toys-layer'
    projectLayer(ydoc, fresh, { tableId: TABLE, authorId: 'user-a' })

    expect(fresh.querySelector('[data-toy-id="die1"] > svg').getAttribute('x'))
      .toBe(layerEl.querySelector('[data-toy-id="die1"] > svg').getAttribute('x'))
  })

  test('genesis is written once, not on every projection', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    expect([...getOps(ydoc).values()].filter(o => o.gesture === 'checkpoint').length).toBe(1)
  })
})

describe('placeToy', () => {
  const TABLE = 'place-table'
  beforeEach(() => localStorage.clear())

  const emptyLayer = () => {
    const el = document.createElementNS(SVG_NS, 'g')
    el.id = 'toys-layer'
    return el
  }

  test('places into the DOM and records an operation', async () => {
    const ydoc = new Y.Doc()
    const layerEl = emptyLayer()
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })

    await placeToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 50, y: 50, color: '#fff' },
                   { authorId: 'user-a', tableId: TABLE })

    expect(layerEl.querySelector('[data-toy-id="die1"]')).toBeTruthy()
    const op = getOps(ydoc).get(getHead(TABLE))
    expect(op.gesture).toBe('place')
    expect(op.mutations.length).toBeGreaterThan(0)
  })

  test('the placement projects onto a peer holding only the log', async () => {
    const ydoc = new Y.Doc()
    const layerEl = emptyLayer()
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    await placeToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 50, y: 50, color: '#fff' },
                   { authorId: 'user-a', tableId: TABLE })

    const peer = emptyLayer()
    projectLayer(ydoc, peer, { tableId: 'peer', authorId: 'user-b' })
    expect(peer.innerHTML).toBe(layerEl.innerHTML)
  })

  test('placing two toys yields two operations in sequence', async () => {
    const ydoc = new Y.Doc()
    const layerEl = emptyLayer()
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    for (const id of ['die1', 'die2']) {
      await placeToy(ydoc, layerEl, { id, toyType: 'dice_d6', x: 10, y: 10, color: '#fff' },
                     { authorId: 'user-a', tableId: TABLE })
    }
    const placements = [...getOps(ydoc).values()].filter(o => o.gesture === 'place')
    expect(placements.length).toBe(2)
    expect(layerEl.querySelectorAll('[data-toy-id]').length).toBe(2)
  })
})
