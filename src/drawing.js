/**
 * core CRDT operations for togetherness
 *
 * The CRDT operations (addDrawing, deleteDrawing, findDrawing, SHAPE_TYPES) are pure
 * functions over Yjs types — no DOM, importable anywhere.
 *
 * The rendering helpers (_toSVGEl, getGeom, listDrawings) ARE DOM-coupled: they
 * mirror Yjs nodes into live SVG elements. They require a DOM (browser or jsdom).
 */

import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// ── BBox helpers (private) ────────────────────────────────────────────────────
function rectGetBBox(a)   { return { x: +a.x,         y: +a.y,         width: +a.width,  height: +a.height }; }
function circleGetBBox(a) { return { x: +a.cx - +a.r, y: +a.cy - +a.r, width: 2 * +a.r, height: 2 * +a.r }; }

// ── Shape-type registry ───────────────────────────────────────────────────────
// Each entry has:
//   tag     — SVG element name (also the Y.XmlElement nodeName)
//   label   — fn(attrs) → short text for the shape-list row
//   getBBox — fn(attrs) → {x,y,width,height}
//   schema  — full ttStateSchema for this type; values are defaults,
//             types entries carry `show` arrays to control which UI surfaces
//             render each field:
//               show absent / []          — never shown (geometry, internal ids)
//               show includes 'add'       — Tools panel
//               show includes 'edit'      — Edit panel
//               show includes 'addQuick'  — toolOpts popup
//
// Adding a shape type = adding one entry here (plus a button).
export const LAYER = 'drawing';

export const SHAPE_TYPES = {
  rect: {
    tag:     'rect',
    label:   a => `${a.width}×${a.height} @ ${a.x},${a.y}`,
    getBBox: rectGetBBox,
    iconUrl: 'drawing/rect.svg',
    // attrMap: schema key → actual SVG attribute name (where they differ)
    attrMap: { 'corner-r': 'rx' },
    schema: {
      label: 'Rectangle',
      values: {
        id: '', type: 'rect',
        x: 0, y: 0, width: 120, height: 80,
        fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 8,
      },
      types: {
        id:             { show: [] },
        type:           { show: [] },
        x:              { show: [] },
        y:              { show: [] },
        width:          { show: [] },
        height:         { show: [] },
        fill:           { kind: 'color-hslo',                          show: ['add', 'edit', 'addQuick'] },
        stroke:         { kind: 'color-hslo',                          show: ['edit'] },
        'stroke-width': { kind: 'number', min: 0, step: 0.5,          show: ['edit'] },
        'corner-r':     { kind: 'number', min: 0, max: 40, step: 2,   show: ['edit'] },
      },
    },
  },
  circle: {
    tag:     'circle',
    label:   a => `r${a.r} @ ${a.cx},${a.cy}`,
    getBBox: circleGetBBox,
    iconUrl: 'drawing/circle.svg',
    schema: {
      label: 'Circle',
      values: {
        id: '', type: 'circle',
        cx: 0, cy: 0, r: 46,
        fill: '#5a7ea8', stroke: 'none', 'stroke-width': 1.5,
      },
      types: {
        id:             { show: [] },
        type:           { show: [] },
        cx:             { show: [] },
        cy:             { show: [] },
        r:              { show: [] },
        fill:           { kind: 'color-hslo',                          show: ['add', 'edit', 'addQuick'] },
        stroke:         { kind: 'color-hslo',                          show: ['edit'] },
        'stroke-width': { kind: 'number', min: 0, step: 0.5,          show: ['edit'] },
      },
    },
  },
};

// ── Shape operations ──────────────────────────────────────────────────────────

/**
 * Add a drawing element to the doc.
 * attrs: { id, type, ...all schema keys }
 * `type` is required and must be a key of SHAPE_TYPES. All writable keys are
 * determined by the type's schema (everything except id/type).
 */
export function addDrawing(ydoc, yDrawing, attrs) {
  const { type } = attrs;
  if (!type) throw new Error('addDrawing: attrs.type is required');
  const def = SHAPE_TYPES[type];
  if (!def) throw new Error(`unknown shape type: ${type}`);

  const el = new Y.XmlElement(def.tag);
  const defaults = def.schema.values;
  const attrMap  = def.attrMap ?? {};
  ydoc.transact(() => {
    el.setAttribute('id', String(attrs.id));
    for (const k of Object.keys(def.schema.types)) {
      if (k === 'id' || k === 'type') continue;
      const v = attrs[k] ?? defaults[k];
      if (v != null) el.setAttribute(attrMap[k] ?? k, String(v));
    }
    yDrawing.insert(yDrawing.length, [el]);
  });
  return el;
}

