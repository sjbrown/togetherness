/**
 * external_services.js — signaling/STUN/TURN overrides for y-webrtc.
 * home.html's "Advanced" panel edits these; index.html reads them when
 * constructing its WebrtcProvider. Callers do `import * as
 * ExternalServices from './external_services.js'` and call e.g.
 * ExternalServices.getSTUN() / .setSignalling(url).
 */

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
