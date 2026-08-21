/**
 * ui.js — togetherness UI chrome
 *
 * Renders the chrome: pill, panel, toasts, idbar, popover, menu.
 * Reads ToolMode / SelectionMode only through the App bus.
 *
 * Design rules that keep this file testable in stories.html:
 *   1. Render functions are PURE: renderX(data) -> htmlString. They take their
 *      data as an argument and never reach into module globals. The exported
 *      wrappers (openSheet etc.) gather data from App and call the pure fn.
 *   2. ui.js knows exactly ONE tool by name: 'select'. Every other tool comes
 *      from a registry via App.getTools(layer) / App.getToolSchema(tool).
 *   3. Tool-options are rendered generically from ttStateSchema (see drawing.js
 *      SHAPE_TYPES). ui.js does not know what 'corner-r' means.
 *
 * Depends on: icons.js (icon()), ui.css, App (bus). No Yjs, no pointer events.
 */

import { icon } from './icons.js';
import * as Debug from './debug_panel.js';
import './component/color-picker.js';
import './component/range_ticked.js';

// ── Icon loading ──────────────────────────────────────────────────────────────
// Tools with an `iconUrl` have their SVG fetched once and cached here.
// Callers get the cached markup synchronously; on the first call the fetch is
// fired and the next render (triggered by the normal observe cycle) picks it up.
const _iconCache = new Map(); // url → svg markup string | 'pending' | 'error'

function iconFor(toolDef) {
  if (toolDef.icon) return toolDef.icon;
  if (!toolDef.iconUrl) return _letterIcon(toolDef.label);
  const cached = _iconCache.get(toolDef.iconUrl);
  if (cached && cached !== 'pending') return cached;
  if (!cached) {
    _iconCache.set(toolDef.iconUrl, 'pending');
    fetch(toolDef.iconUrl)
      .then(r => r.ok ? r.text() : Promise.reject(r.status))
      .then(svg => {
        _iconCache.set(toolDef.iconUrl, svg.trim());
        // Re-render pill and open panel so the fetched icon replaces the letter.
        renderPill();
        UI.refreshFromDoc?.();
      })
      .catch(() => _iconCache.set(toolDef.iconUrl, 'error'));
  }
  return _letterIcon(toolDef.label);
}

// getToolPreviewMarkup(toolDef) -- like iconFor, but for callers that want
// the actual fetched SVG document (or nothing) rather than a letter-icon
// fallback. Used by Overlay to build the add-cursor placement preview —
// for toy tools toolDef.iconUrl already points at the toy's own full SVG,
// so this doubles as "a clone of the currently selected toy"; for
// drawing/boundary tools it's just their icon glyph. Returns null if the
// tool has no iconUrl or the fetch hasn't resolved (or failed) yet — the
// caller should skip the preview in that case rather than show a letter.
export function getToolPreviewMarkup(toolDef) {
  if (!toolDef?.iconUrl) return null;
  const cached = _iconCache.get(toolDef.iconUrl);
  return (cached && cached !== 'pending' && cached !== 'error') ? cached : null;
}

function _letterIcon(label) {
  const letter = (label ?? '?')[0].toUpperCase();
  return `<svg class="tt-icon-letter" width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>${label}</title><text x="11" y="16" text-anchor="middle" font-size="14" font-family="ui-sans-serif,sans-serif" fill="currentColor">${letter}</text></svg>`;
}

// -- UIData ------------------------------------------------------------------
// Pure presentation state for the chrome. ui.js is the only writer.
export const UIData = {
  activeTool:           'select',
  mruTools:             [], // most-recently-used tool names, newest first
  selectionActive:      false,
  multiSelectionActive: false,
  selectedCount:        0,
  panelOpen:            null,
  menuOpen:             false,
  toolOptsOpen:         false,
  projectName: 'Togetherness Table',
  userId:      'anon-????',
  roomId:      '????',
};

let App = null;
const $ = s => document.querySelector(s);

// -- Init --------------------------------------------------------------------
export function init(appBus) {
  App = appBus;
  Debug.init(appBus);
  $('#scrim')?.addEventListener('click', closePanel);
  document.addEventListener('pointerdown', e => {
    const inMenu = $('#menuBtn')?.contains(e.target) || $('#menuItems')?.contains(e.target);
    if (!inMenu && UIData.menuOpen) closeMenu();
    const inOpts = $('#toolOpts')?.contains(e.target) || $('#pill')?.contains(e.target);
    if (!inOpts && UIData.toolOptsOpen) hideToolOpts();
  }, { capture: true });
  renderPill();
  updateInfoBar();
}

// -- Toasts --------------------------------------------------------------------
export function toast(msg, kind = '') {
  // Mirrored to the console for anything warning/error-level, so the exact
  // text is copy-pastable (e.g. into a bug report) — toasts self-dismiss
  // after 3s and only keep the last 3, so this is often the only place the
  // message survives.
  if (kind === 'warn' || kind === 'error') console.warn(`[toast] ${msg}`);
  const box = $('#toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.innerHTML = `<span class="dot"></span><span>${msg}</span>`;
  t.addEventListener('click', () => dismissToast(t));
  box.appendChild(t);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => dismissToast(t), 3000);
}
function dismissToast(t) {
  if (!t.parentNode || t.classList.contains('out')) return;
  t.classList.add('out');
  setTimeout(() => t.remove(), 200);
}

// -- Identity bar ------------------------------------------------------------
export function setIdentity({ projectName, userId, tableId }) {
  if (projectName) UIData.projectName = projectName;
  if (userId)      UIData.userId      = userId;
  if (tableId)     UIData.roomId      = tableId;
  const el = $('#idbar');
  if (!el) return;
  el.querySelector('.idbar-project').textContent = UIData.projectName;
  el.querySelector('.idbar-user').textContent    = UIData.userId;
  el.querySelector('.idbar-table').textContent    = `#${UIData.roomId}`;
}
export function updateInfoBar() {
  const show = UIData.menuOpen || UIData.panelOpen !== null;
  const el = $('#idbar');
  if (!el) return;
  el.classList.toggle('visible', show);
  el.setAttribute('aria-hidden', show ? 'false' : 'true');
}

// -- Menu --------------------------------------------------------------------
export function toggleMenu() {
  UIData.menuOpen = !UIData.menuOpen;
  $('#menuBtn')?.classList.toggle('open', UIData.menuOpen);
  $('#menuItems')?.classList.toggle('open', UIData.menuOpen);
  if (UIData.menuOpen) { hideToolOpts(); }
  updateInfoBar();
}
export function closeMenu() {
  UIData.menuOpen = false;
  $('#menuBtn')?.classList.remove('open');
  $('#menuItems')?.classList.remove('open');
  updateInfoBar();
}

// ==============================================================================
//  PILL
// ==============================================================================

