# Revision plan: toys layer → operation log

Against `master` @ `d0465d9`. Read `CONCURRENCY_AND_BRANCHING.md` first;
this is the execution sequence for it.

Working branch: `oplog`.

Three phases. Phase A is destruction and can land immediately. Phase B is
pure, testable, and lands without changing any behaviour — the new
machinery sits beside the old until Phase C swaps the pipeline in one
commit. Phase C is where the app is briefly at risk, so it is ordered to
keep that window as short as possible.

Tests green at every commit. Full suite once per turn, before presenting.

---

## Phase A — teardown

### A1. Delete conflict/escalation/snapshot tests

Delete: `conflict.test.js`, `escalation.test.js`, `snapshot.test.js`,
`concurrent-derived-write.test.js`, `drop-touched-set.test.js`.

That is ~1,660 lines. `concurrent-derived-write.test.js` earns a note in
the commit message rather than preservation: it was a genuinely good test
that reproduced item 11 against two real synced `Y.Doc` replicas, and the
scenario it encodes reappears in Phase C as a replay-level test. It is the
scenario that survives, not the test.

Also trim, don't delete:
* `envelope.test.js` — drop the touched-set/snapshot/authorId assertions,
  keep the mutation-capture and translation cases. This file is 813 lines
  and most of it is still about the right things.
* `toys.test.js` — drop the `dedupToys` block.
* `sync.integration.test.js` — drop the revert/escalation paths.

### A2. Delete the machinery

Delete `src/conflict.js`, `src/escalation.js`, `src/snapshot.js`.

Unwire from:
* `app.js` — `_yReactionLog`, `onReactionLogChanged` (the whole ~80-line
  function), `showBranchAcknowledgement`'s revert path, the
  `isRevertsEnabled`/`setRevertsEnabled` toggle and its UI, the
  `_dedupingToys` block in `onToysChanged`.
* `envelope.js` — `touchedSetFromRecords`, `recordReactionBundle`,
  `captureRevertSnapshot`, `recordRevertSnapshot`, the `snapshots` array
  threaded through `applyChildListRecord`, and the `authorId` plumbing
  that existed only to attribute bundles.
* `toys.js` — `dedupToys` and its helpers.
* `tables.js` — nothing. `forkLiveDoc`, `generateForkTableId`,
  `resetJoinSequenceToSelf`, `compareAuthority`, `isAuthoritative` and
  `joinSequence` all survive unchanged. `needsEscalation` was the only
  escalation-specific predicate and it lived in the deleted file.
* `ui.js` — nothing. `showBranchDialog` survives; Phase C rewires its
  trigger.

The `authorId` threading is worth a moment: it is currently passed through
a dozen call sites purely to stamp reaction bundles. It does *not* all
disappear — operations need `authorId` too — so rather than strip it in A2
and re-add it in C1, leave the parameter in place and let it go unused for
one phase.

### A3. Fold `DERIVED_ORIGIN`; simplify origins

Two transaction classes for the toys layer bought a distinction the
cascade-inside-the-envelope design makes moot: a derived write is not a
separate class of thing, it is part of the operation that caused it.

* Delete `DERIVED_ORIGIN`. Fold its call sites into `ENVELOPE_ORIGIN`.
* Keep `LIFECYCLE_ORIGIN` for now — it is doing one real job (keeping
  `initialize()` off the undo stack) and it is cheaper to retire it in C7
  when undo changes than to redesign that here.
* Simplify `onToysChanged`'s origin gate accordingly.

`origins.js` shrinks to two constants and will disappear entirely in Phase
C, when the toys layer stops writing Yjs content at all.

### A4. Docs

* Delete `src/concurrency_branching.md`.
* Add `src/CONCURRENCY_AND_BRANCHING.md`.
* Rewrite `src/TODO.md`: item 11's problem statement stays (it is a good
  statement of a real bug), everything under "Implementation order" and
  "Wiring, done" goes, replaced by a pointer to the new doc and to this
  plan. Item 5's undo notes get rewritten against §8. Items 7, 8, 9, 10
  are untouched — they are orthogonal and still correct.

