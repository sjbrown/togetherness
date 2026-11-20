/**
 * delight_cloudburst.js — a cloud of dust where the local player's deleted
 * toys were
 *
 * Driven by App's toy:gone signal (see App.on):
 *   toy:gone → a cloudburst centred on each deleted toy
 * A cloudburst is a dozen soft puffs from close around the toy's centre,
 * rolling outward and climbing. The rise runs over riseMs, longer than the
 * puffs last, so they fade while still climbing.
 *
 * Local only. Nothing here reaches the doc or awareness: the puffs play in
 * #delight-layer.
 */

import { spawnPuff } from './delight_puff.js';

// Tunables (from tests/dev/delight-tuner.html, cloudburst mode).
export const CLOUDBURST = {
  count: 12,
  spread: 0.1,
  dist: 40,
  rise: 45,
  ms: 580,
  riseMs: 770,
  flatten: 0.5,
  size: 8,
  grow: 3,
  jitter: 0.5,
  color: '#ece6d6',
  alpha: 0.2,
  blur: 1,
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
    App.on('toy:gone', ({ toys }) => {
      if (reducedMotion()) return;
      const scale = App.getViewScale?.() ?? 1;
      for (const toy of toys) spawnPuff(_layerEl, toy, scale, CLOUDBURST);
    }),
  ];
}

function reducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
