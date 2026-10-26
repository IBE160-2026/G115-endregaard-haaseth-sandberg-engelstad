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

// ---- v0.3: the I/O matrix of spec-v0-3-content-consequences-ai-roles.md ----
import { CHAPTERS, chapterOf } from './chapters';
import { aiPath, outcome, pmPlan, progress, solveStory } from './game';

/** Plays with events on, taking the first option, until `stop` holds at a decision. */
function playUntil(g: GameState, stop: (g: GameState) => boolean, pick = (g: GameState) => g.pending!.outcomes[0].optionId): boolean {
  while (!g.done) {
    runUntilDecision(s, g);
    if (!g.pending) break;
    if (stop(g)) return true;
    choose(s, g, pick(g));
  }
  return false;
}
const taskOf = (g: GameState, id: string) => g.tasks.find(t => t.id === id)!;

describe('v0.3 strategy at start', () => {
  it('C and F: the strategy decision is pending in the start week, every seed', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const g = newGame(s, 'medium', seed);
      runUntilDecision(s, g);
      expect(g.pending?.eventId).toBe('strategy-C');
      expect(g.week).toBe(16);
      expect(taskOf(g, 'C')).toMatchObject({ start: 16, hoursDone: 0 });
      expect(playUntil(g, x => x.pending!.eventId === 'strategy-F')).toBe(true);
      expect(taskOf(g, 'F').start).toBe(g.week);
      expect(taskOf(g, 'F').hoursDone).toBe(0);
      expect(taskOf(g, 'E').finish).toBe(g.week);
    }
  });

  it('is not in forecasts: a new game with events on forecasts 114 weeks and 283.10', () => {
    const g = newGame(s, 'medium', 3);
    const f = forecast(s, g);
    expect(f.weeks).toBe(114);
    expect(f.total).toBeCloseTo(283.1, 9);
  });

  it('choosing the plan option keeps the schedule of a game without events', () => {
    const g = newGame(s, 'easy', 3);
    runUntilDecision(s, g);
    choose(s, g, 'plan');
    expect(outcome(s, g).weeks).toBe(114);
    expect(outcome(s, g).total).toBeCloseTo(283.1, 9);
  });

  it('a start trigger that comes while a decision is open waits in the queue', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    g.queue.push({ eventId: 'strategy-H', taskId: 'H' });
    choose(s, g, 'pump');
    expect(g.pending?.eventId).toBe('strategy-H');
    expect(g.queue).toEqual([]);
  });
});

describe('v0.3 delayed consequences', () => {
  it('defer at week 55: lands at week 85 on K, forecasts include it from the start', () => {
    const g = quiet();
    stepTo(g, 55);
    triggerEvent(s, g, 'change-security');
    const preview = g.pending!.outcomes.find(o => o.optionId === 'defer')!;
    choose(s, g, 'defer');
    expect(g.scheduled).toMatchObject([{ week: 85, cost: 2.4, delay: 1, taskId: 'K' }]);
    const f = forecast(s, g);
    // K has 10 weeks of slack, so one week of stall costs no time.
    expect(f.weeks).toBe(114);
    expect(f.total).toBeCloseTo(283.1 + 2.4, 9);
    expect(preview.weeks).toBe(114);
    expect(preview.total).toBeCloseTo(283.1 + 2.4, 9);
    stepTo(g, 85);
    expect(g.events).toBe(0);
    step(s, g); // week 85: it lands
    expect(g.events).toBeCloseTo(2.4, 9);
    expect(g.scheduled).toEqual([]);
    expect(g.log.some(l => l.week === 85 && l.from === 'pm' && l.text.startsWith('Konsekvens: Sikringen må bygges inn i ferdige vegger. +2,40 MNOK, K står 1 uke'))).toBe(true);
    play(g);
    expect(g.week).toBe(114);
    expect(spent(g)).toBeCloseTo(283.1 + 2.4, 9);
  });

  it('a finished task gets the cost only', () => {
    const g = quiet();
    stepTo(g, 30); // C finished in week 28
    g.scheduled.push({ week: 40, cost: 1, delay: 3, taskId: 'C', text: 'Test', eventId: 'soil', from: 'foreman-C' });
    play(g);
    expect(taskOf(g, 'C').stall).toBe(0);
    expect(g.week).toBe(114);
    expect(spent(g)).toBeCloseTo(284.1, 9);
  });

  it('what is still outstanding at completion is charged at once, so the result equals the forecast', () => {
    const g = newGame(s, 'easy', 11);
    expect(playUntil(g, x => x.pending!.eventId === 'strategy-N')).toBe(true);
    const preview = g.pending!.outcomes.find(o => o.optionId === 'short')!;
    choose(s, g, 'short');
    expect(g.scheduled.length).toBeGreaterThan(0);
    playUntil(g, () => false);
    expect(g.done).toBe(true);
    expect(g.scheduled).toEqual([]);
    expect(g.week).toBe(preview.weeks);
    expect(spent(g)).toBeCloseTo(preview.total, 9);
    expect(g.log.some(l => l.week === g.week && l.text.includes('garantitiden'))).toBe(true);
  });
});

