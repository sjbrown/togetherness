// @vitest-environment jsdom
import { describe, test, expect } from 'vitest'
import { networkStatus, networkStatusBarHTML, networkStatusNote, EXTERNAL_SERVICES_INFO_URL } from '../../src/external_services_status.js'

const turnServer = { urls: 'turn:turn.example.com', username: 'u', credential: '•••' }
const net = (over = {}) => ({
  offline: false,
  signalingConns: [{ url: 'ws://a', connected: true }, { url: 'ws://b', connected: true }],
  ice: { iceServers: [{ urls: 'stun:s' }, turnServer], turnCredentials: 'service', turnIsPublicTestRelay: false },
  peersIce: [],
  ...over,
})
const byId = (n) => Object.fromEntries(networkStatus(n).map(i => [i.id, i]))

describe('networkStatus', () => {
  test('returns the four lights in order', () => {
    expect(networkStatus(net()).map(i => i.id)).toEqual(['signalling', 'stun', 'turn-creds', 'turn'])
  })

  test('signalling: ok / warn / bad by how many servers are connected', () => {
    const conns = (a, b) => ({ signalingConns: [{ connected: a }, { connected: b }] })
    expect(byId(net(conns(true, true))).signalling.state).toBe('ok')
    expect(byId(net(conns(true, false))).signalling.state).toBe('warn')
    expect(byId(net(conns(false, false))).signalling.state).toBe('bad')
    expect(byId(net({ signalingConns: [] })).signalling.state).toBe('idle')
  })

  test('STUN and TURN are idle until a peer has gathered candidates', () => {
    const s = byId(net())
    expect(s.stun.state).toBe('idle')
    expect(s.turn.state).toBe('idle')
  })

  test('STUN and TURN follow candidate counts across peers', () => {
    const peer = (srflx, relay) => ({ candidates: { host: 1, srflx, relay } })
    expect(byId(net({ peersIce: [peer(1, 1), peer(2, 1)] })).stun.state).toBe('ok')
    expect(byId(net({ peersIce: [peer(1, 0), peer(0, 0)] })).stun.state).toBe('warn')
    expect(byId(net({ peersIce: [peer(0, 0)] })).stun.state).toBe('bad')
    expect(byId(net({ peersIce: [peer(1, 1)] })).turn.state).toBe('ok')
    expect(byId(net({ peersIce: [peer(1, 0)] })).turn.state).toBe('bad')
  })

  test('peers that gathered nothing yet are ignored', () => {
    expect(byId(net({ peersIce: [{ candidates: null }] })).stun.state).toBe('idle')
  })

  test('TURN is bad with no relay configured', () => {
    const n = net({ ice: { iceServers: [{ urls: 'stun:s' }], turnCredentials: 'override' } })
    expect(byId(n).turn.state).toBe('bad')
  })

  test('TURN mentions relayed connections and the public test relay', () => {
    const n = net({
      peersIce: [{ candidates: { srflx: 1, relay: 1 }, route: 'relay' }],
      ice: { iceServers: [turnServer], turnCredentials: 'unavailable', turnIsPublicTestRelay: true },
    })
    expect(byId(n).turn.detail).toMatch(/1 connection is using it/)
    expect(byId(n).turn.detail).toMatch(/public test relay/)
  })

  test.each([
    ['service', 'ok'], ['unavailable', 'warn'], ['capped', 'bad'], ['override', 'idle'], [null, 'idle'],
  ])('TURN Creds %s is %s', (outcome, state) => {
    const n = net({ ice: { iceServers: [turnServer], turnCredentials: outcome } })
    expect(byId(n)['turn-creds'].state).toBe(state)
  })

  test('offline mode pauses every light', () => {
    expect(networkStatus(net({ offline: true })).map(i => i.state)).toEqual(['idle', 'idle', 'idle', 'idle'])
  })

  test('tolerates a missing net block', () => {
    expect(() => networkStatus(undefined)).not.toThrow()
  })
})

describe('networkStatusBarHTML', () => {
  test('each light links to its troubleshooting section and carries its state', () => {
    const div = document.createElement('div')
    div.innerHTML = networkStatusBarHTML(net())
    const links = [...div.querySelectorAll('a.net-status-item')]
    expect(links.map(a => a.getAttribute('href'))).toEqual(
      ['signalling', 'stun', 'turn-creds', 'turn'].map(id => `${EXTERNAL_SERVICES_INFO_URL}#${id}`))
    expect(links[0].classList.contains('ok')).toBe(true)
    expect(links.map(a => a.textContent)).toEqual(['Signalling', 'STUN', 'TURN Creds', 'TURN'])
  })

  test('escapes server-provided text in the tooltip', () => {
    const div = document.createElement('div')
    div.innerHTML = networkStatusBarHTML(net({ offline: true }))
    expect(div.querySelector('a').title).toBe('Offline mode is on.')
  })
})

describe('networkStatusNote', () => {
  test('appears only when the credentials service is capped', () => {
    const capped = net({ ice: { iceServers: [turnServer], turnCredentials: 'capped' } })
    expect(networkStatusNote(capped)).toMatch(/allowance is used up/)
    expect(networkStatusNote(net())).toBe('')
    expect(networkStatusNote({ ...capped, offline: true })).toBe('')
  })

  test('is rendered under the bar', () => {
    const div = document.createElement('div')
    div.innerHTML = networkStatusBarHTML(net({ ice: { iceServers: [turnServer], turnCredentials: 'capped' } }))
    expect(div.querySelector('.net-status-note a').getAttribute('href')).toBe(`${EXTERNAL_SERVICES_INFO_URL}#turn-creds`)
  })
})
