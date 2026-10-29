import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { LEAD_SCHEMA_ID, type Lead } from '../src/contract/brand.ts';
import { DEMO_LABEL, parseSse, type AppConfig, type StreamEvent } from '../src/contract/stream.ts';
import { schemaErrors } from '../src/contract/validate.ts';
import { loadBrand } from './brand.ts';
import { cleanMessages, createHandler, FIXTURES_DIR, handlerFromEnv, leadErrors, MAX_BODY_BYTES, ROOT, type HandlerOptions } from './http.ts';
import { createDemoProvider, NO_PACING } from './providers/demo.ts';
import { TurnError, type Provider } from './providers/types.ts';

const servers: Server[] = [];
afterEach(() => servers.splice(0).forEach((s) => s.close()));

async function serve(opts: Partial<HandlerOptions> = {}): Promise<string> {
  const provider = opts.provider ?? createDemoProvider({ fixturesDir: FIXTURES_DIR, pacing: NO_PACING });
  const handler = createHandler({ provider, brand: loadBrand(ROOT), demoScript: (provider as { script?: string[] }).script, env: {}, ...opts });
  const server = createServer((req, res) =>
    void handler(req, res, () => {
      res.statusCode = 404;
      res.end('static');
    }),
  );
  servers.push(server);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });

const user = (content: string) => ({ role: 'user', content });

async function readEvents(res: Response): Promise<StreamEvent[]> {
  const { events, rest } = parseSse(await res.text());
  expect(rest).toBe('');
  return events;
}

const lead = (): Lead => ({
  schema: LEAD_SCHEMA_ID,
  id: 'lead-1',
  created: '2026-10-29T20:00:00Z',
  brand: 'Nordlys Byggplan',
  customer: { name: 'Kari', email: null, phone: null, note: null },
  project: { name: 'Garasje', type: 'Garasje', summary: '', length_m: 9, width_m: 7, floors: 2, roof: 'saltak' },
  budget: { total_nok: 721810, low_nok: 600000, high_nok: 800000, lines: [] },
  schedule_weeks: 14,
  risks: [],
  transcript: [{ role: 'user', text: 'Hei' }],
});

