/**
 * tools-drawing.js — drawing-layer tool registry
 *
 * Authority for which tools exist on the 'drawing' layer (rect, circle).
 * Field defaults and option schemas are owned by SHAPE_TYPES in drawing.js
 * via getTtStateSchema(). This file provides tool button metadata; icons are
 * loaded from src/drawing/{name}.svg on first render (see ui.js iconFor()).
 */

export const LAYER = 'drawing';

export const TOOLS = [
  {
    name:    'rect',
    label:   'Rect',
    layer:   LAYER,
    iconUrl: 'drawing/rect.svg',
  },
  {
    name:    'circle',
    label:   'Circle',
    layer:   LAYER,
    iconUrl: 'drawing/circle.svg',
  },
];
