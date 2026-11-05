// What both AI providers (live Claude and the scripted demo) look like to the HTTP layer.
import type { AiTurn, ChatMessage } from '../../src/contract/types.ts';

export interface Provider {
  name: 'claude' | 'demo';
  /** Answers the dialog; calls onReplyDelta with each new piece of the reply while it is written. */
  turn(messages: ChatMessage[], onReplyDelta: (d: string) => void, signal: AbortSignal): Promise<AiTurn>;
}

/** An error with an HTTP status and a Norwegian message the user can read. */
export class TurnError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'TurnError';
    this.status = status;
  }
}

/** Thrown when the client went away (the signal fired). Not shown to anyone. */
export const ABORTED = 'Forespørselen ble avbrutt.';
export const aborted = () => new TurnError(499, ABORTED);
