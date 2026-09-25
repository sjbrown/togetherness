/**
 * tests/unit/op-checkpoint.test.js
 *
 * checkpointOp freezes a layer's live contents as an operation.
 * projectFrom rebuilds a layer from the op log up to some head. Together
 * they replace revert: reprojection is checkpoint-then-replay, never
 * inverse-and-patch, and running it twice must be a no-op.
 */

// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  checkpointOp, nearestCheckpoint, applyOps, projectFrom, projectTips,
  ensureLayerId, isCheckpoint, LAYER_DATA_ID,
  opsSinceCheckpoint, shouldCheckpoint, CHECKPOINT_MIN_OPS,
  lastCheckpointTs, mergeCheckpointOp,
} from '../../src/op_checkpoint.js'
import { getOps, appendOp, isAncestor } from '../../src/op_dag.js'
import { serialize } from '../../src/op_wire_mutation.js'
import {
  addToy, activateAllToyScriptsDom,
  _clearSvgTextCache, _resetToyScriptState,
} from '../../src/toys.js'

const SVG_NS  = 'http://www.w3.org/2000/svg'
const __dir   = path.dirname(fileURLToPath(import.meta.url))
const TOY_DIR = path.resolve(__dir, '../../src/toy')

const TRAY_SUM_SVG  = fs.readFileSync(path.join(TOY_DIR, 'tray_sum.svg'), 'utf8')
const TRAY_JS       = fs.readFileSync(path.join(TOY_DIR, 'js/tray.js'), 'utf8')
const D6_SVG        = fs.readFileSync(path.join(TOY_DIR, 'dice_d6.svg'), 'utf8')
const DICE_UTILS_JS = fs.readFileSync(path.join(TOY_DIR, 'js/dice_utils.js'), 'utf8')

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === 'toy/tray_sum.svg')     return { ok: true, text: async () => TRAY_SUM_SVG }
    if (url === 'toy/js/tray.js')       return { ok: true, text: async () => TRAY_JS }
    if (url === 'toy/dice_d6.svg')      return { ok: true, text: async () => D6_SVG }
    if (url === 'toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

beforeEach(() => {
  _clearSvgTextCache(); _resetToyScriptState()
  delete globalThis.tray; delete globalThis.tray_sum; delete globalThis.dice
  vi.stubGlobal('fetch', stubToyFetch())
})
afterEach(() => { vi.unstubAllGlobals() })

const markup = (el) => el.innerHTML

function bareLayer(html = '') {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  el.innerHTML = html
  return el
}

async function toyLayer(...toys) {
  const ydoc = new Y.Doc()
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  for (const [id, toyType] of toys) {
    await addToy(ydoc, layerEl, { id, toyType, x: 0, y: 0, color: '#fff' })
  }
  activateAllToyScriptsDom(ydoc, layerEl)
  await new Promise(r => setTimeout(r, 0))
  return layerEl
}

describe('ensureLayerId', () => {
  test('stamps a data-id if the layer lacks one', () => {
    const el = bareLayer()
    ensureLayerId(el)
    expect(el.getAttribute('data-id')).toBe(LAYER_DATA_ID)
  })

  test('leaves an existing data-id alone', () => {
    const el = bareLayer()
    el.setAttribute('data-id', 'custom')
    ensureLayerId(el)
    expect(el.getAttribute('data-id')).toBe('custom')
  })
})

describe('checkpointOp', () => {
  test('an empty layer checkpoints to no mutations', () => {
    const op = checkpointOp(bareLayer())
    expect(op.mutations).toEqual([])
    expect(isCheckpoint(op)).toBe(true)
  })

  test('carries the caller-supplied id, parents, and authorId', () => {
    const op = checkpointOp(bareLayer(), { id: 'fixed-id', parents: ['p1'], authorId: 'alice' })
    expect(op).toMatchObject({ id: 'fixed-id', parents: ['p1'], authorId: 'alice' })
  })

  test('mints an id when none is supplied', () => {
    const a = checkpointOp(bareLayer('<rect/>'))
    const b = checkpointOp(bareLayer('<rect/>'))
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })

  test('two peers checkpointing the same content with the same supplied id and ts agree byte-for-byte', () => {
    const a = checkpointOp(bareLayer('<rect data-id="r" x="1"/>'), { id: 'x', ts: 1, authorId: 'alice' })
    const b = checkpointOp(bareLayer('<rect data-id="r" x="1"/>'), { id: 'x', ts: 1, authorId: 'alice' })
    expect(a).toEqual(b)
  })
})

describe('checkpoint round trip', () => {
  test('projecting a checkpoint reproduces the layer it was taken from', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1" fill="red"/></g>')
    const op = checkpointOp(source, { id: 'cp1', authorId: 'alice' })

    const ops = new Map([[op.id, op]])
    const target = bareLayer()
    projectFrom(target, ops, op.id)

    expect(markup(target)).toBe(markup(source))
  })

  test('a real placed toy survives checkpoint and projection', async () => {
    const source = await toyLayer(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const op = checkpointOp(source, { id: 'cp1', authorId: 'alice' })

    const ops = new Map([[op.id, op]])
    const target = bareLayer()
    projectFrom(target, ops, op.id)

    expect(markup(target)).toBe(markup(source))
  })

  test('projecting the same head twice leaves the same DOM (idempotent)', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1"/></g>')
    const op = checkpointOp(source, { id: 'cp1', authorId: 'alice' })
    const ops = new Map([[op.id, op]])

    const target = bareLayer()
    projectFrom(target, ops, op.id)
    const once = markup(target)
    projectFrom(target, ops, op.id)
    expect(markup(target)).toBe(once)
  })

  test('projecting null head yields an empty layer', () => {
    const target = bareLayer('<rect/>')
    projectFrom(target, new Map(), null)
    expect(target.childNodes.length).toBe(0)
  })
})

