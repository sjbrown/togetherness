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
import { projectTips, checkpointOp, isCheckpoint, LAYER_DATA_ID } from '../../src/op_checkpoint.js'
import { getHead, setHead, setMergeTips, localTips } from '../../src/op_head.js'
import {
  PRUNE_AGE_MS, _setPruneAgeForTests, noteSeen, noteAllSeen, ageOf, assertPrunable, prune,
} from '../../src/op_prune.js'
import { pruneAfterCheckpoint, resolveOrphanedTips } from '../../src/toys.js'
import { RECEIVED_CONFLICT, RECEIVED_ORPHAN } from '../../src/op_replay.js'
import { serializeNode } from '../../src/op_wire_mutation.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

let _tableCounter = 0
let _peers = []

const MIN = 60 * 1000
const T0 = Date.UTC(2026, 0, 1)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(T0)
  _setPruneAgeForTests(null)
  noteAllSeen(new Map())
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
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

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

const advance = (ms) => vi.setSystemTime(Date.now() + ms)

/** What the idle checkpoint trigger does, minus the settings: freeze the
 * layer as a checkpoint at the local tips, then let pruning run. */
function writeCheckpoint(peer) {
  const ops = getOps(peer.ydoc)
  const tips = localTips(peer.tableId, ops)
  const { op, content } = checkpointOp(peer.layer, { authorId: peer.id, parents: tips })
  appendCheckpoint(peer.ydoc, op, content)
  setHead(peer.tableId, op.id)
  setMergeTips(peer.tableId, [])
  const pruned = pruneAfterCheckpoint(peer.ydoc, peer.tableId, op.id)
  return { ck: op, pruned }
}

/** Deliver already-committed ops to `peer` the way Yjs would: all present in
 * the map before any receive() call. A checkpoint's content travels with it. */
function deliver(peer, opList) {
  for (const op of opList) {
    if (isCheckpoint(op)) {
      const from = _peers.find(p => getContent(p.ydoc).has(op.id))
      peer.ydoc.transact(() => {
        getOps(peer.ydoc).set(op.id, op)
        if (from) getContent(peer.ydoc).set(op.id, getContent(from.ydoc).get(op.id))
      })
    } else {
      getOps(peer.ydoc).set(op.id, op)
    }
  }
  return opList.map(op => peer.api.receive(peer.layer, op.id, []))
}

/**
 * Sync `from`'s state into `peer` as a real Yjs update, then handle the ops
 * Map's event exactly as app.js's onOpsChanged does: orphaned local tips
 * first, before any added op is received.
 */
function syncInto(peer, from) {
  const events = []
  // Yjs computes an event's changes lazily and only during the handler.
  const watch = (evt) => {
    const deleted = new Set(), added = []
    for (const [id, change] of evt.changes.keys) {
      if (change.action === 'delete') deleted.add(id)
      if (change.action === 'add') added.push(id)
    }
    events.push({ deleted, added })
  }
  getOps(peer.ydoc).observe(watch)
  Y.applyUpdate(peer.ydoc, Y.encodeStateAsUpdate(from.ydoc, Y.encodeStateVector(peer.ydoc)), 'remote')
  getOps(peer.ydoc).unobserve(watch)

  const out = { orphaned: null, results: {} }
  for (const { deleted, added } of events) {
    if (deleted.size) {
      out.orphaned = resolveOrphanedTips(peer.ydoc, peer.layer, peer.tableId,
        { authorId: peer.id, joinSequence: [], deletedIds: deleted })
    }
    for (const id of added) out.results[id] = peer.api.receive(peer.layer, id, [])
  }
  return out
}

/** The first peer mints genesis; the rest receive it as part of its doc. */
function seedShared(first, ...rest) {
  seedGenesis([first])
  for (const p of rest) {
    Y.applyUpdate(p.ydoc, Y.encodeStateAsUpdate(first.ydoc))
    setHead(p.tableId, 'genesis')
  }
}

