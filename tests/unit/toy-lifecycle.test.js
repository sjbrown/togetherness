// @vitest-environment jsdom
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { addToy, _clearSvgTextCache,
         _resetToyScriptState, activateToyScripts, initializeToySync } from '../../src/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

// A toy whose namespace mutates its own DOM in initialize() — enough to
// prove the mutation lands, the same way a menu-action handler's does.
const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="widget_root">
  <script type="text/javascript" data-namespace="widgetNs" id="script_widget"><![CDATA[
    var widgetNs = {
      initializeCallCount: 0,
      initialize: function (elem, prototype) {
        widgetNs.initializeCallCount++
        elem.$('#status_tspan').textContent = prototype ? 'from-prototype' : 'initialized'
      },
      menu: {},
    }
  ]]></script>
  <text id="status_text"><tspan id="status_tspan">unset</tspan></text>
</svg>`

// A toy whose only namespace has no initialize() at all — the common case
// (dice_utils.js's `dice` namespace never gets one).
const NO_INIT_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="plain_root">
  <script type="text/javascript" data-namespace="plainNs" id="script_plain"><![CDATA[
    var plainNs = { menu: {} }
  ]]></script>
  <text id="status_text"><tspan id="status_tspan">unset</tspan></text>
</svg>`

function freshLayer() {
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  return layerEl
}

function stubFetch(svgText) {
  return vi.fn(async () => ({ ok: true, text: async () => svgText }))
}

async function placeAndActivate(ydoc, layerEl, id) {
  await addToy(ydoc, layerEl, { id, toyType: 'player_marker', x: 0, y: 0 })
  await activateToyScripts(ydoc, 'player_marker') // await real completion, not just "started"
  return { layerEl, toyEl: layerEl.querySelector(`[data-id="${id}"]`) }
}

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.widgetNs
  delete globalThis.plainNs
})
afterEach(() => { vi.unstubAllGlobals() })

describe('initializeToySync', () => {
  test('calls initialize(elem) with no prototype, and the mutation lands in the DOM', async () => {
    vi.stubGlobal('fetch', stubFetch(TOY_SVG))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    initializeToySync(ydoc, layerEl, toyEl, 'player_marker')

    expect(layerEl.querySelector('#t1__status_tspan').textContent).toBe('initialized')
    expect(globalThis.widgetNs.initializeCallCount).toBe(1)
  })

  test('never passes a prototype (archive2025\u2019s config-dialog arg is deferred)', async () => {
    vi.stubGlobal('fetch', stubFetch(TOY_SVG))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    initializeToySync(ydoc, layerEl, toyEl, 'player_marker')

    // If a prototype had been passed, widgetNs.initialize would have
    // written 'from-prototype' instead.
    expect(layerEl.querySelector('#t1__status_tspan').textContent).toBe('initialized')
  })

  test('a namespace with no initialize() is skipped without error', async () => {
    vi.stubGlobal('fetch', stubFetch(NO_INIT_SVG))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    expect(initializeToySync(ydoc, layerEl, toyEl, 'player_marker')).toBeUndefined()
    expect(layerEl.querySelector('#t1__status_tspan').textContent).toBe('unset')
  })

  test('runs every namespace with an initialize(), not just the first', async () => {
    const TWO_NS_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="dual_root">
  <script type="text/javascript" data-namespace="aNs" id="script_a"><![CDATA[
    var aNs = { initialize: function (elem) { elem.$('#a_tspan').textContent = 'a-done' }, menu: {} }
  ]]></script>
  <script type="text/javascript" data-namespace="bNs" id="script_b"><![CDATA[
    var bNs = { initialize: function (elem) { elem.$('#b_tspan').textContent = 'b-done' }, menu: {} }
  ]]></script>
  <text id="a_text"><tspan id="a_tspan">unset</tspan></text>
  <text id="b_text"><tspan id="b_tspan">unset</tspan></text>
</svg>`
    vi.stubGlobal('fetch', stubFetch(TWO_NS_SVG))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    initializeToySync(ydoc, layerEl, toyEl, 'player_marker')

    expect(layerEl.querySelector('#t1__a_tspan').textContent).toBe('a-done')
    expect(layerEl.querySelector('#t1__b_tspan').textContent).toBe('b-done')
  })

  test('the real d6 namespace\u2019s initialize() is a harmless no-op without a prototype', async () => {
    const toyDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/toy')
    const D6_SVG        = fs.readFileSync(path.join(toyDir, 'dice_d6.svg'), 'utf8')
    const DICE_UTILS_JS = fs.readFileSync(path.join(toyDir, 'js/dice_utils.js'), 'utf8')
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
      return { ok: true, text: async () => D6_SVG }
    }))
    const ydoc = new Y.Doc()
    const layerEl = freshLayer()
    const { toyEl } = await placeAndActivate(ydoc, layerEl, 't1')

    const before = layerEl.querySelector('#t1__tspan_die_value').textContent
    expect(initializeToySync(ydoc, layerEl, toyEl, 'player_marker')).toBeUndefined()
    expect(layerEl.querySelector('#t1__tspan_die_value').textContent).toBe(before)
  })
})
