/**
 * ui.js — crdt-svg UI chrome
 *
 * Renders the chrome: pill, panel, toasts, idbar, popover, menu.
 * Reads ToolMode / SelectionMode only through the App bus.
 *
 * Design rules that keep this file testable in stories.html:
 *   1. Render functions are PURE: renderX(data) -> htmlString. They take their
 *      data as an argument and never reach into module globals. The exported
 *      wrappers (openSheet etc.) gather data from App and call the pure fn.
 *   2. ui.js knows exactly ONE tool by name: 'select'. Every other tool comes
 *      from a registry via App.getTools(layer) / App.getToolOptions(tool).
 *   3. Tool-options are rendered generically from a declarative field schema
 *      (see tools-schema.js). ui.js does not know what 'cornerR' means.
 *
 * Depends on: icons.js (icon()), ui.css, App (bus). No Yjs, no pointer events.
 */

import { icon } from './icons.js';

// -- UIData --------------------------------------------------------------------
// Pure presentation state for the chrome. ui.js is the only writer.
export const UIData = {
  activeTool:      'select',
  mruTool:         null,
  selectionActive: false,
  panelOpen:       null,
  menuOpen:        false,
  toolOptsOpen:    false,
  projectName: 'crdt-svg',
  userId:      'anon-????',
  roomId:      '????',
};

let App = null;
const $ = s => document.querySelector(s);
const PANEL_W = 300;

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
 *   data = { selectionActive, activeTool, tools:ToolDef[], mruTool }
 */
