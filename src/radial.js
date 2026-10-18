/**
 * radial.js — the bowstring's radial menu
 *
 * Dragging the action square (delight.js) opens a radial menu centred on the
 * square's resting position. Every toy menu action that declares a `radial`
 * property gets a spoke; releasing on a spoke fires that action, with the
 * value under the pointer as its parameter. A tap, or a release anywhere
 * that isn't an applicable spoke, still fires the default action.
 *
 * Spokes are 45° wedges in the six spots from North clockwise to West (the
 * NW quadrant is where the toy sits). They fill spots in SPOT_ORDER, in menu
 * declaration order. A spoke whose action isn't applicable keeps its spot,
 * greyed, so the others never shift under the player's muscle memory.
 *
 * The menu lives in #delight-layer, under the bowstring's own chrome, for
 * the same reason the bowstring does: #overlay-layer is wiped on every
 * awareness update. It's local only; peers see just the action's result.
 *
 * Geometry is in screen px and divided by the view scale at draw time, so
 * the menu is the same size at any zoom, and it stays upright however the
 * toy is rotated.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

// ── Tunables (screen px unless noted) ─────────────────────────────────────
export const MAX_SPOKES = 6;
export const MAX_SEGMENTS = 10;      // integers with more values render float-style
export const SPOT_ORDER = [4, 3, 5, 2, 1, 6];
export const INNER_R = 53;
export const OUTER_R = 260;
const SPOKE_GAP_DEG = 4;             // angular gap either side of a spoke
const BAND_GAP = 4;                  // radial gap between segments
const LABEL_GAP = 7;                 // outer arc to label text
const LABEL_BAND_FRAC = 0.5;         // hovered label band, as a fraction of the spoke's angle
const LABEL_FONT = 11;
const SEG_FONT = 10;
const SEG_TEXT_MIN_BAND = 9;         // segments thinner than this drop their text
const READOUT_FONT = 12;
const READOUT_HALO = 1;
const DEFAULT_SPOKE_STROKE = 4;
const DEFAULT_VALUE_STROKE = 4;
const FLOAT_DEFAULT_STROKE = 3;
export const FADE_MS = 220;          // keep in step with .radial's transition in ui.css
const ARROW_END_SCALE = 0.12;
const TEXT_DRIFT = 0.25;             // text travels this fraction of the shape's distance, outward
const TEXT_END_SCALE = 4;

// ── Pure model (unit-tested; no DOM) ──────────────────────────────────────

/**
 * Normalise a menu entry's `radial` property. `true` is a spoke with no
 * parameter; an object names exactly one parameter, keyed by its label.
 * Returns { ok, param } or { ok: false, error }.
 */
export function paramSpec(radial) {
  if (radial === true) return { ok: true, param: null };
  if (!radial || typeof radial !== 'object') return { ok: false, error: 'radial must be true or an object' };
  const labels = Object.keys(radial);
  if (labels.length !== 1) return { ok: false, error: `radial must define exactly one parameter, got ${labels.length}` };
  const label = labels[0];
  const p = radial[label];
  if (!p || typeof p.param !== 'string') return { ok: false, error: `"${label}" needs a string "param"` };
  const base = { label, name: p.param, type: p.type };
  if (p.type === 'integer' || p.type === 'float') {
    if (typeof p.min !== 'number' || typeof p.max !== 'number' || p.max <= p.min) {
      return { ok: false, error: `"${label}" needs numeric min < max` };
    }
    const step = p.type === 'integer' ? Math.max(1, Math.round(p.step ?? 1)) : (p.step ?? null);
    const def = clamp(p.default ?? p.min, p.min, p.max);
    const count = p.type === 'integer' ? Math.floor((p.max - p.min) / step) + 1 : Infinity;
    const segmented = p.type === 'integer' && count <= MAX_SEGMENTS;
    const values = segmented ? Array.from({ length: count }, (_, i) => p.min + i * step) : null;
    return { ok: true, param: { ...base, min: p.min, max: p.max, step, default: def, segmented, values,
                                labels: values?.map(String) ?? null } };
  }
  if (p.type === 'enum') {
    if (!Array.isArray(p.values) || p.values.length === 0) return { ok: false, error: `"${label}" needs a non-empty values array` };
    if (p.labels && p.labels.length !== p.values.length) return { ok: false, error: `"${label}" labels must match values` };
    const def = p.values.includes(p.default) ? p.default : p.values[0];
    return { ok: true, param: { ...base, values: p.values, labels: (p.labels ?? p.values).map(String),
                                default: def, segmented: true } };
  }
  return { ok: false, error: `"${label}" has unknown type "${p.type}"` };
}

