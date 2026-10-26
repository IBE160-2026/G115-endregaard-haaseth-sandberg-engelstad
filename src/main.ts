// The game screen: the 3D building site fills the window, with the HUD floating on top.
import './styles.css';
import { aiPath, applyPlan, canTrigger, choose, findStory, forecast, newGame, outcome, pmPlan, setCrew, setMode, step, triggerEvent, type Difficulty, type GameState, type Outcome, type Story } from './engine/game';
import { scenario, type Mode } from './engine/scenario';
import { simulate } from './engine/simulate';
import { budgetOf } from './ui/budgetLines';
import { TABS, renderDock, renderRail, renderTop, type Flash, type TabId } from './ui/hud';
import { dialogFor, noteForecastChange, renderEvent, renderFeed, renderFinal, renderFork, renderStart, type ForecastNote, type PlayUi, type Speed } from './ui/play';
import { criticalList, type TabContext } from './ui/tabs/context';
import { renderBuildings } from './ui/tabs/buildings';
import { renderBudget } from './ui/tabs/budget';
import { renderDisciplines } from './ui/tabs/disciplines';
import { renderPeople } from './ui/tabs/people';
import { renderSchedule } from './ui/tabs/schedule';
import { createView3d, type View3d } from './ui/view3d';

const RENDER: Record<TabId, (ctx: TabContext) => string> = {
  people: renderPeople, buildings: renderBuildings, disciplines: renderDisciplines, budget: renderBudget, schedule: renderSchedule,
};
const WEEK_MS = 600;

