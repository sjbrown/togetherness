/**
 * delight_move.js — a puff of dust where the local player's moved toys come
 * to rest
 *
 * Driven by App's move:* notifications (see App.on):
 *   move:placed → a small puff around each moved toy, centred on where it
 *                 now rests
 *
 * Local only. Nothing here reaches the doc or awareness, and the toys in
 * #toys-layer are never touched: the puff plays in #delight-layer.
 */

import { spawnPuff } from './delight_puff.js';

const PUFF = { count: 3 };

let App = null;
let _svgEl = null;
let _layerEl = null;     // #delight-layer
let _unsubscribe = [];

export function init(appBus, svgElement) {
  App = appBus;
  _svgEl = svgElement;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_move.init: '#delight-layer' not found");
  for (const off of _unsubscribe) off();
  _unsubscribe = [
    App.on('move:placed', ({ layer, moves }) => {
      if (layer !== 'toys' || reducedMotion()) return;
      const scale = App.getViewScale?.() ?? 1;
      for (const { id, x, y } of moves) {
        const toyEl = _svgEl.querySelector(`#toys-layer [data-id="${id}"]`);
        spawnPuff(_layerEl, { x, y, ...sizeOf(toyEl) }, scale, PUFF);
      }
    }),
  ];
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
