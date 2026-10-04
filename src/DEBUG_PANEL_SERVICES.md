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

---

## Commit 5 — ICE servers and WebRTC peers in the panel

**Problem.** With the data from commit 4 recorded, the panel still has
nowhere to show which ICE servers are configured or how each peer is
routed. "Is anyone going through TURN?" requires reading the stream.

**Change.**
- `getDebugState().net` gains `ice: describeIceServers()` and
  `peersIce: getIcePeers()` — `[{ peer, state, route, connectMs,
  candidates, lastError }]`, kept current by the commit 4 hooks.
- `iceHTML(net)`, the STUN / TURN group of the Servers card: STUN row and TURN row, URLs, username (credential
  never), an amber `public test relay` tag on the Open Relay default, and
  a status line derived from `peersIce`
  ("STUN ok on 2/2 peers"; "TURN never produced a relay candidate" as a
  `dbg-alert`).
- `peerTableHTML(net)`, the WebRTC group of the Peers card: one row per WebRTC peer — id, ICE state, route tag
  (`host` / `srflx` / `prflx` / `relay`, colour-coded), connect ms, last
  error. Not cross-referenced with presence: a WebRTC peer id is a random
  per-connection id, and nothing maps it to the user ids presence uses.
- CSS in `ui.css` for the route tags and table.

**Done when.**
- Unit tests render literal state for: default relay (amber tag), custom
  relay, no peers, mixed routes, a failed peer with an error.
- No rendered output contains the credential.
- Visual check in the running app with two peers.

---

## Commit 6 — Health badges on the State summary

**Problem.** The State section's `<summary>` carries nothing (a head
mismatch is flagged on Operations, beside the Head card). A service
failure is invisible until the section is opened and read.

**Change.** Badges in the State summary meta: `sig 1/2` when a signalling
server is down, `relay` when any peer is relayed, `ice failed` when any
peer's state is `failed`. Rendered from the same state as the cards.

**Done when.**
- Unit tests cover each badge present and absent, and their combination.

---

## Commit 7 — Stream presets and level filter

**Problem.** Service warnings are low-rate and get pushed out of view by
`op` and `envelope` rows. Isolating them takes several chip clicks.

**Change.**
- A "Connectivity" preset chip that shows only `net` and `ice`.
- A `warn+` toggle that hides `info` rows. View-only: it filters
  rendering, not recording. Persisted with the other trace settings only if
  that stays within `trace.js`'s settings shape; otherwise ephemeral.

**Done when.**
- Unit tests for `channelChipsHTML` with the preset, and for
  `streamRowsHTML` filtering by level.
- Muting via the preset still records `warn`/`error` on muted channels, per
  the existing rule.

---

## Commit 8 — Join-intent outcome and snapshot service block

**Problem.** `join_intent.js` decides `unreachable` / `found` /
`not-found` without a trace row, so "the join dialog said unreachable"
can't be matched to anything. The downloaded trace carries service state
only indirectly.

**Change.**
- `Trace.net('join-intent', …, { outcome, ms })`; `unreachable` is `warn`.
- `downloadTrace()` adds `services: { signaling, ice }` (redacted) beside
  `state`.

**Done when.**
- `join_intent` unit tests assert one row per outcome with elapsed ms.
- A downloaded trace has a `services` block with no credential in it.

---

## Commit 9 — Edit link and design record

**Problem.** Service settings live on home.html's Advanced panel and apply
only on reload; nothing in the Debug tab says either. `DEBUG_PANEL.md`
doesn't know about the `ice` channel or the new cards.

**Change.**
- "Edit services…" link from the Servers card to home.html's Advanced
  panel, with a note that changes take effect on reload.
- `DEBUG_PANEL.md`: `ice` in the channel table, the new cards in §5, the
  credential and IP-address rules beside the MutationRecord rule in §3, and
  the `_pc` dependency on the bundled simple-peer.

**Done when.**
- Link opens the Advanced panel.
- `DEBUG_PANEL.md` reflects every channel and card that ships.
- Full `npx vitest run` and `bin/test_e2e.sandbox.sh` green.
