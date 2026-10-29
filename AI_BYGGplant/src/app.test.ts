import { describe, expect, it } from 'vitest';
import { cleanMessages } from '../server/claude';
import { TURN_SCHEMA } from '../server/prompt';
import { budgetRange, riskTotal } from './budget';
import { esc, formatNok } from './format';
import { activeProject, addProject, exportProject, fileName, importProject, loadStore, projectTitle, removeActive } from './projects';
import { addUser, applyTurn, GREETING, newSession, toApiMessages, type Session } from './session';
import { emptyProject, type AiTurn } from './types';
import { placeOpenings, renderBuilding } from './ui/building';
import { ganttSvg, projectWeeks } from './ui/gantt';
import { renderReport, renderTab, TABS } from './ui/tabs';

const garage: AiTurn = {
  reply: 'En dobbel garasje, flott.',
  phase: 'apninger',
  changes: ['Porten satt til 5 m'],
  questions: [{ text: 'Hvor bred skal porten være?', options: ['2,5 m', '5 m'] }],
  project: {
    ...emptyProject(),
    name: 'Garasje',
    type: 'Garasje',
    building: {
      length_m: 7,
      width_m: 6,
      floors: 1,
      floor_height_m: 2.6,
      roof: 'Saltak',
      openings: [
        { kind: 'port', label: 'Garasjeport', count: 1, width_m: 5, height_m: 2.2, wall: 'front', floor: 1 },
        { kind: 'vindu', label: 'Vindu', count: 2, width_m: null, height_m: null, wall: 'venstre', floor: 1 },
      ],
    },
    budget: [{ post: 'Grunnarbeid', description: 'Graving og drenering', amount_nok: 85000, uncertainty_pct: 20 }],
    risks: [
      { title: 'Fjell i grunnen', probability: 'middels', consequence: 'Sprengning', measure: 'Prøvegrav', cost_nok: 40000 },
      { title: 'Sen port', probability: 'hoy', consequence: 'To uker forsinkelse', measure: 'Bestill tidlig', cost_nok: 10000 },
    ],
    schedule: [
      { id: 'a', name: 'Grunnarbeid', start_week: 0, duration_weeks: 2, depends_on: [] },
      { id: 'b', name: 'Råbygg', start_week: 2, duration_weeks: 3, depends_on: ['a'] },
    ],
  },
};

describe('session', () => {
  it('starts with the greeting and sends no messages before the user has written', () => {
    const s = newSession();
    expect(s.entries[0]).toMatchObject({ role: 'assistant', text: GREETING });
    expect(toApiMessages(s)).toEqual([]);
  });

  it('puts the greeting in front of the first answer, and the project only on the newest user message', () => {
    let s = addUser(newSession(), 'En garasje');
    expect(toApiMessages(s)).toEqual([{ role: 'user', content: `${GREETING}\n\nEn garasje` }]);
    s = addUser(applyTurn(s, garage), 'Gjør den 8 meter lang');
    const m = toApiMessages(s);
    expect(m.map((x) => x.role)).toEqual(['user', 'assistant', 'user']);
    expect(m[1].content).toContain('Hvor bred skal porten være?');
    expect(m[0].content).not.toContain('[Prosjektet');
    expect(m[2].content).toContain('"name":"Garasje"');
    expect(cleanMessages(m)).toEqual(m);
  });

  it('replaces the project and phase with the AI turn', () => {
    const s = applyTurn(addUser(newSession(), 'En garasje'), garage);
    expect(s.project.name).toBe('Garasje');
    expect(s.phase).toBe('apninger');
  });
});

describe('server', () => {
  it('rejects a dialog that does not end with the user', () => {
    expect(cleanMessages([{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }])).toBeNull();
    expect(cleanMessages('x')).toBeNull();
    expect(cleanMessages([])).toBeNull();
  });

  it('has a strict schema: every object lists all its properties as required', () => {
    const walk = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (n.type === 'object') {
        expect(n.additionalProperties).toBe(false);
        expect([...(n.required as string[])].sort()).toEqual(Object.keys(n.properties as object).sort());
      }
      Object.values(n).forEach(walk);
    };
    walk(TURN_SCHEMA);
  });
});

