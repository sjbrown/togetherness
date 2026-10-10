// @vitest-environment jsdom
/**
 * tests/unit/op-layers.test.js
 *
 * Op layers are independent DAGs. A synthetic second layer ("scratch": a plain
 * <g>, no hooks) is registered beside toys and driven through the real
 * op_layer.js functions: its gestures, remote ops, conflicts, forks and
 * pruning must never touch the toys layer's maps, tips or DOM, and the
 * reverse.
 */
import * as Y from 'yjs'
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import { TOYS_LAYER } from '../../src/toys.js'
import { defineOpLayer, getOpLayer, opLayers, ensureLayerId } from '../../src/op_layers.js'
import {
  runGesture, ensureEnvelope, receiveLayerOp, settleBranchConflict, pruneAfterCheckpoint, projectedAt,
} from '../../src/op_layer.js'
import { getOps, getContent, appendCheckpoint } from '../../src/op_dag.js'
import { getHead, setHead, getMergeTips, setMergeTips, localTips } from '../../src/op_head.js'
import { checkpointOp } from '../../src/op_checkpoint.js'
import { serializeNode } from '../../src/op_wire_mutation.js'
import { _setPruneAgeForTests, resetFirstSeen } from '../../src/op_prune.js'
import { RECEIVED_CONFLICT } from '../../src/op_replay.js'
import { tablesAPI } from '../../src/tables.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

const SCRATCH = defineOpLayer({
  name:        'scratch',
  selector:    '#scratch-layer',
  layerDataId: 'tt-layer-scratch',
  opsKey:      'ops:scratch',
  contentKey:  'checkpointContent:scratch',
  headKey:     (tableId) => `tt_head_scratch_${tableId}`,
  mergeKey:    (tableId) => `tt_head_merge_scratch_${tableId}`,
})

let _n = 0

beforeEach(() => {
  localStorage.clear()
  resetFirstSeen()
})
afterEach(() => { _setPruneAgeForTests(null) })

const el = (peer, layer) => (layer === TOYS_LAYER ? peer.toysEl : peer.scratchEl)

function makePeer(authorId) {
  const mk = (id, layer) => {
    const g = document.createElementNS(SVG_NS, 'g')
    g.id = id
    return ensureLayerId(g, layer)
  }
  return {
    id: authorId,
    tableId: `layers-table-${_n++}`,
    ydoc: new Y.Doc(),
    toysEl: mk('toys-layer', TOYS_LAYER),
    scratchEl: mk('scratch-layer', SCRATCH),
  }
}

const GENESIS = { id: 'genesis', parents: [], authorId: 'system', gesture: 'checkpoint', ts: 0, mutations: [] }

function seedGenesis(peers, layer, genesis = { ...GENESIS, id: `genesis-${layer.name}` }) {
  for (const p of peers) {
    appendCheckpoint(p.ydoc, layer, genesis, [])
    setHead(p.tableId, layer, genesis.id)
  }
  return genesis
}

function newPeers(...ids) {
  const peers = ids.map(makePeer)
  for (const layer of [TOYS_LAYER, SCRATCH]) seedGenesis(peers, layer)
  return peers
}

function gesture(peer, layer, name, fn) {
  const { op } = runGesture(peer.ydoc, layer, el(peer, layer), fn, {
    gesture: name, authorId: peer.id, tableId: peer.tableId,
  })
  return op
}

const addNode = (peer, layer, id) => gesture(peer, layer, 'add', () => {
  const g = document.createElementNS(SVG_NS, 'g')
  g.setAttribute('data-id', id)
  el(peer, layer).appendChild(g)
})

const setAttr = (peer, layer, id, name, value) => gesture(peer, layer, 'set', () => {
  el(peer, layer).querySelector(`[data-id="${id}"]`).setAttribute(name, value)
})

/** Deliver an already-committed op to `peer` the way the ops observer does. */
function deliver(peer, layer, op) {
  getOps(peer.ydoc, layer).set(op.id, op)
  return receiveLayerOp(peer.ydoc, layer, el(peer, layer), op.id, peer.tableId, ['alice', 'bob'])
}

const domOf = (peer, layer) => [...el(peer, layer).children].map(serializeNode)
const tipsOf = (peer, layer) => ({
  head: getHead(peer.tableId, layer),
  merge: getMergeTips(peer.tableId, layer),
})
const mapJSON = (ydoc, layer) => ({
  ops: getOps(ydoc, layer).toJSON(),
  content: getContent(ydoc, layer).toJSON(),
})

