# Debug Panel: External Services

Commit plan for bringing signalling, STUN and TURN (`external_services.js`)
into the trace and the Debug tab. Companion to `DEBUG_PANEL.md`.

---

## Background

`external_services.js` resolves three kinds of service for the
`WebrtcProvider`: signalling URLs (primary + fallback), STUN URLs, and TURN
URLs with one credential pair. Coverage today:

- **Signalling** — resolved URLs and override flags at boot
  (`index.html`); per-server connect/disconnect rows naming the URL and
  announce/signal rows naming the server that carried them (`app.js`,
  state tracked by `ExternalServices.createSignalingTracker`).
- **STUN / TURN** — one boot row with the resolved servers, credentials
  masked (`describeIceServers()`), and per-peer ICE state, candidate
  counts, candidate errors and selected route on the `ice` channel
  (`traceIceProvider()`), shown in the Servers and Peers cards.
- **Panel** — a Servers card (signalling, STUN/TURN) and a Peers card
  (WebRTC peers, join sequence).

Per-peer ICE data is reachable without touching `lib/`: y-webrtc's
`room.webrtcConns` holds simple-peer instances, each with its
`RTCPeerConnection` at `peer._pc`. `_pc` is private to simple-peer; the
hook is pinned to the bundled version.