/**
 * Delete a drawing element by id. Returns true if found and deleted.
 */
export function deleteDrawing(ydoc, yDrawing, id) {
  const idx = yDrawing.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yDrawing.delete(idx, 1);
  });
  return true;
}

/**
 * Find a Y.XmlElement by id. Returns null if not found.
 */
export function findDrawing(yDrawing, id) {
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
 * app.js needs: data-yid (the shape id), data-module="drawing", and a
 * plain SVG id="yid-{id}" so that overlay.js <use href="#yid-{id}"> can
 * reference the element for drag-ghost rendering without touching its geometry.
 */
export function _toSVGEl(yEl) {
  const el = mirror(yEl);
  if (el && el.setAttribute) {
    const id = yEl.getAttribute('id');
    el.setAttribute('id',              `yid-${id}`);
    el.setAttribute('data-yid',        id);
    el.setAttribute('data-module', 'drawing');
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
  for (const k of Object.keys(def.schema.types)) a[k] = svgEl.getAttribute(k);
  return def.getBBox(a);
}

/**
 * The "anchor" is the canvas-space point that tracks the pointer during a drag:
 *   rect   → top-left corner  { x, y }
 *   circle → centre           { x: cx, y: cy }
 *
 * canvas.js captures this on pointerdown, computes the pointer-to-anchor offset,
 * and passes (anchor + offset delta) back to applyMove on every pointermove.
 * Neither canvas.js nor app.js needs to know which attribute names are involved.
 */
export function getAnchor(svgEl) {
  const tag = svgEl?.tagName;
  if (tag === 'rect') {
    return {
      x: parseFloat(svgEl.getAttribute('x'))  || 0,
      y: parseFloat(svgEl.getAttribute('y'))  || 0,
    };
  }
  if (tag === 'circle') {
    return {
      x: parseFloat(svgEl.getAttribute('cx')) || 0,
      y: parseFloat(svgEl.getAttribute('cy')) || 0,
    };
  }
  // Fallback: top-left of bounding box
  const geom = getGeom(svgEl);
  return geom ? { x: geom.x, y: geom.y } : { x: 0, y: 0 };
}

/**
 * Commit a move to the Yjs doc in a single transaction.
 * Called once on pointerup.
 * All shape-type branching lives here; callers are type-agnostic.
 *
 * ydoc — Y.Doc
 * yEl  — Y.XmlElement (no-op if null/missing)
 * x, y — new anchor position in canvas-space (integers expected)
 */
export function applyMoveCommit(ydoc, yEl, x, y) {
  if (!yEl) return;
  const tag = yEl.nodeName;
  ydoc.transact(() => {
    if (tag === 'rect') {
      yEl.setAttribute('x', String(x));
      yEl.setAttribute('y', String(y));
    } else if (tag === 'circle') {
      yEl.setAttribute('cx', String(x));
      yEl.setAttribute('cy', String(y));
    }
  });
}

/**
 * Apply a move to a live DOM element only — no Yjs write.
 * Used for direct DOM manipulation outside the drag-ghost path (e.g. snap-back
 * on cancel when not using <use>-based ghosts). Type-branching lives here.
 *
 * domEl — live SVG DOM element (no-op if null)
 * x, y  — new anchor position in canvas-space
 */
export function applyMoveDom(domEl, x, y) {
  if (!domEl) return;
  const tag = domEl.tagName;
  if (tag === 'rect') {
    domEl.setAttribute('x', x);
    domEl.setAttribute('y', y);
  } else if (tag === 'circle') {
    domEl.setAttribute('cx', x);
    domEl.setAttribute('cy', y);
  }
}

/**
 * Iterate all XmlElement children in z-order (bottom to top).
 * Returns an array of { svgEl }; each svgEl is a rendered SVG element
 * with data-yid + data-module stamped.
 */
export function listDrawings(yDrawing) {
  const results = [];
  for (let node = yDrawing.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    results.push({ svgEl: _toSVGEl(node) });
  }
  return results;
}

/**
 * Summarise a rendered shape svgEl as a plain layer-object descriptor.
 */
function shapeData(svgEl) {
  const attrs = {};
  for (const at of svgEl.attributes) attrs[at.name] = at.value;
  const type = svgEl.localName;
  const def  = SHAPE_TYPES[type];
  return {
    id:    attrs['data-yid'],
    label: def ? def.label(attrs) : type,
    fill:  attrs.fill ?? '#888',
    kind:  type,
  };
}

/**
 * All drawing elements as layer-object descriptors, in z-order.
 * Used by app.js getLayerObjects — keeps drawing internals out of the app bus.
 */
export function drawingsData(yDrawing) {
  return listDrawings(yDrawing).map(({ svgEl }) => shapeData(svgEl));
}

// ── ttState / ttStateSchema ───────────────────────────────────────────────────

/**
 * Return the ttStateSchema for a drawing element (or defaults if no element given).
 * When called with an svgEl, values are read from live DOM attributes.
 * When called without an argument (or with a type string), returns schema defaults.
 *
 * The `types` object carries `show` arrays so each UI surface knows which fields
 * to render:
 *   show includes 'add'       → Tools panel
 *   show includes 'edit'      → Edit panel
 *   show includes 'addQuick'  → toolOpts popup
 *   show: []                  → not rendered anywhere (internal/geometry)
 */
export function getTtStateSchema(svgElOrType) {
  const type = typeof svgElOrType === 'string'
    ? svgElOrType
    : (svgElOrType?.getAttribute?.('data-type') ?? svgElOrType?.tagName ?? 'rect');
  const def = SHAPE_TYPES[type];
  if (!def) {
    // Unknown type (e.g. 'select', a toy/bounPos tool name) — not a drawing
    // type, so this module has no schema to offer. Let the caller fall
    // back to its own tool registry.
    if (typeof svgElOrType === 'string' || !svgElOrType) return null;
  }
  const shapeDef = def ?? SHAPE_TYPES.rect;
  const { schema } = shapeDef;
  const reverseMap = Object.fromEntries(Object.entries(shapeDef.attrMap ?? {}).map(([k, v]) => [v, k]));
  if (!svgElOrType || typeof svgElOrType === 'string') {
    const { id: _id, type: _type, ...rest } = schema.values;
    return { label: schema.label, ...rest, types: schema.types };
  }
  // Element present — read current values from DOM, mapping SVG attr names back to schema keys.
  const values = {};
  for (const k of Object.keys(schema.types)) {
    if (k === 'id' || k === 'type') continue;  // internal
    const svgAttr = (shapeDef.attrMap ?? {})[k] ?? k;
    values[k] = svgElOrType.getAttribute(svgAttr) ?? schema.values[k];
  }
  return { label: schema.label, ...values, types: schema.types };
}

/**
 * Snapshot the full serialisable state of a drawing Y.XmlElement.
 * Reads all schema keys from Yjs attributes (mapping SVG attr names to schema keys).
 */
export function getTtState(yEl) {
  if (!yEl) return null;
  const type = yEl.nodeName;
  const def  = SHAPE_TYPES[type];
  if (!def) return null;
  const attrs     = yEl.getAttributes();
  const reverseMap = Object.fromEntries(Object.entries(def.attrMap ?? {}).map(([k, v]) => [v, k]));
  const state = { type };
  for (const k of Object.keys(def.schema.types)) {
    const svgAttr = (def.attrMap ?? {})[k] ?? k;
    if (attrs[svgAttr] != null) state[k] = attrs[svgAttr];
    else if (attrs[k]   != null) state[k] = attrs[k];
  }
  return state;
}

/**
 * Write a ttState snapshot back into the Yjs drawing fragment.
 * Creates the element if it doesn't exist; updates it if it does.
 */
export function applyTtState(ydoc, yDrawing, state) {
  if (!state?.id || !state?.type) return;
  const existing = findDrawing(yDrawing, state.id);
  if (existing) {
    ydoc.transact(() => {
      for (const [k, v] of Object.entries(state)) {
        if (k === 'id' || k === 'type') continue;
        existing.setAttribute(k, String(v));
      }
    });
  } else {
    addDrawing(ydoc, yDrawing, state);
  }
}

/**
 * Apply an editData object to a drawing Yjs element.
 * Only keys present in editData are written; unknown keys are ignored.
 * Called by App.commitEdit
 */
export function edit(ydoc, yEl, editData) {
  if (!yEl) return;
  ydoc.transact(() => {
    for (const [k, v] of Object.entries(editData)) {
      yEl.setAttribute(k, String(v));
    }
  });
}
