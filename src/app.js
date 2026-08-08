/**
 * app.js — togetherness application bus
 *
 * The only module that imports from all others.
 * It wires the layers together through a narrow, typed interface.
 *
 * Roles:
 *   - Initialise all modules and inject this bus object as their sole dependency
 *   - Translate canvas events → CRDT writes
 *   - Translate CRDT/awareness changes → render calls
 *   - Answer read queries from ui.js and overlay.js
 *   - Maintain the undo stack (since it spans canvas + drawing layer)
 *
 * Usage in index.html:
 *   <script type="module">
 *     import { boot } from '/app.js';
 *     boot(...)
 *   </script>
 */

import { initIcons }                              from './icons.js';
import * as BounPos                               from './boun_pos.js';
import * as Drawing                               from './drawing.js';
import * as Toys                                  from './toys.js';
import { tablesAPI }                              from './tables.js';
import { getOps }                                 from './op_dag.js';
import * as Storage                               from './storage.js';
import { SELECT_TOOL }                            from './tools-schema.js';
import * as UI                                    from './ui.js';
import * as Canvas                                from './canvas.js';
import * as Overlay                               from './overlay.js';
import * as Delight                               from './delight.js';
import * as UndoRedo                              from './undo_redo.js';
import { entityGradient }            from './entity_gradient.js';
import { isElementHeldByOther, computeTickActions } from './soft-lock.js';


import * as Y from 'yjs';

// Diagnostic logging — opt-in via ?debug=1 in the URL
const DEBUG = typeof location !== 'undefined'
  && new URLSearchParams(location.search).get('debug') === '1';

const svgNS = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink';

const DEFAULT_BACKGROUNDS = [
  { label: 'Default',   url: 'img/bg_default.png',  width: 120, height: 120 },
  { label: 'Slate Hex',   url: 'img/bg_slatehex.png',  width: 1384, height: 998 },
  { label: 'Beige Hex',   url: 'img/bg_beigehex.png',  width: 815,  height: 718 },
  { label: 'Green Felt',  url: 'img/bg_greenfelt.png', width: 800,  height: 600 },
  { label: 'Iron Grid',   url: 'img/bg_irongrid.png',  width: 438,  height: 285 },
];


// ── Internal app state ────────────────────────────────────────────────────────
let _ydoc, _yMeta, _yDrawing,
    _yBounPos,
    _awareness, _provider;

// Layers — the canonical LayerAPI dispatch table, built once at boot() once
// the Yjs fragments exist. Maps the data-module value stamped on each
// rendered SVG element ('drawing'|'toys'|'boun_pos') to that layer's API:
// find/delete/getGeom/getAnchor/applyMoveCommit/getTtState/getTtStateSchema/
// edit/listData, plus applyTtState on drawing/boun_pos (toys.js's own
// applyTtState was dead code — removed). See moduleForElement() for the
// lookup key.
let _Layers = {};

// Per-layer visibility (local state, not synced).
const _layerVisibility = {
  'background':           true,
  'boundaries-positions': false,
  'toys':                 true,
  'drawing':              true,
};
let _myId, _myGrad, _tableId, _isCreator;
let _svgEl;
let _activeLayer  = 'toys';

// _myClaims is the single local SSOT for this client's committed selection.
//   { [elId: string]: number }   elId -> claim timestamp (ms)
//
// Membership (which elIds I hold) and recency (since when) together.
// Invariant: Object.keys(_myClaims) is always the held-id set
//
// All writes go through the helpers below, each of which ends in
// Overlay.localSelectionChanged + _broadcastSelection + UI.onSelectionChanged,
// so forgetting to broadcast is structurally impossible.
let _myClaims = {};

// ── Selection mutation helpers —

// Add elIds to the committed selection, stamping a fresh claim timestamp.
// Idempotent: re-claiming an already-held id just refreshes its timestamp.
function _claim(ids, ts = Date.now()) {
  for (const id of ids) _myClaims[id] = ts;
  _afterClaimsChanged();
}

// Remove specific elIds from the committed selection.
function _unclaim(ids) {
  for (const id of ids) delete _myClaims[id];
  _afterClaimsChanged();
}

// Clear the committed selection entirely.
function _clearClaims() {
  _myClaims = {};
  _afterClaimsChanged();
}

// Called by every mutation helper after _myClaims has been updated.
// Order matters: local SelectionMode must be updated BEFORE broadcasting,
// because setLocalStateField fires 'change' synchronously, which can trigger
// syncFromAwareness before this function returns. If a stale 'local' entry
// for a just-released elId is still present at that moment, overlay's
// local-takes-precedence guard will skip assigning 'remote' to it — and
// nothing afterward re-triggers that decision, leaving the elId with no
// SelectionMode entry at all. See overlay.js for the guard.
function _afterClaimsChanged() {
  const claimedSet = new Set(Object.keys(_myClaims));
  Overlay.localSelectionChanged(claimedSet);
  // Resize mode only makes sense while its own id is the sole selection —
  // Checked here rather than at each individual call site so this
  // invariant can't be forgotten.
  if (_resizeModeId && !(claimedSet.size === 1 && claimedSet.has(_resizeModeId))) {
    _exitResizeModeInternal();
  } else if (_resizeModeId) {
    // Still valid — reassert the 'resize' kind, since localSelectionChanged
    // just reset every claimed id back to 'local'.
    Overlay.setResizeMode(_resizeModeId, _resizeModeKind);
  }
  // Action-mode affordance (kebab + * icon squares) — like resize mode,
  // only makes sense for an exclusive single selection, but unlike resize
  // mode it doesn't require a second click: it's shown immediately
  // alongside the ordinary 'local' selection ring for any sole-selected
  // element whose LayerAPI.selectModes() includes 'action' (currently all
  // toys). Overlay itself hides it once that id enters 'resize'/'resize-r'.
  if (claimedSet.size === 1) {
    const [soleId] = claimedSet;
    const domEl = _svgEl.querySelector(`[data-id="${soleId}"]`);
    const mtype = moduleForElement(domEl);
    const modes = _Layers[mtype]?.selectModes?.(domEl) ?? [];
    Overlay.setActionAffordance(modes.includes('action') ? soleId : null);
  } else {
    Overlay.setActionAffordance(null);
  }
  _broadcastSelection();
  UI.onSelectionChanged(claimedSet);
}

// Broadcast the current _myClaims as this client's awareness `selection`
// field. Centralized so every call site broadcasts the same shape consistently.
function _broadcastSelection() {
  const keys = Object.keys(_myClaims);
  _awareness.setLocalStateField('selection', keys.length ? { ..._myClaims } : null);
}

// ── Resize mode ─────────────────────────────────────────────────────────────
// A per-client UI mode, orthogonal to _myClaims.
// Entered by clicking an already-sole-selected container a second time
// A single elId or null — resize only one object at a time.
// Broadcast via the awareness `mode` field: 'sel-resize'
let _resizeModeId = null;
let _resizeModeKind = 'resize'; // 'resize' (corner-drag) | 'resize-r' (single-handle radius-drag)

function _broadcastMode() {
  _awareness.setLocalStateField('mode', _resizeModeId ? (_resizeModeKind === 'resize-r' ? 'sel-resize-r' : 'sel-resize') : null);
}

// Shared by the public exitResizeMode() and _afterClaimsChanged's own
// invalidation check above — avoids exitResizeMode() re-deriving a claimedSet
// it already has, and keeps both paths' ordering (Overlay first, then
// broadcast) identical.
function _exitResizeModeInternal() {
  _resizeModeId = null;
  Overlay.setResizeMode(null);
  _broadcastMode();
}

// Soft-lock request state — this client's own outstanding acquisition bids,
// keyed by elId. Exists ONLY while actively trying to acquire an elId not
// yet in _myClaims; deleted the moment that bid resolves, win or lose.
//   { [elId: string]: number }  // elId -> request timestamp (ms)
let _pendingRequests = {};

// Broadcast the current _pendingRequests as this client's awareness
// `pendingRequests` field. Sibling to how `selection` is broadcast.
function _broadcastPendingRequests() {
  const keys = Object.keys(_pendingRequests);
  _awareness.setLocalStateField('pendingRequests', keys.length ? { ..._pendingRequests } : null);
}

// Soft-lock tick — periodically evaluates computeTickActions() and applies
// the result. Nothing is coordinated between clients; each client's tick
// independently recomputes the same facts from the same shared awareness
// state and the same REQUEST_WINDOW_MS deadline (see soft-lock.js).
const SOFT_LOCK_TICK_MS = 250;

// Minimum gap between claim-refresh broadcasts during a single drag
// gesture (App.move). Well under REQUEST_WINDOW_MS (3s), so a long drag
// always has a fresh-enough claim by the time any request's window could
// elapse, without broadcasting on every pointermove.
const CLAIM_REFRESH_THROTTLE_MS = 500;
let _softLockTickHandle = null;

