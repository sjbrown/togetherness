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

export const SHAPE_TYPES = {
  rect: {
    tag:     'rect',
    label:   a => `${a.width}×${a.height} @ ${a.x},${a.y}`,
    getBBox: rectGetBBox,
    iconUrl: 'drawing/rect.svg',
    // attrMap: schema key → actual SVG attribute name (where they differ)
    // `rotate` maps to data-rotate rather than a bare `rotate` attribute:
    // SVG already gives `rotate` a different meaning on <text>, so a
    // data- name keeps the degree count unambiguously ours.
    attrMap: { 'corner-r': 'rx', rotate: 'data-rotate' },
    schema: {
      label: 'Rectangle',
      values: {
        id: '', type: 'rect',
        x: 0, y: 0, width: 120, height: 80, rotate: 0,
        fill: '#c8941e', stroke: 'none', 'stroke-width': 1.5, 'corner-r': 8,
      },
      types: {
        id:             { show: [] },
        type:           { show: [] },
        x:              { show: [] },
        y:              { show: [] },
        width:          { show: [] },
        height:         { show: [] },
        rotate:         { show: [] },
        fill:           { kind: 'color-hslo',                          show: ['add', 'edit', 'addQuick'] },
        stroke:         { kind: 'color-hslo',                          show: ['edit'] },
        'stroke-width': { kind: 'number', min: 0.5, max: 10, step: 0.5, show: ['edit'] },
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
        'stroke-width': { kind: 'number', min: 0.5, max: 10, step: 0.5, show: ['edit'] },
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
 * case are preserved. <script> nodes are never mirrored for live rendering —
 * pass { includeScripts: true } only for export.
 */
function mirror(yNode, opts = {}) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString());
  if (!(yNode instanceof Y.XmlElement)) return null;
  if (yNode.nodeName === 'script' && !opts.includeScripts) return null;
  const el = document.createElementNS(SVG_NS, yNode.nodeName);
  const attrs = yNode.getAttributes();
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k]);
    else                    el.setAttribute(k, attrs[k]);
  }
  yNode.toArray().forEach(child => {
    const dom = mirror(child, opts);
    if (dom) el.appendChild(dom);
  });
  return el;
}

/**
 * Render a shape Y.XmlElement to an SVG DOM element, stamped with the handles
 * app.js needs: data-id (the shape id), data-module="drawing", and a
 * plain SVG id="{id}" so that overlay.js <use href="#{id}"> can
 * reference the element for drag-ghost rendering without touching its geometry.
 */
