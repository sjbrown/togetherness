# Bug: Yjs updates over ~256 KB break WebRTC sync

A self-contained task spec. Read `CLAUDE.md` first, especially the e2e
section. This task explicitly authorizes:
- changes to how `src/index.html` constructs the `WebrtcProvider`
- a new transport module under `src/`
- if needed, a reproducible patch step in `bin/get_deps.sh`
- the tests described below

## The bug

`src/lib/y-webrtc.js` is the esbuild bundle of y-webrtc 10.3.0 plus
simple-peer 9.11.1, produced by `bin/get_deps.sh`. It sends each Yjs message
as **one** `RTCDataChannel` message:
- `sendWebrtcConn` / `broadcastWebrtcConn` → `peer.send(...)`
- simple-peer passes that straight to `channel.send()` with no chunking

Browsers cap the size of one data-channel message. Measured in the sandbox's
Chromium:
- `pc.sctp.maxMessageSize` is **262144** (256 KiB).
- `send()` of a 300 KB message does **not** throw. Shortly after, the channel
  emits `error: Failure to send data` and **closes**.
- A 2 KB message sent right after the big one is lost too.

**What this probably means** (inferred, not reproduced end to end yet; the
first job is to confirm it):
- **A new peer can't join a table whose Yjs document is over ~256 KB.** Sync
  step 2 sends the whole missing state as one message.
- **Any single update over ~256 KB is never delivered**, and it takes the
  connection down. Examples:
  - a toys checkpoint on a table with many toys (≈ 12.6 KB average toy SVG,
    so ~20+ toys)
  - a large SVG import
- y-webrtc reconnects on close and resyncs. The resync contains the same
  oversized state, so the two peers can loop without ever converging.

The BroadcastChannel path (same browser, other tabs) doesn't use
`RTCDataChannel` and isn't affected.

## Step 1: reproduce in e2e, before any fix

Add to `tests/e2e/sync.spec.js`, using its existing two-context pattern and
`helpers.js`:

1. **Late joiner to a large table.**
   - Peer A creates a table and places enough toys that the toys checkpoint
     is well over 256 KB. Use the biggest placeable toys, e.g. `token_glass`
     (~70 KB), via `window.UI.pillTap(name)` plus clicks like the existing
     tests. Then make 10+ moves and call
     `page.evaluate(() => App.maybeCheckpoint('test'))` so a single large
     update exists.
   - Only then does peer B join.
   - Assert B's `#toys-layer` `[data-id]` set equals A's, within a generous
     timeout.
2. **Live large update.** Both peers are connected first. Then A produces
   the same over-256 KB checkpoint. Assert that a toy A places *afterwards*
   still reaches B. This catches the "channel closed, later messages lost"
   behaviour.

Confirm both fail on master for the reason above. Check the trace or
console for `Failure to send data` or a peer disconnect. Note the measured
size of the largest update in the PR description.

Run once:
```bash
bin/test_e2e.sandbox.sh tests/e2e/sync.spec.js
```

## Step 2: the fix (chunk at the transport)

Split every outgoing data-channel message larger than a safe chunk size, and
reassemble on receipt. Use **16 KiB** chunks, the size that's safe across
browsers. Framing, one header per message:

| byte 0 | rest |
|---|---|
| `0` | a whole message (payload follows) |
| `1` | a chunk: `msgId` (uint32), `index` (uint16), `count` (uint16), payload slice |

- Reassemble per channel, keyed by `msgId`. Deliver once all `count` parts
  are in. Drop partial messages when the channel closes.
- **Backpressure:** don't push all chunks at once. Chrome throws "send queue
  is full" past its buffer. Queue chunks and keep sending while
  `channel.bufferedAmount` is below a threshold (e.g. 1 MiB). Drain on
  `bufferedamountlow`. Sync step 2 of a large table can be several MB.
- Every peer runs the same build (alpha, no compatibility promise), so no
  version negotiation is needed. Say so in a comment.

**Where to hook it.** Prefer, in this order:

1. **Without patching the vendored bundle.** simple-peer accepts a `wrtc`
   option (`{ RTCPeerConnection, RTCSessionDescription, RTCIceCandidate }`),
   and y-webrtc spreads `peerOpts` into the simple-peer constructor.
   `index.html` already builds `providerOpts.peerOpts`. Pass a wrapped
   `RTCPeerConnection` whose `createDataChannel()` and `datachannel` events
   hand simple-peer a channel wrapper that chunks `send()` and reassembles
   `message` events. Keep it in its own module, e.g.
   `src/chunked_datachannel.js`, with a pure `split` / `Reassembler` core
   that unit tests can reach.
2. **If (1) proves unworkable** because simple-peer touches channel
   internals the wrapper can't fake: patch the bundle's
   `sendWebrtcConn`/`broadcastWebrtcConn` and the `peer.on("data")`
   handler. Do it as a **patch step in `bin/get_deps.sh`**, applied after
   esbuild, so that regenerating the bundle doesn't silently drop the fix.
   Don't hand-edit `src/lib/y-webrtc.js` alone.

Before writing anything, check whether a newer y-webrtc or simple-peer
release already chunks. If it does, say so and stop to ask the owner.
Upgrading is a different decision.

## Tests

- **Unit** (`tests/unit/chunked-datachannel.test.js`): split and reassemble
  round-trips for sizes 0, 1, 16 KiB−1, 16 KiB, 16 KiB+1, 300 KB and 5 MB.
  Interleaved messages reassemble independently. A close mid-message
  discards the partial. Messages at or below the chunk size go out as a
  single frame.
- **e2e:** the two Step 1 cases pass.
- Run the full unit suite once, and `sync.spec.js` once, at the end.

## Done when

- Both e2e cases fail on master and pass with the fix.
- Nothing in `src/lib/y-webrtc.js` differs from what `bin/get_deps.sh`
  produces.
- One or two commits: the e2e repro (marked `test.fail` if it lands
  separately), then the fix.
