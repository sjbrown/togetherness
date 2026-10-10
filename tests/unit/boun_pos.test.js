// @vitest-environment jsdom
/**
 * boun_pos.test.js
 *
 * Tests for the Boundaries and Positions layer module.
 * Runs under jsdom: the layer is live SVG DOM, and every write is a DOM
 * operation, either bare (the functions) or inside a gesture (the LayerAPI).
 */

import { describe, test, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import {
  // ID helpers
  newBoundaryId, newPositionSetId,
  // Geometry
  rectToPath, pathToRect,
  // Grid math
  generateSquareGrid, generateHexGrid, generateFlatHexGrid, gridFillExtent, computeMaxSnapRadius, computeGridPositions,
  // DOM writes
  BOUNPOS_TYPES, findEl, deleteEl, editBounPos, editEl, applyMoveCommit,
  // Layer
  BOUNDARIES_LAYER, makeLayerAPI, layerData,
  // Geometry queries
  getGeom, getAnchor, translationOf,
  // Edit schema
  getTtStateSchema, getTtState, previewEdit,
  // Selection modes / resize
  selectModes, nextSelectMode, computeResize, applyResize, previewResize,
  // Drag context
  computeBoundaryRects, getSnapPoints,
} from '../../src/boun_pos.js';
import { ensureLayerId } from '../../src/op_layers.js';
import { getOps } from '../../src/op_dag.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TABLE  = 'boun-pos-table';
const AUTHOR = 'user-a';

beforeEach(() => { localStorage.clear(); });

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLayer() {
  const ydoc    = new Y.Doc();
  const layerEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), BOUNDARIES_LAYER);
  const L       = makeLayerAPI(ydoc, () => layerEl, { id: AUTHOR }, TABLE, true);
  L.render(layerEl);   // the creator's genesis checkpoint
  return { ydoc, layerEl, L };
}

function addB(layer, overrides = {}) {
  const { id, name } = newBoundaryId();
  BOUNPOS_TYPES.boundary.create(layer.layerEl, {
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
  BOUNPOS_TYPES['pos-grid-sq'].create(layer.layerEl, {
    id, name, snapRadius: 30, genType, xSpacing, ySpacing, x, y, w, h, circles,
    ...overrides, id, name,
  });
  return { id, name, circles };
}

const circlesOf = (el) =>
  [...el.children].filter(c => c.localName === 'circle')
    .map(c => ({ cx: Number(c.getAttribute('cx')), cy: Number(c.getAttribute('cy')) }));

// Mirrors what overlay.js's startGhost clones from a rendered pos-set
// element: a <g data-bounpos-type="pos-set"> with its
// data-gen-*/data-snap-radius attributes, a <path> (getGeom reads this for
// the extent), and N <circle fill="url(#...)"> children — the fill is what
// previewEdit's template-clone approach exists to preserve.
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

// ── DOM operations ────────────────────────────────────────────────────────────

describe('boundary create / findEl', () => {
  test('boundary is found by id and is a <g>', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    const el = findEl(layer.layerEl, id);
    expect(el).not.toBeNull();
    expect(el.localName).toBe('g');
    expect(el.getAttribute('data-bounpos-type')).toBe('boundary');
    expect(el.getAttribute('data-module')).toBe('boun_pos');
    expect(el.getAttribute('data-id')).toBe(id);
  });

  test('boundary <g> has <path> and <text> children, laid out locally under a translate', () => {
    const layer = makeLayer();
    const { id, name } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const el = findEl(layer.layerEl, id);
    expect([...el.children].map(c => c.localName)).toEqual(['path', 'text']);
    expect(el.getAttribute('transform')).toBe('translate(100, 100)');
    expect(pathToRect(el.querySelector('path').getAttribute('d'))).toEqual({ x: 0, y: 0, w: 200, h: 150 });
    expect(el.querySelector('text').textContent).toBe(name);
  });

  test('attributes are written to the <g> wrapper', () => {
    const layer = makeLayer();
    const { id, name } = addB(layer);
    const el = findEl(layer.layerEl, id);
    expect(el.getAttribute('name')).toBe(name);
    expect(el.getAttribute('data-bounpos-type')).toBe('boundary');
  });
});

describe('pos-set create / findEl', () => {
  test('pos-set is found by id and has correct type', () => {
    const layer = makeLayer();
    const { id } = addPS(layer);
    const el = findEl(layer.layerEl, id);
    expect(el).not.toBeNull();
    expect(el.localName).toBe('g');
    expect(el.getAttribute('data-bounpos-type')).toBe('pos-set');
  });

  test('pos-set has <path>, <text>, and <circle> children', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', xSpacing: 80, ySpacing: 80 });
    const tags = [...findEl(layer.layerEl, id).children].map(c => c.localName);
    expect(tags).toContain('path');
    expect(tags).toContain('text');
    expect(tags).toContain('circle');
  });

  test('circles are stored relative to the set’s origin', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 40, y: 50, w: 200, h: 200, genType: 'square', xSpacing: 100, ySpacing: 100 });
    expect(circlesOf(findEl(layer.layerEl, id))[0]).toEqual({ cx: 0, cy: 0 });
  });
});

