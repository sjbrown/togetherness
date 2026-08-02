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
  resolveToyBranchConflict, buildToyForkSeed, adoptToyBranch,
  undoToyGesture, redoToyGesture, deleteToysBatch, moveToysBatch,
  canUndoToyGesture, canRedoToyGesture,
  getGeom, reparentToyDom, applyMoveDom, runGestureSync, importToys,
  clearYNodeMap, _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps, appendOp } from '../../src/op_dag.js'
import { checkpointOp, projectFrom } from '../../src/op_checkpoint.js'
import { getHead, setHead } from '../../src/op_head.js'
import { apply as applyWire, invert } from '../../src/op_wire_mutation.js'
import { populateFromSvgDoc } from '../../src/storage.js'

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

describe('importToys — live-table SVG import (REVISION_PLAN.md C5)', () => {
  const TABLE = 'import-table'
  beforeEach(() => localStorage.clear())

  function foreignSvgRoot(toysInner) {
    return new DOMParser().parseFromString(
      `<svg xmlns="${SVG_NS}"><g id="toys-layer">${toysInner}</g><g id="drawing-layer"></g></svg>`,
      'image/svg+xml').documentElement
  }

  const FOREIGN_TOY_G = `<g class="toy" data-toy-id="t1" data-toy-type="imported_toy">
      <svg x="0" y="0" width="64" height="64" viewBox="0 0 80 100"><circle r="5"/></svg>
    </g>`

  test('imported toys land on the live head as a real op, not a dead Yjs write', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
    const before = getHead(TABLE)

    const { importedToyEls } = populateFromSvgDoc(foreignSvgRoot(FOREIGN_TOY_G), ydoc)
    importToys(ydoc, layerEl, importedToyEls, { authorId: 'user-a', tableId: TABLE })

    expect(getHead(TABLE)).not.toBe(before)
    const op = getOps(ydoc).get(getHead(TABLE))
    expect(op.gesture).toBe('import')
    expect(op.parents).toEqual([before])
    expect(layerEl.querySelector('[data-toy-id="t1"]')).not.toBeNull()
  })

  test('a peer who only has the op log sees the imported toy too', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })

    const { importedToyEls } = populateFromSvgDoc(foreignSvgRoot(FOREIGN_TOY_G), ydoc)
    importToys(ydoc, layerEl, importedToyEls, { authorId: 'user-a', tableId: TABLE })

    const fresh = document.createElementNS(SVG_NS, 'g')
    fresh.id = 'toys-layer'
    projectLayer(ydoc, fresh, { tableId: 'peer-table', authorId: 'user-b' })

    expect(fresh.querySelector('[data-toy-id="t1"]')).not.toBeNull()
  })

  test('no valid toys to import records no operation', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
    const before = getHead(TABLE)

    importToys(ydoc, layerEl, [], { authorId: 'user-a', tableId: TABLE })

    expect(getHead(TABLE)).toBe(before)
  })
})

describe('projectLayer', () => {
  const TABLE = 'proj-table'
  beforeEach(() => localStorage.clear())

  test('an empty log takes genesis from the Yjs tree', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    const before = layerEl.innerHTML

    const head = projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })

    const ops = [...getOps(ydoc).values()]
    expect(ops.length).toBe(1)
    expect(ops[0].gesture).toBe('checkpoint')
    expect(head).toBe(ops[0].id)
    expect(getHead(TABLE)).toBe(head)
    expect(layerEl.innerHTML).toBe(before)
  })

  test('genesis reproduces the layer on a peer that has only the log', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'], ['tray1', 'tray_sum'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })

    const fresh = document.createElementNS(SVG_NS, 'g')
    fresh.id = 'toys-layer'
    projectLayer(ydoc, fresh, { tableId: 'peer-table', authorId: 'user-b' })

    expect(fresh.innerHTML).toBe(layerEl.innerHTML)
  })

  test('projecting twice is idempotent', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
    const once = layerEl.innerHTML
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a' })
    expect(layerEl.innerHTML).toBe(once)
  })

  test('a gesture after genesis projects onto a fresh layer', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })

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
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
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
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })

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
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
    await placeToy(ydoc, layerEl, { id: 'die1', toyType: 'dice_d6', x: 50, y: 50, color: '#fff' },
                   { authorId: 'user-a', tableId: TABLE })

    const peer = emptyLayer()
    projectLayer(ydoc, peer, { tableId: 'peer', authorId: 'user-b' })
    expect(peer.innerHTML).toBe(layerEl.innerHTML)
  })

  test('placing two toys yields two operations in sequence', async () => {
    const ydoc = new Y.Doc()
    const layerEl = emptyLayer()
    projectLayer(ydoc, layerEl, { tableId: TABLE, authorId: 'user-a', isCreator: true })
    for (const id of ['die1', 'die2']) {
      await placeToy(ydoc, layerEl, { id, toyType: 'dice_d6', x: 10, y: 10, color: '#fff' },
                     { authorId: 'user-a', tableId: TABLE })
    }
    const placements = [...getOps(ydoc).values()].filter(o => o.gesture === 'place')
    expect(placements.length).toBe(2)
    expect(layerEl.querySelectorAll('[data-toy-id]').length).toBe(2)
  })
})

