/**
 * delight.js — the Bowstring Handle
 *
 * A drag-to-fire control attached to the SE action square of the locally
 * selected toy. Click it for an immediate action; pull it back like a
 * bowstring and release for a charged action.
 *
 * ── Why this is its own module, and its own layer ─────────────────────────
 *
 * Overlay.render() does `_layerEl.innerHTML = ''` and is called from
 * syncFromAwareness() — i.e. on every awareness update, which includes peer
 * cursors, peer drags, and soft-lock ticks. A bowstring pull lasts seconds.
 * Anything live that lived in #overlay-layer would be destroyed mid-gesture:
 * the rAF spin loop's target node, the CSS transition on the handle group,
 * the pending transitionend listener that fires the sparks, and the delight
 * clones.
 *
 * So the live gesture runs in its own #delight-layer, which nothing ever
 * wipes. This mirrors the existing reasoning for #local-sel-grad living in
 * <defs> rather than the overlay layer (see Overlay.setLocalGradient).
 *
 * Division of labour with overlay.js:
 *   overlay.js  — draws the RESTING affordance (the SE square, wrapped in
 *                 <g class="bowstring">), and nothing else. It may be wiped
 *                 and redrawn freely.
 *   delight.js  — owns the LIVE gesture. On pointerdown it builds its own
 *                 handle chrome in #delight-layer and drives it to
 *                 completion, independent of any overlay re-render.
 *
 * ── CSS/JS split ──────────────────────────────────────────────────────────
 * Anything whose start and end states are both known when it begins is a CSS
 * transition or keyframe, triggered from here (press pop, snap-back travel,
 * ring/toy skew loops, spark burst). Anything that must keep reading a value
 * that changes continuously and isn't known in advance — pull distance,
 * pointer velocity — is a JS rAF loop (spin) or a per-pointermove handler
 * (the elastic string). Live JS values that must compose with a looping CSS
 * animation on the SAME property ride through CSS custom properties
 * (--drag-x/--drag-y), because CSS transform always beats the SVG transform
 * attribute.
 *
 * Coordinates: the handle's resting position is canvas-space (so it tracks
 * the toy at any zoom), but the pull physics are screen-space px, so the
 * gesture feels identical regardless of zoom.
 */

import { LOCAL_ACTION_FILTER_ID, GLOW_FILTER_ID } from './defs.js';

const SVGNS = 'http://www.w3.org/2000/svg';

// ── Tunables ──────────────────────────────────────────────────────────────
// Pull physics, all in SCREEN px (see coordinates note above).
export const MAX_PULL = 200;   // pull distance at which spin stops and the string is thinnest
const CLICK_THRESHOLD = 4;     // total movement under this resolves as a click, not a drag
const MAX_SPIN_DEG_PER_SEC = 4 * 360;
const MAX_STRING_WIDTH = 22;   // matches the handle's own width, so the string reads as continuous
const MIN_STRING_WIDTH = 0.75;
const SNAP_SPEEDUP = 1.6;
const DELIGHT_TRANSLATE_SCALE = 0.05;
const HANDLE_HALF = 11;        // the handle rect is 22x22

// ── Pure math (unit-tested; no DOM) ───────────────────────────────────────

/**
 * Spin speed in deg/sec as a function of pull distance: fastest at the
 * origin, coming to a full stop at MAX_PULL. Sampled every frame from the
 * live distance rather than driven by pointer events, so the handle keeps
 * spinning even while the pointer holds still — which is exactly why this
 * can't be a CSS animation (their timeline is fixed at start).
 */
export function spinSpeedFor(dist) {
  const t = Math.min(Math.max(dist, 0) / MAX_PULL, 1);
  return MAX_SPIN_DEG_PER_SEC * (1 - t);
}

/** String stroke-width: tapers from the handle's width down to a thread. */
export function stringWidthFor(dist) {
  const t = Math.min(Math.max(dist, 0) / MAX_PULL, 1);
  return MAX_STRING_WIDTH - t * (MAX_STRING_WIDTH - MIN_STRING_WIDTH);
}