describe('v0.3 follow-ups', () => {
  it('the pump failure only comes after "lei midlertidig pumpe"', () => {
    const fired = (option: string) => {
      let n = 0;
      for (let seed = 1; seed <= 80; seed++) {
        const g = newGame(s, 'easy', seed);
        playUntil(g, () => false, x => (x.pending!.eventId === 'water' ? option : x.pending!.outcomes[0].optionId));
        if (g.fired.includes('pump-fail')) n++;
      }
      return n;
    };
    expect(fired('pump')).toBe(0);
    expect(fired('rent')).toBeGreaterThan(0);
  });
});

describe('v0.3 option previews, fork records and voices', () => {
  const sameAsForecast = (g: GameState) => {
    for (const o of g.pending!.outcomes) {
      const c = structuredClone(g);
      choose(s, c, o.optionId);
      c.pending = null; // a queued decision is not part of the preview either
      const f = forecast(s, c);
      expect(f.weeks).toBe(o.weeks);
      expect(f.total).toBeCloseTo(o.total, 9);
    }
  };

  it('each option preview equals forecast() after choosing it (risk and strategy)', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    sameAsForecast(g);
    const h = newGame(s, 'medium', 21);
    expect(playUntil(h, x => x.pending!.eventId === 'strategy-F')).toBe(true);
    sameAsForecast(h);
  });

  it('records the fork: chosen and recommended outcome from the same state', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    expect(g.pending!.recommended).toBe('pump');
    const p = g.pending!;
    choose(s, g, 'wait');
    expect(g.decisions).toEqual([{
      week: 40, eventId: 'water', taskId: 'E', chosen: 'wait', recommended: 'pump', followed: false,
      chosenOutcome: { weeks: p.outcomes[2].weeks, total: p.outcomes[2].total },
      recommendedOutcome: { weeks: p.outcomes[0].weeks, total: p.outcomes[0].total },
    }]);
    expect(g.decisions[0].chosenOutcome.weeks - g.decisions[0].recommendedOutcome.weeks).toBe(4);
  });

  it('three voices with their own lenses: Prosjektleder, Site manager (least delay), foreman (cheapest now)', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    expect(g.pending!.voices.map(v => [v.personId, v.optionId, v.raised])).toEqual([
      ['pm', 'pump', false], ['site', 'pump', true], ['foreman-E', 'rent', false],
    ]);
    expect(g.pending!.reasoning).toBe(g.pending!.voices[0].reason);
    choose(s, g, 'pump');
    stepTo(g, 45);
    triggerEvent(s, g, 'frost');
    // Heating: no stall; pausing: nothing to pay now. They disagree.
    expect(g.pending!.voices.map(v => [v.personId, v.optionId])).toEqual([['pm', 'heat'], ['site', 'heat'], ['foreman-E', 'pause']]);
    expect(g.pending!.voices[2].raised).toBe(true);
  });

  it('a strategy raised by the Prosjektleder: the PM is marked, Site manager and foreman also speak', () => {
    const g = newGame(s, 'easy', 2);
    runUntilDecision(s, g);
    expect(g.pending!.voices.map(v => [v.personId, v.raised])).toEqual([['pm', true], ['site', false], ['foreman-C', false]]);
  });
});

describe('v0.3 work change', () => {
  it('prefab on F: the remaining hours × 0.7; progress and costs use the new total', () => {
    const g = newGame(s, 'easy', 21);
    expect(playUntil(g, x => x.pending!.eventId === 'strategy-F')).toBe(true);
    choose(s, g, 'prefab');
    const F = taskOf(g, 'F');
    expect(F.work).toBeCloseTo(25500 * 0.7, 9);
    // Run a few weeks on and check progress against the new total.
    while (F.hoursDone === 0 && !g.pending) step(s, g);
    if (!g.pending) expect(progress(s, g).F).toBeCloseTo(F.hoursDone / 17850, 12);
    playUntil(g, () => false);
    const done = taskOf(g, 'F');
    expect(done.hoursDone).toBeCloseTo(17850, 6);
    expect(done.materials).toBe(19.7);
  });

  it('a work fraction applies to the remaining hours only; labour follows the hours', () => {
    const g = quiet();
    stepTo(g, 60); // F half done (12,750 of 25,500)
    const F = taskOf(g, 'F');
    F.work = F.hoursDone + (F.work - F.hoursDone) * (1 - 0.2);
    expect(F.work).toBeCloseTo(12750 + 12750 * 0.8, 9);
    play(g);
    const done = taskOf(g, 'F');
    expect(done.materials).toBe(19.7);
    expect(done.labour).toBeCloseTo((22950 * 600) / 1e6, 9);
  });
});

