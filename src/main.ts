// The in-game Windows-style desktop: the app window with five tabs, a 3D window and a taskbar.
import './styles.css';
import { canTrigger, choose, forecast, newGame, setCrew, setMode, step, triggerEvent, type Difficulty, type GameState } from './engine/game';
import { scenario, type Mode } from './engine/scenario';
import { simulate } from './engine/simulate';
import { budgetOf } from './ui/budgetLines';
import { formatMnok } from './ui/format';
import { renderEvent, renderFinal, renderStart, renderToolbar, type PlayUi, type Speed } from './ui/play';
import { criticalList, icon, type TabContext } from './ui/tabs/context';
import { renderBuildings } from './ui/tabs/buildings';
import { renderBudget } from './ui/tabs/budget';
import { renderDisciplines } from './ui/tabs/disciplines';
import { renderPeople } from './ui/tabs/people';
import { renderSchedule } from './ui/tabs/schedule';
import type { View3d } from './ui/view3d';
import { VERSION } from './version';

type TabId = 'people' | 'buildings' | 'disciplines' | 'budget' | 'schedule';

const TABS: { id: TabId; label: string; render: (ctx: TabContext) => string }[] = [
  { id: 'people', label: 'Menneskene', render: renderPeople },
  { id: 'buildings', label: 'Byggene', render: renderBuildings },
  { id: 'disciplines', label: 'Disiplinene', render: renderDisciplines },
  { id: 'budget', label: 'Budsjett', render: renderBudget },
  { id: 'schedule', label: 'Fremdriftsplan', render: renderSchedule },
];

// Title-bar glyphs as inline SVG, so they render on every OS (not only with Segoe Fluent Icons).
const glyph = (d: string) => `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">${d}</svg>`;
const CAPTION = {
  min: glyph('<path d="M0 5.5h10"/>'),
  max: glyph('<rect x=".5" y=".5" width="9" height="9" rx="1"/>'),
  close: glyph('<path d="M.5 .5l9 9M9.5 .5l-9 9"/>'),
};
const WEEK_MS = 600;

