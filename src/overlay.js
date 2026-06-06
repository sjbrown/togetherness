/**
 * overlay.js — crdt-svg overlay renderer
 *
 * Owns SelectionMode: the per-shape decoration map.
 * Renders into #overlay-layer SVG group.
 * Called by App after doc changes (renderDoc pipeline) and
 * after awareness changes (renderPresence pipeline).
 *
 * Depends on: App (bus). No ui.js imports. No canvas.js imports.
 *
 * SelectionMode kinds:
 *   'none'   — no decoration
 *   'local'  — solid border + resize handles (your selection)
 *   'remote' — dashed border + peer name label (awareness)
 *   'resize' — local + drag handles at edges (future)
 *   'locked' — remote peer is actively editing (future: lock icon)
 *
 * Drag ghost system:
 *   The native layer element is never touched during drag; but overlay renders:
 *     - a dim <use href="#yid-{id}" filter="url(#drag-placeholder-filter)">
 *       at the committed position (placeholder)
 *     - a ghost <use href="#yid-{id}" transform="translate(dx,dy)"> (flying copy)
 *     - a selection ring translated by around the ghost
 */

const SVGNS = 'http://www.w3.org/2000/svg';
const HANDLE_SIZE = 12;  // px in canvas-space
const PAD = 6;           // selection ring padding

// ── SelectionMode ─────────────────────────────────────────────────────────────
// Map<elId, { kind, peerId?, color? }>
// overlay.js is the only writer (via setSelectionKind).
// App.js reads it to answer queries.
export const SelectionMode = new Map();

// ── Drag ghost state ──────────────────────────────────────────────────────────
// Local drags — managed imperatively; elements survive render() calls.
// Map<elId, { placeholderEl, ghostEl, ringEl, dx, dy }>
const _dragGhosts = new Map();

// Remote drags — rebuilt from awareness on each syncFromAwareness() call.
// Map<elId, { peerId, bboxX, bboxY, color }>
const _remoteDrags = new Map();

let App       = null;
let _layerEl  = null;   // #overlay-layer <g>

// ── Init ──────────────────────────────────────────────────────────────────────
export function init(appBus, svgElement) {
  App      = appBus;
  _layerEl = svgElement.querySelector('#overlay-layer') || svgElement.querySelector('#overlay');
}

// ── SelectionMode setters ─────────────────────────────────────────────────────
export function setLocalSelection(elId) {
  // Clear any previous local selection
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'local' || entry.kind === 'resize') SelectionMode.delete(id);
  }
  if (elId) SelectionMode.set(elId, { kind: 'local', color: App.getMyColor(), grad: App.getMyGradient() });
  render();
}

export function clearLocalSelection() {
  setLocalSelection(null);
}

// Called by App when awareness changes — rebuilds remote selection + drag entries
export function syncFromAwareness(awarenessStates, myClientId) {
  // Remove stale remote entries
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'remote' || entry.kind === 'locked') SelectionMode.delete(id);
  }
  _remoteDrags.clear();

  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;

    // Remote selection ring
    if (state?.selection?.elId) {
      const peerId = state.id ?? String(clientId);
      const grad = state.grad ?? 'default-remote-sel-grad';
      const { elId } = state.selection;
      SelectionMode.set(elId, {
        kind:   'remote',
        peerId: peerId,
        color:  state.color ?? '#888',
        grad:   grad,
      });
    }

    // Remote drag ghost
    if (state?.drag?.elId) {
      const peerId = state.id ?? String(clientId);
      _remoteDrags.set(state.drag.elId, {
        peerId,
        bboxX: state.drag.bboxX,
        bboxY: state.drag.bboxY,
        color: state.color ?? '#888',
      });
    }
  });
  render();
}

/**
 * Begin a local drag. Creates:
 *   - a dim <use> placeholder at the committed position (z-bottom of overlay)
 *   - a ghost <use> + ring that will be translated by updateLocalDragGhost()
 * No-op if a ghost for this elId already exists.
 */
export function startDragPlaceholder(elId) {
  if (!_layerEl || _dragGhosts.has(elId)) return;

  const href = `#yid-${elId}`;

  // Dim copy at committed position — sits below everything in the overlay
  const placeholderEl = el('use', {});
  placeholderEl.setAttribute('href', href);
  placeholderEl.setAttribute('filter', 'url(#drag-placeholder-filter)');

  // Flying ghost — transform set by updateLocalDragGhost
  const ghostEl = el('use', { opacity: '0.85' });
  ghostEl.setAttribute('href', href);
  ghostEl.setAttribute('transform', 'translate(0, 0)');

  // Ring around the ghost — attributes set by _updateDragRing
  const ringEl = el('rect', {
    fill:   'none',
    class:  'drag-ring',
  });

  _dragGhosts.set(elId, { placeholderEl, ghostEl, ringEl, dx: 0, dy: 0 });
  render();
}

