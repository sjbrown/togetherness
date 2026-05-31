/**
 * app.js — crdt-svg application bus
 *
 * The only module that imports from all others. Owns no mode directly;
 * instead it wires the four layers together through a narrow, typed interface.
 *
 * Roles:
 *   - Initialise all modules and inject this bus object as their sole dependency
 *   - Translate canvas events → CRDT writes (via shapes.js)
 *   - Translate CRDT/awareness changes → render calls
 *   - Answer read queries from ui.js and overlay.js
 *   - Maintain the undo stack (since it spans canvas + shapes)
 *
 * Import order:  icons → shapes → overlay → canvas → ui → app
 *
 * Usage in index.html:
 *   <script type="module">
 *     import { boot } from '/app.js';
 *     boot(...)
 *   </script>
 */

import { initIcons }                              from './icons.js';
import { SHAPE_TYPES, addShape, deleteShape,
         findShape, selectionGeometry, listShapes } from './shapes.js';
import { TOOLS as TOY_TOOLS,
         TOY_TYPES, addToy, deleteToy,
         findToy, listToys, toyGeometry,
       }  from './toys.js';
import { SELECT_TOOL }                            from './tools-schema.js';
import { TOOLS as DRAW_TOOLS, LAYER as DRAW_LAYER }  from './tools-shapes.js';
import * as UI                                    from './ui.js';
import * as Canvas                                from './canvas.js';
import * as Overlay                               from './overlay.js';
import { entityGradient }            from './entity_gradient.js';


import * as Y from 'yjs';

const svgNS = 'http://www.w3.org/2000/svg'


// ── Internal app state ────────────────────────────────────────────────────────
let _ydoc, _yMeta, _yToys, _yToyMeta, _yDrawing, _yDrawingMeta, _awareness, _provider;
let _myId, _myGrad, _roomId;
let _svgEl;
let _selectedId   = null;
let _activeLayer  = 'drawing';
let _activeTool   = 'select';
let _offline      = false;
let _undoStack    = [];      // { op:'add'|'del'|'move', ...data }
let _historyLog   = [];      // { label } — human-readable, newest first

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
  const yMeta      = ydoc.getMap('meta');
  const yToys      = ydoc.getXmlFragment('toys');
  const yToyMeta   = ydoc.getMap('toyMeta');
  const yDrawing   = ydoc.getXmlFragment('shapes');
  const yDrawingMeta = ydoc.getMap('shapeMeta');
  return { ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta };
}

// ── Boot ──────────────────────────────────────────────────────────────────────
export function boot({ ydoc, yMeta, yToys, yToyMeta, yDrawing, yDrawingMeta, awareness, provider, myId, myGrad, roomId, svgElement }) {
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
  UI.setIdentity({ projectName: 'crdt-svg', userId: `me · ${myId.slice(0, 6)}`, roomId });

  // 5. Keyboard shortcuts
  window.addEventListener('keydown', onKeyDown);

  // 6. CRDT observers
  _yToys.observeDeep(onToysChanged); // deep edits possible, so observeDeep
  _yDrawing.observe(onDrawingChanged);
  _awareness.on('change', onPresenceChanged);

  // 7. Provider status
  const dot = document.getElementById('statusDot');
  if (dot) {
    _provider.on('synced', () => {
      dot.className = 'status-dot connected';
      UI.toast('Synced with peers');
      App.addLog('synced with peers', 'remote');
    });
    _provider.on('status', ({ connected }) => {
      dot.className = connected ? 'status-dot connected' : 'status-dot connecting';
    });
  }

  // 8. Initial render
  renderDoc();
  renderPresence();
}

