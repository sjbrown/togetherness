/**
 * icons.js — crdt-svg icon registry
 *
 * All SVG icons defined once here as <symbol> elements, stamped into a
 * hidden <svg><defs> block at boot. Consume with useIcon(id) anywhere.
 *
 * No external dependencies. No network. No framework.
 */

// ── Icon definitions ─────────────────────────────────────────────────────────
// Each entry: id → inner SVG path/shape content (the <symbol> viewBox is always "0 0 24 24").
// Stroke-based icons — stroke="currentColor" is set on the <symbol> so callers
// can tint with CSS color.

export const ICON_DEFS = {
  // Tools
  'select':  '<path d="M5 3l15 9-6 1.5L11 20z"/>',
  'rect':    '<rect x="4" y="6" width="16" height="12" rx="2"/>',
  'circle':  '<circle cx="12" cy="12" r="8"/>',
  'pen':     '<path d="M4 20l4-1 9-9-3-3-9 9z"/><path d="M14 7l3 3"/>',
  'text':    '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',

  // Actions
  'trash':   '<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>',
  'copy':    '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/>',
  'swatch':  '<path d="M4 19a2 2 0 0 0 2 2c4 0 8-3 8-9a6 6 0 1 0-10 7z"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/>',
  'front':   '<rect x="4" y="4" width="11" height="11" rx="2"/><path d="M9 20h11V9"/>',
  'check':   '<path d="M5 13l4 4L19 7" stroke-width="2.4"/>',
  'undo':    '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a6 6 0 0 1 0 12H9"/>',
  'save':    '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
  'upload':  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  'download':'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  'close':   '<path d="M6 6l12 12M18 6L6 18"/>',
  'info':    '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',

  // Navigation / menu
  'menu':    '<circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none"/>',

  // Panel / system
  'layers':  '<path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><path d="M12 2L2 7l10 5 10-5z"/>',
  'peers':   '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 20a5 5 0 0 1 5-5"/>',
  'history': '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a6 6 0 0 1 0 12H9"/>',

  // Gesture illustrations (used in help panel)
  'pinch':   '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4M9 11h4M11 9v4"/>',
  'pan':     '<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M3 12h18M12 3v18"/>',
  'longpress':'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8" stroke-dasharray="2 3"/>',
  'doubletap':'<path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="4"/>',

  // Layers icons
  'layer-bg':       '<rect x="3" y="3" width="18" height="18" rx="2"/>',
  'layer-draw':     '<path d="M4 20l4-1 9-9-3-3-9 9z"/><path d="M14 7l3 3"/>',
  'layer-toys':     '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  'layer-bounpos':  '<rect x="3" y="3" width="18" height="18" rx="0" stroke-dasharray="4 2"/><text x="17" y="9" font-size="7" font-family="monospace" fill="currentColor" stroke="none">B</text>',
  'eye':     '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="M17.94 17.94A10.1 10.1 0 0 1 12 20c-6 0-10-8-10-8a17.5 17.5 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.77 9.77 0 0 1 12 4c6 0 10 8 10 8a17.4 17.4 0 0 1-2.44 3.45"/><line x1="2" y1="2" x2="22" y2="22"/>',
  'edit-tab': '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
};

const SVGNS = 'http://www.w3.org/2000/svg';
const STROKE_DEFAULTS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/**
 * initIcons()
 * Call once at boot. Stamps all icons as <symbol> elements into a hidden
 * <svg><defs> block appended to <body>. Safe to call before DOMContentLoaded
 * if called from a module script (deferred by default).
 */
export function initIcons() {
  const host = document.createElementNS(SVGNS, 'svg');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';

  const defs = document.createElementNS(SVGNS, 'defs');
  for (const [id, paths] of Object.entries(ICON_DEFS)) {
    const sym = document.createElementNS(SVGNS, 'symbol');
    sym.setAttribute('id', `icon-${id}`);
    sym.setAttribute('viewBox', '0 0 24 24');
    sym.setAttribute('fill', 'none');
    sym.setAttribute('stroke', 'currentColor');
    sym.setAttribute('stroke-width', '2');
    sym.setAttribute('stroke-linecap', 'round');
    sym.setAttribute('stroke-linejoin', 'round');
    sym.innerHTML = paths;
    defs.appendChild(sym);
  }
  host.appendChild(defs);
  document.body.prepend(host);
}

/**
 * icon(id, opts?)
 * Returns an HTML string: <svg><use href="#icon-{id}"/></svg>
 * opts.size  — px size (default 22)
 * opts.cls   — extra class on the <svg>
 * opts.label — aria-label (omit for decorative icons)
 */
export function icon(id, opts = {}) {
  const size  = opts.size  ?? 22;
  const cls   = opts.cls   ? ` class="${opts.cls}"` : '';
  const label = opts.label ? ` role="img" aria-label="${opts.label}"` : ' aria-hidden="true"';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24"${cls}${label}><use href="#icon-${id}"/></svg>`;
}

/**
 * iconEl(id, opts?)
 * Like icon() but returns an actual SVGElement instead of a string.
 * Useful when building DOM imperatively (canvas.js, overlay.js).
 */
export function iconEl(id, opts = {}) {
  const size  = opts.size ?? 22;
  const el    = document.createElementNS(SVGNS, 'svg');
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('viewBox', '0 0 24 24');
  el.setAttribute('aria-hidden', 'true');
  if (opts.cls) el.setAttribute('class', opts.cls);
  const use = document.createElementNS(SVGNS, 'use');
  use.setAttribute('href', `#icon-${id}`);
  el.appendChild(use);
  return el;
}
