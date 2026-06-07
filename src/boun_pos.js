/**
 * boun_pos.js — CRDT operations and DOM rendering for the Boundaries and Positions layer.
 *
 * A boundary is a named rectangular region stored as an SVG <path> in Yjs.
 * When visible, it renders as fill=none, stroke=white with a monospace name
 * label at the upper-right corner.
 *
 * ID format: tt-b-v1-XXXXX  where XXXXX is a random 5-char alphanumeric slug
 * that also serves as the initial display name.
 *
 * Path encoding: rect-shaped boundaries are stored as a closed path of the
 * form `M x,y L x+w,y L x+w,y+h L x,y+h Z`. This keeps the geometry
 * human-readable in SVG exports and leaves the door open for non-rectangular
 * boundaries later without changing the storage schema.
 */

import * as Y from 'yjs';

const SVG_NS   = 'http://www.w3.org/2000/svg';
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

// ── ID helpers ────────────────────────────────────────────────────────────────

function randomSlug(len = 5) {
  return Array.from({ length: len }, () =>
    ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)]
  ).join('');
}

/**
 * Generate a fresh boundary id and its initial display name.
 * Returns { id, name } where id = `tt-b-v1-${name}`.
 */
export function newBounPosId() {
  const name = randomSlug();
  return { id: `tt-b-v1-${name}`, name };
}

// ── Geometry helpers ──────────────────────────────────────────────────────────

/**
 * Encode a rectangle as a closed SVG path string.
 * All coordinates are integers; the caller should Math.round before passing.
 */
export function rectToPath(x, y, w, h) {
  const x2 = x + w, y2 = y + h;
  return `M${x},${y} L${x2},${y} L${x2},${y2} L${x},${y2} Z`;
}

/**
 * Parse a path produced by rectToPath back to { x, y, w, h }.
 * Only works on rect-shaped paths — no general SVG path parser.
 */
export function pathToRect(d) {
  const nums = (d.match(/[-\d.]+/g) ?? []).map(Number);
  // Coordinate sequence: [x, y,  x2, y,  x2, y2,  x, y2]
  //                        0  1   2   3   4   5    6  7
  const [x, y, x2, , , y2] = nums;
  return { x, y, w: x2 - x, h: y2 - y };
}

// ── CRDT operations ───────────────────────────────────────────────────────────

/**
 * Add a boundary to the CRDT doc.
 * attrs: { id, name, x, y, w, h, author }
 */
export function addBounPos(ydoc, yBounPos, yBounPosMeta, { id, name, x, y, w, h, author }) {
  const el = new Y.XmlElement('path');
  ydoc.transact(() => {
    el.setAttribute('id',   id);
    el.setAttribute('name', name);
    el.setAttribute('d',    rectToPath(x, y, w, h));
    yBounPos.insert(yBounPos.length, [el]);
    yBounPosMeta.set(id, { author, name, type: 'boundary', created: Date.now() });
  });
  return el;
}

/**
 * Delete a boundary by id. Returns true if found and deleted.
 */
export function deleteBounPos(ydoc, yBounPos, yBounPosMeta, id) {
  const idx = yBounPos.toArray().findIndex(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  );
  if (idx === -1) return false;
  ydoc.transact(() => {
    yBounPos.delete(idx, 1);
    yBounPosMeta.delete(id);
  });
  return true;
}

/**
 * Find a boundary Y.XmlElement by id. Returns null if not found.
 */
export function findBounPos(yBounPos, id) {
  return yBounPos.toArray().find(
    e => e instanceof Y.XmlElement && e.getAttribute('id') === id
  ) ?? null;
}

/**
 * Rename a boundary in both the element attribute and the meta map.
 */
export function renameBounPos(ydoc, yEl, yBounPosMeta, id, newName) {
  if (!yEl) return;
  ydoc.transact(() => {
    yEl.setAttribute('name', newName);
    const meta = yBounPosMeta.get(id) ?? {};
    yBounPosMeta.set(id, { ...meta, name: newName });
  });
}

/**
 * Commit a move to Yjs. x, y = new top-left corner of the boundary rect.
 */
export function applyMoveCommit(ydoc, yEl, x, y) {
  if (!yEl) return;
  const { w, h } = pathToRect(yEl.getAttribute('d') ?? 'M0,0 L0,0 L0,0 L0,0 Z');
  ydoc.transact(() => yEl.setAttribute('d', rectToPath(x, y, w, h)));
}

/**
 * Set all four dimensions of a boundary in one transaction.
 * Used by the Edit panel when the user changes position or size directly.
 */
export function setBounPosRect(ydoc, yEl, x, y, w, h) {
  if (!yEl) return;
  ydoc.transact(() => yEl.setAttribute('d', rectToPath(x, y, w, h)));
}

