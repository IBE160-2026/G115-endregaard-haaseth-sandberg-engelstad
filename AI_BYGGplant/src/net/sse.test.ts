import { describe, expect, it } from 'vitest';
import { sseFrame } from '../contract/stream';
import type { AiTurn } from '../contract/types';
import { createSseBuffer, fetchConfig, MSG_BAD_DATA, MSG_INCOMPLETE, MSG_OFFLINE, readStream, streamTurn, type TurnCallbacks } from './sse';

const turn: AiTurn = {
  reply: 'Hei',
  questions: [],
  phase: 'tomt',
  changes: [],
  project: { name: 'G', type: 'Garasje', summary: '', facts: null, building: null, budget: null, schedule: null, risks: null, assumptions: null },
};

/** A fake body that hands out the given chunks one by one (as bytes). */
function body(chunks: (string | Uint8Array)[], opts: { hang?: boolean } = {}) {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(ctrl) {
      if (i < chunks.length) {
        const c = chunks[i++];
        ctrl.enqueue(typeof c === 'string' ? enc.encode(c) : c);
      } else if (!opts.hang) ctrl.close();
      // hang: never closes, like a server that is still thinking
    },
  });
}

function recorder() {
  const log = { replies: [] as string[], turns: [] as AiTurn[], errors: [] as string[] };
  const cb: TurnCallbacks = {
    onReply: (d) => log.replies.push(d),
    onTurn: (t) => log.turns.push(t),
    onError: (m) => log.errors.push(m),
  };
  return { log, cb };
}

const full = sseFrame({ event: 'reply', data: { delta: 'Hei, ' } }) + sseFrame({ event: 'reply', data: { delta: 'æøå!' } }) + sseFrame({ event: 'turn', data: turn });

describe('createSseBuffer', () => {
  it('keeps an unfinished event until the rest arrives', () => {
    const b = createSseBuffer();
    expect(b.push('event: reply\ndata: {"del')).toEqual([]);
    expect(b.push('ta":"a"}\n\nevent: reply\n')).toEqual([{ event: 'reply', data: { delta: 'a' } }]);
    expect(b.push('data: {"delta":"b"}\n\n')).toEqual([{ event: 'reply', data: { delta: 'b' } }]);
  });
  it('accepts CRLF line endings', () => {
    expect(createSseBuffer().push('event: reply\r\ndata: {"delta":"x"}\r\n\r\n')).toEqual([{ event: 'reply', data: { delta: 'x' } }]);
  });
  it('flushes a last event without its blank line', () => {
    const b = createSseBuffer();
    b.push('event: reply\ndata: {"delta":"z"}');
    expect(b.flush()).toEqual([{ event: 'reply', data: { delta: 'z' } }]);
  });
});

describe('readStream', () => {
  it('streams replies then the turn', async () => {
    const { log, cb } = recorder();
    expect(await readStream(body([full]), cb)).toBe('turn');
    expect(log.replies.join('')).toBe('Hei, æøå!');
    expect(log.turns).toEqual([turn]);
    expect(log.errors).toEqual([]);
  });

  it('handles chunks split anywhere, even inside a multi-byte character', async () => {
    const bytes = new TextEncoder().encode(full);
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < bytes.length; i += 3) chunks.push(bytes.slice(i, i + 3));
    const { log, cb } = recorder();
    expect(await readStream(body(chunks), cb)).toBe('turn');
    expect(log.replies.join('')).toBe('Hei, æøå!');
    expect(log.turns).toHaveLength(1);
  });

  it('reports a stream that ends without a turn', async () => {
    const { log, cb } = recorder();
    expect(await readStream(body([sseFrame({ event: 'reply', data: { delta: 'Halv' } })]), cb)).toBe('error');
    expect(log.replies).toEqual(['Halv']);
    expect(log.errors).toEqual([MSG_INCOMPLETE]);
  });

  it('passes on the server error', async () => {
    const { log, cb } = recorder();
    expect(await readStream(body([sseFrame({ event: 'error', data: { error: 'For mange forespørsler.' } })]), cb)).toBe('error');
    expect(log.errors).toEqual(['For mange forespørsler.']);
  });

  it('reports unreadable data', async () => {
    const { log, cb } = recorder();
    expect(await readStream(body(['event: turn\ndata: {nope\n\n']), cb)).toBe('error');
    expect(log.errors).toEqual([MSG_BAD_DATA]);
  });

  it('stops quietly on abort, without calling back', async () => {
    const ctrl = new AbortController();
    const { log, cb } = recorder();
    const done = readStream(body([sseFrame({ event: 'reply', data: { delta: 'a' } })], { hang: true }), cb, ctrl.signal);
    await new Promise((r) => setTimeout(r, 10));
    ctrl.abort();
    expect(await done).toBe('aborted');
    expect(log.replies).toEqual(['a']);
    expect(log.errors).toEqual([]);
    expect(log.turns).toEqual([]);
  });

  it('does nothing when already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const { log, cb } = recorder();
    expect(await readStream(body([full]), cb, ctrl.signal)).toBe('aborted');
    expect(log.turns).toEqual([]);
  });
});

describe('streamTurn', () => {
  it('posts the messages and reads the stream', async () => {
    let sent: RequestInit | undefined;
    const fake = (async (_url: string, init?: RequestInit) => {
      sent = init;
      return new Response(body([full]), { headers: { 'Content-Type': 'text/event-stream' } });
    }) as typeof fetch;
    const { log, cb } = recorder();
    expect(await streamTurn([{ role: 'user', content: 'Garasje' }], cb, undefined, fake)).toBe('turn');
    expect(JSON.parse(String(sent?.body))).toEqual({ messages: [{ role: 'user', content: 'Garasje' }] });
    expect(log.turns).toHaveLength(1);
  });
  it('shows the JSON error of a failed response', async () => {
    const fake = (async () => new Response(JSON.stringify({ error: 'Vent litt.' }), { status: 429 })) as typeof fetch;
    const { log, cb } = recorder();
    expect(await streamTurn([], cb, undefined, fake)).toBe('error');
    expect(log.errors).toEqual(['Vent litt.']);
  });
  it('explains a network failure', async () => {
    const fake = (async () => {
      throw new TypeError('Failed to fetch');
    }) as typeof fetch;
    const { log, cb } = recorder();
    expect(await streamTurn([], cb, undefined, fake)).toBe('error');
    expect(log.errors).toEqual([MSG_OFFLINE]);
  });
  it('treats an aborted fetch as aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const fake = (async () => {
      throw new DOMException('aborted', 'AbortError');
    }) as typeof fetch;
    const { log, cb } = recorder();
    expect(await streamTurn([], cb, ctrl.signal, fake)).toBe('aborted');
    expect(log.errors).toEqual([]);
  });
});

describe('fetchConfig', () => {
  it('reads the demo config', async () => {
    const fake = (async () => new Response(JSON.stringify({ provider: 'demo', demoLabel: 'Demo', demoScript: ['a', 'b'] }))) as typeof fetch;
    expect(await fetchConfig(fake)).toEqual({ provider: 'demo', demoLabel: 'Demo', demoScript: ['a', 'b'] });
  });
  it('falls back when the server is missing', async () => {
    const fake = (async () => new Response('nope', { status: 404 })) as typeof fetch;
    expect((await fetchConfig(fake)).provider).toBe('claude');
  });
});
