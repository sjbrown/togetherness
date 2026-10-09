/**
 * op_layer.js — per-layer orchestration of the operation log.
 *
 * Everything between "a gesture ran against a layer's DOM" and "the log,
 * the local tips and the projection agree": running and committing a
 * gesture, projecting a layer, receiving a remote operation, resolving
 * orphans and conflicts, writing merge checkpoints, pruning, undo and redo.
 */

import { runInEnvelope, commitGesture, isInsideEnvelope } from './envelope.js';
import * as OpHead from './op_head.js';
import * as OpDag from './op_dag.js';
import * as OpWireMutation from './op_wire_mutation.js';
import { resolveRef } from './op_wire_mutation.js';
import * as OpCheckpoint from './op_checkpoint.js';
import * as OpReplay from './op_replay.js';
import * as OpPrune from './op_prune.js';
import { ensureLayerId } from './op_layers.js';
import {
  TOYS_LAYER, activateAllToyScriptsDom,
  runContentsChangeCascadeInto, runPositionsChangeCascadeInto,
} from './toys.js';

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Run fn() against the live DOM (inside an envelope observing layerEl),
 * then run whatever handler cascade fn's mutations
 * trigger, then commit the whole thing — the gesture and its entire
 * cascade, however many rounds — as ONE operation.
 * No re-rendering anywhere in this: the DOM stays authoritative and
 * current for every step, and nothing is committed until that final call.
 *
 * This is the shared machinery behind invokeMenuAction/
 * initializeToy (below) — also exported directly for a caller whose
 * gesture isn't a toy handler at all (see app.js's)
 * but still needs the exact same "one atomic operation, cascade included"
 * treatment.
 */
export function runGesture(ydoc, layerEl, fn, opts = {}) {
  ensureLayerId(layerEl, TOYS_LAYER)
  const allRecords = runInEnvelope(layerEl, fn)
  runContentsChangeCascadeInto(allRecords, layerEl)
  runPositionsChangeCascadeInto(allRecords, layerEl, opts.positionEvents)

  const { tableId } = opts
  let op = null
  if (tableId) {
    op = commitGesture(ydoc, TOYS_LAYER, allRecords, {
      gesture:  opts.gesture ?? 'gesture',
      authorId: opts.authorId ?? null,
      parents:  OpHead.consumeParents(tableId, TOYS_LAYER),
    })
    if (op) {
      OpHead.setHead(tableId, TOYS_LAYER, op.id)
      markProjectedAt(layerEl, op.id)
    }
  }
  return { op }
}

/**
 * Run fn(), guaranteeing its mutations land inside exactly one open
 * envelope — never zero (silently lost), never two (independently
 * captured and committed twice, replaying as duplicated DOM — see chat
 * notes on the nested-envelope clone-duplication bug this exists to
 * rule out generically, rather than call-site by call-site).
 *
 * If already inside an envelope (a toy handler's own request-event
 * dispatch, itself inside invokeMenuAction's or a cascade's own
 * envelope), fn just runs and folds in — nothing commits here, and
 * opts.gesture is never used for anything, because there is no "here"
 * to name; fn's mutations become part of whatever the ENCLOSING
 * envelope eventually commits under. If nothing encloses it, this opens
 * and commits its own single runGesture instead, so the mutation is
 * never silently dropped rather than duplicated. This is an envelope
 * guarantee, not a gesture guarantee — it never promises fn's work
 * becomes its own named, identifiable op; only that it's captured
 * exactly once.
 *
 * Returns { result, op } — result is fn()'s return value either way;
 * op is the committed operation, or null when this folded into an
 * enclosing envelope instead of committing one of its own.
 */
export function ensureEnvelope(ydoc, layerEl, fn, opts = {}) {
  if (isInsideEnvelope()) return { result: fn(), op: null }
  let result
  const { op } = runGesture(ydoc, layerEl, () => { result = fn() }, opts)
  return { result, op }
}

