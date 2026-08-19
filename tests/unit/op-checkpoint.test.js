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
  checkpointOp, nearestCheckpoint, applyOps, projectFrom,
  ensureLayerId, isCheckpoint, LAYER_DATA_ID,
  opsSinceCheckpoint, shouldCheckpoint, CHECKPOINT_MIN_OPS,
  lastCheckpointTs,
} from '../../src/op_checkpoint.js'
import { getOps, appendOp } from '../../src/op_dag.js'
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
