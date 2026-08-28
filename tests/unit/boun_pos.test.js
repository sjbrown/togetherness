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
  generateSquareGrid, generateHexGrid, generateFlatHexGrid, gridFillExtent, computeMaxSnapRadius, computeGridPositions,
  // CRDT
  addBoundary, addPositionSet, createPositionSetElement, findEl, deleteEl, editBounPos, applyMoveCommit,
  // Layer API
  renderLayer, layerData,
  // Geometry queries
  getGeom, getAnchor,
  // Edit schema
  getTtStateSchema, edit, previewEdit,
  // Selection modes / resize
  selectModes, nextSelectMode, computeResize, applyResize, previewResize,
  // Drag context
  computeBoundaryRects, getSnapPoints,
} from '../../src/boun_pos.js';
import { tablesAPI } from '../../src/tables.js';
const { makeDoc } = tablesAPI;

const SVG_NS = 'http://www.w3.org/2000/svg';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLayer() {
  const ydoc = makeDoc();
  return { ydoc, yBounPos: ydoc.getXmlFragment('boundaries') };
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
  const xSpacing = overrides.xSpacing ?? 80;
  const ySpacing = overrides.ySpacing ?? 80;
  const circles = gridFillExtent(x, y, w, h, genType, xSpacing, ySpacing);
  createPositionSetElement(layer.ydoc, layer.yBounPos, {
    id, name, snapRadius: 30, genType, xSpacing, ySpacing, x, y, w, h, circles,
    ...overrides, id, name,
  });
  return { id, name, circles };
}

// Mirrors what overlay.js's startGhost clones from a rendered pos-set
// element (see boun_pos.js's _positionSetToSVGEl): a <g data-bounpos-type
// ="pos-set"> with its data-gen-*/data-snap-radius attributes, a <path>
// (getGeom reads this for the extent), and N <circle fill="url(#...)">
// children — the fill is what previewEdit's template-clone approach
// exists to preserve.
function makeGhostPosSet({ x = 0, y = 0, w = 200, h = 200, genType = 'square', xSpacing = 80, ySpacing = 80, snapRadius = 30, circleCount = 4 } = {}) {
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('data-bounpos-type',   'pos-set');
  g.setAttribute('data-gen-type',       genType);
  g.setAttribute('data-gen-x-spacing',  String(xSpacing));
  g.setAttribute('data-gen-y-spacing',  String(ySpacing));
  g.setAttribute('data-snap-radius',    String(snapRadius));
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', rectToPath(x, y, w, h));
  g.appendChild(path);
  for (let i = 0; i < circleCount; i++) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(i * 50));
    circle.setAttribute('cy', String(i * 50));
    circle.setAttribute('r',  '10');
    circle.setAttribute('fill', 'url(#snap-point-grad)');
    g.appendChild(circle);
  }
  return g;
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
  test('3×3 grid at origin with xSpacing 50 and ySpacing 50', () => {
    const pts = generateSquareGrid({ x: 0, y: 0 }, 3, 3, 50, 50);
    expect(pts).toHaveLength(9);
    expect(pts[0]).toEqual({ cx: 0, cy: 0 });
    expect(pts[1]).toEqual({ cx: 50, cy: 0 });
    expect(pts[3]).toEqual({ cx: 0, cy: 50 });
    expect(pts[8]).toEqual({ cx: 100, cy: 100 });
  });
});

describe('generateHexGrid', () => {
  test('produces correct column spacing for pointy-top hex', () => {
    const xSpacing = 40 * Math.sqrt(3);
    const ySpacing = 40 * 1.5;
    const pts = generateHexGrid({ x: 0, y: 0 }, 1, 3, xSpacing, ySpacing);
    expect(pts[0].cx).toBeCloseTo(0);
    expect(pts[1].cx).toBeCloseTo(xSpacing);
    expect(pts[2].cx).toBeCloseTo(xSpacing * 2);
  });

  test('odd rows are offset by half column spacing', () => {
    const xSpacing = 40 * Math.sqrt(3);
    const ySpacing = 40 * 1.5;
    const pts = generateHexGrid({ x: 0, y: 0 }, 3, 2, xSpacing, ySpacing);
    // row 0, col 0
    expect(pts[0]).toMatchObject({ cx: 0, cy: 0 });
    // row 1, col 0 — offset by xSpacing/2
    const row1Start = pts.find(p => Math.abs(p.cy - ySpacing) < 0.01);
    expect(row1Start.cx).toBeCloseTo(xSpacing / 2);
  });
});