function _softLockTick() {
  const { elIdsToAcquire, elIdsToDropRequest, elIdsToRelease } = computeTickActions({
    myClientId:      _awareness.clientID,
    awarenessStates: _awareness.getStates(),
    now:             Date.now(),
  });

  if (!elIdsToAcquire.length && !elIdsToDropRequest.length && !elIdsToRelease.length) return;

  for (const elId of elIdsToAcquire) {
    _myClaims[elId] = Date.now();           // promotion moment IS the claim
    delete _pendingRequests[elId];          // bid resolved — won
  }
  for (const elId of elIdsToDropRequest) {
    delete _pendingRequests[elId];          // bid resolved — lost
  }
  for (const elId of elIdsToRelease) {
    delete _myClaims[elId];
    delete _pendingRequests[elId]; // defensive; shouldn't normally exist for a held elId
  }

  // _afterClaimsChanged handles localSelectionChanged + broadcast + UI notify
  // with the correct pre-broadcast ordering (see comment on _afterClaimsChanged).
  _afterClaimsChanged();
  _broadcastPendingRequests();
}

// Returns the single selected id, or null if zero or more than one are selected.
// Callers that need to work on a single element must check
// this returns non-null before proceeding
function _singleSelectedId() {
  const ids = Object.keys(_myClaims);
  return ids.length === 1 ? ids[0] : null;
}
let _activeTool   = 'select';
let _offline      = false;
let _historyLog   = [];      // { label } — human-readable, newest first
let _undoLog      = [];      // { label } — actions undone, newest first;
                              // shown near the Redo button, separate from
                              // _historyLog per the panel's own layout.

// Active drag — set by App.startDrag, cleared by commitMove / cancelMove.
// Awareness state: drag: { elId, dx, dy }
// local awareness schema: { id, color, grad, cursor, selection, drag? }
// selection: { [elId: string]: number } | null  // elId -> claim timestamp (ms)
let _dragState    = null;    // { id, startX, startY, startBboxX, startBboxY,
                              //   boundsRects: [{x,y,w,h}]|null, lastValidX, lastValidY,
                              //   snapPoints: [{cx,cy,snapRadius}] } | null

// Active multi-element drag — set by App.startMultiDrag,
// cleared by commitMultiMove / cancelMultiMove.
// Awareness: multidrag: { elIds: [...], offsets: [{bboxX, bboxY}] }
// No boundary/snap constraints — those are per-toy and don't compose cleanly for a group.
let _multiDragState = null;  // { elements: [{ id, mtype, anchorX, anchorY, bboxX, bboxY }],
                             //   leaderEl, boundsRects, snapPoints,
                             //   lastValidDx, lastValidDy } | null

// Active corner-drag resize
// Only reachable while _resizeModeId === id and only ever for a container.
let _resizeState = null;    // { id, corner, startRect: {x,y,width,height},
                            //   lastRect: {x,y,width,height} } | null

// Which undo mechanism App.undo/App.redo should invoke: the toys op log
// (Toys.undoToyGesture) or the drawing/boundaries Y.UndoManager
// (UndoRedo.undo). Set at every commit callsite to whichever the action
// just performed actually touched.
// Switching the active layer clears the selection (App.setLayer), so a
// single gesture can never span both toys and drawing/boundaries.
// Defaults to 'toys' — on a session where nothing has happened yet,
// either mechanism reporting "nothing to undo" is equally correct, and
// toys is this app's primary domain.
let _lastActionScope = 'toys';   // 'toys' | 'draw_bounds'

// ── Tool registry ───────────────────────────────────────────────────────────
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
  { id: 'drawing',               label: 'Drawing',                iconId: 'layer-draw' },
];

function buildToolRegistry() {
  const register = (def) => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...(def.defaults ?? {}) };
  };
  register(SELECT_TOOL);
  _toolsByLayer['background'] = [SELECT_TOOL];
  const bounPosTools = Object.entries(BounPos.BOUNPOS_TYPES).map(([name, def]) => ({
    name,
    label:   def.label,
    layer:   'boundaries-positions',
    iconUrl: def.iconUrl,
  }));
  bounPosTools.forEach(def => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...BounPos.BOUNPOS_TYPES[def.name].schema.values };
  });
  _toolsByLayer['boundaries-positions'] = [SELECT_TOOL, ...bounPosTools];
  Toys.TOOLS.forEach(register);
  _toolsByLayer['toys'] = [SELECT_TOOL, ...Toys.TOOLS];
  const drawTools = Object.entries(Drawing.SHAPE_TYPES).map(([name, def]) => ({
    name,
    label:   def.schema.label,
    layer:   'drawing',
    iconUrl: def.iconUrl,
  }));
  drawTools.forEach(def => {
    _toolById[def.name] = def;
    const schema = Drawing.getTtStateSchema(def.name);
    _toolParams[def.name] = { ...schema };
  });
  _toolsByLayer['drawing'] = [SELECT_TOOL, ...drawTools];
}

// ── Boot ──────────────────────────────────────────────────────────────────────
export function boot({ ydoc, awareness, provider, myId, myGrad, tableId, isCreator = false, svgElement, displayName }) {
  _ydoc           = ydoc;
  _yMeta          = ydoc.getMap('meta');
  _yDrawing       = ydoc.getXmlFragment('drawing');
  _yBounPos       = ydoc.getXmlFragment('boundaries');
  _awareness  = awareness;
  _provider   = provider;
  _myId       = myId;
  _myGrad    = myGrad;
  _tableId    = tableId;
  _isCreator  = isCreator;
  _svgEl      = svgElement ?? document.querySelector('#stage svg') ?? document.getElementById('canvas');

  // Layers — the canonical LayerAPI dispatch table, keyed by the data-module
  // value app.js stamps on rendered SVG elements.
  _Layers = {
    'drawing':  Drawing.makeLayerAPI(_ydoc, _yDrawing),
    'toys':     Toys.makeLayerAPI(_ydoc, () => _svgEl.querySelector('#toys-layer'), _myId, tableId, isCreator),
    'boun_pos': BounPos.makeLayerAPI(_ydoc, _yBounPos),
  };

  // Icons — stamp symbols into DOM before anyone builds HTML
  initIcons();

  // Tool registry — assemble layer tool palettes from registries
  buildToolRegistry();

  // Overlay — needs App + SVG element
  Overlay.init(App, _svgEl);
  Overlay.setLocalGradient(_myGrad);

  // Delight (bowstring handle) — needs App + SVG element. Owns
  // #delight-layer, which is never wiped by Overlay.render().
  Delight.init(App, _svgEl);

  // Canvas — needs App + SVG element; attaches pointer listeners
  Canvas.init(App, _svgEl);

  // UI — needs App; attaches panel/menu/pill listeners
  UI.init(App);
  UI.setIdentity({ projectName: 'Togetherness Table', userId: displayName, tableId: tableId });

  // Keyboard shortcuts
  window.addEventListener('keydown', onKeyDown);

  // CRDT observers
  // Layers use observeDeep so attribute changes trigger renderDoc on
  // every client
  _yDrawing.observeDeep(onDrawingChanged);
  _yBounPos.observeDeep(onBounPosChanged);
  _yDrawing.observe(onDocChanged);
  _yBounPos.observe(onDocChanged);
  _yMeta.observe(onMetaChanged);
  getOps(_ydoc).observe(onOpsChanged);
  _awareness.on('change', onPresenceChanged);

  // Undo/redo — one UndoManager over drawing + boundaries. Toys undo is a
  // separate mechanism entirely; see undo_redo.js's module docstring and
  // App.undo/App.redo below.
  UndoRedo.init({
    ydoc:   _ydoc,
    scopes: [_yDrawing, _yBounPos],
    onApply: (kind, label) => {
      if (kind === 'undo') {
        addUndoHistory(label ? `undid: ${label}` : 'undid a change');
        UI.toast('Undone');
      } else {
        addHistory(label ? `redid: ${label}` : 'redid a change');
        UI.toast('Redone');
      }
    },
    onEmpty: (kind) => UI.toast(`Nothing to ${kind}`, 'warn'),
  });

  // Provider status
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
    if (!connected && _multiDragState) App.cancelMultiMove();
  });

  // Initial render
  renderDoc();
  renderPresence();

  // Reopen the panel wherever it was left
  // Must go after the render above: tabs read live doc-derived data
  UI.restorePanelState();

  // Soft-lock tick — see soft-lock.js / computeTickActions.
  _softLockTickHandle = setInterval(_softLockTick, SOFT_LOCK_TICK_MS);
}

// ── Render pipelines ──────────────────────────────────────────────────────────
/**
 * Extract toy class names from the toy's wrapper <g> and inner <svg>.
 * Returns a Set (empty if the toy has no classes).
 */
