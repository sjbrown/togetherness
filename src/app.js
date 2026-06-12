/**
 * app.js — togetherness application bus
 *
 * The only module that imports from all others. Owns no mode directly;
 * instead it wires the four layers together through a narrow, typed interface.
 *
 * Roles:
 *   - Initialise all modules and inject this bus object as their sole dependency
 *   - Translate canvas events → CRDT writes
 *   - Translate CRDT/awareness changes → render calls
 *   - Answer read queries from ui.js and overlay.js
 *   - Maintain the undo stack (since it spans canvas + drawing layer)
 *
 * Import order:  icons → drawing → overlay → canvas → ui → app
 *
 * Usage in index.html:
 *   <script type="module">
 *     import { boot } from '/app.js';
 *     boot(...)
 *   </script>
 */

import { initIcons }                              from './icons.js';
import { SHAPE_TYPES, LAYER as DRAW_LAYER,
         addDrawing, deleteDrawing,
         findDrawing, listDrawings, drawingsData,
         getGeom as drawingGeom,
         getAnchor as drawingAnchor,
         applyMoveCommit as drawingApplyMoveCommit,
         getTtStateSchema as drawingGetTtStateSchema,
         getTtState as drawingGetTtState,
         applyTtState as drawingApplyTtState,
         edit as drawingEdit } from './drawing.js';
import { TOOLS as TOY_TOOLS,
         TOY_TYPES, addToy, deleteToy, findToy,
         listToys, toysData,
         getGeom as toyGeom,
         getAnchor as toyAnchor,
         applyMoveCommit as toyApplyMoveCommit,
         getTtStateSchema as toyGetTtStateSchema,
         getTtState as toyGetTtState,
         applyTtState as toyApplyTtState,
         edit as toyEdit,
       }  from './toys.js';
import { SELECT_TOOL }                            from './tools-schema.js';
import { BOUNPOS_TYPES, LAYER as BOUNPOS_LAYER,
         addPositionSet, createPositionSetElement,
         rectToPath, pathToRect,
         findEl          as bounPosFindEl,
         deleteEl        as bounPosDeleteEl,
         applyMoveCommit as bounPosApplyMoveCommit,
         renderLayer     as bounPosRenderLayer,
         layerData       as bounPosLayerData,
         metaFor         as bounPosMetaFor,
         getGeom         as bounPosGeom,
         getAnchor       as bounPosAnchor,
         getTtStateSchema as bounPosGetTtStateSchema,
         getTtState       as bounPosGetTtState,
         applyTtState     as bounPosApplyTtState,
         editBounPos      as bounPosEdit,
         computeBoundaryRects,
         computePositionSnapPoints,
         computeMaxSnapRadius,
         gridFillExtent,
       } from './boun_pos.js';
import * as UI                                    from './ui.js';
import * as Canvas                                from './canvas.js';
import * as Overlay                               from './overlay.js';
import { entityGradient }            from './entity_gradient.js';


import * as Y from 'yjs';

const svgNS = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const DEFAULT_BACKGROUNDS = [
  { label: 'Slate Hex',   url: 'img/bg_slatehex.png',  width: 1384, height: 998 },
  { label: 'Beige Hex',   url: 'img/bg_beigehex.png',  width: 815,  height: 718 },
  { label: 'Green Felt',  url: 'img/bg_greenfelt.png', width: 800,  height: 600 },
  { label: 'Iron Grid',   url: 'img/bg_irongrid.png',  width: 438,  height: 285 },
];


// ── Internal app state ────────────────────────────────────────────────────────
let _ydoc, _yMeta, _yToys, _yToyMeta, _yDrawing, _yDrawingMeta,
    _yBounPos, _yBounPosMeta,
    _awareness, _provider;

// Per-layer visibility (local state, not synced).
const _layerVisibility = {
  'background':           true,
  'boundaries-positions': false,
  'toys':                 true,
  'drawing':              true,
};
let _myId, _myGrad, _roomId;
let _svgEl;
let _selectedId   = null;
let _activeLayer  = 'toys';
let _activeTool   = 'select';
let _offline      = false;
let _undoStack    = [];      // { op:'add'|'del'|'move', layer:'drawing'|'toy', id, ... }
let _historyLog   = [];      // { label } — human-readable, newest first

// Active drag — set by App.startDrag, cleared by commitMove / cancelMove.
// Awareness state: drag: { elId, dx, dy }
// local awareness schema: { id, color, grad, cursor, selection, drag? }
let _dragState    = null;    // { id, startX, startY, startBboxX, startBboxY,
                              //   boundsRects: [{x,y,w,h}]|null, lastValidX, lastValidY,
                              //   snapPoints: [{cx,cy,snapRadius}] } | null

// ── Tool registry ──────────────────────────────────────────────────────────────
// Built from the layer registries + the universal Select tool.
// _toolsByLayer: layer → ToolDef[] (Select first)
// _toolById:     name  → ToolDef
// _toolParams:   name  → live params object (seeded from def.defaults)
const _toolsByLayer = {};
const _toolById     = {};
const _toolParams   = {};
const _layerMeta = [
  { id: 'background',            label: 'Background',             iconId: 'layer-bg' },
  { id: 'boundaries-positions',  label: 'Boundaries and Positions', iconId: 'layer-bounpos' },
  { id: 'toys',                  label: 'Toys',                   iconId: 'layer-toys' },
  { id: DRAW_LAYER,              label: 'Drawing',                iconId: 'layer-draw' },
];

function buildToolRegistry() {
  const register = (def) => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...(def.defaults ?? {}) };
  };
  register(SELECT_TOOL);
  // background layer: select only
  _toolsByLayer['background'] = [SELECT_TOOL];
  // boundaries-positions layer
  // boundaries-positions layer — tool defs derived from BOUNPOS_TYPES
  const bounPosTools = Object.entries(BOUNPOS_TYPES).map(([name, def]) => ({
    name,
    label:   def.label,
    layer:   BOUNPOS_LAYER,
    iconUrl: def.iconUrl,
  }));
  bounPosTools.forEach(def => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...BOUNPOS_TYPES[def.name].schema.values };
  });
  _toolsByLayer[BOUNPOS_LAYER] = [SELECT_TOOL, ...bounPosTools];
  // toys layer
  TOY_TOOLS.forEach(register);
  _toolsByLayer['toys'] = [SELECT_TOOL, ...TOY_TOOLS];
  // drawing layer — tool defs derived from SHAPE_TYPES; params seeded from schema defaults
  const drawTools = Object.entries(SHAPE_TYPES).map(([name, def]) => ({
    name,
    label:   def.schema.label,
    layer:   DRAW_LAYER,
    iconUrl: def.iconUrl,
  }));
  drawTools.forEach(def => {
    _toolById[def.name] = def;
    const schema = drawingGetTtStateSchema(def.name);
    _toolParams[def.name] = { ...schema };
  });
  _toolsByLayer[DRAW_LAYER] = [SELECT_TOOL, ...drawTools];
}