---

## Phase B — new machinery, dormant

Every commit here is pure, unit-testable, and imported by nothing yet.

### B1. `src/node_ids.js` — identity

* `ensureIds(rootEl)` — assign `data-id` to every element in a subtree
  that lacks one; never rewrite an existing one. Idempotent.
* `nodeRef(node)` → `{id}` for elements, `{parentId, index}` for text.
* `resolveRef(ref, rootEl)` → node or null.

Tests: idempotence, text addressing, resolution failure on a missing
ancestor, and the round trip `resolveRef(nodeRef(n)) === n` over a
representative toy subtree.

Note the existing `#77` "Ensure ids exist" work and `svgTextToYXml`'s
`prefix` mechanism — a toy's internal ids are already prefixed per
instance, so a good deal of this exists in effect and this commit is partly
consolidation.

### B2. `src/mutation_wire.js` — serialization

* `serialize(records)` → `WireMutation[]` (§4). Faithful 1:1. No move
  inference, no coalescing.
* `apply(wire, rootEl)` → applies to a DOM, returns nothing, throws on an
  unresolvable ref.
* `invert(wire)` → `WireMutation[]`.

This is the load-bearing commit of the whole project and deserves
disproportionate test weight. The property test that matters:

> take a DOM, snapshot its markup, run an arbitrary gesture under a real
> `MutationObserver`, serialize the batch, then apply that batch to a fresh
> clone of the *pre*-state — the two DOMs must be identical markup.

Plus the same for `invert`: apply then invert gets you back to the
pre-state. Run it over real gestures from the existing suite —
`reparent-toy`, `resize`, `dice-d6`, `tray` all have gesture fixtures we
can reuse rather than invent.

**Capture-before-removal is the subtle bit.** `removed` needs the full
subtree, and by the time a `MutationRecord` reaches us the node is
detached but intact — so it is readable, unlike the old
`captureRevertSnapshot` problem where Yjs's `gc:true` had already stripped
the content synchronously. This is strictly easier than what we were doing
before, which is a good sign.

### B3. `src/oplog.js` — the DAG

No DOM. Pure graph and storage.

* `getOps(ydoc)` → `Y.Map<opId, Operation>`.
* `appendOp(ydoc, op)`; `getOp`, `allOps`.
* `heads(ops)` — tips, computed.
* `ancestors(ops, opId)`, `isAncestor`, `lca(ops, a, b)`.
* `pathFrom(ops, fromOpId, toOpId)` — the ordered operation list to replay.
* `totalOrder(ops, ids, joinSequence)` — deterministic display order.
* `labelBranches(ops, tipA, tipB, joinSequence)` → `{leader, splitter}`.
* `branchAuthors(ops, tipId, lcaId)` → the *set* of author ids with a
  contribution on the branch. Unordered, deliberately (§6.5): ordering is
  the caller's `joinSequence` filter, not a DAG computation.
* `forkJoinSequence(joinSequence, authorSet)` → ordered ids: the parent
  sequence filtered to the set, then any set members absent from the
  parent sequence appended in op-id order. This is what C6 feeds to
  `resetJoinSequence`.

Tests: the discussion's own worked example (`A0 → A1,A2 / B1,B2 → C1` with
`C1.parents = [A2, B2]`), leader/splitter labelling against a
`joinSequence` fixture, the tie cases, and three-way tips returning
something explicit rather than silently picking two.

For the fork sequence specifically: the LCA's author correctly excluded; a
leader-only author correctly absent; a single-op branch yielding a
single-element sequence identical to today's behaviour; an author with ops
on *both* branches appearing in the splitter's sequence; the founder-junior
case (Clyde diverges first, Bob joins later, inherited order still puts Bob
first — assert this deliberately, it is the accepted cost and a future
reader will otherwise mistake it for a bug); and an author missing from the
parent sequence landing last rather than throwing.

Note what is *not* here: no causal analysis of contribution order, no
op-id tiebreak on the main path. If a future commit adds either, it is
reintroducing the design §6.5 rejected.