/** The params an action runs with when nothing was picked: each parameter's default. */
export function defaultParams(radial) {
  if (radial === undefined || radial === false) return {};
  const spec = paramSpec(radial);
  if (!spec.ok || !spec.param) return {};
  return { [spec.param.name]: spec.param.default };
}

/**
 * Lay out spokes for a toy's menu. `items` is every menu entry in
 * declaration order, as { namespace, key, label, enabled, radial }. The
 * default action is the first enabled item, whether or not it has a spoke.
 * Returns { spokes } or, for an authoring error, { error }.
 */
export function buildSpokes(items) {
  const radialItems = items.filter(it => it.radial !== undefined && it.radial !== false);
  if (radialItems.length > MAX_SPOKES) {
    return { error: `${radialItems.length} menu actions define "radial"; the maximum is ${MAX_SPOKES}` };
  }
  const def = items.find(it => it.enabled);
  const spokes = [];
  for (const [i, it] of radialItems.entries()) {
    const spec = paramSpec(it.radial);
    if (!spec.ok) return { error: `${it.key}: ${spec.error}` };
    spokes.push({
      namespace: it.namespace,
      key: it.key,
      label: it.label ?? it.key,
      spot: SPOT_ORDER[i],
      param: spec.param,
      isDefault: it === def,
      enabled: !!it.enabled,
    });
  }
  return { spokes };
}

/**
 * Spot n (1..6) spans [N + (n-1)*45°, N + n*45°] clockwise, in SVG angles
 * (0 = east, y down), so north is -90.
 */
export function spotAngles(spot) {
  const a0 = -90 + (spot - 1) * 45;
  return { a0, a1: a0 + 45, mid: a0 + 22.5 };
}

/**
 * What a release at screen-px offset (dx, dy) from the centre picks, or
 * null — inside INNER_R, in the NW quadrant, on an empty spot, or on a
 * spoke that isn't applicable — which resolves the same as a tap. Past
 * OUTER_R stays on the spoke at its max value.
 * Returns { spoke, params, index, t }: index is the segment, t (0..1) the
 * fill for a float-style spoke.
 */
export function pickAt(spokes, dx, dy) {
  const d = Math.hypot(dx, dy);
  if (d < INNER_R) return null;
  let deg = Math.atan2(dy, dx) * 180 / Math.PI;
  if (deg < -90) deg += 360;               // north..west becomes -90..180
  if (deg < -90 || deg > 180) return null; // NW quadrant
  const spot = Math.min(6, Math.floor((deg + 90) / 45) + 1);
  const spoke = spokes.find(s => s.spot === spot);
  if (!spoke || !spoke.enabled) return null;
  const t = Math.min(1, (d - INNER_R) / (OUTER_R - INNER_R));
  const p = spoke.param;
  if (!p) return { spoke, params: {}, index: null, t: null };
  if (p.segmented) {
    const index = Math.min(p.values.length - 1, Math.floor(t * p.values.length));
    return { spoke, params: { [p.name]: p.values[index] }, index, t: null };
  }
  let v = p.min + t * (p.max - p.min);
  if (p.step) v = p.min + Math.round((v - p.min) / p.step) * p.step;
  v = clamp(v, p.min, p.max);
  v = p.type === 'integer' ? Math.round(v) : +v.toFixed(decimalsOf(p.step));
  return { spoke, params: { [p.name]: v }, index: null, t: (v - p.min) / (p.max - p.min) };
}

