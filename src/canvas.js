/**
 * canvas.js — togetherness canvas interaction
 *
 * Owns ToolMode: which tool is active and what draw parameters are set.
 * Handles all pointer events on #stage.
 * Calls App.* for every action that changes document or selection state.
 *
 * The view transform (pan + zoom) is applied uniformly to all content layers
 * and the overlay. canvas.js has no opinion about which layer is "primary".
 *
 * Depends on: App (bus object). No ui.js imports. No Yjs imports.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

// ── ToolMode ──────────────────────────────────────────────────────────────────
// canvas.js is the only writer. Params come from the active tool's registry
// entry (passed in by App) — canvas.js does not know what keys mean.
export const ToolMode = {
  tool:    'select',
  params:  {},        // { fill, stroke, stroke-width, corner-r, ... } — opaque to canvas
  // Internal draw state — not published
  _drawing:  false,
  _draft:    null,
  _pointers: new Map(),
  _gesture:  null,
  _pressTimer: null,
  _startView:  null,
  _startDist:  0,
  _startMid:   null,
  _moveRef:    null,
  _lastTap:    0,
};

// Internal
let App      = null;
let _view    = { x: 0, y: 0, scale: 1 };  // canvas transform
let _svgEl   = null;
let _stageEl    = null;
// All layers that move with the view transform, in DOM order.
// Populated in init(); canvas.js treats them all equally.
let _transformedLayers = [];

// ── Init ──────────────────────────────────────────────────────────────────────
export function init(appBus, svgElement) {
  App      = appBus;
  _svgEl   = svgElement;
  _stageEl = document.getElementById('stage');

  // Collect every layer that pans/zooms with the view, in z-order.
  // New layers in index.html are picked up automatically — no changes here.
  _transformedLayers = [
    '#background-layer',
    '#boundaries-positions-layer',
    '#toys-layer',
    '#drawing-layer',
    '#overlay-layer',
  ].map(sel => svgElement.querySelector(sel)).filter(Boolean);

  _stageEl.addEventListener('pointerdown',  onPointerDown);
  _stageEl.addEventListener('pointermove',  onPointerMove);
  _stageEl.addEventListener('pointerup',    onPointerUp);
  _stageEl.addEventListener('pointercancel',onPointerUp);
  _stageEl.addEventListener('wheel', onWheel, { passive: false });

  // Track shift key for cursor updates — shift implies box-select mode
  window.addEventListener('keydown', onShiftKey);
  window.addEventListener('keyup',   onShiftKey);

  applyViewTransform();
  updateCursor();
}

// ── ToolMode setters (called by App) ─────────────────────────────────────────
export function setTool(name, params = {}) {
  ToolMode.tool = name;
  ToolMode.params = { ...params };
  updateCursor();
}
export function setParams(params) {
  ToolMode.params = { ...params };
  updateCursor();
}
export function getView() { return { ..._view }; }

export function resetView() {
  _view = { x: 0, y: 0, scale: 1 };
  applyViewTransform();
}

function applyViewTransform() {
  const tf = `translate(${_view.x} ${_view.y}) scale(${_view.scale})`;
  for (const layer of _transformedLayers) layer.setAttribute('transform', tf);
  // Sync dot-grid background position (CSS custom property for the tile pattern)
  document.documentElement.style.setProperty('--bgx', _view.x + 'px');
  document.documentElement.style.setProperty('--bgy', _view.y + 'px');
}

function toCanvas(clientX, clientY) {
  return {
    x: (clientX - _view.x) / _view.scale,
    y: (clientY - _view.y) / _view.scale,
  };
}

// ── Cursor ────────────────────────────────────────────────────────────────────
let _shiftHeld = false;

function updateCursor() {
  if (!_stageEl) return;
  _stageEl.dataset.tool = ToolMode.tool;
  if (ToolMode.tool === 'select') {
    _stageEl.dataset.selectMode = (ToolMode.params.multi || _shiftHeld) ? 'multi' : 'pan';
  } else {
    delete _stageEl.dataset.selectMode;
  }
}

function onShiftKey(e) {
  const held = e.shiftKey;
  if (held === _shiftHeld) return;
  _shiftHeld = held;
  updateCursor();
}

// ── Layer-aware hit testing ───────────────────────────────────────────────────
// Maps the active layer id (from App.getActiveLayer) to the data-module
// value stamped on DOM elements by shapes._toSVGEl / toys._toSVGEl.
const LAYER_TYPE = {
  drawing:               'drawing',
  toys:                  'toys',
  background:            'background',
  'boundaries-positions': 'boun_pos',
};

// Return the [data-yid] element under the pointer that belongs to the active
// layer, or null if the pointer landed on a different layer or empty canvas.
function hitForActiveLayer(e) {
  const activeType = LAYER_TYPE[App.getActiveLayer()];
  if (!activeType) return null;
  const el = e.target.closest?.('[data-yid]') ?? null;
  if (!el) return null;
  return el.dataset.module === activeType ? el : null;
}

// ── Shape click wiring ────────────────────────────────────────────────────────
// Called by App after renderDocLayer — attaches click listeners to drawing-layer shapes.
// Note: shift-click is handled entirely via pointer events (onPointerDown/Up) because
// setPointerCapture routes the click event to _stage rather than the child element,
// so a shift-click listener here would never fire on toys or shapes.
export function wireShapeClicks(layer) {
  layer.querySelectorAll('[data-yid]').forEach(el => {
    el.addEventListener('click', ev => {
      if (ToolMode.tool !== 'select') return;
      ev.stopPropagation();
      App.select(el.dataset.yid);
    });
  });
  // Click on empty canvas deselects
  layer.addEventListener('click', e => {
    if (!e.target.closest('[data-yid]')) App.select(null);
  });
}

// ── Draw preview (rubber-band div) ────────────────────────────────────────────
const _preview = {
  el: null,
  show(x, y, w, h) {
    if (!this.el) this.el = document.getElementById('draw-preview');
    if (!this.el) return;
    this.el.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  },
  hide() {
    if (!this.el) this.el = document.getElementById('draw-preview');
    if (this.el) this.el.style.display = 'none';
  },
};

// ── Select preview (rubber-band div for multi-select box) ─────────────────────
const _selectPreview = {
  el: null,
  _get() {
    if (!this.el || !this.el.isConnected) this.el = document.getElementById('select-preview');
    return this.el;
  },
  show(x, y, w, h) {
    const el = this._get();
    if (!el) return;
    el.style.cssText = `display:block;left:${x}px;top:${y}px;width:${w}px;height:${h}px;`;
  },
  hide() {
    const el = this._get();
    if (el) el.style.display = 'none';
  },
};

// ── Pointer handling ──────────────────────────────────────────────────────────
function onPointerDown(e) {
  // Let ui.js know to close dropdowns — it listens on document capture
  ToolMode._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  _stageEl.setPointerCapture(e.pointerId);

  // Two-finger gesture
  if (ToolMode._pointers.size === 2) {
    cancelDraft();
    ToolMode._gesture = 'pinch';
    const pts = [...ToolMode._pointers.values()];
    ToolMode._startDist = dist(pts[0], pts[1]);
    ToolMode._startMid  = mid(pts[0], pts[1]);
    ToolMode._startView = { ..._view };
    clearTimeout(ToolMode._pressTimer);
    return;
  }

  const hitEl = hitForActiveLayer(e);
  const hitId = hitEl?.dataset?.yid ?? null;

  if (ToolMode.tool === 'select') {
    if (hitId) {
      if (e.shiftKey) {
        // Shift-click: toggle selection membership.
        // Handled entirely in the pointer-event chain — don't rely on the
        // click event, which fires on _stage (the capture target) rather than
        // on the original child element, so wireShapeClicks never sees it.
        ToolMode._gesture = 'shift-tap';
        ToolMode._moveRef = { id: hitId, sx: e.clientX, sy: e.clientY, moved: false };
        return;
      }
      ToolMode._gesture = 'move';
      const anchor = App.getAnchor(hitEl);
      const p = toCanvas(e.clientX, e.clientY);
      // If the hit element is part of a multi-selection, start a multi-element drag
      if (App.getSelectedIds().length > 1 && App.getSelectedIds().includes(hitId)) {
        ToolMode._gesture = 'multi-move';
        ToolMode._moveRef = { sx: e.clientX, sy: e.clientY, moved: false };
        // Defend this element the moment it's touched — tap or drag alike.
        // startMultiDrag never goes through select(), which is the only
        // other place a claim gets refreshed, so without this a
        // multi-selected element's claim silently goes stale the instant
        // it's added to a group, even while actively being clicked/dragged.
        App.reassertClaim(hitId);
        App.startMultiDrag({ ...toCanvas(e.clientX, e.clientY), leaderId: hitId });
        return;
      }
      ToolMode._moveRef = { id: hitId, dx: p.x - anchor.x, dy: p.y - anchor.y, moved: false };
      App.select(hitId);
      // select() may have bailed into a soft-lock request instead of
      // actually selecting hitId (held by another peer) — in that case
      // there's nothing local to drag, and starting a drag ghost anyway
      // would broadcast a bogus `drag` awareness field for an element we
      // don't hold, and its z-top ghost/ring would visually occlude the
      // request indicator.
      if (App.getSelectedIds().includes(hitId)) {
        App.startDrag(hitId);
      }
      ToolMode._pressTimer = setTimeout(() => {
        if (!ToolMode._moveRef?.moved) App.requestContextMenu(e.clientX, e.clientY, hitId);
      }, 480);
    } else {
      // Empty canvas: shift OR multi-toggle → box-select; otherwise pan
      if (ToolMode.params.multi || e.shiftKey) {
        ToolMode._gesture = 'box-select';
        ToolMode._moveRef = { sx: e.clientX, sy: e.clientY, moved: false, additive: e.shiftKey };
      } else {
        ToolMode._gesture = 'pan-or-deselect';
        ToolMode._moveRef = { sx: e.clientX, sy: e.clientY, moved: false };
      }
      ToolMode._startView = { ..._view };
    }
  } else {
    // Draw mode
    ToolMode._gesture = 'draw';
    const p = toCanvas(e.clientX, e.clientY);
    ToolMode._draft = { type: ToolMode.tool, ox: p.x, oy: p.y };
    _preview.hide();
  }
}

function onPointerMove(e) {
  if (!ToolMode._pointers.has(e.pointerId)) return;
  ToolMode._pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (ToolMode._gesture === 'pinch' && ToolMode._pointers.size === 2) {
    const pts    = [...ToolMode._pointers.values()];
    const d      = dist(pts[0], pts[1]);
    const m2     = mid(pts[0], pts[1]);
    const sv     = ToolMode._startView;
    let   scale  = Math.max(0.25, Math.min(5, sv.scale * (d / ToolMode._startDist)));
    _view.scale  = scale;
    _view.x = m2.x - (ToolMode._startMid.x - sv.x) * (scale / sv.scale);
    _view.y = m2.y - (ToolMode._startMid.y - sv.y) * (scale / sv.scale);
    applyViewTransform();
    return;
  }

  if (ToolMode._gesture === 'draw' && ToolMode._draft) {
    const p = toCanvas(e.clientX, e.clientY);
    const d = ToolMode._draft;
    if (d.type === 'rect' || d.type === 'boundary' || d.type === 'pos-grid-sq' || d.type === 'pos-grid-hex') {
      const x = Math.min(p.x, d.ox), y = Math.min(p.y, d.oy);
      const w = Math.abs(p.x - d.ox), h = Math.abs(p.y - d.oy);
      // Show rubber-band preview as a fixed div (simpler than an SVG draft element)
      const stageRect = _stageEl.getBoundingClientRect();
      const sx = Math.min(e.clientX, _view.x + d.ox * _view.scale) - stageRect.left;
      const sy = Math.min(e.clientY, _view.y + d.oy * _view.scale) - stageRect.top;
      _preview.show(sx, sy, w * _view.scale, h * _view.scale);
    } else if (d.type === 'circle') {
      const r = Math.hypot(p.x - d.ox, p.y - d.oy);
      const sx = (_view.x + d.ox * _view.scale) - r * _view.scale - _stageEl.getBoundingClientRect().left;
      const sy = (_view.y + d.oy * _view.scale) - r * _view.scale - _stageEl.getBoundingClientRect().top;
      _preview.show(sx, sy, r * 2 * _view.scale, r * 2 * _view.scale);
    }
    return;
  }

  if (ToolMode._gesture === 'move' && ToolMode._moveRef) {
    const ref  = ToolMode._moveRef;
    const p    = toCanvas(e.clientX, e.clientY);
    ref.moved  = true;
    clearTimeout(ToolMode._pressTimer);
    App.move(ref.id, p.x - ref.dx, p.y - ref.dy);
    return;
  }

  if (ToolMode._gesture === 'multi-move' && ToolMode._moveRef) {
    const ref = ToolMode._moveRef;
    const ddx = (e.clientX - ref.sx) / _view.scale;
    const ddy = (e.clientY - ref.sy) / _view.scale;
    ref.moved = true;
    clearTimeout(ToolMode._pressTimer);
    App.moveMulti(ddx, ddy);
    return;
  }

  if (ToolMode._gesture === 'pan-or-deselect' && ToolMode._moveRef) {
    const ref = ToolMode._moveRef;
    const ddx = e.clientX - ref.sx, ddy = e.clientY - ref.sy;
    if (Math.abs(ddx) > 4 || Math.abs(ddy) > 4) {
      ref.moved   = true;
      _stageEl.classList.add('dragging');
      _view.x = ToolMode._startView.x + ddx;
      _view.y = ToolMode._startView.y + ddy;
      applyViewTransform();
    }
  }

  if (ToolMode._gesture === 'box-select' && ToolMode._moveRef) {
    const ref = ToolMode._moveRef;
    const ddx = e.clientX - ref.sx, ddy = e.clientY - ref.sy;
    if (Math.abs(ddx) > 2 || Math.abs(ddy) > 2) {
      ref.moved = true;
      const stageRect = _stageEl.getBoundingClientRect();
      const sx = Math.min(e.clientX, ref.sx) - stageRect.left;
      const sy = Math.min(e.clientY, ref.sy) - stageRect.top;
      const sw = Math.abs(ddx);
      const sh = Math.abs(ddy);
      _selectPreview.show(sx, sy, sw, sh);

      const candidates = App.getBoxCandidates({
        x:      (Math.min(e.clientX, ref.sx) - _view.x) / _view.scale,
        y:      (Math.min(e.clientY, ref.sy) - _view.y) / _view.scale,
        width:  sw / _view.scale,
        height: sh / _view.scale,
      });
      App.broadcastCandidates(candidates);
    }
  }
}

function onPointerUp(e) {
  clearTimeout(ToolMode._pressTimer);
  ToolMode._pointers.delete(e.pointerId);
  _preview.hide();
  _selectPreview.hide();
  _stageEl.classList.remove('dragging');

  const isCancelled = e.type === 'pointercancel';

  if (ToolMode._gesture === 'move' && ToolMode._moveRef) {
    if (ToolMode._moveRef.moved) {
      if (isCancelled) {
        App.cancelMove();
      } else {
        const ref = ToolMode._moveRef;
        const p   = toCanvas(e.clientX, e.clientY);
        App.commitMove(ref.id, p.x - ref.dx, p.y - ref.dy);
      }
    } else {
      // Tap with no movement — still started a drag; cancel it cleanly.
      App.cancelMove();
    }
  }

  if (ToolMode._gesture === 'multi-move' && ToolMode._moveRef) {
    if (ToolMode._moveRef.moved) {
      if (isCancelled) {
        App.cancelMultiMove();
      } else {
        const ref = ToolMode._moveRef;
        const ddx = (e.clientX - ref.sx) / _view.scale;
        const ddy = (e.clientY - ref.sy) / _view.scale;
        App.commitMultiMove(ddx, ddy);
      }
    } else {
      App.cancelMultiMove();
    }
  }

  if (ToolMode._gesture === 'draw' && ToolMode._draft) {
    finishDraft(e);
  } else if (ToolMode._gesture === 'pan-or-deselect' && ToolMode._moveRef && !ToolMode._moveRef.moved) {
    App.select(null);
  } else if (ToolMode._gesture === 'shift-tap' && ToolMode._moveRef) {
    // Pointer capture means click fires on _stage, not on the child element —
    // wireShapeClicks never sees it. So we handle toggleSelection here directly.
    if (!ToolMode._moveRef.moved) {
      App.toggleSelection(ToolMode._moveRef.id);
    }
  } else if (ToolMode._gesture === 'box-select' && ToolMode._moveRef) {
    const ref = ToolMode._moveRef;
    if (isCancelled || !ref.moved) {
      // Tap (no drag): shift-tap on canvas clears selection; plain tap also clears
      App.clearBoxCandidates();
      App.select(null);
    } else {
      App.clearBoxCandidates();
      App.commitMultiSelect?.({
        x:        (Math.min(e.clientX, ref.sx) - _view.x) / _view.scale,
        y:        (Math.min(e.clientY, ref.sy) - _view.y) / _view.scale,
        width:    Math.abs(e.clientX - ref.sx) / _view.scale,
        height:   Math.abs(e.clientY - ref.sy) / _view.scale,
        additive: ref.additive ?? false,
      });
    }
  }

  if (ToolMode._pointers.size < 2 && ToolMode._gesture === 'pinch') {
    ToolMode._gesture = ToolMode._pointers.size === 1 ? 'pending' : null;
  }
  if (ToolMode._pointers.size === 0) {
    ToolMode._gesture = null;
    ToolMode._moveRef = null;
  }

  // Double-tap: reset view
  const now = Date.now();
  if (now - ToolMode._lastTap < 300 && ToolMode._pointers.size === 0 && !ToolMode._moveRef?.moved) {
    resetView();
    App.onViewReset();
  }
  ToolMode._lastTap = now;
}

function finishDraft(e) {
  const d = ToolMode._draft;
  ToolMode._draft = null;
  if (!d) return;

  const p = toCanvas(e.clientX, e.clientY);

  if (d.type === 'rect') {
    const w = Math.round(Math.abs(p.x - d.ox));
    const h = Math.round(Math.abs(p.y - d.oy));
    if (w < 8 || h < 8) {
      // Tap: drop a default rect centered on tap point
      App.commitDrawing({ type:'rect', x: Math.round(d.ox) - 60, y: Math.round(d.oy) - 40, width:120, height:80, ...drawAttrs() });
      return;
    }
    App.commitDrawing({
      type: 'rect',
      x: Math.round(Math.min(p.x, d.ox)), y: Math.round(Math.min(p.y, d.oy)),
      width: w, height: h,
      'corner-r': ToolMode.params['corner-r'] ?? 8,
      ...drawAttrs(),
    });
  } else if (d.type === 'boundary') {
    const w = Math.round(Math.abs(p.x - d.ox));
    const h = Math.round(Math.abs(p.y - d.oy));
    if (w < 8 || h < 8) {
      // Tap: drop a default boundary centered on tap point
      App.commitBoundary({ x: Math.round(d.ox) - 150, y: Math.round(d.oy) - 100, w: 300, h: 200 });
      return;
    }
    App.commitBoundary({
      x: Math.round(Math.min(p.x, d.ox)), y: Math.round(Math.min(p.y, d.oy)),
      w, h,
    });
  } else if (d.type === 'pos-grid-sq' || d.type === 'pos-grid-hex') {
    const w = Math.round(Math.abs(p.x - d.ox));
    const h = Math.round(Math.abs(p.y - d.oy));
    if (w < 8 || h < 8) return;        // too small to generate a grid
    App.commitPositionSet({
      x: Math.round(Math.min(p.x, d.ox)),
      y: Math.round(Math.min(p.y, d.oy)),
      w, h, toolName: d.type,
    });
  } else if (d.type === 'circle') {
    const r = Math.round(Math.hypot(p.x - d.ox, p.y - d.oy));
    if (r < 8) {
      App.commitDrawing({ type:'circle', cx: Math.round(d.ox), cy: Math.round(d.oy), r: 46, ...drawAttrs() });
      return;
    }
    App.commitDrawing({ type:'circle', cx: Math.round(d.ox), cy: Math.round(d.oy), r, ...drawAttrs() });
  } else {
    // Toy tools (marker, d6, etc.) and future drawing tools (pen, text):
    // drop the toy centered on the tap/drag origin.
    App.commitToy(d.type, Math.round(d.ox), Math.round(d.oy));
  }
}

function drawAttrs() {
  const p = ToolMode.params || {};
  return {
    fill:           p.fill           ?? '#c8941e',
    stroke:         p.stroke         ?? 'none',
    'stroke-width': p['stroke-width'] ?? 1.5,
  };
}

function cancelDraft() {
  ToolMode._draft = null;
  _preview.hide();
}

// ── Wheel (trackpad + mouse) ──────────────────────────────────────────────────
function onWheel(e) {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    // Zoom centred on cursor
    const factor = Math.exp(-e.deltaY * 0.0015);
    const scale  = Math.max(0.25, Math.min(5, _view.scale * factor));
    _view.x = e.clientX - (e.clientX - _view.x) * (scale / _view.scale);
    _view.y = e.clientY - (e.clientY - _view.y) * (scale / _view.scale);
    _view.scale = scale;
  } else {
    _view.x -= e.deltaX;
    _view.y -= e.deltaY;
  }
  applyViewTransform();
}

// ── Geometry helpers ──────────────────────────────────────────────────────────
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function mid(a, b)  { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
