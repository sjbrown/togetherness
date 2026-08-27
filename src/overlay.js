/**
 * overlay.js — togetherness overlay renderer
 *
 * Renders into #overlay-layer SVG group.
 * Owns SelectionMode: the per-shape decoration map.
 * Called by App after doc changes (renderDoc pipeline) and
 * after awareness changes (renderPresence pipeline).
 *
 * SelectionMode modes (the `.mode` property on each Map entry):
 *   'none'         — no decoration
 *   'local'        — solid gradient ring
 *   'candidate'    — same visual as 'local'; live rubber-band candidates
 *                    (cleared on commit/cancel)
 *   'remote'       — dashed border + peer name label (awareness)
 *   'sel-move'     — same visual as 'local'; the default a sole selection
 *                    shows before any mode-cycling click (see below)
 *   'sel-resize'   — local selection ring + 4 corner drag handles
 *   'sel-resize-r' — local selection ring + 1 radius-drag handle (circles)
 *   'sel-action'   — local selection ring + the action affordance square
 *                    (kebab/asterisk glyph, bowstring handle's resting state)
 *   'locked'       — remote peer is actively editing
 *
 * Requested/contested indicator (soft-lock.js): a separate, independent
 * decoration drawn on any element with an outstanding acquisition request
 *
 * Drop-target hover indicator: another independent decoration,
 * driven by App.move() during a toy drag
 *
 * Awareness desired schema: { [elId]: { ts: number, holding: boolean } }
 *   One record per elId a peer wants; `holding: true` entries are the
 *   held selection, rendered here as remote rings.
 *
 * Awareness candidates field: string[] | null
 *   The ids currently under a rubber-band sweep, broadcast separately from
 *   `desired` so that committed holdings are never clobbered mid-sweep.
 *   Remote peers' candidate sweeps are not currently rendered (there is no
 *   visual for "someone else is sweeping over these"), but the field is
 *   wire-present so it can be added without a schema change.
 *
 * Awareness mode field: string | null, e.g. 'sel-resize'
 *   Already carries its own `sel-` prefix. Explicit modes only — an
 *   automatic default is never broadcast unless a click entered it.
 *   Purely advisory; local rendering doesn't read this field.
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
 *
 * Add-cursor system:
 *   While a non-'select' tool is active, tracks the pointer with a small
 *   crosshair (in the placing player's colour) plus a dim clone preview of
 *   what's about to be placed. Local: drawn immediately, offline-safe, same
 *   rationale as the drag ghost. Remote: driven by awareness's `cursor`
 *   field.
 */

import { getAllContestedElementIds } from './soft-lock.js';
import { colorMatrixValues } from './toys.js';
import { LOCAL_ACTION_FILTER_ID } from './defs.js';
import { getBowstringState, chargeOpacityFor, chargeRadiusFor, bowstringOrigin } from './delight.js';
import { drawAsteriskGlyph, drawCrosshairGlyph } from './icons.js';

const SVGNS = 'http://www.w3.org/2000/svg';
const HANDLE_SIZE = 12;  // px in canvas-space
export const PAD = 6;    // selection ring padding
const REQUESTED_PAD = PAD + 6;  // extra clearance so the requested ring
                                // sits outside the selection ring
const HANDLE_HIT_PAD = 6; // extra px (canvas-space, pre-scale)
                          // added to the handle's own hit box

const SELECTION_MODES = new Set([
  'sel-move', 'sel-resize', 'sel-resize-r', 'sel-action',
]);

/**
 * The four resize corner points for a geo rect (already padded out to the
 * selection ring, same as renderLocalResizeSelection draws)
 */
export function resizeCorners(geo) {
  const { x, y, width, height } = geo;
  // order is [NW, NE, SE, SW] -- matching toys.js's RESIZE_CORNER_* constants
  // and drawing.js's corner-drag geometry
  return [
    { x: x - PAD,          y: y - PAD },          //NW
    { x: x + width + PAD,  y: y - PAD },          //NE
    { x: x + width + PAD,  y: y + height + PAD }, //SE
    { x: x - PAD,          y: y + height + PAD }, //SW
  ];
}