/**
 * pillHTML(data) -- PURE. Dispatches to one of three pure sub-renderers
 * based on selection state; see each for its own data contract.
 *   data = { selectionActive, multiSelectionActive, selectedCount, activeTool,
 *            tools:ToolDef[], mruTools, layer, maxOthers, ltype, id, toyMenuActions }
 *   ltype is the sole selection's layer type ('drawing'|'toys'|'boun_pos'|null),
 *   id is its elId, and toyMenuActions is its App.getToyMenuActions() result —
 *   all three only meaningful when selectionActive is true.
 *   layer/maxOthers are only meaningful when neither selection flag is set —
 *   see noSelectionPillHTML.
 */
export function pillHTML(data) {
  if (data.multiSelectionActive) return multiSelectPillHTML(data);
  if (data.selectionActive)      return singleSelectPillHTML(data);
  return noSelectionPillHTML(data);
}

/**
 * multiSelectPillHTML(data) -- PURE. data = { selectedCount }.
 */
function multiSelectPillHTML(data) {
  const n = data.selectedCount;
  return icoBtn(ICON_ACTIONS.trash, `Delete ${n}`, "UI.deleteSelected()", 'danger');
}

/**
 * singleSelectPillHTML(data) -- PURE. data = { ltype, id, toyMenuActions }.
 */
function singleSelectPillHTML(data) {
  if (data.ltype === 'toys') {
    const budget = toyMenuRowBudget();
    const primary = (data.toyMenuActions ?? []).map(a => toyMenuItemHTML(
      a.label, icon('asterisk', { size: 16 }),
      `App.invokeToyMenuAction('${data.id}','${a.namespace}','${a.key}')`,
    ));
    const utility = [
      toyMenuItemHTML('Edit',   icon('edit',  { size: 16 }), "UI.openSheet('edit')"),
      toyMenuItemHTML('Delete', icon('trash', { size: 16 }), "UI.deleteSelected()", 'danger'),
    ];
    const rows = [...chunkItems(primary, budget), ...chunkItems(utility, budget)];
    return rows.map(row => `<div class="toy-menu-row">${row.join('')}</div>`).join('');
  }
  const canDuplicate = data.ltype === 'drawing';
  return [
    icoBtn(ICON_ACTIONS.trash, 'Delete', "UI.deleteSelected()", 'danger'),
    canDuplicate ? icoBtn(ICON_ACTIONS.copy, 'Duplicate', "UI.duplicateSelected()") : '',
    icoBtn(ICON_ACTIONS.edit,  'Edit',   "UI.openSheet('edit')"),
  ].join('');
}
function chunkItems(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}
function toyMenuRowBudget() {
  const w = (typeof window !== 'undefined' && window.innerWidth) || Infinity;
  return w < 480 ? 2 : 4;
}

/**
 * noSelectionPillHTML(data) -- PURE.
 *   data = { tools:ToolDef[], activeTool, mruTools, layer, maxOthers }
 *
 * Four sections, left to right:
 *   1. Select (cursor) tool
 *   2. Most-recently-used tools, most-recent first — only shown on the
 *      toys layer. mruTools is tracked globally across every layer
 *      (onToolChanged), but a tool remembered from a different layer
 *      never belongs to THIS layer's tools list, so scoping display to
 *      'toys' here is what keeps a stale drawing/boundaries tool from
 *      ever appearing on this layer. Accumulates left-to-right as more
 *      tools get used, in that recency order — the tool used most
 *      recently is always leftmost within this section.
 *   3. Default palette of the layer's remaining tools, minus whichever
 *      ones section 2 is already showing (never shown twice).
 *   4. An ellipsis button opening the full Tools Panel.
 *
 * maxOthers caps how many section-2+3 tool slots are shown (screen-size
 * dependent — see pillCapacity() at the renderPill() call site). MRU
 * always wins slots in that budget first, in its own recency order; the
 * palette fills whatever's left, in its normal order.
 */
function noSelectionPillHTML(data) {
  const tools  = data.tools ?? [];
  const select = tools.find(t => t.name === 'select');
  const others = tools.filter(t => t.name !== 'select');

  const mruNames = (data.layer === 'toys') ? (data.mruTools ?? []) : [];
  const mruDefs  = mruNames.map(name => others.find(t => t.name === name)).filter(Boolean);
  const mruNameSet   = new Set(mruDefs.map(t => t.name));
  const paletteTools = others.filter(t => !mruNameSet.has(t.name));

  const budget         = data.maxOthers ?? Infinity;
  const shownMru       = mruDefs.slice(0, budget);
  const paletteBudget  = Math.max(0, budget - shownMru.length);
  const shownPalette   = paletteTools.slice(0, paletteBudget);

  let html = '';
  if (select) {
    html += toolIco(select, data.activeTool);
    html += '<span class="pill-sep"></span>';
  }
  for (const t of shownMru)     html += toolIco(t, data.activeTool);
  for (const t of shownPalette) html += toolIco(t, data.activeTool);
  html += '<span class="pill-sep"></span>';
  html += ellipsisBtn();
  return html;
}

function ellipsisBtn() {
  return `<button class="ico" aria-label="More tools" title="Open Tools panel" onclick="UI.openSheet('tools')">${icon('ellipsis')}</button>`;
}
function toyMenuItemHTML(label, iconSvg, onclick, cls = '') {
  return `<div class="toy-menu-item ${cls}" onclick="${onclick}">${iconSvg}<span>${label}</span></div>`;
}
function toolIco(toolDef, activeTool) {
  const cls = activeTool === toolDef.name ? 'active' : '';
  return `<button class="ico ${cls}" aria-label="${toolDef.label}" title="${toolDef.label}" onclick="if(event.detail<2)UI.pillTap('${toolDef.name}')" ondblclick="UI.openSheet('tools')">${iconFor(toolDef)}<span class="active-dot"></span></button>`;
}
function icoBtn(iconSvg, label, onclick, cls = '') {
  if (!iconSvg) return '';
  return `<button class="ico ${cls}" aria-label="${label}" title="${label}" onclick="if(event.detail<2){${onclick}}">${iconSvg}<span class="active-dot"></span></button>`;
}
const ICON_ACTIONS = {
  trash: icon('trash'), copy: icon('copy'), edit: icon('edit'),
};

/**
 * pillCapacity() -- how many non-select, non-ellipsis tool slots
 * (MRU + default palette combined) the no-selection pill has room for at
 * the current viewport width. Reads window.innerWidth directly — this is
 * the one place screen size enters the pill; noSelectionPillHTML itself
 * stays pure and just receives the resulting number as data.maxOthers.
 *
 * Mobile (<480px): Select + Ellipsis + 3 others, per spec.
 * Tablet (<900px): a bit more breathing room.
 * Desktop: every tool in the layer fits, no truncation.
 */
function pillCapacity() {
  const w = (typeof window !== 'undefined' && window.innerWidth) || Infinity;
  if (w < 480) return 2;
  if (w < 900) return 6;
  return Infinity;
}

