// ─────────────────────────────────────────────────────────────────────────────
// Layer object list (ui.js)
// Tests the pure render function and the scroll-preserving selection patch.
// ─────────────────────────────────────────────────────────────────────────────

// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { layerObjectListHTML, refreshLayerList, UIData, init, toast, showBranchDialog, branchDialogJoin, branchDialogKeepWorking, peersBody, openSheet, closePanel, restorePanelState } from '../../src/ui.js'

const mockObjects = [
  { id: 'a', label: 'rect',   fill: '#c8941e', kind: 'rect'   },
  { id: 'b', label: 'circle', fill: '#5a7ea8', kind: 'circle' },
]

describe('layerObjectListHTML', () => {
  test('each item carries data-id matching its object id, displayed topmost-first', () => {
    const html = layerObjectListHTML(mockObjects, new Set())
    const div  = document.createElement('div')
    div.innerHTML = html
    const items = div.querySelectorAll('.layer-obj-item')
    expect(items).toHaveLength(2)
    // mockObjects is [a, b] in z-order (a below b); display reverses so b is first
    expect(items[0].dataset.id).toBe('b')
    expect(items[1].dataset.id).toBe('a')
  })

  test('selected item gets .sel class and a .meta badge; others do not', () => {
    const html = layerObjectListHTML(mockObjects, new Set(['b']))
    const div  = document.createElement('div')
    div.innerHTML = html
    // After reversal: index 0 = b (selected), index 1 = a (not selected)
    const [itemB, itemA] = div.querySelectorAll('.layer-obj-item')
    expect(itemA.classList.contains('sel')).toBe(false)
    expect(itemA.querySelector('.meta')).toBeNull()
    expect(itemB.classList.contains('sel')).toBe(true)
    expect(itemB.querySelector('.meta')).not.toBeNull()
  })

  test('multiple selected items all get .sel class', () => {
    const html = layerObjectListHTML(mockObjects, new Set(['a', 'b']))
    const div  = document.createElement('div')
    div.innerHTML = html
    const [itemB, itemA] = div.querySelectorAll('.layer-obj-item')
    expect(itemA.classList.contains('sel')).toBe(true)
    expect(itemB.classList.contains('sel')).toBe(true)
  })
})

