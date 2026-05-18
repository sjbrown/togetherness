/**
 * tests/unit/sync.integration.test.js
 *
 * Integration tests: two real WebsocketProvider clients syncing through a
 * live y-websocket server running in the same Node process.
 *
 * Unlike shapes.test.js (which uses Y.applyUpdate for instant offline sync),
 * these tests exercise the actual WS transport — connection, handshake,
 * sync protocol, and eventual consistency — the way real clients do.
 *
 * Pattern borrowed from ueberdosis/hocuspocus test suite:
 *   1. beforeAll:  spin up a real HTTP+WS server on a random port
 *   2. beforeEach: create two fresh Y.Docs + WebsocketProviders
 *   3. test body:  await sync, mutate doc A, await propagation, assert doc B
 *   4. afterEach:  destroy providers + docs
 *   5. afterAll:   close server
 *
 * Key helpers:
 *   waitForSync(provider)  — resolves when the provider fires its first 'sync' event
 *   waitForUpdate(yType)   — resolves on the next observed change to a Y shared type
 *   settled()              — yields to the event loop so queued microtasks can run
 *
 * WHY INLINE SERVER:
 *   @y/websocket-server bundles its own yjs@14 fork (@y/y), which is
 *   protocol-incompatible with our yjs@13 client. Writing a minimal server
 *   here with y-protocols (a shared transitive dep) avoids that entirely.
 *   Reference: https://github.com/yjs/yjs/issues/438
 */

import { createServer }    from 'http'
import { WebSocketServer } from 'ws'
import * as syncProtocol   from 'y-protocols/sync'
import * as awarenessProtocol from 'y-protocols/awareness'
import * as encoding       from 'lib0/encoding'
import * as decoding       from 'lib0/decoding'
import { WebsocketProvider } from 'y-websocket'
import WebSocket           from 'ws'
import * as Y              from 'yjs'
import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'

// ─── Minimal inline y-websocket server ───────────────────────────────────────
//
// Implements the y-websocket sync protocol using our own yjs + y-protocols.
// One WSSharedDoc per room name; broadcasts updates to all connected sockets.
//
// Message type constants (from y-websocket source):
const msgSync      = 0
const msgAwareness = 1

const rooms = new Map() // roomName → { ydoc, awareness, sockets: Set<ws> }

function getRoom(roomName) {
  if (rooms.has(roomName)) return rooms.get(roomName)
  const ydoc      = new Y.Doc({ gc: true })
  const awareness = new awarenessProtocol.Awareness(ydoc)
  const room      = { ydoc, awareness, sockets: new Set() }

  // When the server's ydoc changes, broadcast to all sockets in the room
  ydoc.on('update', (update, _, __, tr) => {
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, msgSync)
    syncProtocol.writeUpdate(encoder, update)
    const msg = encoding.toUint8Array(encoder)
    room.sockets.forEach(s => {
      if (s.readyState === WebSocket.OPEN) s.send(msg)
    })
  })

  awareness.on('update', ({ added, updated, removed }) => {
    const changedClients = added.concat(updated, removed)
    const encoder = encoding.createEncoder()
    encoding.writeVarUint(encoder, msgAwareness)
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
    )
    const msg = encoding.toUint8Array(encoder)
    room.sockets.forEach(s => {
      if (s.readyState === WebSocket.OPEN) s.send(msg)
    })
  })

  rooms.set(roomName, room)
  return room
}

function handleConnection(ws, roomName) {
  const room = getRoom(roomName)
  room.sockets.add(ws)

  // Step 1: send our current doc state to the new client
  const encoder = encoding.createEncoder()
  encoding.writeVarUint(encoder, msgSync)
  syncProtocol.writeSyncStep1(encoder, room.ydoc)
  ws.send(encoding.toUint8Array(encoder))

  // Send current awareness state
  const awarenessStates = room.awareness.getStates()
  if (awarenessStates.size > 0) {
    const aEncoder = encoding.createEncoder()
    encoding.writeVarUint(aEncoder, msgAwareness)
    encoding.writeVarUint8Array(
      aEncoder,
      awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(awarenessStates.keys())),
    )
    ws.send(encoding.toUint8Array(aEncoder))
  }

  ws.on('message', (data) => {
    const uint8  = new Uint8Array(data)
    const decoder = decoding.createDecoder(uint8)
    const msgType = decoding.readVarUint(decoder)

    if (msgType === msgSync) {
      const encoder2 = encoding.createEncoder()
      encoding.writeVarUint(encoder2, msgSync)
      const syncType = syncProtocol.readSyncMessage(decoder, encoder2, room.ydoc, null)
      // Step 1 reply: send step2 back to the sender
      if (syncType === syncProtocol.messageYjsSyncStep1) {
        const reply = encoding.toUint8Array(encoder2)
        if (reply.length > 1) ws.send(reply)
      }
    } else if (msgType === msgAwareness) {
      awarenessProtocol.applyAwarenessUpdate(
        room.awareness,
        decoding.readVarUint8Array(decoder),
        ws,
      )
    }
  })

  ws.on('close', () => {
    room.sockets.delete(ws)
    if (room.sockets.size === 0) {
      // Clean up idle rooms so tests don't bleed state into each other
      rooms.delete(roomName)
      room.ydoc.destroy()
    }
  })
}