// Presentation palette — matches ui.css --primary accent family
const PALETTE = ['#c8941e','#5a7ea8','#8a5ea8','#5ea88a','#a85e5e','#a8905e','#5e8aa8'];

export function makeDoc() {
  const ydoc          = new Y.Doc();
  const yToys         = ydoc.getXmlFragment('toys');
  const yToyMeta      = ydoc.getMap('toyMeta');
  const yDrawing      = ydoc.getXmlFragment('drawing');
  const yDrawingMeta  = ydoc.getMap('drawingMeta');
  const yBounPos      = ydoc.getXmlFragment('boundaries');
  const yBounPosMeta  = ydoc.getMap('boundaryMeta');
  const yMeta         = ydoc.getMap('meta');
  return { ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta, yBounPos, yBounPosMeta };
}

// ── Boot ──────────────────────────────────────────────────────────────────────
export function boot({ ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta, yBounPos, yBounPosMeta, awareness, provider, myId, myGrad, roomId, svgElement, displayName }) {
  _ydoc           = ydoc;
  _yMeta          = yMeta;
  _yToys          = yToys;
  _yToyMeta       = yToyMeta;
  _yDrawing       = yDrawing;
  _yDrawingMeta   = yDrawingMeta;
  _yBounPos       = yBounPos;
  _yBounPosMeta   = yBounPosMeta;
  _awareness  = awareness;
  _provider   = provider;
  _myId       = myId;
  _myGrad    = myGrad;
  _roomId     = roomId;
  _svgEl      = svgElement ?? document.querySelector('#stage svg') ?? document.getElementById('canvas');

  // 1. Icons — stamp symbols into DOM before anyone builds HTML
  initIcons();

  // 1b. Tool registry — assemble layer tool palettes from registries
  buildToolRegistry();

  // 2. Overlay — needs App + SVG element
  Overlay.init(App, _svgEl);

  // 3. Canvas — needs App + SVG element; attaches pointer listeners
  Canvas.init(App, _svgEl);

  // 4. UI — needs App; attaches panel/menu/pill listeners
  UI.init(App);
  UI.setIdentity({ projectName: 'togetherness', userId: `me · ${displayName}`, roomId });

  // 5. Keyboard shortcuts
  window.addEventListener('keydown', onKeyDown);

  // 6. CRDT observers
  // Both layers use observeDeep so attribute changes (moves via applyMoveCommit)
  // trigger renderDoc on every client — shallow observe only fires for
  // insert/delete on the fragment itself, missing setAttribute on children.
  _yToys.observeDeep(onToysChanged);
  _yDrawing.observeDeep(onDrawingChanged);
  _yBounPos.observeDeep(onBounPosChanged);
  _yToys.observe(onDocChanged);
  _yDrawing.observe(onDocChanged);
  _yBounPos.observe(onDocChanged);
  _yMeta.observe(onMetaChanged);
  _awareness.on('change', onPresenceChanged);

  // 7. Provider status
  const dot = document.getElementById('statusDot');
  _provider.on('synced', () => {
    if (dot) dot.className = 'status-dot connected';
    UI.toast('Synced with peers');
    App.addLog('synced with peers', 'remote');
  });
  _provider.on('status', ({ connected }) => {
    if (dot) dot.className = connected ? 'status-dot connected' : 'status-dot connecting';
    // Cancel any in-progress drag on disconnect — doc stays at committed position.
    if (!connected && _dragState) App.cancelMove();
  });

  // 8. Initial render
  renderDoc();
  renderPresence();
}

// ── Render pipelines ──────────────────────────────────────────────────────────
/**
 * Extract toy class names from the toy's wrapper <g> and inner <svg>.
 * Returns a Set (empty if the toy has no classes).
 */
function getToyClasses(domEl) {
  return new Set([
    ...domEl.classList,
    ...(domEl.querySelector('svg')?.classList ?? []),
  ]);
}

/**
 * Find the nearest snap point within its snap radius.
 * Returns {cx, cy} or null if nothing is within reach.
 * Uses squared-distance comparison to avoid sqrt.
 */
function findNearestSnap(x, y, snapPoints) {
  let best = null, bestD2 = Infinity;
  for (const { cx, cy, snapRadius } of snapPoints) {
    const d2 = (x - cx) ** 2 + (y - cy) ** 2;
    if (d2 < snapRadius ** 2 && d2 < bestD2) { best = { cx, cy }; bestD2 = d2; }
  }
  return best;
}

function renderDoc() {
  renderBackgroundLayer();
  renderBounPosLayer();
  renderToysLayer();
  renderDrawingLayer();
  applyLayerVisibility();
  updatePeerCount();
  Overlay.render();          // doc geometry may have changed under selections
}

function renderPresence() {
  Overlay.syncFromAwareness(_awareness.getStates(), _awareness.clientID);
  updatePeerCount();
}

// Each layer id maps to a group element id via the convention: `${id}-layer`.
// e.g. 'toys' → '#toys-layer', 'boundaries-positions' → '#boundaries-positions-layer'.
function applyLayerVisibility() {
  for (const l of _layerMeta) {
    const el = _svgEl?.querySelector(`#${l.id}-layer`);
    if (!el) continue;
    const visible = _layerVisibility[l.id] ?? true;
    el.setAttribute('visibility',     visible ? 'visible' : 'hidden');
    el.setAttribute('pointer-events', visible ? 'auto'    : 'none');
  }
}