describe('refreshLayerList', () => {
  test('updates sel class in place without replacing the list element', () => {
    const body = document.createElement('div')
    body.id = 'panelBody'
    body.innerHTML = `
      <div class="layer-obj-list">
        <div class="layer-obj-item" data-id="a">
          <span class="layer-obj-label">rect</span>
        </div>
        <div class="layer-obj-item sel" data-id="b">
          <span class="layer-obj-label">circle</span>
          <span class="meta">selected</span>
        </div>
      </div>`
    document.body.appendChild(body)

    const listEl = body.querySelector('.layer-obj-list')

    init({
      getSelectedIds: () => ['a'],
      getTools:       () => [],
      getActiveLayer: () => 'drawing',
    })
    UIData.panelOpen = 'layers'

    refreshLayerList()

    expect(body.querySelector('.layer-obj-list')).toBe(listEl)

    const itemA = body.querySelector('[data-id="a"]')
    const itemB = body.querySelector('[data-id="b"]')
    expect(itemA.classList.contains('sel')).toBe(true)
    expect(itemA.querySelector('.meta')).not.toBeNull()
    expect(itemB.classList.contains('sel')).toBe(false)
    expect(itemB.querySelector('.meta')).toBeNull()

    document.body.removeChild(body)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Pill buttons: double-click → Tools panel; select tool quick opts
// ─────────────────────────────────────────────────────────────────────────────

import { pillHTML, toolOptsHTML } from '../../src/ui.js'
import { SELECT_TOOL } from '../../src/tools-schema.js'

const MOCK_TOOLS = [SELECT_TOOL]

describe('pillHTML — double-click opens Tools panel', () => {
  test('tool buttons carry ondblclick calling UI.openSheet("tools")', () => {
    const html = pillHTML({ selectionActive: false, activeTool: 'select', tools: MOCK_TOOLS })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = div.querySelectorAll('button.ico')
    expect(btns.length).toBeGreaterThan(0)
    for (const btn of btns) {
      expect(btn.getAttribute('ondblclick')).toContain("UI.openSheet('tools')")
    }
  })

  test('selection-active pill buttons also carry ondblclick', () => {
    const html = pillHTML({ selectionActive: true, activeTool: 'select', tools: MOCK_TOOLS })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = div.querySelectorAll('button.ico')
    expect(btns.length).toBeGreaterThan(0)
    for (const btn of btns) {
      expect(btn.getAttribute('ondblclick')).toContain("UI.openSheet('tools')")
    }
  })

  test('single-click is guarded against double-click (event.detail<2 check)', () => {
    const html = pillHTML({ selectionActive: false, activeTool: 'select', tools: MOCK_TOOLS })
    const div = document.createElement('div')
    div.innerHTML = html
    const btn = div.querySelector('button.ico')
    // The onclick handler should only fire pillTap when event.detail < 2
    expect(btn.getAttribute('onclick')).toMatch(/event\.detail\s*<\s*2/)
  })
})


describe('SELECT_TOOL multi option — show surfaces', () => {
  test('multi option has show containing "addQuick"', () => {
    const multiOpt = SELECT_TOOL.options.find(o => o.key === 'multi')
    expect(multiOpt).toBeDefined()
    expect(multiOpt.show).toContain('addQuick')
  })

  test('multi option has show containing "add"', () => {
    const multiOpt = SELECT_TOOL.options.find(o => o.key === 'multi')
    expect(multiOpt.show).toContain('add')
  })

  test('toolOptsHTML renders multi checkbox for select tool', () => {
    const schema = {
      types:  { multi: { kind: 'bool', show: ['add', 'addQuick'] } },
      values: { multi: false },
    }
    const html = toolOptsHTML({ label: 'Select', toolName: 'select', schema, values: { multi: false } })
    const div = document.createElement('div')
    div.innerHTML = html
    const checkbox = div.querySelector('input[type="checkbox"]')
    expect(checkbox).not.toBeNull()
  })
})


describe('pillHTML — multi-selection (N > 1)', () => {
  test('multiSelectionActive renders Delete N and Duplicate N buttons', () => {
    const html = pillHTML({
      selectionActive: false, multiSelectionActive: true, selectedCount: 3,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBe(2)
    expect(btns[0].getAttribute('aria-label')).toMatch(/delete.*3/i)
    expect(btns[1].getAttribute('aria-label')).toMatch(/duplicate.*3/i)
  })

  test('multiSelectionActive takes priority over selectionActive', () => {
    const html = pillHTML({
      selectionActive: true, multiSelectionActive: true, selectedCount: 2,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    // Should show N=2 buttons, not the 4-button single-selection set
    expect(btns.length).toBe(2)
    expect(btns[0].getAttribute('aria-label')).toMatch(/2/)
  })

  test('multiSelectionActive false with selectionActive shows normal 3-button set', () => {
    const html = pillHTML({
      selectionActive: true, multiSelectionActive: false, selectedCount: 0,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBe(3)
  })

  test('neither active shows tool buttons', () => {
    const html = pillHTML({
      selectionActive: false, multiSelectionActive: false, selectedCount: 0,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBeGreaterThan(0)
    // Select tool icon present
    expect(btns[0].getAttribute('aria-label')).toBe('Select')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Multi-selection: Escape clears multi-selection; refreshLayerList highlights all ids
// ─────────────────────────────────────────────────────────────────────────────

describe('refreshLayerList — multi-selection', () => {
  test('highlights all ids in a multi-selection', () => {
    const body = document.createElement('div')
    body.id = 'panelBody'
    body.innerHTML = `
      <div class="layer-obj-list">
        <div class="layer-obj-item" data-id="a"><span class="layer-obj-label">A</span></div>
        <div class="layer-obj-item" data-id="b"><span class="layer-obj-label">B</span></div>
        <div class="layer-obj-item" data-id="c"><span class="layer-obj-label">C</span></div>
      </div>`
    document.body.appendChild(body)

    init({
      getSelectedIds: () => ['a', 'c'],
      getTools:       () => [],
      getActiveLayer: () => 'drawing',
    })
    UIData.panelOpen = 'layers'

    refreshLayerList()

    expect(body.querySelector('[data-id="a"]').classList.contains('sel')).toBe(true)
    expect(body.querySelector('[data-id="b"]').classList.contains('sel')).toBe(false)
    expect(body.querySelector('[data-id="c"]').classList.contains('sel')).toBe(true)

    document.body.removeChild(body)
  })

  test('highlights nothing when selection is empty', () => {
    const body = document.createElement('div')
    body.id = 'panelBody'
    body.innerHTML = `
      <div class="layer-obj-list">
        <div class="layer-obj-item sel" data-id="a">
          <span class="layer-obj-label">A</span>
          <span class="meta">selected</span>
        </div>
      </div>`
    document.body.appendChild(body)

    init({
      getSelectedIds: () => [],
      getTools:       () => [],
      getActiveLayer: () => 'drawing',
    })
    UIData.panelOpen = 'layers'

    refreshLayerList()

    expect(body.querySelector('[data-id="a"]').classList.contains('sel')).toBe(false)
    expect(body.querySelector('[data-id="a"] .meta')).toBeNull()

    document.body.removeChild(body)
  })
})

describe('onSelectionChanged handles all selection states', () => {
  test('empty Set clears all selection flags', () => {
    import('../../src/ui.js').then(({ onSelectionChanged, UIData }) => {
      UIData.multiSelectionActive = true
      UIData.selectionActive = true
      UIData.selectedCount = 3
      onSelectionChanged(new Set())
      expect(UIData.multiSelectionActive).toBe(false)
      expect(UIData.selectionActive).toBe(false)
      expect(UIData.selectedCount).toBe(0)
    })
  })

  test('Set of size 1 sets selectionActive, not multiSelectionActive', () => {
    import('../../src/ui.js').then(({ onSelectionChanged, UIData }) => {
      onSelectionChanged(new Set(['shape-abc']))
      expect(UIData.selectionActive).toBe(true)
      expect(UIData.multiSelectionActive).toBe(false)
      expect(UIData.selectedCount).toBe(1)
    })
  })

  test('Set of size > 1 sets multiSelectionActive, not selectionActive', () => {
    import('../../src/ui.js').then(({ onSelectionChanged, UIData }) => {
      onSelectionChanged(new Set(['a', 'b', 'c']))
      expect(UIData.selectionActive).toBe(false)
      expect(UIData.multiSelectionActive).toBe(true)
      expect(UIData.selectedCount).toBe(3)
    })
  })
})

describe('toast — warn/error toasts are mirrored to console.warn', () => {
  test('kind "warn" logs the exact message to console.warn, copy-pastable', () => {
    document.body.innerHTML = '<div id="toasts"></div>'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toast('Action failed: tray.roll_handler is not a function', 'warn')
    expect(warnSpy).toHaveBeenCalledWith('[toast] Action failed: tray.roll_handler is not a function')
    warnSpy.mockRestore()
  })

  test('kind "error" logs too — used for surfacing failures generally', () => {
    document.body.innerHTML = '<div id="toasts"></div>'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toast('Something broke', 'error')
    expect(warnSpy).toHaveBeenCalledWith('[toast] Something broke')
    warnSpy.mockRestore()
  })

  test('plain info toasts (no kind, or kind "info") do NOT spam the console', () => {
    document.body.innerHTML = '<div id="toasts"></div>'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    toast('View reset')
    toast('Synced with peers', 'info')
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  test('still logs even when the #toasts box is missing from the DOM (e.g. panel not mounted yet)', () => {
    document.body.innerHTML = '' // no #toasts
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => toast('Could not move into tray: no .tt_contents', 'warn')).not.toThrow()
    expect(warnSpy).toHaveBeenCalledWith('[toast] Could not move into tray: no .tt_contents')
    warnSpy.mockRestore()
  })
})

// The skeleton showBranchDialog/branchDialogJoin/branchDialogKeepWorking
// expect to find and populate — mirrors index.html's actual markup.
function mountBranchDialogSkeleton() {
  document.body.innerHTML = `
    <div id="branchDialogScrim" aria-hidden="true"></div>
    <div id="branchDialog" aria-hidden="true">
      <div id="branchDialogBody"></div>
    </div>
  `
}

// jsdom's location.reload isn't configurable (spyOn/defineProperty both
// fail to redefine it) — stub the whole object instead, with just enough
// surface (a mutable hash, a mock reload) for these tests.
function stubLocation() {
  const reload = vi.fn()
  let hash = ''
  vi.stubGlobal('location', {
    get hash() { return hash },
    set hash(v) { hash = v },
    reload,
  })
  return { reload, getHash: () => hash }
}

describe('showBranchDialog / branchDialogJoin / branchDialogKeepWorking', () => {
  // _pendingBranchTableId is module-level state, persisting across tests
  // in this file (ES modules are shared, not reloaded per test) —
  // branchDialogJoin's own reset is the cheapest way to guarantee a clean
  // baseline regardless of what an earlier test in this block left behind.
  beforeEach(() => {
    mountBranchDialogSkeleton()
    branchDialogJoin()
  })

  test('showBranchDialog opens both the scrim and the dialog, and names the branch table', () => {
    mountBranchDialogSkeleton()
    showBranchDialog('tt-T-v1-abc123def456')

    expect(document.querySelector('#branchDialogScrim').classList.contains('open')).toBe(true)
    expect(document.querySelector('#branchDialogScrim').getAttribute('aria-hidden')).toBe('false')
    expect(document.querySelector('#branchDialog').classList.contains('open')).toBe(true)
    expect(document.querySelector('#branchDialog').getAttribute('aria-hidden')).toBe('false')
    expect(document.querySelector('#branchDialogBody').textContent).toContain('tt-T-v1-abc123def456')
  })

  test('branchDialogJoin closes the dialog and does NOT navigate anywhere', () => {
    mountBranchDialogSkeleton()
    showBranchDialog('tt-T-v1-abc123def456')
    const { reload, getHash } = stubLocation()

    branchDialogJoin()

    expect(document.querySelector('#branchDialogScrim').classList.contains('open')).toBe(false)
    expect(document.querySelector('#branchDialogScrim').getAttribute('aria-hidden')).toBe('true')
    expect(document.querySelector('#branchDialog').classList.contains('open')).toBe(false)
    expect(document.querySelector('#branchDialog').getAttribute('aria-hidden')).toBe('true')
    expect(reload).not.toHaveBeenCalled()
    expect(getHash()).toBe('') // never left the shared table
    vi.unstubAllGlobals()
  })

  test('branchDialogKeepWorking sets the hash to the branch table and reloads', () => {
    mountBranchDialogSkeleton()
    showBranchDialog('tt-T-v1-abc123def456')
    const { reload, getHash } = stubLocation()

    branchDialogKeepWorking()

    expect(getHash()).toBe('tt-T-v1-abc123def456')
    expect(reload).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })

  test('branchDialogKeepWorking is a no-op if no dialog was ever shown (no pending table)', () => {
    mountBranchDialogSkeleton()
    const { reload } = stubLocation()

    branchDialogKeepWorking() // never called showBranchDialog first

    expect(reload).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  test('branchDialogKeepWorking only acts on the table it was shown for, not a later, different one, once already consumed', () => {
    mountBranchDialogSkeleton()
    showBranchDialog('tt-T-v1-first000000')
    branchDialogJoin() // dismiss without keeping — clears the pending table

    const { reload } = stubLocation()
    branchDialogKeepWorking() // nothing pending anymore
    expect(reload).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

describe('peersBody — Offline mode toggle', () => {
  const baseData = { peers: [], offline: false, roomId: 'tt-T-v1-test' }

  test('offline toggle reflects data.offline: off', () => {
    const div = document.createElement('div')
    div.innerHTML = peersBody(baseData)
    expect(div.querySelector('#offToggle').classList.contains('on')).toBe(false)
  })

  test('offline toggle reflects data.offline: on', () => {
    const div = document.createElement('div')
    div.innerHTML = peersBody({ ...baseData, offline: true })
    expect(div.querySelector('#offToggle').classList.contains('on')).toBe(true)
  })
})

describe('panel open/tab persistence (tt_panel_state)', () => {
  const mockApp = {
    getPeers: () => [],
    isOffline: () => false,
    getTableId: () => 'tt-T-v1-test',
    getHistory: () => [],
  }

  function mountPanelSkeleton() {
    // Deliberately no #pill/#idbar — renderPill()/updateInfoBar() both
    // no-op without them (optional-chained lookups), so init() doesn't
    // need a wider mock than this test actually exercises.
    document.body.innerHTML = `
      <div id="scrim"></div>
      <aside id="panel" aria-hidden="true">
        <h2 id="panelTitle"></h2>
        <div id="panelTabs"></div>
        <div id="panelBody"></div>
      </aside>
    `
    localStorage.clear()
    init(mockApp)
  }

  test('openSheet persists {open: true, tab} to localStorage', () => {
    mountPanelSkeleton()
    openSheet('peers')
    expect(JSON.parse(localStorage.getItem('tt_panel_state'))).toEqual({ open: true, tab: 'peers' })
  })

  test('closePanel persists {open: false}, still remembering the tab that was open', () => {
    mountPanelSkeleton()
    openSheet('history')
    closePanel()
    expect(JSON.parse(localStorage.getItem('tt_panel_state'))).toEqual({ open: false, tab: 'history' })
  })

  test('restorePanelState reopens the panel to the persisted tab', () => {
    mountPanelSkeleton()
    localStorage.setItem('tt_panel_state', JSON.stringify({ open: true, tab: 'peers' }))

    restorePanelState()

    expect(document.querySelector('#panel').classList.contains('open')).toBe(true)
    expect(document.querySelector('#panelTitle').textContent).toBe('Peers & sharing')
  })

  test('restorePanelState does nothing when the persisted state was closed', () => {
    mountPanelSkeleton()
    localStorage.setItem('tt_panel_state', JSON.stringify({ open: false, tab: 'peers' }))

    restorePanelState()

    expect(document.querySelector('#panel').classList.contains('open')).toBe(false)
  })

  test('restorePanelState does nothing when nothing was ever persisted', () => {
    mountPanelSkeleton()
    // localStorage already cleared by mountPanelSkeleton
    expect(() => restorePanelState()).not.toThrow()
    expect(document.querySelector('#panel').classList.contains('open')).toBe(false)
  })

  test('restorePanelState ignores a corrupt/stale tab id rather than opening to nothing', () => {
    mountPanelSkeleton()
    localStorage.setItem('tt_panel_state', JSON.stringify({ open: true, tab: 'no-longer-a-real-tab' }))

    expect(() => restorePanelState()).not.toThrow()
    expect(document.querySelector('#panel').classList.contains('open')).toBe(false)
  })

  test('restorePanelState tolerates genuinely malformed JSON in localStorage', () => {
    mountPanelSkeleton()
    localStorage.setItem('tt_panel_state', '{not valid json')

    expect(() => restorePanelState()).not.toThrow()
    expect(document.querySelector('#panel').classList.contains('open')).toBe(false)
  })

  test('end-to-end: open, reload (simulated by a fresh restorePanelState call), lands back on the same tab', () => {
    mountPanelSkeleton()
    openSheet('save')

    // Simulate a reload: fresh DOM, same localStorage.
    mountPanelSkeleton_KeepStorage()
    restorePanelState()

    expect(document.querySelector('#panel').classList.contains('open')).toBe(true)
    expect(document.querySelector('#panelTitle').textContent).toBe('File')

    function mountPanelSkeleton_KeepStorage() {
      document.body.innerHTML = `
        <div id="scrim"></div>
        <aside id="panel" aria-hidden="true">
          <h2 id="panelTitle"></h2>
          <div id="panelTabs"></div>
          <div id="panelBody"></div>
        </aside>
      `
      init(mockApp) // NOT clearing localStorage — that's the point
    }
  })
})