Reuse `tables.js`'s `compareAuthority` rather than reimplementing ordering.

### B4. `src/checkpoint.js` — subtree ops

* `checkpointOp(layerEl, {authorId})` → an Operation whose mutations
  reconstruct `layerEl`'s current contents into an empty layer.
* `projectFrom(layerEl, ops, headId)` — clear the layer, apply the nearest
  ancestor checkpoint, then apply `pathFrom` in order.

Tests: round trip a populated layer through checkpoint-and-project;
project twice and assert idempotence (§9.12); project a branch and its
sibling from a shared LCA checkpoint and assert they differ in exactly the
expected way.

---

## Phase C — the swap

### C1. Envelope emits operations

`envelope.js` loses everything Yjs-tree-shaped: `applyAttributeRecord`,
`applyCharacterDataRecord`, `applyChildListRecord`, `yInsertIndex`,
`registerTree`, `yAttrKey`. `commitEnvelope` becomes:

```
commitGesture(ydoc, records, { gesture, authorId })
  → op = { id, parents: [localHead], authorId, gesture,
           mutations: serialize(records), ts }
  → appendOp(ydoc, op); setLocalHead(op.id)
```

Also in this commit: delete the async variants (`runInEnvelope`,
`runToyHandler`) per §3.1 and the two TODOs already sitting in that file
asking for it. `runInEnvelopeSync`/`runGestureSync` are the whole surface.

The head lives in `src/head.js` — localStorage, keyed by table id (§3.3).

### C2. Replay

`src/replay.js`: apply an incoming operation to the live DOM with capture
suppressed (§4.2), advance the head. Classify arrivals as
subsequent/concurrent/conflicting; for now, concurrent-and-nonconflicting
applies and takes both tips as `parents` on the next local op.

Conflict detection: two concurrent operations whose mutation sets touch
overlapping refs in incompatible ways. Start narrow and explicit — same
`data-id` with a `child` mutation on both sides, or the same
`{parentId,index}` text ref on both sides — rather than reaching for a
general predicate we cannot defend. §10 already admits we will get the
granularity wrong once; better to get it wrong in a form we can read.

### C3. Migrate direct-Yjs writers

Everything that writes the toys tree without going through the DOM must
become a DOM mutation inside an envelope:

* `applyMoveCommit` → `applyMoveDom` under an envelope. The DOM sibling
  already exists.
* `applyResizeCommit` → same shape; needs a `wh_follow_resize` DOM walk to
  replace the `yClassSelector` one.
* `addToySync` → build the subtree in the DOM, `ensureIds`, insert. The
  `svgTextToYXml` path becomes `svgTextToDom`, which is simpler.
* `applyColor`/`colorize` → DOM `setAttribute` on the `feColorMatrix`
  nodes.
* `edit`, `deleteToy`, `reparentToy` — already DOM-based (`editDom`,
  `deleteToyDom`, `reparentToyDom`) with a `commitEnvelope` after. These
  only need the new `commitGesture`.

`getTtState`, `findToy`, `listToys`, `toysData` and the rest of the
Yjs-reading surface become DOM queries. Most get shorter.

### C4. Rendering becomes incremental

`render()` stops doing `layerEl.innerHTML = ''`. The DOM is durable (§7).
Full rebuild happens only on load and reprojection.

This is where a pile of accumulated workarounds get deleted, and each
deletion should be called out in the commit message so we notice we got
paid: no more re-querying DOM refs mid-drag, no more rewiring click
handlers on every render, no more `commitEnvelope`-deliberately-doesn't-
render dance, no more `jsdom`/`nwsapi` `:scope`-selector staleness
workarounds in the paths that only existed because of rebuild timing.

Script activation moves to a DOM `MutationObserver` on insertion, or stays
an explicit call at placement and projection — the latter is less clever
and probably right.

### C5. Load, import, export

* Load: `projectFrom(layerEl, ops, head)`.
* Import: new table, genesis checkpoint from the file's toys layer. Needs
  the "import gesture" from home.html rather than a live-table action.