/**
 * Bring the layer to the state the op log describes.
 *
 * An empty log means this table predates the log (or is brand new): render
 * from the Yjs tree once and freeze the result as the genesis checkpoint,
 * so there is always a checkpoint at the root to project from.
 *
 * Returns the head it left the layer at.
 *
 * isCreator matters only on the "the log is empty" path, and it has to be
 * the same signal index.html already uses to decide whether to mint a
 * fresh table id: !location.hash, computed once, at the top of boot.
 * "My local ops map has nothing in it" is NOT that signal — it's also
 * true for a joiner who arrived before the creator's genesis has synced
 * in, and minting a checkpoint there forks the table's history before
 * anyone has done anything. Two peers can't both create the same table;
 * exactly one of them generated the hash the other one joined.
 *
 * A non-creator with an empty log takes no genesis and returns null —
 * there is nothing yet to project, and inventing something would be
 * exactly the bug this guards against. The caller re-renders once the
 * real genesis arrives (see app.js's ops-Map observer).
 *
 * Once the log is non-empty, projects this peer's local tips (head plus
 * merge tips), not the head alone: merge tips are ops this peer already
 * absorbed into its live DOM before reload, and dropping them here would
 * make a reload silently lose merged work.
 */
export function projectLayer(ydoc, layerEl, { tableId, authorId, isCreator = false, joinSequence = [] } = {}) {
  ensureLayerId(layerEl, TOYS_LAYER)
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const content = OpDag.getContent(ydoc, TOYS_LAYER)

  if (ops.size === 0) {
    if (!isCreator) return null
    const { op: genesis, content: snapshot } = OpCheckpoint.checkpointOp(layerEl, { authorId, parents: [] })
    OpDag.appendCheckpoint(ydoc, TOYS_LAYER, genesis, snapshot)
    OpPrune.noteSeen(genesis.id)
    if (tableId) OpHead.setHead(tableId, TOYS_LAYER, genesis.id)
    markProjectedAt(layerEl, [genesis.id])
    return genesis.id
  }

  const storedHead = (tableId && OpHead.getHead(tableId, TOYS_LAYER)) ?? null
  const storedMergeTips = tableId ? OpHead.getMergeTips(tableId, TOYS_LAYER) : []
  let tips = OpHead.maximalTips(ops, [storedHead, ...storedMergeTips])
    .filter(t => !OpDag.isOrphan(ops, t))
  if (!tips.length) tips = OpDag.sharedTips(ops)
  if (!tips.length) return null

  const primaryHead = tips.includes(storedHead) ? storedHead : tips[0]

  // Already showing this state — reprojecting would discard a DOM that
  // gestures and remote operations have been maintaining in place.
  if (projectedAt(layerEl) === tipsMarker(tips)) return primaryHead

  OpCheckpoint.projectTips(layerEl, ops, content, tips, joinSequence)
  activateAllToyScriptsDom(ydoc, layerEl)
  if (tableId) {
    OpHead.setHead(tableId, TOYS_LAYER, primaryHead)
    OpHead.setMergeTips(tableId, TOYS_LAYER, tips.filter(t => t !== primaryHead))
  }
  markProjectedAt(layerEl, tips)
  return primaryHead
}

export const HEAD_MARKER = 'data-tt-head'

/** Which tip set the layer's DOM currently reflects, as the raw marker
 * string (sorted tips joined with ','). */
export const projectedAt = (layerEl) => layerEl?.getAttribute(HEAD_MARKER) ?? null

const tipsMarker = (tipsOrId) =>
  [...new Set((Array.isArray(tipsOrId) ? tipsOrId : [tipsOrId]).filter(Boolean))].sort().join(',')

/** Record the tip set (head plus any merge tips) the layer's DOM now
 * reflects. Accepts a single op id or an array — buildExportSvg already
 * strips this attribute regardless of shape. */
export function markProjectedAt(layerEl, tipsOrId) {
  const marker = tipsMarker(tipsOrId)
  if (layerEl && marker) layerEl.setAttribute(HEAD_MARKER, marker)
  return layerEl
}

/**
 * Apply one arriving operation to the toys layer, keeping the head, any
 * merge tips, and the projection marker (render()'s idempotence check)
 * all consistent with what actually happened.
 *
 * True only if every wire entry's target resolves against layerEl right
 * now. Read-only — touches nothing. apply() applies entries one at a
 * time and throws on the first unresolvable target, which can leave
 * earlier entries in a batch already mutated with nothing committed to
 * describe it; undo needs to know *before* touching anything, since a
 * half-applied inverse with no corresponding operation is exactly the
 * silent-divergence apply() is designed to refuse, just reached a
 * different way.
 */
function canApplyWire(wire, layerEl) {
  for (const entry of wire ?? []) {
    if (!resolveRef(entry.target, layerEl)) return false
  }
  return true
}

