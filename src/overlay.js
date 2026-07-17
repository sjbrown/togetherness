/**
 * overlay.js — togetherness overlay renderer
 *
 * Owns SelectionMode: the per-shape decoration map.
 * Renders into #overlay-layer SVG group.
 * Called by App after doc changes (renderDoc pipeline) and
 * after awareness changes (renderPresence pipeline).
 *
 * Depends on: App (bus). No ui.js imports. No canvas.js imports.
 *
 * SelectionMode kinds:
 *   'none'      — no decoration
 *   'local'     — solid gradient ring
 *   'candidate' — same visual as 'local'; live rubber-band candidates
 *                 (cleared on commit/cancel)
 *   'remote'    — dashed border + peer name label (awareness)
 *   'resize'    — local selection ring + 4 corner drag handles
 *   'locked'    — remote peer is actively editing
 *
 * Requested/contested indicator (soft-lock.js): a separate, independent
 * decoration — not a SelectionMode kind — drawn on any element with an
 * outstanding acquisition request
 *
 * Drop-target hover indicator: another independent decoration,
 * driven by App.move() during a toy drag, not by SelectionMode or
 * awareness.
 *
 * Awareness selection schema: { [elId: string]: number } | null
 *   Keys are the held elIds; values are per-elId claim timestamps (see
 *   soft-lock.js). Single selection: one key. Multi-selection (rubber-band
 *   committed group): multiple keys. No separate ids array —
 *   membership is exactly Object.keys(selection).
 *
 * Awareness candidates field: string[] | null
 *   The ids currently under a rubber-band sweep, broadcast separately from
 *   `selection` so that committed holdings are never clobbered mid-sweep.
 *   Remote peers' candidate sweeps are not currently rendered (there is no
 *   visual for "someone else is sweeping over these"), but the field is
 *   wire-present so it can be added without a schema change.
 *
 * Awareness mode field: 'sel-resize' | null
 *   Set by App.enterResizeMode/exitResizeMode. Purely advisory to peers
 *   (rendering doesn't currently distinguish it on remote rings) — the
 *   local effect is entirely driven by SelectionMode's 'resize' kind
 *   instead, set directly via Overlay.setResizeMode().
 *
 * Drag ghost system:
 *   The native layer element is never touched during drag; but overlay renders:
 *     - a dim <use href="#{id}" filter="url(#drag-placeholder-filter)">
 *       at the committed position (placeholder)
 *     - a ghost <use href="#{id}" transform="translate(dx,dy)"> (flying copy)
 *     - a selection ring translated by around the ghost
 *
 * Resize ghost system:
 *   Same placeholder-plus-live-preview shape as the drag ghost
 */

import { getAllContestedElementIds } from './soft-lock.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const HANDLE_SIZE = 12;  // px in canvas-space
export const PAD = 6;           // selection ring padding
const REQUESTED_PAD = PAD + 6; // extra clearance so the requested ring sits outside the selection ring
const HANDLE_HIT_PAD = 6; // extra px (canvas-space, pre-scale) added to the handle's own hit box — easier to grab than its drawn size alone

/**
 * The four resize corner points for a geo rect (already padded out to the
 * selection ring, same as renderLocalResizeSelection draws), in a fixed
 * order — [TL, TR, BL, BR] — matching toys.js's RESIZE_CORNER_* constants,
 * so a hit-test result can be passed straight through to
 * Toys.computeResizeRect with no translation.
 */
export function resizeCorners(geo) {
  const { x, y, width, height } = geo;
  return [
    { x: x - PAD,          y: y - PAD },           // TL
    { x: x + width + PAD,  y: y - PAD },            // TR
    { x: x - PAD,          y: y + height + PAD },   // BL
    { x: x + width + PAD,  y: y + height + PAD },   // BR
  ];
}

/**
 * Which resize corner (if any) canvas-space point (px, py) is within
 * grabbing distance of, for a toy with bounding box geo. Returns a
 * RESIZE_CORNER_* index (0-3) or null. scale is the current view scale —
 * the hit box is defined in screen-space (HANDLE_SIZE/2 + HANDLE_HIT_PAD
 * px) and converted to canvas-space so grabbing feels consistent at any
 * zoom level.
 */
