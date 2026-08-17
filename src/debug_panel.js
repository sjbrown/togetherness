/**
 * debug_panel.js — the Debug tab: everything the table does that the table
 * doesn't show.
 *
 * Four things, in the order a person actually needs them:
 *
 *   STATE   what is true right now — head, projection, tips, peers, authority
 *   OPS     the operation log in application order, each packet inspectable
 *   STREAM  the trace: boot, handshakes, envelopes, wire, in the order it happened
 *   TRACE   the recorder's own controls
 *
 * Conventions borrowed from ui.js, deliberately:
 *   - render functions are pure, `renderX(data) -> htmlString`, so they can be
 *     exercised from a test with a literal instead of a booted app
 *   - document state arrives through the App bus, never by importing a CRDT
 *     module; trace.js is the exception and is a dependency-free leaf
 *
 * Expansion is <details>/<summary> — the browser already implements
 * disclosure, and a debug panel is a poor place to reinvent it. `toggle`
 * doesn't bubble, so the open-state bookkeeping listens in the capture phase.
 */

import * as Trace from './trace.js'

let App = null

// Which <details> the person has opened, so a re-render doesn't collapse
// what they were reading. Ephemeral by nature — never persisted.
const _expanded = new Set(['sec-state', 'sec-stream'])

let _container   = null
let _unsubscribe = null
let _frame       = null

const MAX_STREAM_ROWS = 250

export function init(appBus) {
  App = appBus
}

// ── escaping ────────────────────────────────────────────────────────────