export function renderPill() {
  const pill = $('#pill');
  if (!pill) return;
  const ltype = UIData.selectionActive ? (App.getSelectedLtype?.() ?? null) : null;
  pill.classList.toggle('toy-menu', ltype === 'toys');
  pill.innerHTML = pillHTML({
    selectionActive:      UIData.selectionActive,
    multiSelectionActive: UIData.multiSelectionActive,
    selectedCount:        UIData.selectedCount,
    activeTool:           UIData.activeTool,
    tools:                App.getTools(App.getActiveLayer()),
    mruTools:             UIData.mruTools,
    layer:                App.getActiveLayer(),
    maxOthers:            pillCapacity(),
    ltype,
    id:                   UIData.selectionActive ? (App.getSelectedIds?.()[0] ?? null) : null,
    toyMenuActions:       ltype === 'toys' ? (App.getToyMenuActions?.() ?? []) : [],
  });
}
export function pillTap(toolName) {
  if (UIData.activeTool === toolName && !UIData.selectionActive) {
    if (UIData.toolOptsOpen) hideToolOpts();
    else showToolOpts(toolName);
  } else {
    App.setTool(toolName);
  }
}
// Generous cap on how many tool names UIData remembers — separate from
// (and larger than) however many the pill actually has room to display
// (see noSelectionPillHTML's data.maxOthers budget), so shrinking the
// viewport doesn't lose history, just how much of it is shown.
const MAX_MRU_TOOLS = 8;

// Push toolName to the front of UIData.mruTools, de-duplicating any prior
// occurrence so re-using a tool moves it, rather than repeats it.
function pushMru(toolName) {
  if (!toolName || toolName === 'select') return;
  UIData.mruTools = [toolName, ...UIData.mruTools.filter(t => t !== toolName)].slice(0, MAX_MRU_TOOLS);
}

export function onToolChanged(toolName) {
  const prev = UIData.activeTool;
  UIData.activeTool = toolName;
  if (toolName !== 'select') pushMru(toolName);
  else if (prev && prev !== 'select') pushMru(prev);
  hideToolOpts();
  renderPill();
  if (UIData.panelOpen === 'tools') {
    const body = $('#panelBody');
    if (body) { body.innerHTML = toolsBody(gatherToolsData()); wireColorPickers(body); wireRangeTicked(body); }
  }
  if (toolName !== 'select') {
    const def = App.getTool(toolName);
    toast(`${def?.label ?? toolName} tool`, 'info');
  }
}
export function onSelectionChanged(selectedIds) {
  const ids    = selectedIds instanceof Set ? selectedIds : new Set(selectedIds ?? []);
  const n      = ids.size;
  UIData.selectionActive      = n === 1;
  UIData.multiSelectionActive = n > 1;
  UIData.selectedCount        = n;
  renderPill();
  refreshLayerList();
  // Keep the Edit panel live — re-render it whenever the selection changes.
  if (UIData.panelOpen === 'edit') {
    const body = $('#panelBody');
    if (body) { body.innerHTML = editBody(gatherTtStateData()); wireColorPickers(body); wireRangeTicked(body); }
  }
}

// ==============================================================================
//  EDIT PANEL — live, schema-driven view of the selected element's attributes
// ==============================================================================

function gatherTtStateData() {
  const element = App.getElementTtStateSchema?.() ?? null;
  return {
    element,
    toyClasses: element?.ltype === 'boun_pos'
                  ? (App.getToyClasses?.() ?? [])
                  : null,
  };
}

/**
/**
 * renderSchemaField — unified field renderer for Edit panel, Tools panel, and toolOpts popup.
 *
 * ctx must include:
 *   mode     — 'edit' | 'add' | 'addQuick'
 *   id       — (edit mode) element id for App.commitEdit calls
 *   toolName — (add/addQuick mode) tool name for App.setToolParam calls
 *   label    — (add/addQuick mode) human label for the field
 *
 * typeSpec is a types entry from a ttStateSchema:
 *   { kind, show, min?, max?, step? }
 *
 * show filtering:
 *   'addQuick' surface — only rendered if show explicitly includes 'addQuick'
 *   'edit'/'add'       — rendered if show is absent/undefined, OR includes the surface token
 *   show: []           — never rendered anywhere (geometry, internal ids)
 */
