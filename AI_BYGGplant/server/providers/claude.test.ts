import Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../../src/contract/types.ts';
import { loadBrand } from '../brand.ts';
import { FIXTURES_DIR, ROOT } from '../http.ts';
import { claudeError, createClaudeProvider, MODEL, type ClaudeClient, type FinalMessage } from './claude.ts';
import { loadDialog } from './demo.ts';

const turn = loadDialog(FIXTURES_DIR, 'garage')[5].turn;
const json = JSON.stringify(turn);
const messages: ChatMessage[] = [{ role: 'user', content: 'Hei' }];
const brand = loadBrand(ROOT);

interface FakeOptions {
  text?: string;
  stop?: string;
  chunk?: number;
}

/** A fake client: replays the text in chunks to the 'text' listener, then resolves finalMessage. */
function fakeClient(opts: FakeOptions) {
  const calls: { params: any; options: any }[] = [];
  const client: ClaudeClient = {
    beta: {
      messages: {
        stream(params, options) {
          calls.push({ params, options });
          let listener: (d: string, s: string) => void = () => {};
          return {
            on(_event, l) {
              listener = l;
            },
            async finalMessage(): Promise<FinalMessage> {
              await Promise.resolve();
              const text = opts.text ?? json;
              const size = opts.chunk ?? 5;
              for (let i = 0; i < text.length; i += size) listener(text.slice(i, i + size), text.slice(0, i + size));
              return { stop_reason: opts.stop ?? 'end_turn', content: [{ type: 'text', text }] };
            },
          };
        },
      },
    },
  };
  return { client, calls };
}

const run = (o: FakeOptions) => createClaudeProvider({ client: fakeClient(o).client, brand }).turn(messages, () => {}, new AbortController().signal);

describe('the claude provider', () => {
  it('sends the v0.3 request (model, schema, fallback, cached system with the catalogue) and the signal', async () => {
    const { client, calls } = fakeClient({});
    const signal = new AbortController().signal;
    await createClaudeProvider({ client, brand }).turn(messages, () => {}, signal);
    const { params, options } = calls[0];
    expect(params.model).toBe(MODEL);
    expect(params.max_tokens).toBe(32000);
    expect(params.output_config.effort).toBe('medium');
    expect(params.output_config.format.type).toBe('json_schema');
    expect(Object.keys(params.output_config.format.schema.properties)[0]).toBe('reply');
    expect(params.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(params.fallbacks).toBe('default');
    expect(params.system).toHaveLength(1);
    expect(params.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(params.system[0].text).toContain('Produktkatalog fra Nordlys Hus og Garasje AS');
    expect(params.system[0].text).toContain('NL-PORT-2522');
    expect(params.messages).toEqual(messages);
    expect(options.signal).toBe(signal);
  });

  it('streams only the reply, as it arrives, and returns the validated turn', async () => {
    for (const chunk of [1, 3, 50, 100000]) {
      const deltas: string[] = [];
      const provider = createClaudeProvider({ client: fakeClient({ chunk }).client, brand });
      const got = await provider.turn(messages, (d) => deltas.push(d), new AbortController().signal);
      expect(deltas.join('')).toBe(turn.reply);
      expect(got).toEqual(turn);
      if (chunk === 1) expect(deltas.length).toBeGreaterThan(10);
    }
  });

  it('maps refusal, max_tokens, broken JSON and contract breaks to Norwegian errors', async () => {
    await expect(run({ stop: 'refusal' })).rejects.toMatchObject({ status: 422, message: expect.stringContaining('avslo') });
    await expect(run({ stop: 'max_tokens' })).rejects.toMatchObject({ message: expect.stringContaining('for langt') });
    await expect(run({ text: '{"reply":"hei", "pro' })).rejects.toMatchObject({ status: 502, message: expect.stringContaining('gyldig JSON') });
    await expect(run({ text: '{"reply":"hei"}' })).rejects.toMatchObject({ status: 502, message: expect.stringContaining('kontrakten') });
  });

  it('maps API errors', () => {
    const headers = new Headers();
    expect(claudeError(new Anthropic.AuthenticationError(401, {}, 'nope', headers)).status).toBe(401);
    expect(claudeError(new Anthropic.RateLimitError(429, {}, 'slow', headers)).status).toBe(429);
    expect(claudeError(new Anthropic.InternalServerError(500, {}, 'boom', headers)).message).toContain('Feil fra Claude');
    expect(claudeError(new Anthropic.APIUserAbortError()).message).toContain('avbrutt');
  });

  it('reports an abort, not an API error, when the client went away', async () => {
    const ac = new AbortController();
    ac.abort();
    await expect(createClaudeProvider({ client: fakeClient({}).client, brand }).turn(messages, () => {}, ac.signal)).rejects.toThrow('avbrutt');
  });
});