export function hitTestResizeCorner(geo, px, py, scale) {
  if (!geo) return null;
  const radius = (HANDLE_SIZE / 2 + HANDLE_HIT_PAD) / scale;
  const corners = resizeCorners(geo);
  for (let i = 0; i < corners.length; i++) {
    const { x: hx, y: hy } = corners[i];
    if (Math.abs(px - hx) <= radius && Math.abs(py - hy) <= radius) return i;
  }
  return null;
}

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
// Map<elId, { peerId, bboxX, bboxY, color, gradId }>
const _remoteDrags = new Map();

// ── Peer gradient registry ───────────────────────────────────────────────────
// Each peer broadcasts a color gradient
// Every peer's gradient gets its own persistent <linearGradient> as a sibling
// of #local-sel-grad in the canvas <defs>
// Rebuilt (created/updated/pruned) on each syncFromAwareness() call.
const PEER_GRAD_PREFIX = 'peer-sel-grad-';
let _defsEl = null;             // cached <defs> element, resolved lazily
const _peerGradIds = new Set(); // clientIds with a live <linearGradient> in the DOM

export function peerGradId(clientId) {
  return `${PEER_GRAD_PREFIX}${clientId}`;
}

function _getDefsEl() {
  if (_defsEl && _defsEl.isConnected) return _defsEl;
  const lg = document.getElementById(LOCAL_GRAD_ID);
  _defsEl = lg ? lg.parentNode : null;
  return _defsEl;
}

// Create (or update) the sibling <linearGradient> for one peer's clientId,
// mirroring the angle math in setLocalGradient. Returns the element id to
// reference in url(#...), or null if grad is missing/malformed — callers
// fall back to a solid color in that case.
function _ensurePeerGradient(clientId, grad) {
  if (!grad || typeof grad !== 'object' || !grad.c1) return null;
  const defs = _getDefsEl();
  if (!defs) return null;
  const id = peerGradId(clientId);
  let lg = document.getElementById(id);
  if (!lg) {
    lg = document.createElementNS(SVGNS, 'linearGradient');
    lg.setAttribute('id', id);
    const stop0 = document.createElementNS(SVGNS, 'stop');
    stop0.setAttribute('id', `${id}-stop0`);
    const stop1 = document.createElementNS(SVGNS, 'stop');
    stop1.setAttribute('id', `${id}-stop1`);
    lg.appendChild(stop0);
    lg.appendChild(stop1);
    defs.appendChild(lg);
  }
  const rad = ((grad.angle ?? 90) - 90) * Math.PI / 180;
  lg.setAttribute('x1', 0.5 - Math.cos(rad) / 2);
  lg.setAttribute('y1', 0.5 - Math.sin(rad) / 2);
  lg.setAttribute('x2', 0.5 + Math.cos(rad) / 2);
  lg.setAttribute('y2', 0.5 + Math.sin(rad) / 2);
  const stop0 = document.getElementById(`${id}-stop0`);
  const stop1 = document.getElementById(`${id}-stop1`);
  if (stop0) { stop0.setAttribute('offset', '0%');   stop0.setAttribute('stop-color', grad.c1); }
  if (stop1) { stop1.setAttribute('offset', '100%'); stop1.setAttribute('stop-color', grad.c2 ?? grad.c1); }
  _peerGradIds.add(clientId);
  return id;
}

// Drop <linearGradient> defs for peers no longer present in awareness —
// keeps stale defs from accumulating across a long session as people come
// and go.
function _prunePeerGradients(liveClientIds) {
  for (const clientId of _peerGradIds) {
    if (liveClientIds.has(clientId)) continue;
    document.getElementById(peerGradId(clientId))?.remove();
    _peerGradIds.delete(clientId);
  }
}

// Soft-lock "requested" indicator — elIds with an outstanding acquisition
// request rebuilt on each syncFromAwareness() call.
// Deliberately independent of SelectionMode: an
// element can be contested regardless of whether it's 'local', 'remote', or
// unselected from this client's point of view, so it's rendered as its own
// decoration layer rather than another mutually-exclusive `kind`.
let _contestedIds = new Set();

let App       = null;
let _layerEl  = null;   // #overlay-layer <g>
let _svgEl    = null;   // root <svg> — used to look up live toy DOM nodes for resize ghost cloning

// ── Init ──────────────────────────────────────────────────────────────────────
export function init(appBus, svgElement) {
  App      = appBus;
  _svgEl   = svgElement;
  _layerEl = svgElement.querySelector('#overlay-layer') || svgElement.querySelector('#overlay');
}

