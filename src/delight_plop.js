/**
 * delight_plop.js — a toy lands with squash and stretch when the local
 * player places it
 *
 * Pressing with a toy tool squashes a ghost of the toy at the press point
 * (it spreads, viewed from above), deepening while held. Releasing stretches
 * it, a damped spring settles it, and a puff of dust leaves its edge.
 *
 * Local only. Nothing here reaches the doc or awareness, and the real toy's
 * DOM in #toys-layer is never touched:
 *   - the animation plays in #delight-layer, which nothing wipes;
 *   - once the real toy exists, the ghost is swapped for <use href="#id">,
 *     so whatever initialize() does to the toy shows up mid-animation;
 *   - the real toy is hidden meanwhile by a rule in a page <style>, keyed on
 *     its data-id, which the <use> instance does not inherit. The rule sets
 *     opacity rather than visibility so the toy can still be grabbed.
 *
 * Driven by App's toy:add:* signals (see App.on), one landing per pressId:
 *   toy:add:press   → press(x, y, preview())
 *   toy:add:release → release(landing)
 *   toy:add:place   → attach(landing, toyEl)
 *   toy:add:cancel  → cancel(landing), when the press is abandoned (pinch)
 *                     or placement fails.
 * release and attach may come in either order: placement is async.
 *
 * The pose is a JS rAF loop because the press depth depends on how long the
 * pointer is held. The dust puff is delight_puff.js's.
 */

import { cubicBezier } from './ui_radial.js';
import { spawnPuff, blurFilter } from './delight_puff.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// ── Tunables (from tests/dev/delight-tuner.html, plop mode) ───────────────
// Deformation d: negative squashes (the toy spreads), positive stretches.
export const SQUASH = 0.1;        // d reached SQUASH_MS into a press
export const SQUASH_MS = 90;
export const HOLD_EXTRA = 0.1;    // further squash while held, reached HOLD_MS after that
export const HOLD_MS = 1000;
export const STRETCH = 0.15;      // d at the end of the release stretch
export const STRETCH_MS = 60;
const SPRING_HZ = 5;
const DAMPING = 0.45;             // damping ratio, < 1
const SPREAD_GAIN = 1;            // uniform scale is 1 - d * SPREAD_GAIN
const SETTLE_EPS = 0.002;         // spring stops once its envelope is this small
const CANCEL_MS = 160;
const SHADOW_OPACITY = 0.2;
const SHADOW_RATIO = 0.48;        // shadow radii as a fraction of the toy's size
const SHADOW_FILTER_ID = 'delight-plop-shadow';

const EASE_OUT = cubicBezier(0.2, 0.7, 0.3, 1);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// ── Pure math (unit-tested; no DOM) ───────────────────────────────────────

/** Deformation t ms into a press: eases to -SQUASH, then deepens while held. */
export function pressDeform(t) {
  const squash = SQUASH * EASE_OUT(clamp01(t / SQUASH_MS));
  const hold = HOLD_MS > 0 ? clamp01((t - SQUASH_MS) / HOLD_MS) : 1;
  return -squash - HOLD_EXTRA * EASE_OUT(hold);
}

/** How long the spring takes to settle from amplitude amp, in ms. */
export function settleMsFor(amp) {
  if (Math.abs(amp) <= SETTLE_EPS) return 0;
  const w = 2 * Math.PI * SPRING_HZ;
  return Math.log(Math.abs(amp) / SETTLE_EPS) / (DAMPING * w) * 1000;
}

/** Total length of the release, in ms. */
export function releaseMs() {
  return STRETCH_MS + settleMsFor(STRETCH);
}

/**
 * Deformation t ms after release, starting from d0 (the press depth at
 * release): an eased stretch to STRETCH, then a damped spring from rest at
 * STRETCH back to 0. Exactly 0 once releaseMs() has passed.
 */
export function releaseDeform(t, d0) {
  if (t <= 0) return d0;
  if (t < STRETCH_MS) return d0 + (STRETCH - d0) * EASE_OUT(t / STRETCH_MS);
  const ts = (t - STRETCH_MS) / 1000;
  if (ts * 1000 >= settleMsFor(STRETCH)) return 0;
  const w = 2 * Math.PI * SPRING_HZ;
  const wd = w * Math.sqrt(1 - DAMPING * DAMPING);
  return STRETCH * Math.exp(-DAMPING * w * ts) *
    (Math.cos(wd * ts) + (DAMPING * w / wd) * Math.sin(wd * ts));
}

/** Uniform scale for a deformation. */
export function scaleFor(d) {
  return Math.max(0.05, 1 - d * SPREAD_GAIN);
}

// ── Module state ──────────────────────────────────────────────────────────

let App = null;
let _svgEl = null;
let _layerEl = null;     // #delight-layer
let _styleEl = null;     // page <style> holding the hide rules
let _rafId = null;
const _landings = new Set();
const _byPress = new Map();   // pressId -> landing
let _unsubscribe = [];