describe('deleteEl', () => {
  test('removes the element from the layer', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    expect(findEl(layer.layerEl, id)).not.toBeNull();
    deleteEl(layer.layerEl, id);
    expect(findEl(layer.layerEl, id)).toBeNull();
  });

  test('returns false for missing id', () => {
    const layer = makeLayer();
    expect(deleteEl(layer.layerEl, 'nope')).toBe(false);
  });
});

describe('editBounPos rename', () => {
  test('updates the name attribute and the label’s text node', () => {
    const layer = makeLayer();
    const { id } = addB(layer);
    const el = findEl(layer.layerEl, id);
    const textNode = el.querySelector('text').firstChild;
    editBounPos({ id, name: 'forest' }, layer.layerEl);
    expect(el.getAttribute('name')).toBe('forest');
    expect(el.querySelector('text').textContent).toBe('forest');
    expect(el.querySelector('text').firstChild).toBe(textNode);   // changed in place
  });

  test('a rename through the LayerAPI is one gesture that records a text mutation', () => {
    const layer = makeLayer();
    const { id, name } = newBoundaryId();
    layer.L.add('boundary', { id, name, x: 0, y: 0, w: 100, h: 100 });
    layer.L.edit(layer.L.find(id), { name: 'forest' });
    const op = [...getOps(layer.ydoc, BOUNDARIES_LAYER).values()].pop();
    expect(op.gesture).toBe('edit');
    expect(op.mutations.map(m => m.t)).toEqual(expect.arrayContaining(['attr', 'text']));
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

    editBounPos({ id, xSpacing: 50, ySpacing: 80 }, layer.layerEl);

    const el = findEl(layer.layerEl, id);
    const { circles: expectedCircles } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', 50, 80, 2);
    expect(circlesOf(el)).toEqual(expectedCircles);
    expect(el.getAttribute('data-gen-x-spacing')).toBe('50');
  });

  test('changing snapRadius level updates every circle’s r to match computeGridPositions', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });

    editBounPos({ id, snapRadius: 4 }, layer.layerEl);

    const el = findEl(layer.layerEl, id);
    const { r: expectedR } = computeGridPositions({ x: 0, y: 0, w: 200, h: 200 }, 'square', 80, 80, 4);
    const committedRadii = [...el.children].filter(c => c.localName === 'circle')
      .map(c => Number(c.getAttribute('r')));
    expect(committedRadii.every(r => r === expectedR)).toBe(true);
    expect(el.getAttribute('data-snap-radius')).toBe(String(expectedR));
  });

  test('editEl leaves the transform alone', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 40, y: 50, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80 });
    const el = findEl(layer.layerEl, id);
    editEl(el, { xSpacing: 50 });
    expect(translationOf(el)).toEqual({ tx: 40, ty: 50 });
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
  test('boundary: sets only the group transform; children stay local', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const el = findEl(layer.layerEl, id);
    applyMoveCommit(el, 50, 60);
    expect(pathToRect(el.querySelector('path').getAttribute('d'))).toEqual({ x: 0, y: 0, w: 200, h: 150 });
    expect(translationOf(el)).toEqual({ tx: 50, ty: 60 });
    expect(Number(el.querySelector('text').getAttribute('x'))).toBe(200);
    expect(Number(el.querySelector('text').getAttribute('y'))).toBe(-5);
  });

  test('pos-set: circles are untouched, world snap points shift', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 100, ySpacing: 100 });
    const el = findEl(layer.layerEl, id);
    const localBefore = circlesOf(el);
    const worldBefore = getSnapPoints(layer.layerEl);
    applyMoveCommit(el, 100, 100);
    expect(circlesOf(el)).toEqual(localBefore);
    getSnapPoints(layer.layerEl).forEach((after, i) => {
      expect(after.cx).toBe(worldBefore[i].cx + 100);
      expect(after.cy).toBe(worldBefore[i].cy + 100);
    });
  });

  test('a move of a 121-circle position set is one op with exactly one attr mutation, on transform', () => {
    const layer = makeLayer();
    const { id, name } = newPositionSetId();
    const circles = gridFillExtent(0, 0, 1000, 1000, 'square', 100, 100);
    layer.L.add('pos-grid-sq', {
      id, name, snapRadius: 30, genType: 'square', xSpacing: 100, ySpacing: 100,
      x: 0, y: 0, w: 1000, h: 1000, circles,
    });
    expect(circlesOf(findEl(layer.layerEl, id))).toHaveLength(121);

    const before = getOps(layer.ydoc, BOUNDARIES_LAYER).size;
    const sv = Y.encodeStateVector(layer.ydoc);
    layer.L.applyMoveCommit(layer.L.find(id), 300, 400);
    const ops = [...getOps(layer.ydoc, BOUNDARIES_LAYER).values()];
    expect(ops).toHaveLength(before + 1);

    const op = ops.at(-1);
    expect(op.gesture).toBe('move');
    expect(op.mutations).toHaveLength(1);
    expect(op.mutations[0]).toMatchObject({ t: 'attr', name: 'transform' });

    const bytes = Y.encodeStateAsUpdate(layer.ydoc, sv).length;
    console.log(`move of 121-circle pos-set: op ${JSON.stringify(op).length} B serialized, ${bytes} B Yjs update`);
    expect(JSON.stringify(op).length).toBeLessThan(1000);
  });
});

