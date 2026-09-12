/**
 * external_services.js — signaling/STUN/TURN overrides for y-webrtc.
 * home.html's "Advanced" panel edits these; index.html reads them when
 * constructing its WebrtcProvider.
 */

// ── Signaling servers ───────────────────────────────────────────────────────
/**
 * Primary + fallback signaling URLs live in localStorage; unset fields
 * use host-based defaults not written until edited. y-webrtc connects to
 * both concurrently — "fallback" describes intent, not failover order.
 */

export const SIGNALING_KEY          = 'tt_external_service_signaling';
export const SIGNALING_FALLBACK_KEY = 'tt_external_service_signaling_fallback';

export function getStoredSignalingServer() {
  return localStorage.getItem(SIGNALING_KEY) || null;
}

export function getStoredFallbackSignalingServer() {
  return localStorage.getItem(SIGNALING_FALLBACK_KEY) || null;
}

export function defaultSignalingServer() {
  return location.hostname === 'localhost' ? 'ws://localhost:4444' : 'wss://signaling.1kfa.com';
}

export function defaultFallbackSignalingServer() {
  return location.hostname === 'localhost' ? '' : 'wss://signaling.ezide.com';
}

/**
 * A no-op (clearing any override) on empty or identical-to-default —
 * otherwise a future default change would be masked by a stored value
 * nobody meant to set.
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
 * Empty or identical-to-default clears the override. Identical to the
 * resolved primary is rejected instead, leaving any existing override
 * untouched — two identical signaling URLs help nobody.
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

export function resolveSignalingServer() {
  return getStoredSignalingServer() ?? defaultSignalingServer();
}

export function resolveFallbackSignalingServer() {
  return getStoredFallbackSignalingServer() ?? defaultFallbackSignalingServer();
}

/**
 * All signaling URLs for WebrtcProvider, primary first, blanks and
 * duplicates dropped.
 */
export function resolveSignalingServers() {
  const urls = [resolveSignalingServer(), resolveFallbackSignalingServer()]
    .map(url => (url || '').trim())
    .filter(Boolean);
  return [...new Set(urls)];
}

// ── STUN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback STUN URLs live in localStorage. Unlike signaling,
 * there's no built-in default — unset means simple-peer's own STUN
 * servers apply, shown as "[Yjs Default]" in the UI.
 */

export const STUN_KEY          = 'tt_external_service_stun';
export const STUN_FALLBACK_KEY = 'tt_external_service_stun_fallback';

export function isValidStunUrl(value) {
  if (typeof value !== 'string') return false;
  return /^stuns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getStoredStunServer() {
  return localStorage.getItem(STUN_KEY) || null;
}

export function getStoredStunServerFallback() {
  return localStorage.getItem(STUN_FALLBACK_KEY) || null;
}

export function setStoredStunServer(url) {
  if (isValidStunUrl(url)) localStorage.setItem(STUN_KEY, url.trim());
}

/**
 * A no-op on empty/invalid input, or one identical to the stored
 * primary — existing storage is left untouched either way.
 */
export function setStoredStunServerFallback(url) {
  if (!isValidStunUrl(url)) return;
  const value = url.trim();
  if (value === getStoredStunServer()) return;
  localStorage.setItem(STUN_FALLBACK_KEY, value);
}

// ── TURN servers ─────────────────────────────────────────────────────────────
/**
 * Primary + fallback TURN URLs, same shape as STUN. home.html's inputs
 * are disabled for now (TURN needs credentials this UI doesn't collect),
 * but storage/resolution are wired up ahead of that.
 */

export const TURN_KEY          = 'tt_external_service_turn';
export const TURN_FALLBACK_KEY = 'tt_external_service_turn_fallback';

export function isValidTurnUrl(value) {
  if (typeof value !== 'string') return false;
  return /^turns?:[^\s:]+(:\d+)?$/i.test(value.trim());
}

export function getStoredTurnServer() {
  return localStorage.getItem(TURN_KEY) || null;
}

export function getStoredTurnServerFallback() {
  return localStorage.getItem(TURN_FALLBACK_KEY) || null;
}

export function setStoredTurnServer(url) {
  if (isValidTurnUrl(url)) localStorage.setItem(TURN_KEY, url.trim());
}

/**
 * A no-op on empty/invalid input, or one identical to the stored
 * primary — existing storage is left untouched either way.
 */
export function setStoredTurnServerFallback(url) {
  if (!isValidTurnUrl(url)) return;
  const value = url.trim();
  if (value === getStoredTurnServer()) return;
  localStorage.setItem(TURN_FALLBACK_KEY, value);
}

/**
 * RTCIceServer entries from stored overrides, STUN then TURN. Empty
 * means skip `iceServers` entirely so simple-peer's defaults apply.
 */
export function resolveIceServers() {
  const stun = [getStoredStunServer(), getStoredStunServerFallback()].filter(isValidStunUrl);
  const turn = [getStoredTurnServer(), getStoredTurnServerFallback()].filter(isValidTurnUrl);
  return [...stun, ...turn].map(urls => ({ urls }));
}
