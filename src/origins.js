/**
 * origins.js — Yjs transaction origin tags used by envelope.js (which
 * commits transactions under these origins) and app.js (which reads them
 * back to decide whether a change should trigger another
 * contents_change_handler cascade).
 *
 *   ENVELOPE_ORIGIN — a toy handler ran: a die's Roll, a tray's Roll All,
 *     or a tray recomputing its own elements in reaction to something in
 *     its tt_contents changing.
 *
 *   LIFECYCLE_ORIGIN — a toy's one-time initialize() side effects at
 *     placement. app.js's onToysChanged reads this to avoid re-running
 *     the cascade a second time: initializeToySync already folds its own
 *     complete cascade into the same commit, so the dual-write observer
 *     must not recompute it independently.
 */
export const ENVELOPE_ORIGIN  = 'envelope'
export const LIFECYCLE_ORIGIN = 'toy-lifecycle'
