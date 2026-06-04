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
 *   Discriminated by `kind`:
 *     { kind:'swatches', key, label }                colour picker row
 *     { kind:'stepper',  key, label, min, max, step } numeric +/- stepper
 *     { kind:'range',    key, label, min, max }       slider (0–100 style)
 *     { kind:'toggle',   key, label }                 on/off switch
 *
 *   `key` names the field in the tool's ToolMode params object. ui.js reads the
 *   current value via App.getToolParam(toolName, key) and writes back via
 *   App.setToolParam(toolName, key, value). The registry decides what those
 *   keys mean — the UI just renders and round-trips them.
 */

export const swatches = (key, label = 'Color') => ({ kind: 'swatches', key, label });
export const stepper  = (key, label, { min = 0, max = 100, step = 1 } = {}) =>
  ({ kind: 'stepper', key, label, min, max, step });
export const range    = (key, label, { min = 0, max = 100 } = {}) =>
  ({ kind: 'range', key, label, min, max });
export const toggle   = (key, label) => ({ kind: 'toggle', key, label });

// The 'select' tool is universal — every layer has it. Registries do NOT
// include it; App prepends it. Defined here so there's one canonical copy.
export const SELECT_TOOL = {
  name:  'select',
  label: 'Select',
  layer: '*',
  icon:  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l15 9-6 1.5L11 20z"/></svg>',
  options: [
    toggle('snap',  'Snap to grid'),
    toggle('multi', 'Multi-select'),
  ],
};