describe('the API handler', () => {
  it('GET /api/config describes the demo', async () => {
    const base = await serve();
    const config = (await (await fetch(`${base}/api/config`)).json()) as AppConfig;
    expect(config.provider).toBe('demo');
    expect(config.demoLabel).toBe(DEMO_LABEL);
    expect(config.demoScript).toHaveLength(7);
    expect(config.demoScript[0]).toBe('Dobbelgarasje med loft');
  });

  it('passes other paths on (static files)', async () => {
    const base = await serve();
    expect((await fetch(`${base}/index.html`)).status).toBe(404);
  });

  it('POST /api/turn/stream sends reply deltas and then one valid turn', async () => {
    const base = await serve();
    const res = await post(`${base}/api/turn/stream`, { messages: [user('Dobbelgarasje med loft')] });
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');
    expect(res.headers.get('cache-control')).toContain('no-cache');
    const events = await readEvents(res);
    const deltas = events.filter((e) => e.event === 'reply');
    const turns = events.filter((e) => e.event === 'turn');
    expect(deltas.length).toBeGreaterThan(10);
    expect(turns).toHaveLength(1);
    expect(events.at(-1)!.event).toBe('turn');
    const turn = turns[0].data as never;
    expect(schemaErrors(turn)).toEqual([]);
    expect(deltas.map((e) => (e.data as { delta: string }).delta).join('')).toBe((turn as { reply: string }).reply);
  });

  it('sends a provider error as an error event', async () => {
    const provider: Provider = {
      name: 'claude',
      async turn(_m, onDelta) {
        onDelta('Hei');
        throw new TurnError(502, 'Feil fra Claude (500): boom');
      },
    };
    const events = await readEvents(await post(`${await serve({ provider })}/api/turn/stream`, { messages: [user('x')] }));
    expect(events).toEqual([
      { event: 'reply', data: { delta: 'Hei' } },
      { event: 'error', data: { error: 'Feil fra Claude (500): boom' } },
    ]);
  });

  it('answers 400 for bad JSON or a dialog that does not end with the user, 405 for GET', async () => {
    const base = await serve();
    expect((await post(`${base}/api/turn/stream`, '{nope')).status).toBe(400);
    const r = await post(`${base}/api/turn/stream`, { messages: [user('a'), { role: 'assistant', content: 'b' }] });
    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: string }).error).toContain('brukeren');
    expect((await fetch(`${base}/api/turn/stream`)).status).toBe(405);
  });

  it('answers 413 for a body over 512 kB (and still delivers the answer)', async () => {
    const base = await serve();
    const res = await post(`${base}/api/turn/stream`, { messages: [user('x'.repeat(MAX_BODY_BYTES + 10))] });
    expect(res.status).toBe(413);
    expect(((await res.json()) as { error: string }).error).toContain('for lang');
  });

  it('keeps POST /api/turn (plain JSON) working', async () => {
    const base = await serve();
    const res = await post(`${base}/api/turn`, { messages: [user('a'), { role: 'assistant', content: 'b' }, user('c')] });
    expect(res.status).toBe(200);
    const turn = await res.json();
    expect(schemaErrors(turn)).toEqual([]);
    expect((turn as { phase: string }).phase).toBe('bygg');
  });

  it('rate-limits turns per IP with a Norwegian 429', async () => {
    const base = await serve({ turnLimit: { capacity: 2, windowMs: 60_000 } });
    const body = { messages: [user('a')] };
    expect((await post(`${base}/api/turn`, body)).status).toBe(200);
    expect((await post(`${base}/api/turn/stream`, body)).status).toBe(200);
    const r = await post(`${base}/api/turn`, body);
    expect(r.status).toBe(429);
    expect(r.headers.get('retry-after')).toBe('30');
    expect(((await r.json()) as { error: string }).error).toContain('For mange');
    expect((await fetch(`${base}/api/config`)).status).toBe(200);
  });

  it('POST /api/lead without a webhook answers delivered:false with the demo note', async () => {
    const base = await serve();
    const res = await post(`${base}/api/lead`, lead());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ delivered: false, note: 'Demo – i produksjon: e-post/webhook til deres CRM' });
    expect((await post(`${base}/api/lead`, { ...lead(), schema: 'x' })).status).toBe(400);
  });

  it('POST /api/lead forwards to LEAD_WEBHOOK_URL', async () => {
    const sent: unknown[] = [];
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(init.body as string));
      return new Response('ok', { status: 200 });
    }) as unknown as typeof fetch;
    const base = await serve({ env: { LEAD_WEBHOOK_URL: 'https://crm.example.com/hook' }, fetchImpl });
    const res = await post(`${base}/api/lead`, lead());
    expect(await res.json()).toMatchObject({ delivered: true });
    expect(sent).toEqual([lead()]);

    const failing = (async () => {
      throw new Error('timeout');
    }) as unknown as typeof fetch;
    const base2 = await serve({ env: { LEAD_WEBHOOK_URL: 'https://crm.example.com/hook' }, fetchImpl: failing });
    const r2 = await post(`${base2}/api/lead`, lead());
    expect(r2.status).toBe(502);
    expect(await r2.json()).toMatchObject({ delivered: false });
  });

  it('chooses the provider from the environment', async () => {
    const res = await new Promise<string>((resolve) => {
      const fake = { method: 'GET', url: '/api/config', socket: {} } as never;
      const out = { statusCode: 0, setHeader() {}, end: (s: string) => resolve(s) } as never;
      void handlerFromEnv({ ANTHROPIC_API_KEY: 'sk-test', DEMO: '1' })(fake, out, () => {});
    });
    expect(JSON.parse(res).provider).toBe('demo');
    const res2 = await new Promise<string>((resolve) => {
      const fake = { method: 'GET', url: '/api/config', socket: {} } as never;
      const out = { statusCode: 0, setHeader() {}, end: (s: string) => resolve(s) } as never;
      void handlerFromEnv({ ANTHROPIC_API_KEY: 'sk-test' })(fake, out, () => {});
    });
    expect(JSON.parse(res2)).toMatchObject({ provider: 'claude', demoScript: [] });
  });
});

describe('input checks', () => {
  it('cleanMessages keeps only text turns that start and end with the user', () => {
    expect(cleanMessages([user('a'), { role: 'system', content: 'x' }, { role: 'assistant', content: 'b', extra: 1 }, user('c')])).toEqual([
      user('a'),
      { role: 'assistant', content: 'b' },
      user('c'),
    ]);
    expect(cleanMessages('nei')).toBeNull();
    expect(cleanMessages([])).toBeNull();
    expect(cleanMessages([{ role: 'assistant', content: 'a' }, user('b')])).toBeNull();
  });

  it('leadErrors accepts a lead and names what a broken one lacks', () => {
    expect(leadErrors(lead())).toEqual([]);
    const { budget: _b, ...noBudget } = lead();
    expect(leadErrors(noBudget)).toContain('budget mangler');
    expect(leadErrors(null)).not.toEqual([]);
  });
});