/**
 * Wobble amplitude. Zero until 60% of MAX_PULL — a fat string near the
 * origin shouldn't shake — then scales in with smoothed pointer velocity.
 */
export function wobbleAmpFor(dist, velocity) {
  const t = Math.min(Math.max(dist, 0) / MAX_PULL, 1);
  const thinFactor = Math.max(0, (t - 0.6) / 0.4);
  return Math.min(velocity * 4.5, 14) * thinFactor;
}

/** Snap-back duration in ms — longer the further it was pulled, then sped up. */
export function snapDurationFor(fromDist) {
  return (260 + Math.min(fromDist, MAX_PULL * 1.4) * 1.2) / SNAP_SPEEDUP;
}

/**
 * The string's `d`. A straight L below the wobble threshold, otherwise a
 * quadratic whose control point is pushed along the unit perpendicular to
 * the pull direction. Origin and tip are both in canvas space.
 */
export function stringPathD(origin, x, y, wobble) {
  const dx = x - origin.x, dy = y - origin.y;
  const dist = Math.hypot(dx, dy);
  if (!wobble || dist < 0.5) return `M${origin.x} ${origin.y} L${x} ${y}`;
  const midX = (origin.x + x) / 2, midY = (origin.y + y) / 2;
  const nx = -dy / dist, ny = dx / dist;
  return `M${origin.x} ${origin.y} Q${midX + nx * wobble} ${midY + ny * wobble} ${x} ${y}`;
}

// ── Module state ──────────────────────────────────────────────────────────

let App = null;
let _layerEl = null;   // #delight-layer <g> — never wiped by Overlay.render()
let _svgEl = null;
let _active = null;    // the in-flight gesture, or null when idle

export function init(appBus, svgElement) {
  App = appBus;
  _svgEl = svgElement;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) {
    throw new Error("delight.init: '#delight-layer' not found in SVG document — malformed template?");
  }
}

/** True while a bowstring gesture is in flight — canvas.js checks this. */
export function isDragging() {
  return _active !== null;
}

function el(tag, attrs) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/**
 * Hit-test a canvas-space point against elId's resting bowstring square.
 * Mirrors Overlay.hitTestResizeCorner's contract so canvas.js can check it
 * the same way, on pointerdown, before ordinary hit-testing.
 */
export function hitTestBowstring(geo, px, py, scale) {
  const origin = bowstringOrigin(geo);
  const half = (HANDLE_HALF * 2 / scale) / 2;
  return Math.abs(px - origin.x) <= half && Math.abs(py - origin.y) <= half;
}

/**
 * The handle's resting anchor: the SE corner of the selection ring, padded
 * out to match where overlay.js draws the action squares.
 */
export function bowstringOrigin(geo) {
  return { x: geo.x + geo.width + PAD, y: geo.y + geo.height + PAD };
}
const PAD = 6; // keep in step with overlay.js's PAD

// ── Gesture ───────────────────────────────────────────────────────────────

/**
 * Begin a bowstring gesture on elId. Called from canvas.js's pointerdown
 * once hitTestBowstring passes. Takes over the pointer entirely: canvas.js
 * must not also start a move/select gesture for this pointer.
 */
export function startBowstring(elId, e, stageEl) {
  if (_active) return false;
  const geo = App.getBBox(elId);
  if (!geo) return false;

  const scale = App.getViewScale();
  const origin = bowstringOrigin(geo);

  const chrome = buildChrome(origin, scale);
  const toyEl = _svgEl.querySelector(`[data-id="${elId}"]`);

  _active = {
    elId, origin, scale, stageEl,
    pointerId: e.pointerId,
    startClientX: e.clientX, startClientY: e.clientY,
    moved: 0,
    current: { x: origin.x, y: origin.y },
    angle: 0,
    velocity: 0,
    wobblePhase: 0,
    lastMove: null,
    lastSpinTime: null,
    spinAnimId: null,
    ...chrome,
    ...spawnDelights(toyEl),
  };

  setPressed(true);
  _active.spinAnimId = requestAnimationFrame(spinStep);
  return true;
}

