/**
 * tools-schema.js — the contract between tool registries and the UI
 *
 * A registry (drawing.js, toys.js) exports a TOOLS array. Each entry is a
 * ToolDef. ui.js renders these generically — it never hard-codes a tool name
 * beyond 'select', and it never knows what options a given tool has.
 *
 * This file is documentation-as-code: it defines the shapes via JSDoc and
 * provides small helpers for building option fields. No runtime dependencies.
 *
 * ── ToolDef ──────────────────────────────────────────────────────────────────
 *   {
 *     name:   string            unique tool id, e.g. 'rect', 'd6'
 *     label:  string            short display label, e.g. 'Rect'
 *     icon:   string            inline SVG markup (the <svg>…</svg> string)
 *     layer:  string            which layer this tool belongs to
 *     options: OptionField[]    declarative spec for the tool-options popover
 *   }
 *
 * ── OptionField ──────────────────────────────────────────────────────────────
 * These are also used as ttStateSchema `types` entries (keyed by field name).
 * Discriminated by `kind`:
 *
 *   { kind:'swatches', key, label }
 *     colour picker (maps to 'color-hsl' or 'color-hslo' in ttStateSchema)
 *
 *   { kind:'number', key, label, min?, max?, step? }
 *     if both min and max are present → range slider
 *     otherwise → number input
 *
 *   { kind:'bool', key, label }
 *     checkbox
 *
 * `key` names the field in the tool's ToolMode params object. ui.js reads the
 * current value via App.getToolParam(toolName, key) and writes back via
 * App.setToolParam(toolName, key, value). The registry decides what those
 * keys mean — the UI just renders and round-trips them.
 */

export const swatches = (key, label = 'Color') => ({ kind: 'swatches', key, label });
export const number   = (key, label, { min, max, step = 1 } = {}) =>
  ({ kind: 'number', key, label, min, max, step });
export const bool     = (key, label) => ({ kind: 'bool', key, label });

// The 'select' tool is universal — every layer has it. Registries do NOT
// include it; App prepends it. Defined here so there's one canonical copy.
export const SELECT_TOOL = {
  name:  'select',
  label: 'Select',
  layer: '*',
  icon:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l15 9-6 1.5L11 20z"/></svg>',
  options: [
    bool('snap',  'Snap to grid'),
    bool('multi', 'Multi-select'),
  ],
};