function renderSchemaField(key, value, typeSpec, ctx) {
  const { mode } = ctx;
  const spec = typeof typeSpec === 'string' ? { kind: typeSpec } : (typeSpec ?? {});
  const show = spec.show;
  const kind = spec.kind;

  // ── show filtering ─────────────────────────────────────────────────────────
  if (mode === 'addQuick') {
    if (!Array.isArray(show) || !show.includes('addQuick')) return '';
  } else {
    if (Array.isArray(show) && show.length === 0) return '';
    if (Array.isArray(show) && !show.includes(mode)) return '';
  }

  // ── color picker ──────────────────────────────────────────────────────────
  if (kind === 'color-hslo' || kind === 'color-hsl') {
    const allowNone  = kind === 'color-hslo';
    const isNone     = value === 'none';
    const initial    = isNone ? '' : (value ?? '');
    const pickerId   = `cp-${Math.random().toString(36).slice(2, 9)}`;
    const noneBtn    = allowNone
      ? `<button type="button" class="cp-none ${isNone ? 'active' : ''}" data-cp-none="${pickerId}" title="No fill">∅ None</button>`
      : '';
    const picker     = `<color-picker id="${pickerId}" class="cp-field" allow-opacity="${allowNone}" hue-columns="12" rows="4" cell-size="14"${initial ? ` initial-color="${initial}"` : ''}></color-picker>`;

    if (mode === 'edit') {
      const id = ctx.id;
      return `<div class="field" data-cp-wire data-cp-mode="edit" data-cp-target="${id}" data-cp-key="${key}" data-cp-opacity="${allowNone}">
        <label>${key}</label>
        <div class="cp-row">${picker}${noneBtn}</div>
      </div>`;
    } else {
      const toolName = ctx.toolName;
      return `<div class="opt-row cp-opt-row" data-cp-wire data-cp-mode="${mode}" data-cp-target="${toolName}" data-cp-key="${key}" data-cp-opacity="${allowNone}">
        <span class="opt-label">${ctx.label ?? key}</span>
        <div class="cp-row">${picker}${noneBtn}</div>
      </div>`;
    }
  }

  // ── string → text input ───────────────────────────────────────────────────
  if (kind === 'string') {
    const safe = String(value ?? '').replace(/"/g, '&quot;');
    if (mode === 'edit') {
      return `<div class="field"><label>${key}</label><input type="text" value="${safe}"
        style="width:100%;font-size:13px;padding:5px 8px;background:var(--surface-2);border:none;color:var(--text);border-radius:4px;box-sizing:border-box;font-family:ui-monospace,monospace"
        onchange="App.commitEdit('${ctx.id}',{'${key}':this.value})"/></div>`;
    } else {
      return `<div class="opt-row"><span class="opt-label">${ctx.label ?? key}</span><input type="text" value="${safe}"
        style="font-size:13px;padding:4px 6px;background:var(--surface-2);border:none;color:var(--text);border-radius:4px;width:120px"
        onchange="App.setToolParam('${ctx.toolName}','${key}',this.value)"/></div>`;
    }
  }

  // ── bool → checkbox ───────────────────────────────────────────────────────
  if (kind === 'bool') {
    const checked = !!value;
    if (mode === 'edit') {
      return `<div class="field"><label>${key}</label><input type="checkbox" ${checked ? 'checked' : ''}
        style="width:18px;height:18px;cursor:pointer;accent-color:var(--accent)"
        onchange="App.commitEdit('${ctx.id}',{'${key}':this.checked})"/></div>`;
    } else {
      return `<div class="opt-row"><label style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:8px;cursor:pointer"><span class="opt-label">${ctx.label ?? key}</span><input type="checkbox" ${checked ? 'checked' : ''}
        style="width:18px;height:18px;cursor:pointer;accent-color:var(--accent)"
        onchange="App.setToolParam('${ctx.toolName}','${key}',this.checked)"/></label></div>`;
    }
  }

  // ── number (both min+max → range, otherwise → number input) ──────────────
  if (kind === 'number') {
    const { min, max, step = 1 } = spec;
    const hasRange = min !== undefined && max !== undefined;
    if (mode === 'edit') {
      if (hasRange) {
        return `<div class="field"><label>${key}</label>
          <range-ticked data-rt-wire data-rt-mode="edit" data-rt-target="${ctx.id}" data-rt-key="${key}"
            min="${min}" max="${max}" step="${step}" value="${value ?? min}"></range-ticked>
          </div>`;
      }
      return `<div class="field"><label>${key}</label><input type="number" value="${value ?? 0}"
        ${min !== undefined ? `min="${min}"` : ''} step="${step}"
        style="width:100%;font-size:13px;padding:5px 8px;background:var(--surface-2);border:none;color:var(--text);border-radius:4px;text-align:right;box-sizing:border-box"
        onchange="App.commitEdit('${ctx.id}',{'${key}':Number(this.value)})"/></div>`;
    } else {
      if (hasRange) {
        return `<div class="opt-row"><span class="opt-label">${ctx.label ?? key}</span>
          <range-ticked data-rt-wire data-rt-mode="${mode}" data-rt-target="${ctx.toolName}" data-rt-key="${key}"
            style="flex:1;min-width:0" min="${min}" max="${max}" step="${step}" value="${value ?? min}"></range-ticked>
          </div>`;
      }
      return `<div class="opt-row"><span class="opt-label">${ctx.label ?? key}</span><input type="number" value="${value ?? 0}"
        ${min !== undefined ? `min="${min}"` : ''} step="${step}"
        style="font-size:13px;padding:4px 6px;background:var(--surface-2);border:none;color:var(--text);border-radius:4px;text-align:right;width:80px"
        onchange="App.setToolParam('${ctx.toolName}','${key}',Number(this.value));UI.refreshToolOpts()"></div>`;
    }
  }

  return ''; // unknown kind — omit field
}

// ── color-picker wiring (impure) ───────────────────────────────────────────
// renderSchemaField emits <color-picker> elements with no event listeners
// (it's a pure string renderer). After any innerHTML assignment that may
// contain `[data-cp-wire]` fields, call wireColorPickers(container) to attach
// 'color-picked' listeners and the optional "None" toggle button.
export function wireColorPickers(container) {
  if (!container) return;
  container.querySelectorAll('[data-cp-wire]').forEach(field => {
    const mode    = field.dataset.cpMode;   // 'edit' | 'add' | 'addQuick'
    const target  = field.dataset.cpTarget; // element id (edit) or tool name (add/addQuick)
    const key     = field.dataset.cpKey;
    const hasOpacity = field.dataset.cpOpacity === 'true';
    const picker  = field.querySelector('color-picker');
    const noneBtn = field.querySelector('[data-cp-none]');

    const applyColor = (value) => {
      if (mode === 'edit') {
        App.commitEdit(target, { [key]: value });
      } else {
        App.setToolParam(target, key, value);
        refreshToolOpts();
        refreshToolsPanel();
      }
    };

    picker?.addEventListener('color-picked', (e) => {
      noneBtn?.classList.remove('active');
      applyColor(hasOpacity ? e.detail.hex8 : e.detail.hex);
    });

    noneBtn?.addEventListener('click', () => {
      noneBtn.classList.add('active');
      applyColor('none');
    });
  });
}

// ── range-ticked wiring (impure) ────────────────────────────────────────────
// renderSchemaField and checkpointFrequencyHTML emit <range-ticked>
// elements with no event listeners (both are pure string renderers).
// After any innerHTML assignment that may contain `[data-rt-wire]`
// elements, call wireRangeTicked(container) to attach 'range-changed'
// listeners. No re-render call here on purpose: <range-ticked> keeps its
// own tick labels in sync internally (see component/range_ticked.js), so
// there's nothing left for a caller-side refresh to do — and calling one
// on every drag tick would replace the live <range-ticked> element out
// from under the user's own drag, the exact bug this component exists to
// avoid (see RANGE_TICKED_README.md's "why value gets a cheap update path").
export function wireRangeTicked(container) {
  if (!container) return;
  container.querySelectorAll('range-ticked[data-rt-wire]').forEach(el => {
    const mode   = el.dataset.rtMode;   // 'edit' | 'add' | 'addQuick' | 'checkpoint'
    const target = el.dataset.rtTarget; // element id (edit) or tool name (add/addQuick)
    const key    = el.dataset.rtKey;

    el.addEventListener('range-changed', (e) => {
      const value = e.detail.value;
      if (mode === 'edit') {
        App.commitEdit(target, { [key]: value });
      } else if (mode === 'checkpoint') {
        onCheckpointFrequencyInput(value);
      } else {
        App.setToolParam(target, key, value);
      }
    });
  });
}

export function editBody(data) {
  if (!data.element) {
    return `<div style="text-align:center;padding:48px 20px 0;color:var(--text-3)">
      <div style="font-size:28px;margin-bottom:14px;opacity:.35">✦</div>
      <div style="font-size:14px;line-height:1.6">Select an object<br>to edit its properties</div>
    </div>`;
  }
  const { ltype, id, types, label, ...values } = data.element;
  const header = `<div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px">${ltype.replace('boun_pos','boundary')} · <span style="font-family:ui-monospace,monospace;font-weight:normal">${id.slice(0,16)}</span></div>`;
  const fields  = Object.entries(types)
    .map(([key, typeSpec]) => renderSchemaField(key, values[key], typeSpec, { mode: 'edit', id }))
    .join('');
  const help = ltype === 'boun_pos'
    ? bounPosHelpHTML(data.toyClasses ?? [])
    : '';
  return header + fields + help;
}

/**
 * toolOptsHTML(data) -- PURE.
 *   data = { label, toolName, schema:{types,values} }
 *   Renders only fields with show includes 'addQuick'.
 */
export function toolOptsHTML(data) {
  const schema = data.schema ?? {};
  const types  = schema.types ?? {};
  const values = data.values ?? schema.values ?? {};
  const rows = Object.entries(types)
    .map(([key, typeSpec]) => renderSchemaField(key, values[key], typeSpec,
        { mode: 'addQuick', toolName: data.toolName ?? data.label, label: key }))
    .join('');
  return rows
    ? `<h3>${data.label} options</h3>${rows}`
    : `<h3>${data.label} options</h3><div class="opt-row">No quick options.</div>`;
}

export let currentToolOpts = null;

export function showToolOpts(toolName) {
  const pill = $('#pill');
  const to   = $('#toolOpts');
  if (!pill || !to) return;
  currentToolOpts = toolName;
  const def = App.getTool(toolName);
  to.style.display = 'block';
  to.innerHTML = toolOptsHTML({
    label:    def?.label ?? toolName,
    toolName: toolName,
    schema:   App.getToolSchema(toolName),
    values:   App.getToolParams(toolName),
  });
  wireColorPickers(to);
  wireRangeTicked(to);
  const pr  = pill.getBoundingClientRect();
  const toR = to.getBoundingClientRect();
  let left = pr.left + pr.width / 2 - toR.width / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - toR.width - 12));
  to.style.left = `${left}px`;
  to.style.top  = `${pr.top - toR.height - 12}px`;
  UIData.toolOptsOpen = true;
}
export function hideToolOpts() {
  const to = $('#toolOpts');
  if (to) to.style.display = 'none';
  UIData.toolOptsOpen = false;
}
export function refreshToolOpts() {
  if (UIData.toolOptsOpen && currentToolOpts) showToolOpts(currentToolOpts);
}

