/**
 * origins.js — Yjs transaction origin tags, shared by envelope.js (which
 * commits transactions under these origins) and conflict.js (which records
 * a touched-set bundle for qualifying origins). Split into its own module
 * so conflict.js doesn't need to import envelope.js — envelope.js already
 * calls into conflict.js to record each commit's bundle, and an import in
 * the other direction just for three string constants would be a
 * dependency cycle for no reason.
 *
 *   ENVELOPE_ORIGIN — a toy handler ran: a die's Roll, a tray's Roll All.
 *
 *   DERIVED_ORIGIN — a tray recomputed its own elements due to something
 *     in its contents_group changing.
 *
 *   LIFECYCLE_ORIGIN — a toy's one-time initialize() side effects at
 *     placement. If the placement is undone the whole toy is removed, so
 *     these writes never need an independent undo step either. Untracked
 *     for undo, and excluded from conflict.js's bundle recording too — a
 *     placement-time initialize() only ever touches a freshly-created
 *     toy's own fresh subtree, which nothing else has seen yet and so can
 *     never overlap with another peer's concurrent touched-set.
 */
export const ENVELOPE_ORIGIN  = 'envelope'
export const DERIVED_ORIGIN   = 'toy-derived'
export const LIFECYCLE_ORIGIN = 'toy-lifecycle'