// ── SelectionMode setters ─────────────────────────────────────────────────────
/**
 * Called by App whenever _selectedIds changes.
 * Clears all previous local/candidate/resize entries and sets 'local' for
 * each id in the Set. Works for N=0 (deselect), N=1, and N>1 uniformly —
 * the caller passes selectedIds and Overlay decides how to render it.
 */
export function localSelectionChanged(selectedIds) {
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'local' || entry.kind === 'resize' || entry.kind === 'candidate') {
      SelectionMode.delete(id);
    }
  }
  const color = App.getMyColor();
  const grad  = App.getMyGradient();
  for (const id of selectedIds) {
    SelectionMode.set(id, { kind: 'local', color, grad });
  }
  render();
}

// Demotes any existing
// 'resize' entry back to 'local' first (there is ever at most one — resize
// mode requires an exclusive single selection — but this stays defensive
// rather than assuming), then promotes elId's own entry to 'resize' if it
// currently has one and it's 'local' (i.e. really is the sole selection —
// a stale/mismatched elId is silently a no-op, matching localSelectionChanged's
// no-throw style elsewhere in this file).
// Pass elId=null to exit resize mode entirely (leaves everything 'local').
export function setResizeMode(elId) {
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'resize') SelectionMode.set(id, { ...entry, kind: 'local' });
  }
  if (elId) {
    const entry = SelectionMode.get(elId);
    if (entry && entry.kind === 'local') SelectionMode.set(elId, { ...entry, kind: 'resize' });
  }
  render();
}

// Set live rubber-band candidates. Replaces any existing candidate entries;
// does not touch 'local', 'remote', 'locked', or 'resize' entries.
// If an id already has a 'local' entry (committed single selection), it is
// left as-is — the local ring takes precedence over the candidate ring.
export function setHoverCandidates(ids) {
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'candidate') SelectionMode.delete(id);
  }
  const color = App.getMyColor();
  const grad  = App.getMyGradient();
  for (const id of ids) {
    const existing = SelectionMode.get(id);
    if (existing && (existing.kind === 'local' || existing.kind === 'resize')) continue;
    SelectionMode.set(id, { kind: 'candidate', color, grad });
  }
  render();
}

// Clear all rubber-band candidate entries (called on box-select cancel or commit).
export function clearHoverCandidates() {
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'candidate') SelectionMode.delete(id);
  }
  render();
}

// Called by App when awareness changes — rebuilds remote selection + drag entries
export function syncFromAwareness(awarenessStates, myClientId) {
  // Remove stale remote entries
  for (const [id, entry] of SelectionMode) {
    if (entry.kind === 'remote' || entry.kind === 'locked') SelectionMode.delete(id);
  }
  _remoteDrags.clear();

  const liveClientIds = new Set();

  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    liveClientIds.add(clientId);

    const peerId = state?.id ?? String(clientId);
    const gradId = _ensurePeerGradient(clientId, state?.grad);

    // Remote selection rings — one per key in the selection map
    // (selection: { [elId]: claimTimestamp } | null — see soft-lock.js).
    if (state?.selection && typeof state.selection === 'object') {
      const elIds = Object.keys(state.selection);
      for (const elId of elIds) {
        // Local selection always takes precedence over a remote peer's
        // claim to the same elId — mirrors the same rule setHoverCandidates
        // already applies for candidate-vs-local. Without this, a remote
        // peer's broadcast can silently clobber my own 'local' entry with
        // 'remote' any time both sides briefly, even legitimately, claim
        // the same elId at once (e.g. mid soft-lock handoff) — I'd see the
        // other peer's ring instead of my own, even though my own
        // selection data still says I hold it.
        const existing = SelectionMode.get(elId);
        if (existing && (existing.kind === 'local' || existing.kind === 'resize')) continue;
        SelectionMode.set(elId, {
          kind:   'remote',
          peerId,
          color:  state.color ?? '#888',
          gradId,
        });
      }
    }

    // Remote single drag ghost
    if (state?.drag?.elId) {
      _remoteDrags.set(state.drag.elId, {
        peerId,
        bboxX: state.drag.bboxX,
        bboxY: state.drag.bboxY,
        color: state.color ?? '#888',
        gradId,
      });
    }

    // Remote multi drag ghosts — one entry per element
    if (Array.isArray(state?.multidrag?.elIds) && state.multidrag.elIds.length) {
      state.multidrag.elIds.forEach((elId, i) => {
        const offset = state.multidrag.offsets?.[i];
        if (!offset) return;
        _remoteDrags.set(elId, {
          peerId,
          bboxX: offset.bboxX,
          bboxY: offset.bboxY,
          color: state.color ?? '#888',
          gradId,
        });
      });
    }
  });
  _prunePeerGradients(liveClientIds);
  _contestedIds = getAllContestedElementIds(awarenessStates);
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

  const href = `#${elId}`;

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

