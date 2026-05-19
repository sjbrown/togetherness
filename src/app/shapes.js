/**
 * shapes.js — core CRDT operations for crdt-svg
 *
 * Pure functions over Yjs types. No DOM, no browser APIs.
 * Importable by both index.html and test files.
 */

import * as Y from 'yjs';

export const CURRENT_SCHEMA = 4;

// ── Shape operations ──────────────────────────────────────────────────────────

/**
 * Add a rect to the doc.
 * attrs: { id, x, y, width, height, fill, stroke, strokeWidth, opacity, author }
 */
export function addShape(ydoc, yTable, yShapeMeta, attrs) {
  const { id, x, y, width, height, fill, stroke, strokeWidth, opacity, author } = attrs;
  const el = new Y.XmlElement('rect');
  ydoc.transact(() => {
    el.setAttribute('id',           id);
    el.setAttribute('x',            String(x));
    el.setAttribute('y',            String(y));
    el.setAttribute('width',        String(width));
    el.setAttribute('height',       String(height));
    el.setAttribute('fill',         fill);
    el.setAttribute('stroke',       stroke);
    el.setAttribute('stroke-width', String(strokeWidth));
    el.setAttribute('opacity',      String(opacity));
    yTable.insert(yTable.length, [el]);
    yShapeMeta.set(id, { author, created: Date.now() });
  });
  return el;
}

/**
 * Delete a rect by id. Returns true if found and deleted.
 */
export function deleteShape(ydoc, yTable, yShapeMeta, id) {
  const idx = yTable.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yTable.delete(idx, 1);
    yShapeMeta.delete(id);
  });
  return true;
}

/**
 * Find a Y.XmlElement by id. Returns null if not found.
 */
export function findShape(yTable, id) {
  return yTable.toArray().find(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  ) ?? null;
}

/**
 * Return geometry for the selection overlay rect, with PAD applied.
 * All values are Numbers (attributes are strings in XmlElement).
 * Returns { x, y, width, height } or null if shape not found.
 */
export function selectionGeometry(yTable, shapeId, PAD = 3) {
  const el = findShape(yTable, shapeId);
  if (!el) return null;
  const attrs = el.getAttributes();
  return {
    x:      Number(attrs.x)      - PAD,
    y:      Number(attrs.y)      - PAD,
    width:  Number(attrs.width)  + PAD * 2,
    height: Number(attrs.height) + PAD * 2,
  };
}

/**
 * Iterate all XmlElement children of a fragment, newest-first by created timestamp.
 * Returns an array of { el, attrs, meta } plain objects.
 */
export function listShapes(yTable, yShapeMeta, { newestFirst = false } = {}) {
  const results = [];
  for (let node = yTable.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    const attrs = node.getAttributes();
    const meta  = yShapeMeta.get(attrs.id) ?? {};
    results.push({ el: node, attrs, meta });
  }
  if (newestFirst) results.sort((a, b) => (b.meta.created ?? 0) - (a.meta.created ?? 0));
  return results;
}

// ── Schema migrations ─────────────────────────────────────────────────────────

export const MIGRATIONS = {
  // v1: flat Y.Map('rects') of plain JS objects → v3 directly
  1: (ydoc, yMeta, yTable) => {
    const oldRects = ydoc.getMap('rects');
    const entries  = [];
    oldRects.forEach((shape, id) => entries.push([id, shape]));
    entries.sort((a, b) => (a[1].created || 0) - (b[1].created || 0));
    ydoc.transact(() => {
      entries.forEach(([, shape]) => {
        const yShape = new Y.Map();
        Object.entries(shape).forEach(([k, v]) => yShape.set(k, v));
        yTable.push([yShape]);
      });
      yMeta.set('schemaVersion', 3);
    });
    console.log(`[migration] v1→v3: migrated ${entries.length} shapes`);
  },
  // v2: Y.Array('order') of IDs + Y.Map('shapes') → Y.Array('shapes') of Y.Maps
  2: (ydoc, yMeta, yTable) => {
    const oldOrder  = ydoc.getArray('order');
    const oldShapes = ydoc.getMap('shapes');
    const ids = oldOrder.toArray();
    ydoc.transact(() => {
      ids.forEach(id => {
        const old = oldShapes.get(id);
        if (!old) return;
        const yShape = new Y.Map();
        old.forEach((v, k) => yShape.set(k, v));
        yTable.push([yShape]);
      });
      yMeta.set('schemaVersion', 3);
    });
    console.log(`[migration] v2→v3: migrated ${ids.length} shapes`);
  },
  // v3: Y.Array of Y.Maps → Y.XmlFragment of Y.XmlElements
  3: (ydoc, yMeta, yTable) => {
    const oldShapes = ydoc.getArray('shapes').toArray();
    ydoc.transact(() => {
      oldShapes.forEach(yMap => {
        const el = new Y.XmlElement('rect');
        yMap.forEach((v, k) => el.setAttribute(k, String(v)));
        yTable.insert(yTable.length, [el]);
      });
      yMeta.set('schemaVersion', 4);
    });
    console.log(`[migration] v3→v4: migrated ${oldShapes.length} shapes`);
  },
};

export function runMigrations(ydoc, yMeta, yTable) {
  let version = yMeta.get('schemaVersion') ?? 1;
  while (version < CURRENT_SCHEMA) {
    const migrate = MIGRATIONS[version];
    if (!migrate) { console.warn(`[migration] no migrator for v${version}`); break; }
    console.log(`[migration] running v${version}→v${version + 1}`);
    migrate(ydoc, yMeta, yTable);
    version++;
  }
}

// ── Doc setup ─────────────────────────────────────────────────────────────────

export function makeDoc() {
  const ydoc       = new Y.Doc();
  const yMeta      = ydoc.getMap('meta');
  const yTable     = ydoc.getXmlFragment('shapes');
  const yShapeMeta = ydoc.getMap('shapeMeta');
  return { ydoc, yMeta, yTable, yShapeMeta };
}