export function _toSVGEl(yEl, opts = {}) {
  const el = mirror(yEl, opts);
  if (el && el.setAttribute) {
    const id = yEl.getAttribute('id');
    el.setAttribute('id',              id);
    el.setAttribute('data-id',         id);
    el.setAttribute('data-module', 'drawing');
    syncRotation(el);
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

// ── Rotation ─────────────────────────────────────────────────────────────────
// A shape stores its rotation as a plain degree count (schema key `rotate`,
// SVG attribute data-rotate) and never as a baked transform. The transform is
// derived — `rotate(deg cx cy)` about the shape's own centre — so a move or a
// resize re-pivots for free: everything that writes geometry calls
// syncRotation() afterwards and the pivot follows.
//
// getGeom() deliberately stays in the shape's UNROTATED local space. Callers
// that need screen/canvas-space geometry (hit-testing a handle, drawing a
// selection ring) rotate the point or the decoration themselves, using
// getRotation() — keeping one bbox definition instead of two.

// Default rotation step. Every function that snaps takes snapDeg as an
// argument defaulting to this, so a per-table or per-user increment can be
// threaded through without touching the geometry.
export const ROTATE_SNAP_DEG = 15;

const ROTATE_ATTR = 'data-rotate';

/** Degrees in [0, 360). */
export function normalizeAngle(deg) {
  const d = Number(deg) || 0;
  return ((d % 360) + 360) % 360;
}

/**
 * Snap deg to the nearest multiple of snapDeg. A snapDeg of 0 (or less)
 * means free rotation — the angle passes through unsnapped.
 */
export function snapAngle(deg, snapDeg = ROTATE_SNAP_DEG) {
  const step = Number(snapDeg);
  if (!(step > 0)) return normalizeAngle(deg);
  return normalizeAngle(Math.round(Number(deg) / step) * step);
}

/** A rendered shape's rotation in degrees (0 when it has none). */
export function getRotation(svgEl) {
  return parseFloat(svgEl?.getAttribute?.(ROTATE_ATTR)) || 0;
}

/** The point a shape rotates about — the centre of its unrotated bbox. */
export function rotationCenter(geom) {
  return geom
    ? { cx: geom.x + geom.width / 2, cy: geom.y + geom.height / 2 }
    : { cx: 0, cy: 0 };
}

/**
 * Project a shape's stored rotation onto its live DOM element as a
 * transform. Called after every geometry write so the pivot tracks the
 * shape rather than the position it had when the rotation was set.
 */
export function syncRotation(domEl) {
  if (!domEl?.setAttribute) return;
  // No data-rotate means this shape's transform isn't ours — a hand-authored
  // or imported SVG can carry its own, and rewriting it would silently
  // throw the author's geometry away.
  if (!domEl.hasAttribute?.(ROTATE_ATTR)) return;
  const deg = getRotation(domEl);
  if (!deg) {
    domEl.removeAttribute('transform');
    return;
  }
  const { cx, cy } = rotationCenter(getGeom(domEl));
  domEl.setAttribute('transform', `rotate(${deg} ${cx} ${cy})`);
}

/**
 * Pure geometry for a corner-drag rotation: the angle from the shape's
 * centre out to the pointer, less the angle out to the corner that was
 * grabbed, so that corner stays under the pointer. Snapped to snapDeg.
 *
 * The result is absolute, not a delta — the rotation the shape had when
 * the drag began is already implied by where the grabbed corner started.
 *
 * corner is a RESIZE_CORNER_* index (0=NW/1=NE/2=SE/3=SW). px/py are
 * canvas-space. The corner angle is taken from the unpadded bbox corner,
 * which is a fraction of a degree off the padded handle overlay.js draws;
 * snapping absorbs it.
 */
export function computeRotate(startRect, corner, px, py, snapDeg = ROTATE_SNAP_DEG) {
  const { x, y, width, height } = startRect;
  const { cx, cy } = rotationCenter(startRect);
  const corners = [
    { x: x,         y: y },          // NW
    { x: x + width, y: y },          // NE
    { x: x + width, y: y + height }, // SE
    { x: x,         y: y + height }, // SW
  ];
  const grab = corners[corner] ?? corners[2];
  const grabAngle = Math.atan2(grab.y - cy, grab.x - cx);
  const nowAngle  = Math.atan2(py - cy, px - cx);
  return snapAngle((nowAngle - grabAngle) * 180 / Math.PI, snapDeg);
}

/**
 * Commit a rotation to the Yjs doc in a single transaction — the rotate
 * counterpart of applyResize. Shapes whose schema has no `rotate` key
 * (circles, where it would be invisible anyway) are a no-op.
 */
export function applyRotate(ydoc, yEl, deg) {
  if (!yEl) return;
  if (!SHAPE_TYPES[yEl.nodeName]?.schema.types.rotate) return;
  ydoc.transact(() => {
    yEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(deg)));
  });
}

/**
 * Drop the transform an export baked in from a shape's `rotate` — the
 * document keeps degrees, not matrices, and the transform is re-derived on
 * every render, so storing the exported copy too would leave two answers to
 * the same question with one of them going stale on the next move. Called
 * by storage.js on import. A transform on a shape carrying no `rotate` is
 * the author's own and is left in place.
 */