/**
 * The single radius-drag handle for a 'sel-resize-r' shape (currently just
 * circles): centered on the right edge of geo, padded out to the
 * selection ring same as resizeCorners. geo's centre is assumed fixed —
 * only the right edge moves as the radius changes.
 */
export function resizeRHandle(geo) {
  const { x, y, width, height } = geo;
  return { x: x + width + PAD, y: y + height / 2 };
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
  // TODO: this function is dumb.  The browser should be doing the hit-testing
  if (!geo) return null;
  const radius = (HANDLE_SIZE / 2 + HANDLE_HIT_PAD) / scale;
  const corners = resizeCorners(geo);
  for (let i = 0; i < corners.length; i++) {
    const { x: hx, y: hy } = corners[i];
    if (Math.abs(px - hx) <= radius && Math.abs(py - hy) <= radius) return i;
  }
  return null;
}

/**
 * Whether canvas-space point (px, py) is within grabbing distance of geo's
 * single radius-drag handle. Same screen-space hit box sizing as
 * hitTestResizeCorner. Returns a boolean rather than an index — there's
 * only ever one handle.
 */
export function hitTestResizeRHandle(geo, px, py, scale) {
  if (!geo) return false;
  const radius = (HANDLE_SIZE / 2 + HANDLE_HIT_PAD) / scale;
  const { x: hx, y: hy } = resizeRHandle(geo);
  return Math.abs(px - hx) <= radius && Math.abs(py - hy) <= radius;
}

/**
 * Which handle of `mode`'s own decoration canvas-space point (px, py) is
 * within grabbing distance of, for bounding box geo
 */
export function hitTestSelectionHandle(mode, geo, px, py, scale) {
  switch (mode) {
    case 'sel-resize':   return hitTestResizeCorner(geo, px, py, scale);
    case 'sel-resize-r': return hitTestResizeRHandle(geo, px, py, scale) ? 'r' : null;
    default:             return null;
  }
}

// ── SelectionMode ─────────────────────────────────────────────────────────────
// Map<elId, { mode, peerId?, color? }>
// overlay.js is the only writer (via setSelectionMode).
// App.js reads it to answer queries.
export const SelectionMode = new Map();

// ── Drag ghost state ──────────────────────────────────────────────────────────
// Local drags — managed imperatively; elements survive render() calls.
// Map<elId, { placeholderEl, ghostEl, ringEl, dx, dy }>
const _dragGhosts = new Map();

// Remote drags — rebuilt from awareness on each syncFromAwareness() call.
// Map<elId, { peerId, bboxX, bboxY, color, gradId }>
const _remoteDrags = new Map();

// Remote peers' "adding" cursors — clientId -> { x, y, tool, color }.
// Rebuilt from awareness on each syncFromAwareness() call.
const _remoteAddCursors = new Map();

// Local "adding" cursor — drawn immediately (not round-tripped through
// awareness), same rationale as the drag ghost above: works fully offline.
// { tool, groupEl } | null.
let _localAddCursor = null;

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

// Remote bowstring charges, keyed by clientId. Rebuilt from awareness on
// each syncFromAwareness() call, but firstSeenAt is CARRIED OVER for a
// client that was already charging — that timestamp is what times the
// fade-in locally, so resetting it every sync would restart the fade on
// every awareness packet and it would never finish.
let _remoteBowstrings = new Map();
let _remoteChargeRafId = null;

let App       = null;
let _layerEl  = null;   // #overlay-layer <g>
let _svgEl    = null;   // root <svg> — used to look up live toy DOM nodes for resize ghost cloning

// ── Init ──────────────────────────────────────────────────────────────────────
export function init(appBus, svgElement, localGrad = null) {
  App      = appBus;
  _svgEl   = svgElement;
  _layerEl = svgElement.querySelector('#overlay-layer') || svgElement.querySelector('#overlay');
  if (localGrad) setLocalGradient(localGrad);
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
    if (entry.mode === 'local' || entry.mode === 'candidate' || SELECTION_MODES.has(entry.mode)) {
      SelectionMode.delete(id);
    }
  }
  const color = App.getMyColor();
  const grad  = App.getMyGradient();
  for (const id of selectedIds) {
    SelectionMode.set(id, { mode: 'local', color, grad });
  }
  render();
}

