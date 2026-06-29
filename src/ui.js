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
import './component/color-picker.js';

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

function _letterIcon(label) {
  const letter = (label ?? '?')[0].toUpperCase();
  return `<svg class="tt-icon-letter" width="22" height="22" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><title>${label}</title><text x="11" y="16" text-anchor="middle" font-size="14" font-family="ui-sans-serif,sans-serif" fill="currentColor">${letter}</text></svg>`;
}

// -- UIData --------------------------------------------------------------------
// Pure presentation state for the chrome. ui.js is the only writer.
export const UIData = {
  activeTool:           'select',
  mruTool:              null,
  selectionActive:      false,
  multiSelectionActive: false,
  selectedCount:        0,
  panelOpen:            null,
  menuOpen:             false,
  toolOptsOpen:         false,
  projectName: 'togetherness',
  userId:      'anon-????',
  roomId:      '????',
};

let App = null;
const $ = s => document.querySelector(s);

// -- Init ----------------------------------------------------------------------
export function init(appBus) {
  App = appBus;
  $('#scrim')?.addEventListener('click', closePanel);
  document.addEventListener('pointerdown', e => {
    const inMenu = $('#menuBtn')?.contains(e.target) || $('#menuItems')?.contains(e.target);
    if (!inMenu && UIData.menuOpen) closeMenu();
    const inOpts = $('#toolOpts')?.contains(e.target) || $('#pill')?.contains(e.target);
    if (!inOpts && UIData.toolOptsOpen) hideToolOpts();
    const pop = $('#popover');
    if (pop && !pop.contains(e.target) && pop.style.display === 'flex') hidePopover();
  }, { capture: true });
  renderPill();
  updateInfoBar();
}

