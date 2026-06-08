/**
 * tools-drawing.js — drawing-layer tool registry
 *
 * Authority for which tools exist on the 'drawing' layer (rect, circle).
 * Field defaults and option schemas are now owned by SHAPE_TYPES in drawing.js
 * via getTtStateSchema(). This file only provides the tool button metadata
 * (name, label, icon, layer) needed to render the pill and tool grid.
 */

export const LAYER = 'drawing';

export const TOOLS = [
  {
    name:  'rect',
    label: 'Rect',
    layer: LAYER,
    icon:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  },
  {
    name:  'circle',
    label: 'Circle',
    layer: LAYER,
    icon:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>',
  },
];
