// The one entry point for free-text questions (FR-17, AD-11, AD-12, AD-14).
// It returns a model reply that passed the figure check, or the nearest prepared answer.
// It never throws and never shows an error. It talks only to /api/adviser on the same
// site, never to Claude directly, and it holds no key.
import { NO_PREPARED_ANSWER, PREPARED_CAPTION, fallbackLine } from '../content/adviser';
import { ADVISER_PATH, CLIENT_LIMITS, STATUS_PATH, type AdviserReply, type AdviserRequest, type Fact, type Turn } from './contract';
import { guard } from './guard';
import { nearestPrepared, type PreparedAnswer } from './prepared';

/** Why a prepared answer was shown. */
export type FallbackReason = 'offline' | 'unavailable' | 'timeout' | 'limit' | 'guard';

export type Answer =
  | { source: 'model'; text: string; basis: string; onTopic: boolean }
  | { source: 'prepared'; text: string; caption: string; reason: FallbackReason; why: string; preparedId: string | null };

export interface Question {
  step: string;
  question: string;
  facts: Fact[];
  history?: Turn[];
}

export interface AdviserDeps {
  fetch: typeof fetch;
  prepared: PreparedAnswer[];
  playthroughId: string;
  timeoutMs?: number;
  maxCalls?: number;
}

export interface AdviserSession {
  ask(q: Question): Promise<Answer>;
  /** Counts for this playthrough. `discards` is the figure-check count (FR-17); no question text is kept. */
  stats(): { calls: number; discards: number };
}

/** fetch with an abort after `ms`. Rejects on timeout or network failure. */
async function fetchWithin(f: typeof fetch, url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await f(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Reads `{ live: true }`. Anything else, including Vite's HTML fallback, means not live. */
async function readLive(f: typeof fetch, ms: number): Promise<boolean> {
  try {
    const res = await fetchWithin(f, STATUS_PATH, { method: 'GET' }, ms);
    if (!res.ok) return false;
    const body: unknown = await res.json();
    return typeof body === 'object' && body !== null && (body as { live?: unknown }).live === true;
  } catch {
    return false;
  }
}

function isReply(x: unknown): x is AdviserReply {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.answer === 'string' && r.answer.length > 0 && typeof r.basis === 'string' && typeof r.onTopic === 'boolean';
}

/** One adviser per playthrough. It asks the status route once, on the first question. */
export function createAdviser(deps: AdviserDeps): AdviserSession {
  const timeoutMs = deps.timeoutMs ?? CLIENT_LIMITS.timeoutMs;
  const maxCalls = deps.maxCalls ?? CLIENT_LIMITS.callsPerPlaythrough;
  let live: Promise<boolean> | null = null;
  let calls = 0;
  let discards = 0;

  const prepared = (q: Question, reason: FallbackReason): Answer => {
    const p = nearestPrepared(q.question, q.step, deps.prepared);
    return {
      source: 'prepared',
      text: p ? p.render(q.facts) : NO_PREPARED_ANSWER,
      caption: PREPARED_CAPTION,
      reason,
      why: fallbackLine[reason],
      preparedId: p?.id ?? null,
    };
  };

  async function ask(q: Question): Promise<Answer> {
    live ??= readLive(deps.fetch, timeoutMs);
    if (!(await live)) return prepared(q, 'offline');
    if (calls >= maxCalls) return prepared(q, 'limit');
    calls++;

    const body: AdviserRequest = {
      v: 1,
      playthroughId: deps.playthroughId,
      step: q.step,
      question: q.question.slice(0, CLIENT_LIMITS.questionChars),
      history: (q.history ?? []).slice(-CLIENT_LIMITS.historyItems),
      facts: q.facts,
    };

    let res: Response;
    try {
      res = await fetchWithin(
        deps.fetch,
        ADVISER_PATH,
        { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) },
        timeoutMs,
      );
    } catch (err) {
      return prepared(q, err instanceof DOMException && err.name === 'AbortError' ? 'timeout' : 'unavailable');
    }
    if (res.status !== 200) return prepared(q, 'unavailable');

    let reply: unknown;
    try {
      reply = await res.json();
    } catch {
      return prepared(q, 'unavailable');
    }
    if (!isReply(reply)) return prepared(q, 'unavailable');

    if (!guard([reply.answer, reply.basis], q.facts)) {
      discards++;
      return prepared(q, 'guard');
    }
    return { source: 'model', text: reply.answer, basis: reply.basis, onTopic: reply.onTopic };
  }

  return { ask, stats: () => ({ calls, discards }) };
}