export function refreshToolsPanel() {
  if (UIData.panelOpen === 'tools') openSheet('tools');
}

// ==============================================================================
//  PANEL
// ==============================================================================
const PANEL_W = 340;

const PANEL_TABS = [
  { id: 'edit',    label: 'Edit',    iconId: 'edit-tab' },
  { id: 'tools',   label: 'Tools',   iconId: 'rect' },
  { id: 'layers',  label: 'Layers',  iconId: 'layers' },
  { id: 'peers',   label: 'Peers',   iconId: 'peers' },
  { id: 'history', label: 'History', iconId: 'history' },
  { id: 'save',    label: 'File',    iconId: 'save' },
  { id: 'debug',   label: 'Debug',   iconId: 'debug' },
];
const PANEL_TITLES = {
  edit: 'Edit', tools:'Tools', peers:'Peers & sharing', history:'History & undo',
  layers:'Layers', save:'File', gestures:'Gestures & help',
  debug: 'Debug — signals & state',
};

// -- Panel open/tab persistence ------------------------------------------------
const PANEL_STATE_KEY = 'tt_panel_state';

function savePanelState(open, tab) {
  try {
    localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ open, tab }));
  } catch {} // private browsing / quota — losing this preference is fine
}

function loadPanelState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PANEL_STATE_KEY));
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null; // absent, or corrupt/stale from an older version — start fresh
  }
}

/**
 * Reopen the panel to wherever it was left, if anywhere
 */
export function restorePanelState() {
  const state = loadPanelState();
  if (!state?.open) return;
  if (!(state.tab in PANEL_TITLES)) return; // stale/corrupt tab id — don't open to nothing
  openSheet(state.tab);
}

export function panelTabsHTML(activeId) {
  return `<div class="panel-tabs">${
    PANEL_TABS.map(t =>
      `<button class="panel-tab ${activeId === t.id ? 'active' : ''}" onclick="UI.openSheet('${t.id}')">${icon(t.iconId, { size: 18 })}<span>${t.label}</span></button>`
    ).join('')
  }</div>`;
}

export function openSheet(which) {
  // Opening the panel is an intent signal: the user interactions will leave
  // the canvas, so it's a good moment to try writing a checkpoint
  if (UIData.panelOpen === null) App.maybeCheckpoint?.('panel-open');
  savePanelState(true, which);
  UIData.panelOpen = which;
  const desktop = window.innerWidth >= 760;
  if (desktop) document.documentElement.style.setProperty('--panel-w', PANEL_W + 'px');
  $('#panel')?.classList.add('open');
  $('#panel')?.setAttribute('aria-hidden', 'false');
  if (!desktop) $('#scrim')?.classList.add('open');
  const titleEl = $('#panelTitle');
  if (titleEl) titleEl.textContent = PANEL_TITLES[which] ?? which;
  const tabsHost = $('#panelTabs');
  if (tabsHost) tabsHost.innerHTML = which === 'gestures' ? '' : panelTabsHTML(which);
  const body = $('#panelBody');
  if (body) {
    body.innerHTML = ({
      edit:     () => editBody(gatherTtStateData()),
      tools:    () => toolsBody(gatherToolsData()),
      peers:    () => peersBody(gatherPeersData()),
      history:  () => histBody(App.getHistory(), App.getUndoHistory()),
      layers:   () => layersBody(gatherLayersData()),
      save:     () => saveBody(),
      gestures: () => gesturesBody(),
      debug:    () => Debug.debugBody(Debug.gatherDebugData()),
    }[which] ?? (() => ''))();
    wireColorPickers(body);
    wireRangeTicked(body);
  }
  if (which === 'peers') wirePeersToggles();
  // The Debug tab is the one panel with live listeners of its own: it
  // subscribes to the trace so it updates as things happen, not only when
  // the document changes. Mounting is therefore paired with unmounting on
  // the way out of the tab, not just on panel close.
  if (which === 'debug') Debug.mount(body);
  else                   Debug.unmount();
  updateInfoBar();
}
export function closePanel() {
  Debug.unmount();
  savePanelState(false, UIData.panelOpen); // remember the tab even though now closed
  UIData.panelOpen = null;
  $('#panel')?.classList.remove('open');
  $('#panel')?.setAttribute('aria-hidden', 'true');
  $('#scrim')?.classList.remove('open');
  document.documentElement.style.setProperty('--panel-w', '0px');
  updateInfoBar();
}

// -- Branch Acknowledge dialog ---------------------------------------------
// Blocking (every viewport, unlike the mobile-only #scrim/#panel sheet) —
// shown when a peer's own divergent content gets forked into a new table
// because in-place conflict recovery couldn't fully restore it.
//
// Called from app.js's onOpsChanged, via handleToyBranchConflict, once
// the fork it triggers has actually landed (see CONCURRENCY_AND_BRANCHING.md
// §6).
//
// A real choice, not a dismissible notice: "join the shared table" just
// closes this (the peer's current session never left it — the fork
// happened in the background, onto a separate table); "keep working on my
// branch" hard-reloads onto the forked table, since a hash-only change to
// the current page doesn't itself trigger re-loading a different table's
// document
let _pendingBranchTableId = null;