function renderBounPosLayer() {
  const layer = _svgEl.querySelector('#boundaries-positions-layer');
  if (!layer) return;
  bounPosRenderLayer(_yBounPos, _yBounPosMeta, layer);
  Canvas.wireShapeClicks(layer);
}

// Toys layer — mirror each <g> wrapper (and its embedded <svg> sub-document).
// mousedown selects the toy and begins a drag (toys mode only — the layer's
// pointer-events are gated by setMode). Movement is applied to the DOM live and
// committed to the CRDT on drop (see the window mouseup handler).
function renderToysLayer() {
  const layer = _svgEl.querySelector('#toys-layer');
  if (!layer) return;
  layer.innerHTML = '';

  listToys(_yToys, _yToyMeta).forEach(({ svgEl, meta }) => {
    // Stamp color so toys.getTtStateSchema(svgEl) can read it without meta access.
    if (meta?.color) svgEl.dataset.toyColor = meta.color;
    svgEl.style.cursor = 'grab';
    layer.appendChild(svgEl);
  });

  Canvas.wireShapeClicks(layer);

  const countEl = document.getElementById('toyCount');
  if (countEl) countEl.textContent = _yToys.length;
}

function renderDrawingLayer() {
  const layer = _svgEl.querySelector('#drawing-layer');
  if (!layer) return;
  layer.innerHTML = '';

  listDrawings(_yDrawing, _yDrawingMeta, { newestFirst: false }).forEach(({ svgEl }) => {
    svgEl.style.cursor = 'pointer';
    layer.appendChild(svgEl);
  });

  Canvas.wireShapeClicks(layer);

  const countEl = document.getElementById('drawingCount');
  if (countEl) countEl.textContent = _yDrawing.length;
  renderDrawingList();
}

function renderDrawingList() {
  const list = document.getElementById('drawingList');
  if (!list) return;
  list.innerHTML = '';
  listDrawings(_yDrawing, _yDrawingMeta, { newestFirst: true }).forEach(({ svgEl, drawingMeta }) => {
    const id     = svgEl.getAttribute('data-yid');
    const attrs  = {};
    for (const at of svgEl.attributes) attrs[at.name] = at.value;
    const def    = drawingGetTtStateSchema(drawingMeta?.type ?? svgEl.getAttribute('data-type') ?? 'rect');
    const item   = document.createElement('div');
    const author = drawingMeta?.author;
    item.className  = 'drawing-item' + (_selectedId === id ? ' selected' : '');
    item.dataset.id = id;
    const sw = document.createElement('div');
    sw.className        = 'drawing-swatch';
    sw.style.background = attrs.fill;
    const lbl = document.createElement('div');
    lbl.className   = 'drawing-label';
    lbl.textContent = def.label;
    const own = document.createElement('div');
    own.className   = 'drawing-owner';
    own.textContent = author === _myId ? 'me' : (author?.slice(0, 5) ?? '?');
    own.style.color = author === _myId ? 'var(--primary)' : 'var(--text-3)';
    const del = document.createElement('button');
    del.className   = 'drawing-del';
    del.textContent = '×';
    del.addEventListener('click', ev => { ev.stopPropagation(); App.deleteElement(svgEl); });
    item.append(sw, lbl, own, del);
    item.addEventListener('click', () => App.select(id));
    list.appendChild(item);
  });
}

function updatePeerCount() {
  let peers = 0;
  _awareness.getStates().forEach((_, cid) => { if (cid !== _awareness.clientID) peers++; });
  const el = document.getElementById('peerCount');
  if (el) el.textContent = peers;
}

// ── CRDT observers ────────────────────────────────────────────────────────────
function onToysChanged(events, transaction) {
  if (!transaction.local) { // filters out our own ops
    for (const event of events) {
      // The structural event (target is yToys) is where we log remote placements
      if (event.target !== _yToys) continue
      event.changes.added.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (yEl instanceof Y.XmlElement && yEl.nodeName === 'g') {
            const tid = yEl.getAttribute('data-toy-id') || '?'
            let msg = `remote: placed ${yEl.getAttribute('data-toy-type')} ${tid.slice(0,6)}`;
            App.addLog(msg, 'remote')
            addHistory(msg, {fill: yEl.getAttribute('fill'), elType: yEl.nodeName,})
          }
        })
      })
      event.changes.deleted.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!yEl.getAttribute) return;
          let msg = `remote deleted a toy ${yEl.nodeName}`;
          addHistory(msg, {
            fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
          });
          App.addLog(msg, 'del');
        });
      });
    }
  }
  renderDoc();
}
function onDocChanged() {
  UI.refreshFromDoc();
}

function onBounPosChanged(events, transaction) {
  if (!transaction.local) {
    for (const event of events) {
      if (event.target !== _yBounPos) continue;
      event.changes.added.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!(yEl instanceof Y.XmlElement)) return;
          const id = yEl.getAttribute('id') ?? '?';
          App.addLog(`remote: added boundary ${id.slice(0, 12)}`, 'remote');
        });
      });
    }
  }
  renderDoc();
}

function onDrawingChanged(events, transaction) {
  // Log remote structural changes (add / delete). Attribute changes (moves)
  // arrive here too via observeDeep but don't need logging — just renderDoc.
  if (!transaction.local) {
    for (const event of events) {
      if (event.target !== _yDrawing) continue; // skip attribute-change events on children
      event.changes.added.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!yEl.getAttribute) return;
          const id     = yEl.getAttribute('id') ?? '?';
          const meta   = _yDrawingMeta.get(id);
          const author = meta?.author;
          if (author && author !== _myId) {
            addHistory(`remote: added ${id.slice(0, 6)} by ${(author ?? '?').slice(0, 5)}`, {
              fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
            });
            App.addLog(`${(author ?? '?').slice(0, 5)} added ${yEl.nodeName}`, 'remote');
          }
        });
      });
      event.changes.deleted.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!yEl.getAttribute) return;
          addHistory(`remote: deleted ${(yEl.getAttribute('id') ?? '?').slice(0, 6)}`, {
            fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
          });
          App.addLog(`remote deleted ${yEl.nodeName}`, 'del');
        });
      });
    }
  }
  renderDoc();
}

function onPresenceChanged() {
  renderPresence();
  UI.updatePeersPanel();  // live-update peer list if panel is open
}

function layerForElement(el) {
  return el?.getAttribute?.('data-layer-type') ?? 'drawing';
}

