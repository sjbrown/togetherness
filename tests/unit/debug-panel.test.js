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
  stateHTML, healthBadgesHTML, headCardHTML, serversCardHTML, signalingHTML, iceHTML, peerTableHTML, opRowsHTML, streamRowsHTML, channelChipsHTML, joinSequenceHTML,
  debugBody, gatherDebugData, tracePayload, viewChipsHTML, connectivityActive, setWarnOnly, isWarnOnly, init, mount, unmount, isMounted, render,
  openSnapshot, closeSnapshot, isSnapshotOpen,
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
              signalingConns: [
                { url: 'ws://localhost:4444', role: 'primary', connected: true,
                  connects: 1, disconnects: 0 },
              ],
              offline: false,
              peers: [{ clientId: 1, peerId: 'tt-u-v1-AA-abc', self: true }] },
  joinSequence: ['tt-u-v1-AA-abc', 'tt-u-v1-BB-xyz'],
  myAuthorityIndex: 0,
  ...over,
})

beforeEach(() => {
  setWarnOnly(false)
  closeSnapshot()
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

describe('healthBadgesHTML', () => {
  const up = { url: 'ws://a', connected: true }
  const down = { url: 'ws://b', connected: false }
  const badges = (net) => [...parse(healthBadgesHTML(net)).querySelectorAll('span')].map(e => e.textContent)

  test('nothing when everything is fine', () => {
    expect(healthBadgesHTML({ signalingConns: [up, up], peersIce: [{ state: 'connected', route: 'host' }] })).toBe('')
  })

  test('nothing without data', () => {
    expect(healthBadgesHTML({})).toBe('')
    expect(healthBadgesHTML(undefined)).toBe('')
  })

  test('sig n/m when a signalling server is down, including none up', () => {
    expect(badges({ signalingConns: [up, down] })).toEqual(['sig 1/2'])
    expect(badges({ signalingConns: [down, down] })).toEqual(['sig 0/2'])
  })

  test('relay when any peer is relayed', () => {
    expect(badges({ peersIce: [{ state: 'connected', route: 'host' }, { state: 'connected', route: 'relay' }] })).toEqual(['relay'])
  })

  test('ice failed when any peer failed', () => {
    expect(badges({ peersIce: [{ state: 'failed', route: null }] })).toEqual(['ice failed'])
  })

  test('only the badges that apply, together', () => {
    expect(badges({ signalingConns: [up, down], peersIce: [{ state: 'failed', route: 'relay' }] }))
      .toEqual(['sig 1/2', 'relay', 'ice failed'])
  })

  test('the badges ride on the State summary, and not the Operations one', () => {
    const s = makeState()
    s.net.signalingConns = [up, down]
    const doc = parse(debugBody({ state: s, counts: {}, events: [], recording: true, capacity: 600 }))
    expect(doc.querySelector('[data-dbg-key="sec-state"] .dbg-sec-meta').textContent).toBe('sig 1/2')
    expect(doc.querySelector('[data-dbg-key="sec-ops"] .dbg-sec-meta').textContent).not.toContain('sig')
  })

  test('a head mismatch on Operations does not disturb the State badges', () => {
    const s = makeState({ head: { head: 'a', projected: 'b', agrees: false, mergeTips: [] } })
    s.net.peersIce = [{ state: 'failed', route: null }]
    const doc = parse(debugBody({ state: s, counts: {}, events: [], recording: true, capacity: 600 }))
    expect(doc.querySelector('[data-dbg-key="sec-state"] .dbg-sec-meta').textContent).toBe('ice failed')
    expect(doc.querySelector('[data-dbg-key="sec-ops"] .dbg-sec-meta').textContent).toContain('head mismatch')
  })
})

describe('headCardHTML', () => {
  test('shows the stored head, the projected one and pending merge tips', () => {
    const s = makeState({ head: { head: 'tt-op-aaa', projected: 'tt-op-aaa', agrees: true, mergeTips: ['tt-op-m1'] } })
    const card = parse(headCardHTML(s)).querySelector('.dbg-card')
    expect(card.querySelector('.dbg-card-title').textContent).toBe('Head')
    expect(card.textContent).toContain('tt-op-aaa')
    expect(card.textContent).toContain('tt-op-m1')
    expect(card.classList.contains('warn')).toBe(false)
  })

  test('a head/projection disagreement is called out, not just displayed', () => {
    const s = makeState({ head: { head: 'tt-op-aaa', projected: 'tt-op-zzz', agrees: false, mergeTips: [] } })
    const card = parse(headCardHTML(s)).querySelector('.dbg-card')
    expect(card.classList.contains('warn')).toBe(true)
    expect(card.querySelector('.dbg-alert').textContent).toContain('different operation')
  })

  test('renders nothing without state', () => {
    expect(headCardHTML(null)).toBe('')
  })
})

describe('stateHTML', () => {
  test('shows servers, table, sync and authority order', () => {
    const d = parse(stateHTML(makeState()))
    const text = d.textContent
    expect(text).toContain('Signalling')
    expect(text).toContain('doc synced')
    expect(text).toContain('demo-table')
    expect(text).toContain('ws://localhost:4444')
  })

  test('groups servers into one card and peers into another', () => {
    const s = makeState()
    s.net.ice = { iceServers: [{ urls: 'stun:s.example.com' }], turnIsPublicTestRelay: false }
    s.net.peersIce = []
    const doc = parse(stateHTML(s))
    const titles = [...doc.querySelectorAll('.dbg-card-title')].map(e => e.textContent)
    expect(titles).toEqual(['Servers', 'Table', 'Peers'])

    const cardOf = (title) => [...doc.querySelectorAll('.dbg-card')].find(c => c.querySelector('.dbg-card-title').textContent === title)
    const subs = (c) => [...c.querySelectorAll('.dbg-subtitle')].map(e => e.textContent)
    expect(subs(cardOf('Servers'))).toEqual(['Signalling', 'STUN / TURN'])
    expect(subs(cardOf('Peers'))).toEqual(['Sync', 'WebRTC', 'Presence', 'Join sequence'])
  })

  test('a state with no ice data leaves out the groups it cannot fill', () => {
    const doc = parse(stateHTML(makeState()))
    const subs = [...doc.querySelectorAll('.dbg-subtitle')].map(e => e.textContent)
    expect(subs).toEqual(['Signalling', 'Sync', 'Presence', 'Join sequence'])
  })

  test('there is no separate Transport card; its facts live in Peers', () => {
    const doc = parse(stateHTML(makeState({ net: { ...makeState().net, synced: false, bcPeers: 2, offline: true } })))
    const titles = [...doc.querySelectorAll('.dbg-card-title')].map(e => e.textContent)
    expect(titles).not.toContain('Transport')
    const peers = [...doc.querySelectorAll('.dbg-card')].find(c => c.querySelector('.dbg-card-title').textContent === 'Peers')
    const t = peers.textContent
    expect(t).toContain('doc synced')
    expect(t).toContain('not yet')
    expect(t).toContain('broadcastchannel peers')
    expect(t).toContain('offline mode')
    expect(t).toContain('tt-u-v1-AA-abc')
    expect(t).not.toContain('webrtc peers')
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

describe('signalingHTML', () => {
  const conn = (over = {}) => ({
    url: 'ws://a.example', role: 'primary', connected: true,
    connects: 1, disconnects: 0, ...over,
  })
  const card = (conns) => parse(`<div class="dbg-card">${signalingHTML({ signalingConns: conns })}</div>`).querySelector('.dbg-card')

  test('shows one row per server with url, role and counts', () => {
    const c = card([conn(), conn({ url: 'ws://b.example', role: 'fallback', connects: 3, disconnects: 2 })])
    const rows = c.querySelectorAll('.dbg-sig-row')
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain('ws://a.example')
    expect(rows[0].textContent).toContain('primary')
    expect(rows[1].textContent).toContain('fallback')
    expect(rows[1].querySelector('.dbg-sig-counts').textContent).toMatch(/3.*2/)
  })

  test('both up: no warning', () => {
    const c = card([conn(), conn({ url: 'ws://b.example', role: 'fallback' })])
    expect(c.querySelectorAll('.dbg-dot.online')).toHaveLength(2)
    expect(c.querySelector('.dbg-alert')).toBeNull()
  })

  test('one down: marked offline but not a warning', () => {
    const c = card([conn(), conn({ url: 'ws://b.example', role: 'fallback', connected: false })])
    expect(c.querySelectorAll('.dbg-dot.online')).toHaveLength(1)
    expect(c.querySelectorAll('.dbg-dot.offline')).toHaveLength(1)
    expect(c.querySelector('.dbg-alert')).toBeNull()
  })

  test('all down: says so', () => {
    const c = card([conn({ connected: false }), conn({ url: 'ws://b.example', role: 'fallback', connected: false })])
    expect(c.querySelector('.dbg-alert').textContent).toBe('No signalling server is reachable.')
  })

  test('no servers: says so, without an alert', () => {
    const c = card([])
    expect(c.textContent).toContain('No signalling servers')
    expect(c.querySelector('.dbg-alert')).toBeNull()
  })

  test('a missing list renders like an empty one', () => {
    expect(parse(signalingHTML({})).textContent).toContain('No signalling servers')
    expect(parse(signalingHTML(undefined)).textContent).toContain('No signalling servers')
  })

  test('escapes a url', () => {
    const c = card([conn({ url: 'ws://<img src=x onerror=1>' })])
    expect(c.querySelector('img')).toBeNull()
  })
})

describe('iceHTML', () => {
  const ice = (over = {}) => ({
    iceServers: [
      { urls: 'stun:stun.example.com:19302' },
      { urls: 'turn:relay.example.com:3478', username: 'alice', credential: '•••' },
      { urls: 'turn:relay.example.com:443', username: 'alice', credential: '•••' },
    ],
    stunOverridden: true, turnOverridden: true, turnIsPublicTestRelay: false, ...over,
  })
  const peer = (candidates, over = {}) => ({ peer: 'p1', state: 'connected', route: 'host', connectMs: 120, candidates, lastError: null, ...over })
  const card = (net) => parse(`<div class="dbg-card">${iceHTML(net)}</div>`).querySelector('.dbg-card')
  const text = (net) => card(net).textContent.replace(/\s+/g, ' ')

  test('renders nothing without ice data', () => {
    expect(iceHTML({})).toBe('')
    expect(iceHTML(undefined)).toBe('')
  })

  test('lists STUN and TURN urls and the TURN username, never a credential', () => {
    const t = text({ ice: ice(), peersIce: [] })
    expect(t).toContain('stun:stun.example.com:19302')
    expect(t).toContain('turn:relay.example.com:3478')
    expect(t).toContain('turn:relay.example.com:443')
    expect(t).toContain('alice')
    expect(t).not.toContain('•••')
    expect(t).not.toContain('secret')
  })

  test('tags the public test relay, and only then', () => {
    expect(card({ ice: ice({ turnIsPublicTestRelay: true }), peersIce: [] }).querySelector('.dbg-tag.warn').textContent).toBe('public test relay')
    expect(card({ ice: ice(), peersIce: [] }).querySelector('.dbg-tag.warn')).toBeNull()
  })

  test('with no peers it says so rather than claiming success or failure', () => {
    const c = card({ ice: ice(), peersIce: [] })
    expect(c.textContent).toContain('no peers yet')
    expect(c.querySelector('.dbg-alert')).toBeNull()
  })

  test('a peer still gathering is not counted', () => {
    const c = card({ ice: ice(), peersIce: [peer(null)] })
    expect(c.textContent).toContain('no peers yet')
  })

  test('both kinds seen on every peer: ok, no alert', () => {
    const c = card({ ice: ice(), peersIce: [peer({ host: 1, srflx: 1, relay: 1 }), peer({ host: 1, srflx: 2, relay: 1 }, { peer: 'p2' })] })
    expect(c.textContent).toContain('reflexive candidates on 2/2 peers')
    expect(c.textContent).toContain('relay candidates on 2/2 peers')
    expect(c.querySelectorAll('.dbg-ok')).toHaveLength(2)
    expect(c.querySelector('.dbg-alert')).toBeNull()
  })

  test('TURN never producing a relay candidate is called out', () => {
    const c = card({ ice: ice(), peersIce: [peer({ host: 1, srflx: 1, relay: 0 })] })
    expect(c.querySelector('.dbg-alert').textContent).toBe('TURN never produced a relay candidate.')
    expect(c.textContent).toContain('relay candidates on 0/1 peers')
  })

  test('STUN never producing a reflexive candidate is called out', () => {
    const c = card({ ice: ice(), peersIce: [peer({ host: 1, srflx: 0, relay: 1 })] })
    expect(c.querySelector('.dbg-alert').textContent).toBe('STUN never produced a reflexive candidate.')
  })

  test('some peers but not all: flagged, but not the never-alert', () => {
    const c = card({ ice: ice(), peersIce: [peer({ host: 1, srflx: 1, relay: 1 }), peer({ host: 1, srflx: 1, relay: 0 }, { peer: 'p2' })] })
    expect(c.textContent).toContain('relay candidates on 1/2 peers')
    expect(c.querySelector('.dbg-alert')).toBeNull()
    expect(c.querySelectorAll('.dbg-bad')).toHaveLength(1)
  })

  test('escapes a server url', () => {
    const c = card({ ice: ice({ iceServers: [{ urls: 'stun:<img src=x onerror=1>' }] }), peersIce: [] })
    expect(c.querySelector('img')).toBeNull()
  })
})

describe('peerTableHTML', () => {
  const row = (over = {}) => ({
    peer: '7f271957-4479-4588-9526-9982e8b1dd01', state: 'connected', route: 'host',
    connectMs: 87, candidates: { host: 1, srflx: 0, relay: 0 }, lastError: null, ...over,
  })
  const card = (peersIce) => parse(`<div class="dbg-card">${peerTableHTML({ peersIce })}</div>`).querySelector('.dbg-card')

  test('renders nothing when the state has no ice data', () => {
    expect(peerTableHTML({})).toBe('')
    expect(peerTableHTML(undefined)).toBe('')
  })

  test('no peers: says so', () => {
    expect(card([]).textContent).toContain('No WebRTC peers')
  })

  test('shows a short id with the full one in the title, state, route and time', () => {
    const r = card([row()]).querySelector('.dbg-peer-row')
    expect(r.querySelector('.dbg-id').textContent).toBe('7f271957')
    expect(r.querySelector('.dbg-id').getAttribute('title')).toBe('7f271957-4479-4588-9526-9982e8b1dd01')
    expect(r.textContent).toContain('connected')
    expect(r.querySelector('.dbg-tag.route.host')).not.toBeNull()
    expect(r.textContent).toContain('87 ms')
  })

  test('colour-codes each route', () => {
    const c = card([row({ route: 'host' }), row({ peer: 'b', route: 'srflx' }), row({ peer: 'c', route: 'prflx' }), row({ peer: 'd', route: 'relay' })])
    for (const r of ['host', 'srflx', 'prflx', 'relay']) expect(c.querySelectorAll(`.dbg-tag.route.${r}`)).toHaveLength(1)
  })

  test('a peer with no route yet shows a dash and no time', () => {
    const r = card([row({ state: 'checking', route: null, connectMs: null })]).querySelector('.dbg-peer-row')
    expect(r.querySelector('.dbg-tag.route')).toBeNull()
    expect(r.querySelector('.dbg-peer-ms').textContent).toBe('')
  })

  test('a failed peer reads as bad and shows its last error', () => {
    const r = card([row({ state: 'failed', route: null, connectMs: null,
      lastError: { url: 'turn:relay.example.com:3478', errorCode: 401, errorText: 'Unauthorized' } })]).querySelector('.dbg-peer-row')
    expect(r.querySelector('.dbg-bad').textContent).toBe('failed')
    expect(r.querySelector('.dbg-peer-err').textContent).toContain('401')
    expect(r.querySelector('.dbg-peer-err').textContent).toContain('turn:relay.example.com:3478')
  })

  test('escapes a peer id and an error url', () => {
    const c = card([row({ peer: '<img src=x onerror=1>', lastError: { url: '<script>1</script>', errorCode: 701 } })])
    expect(c.querySelector('img')).toBeNull()
    expect(c.querySelector('script')).toBeNull()
  })
})

describe('serversCardHTML edit link', () => {
  const card = () => parse(serversCardHTML({ signalingConns: [] })).querySelector('.dbg-card')

  test('links to the Advanced panel on the home page, in a new tab', () => {
    const a = card().querySelector('a')
    expect(a.textContent).toBe('Edit services…')
    expect(a.getAttribute('href')).toBe('home.html#advanced')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toContain('noopener')
  })

  test('says when changes take effect', () => {
    expect(card().textContent).toContain('next time this table is opened')
  })
})

describe('serversCardHTML', () => {
  const conn = (over = {}) => ({ url: 'ws://a.example', role: 'primary', connected: true, connects: 1, disconnects: 0, ...over })
  const card = (conns) => parse(serversCardHTML({ signalingConns: conns })).querySelector('.dbg-card')

  test('no warning while any signalling server is up', () => {
    expect(card([conn(), conn({ url: 'ws://b.example', role: 'fallback', connected: false })]).classList.contains('warn')).toBe(false)
  })

  test('warns when every signalling server is down', () => {
    expect(card([conn({ connected: false })]).classList.contains('warn')).toBe(true)
  })

  test('no signalling servers is not a warning', () => {
    expect(card([]).classList.contains('warn')).toBe(false)
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

describe('streamRowsHTML level filter', () => {
  const ev = (seq, level, msg = `row ${seq}`) => ({ seq, t: 0, ms: 0, ch: 'net', evt: 'x', msg, detail: null, level })

  test('warnOnly keeps warnings and errors and drops info', () => {
    const d = parse(streamRowsHTML([ev(1, 'info'), ev(2, 'warn'), ev(3, 'error'), ev(4, 'info')], { warnOnly: true }))
    expect([...d.querySelectorAll('.dbg-ev-msg')].map(e => e.textContent)).toEqual(['row 2', 'row 3'])
  })

  test('without the option every row shows', () => {
    expect(parse(streamRowsHTML([ev(1, 'info'), ev(2, 'warn')])).querySelectorAll('.dbg-ev')).toHaveLength(2)
  })

  test('nothing but info rows says there are no warnings, not that nothing was recorded', () => {
    const t = parse(streamRowsHTML([ev(1, 'info')], { warnOnly: true })).textContent
    expect(t).toContain('No warnings or errors')
    expect(t).not.toContain('Nothing recorded yet')
  })

  test('an empty stream still says nothing was recorded', () => {
    expect(parse(streamRowsHTML([], { warnOnly: true })).textContent).toContain('Nothing recorded yet')
  })
})

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

describe('stream views', () => {
  const host = () => {
    const h = document.createElement('div')
    init({ getDebugState: () => makeState() })
    mount(h); render()
    return h
  }
  const isRecording = (ch) => Trace.channelEnabled(ch)

  test('Connectivity is off by default and marks itself on only for net + ice', () => {
    expect(connectivityActive()).toBe(false)
    expect(parse(viewChipsHTML()).querySelector('[data-dbg-action="preset-connectivity"]').classList.contains('on')).toBe(false)
    for (const c of Trace.CHANNELS) Trace.setChannelEnabled(c.id, c.id === 'net' || c.id === 'ice')
    expect(connectivityActive()).toBe(true)
    expect(parse(viewChipsHTML()).querySelector('[data-dbg-action="preset-connectivity"]').classList.contains('on')).toBe(true)
  })

  test('clicking Connectivity leaves only net and ice recording; clicking again restores the defaults', () => {
    const h = host()
    h.querySelector('[data-dbg-action="preset-connectivity"]').click()
    expect(Trace.CHANNELS.filter(c => isRecording(c.id)).map(c => c.id)).toEqual(['net', 'ice'])
    expect(h.querySelector('[data-dbg-action="preset-connectivity"]').classList.contains('on')).toBe(true)

    h.querySelector('[data-dbg-action="preset-connectivity"]').click()
    expect(isRecording('op')).toBe(true)
    expect(isRecording('boot')).toBe(true)
    expect(isRecording('wire')).toBe(false)
    expect(connectivityActive()).toBe(false)
    unmount()
  })

  test('warnings and errors on a channel muted by the preset are still recorded', () => {
    const h = host()
    h.querySelector('[data-dbg-action="preset-connectivity"]').click()
    expect(Trace.op('append', 'info is dropped')).toBeNull()
    expect(Trace.op('append', 'warn survives', null, 'warn')).not.toBeNull()
    expect(Trace.envelope('x', 'error survives', null, 'error')).not.toBeNull()
    unmount()
  })

  test('the preset leaves the rest of the stream to the net and ice channels', () => {
    Trace.net('a', 'net row'); Trace.ice('b', 'ice row'); Trace.op('c', 'op row')
    const h = host()
    h.querySelector('[data-dbg-action="preset-connectivity"]').click()
    const text = h.querySelector('#dbgStream').textContent
    expect(text).toContain('net row'); expect(text).toContain('ice row')
    expect(text).not.toContain('op row')
    unmount()
  })

  test('warn+ filters the stream without touching what records', () => {
    Trace.net('a', 'quiet info row'); Trace.net('b', 'loud warn row', null, 'warn')
    const h = host()
    expect(h.querySelector('#dbgStream').textContent).toContain('quiet info row')

    h.querySelector('[data-dbg-action="toggle-warn"]').click()
    expect(isWarnOnly()).toBe(true)
    expect(h.querySelector('[data-dbg-action="toggle-warn"]').classList.contains('on')).toBe(true)
    expect(h.querySelector('#dbgStream').textContent).toContain('loud warn row')
    expect(h.querySelector('#dbgStream').textContent).not.toContain('quiet info row')
    expect(Trace.channelEnabled('net')).toBe(true)
    expect(Trace.events().map(e => e.msg)).toContain('quiet info row')

    h.querySelector('[data-dbg-action="toggle-warn"]').click()
    expect(h.querySelector('#dbgStream').textContent).toContain('quiet info row')
    unmount()
  })

  test('warn+ carries into a snapshot', () => {
    Trace.net('a', 'quiet info row'); Trace.net('b', 'loud warn row', null, 'warn')
    setWarnOnly(true)
    init({ getDebugState: () => makeState() })
    const doc = parse(debugBody(gatherDebugData(), { snapshot: true }))
    expect(doc.querySelector('.dbg-stream').textContent).toContain('loud warn row')
    expect(doc.querySelector('.dbg-stream').textContent).not.toContain('quiet info row')
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

describe('debugBody: where the head card lives', () => {
  const body = (state) => parse(debugBody({ state, counts: Trace.counts(), events: [], recording: true, capacity: 600 }))

  test('the Head card is in Operations, not State, and there is no Operation log card', () => {
    const doc = body(makeState())
    const titlesIn = (key) => [...doc.querySelector(`[data-dbg-key="${key}"]`).querySelectorAll('.dbg-card-title')].map(e => e.textContent)
    expect(titlesIn('sec-ops')).toEqual(['Head'])
    expect(titlesIn('sec-state')).not.toContain('Head')
    expect(doc.textContent).not.toContain('Operation log')
  })

  test('a head mismatch is flagged on the Operations summary', () => {
    const doc = body(makeState({ head: { head: 'tt-op-aaa', projected: 'tt-op-zzz', agrees: false, mergeTips: [] } }))
    expect(doc.querySelector('[data-dbg-key="sec-ops"] .dbg-sec-meta').textContent).toContain('head mismatch')
    expect(doc.querySelector('[data-dbg-key="sec-state"] .dbg-sec-meta')).toBeNull()
  })

  test('no mismatch, no flag', () => {
    expect(body(makeState()).querySelector('[data-dbg-key="sec-ops"] .dbg-sec-meta').textContent).not.toContain('mismatch')
  })
})

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

// ─────────────────────────────────────────────────────────────────────────
// snapshot
// ─────────────────────────────────────────────────────────────────────────

describe('snapshot', () => {
  const data = (over = {}) => ({
    state: makeState(), counts: Trace.counts(), recording: true, capacity: 600,
    events: [{ seq: 1, t: 1700000000000, ch: 'net', evt: 'x', msg: 'signaling connected', detail: { url: 'ws://a' }, level: 'info' }],
    ...over,
  })

  test('the panel has a Snapshot Now button above the first section', () => {
    const doc = parse(debugBody(data()))
    const btn = doc.querySelector('[data-dbg-action="snapshot"]')
    expect(btn.textContent).toContain('Snapshot Now')
    expect(btn.textContent).toContain('📷')
    const order = [...doc.querySelectorAll('.dbg-snapshot-row, .dbg-section')]
    expect(order[0].classList.contains('dbg-snapshot-row')).toBe(true)
  })

  const snap = (over, takenAt) => parse(debugBody(data(over), { snapshot: true, takenAt }))

  test('the snapshot is the panel body itself: same sections, all open, with when it was taken', () => {
    const doc = snap({}, 1700000000000)
    expect([...doc.querySelectorAll('.dbg-sec-title')].map(e => e.textContent)).toEqual(['State', 'Operations', 'Stream'])
    expect([...doc.querySelectorAll('details.dbg-section')].every(s => s.open)).toBe(true)
    expect(doc.textContent).toContain('Taken at 22:13:20.000')
    expect(doc.textContent).toContain('signaling connected')

    const live = parse(debugBody(data()))
    for (const key of ['sec-state', 'sec-ops', 'sec-stream']) {
      expect(doc.querySelector(`[data-dbg-key="${key}"] .dbg-section-body`).innerHTML.length).toBeGreaterThan(0)
      expect(live.querySelector(`[data-dbg-key="${key}"]`)).not.toBeNull()
    }
  })

  test('the snapshot leaves out what only acts on the live panel', () => {
    const doc = snap()
    expect(doc.querySelector('.dbg-chips')).toBeNull()
    expect(doc.querySelector('[data-dbg-action="snapshot"]')).toBeNull()
    expect(doc.querySelector('[data-dbg-action="toggle-recording"]')).toBeNull()
    expect(doc.querySelector('[data-dbg-action="clear"]')).toBeNull()
    expect(doc.querySelector('#dbgStream')).toBeNull()
  })

  test('the live body is unchanged by the option existing: closed sections, chips, recorder', () => {
    const doc = parse(debugBody(data()))
    expect(doc.querySelector('.dbg-chips')).not.toBeNull()
    expect(doc.querySelector('[data-dbg-action="toggle-recording"]')).not.toBeNull()
    expect(doc.querySelector('#dbgStream')).not.toBeNull()
    expect(doc.querySelector('[data-dbg-key="sec-trace"]').open).toBe(false)
  })

  test('a snapshot flags a head mismatch on Operations and survives a state error', () => {
    const bad = makeState({ head: { head: 'tt-op-aaa', projected: 'tt-op-zzz', agrees: false, mergeTips: [] } })
    expect(snap({ state: bad }).querySelector('[data-dbg-key="sec-ops"] .dbg-sec-meta').textContent).toContain('head mismatch')
    expect(snap({ state: { error: 'boom' } }).textContent).toContain('boom')
  })

  test('clicking Snapshot Now opens a dialog outside the panel', () => {
    const host = document.createElement('div')
    document.body.append(host)
    init({ getDebugState: () => makeState() })
    mount(host)
    render()

    host.querySelector('[data-dbg-action="snapshot"]').click()
    expect(isSnapshotOpen()).toBe(true)
    const dlg = document.querySelector('.dialog-snapshot')
    expect(dlg).not.toBeNull()
    expect(host.contains(dlg)).toBe(false)
    expect(dlg.getAttribute('role')).toBe('dialog')
    expect(dlg.querySelector('.dbg-snapshot').textContent).toContain('Taken at')
    unmount(); host.remove()
  })

  test('trace events and panel re-renders leave an open snapshot untouched', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    init({ getDebugState: () => makeState() })
    mount(host)
    render()
    host.querySelector('[data-dbg-action="snapshot"]').click()

    const body = document.querySelector('.dbg-snapshot')
    const before = body.innerHTML
    const marker = body.querySelector('.dbg-sec-title')

    Trace.net('later', 'something after the snapshot')
    render()
    await new Promise(r => setTimeout(r, 40))

    expect(body.innerHTML).toBe(before)
    expect(body.contains(marker)).toBe(true)
    expect(body.textContent).not.toContain('something after the snapshot')
    expect(host.textContent).toContain('something after the snapshot')
    unmount(); host.remove()
  })

  test('closes from the Close button, the scrim and Escape', () => {
    init({ getDebugState: () => makeState() })
    openSnapshot()
    document.querySelector('.dialog-snapshot .dialog-btn').click()
    expect(isSnapshotOpen()).toBe(false)
    expect(document.querySelector('.dialog-snapshot')).toBeNull()

    openSnapshot()
    document.querySelector('.dialog-scrim[data-dbg-snapshot-close]').click()
    expect(isSnapshotOpen()).toBe(false)

    openSnapshot()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isSnapshotOpen()).toBe(false)
    expect(document.querySelector('.dialog-scrim[data-dbg-snapshot-close]')).toBeNull()
  })

  test('clicking inside the dialog does not close it', () => {
    init({ getDebugState: () => makeState() })
    openSnapshot()
    document.querySelector('.dbg-snapshot').click()
    expect(isSnapshotOpen()).toBe(true)
    closeSnapshot()
  })

  test('opening twice leaves one dialog, and closing removes the key listener', () => {
    init({ getDebugState: () => makeState() })
    openSnapshot()
    openSnapshot()
    expect(document.querySelectorAll('.dialog-snapshot')).toHaveLength(1)
    expect(document.querySelectorAll('.dialog-scrim[data-dbg-snapshot-close]')).toHaveLength(1)
    closeSnapshot()
    expect(document.querySelectorAll('.dialog-snapshot')).toHaveLength(0)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(isSnapshotOpen()).toBe(false)
  })

  test('closing with nothing open is harmless', () => {
    expect(() => closeSnapshot()).not.toThrow()
  })
})

describe('tracePayload (Download trace)', () => {
  const net = () => ({
    ...makeState().net,
    signalingConns: [{ url: 'ws://a', role: 'primary', connected: true, connects: 1, disconnects: 0 }],
    ice: { iceServers: [{ urls: 'turn:t.example.com:3478', username: 'alice', credential: '•••' }], turnIsPublicTestRelay: false },
  })

  test('carries the ring, the state, and a services block lifted from it', () => {
    Trace.net('x', 'a row')
    init({ getDebugState: () => makeState({ net: net() }) })
    const p = tracePayload()
    expect(p.format).toBe('togetherness-trace')
    expect(p.events.map(e => e.msg)).toContain('a row')
    expect(p.state.table.tableId).toBe('demo-table')
    expect(p.services.signaling[0].url).toBe('ws://a')
    expect(p.services.ice.iceServers[0].urls).toBe('turn:t.example.com:3478')
  })

  test('the services block carries no credential', () => {
    init({ getDebugState: () => makeState({ net: net() }) })
    const text = JSON.stringify(tracePayload().services)
    expect(text).toContain('•••')
    expect(text).not.toContain('secret')
  })

  test('services are null, not missing, when the state has none', () => {
    init({ getDebugState: () => makeState() })
    const p = tracePayload()
    expect(p.services.ice).toBeNull()
    expect(p.services.signaling[0].url).toBe('ws://localhost:4444')
  })

  test('a broken state still yields the trace, with null services', () => {
    init({ getDebugState: () => { throw new Error('nope') } })
    const p = tracePayload()
    expect(p.state).toBeNull()
    expect(p.services).toEqual({ signaling: null, ice: null })
    expect(Array.isArray(p.events)).toBe(true)
  })

  test('with no App bus at all', () => {
    init(null)
    expect(tracePayload().services).toEqual({ signaling: null, ice: null })
  })
})
