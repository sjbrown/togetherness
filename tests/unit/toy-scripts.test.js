// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  activateToyScripts,
  getNamespacesForType,
  isToyTypeActivated,
  _resetToyScriptState,
} from '../../src/toy-scripts.js'
import {
  addToy, render, _clearSvgTextCache, clearYNodeMap,
} from '../../src/toys.js'

// ── low-level fixture: a detached toy tree built by hand, attached to a doc ──

function makeAttachedToy({ id = 't1', toyType = 'widget', scripts = [] } = {}) {
  const ydoc = new Y.Doc()
  const frag = ydoc.getXmlFragment('toys')
  const g = new Y.XmlElement('g')
  g.setAttribute('class', 'toy')
  g.setAttribute('data-toy-id', id)
  g.setAttribute('data-toy-type', toyType)

  const svg = new Y.XmlElement('svg')
  const scriptEls = scripts.map(s => {
    const script = new Y.XmlElement('script')
    if (s.namespace) script.setAttribute('data-namespace', s.namespace)
    if (s.src)       script.setAttribute('src', s.src)
    if (s.inline)    script.insert(0, [new Y.XmlText(s.inline)])
    return script
  })
  if (scriptEls.length) svg.insert(0, scriptEls)
  g.insert(0, [svg])

  ydoc.transact(() => frag.insert(0, [g]))
  return { ydoc, frag, g }
}

beforeEach(() => {
  _resetToyScriptState()
  delete globalThis.__evalCount
  delete globalThis.__widgetNs
  delete globalThis.__helperNs
})

describe('activateToyScripts — extraction & evaluation', () => {
  test('evaluates an inline CDATA script, defining a global namespace', async () => {
    const { g } = makeAttachedToy({
      toyType: 'widget',
      scripts: [{ namespace: 'widgetNs', inline: 'globalThis.__widgetNs = { hi: true }' }],
    })
    await activateToyScripts(g, 'widget')
    expect(globalThis.__widgetNs).toEqual({ hi: true })
  })

  test('records data-namespace values per toy type, in script order', async () => {
    const { g } = makeAttachedToy({
      toyType: 'widget',
      scripts: [
        { namespace: 'helperNs', inline: 'globalThis.__evalCount = (globalThis.__evalCount||0)+1' },
        { namespace: 'widgetNs', inline: 'globalThis.__widgetNs = 1' },
      ],
    })
    await activateToyScripts(g, 'widget')
    expect(getNamespacesForType('widget')).toEqual(['helperNs', 'widgetNs'])
  })

  test('marks the toy type activated after running', async () => {
    const { g } = makeAttachedToy({ toyType: 'widget', scripts: [{ inline: '1' }] })
    expect(isToyTypeActivated('widget')).toBe(false)
    await activateToyScripts(g, 'widget')
    expect(isToyTypeActivated('widget')).toBe(true)
  })

  test('a second instance of the same toy type does not re-evaluate', async () => {
    const script = { namespace: 'widgetNs', inline: 'globalThis.__evalCount = (globalThis.__evalCount||0)+1' }
    const first  = makeAttachedToy({ id: 'a', toyType: 'widget', scripts: [script] })
    const second = makeAttachedToy({ id: 'b', toyType: 'widget', scripts: [script] })

    await activateToyScripts(first.g, 'widget')
    await activateToyScripts(second.g, 'widget')

    expect(globalThis.__evalCount).toBe(1)
  })

  test('a toy type with no scripts is a harmless no-op', async () => {
    const { g } = makeAttachedToy({ toyType: 'plain', scripts: [] })
    await expect(activateToyScripts(g, 'plain')).resolves.toBeUndefined()
    expect(isToyTypeActivated('plain')).toBe(true)
  })

  test('external <script src> is fetched once and deduped by resolved URL', async () => {
    const fetchMock = vi.fn(async (url) => {
      expect(url).toBe('/toy/js/helper.js')
      return { ok: true, text: async () => 'globalThis.__helperNs = { loaded: true }' }
    })
    vi.stubGlobal('fetch', fetchMock)

    const scripts = [{ namespace: 'helperNs', src: 'js/helper.js' }]
    // Two different toy types sharing the same external helper file —
    // the URL-level dedup means the second type's src script still gets
    // its namespace recorded, but the file is fetched only once.
    const a = makeAttachedToy({ toyType: 'die_a', scripts })
    const b = makeAttachedToy({ toyType: 'die_b', scripts })

    await activateToyScripts(a.g, 'die_a')
    await activateToyScripts(b.g, 'die_b')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(globalThis.__helperNs).toEqual({ loaded: true })
    expect(getNamespacesForType('die_a')).toEqual(['helperNs'])
    expect(getNamespacesForType('die_b')).toEqual(['helperNs'])
  })
  test('a concurrent caller awaiting the same toyType gets the real completion, not just "started"', async () => {
    // Regression: activateToyScripts used to mark a toyType activated
    // *before* awaiting its fetch, so a second caller mid-flight would see
    // isToyTypeActivated()===false but a naive re-check-and-return would
    // resolve before the actual work (fetch+eval) finished. Two concurrent
    // callers must now share the same Promise and both see real completion.
    let resolveFetch
    const fetchGate = new Promise(r => { resolveFetch = r })
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      await fetchGate
      return { ok: true, text: async () => 'globalThis.__raceNs = { ready: true }' }
    }))

    const scripts = [{ namespace: 'raceNs', src: 'js/race.js' }]
    const { g } = makeAttachedToy({ toyType: 'racer', scripts })

    const first  = activateToyScripts(g, 'racer')  // starts the fetch, doesn't await it here
    const second = activateToyScripts(g, 'racer')  // concurrent call, before the fetch resolves
    expect(second).toBe(first) // same Promise, not a fresh no-op

    resolveFetch()
    await second

    expect(globalThis.__raceNs).toEqual({ ready: true })
    expect(isToyTypeActivated('racer')).toBe(true)
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

describe('toys.js render() — script activation on placement', () => {
  beforeEach(() => {
    _clearSvgTextCache()
    clearYNodeMap()
    delete globalThis.d6
    delete globalThis.dice
    delete globalThis.__d6ActivationCount
    delete globalThis.__diceActivationCount
    vi.stubGlobal('fetch', stubToyFetch())
  })

  test('placing a d6 defines window.d6 and window.dice', async () => {
    const ydoc  = new Y.Doc()
    const yToys = ydoc.getXmlFragment('toys')
    const layer = document.createElementNS('http://www.w3.org/2000/svg', 'g')

    await addToy(ydoc, yToys, { id: 't1', toyType: 'dice_d6', x: 0, y: 0, color: '#fff' })
    render(yToys, layer)
    await new Promise(r => setTimeout(r, 0)) // flush the fire-and-forget activation

    expect(globalThis.d6).toEqual({ menu: {} })
    expect(globalThis.dice).toBeDefined()
    expect(getNamespacesForType('dice_d6')).toEqual(['dice', 'd6'])
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
})
