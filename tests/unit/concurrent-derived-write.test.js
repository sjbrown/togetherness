// @vitest-environment jsdom
//
// Concurrent derived-write corruption — see TODO.md item 11.
//
// Two peers drop a die into the same (empty) tray at roughly the same time.
// Both dice always end up in the tray correctly — concurrent inserts into a
// Yjs sequence never overwrite each other, so that part is sound.
//
// The tray's *derived* display (tray_sum's running total) is a different
// story. Each peer's own local reparent triggers its own local
// contents_change_handler cascade (dispatchContentsChangeCascade is gated on
// transaction.local — a peer never recomputes in reaction to a REMOTE
// change, only its own). That handler writes its result via
// `tspan.textContent = ...`, which — confirmed via a live jsdom
// MutationObserver — produces a childList mutation (remove the old text
// node, insert a new one), not a characterData edit. The envelope
// (applyChildListRecord) mirrors that as: delete the tspan's existing
// Y.XmlText child, insert a brand-new Y.XmlText for the new value.
//
// That makes the tray's displayed sum a Yjs *sequence*, not a genuine
// last-write-wins register. Two peers' independent, causally-concurrent
// derived-writes are two concurrent (delete old child, insert new child)
// ops on the SAME shared tspan — and Yjs's sequence-merge guarantee that
// concurrent inserts never overwrite each other, which is exactly what
// keeps both dice safe, is the same mechanism that keeps BOTH peers'
// computed values as sibling text nodes here. The result renders as their
// concatenation — a nonsensical number, not a correct or "most recent" sum,
// and not something recoverable by either peer reading their own local
// state (Yjs's convergence guarantee still holds: every replica lands on
// the IDENTICAL final garbled string).
//
// What actually decides the outcome is whether a peer's own derived-write
// is causally AFTER every other peer's derived-write it needs to supersede
// — not whether that peer happened to compute the mathematically correct
// total. (A companion scenario — a peer computing the objectively correct
// sum from its own fully-merged contents_group, yet still racing another
// peer's derived-write causally — was explored while designing the fix
// and is not reproduced here; see concurrency_branching.md.)
//
// This test intentionally WARNS rather than fails: this is raw,
// uncorrected Yjs merge behavior (there is no detection/resolution layer
// sitting in front of it here), and it will remain true forever — nothing
// in the agreed fix changes how Yjs itself merges concurrent sequence ops.
// The fix (see TODO.md #11 and concurrency_branching.md) is a
// detection-and-correction layer on TOP of this substrate: it commits
// placement + reaction as one transaction, detects the resulting overlap,
// and resolves it by asserting an authoritative peer's own recorded value
// — NOT by recomputing the mathematically correct merged sum. So the
// eventual real regression tests for the fix are NEW tests exercising the
// actual production path (runToyHandler / the envelope, not the
// hand-rolled localDerivedWrite() helper below), asserting a single clean
// child node holding the AUTHORITATIVE PEER'S OWN VALUE — which may not be
// the true merged total. This test stays a warning permanently: it's
// documentation of why the detection layer is necessary, not a
// to-be-promoted placeholder.
//
// The structural facts below (both dice always land in the tray; every
// replica converges to the identical — if wrong — final state; the
// corruption reproduces as exactly two sibling text nodes) ARE
// hard-asserted, since a regression in any of those would be a more
// serious problem than the known substrate behavior. Only the semantic
// "is this the right number" check is a warning.

import * as Y from 'yjs'
import { describe, test, expect } from 'vitest'
import { addToySync, findToy, reparentToy, applyMoveCommit } from '../../src/toys.js'

const TRAY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" id="tray_fixture" class="tray_fixture tray">
  <g id="contents_group" class="contents_group"></g>
  <text id="result"><tspan id="tspan_result" class="tspan_result">0</tspan></text>
</svg>`

const DIE_SVG = (face) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="die_fixture" class="die_fixture">
  <text id="text_value"><tspan id="tspan_value">${face}</tspan></text>
</svg>`

function contentsGroupOf(yTray) {
  const svg = yTray.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  return svg.toArray().find(c => c instanceof Y.XmlElement &&
    (c.getAttribute('class') || '').split(/\s+/).includes('contents_group'))
}
function tspanResultOf(yTray) {
  const svg = yTray.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'svg')
  const text = svg.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'text')
  return text.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'tspan')
}
// Mirrors reading tspan.textContent in the DOM: concatenates every child
// text node in order. If corruption occurred, this IS the garbled string a
// real user would see rendered.
function readTspanText(tspanYEl) {
  return tspanYEl.toArray().map(c => c.toString()).join('')
}
function contentsIds(yTray) {
  return contentsGroupOf(yTray).toArray()
    .map(c => c.getAttribute('data-toy-id'))
    .sort()
}

