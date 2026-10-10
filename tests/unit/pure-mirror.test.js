// @vitest-environment jsdom
/**
 * pure-mirror.test.js
 *
 * The drawing and boundaries layers are op layers: their DOM is the source,
 * not a mirror of anything. Each half asserts the DOM carries exactly the
 * attributes the layer's writers set, nothing stray, through the LayerAPI.
 * (Live equals replay is in drawing-projection-mirror.test.js and
 * boun_pos-projection-mirror.test.js.)
 */

import { describe, test, expect } from 'vitest';
import { DRAWING_LAYER, SHAPE_TYPES, makeLayerAPI } from '../../src/drawing.js';
import { ensureLayerId } from '../../src/op_layers.js';
import {
  BOUN_POS_LAYER, BOUNPOS_TYPES, makeLayerAPI as makeBounPosAPI, toolParamsToCreateParams,
} from '../../src/boun_pos.js';
import { tablesAPI } from '../../src/tables.js';

const { makeDoc } = tablesAPI;
const SVG_NS = 'http://www.w3.org/2000/svg';

function findRendered(g, dataId) {
  return g.querySelector(`[data-id="${dataId}"]`);
}

// ── Drawing layer ────────────────────────────────────────────────────────────

// The attribute set a shape of this type is created with: identity plus
// every schema key under its SVG name.
function expectedAttrNames(type, extra = []) {
  const def = SHAPE_TYPES[type];
  const names = ['id', 'data-id', 'data-module'];
  for (const k of Object.keys(def.schema.types)) {
    if (k === 'id' || k === 'type') continue;
    names.push((def.attrMap ?? {})[k] ?? k);
  }
  return [...names, ...extra].sort();
}

const attrNames = (el) => [...el.attributes].map(a => a.name).sort();

function drawingLayerAPI() {
  const ydoc = makeDoc();
  const layerEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), DRAWING_LAYER);
  const L = makeLayerAPI(ydoc, () => layerEl, { id: 'me' }, 'pure-mirror-table');
  return { ydoc, layerEl, L };
}