// ─── Server lifecycle ─────────────────────────────────────────────────────────

let httpServer
let wss
let port

beforeAll(() => new Promise((resolve, reject) => {
  httpServer = createServer()
  wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws, req) => {
    // Room name = first path segment, e.g. /my-room → 'my-room'
    const roomName = (req.url || '/default').slice(1).split('?')[0]
    handleConnection(ws, roomName)
  })

  // Port 0 → OS picks a free port, avoids conflicts with other test files
  httpServer.listen(0, '127.0.0.1', () => {
    port = httpServer.address().port
    resolve()
  })
  httpServer.on('error', reject)
}))

afterAll(() => new Promise((resolve) => {
  wss.close(() => httpServer.close(resolve))
}))

// ─── Per-test client state ────────────────────────────────────────────────────

let docA, docB, providerA, providerB

beforeEach(() => {
  docA = new Y.Doc()
  docB = new Y.Doc()
})

afterEach(() => {
  providerA?.destroy()
  providerB?.destroy()
  docA.destroy()
  docB.destroy()
  providerA = null
  providerB = null
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** URL for a named room on the local test server */
const roomUrl = (room) => `ws://127.0.0.1:${port}/${room}`

/**
 * Create a WebsocketProvider for the given doc + room.
 * We pass ws as WebSocketPolyfill so this works in Node (no global WebSocket).
 */
function makeProvider(doc, room) {
  return new WebsocketProvider(roomUrl(room), room, doc, {
    WebSocketPolyfill: WebSocket,
    // Disable BroadcastChannel — irrelevant in Node, avoids noise
    disableBc: true,
  })
}

/**
 * Resolves when provider emits its first 'sync' event with isSynced=true.
 * Times out after 5 s with a descriptive error.
 */
function waitForSync(provider, label = '') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`waitForSync${label ? ' (' + label + ')' : ''} timed out after 5 s`)),
      5000,
    )
    const handler = (isSynced) => {
      if (isSynced) {
        clearTimeout(timer)
        provider.off('sync', handler)
        resolve()
      }
    }
    // If already synced, resolve immediately
    if (provider.synced) { clearTimeout(timer); return resolve() }
    provider.on('sync', handler)
  })
}

/**
 * Resolves on the next observed change to a Y shared type (Y.Array, Y.Map, Y.Text).
 * Times out after 3 s.
 */
function waitForUpdate(yType, label = '') {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`waitForUpdate${label ? ' (' + label + ')' : ''} timed out after 3 s`)),
      3000,
    )
    const handler = () => {
      clearTimeout(timer)
      yType.unobserve(handler)
      resolve()
    }
    yType.observe(handler)
  })
}

/**
 * Yield to the event loop — lets queued microtasks + WS message handlers run.
 */
const settled = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))

// ─── Unique room names per test ───────────────────────────────────────────────

