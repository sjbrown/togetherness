// @vitest-environment jsdom
/**
 * tests/unit/concurrent-convergence.test.js
 *
 * The guardrail for CONCURRENCY_AND_BRANCHING.md's §5.1/§5.6 promise: two
 * or three simulated peers, each with their own layer and local tip
 * storage, committing real gestures (through placeToy/makeLayerAPI, so
 * moves go through the real promoteZOrder) and delivering each other's
 * operations out of band. After every delivery, every peer's live DOM must
 * be byte-identical to every other peer's, AND to a fresh projectTips over
 * the union of everyone's tips — the thing that makes projection a
 * function of the tip set alone, not of arrival order.
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  placeToy, makeLayerAPI, activateAllToyScriptsDom, projectLayer, ensureLayerId,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'
import { getOps } from '../../src/op_dag.js'
import { projectTips } from '../../src/op_checkpoint.js'
import { getHead, getMergeTips, maximalTips, setHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'
import { RECEIVED_CONFLICT, RECEIVED_REBUILT } from '../../src/op_replay.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

let _tableCounter = 0

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
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  return el
}

/** A simulated peer: its own Y.Doc (and so its own ops Map), its own live
 * layer, and its own tableId — which is what keys op_head's localStorage
 * entries, so peers never share head/merge-tip state even though this test
 * runs them all in one jsdom global. */
function makePeer(authorId) {
  const tableId = `convergence-table-${_tableCounter++}`
  const ydoc = new Y.Doc()
  const layer = ensureLayerId(freshLayer())
  const api = makeLayerAPI(ydoc, () => layer, { id: authorId }, tableId)
  return { id: authorId, tableId, ydoc, layer, api }
}

/** Every peer starts from the same genesis checkpoint — minted once,
 * copied verbatim into each peer's own ops map, with head set locally.
 * Real placements land as this genesis's descendants. */
function seedGenesis(peers) {
  const genesis = { id: 'genesis', parents: [], authorId: 'system', gesture: 'checkpoint', ts: 0, mutations: [] }
  for (const p of peers) {
    getOps(p.ydoc).set(genesis.id, genesis)
    setHead(p.tableId, genesis.id)
  }
  return genesis
}

/** Deliver a batch of already-committed ops to `peer`, receiving them in
 * the given order. All ops are inserted into the peer's own ops map before
 * any receive() call, exactly as Yjs would have every op present in the
 * shared Y.Map before onOpsChanged iterates the arrived keys. */
function deliver(peer, ops, order = ops.map((_, i) => i)) {
  for (const op of ops) getOps(peer.ydoc).set(op.id, op)
  const results = []
  for (const i of order) {
    results.push(peer.api.receive(peer.layer, ops[i].id, []))
  }
  return results
}

function localTipsOf(peer) {
  return maximalTips(getOps(peer.ydoc), [getHead(peer.tableId), ...getMergeTips(peer.tableId)])
}

/** Every peer's live DOM matches every other's, and matches a from-scratch
 * projectTips over the union of everyone's tips. */
function assertConverged(peers) {
  const serialized = peers.map(p => [...p.layer.children].map(serializeNode))
  for (let i = 1; i < peers.length; i++) {
    expect(serialized[i]).toEqual(serialized[0])
  }

  const ops = getOps(peers[0].ydoc)
  const unionTips = maximalTips(ops, peers.flatMap(localTipsOf))
  const scratch = freshLayer()
  projectTips(scratch, ops, unionTips, [])
  expect([...scratch.children].map(serializeNode)).toEqual(serialized[0])
}

async function place(peer, id, toyType, x, y) {
  await placeToy(peer.ydoc, peer.layer, { id, toyType, x, y, color: '#fff' },
    { authorId: peer.id, tableId: peer.tableId })
  activateAllToyScriptsDom(peer.ydoc, peer.layer)
  await new Promise(r => setTimeout(r, 0))
  return getOp(peer)
}

function getOp(peer) {
  const head = getHead(peer.tableId)
  return getOps(peer.ydoc).get(head)
}