// -- Toasts --------------------------------------------------------------------
export function toast(msg, kind = '') {
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

// -- Identity bar --------------------------------------------------------------
export function setIdentity({ projectName, userId, roomId }) {
  if (projectName) UIData.projectName = projectName;
  if (userId)      UIData.userId      = userId;
  if (roomId)      UIData.roomId      = roomId;
  const el = $('#idbar');
  if (!el) return;
  el.querySelector('.idbar-project').textContent = UIData.projectName;
  el.querySelector('.idbar-user').textContent    = UIData.userId;
  el.querySelector('.idbar-room').textContent    = `#${UIData.roomId}`;
}
export function updateInfoBar() {
  const show = UIData.menuOpen || UIData.panelOpen !== null;
  const el = $('#idbar');
  if (!el) return;
  el.classList.toggle('visible', show);
  el.setAttribute('aria-hidden', show ? 'false' : 'true');
}

// -- Menu ----------------------------------------------------------------------
export function toggleMenu() {
  UIData.menuOpen = !UIData.menuOpen;
  $('#menuBtn')?.classList.toggle('open', UIData.menuOpen);
  $('#menuItems')?.classList.toggle('open', UIData.menuOpen);
  if (UIData.menuOpen) { hideToolOpts(); hidePopover(); }
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
 * pillHTML(data) -- PURE.
 *   data = { selectionActive, multiSelectionActive, selectedCount, activeTool, tools:ToolDef[], mruTool }
 */
export function pillHTML(data) {
  if (data.multiSelectionActive) {
    const n = data.selectedCount;
    return [
      icoBtn(ICON_ACTIONS.trash, `Delete ${n}`, "UI.deleteSelected()", 'danger'),
      icoBtn(ICON_ACTIONS.copy,  `Duplicate ${n}`, "UI.duplicateSelected()"),
    ].join('');
  }
  if (data.selectionActive) {
    return [
      icoBtn(ICON_ACTIONS.trash,  'Delete',        "UI.deleteSelected()", 'danger'),
      icoBtn(ICON_ACTIONS.copy,   'Duplicate',      "UI.duplicateSelected()"),
      icoBtn(ICON_ACTIONS.swatch, 'Color',          "UI.openSheet('tools')"),
    ].join('');
  }
  const select = data.tools.find(t => t.name === 'select');
  const others = data.tools.filter(t => t.name !== 'select');
  let html = '';
  if (select) {
    html += toolIco(select, data.activeTool);
    html += '<span class="pill-sep"></span>';
  }
  for (const t of others) html += toolIco(t, data.activeTool);
  return html;
}
function toolIco(toolDef, activeTool) {
  const cls = activeTool === toolDef.name ? 'active' : '';
  return `<button class="ico ${cls}" aria-label="${toolDef.label}" title="${toolDef.label}" onclick="if(event.detail<2)UI.pillTap('${toolDef.name}')" ondblclick="UI.openSheet('tools')">${iconFor(toolDef)}<span class="active-dot"></span></button>`;
}
function icoBtn(iconSvg, label, onclick, cls = '') {
  return `<button class="ico ${cls}" aria-label="${label}" title="${label}" onclick="if(event.detail<2){${onclick}}" ondblclick="UI.openSheet('tools')">${iconSvg}<span class="active-dot"></span></button>`;
}
const ICON_ACTIONS = {
  trash:  icon('trash'), copy: icon('copy'), swatch: icon('swatch'),
};

export function renderPill() {
  const pill = $('#pill');
  if (!pill) return;
  pill.innerHTML = pillHTML({
    selectionActive:      UIData.selectionActive,
    multiSelectionActive: UIData.multiSelectionActive,
    selectedCount:        UIData.selectedCount,
    activeTool:           UIData.activeTool,
    tools:                App.getTools(App.getActiveLayer()),
    mruTool:              UIData.mruTool,
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
export function onToolChanged(toolName) {
  const prev = UIData.activeTool;
  UIData.activeTool = toolName;
  if (toolName !== 'select') UIData.mruTool = toolName;
  else if (prev && prev !== 'select') UIData.mruTool = prev;
  hideToolOpts();
  renderPill();
  if (UIData.panelOpen === 'tools') {
    const body = $('#panelBody');
    if (body) body.innerHTML = toolsBody(gatherToolsData());
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
    if (body) { body.innerHTML = editBody(gatherTtStateData()); wireColorPickers(body); }
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
        return `<div class="field"><label>${key}</label><input type="range" value="${value ?? min}"
          min="${min}" max="${max}" step="${step}"
          style="width:100%;accent-color:var(--accent)"
          oninput="App.commitEdit('${ctx.id}',{'${key}':Number(this.value)})"/></div>`;
      }
      return `<div class="field"><label>${key}</label><input type="number" value="${value ?? 0}"
        ${min !== undefined ? `min="${min}"` : ''} step="${step}"
        style="width:100%;font-size:13px;padding:5px 8px;background:var(--surface-2);border:none;color:var(--text);border-radius:4px;text-align:right;box-sizing:border-box"
        onchange="App.commitEdit('${ctx.id}',{'${key}':Number(this.value)})"/></div>`;
    } else {
      if (hasRange) {
        return `<div class="opt-row"><span class="opt-label">${ctx.label ?? key}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${value ?? min}"
          style="accent-color:var(--accent)"
          oninput="App.setToolParam('${ctx.toolName}','${key}',Number(this.value));UI.refreshToolOpts()"></div>`;
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
];
const PANEL_TITLES = {
  edit: 'Edit', tools:'Tools', peers:'Peers & sharing', history:'History & undo',
  layers:'Layers', save:'File', gestures:'Gestures & help',
};

export function panelTabsHTML(activeId) {
  return `<div class="panel-tabs">${
    PANEL_TABS.map(t =>
      `<button class="panel-tab ${activeId === t.id ? 'active' : ''}" onclick="UI.openSheet('${t.id}')">${icon(t.iconId, { size: 18 })}<span>${t.label}</span></button>`
    ).join('')
  }</div>`;
}

export function openSheet(which) {
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
      history:  () => histBody(App.getHistory()),
      layers:   () => layersBody(gatherLayersData()),
      save:     () => saveBody(),
      gestures: () => gesturesBody(),
    }[which] ?? (() => ''))();
    wireColorPickers(body);
  }
  if (which === 'peers') wireOfflineToggle();
  updateInfoBar();
}
export function closePanel() {
  UIData.panelOpen = null;
  $('#panel')?.classList.remove('open');
  $('#panel')?.setAttribute('aria-hidden', 'true');
  $('#scrim')?.classList.remove('open');
  document.documentElement.style.setProperty('--panel-w', '0px');
  updateInfoBar();
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
  return { peers: App.getPeers(), offline: App.isOffline(), roomId: App.getRoomId() };
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
    <div class="field" style="margin-top:18px"><label>Invite nearby</label>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:4px">
        ${fakeQR()}
        <div class="room-code">#${data.roomId}</div>
        <div style="font-size:12px;color:var(--text-3)">Scan to join peer-to-peer · no server</div>
      </div>
      <div class="sec">
        <div class="sec-label">Event Log</div>
        <div class="event-log" id="eventLog"></div>
      </div>
      <div class="sec">
        <div class="sec-label">Doc Meta</div>
        <div class="meta-kv" id="docMeta"></div>
      </div>
    </div>`;
}
function peerRowsHTML(peers) {
  if (!peers.length)
    return '<div style="font-size:13px;color:var(--text-3);padding:8px 0">No other peers connected</div>';
  return peers.map(p =>
    `<div class="peer-row"><div class="avatar" style="background:${p.color}">${p.name[0].toUpperCase()}</div><div><div style="font-size:14px">${p.name}</div><div style="font-size:12px;color:var(--text-3)">${p.live ? 'editing now' : 'offline'}</div></div>${p.live ? '<span class="pulse"></span>' : ''}</div>`
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
function wireOfflineToggle() {
  const t = $('#offToggle');
  if (!t) return;
  t.addEventListener('click', () => {
    App.setOffline(!App.isOffline());
    t.classList.toggle('on', App.isOffline());
    const dot = document.getElementById('offlineDot');
    if (dot) dot.style.display = App.isOffline() ? 'block' : 'none';
    toast(App.isOffline() ? 'Offline — syncing paused' : 'Back online', App.isOffline() ? 'warn' : '');
  });
}

export function histBody(history) {
  const rows = history.map((entry, i) => {
    const swatch = entry.fill
      ? `<span class="sw-chip kind-${entry.elType}" style="background:${entry.fill};flex-shrink:0"></span>`
      : `<span class="hist-dot"></span>`;
    return `<div class="hist-item">${swatch}<span style="flex:1">${entry.label}</span>${i === 0 ? '<span class="meta">latest</span>' : ''}</div>`;
  }).join('');
  return `
    <div class="field"><label>Undo</label>
      <button class="action-btn" onclick="App.undo()">${icon('undo')} Undo last action</button>
      <button class="action-btn" style="opacity:.4;cursor:not-allowed">${icon('check')} Redo (nothing to redo)</button>
    </div>
    <div class="field"><label>History</label>
      <div class="shape-list">${rows || '<span class="meta">No history</span>'}</div>
    </div>`;
}

export function layerObjectListHTML(objects, selectedIds) {
  if (!objects?.length)
    return '<div class="layer-obj-empty">No objects</div>';
  return objects.map(o => {
    const chip = `<span class="sw-chip kind-${o.kind}" style="background:${o.fill}"></span>`;
    const sel  = selectedIds instanceof Set ? selectedIds.has(o.id) : selectedIds === o.id;
    return `<div class="layer-obj-item ${sel ? 'sel' : ''}" data-yid="${o.id}" onclick="App.select('${o.id}')">${chip}<span class="layer-obj-label">${o.label}</span>${sel ? '<span class="meta">selected</span>' : ''}</div>`;
  }).join('');
}

export function layersBody(data) {
  const rows = data.layers.map(l => {
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
  const body = $('#panelBody');
  if (!body) return;
  switch (UIData.panelOpen) {
    case 'edit':    body.innerHTML = editBody(gatherTtStateData());   wireColorPickers(body); break;
    case 'history': body.innerHTML = histBody(App.getHistory());   break;
    case 'layers':  body.innerHTML = layersBody(gatherLayersData()); break;
    case 'tools':   body.innerHTML = toolsBody(gatherToolsData()); wireColorPickers(body); break;
  }
}

export function refreshLayerList() {
  if (UIData.panelOpen !== 'layers') return;
  // Patch only the sel class and meta badge on each item in-place, preserving
  // scroll position. A full innerHTML replace would reset scrollTop to 0.
  const selectedIds = new Set(App.getSelectedIds());
  document.querySelectorAll('.layer-obj-item').forEach(el => {
    const id = el.dataset.yid;
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
      ${ges('longpress', 'Long press an object',  'Open the context menu')}
      ${ges('doubletap', 'Double-tap canvas',     'Reset zoom and pan to home')}
      ${ges('history',   'Tap active tool twice', 'Open tool-specific options')}
    </div>
    <div style="margin-top:16px;font-size:12px;color:var(--text-3);line-height:1.6">
      On desktop: scroll wheel pans · Ctrl/⌘+scroll zooms
    </div>`;
}

// ==============================================================================
//  CONTEXT POPOVER
// ==============================================================================
export function showPopover(x, y, elId) {
  const pop = $('#popover');
  if (!pop) return;
  pop.innerHTML = `
    <button onclick="App.duplicateSelected();UI.hidePopover()">${icon('copy')} Duplicate</button>
    <button onclick="UI.openSheet('tools');UI.hidePopover()">${icon('swatch')} Properties</button>
    <button class="danger" onclick="App.deleteSelected();UI.hidePopover()">${icon('trash')} Delete</button>`;
  pop.style.display = 'flex';
  const pw = 170, ph = 190;
  pop.style.left = Math.min(x, window.innerWidth  - pw - 12) + 'px';
  pop.style.top  = Math.min(y, window.innerHeight - ph - 12) + 'px';
}
export function hidePopover() {
  const pop = $('#popover');
  if (pop) pop.style.display = 'none';
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
  return `<svg class="qr" viewBox="0 0 110 110">${cells}</svg>`;
}
