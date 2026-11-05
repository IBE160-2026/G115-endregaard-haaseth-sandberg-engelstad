// Checks the demo dialogs beyond the schema: geometry fits, ids stay stable, prices match brand.json.
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { wallLength, type Project } from '../src/contract/types.ts';
import { loadBrand } from './brand.ts';
import { FIXTURES_DIR, ROOT } from './http.ts';
import { catalogueText, MAX_CATALOGUE, SYSTEM_PROMPT, systemPrompt } from './prompt.ts';
import { loadDialog } from './providers/demo.ts';

const brand = loadBrand(ROOT)!;
const dialogs = readdirSync(FIXTURES_DIR).map((name) => [name, loadDialog(FIXTURES_DIR, name)] as const);


describe('brand.json', () => {
  it('is a complete, fictional brand with 20-35 products', () => {
    expect(brand.company).toBe('Nordlys Hus og Garasje AS');
    expect(brand.logo).toBe('brand/logo.svg');
    expect(brand.colors.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(brand.colors.accent_dark).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(brand.dealer.email).toMatch(/@[\w.-]*example\.com$/);
    expect(brand.catalogue.length).toBeGreaterThanOrEqual(20);
    expect(brand.catalogue.length).toBeLessThanOrEqual(35);
    expect(new Set(brand.catalogue.map((i) => i.sku)).size).toBe(brand.catalogue.length);
  });

  it('goes into the prompt as data, capped at 50 products', () => {
    expect(systemPrompt(brand)).toContain(SYSTEM_PROMPT);
    expect(systemPrompt(brand)).toContain('Produktkatalog fra Nordlys Hus og Garasje AS – bruk disse prisene når de passer, ellers egne anslag');
    expect(systemPrompt(null)).toBe(SYSTEM_PROMPT);
    const big = { ...brand, catalogue: Array.from({ length: 80 }, (_, i) => ({ sku: `X-${i}`, name: 'n', unit: 'stk', price_nok: i })) };
    expect(catalogueText(big).split('\n').filter((l) => l.startsWith('X-'))).toHaveLength(MAX_CATALOGUE);
  });
});

for (const [name, steps] of dialogs) {
  describe(`the ${name} demo dialog`, () => {
    const projects = steps.map((s) => s.turn.project as unknown as Project);

    it('returns the whole project every turn (no null sections)', () => {
      for (const p of projects) for (const k of ['facts', 'building', 'budget', 'schedule', 'risks', 'assumptions'] as const) expect(p[k]).not.toBeNull();
    });

    it('keeps every opening inside its wall and within the floor height', () => {
      projects.forEach((p, i) => {
        const b = p.building;
        for (const o of b.openings) {
          const v = b.volumes.find((x) => x.id === o.volume_id);
          expect(v, `step ${i + 1} ${o.id} has a volume`).toBeDefined();
          if (!v) continue;
          const wall = wallLength(v, o.wall);
          if (o.offset_m !== null && o.width_m !== null && wall !== null) {
            expect(o.offset_m, `step ${i + 1} ${o.id}`).toBeGreaterThanOrEqual(0);
            expect(o.offset_m + o.width_m, `step ${i + 1} ${o.id} fits its wall`).toBeLessThanOrEqual(wall + 1e-9);
          }
          // floors + 1 is the loft/roof level (gable triangle or roof plane, sill from the eave); a loft is not a storey.
          const inStorey = v.floors === null || o.floor <= v.floors;
          if (inStorey && o.sill_m !== null && o.height_m !== null && v.floor_height_m !== null) {
            expect(o.sill_m + o.height_m, `step ${i + 1} ${o.id} fits the floor`).toBeLessThanOrEqual(v.floor_height_m + 1e-9);
          }
          // 0, −1 … are basement levels; floors + 1 is the loft/roof level.
          expect(o.floor, `step ${i + 1} ${o.id}`).toBeGreaterThanOrEqual(1 - v.basement_floors);
          if (v.floors !== null) expect(o.floor, `step ${i + 1} ${o.id}`).toBeLessThanOrEqual(v.floors + 1);
          if (!inStorey) expect(v.roof, `step ${i + 1} ${o.id} needs a roof`).not.toBeNull();
        }
      });
    });

    it('never lets two volumes overlap on the site', () => {
      projects.forEach((p, i) => {
        const vs = p.building.volumes.filter((v) => v.length_m !== null && v.width_m !== null);
        for (let a = 0; a < vs.length; a++)
          for (let c = a + 1; c < vs.length; c++) {
            const [A, B] = [vs[a], vs[c]];
            const overlap =
              A.x_m < B.x_m + B.length_m! - 1e-9 && B.x_m < A.x_m + A.length_m! - 1e-9 && A.y_m < B.y_m + B.width_m! - 1e-9 && B.y_m < A.y_m + A.width_m! - 1e-9;
            expect(overlap, `step ${i + 1}: ${A.id} overlaps ${B.id}`).toBe(false);
          }
      });
    });

    it('keeps ids stable: an id never changes what it is', () => {
      const kinds = new Map<string, string>();
      for (const p of projects) {
        const items = [
          ...p.building.volumes.map((v) => [v.id, 'volume']),
          ...p.building.openings.map((o) => [o.id, `opening:${o.kind}`]),
          ...p.budget.map((l) => [l.id, 'budget']),
          ...p.risks.map((r) => [r.id, 'risk']),
          ...p.schedule.map((t) => [t.id, 'task']),
        ];
        for (const [id, kind] of items) {
          expect(kinds.get(id) ?? kind, id).toBe(kind);
          kinds.set(id, kind);
        }
      }
    });

    it('only uses skus from brand.json, and every budget has a contingency line', () => {
      const skus = new Set(brand.catalogue.map((i) => i.sku));
      for (const p of projects) {
        for (const l of p.budget) if (l.sku !== null) expect(skus.has(l.sku), `${l.id} ${l.sku}`).toBe(true);
        if (p.budget.length) expect(p.budget.some((l) => /uforutsett/i.test(l.post))).toBe(true);
      }
    });
  });
}

describe('the garage script', () => {
  const steps = loadDialog(FIXTURES_DIR, 'garage');
  const total = (i: number) => steps[i].turn.project.budget!.reduce((s, l) => s + l.amount_nok, 0);

  it('follows Mats\'s script: phases, length, roof window, budget and hand-off', () => {
    expect(steps.map((s) => s.turn.phase)).toEqual(['tomt', 'bygg', 'apninger', 'materialer', 'budsjett', 'detaljer', 'detaljer']);
    expect(steps[4].turn.project.budget!.length).toBeGreaterThanOrEqual(8);
    expect(steps[4].turn.project.budget!.length).toBeLessThanOrEqual(12);
    expect(steps[4].turn.project.schedule!.length).toBeGreaterThanOrEqual(6);
    expect(steps[4].turn.project.risks!.length).toBeGreaterThanOrEqual(4);
    const v6 = steps[5].turn.project.building!.volumes[0];
    expect(v6.length_m).toBe(9);
    expect(v6.floors).toBe(1);
    expect(steps[5].turn.project.building!.openings.find((o) => o.label === 'Takvindu')).toMatchObject({ kind: 'vindu', wall: 'front', floor: v6.floors! + 1 });
    expect(total(5) - total(4)).toBeGreaterThan(30_000);
    expect(total(5) - total(4)).toBeLessThan(120_000);
    expect(steps[6].turn.changes).toEqual([]);
    expect(steps[6].turn.project).toEqual(steps[5].turn.project);
    expect(steps[6].turn.reply).toContain('«Send til forhandler»');
  });

  it('prices catalogue lines from brand.json (amount is a multiple of the unit price)', () => {
    const price = new Map(brand.catalogue.map((i) => [i.sku, i.price_nok]));
    for (const l of steps[4].turn.project.budget!) {
      if (!l.sku || ['b-tak', 'b-maling'].includes(l.id)) continue; // these add a second product
      expect(l.amount_nok % price.get(l.sku)!, l.id).toBe(0);
    }
  });
});