// Return the sidecar meta object for any element id, regardless of layer.
function metaFor(id) {
  const svgEl = _svgEl?.querySelector?.(`[data-yid="${id}"]`);
  const ltype = layerForElement(svgEl);
  if (ltype === 'toy')      return _yToyMeta.get(id);
  if (ltype === 'boundaries-positions') return bounPosMetaFor(_yBounPosMeta, id);
  return _yDrawingMeta.get(id);
}

// ── App bus — the object passed to all modules ─────────────────────────────────
// Alphabetical within each group for easy scanning.
const App = {
  // ── Queries (ui.js, overlay.js read these) ─────────────────────────────────
  getActiveLayer:  () => _activeLayer,
  getHistory:      () => _historyLog.slice(0, 20),
  getLayers:       () => _layerMeta.map(l => ({
    ...l,
    visible: _layerVisibility[l.id] ?? true,
    count: l.id === DRAW_LAYER             ? _yDrawing.toArray().filter(e => e instanceof Y.XmlElement).length
         : l.id === 'toys'                 ? _yToys.toArray().filter(e => e instanceof Y.XmlElement).length
         : l.id === 'boundaries-positions' ? bounPosLayerData(_yBounPos, _yBounPosMeta).length
         : l.id === 'background'           ? 1
         : 0,
  })),
  getMyColor:      () => _myGrad.c1,
  getMyGradient:   () => _myGrad,
  getMyId:         () => _myId,
  getPalette:      () => PALETTE,
  // ── Tool registry queries ──────────────────────────────────────────────────
  getTools:        (layer) => _toolsByLayer[layer] ?? [SELECT_TOOL],
  getTool:         (name)  => _toolById[name] ?? null,
  getToolOptions:  (name)  => _toolById[name]?.options ?? [],
  getToolParams:   (name)  => _toolParams[name] ?? {},
  // Returns the full ttStateSchema for a tool — for drawing tools this comes from
  // SHAPE_TYPES[name].schema; for other tools it falls back to a minimal schema
  // built from the tool def's options array.
  getToolSchema:   (name)  => {
    const drawSchema = drawingGetTtStateSchema(name);
    if (drawSchema?.types) return drawSchema;
    if (BOUNPOS_TYPES[name]) return BOUNPOS_TYPES[name].schema;
    const def = _toolById[name];
    if (!def) return { types: {}, values: {} };
    const types  = Object.fromEntries((def.options ?? []).map(f => [f.key, f]));
    const values = def.defaults ?? _toolParams[name] ?? {};
    return { label: def.label, types, values };
  },
  getPeers:        () => {
    const out = [];
    _awareness.getStates().forEach((state, cid) => {
      if (cid === _awareness.clientID) return;
      out.push({ name: state.id?.slice(0, 8) ?? String(cid), color: state.color ?? '#888', live: true });
    });
    return out;
  },
  getRoomId:       () => _roomId,
  getSelectedId:   () => _selectedId,
  getBBox:  (id) => {
    const svgEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    if (!svgEl) return null;
    const ltype = layerForElement(svgEl);
    if (ltype === 'toy')      return toyGeom(svgEl);
    if (ltype === 'boundaries-positions') return bounPosGeom(svgEl);
    return drawingGeom(svgEl);
  },
  getAnchor: (svgEl) => {
    if (!svgEl) return { x: 0, y: 0 };
    const ltype = layerForElement(svgEl);
    if (ltype === 'toy')      return toyAnchor(svgEl);
    if (ltype === 'boundaries-positions') return bounPosAnchor(svgEl);
    return drawingAnchor(svgEl);
  },
  getLayerObjects: (layerId) => {
    if (layerId === 'drawing')              return drawingsData(_yDrawing, _yDrawingMeta);
    if (layerId === 'toys')                 return toysData(_yToys, _yToyMeta);
    if (layerId === 'boundaries-positions') return bounPosLayerData(_yBounPos, _yBounPosMeta);
    return [];
  },
  getViewScale:    () => Canvas.getView().scale,
  isOffline:       () => _offline,

  // ── Tool mutations (canvas.js calls back into ui.js via these) ────────────
  onToolChanged:   (t)  => UI.onToolChanged(t),
  onViewReset:     ()   => UI.toast('View reset'),
  requestContextMenu: (x, y, id) => UI.showPopover(x, y, id),

  // ── Selection ────────────────────────────────────────────────────────────
  select: (id) => {
    _selectedId = id;
    _awareness.setLocalStateField('selection', id ? { elId: id } : null);
    Canvas.setTool('select');
    Overlay.setLocalSelection(id);
    UI.onSelectionChanged(id, id ? metaFor(id) : null);
    renderDrawingList();
  },

  // ── Document mutations ────────────────────────────────────────────────────
  commitDrawing: (attrs) => {
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    addDrawing(_ydoc, _yDrawing, _yDrawingMeta, { ...attrs, id, author: _myId });
    _undoStack.push({ op: 'add', layer: 'drawing', id });
    addHistory(`added ${attrs.type ?? 'rect'} ${id.slice(0, 6)}`, {
      fill: attrs.fill, elType: attrs.type,
    });
    App.addLog(`added ${attrs.type} ${id.slice(0, 6)}`, 'local');
  },

  commitBounPos: ({ toolName, x, y, w, h }) => {
    const def = BOUNPOS_TYPES[toolName];
    if (!def) return;
    const { id, name } = def.newId();
    if (def.genType === null) {
      // boundary
      def.create(_ydoc, _yBounPos, _yBounPosMeta, { id, name, x, y, w, h, author: _myId });
    } else {
      // pos-set
      const params   = App.getToolParams(toolName);
      const genType  = def.genType;
      const genParam = genType === 'hex' ? (params['hex-size'] ?? 40) : (params['spacing'] ?? 80);
      const rawRadius  = params['snapRadius'] ?? 30;
      const snapRadius = Math.min(rawRadius, computeMaxSnapRadius(genType, genParam));
      const circles    = gridFillExtent(x, y, w, h, genType, genParam);
      if (circles.length === 0) return;
      def.create(_ydoc, _yBounPos, _yBounPosMeta,
        { id, name, snapRadius, genType, genParam, x, y, w, h, circles, author: _myId });
    }
    _undoStack.push({ op: 'add', layer: 'boundaries-positions', bounPosType: def.bounPosType, id });
    addHistory(`added ${def.label} ${name}`, { elType: 'boundaries-positions' });
    App.addLog(`added ${def.label} ${name}`, 'local');
    App.select(id);
  },

  // Legacy aliases kept for e2e tests and canvas.js call sites
  commitBoundary:    (geom)   => App.commitBounPos({ toolName: 'boundary',    ...geom }),
  commitPositionSet: ({ toolName, ...geom }) => App.commitBounPos({ toolName, ...geom }),

  setLayerVisible: (id, visible) => {
    _layerVisibility[id] = visible;
    applyLayerVisibility();
    UI.refreshFromDoc();
  },

  // Returns a sorted, deduplicated array of every CSS class name found on any
  // toy's wrapper <g> or inner <svg> currently in the document.  Used by the
  // Boundaries and Positions tools panel to suggest linkable class names.
  getToyClasses: () => {
    const classes = new Set();
    _svgEl?.querySelectorAll('[data-layer-type="toy"]').forEach(g => {
      g.classList.forEach(c => classes.add(c));
      g.querySelector('svg')?.classList.forEach(c => classes.add(c));
    });
    return [...classes].sort();
  },

  /**
   * Return the ttStateSchema for the currently selected element, decorated
   * with `ltype` and `id`.  Returns null when nothing is selected.
   *
   * Delegates to the layer-scoped module's getTtStateSchema(svgEl) so that
   * app.js stays ignorant of per-type field definitions.
   */
  getElementTtStateSchema: () => {
    if (!_selectedId) return null;
    const svgEl = _svgEl?.querySelector(`[data-yid="${_selectedId}"]`);
    if (!svgEl) return null;
    const ltype = layerForElement(svgEl);
    let schema;
    if (ltype === 'drawing') {
      schema = drawingGetTtStateSchema(svgEl);
    } else if (ltype === 'toy') {
      schema = toyGetTtStateSchema(svgEl);
    } else if (ltype === 'boundaries-positions') {
      schema = bounPosGetTtStateSchema(svgEl);
    } else {
      return null;
    }
    return { ltype, ...schema, id: _selectedId };
  },

  /**
   * Apply a partial editData object to the selected element.
   * Dispatches to the appropriate module's edit() function, which handles
   * the Yjs transaction.  App.commitEdit is the single entry point that
   * the Edit panel UI calls for all element mutations.
   */
  commitEdit: (id, editData) => {
    const svgEl = _svgEl?.querySelector(`[data-yid="${id}"]`);
    if (!svgEl) return;
    const ltype = layerForElement(svgEl);
    if (ltype === 'drawing') {
      drawingEdit(_ydoc, findDrawing(_yDrawing, id), editData);
    } else if (ltype === 'toy') {
      toyEdit(_ydoc, findToy(_yToys, id), _yToyMeta, editData);
    } else if (ltype === 'boundaries-positions') {
      bounPosEdit({id, ...editData}, _ydoc, _yBounPos, _yBounPosMeta);
    }
    // observeDeep fires synchronously → renderDoc() already ran.
    // Refresh the Edit panel body to show the updated values.
    UI.refreshFromDoc();
  },

  commitToy: (toolName, x, y) => {
    const def = _toolById[toolName];
    if (!def?.toyType) { UI.toast(`Unknown toy: ${toolName}`, 'warn'); return; }
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    addToy(_ydoc, _yToys, _yToyMeta, {
      id, toyType: def.toyType, x, y,
      color: _myGrad.c1, author: _myId,
    }).then(() => {
      _undoStack.push({ op: 'add', layer: 'toy', id });
      addHistory(`placed ${def.label} ${id.slice(0, 6)}`, { elType: 'toy' });
      App.addLog(`placed ${def.label} ${id.slice(0, 6)}`, 'local');
    }).catch(err => {
      UI.toast(`Failed to place ${def.label}`, 'warn');
      App.addLog(`place failed: ${err.message}`, 'del');
    });
  },

  deleteElement: (svgEl) => {
    const id    = svgEl.getAttribute('data-yid');
    const ltype = layerForElement(svgEl);
    if (ltype === 'toy') {
      const yEl = findToy(_yToys, id);
      if (!yEl) return;
      const state = toyGetTtState(yEl);
      _undoStack.push({ op: 'del', layer: 'toy', state });
      deleteToy(_ydoc, _yToys, _yToyMeta, id);
      addHistory(`deleted ${id.slice(0, 6)}`, { elType: 'toy' });
    } else if (ltype === 'boundaries-positions') {
      const yEl = bounPosFindEl(_yBounPos, id);
      if (!yEl) return;
      const state = bounPosGetTtState(yEl);
      _undoStack.push({ op: 'del', layer: 'boundaries-positions', state });
      bounPosDeleteEl(_ydoc, _yBounPos, _yBounPosMeta, id);
      addHistory(`deleted ${state.bounPosType} ${id.slice(0, 12)}`,
        { elType: 'boundaries-positions' });
    } else {
      const yEl = findDrawing(_yDrawing, id);
      if (!yEl) return;
      const state = drawingGetTtState(yEl);
      _undoStack.push({ op: 'del', layer: 'drawing', state });
      deleteDrawing(_ydoc, _yDrawing, _yDrawingMeta, id);
      addHistory(`deleted ${id.slice(0, 6)}`, { fill: state?.fill, elType: yEl.nodeName });
    }
    App.addLog(`deleted ${id.slice(0, 6)}`, 'local');
    if (id === _selectedId) App.select(null);
    return true;
  },

  deleteSelected: () => {
    if (!_selectedId) return;
    const svgEl = _svgEl.querySelector(`[data-yid="${_selectedId}"]`);
    if (svgEl) App.deleteElement(svgEl);
  },
  duplicateSelected: () => {
    if (!_selectedId) return;
    const yEl = findDrawing(_yDrawing, _selectedId);
    if (!yEl) return;
    const attrs = yEl.getAttributes();
    const type  = yEl.nodeName;
    const offset = { x: +(attrs.x ?? attrs.cx ?? 0) + 22, y: +(attrs.y ?? attrs.cy ?? 0) + 22 };
    const geom   = type === 'rect'
      ? { x: offset.x, y: offset.y, width: +attrs.width, height: +attrs.height }
      : { cx: offset.x, cy: offset.y, r: +attrs.r };
    App.commitDrawing({ ...attrs, ...geom, type, id: undefined, author: undefined });
  },

  // ── Drag lifecycle ────────────────────────────────────────────────────────
  // startDrag   — called once on pointerdown when a move gesture begins
  // move        — called on every pointermove; updates overlay ghost + awareness
  // commitMove  — called on pointerup; writes final position to Yjs once
  // cancelMove  — called on pointercancel or disconnect; reverts with no Yjs write

  startDrag: (id) => {
    const domEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    const anchor = App.getAnchor(domEl);
    const bbox = App.getBBox(id);
    const isToy = layerForElement(domEl) === 'toy';
    const toyClasses  = isToy ? getToyClasses(domEl) : new Set();
    const boundsRects = isToy ? computeBoundaryRects(_yBounPos, toyClasses, anchor) : null;
    const snapPoints  = isToy ? computePositionSnapPoints(_yBounPos, toyClasses) : [];
    _dragState = { id, startX: anchor.x, startY: anchor.y,
      startBboxX: bbox.x,
      startBboxY: bbox.y,
      boundsRects,
      lastValidX: anchor.x,
      lastValidY: anchor.y,
      snapPoints,
    };
    Overlay.startDragPlaceholder(id);
    _awareness.setLocalStateField('drag', { elId: id, bboxX: bbox.x, bboxY: bbox.y });
  },

  move: (id, x, y) => {
    if (!_dragState || _dragState.id !== id) return;
    let rx = Math.round(x), ry = Math.round(y);

    // Boundary constraint: if this toy belongs to boundary zones (via class
    // names), only allow positions that fall inside at least one of them.
    if (_dragState.boundsRects !== null) {
      const inBounds = _dragState.boundsRects.some(
        r => rx >= r.x && rx <= r.x + r.w && ry >= r.y && ry <= r.y + r.h
      );
      if (!inBounds) return;
    }

    // Snap-to-position: pull ghost to the nearest snap point if within radius.
    // Reject the snap if the snap point itself is outside the boundary zone.
    if (_dragState.snapPoints.length > 0) {
      const snapped = findNearestSnap(rx, ry, _dragState.snapPoints);
      if (snapped) {
        const snapOk = !_dragState.boundsRects || _dragState.boundsRects.some(
          r => snapped.cx >= r.x && snapped.cx <= r.x + r.w &&
               snapped.cy >= r.y && snapped.cy <= r.y + r.h
        );
        if (snapOk) { rx = snapped.cx; ry = snapped.cy; }
      }
    }

    _dragState.lastValidX = rx;
    _dragState.lastValidY = ry;

    const dx = rx - _dragState.startX;
    const dy = ry - _dragState.startY;
    Overlay.updateLocalDragGhost(id, dx, dy);
    _awareness.setLocalStateField('drag', {
      elId: id,
      bboxX: _dragState.startBboxX + dx,
      bboxY: _dragState.startBboxY + dy,
    });
  },

  commitMove: (id, x, y) => {
    if (!_dragState) return;
    const fromX      = _dragState.startX;
    const fromY      = _dragState.startY;
    // If the drag was boundary-constrained or snap-enabled, the raw pointer
    // position may differ from the validated position — use the last position
    // accepted by move().
    const constrained = _dragState.boundsRects !== null || _dragState.snapPoints.length > 0;
    const rx = constrained ? _dragState.lastValidX : Math.round(x);
    const ry = constrained ? _dragState.lastValidY : Math.round(y);
    const domEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    const ltype = layerForElement(domEl);

    // Ghost gone before bbox changes — prevents one-frame ghost "jitter"
    Overlay.endDragPlaceholder(id);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;

    if (ltype === 'toy') {
      toyApplyMoveCommit(_ydoc, findToy(_yToys, id), rx, ry);
      // onToysChanged (observeDeep) fires synchronously and calls renderDoc().
    } else if (ltype === 'boundaries-positions') {
      bounPosApplyMoveCommit(_ydoc, bounPosFindEl(_yBounPos, id), rx, ry);
      // observeDeep on _yBounPos fires and calls renderDoc() via onBounPosChanged.
    } else {
      drawingApplyMoveCommit(_ydoc, findDrawing(_yDrawing, id), rx, ry);
      // _yDrawing.observe is shallow — attribute changes on children don't
      // trigger onDrawingChanged, so we must call renderDoc() explicitly here.
      renderDoc();
    }
    _undoStack.push({ op: 'move', layer: ltype, id, fromX, fromY, toX: rx, toY: ry });
    addHistory(`moved ${id.slice(0, 6)} → (${rx}, ${ry})`, {
      fill: domEl?.getAttribute('fill'),
      elType: ltype,
    });
  },

  cancelMove: () => {
    if (!_dragState) return;
    const id = _dragState.id;
    Overlay.endDragPlaceholder(id);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;
  },

  bringToFront: () => {
    if (!_selectedId) return;
    const yEl = findDrawing(_yDrawing, _selectedId);
    if (!yEl) return;
    const index = _yDrawing.toArray().indexOf(yEl);
    _ydoc.transact(() => {
      _yDrawing.delete(index, 1);
      _yDrawing.insert(_yDrawing.length, [yEl]);
    });
    addHistory(`brought ${_selectedId.slice(0, 6)} to front`);
  },

  setDrawingAttr: (id, key, value) => {
    const yEl = findDrawing(_yDrawing, id);
    if (!yEl) return;
    _ydoc.transact(() => yEl.setAttribute(key, String(value)));
  },

  // ── Tool selection + params (ui.js → app → canvas.js) ─────────────────────
  setTool: (name) => {
    _activeTool = name;
    Canvas.setTool(name, _toolParams[name] ?? {});
    UI.onToolChanged(name);
  },
  setFill: (c) => {
    // Fill applies to the active tool's params and any current selection.
    const p = _toolParams[_activeTool];
    if (p) p.fill = c;
    if (_selectedId) App.setDrawingAttr(_selectedId, 'fill', c);
    Canvas.setParams(_toolParams[_activeTool] ?? {});
  },
  setToolParam: (toolName, key, value) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    p[key] = (typeof value === 'string' && value !== '' && !isNaN(value)) ? +value : value;
    if (toolName === _activeTool) Canvas.setParams(p);
    // Live-apply visual params to a current selection
    if (_selectedId && ['fill', 'stroke-width'].includes(key)) {
      App.setDrawingAttr(_selectedId, key, p[key]);
    }
  },
  stepToolParam: (toolName, key, delta, min, max) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    const next = +( (p[key] ?? 0) + delta ).toFixed(2);
    p[key] = Math.max(min, Math.min(max, next));
    if (toolName === _activeTool) Canvas.setParams(p);
    if (_selectedId && ['stroke-width'].includes(key)) {
      App.setDrawingAttr(_selectedId, key, p[key]);
    }
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  setLayer: (id) => {
    _activeLayer = id;
    // Default to Select when changing layers (tools differ per layer)
    App.setTool('select');
    UI.toast(`Layer: ${id}`);
  },
  setOffline: (v)   => { _offline = v; },
  undo: () => {
    const op = _undoStack.pop();
    if (!op) { UI.toast('Nothing to undo', 'warn'); return; }
    if (op.op === 'add') {
      if (op.layer === 'toy') {
        deleteToy(_ydoc, _yToys, _yToyMeta, op.id);
        addHistory(`undid: add toy ${op.id.slice(0, 6)}`, { elType: 'toy' });
      } else if (op.layer === 'boundaries-positions') {
        bounPosDeleteEl(_ydoc, _yBounPos, _yBounPosMeta, op.id);
        addHistory(`undid: add ${op.bounPosType} ${op.id.slice(0, 12)}`);
      } else {
        deleteDrawing(_ydoc, _yDrawing, _yDrawingMeta, op.id);
        addHistory(`undid: add ${op.id.slice(0, 6)}`);
      }
    } else if (op.op === 'del') {
      if (op.layer === 'toy') {
        toyApplyTtState(_ydoc, _yToys, _yToyMeta, op.state).then(() => {
          addHistory(`undid: delete toy ${op.state.id.slice(0, 6)}`, { elType: 'toy' });
          UI.toast('Undone');
        }).catch(err => {
          UI.toast('Cannot undo toy delete', 'warn');
          App.addLog(`undo toy delete failed: ${err.message}`, 'del');
        });
        return; // async — toast fired inside .then()
      } else if (op.layer === 'boundaries-positions') {
        bounPosApplyTtState(_ydoc, _yBounPos, _yBounPosMeta, op.state);
        addHistory(`undid: delete ${op.state.bounPosType} ${op.state.id.slice(0, 12)}`);
      } else {
        drawingApplyTtState(_ydoc, _yDrawing, _yDrawingMeta, op.state);
        addHistory(`undid: delete ${op.state.id.slice(0, 6)}`, { fill: op.state.fill, elType: op.state.type });
      }
    } else if (op.op === 'move') {
      if (op.layer === 'toy') {
        toyApplyMoveCommit(_ydoc, findToy(_yToys, op.id), op.fromX, op.fromY);
      } else if (op.layer === 'boundaries-positions') {
        bounPosApplyMoveCommit(_ydoc, bounPosFindEl(_yBounPos, op.id), op.fromX, op.fromY);
        // observeDeep fires and calls renderDoc()
      } else {
        drawingApplyMoveCommit(_ydoc, findDrawing(_yDrawing, op.id), op.fromX, op.fromY);
        renderDoc();
      }
      addHistory(`undid: move ${op.id.slice(0, 6)} → (${op.fromX}, ${op.fromY})`);
    }
    UI.toast('Undone');
  },
  exportSVG: () => {
    // Clone the live SVG, strip overlay and UI-only layers, then download.
    const clone = _svgEl.cloneNode(true);
    clone.removeAttribute('id');
    ['#overlay-layer', '#draw-preview'].forEach(sel => {
      clone.querySelector(sel)?.remove();
    });
    clone.querySelectorAll('[pointer-events]').forEach(el => el.removeAttribute('pointer-events'));
    if (!clone.getAttribute('viewBox')) {
      const w = _svgEl.clientWidth  || 1384;
      const h = _svgEl.clientHeight || 998;
      clone.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
    clone.setAttribute('xmlns',          'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink',    'http://www.w3.org/1999/xlink');
    clone.setAttribute('xmlns:inkscape', 'http://www.inkscape.org/namespaces/inkscape');
    clone.querySelector('#toys-layer')?.setAttribute('inkscape:groupmode', 'layer');
    clone.querySelector('#drawing-layer')?.setAttribute('inkscape:groupmode', 'layer');
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `tt-${_roomId}-${dateStr}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('SVG exported');
  },
  importSVG: () => {
    const input  = document.createElement('input');
    input.type   = 'file';
    input.accept = '.svg,image/svg+xml';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const text   = await file.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(text, 'image/svg+xml');
      if (svgDoc.querySelector('parsererror')) {
        UI.toast('Could not parse SVG', 'warn');
        return;
      }

      // DOM element → Y.XmlElement tree (recursive)
      function domToY(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const t = node.textContent.trim();
          return t ? new Y.XmlText(t) : null;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return null;
        if (node.localName === 'script') return null;
        const yEl = new Y.XmlElement(node.localName);
        for (const at of node.attributes) yEl.setAttribute(at.name, at.value);
        const children = [...node.childNodes].map(domToY).filter(Boolean);
        if (children.length) yEl.insert(0, children);
        return yEl;
      }

      // Toy contract: <g class="toy" data-toy-id data-toy-type
      //                  data-yid data-layer-type="toy"> with ≥1 <svg> child
      function isToyG(el) {
        return el.localName === 'g' &&
               el.classList.contains('toy') &&
               el.getAttribute('data-toy-id') &&
               el.getAttribute('data-toy-type') &&
               el.getAttribute('data-yid') &&
               el.getAttribute('data-layer-type') === 'toy' &&
               el.querySelector(':scope > svg');
      }

      const bgPattern   = svgDoc.querySelector('defs pattern');
      const toysLayerEl = svgDoc.querySelector('#toys-layer');
      const drawLayerEl = svgDoc.querySelector('#drawing-layer');
      let toyCount = 0, toyErrors = 0, drawCount = 0;

      _ydoc.transact(() => {
        // background-layer: extract bg image url/dimensions from the <pattern>
        // in <defs> and write to yMeta so the background is restored on import.
        if (bgPattern) {
          const img = bgPattern.querySelector('image');
          if (img) {
            const url = img.getAttribute('href') || img.getAttribute('xlink:href') || '';
            const w   = Number(bgPattern.getAttribute('width'))  || 0;
            const h   = Number(bgPattern.getAttribute('height')) || 0;
            if (url) {
              _yMeta.set('bg_url',   url);
              if (w) _yMeta.set('bg_width',  w);
              if (h) _yMeta.set('bg_height', h);
            }
          }
        }

        // Toys layer
        if (toysLayerEl) {
          const invalid = [];
          for (const child of toysLayerEl.children) {
            if (isToyG(child)) {
              const yG = domToY(child);
              if (yG) { _yToys.insert(_yToys.length, [yG]); toyCount++; }
            } else {
              invalid.push(child);
              toyErrors++;
            }
          }
          if (invalid.length) {
            let errLayer = _svgEl.querySelector('#errors-layer');
            if (!errLayer) {
              errLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              errLayer.setAttribute('id', 'errors-layer');
              _svgEl.appendChild(errLayer);
            }
            invalid.forEach(el => errLayer.appendChild(document.importNode(el, true)));
          }
        }
        // Drawing layer
        if (drawLayerEl) {
          for (const child of drawLayerEl.children) {
            const yEl = domToY(child);
            if (yEl) { _yDrawing.insert(_yDrawing.length, [yEl]); drawCount++; }
          }
        }
        // Everything else → drawing layer
        for (const el of svgDoc.documentElement.children) {
          const id = el.getAttribute('id') ?? '';
          if (el.localName === 'defs') continue;
          if (id === 'toys-layer' || id === 'drawing-layer') continue;
          if (id === 'background-layer') continue;
          // TODO: boundaries-positions import into its own Yjs fragment when implemented
          if (id === 'boundaries-positions-layer') continue;
          // overlay-layer is UI-only and is stripped on export
          if (id === 'overlay-layer') continue;
          const yEl = domToY(el);
          if (yEl) { _yDrawing.insert(_yDrawing.length, [yEl]); drawCount++; }
        }
      });

      const parts = [];
      if (toyCount)  parts.push(`${toyCount} toy${toyCount === 1 ? '' : 's'}`);
      if (drawCount) parts.push(`${drawCount} shape${drawCount === 1 ? '' : 's'}`);
      if (toyErrors) parts.push(`${toyErrors} invalid → errors layer`);
      if (!parts.length) UI.toast('Nothing importable found', 'warn');
      else UI.toast(`Imported: ${parts.join(', ')}`);
    };
    input.click();
  },

  addLog: (msg, type='') => {
    const log   = document.getElementById('eventLog')
    if (log === null) return;
    const entry = document.createElement('div')
    entry.className   = `log-entry ${type}`
    entry.textContent = `${new Date().toISOString().slice(11,19)} ${msg}`
    if (type === 'local') entry.style.borderLeftColor = _myGrad.c1
    log.prepend(entry)
    while (log.children.length > 40) log.lastChild.remove()
  },

  getDefaultBackgrounds: () => DEFAULT_BACKGROUNDS,
  getBackground:   () => ({
    url:    _yMeta.get('bg_url')    ?? '',
    width:  _yMeta.get('bg_width')  ?? 1384,
    height: _yMeta.get('bg_height') ?? 998,
  }),
  setBackground:   (attrs) => {
    _ydoc.transact(() => {
      if (attrs.url    !== undefined) _yMeta.set('bg_url',    attrs.url);
      if (attrs.width  !== undefined) _yMeta.set('bg_width',  Number(attrs.width));
      if (attrs.height !== undefined) _yMeta.set('bg_height', Number(attrs.height));
    });
  },
};

// ── History log ───────────────────────────────────────────────────────────────
function addHistory(label, meta = {}) {
  _historyLog.unshift({ label, ts: Date.now(), fill: meta.fill, elType: meta.elType });
  if (_historyLog.length > 40) _historyLog.pop();
  UI.refreshFromDoc();
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
function onKeyDown(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'r' || e.key === 'R') App.setTool('rect');
  if (e.key === 'c' || e.key === 'C') App.setTool('circle');
  if (e.key === 's' || e.key === 'S') App.setTool('select');
  if (e.key === 'Escape') App.select(null);
  if ((e.key === 'Delete' || e.key === 'Backspace')) App.deleteSelected();
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); App.undo(); }
}

function onMetaChanged() {
  renderBackgroundLayer();
  UI.refreshFromDoc();
}

function renderBackgroundLayer() {
  const layer = _svgEl.querySelector('#background-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const url    = _yMeta.get('bg_url')    || 'img/bg_slatehex.png';
  const width  = _yMeta.get('bg_width')  || 1384;
  const height = _yMeta.get('bg_height') || 998;
  const SVGNS = 'http://www.w3.org/2000/svg';
  // Tiling pattern so the image repeats across infinite canvas
  const defs    = _svgEl.querySelector('defs');
  // Remove stale bg pattern if present
  defs.querySelector('#bg-pattern')?.remove();
  const pattern = document.createElementNS(SVGNS, 'pattern');
  pattern.setAttribute('id',           'bg-pattern');
  pattern.setAttribute('x',            '0');
  pattern.setAttribute('y',            '0');
  pattern.setAttribute('width',        width);
  pattern.setAttribute('height',       height);
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const img = document.createElementNS(SVGNS, 'image');
  img.setAttribute('href',   url);
  img.setAttribute('x',      '0');
  img.setAttribute('y',      '0');
  img.setAttribute('width',  width);
  img.setAttribute('height', height);
  pattern.appendChild(img);
  defs.appendChild(pattern);
  const rect = document.createElementNS(SVGNS, 'rect');
  rect.setAttribute('x',              '0');
  rect.setAttribute('y',              '0');
  rect.setAttribute('width',          '100%');
  rect.setAttribute('height',         '100%');
  rect.setAttribute('fill',           'url(#bg-pattern)');
  rect.setAttribute('pointer-events', 'none');
  layer.appendChild(rect);
}


export { App };