export function showBranchDialog(forkedTableId) {
  _pendingBranchTableId = forkedTableId;
  const body = $('#branchDialogBody');
  if (body) {
    body.innerHTML = `
      <p>Your table drifted out of sync with the other players while you
      were apart, and some of what you did while apart couldn't be
      automatically merged back in.</p>
      <p>Nothing was lost — it's saved in a new table:
      <strong>${forkedTableId}</strong>, findable any time from the table
      list.</p>
    `;
  }
  $('#branchDialogScrim')?.classList.add('open');
  $('#branchDialogScrim')?.setAttribute('aria-hidden', 'false');
  $('#branchDialog')?.classList.add('open');
  $('#branchDialog')?.setAttribute('aria-hidden', 'false');
}

function closeBranchDialog() {
  _pendingBranchTableId = null;
  $('#branchDialogScrim')?.classList.remove('open');
  $('#branchDialogScrim')?.setAttribute('aria-hidden', 'true');
  $('#branchDialog')?.classList.remove('open');
  $('#branchDialog')?.setAttribute('aria-hidden', 'true');
}

export function branchDialogJoin() {
  // The current session is already on the shared (authoritative) table —
  // forking never navigated anyone anywhere. Nothing to do but dismiss.
  closeBranchDialog();
}

export function branchDialogKeepWorking() {
  if (!_pendingBranchTableId) return;
  location.hash = _pendingBranchTableId;
  location.reload();
}

// -- Data gatherers (impure) ---------------------------------------------------
function gatherToolsData() {
  const layer = App.getActiveLayer();
  const activeTool = UIData.activeTool;
  return {
    layer,
    activeTool,
    tools:               App.getTools(layer),
    activeToolSchema:    App.getToolSchema(activeTool),
    activeToolParams:    App.getToolParams(activeTool),
    background:          App.getBackground(),
    defaultBackgrounds:  App.getDefaultBackgrounds(),
    toyClasses:          App.getToyClasses(),
  };
}
function gatherPeersData() {
  return {
    peers: App.getPeers(),
    offline: App.isOffline(),
    roomId: App.getTableId(),
    checkpointFrequency: App.getCheckpointFrequency?.() ?? 0,
  };
}
function gatherLayersData() {
  const active = App.getActiveLayer();
  const layers = App.getLayers().map(l => ({
    ...l,
    objects: App.getLayerObjects(l.id),
  }));
  return { layers, active, selectedIds: new Set(App.getSelectedIds()) };
}

// -- Pure body builders --------------------------------------------------------
function bgToolsBody(data) {
  const bg = data.background;
  const presets = data.defaultBackgrounds.map(p => `
    <div class="bg-preset" onclick="UI.applyBackgroundPreset('${p.url}', ${p.width}, ${p.height})"
         title="${p.label}">
      <img src="${p.url}" alt="${p.label}"/>
      <span>${p.label}</span>
    </div>`).join('');
  return `
    <div class="field">
      <label>Background image URL</label>
      <input type="url" class="text-input" id="bgUrlInput"
        value="${bg.url}"
        placeholder="https://… or img/bg_slatehex.png"
        onchange="App.setBackground({url: this.value})"
        style="width:100%;font-size:12px;font-family:ui-monospace,monospace"/>
      <div style="display:flex;gap:8px;margin-top:6px">
        <label style="flex:1;font-size:11px;color:var(--text-3)">W
          <input type="number" class="text-input" id="bgWidthInput"
            value="${bg.width}"
            onchange="App.setBackground({width: this.value})"
            style="width:100%;font-size:12px;font-family:ui-monospace,monospace"/>
        </label>
        <label style="flex:1;font-size:11px;color:var(--text-3)">H
          <input type="number" class="text-input" id="bgHeightInput"
            value="${bg.height}"
            onchange="App.setBackground({height: this.value})"
            style="width:100%;font-size:12px;font-family:ui-monospace,monospace"/>
        </label>
      </div>
    </div>
    <div class="field">
      <label>Presets</label>
      <div class="bg-preset-grid">${presets}</div>
    </div>`;
}

export function applyBackgroundPreset(url, width, height) {
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.value = val; };
  el('bgUrlInput',    url);
  el('bgWidthInput',  width);
  el('bgHeightInput', height);
  App.setBackground({ url, width, height });
}

function defaultToolsBody(data) {
  const toolBtn = t =>
    `<div class="tool ${data.activeTool === t.name ? 'active' : ''}" onclick="App.setTool('${t.name}')">${iconFor(t)}<span>${t.label}</span></div>`;
  const toolSchema = data.activeToolSchema ?? {};
  const types      = toolSchema.types ?? {};
  const values     = data.activeToolParams ?? toolSchema.values ?? {};

  // 'add'-surface fields from the active tool schema (e.g. fill colour)
  const addFields = Object.entries(types)
    .map(([key, typeSpec]) => renderSchemaField(key, values[key], typeSpec,
        { mode: 'add', toolName: data.activeTool, label: key }))
    .join('');

  // Help block — appended when the active tool schema identifies a bounPos type
  const schemaType = toolSchema.type;
  const helpHTML   = (schemaType === 'boundary' || schemaType === 'pos-set')
    ? bounPosHelpHTML(data.toyClasses ?? [])
    : '';

  return `
    <div class="field"><label>Tool · ${data.layer} layer</label>
      <div class="tool-grid">${data.tools.map(toolBtn).join('')}</div>
    </div>
    ${addFields}${helpHTML}`;
}

/**
 * "How boundaries work" help block — appended by defaultToolsBody when
 * the active tool schema has type 'boundary' or 'pos-set'.
 * `toyClasses` is the live list returned by App.getToyClasses().
 */
function bounPosHelpHTML(toyClasses) {
  const classSection = toyClasses.length > 0
    ? `<div style="margin-top:8px">
        <div style="font-size:11px;font-weight:600;color:var(--text-2);margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em">Toy classes in this document</div>
        <ul style="margin:0;padding-left:18px;font-size:12px;font-family:ui-monospace,monospace;color:var(--text-2);line-height:1.9">
          ${toyClasses.map(c => `<li>${c}</li>`).join('')}
        </ul>
        <div style="font-size:11px;color:var(--text-3);margin-top:6px">Name a boundary after one of these classes to activate the constraint for toys that carry it.</div>
      </div>`
    : `<div style="margin-top:8px;font-size:12px;color:var(--text-3);font-style:italic">No class names found on toys yet. Add CSS classes to a toy's &lt;g&gt; or inner &lt;svg&gt; to enable boundary constraints.</div>`;

  return `<div class="field" style="margin-top:12px">
    <label>How boundaries work</label>
    <div style="font-size:12px;color:var(--text-2);line-height:1.7">
      Draw a boundary region, then give it a name. Any toy whose
      <code style="font-size:11px;background:var(--surface-2);padding:1px 4px;border-radius:3px">&lt;g&gt;</code>
      or inner
      <code style="font-size:11px;background:var(--surface-2);padding:1px 4px;border-radius:3px">&lt;svg&gt;</code>
      carries that name as a CSS class will be constrained to move
      only within boundaries of that name — jumping freely between
      multiple regions that share the class, but unable to leave them all.
    </div>
    ${classSection}
    <div style="font-size:11px;color:var(--text-3);margin-top:10px">Toggle layer visibility with the eye icon in the Layers panel.</div>
  </div>`;
}

