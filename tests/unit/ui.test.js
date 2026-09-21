// ─────────────────────────────────────────────────────────────────────────────
// Layer object list (ui.js)
// Tests the pure render function and the scroll-preserving selection patch.
// ─────────────────────────────────────────────────────────────────────────────

// @vitest-environment jsdom
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { layerObjectListHTML, refreshLayerList, UIData, init, toast, showBranchDialog, branchDialogJoin, branchDialogKeepWorking, peersBody, openSheet, closePanel, restorePanelState, restoreLayerState, saveLayerState, histBody, onToolChanged, editBody, bgToolsBody, bgAssetLine } from '../../src/ui.js'
import { SHAPE_TYPES } from '../../src/drawing.js'

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

import { pillHTML, toolOptsHTML, wireRangeTicked } from '../../src/ui.js'
import { SELECT_TOOL } from '../../src/tools-schema.js'

const MOCK_TOOLS = [SELECT_TOOL]

describe('pillHTML — double-click opens Tools panel', () => {
  test('tool buttons carry ondblclick calling UI.openSheet("tools")', () => {
    const html = pillHTML({ selectionActive: false, activeTool: 'select', tools: MOCK_TOOLS })
    const div = document.createElement('div')
    div.innerHTML = html
    // The section-4 ellipsis button opens the Tools panel via a plain
    // single-click onclick, not ondblclick like the tool buttons — scope
    // this assertion to the actual tool buttons.
    const btns = [...div.querySelectorAll('button.ico')].filter(b => b.getAttribute('aria-label') !== 'More tools')
    expect(btns.length).toBeGreaterThan(0)
    for (const btn of btns) {
      expect(btn.getAttribute('ondblclick')).toContain("UI.openSheet('tools')")
    }
  })

  test('selection-active pill buttons do NOT carry ondblclick (they act directly via onclick)', () => {
    const html = pillHTML({ selectionActive: true, activeTool: 'select', tools: MOCK_TOOLS, ltype: 'drawing' })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = div.querySelectorAll('button.ico')
    expect(btns.length).toBeGreaterThan(0)
    for (const btn of btns) {
      expect(btn.getAttribute('ondblclick')).toBeNull()
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

  test('toolOptsHTML renders a min+max range field as a wired <range-ticked>', () => {
    const schema = {
      types:  { value: { kind: 'number', min: 1, max: 25, step: 1, show: ['add', 'addQuick'] } },
      values: { value: 17 },
    }
    const html = toolOptsHTML({ label: 'Chip', toolName: 'chip', schema, values: { value: 17 } })
    const div = document.createElement('div')
    div.innerHTML = html
    // Ticks, the datalist, and the visible label row are <range-ticked>'s
    // own concern (see tests/unit/range_ticked.test.js) — this only checks
    // that renderSchemaField hands it the right min/max/step/value and
    // wires it up for wireRangeTicked to pick up.
    const rt = div.querySelector('range-ticked')
    expect(rt).not.toBeNull()
    expect(rt.getAttribute('min')).toBe('1')
    expect(rt.getAttribute('max')).toBe('25')
    expect(rt.getAttribute('step')).toBe('1')
    expect(rt.getAttribute('value')).toBe('17')
    expect(rt.hasAttribute('data-rt-wire')).toBe(true)
    expect(rt.dataset.rtMode).toBe('addQuick')
    expect(rt.dataset.rtTarget).toBe('chip')
    expect(rt.dataset.rtKey).toBe('value')
  })

  test('a range-changed event on a wired <range-ticked> calls App.setToolParam with its value', () => {
    const schema = {
      types:  { value: { kind: 'number', min: 1, max: 25, step: 1, show: ['add', 'addQuick'] } },
      values: { value: 17 },
    }
    const html = toolOptsHTML({ label: 'Chip', toolName: 'chip', schema, values: { value: 17 } })
    const div = document.createElement('div')
    div.innerHTML = html
    document.body.appendChild(div)
    const setToolParam = vi.fn()
    init({ setToolParam })
    wireRangeTicked(div)

    const rt = div.querySelector('range-ticked')
    rt.dispatchEvent(new CustomEvent('range-changed', { detail: { value: 9 }, bubbles: true, composed: true }))

    expect(setToolParam).toHaveBeenCalledWith('chip', 'value', 9)
    div.remove()
  })

  test('an edit-mode <range-ticked>: range-changed previews (no commitEdit), range-committed calls the ordinary App.commitEdit(id, editData)', () => {
    // The whole point of previewEdit (see app.js) is that App.commitEdit —
    // which synchronously rebuilds #panelBody via UI.refreshFromDoc() —
    // must NOT run on every drag tick, or it tears down the very
    // <range-ticked> the user is dragging. So 'range-changed' (fires
    // continuously) must go to previewEdit, a local-only ghost preview,
    // and only 'range-committed' (fires once, gesture end) may call the
    // same commitEdit(id, editData) every other Edit-panel field already
    // uses — no separate "commit the preview" entry point.
    const element = {
      ...SHAPE_TYPES.rect.schema.values,
      ltype: 'drawing', id: 'shape1', label: SHAPE_TYPES.rect.schema.label,
      types: SHAPE_TYPES.rect.schema.types,
      'stroke-width': 2,
    }
    const html = editBody({ element })
    const div = document.createElement('div')
    div.innerHTML = html
    document.body.appendChild(div)
    const commitEdit   = vi.fn()
    const previewEdit   = vi.fn()
    init({ commitEdit, previewEdit })
    wireRangeTicked(div)

    const rt = [...div.querySelectorAll('range-ticked')].find(el => el.dataset.rtKey === 'stroke-width')
    rt.dispatchEvent(new CustomEvent('range-changed', { detail: { value: 4 }, bubbles: true, composed: true }))
    rt.dispatchEvent(new CustomEvent('range-changed', { detail: { value: 5 }, bubbles: true, composed: true }))
    expect(previewEdit).toHaveBeenNthCalledWith(1, 'shape1', { 'stroke-width': 4 })
    expect(previewEdit).toHaveBeenNthCalledWith(2, 'shape1', { 'stroke-width': 5 })
    expect(commitEdit).not.toHaveBeenCalled()

    rt.dispatchEvent(new CustomEvent('range-committed', { detail: { value: 5 }, bubbles: true, composed: true }))
    expect(commitEdit).toHaveBeenCalledWith('shape1', { 'stroke-width': 5 })

    div.remove()
  })

  test('editBody renders drawing stroke-width (rect/circle) as a <range-ticked min=0.5 max=10 step=0.5> — 0 is excluded since stroke is toggled off via the stroke color control, not width', () => {
    for (const type of ['rect', 'circle']) {
      const element = {
        ...SHAPE_TYPES[type].schema.values,
        ltype: 'drawing', id: 'shape1', label: SHAPE_TYPES[type].schema.label,
        types: SHAPE_TYPES[type].schema.types,
        'stroke-width': 2,
      }
      const html = editBody({ element })
      const div = document.createElement('div')
      div.innerHTML = html
      const rt = [...div.querySelectorAll('range-ticked')].find(el => el.dataset.rtKey === 'stroke-width')
      expect(rt).toBeTruthy()
      expect(rt.getAttribute('min')).toBe('0.5')
      expect(rt.getAttribute('max')).toBe('10')
      expect(rt.getAttribute('step')).toBe('0.5')
      expect(rt.getAttribute('value')).toBe('2')
      expect(rt.dataset.rtMode).toBe('edit')
      expect(rt.dataset.rtTarget).toBe('shape1')
    }
  })
})


describe('pillHTML — multi-selection (N > 1)', () => {
  test('multiSelectionActive renders only a Delete N button (no Duplicate)', () => {
    const html = pillHTML({
      selectionActive: false, multiSelectionActive: true, selectedCount: 3,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBe(1)
    expect(btns[0].getAttribute('aria-label')).toMatch(/delete.*3/i)
  })

  test('multiSelectionActive takes priority over selectionActive', () => {
    const html = pillHTML({
      selectionActive: true, multiSelectionActive: true, selectedCount: 2,
      activeTool: 'select', tools: MOCK_TOOLS,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    // Should show the single multi-select Delete button, not the
    // single-selection button set
    expect(btns.length).toBe(1)
    expect(btns[0].getAttribute('aria-label')).toMatch(/2/)
  })

  test('multiSelectionActive false with selectionActive and ltype "drawing" shows the 3-button set (Delete/Duplicate/Edit)', () => {
    const html = pillHTML({
      selectionActive: true, multiSelectionActive: false, selectedCount: 0,
      activeTool: 'select', tools: MOCK_TOOLS, ltype: 'drawing',
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBe(3)
  })

  test('a non-drawing selection (e.g. boun_pos) omits Duplicate, showing only Delete/Edit', () => {
    const html = pillHTML({
      selectionActive: true, multiSelectionActive: false, selectedCount: 0,
      activeTool: 'select', tools: MOCK_TOOLS, ltype: 'boun_pos',
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const btns = [...div.querySelectorAll('button.ico')]
    expect(btns.length).toBe(2)
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
// pillHTML — no-selection mode: 4 sections (Select / MRU / palette / ellipsis)
// ─────────────────────────────────────────────────────────────────────────────

const D6    = { name: 'd6',    label: 'D6',    layer: 'toys' }
const D20   = { name: 'd20',   label: 'D20',   layer: 'toys' }
const CARD  = { name: 'card',  label: 'Card',  layer: 'toys' }
const TRAY  = { name: 'tray',  label: 'Tray',  layer: 'toys' }
const RECT  = { name: 'rect',  label: 'Rect',  layer: 'drawing' }
const CIRC  = { name: 'circ',  label: 'Circle',layer: 'drawing' }
const TOYS_TOOLS = [SELECT_TOOL, D6, D20, CARD, TRAY]

function labelsOf(div) {
  return [...div.querySelectorAll('button.ico')].map(b => b.getAttribute('aria-label'))
}

describe('pillHTML — no-selection 4-section layout', () => {
  test('always renders an ellipsis button opening the Tools panel', () => {
    const html = pillHTML({ selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS, layer: 'toys' })
    const div = document.createElement('div')
    div.innerHTML = html
    const ellipsis = [...div.querySelectorAll('button.ico')].find(b => b.getAttribute('aria-label') === 'More tools')
    expect(ellipsis).toBeDefined()
    expect(ellipsis.getAttribute('onclick')).toContain("UI.openSheet('tools')")
  })

  test('on the toys layer, mruTools appears right after Select, before the rest of the palette', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['card'],
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels[0]).toBe('Select')
    expect(labels[1]).toBe('Card')
  })

  test('accumulates multiple MRU tools, most-recently-used leftmost', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['tray', 'card', 'd6'],
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    // mruTools is newest-first; that order is preserved left-to-right
    // right after Select.
    expect(labels.slice(0, 4)).toEqual(['Select', 'Tray', 'Card', 'D6'])
  })

  test('mruTools is de-duplicated out of the default palette section — each tool appears only once', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['card', 'd6'],
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels.filter(l => l === 'Card').length).toBe(1)
    expect(labels.filter(l => l === 'D6').length).toBe(1)
  })

  test('mruTools is ignored outside the toys layer — no MRU section on drawing', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: [SELECT_TOOL, RECT, CIRC],
      layer: 'drawing', mruTools: ['rect'],
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    // Rect still appears (it's in the palette), but only once, and Select
    // is immediately followed by the palette order, not singled out as MRU.
    expect(labels).toEqual(['Select', 'Rect', 'Circle', 'More tools'])
  })

  test('a stale MRU tool from a different layer is dropped rather than shown wrongly', () => {
    // 'rect' was used on the drawing layer; tools here are toys-layer
    // only, so 'rect' isn't among them and must not appear at all.
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['rect'],
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels).not.toContain('Rect')
  })

  test('maxOthers caps total MRU+palette slots, MRU winning ties in its own recency order', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['tray', 'card'], maxOthers: 2,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    // Select + ellipsis are not counted against the budget; both MRU
    // entries fill the entire budget, leaving no room for the palette.
    expect(labels).toEqual(['Select', 'Tray', 'Card', 'More tools'])
  })

  test('maxOthers smaller than the MRU list truncates MRU itself, still most-recent first', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', mruTools: ['tray', 'card', 'd6'], maxOthers: 2,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels).toEqual(['Select', 'Tray', 'Card', 'More tools'])
  })

  test('mobile-sized budget (maxOthers=3) shows Select + Ellipsis + 3 others', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS,
      layer: 'toys', maxOthers: 3,
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels.length).toBe(5) // Select + 3 others + Ellipsis
    expect(labels[0]).toBe('Select')
    expect(labels[labels.length - 1]).toBe('More tools')
  })

  test('no maxOthers (desktop) shows every tool in the layer', () => {
    const html = pillHTML({
      selectionActive: false, activeTool: 'select', tools: TOYS_TOOLS, layer: 'toys',
    })
    const div = document.createElement('div')
    div.innerHTML = html
    const labels = labelsOf(div)
    expect(labels).toEqual(['Select', 'D6', 'D20', 'Card', 'Tray', 'More tools'])
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

describe('onToolChanged — re-rendered Tools panel keeps its color picker wired', () => {
  test('picking a color after switching tools calls App.setToolParam (regression: was missing wireColorPickers)', () => {
    document.body.innerHTML = '<div id="panelBody"></div><div id="pill"></div>'
    const setToolParam = vi.fn()
    init({
      getActiveLayer:        () => 'toys',
      getTools:               () => [{ name: 'd6', label: 'D6' }],
      getTool:                () => ({ label: 'D6' }),
      getToolSchema:          () => ({ types: { fill: { kind: 'color-hsl', show: ['add', 'edit', 'addQuick'] } }, values: {} }),
      getToolParams:          () => ({}),
      getBackground:          () => ({}),
      getDefaultBackgrounds:  () => [],
      getToyClasses:          () => [],
      setToolParam,
    })
    UIData.panelOpen = 'tools'

    onToolChanged('d6')

    const picker = document.querySelector('#panelBody color-picker')
    expect(picker).not.toBeNull()
    picker.dispatchEvent(new CustomEvent('color-picked', {
      detail: { h: 0, s: 100, l: 50, a: 100, hex: '#ff0000', hex8: '#ff0000ff', rgba: 'rgba(255, 0, 0, 1.00)' },
      bubbles: true,
      composed: true,
    }))

    expect(setToolParam).toHaveBeenCalledWith('d6', 'fill', '#ff0000')
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
  const baseData = { peers: [], me: { id: 'me', name: 'Alice', color: '#4287f5', gradient: null }, offline: false, roomId: 'tt-T-v1-test' }

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
    user: { id: 'me', name: 'Alice', color: '#4287f5', gradient: null },
    isOffline: () => false,
    getTableId: () => 'tt-T-v1-test',
    getHistory: () => [],
    getUndoHistory: () => [],
    canUndo: () => false,
    canRedo: () => false,
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

describe('histBody — undo/redo panel layout', () => {
  const history     = [{ label: 'moved die1' }, { label: 'placed die2' }]
  const undoHistory = [{ label: 'undid: move' }]

  function withApp(overrides) {
    init({ getPeers: () => [], isOffline: () => false, getTableId: () => 'tt-T-v1-test',
           canUndo: () => false, canRedo: () => false, ...overrides })
  }

  test('renders both lists, in order: undo, history, redo, undo history', () => {
    withApp({ canUndo: () => true, canRedo: () => true })
    const html = histBody(history, undoHistory)
    const undoBtnAt   = html.indexOf('Undo last action')
    const historyAt   = html.indexOf('moved die1')
    const redoBtnAt   = html.indexOf('Redo last undone action')
    const undoHistAt  = html.indexOf('undid: move')
    expect(undoBtnAt).toBeGreaterThan(-1)
    expect(undoBtnAt).toBeLessThan(historyAt)
    expect(historyAt).toBeLessThan(redoBtnAt)
    expect(redoBtnAt).toBeLessThan(undoHistAt)
  })

  test('the gesture history list shows real actions, not undo entries — those are a separate list', () => {
    withApp({ canUndo: () => true })
    const div = document.createElement('div')
    div.innerHTML = histBody(history, undoHistory)
    const historyField = div.querySelectorAll('.field')[1]
    expect(historyField.textContent).toContain('moved die1')
    expect(historyField.textContent).not.toContain('undid:')
  })

  test('undo button is wired to App.undo() when something is undoable', () => {
    withApp({ canUndo: () => true })
    const div = document.createElement('div')
    div.innerHTML = histBody(history, [])
    const btn = [...div.querySelectorAll('.action-btn')].find(b => b.textContent.includes('Undo last action'))
    expect(btn.getAttribute('onclick')).toBe('App.undo()')
    expect(btn.disabled).toBe(false)
  })

  test('undo button is disabled, not wired, when nothing is undoable', () => {
    withApp({ canUndo: () => false })
    const div = document.createElement('div')
    div.innerHTML = histBody([], [])
    const btn = [...div.querySelectorAll('.action-btn')].find(b => b.textContent.includes('Undo last action'))
    expect(btn.hasAttribute('onclick')).toBe(false)
    expect(btn.disabled).toBe(true)
  })

  test('redo button is wired to App.redo() when something is redoable — it never was before this', () => {
    withApp({ canRedo: () => true })
    const div = document.createElement('div')
    div.innerHTML = histBody([], undoHistory)
    const btn = [...div.querySelectorAll('.action-btn')].find(b => b.textContent.includes('Redo last undone action'))
    expect(btn.getAttribute('onclick')).toBe('App.redo()')
    expect(btn.disabled).toBe(false)
  })

  test('redo button is disabled when nothing is redoable', () => {
    withApp({ canRedo: () => false })
    const div = document.createElement('div')
    div.innerHTML = histBody([], [])
    const btn = [...div.querySelectorAll('.action-btn')].find(b => b.textContent.includes('Redo last undone action'))
    expect(btn.hasAttribute('onclick')).toBe(false)
    expect(btn.disabled).toBe(true)
  })

  test('empty states are labelled distinctly for each list', () => {
    withApp({})
    const div = document.createElement('div')
    div.innerHTML = histBody([], [])
    expect(div.textContent).toContain('No history')
    expect(div.textContent).toContain('Nothing undone')
  })

  test('both lists get the scrollable, 4-item-limited list class — same pattern as the Layers panel', () => {
    withApp({})
    const div = document.createElement('div')
    div.innerHTML = histBody(history, undoHistory)
    const lists = div.querySelectorAll('.hist-list')
    expect(lists.length).toBe(2)
    for (const list of lists) expect(list.classList.contains('shape-list')).toBe(true)
  })
})

describe('layer state persistence (tt_layer_state)', () => {
  const LAYERS = [
    { id: 'background',           label: 'Background',   visible: true  },
    { id: 'boundaries-positions', label: 'Boun/Pos',     visible: false },
    { id: 'toys',                 label: 'Toys',         visible: true  },
    { id: 'drawing',              label: 'Drawing',      visible: true  },
  ]

  // Stands in for app.js: the setters record what they were asked to do and
  // mutate local state, so the getters report it back and save/restore can be
  // driven end to end.
  function mockApp(active = 'toys') {
    const layers = LAYERS.map(l => ({ ...l }))
    return {
      getLayers:       () => layers,
      getActiveLayer:  () => active,
      setLayer:        vi.fn((id) => { active = id }),
      setLayerVisible: vi.fn((id, visible) => {
        const l = layers.find(x => x.id === id)
        if (l) l.visible = visible
      }),
    }
  }

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
  })

  test('saveLayerState writes the active layer and every layer\'s visibility', () => {
    init(mockApp('drawing'))
    saveLayerState()
    expect(JSON.parse(localStorage.getItem('tt_layer_state'))).toEqual({
      active: 'drawing',
      layers: {
        'background':           { visible: true  },
        'boundaries-positions': { visible: false },
        'toys':                 { visible: true  },
        'drawing':              { visible: true  },
      },
    })
  })

  test('saveLayerState keeps an entry for a layer this build does not have', () => {
    init(mockApp('toys'))
    localStorage.setItem('tt_layer_state', JSON.stringify({
      active: 'toys',
      layers: { 'some-future-layer': { visible: false } },
    }))

    saveLayerState()

    const written = JSON.parse(localStorage.getItem('tt_layer_state'))
    expect(written.layers['some-future-layer']).toEqual({ visible: false })
    expect(written.layers['toys']).toEqual({ visible: true })
  })

  test('restoreLayerState applies persisted visibility', () => {
    const app = mockApp('toys')
    init(app)
    localStorage.setItem('tt_layer_state', JSON.stringify({
      active: 'toys',
      layers: { 'drawing': { visible: false }, 'boundaries-positions': { visible: true } },
    }))

    restoreLayerState()

    expect(app.setLayerVisible).toHaveBeenCalledWith('drawing', false)
    expect(app.setLayerVisible).toHaveBeenCalledWith('boundaries-positions', true)
  })

  test('restoreLayerState leaves a layer with no stored entry at its default', () => {
    const app = mockApp('toys')
    init(app)
    // 'boundaries-positions' defaults to hidden and is absent from the store.
    localStorage.setItem('tt_layer_state', JSON.stringify({
      active: 'toys',
      layers: { 'drawing': { visible: true } },
    }))

    restoreLayerState()

    expect(app.setLayerVisible).not.toHaveBeenCalledWith('boundaries-positions', expect.anything())
  })

  test('restoreLayerState re-selects the persisted layer', () => {
    const app = mockApp('toys')
    init(app)
    localStorage.setItem('tt_layer_state', JSON.stringify({ active: 'drawing' }))

    restoreLayerState()

    expect(app.setLayer).toHaveBeenCalledWith('drawing')
  })

  test('restoreLayerState ignores a layer id this build no longer has', () => {
    const app = mockApp('toys')
    init(app)
    localStorage.setItem('tt_layer_state', JSON.stringify({ active: 'no-longer-a-real-layer' }))

    expect(() => restoreLayerState()).not.toThrow()
    expect(app.setLayer).not.toHaveBeenCalled()
  })

  test('restoreLayerState does nothing when nothing was ever persisted', () => {
    const app = mockApp('toys')
    init(app)

    expect(() => restoreLayerState()).not.toThrow()
    expect(app.setLayer).not.toHaveBeenCalled()
  })

  test('restoreLayerState tolerates genuinely malformed JSON', () => {
    const app = mockApp('toys')
    init(app)
    localStorage.setItem('tt_layer_state', '{not valid json')

    expect(() => restoreLayerState()).not.toThrow()
    expect(app.setLayer).not.toHaveBeenCalled()
  })

  test('end-to-end: select a layer, hide another, reload, land back on both', () => {
    const app = mockApp('toys')
    init(app)
    app.setLayerVisible('drawing', false)
    app.setLayer('drawing')
    saveLayerState()

    // Simulate a reload: fresh app at its defaults, same localStorage.
    const reloaded = mockApp('toys')
    init(reloaded)
    restoreLayerState()

    expect(reloaded.setLayer).toHaveBeenCalledWith('drawing')
    expect(reloaded.setLayerVisible).toHaveBeenCalledWith('drawing', false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Background panel — the shared-image line
// ─────────────────────────────────────────────────────────────────────────────
describe('bgAssetLine', () => {
  test('an ordinary URL background says nothing', () => {
    expect(bgAssetLine(null)).toBe('')
  })

  test('a manifest that has not arrived reads as waiting', () => {
    expect(bgAssetLine({ known: false, complete: false })).toMatch(/waiting/i)
  })

  test('an incomplete asset shows what has landed', () => {
    expect(bgAssetLine({ known: true, complete: false, have: 2, total: 5 })).toContain('2/5')
  })

  test('a complete asset names the file and its size', () => {
    const line = bgAssetLine({ known: true, complete: true, name: 'map.png', bytes: 40960 })
    expect(line).toContain('map.png')
    expect(line).toContain('40 KB')
  })

  test('a sub-kilobyte asset does not round away to nothing', () => {
    expect(bgAssetLine({ known: true, complete: true, name: 'x.png', bytes: 120 })).toContain('1 KB')
  })
})

describe('bgToolsBody', () => {
  const data = {
    background:         { url: 'img/bg_default.png', width: 120, height: 120, asset: null },
    defaultBackgrounds: [{ label: 'Default', url: 'img/bg_default.png', width: 120, height: 120 }],
  }

  test('offers a picker that shares the image with the table', () => {
    const div = document.createElement('div')
    div.innerHTML = bgToolsBody(data)
    const btn = [...div.querySelectorAll('button')]
      .find(b => b.getAttribute('onclick') === 'App.pickBackgroundImage()')
    expect(btn).toBeTruthy()
  })

  test('the asset line only appears for a document-carried background', () => {
    const div = document.createElement('div')
    div.innerHTML = bgToolsBody(data)
    expect(div.querySelector('.bg-asset-line')).toBeNull()

    div.innerHTML = bgToolsBody({
      ...data,
      background: { ...data.background, url: 'tt-asset:tt-a-v1-0000000000000000',
                    asset: { known: true, complete: true, name: 'map.png', bytes: 40960 } },
    })
    expect(div.querySelector('.bg-asset-line').textContent).toContain('map.png')
  })
})