// Mirrors applyChildListRecord exactly (verified against jsdom's actual
// MutationRecord for `tspan.textContent = ...`): delete the tspan's current
// child(ren), insert one fresh Y.XmlText for the new value. This is the
// same op shape the real envelope path produces — using it directly here,
// rather than a full DOM+MutationObserver+envelope round trip, keeps the
// test focused on the CRDT-merge question these scenarios are about.
function localDerivedWrite(ydoc, tspanYEl, sum) {
  ydoc.transact(() => {
    const n = tspanYEl.length
    if (n > 0) tspanYEl.delete(0, n)
    tspanYEl.insert(0, [new Y.XmlText(String(sum))])
  }, 'toy-derived')
}

function buildReplica() {
  const ydoc = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')
  addToySync(ydoc, yToys, { id: 'tray1', toyType: 'tray_fixture', x: 0, y: 0, color: '#fff' }, TRAY_SVG)
  addToySync(ydoc, yToys, { id: 'die1',  toyType: 'die_fixture',  x: 0, y: 0, color: '#fff' }, DIE_SVG(4))
  addToySync(ydoc, yToys, { id: 'die2',  toyType: 'die_fixture',  x: 0, y: 0, color: '#fff' }, DIE_SVG(3))
  return { ydoc, yToys }
}

function forkReplica(sourceYdoc) {
  const ydoc = new Y.Doc()
  const yToys = ydoc.getXmlFragment('toys')
  Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(sourceYdoc))
  return { ydoc, yToys }
}

// Flags a wrong/garbled derived value without failing the test. See the
// file docstring for why this is a warning rather than an assertion.
function warnIfNotClean(label, tspanYEl, expectedSum) {
  const text = readTspanText(tspanYEl)
  const childCount = tspanYEl.length
  const isClean = childCount === 1 && text === String(expectedSum)
  if (!isClean) {
    console.warn(
      `[KNOWN ISSUE — TODO.md #11, concurrent derived-write] ${label}: ` +
      `expected a single clean value "${expectedSum}", got ${childCount} ` +
      `sibling text node(s) rendering as "${text}"`
    )
  }
  return { isClean, text, childCount }
}

describe('concurrent derived-write corruption (TODO #11 — raw Yjs substrate behavior, see concurrency_branching.md for the fix)', () => {

  test('fully concurrent derived-writes garble instead of merge — neither peer has heard from the other before its own cascade fires', () => {
    const A = buildReplica()
    const B = forkReplica(A.ydoc)

    // A: local reparent of die1, then A's own local cascade — blind to B.
    A.ydoc.transact(() => {
      const moved = reparentToy(A.ydoc, A.yToys, 'die1', 'tray1')
      applyMoveCommit(A.ydoc, moved, 10, 10)
    })
    localDerivedWrite(A.ydoc, tspanResultOf(findToy(A.yToys, 'tray1')), 4)   // sees only die1

    // B: local reparent of die2, then B's own local cascade — blind to A.
    B.ydoc.transact(() => {
      const moved = reparentToy(B.ydoc, B.yToys, 'die2', 'tray1')
      applyMoveCommit(B.ydoc, moved, 10, 10)
    })
    localDerivedWrite(B.ydoc, tspanResultOf(findToy(B.yToys, 'tray1')), 3)   // sees only die2

    // Full bidirectional sync.
    const updA = Y.encodeStateAsUpdate(A.ydoc)
    const updB = Y.encodeStateAsUpdate(B.ydoc)
    Y.applyUpdate(A.ydoc, updB)
    Y.applyUpdate(B.ydoc, updA)

    const trayA = findToy(A.yToys, 'tray1')
    const trayB = findToy(B.yToys, 'tray1')

    // Hard invariant: both dice always land in the tray, on both replicas.
    expect(contentsIds(trayA)).toEqual(['die1', 'die2'])
    expect(contentsIds(trayB)).toEqual(['die1', 'die2'])

    // Hard invariant: every replica converges to the SAME final state,
    // even though that state is semantically wrong.
    expect(readTspanText(tspanResultOf(trayA))).toBe(readTspanText(tspanResultOf(trayB)))

    // Hard invariant: the corruption reproduces structurally as two
    // sibling text nodes (both concurrent inserts survive). The exact
    // left-right ORDER is not asserted — it's resolved by comparing the
    // peers' randomly-generated client IDs, not by commit order, so it
    // varies run to run.
    expect(tspanResultOf(trayA).length).toBe(2)

    // Soft/warn: the actual displayed value is not the correct sum (7).
    warnIfNotClean('fully concurrent derived-writes', tspanResultOf(trayA), 7)
  })
})
