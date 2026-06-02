/**
 * tools-shapes.js — drawing-layer tool registry
 *
 * Authority for which tools exist on the 'drawing' layer and what options
 * each exposes. ui.js asks App for this; it never hard-codes rect/circle.
 *
 * (Named tools-shapes.js to sit beside shapes.js, which owns the CRDT model.
 *  This file is purely the *tool palette* description — it does not touch Yjs.)
 */

import { swatches, stepper, range } from './tools-schema.js';

const svg = (inner) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

export const LAYER = 'drawing';

export const TOOLS = [
  {
    name:  'rect',
    label: 'Rect',
    layer: LAYER,
    icon:  svg('<rect x="4" y="6" width="16" height="12" rx="2"/>'),
    // Default params live here too — App seeds ToolMode from these.
    defaults: { fill: '#c8941e', cornerR: 8, strokeW: 1.5, opacity: 0.8 },
    options: [
      swatches('fill', 'Fill'),
      stepper('cornerR', 'Corner radius', { min: 0,   max: 40, step: 2 }),
      stepper('strokeW', 'Stroke width',  { min: 0.5, max: 8,  step: 0.5 }),
      range('opacity', 'Opacity', { min: 10, max: 100 }),
    ],
  },
  {
    name:  'circle',
    label: 'Circle',
    layer: LAYER,
    icon:  svg('<circle cx="12" cy="12" r="8"/>'),
    defaults: { fill: '#5a7ea8', strokeW: 1.5, opacity: 0.8 },
    options: [
      swatches('fill', 'Fill'),
      stepper('strokeW', 'Stroke width', { min: 0.5, max: 8, step: 0.5 }),
      range('opacity', 'Opacity', { min: 10, max: 100 }),
    ],
  },
];
