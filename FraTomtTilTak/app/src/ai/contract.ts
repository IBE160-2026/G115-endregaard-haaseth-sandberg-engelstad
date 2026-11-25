// Client copy of the adviser contract. The source is api/_lib/contract.js (AD-13);
// keep the two in step. The client only ever calls these relative paths.

export const STATUS_PATH = '/api/adviser/status';
export const ADVISER_PATH = '/api/adviser';

/** One approved fact from the rule engine, already formatted for display ("171,0 MNOK"). */
export interface Fact {
  id: string;
  label: string;
  value: string;
}

export interface Turn {
  role: 'user' | 'adviser';
  text: string;
}

export interface AdviserRequest {
  v: 1;
  playthroughId: string;
  step: string;
  question: string; // max 500 chars
  history: Turn[]; // max 6
  facts: Fact[];
}

export interface AdviserReply {
  answer: string;
  basis: string;
  onTopic: boolean;
}

export const CLIENT_LIMITS = {
  questionChars: 500,
  historyItems: 6,
  /** Calls per playthrough (PRD §6, AD-14). */
  callsPerPlaythrough: 20,
  /** The student never waits longer than this for the model (FR-17). */
  timeoutMs: 8000,
} as const;
