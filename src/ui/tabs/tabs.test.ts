// The tab renderers return HTML strings, so they are tested without a DOM.
import manifest from '../../../assets/icons/manifest.json';
import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import { choose, forecast, newGame, runUntilDecision, setCrew, setMode, step, triggerEvent } from '../../engine/game';
import { renderFinal } from '../play';
import { simulate } from '../../engine/simulate';
import { budgetOf } from '../budgetLines';
import { ganttSvg } from '../gantt';
import { renderBudget } from './budget';
import { renderBuildings } from './buildings';
import type { TabContext } from './context';
import { renderDisciplines } from './disciplines';
import { renderPeople } from './people';
import { renderSchedule } from './schedule';

const baseline = simulate(scenario);
const ctx = (modes: TabContext['modes'] = {}): TabContext =>
  ({ scenario, modes, result: simulate(scenario, modes), baseline });
const count = (html: string, s: string) => html.split(s).length - 1;

describe('Budsjett', () => {
  it('F overtime: total 282,52, 111 weeks and 95 weeks of site overhead', () => {
    const html = renderBudget(ctx({ F: 'overtime' }));
    expect(html).toContain('<b>282,52</b>');
    expect(html).toContain('<b>111</b>');
    expect(html).toContain('Rigg og drift (95 uker × 0,45)');
  });

  it('leaves the Δ cell empty for rows that did not change', () => {
    const html = renderBudget(ctx({ F: 'overtime' }));
    expect(count(html, '<td class="num delta">+')).toBe(2); // F row and Sum disipliner
  });

  it('shown lines add up to the shown sums and total', () => {
    // F + H on overtime both have half-øre labour (16.065, 13.608), which used to drift.
    for (const modes of [{}, { F: 'overtime' }, { F: 'overtime', H: 'overtime' }, { C: 'overtime', F: 'overtime', H: 'overtime', I: 'overtime' }] as const) {
      const b = budgetOf(simulate(scenario, modes));
      const cents = (x: number) => Math.round(x * 100);
      expect(cents(b.labour)).toBe(b.lines.reduce((a, l) => a + cents(l.labour), 0));
      expect(cents(b.materials)).toBe(b.lines.reduce((a, l) => a + cents(l.materials), 0));
      expect(cents(b.tasks)).toBe(cents(b.labour) + cents(b.materials));
      expect(cents(b.total)).toBe(cents(b.tasks) + cents(b.overhead));
    }
  });
});

describe('Disiplinene', () => {
  it('marks the selected mode as pressed', () => {
    const html = renderDisciplines(ctx({ F: 'hire' }));
    expect(html).toContain('data-task="F" data-mode="hire" aria-pressed="true"');
    expect(html).toContain('data-task="F" data-mode="normal" aria-pressed="false"');
  });

  it('shows the crew control with the share of the base crew', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    setCrew(scenario, game, 'F', 24);
    const html = renderDisciplines({ ...ctx(), game, result: forecast(scenario, game) });
    expect(html).toContain('<b>24</b> <small>71 %</small>');
    expect(html).toContain('class="crew under"');
  });
});

describe('Menneskene (org chart)', () => {
  it('shows all 16 people as nodes', () => {
    expect(count(renderPeople(ctx()), 'data-person=')).toBe(16);
  });

  it('only the project manager and the site manager report to the owner', () => {
    const direct = scenario.people.filter(p => p.reportsTo === 'owner').map(p => p.id);
    expect(direct).toEqual(['pm', 'site']);
    const foremen = scenario.people.filter(p => p.taskId);
    expect(foremen.every(p => p.reportsTo === 'pm' || p.reportsTo === 'site')).toBe(true);
    expect(scenario.people.filter(p => p.player).map(p => p.role)).toEqual(['Prosjekteier']);
  });

  it('shows details and crew controls for a selected foreman', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    const html = renderPeople({ ...ctx(), game, selected: 'foreman-F' });
    expect(html).toContain('data-person="foreman-F" aria-pressed="true"');
    expect(html).toContain('data-crew-task="F"');
    expect(html).toContain('rapporterer til Site manager');
  });
});