describe('concurrent convergence', () => {
  test('scenario 1: two concurrent placements of different toys — not a conflict, converges', async () => {
    for (const order of [[0, 1], [1, 0]]) {
      const P = makePeer('alice'), Q = makePeer('bob')
      seedGenesis([P, Q])

      const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
      const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)

      const [rP] = deliver(P, [opQ])
      const [rQ] = deliver(Q, [opP])
      // Both placements add a top-level child to the same layer root, so
      // this is exactly the order-sensitive, non-conflicting case §5.6
      // resolves with a canonical rebuild.
      expect(rP.result).toBe(RECEIVED_REBUILT)
      expect(rQ.result).toBe(RECEIVED_REBUILT)

      assertConverged([P, Q])
      // sanity: order shouldn't matter for a single mutual delivery either way
      void order
    }
  })

  test('scenario 2: two concurrent moves of different toys — not a conflict, converges', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    // A shared starting point: alice places both toys, then both peers see it.
    const opPlace1 = await place(P, 'd1', 'dice_d6', 0, 0)
    const opPlace2 = await place(P, 'd2', 'dice_d6', 100, 100)
    deliver(Q, [opPlace1, opPlace2])

    const elP = P.layer.querySelector('[data-id="d1"]')
    const { op: opMoveP } = P.api.applyMoveCommit(elP, 10, 10)
    const elQ = Q.layer.querySelector('[data-id="d2"]')
    const { op: opMoveQ } = Q.api.applyMoveCommit(elQ, 200, 200)

    const [rP] = deliver(P, [opMoveQ])
    const [rQ] = deliver(Q, [opMoveP])
    expect(rP.result).not.toBe(RECEIVED_CONFLICT)
    expect(rQ.result).not.toBe(RECEIVED_CONFLICT)

    assertConverged([P, Q])
  })

  test('scenario 3: a placement on one peer and a move on another — not a conflict, converges', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    const opPlace1 = await place(P, 'd1', 'dice_d6', 0, 0)
    deliver(Q, [opPlace1])

    const elQ = Q.layer.querySelector('[data-id="d1"]')
    const { op: opMove } = Q.api.applyMoveCommit(elQ, 50, 50)
    const opPlace2 = await place(P, 'd2', 'dice_d6', 100, 100)

    const [rP] = deliver(P, [opMove])
    const [rQ] = deliver(Q, [opPlace2])
    expect(rP.result).not.toBe(RECEIVED_CONFLICT)
    expect(rQ.result).not.toBe(RECEIVED_CONFLICT)

    assertConverged([P, Q])
  })

  test('scenario 4: double delete of the same toy merges — the toy is gone, once', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    const opPlace = await place(P, 'd1', 'dice_d6', 0, 0)
    deliver(Q, [opPlace])

    const { op: opDelP } = P.api.delete('d1')
    const { op: opDelQ } = Q.api.delete('d1')

    const [rP] = deliver(P, [opDelQ])
    const [rQ] = deliver(Q, [opDelP])
    expect(rP.result).not.toBe(RECEIVED_CONFLICT)
    expect(rQ.result).not.toBe(RECEIVED_CONFLICT)

    expect(P.layer.querySelector('[data-id="d1"]')).toBeNull()
    expect(Q.layer.querySelector('[data-id="d1"]')).toBeNull()
    assertConverged([P, Q])
  })

  test('scenario 6 (bug 3 regression): a descendant of a merge tip does not duplicate the merged op', async () => {
    const P = makePeer('alice'), Q = makePeer('bob'), R = makePeer('carol')
    seedGenesis([P, Q, R])

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)   // p
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40) // q, concurrent with p

    // R sees p first (SUBSEQUENT), then q (concurrent → merge tip) — R now
    // holds exactly the tip set {p, q} this bug is about.
    deliver(R, [opP])
    const [rR] = deliver(R, [opQ])
    expect(rR.result).not.toBe(RECEIVED_CONFLICT)

    // P and Q also converge to {p, q} independently.
    deliver(P, [opQ])
    deliver(Q, [opP])

    // R commits locally: consumeParents(R) is [p, q] — exactly the
    // descendant-of-a-merge-tip shape the bug is about.
    const opR = await place(R, 'dieR', 'dice_d6', 80, 80)

    // Deliver r to P and Q. The bug: classifying by head alone sees r as a
    // SUBSEQUENT descendant of p and replays "everything since p", which
    // re-applies q — dieQ would appear twice.
    const [rP] = deliver(P, [opR])
    const [rQ] = deliver(Q, [opR])
    expect(rP.result).not.toBe(RECEIVED_CONFLICT)
    expect(rQ.result).not.toBe(RECEIVED_CONFLICT)

    for (const peer of [P, Q, R]) {
      expect(peer.layer.querySelectorAll('[data-id="dieQ"]').length).toBe(1)
    }
    assertConverged([P, Q, R])
  })

  test('scenario 7: a reload after a merge projects the same DOM as the live one', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)
    deliver(P, [opQ])
    deliver(Q, [opP])
    assertConverged([P, Q])

    // Simulate reload: a fresh, empty layer, same tableId/ops, boot again.
    const reloaded = freshLayer()
    projectLayer(P.ydoc, reloaded, { tableId: P.tableId, authorId: P.id, isCreator: false, joinSequence: [] })

    expect([...reloaded.children].map(serializeNode))
      .toEqual([...P.layer.children].map(serializeNode))
  })

  test('must-conflict: the same toy moved on both sides still conflicts', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    const opPlace = await place(P, 'd1', 'dice_d6', 0, 0)
    deliver(Q, [opPlace])

    const { op: opMoveP } = P.api.applyMoveCommit(P.layer.querySelector('[data-id="d1"]'), 10, 10)
    const { op: opMoveQ } = Q.api.applyMoveCommit(Q.layer.querySelector('[data-id="d1"]'), 20, 20)

    const [rP] = deliver(P, [opMoveQ])
    expect(rP.result).toBe(RECEIVED_CONFLICT)
  })

  test('must-conflict: delete vs. move of the same toy still conflicts', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q])

    const opPlace = await place(P, 'd1', 'dice_d6', 0, 0)
    deliver(Q, [opPlace])

    const { op: opDel }  = P.api.delete('d1')
    const { op: opMove } = Q.api.applyMoveCommit(Q.layer.querySelector('[data-id="d1"]'), 20, 20)

    const [rP] = deliver(P, [opMove])
    expect(rP.result).toBe(RECEIVED_CONFLICT)
  })
})
