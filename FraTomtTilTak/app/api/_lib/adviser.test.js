// Server function tests (FR-17, AD-19). No key, no network: the model call is a fake.
import Anthropic from '@anthropic-ai/sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MODEL, createClient, handleAdviser, handleStatus } from './adviser.js';
import { LIMITS } from './contract.js';
import { createLimiter } from './ratelimit.js';

const FAKE_KEY = 'sk-test-not-a-real-key-123';
const env = { FTTT_API_KEY: FAKE_KEY };

const validBody = (over = {}) => ({
  v: 1,
  playthroughId: 'p-1',
  step: 'estimate',
  question: 'Hvorfor tar rammen så lang tid?',
  history: [],
  facts: [{ id: 'frameWeeks', label: 'Råbygg, sammenlignbare prosjekter', value: '18 uker' }],
  ...over,
});

const post = (body, headers = {}) =>
  new Request('https://example.test/api/adviser', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const modelResponse = (reply, stop_reason = 'end_turn') => ({
  stop_reason,
  content: [{ type: 'text', text: JSON.stringify(reply) }],
});

function fakeClient(result) {
  const create = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  return { create, makeClient: () => ({ messages: { create } }) };
}

const okReply = { answer: 'Sammenlignbare prosjekter brukte 18 uker på råbygget.', basis: 'Råbygg, sammenlignbare prosjekter', onTopic: true };

afterEach(() => vi.restoreAllMocks());

describe('without a key', () => {
  it('status says live: false', async () => {
    const res = handleStatus({ env: {} });
    expect(await res.json()).toEqual({ live: false });
  });

  it('an empty key counts as missing', async () => {
    expect(await handleStatus({ env: { FTTT_API_KEY: '  ' } }).json()).toEqual({ live: false });
  });

  it('POST answers 503 and never builds a client', async () => {
    const makeClient = vi.fn();
    const res = await handleAdviser(post(validBody()), { env: {}, makeClient });
    expect(res.status).toBe(503);
    expect(makeClient).not.toHaveBeenCalled();
  });
});

describe('with a key and a fake client', () => {
  it('status says live: true and does not reveal the key', async () => {
    const text = await handleStatus({ env }).text();
    expect(JSON.parse(text)).toEqual({ live: true });
    expect(text).not.toContain(FAKE_KEY);
  });

  it('returns { answer, basis, onTopic } with 200, using claude-haiku-5-5', async () => {
    const fake = fakeClient(modelResponse(okReply));
    const res = await handleAdviser(post(validBody()), { env, makeClient: fake.makeClient, limiter: createLimiter() });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(okReply);
    const params = fake.create.mock.calls[0][0];
    expect(params.model).toBe('claude-haiku-5-5');
    expect(MODEL).toBe('claude-haiku-5-5');
    expect(params.output_config.format.type).toBe('json_schema');
    expect(params.messages[0].content).toContain('18 uker');
  });

  it('the real client is built with a 7 s timeout and no retries', () => {
    const client = createClient(FAKE_KEY);
    expect(client.timeout).toBe(7000);
    expect(client.maxRetries).toBe(0);
  });

  it('passes a reply with a wrong figure through unchanged: the client guard discards it', async () => {
    const wrong = { ...okReply, answer: 'Sammenlignbare prosjekter brukte 12 uker.' };
    const fake = fakeClient(modelResponse(wrong));
    const res = await handleAdviser(post(validBody()), { env, makeClient: fake.makeClient, limiter: createLimiter() });
    expect(await res.json()).toEqual(wrong);
  });
});

describe('bad requests', () => {
  const run = (req) => handleAdviser(req, { env, makeClient: fakeClient(modelResponse(okReply)).makeClient, limiter: createLimiter() });

  it('rejects a body over 32 KB with 413', async () => {
    const big = validBody({ history: [{ role: 'user', text: 'x'.repeat(LIMITS.bodyBytes) }] });
    expect((await run(post(big))).status).toBe(413);
  });

  it.each([
    ['not JSON', '{nope'],
    ['wrong version', validBody({ v: 2 })],
    ['empty question', validBody({ question: '  ' })],
    ['question over 500 characters', validBody({ question: 'x'.repeat(501) })],
    ['more than 6 history items', validBody({ history: Array.from({ length: 7 }, () => ({ role: 'user', text: 'hei' })) })],
    ['a fact without a value', validBody({ facts: [{ id: 'a', label: 'b' }] })],
  ])('rejects %s with 400', async (_name, body) => {
    expect((await run(post(body))).status).toBe(400);
  });
});

describe('limits', () => {
  it('answers 429 after 20 calls in one playthrough', async () => {
    const fake = fakeClient(modelResponse(okReply));
    const deps = { env, makeClient: fake.makeClient, limiter: createLimiter() };
    for (let i = 0; i < LIMITS.callsPerPlaythrough; i++) {
      expect((await handleAdviser(post(validBody()), deps)).status).toBe(200);
    }
    expect((await handleAdviser(post(validBody()), deps)).status).toBe(429);
    expect(fake.create).toHaveBeenCalledTimes(LIMITS.callsPerPlaythrough);
  });

  it('limits calls per IP across playthroughs', async () => {
    const limiter = createLimiter({ perIpPerHour: 2 });
    const deps = { env, makeClient: fakeClient(modelResponse(okReply)).makeClient, limiter };
    expect((await handleAdviser(post(validBody({ playthroughId: 'a' })), deps)).status).toBe(200);
    expect((await handleAdviser(post(validBody({ playthroughId: 'b' })), deps)).status).toBe(200);
    expect((await handleAdviser(post(validBody({ playthroughId: 'c' })), deps)).status).toBe(429);
  });
});

describe('model failures become a status, never a crash', () => {
  const headers = new Headers();
  it.each([
    ['429 from Claude', new Anthropic.RateLimitError(429, {}, 'rate limited', headers), 429],
    ['credits used up (402)', new Anthropic.PaymentRequiredError(402, {}, 'credit balance too low', headers), 502],
    ['bad key (401)', new Anthropic.AuthenticationError(401, {}, 'invalid x-api-key', headers), 502],
    ['overloaded (529)', new Anthropic.InternalServerError(529, {}, 'overloaded', headers), 502],
    ['timeout', new Anthropic.APIConnectionTimeoutError(), 504],
    ['network', new Anthropic.APIConnectionError({ message: 'down' }), 502],
    ['anything else', new Error('boom'), 502],
  ])('%s', async (_name, err, status) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await handleAdviser(post(validBody()), { env, makeClient: fakeClient(err).makeClient, limiter: createLimiter() });
    expect(res.status).toBe(status);
    // Only the status code is logged: never the key, the question or the facts.
    for (const call of warn.mock.calls) {
      const line = call.join(' ');
      expect(line).not.toContain(FAKE_KEY);
      expect(line).not.toContain('rammen');
      expect(line).not.toContain('18 uker');
    }
  });

  it.each([
    ['a refusal', modelResponse(okReply, 'refusal')],
    ['a cut-off reply', modelResponse(okReply, 'max_tokens')],
    ['text that is not JSON', { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Hei!' }] }],
    ['JSON of the wrong shape', modelResponse({ answer: 'Hei' })],
  ])('%s gives 502', async (_name, response) => {
    const res = await handleAdviser(post(validBody()), { env, makeClient: fakeClient(response).makeClient, limiter: createLimiter() });
    expect(res.status).toBe(502);
  });
});
