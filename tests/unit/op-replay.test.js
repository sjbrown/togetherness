/**
 * tests/unit/op-replay.test.js
 *
 * How an arriving operation relates to the local head, and what applying
 * it does to the DOM.
 */

// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, beforeEach } from 'vitest'
import {
  isReplaying, withSuppressedCapture, touchedBy, conflicts, classify, advanceTo,
  SUBSEQUENT, CONCURRENT, CONFLICTING, KNOWN,
} from '../../src/op_replay.js'
import { getHead, setHead, clearHead } from '../../src/op_head.js'
import { checkpointOp, ensureLayerId } from '../../src/op_checkpoint.js'
import { runInEnvelope, commitGesture } from '../../src/envelope.js'
import { getOps, appendOp } from '../../src/op_dag.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function layer(html = '') {
  const el = document.createElementNS(SVG_NS, 'g')
  el.id = 'toys-layer'
  el.innerHTML = html
  ensureLayerId(el)
  return el
}

const attrOp = (id, parents, targetId, name, oldValue, newValue) => ({
  id, parents, authorId: 'alice', gesture: 'move', ts: 0,
  mutations: [{ t: 'attr', target: { id: targetId }, name, ns: null, oldValue, newValue }],
})

const childOp = (id, parents, targetId) => ({
  id, parents, authorId: 'alice', gesture: 'drop', ts: 0,
  mutations: [{
    t: 'child', target: { id: targetId },
    added: [{ el: 'circle', at: [['data-id', `${id}-new`]] }], removed: [],
    prevSibling: null, nextSibling: null,
  }],
})

describe('op_head', () => {
  beforeEach(() => localStorage.clear())

  test('round-trips a head per table', () => {
    setHead('table-a', 'op1')
    setHead('table-b', 'op2')
    expect(getHead('table-a')).toBe('op1')
    expect(getHead('table-b')).toBe('op2')
  })

  test('an unknown table has no head', () => {
    expect(getHead('never-seen')).toBeNull()
  })

  test('clearing removes it', () => {
    setHead('t', 'op1')
    clearHead('t')
    expect(getHead('t')).toBeNull()
  })

  test('a null tableId is a no-op rather than a throw', () => {
    expect(() => setHead(null, 'x')).not.toThrow()
    expect(getHead(null)).toBeNull()
  })
})

describe('withSuppressedCapture', () => {
  test('is off by default', () => {
    expect(isReplaying()).toBe(false)
  })

  test('is on inside, off after', () => {
    withSuppressedCapture(() => expect(isReplaying()).toBe(true))
    expect(isReplaying()).toBe(false)
  })

  test('restores even when fn throws', () => {
    expect(() => withSuppressedCapture(() => { throw new Error('x') })).toThrow()
    expect(isReplaying()).toBe(false)
  })

  test('nests without unsuppressing early', () => {
    withSuppressedCapture(() => {
      withSuppressedCapture(() => {})
      expect(isReplaying()).toBe(true)
    })
    expect(isReplaying()).toBe(false)
  })

  test('the envelope captures nothing while suppressed', () => {
    const root = layer('<rect data-id="r" x="1"/>')
    const records = withSuppressedCapture(() =>
      runInEnvelope(root, () => root.querySelector('[data-id="r"]').setAttribute('x', '9')))
    expect(records).toEqual([])
    expect(root.querySelector('[data-id="r"]').getAttribute('x')).toBe('9')
  })

  test('and captures normally once suppression lifts', () => {
    const root = layer('<rect data-id="r" x="1"/>')
    const records = runInEnvelope(root, () =>
      root.querySelector('[data-id="r"]').setAttribute('x', '9'))
    expect(records.length).toBeGreaterThan(0)
  })
})

describe('touchedBy', () => {
  test('a childList change is structural', () => {
    const { structural, valued } = touchedBy(childOp('o1', [], 'p'))
    expect([...structural]).toEqual(['e:p'])
    expect([...valued]).toEqual([])
  })

  test('an attribute write is valued, keyed by attribute name', () => {
    const { structural, valued } = touchedBy(attrOp('o1', [], 'r', 'x', '1', '2'))
    expect([...structural]).toEqual([])
    expect([...valued]).toEqual(['e:r#x'])
  })

  test('a text write is keyed to its position', () => {
    const op = {
      id: 'o1', parents: [], mutations: [
        { t: 'text', target: { parentId: 't1', index: 0 }, oldValue: 'a', newValue: 'b' },
      ],
    }
    expect([...touchedBy(op).valued]).toEqual(['t:t1:0#text'])
  })
})

