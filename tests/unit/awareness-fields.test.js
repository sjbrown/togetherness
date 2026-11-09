/**
 * tests/unit/awareness-fields.test.js
 *
 * src/AWARENESS.md is the registry of awareness fields. This keeps it
 * honest against the code that writes them: every field written in src/ is
 * listed, and every listed field is written somewhere.
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, test, expect } from 'vitest'
import * as SelectionLocal from '../../src/selection_local.js'
import { awarenessFields as attentionFields } from '../../src/layer_attention.js'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src')
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8')

// The first column of AWARENESS.md's table.
const registered = new Set(
  [...read('AWARENESS.md').matchAll(/^\| `(\w+)` \|/gm)].map((m) => m[1]))

function written() {
  const fields = new Set()
  for (const f of fs.readdirSync(SRC).filter((f) => f.endsWith('.js'))) {
    for (const m of read(f).matchAll(/setLocalStateField\('(\w+)'/g)) fields.add(m[1])
  }
  // Whole-state writes: index.html at boot, App.setOffline(false) on reconnect.
  for (const f of ['index.html', 'app.js']) {
    for (const m of read(f).matchAll(/setLocalState\(\{([^}]*)\}/g)) {
      for (const k of m[1].matchAll(/^\s*(\w+):/gm)) fields.add(k[1])
      for (const k of m[1].matchAll(/[{,]\s*(\w+):/g)) fields.add(k[1])
    }
  }
  for (const k of Object.keys(SelectionLocal.awarenessFields())) fields.add(k)
  for (const k of Object.keys(attentionFields())) fields.add(k)
  return fields
}

describe('AWARENESS.md', () => {
  test('lists every awareness field the code writes', () => {
    expect([...written()].filter((f) => !registered.has(f))).toEqual([])
  })

  test('lists no field the code never writes', () => {
    const w = written()
    expect([...registered].filter((f) => !w.has(f))).toEqual([])
  })
})
