/**
 * network_status.js — the four-light summary of the network services a
 * table leans on: signalling, STUN, TURN credentials, TURN. Pure: takes
 * the `net` block app.js reports (signalingConns, ice, peersIce, offline)
 * and returns plain data or HTML. The Peers tab renders the bar; each
 * light links to the matching section of networking-troubleshooting.html.
 */

export const TROUBLESHOOTING_URL = 'networking-troubleshooting.html';

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const item = (id, label, state, detail) => ({ id, label, state, detail });

const gatheredPeers = (net) => (net?.peersIce ?? []).filter(p => p.candidates);

/** ok when every gathered peer produced `key`, bad when none did. */
function candidateState(net, key, what) {
  const gathered = gatheredPeers(net);
  if (!gathered.length) return { state: 'idle', detail: 'Not tested yet: no peers have connected.' };
  const n = gathered.filter(p => p.candidates[key] > 0).length;
  if (n === gathered.length) return { state: 'ok', detail: `Working: ${what} found for every peer.` };
  if (n === 0) return { state: 'bad', detail: `Not working: ${what} never found.` };
  return { state: 'warn', detail: `Partly working: ${what} found for ${n} of ${gathered.length} peers.` };
}

function signallingItem(net) {
  const conns = net?.signalingConns ?? [];
  if (!conns.length) return item('signalling', 'Signalling', 'idle', 'No signalling server is configured.');
  const up = conns.filter(c => c.connected).length;
  if (up === conns.length) return item('signalling', 'Signalling', 'ok', `Connected to ${up} of ${conns.length} servers.`);
  if (up === 0) return item('signalling', 'Signalling', 'bad', 'Cannot reach any signalling server. New peers cannot find you.');
  return item('signalling', 'Signalling', 'warn', `Connected to ${up} of ${conns.length} servers.`);
}

function credentialsItem(net) {
  const label = 'TURN Creds';
  switch (net?.ice?.turnCredentials) {
    case 'service':
      return item('turn-creds', label, 'ok', 'Fresh relay credentials received.');
    case 'capped':
      return item('turn-creds', label, 'bad',
        "The credentials service's monthly relay allowance is used up. Using the built-in public test relay.");
    case 'unavailable':
      return item('turn-creds', label, 'warn',
        'The credentials service could not be reached. Using the built-in public test relay.');
    case 'override':
      return item('turn-creds', label, 'idle', 'Not needed: you set your own TURN server.');
    default:
      return item('turn-creds', label, 'idle', 'Not requested yet.');
  }
}

function turnItem(net) {
  const servers = net?.ice?.iceServers ?? [];
  const hasTurn = servers.some(e => [].concat(e.urls).some(u => /^turns?:/i.test(u)));
  if (!hasTurn) return item('turn', 'TURN', 'bad', 'No relay server is configured.');
  const { state, detail } = candidateState(net, 'relay', 'a relay');
  const relayed = (net?.peersIce ?? []).filter(p => p.route === 'relay').length;
  const notes = [
    relayed ? `${relayed} connection${relayed === 1 ? ' is' : 's are'} using it.` : '',
    net.ice.turnIsPublicTestRelay ? 'This is a public test relay, not one to depend on.' : '',
  ].filter(Boolean);
  return item('turn', 'TURN', state, [detail, ...notes].join(' '));
}

/** The four lights, in display order. Offline mode pauses them all. */
export function networkStatus(net) {
  if (net?.offline) {
    return [['signalling', 'Signalling'], ['stun', 'STUN'], ['turn-creds', 'TURN Creds'], ['turn', 'TURN']]
      .map(([id, label]) => item(id, label, 'idle', 'Offline mode is on.'));
  }
  const stun = candidateState(net, 'srflx', 'a public address');
  return [
    signallingItem(net),
    item('stun', 'STUN', stun.state, stun.detail),
    credentialsItem(net),
    turnItem(net),
  ];
}

/** A one-line explanation under the bar when the credentials service is capped. */
export function networkStatusNote(net) {
  if (net?.offline || net?.ice?.turnCredentials !== 'capped') return '';
  return `The shared relay allowance is used up for now, so peers on strict networks
    (offices, airports, cell connections) may not be able to connect.
    <a href="${TROUBLESHOOTING_URL}#turn-creds" target="_blank" rel="noopener">What can I do?</a>`;
}

export function networkStatusBarHTML(net) {
  const lights = networkStatus(net).map(i =>
    `<a class="net-status-item ${i.state}" href="${TROUBLESHOOTING_URL}#${i.id}" target="_blank" rel="noopener"
        title="${esc(i.detail)}"><span class="net-dot"></span>${esc(i.label)}</a>`).join('');
  const note = networkStatusNote(net);
  return `<div class="net-status" id="netStatus">
      <div class="net-status-bar">${lights}</div>
      ${note ? `<div class="net-status-note">${note}</div>` : ''}
    </div>`;
}
