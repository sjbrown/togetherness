// @vitest-environment jsdom
import * as Y from 'yjs'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  _clearSvgTextCache, _resetToyScriptState, activateToyScripts, getDoubleClickAction, makeLayerAPI,
} from '../../src/layer_toys.js'
import { addToy } from '../helpers/toys.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

const TOY_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100" id="widget_root">
  <script type="text/javascript" data-namespace="dblNs" id="script_dbl"><![CDATA[
    var dblNs = {
      menu: {
        'Plain': { eventName: 'dbl_plain', applicable: () => true, handler: function () {} },
        'Hidden': { eventName: 'dbl_hidden', otherEvents: ['dblclick'], applicable: () => false, handler: function () {} },
        'Roll': { eventName: 'dbl_roll', otherEvents: ['dblclick'], applicable: () => true, handler: function () {} },
      },
    }
  ]]></script>
</svg>`

beforeEach(() => {
  _clearSvgTextCache()
  _resetToyScriptState()
  delete globalThis.dblNs
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => TOY_SVG })))
})
afterEach(() => { vi.unstubAllGlobals() })

async function place() {
  const ydoc = new Y.Doc()
  const layerEl = document.createElementNS(SVG_NS, 'g')
  layerEl.id = 'toys-layer'
  await addToy(ydoc, layerEl, { id: 't1', toyType: 'dice_d6', x: 0, y: 0 })
  await activateToyScripts(ydoc, 'dice_d6')
  return { ydoc, layerEl, toyEl: layerEl.querySelector('[data-id="t1"]') }
}

describe('getDoubleClickAction', () => {
  test('is the first applicable entry declaring dblclick', async () => {
    const { toyEl } = await place()
    expect(getDoubleClickAction(toyEl)).toEqual({ namespace: 'dblNs', key: 'Roll' })
  })

  test('is null for something that is not a toy', () => {
    expect(getDoubleClickAction(document.createElementNS(SVG_NS, 'g'))).toBeNull()
  })

  test('the toys LayerAPI exposes it as doubleClickAction', async () => {
    const { ydoc, layerEl, toyEl } = await place()
    const api = makeLayerAPI(ydoc, () => layerEl, { id: 'u' }, 'tbl')
    expect(api.doubleClickAction(toyEl)).toEqual({ namespace: 'dblNs', key: 'Roll' })
  })
})