const baseline = simulate(scenario);
const state: { panel: TabId | null; game?: GameState; story?: Story; ai?: Story; selected: string; resume: boolean; feedOpen: boolean; feedSeen: number } & PlayUi = {
  panel: null, selected: 'owner', resume: false, feedOpen: window.innerWidth > 1100, feedSeen: 0,
  playing: false, speed: 1, menu: false, finalSeen: false, forkSeen: 0,
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game">
    <div class="stage" id="stage"></div>
    <div class="vignette" aria-hidden="true"></div>
    <header class="hud-top glass" id="top"></header>
    <nav class="rail glass" id="rail" aria-label="Paneler"></nav>
    <section class="drawer glass" id="drawer" role="region" aria-labelledby="tab-title" hidden>
      <header class="drawer-head"><h1 id="tab-title"></h1><button type="button" class="icon-btn" data-action="close-panel" aria-label="Lukk panel">✕</button></header>
      <div class="drawer-body" id="tab-body"></div>
    </section>
    <aside class="feed glass" id="feed" aria-label="Meldinger"></aside>
    <div class="ticker glass" id="ticker"></div>
    <div class="dock glass" id="dock"></div>
    <div id="dialog"></div>
  </div>`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const stage = $<HTMLDivElement>('#stage');
const top = $<HTMLElement>('#top');
const rail = $<HTMLElement>('#rail');
const drawer = $<HTMLElement>('#drawer');
const title = $<HTMLHeadingElement>('#tab-title');
const body = $<HTMLDivElement>('#tab-body');
const feed = $<HTMLElement>('#feed');
const ticker = $<HTMLElement>('#ticker');
const dock = $<HTMLDivElement>('#dock');
const dialogHost = $<HTMLDivElement>('#dialog');

let view: View3d | null = null;
try {
  view = createView3d(stage);
} catch {
  stage.innerHTML = '<p class="stage-fallback">3D-byggeplassen krever WebGL. Spillet fungerer, men uten bilde av byggeplassen.</p>';
}
/** Week and state the 3D scene was last updated for. */
let viewKey = '';

/** Only touches the DOM when the HTML really changed (keeps focus, hover and animations). */
const shownHtml = new WeakMap<HTMLElement, string>();
function setHtml(el: HTMLElement, html: string): boolean {
  if (shownHtml.get(el) === html) return false;
  el.innerHTML = html;
  shownHtml.set(el, html);
  return true;
}

/** A selector for the focused control, so focus survives a re-render. */
function focusKey(): string | null {
  const el = document.activeElement as HTMLElement | null;
  if (!el || !app.contains(el) || el.tagName !== 'BUTTON') return null;
  const d = el.dataset;
  if (d.task && d.mode) return `[data-task="${d.task}"][data-mode="${d.mode}"]`;
  if (d.crewTask) return `[data-crew-task="${d.crewTask}"][title="${el.title}"]`;
  if (d.person) return `[data-person="${d.person}"]`;
  if (d.tab) return `.rail [data-tab="${d.tab}"]`;
  if (d.action === 'play' || d.action === 'pause') return '[data-action="play"], [data-action="pause"]';
  if (d.action === 'speed') return `[data-action="speed"][data-speed="${d.speed}"]`;
  if (d.action) return `[data-action="${d.action}"]`;
  return null;
}

let prevForecast: Outcome | null = null;
function render() {
  const key = focusKey();
  const orgScroll = app.querySelector<HTMLElement>('.org')?.scrollLeft ?? 0;
  const g = state.game;
  const result = g ? forecast(scenario, g) : baseline;
  const total = budgetOf(result).total;

  // The gauges flash when a choice or an event moves the forecast.
  const flash: Flash = {};
  if (prevForecast && g) {
    if (Math.round(total * 100) !== Math.round(prevForecast.total * 100)) flash.money = total > prevForecast.total ? 'up' : 'down';
    if (result.weeks !== prevForecast.weeks) flash.weeks = result.weeks > prevForecast.weeks ? 'up' : 'down';
  }
  prevForecast = g ? { weeks: result.weeks, total } : null;
  setHtml(top, renderTop(scenario, g, result, flash));

  if (state.feedOpen && g) state.feedSeen = g.log.length;
  setHtml(rail, renderRail(state.panel, state.feedOpen, g && !state.feedOpen ? Math.min(99, g.log.length - state.feedSeen) : 0));

  drawer.hidden = !state.panel;
  if (state.panel) {
    title.textContent = TABS.find(t => t.id === state.panel)!.label;
    // The plan is only worked out where it is shown.
    const plan = g && (state.panel === 'disciplines' || (state.panel === 'people' && state.selected === 'pm')) ? pmPlan(scenario, g) : [];
    setHtml(body, RENDER[state.panel]({ scenario, modes: {}, result, baseline, game: g, selected: state.selected, plan }));
    const org = app.querySelector<HTMLElement>('.org');
    if (org) org.scrollLeft = orgScroll;
  }

  feed.hidden = !state.feedOpen;
  if (state.feedOpen) setHtml(feed, renderFeed(scenario, g, 30));
  setHtml(ticker, g ? `<span>Kritisk linje</span><b>${criticalList(result).split(', ').join(' → ')}</b>` : '<span>Velg vanskelighetsgrad for å starte</span>');
  setHtml(dock, renderDock(scenario, g, state));

  // The AI path is played once per game, when the game is done.
  if (g?.done && !state.ai) state.ai = aiPath(scenario, g.difficulty, g.seed);
  const which = dialogFor(g, state);
  dialogHost.className = which === 'event' || which === 'fork' ? 'host-sheet' : which ? 'host-center' : '';
  const changed = setHtml(dialogHost, which === 'start' ? renderStart(scenario)
    : which === 'fork' ? renderFork(scenario, g!.decisions[state.forkSeen])
    : which === 'event' ? renderEvent(scenario, g!)
    : which === 'final' ? renderFinal(scenario, g!, state.story, state.ai)
    : '');

  if (view) {
    // A side sheet covers the right of the screen: move the action into the free part.
    const sheet = dialogHost.querySelector<HTMLElement>('.host-sheet .dialog');
    view.setInset(sheet && window.innerWidth > 720 ? sheet.offsetWidth : 0);
    const nextKey = g ? `${g.seed}:${g.week}:${g.pending?.eventId ?? ''}:${g.done}:${g.decisions.length}:${g.log.length}:${g.tasks.map(t => t.mode).join('')}` : 'none';
    if (nextKey !== viewKey) {
      viewKey = nextKey;
      view.update(scenario, g);
    }
  }

  const again = key ? app.querySelector<HTMLElement>(key) : null;
  if (again) again.focus();
  // A new dialog takes focus without scrolling away from its heading.
  else if (changed) dialogHost.querySelector<HTMLElement>('.dialog button')?.focus({ preventScroll: true });
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

/** The Prosjektleder reports when a choice or a staffing change moves the forecast. */
let lastNote: ForecastNote | null = null;
function noteForecast(g: GameState, before: Outcome) {
  const next = noteForecastChange(g.log, g.week, before, outcome(scenario, g), lastNote);
  g.log = next.log;
  lastNote = next.note;
}

function startGame(difficulty: Difficulty) {
  setPlaying(false);
  // Every game is a story that can be solved within both targets.
  state.story = findStory(scenario, difficulty, Math.floor(Math.random() * 1e6) + 1);
  state.game = newGame(scenario, difficulty, state.story.seed);
  state.ai = undefined;
  state.finalSeen = false;
  state.forkSeen = 0;
  state.feedSeen = 0;
  state.resume = false;
  state.menu = false;
  prevForecast = null;
  render();
  // Straight into the build: the clock starts running.
  setPlaying(true);
  render();
}

app.addEventListener('click', e => {
  const target = e.target as HTMLElement;
  const g = state.game;
  const tabBtn = target.closest<HTMLButtonElement>('[data-tab]');
  if (tabBtn) {
    const id = tabBtn.dataset.tab as TabId;
    state.panel = state.panel === id ? null : id;
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
    const before = outcome(scenario, g);
    setMode(scenario, g, modeBtn.dataset.task!, modeBtn.dataset.mode as Mode);
    noteForecast(g, before);
    render();
    return;
  }
  const crewBtn = target.closest<HTMLButtonElement>('[data-crew-task]');
  if (crewBtn && g) {
    const before = outcome(scenario, g);
    setCrew(scenario, g, crewBtn.dataset.crewTask!, Number(crewBtn.dataset.crew));
    noteForecast(g, before);
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
      state.ai = undefined;
      state.resume = false;
      state.panel = null;
      break;
    case 'play': setPlaying(true); break;
    case 'pause': setPlaying(false); break;
    case 'step': if (g) step(scenario, g); break;
    case 'speed':
      state.speed = Number(action.dataset.speed) as Speed;
      if (state.playing) setPlaying(true);
      break;
    case 'menu': state.menu = !state.menu; break;
    case 'feed': state.feedOpen = !state.feedOpen; break;
    case 'close-panel': state.panel = null; break;
    case 'camera': view?.resetCamera(); break;
    case 'trigger':
      if (g && canTrigger(scenario, g, action.dataset.event!)) {
        state.resume = state.playing;
        setPlaying(false);
        triggerEvent(scenario, g, action.dataset.event!);
      }
      state.menu = false;
      break;
    case 'choose':
      // Time stays paused: the fork card comes first, and «Fortsett» resumes play.
      if (g?.pending) {
        const before = g.pending.before;
        choose(scenario, g, action.dataset.option!);
        noteForecast(g, before);
      }
      break;
    case 'fork-continue':
      if (g) {
        state.forkSeen = g.decisions.length;
        // A queued strategy choice keeps play paused until it is decided too.
        if (!g.pending) {
          if (state.resume) setPlaying(true);
          state.resume = false;
        }
      }
      break;
    case 'close-final': state.finalSeen = true; break;
    case 'pm-plan':
      if (g) {
        const before = outcome(scenario, g);
        applyPlan(scenario, g, pmPlan(scenario, g));
        noteForecast(g, before);
      }
      break;
  }
  render();
});

// Keyboard: space plays/pauses, N steps, 1/2/4 set the speed, C resets the camera, M the messages, Esc closes.
window.addEventListener('keydown', e => {
  const el = e.target as HTMLElement;
  if (e.ctrlKey || e.metaKey || e.altKey || el.closest('input, textarea, select')) return;
  const g = state.game;
  const free = g && !g.done && !g.pending;
  const k = e.key.toLowerCase();
  if (k === ' ' && el.tagName !== 'BUTTON') {
    if (!free) return;
    e.preventDefault();
    setPlaying(!state.playing);
  } else if (k === 'n' && free) step(scenario, g!);
  else if (k === '1' || k === '2' || k === '4') {
    state.speed = Number(k) as Speed;
    if (state.playing) setPlaying(true);
  } else if (k === 'c') view?.resetCamera();
  else if (k === 'm') state.feedOpen = !state.feedOpen;
  else if (k === 'escape') { state.panel = null; state.menu = false; }
  else return;
  render();
});

// Pause the 3D loop while the tab is hidden.
document.addEventListener('visibilitychange', () => view?.setActive(!document.hidden));
window.addEventListener('resize', () => render());

render();

// Demo and presentation: ?uke=40 starts an easy game and fast-forwards to that week, following the Prosjektleder;
// &hendelse=water then raises that event (any scenario button id).
const params = new URLSearchParams(location.search);
const demoWeek = Number(params.get('uke'));
if (demoWeek > 0) {
  startGame('easy');
  setPlaying(false);
  const g = state.game!;
  while (!g.done && g.week < demoWeek) {
    if (g.pending) choose(scenario, g, g.pending.recommended);
    else step(scenario, g);
  }
  state.forkSeen = g.decisions.length;
  const ev = params.get('hendelse');
  if (ev && canTrigger(scenario, g, ev)) triggerEvent(scenario, g, ev);
  render();
}