export function toolsBody(data) {
  if (data.layer === 'background') return bgToolsBody(data);
  return defaultToolsBody(data);
}

export function peersBody(data) {
  const rows = peerRowsHTML(data.peers);
  const link = `${location.origin}${location.pathname}#${data.roomId}`;
  return `
    <div class="field" id="peersListField">
      <label>Connected (<span id="peerLiveCount">${data.peers.filter(p => p.live).length}</span>)</label>
      <div id="peerRows">${rows}</div>
    </div>
    <div class="row-btn" style="border-bottom:0.5px solid var(--border)">
      <div><div style="font-size:14px;font-weight:500">Offline mode</div>
           <div style="font-size:12px;color:var(--text-3)">Queue changes, sync on reconnect</div></div>
      <div class="toggle ${data.offline ? 'on' : ''}" id="offToggle"></div>
    </div>
    <div class="peer-invite field" style="margin-top:18px"><label>Invite nearby</label>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
        <span><a target="_new" href="https://apps.1kfa.com/qr.html?q=${link}"
        >Generate QR Code ${fakeQR()} </a></span>
        <div class="room-code"><a href="${link}">${link}</a></div>
      </div>
    </div>
    ${checkpointFrequencyHTML(data.checkpointFrequency)}`;
}
function checkpointFrequencyLabel(freq) {
  return freq === 0 ? 'Off' : `Every ${freq} min${freq === 1 ? '' : 's'}`;
}
function checkpointFrequencyHTML(freq) {
  return `
    <div class="field" style="margin-top:18px">
      <label>Checkpoint frequency</label>
      <div style="font-size:12px;color:var(--text-3);margin-bottom:6px">
        Compact the history when you've been idle a while. The panel opening
        always checkpoints when there's enough to compact — this only
        controls the extra idle-triggered check.
      </div>
      <div class="opt-row">
        <span class="opt-label" id="checkpointFreqLabel">${checkpointFrequencyLabel(freq)}</span>
        <range-ticked data-rt-wire data-rt-mode="checkpoint"
          style="flex:1;min-width:0" min="0" max="10" step="1" value="${freq}"></range-ticked>
      </div>
    </div>`;
}
export function onCheckpointFrequencyInput(minutes) {
  const clamped = App.setCheckpointFrequency(minutes);
  const label = $('#checkpointFreqLabel');
  if (label) label.textContent = checkpointFrequencyLabel(clamped);
}
function avatarSVG(p) {
  const fill = p.gradId ? `url(#${p.gradId})` : p.color;
  const initial = p.name[0].toUpperCase();
  return `<svg class="avatar" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="${fill}"></circle>
    <text x="16" y="21" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">${initial}</text>
  </svg>`;
}
function peerRowsHTML(peers) {
  if (!peers.length)
    return '<div style="font-size:13px;color:var(--text-3);padding:8px 0">No other peers connected</div>';
  return peers.map(p =>
    `<div class="peer-row">${avatarSVG(p)}<div><div style="font-size:14px">${p.name}</div><div style="font-size:12px;color:var(--text-3)">${p.live ? 'editing now' : 'offline'}</div></div>${p.live ? '<span class="pulse"></span>' : ''}</div>`
  ).join('');
}
export function updatePeersPanel() {
  const rowsEl  = document.getElementById('peerRows');
  const countEl = document.getElementById('peerLiveCount');
  if (!rowsEl) return;
  const peers = App.getPeers();
  if (countEl) countEl.textContent = peers.filter(p => p.live).length;
  rowsEl.innerHTML = peerRowsHTML(peers);
}
function wirePeersToggles() {
  const off = $('#offToggle');
  if (off) {
    off.addEventListener('click', () => {
      App.setOffline(!App.isOffline());
      off.classList.toggle('on', App.isOffline());
      const dot = document.getElementById('offlineDot');
      if (dot) dot.style.display = App.isOffline() ? 'block' : 'none';
      toast(App.isOffline() ? 'Offline — syncing paused' : 'Back online', App.isOffline() ? 'warn' : '');
    });
  }
}

export function histBody(history, undoHistory = []) {
  const rowsHtml = (entries, emptyLabel) => {
    const rows = entries.map((entry, i) => {
      const swatch = entry.fill
        ? `<span class="sw-chip kind-${entry.elType}" style="background:${entry.fill};flex-shrink:0"></span>`
        : `<span class="hist-dot"></span>`;
      return `<div class="hist-item">${swatch}<span style="flex:1">${entry.label}</span>${i === 0 ? '<span class="meta">latest</span>' : ''}</div>`;
    }).join('');
    return rows || `<span class="meta">${emptyLabel}</span>`;
  };

  // App.canUndo/canRedo are cheap (no DOM, no mutation) — safe to check on
  // every render to decide whether these look clickable, the same way any
  // other panel field reflects current state.
  const undoDisabled = !App.canUndo();
  const redoDisabled = !App.canRedo();

  return `
    <div class="field"><label>Undo</label>
      <button class="action-btn" ${undoDisabled ? 'style="opacity:.4;cursor:not-allowed" disabled' : 'onclick="App.undo()"'}>${icon('undo')} Undo last action</button>
    </div>
    <div class="field"><label>History</label>
      <div class="shape-list hist-list">${rowsHtml(history, 'No history')}</div>
    </div>
    <div class="field"><label>Redo</label>
      <button class="action-btn" ${redoDisabled ? 'style="opacity:.4;cursor:not-allowed" disabled' : 'onclick="App.redo()"'}>${icon('check')} Redo last undone action</button>
    </div>
    <div class="field"><label>Undo history</label>
      <div class="shape-list hist-list">${rowsHtml(undoHistory, 'Nothing undone')}</div>
    </div>`;
}

export function layerObjectListHTML(objects, selectedIds) {
  if (!objects?.length)
    return '<div class="layer-obj-empty">No objects</div>';
  // Reverse so the topmost-rendered element (last in z-order) appears first
  // users think of "higher" as visually on top
  return [...objects].reverse().map(o => {
    const chip = `<span class="sw-chip kind-${o.kind}" style="background:${o.fill}"></span>`;
    const sel  = selectedIds instanceof Set ? selectedIds.has(o.id) : selectedIds === o.id;
    return `<div class="layer-obj-item ${sel ? 'sel' : ''}" data-id="${o.id}" onclick="App.select('${o.id}')">${chip}<span class="layer-obj-label">${o.label}</span>${sel ? '<span class="meta">selected</span>' : ''}</div>`;
  }).join('');
}