/** The DOM a peer's local tips project to from its own log. */
function replayOf(peer) {
  const ops = getOps(peer.ydoc)
  const scratch = freshLayer()
  projectTips(scratch, ops, getContent(peer.ydoc), localTips(peer.tableId, ops), [])
  return [...scratch.children].map(serializeNode)
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

describe('lag protects live play', () => {
  test('a cut that was just written is too young, and the newest: nothing is pruned', async () => {
    const P = makePeer('alice')
    seedGenesis([P])
    for (let i = 0; i < 3; i++) await place(P, `d${i}`, i * 10, 0)
    const before = getOps(P.ydoc).size

    const { pruned } = writeCheckpoint(P)
    expect(pruned).toBeNull()
    expect(getOps(P.ydoc).size).toBe(before + 1)
  })

  test('a concurrent op whose parent sits just behind a fresh cut merges normally', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])
    await place(P, 'a', 0, 0)
    writeCheckpoint(P)                 // C1
    advance(11 * MIN)
    const d = await place(P, 'd', 10, 0)
    deliver(Q, [...getOps(P.ydoc).values()].filter(op => op.id !== 'genesis'))
    expect(Q.layer.querySelector('[data-id="d"]')).not.toBeNull()

    const x = await place(Q, 'x', 50, 50)      // parent: d
    expect(x.parents).toEqual([d.id])

    const { ck: c2, pruned } = writeCheckpoint(P)   // d is now just behind C2
    expect(pruned.deleted).toBeGreaterThan(0)
    expect(getOps(P.ydoc).has(d.id)).toBe(true)
    expect(getOps(P.ydoc).has(c2.id)).toBe(true)

    const [r] = deliver(P, [x])
    expect(r.result).not.toBe(RECEIVED_CONFLICT)
    expect(isOrphan(getOps(P.ydoc), x.id)).toBe(false)
    expect(P.layer.querySelector('[data-id="x"]')).not.toBeNull()
  })
})

describe('first sight', () => {
  /** g ← a ← C1 ← b ← C2 ← c, with every ts a day old. */
  function oldLog() {
    const ydoc = new Y.Doc()
    const old = T0 - 24 * 60 * MIN
    const op = (id, parents, gesture = 'x') => ({ id, parents, authorId: 'alice', gesture, mutations: [], ts: old })
    appendCheckpoint(ydoc, op('g', [], 'checkpoint'), [])
    appendOp(ydoc, op('a', ['g']))
    appendCheckpoint(ydoc, op('C1', ['a'], 'checkpoint'), [])
    appendOp(ydoc, op('b', ['C1']))
    appendCheckpoint(ydoc, op('C2', ['b'], 'checkpoint'), [])
    appendOp(ydoc, op('c', ['C2']))
    return ydoc
  }
  const run = (ydoc) => prune(ydoc, ['c'], { scratch: freshLayer() })

  test('a cut with a day-old ts that was first seen now is not prunable', () => {
    const ydoc = oldLog()
    expect(run(ydoc)).toBeNull()
    expect(getOps(ydoc).size).toBe(6)
    expect(ageOf('C1')).toBe(0)
  })

  test('once T has passed since first sight it is, and the root keeps its content', () => {
    const ydoc = oldLog()
    expect(run(ydoc)).toBeNull()
    advance(PRUNE_AGE_MS)
    expect(run(ydoc)).toEqual({ root: 'C1', deleted: 2 })
    expect([...getOps(ydoc).keys()].sort()).toEqual(['C1', 'C2', 'b', 'c'])
    expect(getContent(ydoc).has('C1')).toBe(true)
  })

  test('after a simulated boot, no cut is prunable until T passes again', () => {
    const ydoc = oldLog()
    run(ydoc)
    advance(PRUNE_AGE_MS + MIN)
    noteAllSeen(getOps(ydoc))                    // the page reloaded
    expect(run(ydoc)).toBeNull()
    advance(PRUNE_AGE_MS - MIN)
    expect(run(ydoc)).toBeNull()
    advance(2 * MIN)
    expect(run(ydoc)).not.toBeNull()
  })
})

