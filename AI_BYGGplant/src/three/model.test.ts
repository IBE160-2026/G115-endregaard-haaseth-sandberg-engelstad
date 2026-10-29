import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Building, Opening, Roof } from '../contract/types';
import { GREY, buildModel, polyNormal, type Part } from './model';

const root = join(__dirname, '../../fixtures');
const steps: { name: string; building: Building }[] = [];
for (const dialog of readdirSync(root).sort()) {
  for (const file of readdirSync(join(root, dialog)).filter((f) => f.endsWith('.json')).sort()) {
    const step = JSON.parse(readFileSync(join(root, dialog, file), 'utf8'));
    const building = step.turn?.project?.building;
    if (building) steps.push({ name: `${dialog}/${file}`, building });
  }
}

const roof = (kind: Roof['kind'], extra: Partial<Roof> = {}): Roof => ({ kind, pitch_deg: 35, ridge_along: 'lengde', overhang_m: 0.4, ...extra });
const op = (id: string, extra: Partial<Opening> = {}): Opening => ({
  id, kind: 'vindu', label: `Vindu ${id}`, width_m: 1, height_m: 1, wall: 'front', floor: 1, offset_m: 2, sill_m: 1, ...extra,
});
const garage = (extra: Partial<Building> = {}): Building => ({
  length_m: 8, width_m: 7, floors: 1, floor_height_m: 2.5, roof: roof('saltak'), exterior: null, terrain_slope_pct: 0, openings: [], ...extra,
});

const pitchedRoof = (b: Building) => b.roof?.kind === 'saltak' || b.roof?.kind === 'pulttak' || b.roof?.kind === 'valm';
/** Same drawability rule as the model: placed, sized, on a floor the building has (floors + 1 = loft, pitched roofs only). */
const drawable = (o: Opening, b: Building) =>
  o.offset_m != null && o.sill_m != null && (o.width_m ?? 0) > 0 && (o.height_m ?? 0) > 0 && o.floor >= 1 &&
  (o.floor <= (b.floors ?? 0) || (o.floor === (b.floors ?? 0) + 1 && pitchedRoof(b)));

/** Overlap volume of two boxes (0 when they only touch). */
function overlap(a: NonNullable<Part['box']>, b: NonNullable<Part['box']>) {
  const ax = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const ay = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  const az = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
  return ax > 1e-6 && ay > 1e-6 && az > 1e-6 ? ax * ay * az : 0;
}

