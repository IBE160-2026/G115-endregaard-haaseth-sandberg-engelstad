// v0.3 shell: dialog left, live 3D and tabs right. Owner: WS3.
// The app has no building rules: it streams what the AI says and draws the project it returns.
import './styles.css';
import { applyBrand, brand } from './brand/brand';
import type { AppConfig } from './contract/stream';
import type { Lead } from './contract/brand';
import { esc } from './format';
import { buildLead, downloadLead, sendToDealer } from './handoff/lead';
import * as inboxMod from './handoff/inbox';
import { INBOX_LABEL, loadInbox, renderInbox, saveInbox } from './handoff/inbox';
import { fetchConfig, streamTurn } from './net/sse';
import {
  activeProject,
  addProject,
  exportProject,
  fileName,
  importProject,
  loadStore,
  projectTitle,
  removeActive,
  type Store,
} from './projects';
import * as reportMod from './report/report';
import { addUser, applyTurn, highlightIds, toApiMessages, type Session } from './session';
import * as buildingMod from './ui/building';
import { addChip, chatReducer, idleChat, isBusy, isSendKey, nextDemoLine, patchDraft, renderDemoNext, renderLog, type ChatAction, type ChatState } from './ui/chat';
import {
  clampDialogWidth,
  customerFrom,
  demoChoices,
  demoDialogFor,
  demoScriptFor,
  fallbackTab,
  glowSet,
  hasFootprint,
  sessionOf,
  setDemo,
  setSession,
  shellHtml,
  tabsHtml,
  toastText,
} from './ui/shell';
import * as tabsMod from './ui/tabs';
import { renderTab, TABS, type TabId } from './ui/tabs';

/** What WS2's lazily loaded renderer gives back. */
interface View {
  update(project: Session['project'], highlight: Set<string>): void;
  snapshot(): string;
  resize(): void;
  dispose(): void;
}

const STORE = 'ai-byggplant-projects';
const LEGACY = 'ai-byggplant-session'; // v0.1 kept one session under this key
const WIDTH = 'ai-byggplant-dialog-width';
const INBOX_NOTE = INBOX_LABEL;

// Storage can be missing or blocked, so every access is guarded.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* not saved */
  }
}

/** CSS strings WS4 exports (TAB_CSS, REPORT_CSS …); skipped if a module does not export them. */
function injectModuleCss() {
  const css = [tabsMod, buildingMod, reportMod, inboxMod]
    .flatMap((m) => Object.entries(m as Record<string, unknown>))
    .filter(([k, v]) => /_CSS$/.test(k) && typeof v === 'string')
    .map(([, v]) => v as string);
  if (!css.length) return;
  const style = document.createElement('style');
  style.id = 'module-css';
  style.textContent = [...new Set(css)].join('\n');
  // Before the brand colours, so the brand still wins.
  document.head.insertBefore(style, document.getElementById('brand-css'));
}

let config: AppConfig;
let store: Store = loadStore(read(STORE), read(LEGACY));
let tab: TabId = 'oversikt';
let chat: ChatState = idleChat();
let abort: AbortController | null = null;
/** A reference clicked in Endringer; it glows instead of the newest turn's changes until the next turn. */
let focusRef: string | null = null;
let view: View | null = null;
let viewState: 'loading' | 'ready' | 'failed' = 'loading';

const session = () => activeProject(store).session;
const save = () => write(STORE, JSON.stringify(store));
const glow = () => glowSet(highlightIds(session()), focusRef);

async function start() {
  applyBrand(brand);
  injectModuleCss();
  config = await fetchConfig();
  const app = document.querySelector<HTMLDivElement>('#app')!;
  app.innerHTML = shellHtml(brand, config);
  const width = Number(read(WIDTH));
  if (width) app.style.setProperty('--dialog-w', `${clampDialogWidth(width, innerWidth)}px`);
  wire(app);
  renderAll();
  $<HTMLTextAreaElement>('#input').focus();
  // The 3D view is loaded after the first paint, so the dialog is usable at once.
  requestAnimationFrame(() => setTimeout(loadView, 0));
}

const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

// ---- rendering ----

function renderPicker() {
  const picker = $<HTMLSelectElement>('#project');
  picker.innerHTML = store.projects
    .map((p) => `<option value="${p.id}"${p.id === store.active ? ' selected' : ''}>${esc(projectTitle(p.session))}</option>`)
    .join('');
  const busy = isBusy(chat);
  // A reply is applied to the project that asked, so switching is allowed; deleting or importing is not.
  for (const id of ['#delete', '#import']) $<HTMLButtonElement>(id).disabled = busy;
}

