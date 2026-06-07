/**
 * tools-boun_pos.js — tool registry for the Boundaries and Positions layer.
 *
 * Three tools:
 *   boundary     — drag to draw a named boundary region (<g> with <path>+<text>)
 *   pos-grid-sq  — drag to fill an extent with a square snap grid
 *   pos-grid-hex — drag to fill an extent with a pointy-top hex snap grid
 *
 * All three use the same rubber-band drag interaction; canvas.js dispatches
 * on d.type in finishDraft.
 */

import { stepper } from './tools-schema.js';

export const LAYER = 'boundaries-positions';

const svg = (inner) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const TOOLS = [
  {
    name:     'boundary',
    label:    'Boundary',
    layer:    LAYER,
    icon:     svg('<rect x="3" y="3" width="18" height="18" rx="0" stroke-dasharray="4 2"/><text x="17" y="8" font-size="6" font-family="monospace" fill="currentColor" stroke="none">B</text>'),
    defaults: {},
    options:  [],
  },
  {
    name:     'pos-grid-sq',
    label:    'Sq Grid',
    layer:    LAYER,
    icon:     svg('<rect x="3" y="3" width="18" height="18" rx="0"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/>'),
    defaults: { spacing: 80, 'snap-radius': 30 },
    options:  [
      stepper('spacing',     'Grid spacing', { min: 20, max: 200, step: 4 }),
      stepper('snap-radius', 'Snap radius',  { min: 5,  max: 100, step: 1 }),
    ],
  },
  {
    name:     'pos-grid-hex',
    label:    'Hex Grid',
    layer:    LAYER,
    icon:     svg('<polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" stroke-dasharray="3 1"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>'),
    defaults: { 'hex-size': 40, 'snap-radius': 30 },
    options:  [
      stepper('hex-size',    'Hex size',    { min: 15, max: 100, step: 5 }),
      stepper('snap-radius', 'Snap radius', { min: 5,  max: 100, step: 1 }),
    ],
  },
];
