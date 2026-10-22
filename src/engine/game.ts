// Week-by-week game: the owner plays from construction start to completion.
// Pure and deterministic: the same seed, difficulty and choices give the same game.
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
  /** Weeks the task stands still when it is next active. */
  stall: number;
  /** The event behind the current stall, if any. */
  stallCause: string | null;
  start: number | null;
  finish: number | null;
  labour: number;
  materials: number;
}

export interface Pending {
  eventId: string;
  taskId: string;
  recommended: string;
  reasoning: string;
  /** The trade-off in one short line. */
  dilemma: string;
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
  log: { week: number; text: string }[];
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

const clone = (g: GameState): GameState => structuredClone(g);
const taskIndex = (s: Scenario, id: string) => s.tasks.findIndex(t => t.id === id);

export function newGame(s: Scenario, difficulty: Difficulty, seed: number, opts: { randomEvents?: boolean } = {}): GameState {
  return {
    difficulty,
    seed,
    rng: seed >>> 0,
    week: 0,
    tasks: s.tasks.map(t => ({ id: t.id, crew: t.crew, mode: 'normal', hoursDone: 0, stall: 0, stallCause: null, start: null, finish: null, labour: 0, materials: 0 })),
    overhead: 0,
    events: 0,
    fired: [],
    pending: null,
    log: [],
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

/** Advances one week. Does nothing while a decision is pending or the game is over. */
export function step(s: Scenario, g: GameState): void {
  if (g.done || g.pending) return;
  const w = g.week;
  s.tasks.forEach((task, i) => {
    const t = g.tasks[i];
    if (t.finish !== null) return;
    const ready = task.predecessors.every(p => {
      const f = g.tasks[taskIndex(s, p)].finish;
      return f !== null && f <= w;
    });
    if (!ready) return;
    if (t.start === null) t.start = w;
    if (t.stall > 0) {
      t.stall--;
      if (t.stall === 0) t.stallCause = null;
      return;
    }
    const plan = crewPlan(s, task, t.crew, t.mode);
    const work = Math.min(plan.capacity, task.hours - t.hoursDone);
    t.hoursDone += work;
    t.labour += (work * plan.perHour) / 1e6;
    t.materials += (task.materials * work) / task.hours;
    if (task.hours - t.hoursDone < EPS) {
      t.hoursDone = task.hours;
      t.materials = task.materials;
      t.finish = w + 1;
    }
  });
  if (w >= s.overhead.fromWeek) g.overhead += s.overhead.perWeek;
  g.week = w + 1;

  if (g.tasks.every(t => t.finish !== null)) {
    g.done = true;
    g.log.push({ week: g.week, text: 'Bygget er ferdigstilt.' });
  } else if (g.randomEvents) {
    for (const ev of EVENTS) {
      if (ev.chance <= 0 || g.fired.includes(ev.id)) continue;
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

/** A scenario button can start an event while its task is not finished. */
export function canTrigger(s: Scenario, g: GameState, eventId: string): boolean {
  return !g.done && !g.pending && targetTask(s, g, eventById(eventId)) !== null;
}

export function triggerEvent(s: Scenario, g: GameState, eventId: string): void {
  if (!canTrigger(s, g, eventId)) return;
  const ev = eventById(eventId);
  if (!g.fired.includes(ev.id)) g.fired.push(ev.id);
  raise(s, g, ev, targetTask(s, g, ev)!);
}

function applyOption(s: Scenario, g: GameState, taskId: string, eventId: string, o: EventOption) {
  const t = g.tasks[taskIndex(s, taskId)];
  g.events += o.cost;
  t.stall += o.delay;
  if (o.delay > 0) t.stallCause = eventId;
  if (o.setMode) t.mode = o.setMode;
}

/** Forecast of the end result if the game ran on with today's choices and no new events. */
function outcome(s: Scenario, g: GameState) {
  const f = clone(g);
  f.pending = null;
  f.randomEvents = false;
  runUntilDecision(s, f);
  return { weeks: f.week, total: totalOf(f) };
}

/** How far a result misses the targets, as the sum of the relative overruns (0 = both met). */
export function targetScore(s: Scenario, r: { weeks: number; total: number }): number {
  return Math.max(0, (r.total - s.target.total) / s.target.total) + Math.max(0, (r.weeks - s.target.weeks) / s.target.weeks);
}

const byTarget = (s: Scenario) => (a: { weeks: number; total: number }, b: { weeks: number; total: number }) =>
  targetScore(s, a) - targetScore(s, b) || a.total - b.total || a.weeks - b.weeks;

function bestOption(s: Scenario, g: GameState, ev: EventDef, taskId: string) {
  const scored = ev.options.map(o => {
    const f = clone(g);
    applyOption(s, f, taskId, ev.id, o);
    return { o, ...outcome(s, f) };
  });
  return { scored, best: [...scored].sort(byTarget(s))[0] };
}

function dilemmaFor(ev: EventDef): string {
  const cheapest = [...ev.options].sort((a, b) => a.cost - b.cost || a.delay - b.delay)[0];
  const fastest = [...ev.options].sort((a, b) => a.delay - b.delay || a.cost - b.cost)[0];
  if (ev.kind === 'opportunity') return `Dilemma: spare penger nå, eller holde fremdriften?`;
  if (cheapest === fastest) return `«${cheapest.label}» er både billigst og raskest, men har andre ulemper.`;
  return `Dilemma: «${cheapest.label}» er billigst, «${fastest.label}» er raskest. Hver uke koster rigg og drift.`;
}

function raise(s: Scenario, g: GameState, ev: EventDef, taskId: string) {
  const { scored, best } = bestOption(s, g, ev, taskId);
  const others = scored.filter(x => x !== best);
  // The AI role is only as reliable as the difficulty allows.
  const roll = rand(g);
  const alt = rand(g);
  const pick = roll < RELIABILITY[g.difficulty] || others.length === 0
    ? best
    : others[Math.floor(alt * others.length)];
  g.pending = { eventId: ev.id, taskId, recommended: pick.o.id, reasoning: reasoningFor(pick.o, ev.options), dilemma: dilemmaFor(ev) };
  g.log.push({ week: g.week, text: `${ev.title} (${taskId}).` });
}

function reasoningFor(o: EventOption, all: EventOption[]): string {
  const cheapest = Math.min(...all.map(x => x.cost));
  const fastest = Math.min(...all.map(x => x.delay));
  if (o.delay === fastest && o.cost === cheapest) return `«${o.label}» er både billigst og raskest.`;
  if (o.delay === fastest) return `«${o.label}» gir minst stans, og tid koster rigg og drift hver uke.`;
  if (o.cost === cheapest) return `«${o.label}» har lavest kostnad nå.`;
  return `«${o.label}» er en balanse mellom kostnad og tid.`;
}

export function choose(s: Scenario, g: GameState, optionId: string): void {
  if (!g.pending) return;
  const ev = eventById(g.pending.eventId);
  const o = ev.options.find(x => x.id === optionId);
  if (!o) throw new Error(`Unknown option ${optionId}`);
  applyOption(s, g, g.pending.taskId, ev.id, o);
  const followed = optionId === g.pending.recommended ? 'fulgte anbefalingen' : 'valgte annerledes enn anbefalingen';
  g.log.push({ week: g.week, text: `Valgte «${o.label}» (${followed}).` });
  g.pending = null;
}

function editable(s: Scenario, g: GameState, taskId: string) {
  const t = g.tasks[taskIndex(s, taskId)];
  return g.done || g.pending || t.finish !== null ? null : t;
}

export function setCrew(s: Scenario, g: GameState, taskId: string, crew: number): void {
  const t = editable(s, g, taskId);
  if (!t) return;
  const { min, max } = crewBounds(s, s.tasks[taskIndex(s, taskId)]);
  t.crew = Math.max(min, Math.min(max, Math.round(crew)));
}

export function setMode(s: Scenario, g: GameState, taskId: string, mode: Mode): void {
  const t = editable(s, g, taskId);
  if (t) t.mode = mode;
}

const totalOf = (g: GameState) =>
  g.tasks.reduce((sum, t) => sum + t.labour + t.materials, 0) + g.overhead + g.events;

/** Cost incurred so far, MNOK. */
export const spent = totalOf;

/** Share of each task's work that is done, 0–1. */
export const progress = (s: Scenario, g: GameState) =>
  Object.fromEntries(s.tasks.map((t, i) => [t.id, g.tasks[i].hoursDone / t.hours]));

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
  if (g.done || g.pending) return [];
  const work = clone(g);
  const changes: StaffingChange[] = [];
  s.tasks.forEach((task, i) => {
    const t = work.tasks[i];
    if (t.finish !== null) return;
    const options: { crew: number; mode: Mode }[] = [];
    for (const mode of ['normal', 'overtime', 'hire'] as Mode[]) options.push({ crew: task.crew, mode });
    let best = { crew: t.crew, mode: t.mode, ...outcome(s, work) };
    for (const o of options) {
      const trial = clone(work);
      trial.tasks[i].crew = o.crew;
      trial.tasks[i].mode = o.mode;
      const r = { ...o, ...outcome(s, trial) };
      if (byTarget(s)(r, best) < 0) best = r;
    }
    if (best.crew !== t.crew || best.mode !== t.mode) {
      t.crew = best.crew;
      t.mode = best.mode;
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

/** Plays a seed with perfect information: the PM plan, and the best option at every event. */
export function solveStory(s: Scenario, difficulty: Difficulty, seed: number): Story {
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
    const ev = eventById(g.pending.eventId);
    const { best } = bestOption(s, g, ev, g.pending.taskId);
    steps.push({ kind: 'choice', week: g.week, eventId: ev.id, taskId: g.pending.taskId, optionId: best.o.id });
    choose(s, g, best.o.id);
    plan();
  }
  return { seed, steps, weeks: g.week, total: totalOf(g), solved: verdict(s, g) === 'on-target' };
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