const baseline = simulate(scenario);
const state: { tab: TabId; game?: GameState; selected: string; resume: boolean } & PlayUi = {
  tab: 'people', selected: 'owner', resume: false,
  playing: false, speed: 1, menu: false, show3d: false, finalSeen: false,
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="desktop">
    <div class="window main-window">
      <header class="titlebar">
        ${icon('apps/schedule.svg', 16)}<span>${scenario.name} – Prosjektsimulator ${VERSION}</span>
        <div class="caption" aria-hidden="true"><span>${CAPTION.min}</span><span>${CAPTION.max}</span><span class="close">${CAPTION.close}</span></div>
      </header>
      <div id="toolbar"></div>
      <div class="body">
        <nav class="nav" role="tablist" aria-label="Faner">
          ${TABS.map(t => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="tabpanel" data-tab="${t.id}">${icon(`apps/${t.id}.svg`, 20)}<span>${t.label}</span></button>`).join('')}
        </nav>
        <main class="content" role="tabpanel" id="tabpanel">
          <h1 id="tab-title"></h1>
          <div id="tab-body"></div>
        </main>
      </div>
      <footer class="statusbar"></footer>
      <div id="dialog"></div>
    </div>
    <div class="window win3d" hidden>
      <header class="titlebar" data-drag>
        ${icon('apps/view3d.svg', 16)}<span>3D-byggeplass – A-blokka</span><span class="win3d-week" id="week3d"></span>
        <div class="caption"><span class="close" data-action="toggle3d" role="button" aria-label="Lukk 3D">${CAPTION.close}</span></div>
      </header>
      <div class="view3d" id="view3d"></div>
    </div>
    <div class="taskbar">
      <div class="apps">
        ${TABS.map(t => `<button type="button" data-tab="${t.id}" title="${t.label}">${icon(`apps/${t.id}.svg`, 24)}</button>`).join('')}
        <button type="button" data-action="toggle3d" title="3D-byggeplass" id="task3d">${icon('apps/view3d.svg', 24)}</button>
      </div>
      <div class="tray"><span class="version" title="Simulatorversjon">${VERSION}</span><span id="clock"></span></div>
    </div>
  </div>`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const title = $<HTMLHeadingElement>('#tab-title');
const body = $<HTMLDivElement>('#tab-body');
const statusbar = $<HTMLElement>('.statusbar');
const panel = $<HTMLElement>('#tabpanel');
const toolbar = $<HTMLDivElement>('#toolbar');
const dialogHost = $<HTMLDivElement>('#dialog');
const win3d = $<HTMLDivElement>('.win3d');
let view: View3d | null = null;
let viewLoading: Promise<View3d> | null = null;
/** Week and state the 3D scene was last built for, so clicks elsewhere do not rebuild it. */
let viewKey = '';

/** A selector for the focused control, so focus survives the re-render. */
function focusKey(): string | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !app.contains(el) || el.tagName !== 'BUTTON') return null;
  const d = el.dataset;
  if (d.task && d.mode) return `[data-task="${d.task}"][data-mode="${d.mode}"]`;
  if (d.crewTask) return `[data-crew-task="${d.crewTask}"][title="${el.title}"]`;
  if (d.person) return `[data-person="${d.person}"]`;
  if (d.action === 'play' || d.action === 'pause') return '[data-action="play"], [data-action="pause"]';
  if (d.action === 'speed') return `[data-action="speed"][data-speed="${d.speed}"]`;
  if (d.action) return `.toolbar [data-action="${d.action}"]`;
  return null;
}

function render() {
  const key = focusKey();
  const orgScroll = app.querySelector<HTMLElement>('.org')?.scrollLeft ?? 0;
  const g = state.game;
  const result = g ? forecast(scenario, g) : baseline;
  const tab = TABS.find(t => t.id === state.tab)!;
  title.textContent = tab.label;
  body.innerHTML = tab.render({ scenario, modes: {}, result, baseline, game: g, selected: state.selected });
  const org = app.querySelector<HTMLElement>('.org');
  if (org) org.scrollLeft = orgScroll;
  toolbar.innerHTML = renderToolbar(scenario, g, result, state);
  panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
  app.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
    const active = b.dataset.tab === state.tab;
    b.classList.toggle('active', active);
    if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', String(active));
  });
  $('#task3d').classList.toggle('active', state.show3d);
  statusbar.innerHTML = `<span>${g ? `Uke <b>${g.week}</b>` : 'Ikke startet'}</span>
    <span>Prognose <b>${result.weeks} uker</b> · <b>${formatMnok(budgetOf(result).total)} MNOK</b></span>
    <span class="crit">Kritiske aktiviteter ${criticalList(result)}</span>
    ${g ? `<span class="log">${g.log.slice(-1).map(l => `Uke ${l.week}: ${l.text}`).join('')}</span>` : ''}`;

  dialogHost.innerHTML = !g ? renderStart(scenario)
    : g.pending ? renderEvent(scenario, g)
    : g.done && !state.finalSeen ? renderFinal(scenario, g)
    : '';
  const nextKey = g ? `${g.seed}:${g.week}:${g.pending?.eventId ?? ''}:${g.done}` : 'none';
  if (state.show3d && view && nextKey !== viewKey) {
    viewKey = nextKey;
    view.update(scenario, g);
    $('#week3d').textContent = g ? `Uke ${g.week}` : '';
  }
  const again = key ? app.querySelector<HTMLElement>(key) : null;
  if (again) again.focus();
  else dialogHost.querySelector<HTMLElement>('.dialog button')?.focus();
}

// Time: one week per tick while playing; a decision pauses until the owner has chosen.
let timer = 0;
function setPlaying(on: boolean) {
  state.playing = on;
  clearInterval(timer);
  if (on) timer = window.setInterval(tick, WEEK_MS / state.speed);
}
// At high speed a re-render in the middle of a click would replace the button being pressed.
let pointerDown = false;
let renderAfterPointer = false;
app.addEventListener('pointerdown', () => { pointerDown = true; });
window.addEventListener('pointerup', () => {
  pointerDown = false;
  if (renderAfterPointer) { renderAfterPointer = false; render(); }
});

function tick() {
  const g = state.game;
  if (!g) return;
  step(scenario, g);
  if (g.pending) {
    state.resume = state.playing;
    setPlaying(false);
  }
  if (g.done) setPlaying(false);
  if (pointerDown) renderAfterPointer = true;
  else render();
}