describe('registry', () => {
  test('layers are looked up by name and listed', () => {
    expect(getOpLayer('toys')).toBe(TOYS_LAYER)
    expect(getOpLayer('scratch')).toBe(SCRATCH)
    expect(opLayers().map(l => l.name)).toEqual(expect.arrayContaining(['toys', 'scratch']))
    expect(() => getOpLayer('nope')).toThrow(/no op layer/)
  })

  test('a layer with no hooks gets inert defaults', () => {
    expect(SCRATCH.hooks.afterCapture([], null, {})).toEqual([])
    expect(SCRATCH.hooks.afterProject(null, null)).toBeUndefined()
  })
})

describe('gestures stay in their own layer', () => {
  test('each layer\'s gesture lands only in that layer\'s ops map, and tips advance independently', () => {
    const [A] = newPeers('alice')
    const toysTip0 = tipsOf(A, TOYS_LAYER)
    const scratchTip0 = tipsOf(A, SCRATCH)

    const toysOp = addNode(A, TOYS_LAYER, 't1')
    expect(getOps(A.ydoc, TOYS_LAYER).has(toysOp.id)).toBe(true)
    expect(getOps(A.ydoc, SCRATCH).has(toysOp.id)).toBe(false)
    expect(getOps(A.ydoc, SCRATCH).size).toBe(1)
    expect(tipsOf(A, TOYS_LAYER).head).toBe(toysOp.id)
    expect(tipsOf(A, SCRATCH)).toEqual(scratchTip0)

    const scratchOp = addNode(A, SCRATCH, 's1')
    expect(getOps(A.ydoc, SCRATCH).has(scratchOp.id)).toBe(true)
    expect(getOps(A.ydoc, TOYS_LAYER).has(scratchOp.id)).toBe(false)
    expect(getOps(A.ydoc, TOYS_LAYER).size).toBe(2)
    expect(tipsOf(A, SCRATCH).head).toBe(scratchOp.id)
    expect(tipsOf(A, TOYS_LAYER).head).toBe(toysOp.id)
    expect(toysTip0.head).not.toBe(toysOp.id)

    expect(scratchOp.parents).toEqual(['genesis-scratch'])
    expect(toysOp.parents).toEqual(['genesis-toys'])
  })

  test('each layer\'s projection marker follows its own head', () => {
    const [A] = newPeers('alice')
    const toysOp = addNode(A, TOYS_LAYER, 't1')
    const scratchOp = addNode(A, SCRATCH, 's1')
    expect(projectedAt(A.toysEl)).toBe(toysOp.id)
    expect(projectedAt(A.scratchEl)).toBe(scratchOp.id)
  })
})

describe('envelopes do not span layers', () => {
  test('a nested envelope on the other layer throws, in both directions', () => {
    const [A] = newPeers('alice')
    const crossToys = () => runGesture(A.ydoc, TOYS_LAYER, A.toysEl, () => {}, { tableId: A.tableId })
    const crossScratch = () => runGesture(A.ydoc, SCRATCH, A.scratchEl, () => {}, { tableId: A.tableId })

    expect(() => runGesture(A.ydoc, SCRATCH, A.scratchEl, crossToys, { tableId: A.tableId }))
      .toThrow(/cannot span layers/)
    expect(() => runGesture(A.ydoc, TOYS_LAYER, A.toysEl, crossScratch, { tableId: A.tableId }))
      .toThrow(/cannot span layers/)
    expect(() => ensureEnvelope(A.ydoc, SCRATCH, A.scratchEl, () => {
      ensureEnvelope(A.ydoc, TOYS_LAYER, A.toysEl, () => {}, { tableId: A.tableId })
    }, { tableId: A.tableId })).toThrow(/cannot span layers/)

    // Nothing was committed, and the envelope is usable afterwards.
    expect(getOps(A.ydoc, TOYS_LAYER).size).toBe(1)
    expect(getOps(A.ydoc, SCRATCH).size).toBe(1)
    expect(addNode(A, SCRATCH, 's1')).not.toBeNull()
    expect(addNode(A, TOYS_LAYER, 't1')).not.toBeNull()
  })

  test('same-layer nesting folds into the open envelope: one op', () => {
    const [A] = newPeers('alice')
    let inner
    const { op } = runGesture(A.ydoc, SCRATCH, A.scratchEl, () => {
      inner = ensureEnvelope(A.ydoc, SCRATCH, A.scratchEl, () => {
        const g = document.createElementNS(SVG_NS, 'g')
        g.setAttribute('data-id', 's1')
        A.scratchEl.appendChild(g)
        return 'ran'
      }, { gesture: 'inner', tableId: A.tableId })
    }, { gesture: 'outer', authorId: 'alice', tableId: A.tableId })

    expect(inner).toEqual({ result: 'ran', op: null })
    expect(op.gesture).toBe('outer')
    expect(op.mutations.length).toBe(1)
    expect(getOps(A.ydoc, SCRATCH).size).toBe(2)
  })
})