describe('generateFlatHexGrid', () => {
  // Regression: gridFillExtent calls generateFlatHexGrid(origin, rows, cols,
  // xSpacing, ySpacing) — a 5-arg call — but the function used to declare
  // only 4 params (origin, rows, cols, hexSize), so ySpacing was silently
  // dropped and xSpacing alone drove BOTH column spacing and row spacing
  // (and the odd-column offset derived from it). That made "x spacing" in
  // the Edit panel move circles in y too, and "y spacing" do nothing.
  test('column spacing (cx) is driven by xSpacing alone', () => {
    const pts = generateFlatHexGrid({ x: 0, y: 0 }, 1, 3, 60, 40);
    expect(pts[0].cx).toBeCloseTo(0);
    expect(pts[1].cx).toBeCloseTo(60);
    expect(pts[2].cx).toBeCloseTo(120);
  });

  test('row spacing (cy) is driven by ySpacing alone', () => {
    const pts = generateFlatHexGrid({ x: 0, y: 0 }, 3, 1, 60, 40);
    // col 0 is never offset — cy should step by ySpacing only.
    expect(pts.map(p => p.cy)).toEqual([0, 40, 80]);
  });

  test('odd columns are offset by half the ROW spacing (ySpacing), not xSpacing', () => {
    const pts = generateFlatHexGrid({ x: 0, y: 0 }, 1, 2, 60, 40);
    expect(pts[0]).toMatchObject({ cx: 0,  cy: 0 });
    expect(pts[1]).toMatchObject({ cx: 60, cy: 20 }); // col 1: offset by ySpacing/2 = 20
  });

  test('changing xSpacing alone leaves every cy exactly as it was', () => {
    const before = generateFlatHexGrid({ x: 0, y: 0 }, 2, 2, 60, 40).map(p => p.cy);
    const after  = generateFlatHexGrid({ x: 0, y: 0 }, 2, 2, 90, 40).map(p => p.cy);
    expect(after).toEqual(before);
  });

  test('changing ySpacing alone leaves every cx exactly as it was', () => {
    const before = generateFlatHexGrid({ x: 0, y: 0 }, 2, 2, 60, 40).map(p => p.cx);
    const after  = generateFlatHexGrid({ x: 0, y: 0 }, 2, 2, 60, 90).map(p => p.cx);
    expect(after).toEqual(before);
  });
});

describe('computeMaxSnapRadius', () => {
  test('square: half the min spacing', () => {
    expect(computeMaxSnapRadius('square', 80, 80)).toBe(40);
  });

  test('hex: computes nearest center distance for pointy-top hex', () => {
    const xSpacing = 40 * Math.sqrt(3);
    const ySpacing = 40 * 1.5;
    const maxR = computeMaxSnapRadius('hex', xSpacing, ySpacing);
    // For pointy-top hex: nearest = min(xSpacing, sqrt((xSpacing/2)^2 + ySpacing^2))
    const expected = Math.min(xSpacing, Math.sqrt((xSpacing / 2) ** 2 + ySpacing ** 2)) / 2;
    expect(maxR).toBeCloseTo(expected);
  });
});

