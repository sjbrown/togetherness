/**
 * tests/unit/op-dag.test.js
 *
 * The graph over the operation log: ancestry, tips, LCA, deterministic
 * ordering, and which of two conflicting branches the table follows.
 */

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import {
  getOps, appendOp, getOp, allOps, toOpMap,
  ancestors, isAncestor, heads, lca,
  compareAuthority, totalOrder, pathFrom,
  branchAuthors, forkJoinSequence, labelBranches,
} from '../../src/op_dag.js'

/** Build a plain op map from [id, parents, authorId] triples. */
function graph(...rows) {
  const m = new Map()
  for (const [id, parents = [], authorId = 'anon'] of rows) {
    m.set(id, { id, parents, authorId, gesture: 'test', mutations: [], ts: 0 })
  }
  return m
}

// The worked example: a shared root, two branches, later joined.
//   A0 → A1 → A2 ┐
//     └→ B1 → B2 ┴→ C1
const worked = () => graph(
  ['A0', [],           'alice'],
  ['A1', ['A0'],       'alice'],
  ['A2', ['A1'],       'alice'],
  ['B1', ['A0'],       'bob'],
  ['B2', ['B1'],       'bob'],
  ['C1', ['A2', 'B2'], 'alice'],
)

describe('storage', () => {
  test('appendOp stores and getOp reads back', () => {
    const ydoc = new Y.Doc()
    appendOp(ydoc, { id: 'op1', parents: [], authorId: 'a', gesture: 'move', mutations: [] })
    expect(getOp(getOps(ydoc), 'op1').gesture).toBe('move')
  })

  test('appending the same id twice does not duplicate or overwrite', () => {
    const ydoc = new Y.Doc()
    appendOp(ydoc, { id: 'op1', parents: [], authorId: 'a', gesture: 'first', mutations: [] })
    appendOp(ydoc, { id: 'op1', parents: [], authorId: 'a', gesture: 'second', mutations: [] })
    expect(allOps(getOps(ydoc)).length).toBe(1)
    expect(getOp(getOps(ydoc), 'op1').gesture).toBe('first')
  })

  test('an op without an id is refused', () => {
    expect(() => appendOp(new Y.Doc(), { parents: [] })).toThrow(/id is required/)
  })

  test('two docs syncing converge on the same op set', () => {
    const a = new Y.Doc(), b = new Y.Doc()
    appendOp(a, { id: 'x', parents: [], authorId: 'alice', gesture: 'g', mutations: [] })
    appendOp(b, { id: 'y', parents: [], authorId: 'bob', gesture: 'g', mutations: [] })
    Y.applyUpdate(b, Y.encodeStateAsUpdate(a))
    Y.applyUpdate(a, Y.encodeStateAsUpdate(b))
    expect(new Set(toOpMap(getOps(a)).keys())).toEqual(new Set(['x', 'y']))
    expect(new Set(toOpMap(getOps(b)).keys())).toEqual(new Set(['x', 'y']))
  })

  test('the graph helpers work directly against a Y.Map', () => {
    const ydoc = new Y.Doc()
    appendOp(ydoc, { id: 'r', parents: [], authorId: 'a', gesture: 'g', mutations: [] })
    appendOp(ydoc, { id: 'c', parents: ['r'], authorId: 'a', gesture: 'g', mutations: [] })
    expect(heads(getOps(ydoc))).toEqual(['c'])
    expect(isAncestor(getOps(ydoc), 'r', 'c')).toBe(true)
  })
})

describe('ancestry', () => {
  test('collects the whole reachable set, excluding self', () => {
    expect(ancestors(worked(), 'C1')).toEqual(new Set(['A2', 'A1', 'A0', 'B2', 'B1']))
  })

  test('a root has no ancestors', () => {
    expect(ancestors(worked(), 'A0')).toEqual(new Set())
  })

  test('isAncestor is not reflexive', () => {
    expect(isAncestor(worked(), 'A1', 'A1')).toBe(false)
  })

  test('ops on opposite branches are not each other’s ancestors', () => {
    const g = worked()
    expect(isAncestor(g, 'A2', 'B2')).toBe(false)
    expect(isAncestor(g, 'B2', 'A2')).toBe(false)
  })

  test('a malformed cycle terminates instead of hanging', () => {
    const g = graph(['x', ['y']], ['y', ['x']])
    expect(ancestors(g, 'x')).toEqual(new Set(['x', 'y']))
  })
})

describe('heads', () => {
  test('the merge op is the only tip', () => {
    expect(heads(worked())).toEqual(['C1'])
  })

  test('a divergence has two tips', () => {
    const g = graph(['A0', []], ['A1', ['A0']], ['B1', ['A0']])
    expect(heads(g)).toEqual(['A1', 'B1'])
  })

  test('an empty log has no tips', () => {
    expect(heads(new Map())).toEqual([])
  })
})

