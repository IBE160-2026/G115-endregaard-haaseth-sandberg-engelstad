// Dilemmas, crowding with hired workers, the PM staffing plan and the story solution.
import { describe, expect, it } from 'vitest';
import { eventById } from './events';
import {
  applyPlan, choose, crewPlan, findStory, forecast, newGame, pmPlan, runUntilDecision, setCrew, setMode, solveStory, spent,
  step, targetScore, triggerEvent, verdict, type GameState,
} from './game';
import { scenario as s } from './scenario';

const quiet = () => newGame(s, 'easy', 1, { randomEvents: false });
const stepTo = (g: GameState, week: number) => { while (g.week < week && !g.pending) step(s, g); };
const F = s.tasks.find(t => t.id === 'F')!;

describe('crowding includes hired workers above the planned crew', () => {
  it('base crew with hire is the planned capacity: no crowding (v0.1 unchanged)', () => {
    const p = crewPlan(s, F, 34, 'hire');
    expect(p.hired).toBe(17);
    expect(p.effective).toBe(51);
  });

  it('extra own crew plus hire: everyone above 34 + 17 counts half', () => {
    const p = crewPlan(s, F, 44, 'hire');
    // 44 own + 22 hired = 66 workers, planned 51 → 51 + 0.5 × 15 = 58.5 effective.
    expect(p.hired).toBe(22);
    expect(p.effective).toBe(58.5);
    expect(p.perHour).toBeCloseTo((600 * (44 + 22 * 1.5)) / 58.5, 9);
  });
});

describe('dilemmas and target-based advice', () => {
  it('an opportunity makes "late but within budget" possible', () => {
    const g = quiet();
    stepTo(g, 75); // G is active
    triggerEvent(s, g, 'facade-discount');
    expect(g.pending!.dilemma).toBe('Dilemma: spare penger nå, eller holde fremdriften?');
    choose(s, g, 'accept');
    runUntilDecision(s, g);
    expect(g.week).toBe(118);
    expect(spent(g)).toBeCloseTo(283.1 - 2.6 + 4 * 0.45, 9);
    expect(verdict(s, g)).toBe('late');
  });

  it('easy recommends the option closest to both targets, not just the cheapest', () => {
    // Accepting is cheaper (282.30) but 4 weeks late; declining meets both targets.
    const g = quiet();
    stepTo(g, 75);
    triggerEvent(s, g, 'facade-discount');
    expect(g.pending!.recommended).toBe('decline');
  });

  it('a risk shows which option is cheapest and which is fastest', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    expect(g.pending!.dilemma).toBe('Dilemma: «Lei midlertidig pumpe» er billigst, «Installer fast pumpe» er raskest. Hver uke koster rigg og drift.');
  });

  it('targetScore is 0 within both targets and grows with the overrun', () => {
    expect(targetScore(s, { weeks: 114, total: 283.1 })).toBe(0);
    expect(targetScore(s, { weeks: 120, total: 283.1 })).toBeCloseTo(6 / 114, 12);
    expect(targetScore(s, { weeks: 100, total: 290 })).toBeCloseTo(6.9 / 283.1, 12);
  });
});

describe('project manager staffing plan', () => {
  it('uses the crews better than the base plan: faster and cheaper', () => {
    const g = quiet();
    const plan = pmPlan(s, g);
    expect(plan.length).toBeGreaterThan(0);
    applyPlan(s, g, plan);
    const f = forecast(s, g);
    expect(f.weeks).toBeLessThan(114);
    expect(f.total).toBeLessThan(283.1);
    expect(pmPlan(s, g)).toEqual([]); // nothing left to improve
  });

  it('suggests nothing while a decision is pending', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    expect(pmPlan(s, g)).toEqual([]);
  });
});

describe('story solution', () => {
  it('every new game is a story that can be solved within both targets', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const story = findStory(s, d, 5000);
      expect(story.solved).toBe(true);
      expect(story.weeks).toBeLessThanOrEqual(s.target.weeks);
      expect(story.total).toBeLessThanOrEqual(s.target.total);
    }
  });

  it('v0.3: findStory on all three difficulties together takes under 3 s', () => {
    const t0 = performance.now();
    for (const d of ['easy', 'medium', 'hard'] as const) expect(findStory(s, d, 31337).solved).toBe(true);
    expect(performance.now() - t0).toBeLessThan(3000);
  });

  it('v0.3: playing the story meets the 4 strategy decisions plus random events, on target', () => {
    for (const d of ['easy', 'medium', 'hard'] as const) {
      const story = findStory(s, d, 900);
      const choices = story.steps.filter(st => st.kind === 'choice');
      const strategies = choices.filter(st => st.kind === 'choice' && eventById(st.eventId).kind === 'strategy');
      expect(strategies.length).toBe(4);
      expect(choices.length).toBeGreaterThan(4);
      expect(story.solved).toBe(true);
    }
  });

  it('v0.3 pace: the story path averages about 12–15 decisions per game (30 fixed seeds)', () => {
    let total = 0;
    for (let seed = 1; seed <= 30; seed++) total += solveStory(s, 'medium', seed).steps.filter(st => st.kind === 'choice').length;
    const mean = total / 30;
    expect(mean).toBeGreaterThanOrEqual(12);
    expect(mean).toBeLessThanOrEqual(15);
  });

  it('replaying the story steps gives the same, solved result', () => {
    const story = findStory(s, 'hard', 777);
    const r = newGame(s, 'hard', story.seed);
    const applySteps = (changes: { taskId: string; crew: number; mode: 'normal' | 'overtime' | 'hire' }[]) => {
      for (const c of changes) { setCrew(s, r, c.taskId, c.crew); setMode(s, r, c.taskId, c.mode); }
    };
    // Plans come at the start and right after each choice; choices come at each event.
    for (const st of story.steps) {
      if (st.kind === 'plan') { applySteps(st.changes); continue; }
      runUntilDecision(s, r);
      expect(r.pending?.eventId).toBe(st.eventId);
      expect(eventById(st.eventId).options.some(o => o.id === st.optionId)).toBe(true);
      choose(s, r, st.optionId);
    }
    runUntilDecision(s, r);
    expect(r.done).toBe(true);
    expect(r.week).toBe(story.weeks);
    expect(spent(r)).toBeCloseTo(story.total, 9);
    expect(verdict(s, r)).toBe('on-target');
  });
});