describe('L.render is projectLayer, gated by isCreator', () => {
  const TABLE = 'layerapi-render-table'
  beforeEach(() => localStorage.clear())

  test('a creator LayerAPI renders and takes genesis', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)

    const head = L.render(layerEl)

    expect(head).toBe(getHead(TABLE))
    expect([...getOps(ydoc).values()][0].gesture).toBe('checkpoint')
  })

  test('a non-creator LayerAPI on a fresh table renders nothing and does not fork', async () => {
    const ydoc = new Y.Doc()
    const layerEl = document.createElementNS(SVG_NS, 'g')
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-b', TABLE, false)

    expect(L.render(layerEl)).toBeNull()
    expect([...getOps(ydoc).values()].length).toBe(0)
  })

  test('a second L.render call by the creator does not re-derive genesis', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)
    L.render(layerEl)
    expect([...getOps(ydoc).values()].filter(o => o.gesture === 'checkpoint').length).toBe(1)
  })

  test('a gesture through the LayerAPI, then L.render again, keeps the DOM live rather than reprojecting stale', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)

    L.applyMoveCommit(L.find('die1'), 42, 42)
    L.render(layerEl)

    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 42, cy: 42 })
  })
})

describe('creator vs joiner — the human protocol the boot race was missing', () => {
  const TABLE = 'race-table'
  beforeEach(() => localStorage.clear())

  test('a joiner with an empty log takes no genesis and returns null', async () => {
    const b = new Y.Doc()
    const result = projectLayer(b, document.createElementNS(SVG_NS, 'g'),
      { tableId: 'peerB', authorId: 'bob', isCreator: false })

    expect(result).toBeNull()
    expect([...getOps(b).values()].length).toBe(0)
  })

  test('only the creator mints a genesis; the joiner ends up on the same one after sync', async () => {
    const a = new Y.Doc()  // creator
    const b = new Y.Doc()  // joiner

    const aLayer = document.createElementNS(SVG_NS, 'g')
    const bLayer = document.createElementNS(SVG_NS, 'g')

    // Real boot order: both render locally before any network activity.
    const aHead = projectLayer(a, aLayer, { tableId: 'peerA', authorId: 'alice', isCreator: true })
    const bHead = projectLayer(b, bLayer, { tableId: 'peerB', authorId: 'bob', isCreator: false })

    expect(aHead).not.toBeNull()
    expect(bHead).toBeNull()  // waiting, correctly

    // Now they sync, as they would over WebRTC.
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b))

    const ops = getOps(a)
    expect([...ops.values()].filter(o => o.gesture === 'checkpoint').length).toBe(1)

    // The joiner's next render (triggered by the ops-Map observer in real
    // app.js — see onOpsChanged) finds the real genesis and projects it.
    const bHeadAfterSync = projectLayer(b, bLayer, { tableId: 'peerB', authorId: 'bob', isCreator: false })
    expect(bHeadAfterSync).toBe(aHead)
    expect(bLayer.innerHTML).toBe(aLayer.innerHTML)
  })

  test('two peers both flagged as creator would still fork — isCreator has to come from the URL, not be assumed', async () => {
    // This is the failure mode the fix removes production's access to,
    // not one it makes impossible in the abstract: if two sessions both
    // computed isCreator=true for the same table id, they would still
    // fork. The guarantee is behavioural (exactly one browser session
    // ever fails to find a hash in its URL for a given table), not
    // enforced by this function.
    const a = new Y.Doc()
    const b = new Y.Doc()
    projectLayer(a, document.createElementNS(SVG_NS, 'g'), { tableId: 'x', authorId: 'alice', isCreator: true })
    projectLayer(b, document.createElementNS(SVG_NS, 'g'), { tableId: 'y', authorId: 'bob', isCreator: true })
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    expect([...getOps(b).values()].filter(o => o.gesture === 'checkpoint').length).toBe(2)
  })
})

