// The dialog: state machine for one streamed turn, the log as HTML, and the demo helper.
// Everything here is pure (strings in, strings out) except patchDraft, so it is tested without a DOM.
import { esc } from '../format';
import type { Session } from '../session';

/**
 * idle → waiting (sent, nothing back yet) → streaming (reply text arriving) → idle (turn applied)
 *                                          ↘ error (retry possible) / aborted (Stopp pressed)
 */
export type ChatStatus = 'idle' | 'waiting' | 'streaming' | 'error' | 'aborted';

export interface ChatState {
  status: ChatStatus;
  /** The project the current (or last) request belongs to. */
  projectId: string | null;
  /** The reply as it streams in. */
  draft: string;
  error: string;
}

export type ChatAction =
  | { type: 'send'; projectId: string }
  | { type: 'delta'; delta: string }
  | { type: 'turn' }
  | { type: 'error'; message: string }
  | { type: 'abort' }
  | { type: 'dismiss' };

export const idleChat = (): ChatState => ({ status: 'idle', projectId: null, draft: '', error: '' });

export const isBusy = (s: ChatState) => s.status === 'waiting' || s.status === 'streaming';

export const MSG_ABORTED = 'Avbrutt – svaret ble stoppet.';

export function chatReducer(s: ChatState, a: ChatAction): ChatState {
  switch (a.type) {
    case 'send':
      return isBusy(s) ? s : { status: 'waiting', projectId: a.projectId, draft: '', error: '' };
    case 'delta':
      return isBusy(s) ? { ...s, status: 'streaming', draft: s.draft + a.delta } : s;
    case 'turn':
      return isBusy(s) ? { ...idleChat(), projectId: s.projectId } : s;
    case 'error':
      return isBusy(s) ? { ...s, status: 'error', error: a.message } : s;
    case 'abort':
      return isBusy(s) ? { ...s, status: 'aborted', error: MSG_ABORTED } : s;
    case 'dismiss':
      return isBusy(s) ? s : { ...idleChat(), projectId: s.projectId };
  }
}

export const userCount = (s: Session) => s.entries.filter((e) => e.role === 'user').length;

/** The scripted line the seller would type next (index = user messages so far), or null at the end. */
export const nextDemoLine = (s: Session, script: string[]): string | null => script[userCount(s)] ?? null;

/** The newest user message has no answer yet (after an error or Stopp), so it can be sent again. */
export const canRetry = (s: Session) => s.entries.at(-1)?.role === 'user';

/** A clicked answer chip goes into the text box as its own line, so several questions can be answered at once. */
export function addChip(value: string, question: string, answer: string): string {
  const line = `${question} ${answer}`;
  return value.trim() ? `${value.trim()}\n${line}` : line;
}

/** Enter sends, Shift+Enter is a new line (and nothing is sent while an IME is composing). */
export const isSendKey = (e: { key: string; shiftKey: boolean; isComposing?: boolean }) =>
  e.key === 'Enter' && !e.shiftKey && !e.isComposing;

export interface LogView {
  /** The chat state belongs to the project on screen. */
  mine: boolean;
  demo: boolean;
  /** Demo dialogs to offer under the greeting (empty or missing = no chooser). */
  choices?: { id: string; title: string; script: string[] }[];
}

/** «Demo: Dobbelgarasje med loft» chips; clicking one picks that scripted dialog and sends its first line. */
export function renderDemoChoices(dialogs: { id: string; title: string; script: string[] }[]): string {
  if (!dialogs.length) return '';
  const chips = dialogs
    .map(
      (d) =>
        `<button type="button" class="demo-choice" data-action="demo-choose" data-demo="${esc(d.id)}" title="${esc(d.script[0] ?? d.title)}">Demo: ${esc(d.title)}</button>`,
    )
    .join('');
  return `<div class="demo-choices" role="group" aria-label="Velg en demodialog"><p class="demo-choices-note">Velg en forhåndsskrevet demo:</p><div class="options">${chips}</div></div>`;
}

const thinking = `<div class="msg ai thinking" role="status"><span class="dots" aria-hidden="true"><i></i><i></i><i></i></span><span>tenker…</span></div>`;

/** The whole dialog for the project on screen. */
export function renderLog(session: Session, chat: ChatState, view: LogView): string {
  const busyHere = view.mine && isBusy(chat);
  const lastAssistant = session.entries.length - 1;
  const html = session.entries.map((e, i) => {
    if (e.role === 'user') return `<div class="msg user"><p>${esc(e.text)}</p></div>`;
    // Answer chips only on the newest AI turn; older questions stay as text.
    const live = i === lastAssistant && !busyHere;
    const questions = e.questions
      .map(
        (q) => `<div class="question"><p>${esc(q.text)}</p>${
          live && q.options.length
            ? `<div class="options">${q.options
                .map((o) => `<button type="button" class="chip-btn" data-q="${esc(q.text)}" data-a="${esc(o)}" aria-label="Svar: ${esc(o)}">${esc(o)}</button>`)
                .join('')}</div>`
            : ''
        }</div>`,
      )
      .join('');
    const greeting = i === 0 ? ' greeting' : '';
    // The demo chooser sits under the greeting of a new project, until a dialog is chosen or the first line is sent.
    const choices = i === 0 && !busyHere ? renderDemoChoices(view.choices ?? []) : '';
    return `<div class="msg ai${greeting}"><p>${esc(e.text)}</p>${questions}${choices}</div>`;
  });
  if (view.mine) {
    if (chat.status === 'waiting') html.push(thinking);
    if (chat.status === 'streaming')
      html.push(`<div class="msg ai streaming"><p><span class="draft">${esc(chat.draft)}</span><span class="caret" aria-hidden="true"></span></p></div>`);
    if (chat.status === 'error' || chat.status === 'aborted') {
      const retry = canRetry(session) ? `<button type="button" class="ghost small" data-action="retry">Prøv igjen</button>` : '';
      html.push(`<div class="msg ${chat.status}" role="alert"><p>${esc(chat.error)}</p>${retry}</div>`);
    }
  }
  return html.join('');
}

/** The «Neste demo-replikk» button, or a note when the script is done. */
export function renderDemoNext(line: string | null, busy: boolean): string {
  if (line === null) return `<p class="demo-done">Demoen er ferdig – skriv fritt, eller start et nytt prosjekt.</p>`;
  return `<button type="button" class="demo-next" data-action="demo-next" title="${esc(line)}"${busy ? ' disabled' : ''}>
    <span class="demo-next-label">Neste demo-replikk</span><span class="demo-next-line">${esc(line)}</span></button>`;
}

/** While streaming only the draft changes; updating the text node keeps the log cheap and the caret in place. */
export function patchDraft(log: HTMLElement, draft: string): boolean {
  const el = log.querySelector<HTMLElement>('.streaming .draft');
  if (!el) return false;
  el.textContent = draft;
  return true;
}
