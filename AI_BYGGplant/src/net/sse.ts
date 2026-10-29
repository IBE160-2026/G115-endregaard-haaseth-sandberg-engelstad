// The browser side of the streaming protocol (src/contract/stream.ts). Owner: WS3.
// POST /api/turn/stream → reply deltas while Claude writes, then one whole turn (or an error).
import { DEMO_LABEL, parseSse, type AppConfig, type StreamEvent } from '../contract/stream';
import type { AiTurn, ChatMessage } from '../contract/types';

export interface TurnCallbacks {
  onReply(delta: string): void;
  onTurn(turn: AiTurn): void;
  onError(message: string): void;
}

/** How a stream ended. Exactly one of onTurn / onError is called, except on 'aborted' (neither). */
export type StreamOutcome = 'turn' | 'error' | 'aborted';

export const MSG_INCOMPLETE = 'Svaret stoppet før det var ferdig.';
export const MSG_OFFLINE = 'Fikk ikke kontakt med serveren. Sjekk at appen kjører, og prøv igjen.';
export const MSG_BAD_DATA = 'Serveren sendte et svar appen ikke kunne lese.';

const isAbort = (e: unknown, signal?: AbortSignal) =>
  signal?.aborted || (e instanceof DOMException && e.name === 'AbortError') || (e as { name?: string })?.name === 'AbortError';

/**
 * Feeds text chunks in, hands complete events out. Chunks may split an event (or a line, or a
 * multi-byte character — the decoder in readStream handles that) anywhere.
 */
export function createSseBuffer() {
  let buffer = '';
  return {
    push(text: string): StreamEvent[] {
      // Servers may send CRLF; the protocol parser expects LF.
      buffer += text.replace(/\r\n/g, '\n');
      const { events, rest } = parseSse(buffer);
      buffer = rest;
      return events;
    },
    /** What is left when the stream closes (a final event without its blank line). */
    flush(): StreamEvent[] {
      const tail = buffer.trim() ? `${buffer}\n\n` : '';
      buffer = '';
      return tail ? parseSse(tail).events : [];
    },
  };
}

/** Reads an SSE body to the end and calls back. Pure apart from the stream, so it is tested with a fake one. */
export async function readStream(
  body: ReadableStream<Uint8Array>,
  cb: TurnCallbacks,
  signal?: AbortSignal,
): Promise<StreamOutcome> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const sse = createSseBuffer();
  const onAbort = () => void reader.cancel().catch(() => {});
  signal?.addEventListener('abort', onAbort);

  // Returns an outcome when an event ends the turn, otherwise null.
  const handle = (events: StreamEvent[]): StreamOutcome | null => {
    for (const e of events) {
      if (signal?.aborted) return 'aborted';
      if (e.event === 'reply') cb.onReply(e.data.delta);
      else if (e.event === 'turn') {
        cb.onTurn(e.data);
        return 'turn';
      } else if (e.event === 'error') {
        cb.onError(e.data.error || MSG_INCOMPLETE);
        return 'error';
      }
    }
    return null;
  };

  try {
    if (signal?.aborted) return 'aborted';
    for (;;) {
      const { done, value } = await reader.read();
      if (signal?.aborted) return 'aborted';
      const events = done ? [...sse.push(decoder.decode()), ...sse.flush()] : sse.push(decoder.decode(value, { stream: true }));
      const end = handle(events);
      if (end) {
        if (!done) void reader.cancel().catch(() => {});
        return end;
      }
      if (done) break;
    }
    cb.onError(MSG_INCOMPLETE);
    return 'error';
  } catch (e) {
    if (isAbort(e, signal)) return 'aborted';
    cb.onError(e instanceof SyntaxError ? MSG_BAD_DATA : MSG_INCOMPLETE);
    return 'error';
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

/** The error text for a response that is not a stream (e.g. 429 from the rate limit, 500). */
export async function httpError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: unknown };
    if (typeof data.error === 'string' && data.error) return data.error;
  } catch {
    /* not JSON */
  }
  return `Serveren svarte med feil (${res.status}). Prøv igjen.`;
}

/** Sends the dialog and streams the answer. */
export async function streamTurn(
  messages: ChatMessage[],
  cb: TurnCallbacks,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<StreamOutcome> {
  let res: Response;
  try {
    res = await fetchImpl(`${import.meta.env?.BASE_URL ?? '/'}api/turn/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (e) {
    if (isAbort(e, signal)) return 'aborted';
    cb.onError(MSG_OFFLINE);
    return 'error';
  }
  if (!res.ok || !res.body) {
    cb.onError(await httpError(res));
    return 'error';
  }
  return readStream(res.body, cb, signal);
}

/** Used when /api/config cannot be read (e.g. a static build without the server). */
export const FALLBACK_CONFIG: AppConfig = { provider: 'claude', demoLabel: DEMO_LABEL, demoScript: [] };

export async function fetchConfig(fetchImpl: typeof fetch = fetch): Promise<AppConfig> {
  try {
    const res = await fetchImpl(`${import.meta.env?.BASE_URL ?? '/'}api/config`);
    if (!res.ok) return FALLBACK_CONFIG;
    const c = (await res.json()) as Partial<AppConfig>;
    return {
      provider: c.provider === 'demo' ? 'demo' : 'claude',
      demoLabel: typeof c.demoLabel === 'string' && c.demoLabel ? c.demoLabel : DEMO_LABEL,
      demoScript: Array.isArray(c.demoScript) ? c.demoScript.filter((l): l is string => typeof l === 'string') : [],
    };
  } catch {
    return FALLBACK_CONFIG;
  }
}