// ── DOM rendering ─────────────────────────────────────────────────────────────

/**
 * Mirror a boundary Y.XmlElement to a live SVG group:
 *
 *   <g data-yid="..." data-layer-type="boundaries-positions" id="yid-...">
 *     <path d="..." fill="none" stroke="white" stroke-width="2"/>
 *     <text data-boundary-name="..." font-family="monospace" ...>name</text>
 *   </g>
 *
 * The group carries data-yid so canvas.js hit-testing, overlay.js selection,
 * App.getAnchor, and App.getBBox all work transparently.
 */
export function _toSVGEl(yEl) {
  const id   = yEl.getAttribute('id')   ?? '';
  const d    = yEl.getAttribute('d')    ?? 'M0,0 L100,0 L100,100 L0,100 Z';
  const name = yEl.getAttribute('name') ?? id;
  const { x, y, w } = pathToRect(d);

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',              `yid-${id}`);
  g.setAttribute('data-yid',        id);
  g.setAttribute('data-layer-type', 'boundaries-positions');

  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d',            d);
  path.setAttribute('fill',         'none');
  path.setAttribute('stroke',       'white');
  path.setAttribute('stroke-width', '2');

  // Name label: monospace, at the upper-right corner of the boundary, above the line.
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('data-boundary-name', name);
  text.setAttribute('x',                  String(x + w));
  text.setAttribute('y',                  String(y - 5));
  text.setAttribute('text-anchor',        'end');
  text.setAttribute('font-family',        'ui-monospace, monospace');
  text.setAttribute('font-size',          '12');
  text.setAttribute('fill',              'white');
  text.textContent = name;

  g.appendChild(path);
  g.appendChild(text);
  return g;
}

// ── Geometry queries (used by App.getBBox and App.getAnchor) ──────────────────

/**
 * Bounding box for a rendered boundary `<g>` element.
 * Returns { x, y, width, height } (Numbers) or null. No PAD applied.
 */
export function getGeom(svgEl) {
  const path = svgEl?.querySelector?.('path') ?? (svgEl?.tagName === 'path' ? svgEl : null);
  if (!path) return null;
  const d = path.getAttribute('d');
  if (!d) return null;
  const { x, y, w, h } = pathToRect(d);
  return { x, y, width: w, height: h };
}

/**
 * Anchor point for drag — top-left corner of the boundary rect.
 */
export function getAnchor(svgEl) {
  const geom = getGeom(svgEl);
  return geom ? { x: geom.x, y: geom.y } : { x: 0, y: 0 };
}

// ── List + data helpers ───────────────────────────────────────────────────────

/**
 * Iterate all boundary XmlElement children.
 * Returns [{ svgEl, meta }] in insertion order.
 */
export function listBounPos(yBounPos, yBounPosMeta) {
  const results = [];
  for (let node = yBounPos.firstChild; node; node = node.nextSibling) {
    if (!(node instanceof Y.XmlElement)) continue;
    const id   = node.getAttribute('id');
    const meta = yBounPosMeta.get(id) ?? {};
    results.push({ svgEl: _toSVGEl(node), meta });
  }
  return results;
}

/**
 * All boundary elements as layer-object descriptors (for the layers panel).
 */
export function bounPosData(yBounPos, yBounPosMeta) {
  return listBounPos(yBounPos, yBounPosMeta).map(({ svgEl }) => ({
    id:    svgEl.dataset.yid,
    label: svgEl.querySelector('[data-boundary-name]')
                 ?.getAttribute('data-boundary-name') ?? svgEl.dataset.yid,
    fill:  'none',
    kind:  'boundary',
  }));
}

// ── Edit schema ───────────────────────────────────────────────────────────────

/**
 * Return the edit schema for a rendered boundary element.
 * The name is read from the `data-boundary-name` attribute on the
 * inner <text> element, which mirrors the Yjs `name` attribute.
 */
export function getEditSchema(svgEl) {
  const name = svgEl.querySelector('[data-boundary-name]')
                    ?.getAttribute('data-boundary-name') ?? '';
  return {
    name,
    types: {
      name: 'string',
    },
  };
}

/**
 * Apply an editData object to a boundary Yjs element.
 * Updates both the `name` attribute on the element and the yBounPosMeta sidecar.
 * Called by App.commitEdit — never called directly from the UI.
 */
export function edit(ydoc, yEl, yBounPosMeta, editData) {
  if (!yEl) return;
  const { name } = editData;
  if (name === undefined) return;
  const id = yEl.getAttribute('id');
  ydoc.transact(() => {
    yEl.setAttribute('name', String(name));
    if (id) {
      const meta = yBounPosMeta.get(id) ?? {};
      yBounPosMeta.set(id, { ...meta, name });
    }
  });
}
