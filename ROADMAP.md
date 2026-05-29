# roadmap

Offline-first, local-first collaborative SVG canvas and tabletop tool.  
Legend: `[x]` done · `[~]` partial / placeholder · `[ ]` not started

---

## Architecture & core

- [x] Schema v4 — `Y.XmlFragment` of `Y.XmlElement` (CRDT tree = SVG tree)
- [x] Shape-type registry (`SHAPE_TYPES`) — rect & circle
- [x] Split render pipelines — doc-driven vs presence-driven
- [x] Generic SVG mirror (`yXmlToDom`) — recursive, namespace-aware, replaces per-type renderers
- [x] Modal UI — Draw mode vs Toys mode, layer pointer-event gating
- [x] Selection model carries `{kind, id}` — shape or toy, broadcast via awareness
- [x] `entityGradient` — deterministic player identity (`c1` + `grad`), replaces random colour pool
- [x] Dead code removed — `src/core/shapes.js` (schema v3)

---

## Layers

- [x] Background layer — static hex-tile image (`bg_slatehex.png`, 1384×998)
- [x] Drawing layer — rects & circles, full CRDT, selection, deletion
- [~] Toys layer — placed, colorized, draggable, selectable, synced
  - [x] SVG full-embed model (CRDT tree = toy sub-document)
  - [x] `feColorMatrix` recolorization with player `c1`
  - [x] Drag-to-move — local DOM preview, single CRDT commit on drop
  - [x] Player Marker toy
  - [~] D6 toy — placed & colorized; roll behavior not yet wired
  - [ ] Toy event system (`onLift`, `onPlace`, `onTrigger`, `dblclick` → roll)
  - [ ] Right-click context menu for toy events
  - [ ] Toy sandbox — user-authored JS, isolated execution
- [ ] Boundaries & positions layer — snap zones, area rules, boundary backgrounds
- [ ] Effects layer — animations, glows, particles (ephemeral, rAF-driven, not CRDT-backed)
- [ ] Per-layer rendering latency / priority differentiation

---

## Toys library

- [x] `TOY_TYPES` registry — seed of the toy library
- [x] SVG importer — id namespacing, reference rewriting, script & foreign-namespace stripping
- [~] Default toys
  - [x] Player Marker — placed & colorized
  - [~] D6 — placed & colorized; roll not yet wired
  - [ ] Other dice — d4, d8, d10, d12, d20, d00
  - [ ] Trays — containment model, event distribution to children
  - [ ] Token (solid color)
- [ ] Custom toy creation — user-defined SVG + event handlers
- [ ] Toy library UI — import from file, browse available toys

---

## Presence & collaboration

- [x] Awareness — cursor, selection, player identity broadcast
- [x] Selection overlay — gradient stroke per peer, name label, drag-tracking
- [x] Peer count display
- [ ] Live cursor rendering per peer
- [ ] Soft-locking — claim exclusive edit rights on an object
  - [ ] Lock claim via awareness (peers see lock indicator)
  - [ ] Locked objects visually distinct (hatching, icon, owner label)
  - [ ] UI to request unlock from the lock-holding peer
  - [ ] Lock holder can grant or deny the unlock request
  - [ ] Stale lock expiry on peer disconnect or idle timeout
- [ ] Cross-table presence — lobby / friend list

---

## User profiles

- [ ] Durable player identity — persistent `myId` across sessions (localStorage)
- [ ] Display name — set once, shown in overlays and toy-list ownership
- [ ] Manual colour / gradient override — choose hue or pick from palette instead of `entityGradient` default
- [ ] Profile persisted locally and broadcast via awareness on join
- [ ] Profile UI — accessible from topbar, editable in-session

---

## Persistence & sync

- [x] IndexedDB persistence — per-room, loads before WebRTC sync
- [x] WebRTC P2P sync via `y-webrtc`
- [x] Connection status indicator
- [ ] Save / load
  - [ ] Export table as SVG — flat rendering of all layers, for sharing / printing
  - [ ] Export table as Yjs binary snapshot (`.crdt`) — full fidelity, re-importable
  - [ ] Import / restore from `.crdt` snapshot
  - [ ] Export individual toys as SVG with current state baked in

---

## Table & session management

- [ ] Table selection landing page — open tables, friend presence, create new
- [~] Per-table tool configuration — tools added/removed per table
  - [x] Registry exists (`SHAPE_TYPES`, `TOY_TYPES`)
  - [ ] UI toggle for enabling/disabling tools per table
- [ ] Side documents — HTML attachments per table

---

## Drawing layer (remaining)

- [ ] Move / drag drawing shapes (parallels toy drag)
- [ ] Resize handles for selected shapes
- [ ] Bring to front / send to back
- [ ] More shape types — line, polygon, text

---

## Testing

- [x] `shapes.test.js` — unit tests: CRDT ops, convergence, `selectionGeometry`, z-order
- [x] `toys.test.js` — unit tests: importer, colour matrix, placement, movement, convergence (57 tests)
- [ ] Playwright e2e — smoke tests, cross-tab sync

---

## Design principles

- **Offline-first, local-first.** IndexedDB is the source of truth on load; WebRTC sync is additive.
- **Minimise dependencies.** No framework, no build step, no surveillance-capitalism services.
- **Open source philosophy.** SVG, HTML, hyperlinks, public domain. No corporate control.
- **CRDT tree = SVG tree.** The Yjs `Y.XmlFragment` IS the SVG document — attributes are SVG-native, tags are SVG tags. Rendering is a mirror, not a translation.
- **Ephemeral vs document state.** Anything per-frame (effects, cursors, particles) lives in awareness or local state, never in the CRDT doc.
- **Registries over branching.** New shape types and toy types are one registry entry each — no scattered `if/else`.