describe('nearestCheckpoint', () => {
  test('finds a checkpoint at the head itself', () => {
    const ops = new Map()
    const cp = checkpointOp(bareLayer(), { id: 'cp', authorId: 'a' })
    ops.set(cp.id, cp)
    expect(nearestCheckpoint(ops, 'cp')).toBe('cp')
  })

  test('finds a checkpoint several ops back', () => {
    const ops = new Map()
    const cp = checkpointOp(bareLayer(), { id: 'cp', authorId: 'a' })
    ops.set(cp.id, cp)
    ops.set('m1', { id: 'm1', parents: ['cp'], authorId: 'a', gesture: 'move', mutations: [] })
    ops.set('m2', { id: 'm2', parents: ['m1'], authorId: 'a', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, 'm2')).toBe('cp')
  })

  test('picks the later of two checkpoints in the same ancestry', () => {
    const ops = new Map()
    const cp1 = checkpointOp(bareLayer(), { id: 'cp1', authorId: 'a' })
    ops.set(cp1.id, cp1)
    const cp2 = checkpointOp(bareLayer(), { id: 'cp2', parents: ['cp1'], authorId: 'a' })
    ops.set(cp2.id, cp2)
    ops.set('m1', { id: 'm1', parents: ['cp2'], authorId: 'a', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, 'm1')).toBe('cp2')
  })

  test('null for a branch with no checkpoint at all', () => {
    const ops = new Map([
      ['g', { id: 'g', parents: [], authorId: 'a', gesture: 'move', mutations: [] }],
    ])
    expect(nearestCheckpoint(ops, 'g')).toBeNull()
  })

  test('null head yields null', () => {
    expect(nearestCheckpoint(new Map(), null)).toBeNull()
  })
})

// Builds a checkpoint followed by a straight-line chain of `n` trivial
// move ops, returning the ops map and the tip id.
function chainAfterCheckpoint(n, { checkpointId = 'cp' } = {}) {
  const ops = new Map()
  const cp = checkpointOp(bareLayer(), { id: checkpointId, authorId: 'a' })
  ops.set(cp.id, cp)
  let tip = cp.id
  for (let i = 0; i < n; i++) {
    const id = `m${i}`
    ops.set(id, { id, parents: [tip], authorId: 'a', gesture: 'move', mutations: [] })
    tip = id
  }
  return { ops, tip }
}

