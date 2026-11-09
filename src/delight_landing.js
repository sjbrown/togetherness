/**
 * delight_landing.js — squash and stretch when the local player places a toy
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
 * Lifecycle, driven by canvas.js and App.commitToy:
 *   press(x, y, ghost) → release(landing) → attach(landing, toyEl)
 *   or press → cancel(landing) when the press is abandoned (pinch).
 * release and attach may come in either order: placement is async.
 *
 * The pose is a JS rAF loop because the press depth depends on how long the
 * pointer is held. The puff's start and end are known when it fires, so it
 * is a CSS animation (.landing-puff in ui.css), like the bowstring sparks.
 */

import { cubicBezier } from './ui_radial.js';
import { LANDING_SHADOW_FILTER_ID, LANDING_PUFF_FILTER_ID } from './defs.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// ── Tunables (from tests/dev/landing-tuner.html) ──────────────────────────
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

// Puff sizes are screen px, divided by the view scale when drawn.
export const PUFF = {
  count: 5,
  spread: 0.6,     // starting ring radius, as a fraction of half the toy's larger side
  dist: 30,        // outward travel
  rise: 10,        // upward drift on top of the travel
  flatten: 0.8,    // vertical squeeze of the ring and the travel
  size: 2.5,       // starting radius
  grow: 3,         // end radius = start radius * grow
  ms: 500,
  jitter: 0.4,
  color: '#ece6d6',
  alpha: 0.4,
  blur: 2.3,
};

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

/**
 * The puff's particles for a toy of w×h centred on (cx, cy), at view scale
 * `scale`. Canvas units. rand is injectable for tests.
 */
export function puffParticles(cx, cy, w, h, scale, rand = Math.random) {
  const { count, spread, dist, rise, flatten, size, grow, ms, jitter } = PUFF;
  const ring = Math.max(w, h) * 0.5 * spread;
  const out = [];
  for (let i = 0; i < count; i++) {
    const step = (Math.PI * 2) / count;
    const ang = i * step + (rand() - 0.5) * jitter * step;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const travel = (dist * (1 + (rand() - 0.5) * jitter)) / scale;
    const r0 = (size * (1 + (rand() - 0.5) * jitter * 0.8)) / scale;
    out.push({
      x: cx + ca * ring,
      y: cy + sa * ring * flatten,
      tx: ca * travel,
      ty: sa * travel * flatten - rise / scale,
      r0,
      r1: r0 * grow,
      ms: ms * (1 + (rand() - 0.5) * jitter * 0.5),
    });
  }
  return out;
}

// ── Module state ──────────────────────────────────────────────────────────

let App = null;
let _svgEl = null;
let _layerEl = null;     // #delight-layer
let _styleEl = null;     // page <style> holding the hide rules
let _rafId = null;
const _landings = new Set();

export function init(appBus, svgElement) {
  App = appBus;
  _svgEl = svgElement;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_landing.init: '#delight-layer' not found");
  _landings.clear();
  _rafId = null;
  _styleEl?.remove();
  _styleEl = document.createElement('style');
  _styleEl.id = 'landing-hide-rules';
  document.head.appendChild(_styleEl);
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
  L.shadow = el('ellipse', { cx: x, cy: y, rx: 0, ry: 0, fill: '#000', opacity: 0, filter: `url(#${LANDING_SHADOW_FILTER_ID})` }, L.root);
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
  spawnPuff(L);
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

function spawnPuff(L) {
  const scale = App?.getViewScale?.() ?? 1;
  _svgEl.querySelector(`#${LANDING_PUFF_FILTER_ID} feGaussianBlur`)
    ?.setAttribute('stdDeviation', PUFF.blur / scale);
  for (const p of puffParticles(L.x, L.y, L.w, L.h, scale)) {
    const c = el('circle', {
      class: 'landing-puff', cx: p.x, cy: p.y, r: p.r0,
      fill: PUFF.color, opacity: 0, filter: `url(#${LANDING_PUFF_FILTER_ID})`,
    }, _layerEl);
    c.style.setProperty('--tx', `${p.tx}px`);
    c.style.setProperty('--ty', `${p.ty}px`);
    c.style.setProperty('--r0', `${p.r0}px`);
    c.style.setProperty('--r1', `${p.r1}px`);
    c.style.setProperty('--peak', PUFF.alpha * 0.875);
    c.style.setProperty('--puff-ms', `${p.ms}ms`);
    c.addEventListener('animationend', (e) => {
      if (e.animationName === 'landing-puff-fade') c.remove();
    });
  }
}
