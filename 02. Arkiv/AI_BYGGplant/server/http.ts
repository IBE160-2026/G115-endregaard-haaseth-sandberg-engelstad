// The API, shared by the Vite dev/preview server (apiPlugin) and the production server (start.ts):
//   POST /api/turn/stream  SSE per src/contract/stream.ts (reply deltas, then one turn, or an error)
//   POST /api/turn         the whole turn as JSON (v0.2 compatibility)
//   GET  /api/config       AppConfig
//   POST /api/lead         a Lead; forwarded to LEAD_WEBHOOK_URL when it is set
// Errors before the stream starts are JSON { error } with a status (400, 405, 413, 429, 503).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { LEAD_SCHEMA_ID, type Brand } from '../src/contract/brand.ts';
import { DEMO_LABEL, sseFrame, type AppConfig } from '../src/contract/stream.ts';
import type { ChatMessage } from '../src/contract/types.ts';
import { loadBrand } from './brand.ts';
import { createClaudeProvider } from './providers/claude.ts';
import { createDemoProvider, loadDialog, NO_PACING } from './providers/demo.ts';
import { TurnError, type Provider } from './providers/types.ts';
import { createRateLimiter, type RateLimiter } from './ratelimit.ts';

/** The longest body we accept (the dialog with the project JSON, or a lead). */
export const MAX_BODY_BYTES = 512 * 1024;

export const ROOT = join(import.meta.dirname, '..');
export const FIXTURES_DIR = join(ROOT, 'fixtures');

/** Keeps only well-formed text turns, and requires the dialog to start and end with the user. */
export function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const messages = input
    .filter(
      (m): m is ChatMessage =>
        !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '',
    )
    .map((m) => ({ role: m.role, content: m.content }));
  if (messages.length === 0 || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

/** Problems with a lead body; empty means it looks like a Lead. */
export function leadErrors(x: unknown): string[] {
  const l = x as Record<string, any> | null;
  if (!l || typeof l !== 'object' || Array.isArray(l)) return ['ikke et objekt'];
  const errors: string[] = [];
  if (l.schema !== LEAD_SCHEMA_ID) errors.push(`schema må være ${LEAD_SCHEMA_ID}`);
  for (const k of ['id', 'created', 'brand']) if (typeof l[k] !== 'string' || !l[k]) errors.push(`${k} mangler`);
  if (!l.customer || typeof l.customer !== 'object') errors.push('customer mangler');
  if (!l.project || typeof l.project !== 'object' || typeof l.project.name !== 'string') errors.push('project mangler');
  if (!l.budget || typeof l.budget !== 'object' || !Number.isFinite(l.budget.total_nok) || !Array.isArray(l.budget.lines))
    errors.push('budget mangler');
  if (!Number.isFinite(l.schedule_weeks)) errors.push('schedule_weeks mangler');
  if (!Array.isArray(l.risks)) errors.push('risks mangler');
  if (!Array.isArray(l.transcript)) errors.push('transcript mangler');
  return errors;
}

class TooLarge extends Error {}

/** Reads the body; on more than MAX_BODY_BYTES it rejects but keeps draining, so the 413 still arrives. */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk: Buffer) => {
      if (tooLarge) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        reject(new TooLarge());
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(data));
}

const TOO_LARGE = 'Samtalen er for lang. Start et nytt prosjekt, eller eksporter og begynn på nytt.';
const BAD_DIALOG = 'Dialogen må starte og slutte med brukeren.';

export interface HandlerOptions {
  provider: Provider;
  brand: Brand | null;
  /** The user lines of the demo dialog (AppConfig.demoScript). */
  demoScript?: string[];
  /** Every scripted demo dialog the browser may pick (body.demo), with its own providers. */
  demos?: { id: string; title: string; script: string[]; provider: Provider; plainProvider: Provider }[];
  /** A faster provider for the non-streaming /api/turn (the demo without pacing). */
  plainProvider?: Provider;
  env?: Record<string, string | undefined>;
  now?: () => number;
  fetchImpl?: typeof fetch;
  /** 20 turns per 10 minutes per IP by default. */
  turnLimit?: { capacity: number; windowMs: number };
  /** 10 leads per 10 minutes per IP by default. */
  leadLimit?: { capacity: number; windowMs: number };
}