/**
 * Undo/redo, backed by OpDag.toyUndoRedoStacks — a real undo/redo stack,
 * reconstructed by replaying this author's own ops rather than a single
 * backward pointer walk. That distinction matters: skipping past an
 * 'undo' op and continuing to its *parent* doesn't reach an older
 * action — an undo's parent IS the op it just inverted, by construction,
 * so that walk just finds the same thing again. Repeated Undo presses
 * need the full stack simulation to reach progressively older gestures
 * instead of toggling between the last two.
 *
 * Both skip checkpoints inherently (OpDag.toyUndoRedoStacks never pushes one):
 * a genesis checkpoint is authored to whoever took it, so on a fresh
 * table it would otherwise look like "my most recent op" with nothing
 * else having happened yet — but it isn't a user action, it's
 * "reconstruct this state from scratch." Undoing it would mean deleting
 * everything.
 */
function applyToyUndoRedo(ydoc, layerEl, tableId, authorId, targetId, verb) {
  if (!targetId) return null
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const target = OpDag.getOp(ops, targetId)
  const inverseMutations = OpWireMutation.invert(target.mutations)
  if (!canApplyWire(inverseMutations, layerEl)) return null

  // Strip one leading 'undo:'/'redo:' from the target's own gesture, so
  // the new tag always names the ORIGINAL real action — 'undo:move',
  // 'redo:move' — never nests ('redo:undo:move'), no matter how many
  // times something gets toggled back and forth. This is what lets a
  // caller show a real label ("undid: move") instead of "undid: undo".
  const describedGesture = target.gesture.replace(/^(undo|redo):/, '')

  const result = runGesture(ydoc, layerEl, () => {
    OpWireMutation.apply(inverseMutations, layerEl)
  }, { gesture: `${verb}:${describedGesture}`, authorId, tableId })

  return result.op ?? null
}

export function undoToyGesture(ydoc, layerEl, tableId, authorId) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  const { undoTargetId } = OpDag.toyUndoRedoStacks(ops, head, authorId)
  return applyToyUndoRedo(ydoc, layerEl, tableId, authorId, undoTargetId, 'undo')
}

export function redoToyGesture(ydoc, layerEl, tableId, authorId) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  const { redoTargetId } = OpDag.toyUndoRedoStacks(ops, head, authorId)
  return applyToyUndoRedo(ydoc, layerEl, tableId, authorId, redoTargetId, 'redo')
}

/**
 * Cheap existence checks for the undo/redo buttons' enabled state — no DOM
 * needed, no mutation. canApplyWire's resolvability check still runs at
 * actual undo/redo time, so a button can be enabled and the press can still
 * turn out to be a no-op if the target vanished between the check and the
 * click; that's an acceptable, minor imprecision most editors share.
 */
export function canUndoToyGesture(ydoc, tableId, authorId) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  return OpDag.toyUndoRedoStacks(ops, head, authorId).undoTargetId != null
}

export function canRedoToyGesture(ydoc, tableId, authorId) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  return OpDag.toyUndoRedoStacks(ops, head, authorId).redoTargetId != null
}

/**
 * Move this peer's own view of the toys layer to targetHeadId, regardless
 * of whether it's a descendant of the current head or a genuinely
 * different branch this peer never had. Used when resolving a conflict:
 * every peer — whether or not they authored anything on the losing side —
 * ends up looking at the leader. The session never "leaves" the shared
 * table; a fork is a separate table entirely, a background event, not a
 * navigation away from this one.
 */
export function adoptToyBranch(ydoc, layerEl, targetHeadId, tableId) {
  ensureLayerId(layerEl, TOYS_LAYER)
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  OpReplay.advanceTo(layerEl, ops, OpDag.getContent(ydoc, TOYS_LAYER), head, targetHeadId)
  activateAllToyScriptsDom(ydoc, layerEl)
  if (tableId) {
    OpHead.setHead(tableId, TOYS_LAYER, targetHeadId)
    OpHead.setMergeTips(tableId, TOYS_LAYER, [])
  }
  markProjectedAt(layerEl, [targetHeadId])
}

/**
 * After a canonical rebuild, write a merge checkpoint if the rebuilt tip
 * set has drifted far enough past its own cut. layerEl already reflects
 * tips exactly — receiveOp's own rebuild just projected it there — so
 * this only records that DOM, not a second rebuild. Guarded like
 * app.js's idle checkpoint: never inside a gesture envelope or while
 * applying a remote op.
 *
 * Writes synchronously, from inside the ops Y.Map observer that called
 * receiveToyOp. appendOp's set() starts a fresh, local transaction once
 * the observer's own finishes; that re-enters onOpsChanged, but as a
 * local change, which it already ignores — no deferral needed.
 */
