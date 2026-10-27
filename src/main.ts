// The game screen: the 3D building site fills the window, with the HUD floating on top.
// main.ts directs the story: the player walks to whoever waits with a «!», the camera cuts to a
// meeting, and the clock only runs when no one is waiting for the player.
import './styles.css';
import { aiPath, applyPlan, canTrigger, choose, findStory, forecast, newGame, outcome, pmPlan, setCrew, setMode, step, triggerEvent, type Difficulty, type GameState, type Outcome, type Story } from './engine/game';
import { eventById } from './engine/events';
import { scenario, type Mode } from './engine/scenario';
import { simulate } from './engine/simulate';
import { budgetOf } from './ui/budgetLines';
import { TABS, railHints, renderDock, renderRail, renderTop, type Flash, type TabId } from './ui/hud';
import { BLOCKING, dialogFor, noteForecastChange, personName, renderEvent, renderFeed, renderFinal, renderFork, renderStart, type DialogId, type ForecastNote, type PlayUi, type Speed } from './ui/play';
import { renderHms, renderKickoff, renderObjective, renderReview, renderTalk, renderTeam } from './ui/scenes';
import { hmsDue, kickoffLines, meetingLines, newStory, objectiveFor, ppeOf, reviewTasks, hmsById } from './ui/story';
import { criticalList, type TabContext } from './ui/tabs/context';
import { renderBuildings } from './ui/tabs/buildings';
import { renderBudget } from './ui/tabs/budget';
import { renderDisciplines } from './ui/tabs/disciplines';
import { renderPeople } from './ui/tabs/people';
import { renderSchedule } from './ui/tabs/schedule';
import { createView3d, type CastState, type SceneSpec, type View3d } from './ui/view3d';

const RENDER: Record<TabId, (ctx: TabContext) => string> = {
  people: renderPeople, buildings: renderBuildings, disciplines: renderDisciplines, budget: renderBudget, schedule: renderSchedule,
};
const WEEK_MS = 600;
const SCENES: DialogId[] = ['hms', 'kickoff', 'fork', 'event', 'review'];