// ── Resize ghosts ────────────────────────────────────────────────────────────
// Local corner-drag resize — same rationale as the drag ghost above: the
// real toy element can be wiped out mid-gesture by renderToysLayer()'s full
// innerHTML rebuild (fired by ANY peer's Yjs transaction, not just this
// client's own), so the live preview lives on a detached clone that
// survives render() calls, not the real element. A <use> placeholder alone
// (as the move-ghost uses) can't show the resize itself — <use>'s
// width/height override only applies when the referenced element is an
// <svg> or <symbol>, and the href here targets the toy's outer <g>
// wrapper — so instead the ghost is a real cloned copy of the toy's DOM,
// with its own embedded <svg> (and #resizable_bg, when present) directly
// mutated to the current preview size on every updateResizeGhost() call.
// Map<elId, { placeholderEl, ghostEl, ringEl }>
const _resizeGhosts = new Map();

/**
 * Begin a local resize. Creates a dim placeholder at the toy's committed
 * geometry (mirrors startDragPlaceholder) and a live clone of the toy's
 * current DOM to preview into. No-op if a ghost for this elId already
 * exists, or if the element can't be found/cloned.
 */
export function startResizeGhost(elId) {
  if (!_layerEl || _resizeGhosts.has(elId)) return;
  const liveEl = _svgEl?.querySelector(`[data-id="${elId}"]`);
  if (!liveEl) return;

  const placeholderEl = el('use', {});
  placeholderEl.setAttribute('href', `#${elId}`);
  placeholderEl.setAttribute('filter', 'url(#drag-placeholder-filter)');

  const ghostEl = liveEl.cloneNode(true);
  ghostEl.removeAttribute('id');
  ghostEl.setAttribute('opacity', '0.85');

  const ringEl = el('rect', { fill: 'none', class: 'selRing' });

  _resizeGhosts.set(elId, { placeholderEl, ghostEl, ringEl });
  render();
}

/**
 * Update the local resize ghost to (x, y, width, height) — canvas-space,
 * already computed by Toys.computeResizeRect. Mutates the clone's own
 * root <svg> and all child elements marked with wh_follow_resize class
 * directly — this is DOM-only, never touches Yjs (see toys.js's
 * applyResizeCommit for the commit path).
 */
export function updateResizeGhost(elId, x, y, width, height) {
  const entry = _resizeGhosts.get(elId);
  if (!entry) return;
  const ghostSvg = entry.ghostEl.querySelector?.('svg');
  if (ghostSvg) {
    ghostSvg.setAttribute('x', x);
    ghostSvg.setAttribute('y', y);
    ghostSvg.setAttribute('width', width);
    ghostSvg.setAttribute('height', height);
    ghostSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // Update all elements marked with wh_follow_resize class
    for (const el of ghostSvg.querySelectorAll(`.${elId}__wh_follow_resize`)) {
      el.setAttribute('width', width);
      el.setAttribute('height', height);
    }
  }
  const scale = App.getViewScale();
  entry.ringEl.setAttribute('x',                x - PAD);
  entry.ringEl.setAttribute('y',                y - PAD);
  entry.ringEl.setAttribute('width',            width  + PAD * 2);
  entry.ringEl.setAttribute('height',           height + PAD * 2);
  entry.ringEl.setAttribute('rx',               10);
  entry.ringEl.setAttribute('stroke',           `url(#${LOCAL_GRAD_ID})`);
  entry.ringEl.setAttribute('stroke-width',     2 / scale);
}

/**
 * End a local resize (commit or cancel). Removes the ghost/placeholder/ring
 * and triggers a render so the (now-committed, or reverted) real element's
 * own selection ring takes over.
 */
export function endResizeGhost(elId) {
  const entry = _resizeGhosts.get(elId);
  if (!entry) return;
  entry.placeholderEl.remove();
  entry.ghostEl.remove();
  entry.ringEl.remove();
  _resizeGhosts.delete(elId);
  render();
}

