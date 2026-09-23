# Docs: record the refined conflict rules in CONCURRENCY_AND_BRANCHING.md

A self-contained task spec. It's a **documentation-only** change to
`src/CONCURRENCY_AND_BRANCHING.md`. Don't touch any `.js` file or test.

Read `CLAUDE.md` and the whole of `src/CONCURRENCY_AND_BRANCHING.md` first.

## Context

The owner has decided how the op log handles concurrent branches. This task
records those decisions in the design record. **The doc will lead the code.**
Some of what you write isn't implemented yet, and that's intended. Write it
the way the rest of the doc is written: normative, present tense ("a peer
does X"). Don't write "currently", "pending", "will be", or plan and
section-number references to other work (see `CLAUDE.md`, "Comments").

Keep the doc's voice: short paragraphs, bold lead-ins, concrete examples
(dice, trays, tokens). Keep the owner's *Shandy:* notes where they still
apply, and don't invent new ones. Don't renumber existing sections. Add
subsections where noted.

### The decisions

1. **Concurrent means "commutes".** A concurrent (non-conflicting) arrival
   is applied on top of the local DOM in arrival order, so each peer
   applies the two branches in the opposite order. Replay applies them in
   `totalOrder`. All of these must give the same DOM. Anything that doesn't
   commute is either a conflict or merged by a deterministic rebuild.
2. **Structural contention is per child, not per parent.** Two branches
   contend structurally only when both insert, remove or move **the same
   node**. Adding different toys to the same layer or container, or moving
   different toys (every move promotes z-order through the layer root), is
   not a conflict.
3. **Same attribute / same text on the same node is a conflict.** Neither
   side's value wins automatically. Rationale, from the owner:
   - **Soft-lock** is the workhorse for connected peers. It makes this
     collision rare.
   - **Intentional offline users** should expect their edits to conflict.
   - **Partitioned peers** get the branch dialog. That's accepted.
   - This also keeps derived values safe (§4.3). Two merged tray totals
     would be wrong whichever one won.
4. **Delete vs. edit is a conflict.** One side's *net* removal of a node
   (removed and not re-added on that branch, so reparents and undone
   deletes don't count) conflicts with the other side addressing that node
   or anything inside it. This is already implemented; the doc should say so
   normatively.
5. **Double delete merges.** Two branches that both only remove the same node
   don't conflict. Applying a removal whose node is already gone does
   nothing.
6. **Sibling order is decided by a canonical rebuild.** When concurrent
   branches insert, remove or reorder children of the **same parent**, the
   receiving peer doesn't apply the arrival on top. It rebuilds instead:
   nearest checkpoint, then the union of all tips' ancestry in
   `totalOrder`. Every peer converges on the same sibling order, and the
   live DOM equals replay. A consequence of the tie-break: concurrent
   inserts or promotions from the more junior author (in `joinSequence`) end
   up on top.
7. **A checkpoint is a projection base, never a delta, and never part of
   classification.** Relative to its parents it changes nothing and records
   no one's intent.
8. **A rebuild may write a merge checkpoint.** After a canonical rebuild, if
   `shouldCheckpoint` allows it (more than `CHECKPOINT_MIN_OPS` since the
   last one), the peer writes a checkpoint whose `parents` are the sorted
   tips it rebuilt. That checkpoint is also the merge commit: it joins the
   branches in the graph. It's deterministic, so every peer that rebuilt
   the same tips writes a byte-identical op and the duplicates collapse:
   - `authorId` null
   - `ts` = the latest parent's `ts`
   - id = a hash of the parents plus the content, the same technique as a
     fork's genesis
9. **Handlers never keep node references between gestures.** A rebuild
   replaces DOM nodes. Rebuilds happen when a remote update arrives, never
   during a synchronous gesture, so code inside a gesture is unaffected.

## Edits, section by section

- **§2.1 (A gesture is a transaction):** add a bullet saying a handler must
  not keep node references past the end of its gesture. Also that
  node-holding state in a namespace or global has escaped the model, the
  same way writing outside `#toys-layer` has. Give the reason: the DOM can
  be rebuilt between gestures (§5.x below).

- **§5.1 (Three relationships):**
  - Redefine **Concurrent** as "the two branches commute", and say why
    (arrival order vs. replay order).
  - Rewrite **Conflicting** as a precise list:
    - same node structurally (except both-remove)
    - same attribute or same text position
    - delete vs. edit (net removal against an addressed node)
    - keep the existing tray-total and double-reparent examples
  - Add the non-conflicting examples: two placements, two moves of
    different toys, double delete.
  - Add the B1 rationale from decision 3.
  - State that checkpoints are ignored when classifying (decision 7).

- **New §5.6 "Order-sensitive merges":** decision 6 (canonical rebuild),
  decision 8 (merge checkpoint written on rebuild, gated by
  `shouldCheckpoint`, deterministic, doubles as the merge commit), and the
  junior-on-top consequence. Mention that a rebuild is followed by
  re-activating toy scripts, the same as adopting a branch.

- **§5.3 (Causal order is not display order):** its closing line ("Never
  build a merge on it") contradicts decision 6. Rewrite it so total order
  stays a presentation choice **except** for sibling order under §5.6, and
  still never decides a value or authority.

- **§6.1 (A checkpoint is an operation):** add decision 7. A checkpoint is
  applied only as the base of a projection. Anywhere else it's a no-op,
  and classification ignores it. Add the merge checkpoint as a fifth use of
  the primitive, alongside genesis, import, checkpoint and fork.

- **§8 (Invariants):**
  - Replace **11** with:
    > 11. Total order over concurrent operations decides sibling order when
    > concurrent branches insert, remove, or reorder children of the same
    > parent, and nothing else. It never decides an attribute or text value
    > and never decides authority. Otherwise it is for display.
  - Append **13.** A checkpoint is a projection base, never a delta. It
    carries no intent and never participates in conflict classification.
  - Append **14.** Handlers never keep node references between gestures.
  - Don't renumber 1–12.

- **§9 (Dragons):**
  - **Multi-node conflict granularity:** replace the open question with the
    resolved rule (per-child structural, per-attribute valued, same-attribute
    is a conflict), pointing to §5.1. Keep the owner's *Shandy:* note only if
    it still reads true. If kept, it goes after the resolution.
  - **Multi-peer partition:** add that the canonical rebuild covers the
    union of all tips, so N tips merge fine when no pair conflicts. Pairwise
    labelling of *conflicting* N-way splits is still open.
  - **Log growth and checkpoint policy:** add a rebuild as a checkpoint
    trigger (decision 8).

- **Leave alone:** §1.1 and §7.1 (drawing and boundaries still on Yjs).
  Unifying those layers isn't decided in this doc yet.

## Done when

- Only `src/CONCURRENCY_AND_BRANCHING.md` changed.
- Every decision 1–9 appears exactly once as its canonical statement, and
  other sections point to it rather than repeating it.
- No "currently", "pending", "TODO", or references to specs, PRs or this
  task.
- One commit, with a message summarizing the conflict-rule decisions.