* Export: `buildExportSvg` reads the live DOM for toys instead of
  `listToys(yToys)`. Drawing/boundaries paths unchanged. The hoisted
  `scripts` fragment pass is unchanged.
* `populateFromSvgDoc` splits: toys → checkpoint op; drawing/boundaries →
  `Y.Xml` exactly as today.

### C6. Branch dialog rewiring

On a conflicting arrival: label leader/splitter (`oplog.labelBranches`),
and if this peer authored on the splitter, `UI.showBranchDialog`.

* Join → adopt leader head, `projectFrom`.
* Keep working → fork (below), `touchTableRecord`, reload on the new hash.

Bystanders adopt the leader silently with an activity-log line.

`showBranchDialog` survives untouched and its `ui.test.js` block should
pass unmodified. `forkLiveDoc` does **not** survive untouched — §6.5
changes its contract:

* `resetJoinSequenceToSelf(ydoc, soleId)` → `resetJoinSequence(ydoc,
  orderedIds)`. `forkTable` (home.html's "Duplicate") passes
  `[forkingUserId]` and behaves exactly as today.
* `forkLiveDoc(liveDoc, forkingUserId)` → `forkLiveDoc(liveDoc,
  orderedIds)`. The caller computes the sequence; `tables.js` stays
  ignorant of the DAG.
* **The reset moves to before the hash.** The existing comment explaining
  why it must come *after* documents a wart rather than a requirement: it
  kept the id peer-independent while leaving the content peer-dependent,
  so two peers' fork documents differed at the same id and merged into an
  arbitrary seniority order. With the sequence computed from shared branch
  data the content is peer-independent too, so hashing after the reset is
  both correct and more honest — the id then describes what it names.
* The synthesized checkpoint op must be authored to `joinSequence[0]` and
  given a content-derived op id, not a random one. Otherwise it
  reintroduces exactly the peer-dependence this commit removes.

`tables-fork.test.js` needs real changes, not just trimming — it asserts
the single-user reset directly. Add the case that matters: **two docs,
same splitter branch, independent forks, assert byte-identical
`Y.encodeStateAsUpdate` output and therefore identical table ids.** That
is the property the whole content-hash naming scheme exists for, and it is
currently not true.

### C7. Undo as inverse operations

* Toys: `undo()` → find my most recent operation reachable from head,
  `invert` its mutations, append as a new operation with a
  `gesture: 'undo'` name.
* Drawing/boundaries: `UndoRedo` keeps its `Y.UndoManager` over those two
  fragments only.
* Retire `LIFECYCLE_ORIGIN` and `origins.js` here — with undo no longer
  driven by transaction origins for toys, the constant has no remaining
  consumer.

`undo-redo.test.js` needs real rewriting rather than trimming; it is
currently entirely about `UndoManager` semantics.

### C8. Remove the old toys Yjs surface

`yNodeFor`, `registerYNode`, `clearYNodeMap`, `mirror`, `_toSVGEl`,
`domToY`'s toys usage (it stays for drawing), the `toys` `Y.XmlFragment`
itself.

Migration for existing tables: a boot-time check for a non-empty
`toys` fragment writes it as a genesis checkpoint and clears it. Worth
doing properly — there are real tables in IndexedDB, including the live
demo's.

---

## Sequencing risk

The window where the app is broken is C1→C3. Options, in order of
preference:

1. **Land C1–C3 as one commit.** Larger than our usual discipline, but
   "tests green throughout" is better served by one honest large commit
   than three that each leave the app non-functional.
2. Feature-flag the toys layer between the two pipelines for the duration.
   Costs real complexity for a window measured in one work session.

I would take (1) and note it in the commit message. Everything before and
after is genuinely independently landable.

---

## Deferred, deliberately

* Distilling `MutationRecord` into semantic ops (§4).
* Checkpoint-write policy and log pruning (§10).
* Cherry-picking splitter operations onto the leader (§10).
* N-way partition (§10).
* Undoing peers' operations — now tractable, still gated on the audit
  trail (`TODO.md` item 7).
* `fake-indexeddb` as a test dependency. Still deferred, and Phase B's
  purity means less of the new code needs it than the old code did.
