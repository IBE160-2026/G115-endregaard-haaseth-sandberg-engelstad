import './styles.css';
import { esc } from './format';
import {
  activeProject,
  addProject,
  exportProject,
  fileName,
  importProject,
  loadStore,
  projectTitle,
  removeActive,
  updateActive,
  type Store,
} from './projects';
import { addUser, applyTurn, toApiMessages, type Session } from './session';
import type { AiTurn } from './types';
import { iconUrl, renderReport, renderTab, TABS, type TabId } from './ui/tabs';

const STORE = 'ai-byggplant-projects';
const LEGACY = 'ai-byggplant-session'; // v0.1 kept one session under this key

// Projects are remembered in this browser only; storage can be missing or blocked, so every access is guarded.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(store));
  } catch {
    /* not saved */
  }
}

let store: Store = loadStore(read(STORE), read(LEGACY));
let session: Session = activeProject(store).session;
let tab: TabId = 'oversikt';
let busy = false;
let error = '';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <aside class="dialog glass">
    <header class="dialog-head">
      <img src="${iconUrl('ai-advisor.svg')}" width="28" height="28" alt="">
      <div><b>AI Byggplan</b><small>Dialog med AI-byggelederen</small></div>
    </header>
    <div class="project-bar">
      <select id="project" aria-label="Prosjekt"></select>
      <button id="new" class="ghost" title="Nytt prosjekt">Nytt</button>
      <button id="delete" class="ghost" title="Slett prosjektet">Slett</button>
    </div>
    <div id="log" class="log" aria-live="polite"></div>
    <form id="form" class="composer">
      <textarea id="input" rows="3" placeholder="Skriv svar eller en endring … (Enter sender, Shift+Enter gir ny linje)"></textarea>
      <button id="send" type="submit" class="accent">Send</button>
    </form>
  </aside>
  <main class="workspace glass">
    <nav class="tabs" role="tablist">${TABS.map(
      (t) => `<button role="tab" data-tab="${t.id}"><img src="${iconUrl(t.icon)}" width="20" height="20" alt="">${t.label}</button>`,
    ).join('')}
      <span class="spacer"></span>
      <button id="export" class="ghost" title="Last ned prosjektet som fil">Eksporter</button>
      <button id="import" class="ghost" title="Åpne en prosjektfil">Importer</button>
      <button id="report" class="accent" title="Skriv ut eller lagre som PDF">Rapport</button>
      <input id="file" type="file" accept=".json,application/json" hidden>
    </nav>
    <section id="panel" class="panel"></section>
  </main>
  <article id="print" class="report"></article>`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const log = $<HTMLDivElement>('#log');
const panel = $<HTMLElement>('#panel');
const input = $<HTMLTextAreaElement>('#input');
const sendBtn = $<HTMLButtonElement>('#send');
const picker = $<HTMLSelectElement>('#project');

function renderPicker() {
  picker.innerHTML = store.projects
    .map((p) => `<option value="${p.id}"${p.id === store.active ? ' selected' : ''}>${esc(projectTitle(p.session))}</option>`)
    .join('');
  picker.disabled = busy;
}

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
  for (const id of ['#new', '#delete', '#import']) $<HTMLButtonElement>(id).disabled = busy;
}

function renderPanel() {
  for (const b of app.querySelectorAll<HTMLButtonElement>('[data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === tab));
  panel.innerHTML = renderTab(tab, session);
}

function renderAll() {
  renderPicker();
  renderLog();
  renderPanel();
}

/** Stores the session in the active project. */
function commit(s: Session) {
  session = s;
  store = updateActive(store, s);
  save();
}

async function send(text: string) {
  if (busy || !text.trim()) return;
  error = '';
  // The reply belongs to the project that asked, even if the user switches while waiting.
  const projectId = store.active;
  commit(addUser(session, text.trim()));
  busy = true;
  renderLog();
  renderPicker();
  try {
    const res = await fetch('/api/turn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: toApiMessages(session) }),
    });
    const data = (await res.json()) as AiTurn | { error: string };
    if ('error' in data) throw new Error(data.error);
    if (store.active === projectId) commit(applyTurn(session, data));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    busy = false;
    renderAll();
  }
}

$('#form').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value;
  input.value = '';
  void send(text);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $<HTMLFormElement>('#form').requestSubmit();
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
$('.tabs').addEventListener('click', (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
  if (!b) return;
  tab = b.dataset.tab as TabId;
  renderPanel();
});

picker.addEventListener('change', () => {
  store = { ...store, active: picker.value };
  session = activeProject(store).session;
  error = '';
  save();
  renderAll();
});
$('#new').addEventListener('click', () => {
  store = addProject(store);
  session = activeProject(store).session;
  error = '';
  tab = 'oversikt';
  save();
  renderAll();
  input.focus();
});
$('#delete').addEventListener('click', () => {
  if (!confirm(`Slette «${projectTitle(session)}»? Dette kan ikke angres.`)) return;
  store = removeActive(store);
  session = activeProject(store).session;
  error = '';
  save();
  renderAll();
});

$('#export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([exportProject(session)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: fileName(session) });
  a.click();
  URL.revokeObjectURL(url);
});
const file = $<HTMLInputElement>('#file');
$('#import').addEventListener('click', () => file.click());
file.addEventListener('change', async () => {
  const f = file.files?.[0];
  file.value = '';
  if (!f) return;
  try {
    store = addProject(store, importProject(await f.text()));
    session = activeProject(store).session;
    error = '';
    save();
  } catch (e) {
    error = e instanceof SyntaxError ? 'Filen er ikke gyldig JSON.' : e instanceof Error ? e.message : String(e);
  }
  renderAll();
});

$('#report').addEventListener('click', () => {
  $('#print').innerHTML = renderReport(session);
  window.print();
});

renderAll();
input.focus();
