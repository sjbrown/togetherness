# crdt-svg

Collaborative offline-first SVG editor. Multiple users can draw and edit shapes in a shared document that syncs in real time using [Yjs](https://yjs.dev/) CRDTs over WebRTC.

No accounts. No servers storing your data. No surveillance. The document lives in your browser and syncs peer-to-peer — the signaling server only brokers WebRTC handshakes and never sees document content.

## Quick start

```bash
# 1. Vendor dependencies (run once, commit the results)
bin/get_deps.sh

# 2. Start dev environment
bin/dev.sh
```

Opens:
- **App** → http://localhost:3000
- **Signaling server** → ws://localhost:4444

Open the app in two browser windows with the same URL hash (e.g. `http://localhost:3000/#my-room`) to see real-time sync.

## Testing

```bash
bin/test.sh              # unit tests + e2e tests
bin/test_unit.docker.sh  # unit tests only (Docker)
bin/test_e2e.docker.sh   # e2e tests only (Docker)
```

All tests run inside Docker containers — no local Node installation required.

There are two layers of tests:

- **Unit tests** — pure CRDT logic, no browser, no network. Sync is simulated with `Y.encodeStateAsUpdate` / `Y.applyUpdate`.
- **Integration tests** — real `WebsocketProvider` clients syncing through a live WebSocket server spun up in the same Node process. Exercises the actual WS transport, sync protocol, and eventual consistency.
- **E2E tests** — Playwright tests against a full running stack (app + signaling server).

## Project structure

```
crdt-svg/
├── .github/workflows/ci.yml   # GitHub Actions: unit tests on every push, e2e on PRs
├── bin/
│   ├── dev.sh                 # start dev environment
│   ├── test.sh                # run all tests
│   ├── test_unit.docker.sh    # run unit tests in Docker
│   ├── test_e2e.docker.sh     # run e2e tests in Docker
│   └── get_deps.sh            # vendor JS deps into src/lib/
├── docker/
│   ├── signaling.Dockerfile   # y-webrtc signaling server
│   ├── unit.Dockerfile        # vitest unit + integration tests
│   └── e2e.Dockerfile         # playwright e2e tests
├── src/
└── tests/
```

## Data model

- Fragment order = z-order (first child = bottom, last child = top)
- Each `Y.XmlElement` holds SVG-native attributes directly: `id`, `x`, `y`, `width`, `height`, `fill`, `stroke`, `stroke-width`, `opacity`
- A sidecar map `ydoc.getMap('shapeMeta')` keyed by shape `id` stores non-SVG metadata: `{ author, created }`
- Document metadata lives in `ydoc.getMap('meta')`: `docId`, `created`, `schemaVersion`

Using `Y.XmlFragment` means the CRDT structure maps directly onto SVG — the document tree *is* the shared data type, with no translation layer.

## Self-hosting

To run your own signaling server (required for sync between devices on different networks):

```bash
docker compose up signaling
```

Then update the signaling URL in `src/index.html`:

```js
const provider = new WebrtcProvider(roomId, ydoc, {
  signaling: ['ws://your-server:4444'],
});
```

The signaling server only brokers WebRTC handshakes — document content is never sent through it. Once peers connect, all sync is direct and encrypted via WebRTC data channels.

## Offline-first

Documents persist locally via `IndexeddbPersistence` — the app works without a network connection and syncs when peers reconnect. There is no canonical server copy of any document.

## Philosophy

- **Offline-first, local-first** — your data lives in your browser, not on a server
- **Minimal dependencies** — vendored deps are committed; the app runs without a build step
- **Open standards** — SVG, HTML, hyperlinks, public domain formats
- **No surveillance** — no analytics, no accounts, no corporate control
- **Peer-to-peer** — the signaling server is a dumb matchmaker; it never sees your content