describe('resolveToyBranchConflict', () => {
  function fork(ydoc) {
    // L -> a1(alice, leader tip) / L -> s1(bob) -> s2(clyde) (splitter tip)
    const base = document.createElementNS(SVG_NS, 'g')
    base.innerHTML = '<rect data-id="r" x="0"/>'
    const L = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendOp(ydoc, L)
    const a1 = { id: 'a1', parents: ['L'], authorId: 'alice', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '1' }] }
    const s1 = { id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '2' }] }
    const s2 = { id: 's2', parents: ['s1'], authorId: 'clyde', gesture: 'move', ts: 2,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '2', newValue: '3' }] }
    appendOp(ydoc, a1); appendOp(ydoc, s1); appendOp(ydoc, s2)
    return { tips: ['a1', 's2'] }
  }

  test('the authoring contributor gets authoredSplitter: true with ready orderedIds', () => {
    const ydoc = new Y.Doc()
    const { tips } = fork(ydoc)
    const joinSequence = ['alice', 'bob', 'clyde']

    const out = resolveToyBranchConflict(ydoc, tips, { authorId: 'bob', joinSequence })
    expect(out.leader).toBe('a1')
    expect(out.splitter).toBe('s2')
    expect(out.lca).toBe('L')
    expect(out.authoredSplitter).toBe(true)
    expect(out.orderedIds).toEqual(['bob', 'clyde'])
  })

  test('a bystander who touched neither branch gets authoredSplitter: false', () => {
    const ydoc = new Y.Doc()
    const { tips } = fork(ydoc)
    const out = resolveToyBranchConflict(ydoc, tips, { authorId: 'zoe', joinSequence: ['alice', 'bob', 'clyde'] })
    expect(out.authoredSplitter).toBe(false)
    expect(out.orderedIds).toBeUndefined()
  })

  test('the leader author is also just a bystander to the splitter', () => {
    const ydoc = new Y.Doc()
    const { tips } = fork(ydoc)
    const out = resolveToyBranchConflict(ydoc, tips, { authorId: 'alice', joinSequence: ['alice', 'bob', 'clyde'] })
    expect(out.authoredSplitter).toBe(false)
  })

  test('label does not depend on argument order', () => {
    const ydoc = new Y.Doc()
    const { tips } = fork(ydoc)
    const joinSequence = ['alice', 'bob', 'clyde']
    const forward = resolveToyBranchConflict(ydoc, [tips[0], tips[1]], { authorId: 'zoe', joinSequence })
    const reversed = resolveToyBranchConflict(ydoc, [tips[1], tips[0]], { authorId: 'zoe', joinSequence })
    expect(forward.leader).toBe(reversed.leader)
    expect(forward.splitter).toBe(reversed.splitter)
  })
})

describe('buildToyForkSeed', () => {
  test('produces a genesis at the LCA plus the splitter ops, ready for forkLiveDoc', () => {
    const ydoc = new Y.Doc()
    const base = document.createElementNS(SVG_NS, 'g')
    base.innerHTML = '<rect data-id="r" x="0"/>'
    const L = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendOp(ydoc, L)
    const s1 = { id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '9' }] }
    appendOp(ydoc, s1)

    const { genesis, rebasedOps } = buildToyForkSeed(ydoc, 'L', 's1', { authorId: 'bob', joinSequence: ['alice', 'bob'] })

    expect(genesis.parents).toEqual([])
    expect(rebasedOps[0].parents).toEqual([genesis.id])

    const seeded = new Map([[genesis.id, genesis], ...rebasedOps.map(o => [o.id, o])])
    const layer = document.createElementNS(SVG_NS, 'g')
    projectFrom(layer, seeded, 's1')
    expect(layer.querySelector('[data-id="r"]').getAttribute('x')).toBe('9')
  })
})