function getToyClasses(domEl) {
  if (moduleForElement(domEl) !== 'toys') return new Set();
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

function filterSnapPoints(domEl, snapPoints) {
  const toyClasses  = getToyClasses(domEl);
  const matchesSelf = function(snapPoint) {
    return domEl.getAttribute('data-id') === (snapPoint.ownerId)
  }
  const matchesName = function(snapPoint) {
    return toyClasses.has(snapPoint.name)
  }
  const anchorPoints = []
  for (const topToyEl of _svgEl.querySelectorAll('#toys-layer > [data-id]')) {
    anchorPoints.push(Toys.getAnchor(topToyEl))
  }
  const occupantExists = function(snapPoint) {
    return anchorPoints.some(a => a.x === snapPoint.cx && a.y === snapPoint.cy)
  }

  return snapPoints
    .filter(p => !occupantExists(p))
    .filter(p => !matchesSelf(p))
    .filter(p => matchesName(p))
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
  if (!layer) throw new Error("renderBounPosLayer: '#boundaries-positions-layer' not found in SVG document — malformed template?");
  _Layers.boun_pos.render(layer);
  Canvas.wireShapeClicks(layer);
}

function renderToysLayer() {
  const layer = _svgEl.querySelector('#toys-layer');
  if (!layer) throw new Error("renderToysLayer: '#toys-layer' not found in SVG document — malformed template?");
  _Layers.toys.render(layer);
  Canvas.wireShapeClicks(layer);
}

function renderDrawingLayer() {
  const layer = _svgEl.querySelector('#drawing-layer');
  if (!layer) throw new Error("renderDrawingLayer: '#drawing-layer' not found in SVG document — malformed template?");
  _Layers.drawing.render(layer);
  Canvas.wireShapeClicks(layer);
}

/**
 * A conflicting operation arrived. Every peer — bystander or not — ends
 * up viewing the leader (the session never "leaves" the shared table).
 * A peer who authored anything on the losing branch also gets it forked
 * into a separate table, so nothing is lost, and is shown the branch
 * dialog once that fork lands.
 */
function handleToyBranchConflict(tips) {
  const layer = _svgEl?.querySelector('#toys-layer');
  if (!layer) return;

  const joinSequence = tablesAPI.getJoinSequenceArray(_ydoc);
  const decision = Toys.resolveToyBranchConflict(_ydoc, tips, { authorId: _myId, joinSequence });

  Toys.adoptToyBranch(_ydoc, layer, decision.leader, _tableId);

  if (!decision.authoredSplitter) {
    addHistory('branch resolved (adopted shared history)', { elType: 'toys' });
    return;
  }

  addHistory("branch conflict — preserving your divergent work in a new table", { elType: 'toys' });
  const seed = Toys.buildToyForkSeed(_ydoc, decision.lca, decision.splitter,
    { authorId: decision.orderedIds[0], joinSequence });
  tablesAPI.forkLiveDoc(_ydoc, decision.orderedIds, seed)
    .then(forkedTableId => {
      tablesAPI.touchTableRecord(forkedTableId, { name: `${_tableId} (branch)` });
      UI.showBranchDialog(forkedTableId);
    })
    .catch(err => {
      console.error('[app] branch fork failed', err);
      UI.toast('Could not preserve your divergent work in a new table', 'warn');
    });
}

function onOpsChanged(evt, transaction) {
  if (transaction?.local) return;
  const layer = _svgEl?.querySelector('#toys-layer');
  if (!layer) return;

  // Gestures that are derived/internal, not independent peer intent — not
  // worth a log line (same spirit as the old Yjs-observer version only
  // logging structural top-level adds/deletes, but this covers every real
  // user gesture type generically instead of just placements/deletions).
  const SILENT_GESTURES = new Set(['checkpoint', 'contents_change', 'initialize']);
  const ops = getOps(_ydoc);
  for (const [opId, change] of evt.changes.keys) {
    if (change.action !== 'add') continue;
    const op = ops.get(opId);
    if (op && !SILENT_GESTURES.has(op.gesture)) {
      const msg = `remote: ${op.gesture}`;
      App.addLog(msg, 'remote');
      addHistory(msg, { elType: 'toys' });
    }
    const out = _Layers.toys.receive(layer, opId);
    if (out.result === 'received-conflict') {
      handleToyBranchConflict(out.tips);
    }
  }
  Overlay.render();
}


function updatePeerCount() {
  let peers = 0;
  _awareness.getStates().forEach((_, cid) => { if (cid !== _awareness.clientID) peers++; });
  const el = document.getElementById('peerCount');
  if (el) el.textContent = peers;
}

// ── CRDT observers ────────────────────────────────────────────────────────────
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
          addHistory(`remote: added ${id}`, {
            fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
          });
          App.addLog(`added ${yEl.nodeName}`, 'remote');
        });
      });
      event.changes.deleted.forEach(item => {
        item.content.getContent().forEach(yEl => {
          if (!yEl.getAttribute) return;
          addHistory(`remote: deleted ${(yEl.getAttribute('id') ?? '?')}`, {
            fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
          });
          App.addLog(`remote deleted ${yEl.nodeName}`, 'del');
        });
      });
    }
  }
  renderDoc();
}

function onPresenceChanged(changes, origin) {
  logAwarenessChange(changes, origin);
  renderPresence();
  UI.updatePeersPanel();
}

function logAwarenessChange({ added, updated, removed }, origin) {
  if (!DEBUG) return;
  const direction = origin === 'local' ? 'SEND' : 'RECV';
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm, for ordering when pasted
  const lines = [];

  for (const clientId of removed) {
    lines.push(`[awareness ${direction} ${ts}] client=${clientId} removed`);
  }
  for (const clientId of [...added, ...updated]) {
    const state = _awareness.getStates().get(clientId);
    // makes a single pre-stringified string, not an object
    // devtools renders object/array arguments as collapsed, clickable
    // trees, which makes copy/paste tedious (must expand-everything-by-hand).
    const payload = JSON.stringify({
      selection:       state?.selection ?? null,
      pendingRequests: state?.pendingRequests ?? null,
      drag:            state?.drag ?? null,
    });
    lines.push(`[awareness ${direction} ${ts}] client=${clientId} ${payload}`);
  }
  if (lines.length) console.log(lines.join('\n'));
}

const LAYER_ID_TO_MODULE = {
  'drawing':               'drawing',
  'toys':                  'toys',
  'boundaries-positions':  'boun_pos',
};

function moduleForElement(el) {
  return el?.getAttribute?.('data-module') ?? null;
}