describe('lca', () => {
  test('two branch tips share their fork point', () => {
    expect(lca(worked(), 'A2', 'B2')).toBe('A0')
  })

  test('an ancestor is its own descendant’s LCA', () => {
    expect(lca(worked(), 'A0', 'A2')).toBe('A0')
  })

  test('unrelated roots share nothing', () => {
    const g = graph(['x', []], ['y', []])
    expect(lca(g, 'x', 'y')).toBeNull()
  })

  test('picks the lowest, not merely any, common ancestor', () => {
    const g = graph(
      ['r', []], ['m', ['r']], ['a', ['m']], ['b', ['m']],
    )
    expect(lca(g, 'a', 'b')).toBe('m')
  })
})

describe('compareAuthority', () => {
  const seq = ['alice', 'bob', 'clyde']

  test('earlier in the sequence is authoritative', () => {
    expect(compareAuthority(seq, 'alice', 'bob')).toBeLessThan(0)
    expect(compareAuthority(seq, 'clyde', 'bob')).toBeGreaterThan(0)
  })

  test('an id absent from the sequence sorts last', () => {
    expect(compareAuthority(seq, 'zoe', 'clyde')).toBeGreaterThan(0)
    expect(compareAuthority(seq, 'alice', 'zoe')).toBeLessThan(0)
  })

  test('two absent ids are indistinguishable here', () => {
    expect(compareAuthority(seq, 'zoe', 'yves')).toBe(0)
  })
})

describe('totalOrder', () => {
  test('respects ancestry', () => {
    const g = worked()
    const order = totalOrder(g, ['A0', 'A1', 'A2', 'B1', 'B2', 'C1'], ['alice', 'bob'])
    expect(order.indexOf('A0')).toBeLessThan(order.indexOf('A1'))
    expect(order.indexOf('A1')).toBeLessThan(order.indexOf('A2'))
    expect(order.indexOf('B1')).toBeLessThan(order.indexOf('B2'))
    expect(order.indexOf('A2')).toBeLessThan(order.indexOf('C1'))
    expect(order.indexOf('B2')).toBeLessThan(order.indexOf('C1'))
  })

  test('breaks concurrent ties by author authority', () => {
    const g = graph(['r', [], 'alice'], ['x', ['r'], 'clyde'], ['y', ['r'], 'bob'])
    expect(totalOrder(g, ['x', 'y'], ['alice', 'bob', 'clyde'])).toEqual(['y', 'x'])
  })

  test('falls to op id when authors tie', () => {
    const g = graph(['r', [], 'alice'], ['b', ['r'], 'alice'], ['a', ['r'], 'alice'])
    expect(totalOrder(g, ['b', 'a'], ['alice'])).toEqual(['a', 'b'])
  })

  test('is identical no matter what order the ids arrive in', () => {
    const g = worked()
    const seq = ['alice', 'bob']
    const ids = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1']
    const shuffled = ['C1', 'B1', 'A2', 'A0', 'B2', 'A1']
    expect(totalOrder(g, shuffled, seq)).toEqual(totalOrder(g, ids, seq))
  })

  test('strands nothing when a parent lies outside the requested set', () => {
    const g = worked()
    expect(totalOrder(g, ['A2', 'C1'], ['alice']).sort()).toEqual(['A2', 'C1'])
  })
})

describe('pathFrom', () => {
  test('from a shared base, only the missing ops', () => {
    expect(pathFrom(worked(), 'A0', 'A2', ['alice'])).toEqual(['A1', 'A2'])
  })

  test('from null, the whole ancestry', () => {
    expect(pathFrom(worked(), null, 'A2', ['alice'])).toEqual(['A0', 'A1', 'A2'])
  })

  test('already there means nothing to do', () => {
    expect(pathFrom(worked(), 'A2', 'A2', ['alice'])).toEqual([])
  })

  test('crossing a merge picks up both branches', () => {
    const path = pathFrom(worked(), 'A2', 'C1', ['alice', 'bob'])
    expect(new Set(path)).toEqual(new Set(['B1', 'B2', 'C1']))
    expect(path[path.length - 1]).toBe('C1')
  })
})

describe('branchAuthors', () => {
  const g = () => graph(
    ['L', [],    'alice'],
    ['s1', ['L'],  'clyde'],
    ['s2', ['s1'], 'bob'],
    ['l1', ['L'],  'alice'],
  )

  test('collects every contributor on the branch', () => {
    expect(branchAuthors(g(), 's2', 'L')).toEqual(new Set(['clyde', 'bob']))
  })

  test('the LCA’s own author is shared ancestry, not a contributor', () => {
    expect(branchAuthors(g(), 's2', 'L').has('alice')).toBe(false)
  })

  test('a leader-only author is absent', () => {
    expect(branchAuthors(g(), 's2', 'L').has('alice')).toBe(false)
    expect(branchAuthors(g(), 'l1', 'L')).toEqual(new Set(['alice']))
  })

  test('a single-op branch yields a single author', () => {
    expect(branchAuthors(g(), 'l1', 'L')).toEqual(new Set(['alice']))
  })

  test('an author contributing to both branches appears in each', () => {
    const both = graph(
      ['L', [], 'alice'],
      ['s1', ['L'], 'bob'],
      ['s2', ['s1'], 'alice'],
      ['l1', ['L'], 'alice'],
    )
    expect(branchAuthors(both, 's2', 'L')).toEqual(new Set(['bob', 'alice']))
  })
})

