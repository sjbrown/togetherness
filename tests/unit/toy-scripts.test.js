// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  activateToyScripts,
  getNamespacesForType,
  isToyTypeActivated,
  _resetToyScriptState,
  _getScriptsFragment,
  addToy, render, _clearSvgTextCache, clearYNodeMap,
} from '../../src/toys.js'

// ── low-level fixture: a "foreign" toyType's scripts, hoisted by hand ──────
//
// Scripts hoisted into the document are how a toyType with no local
// TOY_TYPES entry (a different deployment's custom toy, or one since
// removed/renamed here) recovers its behavior — see toys.js, "Script
// hoisting". Seeding the scripts fragment directly here simulates "this
// namespace was already hoisted by whichever session first placed an
// instance of it" without needing a real toyType/file on disk.
function seedForeignScripts(ydoc, toyType, scripts) {
  const yScripts = _getScriptsFragment(ydoc)
  ydoc.transact(() => {
    for (const { namespace, inline } of scripts) {
      const el = new Y.XmlElement('script')
      el.setAttribute('data-namespace', namespace)
      el.setAttribute('data-toy-type', toyType)
      el.insert(0, [new Y.XmlText(inline)])
      yScripts.insert(yScripts.length, [el])
    }
  })
}

beforeEach(() => {
  _resetToyScriptState()
  delete globalThis.__evalCount
  delete globalThis.__widgetNs
  delete globalThis.__helperNs
})

describe('activateToyScripts — a foreign toyType (no local file), via the hoisted registry', () => {
  test('evaluates an inline script, defining a global namespace', async () => {
    const ydoc = new Y.Doc()
    seedForeignScripts(ydoc, 'widget', [
      { namespace: 'widgetNs', inline: 'globalThis.__widgetNs = { hi: true }' },
    ])
    await activateToyScripts(ydoc, 'widget')
    expect(globalThis.__widgetNs).toEqual({ hi: true })
  })

  test('records data-namespace values per toy type, in script order', async () => {
    const ydoc = new Y.Doc()
    seedForeignScripts(ydoc, 'widget', [
      { namespace: 'helperNs', inline: 'globalThis.__evalCount = (globalThis.__evalCount||0)+1' },
      { namespace: 'widgetNs', inline: 'globalThis.__widgetNs = 1' },
    ])
    await activateToyScripts(ydoc, 'widget')
    expect(getNamespacesForType('widget')).toEqual(['helperNs', 'widgetNs'])
  })

  test('marks the toy type activated after running', async () => {
    const ydoc = new Y.Doc()
    seedForeignScripts(ydoc, 'widget', [{ namespace: 'widgetNs', inline: '1' }])
    expect(isToyTypeActivated('widget')).toBe(false)
    await activateToyScripts(ydoc, 'widget')
    expect(isToyTypeActivated('widget')).toBe(true)
  })

  test('a second call for the same toy type does not re-evaluate', async () => {
    const ydoc = new Y.Doc()
    seedForeignScripts(ydoc, 'widget', [
      { namespace: 'widgetNs', inline: 'globalThis.__evalCount = (globalThis.__evalCount||0)+1' },
    ])
    await activateToyScripts(ydoc, 'widget')
    await activateToyScripts(ydoc, 'widget')
    expect(globalThis.__evalCount).toBe(1)
  })

  test('a toy type with no hoisted scripts at all is a harmless no-op', async () => {
    const ydoc = new Y.Doc()
    await expect(activateToyScripts(ydoc, 'plain')).resolves.toBeUndefined()
    expect(isToyTypeActivated('plain')).toBe(true)
  })

  test('a concurrent second caller for the same toyType gets the real completion, not just "started"', async () => {
    // Regression: activateToyScripts used to mark a toyType activated
    // *before* awaiting its work, so a second caller mid-flight would see
    // isToyTypeActivated()===false but a naive re-check-and-return would
    // resolve before the actual work (fetch+eval) finished. Two concurrent
    // callers must share the same Promise and both see real completion —
    // true regardless of whether the underlying work is synchronous data
    // (this test) or a slow fetch (the registered-toyType path below),
    // since the Promise is cached before activateToyScripts ever returns.
    const ydoc = new Y.Doc()
    seedForeignScripts(ydoc, 'widget', [
      { namespace: 'widgetNs', inline: 'globalThis.__widgetNs = { ready: true }' },
    ])

    const first  = activateToyScripts(ydoc, 'widget')
    const second = activateToyScripts(ydoc, 'widget') // concurrent call, same tick
    expect(second).toBe(first) // same Promise, not a fresh no-op

    await second
    expect(globalThis.__widgetNs).toEqual({ ready: true })
    expect(isToyTypeActivated('widget')).toBe(true)
  })
})