describe('assertPrunable', () => {
  /** g ← a ← b ← C1 ← d ← C2 ← e ← C3 ← f; C1 and C3 hold content. */
  function chain() {
    const ydoc = new Y.Doc()
    const op = (id, parents, gesture = 'x') => ({ id, parents, authorId: 'alice', gesture, mutations: [], ts: 0 })
    const ops = getOps(ydoc), contents = getContent(ydoc)
    ops.set('g', op('g', [], 'checkpoint'))
    ops.set('a', op('a', ['g']))
    ops.set('b', op('b', ['a']))
    ops.set('C1', op('C1', ['b'], 'checkpoint'))
    ops.set('d', op('d', ['C1']))
    ops.set('C2', op('C2', ['d'], 'checkpoint'))
    ops.set('e', op('e', ['C2']))
    ops.set('C3', op('C3', ['e'], 'checkpoint'))
    ops.set('f', op('f', ['C3']))
    for (const id of ['g', 'C1', 'C3']) contents.set(id, [])
    for (const id of ['g', 'C1', 'C3']) noteSeen(id)
    advance(PRUNE_AGE_MS + MIN)
    noteSeen('C2')                      // first seen only now: too young
    return { ops, contents, behindC1: [...ancestors(ops, 'C1')] }
  }
  const TIPS = ['f']

  test('accepts a well-formed prune', () => {
    const { ops, contents, behindC1 } = chain()
    expect(() => assertPrunable(ops, contents, behindC1, 'C1', TIPS)).not.toThrow()
  })

  test('refuses a local tip', () => {
    const { ops, contents, behindC1 } = chain()
    expect(() => assertPrunable(ops, contents, [...behindC1, 'f'], 'C1', TIPS)).toThrow(/local tip/)
  })

  test('refuses the prune root itself', () => {
    const { ops, contents, behindC1 } = chain()
    expect(() => assertPrunable(ops, contents, [...behindC1, 'C1'], 'C1', TIPS)).toThrow(/prune root/)
  })

  test('refuses an op that is not a strict ancestor of the root', () => {
    const { ops, contents, behindC1 } = chain()
    expect(() => assertPrunable(ops, contents, [...behindC1, 'd'], 'C1', TIPS)).toThrow(/strict ancestor/)
  })

  test('refuses a root younger than T', () => {
    const { ops, contents } = chain()
    contents.set('C2', [])
    expect(() => assertPrunable(ops, contents, [...ancestors(ops, 'C2')], 'C2', TIPS)).toThrow(/first seen less than/)
  })

  test('refuses the newest cut', () => {
    const { ops, contents } = chain()
    expect(() => assertPrunable(ops, contents, [...ancestors(ops, 'C3')], 'C3', TIPS)).toThrow(/newest cut/)
  })

  test('refuses a root without content', () => {
    const { ops, contents, behindC1 } = chain()
    contents.delete('C1')
    expect(() => assertPrunable(ops, contents, behindC1, 'C1', TIPS)).toThrow(/no content/)
  })

  test('refuses a root that is not a checkpoint', () => {
    const { ops, contents } = chain()
    expect(() => assertPrunable(ops, contents, [...ancestors(ops, 'e')], 'e', TIPS)).toThrow(/not a checkpoint/)
  })
})