/**
 * Update the local drag ghost position.
 * (dx, dy) is the offset from the committed anchor in canvas-space.
 * Called on every pointermove during a drag.
 */
export function updateLocalDragGhost(elId, dx, dy) {
  const entry = _dragGhosts.get(elId);
  if (!entry || !_layerEl) return;
  entry.dx = dx;
  entry.dy = dy;
  entry.ghostEl.setAttribute('transform', `translate(${dx}, ${dy})`);
  _updateDragRing(entry, elId, App.getViewScale());
}

/**
 * End a local drag (commit or cancel). Removes all ghost elements and
 * triggers a render so selection rings reflect the new committed position.
 */
export function endDragPlaceholder(elId) {
  const entry = _dragGhosts.get(elId);
  if (!entry) return;
  entry.placeholderEl.remove();
  entry.ghostEl.remove();
  entry.ringEl.remove();
  _dragGhosts.delete(elId);
  render();
}

// ── Render ────────────────────────────────────────────────────────────────────
const LOCAL_GRAD_ID = 'local-sel-grad';

// Build an SVG <linearGradient> (objectBoundingBox) from an entityGradient.
// Returns the gradient element, or null if no gradient given. The CSS `grad`
// string can't be used as an SVG stroke, so we mirror its stops + angle here.
function buildGradientDef(grad, id) {
  if (!grad) return null;
  // Map the CSS angle (0°=up, 90°=right) to an objectBoundingBox vector.
  const rad = (grad.angle - 90) * Math.PI / 180;
  const lg = el('linearGradient', {
    id,
    x1: 0.5 - Math.cos(rad) / 2,
    y1: 0.5 - Math.sin(rad) / 2,
    x2: 0.5 + Math.cos(rad) / 2,
    y2: 0.5 + Math.sin(rad) / 2,
  });
  lg.appendChild(el('stop', { offset: '0',  'stop-color': grad.c1 }));
  lg.appendChild(el('stop', { offset: '1',  'stop-color': grad.c2 }));
  return lg;
}

export function render() {
  if (!_layerEl) return;
  _layerEl.innerHTML = '';

  const scale = App.getViewScale();

  // ── 1. Local grad defs (needed by selection rings and local drag ring) ─────
  const localGradEntry = [...SelectionMode.values()].find(
    e => (e.kind === 'local' || e.kind === 'resize') && e.grad
  );
  const localGrad = localGradEntry?.grad ?? (_dragGhosts.size > 0 ? App.getMyGradient() : null);
  if (localGrad) {
    const defs = el('defs', {});
    const lg   = buildGradientDef(localGrad, LOCAL_GRAD_ID);
    if (lg) { defs.appendChild(lg); _layerEl.appendChild(defs); }
  }

  // ── 2. Dim placeholders — z-bottom (local then remote) ────────────────────
  for (const entry of _dragGhosts.values()) {
    _layerEl.appendChild(entry.placeholderEl);
  }
  for (const [elId] of _remoteDrags) {
    const ph = el('use', {});
    ph.setAttribute('href',   `#yid-${elId}`);
    ph.setAttribute('filter', 'url(#drag-placeholder-filter)');
    _layerEl.appendChild(ph);
  }

  // ── 3. Selection rings (committed positions) ───────────────────────────────
  for (const [elId, entry] of SelectionMode) {
    if (entry.kind === 'none') continue;
    const geo = App.getBBox(elId);
    if (!geo) continue;
    switch (entry.kind) {
      case 'local':
        renderLocalSelection(geo, entry, scale);
        break;
      case 'remote':
      case 'locked':
        renderRemoteSelection(geo, entry, scale);
        break;
      case 'resize':
        renderLocalSelection(geo, entry, scale);
        renderResizeHandles(geo, scale);
        break;
    }
  }

  // ── 4. Remote drag ghosts + rings ─────────────────────────────────────────
  for (const [elId, drag] of _remoteDrags) {
    const bbox = App.getBBox(elId);
    if (!bbox) continue;
    const tdx = drag.bboxX - bbox.x; // relative to current committed
    const tdy = drag.bboxY - bbox.y;

    const ghostEl = el('use', { opacity: '0.85' });
    ghostEl.setAttribute('href', `#yid-${elId}`);
    ghostEl.setAttribute('transform', `translate(${tdx}, ${tdy})`);
    _layerEl.appendChild(ghostEl);

    renderRemoteSelection(
      { x: drag.bboxX, y: drag.bboxY, width: bbox.width, height: bbox.height },
      { color: drag.color, peerId: drag.peerId },
      scale,
    );
  }

  // ── 5. Local drag ghosts + rings — z-top ──────────────────────────────────
  for (const [elId, entry] of _dragGhosts) {
    _layerEl.appendChild(entry.ghostEl);
    _layerEl.appendChild(entry.ringEl);
    _updateDragRing(entry, elId, scale);
  }
}

