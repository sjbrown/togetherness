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
import * as Drawing                               from './drawing.js';
import * as Toys                                  from './toys.js';
import * as Storage                               from './storage.js';
import * as BounPos                               from './boun_pos.js';
import { SHAPE_TYPES }                            from './drawing.js';
import { TOOLS as TOY_TOOLS, addToy, findToy, newToyId,
         getMenuActions, activateToyScripts,
         findDropTarget, reparentToy } from './toys.js';
import { DERIVED_ORIGIN, LIFECYCLE_ORIGIN } from './envelope.js'
import { getReactionLog, scanForConflicts } from './conflict.js';
import { SELECT_TOOL }                            from './tools-schema.js';
import { BOUNPOS_TYPES,
         addPositionSet, createPositionSetElement,
         rectToPath, pathToRect,
         computeBoundaryRects,
         computePositionSnapPoints,
         computeMaxSnapRadius,
         gridFillExtent,
       } from './boun_pos.js';
import * as UI                                    from './ui.js';
import * as Canvas                                from './canvas.js';
import * as Overlay                               from './overlay.js';
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
let _ydoc, _yMeta, _yToys, _yDrawing,
    _yBounPos, _yReactionLog,
    _awareness, _provider;

// Layers — the canonical LayerAPI dispatch table, built once at boot() once
// the Yjs fragments exist. Maps the data-module value stamped on each
// rendered SVG element ('drawing'|'toys'|'boun_pos') to that layer's API:
// find/delete/getGeom/getAnchor/applyMoveCommit/getTtState/getTtStateSchema/
// applyTtState/edit/listData. See moduleForElement() for the lookup key.
let _Layers = {};

// Per-layer visibility (local state, not synced).
const _layerVisibility = {
  'background':           true,
  'boundaries-positions': false,
  'toys':                 true,
  'drawing':              true,
};
let _myId, _myGrad, _tableId;
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
    Overlay.setResizeMode(_resizeModeId);
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
// Entered by clicking an already-sole-selected tray a second time
// A single elId or null — resize only one object at a time.
// Broadcast via the awareness `mode` field: 'sel-resize'
let _resizeModeId = null;

