// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { registerYNode, clearYNodeMap } from '../../src/toys.js'
import {
  REACTION_LOG_KEY, getReactionLog, touchedSetFromRecords,
  recordReactionBundle, areConcurrent, touchedSetsOverlap, sameBundle,
  scanForConflicts,
} from '../../src/conflict.js'
import { ENVELOPE_ORIGIN, DERIVED_ORIGIN, LIFECYCLE_ORIGIN } from '../../src/origins.js'
import { runToyHandlerSync } from '../../src/envelope.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// Build a tiny attached tree: a fragment root with one child <g>, itself
// holding a <tspan>. Returns { ydoc, yToys, groupDom, groupY, tspanDom,
// tspanY } — everything already attached, so each node has a real backing
// Item (_item !== null) usable for touchedSetFromRecords.
function makeAttachedTree() {
  clearYNodeMap()
  const ydoc  = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')

  const groupY = new Y.XmlElement('g')
  const tspanY = new Y.XmlElement('tspan')
  ydoc.transact(() => {
    yToys.insert(0, [groupY])
    groupY.insert(0, [tspanY])
  })

  const groupDom = document.createElementNS(SVG_NS, 'g')
  const tspanDom = document.createElementNS(SVG_NS, 'tspan')
  groupDom.appendChild(tspanDom)
  registerYNode(groupDom, groupY)
  registerYNode(tspanDom, tspanY)

  return { ydoc, yToys, groupDom, groupY, tspanDom, tspanY }
}

function fakeChildListRecord(target, { added = [], removed = [] } = {}) {
  return { type: 'childList', target, addedNodes: added, removedNodes: removed }
}

describe('touchedSetFromRecords', () => {
  test('includes the target of each record', () => {
    const { tspanDom, tspanY } = makeAttachedTree()
    const records = [fakeChildListRecord(tspanDom)]
    const touched = touchedSetFromRecords(records)
    expect(touched.size).toBe(1)
    const [id] = touched.values()
    expect(id).toEqual({ client: tspanY._item.id.client, clock: tspanY._item.id.clock })
  })

  test('includes addedNodes and removedNodes, not just target', () => {
    const { groupDom, tspanDom } = makeAttachedTree()
    const records = [fakeChildListRecord(groupDom, { added: [tspanDom] })]
    const touched = touchedSetFromRecords(records)
    expect(touched.size).toBe(2)
  })

  test('a node with no registered Yjs counterpart contributes nothing', () => {
    const orphan = document.createElementNS(SVG_NS, 'circle') // never registered
    const records = [fakeChildListRecord(orphan)]
    const touched = touchedSetFromRecords(records)
    expect(touched.size).toBe(0)
  })

  test('the same node appearing in multiple records dedupes to one entry', () => {
    const { tspanDom } = makeAttachedTree()
    const records = [fakeChildListRecord(tspanDom), fakeChildListRecord(tspanDom)]
    const touched = touchedSetFromRecords(records)
    expect(touched.size).toBe(1)
  })
})

describe('recordReactionBundle', () => {
  test('pushes a bundle for a qualifying origin (ENVELOPE_ORIGIN)', () => {
    const { ydoc, groupDom, groupY } = makeAttachedTree()
    let bundle
    ydoc.transact((tr) => {
      const touched = touchedSetFromRecords([fakeChildListRecord(groupDom)])
      bundle = recordReactionBundle(ydoc, tr, ENVELOPE_ORIGIN, touched)
    }, ENVELOPE_ORIGIN)

    expect(bundle).not.toBeNull()
    expect(bundle.clientID).toBe(ydoc.clientID)
    expect(bundle.origin).toBe(ENVELOPE_ORIGIN)
    expect(getReactionLog(ydoc).toArray()).toEqual([bundle])
  })

  test('pushes a bundle for DERIVED_ORIGIN too', () => {
    const { ydoc, groupDom } = makeAttachedTree()
    let bundle
    ydoc.transact((tr) => {
      const touched = touchedSetFromRecords([fakeChildListRecord(groupDom)])
      bundle = recordReactionBundle(ydoc, tr, DERIVED_ORIGIN, touched)
    }, DERIVED_ORIGIN)
    expect(bundle).not.toBeNull()
    expect(bundle.origin).toBe(DERIVED_ORIGIN)
  })

  test('does NOT record a bundle for LIFECYCLE_ORIGIN', () => {
    const { ydoc, groupDom } = makeAttachedTree()
    let bundle
    ydoc.transact((tr) => {
      const touched = touchedSetFromRecords([fakeChildListRecord(groupDom)])
      bundle = recordReactionBundle(ydoc, tr, LIFECYCLE_ORIGIN, touched)
    }, LIFECYCLE_ORIGIN)
    expect(bundle).toBeNull()
    expect(getReactionLog(ydoc).toArray()).toEqual([])
  })

  test('does NOT record a bundle when the touched-set is empty', () => {
    const { ydoc } = makeAttachedTree()
    let bundle
    ydoc.transact((tr) => {
      bundle = recordReactionBundle(ydoc, tr, ENVELOPE_ORIGIN, new Map())
    }, ENVELOPE_ORIGIN)
    expect(bundle).toBeNull()
    expect(getReactionLog(ydoc).toArray()).toEqual([])
  })

  test('getReactionLog(ydoc) is stable across calls (same underlying Y.Array)', () => {
    const { ydoc } = makeAttachedTree()
    expect(getReactionLog(ydoc)).toBe(getReactionLog(ydoc))
    expect(getReactionLog(ydoc)).toBe(ydoc.getArray(REACTION_LOG_KEY))
  })
})

