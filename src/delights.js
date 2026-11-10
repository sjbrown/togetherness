/**
 * delights.js — the delight effects, initialized together
 *
 * A delight effect decorates something the local player did on the table,
 * for that player only. Each is a delight_<signal>.js module named for the
 * App.on signal family it listens to (place:*, move:*, ...), and exports
 * init(App, svgEl), where it subscribes and injects whatever <defs> it
 * needs. Adding or removing one is its module plus a line here.
 */

import * as Place from './delight_place.js';

const DELIGHTS = [Place];

export function init(App, svgEl) {
  for (const d of DELIGHTS) d.init(App, svgEl);
}
