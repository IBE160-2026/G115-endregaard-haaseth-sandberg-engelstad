// The streaming protocol between the server (WS1) and the browser (WS3). Frozen with the contract.
//
// POST /api/turn/stream   body: { messages: ChatMessage[] }   response: text/event-stream
//   event: reply   data: { "delta": "..." }        the reply text as it is written (only `reply` streams)
//   event: turn    data: AiTurn                    the whole turn, validated, sent once at the end
//   event: error   data: { "error": "..." }        a Norwegian message for the user; the stream then ends
//
// GET /api/config   → AppConfig
// POST /api/lead    body: Lead (see src/handoff, WS4)  → { delivered: boolean, note: string }
import type { AiTurn } from './types';

export type StreamEvent =
  | { event: 'reply'; data: { delta: string } }
  | { event: 'turn'; data: AiTurn }
  | { event: 'error'; data: { error: string } };

export interface AppConfig {
  /** 'demo' when there is no API key (or DEMO=1): the turns come from the fixtures, not from Claude. */
  provider: 'claude' | 'demo';
  /** Shown on screen the whole time in demo mode. */
  demoLabel: string;
  /** In demo mode: the user lines of the scripted dialog, so the UI can offer the next one. */
  demoScript: string[];
}

export const DEMO_LABEL = 'Demo – forhåndsskrevet dialog, ikke live AI';

/** Encodes one server-sent event. */
export const sseFrame = (e: StreamEvent) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`;

/** Splits a growing SSE text buffer into complete events and the unfinished rest. */
export function parseSse(buffer: string): { events: StreamEvent[]; rest: string } {
  const events: StreamEvent[] = [];
  const blocks = buffer.split('\n\n');
  const rest = blocks.pop() ?? '';
  for (const block of blocks) {
    let event = '';
    let data = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) event = line.slice(7);
      else if (line.startsWith('data: ')) data += line.slice(6);
    }
    if (event && data) events.push({ event, data: JSON.parse(data) } as StreamEvent);
  }
  return { events, rest };
}
