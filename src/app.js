/**
 * app.js — crdt-svg application bus
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
import { SHAPE_TYPES, addDrawing, deleteDrawing,
         findDrawing, listDrawings, drawingsData,
         getGeom as drawingGeom,
         getAnchor as drawingAnchor,
         applyMoveCommit as drawingApplyMoveCommit } from './drawing.js';
import { TOOLS as TOY_TOOLS,
         TOY_TYPES, addToy, deleteToy, findToy,
         listToys, toysData,
         getGeom as toyGeom,
         getAnchor as toyAnchor,
         applyMoveCommit as toyApplyMoveCommit,
       }  from './toys.js';
import { SELECT_TOOL }                            from './tools-schema.js';
import { TOOLS as DRAW_TOOLS, LAYER as DRAW_LAYER }  from './tools-drawing.js';
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
let _ydoc, _yMeta, _yToys, _yToyMeta, _yDrawing, _yDrawingMeta, _awareness, _provider;
let _myId, _myGrad, _roomId;
let _svgEl;
let _selectedId   = null;
let _activeLayer  = 'toys';
let _activeTool   = 'select';
let _offline      = false;
let _undoStack    = [];      // { op:'add'|'del'|'move', ...data }
let _historyLog   = [];      // { label } — human-readable, newest first

// Active drag — set by App.startDrag, cleared by commitMove / cancelMove.
// Awareness state: drag: { elId, dx, dy }
// local awareness schema: { id, color, grad, cursor, selection, drag? }
let _dragState    = null;    // { id, startX, startY } | null

// ── Tool registry ──────────────────────────────────────────────────────────────
// Built from the layer registries + the universal Select tool.
// _toolsByLayer: layer → ToolDef[] (Select first)
// _toolById:     name  → ToolDef
// _toolParams:   name  → live params object (seeded from def.defaults)
const _toolsByLayer = {};
const _toolById     = {};
const _toolParams   = {};
const _layerMeta = [
  { id: 'background', label: 'Background', iconId: 'layer-bg' },
  { id: 'toys',   label: 'Toys',  iconId: 'layer-toys' },
  { id: DRAW_LAYER,   label: 'Drawing',    iconId: 'layer-draw' },
];

function buildToolRegistry() {
  const register = (def) => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...(def.defaults ?? {}) };
  };
  register(SELECT_TOOL);
  // background layer: select only
  _toolsByLayer['background'] = [SELECT_TOOL];
  // toys layer
  TOY_TOOLS.forEach(register);
  _toolsByLayer['toys'] = [SELECT_TOOL, ...TOY_TOOLS];
  // drawing layer
  DRAW_TOOLS.forEach(register);
  _toolsByLayer[DRAW_LAYER] = [SELECT_TOOL, ...DRAW_TOOLS];
}

// Presentation palette — matches ui.css --primary accent family
const PALETTE = ['#c8941e','#5a7ea8','#8a5ea8','#5ea88a','#a85e5e','#a8905e','#5e8aa8'];

export function makeDoc() {
  const ydoc       = new Y.Doc();
  const yToys      = ydoc.getXmlFragment('toys');
  const yToyMeta   = ydoc.getMap('toyMeta');
  const yDrawing   = ydoc.getXmlFragment('drawing');
  const yDrawingMeta = ydoc.getMap('drawingMeta');
  const yMeta      = ydoc.getMap('meta');
  return { ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta };
}

// ── Boot ──────────────────────────────────────────────────────────────────────
export function boot({ ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta, awareness, provider, myId, myGrad, roomId, svgElement, displayName }) {
  _ydoc       = ydoc;
  _yMeta      = yMeta;
  _yToys      = yToys;
  _yToyMeta   = yToyMeta;
  _yDrawing   = yDrawing;
  _yDrawingMeta = yDrawingMeta;
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
  UI.setIdentity({ projectName: 'crdt-svg', userId: `me · ${displayName}`, roomId });

  // 5. Keyboard shortcuts
  window.addEventListener('keydown', onKeyDown);

  // 6. CRDT observers
  // Both layers use observeDeep so attribute changes (moves via applyMoveCommit)
  // trigger renderDoc on every client — shallow observe only fires for
  // insert/delete on the fragment itself, missing setAttribute on children.
  _yToys.observeDeep(onToysChanged);
  _yDrawing.observeDeep(onDrawingChanged);
  _yToys.observe(onDocChanged);
  _yDrawing.observe(onDocChanged);
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
function renderDoc() {
  renderBackgroundLayer();
  renderBoundariesPositionsLayer();
  renderToysLayer();
  renderDrawingLayer();
  updatePeerCount();
  Overlay.render();          // doc geometry may have changed under selections
}

function renderPresence() {
  Overlay.syncFromAwareness(_awareness.getStates(), _awareness.clientID);
  updatePeerCount();
}

function renderBoundariesPositionsLayer() {
  const layer = _svgEl.querySelector('#boundaries-positions-layer');
  if (!layer) return;
  layer.innerHTML = '';
}

// Toys layer — mirror each <g> wrapper (and its embedded <svg> sub-document).
// mousedown selects the toy and begins a drag (toys mode only — the layer's
// pointer-events are gated by setMode). Movement is applied to the DOM live and
// committed to the CRDT on drop (see the window mouseup handler).
function renderToysLayer() {
  const layer = _svgEl.querySelector('#toys-layer');
  if (!layer) return;
  layer.innerHTML = '';

  listToys(_yToys, _yToyMeta).forEach(({ svgEl }) => {
    svgEl.style.cursor = 'grab';
    layer.appendChild(svgEl);
  });

  Canvas.wireShapeClicks(layer);

  const countEl = document.getElementById('toyCount');
  if (countEl) countEl.textContent = _yToys.length;
  renderDrawingList();
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
    const def    = SHAPE_TYPES[drawingMeta?.type ?? attrs['data-type']] ?? SHAPE_TYPES.rect;
    const item   = document.createElement('div');
    const author = drawingMeta?.author;
    item.className  = 'drawing-item' + (_selectedId === id ? ' selected' : '');
    item.dataset.id = id;
    const sw = document.createElement('div');
    sw.className        = 'drawing-swatch';
    sw.style.background = attrs.fill;
    const lbl = document.createElement('div');
    lbl.className   = 'drawing-label';
    lbl.textContent = def.label(attrs);
    const own = document.createElement('div');
    own.className   = 'drawing-owner';
    own.textContent = author === _myId ? 'me' : (author?.slice(0, 5) ?? '?');
    own.style.color = author === _myId ? 'var(--primary)' : 'var(--text-3)';
    const del = document.createElement('button');
    del.className   = 'drawing-del';
    del.textContent = '×';
    del.addEventListener('click', ev => { ev.stopPropagation(); App.deleteDrawing(svgEl); });
    item.append(sw, lbl, own, del);
    item.addEventListener('click', () => App.selectDrawing(id));
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

// ── App bus — the object passed to all modules ─────────────────────────────────
// Alphabetical within each group for easy scanning.
const App = {
  // ── Queries (ui.js, overlay.js read these) ─────────────────────────────────
  getActiveLayer:  () => _activeLayer,
  getHistory:      () => _historyLog.slice(0, 20),
  getLayers:       () => _layerMeta.map(l => ({
    ...l,
    count: l.id === DRAW_LAYER ? _yDrawing.toArray().filter(e => e instanceof Y.XmlElement).length
         : l.id === 'toys'      ? _yToys.toArray().filter(e => e instanceof Y.XmlElement).length
         : l.id === 'background' ? 1
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
  getDrawingBBox:  (id) => {
    const svgEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    if (!svgEl) return null;
    // Raw bounding box — the overlay applies its own selection PAD.
    return layerForElement(svgEl) === 'toy' ? toyGeom(svgEl) : drawingGeom(svgEl);
  },
  getDrawingAnchor: (svgEl) => {
    if (!svgEl) return { x: 0, y: 0 };
    return layerForElement(svgEl) === 'toy' ? toyAnchor(svgEl) : drawingAnchor(svgEl);
  },
  getLayerObjects: (layerId) => {
    if (layerId === 'drawing') return drawingsData(_yDrawing, _yDrawingMeta);
    if (layerId === 'toys')    return toysData(_yToys, _yToyMeta);
    return [];
  },
  getViewScale:    () => Canvas.getView().scale,
  isOffline:       () => _offline,

  // ── Tool mutations (canvas.js calls back into ui.js via these) ────────────
  onToolChanged:   (t)  => UI.onToolChanged(t),
  onViewReset:     ()   => UI.toast('View reset'),
  requestContextMenu: (x, y, id) => UI.showPopover(x, y, id),

  // ── Selection ────────────────────────────────────────────────────────────
  selectDrawing: (id) => {
    _selectedId = id;
    _awareness.setLocalStateField('selection', id ? { elId: id } : null);
    Overlay.setLocalSelection(id);
    const meta = id ? _yDrawingMeta.get(id) : null;
    UI.onSelectionChanged(id, meta);
    renderDrawingList();
  },

  // ── Document mutations ────────────────────────────────────────────────────
  commitDrawing: (attrs) => {
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    addDrawing(_ydoc, _yDrawing, _yDrawingMeta, { ...attrs, id, author: _myId });
    _undoStack.push({ op: 'add', id });
    addHistory(`added ${attrs.type ?? 'rect'} ${id.slice(0, 6)}`, {
      fill: attrs.fill, elType: attrs.type,
    });
    App.addLog(`added ${attrs.type} ${id.slice(0, 6)}`, 'local');
  },

  commitToy: (toolName, x, y) => {
    const def = _toolById[toolName];
    if (!def?.toyType) { UI.toast(`Unknown toy: ${toolName}`, 'warn'); return; }
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    addToy(_ydoc, _yToys, _yToyMeta, {
      id, toyType: def.toyType, x, y,
      color: _myGrad.c1, author: _myId,
    }).then(() => {
      _undoStack.push({ op: 'add-toy', id });
      addHistory(`placed ${def.label} ${id.slice(0, 6)}`, { elType: 'toy' });
      App.addLog(`placed ${def.label} ${id.slice(0, 6)}`, 'local');
    }).catch(err => {
      UI.toast(`Failed to place ${def.label}`, 'warn');
      App.addLog(`place failed: ${err.message}`, 'del');
    });
  },

  deleteDrawing: (svgEl) => {
    const id  = svgEl.getAttribute('data-yid');
    const yEl = findDrawing(_yDrawing, id);
    if (!yEl) return;
    const snap = yEl.getAttributes();
    _undoStack.push({ op: 'del', attrs: snap, meta: _yDrawingMeta.get(id) });
    deleteDrawing(_ydoc, _yDrawing, _yDrawingMeta, id);
    addHistory(`deleted ${id.slice(0, 6)}`, { fill: snap.fill, elType: yEl.nodeName });
    App.addLog(`deleted ${id.slice(0, 6)}`, 'local');
    if (id === _selectedId) App.selectDrawing(null);
    return true;
  },

  deleteToy: (svgEl) => {
    const id  = svgEl.getAttribute('data-yid');
    const yEl = findToy(_yToys, id);
    if (!yEl) return;
    const snap = yEl.getAttributes();
    _undoStack.push({ op: 'del', attrs: snap, meta: _yToyMeta.get(id) });
    deleteToy(_ydoc, _yToys, _yToyMeta, id);
    addHistory(`deleted ${id.slice(0, 6)}`, { });
    App.addLog(`deleted ${id.slice(0, 6)}`, 'local');
    return true;
  },

  deleteSelected:   () => {
    if (!_selectedId) return;
    const svgEl = _svgEl.querySelector(`[data-yid="${_selectedId}"]`);
    if (!svgEl) return;
    const success = layerForElement(svgEl) === 'toy' ? App.deleteToy(svgEl) : App.deleteDrawing(svgEl);
    if (success) App.selectDrawing(null);
  },
  duplicateSelected: () => {
    if (!_selectedId) return;
    const yEl = findDrawing(_yDrawing, _selectedId);
    if (!yEl) return;
    const attrs = yEl.getAttributes();
    const def   = SHAPE_TYPES[yEl.nodeName];
    if (!def) return;
    const offset = { x: +(attrs.x ?? attrs.cx ?? 0) + 22, y: +(attrs.y ?? attrs.cy ?? 0) + 22 };
    const geom   = def.tag === 'rect'
      ? { x: offset.x, y: offset.y, width: +attrs.width, height: +attrs.height }
      : { cx: offset.x, cy: offset.y, r: +attrs.r };
    App.commitDrawing({ type: yEl.nodeName, ...geom, fill: attrs.fill, stroke: attrs.stroke, 'stroke-width': attrs['stroke-width'], opacity: attrs.opacity });
  },

  // ── Drag lifecycle ────────────────────────────────────────────────────────
  // startDrag    — called once on pointerdown when a move gesture begins
  // moveDrawing  — called on every pointermove; updates overlay ghost + awareness
  // commitMove   — called on pointerup; writes final position to Yjs once
  // cancelMove   — called on pointercancel or disconnect; reverts with no Yjs write

  startDrag: (id) => {
    const domEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    const anchor = layerForElement(domEl) === 'toy'
      ? toyAnchor(domEl)
      : drawingAnchor(domEl);
    const bbox = App.getDrawingBBox(id);
    _dragState = { id, startX: anchor.x, startY: anchor.y,
      startBboxX: bbox.x,
      startBboxY: bbox.y,
    };
    Overlay.startDragPlaceholder(id);
    _awareness.setLocalStateField('drag', { elId: id, bboxX: bbox.x, bboxY: bbox.y });
  },

  moveDrawing: (id, x, y) => {
    if (!_dragState || _dragState.id !== id) return;
    const rx = Math.round(x), ry = Math.round(y);
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
    const rx = Math.round(x), ry = Math.round(y);
    const fromX = _dragState.startX, fromY = _dragState.startY;
    const domEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    const isToy = layerForElement(domEl) === 'toy';

    // Ghost gone before bbox changes — prevents one-frame ghost "jitter"
    Overlay.endDragPlaceholder(id);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;

    if (isToy) {
      toyApplyMoveCommit(_ydoc, findToy(_yToys, id), rx, ry);
      // onToysChanged (observeDeep) fires synchronously and calls renderDoc().
    } else {
      drawingApplyMoveCommit(_ydoc, findDrawing(_yDrawing, id), rx, ry);
      // _yDrawing.observe is shallow — attribute changes on children don't
      // trigger onDrawingChanged, so we must call renderDoc() explicitly here.
      renderDoc();
    }
    _undoStack.push({ op: 'move', id, isToy, fromX, fromY, toX: rx, toY: ry });
    addHistory(`moved ${id.slice(0, 6)} → (${rx}, ${ry})`, {
      fill: domEl?.getAttribute('fill'),
      elType: isToy ? 'toy' : domEl?.nodeName,
    });
    //Overlay.endDragPlaceholder(id);
    //_awareness.setLocalStateField('drag', null);
    //_dragState = null;
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
    if (_selectedId && ['fill', 'strokeW', 'opacity'].includes(key)) {
      const svgKey = key === 'strokeW' ? 'stroke-width' : key;
      App.setDrawingAttr(_selectedId, svgKey, p[key]);
    }
  },
  stepToolParam: (toolName, key, delta, min, max) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    const next = +( (p[key] ?? 0) + delta ).toFixed(2);
    p[key] = Math.max(min, Math.min(max, next));
    if (toolName === _activeTool) Canvas.setParams(p);
    if (_selectedId && ['strokeW', 'opacity'].includes(key)) {
      const svgKey = key === 'strokeW' ? 'stroke-width' : key;
      App.setDrawingAttr(_selectedId, svgKey, p[key]);
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
      deleteDrawing(_ydoc, _yDrawing, _yDrawingMeta, op.id);
      addHistory(`undid: add ${op.id.slice(0, 6)}`);
    } else if (op.op === 'del') {
      addDrawing(_ydoc, _yDrawing, _yDrawingMeta, { ...op.attrs, ...op.meta, id: op.attrs.id });
      addHistory(`undid: delete ${op.attrs.id.slice(0, 6)}`, { fill: op.attrs.fill, elType: op.attrs.type });
    } else if (op.op === 'add-toy') {
      deleteToy(_ydoc, _yToys, _yToyMeta, op.id);
      addHistory(`undid: add toy ${op.id.slice(0, 6)}`, { elType: 'toy' });
    } else if (op.op === 'move') {
      if (op.isToy) {
        toyApplyMoveCommit(_ydoc, findToy(_yToys, op.id), op.fromX, op.fromY);
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
  if (e.key === 'Escape') App.selectDrawing(null);
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