describe('v0.3 feed and chapters', () => {
  it('start, finish and chapter messages come from the right role with the week', () => {
    const g = play(quiet());
    expect(g.log[0]).toMatchObject({ week: 0, from: 'pm' });
    expect(g.log).toContainEqual({ week: 16, from: 'foreman-C', text: 'C Sprengning og graving starter.' });
    expect(g.log).toContainEqual({ week: 28, from: 'foreman-C', text: 'C Sprengning og graving er ferdig.' });
    const chapters = g.log.filter(l => l.text.startsWith('Kapittel'));
    expect(chapters.map(l => [l.week, l.from])).toEqual([[16, 'pm'], [36, 'pm'], [50, 'pm'], [70, 'pm'], [84, 'pm'], [110, 'pm']]);
    expect(chapters.map(l => l.text)).toEqual(CHAPTERS.map(c => c.intro));
    expect(g.log.at(-1)).toMatchObject({ week: 114, from: 'pm', text: 'Bygget er ferdigstilt.' });
  });

  it('chapterOf: prologue, then the chapter of the earliest started unfinished task', () => {
    const g = quiet();
    expect(chapterOf(s, g)).toBeNull();
    const at = (w: number) => { stepTo(g, w); return chapterOf(s, g)?.title ?? null; };
    expect(at(10)).toBeNull();
    expect(at(20)).toBe('Grunnarbeid');
    expect(at(40)).toBe('Kjeller');
    expect(at(55)).toBe('Råbygg');
    expect(at(75)).toBe('Tett bygg');
    expect(at(90)).toBe('Teknikk og innredning');
    expect(at(112)).toBe('Overlevering');
    play(g);
    expect(chapterOf(s, g)).toBeNull();
  });

  it('forecasts, previews and the PM plan never grow the log', () => {
    const g = newGame(s, 'medium', 5);
    runUntilDecision(s, g);
    const n = g.log.length;
    forecast(s, g);
    outcome(s, g);
    choose(s, g, g.pending!.recommended);
    const m = g.log.length;
    forecast(s, g);
    pmPlan(s, g);
    expect(g.log.length).toBe(m);
    expect(m).toBe(n + 1); // only the choice itself
  });
});

describe('v0.3 review fixes', () => {
  it('a scenario button event that has fired cannot be triggered again', () => {
    const g = quiet();
    stepTo(g, 72); // O is active
    expect(canTrigger(s, g, 'lift-crew')).toBe(true);
    triggerEvent(s, g, 'lift-crew');
    choose(s, g, 'accept');
    expect(canTrigger(s, g, 'lift-crew')).toBe(false);
    triggerEvent(s, g, 'lift-crew');
    expect(g.pending).toBeNull();
    expect(g.events).toBeCloseTo(-0.6, 9);
  });

  it('a delayed consequence keeps the cause of a stall that is already running', () => {
    const g = quiet();
    stepTo(g, 40);
    triggerEvent(s, g, 'water');
    choose(s, g, 'wait'); // E stalls 6 weeks for water
    g.scheduled.push({ week: 40, cost: 0.5, delay: 2, taskId: 'E', text: 'Test', eventId: 'frost', from: 'foreman-E' });
    step(s, g);
    const E = taskOf(g, 'E');
    expect(E.stallCause).toBe('water');
    expect(E.stall).toBe(6 + 2 - 1);
  });

  it('a chapter jump still introduces every skipped chapter, in order', () => {
    const g = quiet();
    stepTo(g, 40); // Kjeller
    g.chapter = -1;
    const n = g.log.length;
    step(s, g);
    expect(g.log.slice(n).filter(l => l.text.startsWith('Kapittel')).map(l => l.text)).toEqual([CHAPTERS[0].intro, CHAPTERS[1].intro]);
    expect(g.chapter).toBe(1);
  });
});

describe('v0.3 AI path', () => {
  it('follows every recommendation with the PM plan; deterministic per seed', () => {
    const a = aiPath(s, 'hard', 77);
    expect(aiPath(s, 'hard', 77)).toEqual(a);
    expect(a.steps.filter(x => x.kind === 'choice').length).toBeGreaterThanOrEqual(4);
    // On easy the recommendation is always the best option, so the AI path is the story.
    const easy = aiPath(s, 'easy', 77);
    const story = solveStory(s, 'easy', 77);
    expect(easy.weeks).toBe(story.weeks);
    expect(easy.total).toBeCloseTo(story.total, 9);
  });
});