/** Each opening is checked against every wall panel (boxes) in its wall's plane slab. */
function checkModel(b: Building) {
  const m = buildModel(b);
  const ids = new Set(b.openings.map((o) => o.id));
  for (const p of m.parts) if (p.refId !== null) expect(ids.has(p.refId)).toBe(true);
  if (!m.empty) {
    for (const o of b.openings) {
      const n = m.parts.filter((p) => p.refId === o.id).length;
      expect(n, o.id).toBe(drawable(o, b) ? 1 : 0);
    }
    const panels = m.parts.filter((p) => p.kind === 'wall' && p.box);
    for (const p of m.parts.filter((q) => q.kind === 'opening' && q.box)) {
      for (const w of panels) expect(overlap(p.box!, w.box!), `${p.id} vs ${w.id}`).toBe(0);
    }
    for (const p of m.parts) {
      if (p.box) expect([p.box.w, p.box.h, p.box.d].every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
      if (p.poly) expect(p.poly.points.flat().every(Number.isFinite)).toBe(true);
    }
    expect(new Set(m.parts.map((p) => p.id)).size).toBe(m.parts.length);
  }
  return m;
}

describe('buildModel over every fixture step', () => {
  it('found fixture steps', () => expect(steps.length).toBeGreaterThan(0));
  for (const { name, building } of steps) {
    it(name, () => {
      const m = checkModel(building);
      const { length_m: L, width_m: W, floors } = building;
      if (L == null || W == null || floors == null) {
        expect(m.empty).toBe(true);
        expect(m.parts).toEqual([]);
        return;
      }
      expect(m.bounds.w).toBe(L);
      expect(m.bounds.d).toBe(W);
      const fh = building.floor_height_m ?? 2.5;
      const wallH = floors * fh;
      expect(m.bounds.h).toBeGreaterThan(wallH);
      const r = building.roof;
      if (r && (r.kind === 'saltak' || r.kind === 'valm')) {
        const span = r.ridge_along === 'lengde' ? W : L;
        const rise = (span / 2) * Math.tan(((r.pitch_deg ?? 30) * Math.PI) / 180);
        expect(m.bounds.h).toBeGreaterThanOrEqual(wallH + rise);
        expect(m.bounds.h).toBeLessThan(wallH + rise + 0.4);
      }
      for (const o of building.openings) {
        if (o.offset_m == null || o.sill_m == null) expect(m.warnings.some((w) => w.includes('ikke avklart') && w.includes(o.label))).toBe(true);
      }
    });
  }
});

describe('buildModel rules', () => {
  it('draws nothing for null dimensions', () => {
    for (const k of ['length_m', 'width_m', 'floors'] as const) {
      const m = buildModel(garage({ [k]: null, openings: [op('a')] }));
      expect(m).toMatchObject({ empty: true, parts: [], bounds: { w: 0, h: 0, d: 0 } });
    }
  });

  it('never invents a position for an unplaced opening', () => {
    const m = checkModel(garage({ openings: [op('a', { offset_m: null }), op('b', { sill_m: null, label: 'Dør' })] }));
    expect(m.parts.some((p) => p.refId)).toBe(false);
    expect(m.warnings).toContain('Plassering av Vindu a er ikke avklart');
    expect(m.warnings).toContain('Plassering av Dør er ikke avklart');
  });

  it('clips an opening that does not fit and warns, never moves it', () => {
    const m = checkModel(garage({ openings: [op('a', { offset_m: 7.5, width_m: 1 })] }));
    const p = m.parts.find((q) => q.refId === 'a')!;
    expect(p.box!.x).toBe(7.5);
    expect(p.box!.w).toBeCloseTo(0.35);
    expect(m.warnings.some((w) => w.includes('avkortet'))).toBe(true);
  });

  it('warns about openings on floors the building lacks and about overlaps', () => {
    const m = checkModel(garage({ floors: 1, openings: [op('a', { floor: 3 }), op('b'), op('c', { offset_m: 2.5 })] }));
    expect(m.warnings.some((w) => w.includes('etasje 3'))).toBe(true);
    expect(m.parts.some((p) => p.refId === 'a')).toBe(false);
    const flat = checkModel(garage({ roof: roof('flatt'), openings: [op('l', { floor: 2 })] }));
    expect(flat.warnings.some((w) => w.includes('etasje 2'))).toBe(true);
    expect(flat.parts.some((p) => p.refId === 'l')).toBe(false);
    expect(m.warnings.some((w) => w.includes('overlapper'))).toBe(true);
  });

  it('puts a loft opening (floors + 1) in the gable and a front loft opening in the roof plane', () => {
    const m = checkModel(garage({
      openings: [op('g', { wall: 'venstre', floor: 2, offset_m: 3, sill_m: 0.3 }), op('r', { wall: 'front', floor: 2, offset_m: 3, sill_m: 0.5 })],
    }));
    const g = m.parts.find((p) => p.refId === 'g')!;
    expect(g.box).toBeDefined();
    expect(g.box!.y).toBeCloseTo(2.8);
    expect(m.parts.some((p) => p.kind === 'gable')).toBe(true);
    const r = m.parts.find((p) => p.refId === 'r')!;
    expect(r.poly).toBeDefined();
    expect(m.parts.some((p) => /^wall-(front|bak)/.test(p.id) && p.box!.y + p.box!.h > 2.5 + 1e-6)).toBe(false); // eave walls stop at floors × height
    const n = polyNormal(r.poly!.points);
    expect(n[1]).toBeGreaterThan(0);
    expect(n[2]).toBeLessThan(0); // faces the front (−z)
    expect(Math.min(...r.poly!.points.map((q) => q[1]))).toBeGreaterThan(2.5);
  });

  it('measures a roof window sill and height along the roof surface from the eave', () => {
    const m = buildModel(garage({ roof: roof('saltak', { pitch_deg: 30, overhang_m: 0 }), openings: [op('r', { floor: 2, sill_m: 1, height_m: 1 })] }));
    const pts = m.parts.find((p) => p.refId === 'r')!.poly!.points;
    const ys = pts.map((q) => q[1]), zs = pts.map((q) => q[2]);
    // Along the slope: 1 m → rise 0.5 m and run 0.866 m at 30°; lifted by the roof thickness.
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(0.5, 2);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(Math.cos(Math.PI / 6), 2);
    expect(Math.min(...zs)).toBeCloseTo(Math.cos(Math.PI / 6), 2);
  });

  it('produces the expected roof planes per kind', () => {
    const count = (b: Building) => buildModel(b).parts.filter((p) => p.kind === 'roof').length;
    expect(count(garage({ roof: roof('saltak') }))).toBe(2);
    expect(count(garage({ roof: roof('saltak', { ridge_along: 'bredde' }) }))).toBe(2);
    expect(count(garage({ roof: roof('pulttak') }))).toBe(1);
    expect(count(garage({ roof: roof('valm') }))).toBe(4);
    expect(count(garage({ roof: roof('flatt') }))).toBe(1);
    expect(count(garage({ roof: roof('annet') }))).toBe(1);
    expect(count(garage({ roof: null }))).toBe(1);
    expect(buildModel(garage({ roof: null })).warnings).toContain('Takform ikke avklart');
    expect(buildModel(garage({ roof: roof('annet') })).warnings).toContain('Takform ikke avklart');
    for (const k of ['saltak', 'pulttak', 'valm'] as const) {
      for (const p of buildModel(garage({ roof: roof(k) })).parts.filter((q) => q.kind === 'roof')) {
        expect(polyNormal(p.poly!.points)[1]).toBeGreaterThan(0);
      }
    }
  });

  it('warns for display fallbacks', () => {
    const m = buildModel(garage({ floor_height_m: null, roof: roof('saltak', { pitch_deg: null, overhang_m: null }), terrain_slope_pct: 8 }));
    expect(m.warnings).toEqual(expect.arrayContaining([
      'Etasjehøyde ikke avklart – vist med 2,5 m', 'Takvinkel ikke avklart – vist med 30°', 'Terrenghelling vises ikke i 3D ennå',
    ]));
    expect(m.warnings.some((w) => w.includes('utstikk'))).toBe(false);
  });

  it('falls back to neutral greys for invalid colours', () => {
    const m = buildModel(garage({ exterior: { cladding: null, wall_color: 'rød', roof_color: '#12345', trim_color: null } }));
    expect(m.parts.find((p) => p.kind === 'wall')!.color).toBe(GREY.wall);
    expect(m.parts.find((p) => p.kind === 'roof')!.color).toBe(GREY.roof);
    expect(m.parts.find((p) => p.kind === 'trim')!.color).toBe(GREY.trim);
    const c = buildModel(garage({ exterior: { cladding: null, wall_color: '#aa0000', roof_color: '#111111', trim_color: '#ffffff' } }));
    expect(c.parts.find((p) => p.kind === 'wall')!.color).toBe('#aa0000');
  });

  it('wall panels never cover an opening, for every roof kind and wall', () => {
    for (const k of ['saltak', 'pulttak', 'valm', 'flatt', 'annet'] as const) {
      for (const ridge of ['lengde', 'bredde'] as const) {
        checkModel(garage({
          roof: roof(k, { ridge_along: ridge }),
          openings: [
            op('p', { kind: 'port', wall: 'front', offset_m: 1.5, width_m: 5, height_m: 2.25, sill_m: 0 }),
            op('d', { kind: 'dor', wall: 'hoyre', offset_m: 0.1, width_m: 0.9, height_m: 2.1, sill_m: 0 }),
            op('w1', { wall: 'bak', offset_m: 1 }), op('w2', { wall: 'venstre', offset_m: 5.5, width_m: 2 }),
            op('l1', { wall: 'venstre', floor: 2, offset_m: 3, sill_m: 0.2 }), op('l2', { wall: 'bak', floor: 2, offset_m: 3, sill_m: 0.4 }),
            op('l3', { wall: 'front', floor: 2, offset_m: 3, sill_m: 0.4, height_m: 1.2 }), op('l4', { wall: 'hoyre', floor: 2, offset_m: 3, sill_m: 0.1 }),
          ],
        }));
      }
    }
  });

  it('is deterministic', () => {
    for (const { building } of steps) expect(buildModel(building)).toEqual(buildModel(structuredClone(building)));
    const b = garage({ openings: [op('a'), op('b', { wall: 'venstre', floor: 2, sill_m: 0.2 })] });
    expect(JSON.stringify(buildModel(b))).toBe(JSON.stringify(buildModel(b)));
  });
});
