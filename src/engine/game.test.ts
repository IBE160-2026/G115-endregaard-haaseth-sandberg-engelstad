// The game engine against the I/O matrix of spec-v0-2-interactive-simulator.md.
import { describe, expect, it } from 'vitest';
import { canTrigger, choose, crewBounds, forecast, newGame, runUntilDecision, setCrew, setMode, spent, step, triggerEvent, verdict, type GameState } from './game';
import { scenario as s } from './scenario';
import { simulate, type Modes } from './simulate';

const quiet = () => newGame(s, 'easy', 1, { randomEvents: false });
const play = (g: GameState) => { runUntilDecision(s, g); return g; };
// Guarded: a pending decision stops time, which would otherwise loop forever.
const stepTo = (g: GameState, week: number) => { while (g.week < week && !g.pending) step(s, g); };
const task = (g: GameState, id: string) => g.tasks.find(t => t.id === id)!;

describe('game ≡ simulate when nothing happens', () => {
  it('no events, base crew: 114 weeks, 283.10 MNOK', () => {
    const g = play(quiet());
    expect(g.done).toBe(true);
    expect(g.week).toBe(114);
    expect(spent(g)).toBeCloseTo(283.1, 9);
    expect(verdict(s, g)).toBe('on-target');
  });

  it.each<[string, Modes]>([
    ['F overtime', { F: 'overtime' }],
    ['F hire', { F: 'hire' }],
    ['H hire', { H: 'hire' }],
    ['I hire', { I: 'hire' }],
    ['I and J hire', { I: 'hire', J: 'hire' }],
  ])('%s: same weeks, total and critical path as simulate()', (_, modes) => {
    const g = quiet();
    for (const [id, m] of Object.entries(modes)) setMode(s, g, id, m!);
    const ref = simulate(s, modes);
    const f = forecast(s, g);
    expect(f.weeks).toBe(ref.weeks);
    expect(f.total).toBeCloseTo(ref.total, 9);
    expect(f.criticalPath).toEqual(ref.criticalPath);
    play(g);
    expect(g.week).toBe(ref.weeks);
    expect(spent(g)).toBeCloseTo(ref.total, 9);
  });

  it('modes via game: F overtime set before week 50 gives 111 weeks, 282.515', () => {
    const g = quiet();
    stepTo(g, 40);
    setMode(s, g, 'F', 'overtime');
    play(g);
    expect(g.week).toBe(111);
    expect(spent(g)).toBeCloseTo(282.515, 9);
  });
});

describe('crew size', () => {
  it('F crew may be 50–200 % of the base crew', () => {
    expect(crewBounds(s, s.tasks.find(t => t.id === 'F')!)).toEqual({ min: 17, max: 68 });
    const g = quiet();
    setCrew(s, g, 'F', 5);
    expect(task(g, 'F').crew).toBe(17);
  });

  it('too low: F crew 24 gives F 29 weeks, project +9 weeks, overhead +4.05', () => {
    const g = quiet();
    setCrew(s, g, 'F', 24);
    const f = forecast(s, g);
    expect(f.tasks.find(t => t.id === 'F')!.weeks).toBe(29);
    expect(f.weeks).toBe(123);
    expect(f.overhead).toBeCloseTo(44.1 + 4.05, 9);
    expect(f.total).toBeCloseTo(283.1 + 4.05, 9);
  });

  it('too high: F crew 44 has 39 effective workers, F 18 weeks, and costs more than the base crew', () => {
    const g = quiet();
    setCrew(s, g, 'F', 44);
    const f = forecast(s, g);
    const labourF = (25500 * 600 * 44) / 39 / 1e6;
    expect(f.tasks.find(t => t.id === 'F')!.weeks).toBe(18);
    expect(f.tasks.find(t => t.id === 'F')!.labour).toBeCloseTo(labourF, 9);
    expect(f.weeks).toBe(112);
    expect(f.total).toBeCloseTo(283.1 + (labourF - 15.3) - 2 * 0.45, 9);
    expect(f.total).toBeGreaterThan(283.1);
  });

  it('mid-task change: F overtime from week 60 applies to the remaining hours only', () => {
    const g = quiet();
    stepTo(g, 60);
    setMode(s, g, 'F', 'overtime');
    play(g);
    // 12,750 h done at normal time, 12,750 h left at 34 × 45 = 1,530 h/week → 9 weeks.
    expect(task(g, 'F').finish).toBe(69);
    expect(g.week).toBe(113);
    expect(spent(g)).toBeCloseTo(283.1 + 12750 * 600 * 0.05 / 1e6 - 0.45, 9);
  });
});

