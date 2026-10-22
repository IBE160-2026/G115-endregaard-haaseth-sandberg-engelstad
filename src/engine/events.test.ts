// Integrity of the event catalogue and the rule-based advisor.
import { describe, expect, it } from 'vitest';
import manifest from '../../assets/icons/manifest.json';
import { adviceFor } from './advisor';
import { EVENTS } from './events';
import { forecast, newGame, setCrew } from './game';
import { scenario as s } from './scenario';

const icons = new Set((manifest as { file: string }[]).map(m => m.file));

describe('event catalogue', () => {
  it.each(EVENTS.map(e => [e.id, e] as const))('%s refers to real icons, people and tasks', (_, e) => {
    expect(icons.has(e.icon)).toBe(true);
    expect(s.people.some(p => p.id === e.raisedBy)).toBe(true);
    expect(e.taskIds.every(id => s.tasks.some(t => t.id === id))).toBe(true);
    expect(e.options.length).toBeGreaterThanOrEqual(2);
    expect(e.options.every(o => o.cost >= 0 && o.delay >= 0)).toBe(true);
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
});
