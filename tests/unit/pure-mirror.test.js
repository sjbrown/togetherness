// @vitest-environment jsdom
/**
 * pure-mirror.test.js
 *
 * Acceptance gate for CONCURRENCY_AND_BRANCHING.md's "pure mirror" rule for
 * the drawing and boundaries/positions layers: everything render() puts on
 * the DOM must come from the Yjs tree, and nothing in the Yjs tree may be
 * dropped. This asserts the two literally match, attribute-for-attribute
 * and child-for-child, recursively — after creation AND after the apply*
 * mutators that touch geometry/rotation.
 */

import * as Y from 'yjs';
import { describe, test, expect } from 'vitest';
import {
  addDrawing, applyMoveCommit as applyDrawingMove, applyResize as applyDrawingResize,
  applyRotate, applyPivot, render as renderDrawing,
} from '../../src/drawing.js';
import {
  addBoundary, addPositionSet, applyMoveCommit as applyBounPosMove,
  applyResize as applyBounPosResize, render as renderBounPos,
} from '../../src/boun_pos.js';
import { tablesAPI } from '../../src/tables.js';

const { makeDoc } = tablesAPI;
const SVG_NS = 'http://www.w3.org/2000/svg';

// ── Structural comparison ───────────────────────────────────────────────────
// Recursively asserts a rendered live DOM node exactly mirrors its source
// Y.XmlElement/Y.XmlText: same tag, same attribute set and values, same
// text content, same children in the same order. Nothing extra, nothing
// missing.
function assertPureMirror(domNode, yNode, path = '') {
  if (yNode instanceof Y.XmlText) {
    expect(domNode.nodeType, `${path}: expected a text node`).toBe(Node.TEXT_NODE);
    expect(domNode.textContent, `${path}: text content`).toBe(yNode.toString());
    return;
  }
  expect(domNode.nodeType, `${path}: expected an element`).toBe(Node.ELEMENT_NODE);
  expect(domNode.tagName, `${path}: tag name`).toBe(yNode.nodeName);

  const yAttrs = yNode.getAttributes();
  const domAttrNames = [...domNode.attributes].map(a => a.name).sort();
  const yAttrNames = Object.keys(yAttrs).sort();
  expect(domAttrNames, `${path}: attribute set`).toEqual(yAttrNames);
  for (const k of yAttrNames) {
    expect(domNode.getAttribute(k), `${path}: attribute ${k}`).toBe(yAttrs[k]);
  }

  const yChildren = yNode.toArray();
  expect(domNode.childNodes.length, `${path}: child count`).toBe(yChildren.length);
  yChildren.forEach((yChild, i) => {
    assertPureMirror(domNode.childNodes[i], yChild, `${path}>${yChild.nodeName ?? '#text'}[${i}]`);
  });
}

function renderScratch(renderFn, yFragment) {
  const g = document.createElementNS(SVG_NS, 'g');
  renderFn(yFragment, g);
  return g;
}

function findRendered(g, dataId) {
  return g.querySelector(`[data-id="${dataId}"]`);
}

// ── Drawing layer ────────────────────────────────────────────────────────────

describe('drawing.js render() is a pure mirror of the Yjs tree', () => {
  test('every kind, at creation', () => {
    const ydoc = makeDoc();
    const yDrawing = ydoc.getXmlFragment('drawing');

    addDrawing(ydoc, yDrawing, { id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50, fill: '#abc' });
    addDrawing(ydoc, yDrawing, {
      id: 'rect2', type: 'rect', x: 10, y: 20, width: 100, height: 50,
      rotate: 30, 'pivot-x': 0.5, 'pivot-y': 0.5,
    });
    addDrawing(ydoc, yDrawing, { id: 'circ1', type: 'circle', cx: 40, cy: 40, r: 20 });

    const g = renderScratch(renderDrawing, yDrawing);
    const yEls = yDrawing.toArray();
    expect(g.children.length).toBe(yEls.length);
    yEls.forEach((yEl, i) => assertPureMirror(g.children[i], yEl, yEl.getAttribute('id')));
  });

  test('after move, resize, rotate and pivot, through the real apply* functions', () => {
    const ydoc = makeDoc();
    const yDrawing = ydoc.getXmlFragment('drawing');
    addDrawing(ydoc, yDrawing, { id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50 });

    const yEl = yDrawing.toArray()[0];
    applyDrawingMove(ydoc, yEl, 30, 40);
    applyDrawingResize(ydoc, yEl, 30, 40, 120, 60);
    applyRotate(ydoc, yEl, 25);
    applyPivot(ydoc, yEl, 0, 0, 30, 40);

    const g = renderScratch(renderDrawing, yDrawing);
    assertPureMirror(findRendered(g, 'rect1'), yEl, 'rect1');
    // The mutators actually did something observable, so this isn't
    // vacuously true.
    expect(yEl.getAttribute('transform')).toMatch(/^rotate\(/);
  });
});

// ── Boundaries / positions layer ────────────────────────────────────────────

describe('boun_pos.js render() is a pure mirror of the Yjs tree', () => {
  function seed(ydoc, yBounPos) {
    addBoundary(ydoc, yBounPos, { id: 'b1', name: 'Hand', x: 0, y: 0, w: 200, h: 100 });
    addPositionSet(ydoc, yBounPos, {
      x: 0, y: 0, w: 200, h: 200, toolName: 'pos-grid-sq', toolParams: { spacing: 80, snapRadius: 2 },
    });
    addPositionSet(ydoc, yBounPos, {
      x: 0, y: 0, w: 200, h: 200, toolName: 'pos-grid-hex', toolParams: { xSpacing: 60, ySpacing: 60, snapRadius: 2 },
    });
  }

  test('boundary, square pos-set and hex pos-set, at creation', () => {
    const ydoc = makeDoc();
    const yBounPos = ydoc.getXmlFragment('boundaries');
    seed(ydoc, yBounPos);

    const g = renderScratch(renderBounPos, yBounPos);
    const yEls = yBounPos.toArray();
    expect(g.children.length).toBe(yEls.length);
    yEls.forEach((yEl, i) => assertPureMirror(g.children[i], yEl, yEl.getAttribute('id')));
  });

  test('after move and resize, through the real apply* functions', () => {
    const ydoc = makeDoc();
    const yBounPos = ydoc.getXmlFragment('boundaries');
    seed(ydoc, yBounPos);

    const [boundary, sq, hex] = yBounPos.toArray();
    applyBounPosMove(ydoc, boundary, 20, 30);
    applyBounPosResize(ydoc, sq, 10, 10, 240, 180);
    applyBounPosMove(ydoc, hex, 5, 5);

    const g = renderScratch(renderBounPos, yBounPos);
    for (const yEl of yBounPos.toArray()) {
      assertPureMirror(findRendered(g, yEl.getAttribute('id')), yEl, yEl.getAttribute('id'));
    }
  });
});