/**
 * The default action at its default value, drawn as if hovered while the
 * pointer isn't on another spoke — which is also what a release would
 * fire. Null when the default action has no spoke.
 */
export function defaultPick(spokes) {
  const spoke = spokes.find(s => s.isDefault && s.enabled);
  if (!spoke) return null;
  const p = spoke.param;
  if (!p) return { spoke, params: {}, index: null, t: null };
  if (p.segmented) return { spoke, params: { [p.name]: p.default }, index: p.values.indexOf(p.default), t: null };
  return { spoke, params: { [p.name]: p.default }, index: null, t: (p.default - p.min) / (p.max - p.min) };
}

export function samePick(a, b) {
  if (!a || !b) return a === b;
  return a.spoke === b.spoke && JSON.stringify(a.params) === JSON.stringify(b.params);
}

/**
 * CSS cubic-bezier(x1, y1, x2, y2) as a function of t in 0..1, so a JS
 * animation can follow the same curve as a CSS transition.
 */
export function cubicBezier(x1, y1, x2, y2) {
  const bx = (s) => 3 * x1 * s * (1 - s) ** 2 + 3 * x2 * s * s * (1 - s) + s ** 3;
  const by = (s) => 3 * y1 * s * (1 - s) ** 2 + 3 * y2 * s * s * (1 - s) + s ** 3;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0, hi = 1, s = t;
    for (let i = 0; i < 30; i++) {
      s = (lo + hi) / 2;
      if (bx(s) < t) lo = s; else hi = s;
    }
    return by(s);
  };
}

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function decimalsOf(step) {
  if (!step) return 2;
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

function formatValue(v, p) {
  return p.type === 'integer' ? String(v) : Number(v).toFixed(decimalsOf(p.step));
}

// ── DOM ───────────────────────────────────────────────────────────────────

let _arcSeq = 0;

function el(tag, attrs, parent) {
  const node = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

function polar(cx, cy, r, deg) {
  const a = deg * Math.PI / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedgePath(cx, cy, r0, r1, a0, a1) {
  const [x0, y0] = polar(cx, cy, r1, a0), [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1), [x3, y3] = polar(cx, cy, r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3} Z`;
}

function arcPath(cx, cy, r, a0, a1, reverse) {
  const [x0, y0] = polar(cx, cy, r, reverse ? a1 : a0);
  const [x1, y1] = polar(cx, cy, r, reverse ? a0 : a1);
  return `M${x0} ${y0} A${r} ${r} 0 0 ${reverse ? 0 : 1} ${x1} ${y1}`;
}

/**
 * Build the menu, invisible, as the first child of hostEl so the
 * bowstring's chrome draws over it. `origin` is canvas space; `paint` is
 * the local player's gradient as { grad: 'url(#…)', stop: color }.
 */
export function open(hostEl, { spokes, origin, scale, paint }) {
  const group = el('g', { class: 'radial' });
  if (paint?.grad) group.style.setProperty('--radial-grad', paint.grad);
  if (paint?.stop) group.style.setProperty('--radial-stop', paint.stop);
  hostEl.insertBefore(group, hostEl.firstChild);
  const state = { group, spokes, origin, scale, pick: null, shown: false };
  render(state);
  return state;
}

/** Fade in. Called once the gesture is definitely a drag, so a tap never flashes it. */
export function show(state) {
  if (state.shown) return;
  state.shown = true;
  state.group.classList.add('show');
}

/** Update the hovered pick (null for none); redraws only when it changed. */
export function setPick(state, pick) {
  if (samePick(pick, state.pick)) return;
  state.pick = pick;
  render(state);
}

/** Fade out, then remove. A menu that never showed goes at once. */
export function close(state) {
  if (!state.shown) { state.group.remove(); return; }
  state.group.classList.remove('show');
  setTimeout(() => state.group.remove(), FADE_MS);
}

function render(state) {
  const { group, spokes, origin: { x: cx, y: cy }, scale } = state;
  group.textContent = '';
  const u = 1 / scale;
  const inner = INNER_R * u, outer = OUTER_R * u, band = outer - inner;
  const bandGap = BAND_GAP * u;
  const pick = state.pick ?? defaultPick(spokes);

  for (const s of spokes) {
    const { a0, a1, mid } = spotAngles(s.spot);
    const g0 = a0 + SPOKE_GAP_DEG, g1 = a1 - SPOKE_GAP_DEG;
    const hovered = pick?.spoke === s;
    const g = el('g', { class: `spoke${hovered ? ' hover' : ''}${s.enabled ? '' : ' disabled'}` }, group);
    const p = s.param;

    if (p?.segmented) {
      const n = p.values.length;
      for (let i = 0; i < n; i++) {
        const r0 = inner + band * i / n + (i ? bandGap / 2 : 0);
        const r1 = inner + band * (i + 1) / n - (i < n - 1 ? bandGap / 2 : 0);
        const segHover = hovered && pick.index === i;
        el('path', { d: wedgePath(cx, cy, r0, r1, g0, g1), class: `spoke-seg${segHover ? ' hover chosen' : ''}` }, g);
        if (s.enabled && p.values[i] === p.default) {
          const inset = DEFAULT_VALUE_STROKE * u / 2;
          const insetDeg = inset / ((r0 + r1) / 2) * 180 / Math.PI;
          el('path', { d: wedgePath(cx, cy, r0 + inset, r1 - inset, g0 + insetDeg, g1 - insetDeg),
                       class: 'seg-default', 'stroke-width': DEFAULT_VALUE_STROKE * u }, g);
        }
        if ((r1 - r0) * scale >= SEG_TEXT_MIN_BAND) {
          const [tx, ty] = polar(cx, cy, (r0 + r1) / 2, mid);
          el('text', { x: tx, y: ty, 'font-size': SEG_FONT * u, class: `seg-text${segHover ? ' chosen' : ''}` }, g)
            .textContent = p.labels[i];
        }
      }
    } else {
      // A plain spoke is one segment, so hovering it highlights the whole wedge.
      el('path', { d: wedgePath(cx, cy, inner, outer, g0, g1), class: `spoke-seg${hovered && !p ? ' hover chosen' : ''}` }, g);
      if (p) {
        const shownV = hovered ? pick.params[p.name] : p.default;
        if (hovered) {
          el('path', { d: wedgePath(cx, cy, inner, inner + band * pick.t, g0, g1), class: 'spoke-fill chosen' }, g);
        }
        if (s.enabled) {
          const rd = inner + band * (p.default - p.min) / (p.max - p.min);
          el('path', { d: arcPath(cx, cy, rd, g0, g1, false), class: 'float-default', 'stroke-width': FLOAT_DEFAULT_STROKE * u }, g);
        }
        const [tx, ty] = polar(cx, cy, inner + band / 2, mid);
        el('text', { x: tx, y: ty, 'font-size': READOUT_FONT * u, 'stroke-width': READOUT_HALO * u,
                     class: `readout${hovered ? ' chosen' : ''}` }, g).textContent = formatValue(shownV, p);
      }
    }
    if (s.isDefault && s.enabled) {
      el('path', { d: wedgePath(cx, cy, inner, outer, g0, g1), class: 'spoke-outline', 'stroke-width': DEFAULT_SPOKE_STROKE * u }, g);
    }

    // Labels along the outer arc. Below the horizontal the arc runs
    // counter-clockwise so the text reads left to right, which turns the
    // glyphs inward; the baseline moves out by a line to compensate.
    const reverse = Math.sin(mid * Math.PI / 180) > 0;
    const fs = LABEL_FONT * u, gap = LABEL_GAP * u;
    const lines = p ? [s.label, p.label] : [s.label];
    // A hovered spoke's label sits on a band styled like a segment. It's
    // only decoration: past the outer radius picks the spoke's max value.
    if (hovered) {
      const r1 = outer + gap + fs * lines.length + 2 * u + Math.max(0, gap - bandGap);
      const half = (g1 - g0) / 2 * LABEL_BAND_FRAC;
      el('path', { d: wedgePath(cx, cy, outer + bandGap, r1, mid - half, mid + half), class: 'label-band' }, g);
    }
    lines.forEach((line, li) => {
      const r = reverse ? outer + gap + fs * (li + 0.8) : outer + gap + fs * (lines.length - 1 - li) + 2 * u;
      const id = `radial-arc-${++_arcSeq}`;
      el('path', { id, d: arcPath(cx, cy, r, a0, a1, reverse), fill: 'none' }, g);
      const text = el('text', { 'font-size': fs, class: `arc-label${li === 1 ? ' param' : ''}${hovered ? ' on-band' : ''}` }, g);
      el('textPath', { href: `#${id}`, startOffset: '50%', 'text-anchor': 'middle' }, text).textContent = line;
    });
  }
}

