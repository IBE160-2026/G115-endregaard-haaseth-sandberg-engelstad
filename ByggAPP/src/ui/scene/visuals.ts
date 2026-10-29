// What the 3D site should show, worked out from the game state.
// Pure and without three.js, so it can be tested; the scene only reads the result.
import { eventById, type EventKind } from '../../engine/events';
import { progress, type GameState } from '../../engine/game';
import type { Scenario } from '../../engine/scenario';

export const FLOORS = 11;
export const FLOOR_H = 4.5; // 50 m / 11 floors
export const PIT = { w: 34, d: 24, depth: 8 };
export const TOWER = { w: 26, d: 16 };
export const BASEMENT_TASKS = ['C', 'D', 'E', 'L'];
export const TOWER_TASKS = ['F', 'G', 'O', 'H', 'I', 'K', 'J'];

/** A point on the site, metres (y up, 0 = street level). */
export interface Spot { x: number; y: number; z: number }

/** Fixed places on the site. */
export const SPOTS = {
  office: { x: -45, y: 6, z: 26 },
  hut: { x: 28, y: 3.5, z: 22 },
  pit: { x: 0, y: -PIT.depth + 1, z: 0 },
  entrance: { x: 0, y: 2, z: TOWER.d / 2 + 5 },
} satisfies Record<string, Spot>;

/** People working on a task: own crew, hired workers, the base crew and the work mode (for the tags). */
export interface Crew { taskId: string; own: number; hired: number; base?: number; mode?: 'normal' | 'overtime' | 'hire' }

export interface SceneState {
  week: number;
  /** Share of each task done, 0–1. */
  progress: Record<string, number>;
  /** Tasks that have started and are not finished. */
  active: string[];
  /** Active tasks that stand still, and why. */
  stalled: { taskId: string; cause: string | null }[];
  /** The tower crane stands from the start of the basement structure (E) until the facade is closed. */
  crane: 'off' | 'working' | 'stopped';
  flooded: boolean;
  frost: boolean;
  windy: boolean;
  /** People working per active task (own crew and hired workers). */
  crews: Crew[];
  overtime: boolean;
  /** The decision on the table, shown with a beacon and the camera. */
  focus: { eventId: string; taskId: string; kind: EventKind; title: string } | null;
  /** Visible results of the owner's choices. */
  features: Feature[];
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  done: boolean;
  /** Finished within both targets. */
  onTarget: boolean;
}

export type Feature = 'solar' | 'prefab' | 'modules' | 'charging' | 'security' | 'pump' | 'reuse';

/** The choices that leave a mark on the building. */
const FEATURES: { eventId: string; optionIds: string[]; feature: Feature }[] = [
  { eventId: 'change-solar', optionIds: ['approve', 'prepare'], feature: 'solar' },
  { eventId: 'strategy-F', optionIds: ['prefab'], feature: 'prefab' },
  { eventId: 'strategy-H', optionIds: ['modules'], feature: 'modules' },
  { eventId: 'change-charging', optionIds: ['approve'], feature: 'charging' },
  { eventId: 'change-security', optionIds: ['approve'], feature: 'security' },
  { eventId: 'water', optionIds: ['pump'], feature: 'pump' },
  { eventId: 'pump-fail', optionIds: ['buy'], feature: 'pump' },
  { eventId: 'reuse', optionIds: ['reuse'], feature: 'reuse' },
];

/** Construction is assumed to start in January; seasons are presentation only. */
export function seasonOf(week: number): SceneState['season'] {
  const w = ((week % 52) + 52) % 52;
  return w < 10 || w >= 48 ? 'winter' : w < 22 ? 'spring' : w < 36 ? 'summer' : 'autumn';
}

