/**
 * external_services.js — shared config for the two kinds of third-party
 * network endpoints the app talks to: y-webrtc signaling servers, and
 * optional STUN server overrides for the underlying RTCPeerConnections.
 * home.html's "Advanced" panel edits both; index.html reads both when
 * constructing its WebrtcProvider.
 */

// ── Signaling servers ───────────────────────────────────────────────────────
/**
 * Two URLs live in localStorage — a primary and a "fallback" — shared by
 * index.html (which actually connects to both concurrently) and home.html
 * (which offers an "Advanced" field to view/edit them). If nothing is
 * stored yet, host-based defaults are used and NOT written to localStorage
 * until the person actually changes a field — so a future change to a
 * built-in default still takes effect for anyone who never touched that
 * field.
 *
 * Note on "fallback": y-webrtc connects to every signaling URL passed to
 * WebrtcProvider concurrently, not in priority order — both are in use
 * simultaneously whenever both are reachable. "Fallback" here describes
 * intent (the second server exists so peers can still find each other if
 * the primary is down), not the actual connection mechanics.
 */

export const SIGNALING_KEY          = 'tt_external_service_signaling';
export const SIGNALING_FALLBACK_KEY = 'tt_external_service_signaling_fallback';

/** The primary value currently in localStorage, or null if never set. */
export function getStoredSignalingServer() {
  return localStorage.getItem(SIGNALING_KEY) || null;
}

/** The fallback value currently in localStorage, or null if never set. */
export function getStoredFallbackSignalingServer() {
  return localStorage.getItem(SIGNALING_FALLBACK_KEY) || null;
}

/** The built-in primary default: local dev server on localhost, public Worker otherwise. */
export function defaultSignalingServer() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://signaling.1kfa.com';
}

/** The built-in fallback default: none locally, the VPS-hosted server otherwise. */
export function defaultFallbackSignalingServer() {
  return location.hostname === 'localhost' ? '' : 'wss://signaling.ezide.com';
}

/**
 * Persist the primary signaling server URL. A no-op (clearing any stored
 * override) on an empty value or one identical to the built-in default —
 * otherwise a future change to that default would be masked by a stored
 * value nobody meant to set.
 */
export function setStoredSignalingServer(url) {
  const value = (url || '').trim();
  if (value && value !== defaultSignalingServer()) {
    localStorage.setItem(SIGNALING_KEY, value);
  } else {
    localStorage.removeItem(SIGNALING_KEY);
  }
}

/**
 * Persist the fallback signaling server URL. An empty value or one
 * identical to the built-in fallback default clears any stored override
 * (the person is asking for "no fallback" / "just use the default").
 * A value identical to the resolved primary server is rejected instead —
 * y-webrtc gains nothing from two identical signaling URLs — leaving any
 * existing stored override untouched rather than clearing it.
 */
export function setStoredFallbackSignalingServer(url) {
  const value = (url || '').trim();
  if (!value || value === defaultFallbackSignalingServer()) {
    localStorage.removeItem(SIGNALING_FALLBACK_KEY);
    return;
  }
  if (value === resolveSignalingServer()) return;
  localStorage.setItem(SIGNALING_FALLBACK_KEY, value);
}

/** The primary URL to actually connect with: localStorage override, else the default. */
export function resolveSignalingServer() {
  return getStoredSignalingServer() ?? defaultSignalingServer();
}

/** The fallback URL to actually connect with: localStorage override, else the default. */
export function resolveFallbackSignalingServer() {
  return getStoredFallbackSignalingServer() ?? defaultFallbackSignalingServer();
}

/**
 * All signaling URLs to hand to WebrtcProvider, primary first. Empty/blank
 * entries and exact duplicates are dropped, so an unset or blanked-out
 * fallback simply means connecting to one server instead of two.
 */
export function resolveSignalingServers() {
  const urls = [resolveSignalingServer(), resolveFallbackSignalingServer()]
    .map(url => (url || '').trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

// ── STUN servers ─────────────────────────────────────────────────────────────
/**
 * Two URLs live in localStorage; home.html offers "Advanced" fields to
 * view/edit them, same pattern as the signaling servers above. Unlike
 * signaling, there is no host-based default to fall back to — leaving both
 * unset means simple-peer (and therefore y-webrtc) keeps using its own
 * built-in STUN servers untouched, which is what the "[Yjs Default]"
 * placeholder in the UI refers to.
 *
 * A value is only ever persisted when it parses as a stun:/stuns: URI. An
 * empty or invalid value leaves whatever is already stored untouched —
 * there's no "clear to default" gesture here, since there's no default at
 * this layer to clear back to.
 */

export const STUN_KEY          = 'tt_external_service_stun';
export const STUN_FALLBACK_KEY = 'tt_external_service_stun_fallback';

/** Loosely validates a stun:/stuns: URI — scheme, host, optional port. */
export function isValidStunUrl(value) {
  if (typeof value !== 'string') return false;
  return /^stuns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

/** The primary value currently in localStorage, or null if never set. */
export function getStoredStunServer() {
  return localStorage.getItem(STUN_KEY) || null;
}

/** The fallback value currently in localStorage, or null if never set. */
export function getStoredStunServerFallback() {
  return localStorage.getItem(STUN_FALLBACK_KEY) || null;
}

/**
 * Persist the primary STUN server URL. A no-op on an empty or invalid
 * value — any existing stored value is left untouched.
 */
export function setStoredStunServer(url) {
  if (isValidStunUrl(url)) localStorage.setItem(STUN_KEY, url.trim());
}

/**
 * Persist the fallback STUN server URL. A no-op on an empty or invalid
 * value, or one identical to the stored primary STUN server — any
 * existing stored value is left untouched. Two identical STUN servers add
 * nothing over one, so that last case is rejected rather than silently
 * duplicating the primary.
 */
export function setStoredStunServerFallback(url) {
  if (!isValidStunUrl(url)) return;
  const value = url.trim();
  if (value === getStoredStunServer()) return;
  localStorage.setItem(STUN_FALLBACK_KEY, value);
}

/**
 * RTCIceServer entries built from whatever valid overrides are stored.
 * Empty when nothing is stored — callers should skip passing `iceServers`
 * at all in that case, so simple-peer's own defaults apply.
 */
export function resolveIceServers() {
  return [getStoredStunServer(), getStoredStunServerFallback()]
    .filter(isValidStunUrl)
    .map(urls => ({ urls }));
}
