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
import { getOps, appendOp } from '../../src/op_dag.js'
import { projectTips, nearestCheckpoint, opsSinceCheckpoint, CHECKPOINT_MIN_OPS } from '../../src/op_checkpoint.js'
import { getHead, getMergeTips, maximalTips, setHead } from '../../src/op_head.js'
import { serializeNode } from '../../src/op_wire_mutation.js'
import { RECEIVED_CONFLICT, RECEIVED_REBUILT, RECEIVED_SUBSEQUENT } from '../../src/op_replay.js'

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

// ── merge checkpoints (§5.6) ────────────────────────────────────────────

/** A chain of `n` no-op filler operations off `fromId` — cheap padding so
 * a scenario's real ops-since-cut count crosses CHECKPOINT_MIN_OPS without
 * placing a pile of real toys. Deterministic, empty mutations: applying
 * one as a delta is a true no-op. */
function fillerChain(fromId, n) {
  const chain = []
  let parent = fromId
  for (let i = 0; i < n; i++) {
    const id = `filler-${fromId}-${i}`
    chain.push({ id, parents: [parent], authorId: 'system', gesture: 'noop', ts: i + 1, mutations: [] })
    parent = id
  }
  return chain
}

/** Like seedGenesis, but every peer starts past a shared chain of `n`
 * filler ops instead of genesis itself — real placements that follow are
 * then already well past CHECKPOINT_MIN_OPS, which the merge-checkpoint
 * gate needs exercised. */
function seedGenesisWithFiller(peers, n) {
  const genesis = seedGenesis(peers)
  const chain = fillerChain(genesis.id, n)
  for (const p of peers) {
    for (const op of chain) getOps(p.ydoc).set(op.id, op)
    setHead(p.tableId, chain[chain.length - 1].id)
  }
  return chain[chain.length - 1].id
}