// ── concurrency / overlap logic, using hand-built bundles ──────────────────
//
// These exercise areConcurrent/touchedSetsOverlap/scanForConflicts directly
// against plain bundle objects (as if pulled from a synced reactionLog),
// rather than round-tripping through real Y.Docs — the causal-stamp algebra
// is pure data, and this makes the four canonical cases easy to state.

function bundle({ clientID, clock, beforeState = {}, touched }) {
  return { clientID, clock, beforeState, touched, origin: ENVELOPE_ORIGIN, ts: 0 }
}

describe('areConcurrent', () => {
  test('two peers who have not seen each other are concurrent', () => {
    const a = bundle({ clientID: 1, clock: 1, beforeState: {}, touched: ['x'] })
    const b = bundle({ clientID: 2, clock: 1, beforeState: {}, touched: ['y'] })
    expect(areConcurrent(a, b)).toBe(true)
  })

  test('a bundle B whose beforeState already covers A\'s clock is NOT concurrent (A happened-before B)', () => {
    const a = bundle({ clientID: 1, clock: 3, beforeState: {}, touched: ['x'] })
    const b = bundle({ clientID: 2, clock: 1, beforeState: { 1: 3 }, touched: ['y'] })
    expect(areConcurrent(a, b)).toBe(false)
  })

  test('same-author bundles are never concurrent with each other', () => {
    const a = bundle({ clientID: 1, clock: 1, beforeState: {}, touched: ['x'] })
    const b = bundle({ clientID: 1, clock: 2, beforeState: { 1: 1 }, touched: ['y'] })
    expect(areConcurrent(a, b)).toBe(false)
  })

  test('symmetry: areConcurrent(a,b) === areConcurrent(b,a)', () => {
    const a = bundle({ clientID: 1, clock: 3, beforeState: {}, touched: ['x'] })
    const b = bundle({ clientID: 2, clock: 1, beforeState: { 1: 3 }, touched: ['y'] })
    expect(areConcurrent(a, b)).toBe(areConcurrent(b, a))
  })
})

describe('touchedSetsOverlap', () => {
  test('true when touched-sets share a node', () => {
    const a = bundle({ clientID: 1, clock: 1, touched: ['shared', 'a-only'] })
    const b = bundle({ clientID: 2, clock: 1, touched: ['shared', 'b-only'] })
    expect(touchedSetsOverlap(a, b)).toBe(true)
  })

  test('false when touched-sets are disjoint (independent drops into the same tray)', () => {
    const a = bundle({ clientID: 1, clock: 1, touched: ['die-1'] })
    const b = bundle({ clientID: 2, clock: 1, touched: ['die-2'] })
    expect(touchedSetsOverlap(a, b)).toBe(false)
  })
})

describe('sameBundle', () => {
  test('true for equal clientID+clock even if object references differ', () => {
    const a = bundle({ clientID: 1, clock: 5, touched: ['x'] })
    const b = { ...a, touched: ['x'] } // distinct object, same identity fields
    expect(sameBundle(a, b)).toBe(true)
  })

  test('false when clientID or clock differ', () => {
    const a = bundle({ clientID: 1, clock: 5, touched: ['x'] })
    expect(sameBundle(a, bundle({ clientID: 2, clock: 5, touched: ['x'] }))).toBe(false)
    expect(sameBundle(a, bundle({ clientID: 1, clock: 6, touched: ['x'] }))).toBe(false)
  })
})