describe('adoptToyBranch', () => {
  const TABLE = 'adopt-table'
  beforeEach(() => localStorage.clear())

  function fork(ydoc) {
    const base = document.createElementNS(SVG_NS, 'g')
    base.innerHTML = '<rect data-id="r" x="0"/>'
    const L = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendOp(ydoc, L)
    const a1 = { id: 'a1', parents: ['L'], authorId: 'alice', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '11' }] }
    const s1 = { id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '22' }] }
    appendOp(ydoc, a1); appendOp(ydoc, s1)
    return { leader: 'a1', splitter: 's1' }
  }

  test('moves the DOM from the current head to an unrelated target head', () => {
    const ydoc = new Y.Doc()
    const { splitter, leader } = fork(ydoc)
    const layerEl = document.createElementNS(SVG_NS, 'g')
    projectFrom(layerEl, getOps(ydoc), splitter)
    setHead(TABLE, splitter)
    expect(layerEl.querySelector('[data-id="r"]').getAttribute('x')).toBe('22')

    adoptToyBranch(ydoc, layerEl, leader, TABLE)

    expect(layerEl.querySelector('[data-id="r"]').getAttribute('x')).toBe('11')
    expect(getHead(TABLE)).toBe(leader)
  })

  test('works even with no prior local head at all', () => {
    const ydoc = new Y.Doc()
    const { leader } = fork(ydoc)
    const layerEl = document.createElementNS(SVG_NS, 'g')

    adoptToyBranch(ydoc, layerEl, leader, TABLE)

    expect(layerEl.querySelector('[data-id="r"]').getAttribute('x')).toBe('11')
    expect(getHead(TABLE)).toBe(leader)
  })
})

