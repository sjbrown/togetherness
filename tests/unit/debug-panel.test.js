/**
 * tests/unit/debug-panel.test.js
 *
 * The Debug panel's render functions are pure — data in, HTML string out —
 * so they can be checked against literals without booting anything.
 *
 * The properties worth holding onto: it escapes peer-supplied text, it makes
 * a head/projection disagreement loud rather than merely present, it survives
 * a broken App bus (a debug panel that throws while reporting a broken state
 * hides the very thing it exists to show), and mounting is symmetric so a
 * tab switch cannot leave a live trace subscription behind.
 */

// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest'
import * as Trace from '../../src/trace.js'
import {
  esc, clockTime, idHTML, jsonHTML,
  stateHTML, opRowsHTML, streamRowsHTML, channelChipsHTML, joinSequenceHTML,
  debugBody, gatherDebugData, init, mount, unmount, isMounted, render,
} from '../../src/debug_panel.js'

const parse = (html) => {
  const d = document.createElement('div')
  d.innerHTML = html
  return d
}

const makeState = (over = {}) => ({
  table:    { tableId: 'demo-table', isCreator: true, schema: 4 },
  identity: { myId: 'tt-u-v1-AA-abc', clientId: 12345 },
  head:     { head: 'tt-op-aaa', mergeTips: [], projected: 'tt-op-aaa', agrees: true },
  ops:      { total: 2, shown: 2, truncated: false, tips: ['tt-op-bbb'], checkpoints: 1, mine: 1,
              ordered: [
                { i: 0, id: 'tt-op-aaa', gesture: 'checkpoint', authorId: 'tt-u-v1-AA-abc',
                  parents: [], ts: 1700000000000, mine: true, checkpoint: true,
                  entries: 1, mutations: [{ t: 'child', target: { id: 'tt-layer-toys' } }] },
                { i: 1, id: 'tt-op-bbb', gesture: 'move', authorId: 'tt-u-v1-BB-xyz',
                  parents: ['tt-op-aaa'], ts: 1700000001000, mine: false, checkpoint: false,
                  entries: 2, mutations: [{ t: 'attr', name: 'transform' }] },
              ] },
  net:      { connected: true, synced: true, webrtcPeers: 1, bcPeers: 0,
              signaling: ['ws://localhost:4444'], offline: false,
              peers: [{ clientId: 1, peerId: 'tt-u-v1-AA-abc', self: true }] },
  joinSequence: ['tt-u-v1-AA-abc', 'tt-u-v1-BB-xyz'],
  myAuthorityIndex: 0,
  ...over,
})

beforeEach(() => {
  Trace._reset()
  unmount()
  init(null)
})

// ─────────────────────────────────────────────────────────────────────────
// formatting
// ─────────────────────────────────────────────────────────────────────────

