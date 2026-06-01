/**
 * shapes.js — core CRDT operations for crdt-svg
 *
 * The CRDT operations (addShape, deleteShape, findShape, selectionGeometry,
 * SHAPE_TYPES) are pure functions over Yjs types — no DOM, importable anywhere.
 *
 * The rendering helpers (_toSVGEl, getGeom, listShapes) ARE DOM-coupled: they
 * mirror Yjs nodes into live SVG elements. They require a DOM (browser or jsdom).
 */

import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

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
  // TODO: don't be so permissive.  If caller doesn't provide type, throw error
  const type = attrs.type ?? 'rect';
  const def  = SHAPE_TYPES[type];
  if (!def) throw new Error(`unknown shape type: ${type}`);

  // Accept either SVG-native 'stroke-width' or camelCase strokeWidth.
  const presentation = {
    fill:           attrs.fill,
    stroke:         attrs.stroke,
    // TODO: don't be so permissive.  Stick to stroke-width
    'stroke-width': attrs['stroke-width'] ?? attrs.strokeWidth,
    opacity:        attrs.opacity,
  };

  const el = new Y.XmlElement(def.tag);
  ydoc.transact(() => {
    el.setAttribute('id', String(attrs.id));
    for (const k of def.geomAttrs) el.setAttribute(k, String(attrs[k]));
    // TODO: don't hoist PRESENTATION to a global var. too DRY. each type should have def.presAttrs
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
 * Mirror a Y.XmlElement tree into a live, SVG-namespaced DOM element.
 * Uses createElementNS (not toDOM/DOMParser) so the SVG namespace and tag-name
 * case are preserved. <script> nodes are never mirrored.
 */
function mirror(yNode) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString());
  if (!(yNode instanceof Y.XmlElement)) return null;
  if (yNode.nodeName === 'script') return null;
  const el = document.createElementNS(SVG_NS, yNode.nodeName);
  const attrs = yNode.getAttributes();
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k]);
    else                    el.setAttribute(k, attrs[k]);
  }
  yNode.toArray().forEach(child => {
    const dom = mirror(child);
    if (dom) el.appendChild(dom);
  });
  return el;
}

/**
 * Render a shape Y.XmlElement to an SVG DOM element, stamped with the handles
 * app.js needs: data-yid (the shape id) and data-layer-type="drawing".
 */
export function _toSVGEl(yEl) {
  const el = mirror(yEl);
  if (el && el.setAttribute) {
    el.setAttribute('data-yid', yEl.getAttribute('id'));
    el.setAttribute('data-layer-type', 'drawing');
  }
  return el;
}

/**
 * Bounding box for a rendered shape svgEl, resolved per shape type so circles
 * work too. Returns { x, y, width, height } (Numbers) or null. No PAD.
 */
export function getGeom(svgEl) {
  const def = SHAPE_TYPES[svgEl?.tagName];
  if (!def) return null;
  const a = {};
  for (const k of def.geomAttrs) a[k] = svgEl.getAttribute(k);
  return def.bbox(a);
}

/**
 * TODO: get rid of this function
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
 * Returns an array of { svgEl, shapeMeta }; each svgEl is a rendered SVG element
 * with data-yid + data-layer-type stamped.
 */
export function listShapes(yDrawing, yDrawingMeta, { newestFirst = false } = {}) {
  const results = [];
  for (let node = yDrawing.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    const id        = node.getAttribute('id');
    const shapeMeta = yDrawingMeta.get(id) ?? {};
    results.push({ svgEl: _toSVGEl(node), shapeMeta });
  }
  if (newestFirst) results.sort((a, b) => (b.shapeMeta.created ?? 0) - (a.shapeMeta.created ?? 0));
  return results;
}


// ── Layer accessor ───────────────────────────────────────────────────────────
// TODO: cruft
export function getDrawingLayer(ydoc) {
  return {
    yDrawing: ydoc.getXmlFragment('shapes'),
    yDrawingMeta: ydoc.getMap('shapeMeta'),
  }
}