function buildChrome(origin, scale) {
  const group = el('g', { class: 'actionColorGroup', filter: `url(#${LOCAL_ACTION_FILTER_ID})` });

  const string = el('path', {
    class: 'bowstring-string',
    d: `M${origin.x} ${origin.y} L${origin.x} ${origin.y}`,
    fill: 'none', stroke: '#e8e8e8', 'stroke-linecap': 'round',
    'stroke-width': 0, opacity: 0,
  });

  const handle = el('g', { class: 'handleGroup', transform: `translate(${origin.x} ${origin.y})` });
  const visual = el('g', { class: 'handleVisual' });
  const side = HANDLE_HALF * 2 / scale;
  visual.appendChild(el('rect', {
    x: -side / 2, y: -side / 2, width: side, height: side, rx: side * 0.25,
    fill: 'white', filter: `url(#${GLOW_FILTER_ID})`,
  }));
  // Three spokes 120° apart — the same asterisk the resting SE square draws.
  const len = side * 0.32;
  const sw = Math.max(1.5 / scale, side * 0.09);
  for (const deg of [90, 210, 330]) {
    const rad = deg * Math.PI / 180;
    const dx = Math.cos(rad) * len, dy = Math.sin(rad) * len;
    visual.appendChild(el('line', {
      x1: -dx, y1: -dy, x2: dx, y2: dy,
      stroke: '#2a2a2a', 'stroke-width': sw, 'stroke-linecap': 'round',
    }));
  }
  handle.appendChild(visual);

  group.appendChild(el('circle', { class: 'originMarker', cx: origin.x, cy: origin.y, r: 2 / scale, fill: '#555' }));
  group.appendChild(string);
  group.appendChild(handle);
  _layerEl.appendChild(group);

  return { group, string, handle, visual };
}

/**
 * Clone the toy and its selection ring as "delight" echoes. Both are pure
 * CSS skew loops once in the DOM; JS only owns their lifetime and feeds the
 * one value CSS can't originate (the pull parallax, via --drag-x/--drag-y).
 *
 * The ring clones go in #delight-layer rather than next to the real ring,
 * because the real ring lives in #overlay-layer and would take them with it
 * on the next wipe.
 */
function spawnDelights(toyEl) {
  const ringDelight0 = el('g', { class: 'selRing-delight-0' });
  const ringDelight1 = el('g', { class: 'selRing-delight-1' });
  ringDelight0.style.opacity = '0.25';
  ringDelight1.style.opacity = '0.6';

  let toyDelight = null;
  const toySvgEl = toyEl?.querySelector('svg');
  if (toySvgEl) {
    // Deep clone keeps the toy's own x/y/width/height/viewBox, so it lands
    // in exactly the same place with no extra positioning math. Text is
    // stripped so labels don't double up; defs/script are dead weight, and
    // any url(#...) inside still resolves against the original's defs since
    // SVG id lookup is document-global (safe here: the clone's lifetime is
    // strictly inside the handle-held lifetime).
    toyDelight = toySvgEl.cloneNode(true);
    toyDelight.removeAttribute('id');
    toyDelight.classList.add('toy-delight');
    toyDelight.querySelectorAll('text, tspan, defs, script').forEach(n => n.remove());
    toyDelight.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    _layerEl.appendChild(toyDelight);
  }
  _layerEl.appendChild(ringDelight0);
  _layerEl.appendChild(ringDelight1);

  return { ringDelight0, ringDelight1, toyDelight };
}

function setPressed(isPressed) {
  if (_active) _active.visual.style.transform = isPressed ? 'scale(0.86)' : 'scale(1)';
}