/**
 * On a release that picked a spoke: copy the picked segment onto hostEl,
 * under the bowstring chrome, and fly it. The shape goes home with the
 * handle like an arrow on the string — the same translation, duration and
 * overshoot curve as delight.js's snap-back, so the point under the
 * pointer lands on the centre — shrinking about that point and fading over
 * the last stretch. The text drifts the other way, a quarter as far,
 * easing to a stop as it grows and fades.
 *
 * Driven from rAF on the transform attribute rather than a CSS transition:
 * a CSS transform-origin resolves against the SVG viewport, not the
 * camera-transformed layer this lives in.
 *
 * `from` is the canvas-space release point. Returns a remover; the copies
 * also remove themselves when the flight ends.
 */
export function launchChosen(state, hostEl, from, ms, snapCurve) {
  const chosen = [...state.group.querySelectorAll('.spoke.hover .chosen')];
  if (!chosen.length) return () => {};
  const { x: ox, y: oy } = state.origin;
  const wrap = (cls) => {
    const g = el('g', { class: `radial ${cls}` });
    for (const k of ['--radial-grad', '--radial-stop']) {
      const v = state.group.style.getPropertyValue(k);
      if (v) g.style.setProperty(k, v);
    }
    const inner = el('g', { class: 'spoke hover' }, g);
    return { g, inner };
  };
  const shape = wrap('radial-arrow');
  const texts = [];
  for (const n of chosen) {
    if (n.tagName.toLowerCase() === 'text') {
      const t = wrap('radial-arrow');
      t.inner.appendChild(n.cloneNode(true));
      texts.push({ ...t, cx: +n.getAttribute('x'), cy: +n.getAttribute('y') });
    } else {
      shape.inner.appendChild(n.cloneNode(true));
    }
  }
  for (const t of texts) hostEl.insertBefore(t.g, hostEl.firstChild);
  hostEl.insertBefore(shape.g, hostEl.firstChild);

  const dx = ox - from.x, dy = oy - from.y;
  const easeOut = cubicBezier(0, 0, 0.58, 1);
  const fadeLate = cubicBezier(0.7, 0, 0.9, 0.4);
  const start = performance.now();
  let raf = null;
  const remove = () => {
    if (raf != null) cancelAnimationFrame(raf);
    raf = null;
    shape.g.remove();
    for (const t of texts) t.g.remove();
  };
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    const k = snapCurve(t);
    const s = 1 + (ARROW_END_SCALE - 1) * k;
    shape.g.setAttribute('transform',
      `translate(${dx * k} ${dy * k}) translate(${from.x} ${from.y}) scale(${Math.max(s, 0.01)}) translate(${-from.x} ${-from.y})`);
    shape.g.setAttribute('opacity', 1 - fadeLate(t));
    const e = easeOut(t);
    const ts = 1 + (TEXT_END_SCALE - 1) * e;
    for (const tx of texts) {
      tx.g.setAttribute('transform',
        `translate(${-dx * TEXT_DRIFT * e} ${-dy * TEXT_DRIFT * e}) translate(${tx.cx} ${tx.cy}) scale(${ts}) translate(${-tx.cx} ${-tx.cy})`);
      tx.g.setAttribute('opacity', 1 - t * t);
    }
    if (t < 1) raf = requestAnimationFrame(step);
    else remove();
  };
  raf = requestAnimationFrame(step);
  return remove;
}