// ── App bus — the object passed to all modules ───────────────────────────────
const App = {
  // ── Queries (ui.js, overlay.js read these) ─────────────────────────────────
  getActiveLayer:  () => _activeLayer,
  getHistory:      () => _historyLog.slice(0, 20),
  getUndoHistory:  () => _undoLog.slice(0, 20),
  getLayers:       () => _layerMeta.map(l => ({
    ...l,
    visible: _layerVisibility[l.id] ?? true,
    count: l.id === 'background' ? 1 : (_Layers[LAYER_ID_TO_MODULE[l.id]]?.listData().length ?? 0),
  })),
  getMyColor:      () => _myGrad.c1,
  getMyGradient:   () => _myGrad,
  getMyId:         () => _myId,
  // ── Tool registry queries ──────────────────────────────────────────────────
  getTools:        (layer) => _toolsByLayer[layer] ?? [SELECT_TOOL],
  getTool:         (name)  => _toolById[name] ?? null,
  getToolOptions:  (name)  => _toolById[name]?.options ?? [],
  getToolParams:   (name)  => _toolParams[name] ?? {},
  // Returns the full ttStateSchema for a tool — for drawing tools this comes from
  // SHAPE_TYPES[name].schema; for other tools it falls back to a minimal schema
  // built from the tool def's options array.
  getToolSchema:   (name)  => {
    const drawSchema = Drawing.getTtStateSchema(name);
    if (drawSchema?.types) return drawSchema;
    if (BounPos.BOUNPOS_TYPES[name]) return BounPos.BOUNPOS_TYPES[name].schema;
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
      out.push({
        name:   state.id ?? String(cid),
        color:  state.color ?? '#888',
        gradId: state.grad ? Overlay.peerGradId(cid) : null,
        live:   true,
      });
    });
    return out;
  },
  getTableId:      () => _tableId,
  getSelectedIds:  () => Object.keys(_myClaims),
  getBBox:  (id) => {
    const svgEl = _svgEl.querySelector(`[data-id="${id}"]`);
    if (!svgEl) return null;
    const mtype = moduleForElement(svgEl);
    return _Layers[mtype]?.getGeom(svgEl) ?? null;
  },
  getAnchor: (svgEl) => {
    if (!svgEl) return { x: 0, y: 0 };
    const mtype = moduleForElement(svgEl);
    return _Layers[mtype]?.getAnchor(svgEl) ?? { x: 0, y: 0 };
  },
  getLayerObjects: (layerId) => _Layers[LAYER_ID_TO_MODULE[layerId]]?.listData() ?? [],
  // Return ids of objects on the active layer whose bbox is fully inside rect.
  // rect is canvas-space { x, y, width, height }.
  // Also updates overlay candidate rings as a side effect.
  getBoxCandidates: (rect) => {
    const objects = App.getLayerObjects(_activeLayer);
    const ids = objects
      .map(obj => ({ id: obj.id, bbox: App.getBBox(obj.id) }))
      .filter(({ bbox }) => {
        if (!bbox) return false;
        return (
          bbox.x >= rect.x &&
          bbox.y >= rect.y &&
          bbox.x + bbox.width  <= rect.x + rect.width &&
          bbox.y + bbox.height <= rect.y + rect.height
        );
      })
      // Rubber-band box-select can never invoke a soft-lock request — held
      // elements are silently excluded, as if they weren't swept at all.
      // (Shift-click is the only gesture that can request additions.)
      .filter(({ id }) => !App.isHeldByOther(id))
      .map(({ id }) => id);
    Overlay.setHoverCandidates(ids);
    return ids;
  },
  // Broadcast the current rubber-band candidate set via awareness.
  // Uses its own `candidates` awareness field, separate from `selection`,
  // so that committed holdings are never clobbered during a sweep
  broadcastCandidates: (ids) => {
    _awareness.setLocalStateField('candidates', ids.length ? ids : null);
  },
  // Clear rubber-band candidates from overlay and awareness (commit or cancel).
  clearBoxCandidates: () => {
    Overlay.clearHoverCandidates();
    _awareness.setLocalStateField('candidates', null);
  },
  getViewScale:    () => Canvas.getView().scale,
  isOffline:       () => _offline,

  // ── Tool mutations (canvas.js calls back into ui.js via these) ────────────
  onToolChanged:          (t)   => UI.onToolChanged(t),
  onViewReset:            ()    => UI.toast('View reset'),

  // ── Selection ────────────────────────────────────────────────────────────

  isHeldByOther: (id) => isElementHeldByOther(id, _awareness.getStates(), _awareness.clientID),

  // Advisory soft-lock request: write/refresh this client's own acquisition
  // entry for `id`. Per protocol, an acquirer's request is write-once — a
  // client cannot cancel or re-issue its own pending request once sent, so
  // this is a no-op if one is already outstanding for this id.
  requestElement: (id) => {
    if (_pendingRequests[id] != null) return;
    _pendingRequests[id] = Date.now();
    _broadcastPendingRequests();
  },

  // Refresh this client's claim timestamp for a single already-held elId,
  // without touching the rest of the current multi-selection.
  reassertClaim: (id) => {
    if (!(id in _myClaims)) return; // only meaningful if I already hold it
    _claim([id]);
  },

  select: (id) => {
    App.setTool('select');
    if (id && App.isHeldByOther(id)) {
      // Plain click on a held-by-other element is a request.
      // Shift wasn't held, so any selection I currently hold is cleared
      _clearClaims();
      App.requestElement(id);
      return;
    }
    if (id) {
      // select() is exclusive (single-select): replace the whole selection
      // with just this one id.
      // This also handles re-clicking a held-by-self element as rebuttal
      // gesture -- it gets a fresh timestamp from _claim()
      _myClaims = {};
      _claim([id]);
    } else {
      _clearClaims();
    }
  },

  // Toggle a single id in/out of the current selection.
  // If the result is N===0: deselect. N===1: single-select. N>1: multi-select.
  // Collapses back to single-select mode when size drops to 1.
  //
  // shift-clicking a held-by-other element queues a request for it
  // (App.requestElement), independent of and alongside whatever else is
  // already held-by-self or other pending requests.
  // Shift-clicking a held-by-self element is still a plain deselect toggle,
  // and is a no-op with respect to pendingRequests
  toggleSelection: (id) => {
    if (id in _myClaims) {
      _unclaim([id]);
    } else if (App.isHeldByOther(id)) {
      App.requestElement(id);
      return; // request queued; _myClaims untouched
    } else {
      _claim([id]);
    }
  },

  commitMultiSelect: ({ x, y, width, height, additive = false } = {}) => {
    const newIds = App.getBoxCandidates({ x, y, width, height });
    // additive: union with existing selection; otherwise replace
    const ids = additive
      ? [...new Set([...Object.keys(_myClaims), ...newIds])]
      : newIds;
    if (ids.length === 0) {
      App.select(null);
    } else if (ids.length === 1) {
      App.select(ids[0]);
    } else {
      // Preserve existing claim timestamps for any already-held.
      // Timestamp a fresh claim only for newly-added ones.
      const ts = Date.now();
      for (const id of ids) {
        if (!(id in _myClaims)) _myClaims[id] = ts;
      }
      // Drop any ids no longer in the new set (non-additive replace).
      for (const id of Object.keys(_myClaims)) {
        if (!ids.includes(id)) delete _myClaims[id];
      }
      _afterClaimsChanged();
    }
  },

  deleteMultiSelected: () => {
    const ids = Object.keys(_myClaims);
    if (ids.length === 0) return;

    // A selection can never span layers (App.setLayer clears claims on
    // switch), so every id here shares one mtype — resolve it from
    // whichever id happens to still exist in the DOM.
    const firstEl = ids.map(id => _svgEl.querySelector(`[data-id="${id}"]`)).find(Boolean);
    const mtype   = firstEl ? moduleForElement(firstEl) : null;

    let deleted = 0;
    if (mtype === 'toys') {
      _lastActionScope = 'toys';
      const layerEl = _svgEl.querySelector('#toys-layer');
      const op = layerEl ? Toys.deleteToysBatch(_ydoc, layerEl, ids, { authorId: _myId, tableId: _tableId }) : null;
      deleted = op ? ids.length : 0; // one op for the whole batch; exact per-id count isn't tracked separately
    } else {
      _lastActionScope = 'draw_bounds';
      UndoRedo.tag(`deleted ${ids.length} objects`);
      _ydoc.transact(() => {
        for (const id of ids) {
          const svgEl = _svgEl.querySelector(`[data-id="${id}"]`);
          if (!svgEl) continue;
          const L = _Layers[moduleForElement(svgEl)];
          if (!L) continue;
          const yEl = L.find(id);
          if (!yEl) continue;
          L.delete(id);
          deleted++;
        }
      });
    }

    if (deleted > 0) {
      addHistory(`deleted ${deleted} objects`);
      App.addLog(`deleted ${deleted} objects`, 'local');
    }
    _clearClaims();
    Overlay.clearHoverCandidates();
  },

  duplicateMultiSelected: () => {
    const ids = Object.keys(_myClaims);
    if (ids.length === 0) return;
    let added = 0;
    // The inner addDrawing transactions collapse into this outer one.
    _lastActionScope = 'draw_bounds';
    UndoRedo.tag(`duplicated ${ids.length} objects`);
    _ydoc.transact(() => {
      for (const id of ids) {
        const yEl = Drawing.findDrawing(_yDrawing, id);
        if (!yEl) continue;
        const attrs = yEl.getAttributes();
        const type  = yEl.nodeName;
        const newId = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
        const offset = { x: +(attrs.x ?? attrs.cx ?? 0) + 22, y: +(attrs.y ?? attrs.cy ?? 0) + 22 };
        const geom   = type === 'rect'
          ? { x: offset.x, y: offset.y, width: +attrs.width, height: +attrs.height }
          : { cx: offset.x, cy: offset.y, r: +attrs.r };
        Drawing.addDrawing(_ydoc, _yDrawing,
          { ...attrs, ...geom, type, id: newId });
        added++;
      }
    });
    if (added > 0) {
      addHistory(`duplicated ${added} objects`);
      App.addLog(`duplicated ${added} objects`, 'local');
    }
    _clearClaims();
  },

  // ── Document mutations ────────────────────────────────────────────────────
  commitDrawing: (attrs) => {
    const id = App.getMyId() + '_' + Math.random().toString(36).slice(2, 7);
    _lastActionScope = 'draw_bounds';
    UndoRedo.tag(`add ${attrs.type ?? 'rect'} ${id}`);
    Drawing.addDrawing(_ydoc, _yDrawing, { ...attrs, id });
    addHistory(`added ${attrs.type ?? 'rect'} ${id}`, {
      fill: attrs.fill, elType: attrs.type,
    });
    App.addLog(`added ${attrs.type} ${id}`, 'local');
  },

  commitBounPos: ({ toolName, x, y, w, h }) => {
    const def = BounPos.BOUNPOS_TYPES[toolName];
    if (!def) return;
    const { id, name } = def.newId();
    if (def.genType === null) {
      // boundary
      _lastActionScope = 'draw_bounds';
      UndoRedo.tag(`add ${def.label} ${name}`);
      def.create(_ydoc, _yBounPos, { id, name, x, y, w, h });
    } else {
      // pos-set
      const params   = App.getToolParams(toolName);
      console.log(params)
      const genType  = def.genType;
      const createParams = BounPos.toolParamsToCreateParams(genType, params, {x, y, w, h});
      if (createParams.circles.length === 0) return;
      _lastActionScope = 'draw_bounds';
      UndoRedo.tag(`add ${def.label} ${name}`);
      def.create(_ydoc, _yBounPos,
        {
          id, name, snapRadius: createParams.snapRadius, genType,
          xSpacing: createParams.xSpacing, ySpacing: createParams.ySpacing,
          x, y, w, h,
          circles: createParams.circles,
        }
      );
    }
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
    _svgEl?.querySelectorAll('[data-module="toys"]').forEach(g => {
      g.classList.forEach(c => classes.add(c));
      g.querySelector('svg')?.classList.forEach(c => classes.add(c));
    });
    return [...classes].sort();
  },

  /**
   * Return the ttStateSchema for the currently selected element, decorated
   * with `ltype` and `id`.  Returns null when nothing is selected.
   *
   * Delegates to the layer-scoped LayerAPI's getTtStateSchema(svgEl) so that
   * app.js stays ignorant of per-type field definitions.
   */
  getElementTtStateSchema: () => {
    const id = _singleSelectedId();
    if (!id) return null;
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl) return null;
    const mtype = moduleForElement(svgEl);
    const L = _Layers[mtype];
    if (!L) return null;
    const schema = L.getTtStateSchema(svgEl);
    return { ltype: mtype, ...schema, id };
  },

  /**
   * The ltype ('drawing' | 'toys' | 'boun_pos') of the sole selected
   * element, or null for zero/multi selections. Used by ui.js to decide
   * which pill actions apply (e.g. Duplicate is drawing-only).
   */
  getSelectedLtype: () => {
    const id = _singleSelectedId();
    if (!id) return null;
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    return svgEl ? moduleForElement(svgEl) : null;
  },

  /**
   * The selected toy's currently-applicable menu actions, as plain data for
   * the Edit panel to render as buttons — see toys.js's getMenuActions.
   * [] for non-toy selections, multi-selections, or nothing selected.
   */
  getToyMenuActions: () => {
    const id = _singleSelectedId();
    if (!id) return [];
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl || moduleForElement(svgEl) !== 'toys') return [];
    return Toys.getMenuActions(svgEl);
  },

  /**
   * Invoke one of a toy's menu actions by (namespace, key)
   * Runs the handler inside an envelope and commits its DOM mutations,
   * plus any triggered reactions, to Yjs as a single transaction.
   */
  invokeToyMenuAction: (id, namespace, key) => {
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl) return;
    const layerEl = _svgEl?.querySelector('#toys-layer');
    if (!layerEl) return;
    try {
      Toys.invokeMenuAction(_ydoc, layerEl, svgEl, namespace, key, undefined, _myId, _tableId);
      _lastActionScope = 'toys';
      // addHistory calls refreshFromDoc() itself — this was previously a
      // bare UI.refreshFromDoc() call with no addHistory, so a toy's own
      // menu actions (Roll, Turn Up, Roll All, ...) never appeared in the
      // history log at all, ever, regardless of which panel was open.
      addHistory(`${key} ${id}`, { elType: 'toys' });
    } catch (err) {
      UI.toast(`Action failed: ${err.message}`, 'warn');
      App.addLog(`toy action failed: ${err.message}`, 'del');
    }
  },

  /**
   * Apply a partial editData object to the selected element.
   * Dispatches to the appropriate layer's edit() function, which handles
   * the Yjs transaction.  App.commitEdit is the single entry point that
   * the Edit panel UI calls for all element mutations.
   */
  commitEdit: (id, editData) => {
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl) return;
    const mtype = moduleForElement(svgEl);
    const L = _Layers[mtype];
    if (L) L.edit(L.find(id), editData);
    // observeDeep fires synchronously
    // Refresh the Edit panel body to show the updated values.
    UI.refreshFromDoc();
  },

  /**
   * Place a toy on the table, then run its namespace(s)' initialize(elem)
   * hook exactly once
   */
  commitToy: (toolName, x, y) => {
    const def = _toolById[toolName];
    if (!def?.toyType) { UI.toast(`Unknown toy: ${toolName}`, 'warn'); return; }
    const id = Toys.newToyId();
    const layerEl = _svgEl?.querySelector('#toys-layer');
    if (!layerEl) return;
    // initializeToy below runs its own outer transact() with no
    // explicit origin, so its merged handler-plus-cascade transaction
    // commits under null — a separate transaction, and a separate
    // operation, from placement. Deliberate: initialize is its own
    // gesture, not part of "place".
    _lastActionScope = 'toys';
    Toys.placeToy(_ydoc, layerEl, {
      id, toyType: def.toyType, x, y,
      color: _toolParams[toolName]?.fill ?? _myGrad.c1,
    }, { authorId: _myId, tableId: _tableId }).then(async () => {
      addHistory(`placed ${def.label} ${id}`, { elType: 'toy' });
      App.addLog(`placed ${def.label} ${id}`, 'local');

      // Awaiting activateToyScripts() here guarantees the namespace is actually
      // ready before initialize() reads it off window[namespace]. placeToy
      // already kicked this off; the promise is memoized, so this just
      // waits on the same one.
      await Toys.activateToyScripts(_ydoc, def.toyType);
      const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
      if (svgEl && layerEl) {
        Toys.initializeToy(_ydoc, layerEl, svgEl, def.toyType, _myId, _tableId);
      }
    }).catch(err => {
      UI.toast(`Failed to place ${def.label}`, 'warn');
      App.addLog(`place failed: ${err.message}`, 'del');
    });
  },

  deleteElement: (svgEl) => {
    const id    = svgEl.getAttribute('data-id');
    const mtype = moduleForElement(svgEl);
    const L = _Layers[mtype];
    if (!L) return false;
    const yEl = L.find(id);
    if (!yEl) return false;
    if (mtype === 'toys') _lastActionScope = 'toys';
    else { _lastActionScope = 'draw_bounds'; UndoRedo.tag(`delete ${mtype}:${id}`); }
    L.delete(id);
    addHistory(`deleted ${mtype}:${id}`);
    App.addLog(`deleted ${id}`, 'local');
    if (id in _myClaims) {
      _unclaim([id]);
    }
    return true;
  },

  deleteSelected: () => {
    const id = _singleSelectedId();
    if (!id) {
      if (Object.keys(_myClaims).length > 1) {
        UI.toast('Use Delete N for multi-selection', 'warn');
        console.error('deleteSelected called with multi-selection; use deleteMultiSelected');
      }
      return;
    }
    const svgEl = _svgEl.querySelector(`[data-id="${id}"]`);
    if (svgEl) App.deleteElement(svgEl);
  },
  duplicateSelected: () => {
    const id = _singleSelectedId();
    if (!id) {
      if (Object.keys(_myClaims).length > 1) {
        UI.toast('Use Duplicate N for multi-selection', 'warn');
        console.error('duplicateSelected called with multi-selection; use duplicateMultiSelected');
      }
      return;
    }
    const yEl = Drawing.findDrawing(_yDrawing, id);
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
    // Defense in depth: client should not be drag an element it doesn't
    // hold — the primary guard is in canvas.js (only calls startDrag when
    // select() actually succeeded), but a stray caller reaching this
    // directly should silently no-op rather than broadcast a bogus `drag`
    // awareness field for someone else's element.
    if (App.isHeldByOther(id)) return;
    const toysLayerEl = _svgEl.querySelector('#toys-layer');
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const anchor = App.getAnchor(domEl);
    const bbox = App.getBBox(id);
    const isToy = moduleForElement(domEl) === 'toys';
    const toyClasses  = getToyClasses(domEl);
    const boundsRects = isToy ? BounPos.computeBoundaryRects(_yBounPos, toyClasses, anchor) : null;
    const boundsSnap  = BounPos.getSnapPoints(_yBounPos);
    const toySnap     = Toys.getSnapPoints(toysLayerEl);
    const snapPoints  = filterSnapPoints(domEl, [...boundsSnap, ...toySnap]);
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

    // Throttled claim refresh: a drag that runs long enough to cross the
    // 3s request window should defend itself, the same way clicking a
    // multi-selected element does (App.reassertClaim)
    // select()/startDrag already stamp a fresh claim at the start
    // of the gesture, so this only matters for drags that outlast that —
    // throttled to avoid broadcasting on every pointermove
    const now = Date.now();
    if (now - (_dragState.lastClaimRefresh ?? 0) >= CLAIM_REFRESH_THROTTLE_MS) {
      _dragState.lastClaimRefresh = now;
      App.reassertClaim(id);
    }

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
    const snapped = findNearestSnap(rx, ry, _dragState.snapPoints);
    if (snapped) {
      const snapOk = !_dragState.boundsRects || _dragState.boundsRects.some(
        r => snapped.cx >= r.x && snapped.cx <= r.x + r.w &&
             snapped.cy >= r.y && snapped.cy <= r.y + r.h
      );
      if (snapOk) { rx = snapped.cx; ry = snapped.cy; }
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

    // Live drop-target affordance: re-hit-test on every move against the
    // *drop* position (rx, ry — already boundary/snap-validated above), not
    // the raw pointer, so the highlighted container always matches what
    // commitMove would actually reparent into.
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    if (moduleForElement(domEl) === 'toys') {
      const toysLayerEl = _svgEl.querySelector('#toys-layer');
      const dt = Toys.findDropTarget(toysLayerEl, id, rx, ry)
      Overlay.setDropTargetHover(dt)
    }
  },

  commitMove: (id, x, y) => {
    if (!_dragState) return;
    // If the drag was boundary-constrained or snap-enabled, the raw pointer
    // position may differ from the validated position — use the last position
    // accepted by move().
    const constrained = _dragState.boundsRects !== null || _dragState.snapPoints.length > 0;
    const rx = constrained ? _dragState.lastValidX : Math.round(x);
    const ry = constrained ? _dragState.lastValidY : Math.round(y);
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const mtype = moduleForElement(domEl);

    // Same hit-test move() used for the live hover highlight, run once more
    // against the final drop position
    const dropContainerId = mtype === 'toys'
      ? Toys.findDropTarget(_svgEl.querySelector('#toys-layer'), id, rx, ry)
      : null;

    Overlay.setDropTargetHover(null);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;

    if (dropContainerId) {
      // Drop into a container = reparent + reposition into it, plus its
      // own contents_change_handler reaction.
      _lastActionScope = 'toys';
      try {
        const layerEl = _svgEl.querySelector('#toys-layer');
        _ydoc.transact(() => {
          Toys.runGesture(_ydoc, layerEl, () => {
            Toys.reparentToyDom(layerEl, id, dropContainerId);
            const movedEl      = layerEl.querySelector(`[data-id="${id}"]`);
            const containerEl  = layerEl.querySelector(`[data-id="${dropContainerId}"]`);
            const containerGeom = containerEl && Toys.getGeom(containerEl);
            if (containerGeom) {
              Toys.applyMoveDom(movedEl, rx - containerGeom.x, ry - containerGeom.y);
            }
          }, {
            gesture: 'reparent', authorId: _myId, tableId: _tableId,
            positionEvents: Toys.departingPositionEvents(layerEl, domEl),
          });
        });
      } catch (err) {
        // a malformed container asset can reach here and throw.
        // Surface it, else the pointerup handler may crash silently mid-drag.
        UI.toast(`Could not move into container: ${err.message}`, 'warn');
        Overlay.endDragPlaceholder(id);
        return;
      }

      // Ghost ends after the commit, not before — see the comment on the
      // plain-move branch below for why.
      Overlay.endDragPlaceholder(id);

      // A toy landing inside a container leaves selection
      _clearClaims();

      // observeDeep fires and calls renderDoc() — same as the ordinary
      // move-commit path below.
      addHistory(`moved ${id} into a container`, {
        fill: domEl?.getAttribute('fill'),
        elType: mtype,
      });
      return;
    }

    if (mtype === 'toys') _lastActionScope = 'toys';
    else { _lastActionScope = 'draw_bounds'; UndoRedo.tag(`move ${id} → (${rx}, ${ry})`); }
    if (_Layers[mtype]) {
      _Layers[mtype].applyMoveCommit(_Layers[mtype].find(id), rx, ry);
      // observeDeep fires on all layers and calls renderDoc()
    }
    // Ghost ends after the commit: endDragPlaceholder's own render() paints
    // the selection ring from whatever the DOM currently shows.
    Overlay.endDragPlaceholder(id);
    addHistory(`moved ${id} → (${rx}, ${ry})`, {
      fill: domEl?.getAttribute('fill'),
      elType: mtype,
    });
  },

  cancelMove: () => {
    if (!_dragState) return;
    const id = _dragState.id;
    Overlay.endDragPlaceholder(id);
    Overlay.setDropTargetHover(null);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;
  },

  // ── Resize mode + resize gesture ──────────────────────────────────────────
  // enterResizeMode / exitResizeMode / getResizeModeId
  // click-to-select, click-again-to-resize toggle
  // getResizeCorner   — hit-test a canvas-space point against id's corner
  //                     handles; used by canvas.js on pointerdown to decide
  //                     whether a click on an already-resize-mode container
  //                     starts a resize gesture or falls through.
  // lifecycle: startResize/resize/commitResize/cancelResize

  enterResizeMode: (id) => {
    // Only an element that is already the client's own exclusive single
    // selection can enter resize mode — silently a no-op otherwise
    if (Object.keys(_myClaims).length !== 1 || !(id in _myClaims)) return;
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const mtype = moduleForElement(domEl);
    const modes = _Layers[mtype]?.selectModes?.(domEl) ?? [];
    const kind = modes.includes('resize') ? 'resize' : modes.includes('resize-r') ? 'resize-r' : null;
    if (!kind) return;
    _resizeModeId = id;
    _resizeModeKind = kind;
    Overlay.setResizeMode(id, kind);
    _broadcastMode();
  },

  exitResizeMode: () => {
    if (!_resizeModeId) return;
    _exitResizeModeInternal();
  },

  getResizeModeId: () => _resizeModeId,

  // ── Bowstring handle (delight.js) ─────────────────────────────────────────
  // The SE action square is a drag-to-fire control: click for the toy's
  // first menu action now, or pull it back and release for the same action
  // as a "charged" gesture. canvas.js calls startBowstringAt on pointerdown
  // ahead of ordinary hit-testing; if it takes, the pointer belongs to the
  // bowstring for the rest of the gesture.

  /**
   * Try to begin a bowstring gesture at a canvas-space point. Returns true
   * if the point landed on the affordance (and the gesture started), false
   * to let canvas.js fall through to normal hit-testing.
   */
  startBowstringAt: (e, canvasPoint) => {
    const id = _singleSelectedId();
    if (!id) return false;
    // Once this id is in resize/resize-r mode, its SE corner belongs to the
    // resize handle, not the bowstring — overlay.js stops drawing the action
    // square the moment resize mode is entered (see render()'s kind==='local'
    // guard), so the live gesture must decline the same way or it keeps
    // intercepting the corner that no longer visually shows it.
    if (_resizeModeId === id) return false;
    const domEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!domEl || moduleForElement(domEl) !== 'toys') return false;
    const modes = _Layers['toys']?.selectModes?.(domEl) ?? [];
    if (!modes.includes('action')) return false;
    const geo = App.getBBox(id);
    if (!geo) return false;
    if (!Delight.hitTestBowstring(geo, canvasPoint.x, canvasPoint.y, App.getViewScale())) return false;
    return Delight.startBowstring(id, e, _svgEl);
  },

  /**
   * Repaint the overlay. Called from delight.js's rAF loop so the bowstring
   * charge indicators keep advancing while the pointer holds still (heldMs
   * changes with no pointer event to hang a repaint off).
   */
  requestOverlayRender: () => Overlay.render(),

  /**
   * Broadcast (or clear) the local bowstring charge so peers can see someone
   * winding up. Pass null on release.
   *
   * Only `pull` travels. heldMs deliberately does NOT: it would need either
   * a constant stream of updates (the value changes with no pointer event)
   * or a shared wall clock (which peers don't have). Instead each receiver
   * times the fade from when IT first saw the charge appear — see
   * overlay.js's _remoteBowstrings. Costs a little network latency at the
   * start of the fade, buys immunity to clock skew.
   */
  broadcastBowstring: (payload) => {
    _awareness.setLocalStateField('bowstring', payload);
  },

  moveBowstring: (e, canvasPoint) => Delight.moveBowstring(e, canvasPoint),
  endBowstring:  (e)              => Delight.endBowstring(e),

  /**
   * Called by delight.js when a bowstring resolves — on click, or on the
   * far end of a charged pull's snap-back. Fires the toy's FIRST menu
   * action: getMenuActions preserves the namespace's own declaration order
   * (Object.entries over the menu object), so [0] is whatever the toy
   * author listed first, which is the convention for "the obvious thing to
   * do with this toy" (Roll, for a die).
   */
  fireBowstring: (id, { charged = false, pull = 0 } = {}) => {
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl) return;
    const actions = Toys.getMenuActions(svgEl);
    if (!actions.length) return;
    const { namespace, key } = actions[0];
    App.invokeToyMenuAction(id, namespace, key);
    App.addLog(`bowstring ${charged ? 'charged' : 'tap'} → ${key}`, 'local');
  },

  getResizeCorner: (id, cx, cy) => {
    if (_resizeModeId !== id) return null;
    const geo = App.getBBox(id);
    if (_resizeModeKind === 'resize-r') {
      return Overlay.hitTestResizeRHandle(geo, cx, cy, App.getViewScale()) ? 'r' : null;
    }
    return Overlay.hitTestResizeCorner(geo, cx, cy, App.getViewScale());
  },

  startResize: (id, corner) => {
    if (_resizeModeId !== id || App.isHeldByOther(id)) return;
    const bbox = App.getBBox(id);
    if (!bbox) return;
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const mtype = moduleForElement(domEl);
    _resizeState = { id, corner, mtype, kind: _resizeModeKind, startRect: { ...bbox }, lastRect: { ...bbox } };
    Overlay.startResizeGhost(id);
  },

  // Called on every pointermove during a resize drag; (px, py) is the raw
  // canvas-space pointer position — computeResizeRect (corner-drag) or
  // Drawing.computeResizeRadiusRect (single-handle radius-drag) does the math.
  resize: (id, corner, px, py) => {
    if (!_resizeState || _resizeState.id !== id) return;
    const rect = _resizeState.kind === 'resize-r'
      ? Drawing.computeResizeRadiusRect(_resizeState.startRect, px, py)
      : Toys.computeResizeRect(_resizeState.startRect, corner, px, py);
    _resizeState.lastRect = rect;
    Overlay.updateResizeGhost(id, rect.x, rect.y, rect.width, rect.height);
  },

  commitResize: (id, corner, px, py) => {
    if (!_resizeState || _resizeState.id !== id) return;
    const toRect = _resizeState.kind === 'resize-r'
      ? Drawing.computeResizeRadiusRect(_resizeState.startRect, px, py)
      : Toys.computeResizeRect(_resizeState.startRect, corner, px, py);
    const mtype    = _resizeState.mtype;
    _resizeState = null;

    const el = _Layers[mtype]?.find(id);
    _lastActionScope = mtype;
    _Layers[mtype]?.applyResize(el, toRect.x, toRect.y, toRect.width, toRect.height);
    // observeDeep fires and calls renderDoc()
    // Ghost ends after the commit — same reasoning as commitMove:
    // endResizeGhost's own render() paints the selection ring from
    // whatever the DOM currently shows, so it has to run after the real
    // size lands, not before.
    Overlay.endResizeGhost(id);
    addHistory(`resized ${id}`, { elType: mtype });
  },

  cancelResize: () => {
    if (!_resizeState) return;
    Overlay.endResizeGhost(_resizeState.id);
    _resizeState = null;
  },

  // ── Multi-element drag lifecycle ──────────────────────────────────────────
  // startMultiDrag  — called once on pointerdown with the canvas-space origin
  // moveMulti       — called on every pointermove with (ddx, ddy) offset from start
  // commitMultiMove — called on pointerup; writes all positions in one transaction
  // cancelMultiMove — called on pointercancel; reverts all ghosts, no Yjs write

  startMultiDrag: (originCanvas) => {
    const elements = Object.keys(_myClaims).map(id => {
      const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
      if (!domEl) return null;
      const anchor = App.getAnchor(domEl);
      const bbox   = App.getBBox(id);
      const mtype  = moduleForElement(domEl);
      return { id, mtype, anchorX: anchor.x, anchorY: anchor.y, bboxX: bbox.x, bboxY: bbox.y };
    }).filter(Boolean);

    // The anchor element is the one the pointer is over — its center drives
    // boundary / snap constraints. The group translates by the same (dx, dy)
    // that keeps the anchor element valid.
    // originCanvas.leaderId is set by canvas.js from the hitId at pointerdown.
    const leaderId  = originCanvas.leaderId;
    const leaderEl  = elements.find(e => e.id === leaderId) ?? elements[0];
    const anchorDom = _svgEl.querySelector(`[data-id="${leaderEl.id}"]`);
    const isToy     = leaderEl.mtype === 'toys';
    const toyClasses   = getToyClasses(anchorDom);
    const boundsRects  = isToy ? BounPos.computeBoundaryRects(_yBounPos, toyClasses, { x: leaderEl.anchorX, y: leaderEl.anchorY }) : null;
    const snapPoints   = BounPos.getSnapPoints(_yBounPos);

    _multiDragState = {
      elements,
      leaderEl,
      boundsRects,
      snapPoints,
      lastValidDx: 0,
      lastValidDy: 0,
    };

    for (const el of elements) Overlay.startDragPlaceholder(el.id);

    // Defend every element in the group, not just the one under the
    // pointer.  All of them are being "used".
    const claimNow = Date.now();
    for (const el of elements) _myClaims[el.id] = claimNow;
    _broadcastSelection();

    _awareness.setLocalStateField('multidrag', {
      elIds:   elements.map(e => e.id),
      offsets: elements.map(e => ({ bboxX: e.bboxX, bboxY: e.bboxY })),
    });
  },

  moveMulti: (ddx, ddy) => {
    if (!_multiDragState) return;
    const { elements, leaderEl, boundsRects, snapPoints } = _multiDragState;

    // Throttled claim refresh for the whole group
    // A drag long enough to outlast the 3s request window should keep
    // defending itself, without broadcasting on every pointermove.
    const now = Date.now();
    if (now - (_multiDragState.lastClaimRefresh ?? 0) >= CLAIM_REFRESH_THROTTLE_MS) {
      _multiDragState.lastClaimRefresh = now;
      for (const el of elements) _myClaims[el.id] = now;
      _broadcastSelection();
    }

    // Compute the candidate anchor position and apply constraints
    let rx = Math.round(leaderEl.anchorX + ddx);
    let ry = Math.round(leaderEl.anchorY + ddy);

    if (boundsRects !== null) {
      const inBounds = boundsRects.some(
        r => rx >= r.x && rx <= r.x + r.w && ry >= r.y && ry <= r.y + r.h
      );
      if (!inBounds) return;
    }

    const snapped = findNearestSnap(rx, ry, snapPoints);
    if (snapped) {
      const snapOk = !boundsRects || boundsRects.some(
        r => snapped.cx >= r.x && snapped.cx <= r.x + r.w &&
             snapped.cy >= r.y && snapped.cy <= r.y + r.h
      );
      if (snapOk) { rx = snapped.cx; ry = snapped.cy; }
    }

    // Derive actual (dx, dy) from the constrained anchor position
    const cdx = rx - leaderEl.anchorX;
    const cdy = ry - leaderEl.anchorY;
    _multiDragState.lastValidDx = cdx;
    _multiDragState.lastValidDy = cdy;

    for (const el of elements) {
      Overlay.updateLocalDragGhost(el.id, cdx, cdy);
    }
    _awareness.setLocalStateField('multidrag', {
      elIds:   elements.map(e => e.id),
      offsets: elements.map(e => ({ bboxX: e.bboxX + cdx, bboxY: e.bboxY + cdy })),
    });
  },

  commitMultiMove: (ddx, ddy) => {
    if (!_multiDragState) return;
    const { elements, boundsRects, snapPoints, lastValidDx, lastValidDy } = _multiDragState;

    _awareness.setLocalStateField('multidrag', null);

    // Use the last constrained (dx, dy) from moveMulti, falling back to
    // the raw offset only if no pointermove fired (immediate pointerup).
    const constrained = boundsRects !== null || snapPoints.length > 0;
    const fdx = constrained ? lastValidDx : Math.round(ddx);
    const fdy = constrained ? lastValidDy : Math.round(ddy);

    // A selection can never span layers (App.setLayer clears claims on
    // switch), so every element here shares one mtype.
    const mtype = elements[0]?.mtype;

    if (mtype === 'toys') {
      _lastActionScope = 'toys';
      const layerEl = _svgEl.querySelector('#toys-layer');
      if (layerEl) {
        const moves = elements.map(el => ({
          id: el.id, x: Math.round(el.anchorX + fdx), y: Math.round(el.anchorY + fdy),
        }));
        Toys.moveToysBatch(_ydoc, layerEl, moves, { authorId: _myId, tableId: _tableId });
      }
    } else {
      _lastActionScope = 'draw_bounds';
      // One transaction → one undo step for the whole group move
      UndoRedo.tag(`move ${elements.length} objects`);
      _ydoc.transact(() => {
        for (const el of elements) {
          const rx = Math.round(el.anchorX + fdx);
          const ry = Math.round(el.anchorY + fdy);
          const L = _Layers[el.mtype];
          if (L) L.applyMoveCommit(L.find(el.id), rx, ry);
        }
      });
    }

    // Ghosts end after the commit
    for (const el of elements) Overlay.endDragPlaceholder(el.id);

    // observeDeep on all layers and calls renderDoc()

    addHistory(`moved ${elements.length} objects`);
    App.addLog(`moved ${elements.length} objects`, 'local');
    _multiDragState = null;
  },

  cancelMultiMove: () => {
    if (!_multiDragState) return;
    for (const el of _multiDragState.elements) Overlay.endDragPlaceholder(el.id);
    _awareness.setLocalStateField('multidrag', null);
    _multiDragState = null;
  },

  // ── Tool selection + params (ui.js → app → canvas.js) ─────────────────────
  // setToolParam affects only _toolParams (defaults for the *next* object to
  // be added) — it never mutates the document or the current selection.
  // Live-editing an existing object goes through the Edit panel → commitEdit.
  setTool: (name) => {
    _activeTool = name;
    Canvas.setTool(name, _toolParams[name] ?? {});
    UI.onToolChanged(name);
  },
  setToolParam: (toolName, key, value) => {
    const p = _toolParams[toolName] ?? (_toolParams[toolName] = {});
    p[key] = (typeof value === 'string' && value !== '' && !isNaN(value)) ? +value : value;
    if (toolName === _activeTool) {
      Canvas.setParams(p);
    }
  },

  // ── Misc ─────────────────────────────────────────────────────────────────
  setLayer: (id) => {
    // Abandon any claims on the layer being left.
    // this makes it impossible to hold a mixed toys+drawing selection
    // That in turn is what lets undo stay one mechanism per action
    if (id !== _activeLayer) _clearClaims();
    _activeLayer = id;
    // Default to Select when changing layers (tools differ per layer)
    App.setTool('select');
    UI.toast(`Layer: ${id}`);
  },
  setOffline: (v)   => {
    _offline = v;
    if (v) {
      _provider?.disconnect();
      return;
    }
    _provider?.connect();
    // y-webrtc's Room.disconnect() calls removeAwarenessStates on this
    // client's OWN clientID — not just a "mark as gone" broadcast, but an
    // actual delete from awareness.states, so awareness.getLocalState()
    // returns null afterward. Awareness.setLocalStateField's own
    // implementation is `if (getLocalState() !== null) { ... }` — a
    // silent no-op otherwise. Every _broadcastSelection / _broadcastMode /
    // _broadcastPendingRequests call after this point would do nothing,
    // forever, with no error: peers stop seeing this client's selection
    // rings, and this client's own soft-lock requests never reach anyone
    // either, making a peer's hold look unbreakable from here.
    // A full setLocalState (not setLocalStateField) re-establishes the
    // entry, restoring whatever this client's current state actually is
    // rather than the boot-time blank one index.html set originally.
    _awareness?.setLocalState({
      id:              _myId,
      color:           _myGrad.c1,
      grad:            _myGrad,
      cursor:          null,
      selection:       Object.keys(_myClaims).length        ? { ..._myClaims }        : null,
      mode:            _resizeModeId ? (_resizeModeKind === 'resize-r' ? 'sel-resize-r' : 'sel-resize') : null,
      pendingRequests: Object.keys(_pendingRequests).length  ? { ..._pendingRequests }  : null,
    });
  },
  undo: () => {
    // A moved/resized/deleted toy's selRing is meaningless once the
    // gesture that put it there is undone
    _clearClaims();
    const tryToys = () => {
      const layer = _svgEl?.querySelector('#toys-layer');
      const op = layer ? Toys.undoToyGesture(_ydoc, layer, _tableId, _myId) : null;
      if (!op) return false;
      _lastActionScope = 'toys';
      addUndoHistory(`undid: ${describeToyGesture(op.gesture)}`);
      UI.toast('Undone');
      return true;
    };
    const tryDrawBounds = () => {
      if (!UndoRedo.canUndo()) return false; // avoid UndoRedo's own onEmpty toast on a fallback probe
      UndoRedo.undo();
      _lastActionScope = 'draw_bounds';
      return true;
    };
    const [primary, fallback] = _lastActionScope === 'draw_bounds'
      ? [tryDrawBounds, tryToys] : [tryToys, tryDrawBounds];
    if (primary() || fallback()) return;
    UI.toast('Nothing to undo', 'warn');
  },
  redo: () => {
    _clearClaims();
    const tryToys = () => {
      const layer = _svgEl?.querySelector('#toys-layer');
      const op = layer ? Toys.redoToyGesture(_ydoc, layer, _tableId, _myId) : null;
      if (!op) return false;
      _lastActionScope = 'toys';
      addHistory(`redid: ${describeToyGesture(op.gesture)}`);
      UI.toast('Redone');
      return true;
    };
    const tryDrawBounds = () => {
      if (!UndoRedo.canRedo()) return false;
      UndoRedo.redo();
      _lastActionScope = 'draw_bounds';
      return true;
    };
    const [primary, fallback] = _lastActionScope === 'draw_bounds'
      ? [tryDrawBounds, tryToys] : [tryToys, tryDrawBounds];
    if (primary() || fallback()) return;
    UI.toast('Nothing to redo', 'warn');
  },
  canUndo: () => Toys.canUndoToyGesture(_ydoc, _tableId, _myId) || UndoRedo.canUndo(),
  canRedo: () => Toys.canRedoToyGesture(_ydoc, _tableId, _myId) || UndoRedo.canRedo(),
  exportSVG: () => {
    const clone = Storage.buildExportSvg(_svgEl, _ydoc);
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const blob = new Blob([clone.outerHTML], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${_tableId}-${dateStr}.svg`;
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

      let result;
      _ydoc.transact(() => {
        result = Storage.populateFromSvgDoc(svgDoc.documentElement, _ydoc);
      });
      const { toyCount, drawCount, invalidToyEls, importedToyEls } = result;

      if (toyCount) {
        const layerEl = _svgEl.querySelector('#toys-layer');
        Toys.importToys(_ydoc, layerEl, importedToyEls, { authorId: _myId, tableId: _tableId });
      }

      if (invalidToyEls.length) {
        let errLayer = _svgEl.querySelector('#errors-layer');
        if (!errLayer) {
          errLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          errLayer.setAttribute('id', 'errors-layer');
          _svgEl.appendChild(errLayer);
        }
        invalidToyEls.forEach(el => errLayer.appendChild(document.importNode(el, true)));
      }

      const parts = [];
      if (toyCount)  parts.push(`${toyCount} toy${toyCount === 1 ? '' : 's'}`);
      if (drawCount) parts.push(`${drawCount} shape${drawCount === 1 ? '' : 's'}`);
      if (invalidToyEls.length) parts.push(`${invalidToyEls.length} invalid → errors layer`);
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
    width:  _yMeta.get('bg_width')  ?? 120,
    height: _yMeta.get('bg_height') ?? 120,
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

// A human-readable label for a toy operation's gesture, for undo/redo
// history + toast text. Toy ops don't carry a custom label the way
// UndoRedo.tag() gives drawing/boundaries actions — this is the toys-side
// equivalent, coarser but good enough for "undid: X" text.
function describeToyGesture(gesture) {
  if (gesture.startsWith('undo:')) return describeToyGesture(gesture.slice('undo:'.length));
  if (gesture.startsWith('redo:')) return describeToyGesture(gesture.slice('redo:'.length));
  if (gesture.startsWith('menu:')) return gesture.slice('menu:'.length);
  if (gesture === 'delete-batch') return 'delete';
  if (gesture === 'move-batch')   return 'move';
  return gesture; // move, resize, place, delete, reparent, edit, ...
}

function addHistory(label, meta = {}) {
  _historyLog.unshift({ label, ts: Date.now(), fill: meta.fill, elType: meta.elType });
  if (_historyLog.length > 40) _historyLog.pop();
  UI.refreshFromDoc();
}

// A separate log for undo actions, shown near the Redo button rather than
// in the main gesture history — an undo isn't itself a gesture the user
// asked the document to remember, it's the tool reversing one.
function addUndoHistory(label) {
  _undoLog.unshift({ label, ts: Date.now() });
  if (_undoLog.length > 40) _undoLog.pop();
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
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey) && e.shiftKey) { e.preventDefault(); App.redo(); return; }
  if ((e.key === 'y' || e.key === 'Y') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); App.redo(); return; }
  if ((e.key === 'z' || e.key === 'Z') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); App.undo(); }
}

function onMetaChanged() {
  renderBackgroundLayer();
  UI.refreshFromDoc();
}

function renderBackgroundLayer() {
  const layer = _svgEl.querySelector('#background-layer');
  if (!layer) throw new Error("renderBackgroundLayer: '#background-layer' not found in SVG document — malformed template?");
  layer.innerHTML = '';
  const url    = _yMeta.get('bg_url')    || 'img/bg_default.png';
  const width  = _yMeta.get('bg_width')  || 120;
  const height = _yMeta.get('bg_height') || 120;
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
  // The pattern was just rebuilt from scratch, so it has no patternTransform
  // yet — re-sync it to the current view so the tile doesn't jump to the
  // origin if the table is panned/zoomed when the background changes.
  Canvas.syncBackgroundTransform();
}


export { App };
