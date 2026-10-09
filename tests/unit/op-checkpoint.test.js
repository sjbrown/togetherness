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
import { ensureLayerId } from '../../src/op_layers.js'
import { TOYS_LAYER } from '../../src/toys.js'
import {
  checkpointOp, nearestCheckpoint, applyOps, projectFrom, projectTips,
  isCheckpoint, opsSinceCheckpoint, shouldCheckpoint, CHECKPOINT_MIN_OPS,
  lastCheckpointTs, mergeCheckpointOp, buildForkSeed,
} from '../../src/op_checkpoint.js'
import { getOps, getContent, appendOp, appendCheckpoint, isAncestor } from '../../src/op_dag.js'
import { tablesAPI } from '../../src/tables.js'
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

const content = new Map()
beforeEach(() => content.clear())

/** checkpointOp, recording the snapshot in the shared content map. */
function ckOp(el, opts) {
  const { op, content: snapshot } = checkpointOp(el, opts)
  content.set(op.id, snapshot)
  return op
}

const markup = (el) => el.innerHTML

function bareLayer(html = '') {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  ensureLayerId(el, TOYS_LAYER)
  el.innerHTML = html
  return el
}

async function toyLayer(...toys) {
  const ydoc = new Y.Doc()
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  ensureLayerId(layerEl, TOYS_LAYER)
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
    ensureLayerId(el, TOYS_LAYER)
    expect(el.getAttribute('data-id')).toBe(TOYS_LAYER.layerDataId)
  })

  test('leaves an existing data-id alone', () => {
    const el = bareLayer()
    el.setAttribute('data-id', 'custom')
    ensureLayerId(el, TOYS_LAYER)
    expect(el.getAttribute('data-id')).toBe('custom')
  })
})

