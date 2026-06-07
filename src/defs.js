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
 * being dragged. Applied via <use href="#yid-{id}" filter="url(#...)"> in the
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
 * Radial gradient for position-set snap point circles.
 * Centre: white 22% opacity. Edge: white 6% opacity.
 * Inject into the canvas <defs> at boot alongside the drag filter.
 */
export const snapPointGradientSVG = `<radialGradient id="${SNAP_POINT_GRADIENT_ID}" cx="50%" cy="50%" r="50%" gradientUnits="objectBoundingBox">
  <stop offset="0%"   stop-color="white" stop-opacity="0.22"/>
  <stop offset="100%" stop-color="white" stop-opacity="0.06"/>
</radialGradient>`;