function renderChat() {
  const log = $<HTMLDivElement>('#log');
  const s = session();
  const mine = chat.projectId === store.active;
  const entry = activeProject(store);
  log.innerHTML = renderLog(s, chat, { mine, demo: config.provider === 'demo', choices: demoChoices(config, entry) });
  log.setAttribute('aria-busy', String(mine && isBusy(chat)));
  log.scrollTop = log.scrollHeight;
  const busy = isBusy(chat);
  $<HTMLButtonElement>('#send').hidden = mine && busy;
  $<HTMLButtonElement>('#send').disabled = busy;
  $<HTMLButtonElement>('#stop').hidden = !(mine && busy);
  const demo = document.querySelector<HTMLElement>('#demo-next');
  if (demo) demo.innerHTML = renderDemoNext(nextDemoLine(s, demoScriptFor(config, entry.demo)), busy);
  for (const b of log.querySelectorAll<HTMLButtonElement>('.demo-choice')) b.disabled = busy;
}

function renderTabs() {
  const nav = $<HTMLElement>('.tabs');
  nav.innerHTML = tabsHtml(TABS, tab);
  const panel = $<HTMLElement>('#panel');
  panel.setAttribute('aria-labelledby', `tab-${tab}`);
  panel.innerHTML = renderTab(tab, session(), glow());
}

function renderView() {
  const p = session().project;
  view?.update(p, glow());
  const hint = $<HTMLElement>('#stage-hint');
  const placeholder = $<HTMLElement>('#stage-placeholder');
  if (viewState === 'loading') {
    hint.textContent = 'Laster 3D …';
    placeholder.hidden = false;
  } else {
    // Until the AI has sized a volume there is nothing to draw: say so instead of guessing a box.
    placeholder.hidden = hasFootprint(p);
    hint.textContent = 'Bygget reiser seg her når målene er avklart.';
  }
}

function renderAll() {
  renderPicker();
  renderChat();
  renderTabs();
  renderView();
  renderInboxCount();
}

function toast(text: string, kind: 'change' | 'info' = 'change') {
  if (!text) return;
  const box = $<HTMLElement>('#toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span class="toast-icon" aria-hidden="true">${kind === 'change' ? '✦' : 'i'}</span><span>${esc(text)}</span>`;
  box.append(el);
  while (box.children.length > 3) box.firstElementChild?.remove();
  setTimeout(() => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 400);
  }, 5000);
}

// ---- the 3D view ----

async function loadView() {
  const stage = $<HTMLElement>('#stage');
  try {
    const { createView } = await import('./three/renderer');
    view = (await createView($<HTMLElement>('#view'))) as View;
    viewState = 'ready';
    new ResizeObserver(() => view?.resize()).observe(stage);
  } catch (e) {
    // No WebGL (or the module failed): the 2D drawing takes over.
    console.warn('3D view unavailable', e);
    view = null;
    viewState = 'failed';
    document.body.classList.add('no-3d');
    stage.hidden = true;
    // Toasts live on the stage; without it they float over the page instead.
    const toasts = $<HTMLElement>('#toasts');
    toasts.classList.add('floating');
    document.querySelector('.app')!.append(toasts);
    tab = (fallbackTab(TABS) ?? tab) as TabId;
    const note = $<HTMLElement>('#tab-note');
    note.textContent = '3D-visning er ikke tilgjengelig i denne nettleseren – her er tegningen i stedet.';
    note.hidden = false;
    renderTabs();
  }
  renderView();
}

// ---- sending ----

function dispatch(a: ChatAction) {
  chat = chatReducer(chat, a);
}

async function send(text: string, retry = false) {
  if (isBusy(chat)) return;
  const projectId = store.active;
  let s = session();
  if (!retry) {
    if (!text.trim()) return;
    s = addUser(s, text.trim());
  }
  store = setSession(store, projectId, s);
  // In demo mode the project keeps playing one scripted dialog: the chosen one, or the default from the first line on.
  const demo = config.provider === 'demo' ? demoDialogFor(config, activeProject(store).demo)?.id : undefined;
  if (demo && activeProject(store).demo !== demo) store = setDemo(store, projectId, demo);
  save();
  dispatch({ type: 'send', projectId });
  abort = new AbortController();
  renderChat();
  renderPicker();

  const outcome = await streamTurn(
    toApiMessages(s),
    {
      onReply(delta) {
        const first = chat.status === 'waiting';
        dispatch({ type: 'delta', delta });
        if (store.active !== projectId) return;
        // The first delta swaps «tenker…» for the reply bubble; after that only its text changes.
        if (first || !patchDraft($('#log'), chat.draft)) renderChat();
        else $<HTMLDivElement>('#log').scrollTop = $<HTMLDivElement>('#log').scrollHeight;
      },
      onTurn(turn) {
        // The reply belongs to the project that asked, even if the user has switched since.
        const current = sessionOf(store, projectId);
        if (!current) return;
        store = setSession(store, projectId, applyTurn(current, turn));
        save();
        dispatch({ type: 'turn' });
        if (store.active === projectId) {
          focusRef = null;
          toast(toastText(turn.changes));
        } else {
          const title = projectTitle(sessionOf(store, projectId)!);
          toast(`Svar mottatt i «${title}»`, 'info');
        }
      },
      onError(message) {
        dispatch({ type: 'error', message });
      },
    },
    abort.signal,
    undefined,
    demo,
  );
  if (outcome === 'aborted') dispatch({ type: 'abort' });
  abort = null;
  renderAll();
}

