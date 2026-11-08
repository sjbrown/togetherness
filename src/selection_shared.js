/**
 * selection_shared.js — peers' selection state, as #selection_shared draws it.
 *
 * A pure derivation from awareness states: which elements each peer holds,
 * and the open soft-lock request on each contested element. No DOM and no
 * module state; overlay.js calls derive() on every awareness change.
 *
 * Reads each peer's `desired` field ({ [elId]: { ts, holding } }) and
 * `user` ({ id, name, color, gradient }).
 */

import * as SoftLock from './soft_lock.js';

// { c1, c2, angle }, or null for a player who hasn't broadcast a gradient.
function gradientSpec(g) {
  return g?.c1 ? { c1: g.c1, c2: g.c2 ?? g.c1, angle: g.angle ?? 90 } : null;
}

/**
 * holders:  Map<elId, { mode: 'remote', peerName, color, gradId }> — one per
 *           element a peer (never me) holds. gradId names the peer's own
 *           <linearGradient id="grad-{id}"> (user.js's upsertUserGradient),
 *           or is null when they haven't broadcast one.
 * requests: Map<elId, { ts, requesterGrad }> — one per contested element:
 *           the earliest request, matching the one resolveElementWinner
 *           would pick. The requester may be me, whose gradient comes from
 *           `myGradient` rather than my own awareness state.
 */
export function derive(awarenessStates, myClientId, myGradient = null) {
  const holders = new Map();
  awarenessStates.forEach((state, clientId) => {
    if (clientId === myClientId) return;
    if (!state?.desired || typeof state.desired !== 'object') return;
    const peer = state.user;
    const entry = {
      mode:     'remote',
      peerName: peer?.name ?? String(clientId),
      color:    peer?.color ?? '#888',
      gradId:   peer?.gradient?.c1 ? `grad-${peer.id}` : null,
    };
    for (const elId of Object.keys(state.desired)) {
      if (state.desired[elId].holding) holders.set(elId, entry);
    }
  });

  const requests = new Map();
  for (const elId of SoftLock.getAllContestedElementIds(awarenessStates)) {
    const first = SoftLock.getAcquirersOf(elId, awarenessStates)
      .sort((a, b) => a.ts - b.ts || a.clientId - b.clientId)[0];
    const g = first.clientId === myClientId ? myGradient : awarenessStates.get(first.clientId)?.user?.gradient;
    requests.set(elId, { ts: first.ts, requesterGrad: gradientSpec(g) });
  }

  return { holders, requests };
}