describe('formatting helpers', () => {
  test('esc neutralises markup', () => {
    expect(esc('<script>x</script>')).toBe('&lt;script&gt;x&lt;/script&gt;')
    expect(esc(null)).toBe('')
  })

  test('clockTime is millisecond-resolution, so near-simultaneous events order', () => {
    expect(clockTime(0)).toBe('00:00:00.000')
    expect(clockTime(undefined)).toBe('--:--:--')
  })

  test('jsonHTML survives a circular detail rather than throwing mid-render', () => {
    const circular = { name: 'loop' }
    circular.self = circular
    const html = jsonHTML(circular)
    expect(html).toContain('not serializable')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// state
// ─────────────────────────────────────────────────────────────────────────

describe('stateHTML', () => {
  test('shows head, tips, transport and authority order', () => {
    const d = parse(stateHTML(makeState()))
    const text = d.textContent
    expect(text).toContain('Head')
    expect(text).toContain('Operation log')
    expect(text).toContain('Transport')
    expect(text).toContain('demo-table')
    expect(text).toContain('ws://localhost:4444')
  })

  test('a head/projection disagreement is called out, not just displayed', () => {
    const s = makeState({ head: { head: 'tt-op-aaa', projected: 'tt-op-zzz', agrees: false, mergeTips: [] } })
    const d = parse(stateHTML(s))
    expect(d.querySelector('.dbg-card.warn')).not.toBeNull()
    expect(d.querySelector('.dbg-alert').textContent).toContain('different operation')
  })

  test('more than one tip is flagged as unreconciled divergence', () => {
    const s = makeState()
    s.ops.tips = ['tt-op-bbb', 'tt-op-ccc']
    const d = parse(stateHTML(s))
    expect(d.textContent).toContain('diverged')
  })

  test('a disconnected transport reads as a warning', () => {
    const s = makeState()
    s.net.connected = false
    const d = parse(stateHTML(s))
    expect(d.textContent).toContain('disconnected')
  })

  test('my own position in the authority order is marked', () => {
    const d = parse(stateHTML(makeState()))
    const mine = d.querySelectorAll('.dbg-join-row.me')
    expect(mine).toHaveLength(1)
    expect(mine[0].querySelector('.dbg-id').getAttribute('title')).toBe('tt-u-v1-AA-abc')
  })

  test('renders a message rather than throwing when there is no state', () => {
    expect(parse(stateHTML(null)).textContent).toContain('has not booted')
  })
})

describe('joinSequenceHTML', () => {
  const seq = ['tt-u-v1-AA-abc', 'tt-u-v1-BB-xyz', 'tt-u-v1-CC-qrs']

  test('renders one row per entry, in order, with its index', () => {
    const d = parse(joinSequenceHTML(seq, null, new Set()))
    const rows = d.querySelectorAll('.dbg-join-row')
    expect(rows).toHaveLength(3)
    expect([...rows].map(r => r.querySelector('.dbg-join-i').textContent)).toEqual(['0', '1', '2'])
  })

  test('marks my own row', () => {
    const d = parse(joinSequenceHTML(seq, 'tt-u-v1-BB-xyz', new Set()))
    const rows = d.querySelectorAll('.dbg-join-row')
    expect(rows[0].classList.contains('me')).toBe(false)
    expect(rows[1].classList.contains('me')).toBe(true)
    expect(rows[1].querySelector('.dbg-tag.mine')).not.toBeNull()
  })

  test('only index 0 is marked as tie-winner', () => {
    const d = parse(joinSequenceHTML(seq, null, new Set()))
    expect(d.querySelectorAll('.dbg-tag.head')).toHaveLength(1)
    expect(d.querySelectorAll('.dbg-join-row')[0].querySelector('.dbg-tag.head')).not.toBeNull()
  })

  test('online/offline is read off current presence, independent of position', () => {
    const d = parse(joinSequenceHTML(seq, null, new Set(['tt-u-v1-BB-xyz'])))
    const rows = d.querySelectorAll('.dbg-join-row')
    expect(rows[0].querySelector('.dbg-join-dot').classList.contains('offline')).toBe(true)
    expect(rows[1].querySelector('.dbg-join-dot').classList.contains('online')).toBe(true)
    expect(rows[2].querySelector('.dbg-join-dot').classList.contains('offline')).toBe(true)
  })

  test('an empty sequence explains itself rather than rendering nothing', () => {
    expect(parse(joinSequenceHTML([], null, new Set())).textContent).toContain('not been joined')
  })

  test('carries the raw array for exact inspection', () => {
    const d = parse(joinSequenceHTML(seq, null, new Set()))
    expect(d.querySelector('.dbg-join-raw .dbg-json').textContent).toContain('tt-u-v1-CC-qrs')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// operations
// ─────────────────────────────────────────────────────────────────────────

describe('opRowsHTML', () => {
  test('lists newest first — the last thing to happen is the thing being debugged', () => {
    const d = parse(opRowsHTML(makeState().ops, 'tt-op-bbb'))
    const gestures = [...d.querySelectorAll('.dbg-op-gesture')].map(e => e.textContent)
    expect(gestures).toEqual(['move', 'checkpoint'])
  })

  test('tags checkpoint, mine and head', () => {
    const d = parse(opRowsHTML(makeState().ops, 'tt-op-bbb'))
    const [moveRow, ckRow] = d.querySelectorAll('.dbg-op')
    expect(moveRow.querySelector('.dbg-tag.head')).not.toBeNull()
    expect(ckRow.querySelector('.dbg-tag.ck')).not.toBeNull()
    expect(ckRow.querySelector('.dbg-tag.mine')).not.toBeNull()
  })

  test('each row carries its wire packet as inspectable JSON', () => {
    const d = parse(opRowsHTML(makeState().ops, null))
    const pre = d.querySelector('.dbg-op .dbg-json')
    expect(pre.textContent).toContain('"t": "attr"')
  })

  test('says so when the log was truncated for rendering', () => {
    const ops = makeState().ops
    ops.total = 900
    ops.truncated = true
    ops.shown = 2
    expect(parse(opRowsHTML(ops, null)).textContent).toContain('most recent 2 of 900')
  })

  test('an empty log renders a message, not a broken list', () => {
    expect(parse(opRowsHTML({ ordered: [] }, null)).textContent).toContain('empty')
  })
})

// ─────────────────────────────────────────────────────────────────────────
// stream
// ─────────────────────────────────────────────────────────────────────────

describe('streamRowsHTML', () => {
  const ev = (over = {}) => ({
    seq: 1, t: 0, ms: 0, ch: 'op', evt: 'append', msg: 'placed a token',
    detail: null, level: 'info', ...over,
  })

  test('an event without detail is flat — nothing to disclose', () => {
    const d = parse(streamRowsHTML([ev()]))
    expect(d.querySelector('details')).toBeNull()
    expect(d.querySelector('.dbg-ev.flat')).not.toBeNull()
  })

  test('an event with detail is expandable and carries its JSON', () => {
    const d = parse(streamRowsHTML([ev({ detail: { id: 'tt-op-1' } })]))
    expect(d.querySelector('details')).not.toBeNull()
    expect(d.querySelector('.dbg-json').textContent).toContain('tt-op-1')
  })

  test('level shows up as a class so warnings and errors read differently', () => {
    const d = parse(streamRowsHTML([ev({ level: 'warn' }), ev({ seq: 2, level: 'error' })]))
    expect(d.querySelector('.lvl-warn')).not.toBeNull()
    expect(d.querySelector('.lvl-error')).not.toBeNull()
  })

  test('a peer-supplied message cannot inject markup', () => {
    // Gesture labels reach this panel from toy names other people typed.
    const d = parse(streamRowsHTML([ev({ msg: '<img src=x onerror=alert(1)>' })]))
    expect(d.querySelector('img')).toBeNull()
    expect(d.querySelector('.dbg-ev-msg').textContent).toBe('<img src=x onerror=alert(1)>')
  })

  test('an empty stream explains itself', () => {
    expect(parse(streamRowsHTML([])).textContent).toContain('Nothing recorded yet')
  })
})

describe('channelChipsHTML', () => {
  test('one chip per registered channel, carrying its count', () => {
    const chips = parse(channelChipsHTML({ op: 7 })).querySelectorAll('.dbg-chip')
    expect(chips).toHaveLength(Trace.CHANNELS.length)
    const op = [...chips].find(c => c.dataset.dbgChannel === 'op')
    expect(op.querySelector('.dbg-chip-n').textContent).toBe('7')
  })

  test('an enabled channel is marked on; a muted one is not', () => {
    const chips = parse(channelChipsHTML({})).querySelectorAll('.dbg-chip')
    const byId = Object.fromEntries([...chips].map(c => [c.dataset.dbgChannel, c]))
    expect(byId.op.classList.contains('on')).toBe(true)
    expect(byId.wire.classList.contains('on')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────
// body + mounting
// ─────────────────────────────────────────────────────────────────────────

describe('debugBody', () => {
  test('renders all four sections', () => {
    const d = parse(debugBody({ state: makeState(), counts: Trace.counts(), events: [],
                                recording: true, capacity: 600 }))
    const titles = [...d.querySelectorAll('.dbg-sec-title')].map(e => e.textContent)
    expect(titles).toEqual(['State', 'Operations', 'Stream', 'Recorder'])
  })

  test('a paused recorder is visible from the section header', () => {
    const d = parse(debugBody({ state: makeState(), counts: {}, events: [],
                                recording: false, capacity: 600 }))
    expect(d.textContent).toContain('paused')
    expect(d.textContent).toContain('Resume recording')
  })

  test('reports a failure to read state instead of rendering nothing', () => {
    const d = parse(debugBody({ state: { error: 'ydoc is undefined' }, counts: {}, events: [] }))
    expect(d.querySelector('.dbg-alert').textContent).toContain('ydoc is undefined')
  })
})

describe('gatherDebugData', () => {
  test('an App bus that throws is reported rather than propagated', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    init({ getDebugState: () => { throw new Error('boom') } })
    expect(gatherDebugData().state.error).toBe('boom')
    spy.mockRestore()
  })

  test('excludes muted channels from the stream it gathers', () => {
    init({ getDebugState: () => makeState() })
    Trace.setChannelEnabled(Trace.WIRE, true)
    Trace.op('a', 'an op')
    Trace.wire('b', 'a wire event')
    expect(gatherDebugData().events).toHaveLength(2)

    Trace.setChannelEnabled(Trace.WIRE, false)
    const evs = gatherDebugData().events
    expect(evs).toHaveLength(1)
    expect(evs[0].ch).toBe(Trace.OP)
  })
})

describe('mount / unmount', () => {
  test('mounting subscribes to the trace; unmounting releases it', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })

    mount(host)
    expect(isMounted()).toBe(true)

    unmount()
    expect(isMounted()).toBe(false)
    // A leaked subscription would keep re-rendering a detached node.
    Trace.op('a', 'after unmount')
    expect(host.innerHTML).toBe('')
  })

  test('mounting twice does not stack listeners', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })
    mount(host)
    mount(host)
    unmount()
    expect(isMounted()).toBe(false)
  })

  test('toggling a section is remembered across a re-render', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })
    mount(host)
    render()

    const ops = host.querySelector('[data-dbg-key="sec-ops"]')
    expect(ops.open).toBe(false)

    ops.open = true
    ops.dispatchEvent(new Event('toggle'))
    render()

    expect(host.querySelector('[data-dbg-key="sec-ops"]').open).toBe(true)
    unmount()
  })

  test('clicking a channel chip mutes it and re-renders', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })
    mount(host)
    render()

    expect(Trace.channelEnabled(Trace.OP)).toBe(true)
    host.querySelector('.dbg-chip[data-dbg-channel="op"]').click()
    expect(Trace.channelEnabled(Trace.OP)).toBe(false)
    expect(host.querySelector('.dbg-chip[data-dbg-channel="op"]').classList.contains('on')).toBe(false)
    unmount()
  })

  test('the recorder can be paused and resumed from the panel', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })
    mount(host)
    render()

    host.querySelector('[data-dbg-action="toggle-recording"]').click()
    expect(Trace.isEnabled()).toBe(false)
    host.querySelector('[data-dbg-action="toggle-recording"]').click()
    expect(Trace.isEnabled()).toBe(true)
    unmount()
  })

  test('clear empties the stream', () => {
    const host = document.createElement('div')
    init({ getDebugState: () => makeState() })
    Trace.op('a', 'something happened')
    mount(host)
    render()
    expect(host.textContent).toContain('something happened')

    host.querySelector('[data-dbg-action="clear"]').click()
    expect(Trace.counts().total).toBe(0)
    expect(host.textContent).toContain('Nothing recorded yet')
    unmount()
  })
})
