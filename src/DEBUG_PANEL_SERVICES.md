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
  masked (`describeIceServers()`). Nothing at runtime: no candidate
  gathering, no ICE state, no candidate errors, no selected route.
- **Panel** — a Signalling card shows each server's state; STUN and TURN
  do not appear.

Per-peer ICE data is reachable without touching `lib/`: y-webrtc's
`room.webrtcConns` holds simple-peer instances, each with its
`RTCPeerConnection` at `peer._pc`. `_pc` is private to simple-peer; the
hook is pinned to the bundled version.

---

## Commit 3 — Signalling card in the Debug panel

**Problem.** The Transport card shows URLs and a single connected flag side
by side; there is no way to see which server is up or how often it has
flapped.

**Change.** Split Signalling out of Transport. Pure renderer
`signalingCardHTML(net)`: one row per server with URL, primary/fallback
tag, connected dot (join-ladder style), and connect/disconnect counts.
Card is `warn` only when every server is down.

**Done when.**
- `tests/unit/debug-panel.test.js` renders literal state for: both up; one
  down (no `warn`); both down (`warn`); an empty list.
- Transport card no longer duplicates the signalling rows.

---

## Commit 4 — `ice` trace channel

**Problem.** Nothing records whether STUN or TURN worked. A peer that never
connects, or connects only through a relay, or is refused by the relay for
bad credentials, looks the same in the trace: silence after the
`signal-received` rows.

**Change.** New channel `ice` in `trace.js` `CHANNELS`, on by default (a
handful of rows per peer). In `app.js`, on each peer reported `added` by
the provider's `peers` event, hook its `_pc`:
- `ice-state` — `iceconnectionstatechange` / `connectionstatechange`,
  `{ peer, state }`. `failed` → `error`; `disconnected` → `warn`.
- `ice-candidates` — on gathering complete, one row
  `{ peer, host, srflx, relay }`, counts only (candidate strings carry IP
  addresses). No `srflx` → `warn` "STUN produced no reflexive candidate";
  no `relay` → `warn` "TURN produced no relay candidate".
- `ice-error` — `icecandidateerror`, `{ peer, url, errorCode, errorText }`,
  `warn`. The only direct evidence of rejected TURN credentials (401) or an
  unreachable server (701).
- `ice-selected` — one `getStats()` read after connect: local/remote
  candidate types of the selected pair, and time-to-connect via
  `Trace.span`.

Listeners are removed when the peer is `removed`. No candidate string, SDP,
or `RTCPeerConnection` reference enters a detail.

**Done when.**
- `tests/unit/trace.test.js` covers the new channel's registration and
  default.
- e2e: two peers on localhost produce `ice-state` → `connected`,
  one `ice-candidates` row per peer, and one `ice-selected` row per peer
  with type `host`.
- e2e: an unreachable TURN URL produces an `ice-error` or a no-relay
  `warn`.
- A downloaded trace contains no IP addresses from candidates.

---

## Commit 5 — ICE servers and Peers cards

**Problem.** With the data from commit 4 recorded, the panel still has
nowhere to show which ICE servers are configured or how each peer is
routed. "Is anyone going through TURN?" requires reading the stream.

**Change.**
- `getDebugState().net` gains `ice: describeIceServers()` and
  `peersIce: [{ peer, state, route, connectMs, lastError }]`, maintained
  by the commit 4 hooks.
- `iceCardHTML(net)`: STUN row and TURN row, URLs, username (credential
  never), an amber `public test relay` tag on the Open Relay default, and
  a status line derived from `peersIce`
  ("STUN ok on 2/2 peers"; "TURN never produced a relay candidate" as a
  `dbg-alert`).
- `peerTableHTML(net)`: one row per WebRTC peer — id, ICE state, route tag
  (`host` / `srflx` / `relay`, colour-coded), connect ms, last error.
  Cross-referenced with presence as the join ladder does.
- CSS in `ui.css` for the route tags and table.

**Done when.**
- Unit tests render literal state for: default relay (amber tag), custom
  relay, no peers, mixed routes, a failed peer with an error.
- No rendered output contains the credential.
- Visual check in the running app with two peers.

---

## Commit 6 — Health badges on the State summary

**Problem.** The State section's `<summary>` flags only a head mismatch. A
service failure is invisible until the section is opened and read.

**Change.** Badges in the State summary meta: `sig 1/2` when a signalling
server is down, `relay` when any peer is relayed, `ice failed` when any
peer's state is `failed`. Rendered from the same state as the cards.

**Done when.**
- Unit tests cover each badge present and absent, and their combination
  with `head mismatch`.

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
- "Edit services…" link from the ICE servers card to home.html's Advanced
  panel, with a note that changes take effect on reload.
- `DEBUG_PANEL.md`: `ice` in the channel table, the new cards in §5, the
  credential and IP-address rules beside the MutationRecord rule in §3, and
  the `_pc` dependency on the bundled simple-peer.

**Done when.**
- Link opens the Advanced panel.
- `DEBUG_PANEL.md` reflects every channel and card that ships.
- Full `npx vitest run` and `bin/test_e2e.sandbox.sh` green.
