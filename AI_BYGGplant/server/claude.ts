// A Vite plugin that serves POST /api/turn: the dialog so far in, Claude's next turn out.
// The API key stays here on the dev server; the browser only talks to /api/turn.
import Anthropic from '@anthropic-ai/sdk';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { AiTurn, ChatMessage } from '../src/types.ts';
import { SYSTEM_PROMPT, TURN_SCHEMA } from './prompt.ts';

const MODEL = 'claude-opus-5-5';

/** Keeps only well-formed text turns, and requires the dialog to end with the user. */
export function cleanMessages(input: unknown): ChatMessage[] | null {
  if (!Array.isArray(input)) return null;
  const messages = input.filter(
    (m): m is ChatMessage =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim() !== '',
  );
  if (messages.length === 0 || messages[0].role !== 'user' || messages[messages.length - 1].role !== 'user') return null;
  return messages;
}

export async function askClaude(client: Anthropic, messages: ChatMessage[]): Promise<AiTurn> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    // Adaptive thinking is always on for Opus 5.5; medium effort keeps the dialog responsive.
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: TURN_SCHEMA } },
    // If a safety classifier declines, the API reruns the request on a fallback model.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM_PROMPT,
    messages,
  });
  if (response.stop_reason === 'refusal') throw new Error('Claude avslo forespørselen.');
  if (response.stop_reason === 'max_tokens') throw new Error('Svaret ble for langt og ble kuttet. Prøv igjen.');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  return JSON.parse(text) as AiTurn;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function errorMessage(error: unknown): [number, string] {
  if (error instanceof Anthropic.AuthenticationError) return [401, 'API-nøkkelen ble avvist. Sjekk ANTHROPIC_API_KEY i AI_BYGGplant/.env.'];
  if (error instanceof Anthropic.RateLimitError) return [429, 'For mange forespørsler akkurat nå. Vent litt og prøv igjen.'];
  if (error instanceof Anthropic.APIError) return [502, `Feil fra Claude (${error.status}): ${error.message}`];
  if (error instanceof SyntaxError) return [502, 'Claude svarte ikke med gyldig JSON. Prøv igjen.'];
  return [500, error instanceof Error ? error.message : String(error)];
}

export function claudePlugin(apiKey: string | undefined): Plugin {
  const client = apiKey ? new Anthropic({ apiKey }) : null;

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url !== '/api/turn') return next();
    if (req.method !== 'POST') return send(res, 405, { error: 'Bruk POST.' });
    if (!client) {
      return send(res, 503, {
        error: 'Mangler API-nøkkel. Kopier AI_BYGGplant/.env.example til .env, fyll inn ANTHROPIC_API_KEY og start npm run dev på nytt.',
      });
    }
    try {
      const messages = cleanMessages(JSON.parse(await readBody(req))?.messages);
      if (!messages) return send(res, 400, { error: 'Dialogen må starte og slutte med brukeren.' });
      send(res, 200, await askClaude(client, messages));
    } catch (error) {
      const [status, message] = errorMessage(error);
      send(res, status, { error: message });
    }
  };

  return {
    name: 'ai-byggplant-claude',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}
