/**
 * op_layer.js — per-layer orchestration of the operation log.
 *
 * Everything between "a gesture ran against a layer's DOM" and "the log,
 * the local tips and the projection agree": running and committing a
 * gesture, projecting a layer, receiving a remote operation, resolving
 * orphans and conflicts, writing merge checkpoints, pruning, undo and redo.
 */

import { runInEnvelope, commitGesture, isInsideEnvelope, assertOpenOn } from './envelope.js';
import * as OpHead from './op_head.js';
import * as OpDag from './op_dag.js';
import * as OpWireMutation from './op_wire_mutation.js';
import { resolveRef } from './op_wire_mutation.js';
import * as OpCheckpoint from './op_checkpoint.js';
import * as OpReplay from './op_replay.js';
import * as OpPrune from './op_prune.js';
import { ensureLayerId } from './op_layers.js';

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Run fn() against the live DOM (inside an envelope observing layerEl),
 * then run the layer's afterCapture hook (the handler cascade fn's mutations
 * trigger, for toys), then commit the whole thing — the gesture and its entire
 * cascade, however many rounds — as ONE operation.
 * No re-rendering anywhere in this: the DOM stays authoritative and
 * current for every step, and nothing is committed until that final call.
 *
 * This is the shared machinery behind toys.js's invokeMenuAction/
 * initializeToy — also exported directly for a caller whose
 * gesture isn't a toy handler at all (see app.js's)
 * but still needs the exact same "one atomic operation, cascade included"
 * treatment.
 */