describe('forkJoinSequence', () => {
  const parent = ['alice', 'bob', 'clyde']

  test('filters to the contributors, keeping inherited order', () => {
    expect(forkJoinSequence(parent, new Set(['bob', 'clyde']))).toEqual(['bob', 'clyde'])
  })

  test('the founder does not leapfrog a more senior contributor', () => {
    // Clyde diverged first and Bob joined the branch afterwards. Bob was
    // already senior at the parent table, and stays senior here.
    expect(forkJoinSequence(parent, new Set(['clyde', 'bob']))).toEqual(['bob', 'clyde'])
  })

  test('a single contributor yields a single-element sequence', () => {
    expect(forkJoinSequence(parent, new Set(['clyde']))).toEqual(['clyde'])
  })

  test('a contributor missing from the parent sequence lands last', () => {
    expect(forkJoinSequence(parent, new Set(['zoe', 'bob']))).toEqual(['bob', 'zoe'])
  })

  test('several missing contributors are ordered by id, not by chance', () => {
    expect(forkJoinSequence(parent, new Set(['zoe', 'yves', 'alice'])))
      .toEqual(['alice', 'yves', 'zoe'])
  })

  test('accepts an array as readily as a Set', () => {
    expect(forkJoinSequence(parent, ['clyde', 'bob'])).toEqual(['bob', 'clyde'])
  })

  test('two peers computing it from the same inputs agree', () => {
    const asBob   = forkJoinSequence(parent, new Set(['bob', 'clyde']))
    const asClyde = forkJoinSequence(parent, new Set(['clyde', 'bob']))
    expect(asBob).toEqual(asClyde)
  })
})

describe('labelBranches', () => {
  test('the branch holding the earlier-joining author leads', () => {
    const g = graph(
      ['L', [], 'alice'],
      ['a1', ['L'], 'alice'],
      ['b1', ['L'], 'bob'],
    )
    expect(labelBranches(g, 'a1', 'b1', ['alice', 'bob']))
      .toMatchObject({ leader: 'a1', splitter: 'b1', lca: 'L' })
  })

  test('the label does not depend on which tip is passed first', () => {
    const g = graph(
      ['L', [], 'alice'],
      ['a1', ['L'], 'alice'],
      ['b1', ['L'], 'bob'],
    )
    const one = labelBranches(g, 'a1', 'b1', ['alice', 'bob'])
    const two = labelBranches(g, 'b1', 'a1', ['alice', 'bob'])
    expect(one.leader).toBe(two.leader)
    expect(one.splitter).toBe(two.splitter)
  })

  test('a branch is ranked by its earliest author, not its tip’s author', () => {
    // bob's branch tip is authored by clyde, but bob is on the branch.
    const g = graph(
      ['L', [], 'alice'],
      ['b1', ['L'], 'bob'],
      ['b2', ['b1'], 'clyde'],
      ['c1', ['L'], 'clyde'],
    )
    expect(labelBranches(g, 'b2', 'c1', ['alice', 'bob', 'clyde']).leader).toBe('b2')
  })

  test('equal-authority branches fall to the tip ids, deterministically', () => {
    const g = graph(
      ['L', [], 'alice'],
      ['zz', ['L'], 'alice'],
      ['aa', ['L'], 'alice'],
    )
    expect(labelBranches(g, 'zz', 'aa', ['alice']).leader).toBe('aa')
  })

  test('authors absent from joinSequence do not win by default', () => {
    const g = graph(
      ['L', [], 'alice'],
      ['a1', ['L'], 'alice'],
      ['z1', ['L'], 'zoe'],
    )
    expect(labelBranches(g, 'a1', 'z1', ['alice', 'bob']).leader).toBe('a1')
  })

  test('the fork’s joinSequence follows from the splitter it names', () => {
    const g = graph(
      ['L', [], 'alice'],
      ['a1', ['L'], 'alice'],
      ['c1', ['L'], 'clyde'],
      ['c2', ['c1'], 'bob'],
    )
    const parentSeq = ['alice', 'bob', 'clyde']
    const { splitter, lca: base } = labelBranches(g, 'a1', 'c2', parentSeq)
    expect(splitter).toBe('c2')
    expect(forkJoinSequence(parentSeq, branchAuthors(g, splitter, base)))
      .toEqual(['bob', 'clyde'])
  })
})
