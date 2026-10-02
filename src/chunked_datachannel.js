/**
 * Splits outgoing RTCDataChannel messages into 16 KiB frames and
 * reassembles them on receipt, because browsers cap one message (Chrome:
 * 256 KiB) and a larger send closes the channel.
 *
 * Wire frame, one header per frame:
 *   byte 0 = 0  whole message, payload follows
 *   byte 0 = 1  chunk: msgId u32, index u16, count u16, payload slice
 *
 * Every peer runs the same build, so there is no version negotiation.
 *
 * makeChunkedWrtc() returns a `wrtc` option for simple-peer (via y-webrtc's
 * peerOpts) whose RTCPeerConnection hands simple-peer wrapped channels.
 */

export const CHUNK_SIZE = 16 * 1024;
const HEADER_WHOLE = 1;
const HEADER_CHUNK = 9;
const MAX_CHUNKS   = 0xffff;

const SEND_HIGH_WATER = 1024 * 1024;
const SEND_LOW_WATER  = 256 * 1024;

const toBytes = (data) => {
  if (typeof data === 'string') return new TextEncoder().encode(data);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  throw new TypeError('unsupported data channel payload');
};

/** Frames for one message; a message of CHUNK_SIZE bytes or fewer is one frame. */
export function split(data, msgId) {
  const bytes = toBytes(data);
  if (bytes.length <= CHUNK_SIZE) {
    const frame = new Uint8Array(HEADER_WHOLE + bytes.length);
    frame[0] = 0;
    frame.set(bytes, HEADER_WHOLE);
    return [frame];
  }
  const count = Math.ceil(bytes.length / CHUNK_SIZE);
  if (count > MAX_CHUNKS) throw new RangeError('message too large to chunk');
  const frames = [];
  for (let i = 0; i < count; i++) {
    const slice = bytes.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const frame = new Uint8Array(HEADER_CHUNK + slice.length);
    const view  = new DataView(frame.buffer);
    frame[0] = 1;
    view.setUint32(1, msgId >>> 0);
    view.setUint16(5, i);
    view.setUint16(7, count);
    frame.set(slice, HEADER_CHUNK);
    frames.push(frame);
  }
  return frames;
}

/** Per-channel frame reassembly; push() returns a message when one completes. */
export class Reassembler {
  constructor() { this._partial = new Map(); }

  push(frame) {
    const bytes = toBytes(frame);
    if (bytes[0] === 0) return bytes.subarray(HEADER_WHOLE);
    if (bytes[0] !== 1 || bytes.length < HEADER_CHUNK) return null;

    const view  = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const id    = view.getUint32(1);
    const index = view.getUint16(5);
    const count = view.getUint16(7);
    if (count === 0 || index >= count) return null;

    let entry = this._partial.get(id);
    if (!entry) {
      entry = { count, parts: new Array(count), received: 0, size: 0 };
      this._partial.set(id, entry);
    }
    if (entry.count !== count || entry.parts[index]) return null;
    const payload = bytes.subarray(HEADER_CHUNK);
    entry.parts[index] = payload;
    entry.received++;
    entry.size += payload.length;
    if (entry.received < entry.count) return null;

    this._partial.delete(id);
    const out = new Uint8Array(entry.size);
    let offset = 0;
    for (const part of entry.parts) { out.set(part, offset); offset += part.length; }
    return out;
  }

  /** Drop every partially received message. */
  clear() { this._partial.clear(); }

  get pending() { return this._partial.size; }
}

/**
 * Stands in for an RTCDataChannel from simple-peer's point of view: the
 * handlers and properties it touches are forwarded, while send() chunks
 * and incoming messages are reassembled.
 */
export class ChunkedDataChannel {
  constructor(raw) {
    this._raw = raw;
    this._reassembler = new Reassembler();
    this._queue = [];
    this._queuedBytes = 0;
    this._nextId = 0;
    this._lowThreshold = 0;

    this.onmessage = this.onopen = this.onclose = this.onerror = this.onbufferedamountlow = null;

    raw.binaryType = 'arraybuffer';
    raw.bufferedAmountLowThreshold = SEND_LOW_WATER;
    raw.onopen    = (e) => this.onopen?.(e);
    raw.onerror   = (e) => this.onerror?.(e);
    raw.onclose   = (e) => {
      this._reassembler.clear();
      this._queue.length = 0;
      this._queuedBytes = 0;
      this.onclose?.(e);
    };
    raw.onmessage = (e) => {
      const msg = this._reassembler.push(e.data);
      if (msg) this.onmessage?.({ data: msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength) });
    };
    raw.onbufferedamountlow = (e) => {
      this._pump();
      if (this.bufferedAmount <= this._lowThreshold) this.onbufferedamountlow?.(e);
    };
  }

  get label()      { return this._raw.label; }
  get readyState() { return this._raw.readyState; }
  get bufferedAmount() { return this._raw.bufferedAmount + this._queuedBytes; }

  get binaryType()  { return this._raw.binaryType; }
  set binaryType(_) {}

  get bufferedAmountLowThreshold() { return this._lowThreshold; }
  set bufferedAmountLowThreshold(v) { this._lowThreshold = v; }

  send(data) {
    const frames = split(data, this._nextId++);
    for (const f of frames) { this._queue.push(f); this._queuedBytes += f.length; }
    this._pump();
  }

  close() { this._raw.close(); }

  _pump() {
    const raw = this._raw;
    while (this._queue.length && raw.readyState === 'open' && raw.bufferedAmount < SEND_HIGH_WATER) {
      const frame = this._queue.shift();
      this._queuedBytes -= frame.length;
      raw.send(frame);
    }
  }
}

/**
 * A `wrtc` object for simple-peer. Built on demand so importing this
 * module doesn't require a browser.
 */
export function makeChunkedWrtc(g = globalThis) {
  const Base = g.RTCPeerConnection;

  class ChunkedPeerConnection extends Base {
    constructor(config) {
      super(config);
      this._onDataChannel = null;
      this.addEventListener('datachannel', (e) => {
        this._onDataChannel?.({ channel: new ChunkedDataChannel(e.channel) });
      });
    }
    get ondatachannel()  { return this._onDataChannel; }
    set ondatachannel(f) { this._onDataChannel = f; }
    createDataChannel(...args) {
      return new ChunkedDataChannel(super.createDataChannel(...args));
    }
  }

  return {
    RTCPeerConnection:     ChunkedPeerConnection,
    RTCSessionDescription: g.RTCSessionDescription,
    RTCIceCandidate:       g.RTCIceCandidate,
  };
}