describe('checkpointOp', () => {
  test('an empty layer checkpoints to no mutations', () => {
    const { op, content: snapshot } = checkpointOp(bareLayer())
    expect(snapshot).toEqual([])
    expect(op.mutations).toEqual([])
    expect(isCheckpoint(op)).toBe(true)
  })

  test('carries the caller-supplied id, parents, and authorId', () => {
    const { op } = checkpointOp(bareLayer(), { id: 'fixed-id', parents: ['p1'], authorId: 'alice' })
    expect(op).toMatchObject({ id: 'fixed-id', parents: ['p1'], authorId: 'alice' })
  })

  test('mints an id when none is supplied', () => {
    const { op: a } = checkpointOp(bareLayer('<rect/>'))
    const { op: b } = checkpointOp(bareLayer('<rect/>'))
    expect(a.id).toBeTruthy()
    expect(a.id).not.toBe(b.id)
  })

  test('two peers checkpointing the same content with the same supplied id and ts agree byte-for-byte', () => {
    const a = checkpointOp(bareLayer('<rect data-id="r" x="1"/>'), { id: 'x', ts: 1, authorId: 'alice' })
    const b = checkpointOp(bareLayer('<rect data-id="r" x="1"/>'), { id: 'x', ts: 1, authorId: 'alice' })
    expect(a).toEqual(b)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('checkpoint round trip', () => {
  test('projecting a checkpoint reproduces the layer it was taken from', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1" fill="red"/></g>')
    const op = ckOp(source, { id: 'cp1', authorId: 'alice' })

    const ops = new Map([[op.id, op]])
    const target = bareLayer()
    projectFrom(target, ops, content, op.id)

    expect(markup(target)).toBe(markup(source))
  })

  test('a real placed toy survives checkpoint and projection', async () => {
    const source = await toyLayer(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const op = ckOp(source, { id: 'cp1', authorId: 'alice' })

    const ops = new Map([[op.id, op]])
    const target = bareLayer()
    projectFrom(target, ops, content, op.id)

    expect(markup(target)).toBe(markup(source))
  })

  test('projecting the same head twice leaves the same DOM (idempotent)', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1"/></g>')
    const op = ckOp(source, { id: 'cp1', authorId: 'alice' })
    const ops = new Map([[op.id, op]])

    const target = bareLayer()
    projectFrom(target, ops, content, op.id)
    const once = markup(target)
    projectFrom(target, ops, content, op.id)
    expect(markup(target)).toBe(once)
  })

  test('projecting null head yields an empty layer', () => {
    const target = bareLayer('<rect/>')
    projectFrom(target, new Map(), content, null)
    expect(target.childNodes.length).toBe(0)
  })
})

describe('nearestCheckpoint', () => {
  test('finds a checkpoint at the head itself', () => {
    const ops = new Map()
    const cp = ckOp(bareLayer(), { id: 'cp', authorId: 'a' })
    ops.set(cp.id, cp)
    expect(nearestCheckpoint(ops, content, 'cp')).toBe('cp')
  })

  test('finds a checkpoint several ops back', () => {
    const ops = new Map()
    const cp = ckOp(bareLayer(), { id: 'cp', authorId: 'a' })
    ops.set(cp.id, cp)
    ops.set('m1', { id: 'm1', parents: ['cp'], authorId: 'a', gesture: 'move', mutations: [] })
    ops.set('m2', { id: 'm2', parents: ['m1'], authorId: 'a', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, content, 'm2')).toBe('cp')
  })

  test('picks the later of two checkpoints in the same ancestry', () => {
    const ops = new Map()
    const cp1 = ckOp(bareLayer(), { id: 'cp1', authorId: 'a' })
    ops.set(cp1.id, cp1)
    const cp2 = ckOp(bareLayer(), { id: 'cp2', parents: ['cp1'], authorId: 'a' })
    ops.set(cp2.id, cp2)
    ops.set('m1', { id: 'm1', parents: ['cp2'], authorId: 'a', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, content, 'm1')).toBe('cp2')
  })

  test('null for a branch with no checkpoint at all', () => {
    const ops = new Map([
      ['g', { id: 'g', parents: [], authorId: 'a', gesture: 'move', mutations: [] }],
    ])
    expect(nearestCheckpoint(ops, content, 'g')).toBeNull()
  })

  test('null head yields null', () => {
    expect(nearestCheckpoint(new Map(), content, null)).toBeNull()
  })
})

// Builds a checkpoint followed by a straight-line chain of `n` trivial
// move ops, returning the ops map and the tip id.
function chainAfterCheckpoint(n, { checkpointId = 'cp' } = {}) {
  const ops = new Map()
  const cp = ckOp(bareLayer(), { id: checkpointId, authorId: 'a' })
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
    ops.set('cp', ckOp(bareLayer(), { id: 'cp', authorId: 'a', ts: 500 }))
    expect(lastCheckpointTs(ops)).toBe(500)
  })

  test('the latest, not the first, among several checkpoints', () => {
    const ops = new Map()
    ops.set('cp1', ckOp(bareLayer(), { id: 'cp1', authorId: 'a', ts: 100 }))
    ops.set('cp2', ckOp(bareLayer(), { id: 'cp2', parents: ['cp1'], authorId: 'b', ts: 900 }))
    ops.set('cp3', ckOp(bareLayer(), { id: 'cp3', parents: ['cp1'], authorId: 'c', ts: 300 }))
    expect(lastCheckpointTs(ops)).toBe(900)
  })

  test('is not scoped to any one branch — considers every checkpoint in the map', () => {
    // cp-b is on a sibling branch, not an ancestor of cp-a's descendants,
    // but still counts: "since a checkpoint landed" is a global fact.
    const ops = new Map()
    ops.set('root', { id: 'root', parents: [], authorId: 'a', gesture: 'move', mutations: [], ts: 0 })
    ops.set('cp-a', ckOp(bareLayer(), { id: 'cp-a', parents: ['root'], authorId: 'a', ts: 100 }))
    ops.set('cp-b', ckOp(bareLayer(), { id: 'cp-b', parents: ['root'], authorId: 'b', ts: 700 }))
    expect(lastCheckpointTs(ops)).toBe(700)
  })
})

