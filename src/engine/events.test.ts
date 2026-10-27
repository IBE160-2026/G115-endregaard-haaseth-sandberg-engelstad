// Integrity of the event catalogue and the rule-based advisor.
import { describe, expect, it } from 'vitest';
import manifest from '../../assets/icons/manifest.json';
import { adviceFor, voiceReason } from './advisor';
import { EVENTS } from './events';
import { forecast, newGame, setCrew, step } from './game';
import { scenario as s } from './scenario';

const icons = new Set((manifest as { file: string }[]).map(m => m.file));

describe('event catalogue', () => {
  it.each(EVENTS.map(e => [e.id, e] as const))('%s refers to real icons, people and tasks', (_, e) => {
    expect(icons.has(e.icon)).toBe(true);
    expect(s.people.some(p => p.id === e.raisedBy)).toBe(true);
    // The raiser is always one of the three voices: Prosjektleder, Site manager or the foreman.
    expect(['pm', 'site', ...e.taskIds.map(id => `foreman-${id}`)]).toContain(e.raisedBy);
    expect(e.taskIds.every(id => s.tasks.some(t => t.id === id))).toBe(true);
    expect(e.options.length).toBeGreaterThanOrEqual(2);
    expect(new Set(e.options.map(o => o.id)).size).toBe(e.options.length);
    expect(e.options.every(o => o.delay >= 0)).toBe(true);
    for (const o of e.options) {
      if (!o.later) continue;
      expect(o.later.weeks).toBeGreaterThan(0);
      expect(o.later.delay).toBeGreaterThanOrEqual(0);
      if (o.later.taskId) expect(s.tasks.some(t => t.id === o.later!.taskId)).toBe(true);
    }
  });

  const strategies = EVENTS.filter(e => e.kind === 'strategy');
  const changes = EVENTS.filter(e => e.kind === 'change');
  const followUps = EVENTS.filter(e => e.requires);

  it.each(strategies.map(e => [e.id, e] as const))('strategy %s: start trigger, no chance, no button, 2–4 options', (_, e) => {
    expect(e.trigger).toBe('start');
    expect(e.chance).toBe(0);
    expect(e.button).toBe(false);
    expect(e.options.length).toBeGreaterThanOrEqual(2);
    expect(e.options.length).toBeLessThanOrEqual(4);
    expect(e.options.every(o => o.cost >= 0)).toBe(true);
    // Fewer hours are never free.
    expect(e.options.every(o => (o.work ?? 0) >= 0 || o.cost > 0)).toBe(true);
  });

  it.each(changes.map(e => [e.id, e] as const))('change %s: can be deferred or declined, at a later cost', (_, e) => {
    expect(e.options.some(o => o.cost === 0 && o.later !== undefined && o.later.cost > 0)).toBe(true);
  });

  it.each(followUps.map(e => [e.id, e] as const))('follow-up %s: requires a real earlier choice and has no button', (_, e) => {
    expect(e.button).toBe(false);
    const before = EVENTS.find(x => x.id === e.requires!.eventId);
    expect(before?.options.some(o => o.id === e.requires!.optionId)).toBe(true);
  });

  it.each(EVENTS.filter(e => e.kind === 'risk' || e.kind === 'opportunity').map(e => [e.id, e] as const))('%s keeps the v0.2 rules for risks and opportunities', (_, e) => {
    if (e.kind === 'risk') expect(e.options.every(o => o.cost >= 0)).toBe(true);
    // An opportunity is a dilemma: a saving that costs time, or keep the plan.
    else expect(e.options.some(o => o.cost < 0 && o.delay > 0) && e.options.some(o => o.cost === 0 && o.delay === 0)).toBe(true);
  });

  it('v0.3 content: 4 strategies (C, F, H, N), ≥ 3 change requests, ≥ 2 follow-ups, ≥ 12 new events', () => {
    expect(strategies.map(e => e.taskIds[0])).toEqual(['C', 'F', 'H', 'N']);
    expect(changes.length).toBeGreaterThanOrEqual(3);
    expect(followUps.length).toBeGreaterThanOrEqual(2);
    expect(EVENTS.length - 11).toBeGreaterThanOrEqual(12); // v0.2 had 11 events
    expect(EVENTS.filter(e => e.trigger === 'start').every(e => e.kind === 'strategy')).toBe(true);
  });

  it('toolbar and app icons exist', () => {
    for (const f of ['controls/play.svg', 'controls/pause.svg', 'controls/step.svg', 'controls/new-game.svg', 'apps/view3d.svg']) {
      expect(icons.has(f)).toBe(true);
    }
  });
});

describe('advisor', () => {
  it('foreman F reports understaffing and the project manager a late forecast', () => {
    const g = newGame(s, 'easy', 1, { randomEvents: false });
    setCrew(s, g, 'F', 24);
    const f = forecast(s, g);
    expect(adviceFor('foreman-F', s, g, f)).toContain('Underbemannet: 24 av 34. Det går saktere, og forsinkelse koster rigg og drift.');
    expect(adviceFor('pm', s, g, f)[0]).toBe('Prognosen er 9 uker etter planen.');
  });

  it('a foreman over the base crew warns about crowding; a task with slack says so', () => {
    const g = newGame(s, 'easy', 1, { randomEvents: false });
    setCrew(s, g, 'H', 40);
    const f = forecast(s, g);
    const h = adviceFor('foreman-H', s, g, f);
    expect(h).toContain('Overbemannet: 40 av 32. Folk går i veien for hverandre, så timene blir dyrere.');
    expect(h.some(l => /^Har \d+ uker slakk\.$/.test(l))).toBe(true);
  });

  it('progress in the foreman report uses the game total hours', () => {
    const g = newGame(s, 'easy', 1, { randomEvents: false });
    while (g.week < 60) step(s, g);
    const F = g.tasks.find(t => t.id === 'F')!;
    F.work = F.hoursDone * 4; // a quarter done of a (changed) total
    expect(adviceFor('foreman-F', s, g, forecast(s, g))[0]).toBe('25 % ferdig.');
  });

  it('voice reasons quote the numbers from their own lens', () => {
    const o = { id: 'x', label: 'Lei pumpe', cost: 0.3, delay: 4, note: '', later: { weeks: 6, cost: 1.2, delay: 0, text: 't' } };
    const r = { weeks: 118, total: 285.4 };
    expect(voiceReason('pm', s, o, r)).toBe('Jeg anbefaler «Lei pumpe». Det kommer nærmest målene.');
    expect(voiceReason('pm', s, o, { weeks: 110, total: 280 })).toBe('Jeg anbefaler «Lei pumpe». Da holder vi både budsjett og plan.');
    expect(voiceReason('site', s, o, r)).toBe('«Lei pumpe» gir minst stans på plassen. Hver uke ekstra koster rigg og drift.');
    expect(voiceReason('foreman', s, o, r)).toBe('«Lei pumpe» koster 0,30 MNOK nå, men gir 1,20 MNOK om 6 uker. Prognose: uke 118 og 285,40 MNOK.');
  });
});