describe('gridFillExtent', () => {
  test('square grid fits expected number of points', () => {
    // 200×200 extent, xSpacing 50, ySpacing 50 → 5 per axis = 25 points (0,50,100,150,200)
    const pts = gridFillExtent(0, 0, 200, 200, 'square', 50, 50);
    expect(pts.length).toBeGreaterThan(0);
    pts.forEach(p => {
      expect(p.cx).toBeGreaterThanOrEqual(0);
      expect(p.cx).toBeLessThanOrEqual(200);
      expect(p.cy).toBeGreaterThanOrEqual(0);
      expect(p.cy).toBeLessThanOrEqual(200);
    });
  });

  test('extent smaller than spacing produces only the corner point', () => {
    // xSpacing=80, ySpacing=80 > extent=10×10; only the origin corner (0,0) falls within
    const pts = gridFillExtent(0, 0, 10, 10, 'square', 80, 80);
    expect(pts).toHaveLength(1);
    expect(pts[0]).toEqual({ cx: 0, cy: 0 });
  });
});

describe('computeGridPositions', () => {
  // The same math rebuildPositionSetGrid uses to actually commit a
  // resize (see editBounPos/editEl below) — exposed separately so this
  // file's own previewEdit (tested further down) can compute the
  // identical result without touching Yjs.
  test('circles match gridFillExtent for the same inputs', () => {
    const extent = { x: 0, y: 0, w: 200, h: 200 };
    const { circles } = computeGridPositions(extent, 'square', 50, 50, 2);
    expect(circles).toEqual(gridFillExtent(0, 0, 200, 200, 'square', 50, 50));
  });

  test('r scales with snapRadius level (1 through 4)', () => {
    const extent = { x: 0, y: 0, w: 200, h: 200 };
    const radii = [1, 2, 3, 4].map(level => computeGridPositions(extent, 'square', 80, 80, level).r);
    expect(radii[0]).toBeLessThan(radii[1]);
    expect(radii[1]).toBeLessThan(radii[2]);
    expect(radii[2]).toBeLessThan(radii[3]);
  });

  test('works for hex grids too', () => {
    const extent = { x: 0, y: 0, w: 300, h: 300 };
    const { circles, r } = computeGridPositions(extent, 'hex', 70, 60, 2);
    expect(circles.length).toBeGreaterThan(0);
    expect(r).toBeGreaterThan(0);
  });

  test('works for flat-hex grids too, with xSpacing/ySpacing independently controlling cx/cy', () => {
    const extent = { x: 0, y: 0, w: 300, h: 300 };
    const { circles: withNarrowX } = computeGridPositions(extent, 'flat-hex', 60, 40, 2);
    const { circles: withWiderX }  = computeGridPositions(extent, 'flat-hex', 90, 40, 2);
    expect(withNarrowX.length).toBeGreaterThan(0);
    // Same ySpacing → the set of cy values used is unchanged by xSpacing.
    const cySet = arr => [...new Set(arr.map(p => Math.round(p.cy)))].sort((a, b) => a - b);
    expect(cySet(withWiderX)).toEqual(cySet(withNarrowX));
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
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', xSpacing: 80, ySpacing: 80 });
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

describe('editBounPos grid resize (xSpacing/ySpacing/snapRadius)', () => {
  // Locks in that the real commit path (rebuildPositionSetGrid, called
  // via editBounPos/editEl) produces exactly what computeGridPositions
  // predicts — the same parity a live ghost preview relies on to show a
  // grid that matches what actually lands on release.
  test('changing xSpacing rebuilds the circle set to match computeGridPositions', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });

    editBounPos({ id, xSpacing: 50, ySpacing: 80 }, layer.ydoc, layer.yBounPos);

    const yEl = findEl(layer.yBounPos, id);
    const committedCircles = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement && c.nodeName === 'circle')
      .map(c => ({ cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }));
    const { circles: expectedCircles } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', 50, 80, 2);
    expect(committedCircles).toEqual(expectedCircles);
    expect(yEl.getAttribute('data-gen-x-spacing')).toBe('50');
  });

  test('changing snapRadius level updates every circle’s r to match computeGridPositions', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });

    editBounPos({ id, snapRadius: 4 }, layer.ydoc, layer.yBounPos);

    const yEl = findEl(layer.yBounPos, id);
    const { r: expectedR } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', 80, 80, 4);
    const committedRadii = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement && c.nodeName === 'circle')
      .map(c => Number(c.getAttribute('r')));
    expect(committedRadii.every(r => r === expectedR)).toBe(true);
    expect(yEl.getAttribute('data-snap-radius')).toBe(String(expectedR));
  });
});