// ── Drop-target hover
// The tray id currently under a toy being dragged, or null. Set by
// App.move() on every pointermove while dragging a toy (re-hit-tested each
// time against the drop position, not the raw pointer); cleared on
// commit/cancel. A single id — at most one tray can be the live drop target
let _dropTargetTrayId = null;

/**
 * Called by App while dragging a toy, with the id of the tray currently
 * under the drop position, or null. Short circuits when the id is unchanged,
 * since this fires on every pointermove.
 */
export function setDropTargetHover(trayId) {
  if (_dropTargetTrayId === trayId) return;
  _dropTargetTrayId = trayId;
  render();
}

// ── Render ────────────────────────────────────────────────────────────────────
const LOCAL_GRAD_ID = 'local-sel-grad';

/**
 * Update the persistent #local-sel-grad element in the SVG <defs> to reflect
 * the player's current gradient. Called once at boot and again if the player
 * changes their color. The element lives in the main canvas <defs> (not inside
 * #overlay-layer) so it survives the innerHTML wipe on every render().
 */
export function setLocalGradient(grad) {
  if (!grad) return;
  // Gradient direction: map CSS angle (0°=up, 90°=right) to SVG objectBoundingBox
  const rad = (grad.angle - 90) * Math.PI / 180;
  const lg = document.getElementById(LOCAL_GRAD_ID);
  if (!lg) return;
  lg.setAttribute('x1', 0.5 - Math.cos(rad) / 2);
  lg.setAttribute('y1', 0.5 - Math.sin(rad) / 2);
  lg.setAttribute('x2', 0.5 + Math.cos(rad) / 2);
  lg.setAttribute('y2', 0.5 + Math.sin(rad) / 2);
  const stop0 = document.getElementById(`${LOCAL_GRAD_ID}-stop0`);
  const stop1 = document.getElementById(`${LOCAL_GRAD_ID}-stop1`);
  if (stop0) stop0.setAttribute('stop-color', grad.c1);
  if (stop1) stop1.setAttribute('stop-color', grad.c2);
}