describe('remote ops stay in their own layer', () => {
  test('a remote scratch op never touches the toys layer\'s DOM or tips, and the reverse', () => {
    const [A, B] = newPeers('alice', 'bob')

    const t1 = addNode(A, TOYS_LAYER, 't1')
    deliver(B, TOYS_LAYER, t1)
    const toysDom = domOf(B, TOYS_LAYER)
    const toysTips = tipsOf(B, TOYS_LAYER)
    const toysMarker = projectedAt(B.toysEl)
    const toysMaps = mapJSON(B.ydoc, TOYS_LAYER)
    expect(toysDom.length).toBe(1)

    const s1 = addNode(A, SCRATCH, 's1')
    const out = deliver(B, SCRATCH, s1)
    expect(out.head).toBe(s1.id)
    expect(domOf(B, SCRATCH).length).toBe(1)
    expect(tipsOf(B, SCRATCH).head).toBe(s1.id)

    expect(domOf(B, TOYS_LAYER)).toEqual(toysDom)
    expect(tipsOf(B, TOYS_LAYER)).toEqual(toysTips)
    expect(projectedAt(B.toysEl)).toBe(toysMarker)
    expect(mapJSON(B.ydoc, TOYS_LAYER)).toEqual(toysMaps)

    // The reverse: a toys op leaves scratch alone.
    const scratchDom = domOf(B, SCRATCH)
    const scratchTips = tipsOf(B, SCRATCH)
    const scratchMaps = mapJSON(B.ydoc, SCRATCH)
    const t2 = addNode(A, TOYS_LAYER, 't2')
    deliver(B, TOYS_LAYER, t2)
    expect(domOf(B, TOYS_LAYER).length).toBe(2)
    expect(domOf(B, SCRATCH)).toEqual(scratchDom)
    expect(tipsOf(B, SCRATCH)).toEqual(scratchTips)
    expect(mapJSON(B.ydoc, SCRATCH)).toEqual(scratchMaps)
  })
})

describe('conflicts and forks stay in their own layer', () => {
  function conflictOnScratch() {
    const [A, B] = newPeers('alice', 'bob')
    const s1 = addNode(A, SCRATCH, 's1')
    deliver(B, SCRATCH, s1)

    const t1 = addNode(A, TOYS_LAYER, 't1')
    deliver(B, TOYS_LAYER, t1)

    const red = setAttr(A, SCRATCH, 's1', 'data-color', 'red')
    const blue = setAttr(B, SCRATCH, 's1', 'data-color', 'blue')
    return { A, B, red, blue }
  }

  test('a conflict on scratch resolves without changing toys\' tips, DOM or maps', () => {
    const { B, red } = conflictOnScratch()
    const toysTips = tipsOf(B, TOYS_LAYER)
    const toysDom = domOf(B, TOYS_LAYER)
    const toysMaps = mapJSON(B.ydoc, TOYS_LAYER)

    const out = deliver(B, SCRATCH, red)
    expect(out.result).toBe(RECEIVED_CONFLICT)

    const decision = settleBranchConflict(B.ydoc, SCRATCH, B.scratchEl, B.tableId, out.tips,
      { authorId: 'bob', joinSequence: ['alice', 'bob'] })
    expect(decision.leader).toBe(red.id)
    expect(tipsOf(B, SCRATCH)).toEqual({ head: red.id, merge: [] })
    expect(B.scratchEl.querySelector('[data-id="s1"]').getAttribute('data-color')).toBe('red')

    expect(tipsOf(B, TOYS_LAYER)).toEqual(toysTips)
    expect(domOf(B, TOYS_LAYER)).toEqual(toysDom)
    expect(mapJSON(B.ydoc, TOYS_LAYER)).toEqual(toysMaps)
  })

  test('a fork seeded for scratch replaces only scratch\'s maps', () => {
    const { B, red } = conflictOnScratch()
    const out = deliver(B, SCRATCH, red)
    const decision = settleBranchConflict(B.ydoc, SCRATCH, B.scratchEl, B.tableId, out.tips,
      { authorId: 'bob', joinSequence: ['alice', 'bob'] })
    expect(decision.authoredSplitter).toBe(true)
    expect(decision.seed).toBeTruthy()

    const fork = new Y.Doc()
    Y.applyUpdate(fork, Y.encodeStateAsUpdate(B.ydoc))
    tablesAPI.seedForkOps(fork, SCRATCH, decision.seed)

    expect(mapJSON(fork, TOYS_LAYER)).toEqual(mapJSON(B.ydoc, TOYS_LAYER))
    expect(mapJSON(fork, SCRATCH)).not.toEqual(mapJSON(B.ydoc, SCRATCH))
    expect(getOps(fork, SCRATCH).has(decision.seed.genesis.id)).toBe(true)
    expect(getOps(fork, SCRATCH).has(red.id)).toBe(false)
    expect([...fork.share.keys()].sort()).toEqual([...B.ydoc.share.keys()].sort())
  })
})

