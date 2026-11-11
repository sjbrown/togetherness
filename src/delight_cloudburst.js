/**
 * delight_cloudburst.js — a cloud of dust where the local player's deleted
 * toys were
 *
 * Driven by App's toy:delete signal (see App.on):
 *   toy:delete → a cloudburst centred on each deleted toy
 * A cloudburst is ten soft puffs from a ring around the toy, rolling gently
 * outward and climbing a little faster than they spread (riseMs < ms).
 *
 * Local only. Nothing here reaches the doc or awareness: the puffs play in
 * #delight-layer.
 */

import { spawnPuff } from './delight_puff.js';

// Tunables (from tests/dev/delight-tuner.html, cloudburst mode).
export const CLOUDBURST = {
  count: 10,
  spread: 0.5,
  dist: 40,
  rise: 28,
  ms: 1100,
  riseMs: 550,
  size: 4.5,
  grow: 3.5,
  jitter: 0.5,
  alpha: 0.5,
  blur: 3,
};

let App = null;
let _layerEl = null;     // #delight-layer
let _unsubscribe = [];

export function init(appBus, svgElement) {
  App = appBus;
  _layerEl = svgElement.querySelector('#delight-layer');
  if (!_layerEl) throw new Error("delight_cloudburst.init: '#delight-layer' not found");
  for (const off of _unsubscribe) off();
  _unsubscribe = [
    App.on('toy:delete', ({ toys }) => {
      if (reducedMotion()) return;
      const scale = App.getViewScale?.() ?? 1;
      for (const toy of toys) spawnPuff(_layerEl, toy, scale, CLOUDBURST);
    }),
  ];
}

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
