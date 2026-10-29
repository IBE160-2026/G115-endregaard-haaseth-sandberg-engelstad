// The dialog state and what is sent to the AI. Pure, so it can be tested without a browser.
import { budgetTotal } from './budget';
import { emptyProject, type AiTurn, type ChatMessage, type Phase, type Project, type Question } from './types';

export const GREETING = 'Hei, hva skal bygges?';

export type Entry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; questions: Question[] };

/** One AI turn in the change log: what the user asked, what changed, and the budget before and after. */
export interface ChangeEntry {
  turn: number;
  request: string;
  changes: string[];
  totalBefore: number;
  totalAfter: number;
}

export interface Session {
  entries: Entry[];
  project: Project;
  phase: Phase;
  log: ChangeEntry[];
}

export const newSession = (): Session => ({
  entries: [{ role: 'assistant', text: GREETING, questions: [] }],
  project: emptyProject(),
  phase: 'oppstart',
  log: [],
});

/** Fills in what older saved sessions (v0.1) or imported files lack. */
export function normalizeSession(raw: unknown): Session {
  const s = raw as Partial<Session> | null;
  if (!s || !Array.isArray(s.entries) || !s.project) throw new Error('Ikke en gyldig prosjektfil.');
  const project = { ...emptyProject(), ...s.project };
  project.budget = project.budget.map((l) => ({ ...l, uncertainty_pct: l.uncertainty_pct ?? 0 }));
  return { entries: s.entries, project, phase: s.phase ?? 'oppstart', log: Array.isArray(s.log) ? s.log : [] };
}

/** An assistant turn as the AI will read it back: the reply and the questions it asked. */
const assistantText = (e: Extract<Entry, { role: 'assistant' }>) =>
  [e.text, ...e.questions.map((q) => `- ${q.text}`)].join('\n');

/**
 * The messages for the next request. The greeting is the app's, so the API dialog starts
 * with the user's first answer. The current project goes with the newest user message only,
 * so the AI always edits the latest version without the history repeating it every turn.
 */
export function toApiMessages(s: Session): ChatMessage[] {
  const messages: ChatMessage[] = s.entries
    .slice(1)
    .map((e) => (e.role === 'user' ? { role: 'user', content: e.text } : { role: 'assistant', content: assistantText(e) }));
  if (messages.length) {
    messages[0] = { role: 'user', content: `${GREETING}\n\n${messages[0].content}` };
    const last = messages[messages.length - 1];
    if (last.role === 'user' && s.entries.length > 2) {
      last.content = `${last.content}\n\n[Prosjektet slik det står nå, som JSON]\n${JSON.stringify(s.project)}`;
    }
  }
  return messages;
}

export function applyTurn(s: Session, turn: AiTurn): Session {
  const request = [...s.entries].reverse().find((e) => e.role === 'user')?.text ?? '';
  const log = turn.changes?.length
    ? [
        ...s.log,
        {
          turn: s.log.length + 1,
          request,
          changes: turn.changes,
          totalBefore: budgetTotal(s.project),
          totalAfter: budgetTotal(turn.project),
        },
      ]
    : s.log;
  return {
    entries: [...s.entries, { role: 'assistant', text: turn.reply, questions: turn.questions }],
    project: normalizeSession({ entries: [], project: turn.project }).project,
    phase: turn.phase,
    log,
  };
}

export const addUser = (s: Session, text: string): Session => ({ ...s, entries: [...s.entries, { role: 'user', text }] });