describe('projectFrom replays forward from a checkpoint', () => {
  test('a checkpoint plus one mutation projects to the mutated state', () => {
    const base = bareLayer('<rect data-id="r" x="1"/>')
    const cp = ckOp(base, { id: 'cp', authorId: 'alice' })

    const scratch = bareLayer('<rect data-id="r" x="1"/>')
    ensureLayerId(scratch, TOYS_LAYER)
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
    projectFrom(target, ops, content, move.id)

    expect(target.querySelector('[data-id="r"]').getAttribute('x')).toBe('99')
  })

  test('two branches from a shared checkpoint project to different, correct states', () => {
    const base = bareLayer('<g data-id="p"><rect data-id="a" x="0"/><rect data-id="b" x="0"/></g>')
    const cp = ckOp(base, { id: 'cp', authorId: 'alice' })

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
    projectFrom(branchA, ops, content, moveA.id)
    const branchB = bareLayer()
    projectFrom(branchB, ops, content, moveB.id)

    expect(branchA.querySelector('[data-id="a"]').getAttribute('x')).toBe('10')
    expect(branchA.querySelector('[data-id="b"]').getAttribute('x')).toBe('0')
    expect(branchB.querySelector('[data-id="a"]').getAttribute('x')).toBe('0')
    expect(branchB.querySelector('[data-id="b"]').getAttribute('x')).toBe('20')
  })
})

describe('projectFrom with a checkpoint that is not the projection base', () => {
  test('two checkpoints on concurrent branches: projecting the merge yields each element exactly once', () => {
    const base = bareLayer('<rect data-id="a"/><rect data-id="b"/>')
    const genesis = ckOp(base, { id: 'genesis', authorId: 'alice' })

    const branchA = bareLayer(markup(base))
    ensureLayerId(branchA, TOYS_LAYER)
    const ckA = ckOp(branchA, { id: 'ckA', authorId: 'alice', parents: ['genesis'] })

    const branchB = bareLayer(markup(base))
    ensureLayerId(branchB, TOYS_LAYER)
    const ckB = ckOp(branchB, { id: 'ckB', authorId: 'bob', parents: ['genesis'] })

    // A merge commit joining both concurrent checkpoints. Its own
    // mutations are irrelevant here — what matters is that nearestCheckpoint
    // must pick one of ckA/ckB as the base, and the other one, reachable
    // only via the path, must not be applied as a delta.
    const merge = { id: 'merge', parents: ['ckA', 'ckB'], authorId: 'alice', gesture: 'merge', mutations: [] }

    const ops = new Map([
      [genesis.id, genesis], [ckA.id, ckA], [ckB.id, ckB], [merge.id, merge],
    ])

    const target = bareLayer()
    projectFrom(target, ops, content, 'merge')

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'b'])
  })

  test('genesis plus a later checkpoint: projecting yields each element exactly once', () => {
    const genesisSource = bareLayer('<rect data-id="a"/>')
    const genesis = ckOp(genesisSource, { id: 'genesis', authorId: 'alice' })

    const laterSource = bareLayer('<rect data-id="a"/><rect data-id="b"/>')
    const later = ckOp(laterSource, { id: 'later', authorId: 'alice', parents: ['genesis'] })

    const ops = new Map([[genesis.id, genesis], [later.id, later]])
    const target = bareLayer()
    projectFrom(target, ops, content, 'later')

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'b'])
  })
})

