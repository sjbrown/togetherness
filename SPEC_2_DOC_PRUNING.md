# Docs: record checkpoint storage, pruning and orphan rules in CONCURRENCY_AND_BRANCHING.md

A self-contained task spec. This is a **documentation-only** change to
`src/CONCURRENCY_AND_BRANCHING.md`. Don't touch any `.js` file or test.

Read `CLAUDE.md` and the whole of `src/CONCURRENCY_AND_BRANCHING.md` first.

## Context

The owner has decided how the op log stops growing without bound. This
records those decisions. **The doc leads the code**: two code tasks
implement it afterwards. Write it the way the rest of the doc is written:
normative, present tense, short paragraphs, bold lead-ins, concrete
examples. Don't write "currently", "pending", or references to specs, PRs or
other tasks. Don't renumber existing sections or invariants.

### The decisions

1. **Checkpoint content lives apart from the graph.** A checkpoint op in the
   ops map carries its graph data (`id`, `parents`, `authorId`, `gesture`,
   `ts`). Its snapshot lives in a second shared map, keyed by op id.
   - The op record stays immutable (invariant 2). Only its content entry is
     ever deleted.
   - Once a newer cut with content exists, a checkpoint's content may be
     deleted. The **root-most** checkpoint's content (genesis, or the prune
     root after a prune) is never deleted.
   - A projection's base is the latest cut **that still has content**. If
     that's an older cut, the replay is longer but just as correct.
   - Rationale: a toys snapshot is roughly 12–13 KB per toy (≈ 380 KB at 30
     toys), against about 300 B per gesture op. Without this split, merge
     checkpoints would outweigh the ops many times over.
2. **Any peer prunes, unilaterally.**
   - Pruning deletes, from the shared map, every op that is a strict
     ancestor of a chosen **prune root**, plus their content entries.
   - The deletes replicate, so a peer that joins later downloads only what's
     left.
   - No acknowledgement and no coordination. That includes a peer that's
     offline.
3. **The prune root** is a cut checkpoint, with content, in the peer's local
   tips' ancestry, that meets both conditions:
   - **at least T = 10 minutes old, measured from when this peer first saw
     it**, not from its `ts`. That makes the age immune to clock skew. First
     sight is in memory only. After a page load, every existing cut counts
     as just seen, so nothing is pruned in the first 10 minutes after
     loading.
   - **not the newest cut.** K = 2: at least one newer cut exists. This holds
     whatever the clocks say.

   The peer picks the newest checkpoint that satisfies both. Rationale: live
   play converges within seconds, so a 10-minute lag never orphans an op
   from a connected peer. A player who hasn't heard from anyone for 10
   minutes is offline, and should expect a fork rather than a smooth merge.
4. **A checkpoint with missing parents is a legal root.** Its content stands
   alone. Any other op whose ancestry reaches a missing parent, without
   passing through a checkpoint first, is an **orphan**.
5. **An orphan branch is the splitter** (§5.2, §5.4):
   - **Bystanders** never apply orphan ops.
   - **A peer whose own work is orphaned** (it authored ops on that branch)
     forks. The fork is seeded from **its own live DOM**, because the fork
     point is gone from the log. Remote deletes never touch the DOM, so the
     DOM still holds that work. The peer then sees the existing branch
     dialog: keep working on the fork, or join the shared table.
   - **A peer with no ops of its own on the orphaned side** (an idle tab
     that slept past the prune) silently adopts the current shared tips.
   - Orphan detection runs **before** any rebuild, so the DOM it would seed
     from is still intact.
6. **Two components with no common ancestor are a conflict.** If both sides
   pruned their shared history (a GM preparing offline while the players
   kept playing), each branch is rooted at its own checkpoint and `lca` is
   null.
   - It's labelled exactly like any conflict: the branch holding the
     earliest-joining author leads.
   - The splitter forks from its own live DOM, as in decision 5.
   - Example: if the GM joined first, the GM's branch leads and the players
     are the ones who fork. That's intended.
7. **History is recent, not complete.** Undo can't reach an op that was
   pruned, and neither can the activity log as an audit trail. With
   T = 10 minutes, about 10 minutes of history is guaranteed. Accepted.
8. **What pruning reclaims, measured:** 1,000 small ops took 310 KB. After
   deleting 990 of them, the whole document is 31.7 KB, and that's what a
   new peer downloads. Each deleted entry leaves about 30 B behind
   permanently: its key survives as a tombstone. That residue is the
   remaining growth.

## Edits, section by section

- **§2.2 (An operation):** soften "The log is a history" to say the log is a
  recent history plus a snapshot. Point to the new §6.3.
- **§5.4 (What a peer does about it):** add decisions 5 and 6. Cover:
  orphan branches and disconnected components as splitters, the fork seeded
  from the live DOM, the idle peer that adopts, and that detection comes
  before rebuild. Keep the existing dialog description and add the "offline
  longer than 10 minutes" framing.
- **§6.1 (A checkpoint is an operation):** add decision 1 (content stored
  apart, superseded content deletable, the root-most content kept, the base
  is the latest cut with content) and decision 4 (a checkpoint with missing
  parents is a legal root). Update the primitive's list of uses if one
  changes.
- **New §6.3 "Pruning":** decisions 2, 3, 7 and 8. Explain T, K and age by
  first sight, who prunes and when (after the peer writes any checkpoint,
  never inside an envelope or while replaying), and exactly what's deleted.
- **§7 (Undo):** one sentence: undo reaches back as far as the prune line,
  about 10 minutes.
- **§8 (Invariants):** append, without renumbering:
  - **15.** Only strict ancestors of a prune root are ever deleted from the
    log. A prune root is a cut with content that this peer first saw at
    least T ago, and it is never the newest cut.
  - **16.** A checkpoint whose parents are missing is a root. Any other op
    whose ancestry reaches a missing parent is an orphan, and bystanders
    never apply it.
  - **17.** A checkpoint's content may be deleted once a newer cut with
    content exists. The root-most checkpoint's content never is.
- **§9 (Dragons):**
  - **Log growth and checkpoint policy:** replace the open question with the
    resolution (§6.3). Keep the owner's *Shandy:* note if it still reads
    true; checkpoint triggers are still a valid policy topic.
  - Add **Tombstone residue:** about 30 B per pruned op, forever. Shorter op
    ids, or starting a fresh document for a table, are the obvious remedies.
    Not needed yet.
- **Leave alone:** §1.1 and §7.1 (drawing and boundaries still on Yjs).

## Done when

- Only `src/CONCURRENCY_AND_BRANCHING.md` changed.
- Each of decisions 1–8 is stated once, canonically, and other sections
  point to it.
- No "currently", "pending", "TODO", or references to specs, PRs or tasks.
- One commit, with a message summarizing the pruning decisions.
