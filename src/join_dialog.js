/**
 * join_dialog.js — turns join_intent.js's network probe into the actual
 * "is this session a table's creator?" decision, driving the join-intent
 * dialog (ui.js's showJoinDialogConnecting/showJoinDialogPrompt/
 * hideJoinDialog).
 *
 * Lives between index.html (which has the live provider/ydoc) and ui.js
 * (which deliberately knows nothing about Yjs/providers — see ui.js's own
 * module comment). This module is the one place allowed to hold both.
 */
import { watchTableProbe } from './join_intent.js';
import { tablesAPI as tables } from './tables.js';
import * as UI from './ui.js';

/**
 * Resolves to true if this session should proceed as the table's
 * creator, false if it should proceed as a joiner — only ever called for
 * a #tableId this browser has never seen before (index.html's caller
 * already handles the unambiguous cases without a dialog).
 */
export function resolveJoinIntent({ provider, tableId, ydoc }) {
  UI.showJoinDialogConnecting();
  return new Promise(resolve => {
    const finish = (isCreator) => {
      UI.hideJoinDialog();
      resolve(isCreator);
    };
    watchTableProbe(provider, {
      onPhase(phase) {
        if (phase === 'unreachable') {
          UI.showJoinDialogPrompt('unreachable', undefined, () => finish(true));
        } else if (phase === 'not-found') {
          UI.showJoinDialogPrompt('not-found', tableId, () => finish(true));
        } else if (phase === 'found') {
          UI.showJoinDialogPrompt('found', tables.getJoinSequenceArray(ydoc), () => finish(false));
        }
      },
    });
  });
}
