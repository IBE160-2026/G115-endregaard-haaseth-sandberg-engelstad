import { describe, expect, it } from 'vitest';
import { scenario } from '../../engine/scenario';
import { BLOCKS, GATE_IN, GATE_OUT, OFFICE_MEET, SITE, foremanSpot, meetingLayout, resolve, route, walkable, type P2 } from './walk';

const crossesPit = (a: P2, b: P2) => {
  const r = BLOCKS[0];
  for (let i = 1; i < 200; i++) {
    const x = a.x + ((b.x - a.x) * i) / 200, z = a.z + ((b.z - a.z) * i) / 200;
    if (x > r.minX && x < r.maxX && z > r.minZ && z < r.maxZ) return true;
  }
  return false;
};

describe('walking on site', () => {
  it('keeps people out of the pit, the huts and outside the fence (except in front of the gate)', () => {
    expect(walkable({ x: 0, z: 0 })).toBe(false);
    const out = resolve({ x: 0, z: 2 });
    expect(walkable(out)).toBe(true);
    expect(Math.abs(out.z)).toBeGreaterThan(BLOCKS[0].maxZ);
    expect(resolve({ x: 30, z: 46 }).z).toBeLessThanOrEqual(SITE.maxZ);
    expect(walkable(GATE_OUT)).toBe(true);
    expect(walkable(GATE_IN)).toBe(true);
  });

  it('routes round the pit and in through the gate, never across the pit', () => {
    const path = route(GATE_OUT, { x: 0, z: -18 });
    const pts = [GATE_OUT, ...path];
    for (let i = 0; i < pts.length - 1; i++) expect(crossesPit(pts[i], pts[i + 1])).toBe(false);
    expect(path[0].z).toBeLessThan(SITE.maxZ);
    expect(path[path.length - 1]).toEqual({ x: 0, z: -18 });
    // A free line is walked straight.
    expect(route({ x: -40, z: 30 }, { x: 40, z: 30 })).toEqual([{ x: 40, z: 30 }]);
  });

  it('every foreman waits on free ground next to the site', () => {
    for (const t of scenario.tasks) expect(walkable(foremanSpot(t.id))).toBe(true);
    expect(walkable(OFFICE_MEET)).toBe(true);
  });

  it('a meeting puts the host and the player across a table, on free ground', () => {
    const ids = ['foreman-I', 'owner', 'pm', 'site'];
    const m = meetingLayout(foremanSpot('I'), ids);
    expect(walkable(m.center, 1.5)).toBe(true);
    const d = (a: P2, b: P2) => Math.hypot(a.x - b.x, a.z - b.z);
    expect(d(m.spots['foreman-I'], m.spots.owner)).toBeCloseTo(6.4, 1);
    for (const id of ids) expect(d(m.spots[id], m.center)).toBeCloseTo(3.2, 5);
    expect(Math.hypot(m.view.x, m.view.z)).toBeCloseTo(1, 5);
  });
});
