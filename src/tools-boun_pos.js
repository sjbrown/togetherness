/**
 * tools-boun_pos.js — tool registry for the Boundaries and Positions layer.
 *
 * The boundary tool lets users drag out a rectangular boundary region.
 * Internally the region is stored as a <path> (not <rect>), keeping the
 * schema open for non-rectangular boundaries in the future.
 *
 * Name editing and future boundary options live in the tool properties
 * panel (see ui.js bounPosToolsBody), not as declarative OptionFields here.
 */

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
];