function writeMergeCheckpointIfWarranted(ydoc, layerEl, tableId, ops, tips, joinSequence = []) {
  if (isInsideEnvelope() || OpReplay.isReplaying()) return null
  if (!OpCheckpoint.shouldCheckpoint(ops, tips)) return null

  const { op: ck, content } = OpCheckpoint.mergeCheckpointOp(layerEl, tips, ops)
  OpDag.appendCheckpoint(ydoc, TOYS_LAYER, ck, content)
  OpHead.setHead(tableId, TOYS_LAYER, ck.id)
  OpHead.setMergeTips(tableId, TOYS_LAYER, [])
  markProjectedAt(layerEl, [ck.id])
  pruneAfterCheckpoint(ydoc, tableId, ck.id, joinSequence)
  return ck
}

/**
 * Called right after this peer writes any checkpoint (idle or merge): notes
 * it as seen and prunes behind the root op_prune picks. Same guards as the
 * writers: never inside a gesture envelope, never while applying a remote
 * op. No timers; the next checkpoint write is the next chance.
 */
export function pruneAfterCheckpoint(ydoc, tableId, checkpointId, joinSequence = []) {
  OpPrune.noteSeen(checkpointId)
  if (!tableId || isInsideEnvelope() || OpReplay.isReplaying()) return null
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const scratch = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  return OpPrune.prune(ydoc, TOYS_LAYER, OpHead.localTips(tableId, TOYS_LAYER, ops), { scratch, joinSequence })
}

export function receiveToyOp(ydoc, layerEl, opId, tableId, joinSequence = []) {
  ensureLayerId(layerEl, TOYS_LAYER)
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const head = tableId ? OpHead.getHead(tableId, TOYS_LAYER) : null
  const mergeTips = tableId ? OpHead.getMergeTips(tableId, TOYS_LAYER) : []
  const out = OpReplay.receiveOp(layerEl, ops, OpDag.getContent(ydoc, TOYS_LAYER), head, opId, joinSequence, mergeTips)

  if (out.result !== OpReplay.RECEIVED_KNOWN && out.result !== OpReplay.RECEIVED_CONFLICT
      && out.result !== OpReplay.RECEIVED_ORPHAN) {
    activateAllToyScriptsDom(ydoc, layerEl)
  }
  if (tableId) {
    if (out.head !== head) OpHead.setHead(tableId, TOYS_LAYER, out.head)
    OpHead.setMergeTips(tableId, TOYS_LAYER, out.mergeTips ?? [])
  }
  markProjectedAt(layerEl, [out.head, ...(out.mergeTips ?? [])])

  if (tableId && out.result === OpReplay.RECEIVED_REBUILT) {
    const tips = OpHead.maximalTips(ops, [out.head, ...(out.mergeTips ?? [])])
    const ck = writeMergeCheckpointIfWarranted(ydoc, layerEl, tableId, ops, tips, joinSequence)
    if (ck) {
      out.head = ck.id
      out.mergeTips = []
      out.mergeCheckpoint = ck.id
    }
  }

  return out
}

/**
 * Whether pruning left this peer's own tips behind: a tip that was just
 * deleted, or one whose ancestry now reaches a missing parent. If so, move
 * the layer to the shared tips (the maximal non-orphan ops) and report what
 * was orphaned. Runs before any of the same event's new ops are received, so
 * nothing has rebuilt the layer yet.
 *
 * deletedIds are the keys removed by the event being handled; a head that
 * is merely absent (not yet synced) is not stale, only one that was deleted
 * is. Returns null when the tips are fine, else
 * { tips, authored, orphanIds, fork }: the shared tips adopted, whether this
 * peer authored any op on the orphaned branch, that branch's op ids, and,
 * when it did, { seed, orderedIds } for tables.js's forkLiveDoc. The fork
 * point is gone from the log, so the seed is this peer's own live layer,
 * taken before the layer is rebuilt onto the shared tips.
 */