// Every value below is app-controlled, but a toy's name is not: it comes
// from whatever a peer typed, and it reaches this panel through gesture
// labels and op detail. Escape everything rather than audit each path.
export function esc(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ── formatting ──────────────────────────────────────────────────────────

/** HH:MM:SS.mmm — the resolution that makes two near-simultaneous events orderable. */
export function clockTime(t) {
  if (!Number.isFinite(t)) return '--:--:--'
  return new Date(t).toISOString().slice(11, 23)
}

/**
 * Operation and node ids are long and share a prefix; the tail is the part
 * that distinguishes them. Shown short, with the whole thing on hover.
 */
export function shortId(id, keep = 8) {
  if (!id) return '—'
  const s = String(id)
  return s.length <= keep + 2 ? s : `…${s.slice(-keep)}`
}

export function idHTML(id) {
  if (!id) return '<span class="dbg-nil">none</span>'
  return `<code class="dbg-id" title="${esc(id)}">${esc(shortId(id))}</code>`
}

/** Pretty JSON, escaped, in a copyable block. Undefined detail renders nothing. */
export function jsonHTML(value) {
  if (value === null || value === undefined) return ''
  let text
  try {
    text = JSON.stringify(value, null, 2)
  } catch (err) {
    // A circular or otherwise unserializable detail is a bug in whatever
    // recorded it; say so rather than throwing inside a render.
    text = `/* not serializable: ${String(err?.message ?? err)} */`
  }
  if (text === undefined) text = String(value)
  return `<pre class="dbg-json">${esc(text)}</pre>`
}

// ── sections ────────────────────────────────────────────────────────────

const isOpen = (id) => _expanded.has(id)

function section(id, title, meta, inner) {
  return `<details class="dbg-section" data-dbg-key="${id}"${isOpen(id) ? ' open' : ''}>
    <summary class="dbg-summary"><span class="dbg-sec-title">${esc(title)}</span>${
      meta ? `<span class="dbg-sec-meta">${meta}</span>` : ''
    }</summary>
    <div class="dbg-section-body">${inner}</div>
  </details>`
}

function kv(label, valueHTML, cls = '') {
  return `<div class="dbg-kv ${cls}"><span class="dbg-k">${esc(label)}</span><span class="dbg-v">${valueHTML}</span></div>`
}

// ── STATE ───────────────────────────────────────────────────────────────

export function stateHTML(s) {
  if (!s) return '<div class="dbg-empty">No document state — the table has not booted.</div>'

  const head = s.head ?? {}
  const headWarn = head.head && !head.agrees

  const headCard = `
    <div class="dbg-card ${headWarn ? 'warn' : ''}">
      <div class="dbg-card-title">Head</div>
      ${kv('stored head', idHTML(head.head))}
      ${kv('DOM projected at', idHTML(head.projected))}
      ${headWarn
        ? `<div class="dbg-alert">The toys layer is showing a different operation than this
             peer's stored head. The next gesture will be parented to the stored head.</div>`
        : ''}
      ${(head.mergeTips?.length ?? 0)
        ? kv('merge tips', head.mergeTips.map(idHTML).join(' '))
        : kv('merge tips', '<span class="dbg-nil">none pending</span>')}
    </div>`

  const ops = s.ops ?? {}
  const tips = ops.tips ?? []
  const opsCard = `
    <div class="dbg-card ${tips.length > 1 ? 'warn' : ''}">
      <div class="dbg-card-title">Operation log</div>
      ${kv('operations', `<b>${ops.total ?? 0}</b>`)}
      ${kv('checkpoints', String(ops.checkpoints ?? 0))}
      ${kv('authored by me', String(ops.mine ?? 0))}
      ${kv(tips.length === 1 ? 'tip' : 'tips', tips.length ? tips.map(idHTML).join(' ') : '<span class="dbg-nil">none</span>')}
      ${tips.length > 1
        ? '<div class="dbg-alert">More than one tip: the log has diverged and has not been reconciled yet.</div>'
        : ''}
    </div>`

  const net = s.net ?? {}
  const peers = net.peers ?? []
  const netCard = `
    <div class="dbg-card ${net.connected ? '' : 'warn'}">
      <div class="dbg-card-title">Transport</div>
      ${kv('signaling', net.signaling ? `<code class="dbg-id">${esc(net.signaling)}</code>` : '<span class="dbg-nil">unknown</span>')}
      ${kv('signaling link', net.connected ? '<span class="dbg-ok">connected</span>' : '<span class="dbg-bad">disconnected</span>')}
      ${kv('doc synced', net.synced ? '<span class="dbg-ok">yes</span>' : '<span class="dbg-nil">not yet</span>')}
      ${kv('webrtc peers', String(net.webrtcPeers ?? 0))}
      ${kv('broadcastchannel peers', String(net.bcPeers ?? 0))}
      ${net.offline ? kv('offline mode', '<span class="dbg-bad">on</span>') : ''}
      ${kv('presence', peers.length
        ? peers.map(p => `<code class="dbg-id" title="${esc(p.peerId ?? p.clientId)}">${esc(shortId(p.peerId ?? String(p.clientId), 6))}${p.self ? ' (me)' : ''}</code>`).join(' ')
        : '<span class="dbg-nil">nobody</span>')}
    </div>`

  const seq = s.joinSequence ?? []
  const tableCard = `
    <div class="dbg-card">
      <div class="dbg-card-title">Table</div>
      ${kv('table id', `<code class="dbg-id">${esc(s.table?.tableId ?? '—')}</code>`)}
      ${kv('created here', s.table?.isCreator ? 'yes' : 'no')}
      ${kv('schema', String(s.table?.schema ?? '—'))}
      ${kv('my peer id', `<code class="dbg-id" title="${esc(s.identity?.myId)}">${esc(s.identity?.myId ?? '—')}</code>`)}
      ${kv('yjs client id', String(s.identity?.clientId ?? '—'))}
      ${kv('authority order', seq.length
        ? seq.map((id, i) => `<code class="dbg-id ${i === s.myAuthorityIndex ? 'me' : ''}" title="${esc(id)}">${i}·${esc(shortId(id, 5))}</code>`).join(' ')
        : '<span class="dbg-nil">empty</span>')}
      <div class="dbg-note">Earlier in the order wins a conflict.</div>
    </div>`

  return headCard + opsCard + netCard + tableCard
}

// ── OPS ─────────────────────────────────────────────────────────────────

export function opRowsHTML(ops, head) {
  const ordered = ops?.ordered ?? []
  if (!ordered.length) return '<div class="dbg-empty">The operation log is empty.</div>'

  // Newest first: the last thing that happened is the thing being debugged.
  const rows = [...ordered].reverse().map(o => {
    const key = `op-${o.id}`
    const flags = [
      o.checkpoint ? '<span class="dbg-tag ck">checkpoint</span>' : '',
      o.mine       ? '<span class="dbg-tag mine">mine</span>' : '',
      o.id === head ? '<span class="dbg-tag head">head</span>' : '',
    ].join('')
    return `<details class="dbg-op" data-dbg-key="${key}"${isOpen(key) ? ' open' : ''}>
      <summary class="dbg-op-sum">
        <span class="dbg-op-i">${o.i}</span>
        <span class="dbg-op-gesture">${esc(o.gesture ?? '?')}</span>
        ${flags}
        <span class="dbg-op-entries">${o.entries}</span>
      </summary>
      <div class="dbg-op-body">
        ${kv('id', idHTML(o.id))}
        ${kv('author', idHTML(o.authorId))}
        ${kv('parents', o.parents?.length ? o.parents.map(idHTML).join(' ') : '<span class="dbg-nil">root</span>')}
        ${kv('recorded', o.ts ? esc(clockTime(o.ts)) : '—')}
        <div class="dbg-wire-label">Wire packet — ${o.entries} entr${o.entries === 1 ? 'y' : 'ies'}
          <button class="dbg-mini" data-dbg-action="copy-op" data-dbg-id="${esc(o.id)}">Copy</button>
        </div>
        ${jsonHTML(o.mutations)}
      </div>
    </details>`
  }).join('')

  const truncated = ops.truncated
    ? `<div class="dbg-note">Showing the most recent ${ops.shown} of ${ops.total} operations.</div>`
    : ''
  return truncated + `<div class="dbg-op-list">${rows}</div>`
}

// ── STREAM ──────────────────────────────────────────────────────────────

export function channelChipsHTML(counts) {
  return Trace.CHANNELS.map(c => {
    const on = Trace.channelEnabled(c.id)
    return `<button class="dbg-chip ${on ? 'on' : ''}" data-dbg-action="toggle-channel"
      data-dbg-channel="${c.id}" title="${esc(c.title)}${c.verbose ? ' — verbose' : ''}">
      ${esc(c.label)}<span class="dbg-chip-n">${counts?.[c.id] ?? 0}</span>
    </button>`
  }).join('')
}

export function streamRowsHTML(events) {
  if (!events?.length) {
    return '<div class="dbg-empty">Nothing recorded yet. Move a toy, or reload with a peer connected.</div>'
  }
  return events.map(e => {
    const key = `ev-${e.seq}`
    const hasDetail = e.detail !== null && e.detail !== undefined
    const row = `<span class="dbg-ev-seq">${e.seq}</span>
      <span class="dbg-ev-time">${esc(clockTime(e.t))}</span>
      <span class="dbg-ev-ch ch-${esc(e.ch)}">${esc(e.ch)}</span>
      <span class="dbg-ev-msg">${esc(e.msg)}</span>`
    if (!hasDetail) {
      return `<div class="dbg-ev lvl-${esc(e.level)} flat">${row}</div>`
    }
    return `<details class="dbg-ev lvl-${esc(e.level)}" data-dbg-key="${key}"${isOpen(key) ? ' open' : ''}>
      <summary class="dbg-ev-sum">${row}</summary>
      ${jsonHTML(e.detail)}
    </details>`
  }).join('')
}

// ── body ────────────────────────────────────────────────────────────────

export function gatherDebugData() {
  const active = Trace.CHANNELS.filter(c => Trace.channelEnabled(c.id)).map(c => c.id)
  return {
    state:    App?.getDebugState ? safeState() : null,
    counts:   Trace.counts(),
    events:   Trace.recent(MAX_STREAM_ROWS, active),
    recording: Trace.isEnabled(),
    capacity: Trace.capacity(),
  }
}

// A debug panel that throws while reporting a broken state is worse than
// useless — it hides the very thing it exists to show.
function safeState() {
  try {
    return App.getDebugState()
  } catch (err) {
    console.error('[debug] getDebugState threw', err)
    return { error: String(err?.message ?? err) }
  }
}

export function debugBody(data) {
  const s = data?.state
  if (s?.error) {
    return `<div class="dbg-alert">Could not read document state: ${esc(s.error)}</div>`
  }
  const counts = data?.counts ?? {}

  const streamMeta = `${counts.total ?? 0}${counts.dropped ? ` · ${counts.dropped} dropped` : ''}`

  return `
    ${section('sec-state', 'State', s?.head?.agrees === false ? '<span class="dbg-bad">head mismatch</span>' : '', stateHTML(s))}
    ${section('sec-ops', 'Operations', `${s?.ops?.total ?? 0}`, opRowsHTML(s?.ops, s?.head?.head))}
    ${section('sec-stream', 'Stream', streamMeta, `
      <div class="dbg-chips">${channelChipsHTML(counts)}</div>
      <div class="dbg-stream" id="dbgStream">${streamRowsHTML(data?.events)}</div>
    `)}
    ${section('sec-trace', 'Recorder', data?.recording ? 'on' : '<span class="dbg-bad">paused</span>', `
      <div class="dbg-btn-row">
        <button class="dbg-btn" data-dbg-action="toggle-recording">${data?.recording ? 'Pause recording' : 'Resume recording'}</button>
        <button class="dbg-btn" data-dbg-action="clear">Clear</button>
        <button class="dbg-btn" data-dbg-action="download">Download trace</button>
      </div>
      ${kv('ring capacity', `${data?.capacity ?? 0} events`)}
      ${kv('recorded this session', String(counts.seq ?? 0))}
      ${kv('evicted from the ring', String(counts.dropped ?? 0))}
      <div class="dbg-note">Recording runs from boot so the history is already
        there when you come looking. Channels above can be muted individually;
        warnings and errors are recorded regardless.</div>
    `)}
  `
}

// ── mounting ────────────────────────────────────────────────────────────

/**
 * Wire the rendered body. One delegated click listener and one capture-phase
 * toggle listener, both on the container, so a re-render never leaves a
 * listener behind on a detached node.
 */
export function mount(containerEl) {
  unmount()
  if (!containerEl) return
  _container = containerEl
  containerEl.addEventListener('click', onClick)
  containerEl.addEventListener('toggle', onToggle, true)
  _unsubscribe = Trace.subscribe(scheduleRender)
}

export function unmount() {
  if (_container) {
    _container.removeEventListener('click', onClick)
    _container.removeEventListener('toggle', onToggle, true)
  }
  _container = null
  if (_unsubscribe) { _unsubscribe(); _unsubscribe = null }
  if (_frame != null) {
    globalThis.cancelAnimationFrame?.(_frame)
    _frame = null
  }
}

export const isMounted = () => _container !== null

function onToggle(e) {
  const key = e.target?.dataset?.dbgKey
  if (!key) return
  if (e.target.open) _expanded.add(key)
  else _expanded.delete(key)
}

function onClick(e) {
  const btn = e.target.closest?.('[data-dbg-action]')
  if (!btn) return
  e.preventDefault()
  switch (btn.dataset.dbgAction) {
    case 'toggle-channel':
      Trace.setChannelEnabled(btn.dataset.dbgChannel, !Trace.channelEnabled(btn.dataset.dbgChannel))
      render()
      break
    case 'toggle-recording':
      Trace.setEnabled(!Trace.isEnabled())
      render()
      break
    case 'clear':
      Trace.clear()
      render()
      break
    case 'download':
      downloadTrace()
      break
    case 'copy-op':
      copyOp(btn.dataset.dbgId, btn)
      break
  }
}

/**
 * Trace notification is synchronous and can arrive many times inside one
 * gesture. Coalesce to a frame; a burst of forty events costs one render.
 */
function scheduleRender() {
  if (!_container || _frame != null) return
  const raf = globalThis.requestAnimationFrame ?? ((fn) => setTimeout(fn, 16))
  _frame = raf(() => { _frame = null; render() })
}

/**
 * Re-render in place. The stream has its own scroll box, and it is restored
 * rather than reset — losing your place every time a peer moves a token
 * makes the panel unusable during exactly the sync problems it is for.
 */
export function render() {
  if (!_container) return
  const prevScroll = _container.querySelector('#dbgStream')?.scrollTop ?? 0
  _container.innerHTML = debugBody(gatherDebugData())
  const stream = _container.querySelector('#dbgStream')
  if (stream) stream.scrollTop = prevScroll
}

/** Called by ui.js's refreshFromDoc, so document changes update State/Ops too. */
export function refresh() {
  if (_container) render()
}

function downloadTrace() {
  let state = null
  try { state = App?.getDebugState?.() ?? null } catch { /* trace alone is still worth having */ }
  const blob = new Blob([JSON.stringify(Trace.snapshot({ state }), null, 2)],
    { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `togetherness-trace-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function copyOp(id, btn) {
  const op = App?.getDebugState?.()?.ops?.ordered?.find(o => o.id === id)
  if (!op) return
  const text = JSON.stringify(op.mutations, null, 2)
  const done = () => {
    const was = btn.textContent
    btn.textContent = 'Copied'
    setTimeout(() => { btn.textContent = was }, 1200)
  }
  navigator.clipboard?.writeText(text).then(done).catch(() => {
    // Clipboard access is refused over plain http and in some embeddings.
    // Console is the fallback that always works.
    console.log(text)
    btn.textContent = 'See console'
  })
}