describe('opsSinceCheckpoint / shouldCheckpoint', () => {
  test('zero ops past a checkpoint at the head itself', () => {
    const { ops, tip } = chainAfterCheckpoint(0)
    expect(opsSinceCheckpoint(ops, tip)).toBe(0)
    expect(shouldCheckpoint(ops, tip)).toBe(false)
  })

  test('counts the ops between the head and its nearest checkpoint', () => {
    const { ops, tip } = chainAfterCheckpoint(5)
    expect(opsSinceCheckpoint(ops, tip)).toBe(5)
  })

  test('exactly CHECKPOINT_MIN_OPS is not yet worth checkpointing', () => {
    const { ops, tip } = chainAfterCheckpoint(CHECKPOINT_MIN_OPS)
    expect(opsSinceCheckpoint(ops, tip)).toBe(CHECKPOINT_MIN_OPS)
    expect(shouldCheckpoint(ops, tip)).toBe(false)
  })

  test('one past CHECKPOINT_MIN_OPS is worth checkpointing', () => {
    const { ops, tip } = chainAfterCheckpoint(CHECKPOINT_MIN_OPS + 1)
    expect(shouldCheckpoint(ops, tip)).toBe(true)
  })

  test('a branch with no checkpoint at all counts from genesis', () => {
    const ops = new Map([
      ['g',  { id: 'g',  parents: [],    authorId: 'a', gesture: 'move', mutations: [] }],
      ['m1', { id: 'm1', parents: ['g'], authorId: 'a', gesture: 'move', mutations: [] }],
    ])
    expect(opsSinceCheckpoint(ops, 'm1')).toBe(2)
  })

  test('null head is never worth checkpointing', () => {
    expect(opsSinceCheckpoint(new Map(), null)).toBe(0)
    expect(shouldCheckpoint(new Map(), null)).toBe(false)
  })
})

describe('lastCheckpointTs', () => {
  test('null when the log has no checkpoints at all', () => {
    const ops = new Map([
      ['g', { id: 'g', parents: [], authorId: 'a', gesture: 'move', mutations: [], ts: 100 }],
    ])
    expect(lastCheckpointTs(ops)).toBeNull()
  })

  test('the single checkpoint\'s ts', () => {
    const ops = new Map()
    ops.set('cp', checkpointOp(bareLayer(), { id: 'cp', authorId: 'a', ts: 500 }))
    expect(lastCheckpointTs(ops)).toBe(500)
  })

  test('the latest, not the first, among several checkpoints', () => {
    const ops = new Map()
    ops.set('cp1', checkpointOp(bareLayer(), { id: 'cp1', authorId: 'a', ts: 100 }))
    ops.set('cp2', checkpointOp(bareLayer(), { id: 'cp2', parents: ['cp1'], authorId: 'b', ts: 900 }))
    ops.set('cp3', checkpointOp(bareLayer(), { id: 'cp3', parents: ['cp1'], authorId: 'c', ts: 300 }))
    expect(lastCheckpointTs(ops)).toBe(900)
  })

  test('is not scoped to any one branch — considers every checkpoint in the map', () => {
    // cp-b is on a sibling branch, not an ancestor of cp-a's descendants,
    // but still counts: "since a checkpoint landed" is a global fact.
    const ops = new Map()
    ops.set('root', { id: 'root', parents: [], authorId: 'a', gesture: 'move', mutations: [], ts: 0 })
    ops.set('cp-a', checkpointOp(bareLayer(), { id: 'cp-a', parents: ['root'], authorId: 'a', ts: 100 }))
    ops.set('cp-b', checkpointOp(bareLayer(), { id: 'cp-b', parents: ['root'], authorId: 'b', ts: 700 }))
    expect(lastCheckpointTs(ops)).toBe(700)
  })
})

describe('projectFrom replays forward from a checkpoint', () => {
  test('a checkpoint plus one mutation projects to the mutated state', () => {
    const base = bareLayer('<rect data-id="r" x="1"/>')
    const cp = checkpointOp(base, { id: 'cp', authorId: 'alice' })

    const scratch = bareLayer('<rect data-id="r" x="1"/>')
    ensureLayerId(scratch)
    scratch.querySelector('[data-id="r"]').setAttribute('x', '99')
    const mo = new MutationObserver(() => {})
    const move = {
      id: 'm1', parents: [cp.id], authorId: 'alice', gesture: 'move', ts: 2,
      mutations: serialize([{
        type: 'attributes', target: scratch.querySelector('[data-id="r"]'),
        attributeName: 'x', oldValue: '1',
      }]),
    }

    const ops = new Map([[cp.id, cp], [move.id, move]])
    const target = bareLayer()
    projectFrom(target, ops, move.id)

    expect(target.querySelector('[data-id="r"]').getAttribute('x')).toBe('99')
  })

  test('two branches from a shared checkpoint project to different, correct states', () => {
    const base = bareLayer('<g data-id="p"><rect data-id="a" x="0"/><rect data-id="b" x="0"/></g>')
    const cp = checkpointOp(base, { id: 'cp', authorId: 'alice' })

    const mkMove = (id, targetId, value) => {
      const scratch = bareLayer(markup(base))
      const el = scratch.querySelector(`[data-id="${targetId}"]`)
      const before = el.getAttribute('x')
      el.setAttribute('x', value)
      return {
        id, parents: [cp.id], authorId: 'alice', gesture: 'move', ts: 2,
        mutations: serialize([{
          type: 'attributes', target: el, attributeName: 'x', oldValue: before,
        }]),
      }
    }

    const moveA = mkMove('mA', 'a', '10')
    const moveB = mkMove('mB', 'b', '20')

    const ops = new Map([[cp.id, cp], [moveA.id, moveA], [moveB.id, moveB]])

    const branchA = bareLayer()
    projectFrom(branchA, ops, moveA.id)
    const branchB = bareLayer()
    projectFrom(branchB, ops, moveB.id)

    expect(branchA.querySelector('[data-id="a"]').getAttribute('x')).toBe('10')
    expect(branchA.querySelector('[data-id="b"]').getAttribute('x')).toBe('0')
    expect(branchB.querySelector('[data-id="a"]').getAttribute('x')).toBe('0')
    expect(branchB.querySelector('[data-id="b"]').getAttribute('x')).toBe('20')
  })
})