describe('conflict resolution end to end — resolve, adopt, and fork-seed agree', () => {
  const TABLE = 'e2e-conflict-table'
  beforeEach(() => localStorage.clear())

  function forkedHistory(ydoc) {
    const base = document.createElementNS(SVG_NS, 'g')
    base.innerHTML = '<rect data-id="r" x="0"/>'
    const L = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendOp(ydoc, L)
    const a1 = { id: 'a1', parents: ['L'], authorId: 'alice', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '99' }] }
    const s1 = { id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '55' }] }
    appendOp(ydoc, a1); appendOp(ydoc, s1)
  }

  test('a bystander (zoe) ends up viewing the leader after resolving', () => {
    const ydoc = new Y.Doc()
    forkedHistory(ydoc)
    const joinSequence = ['alice', 'bob', 'zoe']

    const decision = resolveToyBranchConflict(ydoc, ['a1', 's1'], { authorId: 'zoe', joinSequence })
    expect(decision.authoredSplitter).toBe(false)

    const layerEl = document.createElementNS(SVG_NS, 'g')
    adoptToyBranch(ydoc, layerEl, decision.leader, TABLE)
    expect(layerEl.querySelector('[data-id="r"]').getAttribute('x')).toBe('99')
  })

  test("bob (the splitter's author) gets a fork seed that reconstructs his own branch, and still ends up viewing the leader locally", () => {
    const ydoc = new Y.Doc()
    forkedHistory(ydoc)
    const joinSequence = ['alice', 'bob']

    const decision = resolveToyBranchConflict(ydoc, ['a1', 's1'], { authorId: 'bob', joinSequence })
    expect(decision.authoredSplitter).toBe(true)
    expect(decision.orderedIds).toEqual(['bob'])

    // Bob's local view still adopts the leader — the session never leaves
    // the shared table.
    const layerEl = document.createElementNS(SVG_NS, 'g')
    adoptToyBranch(ydoc, layerEl, decision.leader, TABLE)
    expect(layerEl.querySelector('[data-id="r"]').getAttribute('x')).toBe('99')

    // The fork seed independently reconstructs what Bob was actually
    // doing on the splitter branch. Authored to orderedIds[0] (§6.5),
    // not to Bob's own id directly — same thing when Bob is the only
    // contributor, but see the next test for why the distinction matters.
    const { genesis, rebasedOps } = buildToyForkSeed(
      ydoc, decision.lca, decision.splitter, { authorId: decision.orderedIds[0], joinSequence })
    const seeded = new Map([[genesis.id, genesis], ...rebasedOps.map(o => [o.id, o])])
    const forkLayer = document.createElementNS(SVG_NS, 'g')
    projectFrom(forkLayer, seeded, decision.splitter)
    expect(forkLayer.querySelector('[data-id="r"]').getAttribute('x')).toBe('55')
  })

  test('two contributors on the splitter branch compute a byte-identical genesis regardless of whose browser resolves it', () => {
    // Regression test: authoring the checkpoint to the resolving peer's
    // own identity (rather than orderedIds[0]) would make the genesis
    // *object* differ between contributors even though its content-derived
    // id matched — Bob's copy would carry authorId: 'bob', Clyde's would
    // carry authorId: 'clyde'. Syncing two forks at the same table id
    // would then leave Yjs's own last-writer-wins to arbitrarily settle
    // which one survives at that key, reintroducing the exact
    // peer-dependence §6.5 exists to remove.
    const ydoc = new Y.Doc()
    const base = document.createElementNS(SVG_NS, 'g')
    base.innerHTML = '<rect data-id="r" x="0"/>'
    const L = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendOp(ydoc, L)
    const a1 = { id: 'a1', parents: ['L'], authorId: 'alice', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '99' }] }
    // Both Bob and Clyde contributed to the splitter branch.
    const s1 = { id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '55' }] }
    const s2 = { id: 's2', parents: ['s1'], authorId: 'clyde', gesture: 'move', ts: 2,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '55', newValue: '66' }] }
    appendOp(ydoc, a1); appendOp(ydoc, s1); appendOp(ydoc, s2)
    const joinSequence = ['alice', 'bob', 'clyde']

    // Resolved once "on Bob's machine", once "on Clyde's" — same shared
    // ops, different local authorId for the bystander/splitter check.
    const asBob   = resolveToyBranchConflict(ydoc, ['a1', 's2'], { authorId: 'bob', joinSequence })
    const asClyde = resolveToyBranchConflict(ydoc, ['a1', 's2'], { authorId: 'clyde', joinSequence })
    expect(asBob.orderedIds).toEqual(asClyde.orderedIds) // shared, order-preserved: ['bob', 'clyde']

    const seedFromBob = buildToyForkSeed(
      ydoc, asBob.lca, asBob.splitter, { authorId: asBob.orderedIds[0], joinSequence })
    const seedFromClyde = buildToyForkSeed(
      ydoc, asClyde.lca, asClyde.splitter, { authorId: asClyde.orderedIds[0], joinSequence })

    expect(seedFromBob.genesis).toEqual(seedFromClyde.genesis)
    expect(seedFromBob.genesis.authorId).toBe('bob') // orderedIds[0], not whoever resolved it
  })
})