describe('previewEdit', () => {
  // This is the function that used to live as overlay.js's
  // updatePosSetGhost — moved here so boun_pos.js is the only file that
  // knows a pos-set's circles are derived from spacing/snapRadius, not a
  // plain attribute. ghostEl mirrors the detached clone overlay.js's
  // startGhost hands it — same shape as attr-ghost.test.js's harness, but
  // exercised directly against this module instead of through Overlay.
  test('replaces the circle children to match a new grid, preserving the fill from an existing circle', () => {
    const ghostEl = makeGhostPosSet({ x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });
    // The level previewEdit itself derives off the ghost's own (unmutated)
    // attributes — same call it makes internally.
    const { snapRadius: level, ySpacing } = getTtStateSchema(ghostEl);

    previewEdit(ghostEl, { xSpacing: 50 });

    const { circles: expected, r: expectedR } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', 50, ySpacing, level);
    const circles = [...ghostEl.querySelectorAll(':scope > circle')];
    expect(circles).toHaveLength(expected.length);
    expect(circles.map(c => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]))
      .toEqual(expected.map(({ cx, cy }) => [Math.round(cx), Math.round(cy)]));
    expect(circles.every(c => Number(c.getAttribute('r')) === Math.round(expectedR))).toBe(true);
    // Template-cloned from an existing circle, so the gradient fill survives.
    expect(circles.every(c => c.getAttribute('fill') === 'url(#snap-point-grad)')).toBe(true);
  });

  test('reads whichever of xSpacing/ySpacing/snapRadius are absent from editData off the ghost’s own attributes', () => {
    const ghostEl = makeGhostPosSet({ x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });
    const { snapRadius: level, xSpacing } = getTtStateSchema(ghostEl);

    // Only ySpacing is previewed; xSpacing/snapRadius should come from the
    // ghost's current data-gen-x-spacing/data-snap-radius attributes.
    previewEdit(ghostEl, { ySpacing: 40 });

    const { circles: expected } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', xSpacing, 40, level);
    const circles = [...ghostEl.querySelectorAll(':scope > circle')];
    expect(circles.map(c => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]))
      .toEqual(expected.map(({ cx, cy }) => [Math.round(cx), Math.round(cy)]));
  });

  test('the <path> child is left untouched', () => {
    const ghostEl = makeGhostPosSet({ x: 0, y: 0, w: 200, h: 200 });
    const d = ghostEl.querySelector('path').getAttribute('d');

    previewEdit(ghostEl, { xSpacing: 20 });

    expect(ghostEl.querySelector('path').getAttribute('d')).toBe(d);
  });

  test('falls back to a bare circle (no fill) if the ghost started with zero circles', () => {
    const ghostEl = makeGhostPosSet({ x: 0, y: 0, w: 50, h: 50, circleCount: 0 });

    previewEdit(ghostEl, { xSpacing: 40, ySpacing: 40 });

    const circles = [...ghostEl.querySelectorAll(':scope > circle')];
    expect(circles.length).toBeGreaterThan(0);
    expect(circles[0].hasAttribute('fill')).toBe(false);
  });

  test('is a no-op for a boundary ghost (no spacing/snapRadius to preview)', () => {
    const ghostEl = document.createElementNS(SVG_NS, 'g');
    ghostEl.setAttribute('data-bounpos-type', 'boundary');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', rectToPath(0, 0, 100, 100));
    ghostEl.appendChild(path);

    expect(() => previewEdit(ghostEl, { name: 'dungeon' })).not.toThrow();
    expect(ghostEl.querySelectorAll('circle')).toHaveLength(0);
  });

  test('is a no-op when editData has none of xSpacing/ySpacing/snapRadius', () => {
    const ghostEl = makeGhostPosSet({ circleCount: 3 });

    previewEdit(ghostEl, { name: 'grid' });

    expect(ghostEl.querySelectorAll(':scope > circle')).toHaveLength(3);
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
    addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 100, ySpacing: 100 });
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

