/**
 * delight_clack.js — radial lines snapping inward where the local player's
 * moved toys lock onto a snap position
 *
 * Driven by App's toy:move:snap signal (see App.on):
 *   toy:move:snap → a clack around each toy that ended on a snap point
 * A clack is 5–8 short lines at random angles, their outer ends at most
 * MAX_EXTENT screen px from the toy's centre, that snap in toward it over
 * MS and fade. Sizes are screen px divided by the view scale.
 *
 * Local only. Nothing here reaches the doc or awareness, and the toys in
 * #toys-layer are never touched: the lines play in #delight-layer. The motion
 * is a CSS animation (.delight-clack in ui.css); each line removes itself
 * when it ends.
 */

const SVGNS = 'http://www.w3.org/2000/svg';

export const MIN_LINES = 5;
export const MAX_LINES = 8;
export const MAX_EXTENT = 100;   // outer end of a line, from the centre
export const MIN_EXTENT = 70;
export const MIN_LEN = 14;
export const MAX_LEN = 30;
export const MS = 300;
const COLOR = '#ffe9a0';
const WIDTH = 2;

/**
 * The lines for a clack centred on (cx, cy), at view scale `scale`.
 * Canvas units. rand is injectable for tests.
 */
export function clackLines(cx, cy, scale, rand = Math.random) {
  const count = MIN_LINES + Math.floor(rand() * (MAX_LINES - MIN_LINES + 1));
  const out = [];
  for (let i = 0; i < count; i++) {
    const ang = rand() * Math.PI * 2;
    const outer = (MIN_EXTENT + rand() * (MAX_EXTENT - MIN_EXTENT)) / scale;
    const inner = outer - (MIN_LEN + rand() * (MAX_LEN - MIN_LEN)) / scale;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    out.push({
      x1: cx + ca * inner, y1: cy + sa * inner,
      x2: cx + ca * outer, y2: cy + sa * outer,
    });
  }
  return out;
}

let App = null;
let _layerEl = null;     // #delight-layer
let _unsubscribe = [];

export function init(appBus, svgElement) {
  App = appBus;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_clack.init: '#delight-layer' not found");
  for (const off of _unsubscribe) off();
  _unsubscribe = [
    App.on('toy:move:snap', ({ moves }) => {
      if (reducedMotion()) return;
      const scale = App.getViewScale?.() ?? 1;
      for (const { x, y } of moves) clack(x, y, scale);
    }),
  ];
}

function clack(cx, cy, scale) {
  for (const l of clackLines(cx, cy, scale)) {
    const el = document.createElementNS(SVGNS, 'line');
    for (const [k, v] of Object.entries({
      class: 'delight-clack', x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2,
      stroke: COLOR, 'stroke-width': WIDTH / scale, 'stroke-linecap': 'round',
    })) el.setAttribute(k, v);
    el.style.setProperty('--clack-ms', `${MS}ms`);
    el.style.transformOrigin = `${cx}px ${cy}px`;
    el.addEventListener('animationend', () => el.remove());
    _layerEl.appendChild(el);
  }
}

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