describe('projectFrom with a checkpoint that is not the projection base', () => {
  test('two checkpoints on concurrent branches: projecting the merge yields each element exactly once', () => {
    const base = bareLayer('<rect data-id="a"/><rect data-id="b"/>')
    const genesis = checkpointOp(base, { id: 'genesis', authorId: 'alice' })

    const branchA = bareLayer(markup(base))
    ensureLayerId(branchA)
    const ckA = checkpointOp(branchA, { id: 'ckA', authorId: 'alice', parents: ['genesis'] })

    const branchB = bareLayer(markup(base))
    ensureLayerId(branchB)
    const ckB = checkpointOp(branchB, { id: 'ckB', authorId: 'bob', parents: ['genesis'] })

    // A merge commit joining both concurrent checkpoints. Its own
    // mutations are irrelevant here — what matters is that nearestCheckpoint
    // must pick one of ckA/ckB as the base, and the other one, reachable
    // only via the path, must not be applied as a delta.
    const merge = { id: 'merge', parents: ['ckA', 'ckB'], authorId: 'alice', gesture: 'merge', mutations: [] }

    const ops = new Map([
      [genesis.id, genesis], [ckA.id, ckA], [ckB.id, ckB], [merge.id, merge],
    ])

    const target = bareLayer()
    projectFrom(target, ops, 'merge')

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'b'])
  })

  test('genesis plus a later checkpoint: projecting yields each element exactly once', () => {
    const genesisSource = bareLayer('<rect data-id="a"/>')
    const genesis = checkpointOp(genesisSource, { id: 'genesis', authorId: 'alice' })

    const laterSource = bareLayer('<rect data-id="a"/><rect data-id="b"/>')
    const later = checkpointOp(laterSource, { id: 'later', authorId: 'alice', parents: ['genesis'] })

    const ops = new Map([[genesis.id, genesis], [later.id, later]])
    const target = bareLayer()
    projectFrom(target, ops, 'later')

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'b'])
  })
})