function _broadcastMode() {
  _awareness.setLocalStateField('mode', _resizeModeId ? 'sel-resize' : null);
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
// Only reachable while _resizeModeId === id and only ever for a tray.
let _resizeState = null;    // { id, corner, startRect: {x,y,width,height},
                            //   lastRect: {x,y,width,height} } | null

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
  const bounPosTools = Object.entries(BOUNPOS_TYPES).map(([name, def]) => ({
    name,
    label:   def.label,
    layer:   'boundaries-positions',
    iconUrl: def.iconUrl,
  }));
  bounPosTools.forEach(def => {
    _toolById[def.name] = def;
    _toolParams[def.name] = { ...BOUNPOS_TYPES[def.name].schema.values };
  });
  _toolsByLayer['boundaries-positions'] = [SELECT_TOOL, ...bounPosTools];
  TOY_TOOLS.forEach(register);
  _toolsByLayer['toys'] = [SELECT_TOOL, ...TOY_TOOLS];
  const drawTools = Object.entries(SHAPE_TYPES).map(([name, def]) => ({
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
export function boot({ ydoc, awareness, provider, myId, myGrad, tableId, svgElement, displayName }) {
  _ydoc           = ydoc;
  _yMeta          = ydoc.getMap('meta');
  _yToys          = ydoc.getXmlFragment('toys');
  _yDrawing       = ydoc.getXmlFragment('drawing');
  _yBounPos       = ydoc.getXmlFragment('boundaries');
  _yReactionLog   = getReactionLog(ydoc);
  _awareness  = awareness;
  _provider   = provider;
  _myId       = myId;
  _myGrad    = myGrad;
  _tableId    = tableId;
  _svgEl      = svgElement ?? document.querySelector('#stage svg') ?? document.getElementById('canvas');

  // Layers — the canonical LayerAPI dispatch table, keyed by the data-module
  // value app.js stamps on rendered SVG elements.
  _Layers = {
    'drawing':  Drawing.makeLayerAPI(_ydoc, _yDrawing),
    'toys':     Toys.makeLayerAPI(_ydoc, _yToys),
    'boun_pos': BounPos.makeLayerAPI(_ydoc, _yBounPos),
  };

  // Icons — stamp symbols into DOM before anyone builds HTML
  initIcons();

  // Tool registry — assemble layer tool palettes from registries
  buildToolRegistry();

  // Overlay — needs App + SVG element
  Overlay.init(App, _svgEl);
  Overlay.setLocalGradient(_myGrad);

  // Canvas — needs App + SVG element; attaches pointer listeners
  Canvas.init(App, _svgEl);

  // UI — needs App; attaches panel/menu/pill listeners
  UI.init(App);
  UI.setIdentity({ projectName: 'togetherness', userId: displayName, tableId: tableId });

  // Keyboard shortcuts
  window.addEventListener('keydown', onKeyDown);

  // CRDT observers
  // Layers use observeDeep so attribute changes trigger renderDoc on
  // every client
  _yToys.observeDeep(onToysChanged);
  _yDrawing.observeDeep(onDrawingChanged);
  _yBounPos.observeDeep(onBounPosChanged);
  _yToys.observe(onDocChanged);
  _yDrawing.observe(onDocChanged);
  _yBounPos.observe(onDocChanged);
  _yReactionLog.observe(onReactionLogChanged);
  _yMeta.observe(onMetaChanged);
  _awareness.on('change', onPresenceChanged);

  // Undo/redo — one UndoManager over the three element fragments.
  UndoRedo.init({
    ydoc:   _ydoc,
    scopes: [_yToys, _yDrawing, _yBounPos],
    onApply: (kind, label) => {
      const verb = kind === 'undo' ? 'undid' : 'redid';
      addHistory(label ? `${verb}: ${label}` : `${verb} a change`);
      UI.toast(kind === 'undo' ? 'Undone' : 'Redone');
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

  // Soft-lock tick — see soft-lock.js / computeTickActions.
  _softLockTickHandle = setInterval(_softLockTick, SOFT_LOCK_TICK_MS);
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
  if (!layer) throw new Error("renderBounPosLayer: '#boundaries-positions-layer' not found in SVG document — malformed template?");
  _Layers.boun_pos.render(layer);
  Canvas.wireShapeClicks(layer);
}

// Toys layer — mirror each <g> wrapper (and its embedded <svg> sub-document).
// mousedown selects the toy and begins a drag (toys mode only — the layer's
// pointer-events are gated by setMode). Movement is applied to the DOM live and
// committed to the CRDT on drop (see the window mouseup handler).
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

// Suppresses the observer-driven cascade in onToysChanged while a cascade is
// already being handled for the current change.
let _dispatchingContentsChange = false;

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
  // renderDoc() runs *before* the dispatchContentsChangeCascade below.
  // contents_change_handler reads the *DOM*, so the toys layer must
  // already reflect this transaction's just-committed change (eg a mutation
  // to a die inside .contents_group after a reparentToy)
  // before the handler runs
  renderDoc();
  // Derived contents_change: a local change touched inside a tray's
  // .contents_group -- recompute that tray's own derived display.
  //
  // Skipped for:
  //  - remote-origin changes: the *originator* computes; the result syncs
  //    as data (a peer never recomputes in reaction to a remote change).
  //  - DERIVED/LIFECYCLE origins: these ARE cascade output (or a toy's
  //    one-time initialize), never independent intent, so they must not
  //    trigger another cascade. Gating on origin (not just the
  //    _dispatchingContentsChange flag) keeps this correct now that the
  //    cascade runs synchronously: a DERIVED commit made from an observer
  //    lands in its own transaction whose observer fires AFTER the flag has
  //    already been cleared, so the flag alone would no longer catch it.
  //  - _dispatchingContentsChange: the drop-into-tray path (commitMove)
  //    folds its own reaction into the placement transaction and sets this
  //    flag so the observer doesn't recompute it a second time.
  const isCascadeResult =
    transaction.origin === DERIVED_ORIGIN || transaction.origin === LIFECYCLE_ORIGIN;
  if (transaction.local && !isCascadeResult && !_dispatchingContentsChange) {
    dispatchContentsChangeCascade(events);
  }
}

// Local transaction (not itself a cascade result) touched something inside a
// tray's .contents_group? Recompute every affected tray's own
// contents_change_handler, innermost first, so outer trays read their inner
// trays' fresh results. Computed as one upfront pass over *this* transaction's
// events, so a single die roll inside a doubly-nested tray resolves in one go.
//
// This runs synchronously, with no microtask hop, which matters when this
// is reached from *inside* an open transaction (a caller that folds its own
// commit and its reaction together, mid-transact) — then the cascade's
// commits fold in too. Reached instead from the observer, after the
// triggering transaction has already closed (the common case: a remote
// change, or any local change nothing folded ahead of time), each handler
// commits as its own DERIVED transaction. The _dispatchingContentsChange
// flag guards a folded caller's own transaction from being recomputed a
// redundant second time once its observer fires; the origin check in
// onToysChanged handles the DERIVED commits this function itself makes.
function dispatchContentsChangeCascade(events) {
  const trayIds = Toys.affectedTrayIdsInnerFirst(events.map(e => e.target));
  if (!trayIds.length) return;

  const layerEl = _svgEl.querySelector('#toys-layer');
  _dispatchingContentsChange = true;
  try {
    Toys.runContentsChangeCascadeSync(_ydoc, _yToys, layerEl, trayIds);
  } catch (err) {
    console.error('[app] contents_change_handler dispatch failed', err);
  } finally {
    _dispatchingContentsChange = false;
  }
}

// Post-merge overlap scan.
// _yReactionLog gains a new entry every time a qualifying envelope commits
// whether ours (this transaction) or a remote peer's.
// Then this observer fires, scanning the rest of the log for any bundles with:
//  - causally-concurrent author
//  - touched-set overlaps
//
// TODO: Detection only, for now: a hit is just logged (console + activity log)
//       Need to resolve a detected conflict
//        ((fast-path in-place assertion, or branch escalation)
function onReactionLogChanged(event, transaction) {
  const added = [];
  event.changes.added.forEach(item => {
    item.content.getContent().forEach(bundle => added.push(bundle));
  });
  if (!added.length) return;

  const all = _yReactionLog.toArray();
  for (const bundle of added) {
    const conflicts = scanForConflicts(all, bundle);
    for (const other of conflicts) {
      const msg = `conflict detected: ${bundle.touched.length + other.touched.length} touched node(s) written concurrently by peers ${bundle.clientID} and ${other.clientID}`;
      console.warn('[conflict]', msg, { bundle, other });
      App.addLog(msg, 'remote');
    }
  }
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
          addHistory(`remote: added ${id.slice(0, 9)}`, {
            fill: yEl.getAttribute('fill'), elType: yEl.nodeName,
          });
          App.addLog(`added ${yEl.nodeName}`, 'remote');
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

// Maps the panel layer id (as used in _layerMeta / getActiveLayer) to the
// data-module value stamped on rendered SVG elements and used as the key
// into _Layers. 'background' has no LayerAPI
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
      out.push({
        name:   state.id?.slice(0, 8) ?? String(cid),
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
  // so that committed holdings are never clobbered during a sweep — the
  // bug being fixed: if a pending request matured while a sweep was in
  // progress, resolveElementWinner saw no holder in `selection` and handed
  // the element to the requester despite it being actively held.
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
  requestContextMenu: (x, y, id) => UI.showPopover(x, y, id),

  // ── Selection ────────────────────────────────────────────────────────────

  // True if elId is currently held by some other peer's committed selection.
  // Thin wrapper over soft-lock.js so callers here don't reach into
  // _awareness directly.
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
    let deleted = 0;
    UndoRedo.tag(`deleted ${ids.length} objects`);
    _ydoc.transact(() => {
      for (const id of ids) {
        const svgEl = _svgEl.querySelector(`[data-id="${id}"]`);
        if (!svgEl) continue;
        const mtype = moduleForElement(svgEl);
        const L = _Layers[mtype];
        if (!L) continue;
        const yEl = L.find(id);
        if (!yEl) continue;
        L.delete(id);
        deleted++;
      }
    });
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
    UndoRedo.tag(`add ${attrs.type ?? 'rect'} ${id.slice(0, 6)}`);
    Drawing.addDrawing(_ydoc, _yDrawing, { ...attrs, id });
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
      UndoRedo.tag(`add ${def.label} ${name}`);
      def.create(_ydoc, _yBounPos, { id, name, x, y, w, h });
    } else {
      // pos-set
      const params   = App.getToolParams(toolName);
      const genType  = def.genType;
      const genParam = genType === 'hex' ? (params['hex-size'] ?? 40) : (params['spacing'] ?? 80);
      const rawRadius  = params['snapRadius'] ?? 30;
      const snapRadius = Math.min(rawRadius, computeMaxSnapRadius(genType, genParam));
      const circles    = gridFillExtent(x, y, w, h, genType, genParam);
      if (circles.length === 0) return;   // nothing tagged yet — no dangling label
      UndoRedo.tag(`add ${def.label} ${name}`);
      def.create(_ydoc, _yBounPos,
        { id, name, snapRadius, genType, genParam, x, y, w, h, circles });
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
   * The selected toy's currently-applicable menu actions, as plain data for
   * the Edit panel to render as buttons — see toys.js's getMenuActions.
   * [] for non-toy selections, multi-selections, or nothing selected.
   */
  getToyMenuActions: () => {
    const id = _singleSelectedId();
    if (!id) return [];
    const svgEl = _svgEl?.querySelector(`[data-id="${id}"]`);
    if (!svgEl || moduleForElement(svgEl) !== 'toys') return [];
    return getMenuActions(svgEl);
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
    // invokeMenuActionSync runs a complete contents_change_handler cascade
    // so guard with _dispatchingContentsChange
    _dispatchingContentsChange = true;
    try {
      Toys.invokeMenuActionSync(_ydoc, _yToys, layerEl, svgEl, namespace, key);
      // _yToys.observeDeep already re-renders the toys layer once that commit
      // lands; refreshFromDoc() here just keeps the Edit panel's own action
      // list current too
      UI.refreshFromDoc();
    } catch (err) {
      UI.toast(`Action failed: ${err.message}`, 'warn');
      App.addLog(`toy action failed: ${err.message}`, 'del');
    } finally {
      _dispatchingContentsChange = false;
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
    const id = newToyId();
    // Tag before addToy's placement transaction runs.
    // Later, initializeToySync()'s runs with its own outer transact()
    // that has no explicit origin, so its merged handler-plus-cascade
    // transaction commits under null, a SEPARATE transaction from
    // addToy's placement
    UndoRedo.tag(`place ${def.label} ${id.slice(0, 6)}`);
    addToy(_ydoc, _yToys, {
      id, toyType: def.toyType, x, y,
      color: _toolParams[toolName]?.fill ?? _myGrad.c1,
    }).then(async () => {
      addHistory(`placed ${def.label} ${id.slice(0, 6)}`, { elType: 'toy' });
      App.addLog(`placed ${def.label} ${id.slice(0, 6)}`, 'local');

      const yEl = findToy(_yToys, id);
      // Awaiting activateToyScripts() here guarantees the namespace is actually
      // ready before initialize() reads it off window[namespace].
      if (yEl) await activateToyScripts(yEl, def.toyType);
      const svgEl   = _svgEl?.querySelector(`[data-id="${id}"]`);
      const layerEl = _svgEl?.querySelector('#toys-layer');
      if (svgEl && layerEl) {
        // Same guard as invokeToyMenuAction, same reason: initializeToySync
        // already ran its own complete cascade before committing.
        _dispatchingContentsChange = true;
        try {
          Toys.initializeToySync(_ydoc, _yToys, layerEl, svgEl, def.toyType);
        } finally {
          _dispatchingContentsChange = false;
        }
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
    UndoRedo.tag(`delete ${mtype}:${id.slice(0, 6)}`);
    L.delete(id);
    addHistory(`deleted ${mtype}:${id.slice(0, 6)}`);
    App.addLog(`deleted ${id.slice(0, 6)}`, 'local');
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
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const anchor = App.getAnchor(domEl);
    const bbox = App.getBBox(id);
    const isToy = moduleForElement(domEl) === 'toys';
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

    // Throttled claim refresh: a drag that runs long enough to cross the
    // 3s request window should defend itself, the same way clicking a
    // multi-selected element does (App.reassertClaim) — actively dragging
    // something is at least as strong a signal of "I'm using this" as a
    // click. select()/startDrag already stamp a fresh claim at the start
    // of the gesture, so this only matters for drags that outlast that —
    // throttled to avoid broadcasting on every pointermove, which can fire
    // far more often than any request-arbitration decision needs.
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

    // Live drop-target affordance: re-hit-test on every move against the
    // *drop* position (rx, ry — already boundary/snap-validated above), not
    // the raw pointer, so the highlighted tray always matches what
    // commitMove would actually reparent into.
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    if (moduleForElement(domEl) === 'toys') {
      const toysLayerEl = _svgEl.querySelector('#toys-layer');
      const dt = findDropTarget(toysLayerEl, id, rx, ry)
      console.log(dt)
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
    const dropTrayId = mtype === 'toys'
      ? findDropTarget(_svgEl.querySelector('#toys-layer'), id, rx, ry)
      : null;

    // Ghost gone before bbox changes — prevents one-frame ghost "jitter"
    Overlay.endDragPlaceholder(id);
    Overlay.setDropTargetHover(null);
    _awareness.setLocalStateField('drag', null);
    _dragState = null;

    if (dropTrayId) {
      // Drop into a tray = reparent + reposition into the tray, plus the
      // tray's own contents_change_handler reaction — ALL in one transaction.
      // The inner reparentToy / applyMoveCommit transactions collapse into
      // this outer one, and so do the reaction's DERIVED commits, so the
      // placement and its reaction commit as one atomic unit: one undo step,
      // and one thing to arbitrate or fork on conflict, with no "die
      // inserted but its reaction lost" intermediate. _dispatchingContentsChange
      // stops the observer from recomputing this tray a redundant second
      // time after the txn closes.
      UndoRedo.tag(`move ${id.slice(0, 6)} into a tray`);
      _dispatchingContentsChange = true;
      try {
        _ydoc.transact((tr) => {
          const movedEl = reparentToy(_ydoc, _yToys, id, dropTrayId);
          const trayEl = _svgEl.querySelector(`[data-id="${dropTrayId}"]`);
          const trayGeom = trayEl && Toys.getGeom(trayEl);
          if (trayGeom) {
            Toys.applyMoveCommit(_ydoc, movedEl, rx - trayGeom.x, ry - trayGeom.y);
          }
          // Affected trays from THIS transaction's own change set,
          // snapshotted before the cascade so its writes don't feed back.
          // reparent's insert/delete land on pre-existing container nodes
          // (the tray's contents_group, the source fragment) — exactly what
          // tr.changed exposes here, enough for findAncestorTrayIds to
          // resolve every affected tray, nested ones included.
          const layerEl = _svgEl.querySelector('#toys-layer');
          const trayIds = Toys.affectedTrayIdsInnerFirst([...tr.changed.keys()]);
          Toys.runContentsChangeCascadeSync(_ydoc, _yToys, layerEl, trayIds);
        });
      } catch (err) {
        // a malformed tray asset can reach here and throw.
        // Surface it, else the pointerup handler may crash silently mid-drag.
        UI.toast(`Could not move into tray: ${err.message}`, 'warn');
        return;
      } finally {
        _dispatchingContentsChange = false;
      }

      // A toy landing inside a tray leaves it: selection doesn't carry
      // through a reparent, mirroring archive2025's own drop-into-tray
      // behavior.
      _clearClaims();

      // observeDeep fires and calls renderDoc() — same as the ordinary
      // move-commit path below.
      addHistory(`moved ${id.slice(0, 6)} into a tray`, {
        fill: domEl?.getAttribute('fill'),
        elType: mtype,
      });
      return;
    }

    UndoRedo.tag(`move ${id.slice(0, 6)} → (${rx}, ${ry})`);
    if (_Layers[mtype]) {
      _Layers[mtype].applyMoveCommit(_Layers[mtype].find(id), rx, ry);
      // observeDeep fires on all layers and calls renderDoc()
    }
    addHistory(`moved ${id.slice(0, 6)} → (${rx}, ${ry})`, {
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
  //                     whether a click on an already-resize-mode tray
  //                     starts a resize gesture or falls through.
  // lifecycle: startResize/resize/commitResize/cancelResize

  enterResizeMode: (id) => {
    // Only a toy that is already the client's own exclusive single selection
    // can enter resize mode — silently a no-op otherwise
    if (Object.keys(_myClaims).length !== 1 || !(id in _myClaims)) return;
    const domEl = _svgEl.querySelector(`[data-id="${id}"]`);
    const toyModes = Toys.selectModes(domEl)
    if (moduleForElement(domEl) !== 'toys' || !toyModes.includes('resize')) return;
    _resizeModeId = id;
    Overlay.setResizeMode(id);
    _broadcastMode();
  },

  exitResizeMode: () => {
    if (!_resizeModeId) return;
    _exitResizeModeInternal();
  },

  getResizeModeId: () => _resizeModeId,

  getResizeCorner: (id, cx, cy) => {
    if (_resizeModeId !== id) return null;
    return Overlay.hitTestResizeCorner(App.getBBox(id), cx, cy, App.getViewScale());
  },

  startResize: (id, corner) => {
    if (_resizeModeId !== id || App.isHeldByOther(id)) return;
    const bbox = App.getBBox(id);
    if (!bbox) return;
    _resizeState = { id, corner, startRect: { ...bbox }, lastRect: { ...bbox } };
    Overlay.startResizeGhost(id);
  },

  // Called on every pointermove during a resize drag; (px, py) is the raw
  // canvas-space pointer position — computeResizeRect does the corner math.
  resize: (id, corner, px, py) => {
    if (!_resizeState || _resizeState.id !== id) return;
    const rect = Toys.computeResizeRect(_resizeState.startRect, corner, px, py);
    _resizeState.lastRect = rect;
    Overlay.updateResizeGhost(id, rect.x, rect.y, rect.width, rect.height);
  },

  commitResize: (id, corner, px, py) => {
    if (!_resizeState || _resizeState.id !== id) return;
    const toRect   = Toys.computeResizeRect(_resizeState.startRect, corner, px, py);
    Overlay.endResizeGhost(id);
    _resizeState = null;

    const yToy = findToy(_yToys, id);
    UndoRedo.tag(`resize ${id.slice(0, 6)}`);
    Toys.applyResizeCommit(_ydoc, yToy, toRect.x, toRect.y, toRect.width, toRect.height);
    // observeDeep fires and calls renderDoc()
    addHistory(`resized ${id.slice(0, 6)}`, { elType: 'toys' });
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
    const toyClasses   = isToy ? getToyClasses(anchorDom) : new Set();
    const boundsRects  = isToy ? computeBoundaryRects(_yBounPos, toyClasses, { x: leaderEl.anchorX, y: leaderEl.anchorY }) : null;
    const snapPoints   = isToy ? computePositionSnapPoints(_yBounPos, toyClasses) : [];

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

    if (snapPoints.length > 0) {
      const snapped = findNearestSnap(rx, ry, snapPoints);
      if (snapped) {
        const snapOk = !boundsRects || boundsRects.some(
          r => snapped.cx >= r.x && snapped.cx <= r.x + r.w &&
               snapped.cy >= r.y && snapped.cy <= r.y + r.h
        );
        if (snapOk) { rx = snapped.cx; ry = snapped.cy; }
      }
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

    for (const el of elements) Overlay.endDragPlaceholder(el.id);
    _awareness.setLocalStateField('multidrag', null);

    // Use the last constrained (dx, dy) from moveMulti, falling back to
    // the raw offset only if no pointermove fired (immediate pointerup).
    const constrained = boundsRects !== null || snapPoints.length > 0;
    const fdx = constrained ? lastValidDx : Math.round(ddx);
    const fdy = constrained ? lastValidDy : Math.round(ddy);

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
    _activeLayer = id;
    // Default to Select when changing layers (tools differ per layer)
    App.setTool('select');
    UI.toast(`Layer: ${id}`);
  },
  setOffline: (v)   => { _offline = v; },
  // Undo/redo delegate to undo_redo.js (Y.UndoManager). History-log and
  // toast side effects are wired via the onApply/onEmpty callbacks in boot().
  undo: () => UndoRedo.undo(),
  redo: () => UndoRedo.redo(),
  canUndo: () => UndoRedo.canUndo(),
  canRedo: () => UndoRedo.canRedo(),
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
      const { toyCount, drawCount, invalidToyEls } = result;

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
}


export { App };
