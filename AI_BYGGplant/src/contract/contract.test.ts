import { describe, expect, it } from 'vitest';
import { addUser, applyTurn, newSession } from '../session';
import { DIALOGS } from './fixtures';
import { TURN_SCHEMA } from './schema';
import { emptyProject, hexColor, mergeProject } from './types';
import { consistencyErrors, parseTurn, schemaErrors } from './validate';

describe('the schema', () => {
  it('is strict: every object lists all its properties as required and allows nothing else', () => {
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

  it('puts reply first, so it streams first', () => {
    expect(Object.keys((TURN_SCHEMA as { properties: object }).properties)[0]).toBe('reply');
  });
});

describe('the validator', () => {
  const turn = DIALOGS.garage[1].turn;

  it('accepts a valid turn and reports what is wrong with a broken one', () => {
    expect(schemaErrors(turn)).toEqual([]);
    const broken = structuredClone(turn) as unknown as Record<string, any>;
    broken.phase = 'ferdig';
    delete broken.project.building.openings[0].offset_m;
    broken.project.extra = 1;
    broken.project.budget = [{ id: 'x', post: 'A', description: '', amount_nok: '10', uncertainty_pct: 5, sku: null }];
    const errors = schemaErrors(broken).join('\n');
    expect(errors).toContain('$.phase');
    expect(errors).toContain('openings[0].offset_m: missing');
    expect(errors).toContain('$.project.extra: not allowed');
    expect(errors).toContain('amount_nok: expected number');
  });

  it('allows null for a section (unchanged) but not for a plain field', () => {
    const t = structuredClone(turn);
    t.project.budget = null;
    expect(schemaErrors(t)).toEqual([]);
    (t as unknown as { reply: null }).reply = null;
    expect(schemaErrors(t)).not.toEqual([]);
  });

  it('parseTurn throws on JSON that breaks the contract', () => {
    expect(() => parseTurn('{"reply":"hei"}')).toThrow('kontrakten');
    expect(parseTurn(JSON.stringify(turn)).reply).toBe(turn.reply);
  });
});

describe('the demo dialogs', () => {
  for (const [name, steps] of Object.entries(DIALOGS)) {
    it(`${name}: every step follows the contract, ids are unique and every ref_id resolves`, () => {
      expect(steps.length).toBeGreaterThan(0);
      let s = newSession();
      steps.forEach((step, i) => {
        expect(step.user.trim(), `${name} step ${i + 1} user`).not.toBe('');
        expect(schemaErrors(step.turn), `${name} step ${i + 1}`).toEqual([]);
        s = applyTurn(addUser(s, step.user), step.turn);
        expect(consistencyErrors(step.turn, s.project), `${name} step ${i + 1}`).toEqual([]);
      });
    });
  }
});

describe('merging and colours', () => {
  it('keeps a section that comes back null', () => {
    const prev = { ...emptyProject(), budget: [{ id: 'a', post: 'A', description: '', amount_nok: 1, uncertainty_pct: 0, sku: null }] };
    const next = mergeProject(prev, { ...DIALOGS.garage[1].turn.project, budget: null });
    expect(next.budget).toBe(prev.budget);
    expect(next.building.length_m).toBe(8);
  });

  it('only accepts #rrggbb colours', () => {
    expect(hexColor('#A0b1c2')).toBe('#A0b1c2');
    expect(hexColor('rød')).toBeNull();
    expect(hexColor(null)).toBeNull();
  });
});