describe('world geometry across create -> move -> resize -> move', () => {
  // Reference: the previous absolute-coordinate behavior.
  test('boundary readers report the reference world rect at each step', () => {
    const layer = makeLayer();
    const { id, name } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const el = findEl(layer.layerEl, id);
    const steps = [
      [() => {}, { x: 100, y: 100, w: 200, h: 150 }],
      [() => applyMoveCommit(el, 50, 60), { x: 50, y: 60, w: 200, h: 150 }],
      [() => applyResize(el, 20, 30, 300, 220), { x: 20, y: 30, w: 300, h: 220 }],
      [() => applyMoveCommit(el, 500, 400), { x: 500, y: 400, w: 300, h: 220 }],
    ];
    for (const [act, want] of steps) {
      act();
      expect(getGeom(el)).toEqual({ x: want.x, y: want.y, width: want.w, height: want.h });
      expect(getAnchor(el)).toEqual({ x: want.x, y: want.y });
      const rects = computeBoundaryRects(layer.layerEl, new Set([name]), { x: want.x + 1, y: want.y + 1 });
      expect(rects).toEqual([want]);
    }
  });

  test('pos-set readers report the reference world circles at each step', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 40, y: 50, w: 200, h: 200, genType: 'square', xSpacing: 100, ySpacing: 100 });
    const el = findEl(layer.layerEl, id);
    const worldCircles = (x, y, w, h) =>
      gridFillExtent(x, y, w, h, 'square', 100, 100).map(({ cx, cy }) => [cx, cy]);
    const snap = () => getSnapPoints(layer.layerEl).map(p => [p.cx, p.cy]);

    expect(snap()).toEqual(worldCircles(40, 50, 200, 200));
    applyMoveCommit(el, 300, 310);
    expect(snap()).toEqual(worldCircles(300, 310, 200, 200));
    applyResize(el, 10, 20, 400, 300);
    expect(snap()).toEqual(worldCircles(10, 20, 400, 300));
    applyMoveCommit(el, 70, 80);
    expect(snap()).toEqual(worldCircles(70, 80, 400, 300));
    expect(getGeom(el)).toEqual({ x: 70, y: 80, width: 400, height: 300 });
  });
});

