import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { isSized, siteBounds, type Building, type Exterior, type Opening, type Roof, type Volume } from '../contract/types';
import { GREY, buildModel, polyNormal, type Part } from './model';

const root = join(__dirname, '../../fixtures');
const steps: { name: string; building: Building }[] = [];
for (const dialog of readdirSync(root).sort()) {
  if (!statSync(join(root, dialog)).isDirectory()) continue;
  for (const file of readdirSync(join(root, dialog)).filter((f) => f.endsWith('.json')).sort()) {
    const step = JSON.parse(readFileSync(join(root, dialog, file), 'utf8'));
    const building = step.turn?.project?.building;
    if (building) steps.push({ name: `${dialog}/${file}`, building });
  }
}

const roof = (kind: Roof['kind'], extra: Partial<Roof> = {}): Roof => ({ kind, pitch_deg: 35, ridge_along: 'lengde', overhang_m: 0.4, ...extra });
const vol = (id: string, extra: Partial<Volume> = {}): Volume => ({
  id, name: id[0].toUpperCase() + id.slice(1), x_m: 0, y_m: 0, length_m: 8, width_m: 7, floors: 1, floor_height_m: 2.5,
  basement_floors: 0, roof: roof('saltak'), exterior: null, ...extra,
});
const op = (id: string, extra: Partial<Opening> = {}): Opening => ({
  id, volume_id: 'garasje', kind: 'vindu', label: `Vindu ${id}`, width_m: 1, height_m: 1, wall: 'front', floor: 1, offset_m: 2, sill_m: 1, ...extra,
});
/** A one-volume building; `extra` may override volume fields (length_m, roof …) and building fields. */
const garage = (extra: Partial<Volume> & { openings?: Opening[]; exterior?: Exterior | null; terrain_slope_pct?: number | null } = {}): Building => {
  const { openings = [], exterior = null, terrain_slope_pct = 0, ...v } = extra;
  return { volumes: [vol('garasje', { ...v, exterior: null })], exterior, terrain_slope_pct, openings };
};
/** A two-storey house with a lower attached garage on its right (shared wall at x = 10). */
const house = (gar: Partial<Volume> = {}, openings: Opening[] = []): Building => ({
  volumes: [
    vol('hus', { name: 'Hovedhus', length_m: 10, width_m: 8, floors: 2, floor_height_m: 2.6, basement_floors: 1 }),
    vol('garasje', { name: 'Garasje', x_m: 10, y_m: 0, length_m: 6, width_m: 6, roof: roof('flatt'), ...gar }),
  ],
  exterior: { cladding: 'liggende', wall_color: '#ffffff', roof_color: '#222222', trim_color: '#eeeeee' },
  terrain_slope_pct: 0,
  openings,
});

const pitchedRoof = (v: Volume) => v.roof?.kind === 'saltak' || v.roof?.kind === 'pulttak' || v.roof?.kind === 'valm';
/** Lenient drawability (placed, sized, on a floor the volume has above ground); covered walls are tested separately. */
const drawable = (o: Opening, b: Building) => {
  const v = b.volumes.find((q) => q.id === o.volume_id);
  if (!v || !isSized(v)) return false;
  return o.offset_m != null && o.sill_m != null && (o.width_m ?? 0) > 0 && (o.height_m ?? 0) > 0 && o.floor >= 1 &&
    (o.floor <= v.floors || (o.floor === v.floors + 1 && pitchedRoof(v)));
};

/** Overlap volume of two boxes (0 when they only touch). */
function overlap(a: NonNullable<Part['box']>, b: NonNullable<Part['box']>) {
  const ax = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const ay = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  const az = Math.min(a.z + a.d, b.z + b.d) - Math.max(a.z, b.z);
  return ax > 1e-6 && ay > 1e-6 && az > 1e-6 ? ax * ay * az : 0;
}