let _roomSeq = 0
const nextRoom = () => `test-room-${++_roomSeq}`

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('two clients over a real y-websocket connection', () => {

  test('both providers connect and sync to an empty document', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Both docs are empty — no shapes yet
    expect(docA.getArray('shapes').length).toBe(0)
    expect(docB.getArray('shapes').length).toBe(0)
  })

  test('shape added on client A propagates to client B', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    const shapesA = docA.getArray('shapes')
    const shapesB = docB.getArray('shapes')

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Client A adds a shape; wait for B to observe the change
    const updateReceived = waitForUpdate(shapesB, 'shapesB')

    const yShape = new Y.Map()
    docA.transact(() => {
      yShape.set('id',   'rect-1')
      yShape.set('fill', '#ff0000')
      yShape.set('x',    10)
      yShape.set('y',    20)
      yShape.set('w',    100)
      yShape.set('h',    50)
      shapesA.push([yShape])
    })

    await updateReceived

    expect(shapesB.length).toBe(1)
    expect(shapesB.get(0).get('id')).toBe('rect-1')
    expect(shapesB.get(0).get('fill')).toBe('#ff0000')
  })

  test('shape added on client B propagates to client A', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    const shapesA = docA.getArray('shapes')
    const shapesB = docB.getArray('shapes')

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    const updateReceived = waitForUpdate(shapesA, 'shapesA')

    const yShape = new Y.Map()
    docB.transact(() => {
      yShape.set('id',   'from-b')
      yShape.set('fill', '#0000ff')
      shapesB.push([yShape])
    })

    await updateReceived

    expect(shapesA.length).toBe(1)
    expect(shapesA.get(0).get('id')).toBe('from-b')
  })

  test('concurrent adds from both clients — both shapes arrive on both sides', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    const shapesA = docA.getArray('shapes')
    const shapesB = docB.getArray('shapes')

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Fire both mutations "simultaneously" before either WS message is sent
    const shapeA = new Y.Map()
    docA.transact(() => {
      shapeA.set('id', 'concurrent-a')
      shapesA.push([shapeA])
    })

    const shapeB = new Y.Map()
    docB.transact(() => {
      shapeB.set('id', 'concurrent-b')
      shapesB.push([shapeB])
    })

    // Wait for convergence: both sides should end up with 2 shapes
    await settled(500)

    expect(shapesA.length).toBe(2)
    expect(shapesB.length).toBe(2)

    const idsA = shapesA.toArray().map(s => s.get('id')).sort()
    const idsB = shapesB.toArray().map(s => s.get('id')).sort()
    expect(idsA).toEqual(['concurrent-a', 'concurrent-b'])
    expect(idsB).toEqual(idsA)
  })

  test('attribute edit on client A propagates to client B', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    const shapesA = docA.getArray('shapes')
    const shapesB = docB.getArray('shapes')

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Add shape on A, wait for B to receive it
    const initialUpdate = waitForUpdate(shapesB, 'initial')
    const yShape = new Y.Map()
    docA.transact(() => {
      yShape.set('id',   'editable')
      yShape.set('fill', 'red')
      shapesA.push([yShape])
    })
    await initialUpdate

    // Now edit the shape on A — observe the nested Y.Map on B
    const remoteShape = shapesB.get(0)
    const editUpdate  = waitForUpdate(remoteShape, 'edit')

    docA.transact(() => yShape.set('fill', 'green'))

    await editUpdate

    expect(remoteShape.get('fill')).toBe('green')
  })

  test('delete on client A propagates to client B', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    const shapesA = docA.getArray('shapes')
    const shapesB = docB.getArray('shapes')

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Seed a shape on A
    const addUpdate = waitForUpdate(shapesB, 'add')
    const yShape = new Y.Map()
    docA.transact(() => {
      yShape.set('id', 'to-delete')
      shapesA.push([yShape])
    })
    await addUpdate

    expect(shapesB.length).toBe(1)

    // Delete on A, observe on B
    const deleteUpdate = waitForUpdate(shapesB, 'delete')
    docA.transact(() => shapesA.delete(0, 1))
    await deleteUpdate

    expect(shapesB.length).toBe(0)
  })

  test('late-joining client C receives full document state', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    const shapesA = docA.getArray('shapes')

    await waitForSync(providerA, 'A')

    // A builds up some state before C exists
    for (let i = 0; i < 3; i++) {
      const s = new Y.Map()
      docA.transact(() => {
        s.set('id', `shape-${i}`)
        s.set('x', i * 10)
        shapesA.push([s])
      })
    }

    await settled(100) // let server store the updates

    // C joins late
    const docC      = new Y.Doc()
    const shapesC   = docC.getArray('shapes')
    providerB       = makeProvider(docC, room) // reuse providerB slot for cleanup

    await waitForSync(providerB, 'C')

    expect(shapesC.length).toBe(3)
    const ids = shapesC.toArray().map(s => s.get('id'))
    expect(ids).toContain('shape-0')
    expect(ids).toContain('shape-1')
    expect(ids).toContain('shape-2')

    docC.destroy()
  })

  test('awareness: client A can see client B come online', async () => {
    const room = nextRoom()
    providerA = makeProvider(docA, room)
    providerB = makeProvider(docB, room)

    await Promise.all([
      waitForSync(providerA, 'A'),
      waitForSync(providerB, 'B'),
    ])

    // Set user identity on B
    providerB.awareness.setLocalStateField('user', { name: 'Bob', color: '#00ff00' })

    // Wait for A's awareness to see B's state
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('awareness timed out')), 3000)
      const check = () => {
        const states = Array.from(providerA.awareness.getStates().values())
        const bob = states.find(s => s.user?.name === 'Bob')
        if (bob) { clearTimeout(timer); resolve() }
      }
      providerA.awareness.on('change', check)
      check() // in case it already arrived
    })

    const states = Array.from(providerA.awareness.getStates().values())
    const bob = states.find(s => s.user?.name === 'Bob')
    expect(bob).toBeDefined()
    expect(bob.user.color).toBe('#00ff00')
  })

})