describe('nearestCheckpoint over a tip set (the cut rule)', () => {
  test('a checkpoint on only one branch of a merge is not a cut', () => {
    const ops = new Map()
    const genesis = checkpointOp(bareLayer('<rect data-id="a"/>'), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    // A checkpoint written on branch p only — it does not compare to q,
    // which shares no ancestry with it beyond genesis.
    const ckP = checkpointOp(bareLayer('<rect data-id="a"/><rect data-id="p"/>'),
      { id: 'ckP', authorId: 'alice', parents: ['genesis'] })
    ops.set(ckP.id, ckP)
    ops.set('q', { id: 'q', parents: ['genesis'], authorId: 'bob', gesture: 'move', mutations: [] })

    // Tips: the tip of P's branch (past its own checkpoint) and q.
    expect(nearestCheckpoint(ops, ['ckP', 'q'])).toBe('genesis')
  })

  test('a checkpoint that dominates every tip is still picked', () => {
    const ops = new Map()
    const cp = checkpointOp(bareLayer(), { id: 'cp', authorId: 'alice' })
    ops.set(cp.id, cp)
    ops.set('p', { id: 'p', parents: ['cp'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('q', { id: 'q', parents: ['cp'], authorId: 'bob', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, ['p', 'q'])).toBe('cp')
  })

  test('a single-tip call behaves exactly as before', () => {
    const { ops, tip } = chainAfterCheckpoint(3)
    expect(nearestCheckpoint(ops, tip)).toBe(nearestCheckpoint(ops, [tip]))
  })
})

describe('projectTips', () => {
  test('one tip is the same as projectFrom', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1"/></g>')
    const op = checkpointOp(source, { id: 'cp1', authorId: 'alice' })
    const ops = new Map([[op.id, op]])

    const a = bareLayer(); projectFrom(a, ops, op.id)
    const b = bareLayer(); projectTips(b, ops, [op.id])
    expect(markup(a)).toBe(markup(b))
  })

  test('empty tips yields an empty layer', () => {
    const target = bareLayer('<rect/>')
    projectTips(target, new Map(), [])
    expect(target.childNodes.length).toBe(0)
  })

  test('a cut-checkpoint case: projecting two merge tips uses the earlier common cut, not a one-branch checkpoint', () => {
    // genesis -> p1 (adds "p") -> cp1 (a checkpoint of a+p) -> p2 (adds
    // "p2"), on one branch; genesis -> q (adds "q") concurrently on the
    // other, never merged. cp1 does not dominate q, so the projection
    // base for the tip set {p2, q} must be genesis, not cp1 — picking cp1
    // would skip p1 and (because a checkpoint contributes nothing as a
    // delta) drop "p" from the result entirely.
    const ops = new Map()
    const add = (id, parents, authorId, childId) => ({
      id, parents, authorId, gesture: 'drop', ts: 0,
      mutations: [{
        t: 'child', target: { id: 'tt-layer-toys' },
        added: [{ el: 'rect', at: [['data-id', childId]] }], removed: [],
        prevSibling: null, nextSibling: null,
      }],
    })

    const genesis = checkpointOp(bareLayer('<rect data-id="a"/>'), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    ops.set('p1', add('p1', ['genesis'], 'alice', 'p'))
    const cp1 = checkpointOp(bareLayer('<rect data-id="a"/><rect data-id="p"/>'),
      { id: 'cp1', authorId: 'alice', parents: ['p1'] })
    ops.set(cp1.id, cp1)
    ops.set('p2', add('p2', ['cp1'], 'alice', 'p2'))
    ops.set('q', add('q', ['genesis'], 'bob', 'q'))

    expect(nearestCheckpoint(ops, ['p2', 'q'])).toBe('genesis')

    const target = bareLayer()
    projectTips(target, ops, ['p2', 'q'])

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'p', 'p2', 'q'])
  })
})

describe('mergeCheckpointOp', () => {
  const add = (id, parents, authorId, childId, ts) => ({
    id, parents, authorId, gesture: 'drop', ts,
    mutations: [{
      t: 'child', target: { id: LAYER_DATA_ID },
      added: [{ el: 'rect', at: [['data-id', childId]] }], removed: [],
      prevSibling: null, nextSibling: null,
    }],
  })

  function twoConcurrentTips() {
    const ops = new Map()
    const genesis = checkpointOp(bareLayer(), { id: 'genesis', authorId: 'alice', ts: 0 })
    ops.set(genesis.id, genesis)
    ops.set('p', add('p', ['genesis'], 'alice', 'p', 10))
    ops.set('q', add('q', ['genesis'], 'bob', 'q', 20))
    return { ops, tips: ['p', 'q'] }
  }

  test('two peers rebuilding the same tips produce byte-identical checkpoints — same id', () => {
    const { ops, tips } = twoConcurrentTips()

    const layerA = bareLayer(); ensureLayerId(layerA)
    projectTips(layerA, ops, tips)
    const layerB = bareLayer(); ensureLayerId(layerB)
    projectTips(layerB, ops, tips)

    const ckA = mergeCheckpointOp(layerA, tips, ops)
    const ckB = mergeCheckpointOp(layerB, tips, ops)

    expect(ckA.id).toBe(ckB.id)
    expect(ckA).toEqual(ckB)
  })

  test('is a checkpoint, authored by nobody, parented on the sorted tips', () => {
    const { ops } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer)
    projectTips(layer, ops, ['q', 'p'])

    const ck = mergeCheckpointOp(layer, ['q', 'p'], ops)
    expect(isCheckpoint(ck)).toBe(true)
    expect(ck.authorId).toBeNull()
    expect(ck.parents).toEqual(['p', 'q'])
  })

  test('ts is the latest of the parents\' ts', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer)
    projectTips(layer, ops, tips)
    expect(mergeCheckpointOp(layer, tips, ops).ts).toBe(20)
  })

  test('content equals a fresh projectTips of the same tips', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer)
    projectTips(layer, ops, tips)
    const ck = mergeCheckpointOp(layer, tips, ops)

    const scratch = bareLayer(); ensureLayerId(scratch)
    projectTips(scratch, ops, tips)
    const expected = checkpointOp(scratch, { authorId: null, parents: [...tips].sort(), ts: ck.ts })

    expect(ck.mutations).toEqual(expected.mutations)
  })

  test('different rebuilt content, same tips, yields a different id', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer)
    projectTips(layer, ops, tips)
    const ck = mergeCheckpointOp(layer, tips, ops)

    const otherLayer = bareLayer('<rect data-id="extra"/>'); ensureLayerId(otherLayer)
    const other = mergeCheckpointOp(otherLayer, tips, ops)

    expect(other.id).not.toBe(ck.id)
  })
})