export function stripDerivedTransform(yEl) {
  if (yEl?.getAttribute?.(ROTATE_ATTR) == null) return;
  if (yEl.getAttribute('transform') != null) yEl.removeAttribute('transform');
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
 * Every mode svgEl can be in, in cycle order, fully `sel-`-prefixed.
 * 'sel-move' is the default every shape shows with no click; rects/
 * circles each add their one resize-family mode after it.
 */
export function selectModes(svgEl) {
  const tag = svgEl?.tagName;
  if (tag === 'rect')   return ['sel-move', 'sel-resize', 'sel-rotate'];
  if (tag === 'circle') return ['sel-move', 'sel-resize-r'];
  return ['sel-move'];
}

/**
 * The next mode svgEl should show, given the mode it's currently in
 * (pass null for "nothing yet, what should this show automatically").
 */
export function nextSelectMode(svgEl, currentMode) {
  const cycle = selectModes(svgEl);
  const i = cycle.indexOf(currentMode);
  return cycle[(i + 1) % cycle.length];
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

const MIN_CIRCLE_R = 15  // never let a radius-drag shrink a circle below this
const MAX_CIRCLE_R = 2000 // generous sanity cap

function clampCircleR(r) {
  return Math.min(MAX_CIRCLE_R, Math.max(MIN_CIRCLE_R, r))
}

/**
 * Pure geometry for the single-handle radius drag: given the circle's bbox
 * at drag start and the current pointer position (px, py), compute the new
 * bbox with the SAME centre and a radius equal to the pointer's distance
 * from that centre (clamped to MIN_CIRCLE_R/MAX_CIRCLE_R). Returned in the
 * same {x, y, width, height} bbox shape applyResize/updateResizeGhost
 * already expect, so the rest of the resize pipeline (shared with rects'
 * corner-drag) doesn't need to know shapes differ.
 */
export function computeResizeRadiusRect(startRect, px, py) {
  const cx = startRect.x + startRect.width  / 2;
  const cy = startRect.y + startRect.height / 2;
  const r  = clampCircleR(Math.hypot(px - cx, py - cy));
  return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
}

const MIN_RECT_RESIZE_SIZE = 30 // never let a corner-drag shrink a rect below this

/**
 * Pure geometry for a rect's corner-drag resize: given the rect at drag
 * start and the corner being dragged (0=NW/1=NE/2=SE/3=SW), compute the
 * new bbox for pointer (px, py), keeping the opposite corner fixed.
 */
function computeResizeCornerRect(startRect, corner, px, py) {
  const { x, y, width, height } = startRect;
  const left = x, top = y, right = x + width, bottom = y + height;

  switch (corner) {
    case 0: { // NW
      const newLeft = Math.min(px, right - MIN_RECT_RESIZE_SIZE);
      const newTop  = Math.min(py, bottom - MIN_RECT_RESIZE_SIZE);
      return { x: newLeft, y: newTop, width: right - newLeft, height: bottom - newTop };
    }
    case 1: { // NE
      const newTop = Math.min(py, bottom - MIN_RECT_RESIZE_SIZE);
      return { x: left, y: newTop, width: Math.max(px - left, MIN_RECT_RESIZE_SIZE), height: bottom - newTop };
    }
    case 3: { // SW
      const newLeft = Math.min(px, right - MIN_RECT_RESIZE_SIZE);
      return { x: newLeft, y: top, width: right - newLeft, height: Math.max(py - top, MIN_RECT_RESIZE_SIZE) };
    }
    case 2: // SE
    default: {
      return { x: left, y: top, width: Math.max(px - left, MIN_RECT_RESIZE_SIZE), height: Math.max(py - top, MIN_RECT_RESIZE_SIZE) };
    }
  }
}

// Which resize math a live drag/commit needs, by mode
export function computeResize(mode, startRect, corner, px, py) {
  return mode === 'sel-resize-r'
    ? computeResizeRadiusRect(startRect, px, py)
    : computeResizeCornerRect(startRect, corner, px, py);
}

/**
 * Commit a resize to the Yjs doc in a single transaction. rect and circle —
 * mirrors applyMoveCommit's shape (type-branching lives here, callers are
 * type-agnostic). x, y, width, height are the new bbox in canvas-space
 * (for circle, computeResizeRadiusRect's centre-preserving bbox).
 */
export function applyResize(ydoc, yEl, x, y, width, height) {
  if (!yEl) return;
  const tag = yEl.nodeName;
  ydoc.transact(() => {
    if (tag === 'rect') {
      yEl.setAttribute('x',      String(Math.round(x)));
      yEl.setAttribute('y',      String(Math.round(y)));
      yEl.setAttribute('width',  String(Math.round(width)));
      yEl.setAttribute('height', String(Math.round(height)));
    } else if (tag === 'circle') {
      const r = width / 2;
      yEl.setAttribute('cx', String(Math.round(x + r)));
      yEl.setAttribute('cy', String(Math.round(y + r)));
      yEl.setAttribute('r',  String(Math.round(r)));
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
  syncRotation(domEl);
}

/**
 * Iterate all XmlElement children in z-order (bottom to top).
 * Returns an array of rendered SVG elements, each stamped with
 * data-id + data-module.
 */
export function listDrawings(yDrawing, opts = {}) {
  const results = [];
  for (let node = yDrawing.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    results.push(_toSVGEl(node, opts));
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
    id:    attrs['data-id'],
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
  return listDrawings(yDrawing).map(shapeData);
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

/**
 * Apply a live resize to a detached ghost clone — DOM only, no Yjs write.
 * Mirrors boun_pos.js's previewResize so overlay.js can hand any layer's
 * ghost the same (x, y, width, height) without knowing how each shape
 * stores its geometry. (x, y, width, height) is the bbox form
 * computeResize returns; for a circle that's the centre-preserving bbox.
 */
export function previewResize(ghostEl, x, y, width, height) {
  const tag = ghostEl?.tagName;
  if (tag === 'rect') {
    ghostEl.setAttribute('x',      x);
    ghostEl.setAttribute('y',      y);
    ghostEl.setAttribute('width',  width);
    ghostEl.setAttribute('height', height);
  } else if (tag === 'circle') {
    const r = width / 2;
    ghostEl.setAttribute('cx', x + r);
    ghostEl.setAttribute('cy', y + r);
    ghostEl.setAttribute('r',  r);
  } else {
    return;
  }
  syncRotation(ghostEl);
}

/**
 * Apply a live rotation to a detached ghost clone — DOM only, no Yjs write.
 * The counterpart of previewResize for the rotate gesture.
 */
export function previewRotate(ghostEl, deg) {
  if (!ghostEl?.setAttribute) return;
  ghostEl.setAttribute(ROTATE_ATTR, String(normalizeAngle(deg)));
  syncRotation(ghostEl);
}

export function previewEdit(ghostEl, editData) {
  const attrMap = SHAPE_TYPES[ghostEl.tagName]?.attrMap ?? {};
  for (const [key, value] of Object.entries(editData)) {
    ghostEl.setAttribute(attrMap[key] ?? key, value);
  }
}

/**
 * Render the drawing layer: clear layerEl, then mirror every drawing element
 * as a live SVG node with the layer's interaction cursor applied.
 */
export function render(yDrawing, layerEl) {
  layerEl.innerHTML = '';
  listDrawings(yDrawing).forEach(svgEl => {
    svgEl.style.cursor = 'pointer';
    layerEl.appendChild(svgEl);
  });
}

/**
 * makeLayerAPI — returns the canonical LayerAPI for the drawing layer,
 * closing over (ydoc, yDrawing) so app.js can dispatch by layer type
 * without re-passing the fragment on every call.
 */
export function makeLayerAPI(ydoc, yDrawing) {
  return {
    find:            (id)            => findDrawing(yDrawing, id),
    delete:          (id)            => deleteDrawing(ydoc, yDrawing, id),
    getGeom,
    getAnchor,
    getTtState,
    getTtStateSchema,
    selectModes,
    nextSelectMode,
    computeResize,
    getRotation,
    computeRotate,
    previewResize,
    previewRotate,
    applyMoveCommit: (yEl, x, y)     => applyMoveCommit(ydoc, yEl, x, y),
    applyResize:     (yEl, x, y, w, h) => applyResize(ydoc, yEl, x, y, w, h),
    applyRotate:     (yEl, deg)      => applyRotate(ydoc, yEl, deg),
    applyTtState:    (state)         => applyTtState(ydoc, yDrawing, state),
    edit:            (yEl, editData) => edit(ydoc, yEl, editData),
    previewEdit,
    listData:        ()              => drawingsData(yDrawing),
    render:          (layerEl)       => render(yDrawing, layerEl),
  };
}
