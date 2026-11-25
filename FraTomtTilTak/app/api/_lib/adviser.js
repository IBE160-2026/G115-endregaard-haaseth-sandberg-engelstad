// The adviser server function (FR-17, AD-13, AD-14). It is the only code that reads
// FTTT_API_KEY or imports the Anthropic SDK. It never logs the key, the question or
// the facts. Every failure is a status code; the client then shows a prepared answer.

import Anthropic from '@anthropic-ai/sdk';
import { LIMITS, parseReply, parseRequest } from './contract.js';
import { REPLY_SCHEMA, SYSTEM_PROMPT, userMessage } from './prompt.js';
import { clientIp, createLimiter } from './ratelimit.js';

export const MODEL = 'claude-haiku-5-5';

/** The key, read on the server only. Empty strings count as missing. */
export function apiKey(env = process.env) {
  const key = env.FTTT_API_KEY;
  return typeof key === 'string' && key.trim() ? key.trim() : null;
}

/** A real SDK client with the fixed budget per call: 7 s and no retries. */
export function createClient(/** @type {string} */ key) {
  return new Anthropic({ apiKey: key, timeout: LIMITS.modelTimeoutMs, maxRetries: 0 });
}

const json = (/** @type {unknown} */ body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const fail = (/** @type {number} */ status) => json({ error: status }, status);

/** Only the status code goes to the log: no key, no question, no facts, no message text. */
function logUpstream(/** @type {unknown} */ err) {
  const status = err instanceof Anthropic.APIError ? err.status ?? 'network' : 'unknown';
  console.warn(`[adviser] model call failed (${status})`);
}

/** Maps an SDK error to the status the client sees. All of them mean "use the prepared answer". */
function statusFor(/** @type {unknown} */ err) {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return 504;
  if (err instanceof Anthropic.RateLimitError) return 429;
  // 402 (credits used up), 401 (bad key), 400, 5xx, network: the model is not available.
  return 502;
}

/**
 * @typedef {{
 *   env?: Record<string, string | undefined>,
 *   makeClient?: (key: string) => { messages: { create: (params: any) => Promise<any> } },
 *   limiter?: ReturnType<typeof createLimiter>,
 * }} Deps
 */

/** GET /api/adviser/status */
export function handleStatus(/** @type {Deps} */ deps = {}) {
  return json({ live: apiKey(deps.env) !== null });
}

const defaultLimiter = createLimiter();

/**
 * POST /api/adviser
 * @param {Request} request
 * @param {Deps} [deps]
 */
export async function handleAdviser(request, deps = {}) {
  const key = apiKey(deps.env);
  if (!key) return fail(503);

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > LIMITS.bodyBytes) return fail(413);
  let text;
  try {
    text = await request.text();
  } catch {
    return fail(400);
  }
  if (new TextEncoder().encode(text).length > LIMITS.bodyBytes) return fail(413);

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return fail(400);
  }
  const req = parseRequest(body);
  if (!req) return fail(400);

  const limiter = deps.limiter ?? defaultLimiter;
  if (!limiter.take(req.playthroughId, clientIp(request))) return fail(429);

  const client = (deps.makeClient ?? createClient)(key);
  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage(req) }],
      // Short answers on a 7 s budget: low effort keeps thinking brief.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: REPLY_SCHEMA } },
    });
  } catch (err) {
    logUpstream(err);
    return fail(statusFor(err));
  }

  // A refusal or a cut-off reply has no usable JSON.
  if (response?.stop_reason !== 'end_turn') return fail(502);
  const textBlock = (response.content ?? []).find(b => b?.type === 'text');
  let reply = null;
  try {
    reply = parseReply(JSON.parse(textBlock?.text ?? ''));
  } catch {
    reply = null;
  }
  if (!reply) return fail(502);
  return json(reply);
}
