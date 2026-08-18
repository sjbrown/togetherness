# The Debug Panel

Design record for the Debug tab and the trace recorder behind it.

---

## 1. The problem

A table's visible state is toys and shapes on a canvas. Everything that
decides what that state *is* happens where nobody can see it:

- which operations applied, and in what order
- what the local IndexedDB replay actually restored, before any peer existed
- whether a WebRTC handshake landed, and against which signaling server
- what a gesture's envelope captured, and what it dropped on the way to the wire
- the wire packet itself

When two peers disagree about what is on the table, none of that is
recoverable after the fact. The Debug panel exists to make it recoverable.

This is also the mission stated plainly. A tool that asks people to trust it
while hiding how it works is the thing this project was built against. The
panel ships to every player, on every table, not behind `?debug=1`.

---

## 2. Two modules

```
  trace.js          leaf. no imports. a ring buffer and a channel registry.
       ▲
       │ everyone writes
       │
  envelope · op_dag · op_replay · op_checkpoint · op_wire_mutation
  tables · app · index.html
       │
       │ debug_panel reads
       ▼
  debug_panel.js    pure renderers + one mounted view
       ▲
       │ ui.js owns the tab; App bus supplies document state
```

`trace.js` importing nothing is what makes it safe to instrument `envelope.js`
and `op_dag.js` — the two modules nearly everything else already depends on.
Any import at all there risks a cycle.

`debug_panel.js` is separate from `ui.js` for two reasons: `ui.js` is already
1100 lines, and the Debug tab is the only panel with listeners and a
subscription of its own, so it needs a mount/unmount lifecycle the other tabs
don't have.

---

## 3. Recording is always on

A debug panel you have to enable *before* the bug happens is a debug panel
that is never on when it matters. Recording starts at boot and runs into a
capped ring (600 events by default), so opening the tab after something went
strange shows what led up to it.

What makes that affordable:

- **Muted channels cost one property read.** `willRecord(ch)` is checked
  before anything is built.
- **Expensive details are thunks.** `Trace.op('advance', msg, () => ({...}))`
  only calls the builder if the event will actually be recorded.
- **Nothing is copied.** Op details hold a reference to the operation already
  living in the `Y.Map`. Immutable plain data; the pointer is the whole cost.

### The one hard rule

**Never hand a `MutationRecord` to the trace.** They hold live references to
removed nodes, and a 600-deep ring of them pins whole detached subtrees alive.
`envelope.js` summarizes to counts by type at the call site. Any future
instrumentation near the envelope has the same obligation.

---

## 4. Channels

| id | what it carries | default |
|---|---|---|
| `boot` | identity, table id, IndexedDB open/replay, join sequence | on |
| `net` | signaling URL, provider status, WebRTC peers, presence join/leave | on |
| `op` | commit, append, arrival, classification, apply order | on |
| `envelope` | capture spans, nesting, suppression, empty gestures | on |
| `wire` | serialize / apply / invert | **off** |
| `app` | application narration (`App.addLog`) | on |

`wire` is off because `apply` runs once per operation: projecting a long table
would evict everything else from the ring within a second. It is opted into
from the panel. The wire packets themselves stay inspectable regardless — they
are carried on the `op` rows, which is where anyone looking for them will
actually look.

**Muting a channel mutes narration, never evidence.** A `warn` or `error` is
recorded whenever tracing is on at all, whatever the channel's setting. The
dropped-mutation warning in `serialize` is the case this rule exists for: it
lives on a muted channel and is one of the few real correctness signals in
the system.

---

## 5. What the panel shows

Four sections, in the order someone actually needs them.

**State** — what is true right now. The most useful thing here is the
comparison between this peer's stored head (`op_head.js`) and the marker the
toys layer is actually projected at (`data-tt-head`). When those disagree, the
DOM is showing something other than what the peer thinks it is, and the panel
says so in words rather than leaving it to be inferred from two ids. More than
one tip in the log gets the same treatment.

**Operations** — the log in `totalOrder`, newest first, each row expanding to
its wire packet with a copy button. Capped at `MAX_DEBUG_OPS` (250): a
topological sort over the whole log on every refresh is not something a
long-lived table should pay for.

**Stream** — the trace, filterable by channel chip, each event expanding to its
detail as JSON.

**Recorder** — pause, clear, and *Download trace*, which writes a
self-describing JSON file carrying both the ring and a state snapshot. That
file is the artifact to attach to a bug report; whoever opens it should not
need this source tree to read it.

---

## 6. Rendering notes

- Disclosure is `<details>`/`<summary>`. The browser implements this already
  and a debug panel is a poor place to reinvent it. `toggle` does not bubble,
  so open-state bookkeeping listens in the **capture** phase.
- Open sections and scroll position survive re-render. Losing your place every
  time a peer moves a token makes the panel useless during exactly the sync
  problems it is for.
- Trace notification is synchronous and can fire many times inside one
  gesture; the view coalesces to an animation frame.
- Everything is escaped. Gesture labels reach this panel carrying names other
  people typed.
- The view degrades rather than throws. A panel that fails while reporting a
  broken state hides the very thing it exists to show — so `getDebugState()`
  is called inside a guard and a failure renders as a message.

---

## 7. Related change

`App.addLog` wrote to `#eventLog`, an element `ui.js` stopped rendering when
the Peers panel was reworked. Every call site in `app.js` and `events.js` had
been writing to nothing. Those calls now land on the `app` trace channel.

---

## 8. Not done

- **Awareness traffic is not traced.** `updated` fires on every cursor move
  from every peer; only presence join/leave is recorded. A separate,
  rate-limited awareness inspector would be the honest way to cover it.
- **Drawing and boundaries layers are not covered.** They are still `Y.Xml`
  and have no op log to show. The State card is toys-only.
- **No timeline scrub.** The ordered log is here; stepping the DOM back
  through it is a much larger feature and would need its own design record.
- **No cross-peer correlation.** Two downloaded traces can be read side by
  side, but nothing lines them up.