export function render() {
  if (!_layerEl) return;
  _layerEl.innerHTML = '';

  const scale = App.getViewScale();

  // ── 1. Dim placeholders — z-bottom (local then remote) ────────────────────
  for (const entry of _dragGhosts.values()) {
    _layerEl.appendChild(entry.placeholderEl);
  }
  for (const entry of _resizeGhosts.values()) {
    _layerEl.appendChild(entry.placeholderEl);
  }
  for (const [elId] of _remoteDrags) {
    const ph = el('use', {});
    ph.setAttribute('href',   `#${elId}`);
    ph.setAttribute('filter', 'url(#drag-placeholder-filter)');
    _layerEl.appendChild(ph);
  }

  // ── Selection rings  ───────────────────────────────
  for (const [elId, entry] of SelectionMode) {
    if (entry.kind === 'none') continue;
    const geo = App.getBBox(elId);
    if (!geo) continue;
    switch (entry.kind) {
      case 'local':
      case 'candidate':
        renderLocalSelection(geo, entry, scale);
        break;
      case 'remote':
      case 'locked':
        renderRemoteSelection(geo, entry, scale);
        break;
      case 'resize':
        renderLocalResizeSelection(geo, entry, scale);
        break;
    }
  }

  // ── Requested/contested indicator — independent of SelectionMode kind ──
  // Drawn regardless of whether the element is 'local', 'remote', or has no
  // SelectionMode entry at all — contestedness is orthogonal to who (if
  // anyone) currently holds it from this client's point of view.
  for (const elId of _contestedIds) {
    const geo = App.getBBox(elId);
    if (!geo) continue;
    renderRequestedIndicator(geo, scale);
  }

  // ── Remote drag ghosts + rings ─────────────────────────────────────────
  for (const [elId, drag] of _remoteDrags) {
    const bbox = App.getBBox(elId);
    if (!bbox) continue;
    const tdx = drag.bboxX - bbox.x; // relative to current committed
    const tdy = drag.bboxY - bbox.y;

    const ghostEl = el('use', { opacity: '0.85' });
    ghostEl.setAttribute('href', `#${elId}`);
    ghostEl.setAttribute('transform', `translate(${tdx}, ${tdy})`);
    _layerEl.appendChild(ghostEl);

    renderRemoteSelection(
      { x: drag.bboxX, y: drag.bboxY, width: bbox.width, height: bbox.height },
      { color: drag.color, gradId: drag.gradId, peerId: drag.peerId },
      scale,
    );
  }

  // ── Drop-target hover — highlight on the tray under the drop point
  if (_dropTargetTrayId) {
    const geo = App.getBBox(_dropTargetTrayId);
    if (geo) renderDropTargetHover(geo, scale);
  }

  // ── Local drag ghosts + rings — z-top ──────────────────────────────────
  for (const [elId, entry] of _dragGhosts) {
    _layerEl.appendChild(entry.ghostEl);
    _layerEl.appendChild(entry.ringEl);
    _updateDragRing(entry, elId, scale);
  }

  // ── Local resize ghosts + rings — z-top ────────────────────────────────
  for (const entry of _resizeGhosts.values()) {
    _layerEl.appendChild(entry.ghostEl);
    _layerEl.appendChild(entry.ringEl);
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

  // Corner handles — decorated corners only (no edge midpoints); geometry
  // shared with the hit-test via resizeCorners() so the drawn handle and
  // the grabbable area always agree.
  const hw = HANDLE_SIZE / scale;
  for (const { x: hx, y: hy } of resizeCorners(geo)) {
    _layerEl.appendChild(el('rect', {
      x: hx - hw / 2, y: hy - hw / 2,
      width: hw, height: hw, rx: 3 / scale,
      fill: 'var(--surface-solid)', stroke: 'var(--info)',
      'stroke-width': 1.5 / scale,
      class: 'handle',
    }));
  }
}

function renderRemoteSelection(geo, entry, scale) {
  const { x, y, width, height } = geo;
  const group = el('g', { class: 'remote-sel' });

  // Ring strokes with the peer's own gradient (per-clientId <linearGradient>
  // in <defs>, kept current by _ensurePeerGradient) when one is available;
  // solid color is only a fallback for peers who haven't broadcast a grad.
  const stroke = entry.gradId ? `url(#${entry.gradId})` : (entry.color ?? '#888');
  const ring = el('rect', {
    x:      x - PAD,
    y:      y - PAD,
    width:  width  + PAD * 2,
    height: height + PAD * 2,
    rx:     6,
    fill:           'none',
    stroke,
    'stroke-width': 1.5 / scale,
    'stroke-dasharray': `${4 / scale} ${3 / scale}`,
  });
  group.appendChild(ring);

  // Peer name label above the ring
  const name = (entry.peerId ?? '?').slice(0, 6);
  const lx   = x - PAD;
  const ly   = y - PAD - 4 / scale;
  const fs   = 9 / scale;
  const bgW  = name.length * 6.5 / scale + 8 / scale;
  const bgH  = 13 / scale;

  group.appendChild(el('rect', {
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
  group.appendChild(txt);

  _layerEl.appendChild(group);
}

// Contested/"requested" indicator — a pulsing warm-colored outer ring drawn
// around whatever else is being rendered for this element (local/remote
// selection ring, or nothing at all). Deliberately visually distinct from
// both the local (gradient) and remote (peer-colored dashed) rings so it
// reads as "someone wants this" rather than "someone has this".
function renderRequestedIndicator(geo, scale) {
  const { x, y, width, height } = geo;
  const ring = el('rect', {
    x:      x - REQUESTED_PAD,
    y:      y - REQUESTED_PAD,
    width:  width  + REQUESTED_PAD * 2,
    height: height + REQUESTED_PAD * 2,
    rx:     8,
    fill:               'none',
    stroke:             'var(--warn)',
    'stroke-width':     2 / scale,
    'stroke-dasharray': `${3 / scale} ${3 / scale}`,
    class:              'requestedRing',
  });
  const anim = document.createElementNS(SVGNS, 'animate');
  anim.setAttribute('attributeName', 'opacity');
  anim.setAttribute('values',        '1;0.35;1');
  anim.setAttribute('dur',           '1.2s');
  anim.setAttribute('repeatCount',   'indefinite');
  ring.appendChild(anim);
  _layerEl.appendChild(ring);
}

function renderDropTargetHover(geo, scale) {
  const { x, y, width, height } = geo;
  const ring = el('rect', {
    x:      x - PAD,
    y:      y - PAD,
    width:  width  + PAD * 2,
    height: height + PAD * 2,
    rx:     6,
    fill:               'var(--warn-soft)',
    stroke:             'var(--warn)',
    'stroke-width':     2.5 / scale,
    class:              'dropTargetRing',
  });
  _layerEl.appendChild(ring);
}

// ── SVG element factory ─────────────────────────────────────────────────────
function el(tag, attrs) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}