/**
 * translate() and rotate() are always written together as one string.
 * Position updates (pointermove) and spin updates (rAF) both land here and
 * both read the same current/angle state, so neither clobbers the other.
 */
function applyHandleTransform() {
  const { handle, current, angle } = _active;
  handle.setAttribute('transform', `translate(${current.x} ${current.y}) rotate(${angle})`);
}

function spinStep(now) {
  if (!_active) return;
  if (_active.lastSpinTime === null) _active.lastSpinTime = now;
  const dt = (now - _active.lastSpinTime) / 1000;
  _active.lastSpinTime = now;

  const { current, origin, scale } = _active;
  const dist = Math.hypot(current.x - origin.x, current.y - origin.y) * scale;
  _active.angle = (_active.angle + spinSpeedFor(dist) * dt) % 360;
  applyHandleTransform();

  _active.spinAnimId = requestAnimationFrame(spinStep);
}

/** Called from canvas.js on every pointermove while a bowstring is in flight. */
export function moveBowstring(e, canvasPoint) {
  if (!_active || e.pointerId !== _active.pointerId) return;
  const a = _active;

  a.moved = Math.max(a.moved, Math.hypot(e.clientX - a.startClientX, e.clientY - a.startClientY));

  // Smoothed screen-space velocity — the string's wobble reads pointer
  // speed, not just position, so a fast flick near max pull visibly shakes.
  const now = performance.now();
  if (a.lastMove) {
    const dt = Math.max(now - a.lastMove.t, 1);
    const inst = Math.hypot(e.clientX - a.lastMove.x, e.clientY - a.lastMove.y) / dt;
    a.velocity = a.velocity * 0.6 + inst * 0.4;
  }
  a.lastMove = { x: e.clientX, y: e.clientY, t: now };

  a.current.x = canvasPoint.x;
  a.current.y = canvasPoint.y;
  applyHandleTransform();
  updateString();
  updateParallax();
}

function updateString() {
  const a = _active;
  const { origin, current, string, scale } = a;
  const dxc = current.x - origin.x, dyc = current.y - origin.y;
  const distScreen = Math.hypot(dxc, dyc) * scale;

  if (distScreen < 0.5) { string.setAttribute('opacity', '0'); return; }

  string.setAttribute('stroke-width', (stringWidthFor(distScreen) / scale).toFixed(3));
  string.setAttribute('opacity', '1');

  const amp = wobbleAmpFor(distScreen, a.velocity);
  if (amp < 0.15) {
    string.setAttribute('d', stringPathD(origin, current.x, current.y, 0));
    return;
  }
  a.wobblePhase += 0.9 + a.velocity * 0.3;
  const wobble = (Math.sin(a.wobblePhase) * amp) / scale;
  string.setAttribute('d', stringPathD(origin, current.x, current.y, wobble));
}

/**
 * Feed the pull offset to the delight clones as custom properties. The
 * keyframes read var(--drag-x/--drag-y) inside their own transform, which
 * is the only way a live JS value can compose with a looping CSS animation
 * on the same property — a plain setAttribute('transform', ...) would be
 * silently overridden by the animation every frame.
 * delight-0 parallaxes at 2x delight-1, and both stay small: enough drift
 * to read as alive, not enough to look dragged along.
 */
function updateParallax() {
  const { origin, current, ringDelight0, ringDelight1, toyDelight } = _active;
  const dx = (current.x - origin.x) * DELIGHT_TRANSLATE_SCALE;
  const dy = (current.y - origin.y) * DELIGHT_TRANSLATE_SCALE;
  for (const [node, mult] of [[ringDelight1, 1], [toyDelight, 1], [ringDelight0, 2]]) {
    if (!node) continue;
    node.style.setProperty('--drag-x', `${dx * mult}px`);
    node.style.setProperty('--drag-y', `${dy * mult}px`);
  }
}