async function toggle3d() {
  state.show3d = !state.show3d;
  win3d.hidden = !state.show3d;
  view?.setActive(state.show3d);
  if (state.show3d && !view) {
    try {
      // three.js is only loaded when the 3D window is opened (once, even on fast double clicks).
      viewLoading ??= import('./ui/view3d').then(m => m.createView3d($('#view3d')));
      view = await viewLoading;
      view.setActive(state.show3d);
    } catch {
      viewLoading = null;
      state.show3d = false;
      win3d.hidden = true;
      $('#week3d').textContent = '';
      alert('3D-visningen kunne ikke startes (krever WebGL).');
    }
  }
  viewKey = '';
  render();
}

function startGame(difficulty: Difficulty) {
  setPlaying(false);
  state.game = newGame(scenario, difficulty, Math.floor(Math.random() * 1e6) + 1);
  state.finalSeen = false;
  state.resume = false;
  state.menu = false;
  render();
}

app.addEventListener('click', e => {
  const target = e.target as HTMLElement;
  const g = state.game;
  const tabBtn = target.closest<HTMLButtonElement>('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab as TabId;
    render();
    return;
  }
  const person = target.closest<HTMLButtonElement>('[data-person]');
  if (person) {
    state.selected = person.dataset.person!;
    render();
    return;
  }
  const modeBtn = target.closest<HTMLButtonElement>('[data-mode]');
  if (modeBtn && g) {
    setMode(scenario, g, modeBtn.dataset.task!, modeBtn.dataset.mode as Mode);
    render();
    return;
  }
  const crewBtn = target.closest<HTMLButtonElement>('[data-crew-task]');
  if (crewBtn && g) {
    setCrew(scenario, g, crewBtn.dataset.crewTask!, Number(crewBtn.dataset.crew));
    render();
    return;
  }
  const action = target.closest<HTMLElement>('[data-action]');
  if (!action) {
    if (state.menu) { state.menu = false; render(); }
    return;
  }
  switch (action.dataset.action) {
    case 'start': startGame(action.dataset.difficulty as Difficulty); return;
    case 'new':
      setPlaying(false);
      state.game = undefined;
      state.resume = false;
      break;
    case 'play': setPlaying(true); break;
    case 'pause': setPlaying(false); break;
    case 'step': if (g) step(scenario, g); break;
    case 'speed':
      state.speed = Number(action.dataset.speed) as Speed;
      if (state.playing) setPlaying(true);
      break;
    case 'menu': state.menu = !state.menu; break;
    case 'trigger':
      if (g && canTrigger(scenario, g, action.dataset.event!)) {
        state.resume = state.playing;
        setPlaying(false);
        triggerEvent(scenario, g, action.dataset.event!);
      }
      state.menu = false;
      break;
    case 'choose':
      if (g) {
        choose(scenario, g, action.dataset.option!);
        if (state.resume) setPlaying(true);
        state.resume = false;
      }
      break;
    case 'close-final': state.finalSeen = true; break;
    case 'toggle3d': void toggle3d(); return;
  }
  render();
});

// The 3D window can be moved by its title bar.
const drag = win3d.querySelector<HTMLElement>('[data-drag]')!;
drag.addEventListener('pointerdown', e => {
  if ((e.target as HTMLElement).closest('[data-action]')) return;
  const start = { x: e.clientX, y: e.clientY, left: win3d.offsetLeft, top: win3d.offsetTop };
  drag.setPointerCapture(e.pointerId);
  const move = (m: PointerEvent) => {
    const maxLeft = window.innerWidth - 120;
    win3d.style.left = `${Math.min(maxLeft, Math.max(-win3d.offsetWidth + 120, start.left + m.clientX - start.x))}px`;
    win3d.style.top = `${Math.max(0, start.top + m.clientY - start.y)}px`;
    win3d.style.right = win3d.style.bottom = "auto";
  };
  const up = () => {
    drag.removeEventListener('pointermove', move);
    drag.removeEventListener('pointerup', up);
    drag.removeEventListener('pointercancel', up);
  };
  drag.addEventListener('pointermove', move);
  drag.addEventListener('pointerup', up);
  drag.addEventListener('pointercancel', up);
});

// Light/dark switch: rebuild the 3D scene so its background follows the theme.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { viewKey = ''; render(); });

const clock = $<HTMLSpanElement>('#clock');
const tickClock = () => {
  const now = new Date();
  clock.innerHTML = `${now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}<br>${now.toLocaleDateString('nb-NO')}`;
};
tickClock();
setInterval(tickClock, 30_000);

render();
