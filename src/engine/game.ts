// Week-by-week game: the owner plays from construction start to completion.
// Pure and deterministic: the same seed, difficulty and choices give the same game.
import { voiceReason } from './advisor';
import { CHAPTERS, PROLOGUE, chapterOf } from './chapters';
import { EVENTS, eventById, type EventDef, type EventOption } from './events';
import type { Mode, Scenario, Task } from './scenario';
import type { SimulationResult, TaskResult } from './simulate';

export type Difficulty = 'easy' | 'medium' | 'hard';

/** How often the AI roles recommend the best option. */
export const RELIABILITY: Record<Difficulty, number> = { easy: 1, medium: 0.8, hard: 0.6 };

export interface TaskState {
  id: string;
  crew: number;
  mode: Mode;
  hoursDone: number;
  /** The task's total hours in this game (strategy choices can change it). */
  work: number;
  /** Weeks the task stands still when it is next active. */
  stall: number;
  /** The event behind the current stall, if any. */
  stallCause: string | null;
  start: number | null;
  finish: number | null;
  labour: number;
  materials: number;
}

/** An end result: the week the building is finished and the total, MNOK. */
export interface Outcome { weeks: number; total: number }

export interface OptionOutcome extends Outcome { optionId: string }

/** One AI role's recommendation at a decision. */
export interface Voice {
  personId: string;
  optionId: string;
  reason: string;
  /** This role raised the event. */
  raised: boolean;
}

export interface Pending {
  eventId: string;
  taskId: string;
  /** The Prosjektleder's (official) recommendation. */
  recommended: string;
  reasoning: string;
  /** The trade-off in one short line. */
  dilemma: string;
  /** Today's forecast, before choosing. */
  before: Outcome;
  /** The forecast after each option, in option order (no new events). */
  outcomes: OptionOutcome[];
  /** Prosjektleder, Site manager and the affected discipline's foreman. */
  voices: Voice[];
  /** The Prosjektleder picked the best option (not one of the difficulty's mistakes). */
  bestPicked: boolean;
}

/** At most this many challenges per game (strategy choices included). */
export const MAX_CHALLENGES = 9;

/** A delayed consequence waiting to land. */
export interface Scheduled {
  week: number;
  cost: number;
  delay: number;
  taskId: string;
  text: string;
  eventId: string;
  from: string;
}

/** The fork at one decision: the player's path and the recommended path from the same state. */
export interface Decision {
  week: number;
  eventId: string;
  taskId: string;
  chosen: string;
  recommended: string;
  followed: boolean;
  chosenOutcome: Outcome;
  recommendedOutcome: Outcome;
}

export interface LogEntry {
  week: number;
  text: string;
  /** The person who reports it (feed). */
  from?: string;
}

export interface GameState {
  difficulty: Difficulty;
  seed: number;
  rng: number;
  week: number;
  tasks: TaskState[];
  overhead: number;
  /** Extra cost from events, MNOK. */
  events: number;
  fired: string[];
  pending: Pending | null;
  /** Start triggers waiting for the pending decision to be chosen. */
  queue: { eventId: string; taskId: string }[];
  /** Delayed consequences that have not landed yet. */
  scheduled: Scheduled[];
  /** Every option chosen, for follow-up events. */
  choices: { eventId: string; optionId: string }[];
  /** The fork records, one per decision. */
  decisions: Decision[];
  /** Index of the latest chapter announced (−1 = prologue). */
  chapter: number;
  /** The week a start trigger fired (no random roll that week). */
  quiet: number;
  log: LogEntry[];
  randomEvents: boolean;
  done: boolean;
}

const MAX_WEEKS = 1000;
const EPS = 1e-6;