export function init(appBus, svgElement) {
  App = appBus;
  _svgEl = svgElement;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_plop.init: '#delight-layer' not found");
  if (!svgElement.querySelector(`#${SHADOW_FILTER_ID}`)) {
    (svgElement.querySelector('defs') ?? svgElement).appendChild(blurFilter(SHADOW_FILTER_ID, 3));
  }
  _landings.clear();
  _byPress.clear();
  _rafId = null;
  _styleEl?.remove();
  _styleEl = document.createElement('style');
  _styleEl.id = 'landing-hide-rules';
  document.head.appendChild(_styleEl);
  for (const off of _unsubscribe) off();
  _unsubscribe = [
    App.on('toy:add:press', ({ pressId, x, y, preview }) => {
      if (reducedMotion()) return;
      const L = press(x, y, preview());
      if (L) _byPress.set(pressId, L);
    }),
    App.on('toy:add:release', ({ pressId }) => release(_byPress.get(pressId))),
    App.on('toy:add:place', ({ pressId, id }) => {
      attach(_byPress.get(pressId), _svgEl.querySelector(`#toys-layer [data-id="${id}"]`));
      _byPress.delete(pressId);
    }),
    App.on('toy:add:cancel', ({ pressId }) => {
      cancel(_byPress.get(pressId));
      _byPress.delete(pressId);
    }),
  ];
}

function el(tag, attrs, parent) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function sizeOf(toyEl) {
  const svg = toyEl.firstElementChild;
  return {
    w: parseFloat(svg?.getAttribute('width')) || 0,
    h: parseFloat(svg?.getAttribute('height')) || 0,
  };
}

function syncHideRules() {
  const ids = [..._landings].map(L => L.toyId).filter(Boolean);
  _styleEl.textContent = ids.length
    ? `${ids.map(id => `#toys-layer [data-id="${id}"]`).join(',\n')} { opacity: 0 }`
    : '';
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

/**
 * Start squashing at canvas point (x, y). ghost is a detached toy <g>
 * already positioned there, or null when the template isn't loaded yet (the
 * press then shows nothing, and the release starts once the toy exists).
 * Returns the landing, or null when motion is reduced.
 */
export function press(x, y, ghost) {
  if (!_layerEl || reducedMotion()) return null;
  const L = {
    x, y, w: 0, h: 0,
    phase: 'press', t0: performance.now(), from: 0,
    toyId: null, hasContent: !!ghost, done: false,
  };
  L.root = el('g', { class: 'landing' }, _layerEl);
  L.shadow = el('ellipse', { cx: x, cy: y, rx: 0, ry: 0, fill: '#000', opacity: 0, filter: `url(#${SHADOW_FILTER_ID})` }, L.root);
  L.pose = el('g', {}, L.root);
  if (ghost) {
    Object.assign(L, sizeOf(ghost));
    L.pose.appendChild(ghost);
  }
  _landings.add(L);
  render(L, performance.now());
  tick();
  return L;
}

/** The pointer came up: stretch and settle from wherever the press got to. */
export function release(L) {
  if (!L || L.phase !== 'press') return;
  L.from = pressDeform(performance.now() - L.t0);
  L.phase = 'release';
  L.t0 = null;
  if (L.hasContent) startRelease(L);
}

function startRelease(L) {
  L.t0 = performance.now();
  spawnPuff(_layerEl, L, App?.getViewScale?.() ?? 1);
  tick();
}

/** The real toy is in #toys-layer: show it through <use> and hide it. */
export function attach(L, toyEl) {
  if (!L || L.done || !toyEl) return;
  L.toyId = toyEl.getAttribute('data-id');
  Object.assign(L, sizeOf(toyEl));
  L.pose.replaceChildren(el('use', { href: `#${toyEl.id}` }));
  L.hasContent = true;
  syncHideRules();
  if (L.phase === 'release' && L.t0 === null) startRelease(L);
  tick();
}

/** The press was abandoned, or placement failed: shrink back and fade. */
export function cancel(L) {
  if (!L || L.done || L.phase === 'cancel') return;
  const now = performance.now();
  L.from = L.phase === 'press' ? pressDeform(now - L.t0)
    : L.t0 === null ? L.from : releaseDeform(now - L.t0, L.from);
  L.phase = 'cancel';
  L.t0 = now;
  tick();
}

function finish(L) {
  L.done = true;
  L.root.remove();
  _landings.delete(L);
  syncHideRules();
}

// ── Rendering ─────────────────────────────────────────────────────────────

function render(L, now) {
  let d = 0, op = 1;
  if (L.phase === 'press') d = pressDeform(now - L.t0);
  else if (L.phase === 'release') {
    if (L.t0 === null) d = L.from;
    else {
      const t = now - L.t0;
      // Held until the real toy is attached, so it never blinks out.
      if (t >= releaseMs() && L.toyId) { finish(L); return; }
      d = releaseDeform(t, L.from);
    }
  } else {
    const u = clamp01((now - L.t0) / CANCEL_MS);
    if (u >= 1) { finish(L); return; }
    d = L.from * (1 - EASE_OUT(u));
    op = 1 - EASE_OUT(u);
  }
  const k = scaleFor(d);
  L.pose.setAttribute('transform', `translate(${L.x} ${L.y}) scale(${k}) translate(${-L.x} ${-L.y})`);
  L.pose.setAttribute('opacity', op);
  L.shadow.setAttribute('rx', L.w * SHADOW_RATIO * k);
  L.shadow.setAttribute('ry', L.h * SHADOW_RATIO * k);
  L.shadow.setAttribute('opacity', L.hasContent ? SHADOW_OPACITY * op : 0);
}

// Times come from performance.now() throughout, the clock t0 was read
// from, not from the rAF timestamp.
function frame() {
  _rafId = null;
  const now = performance.now();
  for (const L of [..._landings]) render(L, now);
  const animating = [..._landings].some(L => L.phase !== 'release' || L.t0 !== null);
  if (animating) tick();
}

function tick() {
  if (_rafId == null) _rafId = requestAnimationFrame(frame);
}
