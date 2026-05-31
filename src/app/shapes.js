/**
 * shapes.js — core CRDT operations for crdt-svg
 *
 * Pure functions over Yjs types. No DOM, no browser APIs.
 * Importable by both index.html and test files.
 */

import * as Y from 'yjs';

// ── Shape-type registry ───────────────────────────────────────────────────────
// One entry per drawable type. Everything that differs between a rect and a
// circle lives here and nowhere else:
//   tag       — SVG element name (also the Y.XmlElement nodeName)
//   geomAttrs — which geometry attributes this type stores
//   fromDrag  — map a drag box {x,y,w,h} → this type's geometry attributes
//   bbox      — axis-aligned bounding box {x,y,width,height} from stored attrs
//   label     — short text for the shape-list row
//
// A tool name in index.html is just a key into this table, so adding a shape
// type == adding one entry here (plus a button). No branching elsewhere.
export const SHAPE_TYPES = {
  rect: {
    tag: 'rect',
    geomAttrs: ['x', 'y', 'width', 'height'],
    fromDrag: ({ x, y, w, h }) => ({ x, y, width: w, height: h }),
    bbox: a => ({ x: +a.x, y: +a.y, width: +a.width, height: +a.height }),
    label: a => `${a.width}×${a.height} @ ${a.x},${a.y}`,
  },
  circle: {
    tag: 'circle',
    geomAttrs: ['cx', 'cy', 'r'],
    fromDrag: ({ x, y, w, h }) => ({
      cx: x + Math.round(w / 2),
      cy: y + Math.round(h / 2),
      r:  Math.round(Math.min(w, h) / 2),
    }),
    bbox: a => ({ x: +a.cx - +a.r, y: +a.cy - +a.r, width: 2 * +a.r, height: 2 * +a.r }),
    label: a => `r${a.r} @ ${a.cx},${a.cy}`,
  },
};

// Presentation attributes are shared by every shape type.
const PRESENTATION = ['fill', 'stroke', 'stroke-width', 'opacity'];

// ── Shape operations ──────────────────────────────────────────────────────────

/**
 * Add a shape to the doc.
 * attrs: { id, type?, author, ...geometry, fill, stroke,
 *          'stroke-width' | strokeWidth, opacity }
 * `type` defaults to 'rect'. Geometry keys depend on type (see SHAPE_TYPES).
 */
export function addShape(ydoc, yDrawing, yDrawingMeta, attrs) {
  const type = attrs.type ?? 'rect';
  const def  = SHAPE_TYPES[type];
  if (!def) throw new Error(`unknown shape type: ${type}`);

  // Accept either SVG-native 'stroke-width' or camelCase strokeWidth.
  const presentation = {
    fill:           attrs.fill,
    stroke:         attrs.stroke,
    'stroke-width': attrs['stroke-width'] ?? attrs.strokeWidth,
    opacity:        attrs.opacity,
  };

  const el = new Y.XmlElement(def.tag);
  ydoc.transact(() => {
    el.setAttribute('id', String(attrs.id));
    for (const k of def.geomAttrs) el.setAttribute(k, String(attrs[k]));
    for (const k of PRESENTATION) {
      if (presentation[k] != null) el.setAttribute(k, String(presentation[k]));
    }
    yDrawing.insert(yDrawing.length, [el]);
    yDrawingMeta.set(attrs.id, { author: attrs.author, type, created: Date.now() });
  });
  return el;
}

/**
 * Delete a shape by id. Returns true if found and deleted.
 */
export function deleteShape(ydoc, yDrawing, yDrawingMeta, id) {
  const idx = yDrawing.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yDrawing.delete(idx, 1);
    yDrawingMeta.delete(id);
  });
  return true;
}

/**
 * Find a Y.XmlElement by id. Returns null if not found.
 */
export function findShape(yDrawing, id) {
  return yDrawing.toArray().find(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  ) ?? null;
}

/**
 * Geometry for the selection overlay rect, with PAD applied.
 * The bounding box is resolved per shape type, so circles work too.
 * All values are Numbers. Returns { x, y, width, height } or null if not found.
 */
export function selectionGeometry(yDrawing, shapeId, PAD = 3) {
  const el = findShape(yDrawing, shapeId);
  if (!el) return null;
  const def = SHAPE_TYPES[el.nodeName];
  if (!def) return null;
  const b = def.bbox(el.getAttributes());
  return {
    x:      b.x      - PAD,
    y:      b.y      - PAD,
    width:  b.width  + PAD * 2,
    height: b.height + PAD * 2,
  };
}

/**
 * Iterate all XmlElement children, optionally newest-first by created timestamp.
 * Returns an array of { el, attrs, meta } plain objects.
 */
export function listShapes(yDrawing, yDrawingMeta, { newestFirst = false } = {}) {
  const results = [];
  for (let node = yDrawing.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    const attrs = node.getAttributes();
    const meta  = yDrawingMeta.get(attrs.id) ?? {};
    results.push({ el: node, attrs, meta });
  }
  if (newestFirst) results.sort((a, b) => (b.meta.created ?? 0) - (a.meta.created ?? 0));
  return results;
}


// ── Layer accessor ───────────────────────────────────────────────────────────
export function getDrawingLayer(ydoc) {
  return {
    yDrawing: ydoc.getXmlFragment('shapes'),
    yDrawingMeta: ydoc.getMap('shapeMeta'),
  }
}