// mulberry32: small, seedable and good enough for a game.
function rand(g: GameState): number {
  g.rng = (g.rng + 0x6d2b79f5) >>> 0;
  let t = g.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** A copy for forecasts: without the log and the fork records, so those never grow. */
function clone(g: GameState): GameState {
  const { log: _log, decisions: _decisions, pending, ...rest } = g;
  const c = structuredClone(rest) as GameState;
  c.log = [];
  c.decisions = [];
  c.pending = pending ? structuredClone(pending) : null;
  return c;
}
const taskIndex = (s: Scenario, id: string) => s.tasks.findIndex(t => t.id === id);
const mnok = (x: number) => x.toFixed(2).replace('.', ',');

export function newGame(s: Scenario, difficulty: Difficulty, seed: number, opts: { randomEvents?: boolean } = {}): GameState {
  return {
    difficulty,
    seed,
    rng: seed >>> 0,
    week: 0,
    tasks: s.tasks.map(t => ({ id: t.id, crew: t.crew, mode: 'normal', hoursDone: 0, work: t.hours, stall: 0, stallCause: null, start: null, finish: null, labour: 0, materials: 0 })),
    overhead: 0,
    events: 0,
    fired: [],
    pending: null,
    queue: [],
    scheduled: [],
    choices: [],
    decisions: [],
    chapter: -1,
    quiet: -1,
    log: [{ week: 0, text: PROLOGUE, from: 'pm' }],
    randomEvents: opts.randomEvents ?? true,
    done: false,
  };
}

export function crewBounds(s: Scenario, task: Task) {
  return { min: Math.ceil(task.crew * s.crewRange.min), max: Math.floor(task.crew * s.crewRange.max) };
}

/** Weekly capacity and cost per worked hour for a crew and mode. */
export function crewPlan(s: Scenario, task: Task, crew: number, mode: Mode) {
  const base = task.crew;
  const hired = mode === 'hire' ? Math.ceil(crew * s.hireShare) : 0;
  // The site is planned for the base crew (plus the planned hire share when hiring).
  // Everyone above that, own or hired, gets in each other's way.
  const planned = base + (mode === 'hire' ? Math.ceil(base * s.hireShare) : 0);
  const workers = crew + hired;
  const effective = Math.min(workers, planned) + Math.max(0, workers - planned) * s.crowdingProductivity;
  const hoursPerWeek = mode === 'overtime' ? s.overtimeHoursPerWeek : s.hoursPerWeek;
  const capacity = effective * hoursPerWeek;

  let ownFactor = s.factors.normal;
  if (mode === 'overtime') {
    const overtimeShare = (s.overtimeHoursPerWeek - s.hoursPerWeek) / s.overtimeHoursPerWeek;
    ownFactor = (1 - overtimeShare) * s.factors.normal + overtimeShare * s.factors.overtime;
  }
  // Everyone is paid for all their hours, also the ones lost to crowding.
  const perHour = (task.rate * (crew * ownFactor + hired * s.factors.hire)) / effective;
  return { effective, hired, hoursPerWeek, capacity, perHour };
}

const isActive = (t: TaskState) => t.start !== null && t.finish === null;

const isReady = (s: Scenario, g: GameState, task: Task, w: number) =>
  task.predecessors.every(p => {
    const f = g.tasks[taskIndex(s, p)].finish;
    return f !== null && f <= w;
  });

const foremanOf = (taskId: string) => `foreman-${taskId}`;

/** Lands a delayed consequence. `stall` is false at completion (cost only). */
function land(s: Scenario, g: GameState, x: Scheduled, stall: boolean) {
  g.events += x.cost;
  const t = g.tasks[taskIndex(s, x.taskId)];
  const stalls = stall && t.finish === null && x.delay > 0;
  if (stalls) {
    // An earlier stall keeps its cause.
    if (t.stall === 0) t.stallCause = x.eventId;
    t.stall += x.delay;
  }
  g.log.push({ week: g.week, from: x.from, text: `Konsekvens: ${x.text}. +${mnok(x.cost)} MNOK${stalls ? `, ${x.taskId} står ${x.delay} uke${x.delay === 1 ? '' : 'r'}` : ''}.` });
}

function announceChapter(s: Scenario, g: GameState, week: number) {
  const c = chapterOf(s, g);
  if (!c) return;
  const k = CHAPTERS.indexOf(c);
  // Chapters only move forward, also when an earlier task runs late.
  // If the story jumps ahead, every skipped chapter is still introduced, in order.
  for (let j = g.chapter + 1; j <= k; j++) g.log.push({ week, from: 'pm', text: CHAPTERS[j].intro });
  if (k > g.chapter) g.chapter = k;
}

function startTask(s: Scenario, g: GameState, i: number, w: number) {
  const t = g.tasks[i];
  t.start = w;
  g.log.push({ week: w, from: foremanOf(t.id), text: `${t.id} ${s.tasks[i].name} starter.` });
}

/** Advances one week. Does nothing while a decision is pending or the game is over. */
export function step(s: Scenario, g: GameState): void {
  if (g.done || g.pending) return;
  const w = g.week;

  // Delayed consequences that are due land first (also in forecast copies).
  if (g.scheduled.length) {
    const due = g.scheduled.filter(x => x.week <= w);
    g.scheduled = g.scheduled.filter(x => x.week > w);
    for (const x of due) land(s, g, x, true);
  }

  // Strategy choices: raised in the week their task becomes ready, before any work.
  if (g.randomEvents) {
    const due: { ev: EventDef; i: number }[] = [];
    for (const ev of EVENTS) {
      if (ev.trigger !== 'start' || g.fired.includes(ev.id)) continue;
      const i = taskIndex(s, ev.taskIds[0]);
      const t = g.tasks[i];
      if (t.start === null && t.finish === null && isReady(s, g, s.tasks[i], w)) due.push({ ev, i });
    }
    if (due.length) {
      g.quiet = w;
      for (const { ev, i } of due) {
        g.fired.push(ev.id);
        startTask(s, g, i, w);
      }
      announceChapter(s, g, w);
      raise(s, g, due[0].ev, s.tasks[due[0].i].id);
      for (const d of due.slice(1)) g.queue.push({ eventId: d.ev.id, taskId: s.tasks[d.i].id });
      return;
    }
  }

  s.tasks.forEach((task, i) => {
    const t = g.tasks[i];
    if (t.finish !== null) return;
    if (!isReady(s, g, task, w)) return;
    if (t.start === null) startTask(s, g, i, w);
    if (t.stall > 0) {
      t.stall--;
      if (t.stall === 0) t.stallCause = null;
      return;
    }
    const plan = crewPlan(s, task, t.crew, t.mode);
    const work = Math.min(plan.capacity, t.work - t.hoursDone);
    t.hoursDone += work;
    t.labour += (work * plan.perHour) / 1e6;
    // Materials follow the share of the work done, so the full amount is reached at the finish.
    t.materials = (task.materials * t.hoursDone) / t.work;
    if (t.work - t.hoursDone < EPS) {
      t.hoursDone = t.work;
      t.materials = task.materials;
      t.finish = w + 1;
      g.log.push({ week: w + 1, from: foremanOf(task.id), text: `${task.id} ${task.name} er ferdig.` });
    }
  });
  if (w >= s.overhead.fromWeek) g.overhead += s.overhead.perWeek;
  g.week = w + 1;
  announceChapter(s, g, w);

  if (g.tasks.every(t => t.finish !== null)) {
    g.done = true;
    // Whatever is still outstanding is charged now, so the result equals the forecast.
    const rest = g.scheduled;
    g.scheduled = [];
    for (const x of rest) land(s, g, x, false);
    g.log.push({ week: g.week, from: 'pm', text: 'Bygget er ferdigstilt.' });
  } else if (g.randomEvents && g.quiet !== w && roomForChallenge(g)) {
    for (const ev of EVENTS) {
      if (ev.chance <= 0 || g.fired.includes(ev.id)) continue;
      if (ev.requires && !g.choices.some(c => c.eventId === ev.requires!.eventId && c.optionId === ev.requires!.optionId)) continue;
      const target = targetTask(s, g, ev);
      if (target === null || !isActive(g.tasks[taskIndex(s, target)])) continue;
      if (rand(g) < ev.chance) {
        g.fired.push(ev.id);
        raise(s, g, ev, target);
        break;
      }
    }
  }
}

/** Runs until the game ends or a decision is needed. */
export function runUntilDecision(s: Scenario, g: GameState): void {
  while (!g.done && !g.pending && g.week < MAX_WEEKS) step(s, g);
}

function targetTask(s: Scenario, g: GameState, ev: EventDef): string | null {
  return ev.taskIds.find(id => g.tasks[taskIndex(s, id)].finish === null) ?? null;
}

/**
 * Is there room for another random or button challenge? The strategy choices that are still
 * to come are always kept room for, so a game never has more than MAX_CHALLENGES.
 */
export function roomForChallenge(g: GameState): boolean {
  const strategiesLeft = EVENTS.filter(e => e.trigger === 'start' && !g.fired.includes(e.id)).length;
  return g.fired.length + strategiesLeft < MAX_CHALLENGES;
}

/** A scenario button can start an event while its task is not finished (and there is room). */
export function canTrigger(s: Scenario, g: GameState, eventId: string): boolean {
  const ev = eventById(eventId);
  return ev.button && !g.done && !g.pending && !g.fired.includes(ev.id) && targetTask(s, g, ev) !== null && roomForChallenge(g);
}

export function triggerEvent(s: Scenario, g: GameState, eventId: string): void {
  if (!canTrigger(s, g, eventId)) return;
  const ev = eventById(eventId);
  if (!g.fired.includes(ev.id)) g.fired.push(ev.id);
  raise(s, g, ev, targetTask(s, g, ev)!);
}

function applyOption(s: Scenario, g: GameState, taskId: string, ev: EventDef, o: EventOption) {
  const t = g.tasks[taskIndex(s, taskId)];
  g.events += o.cost;
  t.stall += o.delay;
  if (o.delay > 0) t.stallCause = ev.id;
  if (o.setMode) t.mode = o.setMode;
  // A work change applies to the remaining hours only.
  if (o.work) t.work = t.hoursDone + (t.work - t.hoursDone) * (1 + o.work);
  if (o.later) {
    g.scheduled.push({
      week: g.week + o.later.weeks, cost: o.later.cost, delay: o.later.delay,
      taskId: o.later.taskId ?? taskId, text: o.later.text, eventId: ev.id, from: ev.raisedBy,
    });
  }
}

/** Forecast of the end result if the game ran on with today's choices and no new events. */
export function outcome(s: Scenario, g: GameState): Outcome {
  const f = clone(g);
  f.pending = null;
  f.randomEvents = false;
  runUntilDecision(s, f);
  return { weeks: f.week, total: totalOf(f) };
}

/** How far a result misses the targets, as the sum of the relative overruns (0 = both met). */
export function targetScore(s: Scenario, r: Outcome): number {
  return Math.max(0, (r.total - s.target.total) / s.target.total) + Math.max(0, (r.weeks - s.target.weeks) / s.target.weeks);
}

const byTarget = (s: Scenario) => (a: Outcome, b: Outcome) =>
  targetScore(s, a) - targetScore(s, b) || a.total - b.total || a.weeks - b.weeks;

/** Scores every option by its forecast; the best is the one closest to both targets. */
function bestOption(s: Scenario, g: GameState, ev: EventDef, taskId: string) {
  const scored = ev.options.map(o => {
    const f = clone(g);
    f.pending = null;
    applyOption(s, f, taskId, ev, o);
    return { o, ...outcome(s, f) };
  });
  return { scored, best: [...scored].sort(byTarget(s))[0] };
}

/** The option that is closest to both targets, from the stored previews. */
export const bestOf = (s: Scenario, p: Pending): string => [...p.outcomes].sort(byTarget(s))[0].optionId;

function dilemmaFor(ev: EventDef): string {
  if (ev.dilemma) return ev.dilemma;
  const cheapest = [...ev.options].sort((a, b) => a.cost - b.cost || a.delay - b.delay)[0];
  const fastest = [...ev.options].sort((a, b) => a.delay - b.delay || a.cost - b.cost)[0];
  if (ev.kind === 'opportunity') return `Dilemma: spare penger nå, eller holde fremdriften?`;
  if (ev.kind === 'change') return 'Dilemma: betale for endringen nå, eller ta en større regning senere?';
  if (cheapest === fastest) return `«${cheapest.label}» er både billigst og raskest, men har andre ulemper.`;
  return `Dilemma: «${cheapest.label}» er billigst, «${fastest.label}» er raskest. Hver uke koster rigg og drift.`;
}

/**
 * The three voices: Prosjektleder (the official recommendation), Site manager (least
 * delay) and the affected discipline's foreman (lowest cost now). Ties go to the lower
 * total forecast, then to option order. Deterministic: no rng.
 */
function voicesFor(s: Scenario, ev: EventDef, taskId: string, outcomes: OptionOutcome[], recommended: string): Voice[] {
  const opt = (id: string) => ev.options.find(o => o.id === id)!;
  const out = (id: string) => outcomes.find(o => o.optionId === id)!;
  // Array.sort is stable, so equal options keep their order.
  const site = [...outcomes].sort((a, b) => a.weeks - b.weeks || a.total - b.total)[0].optionId;
  const foreman = [...outcomes].sort((a, b) => opt(a.optionId).cost - opt(b.optionId).cost || a.total - b.total)[0].optionId;
  const voice = (personId: string, lens: 'pm' | 'site' | 'foreman', optionId: string): Voice =>
    ({ personId, optionId, reason: voiceReason(lens, s, opt(optionId), out(optionId)), raised: ev.raisedBy === personId });
  return [voice('pm', 'pm', recommended), voice('site', 'site', site), voice(foremanOf(taskId), 'foreman', foreman)];
}

function raise(s: Scenario, g: GameState, ev: EventDef, taskId: string) {
  const before = outcome(s, g);
  const { scored, best } = bestOption(s, g, ev, taskId);
  const others = scored.filter(x => x !== best);
  // The AI role is only as reliable as the difficulty allows.
  const roll = rand(g);
  const alt = rand(g);
  const pick = roll < RELIABILITY[g.difficulty] || others.length === 0
    ? best
    : others[Math.floor(alt * others.length)];
  const outcomes = scored.map(x => ({ optionId: x.o.id, weeks: x.weeks, total: x.total }));
  const voices = voicesFor(s, ev, taskId, outcomes, pick.o.id);
  g.pending = { eventId: ev.id, taskId, recommended: pick.o.id, reasoning: voices[0].reason, dilemma: dilemmaFor(ev), before, outcomes, voices, bestPicked: pick === best };
  g.log.push({ week: g.week, from: ev.raisedBy, text: `${ev.title} (${taskId}).` });
}

/**
 * Works out the open decision's forecasts again after a staffing change (no rng: the same
 * game stays the same). A correct recommendation follows the new best option; a wrong one stays.
 */
function refreshPending(s: Scenario, g: GameState) {
  const p = g.pending;
  if (!p) return;
  const ev = eventById(p.eventId);
  const { scored, best } = bestOption(s, g, ev, p.taskId);
  const recommended = p.bestPicked ? best.o.id : p.recommended;
  const outcomes = scored.map(x => ({ optionId: x.o.id, weeks: x.weeks, total: x.total }));
  const voices = voicesFor(s, ev, p.taskId, outcomes, recommended);
  g.pending = { ...p, recommended, reasoning: voices[0].reason, before: outcome(s, g), outcomes, voices };
}

export function choose(s: Scenario, g: GameState, optionId: string): void {
  const p = g.pending;
  if (!p) return;
  const ev = eventById(p.eventId);
  const o = ev.options.find(x => x.id === optionId);
  if (!o) throw new Error(`Unknown option ${optionId}`);
  applyOption(s, g, p.taskId, ev, o);
  g.choices.push({ eventId: ev.id, optionId });
  const followed = optionId === p.recommended;
  const strip = ({ weeks, total }: Outcome): Outcome => ({ weeks, total });
  g.decisions.push({
    week: g.week, eventId: ev.id, taskId: p.taskId, chosen: optionId, recommended: p.recommended, followed,
    chosenOutcome: strip(p.outcomes.find(x => x.optionId === optionId)!),
    recommendedOutcome: strip(p.outcomes.find(x => x.optionId === p.recommended)!),
  });
  g.log.push({ week: g.week, from: 'owner', text: `Valgte «${o.label}» (${followed ? 'fulgte anbefalingen' : 'valgte annerledes enn anbefalingen'}).` });
  g.pending = null;
  // A strategy choice that came while this decision was open is raised now.
  const next = g.queue.shift();
  if (next) raise(s, g, eventById(next.eventId), next.taskId);
}

// Staffing can also change while a decision is open; its forecasts are then worked out again.
function editable(s: Scenario, g: GameState, taskId: string) {
  const t = g.tasks[taskIndex(s, taskId)];
  return g.done || t.finish !== null ? null : t;
}

export function setCrew(s: Scenario, g: GameState, taskId: string, crew: number): void {
  const t = editable(s, g, taskId);
  if (!t) return;
  const { min, max } = crewBounds(s, s.tasks[taskIndex(s, taskId)]);
  const next = Math.max(min, Math.min(max, Math.round(crew)));
  if (next === t.crew) return;
  t.crew = next;
  refreshPending(s, g);
}

export function setMode(s: Scenario, g: GameState, taskId: string, mode: Mode): void {
  const t = editable(s, g, taskId);
  if (!t || t.mode === mode) return;
  t.mode = mode;
  refreshPending(s, g);
}

const totalOf = (g: GameState) =>
  g.tasks.reduce((sum, t) => sum + t.labour + t.materials, 0) + g.overhead + g.events;

/** Cost incurred so far, MNOK. */
export const spent = totalOf;

/** Share of each task's work that is done, 0–1 (of this game's total hours). */
export const progress = (s: Scenario, g: GameState) =>
  Object.fromEntries(s.tasks.map((t, i) => [t.id, g.tasks[i].hoursDone / g.tasks[i].work]));

/** Forecast in the same shape as simulate(), so all tabs can show it. */
export function forecast(s: Scenario, g: GameState): SimulationResult {
  const f = clone(g);
  f.pending = null;
  f.randomEvents = false;
  runUntilDecision(s, f);
  const weeks = f.week;

  const dur = (i: number) => f.tasks[i].finish! - f.tasks[i].start!;
  const latestFinish = new Map<string, number>();
  const latestFinishOf = (id: string): number => {
    if (!latestFinish.has(id)) {
      const succ = s.tasks.map((t, i) => ({ t, i })).filter(x => x.t.predecessors.includes(id));
      latestFinish.set(id, Math.min(weeks, ...succ.map(x => latestFinishOf(x.t.id) - dur(x.i))));
    }
    return latestFinish.get(id)!;
  };

  const tasks: TaskResult[] = s.tasks.map((task, i) => {
    const t = f.tasks[i];
    const now = g.tasks[i];
    const plan = crewPlan(s, task, now.crew, now.mode);
    const slack = latestFinishOf(task.id) - t.finish!;
    return {
      id: task.id,
      mode: now.mode,
      ownCrew: now.crew,
      hiredCrew: plan.hired,
      hoursPerWeek: plan.hoursPerWeek,
      weeks: dur(i),
      start: t.start!,
      finish: t.finish!,
      slack,
      critical: slack === 0,
      labour: t.labour,
      materials: t.materials,
      cost: t.labour + t.materials,
    };
  });
  const labour = tasks.reduce((a, t) => a + t.labour, 0);
  const materials = tasks.reduce((a, t) => a + t.materials, 0);
  return {
    tasks,
    weeks,
    overheadWeeks: Math.max(0, weeks - s.overhead.fromWeek),
    overhead: f.overhead,
    events: f.events,
    labour,
    materials,
    total: labour + materials + f.overhead + f.events,
    criticalPath: tasks.filter(t => t.critical).sort((a, b) => a.start - b.start).map(t => t.id),
  };
}

/** A change the project manager recommends to use the crews as well as possible. */
export interface StaffingChange { taskId: string; crew: number; mode: Mode }

/**
 * The project manager's staffing plan: for each discipline that is not finished, the
 * crew and mode that bring the forecast closest to the targets (greedy, in task order).
 */
export function pmPlan(s: Scenario, g: GameState): StaffingChange[] {
  if (g.done) return [];
  const work = clone(g);
  const changes: StaffingChange[] = [];
  // The forecast of the plan so far; it only changes when a change is kept.
  let current = outcome(s, work);
  s.tasks.forEach((task, i) => {
    const t = work.tasks[i];
    if (t.finish !== null) return;
    let best = { crew: t.crew, mode: t.mode, ...current };
    for (const mode of ['normal', 'overtime', 'hire'] as Mode[]) {
      const o = { crew: task.crew, mode };
      if (o.crew === t.crew && o.mode === t.mode) continue;
      const trial = clone(work);
      trial.tasks[i].crew = o.crew;
      trial.tasks[i].mode = o.mode;
      const r = { ...o, ...outcome(s, trial) };
      if (byTarget(s)(r, best) < 0) best = r;
    }
    if (best.crew !== t.crew || best.mode !== t.mode) {
      t.crew = best.crew;
      t.mode = best.mode;
      current = { weeks: best.weeks, total: best.total };
      changes.push({ taskId: task.id, crew: best.crew, mode: best.mode });
    }
  });
  return changes;
}

export function applyPlan(s: Scenario, g: GameState, plan: StaffingChange[]): void {
  for (const c of plan) {
    setCrew(s, g, c.taskId, c.crew);
    setMode(s, g, c.taskId, c.mode);
  }
}

/** One step of a story's solution: the staffing plan, or the choice at an event. */
export type StoryStep =
  | { kind: 'plan'; week: number; changes: StaffingChange[] }
  | { kind: 'choice'; week: number; eventId: string; taskId: string; optionId: string };

export interface Story { seed: number; steps: StoryStep[]; weeks: number; total: number; solved: boolean }

/** Plays a seed with the PM plan (at the start and after each choice) and a chooser at every decision. */
function playWith(s: Scenario, difficulty: Difficulty, seed: number, pick: (g: GameState) => string): Story {
  const g = newGame(s, difficulty, seed);
  const steps: StoryStep[] = [];
  const plan = () => {
    const changes = pmPlan(s, g);
    if (changes.length) {
      applyPlan(s, g, changes);
      steps.push({ kind: 'plan', week: g.week, changes });
    }
  };
  plan();
  while (!g.done && g.week < MAX_WEEKS) {
    runUntilDecision(s, g);
    if (!g.pending) break;
    const optionId = pick(g);
    steps.push({ kind: 'choice', week: g.week, eventId: g.pending.eventId, taskId: g.pending.taskId, optionId });
    choose(s, g, optionId);
    plan();
  }
  return { seed, steps, weeks: g.week, total: totalOf(g), solved: verdict(s, g) === 'on-target' };
}

/** Plays a seed with perfect information: the PM plan, and the best option at every event. */
export function solveStory(s: Scenario, difficulty: Difficulty, seed: number): Story {
  return playWith(s, difficulty, seed, g => bestOf(s, g.pending!));
}

/**
 * The AI path: the same seed played with the PM plan and the Prosjektleder's recommendation
 * at every decision (including the difficulty's mistakes). It can meet other events than the player.
 */
export function aiPath(s: Scenario, difficulty: Difficulty, seed: number): Story {
  return playWith(s, difficulty, seed, g => g.pending!.recommended);
}

/** Finds a seed from `start` whose story can be solved within both targets. */
export function findStory(s: Scenario, difficulty: Difficulty, start: number, tries = 40): Story {
  let best: Story | null = null;
  for (let k = 0; k < tries; k++) {
    const story = solveStory(s, difficulty, start + k);
    if (story.solved) return story;
    if (!best || targetScore(s, story) < targetScore(s, best)) best = story;
  }
  return best!;
}

export type Verdict = 'on-target' | 'over-budget' | 'late' | 'over-and-late';

export function verdict(s: Scenario, g: GameState): Verdict {
  // Compared in whole øre, like every total the player sees.
  const over = Math.round(totalOf(g) * 100) > Math.round(s.target.total * 100);
  const late = g.week > s.target.weeks;
  return over && late ? 'over-and-late' : over ? 'over-budget' : late ? 'late' : 'on-target';
}