// ── Render pipelines ──────────────────────────────────────────────────────────
function renderDoc() {
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

// Recursive SVG-aware mirror: Y.XmlElement tree → live SVG DOM.
// Used by BOTH layers — drawing shapes are just shallow trees, toys are deep.
// Note: Y.XmlElement.toDOM() builds HTML-namespaced nodes and would not
// render as SVG, so we mirror with createElementNS ourselves. <script> nodes
// are never mirrored into the live DOM (behaviour is the sandbox step, later).
function yXmlToDom(yNode) {
  if (yNode instanceof Y.XmlText) return document.createTextNode(yNode.toString())
  if (!(yNode instanceof Y.XmlElement)) return null
  if (yNode.nodeName === 'script') return null

  const el = document.createElementNS(svgNS, yNode.nodeName)
  const attrs = yNode.getAttributes()
  for (const k in attrs) {
    if (k === 'xlink:href') el.setAttributeNS(XLINK_NS, 'href', attrs[k])
    else                    el.setAttribute(k, attrs[k])
  }
  yNode.toArray().forEach(child => {
    const dom = yXmlToDom(child)
    if (dom) el.appendChild(dom)
  })
  return el
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

  listToys(_yToys, _yDrawingMeta).forEach(({ el: yEl, attrs }) => {
    const svgEl = yXmlToDom(yEl)
    const id = attrs.id;
    svgEl.setAttribute('data-yid', id);
    svgEl.style.cursor = 'grab';
    layer.appendChild(svgEl);
  });

  //Canvas.wireShapeClicks(layer);
  wireLowLevelEvents()

  const countEl = document.getElementById('toyCount');
  if (countEl) countEl.textContent = _yToys.length;
  renderDrawingList();
}

function renderDrawingLayer() {
  const layer = _svgEl.querySelector('#drawing-layer');
  if (!layer) return;
  layer.innerHTML = '';

  listShapes(_yDrawing, _yDrawingMeta, { newestFirst: false }).forEach(({ el: yEl, id, toyType, meta }) => {
    const svgEl = yXmlToDom(yEl)
    svgEl.setAttribute('data-yid', id);
    svgEl.setAttribute('data-toy-type', toyType);
    svgEl.style.cursor = 'pointer';
    layer.appendChild(svgEl);
  });

  Canvas.wireShapeClicks(layer);

  const countEl = document.getElementById('shapeCount');
  if (countEl) countEl.textContent = _yDrawing.length;
  renderDrawingList();
}

function renderDrawingList() {
  const list = document.getElementById('shapeList');
  if (!list) return;
  list.innerHTML = '';
  listShapes(_yDrawing, _yDrawingMeta, { newestFirst: true }).forEach(({ attrs, meta }) => {
    const id     = attrs.id;
    const def    = SHAPE_TYPES[meta?.type ?? attrs['data-type']] ?? SHAPE_TYPES.rect;
    const item   = document.createElement('div');
    const author = meta?.author;
    item.className  = 'shape-item' + (_selectedId === id ? ' selected' : '');
    item.dataset.id = id;
    const sw = document.createElement('div');
    sw.className        = 'shape-swatch';
    sw.style.background = attrs.fill;
    const lbl = document.createElement('div');
    lbl.className   = 'shape-label';
    lbl.textContent = def.label(attrs);
    const own = document.createElement('div');
    own.className   = 'shape-owner';
    own.textContent = author === _myId ? 'me' : (author?.slice(0, 5) ?? '?');
    own.style.color = author === _myId ? 'var(--primary)' : 'var(--text-3)';
    const del = document.createElement('button');
    del.className   = 'shape-del';
    del.textContent = '×';
    del.addEventListener('click', ev => { ev.stopPropagation(); App.deleteShape(id); });
    item.append(sw, lbl, own, del);
    item.addEventListener('click', () => App.selectShape(id));
    list.appendChild(item);
  });
}

function updatePeerCount() {
  let peers = 0;
  _awareness.getStates().forEach((_, cid) => { if (cid !== _awareness.clientID) peers++; });
  const el = document.getElementById('peerCount');
  if (el) el.textContent = peers;
}

function wireLowLevelEvents() {
  console.log(_activeTool);
  console.log(App.getActiveLayer());
}

// ── CRDT observers ────────────────────────────────────────────────────────────
function onToysChanged(event, transaction) {
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
            addHistory(msg, {fill: yEl.getAttribute('fill'), shapeType: yEl.nodeName,})
          }
        })
      })
      event.changes.deleted.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!yEl.getAttribute) return;
          let msg = `remote deleted a toy ${yEl.nodeName}`;
          addHistory(msg, {
            fill: yEl.getAttribute('fill'), shapeType: yEl.nodeName,
          });
          App.addLog(msg, 'del');
        });
      });
    }
  }
  renderDoc();
}
function onDrawingChanged(event) {
  event.changes.added.forEach(item => {
    item.content.getContent().forEach(yEl => {
      if (!yEl.getAttribute) return;
      const id     = yEl.getAttribute('id') ?? '?';
      const meta   = _yDrawingMeta.get(id);
      const author = meta?.author;
      if (author && author !== _myId) {
        addHistory(`remote: added ${id.slice(0, 6)} by ${(author ?? '?').slice(0, 5)}`, {
          fill: yEl.getAttribute('fill'), shapeType: yEl.nodeName,
        });
        let msg = `${(author ?? '?').slice(0, 5)} added ${yEl.nodeName}`;
        App.addLog(msg, 'remote');
      }
    });
  });
  event.changes.deleted.forEach(item => {
    item.content.getContent().forEach(yEl => {
      if (!yEl.getAttribute) return;
      addHistory(`remote: deleted ${(yEl.getAttribute('id') ?? '?').slice(0, 6)}`, {
        fill: yEl.getAttribute('fill'), shapeType: yEl.nodeName,
      });
      let msg = `remote deleted ${yEl.nodeName}`;
      App.addLog(msg, 'remote');
    });
  });
  renderDoc();
}

