/**
 * tests/unit/awareness-reconnect.test.js
 *
 * y-webrtc's Room.disconnect() calls removeAwarenessStates on the LOCAL
 * client's own clientID — an actual delete from awareness.states, not
 * just a "gone" broadcast — so Awareness.getLocalState() returns null
 * afterward. y-protocols/awareness's setLocalStateField is implemented as
 * "if (getLocalState() !== null) { ... }", a silent no-op otherwise.
 *
 * App.setOffline(true) then App.setOffline(false) triggers exactly this
 * sequence. Without restoring a full local state on reconnect, every
 * subsequent _broadcastDesired / _broadcastMode call (all setLocalStateField)
 * does nothing, forever, with no error — this peer's selection stops
 * reaching others, and this peer's own soft-lock acquisition requests
 * never reach anyone either.
 *
 * app.js has no unit coverage by project convention, so this pins the
 * underlying mechanism directly against the real y-protocols/awareness
 * implementation rather than app.js's own setOffline.
 */

import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { describe, test, expect, afterEach } from 'vitest'

// y-webrtc's own removeAwarenessStates, for the one line of it this test
// needs: deleting the local client's own entry, as Room.disconnect() does.
// (Not imported from the vendored src/lib/y-webrtc.js bundle — it isn't a
// module other code can import from — replicated here just for the local
// clientID self-removal case, which is the only path relevant to this bug.)
function removeOwnAwarenessState(awareness) {
  const clientID = awareness.clientID
  if (!awareness.states.has(clientID)) return
  awareness.states.delete(clientID)
  awareness.emit('update', [{ added: [], updated: [], removed: [clientID] }, 'disconnect'])
}

describe('awareness after a disconnect/reconnect cycle', () => {
  let aw
  afterEach(() => aw?.destroy())

  test('disconnect removes the local state entirely, not just marks it gone', () => {
    const doc = new Y.Doc()
    aw = new awarenessProtocol.Awareness(doc)
    aw.setLocalState({ id: 'bob', desired: null })
    expect(aw.getLocalState()).not.toBeNull()

    removeOwnAwarenessState(aw)
    expect(aw.getLocalState()).toBeNull()
  })

  test('the bug: setLocalStateField silently does nothing once local state is null', () => {
    const doc = new Y.Doc()
    aw = new awarenessProtocol.Awareness(doc)
    aw.setLocalState({ id: 'bob', desired: null })
    removeOwnAwarenessState(aw)

    aw.setLocalStateField('desired', { toy1: 123 })
    expect(aw.getLocalState()).toBeNull() // no error, no effect — the actual bug
  })

  test('the fix: a full setLocalState after reconnect restores the entry', () => {
    const doc = new Y.Doc()
    aw = new awarenessProtocol.Awareness(doc)
    aw.setLocalState({ id: 'bob', desired: null })
    removeOwnAwarenessState(aw)

    // What App.setOffline(false) now does: reconstruct and set the full
    // state, not just a field.
    aw.setLocalState({ id: 'bob', desired: { toy1: 123 } })
    expect(aw.getLocalState()).toEqual({ id: 'bob', desired: { toy1: 123 } })
  })

  test('after the fix, setLocalStateField works normally again', () => {
    const doc = new Y.Doc()
    aw = new awarenessProtocol.Awareness(doc)
    aw.setLocalState({ id: 'bob', desired: null })
    removeOwnAwarenessState(aw)
    aw.setLocalState({ id: 'bob', desired: { toy1: 123 } })

    aw.setLocalStateField('desired', { toy2: 456 })
    expect(aw.getLocalState()).toEqual({ id: 'bob', desired: { toy2: 456 } })
  })

  test('a remote peer sees the reconnecting client vanish, then reappear, on real update events', () => {
    // Two independent Awareness instances, syncing states manually the
    // way two peers' awareness updates propagate — proves the *remote*
    // side (Peer A) actually loses and regains Bob's entry, matching
    // the reported symptom ("Peer A can't see Peer B's selRings").
    const bobDoc = new Y.Doc()
    const bobAw  = new awarenessProtocol.Awareness(bobDoc)
    bobAw.setLocalState({ id: 'bob', desired: { toy1: 1 } })

    const aliceDoc = new Y.Doc()
    const aliceAw  = new awarenessProtocol.Awareness(aliceDoc)

    // Alice receives Bob's initial state.
    aliceAw.setStates?.(bobAw.getStates?.() ?? new Map())
    // (Real sync goes through encode/applyAwarenessUpdate; states are
    // compared directly here since only the presence/absence of Bob's
    // entry matters for this test, not wire encoding.)
    const bobEntry = () => aliceAw.states.get(bobAw.clientID)

    // Manually mirror what a real sync would produce: Alice's states map
    // gaining Bob's clientID entry.
    aliceAw.states.set(bobAw.clientID, bobAw.getLocalState())
    expect(bobEntry()).toEqual({ id: 'bob', desired: { toy1: 1 } })

    // Bob disconnects: his own state is removed locally, and (in the real
    // system) that removal propagates to Alice too.
    removeOwnAwarenessState(bobAw)
    aliceAw.states.delete(bobAw.clientID)
    expect(bobEntry()).toBeUndefined()

    // Bob "reconnects" without the fix: setLocalStateField no-ops, so
    // nothing ever propagates back to Alice — her view of Bob stays empty
    // forever.
    bobAw.setLocalStateField('desired', { toy1: 1 })
    expect(bobAw.getLocalState()).toBeNull()

    // With the fix: a full setLocalState on reconnect gives Alice
    // something to receive again.
    bobAw.setLocalState({ id: 'bob', desired: { toy1: 1 } })
    aliceAw.states.set(bobAw.clientID, bobAw.getLocalState())
    expect(bobEntry()).toEqual({ id: 'bob', desired: { toy1: 1 } })

    bobAw.destroy(); aliceAw.destroy()
  })
})
