/**
 * origins.js — Yjs transaction origin tags used by envelope.js (which
 * commits transactions under these origins) and app.js (which reads them
 * back to decide what belongs on the undo stack and whether a change should
 * trigger another contents_change_handler cascade).
 *
 *   ENVELOPE_ORIGIN — a toy handler ran: a die's Roll, a tray's Roll All,
 *     or a tray recomputing its own elements in reaction to something in
 *     its tt_contents changing.
 *
 *   LIFECYCLE_ORIGIN — a toy's one-time initialize() side effects at
 *     placement. Untracked for undo (if the placement is undone the whole
 *     toy is removed, so these writes never need an independent undo step).
 */
export const DERIVED_ORIGIN  = 'derived'
export const ENVELOPE_ORIGIN  = 'envelope'
export const LIFECYCLE_ORIGIN = 'toy-lifecycle'
