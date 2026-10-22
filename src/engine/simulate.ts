// Pure, deterministic simulation engine: durations, schedule and cost for a set of modes.
import type { Mode, Scenario, Task } from './scenario';

export type Modes = Partial<Record<string, Mode>>;

export interface TaskResult {
  id: string;
  mode: Mode;
  ownCrew: number;
  hiredCrew: number;
  hoursPerWeek: number;
  weeks: number;
  start: number;
  finish: number;
  /** Weeks the task can slip without moving the project's finish. */
  slack: number;
  critical: boolean;
  labour: number;
  materials: number;
  cost: number;
}

export interface SimulationResult {
  tasks: TaskResult[];
  weeks: number;
  overheadWeeks: number;
  overhead: number;
  labour: number;
  materials: number;
  total: number;
  criticalPath: string[];
}

// Guards Math.ceil against floating-point noise such as 16.000000000000004.
const EPS = 1e-9;

export function workPlan(s: Scenario, task: Task, mode: Mode) {
  const own = task.crew;
  const hired = mode === 'hire' ? Math.ceil(own * s.hireShare) : 0;
  const hoursPerWeek = mode === 'overtime' ? s.overtimeHoursPerWeek : s.hoursPerWeek;
  const weeks = Math.ceil(task.hours / ((own + hired) * hoursPerWeek) - EPS);

  // Labour is paid for the task's actual hours; the factor applies to the share
  // of those hours that are overtime hours or worked by hired workers.
  let factor = s.factors.normal;
  if (mode === 'overtime') {
    const overtimeShare = (s.overtimeHoursPerWeek - s.hoursPerWeek) / s.overtimeHoursPerWeek;
    factor = (1 - overtimeShare) * s.factors.normal + overtimeShare * s.factors.overtime;
  } else if (mode === 'hire') {
    factor = (own * s.factors.normal + hired * s.factors.hire) / (own + hired);
  }
  const labour = (task.hours * task.rate * factor) / 1e6;
  return { own, hired, hoursPerWeek, weeks, labour };
}

export function simulate(s: Scenario, modes: Modes = {}): SimulationResult {
  const byId = new Map(s.tasks.map(t => [t.id, t]));
  const plans = new Map(s.tasks.map(t => [t.id, workPlan(s, t, modes[t.id] ?? 'normal')]));

  // Forward pass: earliest start = latest finish among predecessors.
  const start = new Map<string, number>();
  const finishOf = (id: string): number => {
    if (!start.has(id)) {
      const task = byId.get(id);
      if (!task) throw new Error(`Unknown task ${id}`);
      start.set(id, Math.max(0, ...task.predecessors.map(finishOf)));
    }
    return start.get(id)! + plans.get(id)!.weeks;
  };
  const weeks = Math.max(...s.tasks.map(t => finishOf(t.id)));

  // Backward pass: latest finish = earliest latest-start among successors.
  const latestFinish = new Map<string, number>();
  const latestFinishOf = (id: string): number => {
    if (!latestFinish.has(id)) {
      const successors = s.tasks.filter(t => t.predecessors.includes(id));
      latestFinish.set(id, Math.min(weeks, ...successors.map(t => latestFinishOf(t.id) - plans.get(t.id)!.weeks)));
    }
    return latestFinish.get(id)!;
  };

  const tasks: TaskResult[] = s.tasks.map(t => {
    const p = plans.get(t.id)!;
    const finish = finishOf(t.id);
    const slack = latestFinishOf(t.id) - finish;
    return {
      id: t.id,
      mode: modes[t.id] ?? 'normal',
      ownCrew: p.own,
      hiredCrew: p.hired,
      hoursPerWeek: p.hoursPerWeek,
      weeks: p.weeks,
      start: start.get(t.id)!,
      finish,
      slack,
      critical: slack === 0,
      labour: p.labour,
      materials: t.materials,
      cost: p.labour + t.materials,
    };
  });

  const overheadWeeks = Math.max(0, weeks - s.overhead.fromWeek);
  const overhead = overheadWeeks * s.overhead.perWeek;
  const labour = tasks.reduce((sum, t) => sum + t.labour, 0);
  const materials = tasks.reduce((sum, t) => sum + t.materials, 0);

  return {
    tasks,
    weeks,
    overheadWeeks,
    overhead,
    labour,
    materials,
    total: labour + materials + overhead,
    criticalPath: tasks.filter(t => t.critical).sort((a, b) => a.start - b.start).map(t => t.id),
  };
}
