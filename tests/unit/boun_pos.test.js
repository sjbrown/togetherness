// @vitest-environment jsdom
/**
 * boun_pos.test.js
 *
 * Tests for the Boundaries and Positions layer module.
 * Runs under jsdom because _toSVGEl builds live SVG DOM nodes.
 */

import * as Y from 'yjs';
import { describe, test, expect, beforeEach } from 'vitest';
import {
  // ID helpers
  newBoundaryId, newPositionSetId,
  // Geometry
  rectToPath, pathToRect,
  // Grid math
  generateSquareGrid, generateHexGrid, gridFillExtent, computeMaxSnapRadius,
  // CRDT
  addBoundary, addPositionSet, createPositionSetElement, findEl, deleteEl, editBounPos, applyMoveCommit,
  // Layer API
  renderLayer, layerData,
  // Geometry queries
  getGeom, getAnchor,
  // Edit schema
  getTtStateSchema, edit,
  // Drag context
  computeBoundaryRects, computePositionSnapPoints,
} from '../../src/boun_pos.js';
import { makeDoc } from '../../src/app.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLayer() {
  const doc = makeDoc();
  return { ydoc: doc.ydoc, yBounPos: doc.yBounPos };
}

function addB(layer, overrides = {}) {
  const { id, name } = newBoundaryId();
  addBoundary(layer.ydoc, layer.yBounPos, {
    id, name, x: 100, y: 100, w: 200, h: 150,
    ...overrides,
  });
  return { id, name };
}

function addPS(layer, overrides = {}) {
  const { id, name } = newPositionSetId();
  const x = overrides.x ?? 0, y = overrides.y ?? 0;
  const w = overrides.w ?? 400, h = overrides.h ?? 300;
  const genType  = overrides.genType  ?? 'square';
  const genParam = overrides.genParam ?? 80;
  const circles = gridFillExtent(x, y, w, h, genType, genParam);
  createPositionSetElement(layer.ydoc, layer.yBounPos, {
    id, name, snapRadius: 30, genType, genParam, x, y, w, h, circles,
    ...overrides, id, name,
  });
  return { id, name, circles };
}

// ── ID helpers ─────────────────────────────────────────────────────────────────

describe('newBoundaryId', () => {
  test('id starts with tt-b-v1- and name is toy', () => {
    const { id, name } = newBoundaryId();
    expect(id.slice(0,8)).toBe(`tt-b-v1-`);
    expect(name).toBe('toy');
  });
});

describe('newPositionSetId', () => {
  test('id starts with tt-ps-v1- and name is toy', () => {
    const { id, name } = newPositionSetId();
    expect(id.slice(0,9)).toBe(`tt-ps-v1-`);
    expect(name).toBe('toy');
  });
});

// ── Geometry helpers ───────────────────────────────────────────────────────────

describe('rectToPath / pathToRect', () => {
  test('round-trips a rectangle', () => {
    const d = rectToPath(10, 20, 100, 50);
    const r = pathToRect(d);
    expect(r.x).toBe(10);
    expect(r.y).toBe(20);
    expect(r.w).toBe(100);
    expect(r.h).toBe(50);
  });
});

// ── Grid math ─────────────────────────────────────────────────────────────────

describe('generateSquareGrid', () => {
  test('3×3 grid at origin with spacing 50', () => {
    const pts = generateSquareGrid({ x: 0, y: 0 }, 3, 3, 50);
    expect(pts).toHaveLength(9);
    expect(pts[0]).toEqual({ cx: 0, cy: 0 });
    expect(pts[1]).toEqual({ cx: 50, cy: 0 });
    expect(pts[3]).toEqual({ cx: 0, cy: 50 });
    expect(pts[8]).toEqual({ cx: 100, cy: 100 });
  });
});

describe('generateHexGrid', () => {
  test('produces correct column spacing for pointy-top hex', () => {
    const pts = generateHexGrid({ x: 0, y: 0 }, 1, 3, 40);
    const colSp = 40 * Math.sqrt(3);
    expect(pts[0].cx).toBeCloseTo(0);
    expect(pts[1].cx).toBeCloseTo(colSp);
    expect(pts[2].cx).toBeCloseTo(colSp * 2);
  });

  test('odd rows are offset by half column spacing', () => {
    const pts = generateHexGrid({ x: 0, y: 0 }, 3, 2, 40);
    const colSp   = 40 * Math.sqrt(3);
    const rowSp   = 40 * 1.5;
    // row 0, col 0
    expect(pts[0]).toMatchObject({ cx: 0, cy: 0 });
    // row 1, col 0 — offset by colSp/2
    const row1Start = pts.find(p => Math.abs(p.cy - rowSp) < 0.01);
    expect(row1Start.cx).toBeCloseTo(colSp / 2);
  });
});

describe('computeMaxSnapRadius', () => {
  test('square: half the spacing', () => {
    expect(computeMaxSnapRadius('square', 80)).toBe(40);
  });

  test('hex: hexSize * √3/2', () => {
    expect(computeMaxSnapRadius('hex', 40)).toBeCloseTo(40 * Math.sqrt(3) / 2);
  });
});