// ---- lead and inbox ----

function inboxList(): Lead[] {
  try {
    return (loadInbox() as Lead[]) ?? [];
  } catch {
    return [];
  }
}

function renderInboxCount() {
  const n = inboxList().length;
  const el = $<HTMLElement>('#inbox-count');
  el.textContent = String(n);
  el.hidden = n === 0;
}

function openInbox(note = INBOX_NOTE) {
  const drawer = $<HTMLElement>('#inbox');
  $<HTMLElement>('#inbox-body').innerHTML = renderInbox(inboxList(), brand, note);
  drawer.hidden = false;
  requestAnimationFrame(() => drawer.classList.add('open'));
  $<HTMLButtonElement>('#inbox-close').focus();
}

function closeInbox() {
  const drawer = $<HTMLElement>('#inbox');
  drawer.classList.remove('open');
  setTimeout(() => (drawer.hidden = true), 250);
  $<HTMLButtonElement>('#inbox-open').focus();
}

function leadFromForm(): Lead {
  const form = $<HTMLFormElement>('#lead-form');
  const data = Object.fromEntries([...new FormData(form)].map(([k, v]) => [k, String(v)]));
  return buildLead(session(), brand, customerFrom(data));
}

async function deliverLead(lead: Lead) {
  let note = INBOX_NOTE;
  try {
    const res = await sendToDealer(lead);
    note = res.note || note;
  } catch (e) {
    note = `Kunne ikke sende: ${e instanceof Error ? e.message : String(e)}. Leadet er lagret i innboksen.`;
  }
  saveInbox([lead, ...inboxList().filter((l) => l.id !== lead.id)]);
  renderInboxCount();
  openInbox(note);
}

// ---- events ----