// Demotes any existing selection-mode entry back to 'local', then
// promotes elId's own entry to `mode` if it's currently 'local'.
//
// Pass elId=null to leave everything 'local'.
// `mode` is one of SELECTION_MODES
export function setSelectionMode(elId, mode) {
  for (const [id, entry] of SelectionMode) {
    if (SELECTION_MODES.has(entry.mode)) SelectionMode.set(id, { ...entry, mode: 'local' });
  }
  if (elId) {
    const entry = SelectionMode.get(elId);
    if (entry && entry.mode === 'local') SelectionMode.set(elId, { ...entry, mode });
  }
  render();
}

// Replaces any existing candidate entries; leaves 'local', 'remote',
// 'locked', and mode entries alone. A 'local' or mode entry always
// takes precedence over the candidate ring.
export function setHoverCandidates(ids) {
  for (const [id, entry] of SelectionMode) {
    if (entry.mode === 'candidate') SelectionMode.delete(id);
  }
  const color = App.getMyColor();
  const grad  = App.getMyGradient();
  for (const id of ids) {
    const existing = SelectionMode.get(id);
    if (existing && (existing.mode === 'local' || SELECTION_MODES.has(existing.mode))) continue;
    SelectionMode.set(id, { mode: 'candidate', color, grad });
  }
  render();
}

// Clear all rubber-band candidate entries (called on box-select cancel or commit).
export function clearHoverCandidates() {
  for (const [id, entry] of SelectionMode) {
    if (entry.mode === 'candidate') SelectionMode.delete(id);
  }
  render();
}