describe('old absolute-layout elements', () => {
  // Imported elements from before the translate layout: absolute children,
  // no transform. They are valid as they are.
  function oldPositionSet(layer) {
    const g = document.createElementNS(SVG_NS, 'g');
    const set = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    set(g, {
      id: 'tt-ps-v1-old', 'data-id': 'tt-ps-v1-old', 'data-module': 'boun_pos', name: 'toy',
      'data-bounpos-type': 'pos-set', 'data-snap-radius': '20', 'data-gen-type': 'square',
      'data-gen-x-spacing': '100', 'data-gen-y-spacing': '100',
    });
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', rectToPath(200, 300, 200, 100));
    const text = document.createElementNS(SVG_NS, 'text');
    set(text, { x: '400', y: '295' });
    g.append(path, text);
    for (const [cx, cy] of [[200, 300], [300, 300], [400, 300], [200, 400], [300, 400], [400, 400]]) {
      const c = document.createElementNS(SVG_NS, 'circle');
      set(c, { cx: String(cx), cy: String(cy), r: '20' });
      g.appendChild(c);
    }
    layer.layerEl.appendChild(g);
    return g;
  }

  test('report world geometry without a transform', () => {
    const layer = makeLayer();
    const el = oldPositionSet(layer);
    expect(translationOf(el)).toEqual({ tx: 0, ty: 0 });
    expect(getGeom(el)).toEqual({ x: 200, y: 300, width: 200, height: 100 });
    expect(getSnapPoints(layer.layerEl).map(p => [p.cx, p.cy]))
      .toEqual([[200, 300], [300, 300], [400, 300], [200, 400], [300, 400], [400, 400]]);
  });

  test('a move leaves children untouched and lands the anchor on the target', () => {
    const layer = makeLayer();
    const el = oldPositionSet(layer);
    const childAttrs = () => [...el.children].map(c => JSON.stringify([...c.attributes].map(a => [a.name, a.value])));
    const before = childAttrs();
    applyMoveCommit(el, 250, 320);
    expect(childAttrs()).toEqual(before);
    expect(translationOf(el)).toEqual({ tx: 50, ty: 20 });
    expect(getGeom(el)).toEqual({ x: 250, y: 320, width: 200, height: 100 });
    expect(getSnapPoints(layer.layerEl)[0]).toMatchObject({ cx: 250, cy: 320 });
  });
});

describe('translationOf', () => {
  test('reads translate from a DOM element; anything else is (0, 0)', () => {
    const dom = document.createElementNS(SVG_NS, 'g');
    expect(translationOf(dom)).toEqual({ tx: 0, ty: 0 });
    dom.setAttribute('transform', 'translate(12.5, -7)');
    expect(translationOf(dom)).toEqual({ tx: 12.5, ty: -7 });
    dom.setAttribute('transform', 'translate(3)');
    expect(translationOf(dom)).toEqual({ tx: 3, ty: 0 });
    dom.setAttribute('transform', 'rotate(30) translate(5, 5)');
    expect(translationOf(dom)).toEqual({ tx: 0, ty: 0 });
    expect(dom.getAttribute('transform')).toBe('rotate(30) translate(5, 5)');
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
  // Full corner-by-corner coverage of the shared corner-opposite-fixed
  // algorithm (same fixture numbers) lives in tests/unit/geometry.test.js
  // now — this just checks boun_pos.js wires MIN_BOUNPOS_RESIZE_SIZE
  // through as the clamp floor.
  const startRect = { x: 100, y: 100, width: 200, height: 150 }; // right=300, bottom=250

  test('routes to the shared corner algorithm with boun_pos’ own minimum size', () => {
    const rect = computeResize('sel-resize', startRect, 2, 50, 50);
    expect(rect).toEqual({ x: 100, y: 100, width: 30, height: 30 }); // MIN_BOUNPOS_RESIZE_SIZE
  });
});

describe('applyResize', () => {
  test('boundary: updates <path> d and <text> position, same shape as applyMoveCommit', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 100, y: 100, w: 200, h: 150 });
    const el = findEl(layer.layerEl, id);

    applyResize(el, 50, 60, 300, 220);

    expect(pathToRect(el.querySelector('path').getAttribute('d'))).toEqual({ x: 0, y: 0, w: 300, h: 220 });
    expect(translationOf(el)).toEqual({ tx: 50, ty: 60 });
    expect(Number(el.querySelector('text').getAttribute('x'))).toBe(300);
    expect(Number(el.querySelector('text').getAttribute('y'))).toBe(-5);
  });

  test('pos-set: regenerates the circle grid to fill the new extent, preserving genType/spacing/snapRadius', () => {
    const layer = makeLayer();
    // snapRadius:20 round-trips exactly to level 2 for xSpacing/ySpacing 80
    // (maxR = 40, level 2 = 40 * 2/4 = 20) — computeGridPositions below
    // asserts against that same level 2.
    const { id } = addPS(layer, { x: 0, y: 0, w: 200, h: 200, genType: 'square', xSpacing: 80, ySpacing: 80, snapRadius: 20 });
    const el = findEl(layer.layerEl, id);

    applyResize(el, 0, 0, 400, 400);

    const { circles: expectedCircles, r: expectedR } =
      computeGridPositions({ x: 0, y: 0, w: 400, h: 400 }, 'square', 80, 80, 2);
    const committedCircles = circlesOf(el);
    expect(committedCircles).toEqual(expectedCircles);
    expect(committedCircles.length).toBeGreaterThan(4); // strictly more points than the 200x200 extent had
    expect(el.querySelector('circle').getAttribute('r')).toBe(String(expectedR));
    // genType/xSpacing/ySpacing/snapRadius are untouched by a resize.
    expect(el.getAttribute('data-gen-type')).toBe('square');
    expect(el.getAttribute('data-gen-x-spacing')).toBe('80');
  });

  test('is a no-op when el is null', () => {
    expect(() => applyResize(null, 0, 0, 100, 100)).not.toThrow();
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

    expect(pathToRect(ghostEl.querySelector('path').getAttribute('d'))).toEqual({ x: 0, y: 0, w: 150, h: 120 });
    expect(translationOf(ghostEl)).toEqual({ tx: 20, ty: 30 });
    expect(getGeom(ghostEl)).toEqual({ x: 20, y: 30, width: 150, height: 120 });
    expect(ghostEl.querySelector('text').getAttribute('x')).toBe('150');
    expect(ghostEl.querySelector('text').getAttribute('y')).toBe('-5');
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
    expect(computeBoundaryRects(layer.layerEl, new Set(), { x: 50, y: 50 })).toBeNull();
  });

  test('returns null when no boundary name matches', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    BOUNPOS_TYPES.boundary.create(layer.layerEl, { id, name: 'forest', x: 0, y: 0, w: 300, h: 300 });
    expect(computeBoundaryRects(layer.layerEl, new Set(['dungeon']), { x: 50, y: 50 })).toBeNull();
  });

  test('returns rects when class matches and toy starts inside', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    BOUNPOS_TYPES.boundary.create(layer.layerEl, { id, name: 'forest', x: 0, y: 0, w: 300, h: 300 });
    const rects = computeBoundaryRects(layer.layerEl, new Set(['forest']), { x: 50, y: 50 });
    expect(rects).not.toBeNull();
    expect(rects).toHaveLength(1);
    expect(rects[0]).toMatchObject({ x: 0, y: 0, w: 300, h: 300 });
  });

  test('returns null when toy starts outside matched boundary', () => {
    const layer = makeLayer();
    const { id } = newBoundaryId();
    BOUNPOS_TYPES.boundary.create(layer.layerEl, { id, name: 'forest', x: 0, y: 0, w: 100, h: 100 });
    // anchor is outside the boundary
    const rects = computeBoundaryRects(layer.layerEl, new Set(['forest']), { x: 200, y: 200 });
    expect(rects).toBeNull();
  });

  test('pos-set elements are ignored', () => {
    const layer = makeLayer();
    const { id } = addPS(layer, { x: 0, y: 0, w: 400, h: 300, genType: 'square', xSpacing: 80, ySpacing: 80 });
    findEl(layer.layerEl, id).setAttribute('name', 'dungeon');
    const rects = computeBoundaryRects(layer.layerEl, new Set(['dungeon']), { x: 50, y: 50 });
    expect(rects).toBeNull();
  });
});