// Refresh a local drag ring's geometry from the committed bbox + current dx/dy.
function _updateDragRing(entry, elId, scale) {
  const bbox = App.getBBox(elId);
  if (!bbox) return;
  const { dx, dy, ringEl } = entry;
  ringEl.setAttribute('x',                  bbox.x + dx - PAD);
  ringEl.setAttribute('y',                  bbox.y + dy - PAD);
  ringEl.setAttribute('width',              bbox.width  + PAD * 2);
  ringEl.setAttribute('height',             bbox.height + PAD * 2);
  ringEl.setAttribute('rx',                 4);
  ringEl.setAttribute('fill',               'none');
  ringEl.setAttribute('stroke',             `url(#${LOCAL_GRAD_ID})`);
  ringEl.setAttribute('stroke-width',       2 / scale);
  ringEl.setAttribute('stroke-dasharray',   `${6 / scale} ${3 / scale}`);
}

function renderLocalSelection(geo, entry, scale) {
  const { x, y, width, height } = geo;
  const stroke = `url(#${LOCAL_GRAD_ID})`;
  const ring = el('rect', {
    x:      x - PAD,
    y:      y - PAD,
    width:  width  + PAD * 2,
    height: height + PAD * 2,
    rx:     4,
    fill:           'none',
    stroke,
    'stroke-width': 2 / scale,
    class:          'selRing',
  });
  _layerEl.appendChild(ring);

}

function renderLocalResizeSelection(geo, entry, scale) {
  const { x, y, width, height } = geo;
  const stroke = entry.grad ? `url(#${LOCAL_GRAD_ID})` : (entry.color ?? 'var(--info)');
  const ring = el('rect', {
    x:      x - PAD,
    y:      y - PAD,
    width:  width  + PAD * 2,
    height: height + PAD * 2,
    rx:     10,
    fill:           'none',
    stroke,
    'stroke-width': 2 / scale,
    class:          'selRing',
  });
  _layerEl.appendChild(ring);

  // Corner handles
  const hw = HANDLE_SIZE / scale;
  const corners = [
    [x - PAD,          y - PAD],
    [x + width + PAD,  y - PAD],
    [x - PAD,          y + height + PAD],
    [x + width + PAD,  y + height + PAD],
  ];
  for (const [hx, hy] of corners) {
    _layerEl.appendChild(el('rect', {
      x: hx - hw / 2, y: hy - hw / 2,
      width: hw, height: hw, rx: 3 / scale,
      class: 'handle',
    }));
  }
}

function renderRemoteSelection(geo, entry, scale) {
  const { x, y, width, height } = geo;
  const ring = el('rect', {
    x:      x - PAD,
    y:      y - PAD,
    width:  width  + PAD * 2,
    height: height + PAD * 2,
    rx:     6,
    fill:           'none',
    stroke:         entry.color,
    'stroke-width': 1.5 / scale,
    'stroke-dasharray': `${4 / scale} ${3 / scale}`,
  });
  _layerEl.appendChild(ring);

  // Peer name label above the ring
  const name = (entry.peerId ?? '?').slice(0, 6);
  const lx   = x - PAD;
  const ly   = y - PAD - 4 / scale;
  const fs   = 9 / scale;
  const bgW  = name.length * 6.5 / scale + 8 / scale;
  const bgH  = 13 / scale;

  _layerEl.appendChild(el('rect', {
    x: lx, y: ly - bgH,
    width: bgW, height: bgH,
    fill: entry.color, rx: 2 / scale,
  }));

  const txt = document.createElementNS(SVGNS, 'text');
  txt.setAttribute('x',           lx + 4 / scale);
  txt.setAttribute('y',           ly - 2 / scale);
  txt.setAttribute('font-size',   fs);
  txt.setAttribute('font-family', 'ui-monospace, Menlo, monospace');
  txt.setAttribute('fill',        '#0c0c0f');
  txt.textContent = name;
  _layerEl.appendChild(txt);
}

function renderResizeHandles(geo, scale) {
  const { x, y, width, height } = geo;
  const hw = HANDLE_SIZE / scale;
  // Edge midpoints in addition to corners
  const pts = [
    [x + width / 2,  y - PAD],           // top
    [x + width / 2,  y + height + PAD],  // bottom
    [x - PAD,         y + height / 2],   // left
    [x + width + PAD, y + height / 2],   // right
  ];
  for (const [hx, hy] of pts) {
    _layerEl.appendChild(el('rect', {
      x: hx - hw / 2, y: hy - hw / 2,
      width: hw, height: hw, rx: 2 / scale,
      fill: 'var(--surface-solid)', stroke: 'var(--info)',
      'stroke-width': 1.5 / scale,
    }));
  }
}

// ── SVG element factory ───────────────────────────────────────────────────────
function el(tag, attrs) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}