// ── Selection modes / resize ────────────────────────────────────────────────

describe('selectModes / nextSelectMode', () => {
  test('selectModes offers sel-move then sel-resize for both boundaries and pos-sets', () => {
    const boundaryEl = document.createElementNS(SVG_NS, 'g');
    boundaryEl.setAttribute('data-bounpos-type', 'boundary');
    const posSetEl = document.createElementNS(SVG_NS, 'g');
    posSetEl.setAttribute('data-bounpos-type', 'pos-set');
    expect(selectModes(boundaryEl)).toEqual(['sel-move', 'sel-resize']);
    expect(selectModes(posSetEl)).toEqual(['sel-move', 'sel-resize']);
  });

  test('nextSelectMode cycles sel-move <-> sel-resize', () => {
    const el = document.createElementNS(SVG_NS, 'g');
    expect(nextSelectMode(el, null)).toBe('sel-move');
    expect(nextSelectMode(el, 'sel-move')).toBe('sel-resize');
    expect(nextSelectMode(el, 'sel-resize')).toBe('sel-move');
  });
});

describe('computeResize', () => {
  // Corner indices: 0=NW, 1=NE, 2=SE, 3=SW — same order as drawing.js/toys.js.
  const startRect = { x: 100, y: 100, width: 200, height: 150 }; // right=300, bottom=250

  test('SE drag keeps the top-left corner fixed, size follows the pointer', () => {
    const rect = computeResize('sel-resize', startRect, 2, 340, 260);
    expect(rect).toEqual({ x: 100, y: 100, width: 240, height: 160 });
  });

  test('NW drag keeps the bottom-right corner fixed', () => {
    const rect = computeResize('sel-resize', startRect, 0, 80, 90);
    expect(rect).toEqual({ x: 80, y: 90, width: 220, height: 160 });
  });

  test('dragging past the fixed corner clamps to the minimum size, never inverts', () => {
    const rect = computeResize('sel-resize', startRect, 2, 50, 50);
    expect(rect.x).toBe(100);
    expect(rect.y).toBe(100);
    expect(rect.width).toBeGreaterThanOrEqual(30);
    expect(rect.height).toBeGreaterThanOrEqual(30);
  });
});

describe('applyResize', () => {
  test('boundary: updates <path> d and <text> position, same shape as applyMoveCommit', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const yEl = findEl(layer.yBounPos, id);

    applyResize(layer.ydoc, yEl, 50, 60, 300, 220);

    const yPath = yEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'path');
    expect(pathToRect(yPath.getAttribute('d'))).toEqual({ x: 50, y: 60, w: 300, h: 220 });
    const yText = yEl.toArray().find(c => c instanceof Y.XmlElement && c.nodeName === 'text');
    expect(Number(yText.getAttribute('x'))).toBe(50 + 300);
    expect(Number(yText.getAttribute('y'))).toBe(60 - 5);
  });

  test('pos-set: regenerates the circle grid to fill the new extent, preserving genType/spacing/snapRadius', () => {
    const layer = makeLayer();
    // snapRadius:20 round-trips exactly to level 2 for xSpacing/ySpacing 80
    // (maxR = 40, level 2 = 40 * 2/4 = 20) — computeGridPositions below
    // asserts against that same level 2.
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80, snapRadius: 20 });
    const yEl = findEl(layer.yBounPos, id);

    applyResize(layer.ydoc, yEl, 0, 0, 400, 400);

    const { circles: expectedCircles, r: expectedR } =
      computeGridPositions({ x: 0, y: 0, w: 400, h: 400 }, 'square', 80, 80, 2);
    const committedCircles = yEl.toArray()
      .filter(c => c instanceof Y.XmlElement && c.nodeName === 'circle')
      .map(c => ({ cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }));
    expect(committedCircles).toEqual(expectedCircles);
    expect(committedCircles.length).toBeGreaterThan(4); // strictly more points than the 200x200 extent had
    expect(yEl.toArray().find(c => c.nodeName === 'circle')?.getAttribute('r')).toBe(String(expectedR));
    // genType/xSpacing/ySpacing/snapRadius are untouched by a resize.
    expect(yEl.getAttribute('data-gen-type')).toBe('square');
    expect(yEl.getAttribute('data-gen-x-spacing')).toBe('80');
  });

  test('is a no-op when yEl is null', () => {
    const layer = makeLayer();
    expect(() => applyResize(layer.ydoc, null, 0, 0, 100, 100)).not.toThrow();
  });
});

