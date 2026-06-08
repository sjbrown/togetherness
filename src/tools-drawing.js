/**
 * tools-drawing.js — drawing-layer tool registry
 *
 * Authority for which tools exist on the 'drawing' layer (rect, circle) and
 * what options each exposes. ui.js asks App for this; it never hard-codes
 * shape names.
 */

import { swatches, number } from './tools-schema.js';

export const LAYER = 'drawing';

export const TOOLS = [
  {
    name:    'rect',
    label:   'Rect',
    layer:   LAYER,
    icon:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    defaults: { fill: '#c8941e', cornerR: 8, strokeW: 1.5, opacity: 0.8 },
    options: [
      swatches('fill', 'Fill'),
      number('cornerR', 'Corner radius', { min: 0,   max: 40, step: 2 }),
      number('strokeW', 'Stroke width',  { min: 0.5, max: 8,  step: 0.5 }),
      number('opacity', 'Opacity',       { min: 0,   max: 1,  step: 0.05 }),
    ],
  },
  {
    name:    'circle',
    label:   'Circle',
    layer:   LAYER,
    icon:    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>',
    defaults: { fill: '#5a7ea8', strokeW: 1.5, opacity: 0.8 },
    options: [
      swatches('fill', 'Fill'),
      number('strokeW', 'Stroke width', { min: 0.5, max: 8,  step: 0.5 }),
      number('opacity', 'Opacity',      { min: 0,   max: 1,  step: 0.05 }),
    ],
  },
];