function onPresenceChanged() {
  renderPresence();
  UI.updatePeersPanel();  // live-update peer list if panel is open
}

function layerForElement(el) {
  //TODO
  return 'drawing';
}

// ── App bus — the object passed to all modules ─────────────────────────────────
// Alphabetical within each group for easy scanning.
const App = {
  // ── Queries (ui.js, overlay.js read these) ─────────────────────────────────
  getActiveLayer:  () => _activeLayer,
  getHistory:      () => _historyLog.slice(0, 20),
  getLayers:       () => _layerMeta.map(l => ({
    ...l,
    count: l.id === DRAW_LAYER ? listShapes(_yDrawing, _yDrawingMeta, {}).length
         : l.id === 'background' ? 1
         : 'TODO',
  })),
  getMyColor:      () => _myGrad.c1,
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
  getShapeBBox:    (id) => {
    let shapeEl = document.getElementById(id);
    let geo = layerForElement(shapeEl) === 'toy'
      ? toyGeometry(_yToys, id)
      : selectionGeometry(_yDrawing, id)
    if (!geo) return null;
    return { x: geo.x, y: geo.y, width: geo.width, height: geo.height };
  },
  getShapeGeom:    (id) => {
    //TODO: make this work for toys as well
    let shapeEl = document.getElementById(id);
    const attrs = shapeEl.getAttributes();
    return { x: +(attrs.x ?? attrs.cx ?? 0), y: +(attrs.y ?? attrs.cy ?? 0) };
  },
  getShapeList:    () => listShapes(_yDrawing, _yDrawingMeta, { newestFirst: false }).map(({ attrs, meta }) => ({
    id:     attrs.id,
    type:   meta?.type ?? 'rect',
    fill:   attrs.fill ?? '#888',
    author: meta?.author ?? '?',
  })),
  getViewScale:    () => Canvas.getView().scale,
  isOffline:       () => _offline,

  // ── Tool mutations (canvas.js calls back into ui.js via these) ────────────
  onToolChanged:   (t)  => UI.onToolChanged(t),
  onViewReset:     ()   => UI.toast('View reset'),
  requestContextMenu: (x, y, id) => UI.showPopover(x, y, id),

  // ── Selection ────────────────────────────────────────────────────────────
  selectShape: (id) => {
    _selectedId = id;
    _awareness.setLocalStateField('selection', id ? { shapeId: id } : null);
    Overlay.setLocalSelection(id);
    const meta = id ? _yDrawingMeta.get(id) : null;
    UI.onSelectionChanged(id, meta);
    renderDrawingList();
  },

  // ── Document mutations ────────────────────────────────────────────────────
  commitShape: (attrs) => {
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    addShape(_ydoc, _yDrawing, _yDrawingMeta, { ...attrs, id, author: _myId });
    _undoStack.push({ op: 'add', id });
    addHistory(`added ${attrs.type ?? 'rect'} ${id.slice(0, 6)}`, {
      fill: attrs.fill, shapeType: attrs.type,
    });
    App.addLog(`added ${attrs.type} ${id.slice(0, 6)}`, 'local');
  },

  deleteShape: (id) => {
    const result = findShape(_yDrawing, id);
    if (!result) return;
    const snap = result.el.getAttributes();
    _undoStack.push({ op: 'del', attrs: snap, meta: _yDrawingMeta.get(id) });
    deleteShape(_ydoc, _yDrawing, _yDrawingMeta, id);
    if (_selectedId === id) App.selectShape(null);
    addHistory(`deleted ${id.slice(0, 6)}`, { fill: snap.fill, shapeType: result.el.nodeName });
    App.addLog(`deleted ${id.slice(0, 6)}`, 'local');
  },

  deleteSelected:   () => { if (_selectedId) App.deleteShape(_selectedId); },
  duplicateSelected: () => {
    if (!_selectedId) return;
    const result = findShape(_yDrawing, _selectedId);
    if (!result) return;
    const attrs = result.el.getAttributes();
    const def   = SHAPE_TYPES[result.el.nodeName];
    if (!def) return;
    const offset = { x: +(attrs.x ?? attrs.cx ?? 0) + 22, y: +(attrs.y ?? attrs.cy ?? 0) + 22 };
    const geom   = def.tag === 'rect'
      ? { x: offset.x, y: offset.y, width: +attrs.width, height: +attrs.height }
      : { cx: offset.x, cy: offset.y, r: +attrs.r };
    App.commitShape({ type: result.el.nodeName, ...geom, fill: attrs.fill, stroke: attrs.stroke, 'stroke-width': attrs['stroke-width'], opacity: attrs.opacity });
  },

  moveShape: (id, x, y) => {
    const result = findShape(_yDrawing, id);
    if (!result) return;
    _ydoc.transact(() => {
      if (result.el.nodeName === 'rect') {
        result.el.setAttribute('x', String(Math.round(x)));
        result.el.setAttribute('y', String(Math.round(y)));
      } else {
        result.el.setAttribute('cx', String(Math.round(x)));
        result.el.setAttribute('cy', String(Math.round(y)));
      }
    });
    // Live re-render without waiting for observer (smoother drag)
    const domEl = _svgEl.querySelector(`[data-yid="${id}"]`);
    if (domEl) {
      if (result.el.nodeName === 'rect') { domEl.setAttribute('x', Math.round(x)); domEl.setAttribute('y', Math.round(y)); }
      else { domEl.setAttribute('cx', Math.round(x)); domEl.setAttribute('cy', Math.round(y)); }
    }
    Overlay.render();
  },

  bringToFront: () => {
    if (!_selectedId) return;
    const result = findShape(_yDrawing, _selectedId);
    if (!result) return;
    const { el: yEl, index } = result;
    _ydoc.transact(() => {
      _yDrawing.delete(index, 1);
      _yDrawing.insert(_yDrawing.length, [yEl]);
    });
    addHistory(`brought ${_selectedId.slice(0, 6)} to front`);
  },

  setShapeAttr: (id, key, value) => {
    const result = findShape(_yDrawing, id);
    if (!result) return;
    _ydoc.transact(() => result.el.setAttribute(key, String(value)));
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
    if (_selectedId) App.setShapeAttr(_selectedId, 'fill', c);
    Canvas.setParams(_toolParams[_activeTool] ?? {});
  },
  setToolParam: (toolName, key, value) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    p[key] = (typeof value === 'string' && value !== '' && !isNaN(value)) ? +value : value;
    if (toolName === _activeTool) Canvas.setParams(p);
    // Live-apply visual params to a current selection
    if (_selectedId && ['fill', 'strokeW', 'opacity'].includes(key)) {
      const svgKey = key === 'strokeW' ? 'stroke-width' : key;
      App.setShapeAttr(_selectedId, svgKey, p[key]);
    }
  },
  stepToolParam: (toolName, key, delta, min, max) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    const next = +( (p[key] ?? 0) + delta ).toFixed(2);
    p[key] = Math.max(min, Math.min(max, next));
    if (toolName === _activeTool) Canvas.setParams(p);
    if (_selectedId && ['strokeW', 'opacity'].includes(key)) {
      const svgKey = key === 'strokeW' ? 'stroke-width' : key;
      App.setShapeAttr(_selectedId, svgKey, p[key]);
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
      deleteShape(_ydoc, _yDrawing, _yDrawingMeta, op.id);
    } else if (op.op === 'del') {
      addShape(_ydoc, _yDrawing, _yDrawingMeta, { ...op.attrs, ...op.meta, id: op.attrs.id });
    }
    UI.toast('Undone');
  },
  exportSVG: () => UI.toast('SVG export — stub'),
  copyJSON:  () => UI.toast('JSON copy — stub'),
  importFile:() => UI.toast('Import — stub'),

  addLog: (msg, type='') => {
    const log   = document.getElementById('eventLog')
    if (log === null) return;
    const entry = document.createElement('div')
    entry.className   = `log-entry ${type}`
    entry.textContent = `${new Date().toISOString().slice(11,19)} ${msg}`
    if (type === 'local') entry.style.borderLeftColor = myGrad.c1
    log.prepend(entry)
    while (log.children.length > 40) log.lastChild.remove()
  },
};

// ── History log ───────────────────────────────────────────────────────────────
function addHistory(label, meta = {}) {
  _historyLog.unshift({ label, ts: Date.now(), fill: meta.fill, shapeType: meta.shapeType });
  if (_historyLog.length > 40) _historyLog.pop();
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────────
function onKeyDown(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'r' || e.key === 'R') App.setTool('rect');
  if (e.key === 'c' || e.key === 'C') App.setTool('circle');
  if (e.key === 's' || e.key === 'S') App.setTool('select');
  if (e.key === 'Escape') App.selectShape(null);
  if ((e.key === 'Delete' || e.key === 'Backspace') && _selectedId) App.deleteSelected();
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); App.undo(); }
}

export { App };
