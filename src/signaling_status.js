/**
 * signaling_status.js — per-server connection state for the signalling
 * conns a WebrtcProvider opens, which y-webrtc reports only as
 * connect/disconnect events on each conn.
 *
 * app.js feeds each event to `update`; the return value says whether the
 * set as a whole went from reachable to unreachable, which is what decides
 * severity and whether in-flight gestures are abandoned. One server
 * dropping while another stays up is not that.
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
    const wasAny = anyConnected();
    entry.connected  = connected;
    entry.lastChange = now();
    if (connected) entry.connects++;
    else entry.disconnects++;
    const anyNow = anyConnected();
    return {
      changed:      true,
      entry:        { ...entry },
      anyConnected: anyNow,
      lostAll:      wasAny && !anyNow,
    };
  }

  return {
    update,
    anyConnected,
    snapshot: () => entries.map(e => ({ ...e })),
  };
}