// Called by App when awareness changes — rebuilds remote selection + drag entries
export function syncFromAwareness(awarenessStates, myClientId) {
  // Remove stale remote entries
  for (const [id, entry] of SelectionMode) {
    if (entry.mode === 'remote' || entry.mode === 'locked') SelectionMode.delete(id);
  }
  _remoteDrags.clear();
  _remoteAddCursors.clear();

  const nextRemoteBowstrings = new Map();
  const liveClientIds = new Set();

  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    liveClientIds.add(clientId);

    const peerId = state?.id ?? String(clientId);
    const gradId = _ensurePeerGradient(clientId, state?.grad);

    // Remote selection rings — one per held (holding:true) key in
    // `desired`. A holding:false entry is a bid, rendered instead via
    // the contested/'requested' ring below.
    if (state?.desired && typeof state.desired === 'object') {
      const elIds = Object.keys(state.desired).filter((elId) => state.desired[elId].holding);
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
        if (existing && (existing.mode === 'local' || SELECTION_MODES.has(existing.mode))) continue;
        SelectionMode.set(elId, {
          mode:   'remote',
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

    // Remote bowstring charge
    if (state?.bowstring?.elId) {
      const prev = _remoteBowstrings.get(clientId);
      nextRemoteBowstrings.set(clientId, {
        elId:  state.bowstring.elId,
        pull:  state.bowstring.pull ?? 0,
        gradId,
        // Same peer, same continuing gesture → keep the original start time.
        firstSeenAt: (prev && prev.elId === state.bowstring.elId)
          ? prev.firstSeenAt
          : performance.now(),
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

    // Remote add-cursor — peer is hovering/placing with a non-'select'
    // tool active. See "Add-cursor system" in the file header.
    if (state?.cursor && typeof state.cursor.x === 'number' && typeof state.cursor.y === 'number' && state.cursor.tool) {
      _remoteAddCursors.set(clientId, {
        x:     state.cursor.x,
        y:     state.cursor.y,
        tool:  state.cursor.tool,
        color: state.color ?? '#888',
      });
    }
  });
  _remoteBowstrings = nextRemoteBowstrings;
  _prunePeerGradients(liveClientIds);
  _contestedIds = getAllContestedElementIds(awarenessStates);
  render();
  _pumpRemoteCharge();
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
 * triggers a render so selection rings reflect the current committed
 * position. Callers that commit a real change must call this AFTER that
 * change lands — this function's own render() just paints whatever the
 * DOM already shows, so calling it too early paints the pre-move
 * position. (Everything in a commit path runs synchronously with no
 * await in between, so there's no visible intermediate frame either way —
 * ordering here is about correctness, not flicker.)
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
// survives render() calls, not the real element.
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
 * Update the local resize ghost to (x, y, width, height) — canvas-space.
 * Mutates the clone directly: tt_wh_follow_resize children (toys), or
 * its own x/y/width/height or cx/cy/r (rects/circles). DOM-only.
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
    // Update all elements marked with tt_wh_follow_resize class
    for (const el of ghostSvg.querySelectorAll(`.${elId}__tt_wh_follow_resize`)) {
      el.setAttribute('width', width);
      el.setAttribute('height', height);
    }
  } else if (entry.ghostEl.tagName === 'rect') {
    // Drawing-layer rects have no embedded <svg> to resize — the ghost
    // clone IS the shape, so mutate its own x/y/width/height directly.
    entry.ghostEl.setAttribute('x', x);
    entry.ghostEl.setAttribute('y', y);
    entry.ghostEl.setAttribute('width', width);
    entry.ghostEl.setAttribute('height', height);
  } else if (entry.ghostEl.tagName === 'circle') {
    // (x, y, width, height) is the circle's bbox form (see
    // Drawing.computeResizeRadiusRect) — derive cx/cy/r from it.
    const r = width / 2;
    entry.ghostEl.setAttribute('cx', x + r);
    entry.ghostEl.setAttribute('cy', y + r);
    entry.ghostEl.setAttribute('r',  r);
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
 * own selection ring takes over. Same ordering requirement as
 * endDragPlaceholder: call this AFTER a real size change lands, not before.
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

// ── Edit-preview ghosts ──────────────────────────────────────────────────────
// Live preview for an in-progress Edit-panel gesture
//
// Changes no geometry — same rationale as the resize ghost above: the real
// element can be wiped out mid-gesture by any peer's Yjs transaction (a
// full toys/drawing/boun_pos-layer rebuild), so the live preview lives on
// a detached clone that survives render() calls, not the real element.
//
// Map<elId, { placeholderEl, ghostEl }>
const _ghosts = new Map();

/**
 * Begin a local edit preview. Creates a dim placeholder at the element's
 * committed state and a live clone to preview changes into.
 */
export function startGhost(elId) {
  if (!_layerEl || _ghosts.has(elId)) return;
  const liveEl = _svgEl?.querySelector(`[data-id="${elId}"]`);
  if (!liveEl) return;

  const placeholderEl = el('use', {});
  placeholderEl.setAttribute('href', `#${elId}`);
  placeholderEl.setAttribute('filter', 'url(#drag-placeholder-filter)');

  const ghostEl = liveEl.cloneNode(true);
  ghostEl.removeAttribute('id');

  _ghosts.set(elId, { placeholderEl, ghostEl });
  render();
}

/**
 * Hand the live ghost clone's DOM node to `mutate` so the caller can apply
 * whatever change it represents. Deliberately generic — overlay.js doesn't
 * know or care whether that means setting one attribute or rebuilding a
 * whole subtree of children
 */
export function updateGhost(elId, mutate) {
  const entry = _ghosts.get(elId);
  if (!entry) return;
  mutate(entry.ghostEl);
}

/**
 * End a local edit preview (commit or cancel). Removes the
 * ghost/placeholder and triggers a render so the (now-committed, or
 * reverted) real element takes over. Same ordering requirement as
 * endResizeGhost: call this AFTER a real change lands, not before.
 */
export function endGhost(elId) {
  const entry = _ghosts.get(elId);
  if (!entry) return;
  entry.placeholderEl.remove();
  entry.ghostEl.remove();
  _ghosts.delete(elId);
  render();
}

// ── Drop-target hover
// The el id currently under a toy being dragged, or null. Set by
// App.move() on every pointermove while dragging a toy (re-hit-tested each
// time against the drop position, not the raw pointer); cleared on
// commit/cancel. A single id — at most one el can be the live drop target
let _dropTargetId = null;

/**
 * Called by App while dragging a toy, with the id of a .tt_contents-having
 * element currently under the drop position, or null.
 * Short circuits when the id is unchanged,
 * since this fires on every pointermove.
 */
export function setDropTargetHover(containerElId) {
  if (_dropTargetId === containerElId) return;
  _dropTargetId = containerElId;
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

  // #local-action-filter: same colorMatrixValues() trick toy artwork uses,
  // tinting the action-affordance icon squares (see renderActionAffordance)
  // to the player's own color. Uses grad.c1 — the filter takes one flat
  // color, not a gradient.
  const filterMatrix = document.querySelector(`#${LOCAL_ACTION_FILTER_ID} feColorMatrix`);
  if (filterMatrix) filterMatrix.setAttribute('values', colorMatrixValues(grad.c1));
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
  for (const entry of _ghosts.values()) {
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
    if (entry.mode === 'none') continue;
    const geo = App.getBBox(elId);
    if (!geo) continue;
    switch (entry.mode) {
      case 'local':
      case 'candidate':
      case 'sel-move':
        renderLocalSelection(geo, entry, scale);
        break;
      case 'remote':
      case 'locked':
        renderRemoteSelection(geo, entry, scale);
        break;
      case 'sel-resize':
        renderLocalResizeSelection(geo, entry, scale);
        break;
      case 'sel-resize-r':
        renderLocalResizeRSelection(geo, entry, scale);
        break;
      case 'sel-action':
        renderLocalSelection(geo, entry, scale);
        renderActionAffordance(geo, scale);
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

  // ── Drop-target hover — highlight on the el under the drop point
  if (_dropTargetId) {
    const geo = App.getBBox(_dropTargetId);
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

  // ── Local edit-preview ghosts — z-top ──────────────────────────────────
  for (const entry of _ghosts.values()) {
    _layerEl.appendChild(entry.ghostEl);
  }

  renderBowstringCharge(scale);
  renderAddCursors();
}

// ── Bowstring charge indicators ──────────────────────────────────────────────
// Read (never written) from delight.js's live gesture state. Pull-based on
// purpose: this layer is wiped on every render, so it must be able to
// rebuild itself from scratch each frame off a source that survives the
// wipe. delight.js's rAF loop calls App.requestOverlayRender() to keep this
// ticking even when the pointer isn't moving.
//
// Nothing here is persisted: pull and heldMs describe how someone is
// manipulating a toy right now, not what the toy is, so they stay out of
// the document entirely.

function renderBowstringCharge(scale) {
  const local = getBowstringState();
  if (local) drawCharge(local.elId, local.pull, local.heldMs, `url(#${LOCAL_GRAD_ID})`, scale);

  // Peers' charges are drawn identically, in their own colour, with the
  // fade timed from when this client first saw the charge rather than from
  // the sender's clock.
  const now = performance.now();
  for (const bs of _remoteBowstrings.values()) {
    drawCharge(bs.elId, bs.pull, now - bs.firstSeenAt, `url(#${bs.gradId})`, scale);
  }
}

/**
 * While any peer is charging, keep repainting: their heldMs advances with
 * no awareness traffic at all (the sender stays quiet when the pointer
 * holds still), so nothing else would drive the fade forward. Self-cancels
 * as soon as the last remote charge clears.
 */
function _pumpRemoteCharge() {
  if (_remoteChargeRafId !== null) return;
  if (_remoteBowstrings.size === 0) return;
  const step = () => {
    _remoteChargeRafId = null;
    if (_remoteBowstrings.size === 0) return;
    render();
    _remoteChargeRafId = requestAnimationFrame(step);
  };
  _remoteChargeRafId = requestAnimationFrame(step);
}

function drawCharge(elId, pull, heldMs, stroke, scale) {
  const geo = App.getBBox(elId);
  if (!geo) return;
  const origin = bowstringOrigin(geo);

  const toyEl = _svgEl?.querySelector(`[data-id="${elId}"]`);
  const toySvgEl = toyEl?.querySelector('svg');

  // 1. Toy clone, fading in over its first half-second and then holding.
  //    Deep clone keeps the toy's own x/y/width/height/viewBox so it lands
  //    exactly on the original with no positioning math. Text is stripped
  //    so labels don't double up; any url(#...) inside still resolves,
  //    since SVG id lookup is document-global and the original outlives
  //    this clone.
  if (toySvgEl) {
    const clone = toySvgEl.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    clone.querySelectorAll('text, tspan').forEach(n => n.remove());
    clone.setAttribute('class', 'bowstring-charge-clone');
    clone.setAttribute('opacity', chargeOpacityFor(heldMs).toFixed(3));
    clone.setAttribute('pointer-events', 'none');
    _layerEl.appendChild(clone);
  }

  // 2. Charge circle in the player's own color, centred on the SE corner of
  //    the selection ring. Radius tracks pull distance and is capped; both
  //    are screen-space px, so /scale converts to the canvas space this
  //    layer draws in and the circle looks identical at any zoom.
  const r = chargeRadiusFor(pull);
  if (r > 0) {
    _layerEl.appendChild(el('circle', {
      cx: origin.x,
      cy: origin.y,
      r:  r / scale,
      fill:   'none',
      stroke,
      'stroke-width': 2 / scale,
      class: 'bowstring-charge-ring',
    }));
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

  // Build corner handles
  const side_len = HANDLE_SIZE / scale;
  const corners = ['nw', 'ne', 'se', 'sw'];
  for (let i = 0; i < resizeCorners(geo).length; i++) {
    const { x: hx, y: hy } = resizeCorners(geo)[i];
    _layerEl.appendChild(el('rect', {
      x: hx - side_len / 2,
      y: hy - side_len / 2,
      width: side_len,
      height: side_len,
      rx: 3 / scale,
      fill: 'var(--surface-solid)', stroke: 'var(--info)',
      'stroke-width': 1.5 / scale,
      class: 'handle',
      'data-corner': corners[i],
    }));
  }
}

/**
 * Same selection ring as renderLocalResizeSelection, but a single
 * radius-drag handle centered on the right edge instead of four corner
 * handles — used for the 'sel-resize-r' mode (currently: circles).
 */
function renderLocalResizeRSelection(geo, entry, scale) {
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

  const side_len = HANDLE_SIZE / scale;
  const { x: hx, y: hy } = resizeRHandle(geo);
  _layerEl.appendChild(el('rect', {
    x: hx - side_len / 2,
    y: hy - side_len / 2,
    width: side_len,
    height: side_len,
    rx: 3 / scale,
    fill: 'var(--surface-solid)', stroke: 'var(--info)',
    'stroke-width': 1.5 / scale,
    class: 'handle',
    'data-corner': 'r',
  }));
}

// ── Action-mode affordance ───────────────────────────────────────────────────
const ACTION_ICON_SIZE = 22; // px

// Render a single rounded-corner icon square — asterisk (*), the bowstring
// handle's resting state
function renderActionAffordance(geo, scale) {
  const side = ACTION_ICON_SIZE / scale;
  const [, , se] = resizeCorners(geo); // resizeCorners: [NW, NE, SE, SW]
  // The SE square is the bowstring handle's resting state (see delight.js).
  // It's wrapped in its own <g class="bowstring"> so the whole control —
  // square plus glyph — is addressable as one unit. This layer still gets
  // wiped on every render(); the LIVE gesture is built separately in
  // #delight-layer, which is never wiped.
  drawActionSquare(se, side, scale, 'bowstring');
}

function drawActionSquare({ x: cx, y: cy }, side, scale, groupClass) {
  const parent = groupClass ? el('g', { class: groupClass }) : _layerEl;
  parent.appendChild(el('rect', {
    x: cx - side / 2, y: cy - side / 2,
    width: side, height: side,
    rx: side * 0.25,
    fill:   'white',
    filter: `url(#${LOCAL_ACTION_FILTER_ID})`,
    class:  'actionSquare',
  }));
  drawAsteriskGlyph(cx, cy, side, parent);
  if (parent !== _layerEl) _layerEl.appendChild(parent);
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
  const name = (entry.peerId ?? '?').slice(8);
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
// ── Add-cursor (awareness crosshair + placement preview) ─────────────────────
// See "Add-cursor system" in the file header.
const ADD_CURSOR_ARM           = 12; // crosshair half-length, canvas-space units
const ADD_CURSOR_GAP           = 8;  // gap between crosshair and preview clone
const ADD_CURSOR_CLONE_SIZE    = 32; // per spec: the clone's host <svg> is 32x32
const ADD_CURSOR_CLONE_OPACITY = 0.25;

// Cache of parsed preview templates, keyed by tool name — avoids re-parsing
// the icon markup string on every pointermove. Only successful builds are
// cached; a not-yet-fetched result (App.getToolPreviewMarkup returns null)
// is retried on the next call rather than permanently remembered as
// "no preview", since the underlying fetch (kicked off by ui.js the first
// time that tool's pill icon rendered) may still be in flight.
const _addCursorPreviewTemplates = new Map(); // toolName -> SVGSVGElement

function _addCursorPreviewTemplate(toolName) {
  const cached = _addCursorPreviewTemplates.get(toolName);
  if (cached) return cached;

  const markup = App.getToolPreviewMarkup(toolName);
  if (!markup) return null;

  const src = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement;
  if (!src || src.nodeName !== 'svg') return null;

  const template = el('svg', {
    width:   ADD_CURSOR_CLONE_SIZE,
    height:  ADD_CURSOR_CLONE_SIZE,
    viewBox: src.getAttribute('viewBox')
      || `0 0 ${src.getAttribute('width') || 24} ${src.getAttribute('height') || 24}`,
    class:   'addCursorClone',
  });
  // Scripts are stripped — this is a decorative preview, not a live toy
  // instance. Real placement (App.commitToy) is what actually activates a
  // toy's namespace.
  for (const child of Array.from(src.childNodes)) {
    if (child.nodeName?.toLowerCase() === 'script') continue;
    template.appendChild(document.importNode(child, true));
  }
  _addCursorPreviewTemplates.set(toolName, template);
  return template;
}

// Builds one add-cursor group: a crosshair at the local origin, plus (if a
// preview is available) the clone svg positioned to its right. Position on
// the canvas is left to the caller (a transform on the returned group).
function _buildAddCursorGroup(tool, color) {
  const groupEl = el('g', { class: 'add-cursor' });
  drawCrosshairGlyph(0, 0, ADD_CURSOR_ARM, groupEl, color);
  const template = _addCursorPreviewTemplate(tool);
  if (template) {
    const cloneEl = template.cloneNode(true);
    cloneEl.style.color = color; // tints any currentColor-stroked icon paths
    cloneEl.setAttribute('x', ADD_CURSOR_ARM + ADD_CURSOR_GAP);
    cloneEl.setAttribute('y', -ADD_CURSOR_CLONE_SIZE / 2);
    cloneEl.setAttribute('opacity', ADD_CURSOR_CLONE_OPACITY);
    groupEl.appendChild(cloneEl);
  }
  return groupEl;
}

/**
 * Update the local add-cursor position. Called by App on every
 * pointermove while a non-'select' tool is active — including while just
 * hovering, before any gesture has started. Rebuilds the group only when
 * the tool changes (a new preview clone is needed); otherwise just
 * repositions the existing one.
 */
export function updateLocalAddCursor(x, y, tool) {
  if (!_layerEl) return;
  if (!_localAddCursor || _localAddCursor.tool !== tool) {
    _localAddCursor?.groupEl.remove();
    const groupEl = _buildAddCursorGroup(tool, App.getMyColor());
    _localAddCursor = { tool, groupEl };
    _layerEl.appendChild(groupEl);
  }
  _localAddCursor.groupEl.setAttribute('transform', `translate(${x}, ${y})`);
}

// Ends the local add-cursor (tool switched back to 'select', or pointer
// left the canvas).
export function clearLocalAddCursor() {
  _localAddCursor?.groupEl.remove();
  _localAddCursor = null;
}

// Re-appends the local add-cursor group (survives the innerHTML wipe at the
// top of render(), same as the drag/resize ghosts) and draws one group per
// remote peer currently in an add-tool, from _remoteAddCursors. Called at
// the end of render() — z-top, like the bowstring charge.
function renderAddCursors() {
  if (_localAddCursor) _layerEl.appendChild(_localAddCursor.groupEl);
  for (const cursor of _remoteAddCursors.values()) {
    const groupEl = _buildAddCursorGroup(cursor.tool, cursor.color);
    groupEl.setAttribute('transform', `translate(${cursor.x}, ${cursor.y})`);
    _layerEl.appendChild(groupEl);
  }
}

function el(tag, attrs) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}