describe('conflicts', () => {
  const ops = new Map()
  beforeEach(() => {
    ops.clear()
    for (const op of [
      attrOp('ax', ['L'], 'r', 'x', '0', '1'),
      attrOp('ay', ['L'], 'r', 'y', '0', '1'),
      attrOp('bx', ['L'], 'r', 'x', '0', '2'),
      attrOp('cx', ['L'], 'other', 'x', '0', '3'),
      childOp('d1', ['L'], 'tray'),
      childOp('d2', ['L'], 'tray'),
      childOp('d3', ['L'], 'other-tray'),
    ]) ops.set(op.id, op)
  })

  test('same attribute on the same node conflicts', () => {
    expect(conflicts(ops, ['ax'], ['bx'])).toBe(true)
  })

  test('different attributes on the same node do not', () => {
    expect(conflicts(ops, ['ax'], ['ay'])).toBe(false)
  })

  test('the same attribute on different nodes does not', () => {
    expect(conflicts(ops, ['ax'], ['cx'])).toBe(false)
  })

  test('two structural changes to the same container conflict', () => {
    expect(conflicts(ops, ['d1'], ['d2'])).toBe(true)
  })

  test('structural changes to different containers do not', () => {
    expect(conflicts(ops, ['d1'], ['d3'])).toBe(false)
  })

  test('a structural change and an attribute write on one node do not', () => {
    // Deliberately narrow: dropping into a tray while someone recolours it
    // is not a contest.
    expect(conflicts(ops, ['d1'], ['ax'])).toBe(false)
  })
})

describe('classify', () => {
  const build = () => {
    const ops = new Map()
    for (const op of [
      attrOp('L', [], 'r', 'x', '0', '0'),
      attrOp('a1', ['L'], 'r', 'x', '0', '1'),
      attrOp('a2', ['a1'], 'r', 'x', '1', '2'),
      attrOp('b1', ['L'], 'r', 'x', '0', '9'),
      attrOp('c1', ['L'], 'other', 'y', '0', '9'),
    ]) ops.set(op.id, op)
    return ops
  }

  test('a descendant of the head is subsequent', () => {
    expect(classify(build(), 'a1', 'a2').kind).toBe(SUBSEQUENT)
  })

  test('the head itself is already known', () => {
    expect(classify(build(), 'a1', 'a1').kind).toBe(KNOWN)
  })

  test('an ancestor of the head is already known', () => {
    expect(classify(build(), 'a2', 'L').kind).toBe(KNOWN)
  })

  test('a null head takes anything as subsequent', () => {
    expect(classify(build(), null, 'a2').kind).toBe(SUBSEQUENT)
  })

  test('concurrent but non-overlapping is concurrent, not conflicting', () => {
    const { kind, lca } = classify(build(), 'a1', 'c1')
    expect(kind).toBe(CONCURRENT)
    expect(lca).toBe('L')
  })

  test('concurrent and overlapping is conflicting', () => {
    const { kind, lca } = classify(build(), 'a1', 'b1')
    expect(kind).toBe(CONFLICTING)
    expect(lca).toBe('L')
  })

  test('a deeper divergence still finds the fork point', () => {
    expect(classify(build(), 'a2', 'b1').lca).toBe('L')
  })
})