describe('getSnapPoints', () => {
  test('returns snap points', () => {
    const layer = makeLayer();
    const { id, circles } = addPS(layer, { x: 0, y: 0, w: 400, h: 400, genType: 'square', xSpacing: 100, ySpacing: 100 });
    editBounPos({ id, name: 'forest' }, layer.layerEl);
    const pts = getSnapPoints(layer.layerEl);
    expect(pts.length).toBe(circles.length);
    pts.forEach(p => {
      expect(typeof p.cx).toBe('number');
      expect(typeof p.cy).toBe('number');
      expect(typeof p.snapRadius).toBe('number');
      expect(p.name).toBe('forest');
    });
  });
});

describe('layerData / getTtState', () => {
  test('layerData lists every element; getTtState reads the world rect back', () => {
    const layer = makeLayer();
    const { id } = addB(layer, { x: 10, y: 20, w: 200, h: 100 });
    addPS(layer);
    expect(layerData(layer.layerEl).map(d => d.kind)).toEqual(['boundary', 'pos-set']);
    expect(getTtState(findEl(layer.layerEl, id))).toMatchObject({ x: 10, y: 20, w: 200, h: 100, bounPosType: 'boundary' });
  });
});

// ── Edit schema ───────────────────────────────────────────────────────────────

describe('getTtStateSchema via rendered DOM', () => {
  test('boundary schema has name field with string kind', () => {
    const div = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    div.setAttribute('data-bounpos-type', 'boundary');
    div.setAttribute('name', 'dungeon');
    const schema = getTtStateSchema(div);
    expect(schema.name).toBe('dungeon');
    expect(schema.types.name.kind).toBe('string');
    expect(schema.types['snap-radius']).toBeUndefined();
  });
});
