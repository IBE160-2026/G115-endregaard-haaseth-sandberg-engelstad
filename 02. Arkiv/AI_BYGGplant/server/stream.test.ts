import { describe, expect, it } from 'vitest';
import { parseSse, sseFrame, type StreamEvent } from '../src/contract/stream.ts';
import { loadDialog } from './providers/demo.ts';
import { FIXTURES_DIR } from './http.ts';

describe('SSE framing', () => {
  const turn = loadDialog(FIXTURES_DIR, 'garage')[4].turn;
  const events: StreamEvent[] = [
    { event: 'reply', data: { delta: 'Hei\n\nder «æøå» 🏠' } },
    { event: 'reply', data: { delta: 'data: event: lurt' } },
    { event: 'turn', data: turn },
    { event: 'error', data: { error: 'Noe gikk galt.' } },
  ];
  const text = events.map(sseFrame).join('');

  it('round-trips through parseSse, also when the text arrives in arbitrary pieces', () => {
    expect(parseSse(text)).toEqual({ events, rest: '' });
    for (const size of [1, 7, 64, 1000]) {
      let buffer = '';
      const got: StreamEvent[] = [];
      for (let i = 0; i < text.length; i += size) {
        const r = parseSse(buffer + text.slice(i, i + size));
        got.push(...r.events);
        buffer = r.rest;
      }
      expect(got).toEqual(events);
      expect(buffer).toBe('');
    }
  });

  it('keeps every frame on one data line (no raw newlines inside)', () => {
    for (const e of events) expect(sseFrame(e).split('\n').filter(Boolean)).toHaveLength(2);
  });
});