describe('scanForConflicts — the canonical race from concurrency_branching.md', () => {
  test('two peers concurrently writing the SAME result slot conflict', () => {
    // Peer A and Peer B each insert a die into an empty tray_sum and
    // recompute the shared result slot, without having seen each other.
    const a = bundle({ clientID: 1, clock: 2, beforeState: {}, touched: ['die-1', 'result-slot'] })
    const b = bundle({ clientID: 2, clock: 2, beforeState: {}, touched: ['die-2', 'result-slot'] })

    expect(scanForConflicts([a, b], b)).toEqual([a])
    expect(scanForConflicts([a, b], a)).toEqual([b])
  })

  test('two peers dropping DIFFERENT dice into the same tray do NOT conflict (disjoint touched-sets)', () => {
    const a = bundle({ clientID: 1, clock: 1, beforeState: {}, touched: ['die-1'] })
    const b = bundle({ clientID: 2, clock: 1, beforeState: {}, touched: ['die-2'] })
    expect(scanForConflicts([a, b], b)).toEqual([])
  })

  test('a peer that already saw the other\'s commit does not get flagged (sequential, not concurrent)', () => {
    const a = bundle({ clientID: 1, clock: 2, beforeState: {}, touched: ['result-slot'] })
    // b started AFTER already integrating a's commit (beforeState covers a's clock)
    const b = bundle({ clientID: 2, clock: 1, beforeState: { 1: 2 }, touched: ['result-slot'] })
    expect(scanForConflicts([a, b], b)).toEqual([])
  })

  test('a bundle never conflicts with itself even if re-scanned', () => {
    const a = bundle({ clientID: 1, clock: 1, beforeState: {}, touched: ['x'] })
    expect(scanForConflicts([a], a)).toEqual([])
  })

  test('three-way: only the genuinely overlapping, concurrent pair is reported', () => {
    const a = bundle({ clientID: 1, clock: 1, beforeState: {}, touched: ['shared'] })
    const b = bundle({ clientID: 2, clock: 1, beforeState: {}, touched: ['shared'] })
    const c = bundle({ clientID: 3, clock: 1, beforeState: {}, touched: ['unrelated'] })
    expect(scanForConflicts([a, b, c], a)).toEqual([b])
  })
})

// ── integration: the real commitEnvelope pipeline, two synced replicas ─────
//
// Everything above exercises the touched-set/overlap algebra directly.
// These drive the ACTUAL production commit path (runToyHandlerSync ->
// runInEnvelopeSync -> commitEnvelope -> recordReactionBundle) on two
// independent Y.Doc replicas, then sync them and confirm detection fires
// end to end — the same "two peers drop dice into the same empty tray"
// scenario concurrent-derived-write.test.js documents the garbling bug
// for, but here checking that conflict.js actually FLAGS it.
function buildReplicaFixture(initialText) {
  const ydoc  = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')
  const groupY = new Y.XmlElement('g')
  const tspanY = new Y.XmlElement('tspan')
  ydoc.transact(() => {
    yToys.insert(0, [groupY])
    groupY.insert(0, [tspanY])
    tspanY.insert(0, [new Y.XmlText(initialText)])
  })
  const groupDom = document.createElementNS(SVG_NS, 'g')
  const tspanDom = document.createElementNS(SVG_NS, 'tspan')
  tspanDom.textContent = initialText
  groupDom.appendChild(tspanDom)
  registerYNode(groupDom, groupY)
  registerYNode(tspanDom, tspanY)
  return { ydoc, yToys, groupDom, tspanDom }
}

// Fork a fresh replica from sourceYdoc's CURRENT state, with its own DOM
// mirror registered against its own (newly-synced) Y node instances — not
// sourceYdoc's, which belong to a different Y.Doc entirely once forked.
function forkReplicaFixture(sourceYdoc) {
  const ydoc = new Y.Doc()
  Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(sourceYdoc))
  const yToys  = ydoc.getXmlFragment('toys')
  const groupY = yToys.toArray()[0]
  const tspanY = groupY.toArray()[0]
  const groupDom = document.createElementNS(SVG_NS, 'g')
  const tspanDom = document.createElementNS(SVG_NS, 'tspan')
  tspanDom.textContent = tspanY.toString()
  groupDom.appendChild(tspanDom)
  registerYNode(groupDom, groupY)
  registerYNode(tspanDom, tspanY)
  return { ydoc, yToys, groupDom, tspanDom }
}