const D6_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="d6_die" class="d6_die dice">
  <script type="text/javascript" src="js/dice_utils.js" data-namespace="dice" id="script_dice_utils"/>
  <script type="text/javascript" data-namespace="d6" id="script_d6"><![CDATA[
    globalThis.__d6ActivationCount = (globalThis.__d6ActivationCount || 0) + 1
    var d6 = { menu: {} }
  ]]></script>
  <g><circle r="5"/></g>
</svg>`

const DICE_UTILS_JS = `
globalThis.__diceActivationCount = (globalThis.__diceActivationCount || 0) + 1
var dice = { roll_handler: function () {} }
`

function stubToyFetch() {
  return vi.fn(async (url) => {
    if (url === '/toy/dice_d6.svg')     return { ok: true, text: async () => D6_SVG }
    if (url === '/toy/js/dice_utils.js') return { ok: true, text: async () => DICE_UTILS_JS }
    throw new Error(`unexpected fetch: ${url}`)
  })
}

describe('activateToyScripts — a registered toyType (real file), fetched fresh', () => {
  beforeEach(() => {
    _clearSvgTextCache()
    clearYNodeMap()
    delete globalThis.d6
    delete globalThis.dice
    delete globalThis.__d6ActivationCount
    delete globalThis.__diceActivationCount
    vi.stubGlobal('fetch', stubToyFetch())
  })

  test('placing a second d6 does not re-evaluate scripts', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    const fetchMock = stubToyFetch()
    vi.stubGlobal('fetch', fetchMock)

    await addToy(ydoc, yToys, { id: 't1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    render(yToys, layer)
    await new Promise(r => setTimeout(r, 0))

    await addToy(ydoc, yToys, { id: 't2', toyType: 'dice_d6', x: 10, y: 10, color: '#fff' })
    render(yToys, layer)
    await new Promise(r => setTimeout(r, 0))

    expect(globalThis.__d6ActivationCount).toBe(1)
    expect(globalThis.__diceActivationCount).toBe(1)
    // Only one fetch for js/dice_utils.js despite two placements — the
    // dice_d6.svg fetch itself is separately deduped by addToy's own cache.
    const scriptFetches = fetchMock.mock.calls.filter(([u]) => u === '/toy/js/dice_utils.js')
    expect(scriptFetches).toHaveLength(1)
  })

  test('a fresh session (cold _svgTextCache) re-fetches the template to activate an already-placed toy', async () => {
    // render()'s activateAllToyScripts path (not addToy's own placement
    // fetch) — the case of opening a table that already has toys in it.
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    // Build the toy directly (bypassing addToy) so nothing has warmed the
    // svg text cache — mirrors a page load syncing in pre-existing state.
    await addToy(ydoc, yToys, { id: 't1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    _clearSvgTextCache()
    _resetToyScriptState()
    delete globalThis.d6
    delete globalThis.dice

    render(yToys, layer)
    await new Promise(r => setTimeout(r, 0))

    expect(globalThis.d6).toBeDefined()
    expect(globalThis.dice).toBeDefined()
  })
})
