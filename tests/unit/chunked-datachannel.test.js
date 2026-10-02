import { describe, it, expect } from 'vitest';
import { split, Reassembler, CHUNK_SIZE, ChunkedDataChannel } from '../../src/chunked_datachannel.js';

const same = (a, b) => Buffer.from(a).equals(Buffer.from(b));
const make = (n) => Uint8Array.from({ length: n }, (_, i) => (i * 31 + 7) & 0xff);

function roundTrip(bytes) {
  const r = new Reassembler();
  let out = null;
  for (const f of split(bytes, 1)) out = r.push(f) ?? out;
  return out;
}

describe('split / Reassembler', () => {
  for (const n of [0, 1, CHUNK_SIZE - 1, CHUNK_SIZE, CHUNK_SIZE + 1, 300_000, 5_000_000]) {
    it(`round-trips ${n} bytes`, () => {
      const bytes = make(n);
      expect(same(roundTrip(bytes), bytes)).toBe(true);
    });
  }

  it('sends messages at or below the chunk size as one frame', () => {
    expect(split(make(0), 0)).toHaveLength(1);
    expect(split(make(CHUNK_SIZE), 0)).toHaveLength(1);
    expect(split(make(CHUNK_SIZE + 1), 0)).toHaveLength(2);
  });

  it('keeps every frame within header + chunk size', () => {
    for (const f of split(make(300_000), 5)) expect(f.length).toBeLessThanOrEqual(CHUNK_SIZE + 9);
  });

  it('reassembles interleaved messages independently', () => {
    const a = make(50_000), b = make(70_000).reverse();
    const fa = split(a, 1), fb = split(b, 2);
    const r = new Reassembler();
    const done = [];
    const n = Math.max(fa.length, fb.length);
    for (let i = 0; i < n; i++) {
      for (const f of [fa[i], fb[i]]) {
        const m = f && r.push(f);
        if (m) done.push(m);
      }
    }
    expect(done).toHaveLength(2);
    expect(done.some(m => same(m, a))).toBe(true);
    expect(done.some(m => same(m, b))).toBe(true);
  });

  it('discards a partial message on clear', () => {
    const r = new Reassembler();
    const frames = split(make(100_000), 9);
    for (const f of frames.slice(0, -1)) expect(r.push(f)).toBeNull();
    expect(r.pending).toBe(1);
    r.clear();
    expect(r.pending).toBe(0);
    expect(r.push(frames.at(-1))).toBeNull();
  });
});

describe('ChunkedDataChannel', () => {
  function fakeRaw() {
    return { readyState: 'open', bufferedAmount: 0, sent: [], send(f) { this.sent.push(f); }, close() {} };
  }

  it('chunks send() and delivers reassembled messages', () => {
    const tx = fakeRaw(), rx = fakeRaw();
    const a = new ChunkedDataChannel(tx), b = new ChunkedDataChannel(rx);
    const got = [];
    b.onmessage = (e) => got.push(new Uint8Array(e.data));
    const bytes = make(100_000);
    a.send(bytes);
    for (const f of tx.sent) rx.onmessage({ data: f.buffer.slice(f.byteOffset, f.byteOffset + f.byteLength) });
    expect(tx.sent.length).toBeGreaterThan(1);
    expect(got).toHaveLength(1);
    expect(same(got[0], bytes)).toBe(true);
  });

  it('holds frames back above the high-water mark and drains on bufferedamountlow', () => {
    const raw = fakeRaw();
    const ch = new ChunkedDataChannel(raw);
    raw.send = function (f) { this.sent.push(f); this.bufferedAmount += f.length; };
    ch.send(make(5_000_000));
    const first = raw.sent.length;
    expect(first).toBeLessThan(Math.ceil(5_000_000 / CHUNK_SIZE));
    expect(ch.bufferedAmount).toBeGreaterThan(raw.bufferedAmount);
    raw.bufferedAmount = 0;
    raw.onbufferedamountlow({});
    expect(raw.sent.length).toBeGreaterThan(first);
  });

  it('drops a partial message when the channel closes', () => {
    const raw = fakeRaw();
    const ch = new ChunkedDataChannel(raw);
    const got = [];
    ch.onmessage = (e) => got.push(e);
    const frames = split(make(100_000), 3);
    for (const f of frames.slice(0, -1)) raw.onmessage({ data: f });
    raw.onclose({});
    raw.onmessage({ data: frames.at(-1) });
    expect(got).toEqual([]);
  });
});