describe('undoToyGesture / redoToyGesture', () => {
  const TABLE = 'undo-table'
  beforeEach(() => localStorage.clear())

  async function seeded() {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl) // genesis
    return { ydoc, layerEl, L }
  }

  test('undoes my own last move, appending a real undo operation', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 500, 500)
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 500, cy: 500 })

    const op = undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(op).not.toBeNull()
    expect(op.gesture).toBe('undo:move')
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 100, cy: 100 })
  })

  test('redo restores what undo just undid', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 500, 500)
    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 100, cy: 100 })

    const op = redoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(op).not.toBeNull()
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 500, cy: 500 })
  })

  test('redo is a no-op when my last own operation was not an undo', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 500, 500)

    expect(redoToyGesture(ydoc, layerEl, TABLE, 'user-a')).toBeNull()
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 500, cy: 500 })
  })

  test('undo is null when I have never authored anything on this branch', async () => {
    const { ydoc, layerEl } = await seeded()
    expect(undoToyGesture(ydoc, layerEl, TABLE, 'someone-else')).toBeNull()
  })

  test('undo skips past another peer’s op to find my own', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 200, 200)          // mine
    const bobsLayerApi = makeLayerAPI(ydoc, () => layerEl, 'bob', TABLE, false)
    bobsLayerApi.edit(bobsLayerApi.find('die1'), { color: '#123456' }) // someone else's, most recent

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    // My move is undone; Bob's unrelated edit is untouched by it.
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 100, cy: 100, color: '#123456' })
  })

  test('undoing my own delete resurrects the toy — undo targets my MOST recent op, whatever it is', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 500, 500)
    L.delete('die1')
    expect(layerEl.querySelector('[data-toy-id="die1"]')).toBeNull()

    const op = undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(op).not.toBeNull()
    expect(layerEl.querySelector('[data-toy-id="die1"]')).not.toBeNull()
    // Resurrected at the position it held right before the delete — the
    // move is untouched; undo reversed the delete, not the move before it.
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 500, cy: 500 })
  })

  test('undo does nothing — no crash, no partial mutation — when the target no longer exists', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 500, 500)
    // Deleted by someone else, not me — my own most recent op is still
    // the move. If I'd deleted it myself, undo would (correctly) target
    // that delete instead, since it's my more recent action.
    const bobsLayerApi = makeLayerAPI(ydoc, () => layerEl, 'bob', TABLE, false)
    bobsLayerApi.delete('die1')

    const op = undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(op).toBeNull()
    expect(layerEl.querySelector('[data-toy-id="die1"]')).toBeNull()
  })

  test('undo/redo/undo/redo round-trips cleanly', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 300, 300)

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    redoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    redoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 300, cy: 300 })
  })

  test('redo tags its own operation "redo", not "undo"', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 300, 300)
    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    const redoOp = redoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(redoOp.gesture).toBe('redo:move')
  })

  test('repeated undo walks back through several real gestures instead of toggling one', async () => {
    // The actual bug: undo's search used to only skip checkpoints, so a
    // second press found the first undo (its own most recent op) and
    // inverted THAT -- redoing the first move instead of reversing an
    // earlier one. Three real moves, three undos, should land back at
    // the toy's original placed position -- not oscillate between the
    // last two.
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 200, 200)
    L.applyMoveCommit(L.find('die1'), 300, 300)
    L.applyMoveCommit(L.find('die1'), 400, 400)

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 300, cy: 300 })

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 200, cy: 200 })

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 100, cy: 100 })

    // Nothing further of mine to undo (only genesis, which is skipped).
    expect(undoToyGesture(ydoc, layerEl, TABLE, 'user-a')).toBeNull()
  })

  test('undo after a redo re-reverses the same gesture, skipping the redo op itself', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 200, 200)
    L.applyMoveCommit(L.find('die1'), 300, 300)

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a') // back to 200,200
    redoToyGesture(ydoc, layerEl, TABLE, 'user-a')  // forward to 300,300 again
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 300, cy: 300 })

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a') // should reach 200,200 again,
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 200, cy: 200 }) // not skip past it to 100,100
  })

  test('redo is exhausted after one use — pressing it again finds nothing', async () => {
    const { ydoc, layerEl, L } = await seeded()
    L.applyMoveCommit(L.find('die1'), 300, 300)
    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    redoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    // My most recent own op is now the redo itself — nothing newer has
    // been undone since, so a second redo press correctly finds nothing.
    expect(redoToyGesture(ydoc, layerEl, TABLE, 'user-a')).toBeNull()
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 300, cy: 300 })
  })

  test('undoing a container-drop restores both the canvas position and the top-level parent', async () => {
    // The real bug report: drag a die into a tray (one atomic gesture,
    // reparent + reposition together — exactly commitMove's own
    // composition, not the LayerAPI's plain applyMoveCommit), then undo.
    const { ydoc, layerEl } = await setup(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)

    const dieBefore = L.getTtState(L.find('die1'))

    const containerEl   = layerEl.querySelector('[data-id="tray1"]')
    const containerGeom = getGeom(containerEl)
    runGestureSync(ydoc, layerEl, () => {
      reparentToyDom(layerEl, 'die1', 'tray1')
      const movedEl = layerEl.querySelector('[data-id="die1"]')
      applyMoveDom(movedEl, 320 - containerGeom.x, 320 - containerGeom.y)
    }, { origin: 'envelope', gesture: 'reparent', authorId: 'user-a', tableId: TABLE })

    expect(layerEl.querySelector('[data-id="die1"]').closest('[data-id="tray1"]')).not.toBeNull()

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(layerEl.querySelector('[data-id="die1"]').closest('[data-id="tray1"]')).toBeNull()
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: dieBefore.cx, cy: dieBefore.cy })
  })
})