function wire(app: HTMLElement) {
  const input = $<HTMLTextAreaElement>('#input');
  const form = $<HTMLFormElement>('#form');
  const log = $<HTMLDivElement>('#log');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isBusy(chat)) return;
    const text = input.value;
    if (!text.trim()) return;
    input.value = '';
    void send(text);
  });
  input.addEventListener('keydown', (e) => {
    if (isSendKey(e)) {
      e.preventDefault();
      form.requestSubmit();
    } else if (e.key === 'Escape' && abort) abort.abort();
  });
  $('#stop').addEventListener('click', () => abort?.abort());

  log.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const chip = t.closest<HTMLButtonElement>('.chip-btn');
    const choice = t.closest<HTMLButtonElement>('[data-action="demo-choose"]');
    if (chip) {
      input.value = addChip(input.value, chip.dataset.q ?? '', chip.dataset.a ?? '');
      input.focus();
    } else if (choice?.dataset.demo) {
      // Picking a demo stores it with the project (the chips go away) and sends the dialog's first line.
      if (isBusy(chat)) return;
      store = setDemo(store, store.active, choice.dataset.demo);
      save();
      const first = demoScriptFor(config, choice.dataset.demo)[0];
      if (first) void send(first);
      else renderAll();
      input.focus();
    } else if (t.closest('[data-action="retry"]')) void send('', true);
  });
  document.querySelector('#demo-next')?.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-action="demo-next"]')) return;
    const line = nextDemoLine(session(), demoScriptFor(config, activeProject(store).demo));
    if (line === null) return;
    input.value = line;
    input.focus();
    input.setSelectionRange(line.length, line.length);
  });

  // Tabs: click and arrow keys (roving tabindex).
  const nav = $<HTMLElement>('.tabs');
  nav.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab as TabId;
    renderTabs();
  });
  nav.addEventListener('keydown', (e) => {
    const i = TABS.findIndex((t) => t.id === tab);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : step ? (i + step + TABS.length) % TABS.length : -1;
    if (to < 0) return;
    e.preventDefault();
    tab = TABS[to].id;
    renderTabs();
    $<HTMLButtonElement>(`#tab-${tab}`).focus();
  });

  // A reference (Endringer and anywhere else that marks one) makes that item glow in 3D and the tabs.
  app.addEventListener('click', (e) => {
    const ref = (e.target as HTMLElement).closest<HTMLElement>('[data-ref]');
    if (!ref?.dataset.ref) return;
    focusRef = focusRef === ref.dataset.ref ? null : ref.dataset.ref;
    renderTabs();
    renderView();
  });

  // Projects
  const picker = $<HTMLSelectElement>('#project');
  const switched = () => {
    focusRef = null;
    // An old error belongs to the project it happened in; a running stream keeps going.
    if (!isBusy(chat) && chat.projectId !== store.active) chat = idleChat();
    save();
    renderAll();
  };
  picker.addEventListener('change', () => {
    store = { ...store, active: picker.value };
    switched();
  });
  $('#new').addEventListener('click', () => {
    store = addProject(store);
    tab = viewState === 'failed' ? tab : 'oversikt';
    switched();
    input.focus();
  });
  $('#delete').addEventListener('click', () => {
    if (isBusy(chat)) return;
    if (!confirm(`Slette «${projectTitle(session())}»? Dette kan ikke angres.`)) return;
    store = removeActive(store);
    chat = idleChat();
    switched();
  });
  $('#export').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([exportProject(session())], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: fileName(session()) });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const file = $<HTMLInputElement>('#file');
  $('#import').addEventListener('click', () => file.click());
  file.addEventListener('change', async () => {
    const f = file.files?.[0];
    file.value = '';
    if (!f) return;
    try {
      store = addProject(store, importProject(await f.text()));
      chat = idleChat();
      switched();
      toast(`Importerte «${projectTitle(session())}»`, 'info');
    } catch (e) {
      toast(e instanceof SyntaxError ? 'Filen er ikke gyldig JSON.' : e instanceof Error ? e.message : String(e), 'info');
    }
  });

  // Report: the 3D snapshot goes into the PDF when the view runs.
  $('#report').addEventListener('click', () => {
    let snapshot: string | undefined;
    try {
      snapshot = view?.snapshot() || undefined;
    } catch {
      snapshot = undefined;
    }
    $('#print').innerHTML = reportMod.renderReport(session(), brand, snapshot);
    window.print();
  });

  // Lead
  const dialog = $<HTMLDialogElement>('#lead-dialog');
  $('#lead-open').addEventListener('click', () => {
    $<HTMLFormElement>('#lead-form').reset();
    dialog.showModal();
  });
  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'send') void deliverLead(leadFromForm());
    dialog.returnValue = '';
  });
  dialog.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-action="download-lead"]')) downloadLead(leadFromForm());
  });

  // Inbox
  $('#inbox-open').addEventListener('click', () => openInbox());
  $('#inbox-close').addEventListener('click', closeInbox);
  $('#inbox').addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const open = t.closest<HTMLElement>('[data-lead-open]');
    const call = t.closest<HTMLElement>('[data-lead-call]');
    if (open) {
      const lead = inboxList().find((l) => l.id === open.dataset.leadOpen);
      if (lead) downloadLead(lead);
    } else if (call?.dataset.phone) location.href = `tel:${call.dataset.phone.replace(/[^+0-9]/g, '')}`;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$<HTMLElement>('#inbox').hidden && !dialog.open) closeInbox();
  });

  // Maximise 3D
  const max = $<HTMLButtonElement>('#maximize');
  max.addEventListener('click', () => {
    const on = !app.classList.contains('stage-max');
    app.classList.toggle('stage-max', on);
    max.setAttribute('aria-pressed', String(on));
    max.textContent = on ? 'Vis fanene' : 'Maksimer 3D';
    requestAnimationFrame(() => view?.resize());
  });

  // Splitter between dialog and workspace (desktop): drag, or arrow keys.
  const splitter = $<HTMLElement>('#splitter');
  const setWidth = (px: number) => {
    const w = clampDialogWidth(px, innerWidth);
    app.style.setProperty('--dialog-w', `${w}px`);
    write(WIDTH, String(w));
    view?.resize();
  };
  splitter.addEventListener('pointerdown', (e) => {
    splitter.setPointerCapture(e.pointerId);
    const left = app.getBoundingClientRect().left + parseFloat(getComputedStyle(app).paddingLeft);
    const move = (ev: PointerEvent) => setWidth(ev.clientX - left);
    const up = () => {
      splitter.removeEventListener('pointermove', move);
      splitter.removeEventListener('pointerup', up);
      app.classList.remove('resizing');
    };
    app.classList.add('resizing');
    splitter.addEventListener('pointermove', move);
    splitter.addEventListener('pointerup', up);
  });
  splitter.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const now = $<HTMLElement>('.dialog').getBoundingClientRect().width;
    setWidth(now + (e.key === 'ArrowRight' ? 24 : -24));
  });
}

void start();
