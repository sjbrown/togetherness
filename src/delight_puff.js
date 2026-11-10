/**
 * delight_puff.js — a puff of dust, for delight effects to fire
 *
 * Soft circles leave a flattened ring around a point, drift outward and up,
 * grow and fade. Positions are canvas units; sizes are screen px divided by
 * the view scale, so a puff looks the same at any zoom. The motion is a CSS
 * animation (.delight-puff in ui.css), and each circle removes itself when
 * it ends. The blur filter is injected into the canvas <defs> on first use.
 */

const SVGNS = 'http://www.w3.org/2000/svg';
export const PUFF_FILTER_ID = 'delight-puff';

// Defaults; spawnPuff and puffParticles take overrides of any of these.
export const PUFF = {
  count: 5,
  spread: 0.6,     // starting ring radius, as a fraction of half the larger of w, h
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

/**
 * The particles for a puff around something w×h centred on (cx, cy), at
 * view scale `scale`. Canvas units. rand is injectable for tests.
 */
export function puffParticles(cx, cy, w, h, scale, overrides = {}, rand = Math.random) {
  const { count, spread, dist, rise, flatten, size, grow, ms, jitter } = { ...PUFF, ...overrides };
  const ring = Math.max(w, h) * 0.5 * spread;
  const step = (Math.PI * 2) / count;
  const out = [];
  for (let i = 0; i < count; i++) {
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

/**
 * Fire a puff into layerEl around { x, y, w, h } (canvas units, centred on
 * x, y) at view scale `scale`.
 */
export function spawnPuff(layerEl, { x, y, w, h }, scale, overrides = {}) {
  const { color, alpha, blur } = { ...PUFF, ...overrides };
  filterIn(layerEl.ownerSVGElement)?.firstElementChild.setAttribute('stdDeviation', blur / scale);
  for (const p of puffParticles(x, y, w, h, scale, overrides)) {
    const c = document.createElementNS(SVGNS, 'circle');
    for (const [k, v] of Object.entries({
      class: 'delight-puff', cx: p.x, cy: p.y, r: p.r0,
      fill: color, opacity: 0, filter: `url(#${PUFF_FILTER_ID})`,
    })) c.setAttribute(k, v);
    c.style.setProperty('--tx', `${p.tx}px`);
    c.style.setProperty('--ty', `${p.ty}px`);
    c.style.setProperty('--r0', `${p.r0}px`);
    c.style.setProperty('--r1', `${p.r1}px`);
    c.style.setProperty('--peak', alpha * 0.875);
    c.style.setProperty('--puff-ms', `${p.ms}ms`);
    c.addEventListener('animationend', (e) => {
      if (e.animationName === 'delight-puff-fade') c.remove();
    });
    layerEl.appendChild(c);
  }
}

function filterIn(svgEl) {
  if (!svgEl) return null;
  const found = svgEl.querySelector(`#${PUFF_FILTER_ID}`);
  if (found) return found;
  let defs = svgEl.querySelector('defs');
  if (!defs) defs = svgEl.insertBefore(document.createElementNS(SVGNS, 'defs'), svgEl.firstChild);
  return defs.appendChild(blurFilter(PUFF_FILTER_ID, PUFF.blur, '-100%', '300%'));
}

/** A <filter id> holding one feGaussianBlur, for a delight effect to inject. */
export function blurFilter(id, stdDeviation, origin = '-50%', extent = '200%') {
  const f = document.createElementNS(SVGNS, 'filter');
  for (const [k, v] of Object.entries({ id, x: origin, y: origin, width: extent, height: extent })) f.setAttribute(k, v);
  const blur = document.createElementNS(SVGNS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', stdDeviation);
  f.appendChild(blur);
  return f;
}
