// Client and server together, with the fetch wired straight to the handler and a fake
// model. Shows the whole FR-17 path without a key or network.
import { describe, expect, it } from 'vitest';
import { createAdviser } from '../../src/ai/ask.ts';
import { handleAdviser, handleStatus } from './adviser.js';
import { createLimiter } from './ratelimit.js';

const facts = [
  { id: 'frameWeeks', label: 'Råbygg, sammenlignbare prosjekter', value: '18 uker' },
  { id: 'cost', label: 'Kostnad', value: '171,0 MNOK' },
];
const prepared = [
  { id: 'frame', step: 'estimate', question: 'Hvor lang tid tar råbygget?', render: f => `Sammenlignbare prosjekter: ${f[0].value}.` },
];

function wire(env, modelText) {
  const limiter = createLimiter();
  const makeClient = () => ({
    messages: { create: async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: modelText }] }) },
  });
  /** @type {typeof fetch} */
  const f = async (url, init) => {
    if (url === '/api/adviser/status') return handleStatus({ env });
    return handleAdviser(new Request(`https://example.test${url}`, init), { env, makeClient, limiter });
  };
  return createAdviser({ fetch: f, prepared, playthroughId: 'p-1' });
}

const q = { step: 'estimate', question: 'Hvor lang tid tar råbygget?', facts };

describe('end to end', () => {
  it('a reply with correct figures is shown', async () => {
    const adviser = wire({ FTTT_API_KEY: 'k' }, JSON.stringify({ answer: 'Typisk 18 uker, til 171,0 MNOK.', basis: 'Råbygg', onTopic: true }));
    const a = await adviser.ask(q);
    expect(a.source).toBe('model');
    expect(adviser.stats()).toEqual({ calls: 1, discards: 0 });
  });

  it('a reply with a deliberately wrong figure is discarded, counted, and the prepared answer shown', async () => {
    const adviser = wire({ FTTT_API_KEY: 'k' }, JSON.stringify({ answer: 'Typisk 14 uker.', basis: 'Råbygg', onTopic: true }));
    const a = await adviser.ask(q);
    expect(a.source).toBe('prepared');
    expect(a).toMatchObject({ reason: 'guard', caption: 'Forberedt svar', text: 'Sammenlignbare prosjekter: 18 uker.' });
    expect(adviser.stats()).toEqual({ calls: 1, discards: 1 });
  });

  it('with no key, the prepared answer is shown and POST is never called', async () => {
    const adviser = wire({}, 'unused');
    const a = await adviser.ask(q);
    expect(a).toMatchObject({ source: 'prepared', reason: 'offline' });
    expect(adviser.stats().calls).toBe(0);
  });
});