describe('nearestCheckpoint over a tip set (the cut rule)', () => {
  test('a checkpoint on only one branch of a merge is not a cut', () => {
    const ops = new Map()
    const genesis = ckOp(bareLayer('<rect data-id="a"/>'), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    // A checkpoint written on branch p only — it does not compare to q,
    // which shares no ancestry with it beyond genesis.
    const ckP = ckOp(bareLayer('<rect data-id="a"/><rect data-id="p"/>'),
      { id: 'ckP', authorId: 'alice', parents: ['genesis'] })
    ops.set(ckP.id, ckP)
    ops.set('q', { id: 'q', parents: ['genesis'], authorId: 'bob', gesture: 'move', mutations: [] })

    // Tips: the tip of P's branch (past its own checkpoint) and q.
    expect(nearestCheckpoint(ops, content, ['ckP', 'q'])).toBe('genesis')
  })

  test('a checkpoint that dominates every tip is still picked', () => {
    const ops = new Map()
    const cp = ckOp(bareLayer(), { id: 'cp', authorId: 'alice' })
    ops.set(cp.id, cp)
    ops.set('p', { id: 'p', parents: ['cp'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('q', { id: 'q', parents: ['cp'], authorId: 'bob', gesture: 'move', mutations: [] })
    expect(nearestCheckpoint(ops, content, ['p', 'q'])).toBe('cp')
  })

  test('a single-tip call behaves exactly as before', () => {
    const { ops, tip } = chainAfterCheckpoint(3)
    expect(nearestCheckpoint(ops, content, tip)).toBe(nearestCheckpoint(ops, content, [tip]))
  })
})

describe('projectTips', () => {
  test('one tip is the same as projectFrom', () => {
    const source = bareLayer('<g data-id="p"><rect data-id="r" x="1"/></g>')
    const op = ckOp(source, { id: 'cp1', authorId: 'alice' })
    const ops = new Map([[op.id, op]])

    const a = bareLayer(); projectFrom(a, ops, content, op.id)
    const b = bareLayer(); projectTips(b, ops, content, [op.id])
    expect(markup(a)).toBe(markup(b))
  })

  test('empty tips yields an empty layer', () => {
    const target = bareLayer('<rect/>')
    projectTips(target, new Map(), content, [])
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

    const genesis = ckOp(bareLayer('<rect data-id="a"/>'), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    ops.set('p1', add('p1', ['genesis'], 'alice', 'p'))
    const cp1 = ckOp(bareLayer('<rect data-id="a"/><rect data-id="p"/>'),
      { id: 'cp1', authorId: 'alice', parents: ['p1'] })
    ops.set(cp1.id, cp1)
    ops.set('p2', add('p2', ['cp1'], 'alice', 'p2'))
    ops.set('q', add('q', ['genesis'], 'bob', 'q'))

    expect(nearestCheckpoint(ops, content, ['p2', 'q'])).toBe('genesis')

    const target = bareLayer()
    projectTips(target, ops, content, ['p2', 'q'])

    const ids = [...target.children].map(c => c.getAttribute('data-id')).sort()
    expect(ids).toEqual(['a', 'p', 'p2', 'q'])
  })
})

describe('mergeCheckpointOp', () => {
  const add = (id, parents, authorId, childId, ts) => ({
    id, parents, authorId, gesture: 'drop', ts,
    mutations: [{
      t: 'child', target: { id: TOYS_LAYER.layerDataId },
      added: [{ el: 'rect', at: [['data-id', childId]] }], removed: [],
      prevSibling: null, nextSibling: null,
    }],
  })

  function twoConcurrentTips() {
    const ops = new Map()
    const genesis = ckOp(bareLayer(), { id: 'genesis', authorId: 'alice', ts: 0 })
    ops.set(genesis.id, genesis)
    ops.set('p', add('p', ['genesis'], 'alice', 'p', 10))
    ops.set('q', add('q', ['genesis'], 'bob', 'q', 20))
    return { ops, tips: ['p', 'q'] }
  }

  test('two peers rebuilding the same tips produce byte-identical checkpoints — same id', () => {
    const { ops, tips } = twoConcurrentTips()

    const layerA = bareLayer(); ensureLayerId(layerA, TOYS_LAYER)
    projectTips(layerA, ops, content, tips)
    const layerB = bareLayer(); ensureLayerId(layerB, TOYS_LAYER)
    projectTips(layerB, ops, content, tips)

    const ckA = mergeCheckpointOp(layerA, tips, ops)
    const ckB = mergeCheckpointOp(layerB, tips, ops)

    expect(ckA.op.id).toBe(ckB.op.id)
    expect(ckA).toEqual(ckB)
    expect(JSON.stringify(ckA)).toBe(JSON.stringify(ckB))
  })

  test('is a checkpoint, authored by nobody, parented on the sorted tips', () => {
    const { ops } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer, TOYS_LAYER)
    projectTips(layer, ops, content, ['q', 'p'])

    const { op: ck } = mergeCheckpointOp(layer, ['q', 'p'], ops)
    expect(isCheckpoint(ck)).toBe(true)
    expect(ck.authorId).toBeNull()
    expect(ck.parents).toEqual(['p', 'q'])
  })

  test('ts is the latest of the parents\' ts', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer, TOYS_LAYER)
    projectTips(layer, ops, content, tips)
    expect(mergeCheckpointOp(layer, tips, ops).op.ts).toBe(20)
  })

  test('content equals a fresh projectTips of the same tips', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer, TOYS_LAYER)
    projectTips(layer, ops, content, tips)
    const ck = mergeCheckpointOp(layer, tips, ops)

    const scratch = bareLayer(); ensureLayerId(scratch, TOYS_LAYER)
    projectTips(scratch, ops, content, tips)
    const expected = checkpointOp(scratch, { authorId: null, parents: [...tips].sort(), ts: ck.op.ts })

    expect(ck.content).toEqual(expected.content)
  })

  test('different rebuilt content, same tips, yields a different id', () => {
    const { ops, tips } = twoConcurrentTips()
    const layer = bareLayer(); ensureLayerId(layer, TOYS_LAYER)
    projectTips(layer, ops, content, tips)
    const ck = mergeCheckpointOp(layer, tips, ops)

    const otherLayer = bareLayer('<rect data-id="extra"/>'); ensureLayerId(otherLayer, TOYS_LAYER)
    const other = mergeCheckpointOp(otherLayer, tips, ops)

    expect(other.op.id).not.toBe(ck.op.id)
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
    const genesis = ckOp(bareLayer(), { id: 'genesis', authorId: 'alice' })
    ops.set(genesis.id, genesis)
    ops.set('head', { id: 'head', parents: ['genesis'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('mtip', { id: 'mtip', parents: ['genesis'], authorId: 'bob', gesture: 'move', mutations: [] })
    return ops
  }

  test('parents = the full tip set records every tip as an ancestor', () => {
    const ops = seedHeadAndMergeTip()
    const ck = ckOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head', 'mtip'] })
    ops.set(ck.id, ck)

    expect(isAncestor(ops, 'head', 'ck')).toBe(true)
    expect(isAncestor(ops, 'mtip', 'ck')).toBe(true)
  })

  test('parents = [head] alone silently drops mtip from the graph, even though the checkpoint\'s DOM content already includes mtip\'s mutations', () => {
    const ops = seedHeadAndMergeTip()
    const ck = ckOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head'] })
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
    const ck = ckOp(bareLayer(), { id: 'ck', authorId: 'alice', parents: ['head', 'mtip'] })
    ops.set(ck.id, ck)
    ops.set('p2', { id: 'p2', parents: ['ck'], authorId: 'alice', gesture: 'move', mutations: [] })
    ops.set('q2', { id: 'q2', parents: ['ck'], authorId: 'bob', gesture: 'move', mutations: [] })

    expect(nearestCheckpoint(ops, content, ['p2', 'q2'])).toBe('ck')
    expect(opsSinceCheckpoint(ops, ['p2', 'q2'])).toBe(2) // just p2, q2 — not head/mtip/genesis again
  })
})

describe('applyOps', () => {
  test('throws on an operation id not present in the log', () => {
    expect(() => applyOps(bareLayer(), new Map(), content, ['missing'])).toThrow(/no operation/)
  })

  test('applies in the given order, not insertion order of the map', () => {
    const base = bareLayer('<rect data-id="r" x="0"/>')
    ensureLayerId(base, TOYS_LAYER)
    const target = bareLayer()
    ensureLayerId(target, TOYS_LAYER)

    const step = (id, parents, from, to) => ({
      id, parents, authorId: 'a', gesture: 'move', ts: 0,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: from, newValue: to }],
    })

    const cp = ckOp(base, { id: 'cp', authorId: 'a' })
    const s2 = step('s2', ['s1'], '1', '2')
    const s1 = step('s1', ['cp'], '0', '1')

    const ops = new Map([['s2', s2], ['s1', s1], ['cp', cp]])
    applyOps(target, ops, content, ['cp', 's1', 's2'])
    expect(target.querySelector('[data-id="r"]').getAttribute('x')).toBe('2')
  })
})

// ── content stored apart from the graph ─────────────────────────────────

describe('checkpoint content storage', () => {
  const addOp = (id, parents, childId) => ({
    id, parents, authorId: 'a', gesture: 'drop', ts: 0,
    mutations: [{
      t: 'child', target: { id: TOYS_LAYER.layerDataId },
      added: [{ el: 'rect', at: [['data-id', childId]] }], removed: [],
      prevSibling: null, nextSibling: null,
    }],
  })

  /** A doc, a live layer, and a tip, advanced by real ops and checkpoints. */
  function table() {
    const ydoc = new Y.Doc()
    const layer = bareLayer()
    ensureLayerId(layer, TOYS_LAYER)
    const ops = getOps(ydoc, TOYS_LAYER)
    const contentMap = getContent(ydoc, TOYS_LAYER)
    let tip = null
    let n = 0

    const write = (op, content) => {
      appendCheckpoint(ydoc, TOYS_LAYER, op, content)
      tip = op.id
      return op.id
    }
    return {
      ydoc, layer, ops, contentMap,
      get tip() { return tip },
      genesis() {
        const { op, content } = checkpointOp(layer, { id: 'genesis', authorId: 'a', parents: [] })
        return write(op, content)
      },
      play(count = 1) {
        for (let i = 0; i < count; i++) {
          const op = addOp(`op${n}`, tip == null ? [] : [tip], `el${n}`)
          n++
          appendOp(ydoc, TOYS_LAYER, op)
          const r = document.createElementNS(SVG_NS, 'rect')
          r.setAttribute('data-id', op.mutations[0].added[0].at[0][1])
          layer.appendChild(r)
          tip = op.id
        }
      },
      checkpoint(id) {
        const { op, content } = checkpointOp(layer, { id, authorId: 'a', parents: [tip] })
        return write(op, content)
      },
      project(tips = [tip]) {
        const out = bareLayer()
        projectTips(out, ops, contentMap, tips)
        return markup(out)
      },
    }
  }

  test('round trip: the op carries no mutations, the content entry is what checkpointOp serialized, and projection matches the live DOM', async () => {
    const source = await toyLayer(['tray1', 'tray_sum'], ['die1', 'dice_d6'])
    const ydoc = new Y.Doc()
    const { op, content } = checkpointOp(source, { id: 'cp1', authorId: 'alice', parents: [] })
    appendCheckpoint(ydoc, TOYS_LAYER, op, content)

    const stored = getOps(ydoc, TOYS_LAYER).get('cp1')
    expect(stored.mutations).toEqual([])
    expect(isCheckpoint(stored)).toBe(true)
    expect(content.length).toBeGreaterThan(0)
    expect(getContent(ydoc, TOYS_LAYER).get('cp1')).toEqual(content)

    const target = bareLayer()
    projectTips(target, getOps(ydoc, TOYS_LAYER), getContent(ydoc, TOYS_LAYER), ['cp1'])
    expect(markup(target)).toBe(markup(source))
  })

  test('the op and its content land in one transaction', () => {
    const ydoc = new Y.Doc()
    const { op, content } = checkpointOp(bareLayer('<rect data-id="r"/>'), { id: 'cp1', authorId: 'a' })
    const seen = []
    ydoc.on('afterTransaction', () => seen.push([getOps(ydoc, TOYS_LAYER).has('cp1'), getContent(ydoc, TOYS_LAYER).has('cp1')]))
    appendCheckpoint(ydoc, TOYS_LAYER, op, content)
    expect(seen).toEqual([[true, true]])
  })

  test('superseded content is deleted: only genesis and the newest checkpoint keep theirs', () => {
    const t = table()
    t.genesis()
    t.play(3); t.checkpoint('c1')
    t.play(3); t.checkpoint('c2')

    expect([...t.contentMap.keys()].sort()).toEqual(['c2', 'genesis'])
    expect(t.ops.has('c1')).toBe(true) // the op record stays; only the snapshot goes
  })

  test('fallback: with the best cut\'s content gone, projection uses an older cut and gets the same DOM', () => {
    const t = table()
    t.genesis()
    t.play(3); t.checkpoint('c1')
    t.play(2)
    const expected = t.project()
    expect(nearestCheckpoint(t.ops, t.contentMap, [t.tip])).toBe('c1')

    t.contentMap.delete('c1')
    expect(nearestCheckpoint(t.ops, t.contentMap, [t.tip])).toBe('genesis')
    expect(t.project()).toBe(expected)
    // The latest cut is still the unit opsSinceCheckpoint measures from.
    expect(opsSinceCheckpoint(t.ops, [t.tip])).toBe(2)
  })

  test('throws when no cut in the ancestry has content', () => {
    const t = table()
    t.genesis()
    t.play(2)
    t.contentMap.delete('genesis')
    expect(() => t.project()).toThrow(/has content/)
  })

  test('root-most is kept: idle writers never delete genesis\'s content', () => {
    const t = table()
    t.genesis()
    for (let i = 0; i < 5; i++) {
      t.play(2); t.checkpoint(`c${i}`)
      expect(t.contentMap.has('genesis')).toBe(true)
    }
    expect([...t.contentMap.keys()].sort()).toEqual(['c4', 'genesis'])
  })

  test('root-most is kept: concurrent writers and a merge never delete genesis\'s content', () => {
    const a = table(), b = table()
    for (const t of [a, b]) t.genesis()
    const sync = () => {
      const ua = Y.encodeStateAsUpdate(a.ydoc), ub = Y.encodeStateAsUpdate(b.ydoc)
      Y.applyUpdate(a.ydoc, ub); Y.applyUpdate(b.ydoc, ua)
    }
    sync()

    a.play(2); a.checkpoint('ca')
    b.play(2); b.checkpoint('cb')
    sync()
    expect(a.contentMap.has('genesis')).toBe(true)
    expect([...a.contentMap.keys()].sort()).toEqual(['ca', 'cb', 'genesis'])

    // A checkpoint over both tips supersedes both, and only both.
    const { op, content } = checkpointOp(a.layer, { id: 'merge', authorId: 'a', parents: ['ca', 'cb'] })
    appendCheckpoint(a.ydoc, TOYS_LAYER, op, content)
    sync()
    for (const t of [a, b]) {
      expect([...t.contentMap.keys()].sort()).toEqual(['genesis', 'merge'])
    }
  })

  test('a duplicate checkpoint write neither revives deleted content nor duplicates entries', () => {
    const t = table()
    t.genesis()
    t.play(1); t.checkpoint('c1')
    t.play(1); t.checkpoint('c2')
    const { op, content } = checkpointOp(t.layer, { id: 'c1', authorId: 'a', parents: ['op0'] })
    appendCheckpoint(t.ydoc, TOYS_LAYER, op, content)
    expect(t.contentMap.has('c1')).toBe(false)
  })

  test('size: twenty checkpoints with ops between stay near two snapshots plus the ops', async () => {
    const toys = Array.from({ length: 10 }, (_, i) => [`toy${i}`, i % 2 ? 'dice_d6' : 'tray_sum'])
    const layer = await toyLayer(...toys)
    const ydoc = new Y.Doc()
    ensureLayerId(layer, TOYS_LAYER)

    let tip = null
    let opBytes = 0
    let snapBytes = 0
    const put = (c) => {
      const { op, content } = checkpointOp(layer, { id: c, authorId: 'a', parents: tip ? [tip] : [] })
      appendCheckpoint(ydoc, TOYS_LAYER, op, content)
      snapBytes = JSON.stringify(content).length
      tip = op.id
    }
    put('genesis')
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 3; j++) {
        const op = {
          id: `m${i}-${j}`, parents: [tip], authorId: 'a', gesture: 'move', ts: i,
          mutations: [{ t: 'attr', target: { id: 'toy0' }, name: 'x', ns: null, oldValue: '0', newValue: String(i) }],
        }
        opBytes += JSON.stringify(op).length
        appendOp(ydoc, TOYS_LAYER, op)
        tip = op.id
      }
      put(`c${i}`)
    }

    const size = Y.encodeStateAsUpdate(ydoc).length
    const naive = 21 * snapBytes
    console.log(`checkpoint size: encoded=${size}B snapshot=${snapBytes}B ops=${opBytes}B naive=${naive}B`)
    expect(size).toBeLessThan(3 * (2 * snapBytes + opBytes))
    expect(size).toBeLessThan(naive / 3)
  })

  test('fork: the fork doc\'s genesis content lives in the fork\'s content map, and the fork projects correctly', () => {
    const live = new Y.Doc()
    const base = bareLayer('<rect data-id="r" x="0"/>'); ensureLayerId(base, TOYS_LAYER)
    const { op: L, content: lContent } = checkpointOp(base, { id: 'L', authorId: 'alice', parents: [] })
    appendCheckpoint(live, TOYS_LAYER, L, lContent)
    const s1 = {
      id: 's1', parents: ['L'], authorId: 'bob', gesture: 'move', ts: 1,
      mutations: [{ t: 'attr', target: { id: 'r' }, name: 'x', ns: null, oldValue: '0', newValue: '9' }],
    }
    appendOp(live, TOYS_LAYER, s1)

    const scratch = bareLayer(); ensureLayerId(scratch, TOYS_LAYER)
    projectFrom(scratch, getOps(live, TOYS_LAYER), getContent(live, TOYS_LAYER), 'L')
    const seed = buildForkSeed(getOps(live, TOYS_LAYER), getContent(live, TOYS_LAYER), 'L', 's1', scratch, { authorId: 'bob' })

    const fork = new Y.Doc()
    Y.applyUpdate(fork, Y.encodeStateAsUpdate(live))
    expect(getContent(fork, TOYS_LAYER).has('L')).toBe(true) // inherited from the parent
    tablesAPI.seedForkOps(fork, TOYS_LAYER, seed)

    expect([...getContent(fork, TOYS_LAYER).keys()]).toEqual([seed.genesis.id])
    expect(getOps(fork, TOYS_LAYER).get(seed.genesis.id).mutations).toEqual([])
    expect([...getOps(fork, TOYS_LAYER).keys()].sort()).toEqual([seed.genesis.id, 's1'].sort())

    const projected = bareLayer()
    projectTips(projected, getOps(fork, TOYS_LAYER), getContent(fork, TOYS_LAYER), ['s1'])
    expect(projected.querySelector('[data-id="r"]').getAttribute('x')).toBe('9')
  })
})
