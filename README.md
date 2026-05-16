# crdt-svg

Collaborative offline-first SVG editor. Multiple users can draw and edit shapes in a shared document that syncs in real time using [Yjs](https://yjs.dev/) CRDTs over WebRTC.

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
bin/test.sh          # unit tests (default)
bin/test.sh unit     # unit tests explicitly
bin/test.sh e2e      # Playwright e2e tests
bin/test.sh all      # both
```

All tests run inside Docker containers — no local Node installation required.

## Project structure

```
crdt-svg/
├── .github/workflows/ci.yml   # GitHub Actions: unit tests on every push, e2e on PRs
├── bin/
│   ├── dev.sh                 # start dev environment
│   ├── test.sh                # run tests
│   └── get_deps.sh            # vendor JS deps into src/lib/
├── docker/
│   ├── app.Dockerfile         # nginx serving src/app/
│   ├── signaling.Dockerfile   # y-webrtc signaling server
│   ├── test.Dockerfile        # vitest unit tests
│   └── e2e.Dockerfile         # playwright e2e tests
├── src/
│   ├── app/index.html         # the app (imports from /lib/)
│   ├── lib/                   # vendored JS deps (yjs.js, y-webrtc.js, y-indexeddb.js)
│   └── core/shapes.js         # core CRDT operations (imported by app + tests)
├── tests/
│   ├── unit/shapes.test.js    # vitest unit tests — no browser needed
│   └── e2e/sync.spec.js       # playwright e2e tests
├── docker-compose.yml         # dev stack
├── docker-compose.test.yml    # test stack
├── vitest.config.js
├── playwright.config.js
└── package.json
```

## Data model

**Schema v3**: `ydoc.getArray('shapes')` — a `Y.Array` of `Y.Map`, one per shape.

- Array index = z-order (index 0 = bottom, last = top)
- Each `Y.Map` holds: `id`, `x`, `y`, `w`, `h`, `fill`, `stroke`, `strokeWidth`, `opacity`, `author`, `created`
- Migrations for v1 and v2 schemas run automatically on first load

## Self-hosting

To run your own signaling server (required for sync between devices on different networks):

```bash
docker compose up signaling
```

Then update the signaling URL in `src/app/index.html`:

```js
const provider = new WebrtcProvider(roomId, ydoc, {
  signaling: ['ws://your-server:4444'],
});
```

The signaling server only brokers WebRTC handshakes — document content is never sent through it.