describe('the drawing layer DOM carries exactly the attributes its schema writes', () => {
  test('every kind, at creation', () => {
    const { layerEl, L } = drawingLayerAPI();

    L.add({ id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50, fill: '#abc' });
    L.add({
      id: 'rect2', type: 'rect', x: 10, y: 20, width: 100, height: 50,
      rotate: 30, 'pivot-x': 0.5, 'pivot-y': 0.5,
    });
    L.add({ id: 'circ1', type: 'circle', cx: 40, cy: 40, r: 20 });

    expect(layerEl.children.length).toBe(3);
    expect(attrNames(findRendered(layerEl, 'rect1'))).toEqual(expectedAttrNames('rect'));
    expect(attrNames(findRendered(layerEl, 'rect2'))).toEqual(expectedAttrNames('rect', ['transform']));
    expect(attrNames(findRendered(layerEl, 'circ1'))).toEqual(expectedAttrNames('circle'));
    expect(findRendered(layerEl, 'rect1').getAttribute('fill')).toBe('#abc');
  });

  test('after move, resize, rotate and pivot, through the LayerAPI', () => {
    const { layerEl, L } = drawingLayerAPI();
    L.add({ id: 'rect1', type: 'rect', x: 10, y: 20, width: 100, height: 50 });

    L.applyMoveCommit(L.find('rect1'), 30, 40);
    L.applyResize(L.find('rect1'), 30, 40, 120, 60);
    L.applyRotate(L.find('rect1'), 25);
    L.applyPivot(L.find('rect1'), 0, 0, 30, 40);

    const el = findRendered(layerEl, 'rect1');
    // The mutators actually did something observable, so this isn't
    // vacuously true.
    expect(el.getAttribute('transform')).toMatch(/^rotate\(25 /);
    expect(el.getAttribute('width')).toBe('120');
    expect(attrNames(el)).toEqual(expectedAttrNames('rect', ['transform']));
    expect(layerEl.children.length).toBe(1);
  });
});

// ── Boundaries / positions layer ────────────────────────────────────────────

describe('the boundaries layer DOM carries exactly the attributes its writers set', () => {
  function bounPosLayerAPI() {
    const ydoc = makeDoc();
    const layerEl = ensureLayerId(document.createElementNS(SVG_NS, 'g'), BOUN_POS_LAYER);
    const L = makeBounPosAPI(ydoc, () => layerEl, { id: 'me' }, 'pure-mirror-bounpos-table');
    return { ydoc, layerEl, L };
  }

  const GROUP_ATTRS = ['id', 'data-id', 'data-module', 'name', 'data-bounpos-type', 'transform'];
  const POS_SET_ATTRS = [...GROUP_ATTRS, 'data-snap-radius', 'data-gen-type', 'data-gen-x-spacing', 'data-gen-y-spacing'];

  // Every element below the group, recursively: tag plus attribute names.
  const shape = (el) => ({
    tag: el.localName,
    attrs: attrNames(el),
    children: [...el.children].map(shape),
  });

  function seed(L) {
    L.add('boundary', { id: 'b1', name: 'Hand', x: 0, y: 0, w: 200, h: 100 });
    for (const [toolName, id, toolParams] of [
      ['pos-grid-sq',  'sq',  { spacing: 80, snapRadius: 2 }],
      ['pos-grid-hex', 'hex', { xSpacing: 60, ySpacing: 60, snapRadius: 2 }],
    ]) {
      const def = BOUNPOS_TYPES[toolName];
      const p = toolParamsToCreateParams(def.genType, toolParams, { x: 0, y: 0, w: 200, h: 200 });
      L.add(toolName, {
        id, name: id, snapRadius: p.snapRadius, genType: def.genType,
        xSpacing: p.xSpacing, ySpacing: p.ySpacing, x: 0, y: 0, w: 200, h: 200, circles: p.circles,
      });
    }
  }

  test('boundary, square pos-set and hex pos-set, at creation', () => {
    const { layerEl, L } = bounPosLayerAPI();
    seed(L);

    expect(layerEl.children.length).toBe(3);
    expect(attrNames(findRendered(layerEl, 'b1'))).toEqual([...GROUP_ATTRS].sort());
    expect(attrNames(findRendered(layerEl, 'sq'))).toEqual([...POS_SET_ATTRS].sort());
    expect(attrNames(findRendered(layerEl, 'hex'))).toEqual([...POS_SET_ATTRS].sort());

    const b = shape(findRendered(layerEl, 'b1'));
    // The envelope stamps a data-id on every added node so mutations can
    // address them.
    expect(b.children).toEqual([
      { tag: 'path', attrs: ['d', 'data-id'], children: [] },
      { tag: 'text', attrs: ['data-id', 'x', 'y'], children: [] },
    ]);
    const circles = findRendered(layerEl, 'sq').querySelectorAll(':scope > circle');
    expect(circles.length).toBeGreaterThan(0);
    circles.forEach(c => expect(attrNames(c)).toEqual(['cx', 'cy', 'data-id', 'r']));
  });

  test('after move and resize, through the LayerAPI: same attributes, no strays', () => {
    const { layerEl, L } = bounPosLayerAPI();
    seed(L);
    const before = ['b1', 'sq', 'hex'].map(id => shape(findRendered(layerEl, id)).attrs);

    L.applyMoveCommit(L.find('b1'), 20, 30);
    L.applyResize(L.find('sq'), 10, 10, 240, 180);
    L.applyMoveCommit(L.find('hex'), 5, 5);

    // The mutators actually did something observable, so this isn't
    // vacuously true.
    expect(findRendered(layerEl, 'b1').getAttribute('transform')).toBe('translate(20, 30)');
    expect(findRendered(layerEl, 'sq').getAttribute('transform')).toBe('translate(10, 10)');
    expect(findRendered(layerEl, 'sq').querySelector('path').getAttribute('d')).toContain('240');
    expect(['b1', 'sq', 'hex'].map(id => shape(findRendered(layerEl, id)).attrs)).toEqual(before);
    expect(layerEl.children.length).toBe(3);
  });
});
