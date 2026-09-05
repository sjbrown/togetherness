/**
 * defs.js — shared SVG <defs> fragments
 *
 * Single source of truth for filter and gradient definitions used by both
 * the production canvas (index.html) and the visual stories (stories.html).
 *
 * Usage:
 *   import { DRAG_PLACEHOLDER_FILTER_ID, dragPlaceholderFilterSVG } from './defs.js';
 *
 *   // inject into an existing <defs> element:
 *   defsEl.insertAdjacentHTML('beforeend', dragPlaceholderFilterSVG);
 *
 *   // reference in markup:
 *   useEl.setAttribute('filter', `url(#${DRAG_PLACEHOLDER_FILTER_ID})`);
 */

/**
 * Desaturates and dims a shape to indicate "committed position" while it is
 * being dragged. Applied via <use href="#{id}" filter="url(#...)"> in the
 * overlay layer — the native layer element is never touched.
 */
export const DRAG_PLACEHOLDER_FILTER_ID = 'drag-placeholder-filter';

export const dragPlaceholderFilterSVG = `\
<filter id="drag-placeholder-filter" color-interpolation-filters="sRGB">
  <!-- Branch 1: desaturated fill at reduced opacity -->
  <feColorMatrix type="saturate" values="0" result="grey"/>
  <feComponentTransfer in="grey" result="dim-fill">
    <feFuncA type="linear" slope="0.99"/>
  </feComponentTransfer>

  <!-- Branch 2: outline ring at full opacity -->
  <feMorphology in="SourceGraphic" operator="erode" radius="3" result="eroded"/>
  <feComposite in="SourceGraphic" in2="eroded" operator="out" result="outline-color"/>
  <feColorMatrix in="outline-color" type="saturate" values="100" result="outline"/>

  <!-- Merge: fill behind, outline on top -->
  <feMerge>
    <feMergeNode in="dim-fill"/>
    <feMergeNode in="outline"/>
  </feMerge>
</filter>
`;



export const SNAP_POINT_GRADIENT_ID = 'snap-point-gradient';

/**
 * local-action-filter: recolors the action-mode affordance icons (kebab +
 * asterisk square backgrounds) to the local player's own color, using the
 * same feColorMatrix trick toys.js's colorMatrixValues() builds for toy
 * artwork recoloring — a white source pixel becomes the target color, a
 * black source pixel stays black, so icon glyphs drawn in black on top of
 * a white square background stay visible once tinted.
 * The `values` attribute is overwritten once at boot by Overlay.init, via
 * toys.js's colorMatrixValues(). The identity-ish default below is just a
 * placeholder until that first call.
 */
export const LOCAL_ACTION_FILTER_ID = 'local-action-filter';

export const localActionFilterSVG = `\
<filter id="${LOCAL_ACTION_FILTER_ID}" color-interpolation-filters="sRGB">
  <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 1 0"/>
</filter>
`;

/**
 * glow: a soft blur merged behind the source graphic. Used by the bowstring
 * handle's rect and its spark particles (see delight.js) for a subtle halo.
 */
export const GLOW_FILTER_ID = 'glow';

export const glowFilterSVG = `\
<filter id="${GLOW_FILTER_ID}" x="-50%" y="-50%" width="200%" height="200%">
  <feGaussianBlur stdDeviation="1.5" result="blur"/>
  <feMerge>
    <feMergeNode in="blur"/>
    <feMergeNode in="SourceGraphic"/>
  </feMerge>
</filter>
`;

/**
 * Radial gradient for position-set snap point circles.
 * Centre: white 22% opacity. Edge: white 6% opacity.
 * Inject into the canvas <defs> at boot alongside the drag filter.
 */
export const snapPointGradientSVG = `<radialGradient id="${SNAP_POINT_GRADIENT_ID}" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
  <stop offset="0%"   stop-color="white" stop-opacity="0.22"/>
  <stop offset="100%" stop-color="white" stop-opacity="0.06"/>
</radialGradient>`;