export function layersBody(data) {
  // Reverse so layers are shown top-to-bottom in intuitive visual order:
  // Drawing (highest) first, Background last -- intuitive for users
  const rows = [...data.layers].reverse().map(l => {
    const isActive = data.active === l.id;
    let objList = '';
    if (isActive) {
      objList = l.id === 'background'
        ? `<div class="layer-obj-list"><div class="layer-obj-empty"><a href="#" onclick="UI.openSheet('tools');return false" style="color:var(--primary);text-decoration:none">Change background</a></div></div>`
        : `<div class="layer-obj-list">${layerObjectListHTML(l.objects ?? [], data.selectedIds)}</div>`;
    }
    const visBtn = `<button class="layer-vis-btn" title="${l.visible ? 'Hide layer' : 'Show layer'}"
         onclick="UI.toggleLayerVisibility('${l.id}');event.stopPropagation()"
         style="background:none;border:none;cursor:pointer;padding:2px 4px;color:${l.visible ? 'var(--primary)' : 'var(--text-3)'}">
         ${icon(l.visible ? 'eye' : 'eye-off')}
       </button>`;
    return `<div class="layer-block">
      <div class=\"layer ${isActive ? 'active' : ''}\" id=\"layer-row-${l.id}\" onclick=\"UI.selectLayer('${l.id}')\">${icon(l.iconId)} <span>${l.label}</span><span class="lmeta">${l.id !== 'background' ? `${l.count} object${l.count !== 1 ? 's' : ''}` : ''}</span>${visBtn}</div>
      ${objList}
    </div>`;
  }).join('');
  return `
    <div class="field"><label>Active layer</label>
      ${rows}
      <div style="font-size:12px;color:var(--text-3);margin-top:10px">New objects are added to the active layer.</div>
    </div>`;
}

export function toggleLayerVisibility(id) {
  const layer = App.getLayers().find(l => l.id === id);
  App.setLayerVisible(id, !(layer?.visible ?? false));
}

export function selectLayer(id) {
  App.setLayer(id);
  // Re-render the whole layers body so collapse/expand updates in place
  if (UIData.panelOpen === 'layers') {
    const body = $('#panelBody');
    if (body) body.innerHTML = layersBody(gatherLayersData());
  }
}

/**
 * Called whenever the document changes (shapes, toys, history).
 * Re-renders whichever panel tab is currently open, so the UI
 * stays current without the doc layer knowing anything about panels.
 */
export function refreshFromDoc() {
  renderPill();
  const body = $('#panelBody');
  if (!body) return;
  switch (UIData.panelOpen) {
    case 'edit':    body.innerHTML = editBody(gatherTtStateData());   wireColorPickers(body); wireRangeTicked(body); break;
    case 'history': body.innerHTML = histBody(App.getHistory(), App.getUndoHistory());   break;
    case 'layers':  body.innerHTML = layersBody(gatherLayersData()); break;
    case 'tools':   body.innerHTML = toolsBody(gatherToolsData()); wireColorPickers(body); wireRangeTicked(body); break;
    // Debug re-renders itself in place (it owns listeners and scroll
    // position); it must not have its innerHTML replaced from out here.
    case 'debug':   Debug.refresh(); break;
  }
}

export function refreshLayerList() {
  if (UIData.panelOpen !== 'layers') return;
  // Patch only the sel class and meta badge on each item in-place, preserving
  // scroll position. A full innerHTML replace would reset scrollTop to 0.
  const selectedIds = new Set(App.getSelectedIds());
  document.querySelectorAll('.layer-obj-item').forEach(el => {
    const id = el.dataset.id;
    if (!id) return;
    const isSel = selectedIds.has(id);
    el.classList.toggle('sel', isSel);
    // Update or remove the meta badge without touching the chip or label
    let badge = el.querySelector('.meta');
    if (isSel && !badge) {
      badge = document.createElement('span');
      badge.className = 'meta';
      badge.textContent = 'selected';
      el.appendChild(badge);
    } else if (!isSel && badge) {
      badge.remove();
    }
  });
}

export function saveBody() {
  return `
    <div class="field"><label>Export</label>
      <button class="action-btn" onclick="App.exportSVG()">${icon('download')} Export SVG</button>
    </div>
    <div class="field"><label>Import</label>
      <button class="action-btn" onclick="App.importSVG()">${icon('upload')} Import SVG</button>
    </div>
    <div style="margin-top:8px;font-size:12px;color:var(--text-3);line-height:1.6">
      <a href="https://developer.mozilla.org/en-US/docs/Web/SVG"
         target="_blank" rel="noopener"
         style="color:var(--primary);text-decoration:none;">Why SVG is important ↗</a>
    </div>
    `;
}

export function gesturesBody() {
  const ges = (iconId, title, desc) =>
    `<div style="display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:0.5px solid var(--border)"><div style="width:26px;height:26px;flex-shrink:0;color:var(--text-2)">${icon(iconId, { size: 26 })}</div><div><b style="font-size:14px;display:block;margin-bottom:2px;color:var(--text)">${title}</b><span style="font-size:13px;color:var(--text-2)">${desc}</span></div></div>`;
  return `
    <div class="field" style="margin-bottom:0">
      ${ges('pinch',     'Pinch',                'Zoom the canvas in and out')}
      ${ges('pan',       'Two-finger drag',       'Pan around the canvas')}
      ${ges('pen',       'One-finger drag',       'Draw a shape, or move a selection')}
      ${ges('doubletap', 'Double-tap canvas',     'Reset zoom and pan to home')}
      ${ges('history',   'Tap active tool twice', 'Open tool-specific options')}
    </div>
    <div style="margin-top:16px;font-size:12px;color:var(--text-3);line-height:1.6">
      On desktop: scroll wheel pans · Ctrl/⌘+scroll zooms
    </div>`;
}

// -- Action forwarding ---------------------------------------------------------
export function deleteSelected()    {
  if (UIData.multiSelectionActive) App.deleteMultiSelected();
  else App.deleteSelected();
}
export function duplicateSelected() {
  if (UIData.multiSelectionActive) App.duplicateMultiSelected();
  else App.duplicateSelected();
}

// -- Helpers -------------------------------------------------------------------
function fakeQR() {
  let cells = ''; const grid = 11, size = 110 / grid; let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let r = 0; r < grid; r++) for (let c = 0; c < grid; c++) {
    const finder = (r < 3 && c < 3) || (r < 3 && c > grid - 4) || (r > grid - 4 && c < 3);
    if (finder || rnd() > 0.5) cells += `<rect x="${c*size}" y="${r*size}" width="${size}" height="${size}" fill="#1a1a1a"/>`;
  }
  return `<svg class="qr" width="22" height="22" viewBox="0 0 110 110">
    <rect fill="#fff" width="110" height="110" />
    ${cells}
    <rect fill="#fff" x="4" y="4" width="18" height="18" />
    <rect fill="#fff" x="94" y="4" width="18" height="18" />
    <rect fill="#fff" x="4" y="94" width="18" height="18" />
  </svg>`;
}
