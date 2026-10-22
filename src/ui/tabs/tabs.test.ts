// The tab renderers return HTML strings, so they are tested without a DOM.
import manifest from '../../../assets/icons/manifest.json';
import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
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
    expect(html).toContain('34 + 17'); // own + hired crew
  });
});

describe('Menneskene', () => {
  it('shows 16 people with foremen crew size', () => {
    const html = renderPeople(ctx({ F: 'hire' }));
    expect(count(html, 'class="card person"')).toBe(16);
    expect(html).toContain('Mannskap: 34 + 17 innleid · 37,5 t/uke');
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
