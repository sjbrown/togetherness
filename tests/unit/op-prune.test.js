// @vitest-environment jsdom
/**
 * tests/unit/op-prune.test.js
 *
 * Lagged pruning (CONCURRENCY_AND_BRANCHING.md §6.3), the orphans it can
 * leave behind, and how peers react (§5.4). Multi-peer scenarios use the
 * same harness shape as concurrent-convergence.test.js: one Y.Doc, layer and
 * tableId per simulated peer, with ops delivered by hand.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  placeToy, makeLayerAPI, activateAllToyScriptsDom, ensureLayerId,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import {
  getOps, getContent, appendOp, appendCheckpoint, ancestors, ancestorsInclusive,
  isOrphan, sharedTips, heads, lca, pathFrom, totalOrder,
} from '../../src/op_dag.js'
import { projectTips, checkpointOp, isCheckpoint } from '../../src/op_checkpoint.js'
import { getHead, setHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

let _tableCounter = 0
let _peers = []

beforeEach(() => {
  _peers = []
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.dice; delete globalThis.d6
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  }))
})
afterEach(() => { vi.unstubAllGlobals() })

const freshLayer = () => {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  return el
}

function makePeer(authorId) {
  const tableId = `prune-table-${_tableCounter++}`
  const ydoc = new Y.Doc()
  const layer = ensureLayerId(freshLayer())
  const api = makeLayerAPI(ydoc, () => layer, { id: authorId }, tableId)
  const peer = { id: authorId, tableId, ydoc, layer, api }
  _peers.push(peer)
  return peer
}

function seedGenesis(peers) {
  const genesis = { id: 'genesis', parents: [], authorId: 'system', gesture: 'checkpoint', ts: 0, mutations: [] }
  for (const p of peers) {
    appendCheckpoint(p.ydoc, genesis, [])
    setHead(p.tableId, genesis.id)
  }
  return genesis
}

async function place(peer, id, x = 0, y = 0) {
  await placeToy(peer.ydoc, peer.layer, { id, toyType: 'dice_d6', x, y, color: '#fff' },
    { authorId: peer.id, tableId: peer.tableId })
  activateAllToyScriptsDom(peer.ydoc, peer.layer)
  await new Promise(r => setTimeout(r, 0))
  return getOps(peer.ydoc).get(getHead(peer.tableId))
}

const domOf = (peer) => [...peer.layer.children].map(serializeNode)

/** A plain op map from [id, parents, gesture, authorId] rows. */
function graph(...rows) {
  const m = new Map()
  for (const [id, parents = [], gesture = 'test', authorId = 'anon'] of rows) {
    m.set(id, { id, parents, authorId, gesture, mutations: [], ts: 0 })
  }
  return m
}

describe('ancestry with holes', () => {
  test('ancestors never returns an id that is not in the log', () => {
    const g = graph(['c', ['b']], ['b', ['gone']], ['d', ['c', 'also-gone']])
    expect(ancestors(g, 'd')).toEqual(new Set(['c', 'b']))
    expect(ancestorsInclusive(g, 'd')).toEqual(new Set(['d', 'c', 'b']))
    expect(ancestorsInclusive(g, 'gone')).toEqual(new Set())
  })

  test('lca, pathFrom and totalOrder ignore missing parents', () => {
    const g = graph(['r', ['gone'], 'checkpoint'], ['a', ['r']], ['b', ['r']])
    expect(lca(g, 'a', 'b')).toBe('r')
    expect(pathFrom(g, null, 'a')).toEqual(['r', 'a'])
    expect(totalOrder(g, ['a', 'b', 'r'])).toEqual(['r', 'a', 'b'])
  })

  test('a checkpoint whose parents are missing is a root, not an orphan', () => {
    const g = graph(['r', ['gone'], 'checkpoint'], ['a', ['r']])
    expect(isOrphan(g, 'r')).toBe(false)
    expect(isOrphan(g, 'a')).toBe(false)
  })

  test('an op whose ancestry reaches a missing parent before a checkpoint is an orphan', () => {
    const g = graph(
      ['r', ['gone'], 'checkpoint'], ['ok', ['r']],
      ['c1', ['lost']], ['c2', ['c1']],
      ['m', ['ok', 'c2']],
    )
    expect(isOrphan(g, 'c1')).toBe(true)
    expect(isOrphan(g, 'c2')).toBe(true)
    expect(isOrphan(g, 'm')).toBe(true)     // one bad path is enough
    expect(isOrphan(g, 'ok')).toBe(false)
    expect(isOrphan(g, 'not-in-the-log')).toBe(false)
  })

  test('a checkpoint above an orphan makes its descendants safe again', () => {
    const g = graph(['c1', ['lost']], ['ck', ['c1'], 'checkpoint'], ['x', ['ck']])
    expect(isOrphan(g, 'c1')).toBe(true)
    expect(isOrphan(g, 'ck')).toBe(false)
    expect(isOrphan(g, 'x')).toBe(false)
  })

  test('sharedTips are the maximal non-orphan ops; heads still includes orphans', () => {
    const g = graph(
      ['r', ['gone'], 'checkpoint'], ['a', ['r']], ['b', ['a']],
      ['c1', ['lost']], ['c2', ['c1']],
    )
    expect(sharedTips(g)).toEqual(['b'])
    expect(heads(g)).toEqual(['b', 'c2'])
  })

  test('projectTips from a log with its history deleted equals the DOM before the delete', async () => {
    const P = makePeer('alice')
    seedGenesis([P])
    for (let i = 0; i < 3; i++) await place(P, `d${i}`, i * 10, 0)
    const { op: ck, content } = checkpointOp(P.layer, { authorId: 'alice', parents: [getHead(P.tableId)] })
    appendCheckpoint(P.ydoc, ck, content)
    setHead(P.tableId, ck.id)
    await place(P, 'd3', 30, 0)
    P.api.applyMoveCommit(P.layer.querySelector('[data-id="d1"]'), 5, 5)

    const ops = getOps(P.ydoc)
    const before = domOf(P)
    P.ydoc.transact(() => {
      for (const id of ancestors(ops, ck.id)) { ops.delete(id); getContent(P.ydoc).delete(id) }
    })
    expect(ancestors(ops, ck.id).size).toBe(0)

    const scratch = freshLayer()
    projectTips(scratch, ops, getContent(P.ydoc), [getHead(P.tableId)], [])
    expect([...scratch.children].map(serializeNode)).toEqual(before)
  })
})