describe('an idle checkpoint with merge tips: parents must be the full tip set to stay a true cut', () => {
  // head and mtip both descend from genesis — a peer sitting on a head
  // plus one pending merge tip, the shape maybeCheckpoint now has to
  // handle. Two peers who each build a further op directly on top of the
  // checkpoint (as OpHead.consumeParents would hand out once local tips
  // collapse to it) is the "next rebuild uses it as a cut" case; a
  // checkpoint's own ancestor edges recording the wrong tip set is a
  // separate, graph-fidelity bug that only shows up as isAncestor lying
  // about what a checkpoint's content actually depends on.
  function seedHeadAndMergeTip() {
    const ops = new Map()
    const genesis = checkpointOp(bareLayer(), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    ops.set('head', { id: 'head', parents: ['genesis'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('mtip', { id: 'mtip', parents: ['genesis'], authorId: 'bob', gesture: 'move', mutations: [] })
    return ops
  }

  test('parents = the full tip set records every tip as an ancestor', () => {
    const ops = seedHeadAndMergeTip()
    const ck = checkpointOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head', 'mtip'] })
    ops.set(ck.id, ck)

    expect(isAncestor(ops, 'head', 'ck')).toBe(true)
    expect(isAncestor(ops, 'mtip', 'ck')).toBe(true)
  })

  test('parents = [head] alone silently drops mtip from the graph, even though the checkpoint\'s DOM content already includes mtip\'s mutations', () => {
    const ops = seedHeadAndMergeTip()
    const ck = checkpointOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head'] })
    ops.set(ck.id, ck)

    expect(isAncestor(ops, 'head', 'ck')).toBe(true)
    // The bug §5.6/§6.1 rules out: mtip's content is in ck (checkpointOp
    // reads the live DOM, which already absorbed the merge tip), but
    // dropping it from `parents` makes the graph deny that dependency —
    // isAncestor(mtip, ck) is wrongly false.
    expect(isAncestor(ops, 'mtip', 'ck')).toBe(false)
  })

  test('the next rebuild, once both peers commit directly on top of the checkpoint, uses it as its cut', () => {
    const ops = seedHeadAndMergeTip()
    const ck = checkpointOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head', 'mtip'] })
    ops.set(ck.id, ck)
    ops.set('p2', { id: 'p2', parents: ['ck'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('q2', { id: 'q2', parents: ['ck'], authorId: 'bob', gesture: 'move', mutations: [] })

    expect(nearestCheckpoint(ops, ['p2', 'q2'])).toBe('ck')
    expect(opsSinceCheckpoint(ops, ['p2', 'q2'])).toBe(2) // just p2, q2 — not head/mtip/genesis again
  })
})

describe('applyOps', () => {
  test('throws on an operation id not present in the log', () => {
    expect(() => applyOps(bareLayer(), new Map(), ['missing'])).toThrow(/no operation/)
  })

  test('applies in the given order, not insertion order of the map', () => {
    const base = bareLayer('<rect data-id="r" x="0"/>')
    ensureLayerId(base)
    const target = bareLayer()
    ensureLayerId(target)

    const step = (id, parents, from, to) => ({
      id, parents, authorId: 'a', gesture: 'move', ts: 0,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: from, newValue: to }],
    })

    const cp = checkpointOp(base, { id: 'cp', authorId: 'a' })
    const s2 = step('s2', ['s1'], '1', '2')
    const s1 = step('s1', ['cp'], '0', '1')

    const ops = new Map([['s2', s2], ['s1', s1], ['cp', cp]])
    applyOps(target, ops, ['cp', 's1', 's2'])
    expect(target.querySelector('[data-id="r"]').getAttribute('x')).toBe('2')
  })
})