describe('gridFillExtent', () => {
  test('square grid fits expected number of points', () => {
    // 200×200 extent, spacing 50 → 5 per axis = 25 points (0,50,100,150,200)
    const pts = gridFillExtent(0, 0, 200, 200, 'square', 50);
    expect(pts.length).toBeGreaterThan(0);
    pts.forEach(p => {
      expect(p.cx).toBeGreaterThanOrEqual(0);
      expect(p.cx).toBeLessThanOrEqual(200);
      expect(p.cy).toBeGreaterThanOrEqual(0);
      expect(p.cy).toBeLessThanOrEqual(200);
    });
  });

  test('extent smaller than spacing produces only the corner point', () => {
    // spacing=80 > extent=10×10; only the origin corner (0,0) falls within
    const pts = gridFillExtent(0, 0, 10, 10, 'square', 80);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toEqual({ cx: 0, cy: 0 });
  });
});

// ── CRDT operations ───────────────────────────────────────────────────────────

describe('addBoundary / findEl', () => {
  test('boundary is found by id and is a <g>', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    const yEl = findEl(layer.yBounPos, id);
    expect(yEl).not.toBeNull();
    expect(yEl.nodeName).toBe('g');
    expect(yEl.getAttribute('data-bounpos-type')).toBe('boundary');
  });

  test('boundary <g> has <path> and <text> children', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    const yEl    = findEl(layer.yBounPos, id);
    const children = yEl.toArray().filter(c => c instanceof Y.XmlElement);
    expect(children.map(c => c.nodeName)).toEqual(expect.arrayContaining(['path', 'text']));
  });

  test('attributes are written to the <g> wrapper', () => {
    const layer = makeLayer();
    const { id, name } = addB(layer);
    const yEl = findEl(layer.yBounPos, id);
    expect(yEl.getAttribute('name')).toBe(name);
    expect(yEl.getAttribute('data-bounpos-type')).toBe('boundary');
  });
});

describe('addPositionSet / findEl', () => {
  test('pos-set is found by id and has correct type', () => {
    const layer = makeLayer();
    const { id } = addPS(layer);
    const yEl = findEl(layer.yBounPos, id);
    expect(yEl).not.toBeNull();
    expect(yEl.nodeName).toBe('g');
    expect(yEl.getAttribute('data-bounpos-type')).toBe('pos-set');
  });

  test('pos-set has <path>, <text>, and <circle> children', () => {
    const layer = makeLayer();
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', genParam: 80 });
    const yEl = findEl(layer.yBounPos, layer.yBounPos.toArray()[0].getAttribute('id'));
    const tags = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement)
      .map(c => c.nodeName);
    expect(tags).toContain('path');
    expect(tags).toContain('text');
    expect(tags).toContain('circle');
  });
});

describe('deleteEl', () => {
  test('removes element from fragment', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    expect(findEl(layer.yBounPos, id)).not.toBeNull();
    deleteEl(layer.ydoc, layer.yBounPos, id);
    expect(findEl(layer.yBounPos, id)).toBeNull();
  });

  test('returns false for missing id', () => {
    const layer = makeLayer();
    expect(deleteEl(layer.ydoc, layer.yBounPos, 'nope')).toBe(false);
  });
});

describe('editBounPos rename', () => {
  test('updates name attribute and meta', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    const yEl = findEl(layer.yBounPos, id);
    editBounPos({ id, name: 'forest' }, layer.ydoc, layer.yBounPos);
    expect(yEl.getAttribute('name')).toBe('forest');
    expect(findEl(layer.yBounPos, id).getAttribute('name')).toBe('forest');
  });
});

describe('applyMoveCommit', () => {
  test('boundary: updates <path> d and <text> position', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const yEl = findEl(layer.yBounPos, id);
    applyMoveCommit(layer.ydoc, yEl, 50, 60);
    const yPath = yEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'path');
    const rect = pathToRect(yPath.getAttribute('d'));
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(60);
    expect(rect.w).toBe(200);  // width preserved
    expect(rect.h).toBe(150);  // height preserved
    const yText = yEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'text');
    expect(Number(yText.getAttribute('x'))).toBe(50 + 200);
    expect(Number(yText.getAttribute('y'))).toBe(60 - 5);
  });

  test('pos-set: translates circles', () => {
    const layer = makeLayer();
    addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', genParam: 100 });
    const yEl = findEl(layer.yBounPos, layer.yBounPos.toArray()[0].getAttribute('id'));
    const circlesBefore = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement && c.nodeName === 'circle')
      .map(c => ({ cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }));
    applyMoveCommit(layer.ydoc, yEl, 100, 100); // move by (100, 100)
    const circlesAfter = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement && c.nodeName === 'circle')
      .map(c => ({ cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }));
    circlesAfter.forEach((after, i) => {
      expect(after.cx).toBeCloseTo(circlesBefore[i].cx + 100);
      expect(after.cy).toBeCloseTo(circlesBefore[i].cy + 100);
    });
  });
});