export function sceneState(s: Scenario, g: GameState | undefined): SceneState {
  const p = g ? progress(s, g) : Object.fromEntries(s.tasks.map(t => [t.id, 0]));
  const week = g?.week ?? 0;
  const empty: SceneState = {
    week, progress: p, active: [], stalled: [], crane: 'off', flooded: false, frost: false, windy: false,
    crews: [], overtime: false, focus: null, features: [], season: seasonOf(week), done: false, onTarget: false,
  };
  if (!g) return empty;
  const ts = (id: string) => g.tasks[s.tasks.findIndex(t => t.id === id)];
  const active = s.tasks.filter((_, i) => g.tasks[i].start !== null && g.tasks[i].finish === null).map(t => t.id);
  const stalled = active.filter(id => ts(id).stall > 0).map(id => ({ taskId: id, cause: ts(id).stallCause }));
  const pendingId = g.pending?.eventId ?? null;
  const stalledBy = (cause: string) => stalled.some(x => x.cause === cause);

  const craneUp = ts('E').start !== null && ts('G').finish === null;
  const windy = pendingId === 'wind' || stalledBy('wind');
  const crane = !craneUp ? 'off' : windy || stalled.some(x => x.taskId === 'E' || x.taskId === 'F' || x.taskId === 'G') ? 'stopped' : 'working';

  const crews = active.map(id => {
    const t = ts(id);
    return { taskId: id, own: t.crew, hired: t.mode === 'hire' ? Math.ceil(t.crew * s.hireShare) : 0, base: s.tasks.find(x => x.id === id)!.crew, mode: t.mode };
  });

  const focus = g.pending
    ? { eventId: g.pending.eventId, taskId: g.pending.taskId, kind: eventById(g.pending.eventId).kind, title: eventById(g.pending.eventId).title }
    : null;

  const features = [...new Set(FEATURES.filter(f => g.choices.some(c => c.eventId === f.eventId && f.optionIds.includes(c.optionId))).map(f => f.feature))];
  const total = g.tasks.reduce((sum, t) => sum + t.labour + t.materials, 0) + g.overhead + g.events;

  return {
    ...empty,
    active,
    stalled,
    crane,
    flooded: pendingId === 'water' || pendingId === 'pump-fail' || stalledBy('water') || stalledBy('pump-fail'),
    frost: pendingId === 'frost' || stalledBy('frost'),
    windy,
    crews,
    overtime: active.some(id => ts(id).mode === 'overtime'),
    focus,
    features,
    done: g.done,
    onTarget: g.done && g.week <= s.target.weeks && Math.round(total * 100) <= Math.round(s.target.total * 100),
  };
}

/** Floors cast, glazed and fitted out, from the progress. */
export function towerLevels(p: Record<string, number>) {
  const level = (x: number) => Math.min(FLOORS, Math.floor(x * FLOORS + 1e-9));
  return {
    floors: level(p.F ?? 0),
    glazed: level(p.G ?? 0),
    lit: level(((p.H ?? 0) + (p.I ?? 0) + (p.K ?? 0) + (p.J ?? 0)) / 4),
  };
}

/** Where a task's work happens right now (for labels, beacons, workers and the camera). */
export function taskSpot(taskId: string, p: Record<string, number>): Spot {
  const { floors, glazed, lit } = towerLevels(p);
  const top = (n: number) => Math.max(0, Math.min(FLOORS - 1, n)) * FLOOR_H + 1;
  switch (taskId) {
    case 'A': return SPOTS.office;
    case 'C': return { x: -6, y: -PIT.depth * (1 - (p.C ?? 0)) + 0.5, z: 2 };
    case 'D': case 'E': return { ...SPOTS.pit, y: -PIT.depth + 1 + PIT.depth * (taskId === 'E' ? (p.E ?? 0) * 0.8 : 0) };
    case 'L': return { x: 8, y: -PIT.depth / 2, z: -3 };
    case 'F': return { x: 0, y: top(floors), z: 0 };
    case 'G': return { x: 0, y: top(glazed), z: TOWER.d / 2 };
    case 'O': return { x: 0, y: top(floors - 1), z: 0 };
    case 'H': case 'I': case 'K': case 'J': return { x: { H: -8, I: 8, K: -4, J: 4 }[taskId], y: top(lit), z: 0 };
    case 'N': return SPOTS.entrance;
    default: return SPOTS.pit;
  }
}

/** Where a person stands when they speak: the office, the site hut, or their discipline's work. */
export function speakerSpot(personId: string, p: Record<string, number>): Spot {
  if (personId === 'pm') return SPOTS.office;
  if (personId === 'site') return SPOTS.hut;
  if (personId.startsWith('foreman-')) return taskSpot(personId.slice('foreman-'.length), p);
  return SPOTS.office;
}

/** How many figures to draw for a crew: one per three workers, at least one, at most 160 in total. */
export function figuresFor(crews: Crew[], max = 160): { taskId: string; hired: boolean }[] {
  const out: { taskId: string; hired: boolean }[] = [];
  for (const c of crews) {
    for (let i = 0; i < Math.max(1, Math.round(c.own / 3)); i++) out.push({ taskId: c.taskId, hired: false });
    for (let i = 0; i < Math.round(c.hired / 3); i++) out.push({ taskId: c.taskId, hired: true });
  }
  return out.slice(0, max);
}
