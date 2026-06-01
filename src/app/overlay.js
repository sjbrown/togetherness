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
 */

const SVGNS = 'http://www.w3.org/2000/svg';
const HANDLE_SIZE = 12;  // px in canvas-space
const PAD = 6;           // selection ring padding

// ── SelectionMode ─────────────────────────────────────────────────────────────
// Map<shapeId, { kind, peerId?, color? }>
// overlay.js is the only writer (via setSelectionKind).
// App.js reads it to answer queries.
export const SelectionMode = new Map();

let App       = null;
let _layerEl  = null;   // #overlay-layer <g>

// ── Init ──────────────────────────────────────────────────────────────────────
export function init(appBus, svgElement) {
  App      = appBus;
  _layerEl = svgElement.querySelector('#overlay-layer') || svgElement.querySelector('#overlay');
}

// ── SelectionMode setters ─────────────────────────────────────────────────────
export function setLocalSelection(shapeId) {
  // Clear any previous local selection
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'local' || entry.kind === 'resize') SelectionMode.delete(id);
  }
  if (shapeId) SelectionMode.set(shapeId, { kind: 'local', color: App.getMyColor(), grad: App.getMyGradient() });
  render();
}

export function clearLocalSelection() {
  setLocalSelection(null);
}

// Called by App when awareness changes — rebuilds remote entries
export function syncFromAwareness(awarenessStates, myClientId) {
  // Remove stale remote entries
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'remote' || entry.kind === 'locked') SelectionMode.delete(id);
  }
  // Add current remote entries
  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    if (!state?.selection?.shapeId) return;
    const peerId = state.id ?? String(clientId);
    const grad = state.grad ?? 'default-remote-sel-grad';
    const { shapeId } = state.selection;
    SelectionMode.set(shapeId, {
      kind:   'remote',
      peerId: peerId,
      color:  state.color ?? '#888',
      grad:   grad,
    });
  });
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

  // Inject the local player's gradient once if any local selection is showing.
  const localEntry = [...SelectionMode.values()].find(
    e => (e.kind === 'local' || e.kind === 'resize') && e.grad
  );
  if (localEntry) {
    const defs = el('defs', {});
    const lg   = buildGradientDef(localEntry.grad, LOCAL_GRAD_ID);
    if (lg) { defs.appendChild(lg); _layerEl.appendChild(defs); }
  }

  for (const [shapeId, entry] of SelectionMode) {
    if (entry.kind === 'none') continue;
    const geo = App.getShapeBBox(shapeId);
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
}

function renderLocalSelection(geo, entry, scale) {
console.log(entry)
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