// ── Drag context helpers ──────────────────────────────────────────────────────

describe('computeBoundaryRects', () => {
  test('returns null when toy has no classes', () => {
    const layer = makeLayer();
    addB(layer, { x: 0, y: 0, w: 300, h: 300 });
    expect(computeBoundaryRects(layer.yBounPos, new Set(), { x: 50, y: 50 })).toBeNull();
  });

  test('returns null when no boundary name matches', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    addBoundary(layer.ydoc, layer.yBounPos,
      { id, name: 'forest', x: 0, y: 0, w: 300, h: 300 });
    expect(computeBoundaryRects(layer.yBounPos, new Set(['dungeon']), { x: 50, y: 50 })).toBeNull();
  });

  test('returns rects when class matches and toy starts inside', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    addBoundary(layer.ydoc, layer.yBounPos,
      { id, name: 'forest', x: 0, y: 0, w: 300, h: 300 });
    const rects = computeBoundaryRects(layer.yBounPos, new Set(['forest']), { x: 50, y: 50 });
    expect(rects).not.toBeNull();
    expect(rects).toHaveLength(1);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, w: 300, h: 300 });
  });

  test('returns null when toy starts outside matched boundary', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    addBoundary(layer.ydoc, layer.yBounPos,
      { id, name: 'forest', x: 0, y: 0, w: 100, h: 100 });
    // anchor is outside the boundary
    const rects = computeBoundaryRects(layer.yBounPos, new Set(['forest']), { x: 200, y: 200 });
    expect(rects).toBeNull();
  });

  test('pos-set elements are ignored', () => {
    const layer = makeLayer();
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', genParam: 80 });
    // Override the name to match
    const yEl = layer.yBounPos.toArray()[0];
    layer.ydoc.transact(() => yEl.setAttribute('name', 'dungeon'));
    // computeBoundaryRects should not pick up pos-sets
    const rects = computeBoundaryRects(layer.yBounPos, new Set(['dungeon']), { x: 50, y: 50 });
    expect(rects).toBeNull();
  });
});

describe('computePositionSnapPoints', () => {
  test('returns empty array when toy has no classes', () => {
    const layer = makeLayer();
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', genParam: 80 });
    expect(computePositionSnapPoints(layer.yBounPos, new Set())).toHaveLength(0);
  });

  test('returns empty array when pos-set name does not match', () => {
    const layer = makeLayer();
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', genParam: 80 });
    expect(computePositionSnapPoints(layer.yBounPos, new Set(['dungeon']))).toHaveLength(0);
  });

  test('returns snap points for class-matched pos-sets', () => {
    const layer = makeLayer();
    const { id, circles } = addPS(layer, { x: 0, y: 0, w: 400, h: 400, genType: 'square', genParam: 100 });
    // Set name to known value
    const yEl = findEl(layer.yBounPos, id);
    editBounPos({ id, name: 'forest' }, layer.ydoc, layer.yBounPos);
    const pts = computePositionSnapPoints(layer.yBounPos, new Set(['forest']));
    expect(pts.length).toBe(circles.length);
    pts.forEach(p => {
      expect(typeof p.cx).toBe('number');
      expect(typeof p.cy).toBe('number');
      expect(typeof p.snapRadius).toBe('number');
    });
  });

  test('boundary elements are ignored', () => {
    const layer = makeLayer();
    const { id: bid } = newBoundaryId();
    addBoundary(layer.ydoc, layer.yBounPos,
      { id: bid, name: 'forest', x: 0, y: 0, w: 300, h: 300 });
    expect(computePositionSnapPoints(layer.yBounPos, new Set(['forest']))).toHaveLength(0);
  });
});

// ── Edit schema ───────────────────────────────────────────────────────────────

describe('getTtStateSchema via rendered DOM', () => {
  test('boundary schema has name field with string kind', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 0, y: 0, w: 200, h: 100 });
    const div = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    div.setAttribute('data-bounpos-type', 'boundary');
    div.setAttribute('name', 'dungeon');
    const schema = getTtStateSchema(div);
    expect(schema.name).toBe('dungeon');
    expect(schema.types.name.kind).toBe('string');
    expect(schema.types['snap-radius']).toBeUndefined();
  });

  test('pos-set schema has snap-radius with correct max', () => {
    const div = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    div.setAttribute('data-bounpos-type', 'pos-set');
    div.setAttribute('name', 'tiles');
    div.setAttribute('data-snap-radius', '25');
    div.setAttribute('data-gen-type', 'square');
    div.setAttribute('data-gen-param', '80');
    const schema = getTtStateSchema(div);
    expect(schema.type).toBe('pos-set');
    expect(schema.snapRadius).toBe(25);
    expect(schema.types.snapRadius.kind).toBe('number');
    expect(schema.types.snapRadius.max).toBe(40); // floor(80/2)
  });
});
