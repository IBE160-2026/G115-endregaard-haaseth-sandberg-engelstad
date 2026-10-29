import './styles.css';
import { esc } from './format';
import { addUser, applyTurn, newSession, toApiMessages, type Session } from './session';
import type { AiTurn } from './types';
import { iconUrl, renderTab, TABS, type TabId } from './ui/tabs';

const STORE = 'ai-byggplant-session';

// The dialog is remembered in this browser only; it can be missing or blocked, so every access is guarded.
function load(): Session {
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) return JSON.parse(raw) as Session;
  } catch {
    /* start fresh */
  }
  return newSession();
}
function save(s: Session) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* not saved */
  }
}

let session = load();
let tab: TabId = 'oversikt';
let busy = false;
let error = '';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <aside class="dialog glass">
    <header class="dialog-head">
      <img src="${iconUrl('ai-advisor.svg')}" width="28" height="28" alt="">
      <div><b>AI Byggplan</b><small>Dialog med AI-byggelederen</small></div>
      <button id="reset" class="ghost" title="Start en ny samtale">Ny</button>
    </header>
    <div id="log" class="log" aria-live="polite"></div>
    <form id="form" class="composer">
      <textarea id="input" rows="3" placeholder="Skriv svar eller en endring … (Enter sender, Shift+Enter gir ny linje)"></textarea>
      <button id="send" type="submit" class="accent">Send</button>
    </form>
  </aside>
  <main class="workspace glass">
    <nav class="tabs" role="tablist">${TABS.map(
      (t) => `<button role="tab" data-tab="${t.id}"><img src="${iconUrl(t.icon)}" width="20" height="20" alt="">${t.label}</button>`,
    ).join('')}</nav>
    <section id="panel" class="panel"></section>
  </main>`;

const log = app.querySelector<HTMLDivElement>('#log')!;
const panel = app.querySelector<HTMLElement>('#panel')!;
const input = app.querySelector<HTMLTextAreaElement>('#input')!;
const sendBtn = app.querySelector<HTMLButtonElement>('#send')!;

function renderLog() {
  const lastAssistant = session.entries.length - 1;
  log.innerHTML = session.entries
    .map((e, i) => {
      if (e.role === 'user') return `<div class="msg user">${esc(e.text)}</div>`;
      // Answer chips only on the newest AI turn; older questions stay as text.
      const live = i === lastAssistant && !busy;
      const questions = e.questions
        .map(
          (q) => `<div class="question"><p>${esc(q.text)}</p>${
            live && q.options.length
              ? `<div class="options">${q.options.map((o) => `<button class="chip-btn" data-q="${esc(q.text)}" data-a="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
              : ''
          }</div>`,
        )
        .join('');
      return `<div class="msg ai"><p>${esc(e.text)}</p>${questions}</div>`;
    })
    .join('');
  if (busy) log.insertAdjacentHTML('beforeend', `<div class="msg ai thinking"><span></span><span></span><span></span></div>`);
  if (error) log.insertAdjacentHTML('beforeend', `<div class="msg error">${esc(error)}</div>`);
  log.scrollTop = log.scrollHeight;
  sendBtn.disabled = busy;
}

function renderPanel() {
  for (const b of app.querySelectorAll<HTMLButtonElement>('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  panel.innerHTML = renderTab(tab, session.project, session.phase);
}

async function send(text: string) {
  if (busy || !text.trim()) return;
  error = '';
  session = addUser(session, text.trim());
  busy = true;
  save(session);
  renderLog();
  try {
    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: toApiMessages(session) }),
    });
    const data = (await res.json()) as AiTurn | { error: string };
    if ('error' in data) throw new Error(data.error);
    session = applyTurn(session, data);
    save(session);
    renderPanel();
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    busy = false;
    renderLog();
  }
}

app.querySelector('#form')!.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = '';
  void send(text);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    app.querySelector<HTMLFormElement>('#form')!.requestSubmit();
  }
});
// A suggested answer goes into the text box, so several questions can be answered in one message.
log.addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('.chip-btn');
  if (!chip) return;
  const line = `${chip.dataset.q} ${chip.dataset.a}`;
  input.value = input.value.trim() ? `${input.value.trim()}\n${line}` : line;
  input.focus();
});
app.querySelector('.tabs')!.addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
  if (!b) return;
  tab = b.dataset.tab as TabId;
  renderPanel();
});
app.querySelector('#reset')!.addEventListener('click', () => {
  if (busy || (session.entries.length > 1 && !confirm('Starte en ny samtale? Det du har nå blir slettet.'))) return;
  session = newSession();
  error = '';
  save(session);
  renderLog();
  renderPanel();
});

renderLog();
renderPanel();
input.focus();