describe('size after pruning', () => {
  test('1,000 ops pruned leave the retained window plus ~30 B per deleted op', () => {
    const N = 1000, KEEP = 10
    const opId = (i) => `tt-op-${i.toString(36).padStart(6, '0')}-xxxxx`
    const op = (i, parent) => ({
      id: opId(i), parents: [parent], authorId: 'alice', gesture: 'move', ts: i,
      mutations: [{ t: 'attr', target: { id: LAYER_DATA_ID }, name: 'data-pad',
                    oldValue: `padding-${i}-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
                    newValue: `padding-${i + 1}-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` }],
    })
    const ck = (id, parents) => ({ id, parents, authorId: 'alice', gesture: 'checkpoint', ts: 0, mutations: [] })

    /** genesis, N-KEEP ops, cut R, KEEP ops, the newest cut. `from` skips the
     * history, as a doc that never held it would. */
    const build = (ydoc, from) => {
      let prev = null
      if (from === 0) { appendCheckpoint(ydoc, ck('genesis', []), []); prev = 'genesis' }
      for (let i = from; i < N - KEEP; i++) { appendOp(ydoc, op(i, prev)); prev = opId(i) }
      appendCheckpoint(ydoc, ck('R', prev ? [prev] : []), [])
      prev = 'R'
      for (let i = N - KEEP; i < N; i++) { appendOp(ydoc, op(i, prev)); prev = opId(i) }
      appendCheckpoint(ydoc, ck('newest', [prev]), [])
    }

    const full = new Y.Doc()
    build(full, 0)
    const unpruned = Y.encodeStateAsUpdate(full).length

    noteSeen('R'); noteSeen('newest')
    advance(PRUNE_AGE_MS + MIN)
    const res = prune(full, ['newest'], { scratch: freshLayer() })
    expect(res.root).toBe('R')
    const pruned = Y.encodeStateAsUpdate(full).length

    const lean = new Y.Doc()
    build(lean, N - KEEP)
    const leanSize = Y.encodeStateAsUpdate(lean).length

    console.log(`[size] ${N} ops: ${unpruned} B unpruned; pruned ${res.deleted} → ${pruned} B; ` +
      `retained window alone ${leanSize} B; residue ${((pruned - leanSize) / res.deleted).toFixed(1)} B per deleted op`)

    expect(pruned).toBeLessThan(unpruned / 4)
    expect(pruned).toBeLessThanOrEqual(leanSize + 40 * res.deleted + 1024)
  })
})

describe('a peer that was away while others pruned', () => {
  /**
   * alice, carol and dave share g, a1, a2. Carol goes quiet holding c1, c2
   * (parent a2). Alice carries on and prunes past a2.
   */
  async function setup({ carolWrites = true } = {}) {
    const A = makePeer('alice'), C = makePeer('carol'), D = makePeer('dave')
    seedShared(A, C, D)
    await place(A, 'a1', 0, 0)
    await place(A, 'a2', 10, 0)
    syncInto(C, A); syncInto(D, A)

    let c1, c2
    if (carolWrites) {
      c1 = await place(C, 'c1', 100, 0)
      c2 = await place(C, 'c2', 110, 0)
    }

    await place(A, 'a3', 20, 0)
    writeCheckpoint(A)                       // C1
    advance(PRUNE_AGE_MS + MIN)
    await place(A, 'a4', 30, 0)
    const { pruned } = writeCheckpoint(A)    // C2: prunes behind C1
    expect(pruned.deleted).toBeGreaterThan(0)
    expect(getOps(A.ydoc).has(getHead(C.tableId))).toBe(false)
    return { A, C, D, c1, c2 }
  }

  test('a bystander ignores the orphaned ops: its DOM is unchanged and equals its replay', async () => {
    const { A, C, c1, c2 } = await setup()
    const before = domOf(A)

    const out = syncInto(A, C)
    expect(out.results[c1.id].result).toBe(RECEIVED_ORPHAN)
    expect(out.results[c2.id].result).toBe(RECEIVED_ORPHAN)
    expect(domOf(A)).toEqual(before)
    expect(domOf(A)).toEqual(replayOf(A))
    expect(A.layer.querySelector('[data-id="c1"]')).toBeNull()
  })

  test('an idle peer whose head was pruned adopts the shared tips without forking', async () => {
    const { A, D } = await setup({ carolWrites: false })
    const out = syncInto(D, A)

    expect(out.orphaned).not.toBeNull()
    expect(out.orphaned.authored).toBe(false)
    expect(domOf(D)).toEqual(domOf(A))
    expect(domOf(D)).toEqual(replayOf(D))
    expect(localTips(D.tableId, getOps(D.ydoc))).toEqual(localTips(A.tableId, getOps(A.ydoc)))
  })
})