describe('pruning stays in its own layer', () => {
  test('pruning scratch deletes nothing from toys\' maps', () => {
    _setPruneAgeForTests(0)
    const [A] = newPeers('alice')

    for (let i = 0; i < 3; i++) addNode(A, TOYS_LAYER, `t${i}`)
    const toysMaps = mapJSON(A.ydoc, TOYS_LAYER)
    const toysTips = tipsOf(A, TOYS_LAYER)

    const writeCheckpoint = () => {
      const tips = localTips(A.tableId, SCRATCH, getOps(A.ydoc, SCRATCH))
      const { op, content } = checkpointOp(A.scratchEl, { authorId: 'alice', parents: tips })
      appendCheckpoint(A.ydoc, SCRATCH, op, content)
      setHead(A.tableId, SCRATCH, op.id)
      setMergeTips(A.tableId, SCRATCH, [])
      return op
    }

    addNode(A, SCRATCH, 's0')
    const c1 = writeCheckpoint()
    addNode(A, SCRATCH, 's1')
    const c2 = writeCheckpoint()
    const before = getOps(A.ydoc, SCRATCH).size

    const result = pruneAfterCheckpoint(A.ydoc, SCRATCH, A.tableId, c2.id, [])
    expect(result).toEqual({ root: c1.id, deleted: expect.any(Number) })
    expect(result.deleted).toBeGreaterThan(0)
    expect(getOps(A.ydoc, SCRATCH).size).toBe(before - result.deleted)
    expect(getOps(A.ydoc, SCRATCH).has('genesis-scratch')).toBe(false)

    expect(mapJSON(A.ydoc, TOYS_LAYER)).toEqual(toysMaps)
    expect(tipsOf(A, TOYS_LAYER)).toEqual(toysTips)
  })
})

describe('storage keys come from the descriptor', () => {
  test('toys uses its own namespaced keys', () => {
    const [A] = newPeers('alice')
    const op = addNode(A, TOYS_LAYER, 't1')

    expect(A.ydoc.getMap('ops:toys').get(op.id)).toEqual(op)
    expect(localStorage.getItem(`tt_head_toys_${A.tableId}`)).toBe(op.id)
    expect(A.toysEl.getAttribute('data-op-layer')).toBe('toys')
    expect(A.toysEl.getAttribute('data-id')).toBe('tt-layer-toys')

    setMergeTips(A.tableId, TOYS_LAYER, ['m1'])
    expect(localStorage.getItem(`tt_head_merge_toys_${A.tableId}`)).toBe('["m1"]')
  })

  test('a new layer uses its own keys and shares none of toys\'', () => {
    const [A] = newPeers('alice')
    const op = addNode(A, SCRATCH, 's1')

    expect(A.ydoc.getMap('ops:scratch').get(op.id)).toEqual(op)
    expect(A.ydoc.getMap('ops:toys').has(op.id)).toBe(false)
    expect(localStorage.getItem(`tt_head_scratch_${A.tableId}`)).toBe(op.id)
    expect(localStorage.getItem(`tt_head_toys_${A.tableId}`)).toBe('genesis-toys')
    expect(A.scratchEl.getAttribute('data-op-layer')).toBe('scratch')
    expect(A.scratchEl.getAttribute('data-id')).toBe('tt-layer-scratch')
  })
})
