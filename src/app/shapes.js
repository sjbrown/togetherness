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
 * Add a shape to the doc.
 *
 * For tool='rect':   attrs must include { x, y, width, height }
 * For tool='circle': attrs must include { cx, cy, r }
 * Common attrs: { id, fill, stroke, strokeWidth, opacity, author }
 */
export function addShape(ydoc, yTable, yShapeMeta, attrs, tool = 'rect') {
  const { id, fill, stroke, strokeWidth, opacity, author } = attrs;
  const el = new Y.XmlElement(tool);
  ydoc.transact(() => {
    el.setAttribute('id',           id);
    el.setAttribute('fill',         fill);
    el.setAttribute('stroke',       stroke);
    el.setAttribute('stroke-width', String(strokeWidth));
    el.setAttribute('opacity',      String(opacity));

    if (tool === 'circle') {
      const { cx, cy, r } = attrs;
      el.setAttribute('cx', String(cx));
      el.setAttribute('cy', String(cy));
      el.setAttribute('r',  String(r));
    } else {
      const { x, y, width, height } = attrs;
      el.setAttribute('x',      String(x));
      el.setAttribute('y',      String(y));
      el.setAttribute('width',  String(width));
      el.setAttribute('height', String(height));
    }

    yTable.insert(yTable.length, [el]);
    yShapeMeta.set(id, { author, created: Date.now() });
  });
  return el;
}

/**
 * Delete a shape by id. Returns true if found and deleted.
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
 * Works for both rect and circle elements.
 * All values are Numbers. Returns { x, y, width, height } or null.
 */
export function selectionGeometry(yTable, shapeId, PAD = 3) {
  const el = findShape(yTable, shapeId);
  if (!el) return null;
  const attrs = el.getAttributes();

  if (el.nodeName === 'circle') {
    const cx = Number(attrs.cx);
    const cy = Number(attrs.cy);
    const r  = Number(attrs.r);
    return {
      x:      cx - r - PAD,
      y:      cy - r - PAD,
      width:  (r + PAD) * 2,
      height: (r + PAD) * 2,
    };
  }

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


// ── Doc setup ─────────────────────────────────────────────────────────────────

export function makeDoc() {
  const ydoc       = new Y.Doc();
  const yMeta      = ydoc.getMap('meta');
  const yTable     = ydoc.getXmlFragment('shapes');
  const yShapeMeta = ydoc.getMap('shapeMeta');
  return { ydoc, yMeta, yTable, yShapeMeta };
}
