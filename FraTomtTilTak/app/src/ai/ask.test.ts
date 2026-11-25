// Client tests with a fake fetch (AD-19). No key, no network.
import { describe, expect, it, vi } from 'vitest';
import { createAdviser, type Question } from './ask';
import type { Fact } from './contract';
import type { PreparedAnswer } from './prepared';

const facts: Fact[] = [{ id: 'frameWeeks', label: 'Råbygg, sammenlignbare prosjekter', value: '18 uker' }];
const prepared: PreparedAnswer[] = [
  { id: 'reserve', step: 'risk', question: 'Hvor stor reserve trenger jeg?', render: () => 'Om reserve.' },
  { id: 'frame', step: 'estimate', question: 'Hvor lang tid tar råbygget?', render: f => `Råbygget tok ${f[0].value}.` },
  { id: 'crew', step: 'estimate', question: 'Hjelper det med flere arbeidere?', keywords: ['mannskap'], render: () => 'Om mannskap.' },
];
const q: Question = { step: 'estimate', question: 'Hvorfor tar råbygget så lang tid?', facts };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** A fake fetch: status route says `live`, the adviser route answers with `reply`. */
function fakeFetch(live: boolean, reply: () => Promise<Response> | Response) {
  return vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url) === '/api/adviser/status') return json({ live });
    if (init?.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    return reply();
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

const goodReply = { answer: 'Sammenlignbare prosjekter brukte 18 uker.', basis: 'Råbygg, sammenlignbare prosjekter', onTopic: true };

describe('createAdviser', () => {
  it('shows a model reply that passes the figure check', async () => {
    const f = fakeFetch(true, () => json(goodReply));
    const a = await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask(q);
    expect(a).toEqual({ source: 'model', text: goodReply.answer, basis: goodReply.basis, onTopic: true });
  });

  it('only calls relative /api paths, never Claude directly', async () => {
    const f = fakeFetch(true, () => json(goodReply));
    await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask(q);
    const urls = f.mock.calls.map(c => String(c[0]));
    expect(urls).toEqual(['/api/adviser/status', '/api/adviser']);
  });

  it('discards a reply with a deliberately wrong figure, counts it and shows the nearest prepared answer', async () => {
    const f = fakeFetch(true, () => json({ ...goodReply, answer: 'Sammenlignbare prosjekter brukte 11 uker.' }));
    const adviser = createAdviser({ fetch: f, prepared, playthroughId: 'p' });
    const a = await adviser.ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'guard', caption: 'Forberedt svar', preparedId: 'frame', text: 'Råbygget tok 18 uker.' });
    expect(adviser.stats()).toEqual({ calls: 1, discards: 1 });
  });

  it('discards a reply whose basis has a wrong figure', async () => {
    const f = fakeFetch(true, () => json({ ...goodReply, basis: 'Bygger på 5 prosjekter.' }));
    const adviser = createAdviser({ fetch: f, prepared, playthroughId: 'p' });
    expect((await adviser.ask(q)).source).toBe('prepared');
    expect(adviser.stats().discards).toBe(1);
  });

  it('with live: false, answers from prepared answers and asks the status route only once', async () => {
    const f = fakeFetch(false, () => json(goodReply));
    const adviser = createAdviser({ fetch: f, prepared, playthroughId: 'p' });
    expect(await adviser.ask(q)).toMatchObject({ source: 'prepared', reason: 'offline' });
    await adviser.ask(q);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("treats Vite's HTML fallback on the status route as not live", async () => {
    const f = vi.fn(async () => new Response('<!doctype html><html></html>', { status: 200, headers: { 'content-type': 'text/html' } }));
    const a = await createAdviser({ fetch: f as unknown as typeof fetch, prepared, playthroughId: 'p' }).ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'offline' });
  });

  it('treats a failing status route as not live', async () => {
    const f = vi.fn(async () => {
      throw new TypeError('network');
    });
    const a = await createAdviser({ fetch: f as unknown as typeof fetch, prepared, playthroughId: 'p' }).ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'offline' });
  });

  it.each([429, 502, 503, 504, 400])('falls back on status %i, with a one-line reason and no error', async status => {
    const f = fakeFetch(true, () => json({ error: status }, status));
    const a = await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'unavailable', caption: 'Forberedt svar' });
    if (a.source === 'prepared') expect(a.why).not.toMatch(/feil|error/i);
  });

  it('falls back on a network error', async () => {
    const f = fakeFetch(true, () => {
      throw new TypeError('network');
    });
    expect(await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask(q)).toMatchObject({ reason: 'unavailable' });
  });

  it('falls back on a reply of the wrong shape', async () => {
    const f = fakeFetch(true, () => json({ text: 'hei' }));
    expect(await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask(q)).toMatchObject({ reason: 'unavailable' });
  });

  it('falls back when the server does not answer in time', async () => {
    const f = vi.fn((url: string, init?: RequestInit) => {
      if (url === '/api/adviser/status') return Promise.resolve(json({ live: true }));
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    const a = await createAdviser({ fetch: f as unknown as typeof fetch, prepared, playthroughId: 'p', timeoutMs: 20 }).ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'timeout' });
  });

  it('stops calling after the limit per playthrough', async () => {
    const f = fakeFetch(true, () => json(goodReply));
    const adviser = createAdviser({ fetch: f, prepared, playthroughId: 'p', maxCalls: 2 });
    await adviser.ask(q);
    await adviser.ask(q);
    expect(await adviser.ask(q)).toMatchObject({ source: 'prepared', reason: 'limit' });
    // One status call plus two adviser calls.
    expect(f).toHaveBeenCalledTimes(3);
    expect(adviser.stats().calls).toBe(2);
  });

  it('sends at most 500 characters and 6 history items', async () => {
    const f = fakeFetch(true, () => json(goodReply));
    const history = Array.from({ length: 9 }, (_, i) => ({ role: 'user' as const, text: `t${i}` }));
    await createAdviser({ fetch: f, prepared, playthroughId: 'p' }).ask({ ...q, question: 'x'.repeat(900), history });
    const sent = JSON.parse(String(f.mock.calls[1][1]?.body));
    expect(sent.question).toHaveLength(500);
    expect(sent.history).toHaveLength(6);
    expect(sent.history[0].text).toBe('t3');
  });

  it('still answers when no prepared answers exist yet', async () => {
    const f = fakeFetch(false, () => json(goodReply));
    const a = await createAdviser({ fetch: f, prepared: [], playthroughId: 'p' }).ask(q);
    expect(a).toMatchObject({ source: 'prepared', preparedId: null });
    expect(a.text.length).toBeGreaterThan(0);
  });
});