describe('Byggene', () => {
  it('marks A-blokka and Kjelleranlegget as in the simulation', () => {
    const html = renderBuildings(ctx());
    expect(count(html, 'I simulering')).toBe(2);
    expect(count(html, 'Ikke i scenarioet')).toBe(scenario.buildings.length - 2);
  });
});

describe('Fremdriftsplan', () => {
  it('shows 111 weeks for F overtime and lists critical tasks', () => {
    const html = renderSchedule(ctx({ F: 'overtime' }));
    expect(html).toContain('<b>111 uker</b>');
    expect(html).toContain('Kritiske aktiviteter: A, C, D, E, F, G, I, J, N.');
  });

  it('puts the milestone at the finish week and outlines only changed tasks', () => {
    const svg = ganttSvg(scenario, simulate(scenario, { H: 'hire' }), baseline);
    // x(week) = 230 + week × 6 → week 114 = 914.
    expect(svg).toContain('<path d="M914 ');
    expect(count(svg, 'class="g-ghost"')).toBe(1);

    const shifted = ganttSvg(scenario, simulate(scenario, { F: 'overtime' }), baseline);
    // F is shorter; G, O, H, I, K, J, N only move. All 8 get an outline.
    expect(count(shifted, 'class="g-ghost"')).toBe(8);
  });
});

describe('icons', () => {
  it('every icon path used by the scenario exists in the icon manifest', () => {
    const files = new Set(manifest.map(m => m.file));
    const used = [...scenario.tasks.map(t => t.icon), ...scenario.people.map(p => p.icon), ...scenario.buildings.map(b => b.icon)];
    expect(used.filter(u => !files.has(u))).toEqual([]);
  });
});

describe('review follow-ups (v0.2)', () => {
  const waterGame = () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    while (g.week < 40) step(scenario, g);
    triggerEvent(scenario, g, 'water');
    choose(scenario, g, 'pump');
    return g;
  };

  it('Budsjett includes event costs in the lines and the total', () => {
    const game = waterGame();
    const result = forecast(scenario, game);
    const b = budgetOf(result);
    const cents = (x: number) => Math.round(x * 100);
    expect(cents(b.total)).toBe(cents(b.tasks) + cents(b.overhead) + cents(b.events));
    const html = renderBudget({ ...ctx(), game, result });
    expect(html).toContain('<td>Hendelser og tiltak</td><td></td><td></td><td class="num">0,80</td>');
    expect(html).toContain('<b>284,80</b>');
  });

  it('final report shows headline, week and cost difference', () => {
    const g = newGame(scenario, 'easy', 1, { randomEvents: false });
    setCrew(scenario, g, 'F', 24);
    runUntilDecision(scenario, g);
    const html = renderFinal(scenario, g);
    expect(html).toContain('Over budsjett og forsinket');
    expect(html).toContain('<b>uke 123</b><small>9 uker for sent</small>');
    expect(html).toContain('+4,05 mot mål 283,10');
  });

  it('Gantt shows done parts up to the current week and a today line', () => {
    const game = waterGame();
    const svg = ganttSvg(scenario, forecast(scenario, game), baseline, game.week);
    // A, C, D are done and E is in progress at week 40: four done overlays.
    expect(count(svg, 'class="g-done"')).toBe(4);
    expect(svg).toContain(`<line x1="${230 + 40 * 6}"`);
  });

  it('foreman details show hired workers and the active challenge', () => {
    const game = newGame(scenario, 'easy', 1, { randomEvents: false });
    setMode(scenario, game, 'F', 'hire');
    const html = renderPeople({ ...ctx(), game, result: forecast(scenario, game), selected: 'foreman-F' });
    expect(html).toContain('+ 17 innleid');
    while (game.week < 40) step(scenario, game);
    triggerEvent(scenario, game, 'water');
    const site = renderPeople({ ...ctx(), game, result: forecast(scenario, game), selected: 'site' });
    expect(site).toContain('Aktiv utfordring');
    expect(site).toContain('Vann i kjeller');
  });
});
