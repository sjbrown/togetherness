/**
 * external_services.js — signaling/STUN/TURN overrides for y-webrtc, and
 * the per-server connection state of the signalling conns it configures,
 * and a trace of how its STUN/TURN servers performed.
 * home.html's "Advanced" panel edits these; index.html reads them when
 * constructing its WebrtcProvider. Callers do `import * as
 * ExternalServices from './external_services.js'` and call e.g.
 * ExternalServices.getSTUN() / .setSignalling(url).
 */

import * as Trace from './trace.js';

// ── Signalling servers ──────────────────────────────────────────────────────
/**
 * Primary + fallback signalling URLs live in localStorage; unset fields
 * use host-based defaults not written until edited. y-webrtc connects to
 * both concurrently — "fallback" describes intent, not failover order.
 */

export const SIGNALLING_KEY          = 'tt_external_service_signaling';
export const SIGNALLING_FALLBACK_KEY = 'tt_external_service_signaling_fallback';

export function getSignalling() {
  return localStorage.getItem(SIGNALLING_KEY) || null;
}

export function getSignallingFallback() {
  return localStorage.getItem(SIGNALLING_FALLBACK_KEY) || null;
}

export function defaultSignalling() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://signaling.1kfa.com';
}

export function defaultSignallingFallback() {
  return location.hostname === 'localhost' ? '' : 'wss://signaling.ezide.com';
}

/**
 * A no-op (clearing any override) on empty or identical-to-default —
 * otherwise a future default change would be masked by a stored value
 * nobody meant to set.
 */
export function setSignalling(url) {
  const value = (url || '').trim();
  if (value && value !== defaultSignalling()) {
    localStorage.setItem(SIGNALLING_KEY, value);
  } else {
    localStorage.removeItem(SIGNALLING_KEY);
  }
}

/**
 * Empty or identical-to-default clears the override. Identical to the
 * resolved primary is rejected instead, leaving any existing override
 * untouched — two identical signalling URLs help nobody.
 */
export function setSignallingFallback(url) {
  const value = (url || '').trim();
  if (!value || value === defaultSignallingFallback()) {
    localStorage.removeItem(SIGNALLING_FALLBACK_KEY);
    return;
  }
  if (value === resolveSignalling()) return;
  localStorage.setItem(SIGNALLING_FALLBACK_KEY, value);
}

export function resolveSignalling() {
  return getSignalling() ?? defaultSignalling();
}

export function resolveSignallingFallback() {
  return getSignallingFallback() ?? defaultSignallingFallback();
}

/**
 * All signalling URLs for WebrtcProvider, primary first, blanks and
 * duplicates dropped.
 */