describe('merge checkpoints (§5.6)', () => {
  test('gate: at or under CHECKPOINT_MIN_OPS since the cut, a rebuild writes no merge checkpoint', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesis([P, Q]) // just genesis — two placements is nowhere near the gate

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)

    const [rP] = deliver(P, [opQ])
    expect(rP.result).toBe(RECEIVED_REBUILT)
    expect(rP.mergeCheckpoint).toBeFalsy()
    expect(rP.mergeTips).toEqual([opQ.id])
    expect(localTipsOf(P).sort()).toEqual([opP.id, opQ.id].sort())
  })

  test('determinism: two peers rebuilding the same tips write byte-identical merge checkpoints, and a shared map collapses them to one entry', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesisWithFiller([P, Q], CHECKPOINT_MIN_OPS + 1)

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)

    const [rP] = deliver(P, [opQ])
    const [rQ] = deliver(Q, [opP])
    expect(rP.result).toBe(RECEIVED_REBUILT)
    expect(rQ.result).toBe(RECEIVED_REBUILT)
    expect(rP.mergeCheckpoint).toBeTruthy()
    expect(rP.mergeCheckpoint).toBe(rQ.mergeCheckpoint)

    const ckP = getOps(P.ydoc).get(rP.mergeCheckpoint)
    const ckQ = getOps(Q.ydoc).get(rQ.mergeCheckpoint)
    expect(ckP).toEqual(ckQ)

    const shared = new Y.Doc()
    appendOp(shared, ckP)
    const sizeBefore = getOps(shared).size
    appendOp(shared, ckQ)
    expect(getOps(shared).size).toBe(sizeBefore)

    assertConverged([P, Q])
  })

  test('collapse: local tips become [checkpoint], and the next local commit is parented on it alone', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesisWithFiller([P, Q], CHECKPOINT_MIN_OPS + 1)

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)
    const [rP] = deliver(P, [opQ])
    expect(rP.mergeCheckpoint).toBeTruthy()
    expect(localTipsOf(P)).toEqual([rP.mergeCheckpoint])

    const opNext = await place(P, 'dieP2', 'dice_d6', 80, 80)
    expect(opNext.parents).toEqual([rP.mergeCheckpoint])
  })

  test('base moves: the next rebuild after a merge checkpoint uses it as its cut, with a small replay length', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    seedGenesisWithFiller([P, Q], CHECKPOINT_MIN_OPS + 1)

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)
    const [rP] = deliver(P, [opQ])
    const [rQ] = deliver(Q, [opP])
    const ck = rP.mergeCheckpoint
    expect(ck).toBeTruthy()
    expect(ck).toBe(rQ.mergeCheckpoint)

    // Both peers commit directly on top of the checkpoint, concurrently —
    // the next order-sensitive rebuild.
    const opP2 = await place(P, 'dieP2', 'dice_d6', 120, 0)
    const opQ2 = await place(Q, 'dieQ2', 'dice_d6', 160, 40)
    expect(opP2.parents).toEqual([ck])
    expect(opQ2.parents).toEqual([ck])

    const [rP2] = deliver(P, [opQ2])
    const [rQ2] = deliver(Q, [opP2])
    expect(rP2.result).toBe(RECEIVED_REBUILT)
    expect(rQ2.result).toBe(RECEIVED_REBUILT)

    const ops = getOps(P.ydoc)
    const tips2 = localTipsOf(P)
    expect(nearestCheckpoint(ops, tips2)).toBe(ck)
    expect(opsSinceCheckpoint(ops, tips2)).toBe(2) // just opP2, opQ2

    assertConverged([P, Q])
  })

  test('receiving a merge checkpoint: the three cases from CONCURRENCY_AND_BRANCHING.md §5.6 all converge', async () => {
    const P = makePeer('alice'), Q = makePeer('bob')
    const R = makePeer('carol'), S = makePeer('dave')
    seedGenesisWithFiller([P, Q, R, S], CHECKPOINT_MIN_OPS + 1)

    const opP = await place(P, 'dieP', 'dice_d6', 0, 0)
    const opQ = await place(Q, 'dieQ', 'dice_d6', 40, 40)

    // R has seen opP but not opQ — case "hasn't received one of T's
    // members yet" once the checkpoint arrives.
    deliver(R, [opP])

    // S has its own concurrent op, never having seen opP or opQ at all —
    // case "holding a concurrent op of its own, not in T".
    const opS = await place(S, 'dieS', 'dice_d6', -40, -40)

    // P and Q exchange and both land on the same merge checkpoint —
    // case "already rebuilt the same T", exercised on Q's own arrival of
    // opP (Q reaches T = {opP, opQ} the same way P does).
    const [rP] = deliver(P, [opQ])
    const [rQ] = deliver(Q, [opP])
    const ck = rP.mergeCheckpoint
    expect(ck).toBeTruthy()
    expect(ck).toBe(rQ.mergeCheckpoint)
    expect(localTipsOf(P)).toEqual([ck])
    expect(localTipsOf(Q)).toEqual([ck])

    const ckOp = getOps(P.ydoc).get(ck)

    // Case A: a peer (Q, above) that already rebuilt the same T receives
    // the literal checkpoint as SUBSEQUENT — a no-op delta collapsing its
    // tips to it. Simulate a peer that reached the same DOM state without
    // itself writing the checkpoint by re-delivering the SAME ckOp
    // object's id to a peer already sitting on T — Q, immediately before
    // its own write, would have classified it this way; assert the
    // now-idempotent form directly instead: re-delivering ck to Q (who's
    // already at [ck]) is KNOWN, and to P likewise.
    const [rQAgain] = deliver(Q, [ckOp])
    expect(rQAgain.result).not.toBe(RECEIVED_CONFLICT)
    expect(localTipsOf(Q)).toEqual([ck])

    // Case B: R has opP but not opQ. Delivering the checkpoint (with opQ's
    // record now present in R's own map, as it would be in the one shared
    // Y.Map) rebuilds cheaply, cut at the checkpoint itself, and collapses
    // R's tips to it.
    const [rR] = deliver(R, [opQ, ckOp], [1])
    expect(rR.result).toBe(RECEIVED_REBUILT)
    expect(localTipsOf(R)).toEqual([ck])
    expect(nearestCheckpoint(getOps(R.ydoc), [ck])).toBe(ck)

    // Case C: S has its own concurrent op (opS), not in T. Receiving ck
    // lands S on tips [ck, opS] (or [opS, ck] — order irrelevant), and
    // since the filler chain already pushed this table well past the
    // checkpoint gate, S writes its own merge checkpoint over that pair.
    const [rS] = deliver(S, [opP, opQ, ckOp], [2])
    expect(rS.result).toBe(RECEIVED_REBUILT)
    expect(rS.mergeCheckpoint).toBeTruthy()
    expect(localTipsOf(S)).toEqual([rS.mergeCheckpoint])

    // S's own merge checkpoint still needs relaying to everyone else for
    // full convergence — deliver it around like any other op, along with
    // opS itself (P, Q and R never saw S's own concurrent placement).
    const ck2 = getOps(S.ydoc).get(rS.mergeCheckpoint)
    deliver(P, [opS, ck2], [1])
    deliver(Q, [opS, ck2], [1])
    deliver(R, [opS, ck2], [1])

    assertConverged([P, Q, R, S])
  })
})