describe('previewResize', () => {
  test('boundary ghost: moves <path> and <text> to the new rect', () => {
    const ghostEl = document.createElementNS(SVG_NS, 'g');
    ghostEl.setAttribute('data-bounpos-type', 'boundary');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', rectToPath(0, 0, 100, 100));
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '100');
    text.setAttribute('y', '-5');
    ghostEl.appendChild(path);
    ghostEl.appendChild(text);

    previewResize(ghostEl, 20, 30, 150, 120);

    expect(pathToRect(ghostEl.querySelector('path').getAttribute('d'))).toEqual({ x: 20, y: 30, w: 150, h: 120 });
    expect(ghostEl.querySelector('text').getAttribute('x')).toBe(String(20 + 150));
    expect(ghostEl.querySelector('text').getAttribute('y')).toBe(String(30 - 5));
  });

  test('pos-set ghost: regenerates circles to fill the new extent, preserving fill from an existing circle', () => {
    // snapRadius:20 round-trips exactly to level 2 for xSpacing/ySpacing 80 (see applyResize's pos-set test above).
    const ghostEl = makeGhostPosSet({ x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80, snapRadius: 20 });

    previewResize(ghostEl, 0, 0, 400, 400);

    const { circles: expected, r: expectedR } = computeGridPositions({ x: 0, y: 0, w: 400, h: 400 }, 'square', 80, 80, 2);
    const circles = [...ghostEl.querySelectorAll(':scope > circle')];
    expect(circles).toHaveLength(expected.length);
    expect(circles.map(c => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]))
      .toEqual(expected.map(({ cx, cy }) => [Math.round(cx), Math.round(cy)]));
    expect(circles.every(c => Number(c.getAttribute('r')) === Math.round(expectedR))).toBe(true);
    expect(circles.every(c => c.getAttribute('fill') === 'url(#snap-point-grad)')).toBe(true);
    expect(ghostEl.querySelector('path').getAttribute('d')).toBe(rectToPath(0, 0, 400, 400));
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
    addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', xSpacing: 80, ySpacing: 80 });
    // Override the name to match
    const yEl = layer.yBounPos.toArray()[0];
    layer.ydoc.transact(() => yEl.setAttribute('name', 'dungeon'));
    // computeBoundaryRects should not pick up pos-sets
    const rects = computeBoundaryRects(layer.yBounPos, new Set(['dungeon']), { x: 50, y: 50 });
    expect(rects).toBeNull();
  });
});

describe('getSnapPoints', () => {
  test('returns snap points', () => {
    const layer = makeLayer();
    const { id, circles } = addPS(layer, { x: 0, y: 0, w: 400, h: 400, genType: 'square', xSpacing: 100, ySpacing: 100 });
    // Set name to known value
    const yEl = findEl(layer.yBounPos, id);
    editBounPos({ id, name: 'forest' }, layer.ydoc, layer.yBounPos);
    const pts = getSnapPoints(layer.yBounPos);
    expect(pts.length).toBe(circles.length);
    pts.forEach(p => {
      expect(typeof p.cx).toBe('number');
      expect(typeof p.cy).toBe('number');
      expect(typeof p.snapRadius).toBe('number');
    });
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

});