export function resolveOrphanedTips(ydoc, layerEl, tableId, { authorId, joinSequence = [], deletedIds = new Set() } = {}) {
  ensureLayerId(layerEl, TOYS_LAYER)
  if (!tableId) return null
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const memo = new Map()
  const stored = [OpHead.getHead(tableId, TOYS_LAYER), ...OpHead.getMergeTips(tableId, TOYS_LAYER)].filter(Boolean)
  const stale = stored.filter(id => deletedIds.has(id) || OpDag.isOrphan(ops, id, memo))
  if (!stale.length) return null

  const orphanIds = new Set()
  for (const tip of stale) {
    for (const id of OpDag.ancestorsInclusive(ops, tip)) {
      if (OpDag.isOrphan(ops, id, memo)) orphanIds.add(id)
    }
  }
  const authors = new Set([...orphanIds].map(id => OpDag.getOp(ops, id)?.authorId).filter(Boolean))
  const authored = authors.has(authorId)

  let fork = null
  if (authored) {
    const orderedIds = OpDag.forkJoinSequence(joinSequence, authors)
    const seed = OpCheckpoint.buildLiveForkSeed(ops, orphanIds, layerEl, { authorId: orderedIds[0] })
    fork = { seed, orderedIds }
  }

  const tips = OpDag.sharedTips(ops)
  if (tips.length) {
    OpReplay.withSuppressedCapture(() =>
      OpCheckpoint.projectTips(layerEl, ops, OpDag.getContent(ydoc, TOYS_LAYER), tips, joinSequence))
    activateAllToyScriptsDom(ydoc, layerEl)
    OpHead.setHead(tableId, TOYS_LAYER, tips[0])
    OpHead.setMergeTips(tableId, TOYS_LAYER, tips.slice(1))
    markProjectedAt(layerEl, tips)
  }
  return { tips, authored, orphanIds: [...orphanIds], fork }
}

/**
 * Decide what a conflicting arrival means for THIS peer, without
 * touching any DOM or ydoc: label leader/splitter (OpDag.labelBranches),
 * then check whether authorId contributed to the splitter.
 *
 * A bystander (didn't) just needs to know which branch is the leader, to
 * adopt it silently. A peer who authored on the splitter needs a fork —
 * orderedIds is ready to hand to tables.js's forkLiveDoc; opsSeed is NOT
 * computed here (it needs a real projected layer, real DOM work, only
 * worth doing in the fork case)
 */
export function resolveToyBranchConflict(ydoc, tips, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const { leader, splitter, lca } = OpDag.labelBranches(ops, tips[0], tips[1], joinSequence)
  const authors = OpDag.branchAuthors(ops, splitter, lca)

  // With no LCA the two sides are disjoint components. The live layer is
  // the local head's side, so only that side's author has anything to fork.
  const ownSide = lca != null || splitter === tips[0]
  if (!authors.has(authorId) || !ownSide) {
    return { leader, splitter, lca, authoredSplitter: false }
  }

  return {
    leader, splitter, lca, authoredSplitter: true,
    orderedIds: OpDag.forkJoinSequence(joinSequence, authors),
  }
}

/**
 * The DOM-touching half of resolving a conflict this peer is on the
 * losing side of: project a scratch layer to lca (OpCheckpoint.buildForkSeed needs a
 * real layer to checkpoint from) and build the fork's seed content.
 * Only worth calling when resolveToyBranchConflict reported
 * authoredSplitter: true.
 */
export function buildToyForkSeed(ydoc, lca, splitter, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  if (lca == null || !OpDag.getOp(ops, lca)) {
    throw new Error('buildToyForkSeed: the fork point is not in the log; seed from the live layer instead')
  }
  const scratch = ensureLayerId(document.createElementNS(SVG_NS, 'g'), TOYS_LAYER)
  const content = OpDag.getContent(ydoc, TOYS_LAYER)
  OpCheckpoint.projectFrom(scratch, ops, content, lca, joinSequence)
  return OpCheckpoint.buildForkSeed(ops, content, lca, splitter, scratch, { authorId, joinSequence })
}

/**
 * Settle a conflicting arrival for this peer: label the branches, adopt the
 * leader, and, if this peer authored the splitter, build the fork seed.
 * Returns the decision plus `seed` (null when there is nothing to fork).
 * Disjoint components have no LCA to seed from, so the seed is the live
 * layer, taken before adopting the leader rebuilds it.
 */
export function settleBranchConflict(ydoc, layerEl, tableId, tips, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, TOYS_LAYER)
  const decision = resolveToyBranchConflict(ydoc, tips, { authorId, joinSequence })
  const forkAuthor = decision.orderedIds?.[0]

  let seed = null
  if (decision.authoredSplitter && decision.lca == null) {
    seed = OpCheckpoint.buildLiveForkSeed(ops, OpDag.ancestorsInclusive(ops, decision.splitter),
      layerEl, { authorId: forkAuthor })
  }
  adoptToyBranch(ydoc, layerEl, decision.leader, tableId)
  if (decision.authoredSplitter && !seed) {
    seed = buildToyForkSeed(ydoc, decision.lca, decision.splitter, { authorId: forkAuthor, joinSequence })
  }
  return { ...decision, seed }
}