export type Handler = (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>;

export function createHandler(opts: HandlerOptions): Handler {
  const env = opts.env ?? process.env;
  const doFetch = opts.fetchImpl ?? fetch;
  const turns: RateLimiter = createRateLimiter({ ...(opts.turnLimit ?? { capacity: 20, windowMs: 10 * 60_000 }), now: opts.now });
  const leads: RateLimiter = createRateLimiter({ ...(opts.leadLimit ?? { capacity: 10, windowMs: 10 * 60_000 }), now: opts.now });
  const config: AppConfig = {
    provider: opts.provider.name,
    demoLabel: DEMO_LABEL,
    demoScript: opts.provider.name === 'demo' ? (opts.demoScript ?? []) : [],
    demoDialogs: opts.provider.name === 'demo' ? (opts.demos ?? []).map(({ id, title, script }) => ({ id, title, script })) : [],
  };
  /** The demo dialog the request names (body.demo), or the default provider. */
  const pick = (body: unknown, plain: boolean): Provider => {
    const id = (body as { demo?: unknown } | null)?.demo;
    const d = typeof id === 'string' ? opts.demos?.find((x) => x.id === id) : undefined;
    return d ? (plain ? d.plainProvider : d.provider) : plain ? (opts.plainProvider ?? opts.provider) : opts.provider;
  };

  /** False (and a 429 sent) when this IP has used up its bucket. */
  function allowed(limiter: RateLimiter, req: IncomingMessage, res: ServerResponse): boolean {
    const r = limiter.take(req.socket.remoteAddress ?? 'ukjent');
    if (r.ok) return true;
    const min = Math.max(1, Math.ceil(r.retryAfterS / 60));
    send(res, 429, { error: `For mange forespørsler fra deg på kort tid. Vent ${min} min og prøv igjen.` }, { 'Retry-After': String(r.retryAfterS) });
    return false;
  }

  /** The body as JSON, or null after sending 400/413. */
  async function jsonBody(req: IncomingMessage, res: ServerResponse): Promise<unknown | null> {
    try {
      return JSON.parse(await readBody(req)) as unknown;
    } catch (error) {
      if (error instanceof TooLarge) send(res, 413, { error: TOO_LARGE }, { Connection: 'close' });
      else send(res, 400, { error: 'Ugyldig forespørsel.' });
      return null;
    }
  }

  /** An AbortSignal that fires when the client goes away before the response is finished. */
  function clientSignal(res: ServerResponse): AbortSignal {
    const ac = new AbortController();
    res.on('close', () => {
      if (!res.writableFinished) ac.abort();
    });
    return ac.signal;
  }

  async function streamTurn(req: IncomingMessage, res: ServerResponse) {
    const body = await jsonBody(req, res);
    if (body === null) return;
    const messages = cleanMessages((body as { messages?: unknown } | null)?.messages);
    if (!messages) return send(res, 400, { error: BAD_DIALOG });

    const signal = clientSignal(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    const write = (frame: string) => {
      if (!res.writableEnded && !signal.aborted) res.write(frame);
    };
    try {
      const turn = await pick(body, false).turn(messages, (delta) => write(sseFrame({ event: 'reply', data: { delta } })), signal);
      write(sseFrame({ event: 'turn', data: turn }));
    } catch (error) {
      if (!signal.aborted) write(sseFrame({ event: 'error', data: { error: errorText(error) } }));
    }
    if (!res.writableEnded) res.end();
  }

  async function plainTurn(req: IncomingMessage, res: ServerResponse) {
    const body = await jsonBody(req, res);
    if (body === null) return;
    const messages = cleanMessages((body as { messages?: unknown } | null)?.messages);
    if (!messages) return send(res, 400, { error: BAD_DIALOG });
    const signal = clientSignal(res);
    try {
      const turn = await pick(body, true).turn(messages, () => {}, signal);
      if (!signal.aborted) send(res, 200, turn);
    } catch (error) {
      if (!signal.aborted) send(res, error instanceof TurnError ? error.status : 500, { error: errorText(error) });
    }
  }

  async function lead(req: IncomingMessage, res: ServerResponse) {
    const body = await jsonBody(req, res);
    if (body === null) return;
    const errors = leadErrors(body);
    if (errors.length) return send(res, 400, { error: `Ugyldig lead: ${errors.slice(0, 3).join(', ')}.` });
    const url = env.LEAD_WEBHOOK_URL;
    if (!url) return send(res, 200, { delivered: false, note: 'Demo – i produksjon: e-post/webhook til deres CRM' });
    try {
      const r = await doFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) return send(res, 502, { delivered: false, note: `Forhandlerens webhook svarte med feil (${r.status}).` });
      send(res, 200, { delivered: true, note: 'Sendt til forhandleren.' });
    } catch {
      send(res, 502, { delivered: false, note: 'Fikk ikke kontakt med forhandlerens webhook. Prøv igjen senere.' });
    }
  }

  return async (req, res, next) => {
    const path = (req.url ?? '').split('?')[0];
    const routes: Record<string, () => Promise<void> | void> = {
      '/api/config': () => (req.method === 'GET' ? send(res, 200, config) : send(res, 405, { error: 'Bruk GET.' })),
      '/api/turn/stream': () => post(turns, streamTurn),
      '/api/turn': () => post(turns, plainTurn),
      '/api/lead': () => post(leads, lead),
    };
    async function post(limiter: RateLimiter, fn: (req: IncomingMessage, res: ServerResponse) => Promise<void>) {
      if (req.method !== 'POST') return send(res, 405, { error: 'Bruk POST.' });
      if (!allowed(limiter, req, res)) {
        req.resume(); // drain the body we will not read
        return;
      }
      await fn(req, res);
    }
    const route = routes[path];
    if (!route) return next();
    try {
      await route();
    } catch (error) {
      if (!res.headersSent) send(res, 500, { error: errorText(error) });
      else if (!res.writableEnded) res.end();
    }
  };
}

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Claude when ANTHROPIC_API_KEY is set and DEMO is not '1'; otherwise the scripted demo. */
export function handlerFromEnv(env: Record<string, string | undefined>, root = ROOT): Handler {
  const brand = loadBrand(root);
  const fixturesDir = join(root, 'fixtures');
  const dialog = env.DEMO_DIALOG || 'garage';
  if (env.ANTHROPIC_API_KEY && env.DEMO !== '1') {
    return createHandler({ provider: createClaudeProvider({ apiKey: env.ANTHROPIC_API_KEY, brand }), brand, env });
  }
  const demos = readdirSync(fixturesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const provider = createDemoProvider({ fixturesDir, dialog: d.name });
      const title = loadDialog(fixturesDir, d.name)[0].turn.project.name || d.name;
      return { id: d.name, title, script: provider.script, provider, plainProvider: createDemoProvider({ fixturesDir, dialog: d.name, pacing: NO_PACING }) };
    })
    // The default dialog first, the rest by name.
    .sort((a, b) => (a.id === dialog ? -1 : b.id === dialog ? 1 : a.id.localeCompare(b.id)));
  const first = demos.find((d) => d.id === dialog) ?? demos[0];
  return createHandler({ provider: first.provider, plainProvider: first.plainProvider, demoScript: first.script, demos, brand, env });
}

/** The API in the Vite dev server and `vite preview`. */
export function apiPlugin(env: Record<string, string | undefined>): Plugin {
  let handler: Handler | null = null;
  const get = () => (handler ??= handlerFromEnv(env));
  const use = (req: IncomingMessage, res: ServerResponse, next: () => void) => void get()(req, res, next);
  return {
    name: 'ai-byggplant-api',
    configureServer(server) {
      server.middlewares.use(use);
    },
    configurePreviewServer(server) {
      server.middlewares.use(use);
    },
  };
}
