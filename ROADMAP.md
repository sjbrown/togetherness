# roadmap

Offline-first, local-first collaborative SVG canvas and tabletop tool.
Legend: `[x]` done · `[~]` partial / placeholder · `[ ]` not started

---

## Architecture & core

- [ ] Interaction feels "fun"
- [ ] Toy event system (`onLift`, `onPlace`, `onTrigger`, `dblclick` → roll)

---

## Layers

- [ ] Effects layer — animations, glows, particles (ephemeral, rAF-driven, not CRDT-backed)
- [ ] Per-layer rendering latency / priority differentiation

---

## Toys library

- [ ] Token
- [ ] Library navigation & UI
- [ ] Most-recently-used in the fast bar
- [ ] Custom toy creation — user-defined SVG + event handlers

---

## Presence & collaboration

- [ ] Player Marker and attention prompts on triple click
- [ ] Live cursor rendering and ghost trails
- [ ] Soft-locking - user testing
- [ ] Soft-locking - better ui hints
- [ ] Cross-table presence — lobby / friend list

---

## Permissions

- [ ] Owner can turn on/off other users' UI

---

## Table & session management

- [ ] Table selection landing page — open tables, friend presence, create new
- [ ] Side documents — HTML attachments per table

---

## Drawing layer (remaining)

- [ ] Bring to front / send to back
- [ ] More shape types — line, polygon, text


