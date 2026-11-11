/**
 * delight_skid.js — a puff of dust where the local player's moved toys come
 * to rest
 *
 * Driven by App's toy:move:* signals (see App.on):
 *   toy:move:place → a small puff at each moved toy where it now rests,
 *                    kicked forward: each particle heads off at a random
 *                    angle within ARC of the direction it travelled
 *
 * Local only. Nothing here reaches the doc or awareness, and the toys in
 * #toys-layer are never touched: the puff plays in #delight-layer.
 */

import { spawnPuff } from './delight_puff.js';

const PUFF = { count: 3 };
const ARC = Math.PI / 2;

let App = null;
let _svgEl = null;
let _layerEl = null;     // #delight-layer
let _unsubscribe = [];

export function init(appBus, svgElement) {
  App = appBus;
  _svgEl = svgElement;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_skid.init: '#delight-layer' not found");
  for (const off of _unsubscribe) off();
  _unsubscribe = [
    App.on('toy:move:place', ({ moves }) => {
      if (reducedMotion()) return;
      const scale = App.getViewScale?.() ?? 1;
      for (const { id, from, x, y } of moves) {
        const toyEl = _svgEl.querySelector(`#toys-layer [data-id="${id}"]`);
        spawnPuff(_layerEl, { x, y, ...sizeOf(toyEl) }, scale, { ...PUFF, ...headingOf(from, x, y) });
      }
    }),
  ];
}

// The puff's direction and arc for a move from `from` to (x, y). A move
// that ends where it began (a snap back) has no heading: puff all round.
function headingOf(from, x, y) {
  if (!from || Math.hypot(x - from.x, y - from.y) < 1) return {};
  return { direction: Math.atan2(y - from.y, x - from.x), arc: ARC };
}

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

function sizeOf(toyEl) {
  const svg = toyEl?.firstElementChild;
  return {
    w: parseFloat(svg?.getAttribute('width')) || 0,
    h: parseFloat(svg?.getAttribute('height')) || 0,
  };
}