function checkModel(b: Building) {
  const m = buildModel(b);
  const openingIds = new Set(b.openings.map((o) => o.id));
  const volumeIds = new Set(b.volumes.map((v) => v.id));
  for (const p of m.parts) {
    if (p.kind === 'opening') expect(openingIds.has(p.refId!), p.id).toBe(true);
    else if (p.refId !== null) expect(volumeIds.has(p.refId), p.id).toBe(true);
  }
  if (!m.empty) {
    for (const o of b.openings) {
      const n = m.parts.filter((p) => p.refId === o.id).length;
      expect(n, o.id).toBeLessThanOrEqual(1);
      if (n === 0) expect(drawable(o, b) ? m.warnings.length : 1, o.id).toBeGreaterThan(0);
      else expect(drawable(o, b), o.id).toBe(true);
    }
    const panels = m.parts.filter((p) => p.kind === 'wall' && p.box);
    for (const p of m.parts.filter((q) => q.kind === 'opening' && q.box)) {
      for (const w of panels) expect(overlap(p.box!, w.box!), `${p.id} vs ${w.id}`).toBe(0);
    }
    for (const p of m.parts) {
      if (p.box) expect([p.box.x, p.box.y, p.box.z, p.box.w, p.box.h, p.box.d].every(Number.isFinite) && p.box.w >= 0 && p.box.h >= 0 && p.box.d >= 0).toBe(true);
      if (p.poly) expect(p.poly.points.flat().every(Number.isFinite)).toBe(true);
    }
    expect(new Set(m.parts.map((p) => p.id)).size).toBe(m.parts.length);
    expect([m.bounds.w, m.bounds.h, m.bounds.d].every(Number.isFinite)).toBe(true);
  }
  return m;
}

/** Wall panels of different volumes that overlap (a doubled shared wall). */
function doubledWalls(m: ReturnType<typeof buildModel>) {
  const walls = m.parts.filter((p) => p.kind === 'wall' && p.box);
  const bad: string[] = [];
  for (let i = 0; i < walls.length; i++) {
    for (let j = i + 1; j < walls.length; j++) {
      if (walls[i].refId !== walls[j].refId && overlap(walls[i].box!, walls[j].box!) > 0) bad.push(`${walls[i].id} vs ${walls[j].id}`);
    }
  }
  return bad;
}

describe('buildModel over every fixture step', () => {
  it('found fixture steps', () => expect(steps.length).toBeGreaterThan(0));
  for (const { name, building } of steps) {
    it(name, () => {
      const m = checkModel(building);
      const site = siteBounds(building);
      if (!site) {
        expect(m.empty).toBe(true);
        expect(m.parts).toEqual([]);
        return;
      }
      expect(m.bounds.w).toBeCloseTo(site.x1 - site.x0, 3);
      expect(m.bounds.d).toBeCloseTo(site.y1 - site.y0, 3);
      const sized = building.volumes.filter(isSized);
      // Height: above every volume's walls, and for gabled/hipped roofs at least the ridge (plus roof thickness at most).
      for (const v of sized) {
        const wallH = Math.max(1, Math.round(v.floors)) * (v.floor_height_m ?? 2.5);
        expect(m.bounds.h).toBeGreaterThan(wallH);
        const r = v.roof;
        if (r && (r.kind === 'saltak' || r.kind === 'valm')) {
          const span = r.ridge_along === 'lengde' ? v.width_m : v.length_m;
          const pitch = Math.min(70, Math.max(3, r.pitch_deg ?? 30));
          expect(m.bounds.h).toBeGreaterThanOrEqual(wallH + (span / 2) * Math.tan((pitch * Math.PI) / 180));
        }
      }
      // Every part lies on the site (plus overhangs and the 6 m drive).
      for (const p of m.parts.filter((q) => q.box)) {
        expect(p.box!.x).toBeGreaterThan(-7);
        expect(p.box!.x + p.box!.w).toBeLessThan(m.bounds.w + 7);
      }
      for (const v of building.volumes) if (!isSized(v)) expect(m.warnings.some((w) => w.includes('ikke avklart'))).toBe(true);
      for (const o of building.openings) {
        if (o.offset_m == null || o.sill_m == null) expect(m.warnings.some((w) => w.includes('ikke avklart') && w.includes(o.label))).toBe(true);
      }
      expect(doubledWalls(m)).toEqual([]);
      expect(buildModel(structuredClone(building))).toEqual(m);
    });
  }
});