export function pillHTML(data) {
  if (data.selectionActive) {
    return [
      icoBtn(ICON_ACTIONS.trash,  'Delete',        "UI.deleteSelected()", 'danger'),
      icoBtn(ICON_ACTIONS.copy,   'Duplicate',      "UI.duplicateSelected()"),
      icoBtn(ICON_ACTIONS.swatch, 'Color',          "UI.openSheet('tools')"),
      icoBtn(ICON_ACTIONS.front,  'Bring to front', "UI.bringToFront()"),
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
  return `<button class="ico ${cls}" aria-label="${toolDef.label}" title="${toolDef.label}" onclick="UI.pillTap('${toolDef.name}')">${toolDef.icon}<span class="active-dot"></span></button>`;
}
function icoBtn(iconSvg, label, onclick, cls = '') {
  return `<button class="ico ${cls}" aria-label="${label}" title="${label}" onclick="${onclick}">${iconSvg}<span class="active-dot"></span></button>`;
}
const ICON_ACTIONS = {
  trash:  icon('trash'), copy: icon('copy'), swatch: icon('swatch'), front: icon('front'),
};

export function renderPill() {
  const pill = $('#pill');
  if (!pill) return;
  pill.innerHTML = pillHTML({
    selectionActive: UIData.selectionActive,
    activeTool:      UIData.activeTool,
    tools:           App.getTools(App.getActiveLayer()),
    mruTool:         UIData.mruTool,
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
  if (toolName !== 'select') {
    const def = App.getTool(toolName);
    toast(`${def?.label ?? toolName} tool`, 'info');
  }
}
export function onSelectionChanged(elId, drawingMeta) {
  UIData.selectionActive = !!elId;
  renderPill();
  refreshLayerList();
  if (elId && drawingMeta) toast(`${drawingMeta.type ?? 'Shape'} selected`, 'info');
}

// ==============================================================================
//  TOOL OPTIONS (generic, schema-driven)
// ==============================================================================

/**
 * toolOptsHTML(data) -- PURE.
 *   data = { label, fields:OptionField[], values:{}, palette:[] }
 */
export function toolOptsHTML(data) {
  if (!data.fields?.length) {
    return `<h3>${data.label} options</h3><div class="opt-row">No options.</div>`;
  }
  const rows = data.fields.map(f => optionFieldHTML(f, data.values[f.key], data.palette)).join('');
  return `<h3>${data.label} options</h3>${rows}`;
}
function optionFieldHTML(field, value, palette) {
  const target = "UI.currentToolOpts";
  switch (field.kind) {
    case 'swatches': {
      const sw = (palette || []).slice(0, 6).map(c =>
        `<div class="mini-sw ${value === c ? 'active' : ''}" style="background:${c}" onclick="App.setToolParam(${target},'${field.key}','${c}');UI.refreshToolOpts()"></div>`
      ).join('');
      return `<div class="opt-row"><span class="opt-label">${field.label}</span><div class="mini-swatches">${sw}</div></div>`;
    }
    case 'stepper':
      return `<div class="opt-row"><span class="opt-label">${field.label}</span><div class="stepper"><div class="step-btn" onclick="App.stepToolParam(${target},'${field.key}',${-field.step},${field.min},${field.max});UI.refreshToolOpts()">-</div><span class="step-val">${num(value)}</span><div class="step-btn" onclick="App.stepToolParam(${target},'${field.key}',${field.step},${field.min},${field.max});UI.refreshToolOpts()">+</div></div></div>`;
    case 'range': {
      const pct = field.max <= 1;
      const v = pct ? Math.round((value ?? 1) * 100) : (value ?? field.min);
      return `<div class="opt-row"><span class="opt-label">${field.label}</span><input type="range" min="${field.min}" max="${field.max}" value="${v}" oninput="App.setToolParam(${target},'${field.key}',${pct ? 'this.value/100' : 'this.value'})"></div>`;
    }
    case 'toggle':
      return `<div class="opt-row"><span class="opt-label">${field.label}</span><div class="toggle ${value ? 'on' : ''}" onclick="this.classList.toggle('on');App.setToolParam(${target},'${field.key}',this.classList.contains('on'))"></div></div>`;
    default:
      return '';
  }
}
function num(v) { return v == null ? 0 : (Math.round(v * 100) / 100); }

export let currentToolOpts = null;

export function showToolOpts(toolName) {
  const pill = $('#pill');
  const to   = $('#toolOpts');
  if (!pill || !to) return;
  currentToolOpts = toolName;
  const def = App.getTool(toolName);
  to.style.display = 'block';
  to.innerHTML = toolOptsHTML({
    label:   def?.label ?? toolName,
    fields:  App.getToolOptions(toolName),
    values:  App.getToolParams(toolName),
    palette: App.getPalette(),
  });
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

// ==============================================================================
//  PANEL
// ==============================================================================
const PANEL_TABS = [
  { id: 'tools',   label: 'Tools',   iconId: 'rect' },
  { id: 'layers',  label: 'Layers',  iconId: 'layers' },
  { id: 'peers',   label: 'Peers',   iconId: 'peers' },
  { id: 'history', label: 'History', iconId: 'history' },
  { id: 'save',    label: 'Save',    iconId: 'save' },
];
const PANEL_TITLES = {
  tools:'Properties', peers:'Peers & sharing', history:'History & undo',
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
      tools:    () => toolsBody(gatherToolsData()),
      peers:    () => peersBody(gatherPeersData()),
      history:  () => histBody(App.getHistory()),
      layers:   () => layersBody(gatherLayersData()),
      save:     () => saveBody(),
      gestures: () => gesturesBody(),
    }[which] ?? (() => ''))();
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
  return {
    layer,
    activeTool: UIData.activeTool,
    tools:      App.getTools(layer),
    palette:    App.getPalette(),
    fill:       App.getToolParams(UIData.activeTool)?.fill,
    background: App.getBackground(),
    defaultBackgrounds: App.getDefaultBackgrounds(),
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
  return { layers, active, selectedId: App.getSelectedId() };
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
    `<div class="tool ${data.activeTool === t.name ? 'active' : ''}" onclick="App.setTool('${t.name}')">${t.icon}<span>${t.label}</span></div>`;
  const sw = c =>
    `<div class="sw ${data.fill === c ? 'active' : ''}" style="background:${c}" onclick="App.setFill('${c}');UI.openSheet('tools')"></div>`;
  return `
    <div class="field"><label>Tool · ${data.layer} layer</label>
      <div class="tool-grid">${data.tools.map(toolBtn).join('')}</div>
    </div>
    <div class="field"><label>Fill color</label>
      <div class="swatches">${data.palette.map(sw).join('')}</div>
    </div>`;
}

const LAYER_TOOLS_BODY = {
  background: (data) => bgToolsBody(data),
  toys:       (data) => defaultToolsBody(data),
  drawing:    (data) => defaultToolsBody(data),
};
export function toolsBody(data) {
  const render = LAYER_TOOLS_BODY[data.layer] ?? defaultToolsBody;
  return render(data);
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

export function layerObjectListHTML(objects, selectedId) {
  if (!objects?.length)
    return '<div class="layer-obj-empty">No objects</div>';
  return objects.map(o => {
    const chip = `<span class="sw-chip kind-${o.kind}" style="background:${o.fill}"></span>`;
    const sel  = selectedId === o.id;
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
        : `<div class="layer-obj-list">${layerObjectListHTML(l.objects ?? [], data.selectedId)}</div>`;
    }
    return `<div class="layer-block">
      <div class=\"layer ${isActive ? 'active' : ''}\" id=\"layer-row-${l.id}\" onclick=\"UI.selectLayer('${l.id}')\">${icon(l.iconId)} <span>${l.label}</span>${l.id !== 'background' ? `<span class="lmeta">${l.count} object${l.count !== 1 ? 's' : ''}</span>` : ''}</div>
      ${objList}
    </div>`;
  }).join('');
  return `
    <div class="field"><label>Active layer</label>
      ${rows}
      <div style="font-size:12px;color:var(--text-3);margin-top:10px">New objects are added to the active layer.</div>
    </div>`;
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
    case 'history': body.innerHTML = histBody(App.getHistory()); break;
    case 'layers':  body.innerHTML = layersBody(gatherLayersData()); break;
    case 'tools':   body.innerHTML = toolsBody(gatherToolsData()); break;
  }
}

export function refreshLayerList() {
  if (UIData.panelOpen !== 'layers') return;
  // Patch only the sel class and meta badge on each item in-place, preserving
  // scroll position. A full innerHTML replace would reset scrollTop to 0.
  const selectedId = App.getSelectedId();
  document.querySelectorAll('.layer-obj-item').forEach(el => {
    const id = el.dataset.yid;
    if (!id) return;
    const isSel = id === selectedId;
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
    <button onclick="App.bringToFront();UI.hidePopover()">${icon('front')} Bring to front</button>
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
export function deleteSelected()    { App.deleteSelected(); }
export function duplicateSelected() { App.duplicateSelected(); }
export function bringToFront()      { App.bringToFront(); }

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