describe('deleteToysBatch / moveToysBatch — one op for a multi-select action', () => {
  const TABLE = 'batch-table'
  beforeEach(() => localStorage.clear())

  async function seededTwo() {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'], ['die2', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)
    return { ydoc, layerEl, L }
  }

  test('deletes several toys and appends exactly one operation', async () => {
    const { ydoc, layerEl } = await seededTwo()
    const before = [...getOps(ydoc).values()].length

    const op = deleteToysBatch(ydoc, layerEl, ['die1', 'die2'], { authorId: 'user-a', tableId: TABLE })

    expect(op).not.toBeNull()
    expect(op.gesture).toBe('delete-batch')
    expect([...getOps(ydoc).values()].length).toBe(before + 1)
    expect(layerEl.querySelectorAll('[data-toy-id]').length).toBe(0)
  })

  test('undo reverses the whole batch in one press', async () => {
    const { ydoc, layerEl } = await seededTwo()
    deleteToysBatch(ydoc, layerEl, ['die1', 'die2'], { authorId: 'user-a', tableId: TABLE })
    expect(layerEl.querySelectorAll('[data-toy-id]').length).toBe(0)

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(layerEl.querySelectorAll('[data-toy-id]').length).toBe(2)
  })

  test('null when every id in the batch is already gone', async () => {
    const { ydoc, layerEl } = await seededTwo()
    expect(deleteToysBatch(ydoc, layerEl, ['nope', 'also-nope'], { authorId: 'user-a', tableId: TABLE })).toBeNull()
  })

  test('moves several toys and appends exactly one operation', async () => {
    const { ydoc, layerEl, L } = await seededTwo()
    const before = [...getOps(ydoc).values()].length

    const op = moveToysBatch(ydoc, layerEl,
      [{ id: 'die1', x: 400, y: 400 }, { id: 'die2', x: 450, y: 450 }],
      { authorId: 'user-a', tableId: TABLE })

    expect(op).not.toBeNull()
    expect(op.gesture).toBe('move-batch')
    expect([...getOps(ydoc).values()].length).toBe(before + 1)
    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 400, cy: 400 })
    expect(L.getTtState(L.find('die2'))).toMatchObject({ cx: 450, cy: 450 })
  })

  test('a single undo reverses a whole multi-move', async () => {
    const { ydoc, layerEl, L } = await seededTwo()
    moveToysBatch(ydoc, layerEl,
      [{ id: 'die1', x: 400, y: 400 }, { id: 'die2', x: 450, y: 450 }],
      { authorId: 'user-a', tableId: TABLE })

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')

    expect(L.getTtState(L.find('die1'))).toMatchObject({ cx: 100, cy: 100 })
    expect(L.getTtState(L.find('die2'))).toMatchObject({ cx: 100, cy: 100 })
  })
})

describe('canUndoToyGesture / canRedoToyGesture — cheap existence checks', () => {
  const TABLE = 'can-table'
  beforeEach(() => localStorage.clear())

  test('false on a fresh table with nothing done', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)
    expect(canUndoToyGesture(ydoc, TABLE, 'user-a')).toBe(false)
    expect(canRedoToyGesture(ydoc, TABLE, 'user-a')).toBe(false)
  })

  test('true for undo after a real gesture; false for redo until an undo happens', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)
    L.applyMoveCommit(L.find('die1'), 300, 300)

    expect(canUndoToyGesture(ydoc, TABLE, 'user-a')).toBe(true)
    expect(canRedoToyGesture(ydoc, TABLE, 'user-a')).toBe(false)

    undoToyGesture(ydoc, layerEl, TABLE, 'user-a')
    expect(canRedoToyGesture(ydoc, TABLE, 'user-a')).toBe(true)
  })

  test('false for a peer who never authored anything on this branch', async () => {
    const { ydoc, layerEl } = await setup(['die1', 'dice_d6'])
    const L = makeLayerAPI(ydoc, () => layerEl, 'user-a', TABLE, true)
    L.render(layerEl)
    L.applyMoveCommit(L.find('die1'), 300, 300)
    expect(canUndoToyGesture(ydoc, TABLE, 'someone-else')).toBe(false)
  })
})
