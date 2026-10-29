// The dialog state and what is sent to the AI. Pure, so it can be tested without a browser.
import { emptyProject, type AiTurn, type ChatMessage, type Phase, type Project, type Question } from './types';

export const GREETING = 'Hei, hva skal bygges?';

export type Entry =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string; questions: Question[] };

export interface Session {
  entries: Entry[];
  project: Project;
  phase: Phase;
}

export const newSession = (): Session => ({
  entries: [{ role: 'assistant', text: GREETING, questions: [] }],
  project: emptyProject(),
  phase: 'oppstart',
});

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
  return {
    entries: [...s.entries, { role: 'assistant', text: turn.reply, questions: turn.questions }],
    project: turn.project,
    phase: turn.phase,
  };
}

export const addUser = (s: Session, text: string): Session => ({ ...s, entries: [...s.entries, { role: 'user', text }] });