describe('drawing', () => {
  it('spreads openings evenly and keeps them inside the wall', () => {
    const placed = placeOpenings(garage.project.building.openings.filter((o) => o.wall === 'venstre'), 6, 2.6);
    expect(placed).toHaveLength(2);
    expect(placed[0].x + placed[0].w / 2).toBeCloseTo(2);
    expect(placed[1].x + placed[1].w / 2).toBeCloseTo(4);
    expect(placed[0].y).toBeCloseTo(0.9);
  });

  it('draws four elevations and a plan, and escapes the AI text', () => {
    const b = { ...garage.project.building, openings: [{ ...garage.project.building.openings[0], label: '<script>' }] };
    const html = renderBuilding(b);
    expect(html.match(/class="elevation"/g)).toHaveLength(5);
    expect(html).not.toContain('<script>');
    expect(renderBuilding(emptyProject().building)).toContain('class="empty"');
  });

  it('draws one bar per task and computes the build time', () => {
    expect(projectWeeks(garage.project.schedule)).toBe(5);
    expect(ganttSvg(garage.project.schedule).match(/class="g-bar"/g)).toHaveLength(2);
  });
});

describe('format', () => {
  it('formats money and escapes text', () => {
    expect(formatNok(1234567)).toBe('1 234 567 kr');
    expect(esc('<a href="x">')).toBe('&lt;a href=&quot;x&quot;&gt;');
  });
});

describe('v0.2: change log, budget range, risks and report', () => {
  const s = applyTurn(addUser(newSession(), 'En garasje'), garage);

  it('logs what each turn changed, with the budget before and after', () => {
    expect(s.log).toEqual([{ turn: 1, request: 'En garasje', changes: ['Porten satt til 5 m'], totalBefore: 0, totalAfter: 85000 }]);
    const quiet = applyTurn(addUser(s, 'Takk'), { ...garage, changes: [] });
    expect(quiet.log).toHaveLength(1);
  });

  it('turns each line uncertainty into a range for the total', () => {
    expect(budgetRange(s.project)).toEqual([68000, 102000]);
    expect(riskTotal(s.project)).toBe(50000);
  });

  it('lists risks with the likely ones first, and shows the change log', () => {
    const risk = renderTab('risiko', s);
    expect(risk.indexOf('Sen port')).toBeLessThan(risk.indexOf('Fjell i grunnen'));
    expect(renderTab('endringer', s)).toContain('Porten satt til 5 m');
    expect(renderTab('budsjett', s)).toContain('± 20 %');
  });

  it('puts every tab in the report', () => {
    const html = renderReport(s);
    for (const t of TABS) expect(html).toContain(`<h2>${t.label}</h2>`);
  });
});

describe('v0.2: projects', () => {
  it('migrates the v0.1 session and fills in what it lacks', () => {
    const v01 = { ...newSession(), project: { ...emptyProject(), name: 'Gammel', budget: [{ post: 'A', description: '', amount_nok: 1 }] } } as unknown as Session;
    delete (v01 as Partial<Session>).log;
    delete (v01.project as Partial<Session['project']>).risks;
    const store = loadStore(null, JSON.stringify(v01));
    const p = activeProject(store).session;
    expect(projectTitle(p)).toBe('Gammel');
    expect(p.project.risks).toEqual([]);
    expect(p.project.budget[0].uncertainty_pct).toBe(0);
    expect(p.log).toEqual([]);
  });

  it('starts fresh on broken data, and always keeps one project', () => {
    const store = loadStore('{broken', null);
    expect(store.projects).toHaveLength(1);
    expect(removeActive(store).projects).toHaveLength(1);
    const two = addProject(store);
    expect(removeActive(two).projects).toHaveLength(1);
  });

  it('exports and imports a project file, and rejects other files', () => {
    const s = applyTurn(addUser(newSession(), 'En garasje'), garage);
    expect(importProject(exportProject(s))).toEqual(s);
    expect(() => importProject('{"app":"other"}')).toThrow('ikke et AI Byggplan-prosjekt');
    expect(fileName(s)).toBe('garasje.byggplan.json');
  });
});