/** Called from canvas.js on pointerup/pointercancel. */
export function endBowstring(e) {
  if (!_active || (e && e.pointerId !== _active.pointerId)) return;
  const a = _active;

  // Release effects cut instantly rather than easing out — deliberate: the
  // character of the piece is "cut the moment you let go".
  if (a.spinAnimId != null) cancelAnimationFrame(a.spinAnimId);
  a.spinAnimId = null;
  destroyDelights();

  if (a.moved < CLICK_THRESHOLD) {
    fireClickPop();
    resetHandleInstant();
    teardown();
    App.fireBowstring(a.elId, { charged: false, pull: 0 });
    return;
  }

  setPressed(false);
  const pull = Math.hypot(a.current.x - a.origin.x, a.current.y - a.origin.y) * a.scale;
  snapBack(pull, () => {
    teardown();
    App.fireBowstring(a.elId, { charged: true, pull });
  });
}

function fireClickPop() {
  const visual = _active.visual;
  if (typeof visual.animate !== 'function') { visual.style.transform = 'scale(1)'; return; }
  const anim = visual.animate(
    [{ transform: 'scale(0.86)' }, { transform: 'scale(1.16)' }, { transform: 'scale(1)' }],
    { duration: 220, easing: 'cubic-bezier(.34,1.56,.64,1)' },
  );
  anim.onfinish = () => { visual.style.transform = 'scale(1)'; };
}

function resetHandleInstant() {
  const a = _active;
  a.current.x = a.origin.x; a.current.y = a.origin.y; a.angle = 0;
  applyHandleTransform();
  a.string.setAttribute('opacity', '0');
  a.string.setAttribute('stroke-width', '0');
}

/**
 * Exactly two known points and one easing curve — a textbook CSS
 * transition. JS only picks the duration (from how far it was pulled) and
 * times the before/after attribute change.
 *
 * Accepted trade-off: the string no longer hugs the handle in flight, it
 * just fades/thins over a fixed 150ms.
 */
function snapBack(pull, done) {
  const a = _active;
  const duration = snapDurationFor(pull);
  a.handle.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
  a.string.style.transition = 'opacity 150ms ease-out, stroke-width 150ms ease-out';

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    spawnSparks(a.origin.x, a.origin.y, a.scale);
    done();
  };

  a.handle.addEventListener('transitionend', function onSnapDone(ev) {
    if (ev.propertyName !== 'transform') return;
    a.handle.removeEventListener('transitionend', onSnapDone);
    finish();
  });
  // Safety net: transitionend never fires if the element is detached or the
  // transition is a no-op, and we must not leak the gesture if so.
  setTimeout(finish, duration + 120);

  // Defer the target change one frame so the browser registers the current
  // transform as the transition's start point first.
  requestAnimationFrame(() => {
    if (_active !== a) return;
    resetHandleInstant();
  });
}

function destroyDelights() {
  for (const k of ['ringDelight0', 'ringDelight1', 'toyDelight']) {
    const node = _active?.[k];
    if (node) { node.remove(); _active[k] = null; }
  }
}

function teardown() {
  if (!_active) return;
  destroyDelights();
  _active.group.remove();
  _active = null;
}

/**
 * JS creates N elements with randomized per-element custom properties; the
 * animation itself is 100% declarative CSS, and each spark removes itself
 * on animationend.
 */
export function spawnSparks(x, y, scale = 1) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const dist = 18 + Math.random() * 22;
    const spark = el('circle', {
      cx: x, cy: y, r: (1.6 + Math.random() * 1.4) / scale,
      fill: '#ffd76a', filter: `url(#${GLOW_FILTER_ID})`,
    });
    spark.classList.add('spark');
    spark.style.setProperty('--tx', `${(Math.cos(angle) * dist) / scale}px`);
    spark.style.setProperty('--ty', `${(Math.sin(angle) * dist) / scale}px`);
    spark.style.setProperty('--spark-duration', `${420 + Math.random() * 180}ms`);
    spark.addEventListener('animationend', () => spark.remove());
    _layerEl.appendChild(spark);
  }
}