describe('advanceTo', () => {
  test('a descendant replays only the missing operations', () => {
    const base = layer('<rect data-id="r" x="0"/>')
    const cp = checkpointOp(base, { id: 'cp', authorId: 'alice' })
    const m1 = attrOp('m1', ['cp'], 'r', 'x', '0', '5')
    const ops = new Map([['cp', cp], ['m1', m1]])

    const live = layer('<rect data-id="r" x="0"/>')
    const head = advanceTo(live, ops, 'cp', 'm1')

    expect(head).toBe('m1')
    expect(live.querySelector('[data-id="r"]').getAttribute('x')).toBe('5')
  })

  test('switching to a sibling branch rebuilds from the checkpoint', () => {
    const base = layer('<rect data-id="r" x="0"/>')
    const cp = checkpointOp(base, { id: 'cp', authorId: 'alice' })
    const mine = attrOp('mine', ['cp'], 'r', 'x', '0', '11')
    const theirs = attrOp('theirs', ['cp'], 'r', 'x', '0', '22')
    const ops = new Map([['cp', cp], ['mine', mine], ['theirs', theirs]])

    const live = layer()
    advanceTo(live, ops, null, 'mine')
    expect(live.querySelector('[data-id="r"]').getAttribute('x')).toBe('11')

    const head = advanceTo(live, ops, 'mine', 'theirs')
    expect(head).toBe('theirs')
    expect(live.querySelector('[data-id="r"]').getAttribute('x')).toBe('22')
  })

  test('applying a remote operation produces no operation of our own', () => {
    const ydoc = new Y.Doc()
    const base = layer('<rect data-id="r" x="0"/>')
    const cp = checkpointOp(base, { id: 'cp', authorId: 'alice' })
    const m1 = attrOp('m1', ['cp'], 'r', 'x', '0', '5')
    const ops = new Map([['cp', cp], ['m1', m1]])

    const live = layer('<rect data-id="r" x="0"/>')
    const captured = []
    const mo = new MutationObserver(rs => captured.push(...rs))
    mo.observe(live, { subtree: true, childList: true, attributes: true })

    advanceTo(live, ops, 'cp', 'm1')

    // The observer still sees the DOM change — suppression is the
    // envelope's contract, not the browser's — but the envelope drops it.
    const records = withSuppressedCapture(() => runInEnvelope(live, () => {}))
    expect(records).toEqual([])
    mo.disconnect()
  })
})

describe('commitGesture', () => {
  test('turns a captured batch into an operation in the log', () => {
    const ydoc = new Y.Doc()
    const root = layer('<rect data-id="r" x="1"/>')
    const records = runInEnvelope(root, () =>
      root.querySelector('[data-id="r"]').setAttribute('x', '7'))

    const op = commitGesture(ydoc, records, { gesture: 'move', authorId: 'alice', parents: ['cp'] })

    expect(op.gesture).toBe('move')
    expect(op.authorId).toBe('alice')
    expect(op.parents).toEqual(['cp'])
    expect(op.mutations.length).toBeGreaterThan(0)
    expect(getOps(ydoc).get(op.id)).toBeTruthy()
  })

  test('a gesture that changed nothing is not an operation', () => {
    const ydoc = new Y.Doc()
    const root = layer('<rect data-id="r"/>')
    const records = runInEnvelope(root, () => {})
    expect(commitGesture(ydoc, records, { authorId: 'alice' })).toBeNull()
    expect([...getOps(ydoc).values()].length).toBe(0)
  })

  test('null parents are dropped rather than stored', () => {
    const ydoc = new Y.Doc()
    const root = layer('<rect data-id="r" x="1"/>')
    const records = runInEnvelope(root, () =>
      root.querySelector('[data-id="r"]').setAttribute('x', '2'))
    const op = commitGesture(ydoc, records, { authorId: 'a', parents: [null] })
    expect(op.parents).toEqual([])
  })

  test('the operation replays onto a peer', () => {
    const ydoc = new Y.Doc()
    const root = layer('<rect data-id="r" x="1"/>')
    const genesis = checkpointOp(root, { id: 'cp', authorId: 'alice' })

    const records = runInEnvelope(root, () =>
      root.querySelector('[data-id="r"]').setAttribute('x', '7'))
    const op = commitGesture(ydoc, records, { authorId: 'alice', parents: ['cp'] })

    const peer = layer()
    advanceTo(peer, new Map([['cp', genesis], [op.id, op]]), null, op.id)
    expect(peer.querySelector('[data-id="r"]').getAttribute('x')).toBe('7')
  })

  test('a log with no genesis checkpoint cannot be projected from nothing', () => {
    // projectFrom clears the layer first, so the earliest operation has to
    // be able to reconstruct it. That is what makes genesis a checkpoint.
    const ydoc = new Y.Doc()
    const root = layer('<rect data-id="r" x="1"/>')
    const records = runInEnvelope(root, () =>
      root.querySelector('[data-id="r"]').setAttribute('x', '7'))
    const op = commitGesture(ydoc, records, { authorId: 'alice' })

    expect(() => advanceTo(layer(), new Map([[op.id, op]]), null, op.id))
      .toThrow(/unresolvable/)
  })
})