export function runGesture(ydoc, layer, layerEl, fn, opts = {}) {
  ensureLayerId(layerEl, layer)
  const captured = runInEnvelope(layerEl, fn)
  const allRecords = [...captured, ...layer.hooks.afterCapture(captured, layerEl, opts)]

  const { tableId } = opts
  let op = null
  if (tableId) {
    op = commitGesture(ydoc, layer, allRecords, {
      gesture:  opts.gesture ?? 'gesture',
      authorId: opts.authorId ?? null,
      reverts:  opts.reverts,
      parents:  OpHead.consumeParents(tableId, layer),
    })
    if (op) {
      OpHead.setHead(tableId, layer, op.id)
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
export function ensureEnvelope(ydoc, layer, layerEl, fn, opts = {}) {
  if (isInsideEnvelope()) {
    assertOpenOn(layer.name)
    return { result: fn(), op: null }
  }
  let result
  const { op } = runGesture(ydoc, layer, layerEl, () => { result = fn() }, opts)
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
export function projectLayer(ydoc, layer, layerEl, { tableId, authorId, isCreator = false, joinSequence = [] } = {}) {
  ensureLayerId(layerEl, layer)
  const ops = OpDag.getOps(ydoc, layer)
  const content = OpDag.getContent(ydoc, layer)

  if (ops.size === 0) {
    if (!isCreator) return null
    const { op: genesis, content: snapshot } = OpCheckpoint.checkpointOp(layerEl, { authorId, parents: [] })
    OpDag.appendCheckpoint(ydoc, layer, genesis, snapshot)
    OpPrune.noteSeen(genesis.id)
    if (tableId) OpHead.setHead(tableId, layer, genesis.id)
    markProjectedAt(layerEl, [genesis.id])
    return genesis.id
  }

  const storedHead = (tableId && OpHead.getHead(tableId, layer)) ?? null
  const storedMergeTips = tableId ? OpHead.getMergeTips(tableId, layer) : []
  let tips = OpHead.maximalTips(ops, [storedHead, ...storedMergeTips])
    .filter(t => !OpDag.isOrphan(ops, t))
  if (!tips.length) tips = OpDag.sharedTips(ops)
  if (!tips.length) return null

  const primaryHead = tips.includes(storedHead) ? storedHead : tips[0]

  // Already showing this state — reprojecting would discard a DOM that
  // gestures and remote operations have been maintaining in place.
  if (projectedAt(layerEl) === tipsMarker(tips)) return primaryHead

  OpCheckpoint.projectTips(layerEl, ops, content, tips, joinSequence)
  layer.hooks.afterProject(ydoc, layerEl)
  if (tableId) {
    OpHead.setHead(tableId, layer, primaryHead)
    OpHead.setMergeTips(tableId, layer, tips.filter(t => t !== primaryHead))
  }
  markProjectedAt(layerEl, tips)
  return primaryHead
}

export const HEAD_MARKER = 'data-tt-head'

/** Which tip set the layer's DOM currently reflects, as the raw marker
 * string (sorted tips joined with ','). */
export const projectedAt = (layerEl) => layerEl?.getAttribute(HEAD_MARKER) ?? null

export const tipsMarker = (tipsOrId) =>
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
 * Apply one arriving operation to a layer, keeping the head, any
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
 * Undo and redo commit an op whose `reverts` names the op it inverts: undo
 * reverts a real gesture, redo reverts an undo. Which ops are still in
 * effect is computed from the log (OpDag.isActive), so one author's undo of
 * another author's gesture is visible to both.
 *
 * The actor presses the button and authors the new op; the owner is whose
 * gesture sits at the root of the revert chain. Undo targets the owner's
 * newest active real gesture across the union ancestry of this peer's local
 * tips; redo targets the actor's own newest active undo. Checkpoints are
 * never targets: undoing one would mean deleting everything.
 *
 * The candidate functions take the layer element in opts and skip any
 * target whose inverse can't apply to it, offering the next-newest. Without
 * layerEl the check is skipped, which is enough for existence checks.
 */
function applyUndoRedo(ydoc, layer, layerEl, tableId, actorId, target, verb) {
  if (!target) return null
  const inverseMutations = OpWireMutation.invert(target.mutations)

  // Strip one leading 'undo:'/'redo:' from the target's own gesture, so the
  // label always names the ORIGINAL real action ('undo:move', 'redo:move').
  const describedGesture = target.gesture.replace(/^(undo|redo):/, '')

  const result = runGesture(ydoc, layer, layerEl, () => {
    OpWireMutation.apply(inverseMutations, layerEl)
  }, { gesture: `${verb}:${describedGesture}`, authorId: actorId, tableId, reverts: target.id })

  return result.op ?? null
}

const firstApplicable = (targets, layerEl) =>
  targets.find(t => !layerEl || canApplyWire(OpWireMutation.invert(t.mutations), layerEl)) ?? null

const localTipsOf = (ydoc, layer, tableId) =>
  tableId ? OpHead.localTips(tableId, layer, OpDag.getOps(ydoc, layer)) : []

/**
 * The op undo or redo would act on, without applying it -- null when there
 * is none. app.js compares these across layers by ts to pick which layer's
 * action the next press reverses.
 */
export function undoCandidate(ydoc, layer, tableId, actorId, { owner = actorId, layerEl } = {}) {
  const targets = OpDag.undoTarget(OpDag.getOps(ydoc, layer), localTipsOf(ydoc, layer, tableId), owner)
  return firstApplicable(targets, layerEl)
}

export function redoCandidate(ydoc, layer, tableId, actorId, { layerEl } = {}) {
  const targets = OpDag.redoTarget(OpDag.getOps(ydoc, layer), localTipsOf(ydoc, layer, tableId), actorId)
  return firstApplicable(targets, layerEl)
}

export function undoGesture(ydoc, layer, layerEl, tableId, actorId, { owner = actorId } = {}) {
  const target = undoCandidate(ydoc, layer, tableId, actorId, { owner, layerEl })
  return applyUndoRedo(ydoc, layer, layerEl, tableId, actorId, target, 'undo')
}

export function redoGesture(ydoc, layer, layerEl, tableId, actorId) {
  const target = redoCandidate(ydoc, layer, tableId, actorId, { layerEl })
  return applyUndoRedo(ydoc, layer, layerEl, tableId, actorId, target, 'redo')
}

/**
 * Existence checks for the undo/redo buttons' enabled state. Pass layerEl
 * to also require that the target's inverse applies right now.
 */
export function canUndo(ydoc, layer, tableId, actorId, opts) {
  return undoCandidate(ydoc, layer, tableId, actorId, opts) != null
}

export function canRedo(ydoc, layer, tableId, actorId, opts) {
  return redoCandidate(ydoc, layer, tableId, actorId, opts) != null
}

/**
 * Move this peer's own view of the layer to targetHeadId, regardless
 * of whether it's a descendant of the current head or a genuinely
 * different branch this peer never had. Used when resolving a conflict:
 * every peer — whether or not they authored anything on the losing side —
 * ends up looking at the leader. The session never "leaves" the shared
 * table; a fork is a separate table entirely, a background event, not a
 * navigation away from this one.
 */
export function adoptBranch(ydoc, layer, layerEl, targetHeadId, tableId) {
  ensureLayerId(layerEl, layer)
  const ops = OpDag.getOps(ydoc, layer)
  const head = tableId ? OpHead.getHead(tableId, layer) : null
  OpReplay.advanceTo(layerEl, ops, OpDag.getContent(ydoc, layer), head, targetHeadId)
  layer.hooks.afterProject(ydoc, layerEl)
  if (tableId) {
    OpHead.setHead(tableId, layer, targetHeadId)
    OpHead.setMergeTips(tableId, layer, [])
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
 * receiveLayerOp. appendOp's set() starts a fresh, local transaction once
 * the observer's own finishes; that re-enters onOpsChanged, but as a
 * local change, which it already ignores — no deferral needed.
 */
function writeMergeCheckpointIfWarranted(ydoc, layer, layerEl, tableId, ops, tips, joinSequence = []) {
  if (isInsideEnvelope() || OpReplay.isReplaying()) return null
  if (!OpCheckpoint.shouldCheckpoint(ops, tips)) return null

  const { op: ck, content } = OpCheckpoint.mergeCheckpointOp(layerEl, tips, ops)
  OpDag.appendCheckpoint(ydoc, layer, ck, content)
  OpHead.setHead(tableId, layer, ck.id)
  OpHead.setMergeTips(tableId, layer, [])
  markProjectedAt(layerEl, [ck.id])
  pruneAfterCheckpoint(ydoc, layer, tableId, ck.id, joinSequence)
  return ck
}

/**
 * Called right after this peer writes any checkpoint (idle or merge): notes
 * it as seen and prunes behind the root op_prune picks. Same guards as the
 * writers: never inside a gesture envelope, never while applying a remote
 * op. No timers; the next checkpoint write is the next chance.
 */
export function pruneAfterCheckpoint(ydoc, layer, tableId, checkpointId, joinSequence = []) {
  OpPrune.noteSeen(checkpointId)
  if (!tableId || isInsideEnvelope() || OpReplay.isReplaying()) return null
  const ops = OpDag.getOps(ydoc, layer)
  const scratch = ensureLayerId(document.createElementNS(SVG_NS, 'g'), layer)
  return OpPrune.prune(ydoc, layer, OpHead.localTips(tableId, layer, ops), { scratch, joinSequence })
}

export function receiveLayerOp(ydoc, layer, layerEl, opId, tableId, joinSequence = []) {
  ensureLayerId(layerEl, layer)
  const ops = OpDag.getOps(ydoc, layer)
  const head = tableId ? OpHead.getHead(tableId, layer) : null
  const mergeTips = tableId ? OpHead.getMergeTips(tableId, layer) : []
  const out = OpReplay.receiveOp(layerEl, ops, OpDag.getContent(ydoc, layer), head, opId, joinSequence, mergeTips)

  if (out.result !== OpReplay.RECEIVED_KNOWN && out.result !== OpReplay.RECEIVED_CONFLICT
      && out.result !== OpReplay.RECEIVED_ORPHAN) {
    layer.hooks.afterProject(ydoc, layerEl)
  }
  if (tableId) {
    if (out.head !== head) OpHead.setHead(tableId, layer, out.head)
    OpHead.setMergeTips(tableId, layer, out.mergeTips ?? [])
  }
  markProjectedAt(layerEl, [out.head, ...(out.mergeTips ?? [])])

  if (tableId && out.result === OpReplay.RECEIVED_REBUILT) {
    const tips = OpHead.maximalTips(ops, [out.head, ...(out.mergeTips ?? [])])
    const ck = writeMergeCheckpointIfWarranted(ydoc, layer, layerEl, tableId, ops, tips, joinSequence)
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
export function resolveOrphanedTips(ydoc, layer, layerEl, tableId, { authorId, joinSequence = [], deletedIds = new Set() } = {}) {
  ensureLayerId(layerEl, layer)
  if (!tableId) return null
  const ops = OpDag.getOps(ydoc, layer)
  const memo = new Map()
  const stored = [OpHead.getHead(tableId, layer), ...OpHead.getMergeTips(tableId, layer)].filter(Boolean)
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
      OpCheckpoint.projectTips(layerEl, ops, OpDag.getContent(ydoc, layer), tips, joinSequence))
    layer.hooks.afterProject(ydoc, layerEl)
    OpHead.setHead(tableId, layer, tips[0])
    OpHead.setMergeTips(tableId, layer, tips.slice(1))
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
export function resolveBranchConflict(ydoc, layer, tips, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, layer)
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
 * Only worth calling when resolveBranchConflict reported
 * authoredSplitter: true.
 */
export function buildLayerForkSeed(ydoc, layer, lca, splitter, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, layer)
  if (lca == null || !OpDag.getOp(ops, lca)) {
    throw new Error('buildLayerForkSeed: the fork point is not in the log; seed from the live layer instead')
  }
  const scratch = ensureLayerId(document.createElementNS(SVG_NS, 'g'), layer)
  const content = OpDag.getContent(ydoc, layer)
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
export function settleBranchConflict(ydoc, layer, layerEl, tableId, tips, { authorId, joinSequence = [] } = {}) {
  const ops = OpDag.getOps(ydoc, layer)
  const decision = resolveBranchConflict(ydoc, layer, tips, { authorId, joinSequence })
  const forkAuthor = decision.orderedIds?.[0]

  let seed = null
  if (decision.authoredSplitter && decision.lca == null) {
    seed = OpCheckpoint.buildLiveForkSeed(ops, OpDag.ancestorsInclusive(ops, decision.splitter),
      layerEl, { authorId: forkAuthor })
  }
  adoptBranch(ydoc, layer, layerEl, decision.leader, tableId)
  if (decision.authoredSplitter && !seed) {
    seed = buildLayerForkSeed(ydoc, layer, decision.lca, decision.splitter, { authorId: forkAuthor, joinSequence })
  }
  return { ...decision, seed }
}

/** Give an imported element a fresh id when its own is missing or taken:
 * data-id is the op log's primary key. */
function reIdOnCollision(layerEl, el, find) {
  const id = el.getAttribute('data-id')
  if (id && !find(layerEl, id)) return
  const fresh = 'import_' + Math.random().toString(36).slice(2, 7)
  el.setAttribute('id', fresh)
  el.setAttribute('data-id', fresh)
}

/**
 * Raise el to the top of layerEl. An appendChild of the last child still
 * records a remove plus an add, shipping the whole subtree twice, so an
 * element already on top is left alone.
 */
export function bringToFront(layerEl, el) {
  if (layerEl.lastElementChild !== el) layerEl.appendChild(el)
}

/**
 * makeOpLayerAPI — the LayerAPI app.js dispatches to, for any op layer.
 *
 * getLayerEl returns the live layer element. Every write runs inside one
 * gesture, so the envelope captures it as one op; a batch is one gesture
 * too, so it is one undo step. Every write returns its op, or null when it
 * changed nothing; add returns the new element. Whatever find() returns is
 * what the other methods accept.
 *
 * primitives are the layer's own DOM operations, called inside a gesture:
 *   find(layerEl, id)             → el | null
 *   add(layerEl, ...args)         → el            (optional)
 *   delete(layerEl, id)
 *   move(layerEl, el, x, y)
 *   toFront(layerEl, el)                          (optional) — raise el to
 *                                   the top of its layer; defaults to
 *                                   appending it unless it is already last
 *   resize(el, x, y, w, h)
 *   rotate(el, deg)                               (optional)
 *   edit(el, editData)
 *   applyTtState(layerEl, state)                  (optional)
 *   list(layerEl)                 → layer-object descriptors
 *   importEl(layerEl, el)         — append one imported element; defaults
 *                                   to re-id on collision, then append
 *
 * A move, single or batched, brings each element to the front before moving
 * it, so the last one moved ends up on top.
 *
 * extras({ gesture, layerEl, base }) returns the layer's own methods
 * (queries, previews, pivot), merged over the base API; base is the API
 * before the merge, for an extra that wraps a base method.
 */
export function makeOpLayerAPI(layer, ydoc, getLayerEl, user, tableId, isCreator, primitives, extras = () => ({})) {
  const p = primitives
  const layerEl = () => (typeof getLayerEl === 'function' ? getLayerEl() : getLayerEl)
  const gesture = (name, fn, extraOpts = {}) =>
    runGesture(ydoc, layer, layerEl(), fn, { gesture: name, authorId: user.id, tableId, ...extraOpts })
  const toFront = p.toFront ?? bringToFront
  const move = (root, el, x, y) => {
    toFront(root, el)
    p.move(root, el, x, y)
  }
  const importEl = p.importEl ?? ((root, el) => {
    reIdOnCollision(root, el, p.find)
    root.appendChild(el)
  })

  const base = {
    find:            (id)             => p.find(layerEl(), id),
    delete:          (id)             => gesture('delete', () => p.delete(layerEl(), id)).op,
    applyMoveCommit: (el, x, y)       => gesture('move',   () => move(layerEl(), el, x, y)).op,
    applyResize:     (el, x, y, w, h) => gesture('resize', () => p.resize(el, x, y, w, h)).op,
    edit:            (el, editData)   => gesture('edit',   () => p.edit(el, editData)).op,
    listData:        ()               => p.list(layerEl()),
    render:          (el, joinSequence = []) =>
                       projectLayer(ydoc, layer, el, { tableId, authorId: user.id, isCreator, joinSequence }),

    /** Delete several elements as one gesture. */
    deleteMany: (ids) => gesture('delete-batch', () => {
      for (const id of ids) p.delete(layerEl(), id)
    }).op,

    /** Move several elements as one gesture. moves: [{ id, x, y }], x/y in
     * the anchor convention move uses. */
    moveMany: (moves) => gesture('move-batch', () => {
      for (const { id, x, y } of moves) {
        const el = p.find(layerEl(), id)
        if (el) move(layerEl(), el, x, y)
      }
    }).op,

    /** Commit pre-parsed foreign elements (storage.js's populateFromSvgDoc,
     * live-table branch) as one gesture. */
    importMany: (els) => {
      if (!els?.length) return null
      return gesture('import', () => {
        for (const el of els) importEl(layerEl(), el)
      }).op
    },
  }
  if (p.add) {
    base.add = (...args) => {
      let el = null
      gesture('add', () => { el = p.add(layerEl(), ...args) })
      return el
    }
  }
  if (p.rotate) base.applyRotate = (el, deg) => gesture('rotate', () => p.rotate(el, deg)).op
  if (p.applyTtState) base.applyTtState = (state) => gesture('edit', () => p.applyTtState(layerEl(), state)).op

  return { ...base, ...extras({ gesture, layerEl, base }) }
}
