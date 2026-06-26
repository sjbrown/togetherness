/**
 * tools-schema.js — the contract between tool registries and the UI
 *
 * A registry (toys.js, boun_pos.js) exports a TOOLS array. Each entry is a
 * ToolDef. ui.js renders these generically — it never hard-codes a tool name
 * beyond 'select', and it never knows what options a given tool has.
 *
 * Drawing tools (rect, circle) no longer use this file for their schema —
 * that now lives in SHAPE_TYPES in drawing.js.
 *
 * ── ToolDef ──────────────────────────────────────────────────────────────────
 *   {
 *     name:    string            unique tool id, e.g. 'd6'
 *     label:   string            short display label
 *     icon:    string            inline SVG markup
 *     layer:   string            which layer this tool belongs to
 *     options: OptionField[]     declarative spec for the tool-options popover
 *   }
 *
 * ── OptionField ──────────────────────────────────────────────────────────────
 * Discriminated by `kind`. Each field also carries a `show` array (see
 * drawing.js SHAPE_TYPES for the full `show` semantics):
 *
 *   { kind:'color-hsl',  key, label, show? }   — opaque color picker
 *   { kind:'color-hslo', key, label, show? }   — color picker + 'none' option
 *   { kind:'number', key, label, min?, max?, step?, show? }
 *     if both min and max present → range slider; otherwise → number input
 *   { kind:'bool', key, label, show? }          — checkbox
 */

export const number = (key, label, { min, max, step = 1 } = {}) =>
  ({ kind: 'number', key, label, min, max, step });
export const bool   = (key, label) => ({ kind: 'bool', key, label });

// The 'select' tool is universal — every layer has it. Registries do NOT
// include it; App prepends it. Defined here so there's one canonical copy.
export const SELECT_TOOL = {
  name:  'select',
  label: 'Select',
  layer: '*',
  icon:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l15 9-6 1.5L11 20z"/></svg>',
  options: [
    { kind: 'bool', key: 'multi', label: 'Multi-select', show: ['add', 'addQuick'] },
  ],
};