function syncReplicas(x, y) {
  const updX = Y.encodeStateAsUpdate(x.ydoc)
  const updY = Y.encodeStateAsUpdate(y.ydoc)
  Y.applyUpdate(x.ydoc, updY)
  Y.applyUpdate(y.ydoc, updX)
}

describe('integration: real commitEnvelope commits, two synced replicas', () => {
  test('two peers concurrently deriving-writing the SAME tspan are flagged as conflicting', () => {
    const A = buildReplicaFixture('0')
    const B = forkReplicaFixture(A.ydoc) // forked BEFORE either peer writes

    // Peer A's own local derived-write, blind to B.
    runToyHandlerSync(A.ydoc, A.yToys, null, A.groupDom, () => {
      A.tspanDom.textContent = '4'
    }, { origin: DERIVED_ORIGIN })

    // Peer B's own local derived-write, blind to A.
    runToyHandlerSync(B.ydoc, B.yToys, null, B.groupDom, () => {
      B.tspanDom.textContent = '3'
    }, { origin: DERIVED_ORIGIN })

    syncReplicas(A, B)

    const bundles = getReactionLog(A.ydoc).toArray()
    expect(bundles.length).toBe(2)

    const bundleA = bundles.find(b => b.clientID === A.ydoc.clientID)
    const bundleB = bundles.find(b => b.clientID === B.ydoc.clientID)
    expect(bundleA).toBeDefined()
    expect(bundleB).toBeDefined()

    expect(scanForConflicts(bundles, bundleA)).toEqual([bundleB])
    expect(scanForConflicts(bundles, bundleB)).toEqual([bundleA])

    // Same check from B's own synced copy of the log — every peer reaches
    // the same conclusion from the same synced data.
    const bundlesFromB = getReactionLog(B.ydoc).toArray()
    expect(bundlesFromB.length).toBe(2)
  })

  test('two peers writing to DIFFERENT tspans are NOT flagged (disjoint touched-sets)', () => {
    const A = buildReplicaFixture('0')

    // Give A a second, independent group+tspan (a second die's own display,
    // not the shared result slot) before forking B.
    const group2Y = new Y.XmlElement('g')
    const tspan2Y = new Y.XmlElement('tspan')
    A.ydoc.transact(() => {
      A.yToys.insert(1, [group2Y])
      group2Y.insert(0, [tspan2Y])
      tspan2Y.insert(0, [new Y.XmlText('0')])
    })

    const B = forkReplicaFixture(A.ydoc)

    // A writes to its FIRST tspan only.
    runToyHandlerSync(A.ydoc, A.yToys, null, A.groupDom, () => {
      A.tspanDom.textContent = '4'
    }, { origin: DERIVED_ORIGIN })

    // B writes to its SECOND tspan (the fork of group2Y/tspan2Y) only.
    const group2Dom = document.createElementNS(SVG_NS, 'g')
    const tspan2Dom = document.createElementNS(SVG_NS, 'tspan')
    const bGroup2Y  = B.yToys.toArray()[1]
    const bTspan2Y  = bGroup2Y.toArray()[0]
    tspan2Dom.textContent = bTspan2Y.toString()
    group2Dom.appendChild(tspan2Dom)
    registerYNode(group2Dom, bGroup2Y)
    registerYNode(tspan2Dom, bTspan2Y)

    runToyHandlerSync(B.ydoc, B.yToys, null, group2Dom, () => {
      tspan2Dom.textContent = '9'
    }, { origin: DERIVED_ORIGIN })

    syncReplicas(A, B)

    const bundles = getReactionLog(A.ydoc).toArray()
    expect(bundles.length).toBe(2)
    const bundleA = bundles.find(b => b.clientID === A.ydoc.clientID)
    const bundleB = bundles.find(b => b.clientID === B.ydoc.clientID)

    expect(scanForConflicts(bundles, bundleA)).toEqual([])
    expect(scanForConflicts(bundles, bundleB)).toEqual([])
  })
})