export function resolveSignallingAll() {
  const urls = [resolveSignalling(), resolveSignallingFallback()]
    .map(url => (url || '').trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

// ── STUN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback STUN URLs live in localStorage. Unlike signalling,
 * there's no built-in default — unset means simple-peer's own STUN
 * servers apply, shown as "[Yjs Default]" in the UI.
 */

export const STUN_KEY          = 'tt_external_service_stun';
export const STUN_FALLBACK_KEY = 'tt_external_service_stun_fallback';

export function isValidSTUN(value) {
  if (typeof value !== 'string') return false;
  return /^stuns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getSTUN() {
  return localStorage.getItem(STUN_KEY) || null;
}

export function getSTUNFallback() {
  return localStorage.getItem(STUN_FALLBACK_KEY) || null;
}

export function setSTUN(url) {
  if (isValidSTUN(url)) localStorage.setItem(STUN_KEY, url.trim());
}

/**
 * A no-op on empty/invalid input, or one identical to the stored
 * primary — existing storage is left untouched either way.
 */
export function setSTUNFallback(url) {
  if (!isValidSTUN(url)) return;
  const value = url.trim();
  if (value === getSTUN()) return;
  localStorage.setItem(STUN_FALLBACK_KEY, value);
}

// ── TURN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback TURN URLs, plus the single credential pair both are
 * offered under — a relay, unlike a STUN server, authenticates. Unset
 * fields fall back to metered.ca's Open Relay, a free public test
 * service: enough to prove a relayed connection works, not something to
 * depend on.
 */

export const TURN_KEY            = 'tt_external_service_turn';
export const TURN_FALLBACK_KEY   = 'tt_external_service_turn_fallback';
export const TURN_USERNAME_KEY   = 'tt_external_service_turn_username';
export const TURN_CREDENTIAL_KEY = 'tt_external_service_turn_credential';

export function isValidTURN(value) {
  if (typeof value !== 'string') return false;
  return /^turns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getTURN() {
  return localStorage.getItem(TURN_KEY) || null;
}

export function getTURNFallback() {
  return localStorage.getItem(TURN_FALLBACK_KEY) || null;
}

export function getTURNUsername() {
  return localStorage.getItem(TURN_USERNAME_KEY) || null;
}

export function getTURNCredential() {
  return localStorage.getItem(TURN_CREDENTIAL_KEY) || null;
}

export function defaultTURN() {
  return 'turn:openrelay.metered.ca:80';
}

export function defaultTURNFallback() {
  return 'turn:openrelay.metered.ca:443';
}

export function defaultTURNUsername() {
  return 'openrelayproject';
}

export function defaultTURNCredential() {
  return 'openrelayproject';
}

/**
 * Empty or identical-to-default clears the override, so a later change
 * to the built-in default isn't masked by a stored value nobody meant to
 * set. A malformed URL is rejected instead, leaving storage untouched.
 */
export function setTURN(url) {
  const value = (url || '').trim();
  if (!value || value === defaultTURN()) {
    localStorage.removeItem(TURN_KEY);
    return;
  }
  if (!isValidTURN(value)) return;
  localStorage.setItem(TURN_KEY, value);
}

/**
 * Same rules as the primary, plus: one identical to the resolved primary
 * is rejected — two names for the same relay buy nothing.
 */
export function setTURNFallback(url) {
  const value = (url || '').trim();
  if (!value || value === defaultTURNFallback()) {
    localStorage.removeItem(TURN_FALLBACK_KEY);
    return;
  }
  if (!isValidTURN(value)) return;
  if (value === resolveTURN()) return;
  localStorage.setItem(TURN_FALLBACK_KEY, value);
}

/**
 * Credentials are free-form, so only the empty/identical-to-default
 * clearing rule applies. Both TURN URLs are offered under this one pair.
 */
export function setTURNUsername(name) {
  const value = (name || '').trim();
  if (value && value !== defaultTURNUsername()) {
    localStorage.setItem(TURN_USERNAME_KEY, value);
  } else {
    localStorage.removeItem(TURN_USERNAME_KEY);
  }
}

export function setTURNCredential(secret) {
  const value = (secret || '').trim();
  if (value && value !== defaultTURNCredential()) {
    localStorage.setItem(TURN_CREDENTIAL_KEY, value);
  } else {
    localStorage.removeItem(TURN_CREDENTIAL_KEY);
  }
}

export function resolveTURN() {
  return getTURN() ?? defaultTURN();
}

export function resolveTURNFallback() {
  return getTURNFallback() ?? defaultTURNFallback();
}

export function resolveTURNUsername() {
  return getTURNUsername() ?? defaultTURNUsername();
}

export function resolveTURNCredential() {
  return getTURNCredential() ?? defaultTURNCredential();
}

/**
 * simple-peer's own STUN servers, which passing `iceServers` at all
 * would otherwise displace. Stand in for an unset STUN override so the
 * "[Yjs Default]" the UI promises for a blank field stays true now that
 * the TURN defaults mean `iceServers` is always supplied.
 */
const YJS_DEFAULT_STUN = ['stun:stun.l.google.com:19302', 'stun:global.stun.twilio.com:3478'];

/**
 * RTCIceServer entries for the WebrtcProvider, STUN first then TURN,
 * each relay carrying the credential pair. Never empty: unset TURN
 * fields resolve to the public test relay.
 */
export function resolveIceServers() {
  const stored = [getSTUN(), getSTUNFallback()].filter(isValidSTUN);
  const stun   = (stored.length ? stored : YJS_DEFAULT_STUN).map(urls => ({ urls }));
  const turn   = [...new Set([resolveTURN(), resolveTURNFallback()].filter(isValidTURN))]
    .map(urls => ({
      urls,
      username:   resolveTURNUsername(),
      credential: resolveTURNCredential(),
    }));
  return [...stun, ...turn];
}

/**
 * resolveIceServers() as it's safe to write down: each credential masked,
 * plus where each kind came from. Trace rows end up in downloaded bug
 * reports, so this is what index.html records rather than the live config.
 */
export function describeIceServers() {
  const iceServers = resolveIceServers().map(entry =>
    'credential' in entry ? { ...entry, credential: '•••' } : entry);
  return {
    iceServers,
    stunOverridden: getSTUN() !== null || getSTUNFallback() !== null,
    turnOverridden: [getTURN(), getTURNFallback(), getTURNUsername(), getTURNCredential()]
      .some(v => v !== null),
    turnIsPublicTestRelay: resolveTURN() === defaultTURN()
      || resolveTURNFallback() === defaultTURNFallback(),
  };
}

// ── Signalling connection state ─────────────────────────────────────────────
/**
 * Per-server state for the signalling conns a WebrtcProvider opens, which
 * y-webrtc reports only as connect/disconnect events on each conn. app.js
 * feeds each event to `update`; the result says whether any server is still
 * connected, which decides how loudly a drop is recorded.
 */

/**
 * `servers` is [{ url, connected }] in resolution order: the first is the
 * primary, any other is a fallback.
 */
export function createSignalingTracker(servers, now = Date.now) {
  const entries = servers.map((s, i) => ({
    url:        s.url,
    role:       i === 0 ? 'primary' : 'fallback',
    connected:  !!s.connected,
    lastChange: null,
    connects:   0,
    disconnects: 0,
  }));

  const anyConnected = () => entries.some(e => e.connected);

  /**
   * Record one conn's new state. A repeat of the state already held, or an
   * unknown url, reports `changed: false` and touches nothing.
   */
  function update(url, connected) {
    const entry = entries.find(e => e.url === url);
    connected = !!connected;
    if (!entry || entry.connected === connected) {
      return { changed: false, entry: entry ? { ...entry } : null, anyConnected: anyConnected() };
    }
    entry.connected  = connected;
    entry.lastChange = now();
    if (connected) entry.connects++;
    else entry.disconnects++;
    return { changed: true, entry: { ...entry }, anyConnected: anyConnected() };
  }

  return {
    update,
    anyConnected,
    snapshot: () => entries.map(e => ({ ...e })),
  };
}

// ── ICE connection tracing ──────────────────────────────────────────────────
/**
 * Writes down what an RTCPeerConnection's ICE machinery does, on the `ice`
 * trace channel: state changes, how many candidates of each kind it
 * gathered, candidate errors, and the route it finally selected. That is
 * the only evidence of whether the STUN and TURN servers configured above
 * were actually usable — a peer that never connects otherwise looks the
 * same as one that was never offered.
 *
 * Only counts and candidate types are recorded, never candidate strings
 * or addresses: a downloaded trace shouldn't carry anyone's IP.
 *
 * `info` is filled in as things happen — current ICE state, candidate
 * counts, the last candidate error, the selected route — so the Debug
 * panel can show a peer's standing without replaying the trace.
 *
 * Returns a function that stops listening.
 */
export function traceIcePeer(peerId, pc, info = {}) {
  Object.assign(info, {
    peer: peerId, state: pc.iceConnectionState ?? 'new',
    route: null, connectMs: null, candidates: null, lastError: null,
  });
  const started = Date.now();
  const counts  = { host: 0, srflx: 0, relay: 0 };
  let selectedRecorded = false;

  const typeOf = (c) => c?.type ?? /\btyp (\w+)/.exec(c?.candidate ?? '')?.[1];

  const onCandidate = (e) => {
    const type = typeOf(e.candidate);
    if (type in counts) counts[type]++;
  };

  const onGathering = () => {
    if (pc.iceGatheringState !== 'complete') return;
    const missing = [];
    if (counts.srflx === 0) missing.push('no STUN reflexive candidate');
    if (counts.relay === 0) missing.push('no TURN relay candidate');
    info.candidates = { ...counts };
    Trace.ice('ice-candidates',
      `ICE gathering done${missing.length ? ` — ${missing.join(', ')}` : ''}`,
      { peer: peerId, ...counts },
      missing.length ? 'warn' : 'info');
  };

  const onError = (e) => {
    info.lastError = { url: e.url ?? null, errorCode: e.errorCode ?? null, errorText: e.errorText ?? null };
    Trace.ice('ice-error', `ICE candidate error ${e.errorCode ?? ''} from ${e.url ?? 'unknown server'}`,
      { peer: peerId, url: e.url ?? null, errorCode: e.errorCode ?? null, errorText: e.errorText ?? null },
      'warn');
  };

  const onState = (kind, state) => {
    Trace.ice('ice-state', `${kind} ${state}: ${peerId}`, { peer: peerId, kind, state },
      state === 'failed' ? 'error' : state === 'disconnected' ? 'warn' : 'info');
  };

  // The selected pair isn't always set by the first "connected" event, so
  // each later connection event tries again until one has been recorded.
  let selecting = false;
  const maybeRecordRoute = async () => {
    if (selectedRecorded || selecting) return;
    selecting = true;
    try { selectedRecorded = await recordSelectedRoute(); }
    finally { selecting = false; }
  };
  const isUp = (s) => s === 'connected' || s === 'completed';

  const onIceState = () => {
    info.state = pc.iceConnectionState;
    onState('ice', pc.iceConnectionState);
    if (isUp(pc.iceConnectionState)) maybeRecordRoute();
  };
  const onConnState = () => {
    onState('connection', pc.connectionState);
    if (pc.connectionState === 'connected') maybeRecordRoute();
  };

  async function recordSelectedRoute() {
    try {
      const stats = new Map();
      (await pc.getStats()).forEach((v, k) => stats.set(k, v));
      const all = [...stats.values()];
      const transport = all.find(s => s.type === 'transport' && s.selectedCandidatePairId);
      const pair = (transport && stats.get(transport.selectedCandidatePairId))
        ?? all.find(s => s.type === 'candidate-pair' && s.nominated && s.state === 'succeeded');
      if (!pair) return false;
      const local  = stats.get(pair.localCandidateId)?.candidateType ?? null;
      const remote = stats.get(pair.remoteCandidateId)?.candidateType ?? null;
      const has    = (t) => local === t || remote === t;
      const route  = has('relay') ? 'relay' : has('srflx') ? 'srflx' : has('prflx') ? 'prflx' : 'host';
      info.route     = route;
      info.connectMs = Date.now() - started;
      Trace.ice('ice-selected', `connected via ${route}: ${peerId}`,
        { peer: peerId, route, local, remote, ms: info.connectMs });
      return true;
    } catch {
      return false; // stats are best-effort evidence, never a reason to fail
    }
  }

  const listeners = [
    ['icecandidate',            onCandidate],
    ['icegatheringstatechange', onGathering],
    ['icecandidateerror',       onError],
    ['iceconnectionstatechange', onIceState],
    ['connectionstatechange',   onConnState],
  ];
  for (const [name, fn] of listeners) pc.addEventListener(name, fn);
  return () => { for (const [name, fn] of listeners) pc.removeEventListener(name, fn); };
}

/**
 * Trace ICE for every WebRTC peer a WebrtcProvider creates. y-webrtc
 * announces a peer as it creates the connection, before ICE starts, so
 * listeners attached on that event see the whole negotiation. `_pc` is
 * simple-peer's private handle on the RTCPeerConnection. Register this as
 * soon as the provider exists: a joiner's connections are made while the
 * join dialog is still probing, long before the app boots.
 */
export function traceIceProvider(provider) {
  const stops = new Map();
  provider.on('peers', ({ added = [], removed = [] }) => {
    for (const id of added) {
      try {
        const pc = provider.room?.webrtcConns?.get(id)?.peer?._pc;
        if (!pc) continue;
        stops.get(id)?.();
        const info = {};
        stops.set(id, traceIcePeer(id, pc, info));
        _icePeers.set(id, info);
      } catch (err) {
        console.error('[ice] could not trace peer', id, err);
      }
    }
    for (const id of removed) {
      stops.get(id)?.();
      stops.delete(id);
      _icePeers.delete(id);
    }
  });
}

const _icePeers = new Map();

/** A copy of each traced peer's current standing, for the Debug panel. */
export function getIcePeers() {
  return [..._icePeers.values()].map(p => ({
    ...p,
    candidates: p.candidates && { ...p.candidates },
    lastError:  p.lastError && { ...p.lastError },
  }));
}

/** Test-only: forget every traced peer. */
export function _resetIcePeers() {
  _icePeers.clear();
}
