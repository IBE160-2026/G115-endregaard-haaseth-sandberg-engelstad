import { describe, expect, it } from 'vitest';
import { choose, newGame, runUntilDecision, step, triggerEvent, verdict } from '../../engine/game';
import { scenario } from '../../engine/scenario';
import { FLOOR_H, FLOORS, SPOTS, figuresFor, sceneState, seasonOf, speakerSpot, taskSpot, towerLevels } from './visuals';

/** Plays the whole game, always following the Prosjektleder. */
function playThrough(seed = 1) {
  const g = newGame(scenario, 'easy', seed, { randomEvents: false });
  while (!g.done) {
    runUntilDecision(scenario, g);
    if (g.pending) choose(scenario, g, g.pending.recommended);
  }
  return g;
}

describe('sceneState', () => {
  it('shows an empty site before the game starts', () => {
    const v = sceneState(scenario, undefined);
    expect(v.active).toEqual([]);
    expect(v.crane).toBe('off');
    expect(v.focus).toBeNull();
    expect(v.done).toBe(false);
  });

  it('puts the strategy choice for C in focus, and crews on the active tasks', () => {
    const g = newGame(scenario, 'easy', 1);
    runUntilDecision(scenario, g);
    const v = sceneState(scenario, g);
    expect(v.focus).toMatchObject({ eventId: 'strategy-C', taskId: 'C', kind: 'strategy' });
    expect(v.crews.map(c => c.taskId)).toContain('C');
  });

  it('floods the pit while the water decision is open, and remembers a fixed pump', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < 40) {
      step(scenario, g);
      if (g.pending) choose(scenario, g, g.pending.recommended);
    }
    triggerEvent(scenario, g, 'water');
    const open = sceneState(scenario, g);
    expect(open.flooded).toBe(true);
    expect(open.focus).toMatchObject({ eventId: 'water', kind: 'risk', title: 'Vann i kjeller' });
    choose(scenario, g, 'pump');
    const after = sceneState(scenario, g);
    expect(after.features).toContain('pump');
    expect(after.flooded).toBe(true); // the pit stands under water while it dries
    expect(after.stalled.some(x => x.cause === 'water')).toBe(true);
  });

  it('shows hired workers when a task runs with extra hire', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.tasks.find(t => t.id === 'C')!.start === null) step(scenario, g);
    g.tasks.find(t => t.id === 'C')!.mode = 'hire';
    const c = sceneState(scenario, g).crews.find(x => x.taskId === 'C')!;
    expect(c.hired).toBeGreaterThan(0);
  });

  it('ends with a finished tower and no crane', () => {
    const g = playThrough();
    const v = sceneState(scenario, g);
    expect(v.done).toBe(true);
    expect(v.crane).toBe('off');
    expect(towerLevels(v.progress)).toEqual({ floors: FLOORS, glazed: FLOORS, lit: FLOORS });
    expect(v.onTarget).toBe(verdict(scenario, g) === 'on-target');
  });
});

describe('spots and figures', () => {
  it('moves the F work up the tower as floors are cast', () => {
    expect(taskSpot('F', { F: 0 }).y).toBe(1);
    expect(taskSpot('F', { F: 5 / FLOORS }).y).toBeCloseTo(5 * FLOOR_H + 1);
    expect(taskSpot('F', { F: 1 }).y).toBeCloseTo((FLOORS - 1) * FLOOR_H + 1);
  });

  it('puts the AI roles in the office, the site hut, or at their discipline', () => {
    expect(speakerSpot('pm', {})).toBe(SPOTS.office);
    expect(speakerSpot('site', {})).toBe(SPOTS.hut);
    expect(speakerSpot('foreman-F', { F: 0.5 })).toEqual(taskSpot('F', { F: 0.5 }));
  });

  it('draws one figure per three workers, own and hired apart', () => {
    const f = figuresFor([{ taskId: 'F', own: 34, hired: 17 }, { taskId: 'O', own: 2, hired: 0 }]);
    expect(f.filter(x => x.taskId === 'F' && !x.hired)).toHaveLength(11);
    expect(f.filter(x => x.hired)).toHaveLength(6);
    expect(f.filter(x => x.taskId === 'O')).toHaveLength(1);
    expect(figuresFor([{ taskId: 'F', own: 1000, hired: 0 }])).toHaveLength(160);
  });

  it('has winter at the start and summer mid-year', () => {
    expect(seasonOf(0)).toBe('winter');
    expect(seasonOf(30)).toBe('summer');
    expect(seasonOf(52)).toBe('winter');
  });
});