describe('events', () => {
  it('water in the basement while E is active, option pump: +0.8 MNOK, E stalls 2 weeks', () => {
    const g = quiet();
    stepTo(g, 40);
    expect(canTrigger(s, g, 'water')).toBe(true);
    triggerEvent(s, g, 'water');
    expect(g.pending?.taskId).toBe('E');
    step(s, g); // paused: a pending decision stops time
    expect(g.week).toBe(40);
    choose(s, g, 'pump');
    const f = forecast(s, g);
    expect(f.weeks).toBe(116);
    expect(f.total).toBeCloseTo(283.1 + 0.8 + 2 * 0.45, 9);
  });

  it('the water button is disabled when no basement task is active or ahead', () => {
    const g = quiet();
    stepTo(g, 60); // C, D, E and L are done
    expect(canTrigger(s, g, 'water')).toBe(false);
  });

  it('easy: the AI always recommends the best option; hard: sometimes not', () => {
    const wrong = (difficulty: 'easy' | 'hard') => {
      let n = 0;
      for (let seed = 1; seed <= 60; seed++) {
        const g = newGame(s, difficulty, seed, { randomEvents: false });
        stepTo(g, 40);
        triggerEvent(s, g, 'water');
        if (g.pending!.recommended !== 'pump') n++;
      }
      return n;
    };
    expect(wrong('easy')).toBe(0);
    expect(wrong('hard')).toBeGreaterThan(0);
  });

  it('is deterministic: same seed, difficulty and choices give the same game', () => {
    const run = () => {
      const g = newGame(s, 'hard', 42);
      while (!g.done) {
        runUntilDecision(s, g);
        if (g.pending) choose(s, g, g.pending.recommended);
      }
      return g;
    };
    const a = run();
    const b = run();
    expect(a).toEqual(b);
    expect(a.fired.length).toBeGreaterThan(0);
  });
});

describe('completion', () => {
  it('locks controls when the building is finished', () => {
    const g = play(quiet());
    setCrew(s, g, 'N', 20);
    setMode(s, g, 'N', 'hire');
    expect(task(g, 'N').crew).toBe(10);
    expect(canTrigger(s, g, 'water')).toBe(false);
    step(s, g);
    expect(g.week).toBe(114);
  });
});

describe('review follow-ups', () => {
  it('verdict covers late, over budget and both', () => {
    const lateAndOver = quiet();
    setCrew(s, lateAndOver, 'F', 24); // +9 weeks, +4.05 overhead
    expect(verdict(s, play(lateAndOver))).toBe('over-and-late');

    const over = quiet();
    setMode(s, over, 'H', 'hire'); // H has slack: costs more, no time
    expect(verdict(s, play(over))).toBe('over-budget');

    // Late but within budget is hard to reach in play (every extra week costs overhead),
    // so the branch is checked on a finished game moved past the target week.
    const late = play(quiet());
    late.week = s.target.weeks + 1;
    expect(verdict(s, late)).toBe('late');
  });

  it('a scenario button marks the event as fired, so it does not also come at random', () => {
    const g = newGame(s, 'easy', 7, { randomEvents: false });
    stepTo(g, 30); // C done, D active
    triggerEvent(s, g, 'rock');
    expect(g.fired).toContain('rock');
  });

  it('the same seed gives the same events on every difficulty', () => {
    // The player always picks the first option, so only the difficulty differs.
    const events = (d: 'easy' | 'hard') => {
      const g = newGame(s, d, 99);
      while (!g.done) {
        runUntilDecision(s, g);
        if (g.pending) choose(s, g, firstOption(g.pending.eventId));
      }
      return g.fired;
    };
    expect(events('easy')).toEqual(events('hard'));
  });

  it('crew and mode cannot change while a decision is pending', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    setCrew(s, g, 'E', 40);
    setMode(s, g, 'E', 'hire');
    expect(task(g, 'E')).toMatchObject({ crew: 30, mode: 'normal' });
  });
});

import { eventById } from './events';
const firstOption = (id: string) => eventById(id).options[0].id;
