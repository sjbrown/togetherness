# Awareness fields

Every field this client writes into its Yjs awareness state, who writes it,
and who reads peers' copies of it. Awareness is per-peer, ephemeral, and
never in the document: it says what each player is doing right now.

`tests/unit/awareness-fields.test.js` checks this table against the code:
every field written in `src/` is listed here, and every field listed here
is written somewhere.

| field | value | written by | read by (layer) |
|---|---|---|---|
| `user` | `{ id, name, color, gradient: { c1, c2, angle } }` | `index.html` at boot; `App.setOffline(false)` | `user.js` user gradients (`grad-{id}`); `selection_shared.js` and overlay.js peer styling; layer_attention.js; `App.getPeers` (Peers panel, history names) |
| `desired` | `{ [elId]: { ts, holding } }` — `holding: true` is a held element (`ts` = last claimed), `false` a bid to acquire one (`ts` = when the bid started) | `selection_local.js` | `soft_lock.js` (the request protocol, every client's tick); `selection_shared.js` → `#selection_shared` |
| `mode` | the sole held element's selection mode (`'sel-move'`, `'sel-resize'`, …), or `null` | `selection_local.js` | nobody yet: advisory |
| `candidates` | `elId[]` under a rubber-band sweep, or `null` | `App.broadcastCandidates` / `clearBoxCandidates` | nobody yet: kept apart from `desired` so a sweep never touches held claims |
| `cursor` | `{ x, y, tool }` while a placing tool is active, else `null` | `App.updateAddCursor` / `clearAddCursor` | overlay.js → `#awareness` (a peer's add-cursor and placement preview) |
| `drag` | `{ elId, bboxX, bboxY }` during a single-element drag, else `null` | `App.startDrag` / `move` / `commitMove` / `cancelMove` | overlay.js → `#awareness` (a peer's drag ghost) |
| `multidrag` | `{ elIds, offsets: [{ bboxX, bboxY }] }` during a group drag, else `null` | `App.startMultiDrag` / `moveMulti` / `commitMultiMove` / `cancelMultiMove` | overlay.js → `#awareness` (a peer's drag ghosts) |
| `bowstring` | `{ elId, pull }` while pulling an action square (`pull` in screen px), else `null` | layer_delight.js via `App.broadcastBowstring` | overlay.js → `#awareness` (a peer's charge) |
| `attention` | `{ trail, clicks, last, scale }` in attention mode, else `null` | layer_attention.js | layer_attention.js → `#attention-layer` |
| `attnOrigin` | `[x, y, t, s, end?]`, or `null`; outlives the mode | layer_attention.js | layer_attention.js → `#attention-layer` |
| `attnDismiss` | `[[userId, t], …]`: peers' origins this player dismissed | layer_attention.js | layer_attention.js (honours a dismissal of its own origin) |

Ending an activity writes `null` to its field rather than deleting it.

Going back online (`App.setOffline(false)`) re-establishes the whole local
state with one `setLocalState`, since y-webrtc deletes it on disconnect:
`user`, `cursor`, `SelectionLocal.awarenessFields()` and
`Attention.awarenessFields()`.