const baseline = simulate(scenario);
const state: { panel: TabId | null; game?: GameState; story?: Story; ai?: Story; selected: string; resume: boolean; feedOpen: boolean; feedSeen: number; near: string | null } & PlayUi = {
  panel: null, selected: 'owner', resume: false, feedOpen: window.innerWidth > 1100, feedSeen: 0, near: null,
  playing: false, speed: 1, menu: false, finalSeen: false, forkSeen: 0, ...newStory(),
};

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="game" id="game">
    <div class="stage" id="stage"></div>
    <div class="vignette" aria-hidden="true"></div>
    <div class="letterbox" aria-hidden="true"><i></i><i></i></div>
    <header class="hud-top glass" id="top"></header>
    <nav class="rail glass" id="rail" aria-label="Oppdrag, team og paneler"></nav>
    <section class="drawer glass" id="drawer" role="region" aria-labelledby="tab-title" hidden>
      <header class="drawer-head"><h1 id="tab-title"></h1><button type="button" class="icon-btn" data-action="close-panel" aria-label="Lukk panel">✕</button></header>
      <div class="drawer-body" id="tab-body"></div>
    </section>
    <aside class="feed glass" id="feed" aria-label="Meldinger"></aside>
    <div class="ticker glass" id="ticker"></div>
    <div class="hint glass" id="hint" hidden></div>
    <div class="dock glass" id="dock"></div>
    <div id="dialog"></div>
  </div>`;

const $ = <T extends HTMLElement>(sel: string) => app.querySelector<T>(sel)!;
const gameEl = $<HTMLDivElement>('#game');
const stage = $<HTMLDivElement>('#stage');
const top = $<HTMLElement>('#top');
const rail = $<HTMLElement>('#rail');
const drawer = $<HTMLElement>('#drawer');
const title = $<HTMLHeadingElement>('#tab-title');
const body = $<HTMLDivElement>('#tab-body');
const feed = $<HTMLElement>('#feed');
const ticker = $<HTMLElement>('#ticker');
const hint = $<HTMLElement>('#hint');
const dock = $<HTMLDivElement>('#dock');
const dialogHost = $<HTMLDivElement>('#dialog');

let view: View3d | null = null;
try {
  view = createView3d(stage, {
    onArrive: id => { arrive(id); render(); },
    onNear: id => {
      state.near = id;
      // Walking away from a foreman ends the talk (Elisabeth and Hedda walk along).
      if (state.talk && id !== state.talk && !['pm', 'site', 'hms'].includes(state.talk)) state.talk = null;
      if (id && id === pendingTalk) { state.talk = id; state.selected = id; pendingTalk = null; }
      render();
    },
    onPick: id => {
      if (state.near === id) { state.talk = id; state.selected = id; }
      else { pendingTalk = id; view?.goTo(id); }
      render();
    },
  });
} catch {
  stage.innerHTML = '<p class="stage-fallback">3D-byggeplassen krever WebGL. Spillet fungerer, men uten bilde av byggeplassen.</p>';
}
/** The person the player clicked and is walking to, to talk to on arrival. */
let pendingTalk: string | null = null;
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
  if (d.action === 'talk') return `[data-action="talk"][data-who="${d.who}"]`;
  if (d.action) return `[data-action="${d.action}"]`;
  return null;
}

/** The scene on site for the dialog that is open (who stands where, and what is on the table). */
function sceneFor(which: DialogId | null, g: GameState | undefined): SceneSpec | null {
  if (!g) return null;
  if (which === 'event' || (which === 'fork' && state.meeting)) {
    const taskId = g.pending?.taskId ?? g.decisions[state.forkSeen].taskId;
    const eventId = g.pending?.eventId ?? g.decisions[state.forkSeen].eventId;
    return { kind: 'meeting', ids: [`foreman-${taskId}`, 'owner', 'pm', 'site'], eventId, eventKind: eventById(eventId).kind };
  }
  if (which === 'fork') return { kind: 'review', ids: ['pm', 'owner', 'site'] };
  if (which === 'kickoff') return { kind: 'kickoff', ids: ['pm', 'owner', 'site', 'foreman-A'] };
  if (which === 'hms') return { kind: 'hms', ids: ['hms', 'owner'] };
  if (which === 'review') return { kind: 'review', ids: ['site', 'owner', 'pm'] };
  return null;
}

/** Who speaks in the scene right now (the panel and the figure on site agree). */
function speakerFor(which: DialogId | null, g: GameState | undefined): string | null {
  if (!g) return null;
  if (which === 'event') { const l = meetingLines(scenario, g); return state.line < l.length ? l[state.line].who : null; }
  if (which === 'kickoff') { const l = kickoffLines(scenario); return state.line < l.length ? l[state.line].who : null; }
  if (which === 'review') return state.line === 0 ? 'pm' : state.line === 1 ? 'site' : null;
  if (which === 'hms') return 'hms';
  if (which === 'fork') return 'pm';
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

  const which = dialogFor(g, state);
  const objective = objectiveFor(scenario, g, state);
  const blocked = (which !== null && BLOCKING.includes(which)) || !!g?.pending || state.phase !== 'play';
  const inScene = which !== null && SCENES.includes(which);
  gameEl.classList.toggle('cinema', inScene);

  if (state.feedOpen && g) state.feedSeen = g.log.length;
  const railTop = `${renderObjective(objective, state, g, !!view)}${renderTeam(scenario, g, state, objective)}`;
  setHtml(rail, renderRail(state.panel, state.feedOpen, g && !state.feedOpen ? Math.min(99, g.log.length - state.feedSeen) : 0, railTop, railHints(scenario, g, result, which === 'review')));

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
  setHtml(dock, renderDock(scenario, g, state, blocked));

  // «E: snakk med …» when the player stands next to someone and nothing else is open.
  const canTalk = g && state.near && !inScene && !state.talk;
  hint.hidden = !canTalk;
  if (canTalk) setHtml(hint, `<kbd>E</kbd> Snakk med <b>${personName(scenario, state.near!)}</b>`);

  // The AI path is played once per game, when the game is done.
  if (g?.done && !state.ai) state.ai = aiPath(scenario, g.difficulty, g.seed);
  dialogHost.className = which === 'start' || which === 'final' ? 'host-center' : which === 'talk' ? 'host-talk' : which ? 'host-scene' : '';
  const plan = g && ((which === 'kickoff' && state.line >= kickoffLines(scenario).length) || (which === 'review' && state.line >= 2)) ? pmPlan(scenario, g) : [];
  const changed = setHtml(dialogHost, which === 'start' ? renderStart(scenario)
    : which === 'hms' ? renderHms(scenario, state)
    : which === 'kickoff' ? renderKickoff(scenario, g!, result, state.line, plan)
    : which === 'fork' ? renderFork(scenario, g!.decisions[state.forkSeen])
    : which === 'event' ? renderEvent(scenario, g!, state.line)
    : which === 'review' ? renderReview(scenario, g!, result, reviewTasks(scenario, g!, state), state.line, plan)
    : which === 'final' ? renderFinal(scenario, g!, state.story, state.ai, state.scolded)
    : which === 'talk' ? renderTalk({ scenario, modes: {}, result, baseline, game: g, selected: state.talk!, plan: state.talk === 'pm' && g ? pmPlan(scenario, g) : [] })
    : '');

  if (view) {
    view.setInset(0);
    const nextKey = g ? `${g.seed}:${g.week}:${g.pending?.eventId ?? ''}:${g.done}:${g.decisions.length}:${g.log.length}:${g.tasks.map(t => t.mode).join('')}` : 'none';
    if (nextKey !== viewKey) {
      viewKey = nextKey;
      view.update(scenario, g);
    }
    const cast: CastState = {
      phase: state.phase,
      objective: objective ? { id: objective.id, spot: objective.spot, kind: g?.pending ? eventById(g.pending.eventId).kind : undefined } : null,
      scene: sceneFor(which, g),
      speaker: speakerFor(which, g),
      ppe: ppeOf(state),
      locked: !g || (which !== null && which !== 'talk'),
      gateChecked: state.hmsSeen.includes('intro'),
    };
    view.setCast(cast);
  }

  const again = key ? app.querySelector<HTMLElement>(key) : null;
  if (again) again.focus();
  // A new dialog takes focus (its main button first) without scrolling away from its heading.
  else if (changed) (dialogHost.querySelector<HTMLElement>('.primary') ?? dialogHost.querySelector<HTMLElement>('.dialog button, .scene-panel button'))?.focus({ preventScroll: true });
}

// Time: one week per tick while playing; a decision or a meeting pauses until it is done.
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

/** Is something waiting for the player (a decision, a meeting, a review or a check)? */
function waiting(): boolean {
  const g = state.game;
  if (!g) return false;
  const which = dialogFor(g, state);
  return !!g.pending || (which !== null && BLOCKING.includes(which)) || state.phase !== 'play';
}

/** Starts the clock again after a pause, if it was running and nothing is waiting any more. */
function resumeIfFree() {
  if (state.resume && !waiting()) {
    state.resume = false;
    setPlaying(true);
  }
}

function tick() {
  const g = state.game;
  if (!g) return;
  step(scenario, g);
  if (waiting()) {
    state.resume = state.resume || state.playing;
    setPlaying(false);
  }
  if (g.done) setPlaying(false);
  if (pointerDown) renderAfterPointer = true;
  else render();
}

/** Elisabeth reports when a choice or a staffing change moves the forecast. */
let lastNote: ForecastNote | null = null;
function noteForecast(g: GameState, before: Outcome) {
  const next = noteForecastChange(g.log, g.week, before, outcome(scenario, g), lastNote);
  g.log = next.log;
  lastNote = next.note;
}

/** The player reached whoever waited for them. */
function arrive(id: string) {
  const g = state.game;
  if (!g) return;
  state.talk = null;
  if (state.phase === 'intro' && id === 'hms' && !state.hmsSeen.includes('intro')) { state.hms = 'intro'; state.hmsReply = null; return; }
  if (state.phase === 'intro' && id === 'pm') { state.phase = 'kickoff'; state.line = 0; return; }
  if (g.pending && id === `foreman-${g.pending.taskId}`) { state.meeting = true; state.line = 0; }
}

function startGame(difficulty: Difficulty, skipIntro: boolean) {
  setPlaying(false);
  // Every game is a story that can be solved within both targets.
  state.story = findStory(scenario, difficulty, Math.floor(Math.random() * 1e6) + 1);
  state.game = newGame(scenario, difficulty, state.story.seed);
  Object.assign(state, newStory(skipIntro));
  state.ai = undefined;
  state.finalSeen = false;
  state.forkSeen = 0;
  state.feedSeen = 0;
  state.resume = false;
  state.menu = false;
  state.panel = null;
  pendingTalk = null;
  prevForecast = null;
  render();
  // Without the intro, straight into the build: the clock starts running.
  if (skipIntro) setPlaying(true);
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
    case 'start': startGame(action.dataset.difficulty as Difficulty, app.querySelector<HTMLInputElement>('#skip-intro')?.checked ?? false); return;
    case 'new':
      setPlaying(false);
      state.game = undefined;
      state.ai = undefined;
      state.resume = false;
      state.panel = null;
      Object.assign(state, newStory());
      break;
    case 'play': setPlaying(true); break;
    case 'pause': setPlaying(false); break;
    case 'step': if (g && !waiting()) step(scenario, g); break;
    case 'speed':
      state.speed = Number(action.dataset.speed) as Speed;
      if (state.playing) setPlaying(true);
      break;
    case 'menu': state.menu = !state.menu; break;
    case 'feed': state.feedOpen = !state.feedOpen; break;
    case 'close-panel': state.panel = null; break;
    case 'camera': view?.resetCamera(); break;
    case 'goto': view?.goTo('objective'); break;
    case 'arrive': { const o = objectiveFor(scenario, g, state); if (o) arrive(o.id); break; }
    case 'skip-intro':
      if (!state.hmsSeen.includes('intro')) state.hmsSeen = [...state.hmsSeen, 'intro'];
      state.hms = null;
      state.phase = 'kickoff';
      state.line = 0;
      break;
    case 'talk': state.talk = action.dataset.who!; state.selected = state.talk; break;
    case 'talk-close': state.talk = null; break;
    case 'line-next': state.line++; break;
    case 'line-skip': state.line = 99; break;
    case 'line-replay': state.line = 0; break;
    case 'trigger':
      if (g && canTrigger(scenario, g, action.dataset.event!)) {
        state.resume = state.resume || state.playing;
        setPlaying(false);
        triggerEvent(scenario, g, action.dataset.event!);
      }
      state.menu = false;
      break;
    case 'choose':
      // Time stays paused: the fork card comes first, and «Avslutt møtet» resumes play.
      if (g?.pending) {
        const before = g.pending.before;
        choose(scenario, g, action.dataset.option!);
        noteForecast(g, before);
      }
      break;
    case 'fork-continue':
      if (g) {
        const done = g.decisions[state.forkSeen];
        state.forkSeen = g.decisions.length;
        state.line = 0;
        // A queued decision for the same foreman goes on in the same meeting; another foreman waits on site.
        state.meeting = !!g.pending && g.pending.taskId === done?.taskId;
        resumeIfFree();
      }
      break;
    case 'kickoff-done':
      if (g) {
        state.phase = 'play';
        state.line = 0;
        state.reviewed = g.chapter;
        setPlaying(true);
      }
      break;
    case 'review-done':
      if (g) {
        state.reviewed = g.chapter;
        state.line = 0;
        const due = hmsDue(state);
        if (due) { state.hms = due.id; state.hmsReply = null; }
        resumeIfFree();
      }
      break;
    case 'hms-reply':
      if (state.hms) {
        state.hmsReply = action.dataset.reply!;
        if (hmsById(state.hms).replies.find(r => r.id === state.hmsReply)?.scolded) state.scolded++;
      }
      break;
    case 'hms-done':
      if (state.hms) {
        state.hmsSeen = [...state.hmsSeen, state.hms];
        state.hms = null;
        state.hmsReply = null;
        resumeIfFree();
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

// Keyboard: WASD/arrows walk (in the 3D view), E talks, G goes to the objective, space plays/pauses,
// N steps, 1/2/4 set the speed, C switches the camera, M the messages, Esc closes.
window.addEventListener('keydown', e => {
  const el = e.target as HTMLElement;
  if (e.ctrlKey || e.metaKey || e.altKey || el.closest('input, textarea, select')) return;
  const g = state.game;
  const free = g && !g.done && !waiting();
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
  else if (k === 'g') view?.goTo('objective');
  else if (k === 'e' && state.near && dialogFor(g, state) === null) { state.talk = state.near; state.selected = state.near; }
  else if (k === 'escape') { state.panel = null; state.menu = false; state.talk = null; }
  else return;
  render();
});

// Pause the 3D loop while the tab is hidden.
document.addEventListener('visibilitychange', () => view?.setActive(!document.hidden));
window.addEventListener('resize', () => render());

render();

// Demo and presentation: ?uke=40 starts an easy game (without the intro) and fast-forwards to that
// week, following Elisabeth; &hendelse=water then raises that event and opens the meeting, and
// &steg=9 jumps to that line in it (past the last line: the decision).
// ?scene=hms, ?scene=kickoff (&steg=9 for the plan) or ?scene=intro opens that part of the intro.
const params = new URLSearchParams(location.search);
const demoWeek = Number(params.get('uke'));
const demoScene = params.get('scene');
if (demoScene && !(demoWeek > 0)) {
  startGame('easy', false);
  if (demoScene === 'hms') state.hms = 'intro';
  if (demoScene === 'kickoff') { state.hmsSeen = ['intro']; state.phase = 'kickoff'; state.line = Number(params.get('steg') ?? 0); }
  render();
}
if (demoWeek > 0) {
  startGame('easy', true);
  setPlaying(false);
  const g = state.game!;
  while (!g.done && g.week < demoWeek) {
    if (g.pending) choose(scenario, g, g.pending.recommended);
    else step(scenario, g);
  }
  state.forkSeen = g.decisions.length;
  state.reviewed = g.chapter;
  state.hmsSeen = ['intro', 'ground', 'structure', 'services'].slice(0, 1 + [0, 2, 4].filter(c => c <= g.chapter).length);
  const ev = params.get('hendelse');
  if (ev && canTrigger(scenario, g, ev)) triggerEvent(scenario, g, ev);
  if (g.pending) { state.meeting = true; state.line = Number(params.get('steg') ?? 0); }
  render();
}