describe('buildModel rules', () => {
  it('draws nothing for null dimensions and warns about the unsized volume', () => {
    for (const k of ['length_m', 'width_m', 'floors'] as const) {
      const m = buildModel(garage({ [k]: null, openings: [op('a')] }));
      expect(m).toMatchObject({ empty: true, parts: [], bounds: { w: 0, h: 0, d: 0 } });
      expect(m.warnings).toContain('Størrelsen på Garasje er ikke avklart');
    }
  });

  it('draws the sized volumes and skips an unsized one with a warning', () => {
    const b: Building = { ...garage(), volumes: [vol('garasje'), vol('bod', { name: 'Bod', x_m: 8, length_m: null })] };
    b.openings = [op('a'), op('b', { volume_id: 'bod' })];
    const m = checkModel(b);
    expect(m.warnings).toContain('Størrelsen på Bod er ikke avklart');
    expect(m.parts.some((p) => p.refId === 'bod' || p.refId === 'b')).toBe(false);
    expect(m.parts.some((p) => p.refId === 'a')).toBe(true);
    expect(m.bounds.w).toBe(8);
  });

  it('places volumes at their site position, parts prefixed and ref’d by volume id', () => {
    const b: Building = { ...garage(), volumes: [vol('a', { x_m: 3, y_m: 2 }), vol('b', { x_m: 20, y_m: 2, length_m: 4, width_m: 4 })] };
    const m = checkModel(b);
    expect(m.bounds).toMatchObject({ w: 21, d: 7 });
    const slabA = m.parts.find((p) => p.id === 'a:slab')!;
    expect(slabA.refId).toBe('a');
    expect(slabA.box!.x).toBeCloseTo(-0.05);
    const slabB = m.parts.find((p) => p.id === 'b:slab')!;
    expect(slabB.box!.x).toBeCloseTo(17 - 0.05);
    for (const p of m.parts) expect(p.id.startsWith('a:') || p.id.startsWith('b:')).toBe(true);
  });

  it('never invents a position for an unplaced opening', () => {
    const m = checkModel(garage({ openings: [op('a', { offset_m: null }), op('b', { sill_m: null, label: 'Dør' })] }));
    expect(m.parts.some((p) => p.kind === 'opening')).toBe(false);
    expect(m.warnings).toContain('Plassering av Vindu a er ikke avklart');
    expect(m.warnings).toContain('Plassering av Dør er ikke avklart');
  });

  it('warns about an opening on a volume that does not exist', () => {
    const m = checkModel(garage({ openings: [op('a', { volume_id: 'nope' })] }));
    expect(m.warnings).toContain('Vindu a hører ikke til noen bygningskropp');
    expect(m.parts.some((p) => p.kind === 'opening')).toBe(false);
  });

  it('clips an opening that does not fit and warns, never moves it', () => {
    const m = checkModel(garage({ openings: [op('a', { offset_m: 7.5, width_m: 1 })] }));
    const p = m.parts.find((q) => q.refId === 'a')!;
    expect(p.box!.x).toBe(7.5);
    expect(p.box!.w).toBeCloseTo(0.35);
    expect(m.warnings.some((w) => w.includes('avkortet'))).toBe(true);
  });

  it('warns about openings on floors the volume lacks and about overlaps', () => {
    const m = checkModel(garage({ floors: 1, openings: [op('a', { floor: 3 }), op('b'), op('c', { offset_m: 2.5 })] }));
    expect(m.warnings.some((w) => w.includes('etasje 3'))).toBe(true);
    expect(m.parts.some((p) => p.refId === 'a')).toBe(false);
    const flat = checkModel(garage({ roof: roof('flatt'), openings: [op('l', { floor: 2 })] }));
    expect(flat.warnings.some((w) => w.includes('etasje 2'))).toBe(true);
    expect(flat.parts.some((p) => p.refId === 'l')).toBe(false);
    expect(m.warnings.some((w) => w.includes('overlapper'))).toBe(true);
  });

  it('does not draw basement openings and shows a dark plinth instead', () => {
    const m = checkModel(garage({ basement_floors: 1, openings: [op('k', { floor: 0, sill_m: 0.3 }), op('k2', { floor: -1 })] }));
    expect(m.warnings).toContain('Kjelleråpninger vises ikke i 3D');
    expect(m.parts.some((p) => p.refId === 'k')).toBe(false);
    expect(m.warnings.some((w) => w.includes('etasje -1'))).toBe(true); // only one basement level
    expect(m.parts.find((p) => p.kind === 'slab')!.color).not.toBe(buildModel(garage()).parts.find((p) => p.kind === 'slab')!.color);
    for (const p of m.parts) if (p.box && p.kind !== 'slab') expect(p.box.y).toBeGreaterThanOrEqual(0);
    // Without a basement, floor 0 is simply a floor the volume lacks.
    expect(buildModel(garage({ openings: [op('k', { floor: 0 })] })).warnings.some((w) => w.includes('etasje 0'))).toBe(true);
  });

  it('draws a shared wall between attached volumes only once', () => {
    for (const k of ['saltak', 'pulttak', 'valm', 'flatt', 'annet'] as const) {
      for (const ridge of ['lengde', 'bredde'] as const) {
        const m = checkModel(house({ roof: roof(k, { ridge_along: ridge }) }));
        expect(doubledWalls(m)).toEqual([]);
        // The garage's left wall (x = 10) is fully inside: no garage wall panel stands on that line below the house top.
        const onLine = m.parts.filter((p) => p.refId === 'garasje' && p.kind === 'wall' && p.box!.x < 10.2 && p.box!.x + p.box!.w <= 10.2);
        expect(onLine, `${k}/${ridge}`).toEqual([]);
        // The house wall above the garage is still drawn (house walls 5.2 m, garage 2.5 m).
        const above = m.parts.filter((p) => p.refId === 'hus' && p.kind === 'wall' && p.box!.x >= 9.8 && p.box!.z < 6);
        expect(above.length).toBeGreaterThan(0);
        expect(Math.min(...above.map((p) => p.box!.y))).toBeGreaterThanOrEqual(2.5 - 1e-6);
      }
    }
    // Same height on both sides: no wall at all on the shared stretch.
    const same = checkModel(house({ floors: 2, floor_height_m: 2.6 }));
    expect(doubledWalls(same)).toEqual([]);
    expect(same.bounds).toMatchObject({ w: 16, d: 8 });
  });

  it('handles L and T shapes attached at the back and the front without doubled walls', () => {
    for (const k of ['saltak', 'valm', 'pulttak', 'flatt'] as const) {
      const b: Building = {
        volumes: [
          vol('hus', { length_m: 12, width_m: 8, roof: roof(k) }),
          vol('floy', { name: 'Fløy', x_m: 0, y_m: 8, length_m: 6, width_m: 7, roof: roof(k, { ridge_along: 'bredde' }) }),
          vol('vindfang', { name: 'Vindfang', x_m: 5, y_m: -2, length_m: 2, width_m: 2, roof: roof(k) }),
        ],
        exterior: null, terrain_slope_pct: 0,
        openings: [op('d', { volume_id: 'vindfang', kind: 'dor', offset_m: 0.5, sill_m: 0, width_m: 1, height_m: 2.1 }),
          op('x', { volume_id: 'hus', offset_m: 5.5, label: 'Vindu bak vindfanget' })],
      };
      const m = checkModel(b);
      expect(m.bounds).toMatchObject({ w: 12, d: 17 });
      expect(doubledWalls(m)).toEqual([]);
      expect(m.warnings).toContain('Vindu bak vindfanget ligger i en vegg som står inntil Vindfang');
      expect(m.parts.filter((p) => p.refId === 'd')).toHaveLength(1);
      expect(m.parts.find((p) => p.id === 'hus:slab')!.box!.z).toBeCloseTo(2 - 0.05); // site origin is the porch front
    }
  });

  it('warns about an opening in a wall that stands against another volume and does not draw it', () => {
    const m = checkModel(house({}, [
      op('d', { volume_id: 'hus', kind: 'dor', label: 'Dør til garasje', wall: 'hoyre', offset_m: 1, sill_m: 0, width_m: 0.9, height_m: 2.1 }),
      op('w', { volume_id: 'hus', label: 'Vindu over garasjen', wall: 'hoyre', floor: 2, offset_m: 1, sill_m: 0.9 }),
      op('g', { volume_id: 'garasje', label: 'Garasjevindu', wall: 'venstre', offset_m: 2, sill_m: 1 }),
    ]));
    expect(m.warnings).toContain('Dør til garasje ligger i en vegg som står inntil Garasje');
    expect(m.warnings).toContain('Garasjevindu ligger i en vegg som står inntil Hovedhus');
    expect(m.parts.some((p) => p.refId === 'd' || p.refId === 'g')).toBe(false);
    expect(m.parts.filter((p) => p.refId === 'w')).toHaveLength(1); // above the garage: exposed, drawn
  });

  it('lets a volume exterior override the building exterior', () => {
    const b = house({ exterior: { cladding: null, wall_color: '#aa0000', roof_color: null, trim_color: null } });
    const m = buildModel(b);
    expect(m.parts.find((p) => p.refId === 'garasje' && p.kind === 'wall')!.color).toBe('#aa0000');
    expect(m.parts.find((p) => p.refId === 'hus' && p.kind === 'wall')!.color).toBe('#ffffff');
    expect(m.parts.find((p) => p.refId === 'garasje' && p.kind === 'roof')!.color).toBe('#222222'); // null field → building
  });

  it('puts a gravel drive in front of a ground-floor port on any volume', () => {
    const m = checkModel(house({}, [op('p', { volume_id: 'garasje', kind: 'port', wall: 'front', offset_m: 1, sill_m: 0, width_m: 3, height_m: 2.2 })]));
    const drive = m.parts.find((p) => p.kind === 'ground')!;
    expect(drive.refId).toBeNull();
    expect(drive.box!.x).toBeCloseTo(10.6);
    expect(drive.box!.z).toBeLessThan(0);
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
    expect(m.parts.some((p) => /:wall-(front|bak)/.test(p.id) && p.box!.y + p.box!.h > 2.5 + 1e-6)).toBe(false); // eave walls stop at floors × height
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
    expect(count(house())).toBe(3); // saltak house + flat garage
  });

  it('warns for display fallbacks, naming the volume when there are several', () => {
    const m = buildModel(garage({ floor_height_m: null, roof: roof('saltak', { pitch_deg: null, overhang_m: null }), terrain_slope_pct: 8 }));
    expect(m.warnings).toEqual(expect.arrayContaining([
      'Etasjehøyde ikke avklart – vist med 2,5 m', 'Takvinkel ikke avklart – vist med 30°', 'Terrenghelling vises ikke i 3D ennå',
    ]));
    expect(m.warnings.some((w) => w.includes('utstikk'))).toBe(false);
    expect(buildModel(house({ roof: null })).warnings).toContain('Garasje: Takform ikke avklart');
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

  it('handles a 6-storey block with a stair tower and 100+ windows', () => {
    const openings: Opening[] = [];
    for (let f = 1; f <= 6; f++) {
      for (let i = 0; i < 10; i++) openings.push(op(`f${f}-${i}`, { volume_id: 'blokk', floor: f, offset_m: 1 + i * 2.8, sill_m: 0.9, width_m: 1.2, height_m: 1.4 }));
      for (let i = 0; i < 10; i++) openings.push(op(`b${f}-${i}`, { volume_id: 'blokk', wall: 'bak', floor: f, offset_m: 1 + i * 2.8, sill_m: 0.9, width_m: 1.2, height_m: 1.4 }));
    }
    const b: Building = {
      volumes: [
        vol('blokk', { name: 'Blokk', length_m: 30, width_m: 14, floors: 6, floor_height_m: 3, basement_floors: 1, roof: roof('flatt') }),
        vol('trapp', { name: 'Trappetårn', x_m: 30, y_m: 4, length_m: 4, width_m: 6, floors: 7, floor_height_m: 3, roof: roof('flatt') }),
      ],
      exterior: null, terrain_slope_pct: 0, openings,
    };
    const m = checkModel(b);
    expect(m.parts.filter((p) => p.kind === 'opening')).toHaveLength(120);
    expect(m.bounds).toMatchObject({ w: 34, d: 14 });
    expect(m.bounds.h).toBeGreaterThan(21);
    expect(doubledWalls(m)).toEqual([]);
  });

  it('is deterministic', () => {
    for (const { building } of steps) expect(buildModel(building)).toEqual(buildModel(structuredClone(building)));
    const b = garage({ openings: [op('a'), op('b', { wall: 'venstre', floor: 2, sill_m: 0.2 })] });
    expect(JSON.stringify(buildModel(b))).toBe(JSON.stringify(buildModel(b)));
    expect(JSON.stringify(buildModel(house()))).toBe(JSON.stringify(buildModel(house())));
  });
});
