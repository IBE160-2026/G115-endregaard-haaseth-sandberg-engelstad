import { describe, expect, it } from 'vitest';
import { DIALOGS } from './contract/fixtures';
import { activeProject, addProject, exportProject, fileName, importProject, loadStore, projectTitle, removeActive } from './projects';
import { addUser, applyTurn, GREETING, highlightIds, newSession, normalizeSession, toApiMessages } from './session';

const [step1, step2] = DIALOGS.garage;

describe('session', () => {
  it('starts with the greeting and sends no messages before the user has written', () => {
    const s = newSession();
    expect(s.entries[0]).toMatchObject({ role: 'assistant', text: GREETING });
    expect(toApiMessages(s)).toEqual([]);
  });

  it('puts the greeting in front of the first answer, and the project only on the newest user message', () => {
    let s = addUser(newSession(), step1.user);
    expect(toApiMessages(s)).toEqual([{ role: 'user', content: `${GREETING}\n\n${step1.user}` }]);
    s = addUser(applyTurn(s, step1.turn), step2.user);
    const m = toApiMessages(s);
    expect(m.map((x) => x.role)).toEqual(['user', 'assistant', 'user']);
    expect(m[1].content).toContain(step1.turn.questions[0].text);
    expect(m[0].content).not.toContain('[Prosjektet');
    expect(m[2].content).toContain('"name":"Dobbelgarasje med loft"');
  });

  it('logs each turn that changed something, and highlights the ids it named', () => {
    let s = applyTurn(addUser(newSession(), step1.user), step1.turn);
    s = applyTurn(addUser(s, step2.user), step2.turn);
    expect(s.log).toHaveLength(2);
    expect(s.log[1]).toMatchObject({ turn: 2, request: step2.user, totalBefore: 0, totalAfter: 0 });
    expect(highlightIds(s)).toEqual(new Set(['port-1']));
    const quiet = applyTurn(addUser(s, 'Takk'), { ...step2.turn, changes: [] });
    expect(quiet.log).toHaveLength(2);
  });
});

describe('migrating saved data', () => {
  it('turns a v0.2 session into the v0.3 contract without guessing', () => {
    const v02 = {
      entries: [{ role: 'assistant', text: GREETING, questions: [] }],
      phase: 'apninger',
      log: [{ turn: 1, request: 'x', changes: ['Port lagt til'], totalBefore: 0, totalAfter: 0 }],
      project: {
        name: 'Gammel',
        type: 'Garasje',
        summary: '',
        facts: [],
        building: {
          length_m: 7, width_m: 6, floors: 1, floor_height_m: 2.6, roof: 'Saltak',
          openings: [{ kind: 'vindu', label: 'Vindu', count: 2, width_m: 1, height_m: 1, wall: 'ukjent', floor: 1 }],
        },
        budget: [{ post: 'A', description: '', amount_nok: 1 }],
        schedule: [],
        assumptions: [],
      },
    };
    const s = normalizeSession(v02);
    expect(s.project.building.roof).toEqual({ kind: 'annet', pitch_deg: null, ridge_along: 'lengde', overhang_m: null });
    expect(s.project.building.openings).toHaveLength(2);
    expect(new Set(s.project.building.openings.map((o) => o.id)).size).toBe(2);
    expect(s.project.building.openings[0]).toMatchObject({ wall: 'front', offset_m: null, sill_m: null });
    expect(s.project.building.openings[0]).not.toHaveProperty('count');
    expect(s.project.budget[0]).toMatchObject({ uncertainty_pct: 0, sku: null });
    expect(s.project.budget[0].id).toBeTruthy();
    expect(s.project.risks).toEqual([]);
    expect(s.log[0].changes).toEqual([{ section: 'annet', text: 'Port lagt til', ref_id: null }]);
  });
});

describe('projects', () => {
  it('migrates the v0.1 single session', () => {
    const v01 = { ...newSession(), project: { ...newSession().project, name: 'Gammel' } } as Record<string, unknown>;
    delete v01.log;
    const store = loadStore(null, JSON.stringify(v01));
    expect(projectTitle(activeProject(store).session)).toBe('Gammel');
  });

  it('starts fresh on broken data, and always keeps one project', () => {
    const store = loadStore('{broken', null);
    expect(store.projects).toHaveLength(1);
    expect(removeActive(store).projects).toHaveLength(1);
    expect(removeActive(addProject(store)).projects).toHaveLength(1);
  });

  it('exports and imports a project file, and rejects other files', () => {
    const s = applyTurn(addUser(newSession(), step1.user), step1.turn);
    expect(importProject(exportProject(s))).toEqual(s);
    expect(() => importProject('{"app":"other"}')).toThrow('ikke et AI Byggplan-prosjekt');
    expect(fileName(s)).toBe('dobbelgarasje-med-loft.byggplan.json');
  });
});
