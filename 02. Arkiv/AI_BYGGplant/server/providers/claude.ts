// The live provider: Claude answers in TURN_SCHEMA (structured output) and the reply streams first.
// The client is injected so the tests can drive it with a fake; the API key never leaves the server.
import Anthropic from '@anthropic-ai/sdk';
import type { BetaMessageStreamParams } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { Brand } from '../../src/contract/brand.ts';
import type { AiTurn, ChatMessage } from '../../src/contract/types.ts';
import { parseTurn } from '../../src/contract/validate.ts';
import { ReplyExtractor } from '../partial.ts';
import { systemBlocks, TURN_SCHEMA } from '../prompt.ts';
import { aborted, TurnError, type Provider } from './types.ts';

export const MODEL = 'claude-opus-5-5';

/** The part of a streamed message we read. */
export interface FinalMessage {
  stop_reason: string | null;
  content: { type: string; text?: string }[];
}

/** The part of the SDK's message stream we use. */
export interface MessageStreamLike {
  on(event: 'text', listener: (delta: string, snapshot: string) => void): unknown;
  finalMessage(): Promise<FinalMessage>;
}

/** The part of the Anthropic client we use (a real client, or a fake in the tests). */
export interface ClaudeClient {
  beta: { messages: { stream(params: BetaMessageStreamParams, options?: { signal?: AbortSignal }): MessageStreamLike } };
}

export function requestParams(brand: Brand | null, messages: ChatMessage[]): BetaMessageStreamParams {
  return {
    model: MODEL,
    // Streamed, so the whole project plus risks fits in max_tokens without an HTTP timeout.
    max_tokens: 32000,
    // Adaptive thinking is always on for Opus 5.5; medium effort keeps the dialog responsive.
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: TURN_SCHEMA } },
    // If a safety classifier declines, the API reruns the request on a fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: systemBlocks(brand),
    messages,
  };
}

/** A Norwegian message (and HTTP status) for whatever went wrong talking to Claude. */
export function claudeError(error: unknown): TurnError {
  if (error instanceof TurnError) return error;
  if (error instanceof Anthropic.APIUserAbortError) return aborted();
  if (error instanceof Anthropic.AuthenticationError) return new TurnError(401, 'API-nøkkelen ble avvist. Sjekk ANTHROPIC_API_KEY i AI_BYGGplant/.env.');
  if (error instanceof Anthropic.RateLimitError) return new TurnError(429, 'For mange forespørsler akkurat nå. Vent litt og prøv igjen.');
  if (error instanceof Anthropic.APIConnectionError) return new TurnError(502, 'Fikk ikke kontakt med Claude. Sjekk nettet og prøv igjen.');
  if (error instanceof Anthropic.APIError) return new TurnError(502, `Feil fra Claude (${error.status ?? 'ukjent'}): ${error.message}`);
  if (error instanceof SyntaxError) return new TurnError(502, 'Claude svarte ikke med gyldig JSON. Prøv igjen.');
  if (error instanceof Error && error.message.startsWith('Svaret fulgte ikke kontrakten')) return new TurnError(502, `${error.message}. Prøv igjen.`);
  return new TurnError(500, error instanceof Error ? error.message : String(error));
}

export function createClaudeProvider(opts: { client?: ClaudeClient; apiKey?: string; brand: Brand | null }): Provider {
  const client: ClaudeClient = opts.client ?? (new Anthropic({ apiKey: opts.apiKey }) as unknown as ClaudeClient);

  return {
    name: 'claude',
    async turn(messages, onReplyDelta, signal): Promise<AiTurn> {
      if (signal.aborted) throw aborted();
      try {
        const extractor = new ReplyExtractor();
        const stream = client.beta.messages.stream(requestParams(opts.brand, messages), { signal });
        stream.on('text', (delta) => {
          const d = extractor.push(delta);
          if (d) onReplyDelta(d);
        });
        const message = await stream.finalMessage();
        if (signal.aborted) throw aborted();
        if (message.stop_reason === 'refusal') throw new TurnError(422, 'Claude avslo forespørselen. Prøv å formulere deg annerledes.');
        if (message.stop_reason === 'max_tokens') throw new TurnError(502, 'Svaret ble for langt og ble kuttet. Prøv igjen.');
        const text = message.content.flatMap((b) => (b.type === 'text' && typeof b.text === 'string' ? [b.text] : [])).join('');
        return parseTurn(text);
      } catch (error) {
        if (signal.aborted) throw aborted();
        throw claudeError(error);
      }
    },
  };
}
