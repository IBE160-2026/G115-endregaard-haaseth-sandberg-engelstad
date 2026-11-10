// Walking on the site: where people can stand, how they get round the pit, and where the
// foremen wait. Pure and without three.js, so it can be tested; the scene moves the figures.
import { PIT, SPOTS, TOWER } from './visuals';

/** A point on the ground, metres (x east, z south). */
export interface P2 { x: number; z: number }

/** The fenced site, with the gate in the middle of the south fence. */
export const SITE = { minX: -50, maxX: 50, minZ: -40, maxZ: 40, fenceZ: 42, gateHalf: 7, outsideZ: 50 };

/** Where the player starts: outside the gate, looking in. */
export const GATE_OUT: P2 = { x: 0, z: 48 };
/** Just inside the gate, where Oskar checks the protective gear. */
export const GATE_IN: P2 = { x: 0, z: 37 };

interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }
const rect = (cx: number, cz: number, hw: number, hd: number): Rect => ({ minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd });

/** Where the machines and stores stand (props.ts builds them here). */
export const PLACES = {
  mobileCrane: { x: -PIT.w / 2 - 13, z: -4 },
  pump: { x: 17, z: -29 },
  yard: { x: -22.5, z: 34 },
  toilets: { x: 43.6, z: 31 },
  skips: [{ x: 38, z: -30 }, { x: 44, z: -24 }],
  masts: [{ x: -PIT.w / 2 - 6, z: -PIT.d / 2 - 6 }, { x: PIT.w / 2 + 6, z: -PIT.d / 2 - 6 }, { x: -PIT.w / 2 - 6, z: PIT.d / 2 + 8 }, { x: PIT.w / 2 + 6, z: PIT.d / 2 + 8 }],
} as const;

/**
 * Everything people cannot walk through: the pit (later the tower over it) with its railing, the
 * site offices, the site hut, the crane foot, the material yard, the toilets, the skips, the
 * floodlight masts and the two machines that stand on site.
 */
export const BLOCKS: Rect[] = [
  rect(0, 0, PIT.w / 2 + 1, PIT.d / 2 + 1),
  rect(SPOTS.office.x, SPOTS.office.z, 5, 3.6),
  rect(SPOTS.hut.x + 3.2, SPOTS.hut.z, 6.4, 1.8),
  rect(TOWER.w / 2 + 6, -TOWER.d / 2 - 2, 1.6, 1.6),
  rect(PLACES.yard.x, PLACES.yard.z, 9.5, 6.2),
  rect(PLACES.toilets.x, PLACES.toilets.z, 2.4, 0.9),
  ...PLACES.skips.map(s => rect(s.x, s.z, 3, 1.5)),
  ...PLACES.masts.map(m => rect(m.x, m.z, 0.5, 0.5)),
  rect(PLACES.mobileCrane.x, PLACES.mobileCrane.z, 3.5, 5),
  rect(PLACES.pump.x, PLACES.pump.z, 1.8, 5.4),
];
/** How far paths keep from the corners of what they go round. */
const MARGIN = 1.6;

const inside = (p: P2, r: Rect, pad = 0) => p.x > r.minX - pad && p.x < r.maxX + pad && p.z > r.minZ - pad && p.z < r.maxZ + pad;

/** Moves a point out of everything it cannot stand in (the nearest way out). */
export function resolve(p: P2, radius = 0.5): P2 {
  let { x, z } = p;
  for (const r of BLOCKS) {
    if (!inside({ x, z }, r, radius)) continue;
    const out = [
      { d: x - (r.minX - radius), x: r.minX - radius, z },
      { d: r.maxX + radius - x, x: r.maxX + radius, z },
      { d: z - (r.minZ - radius), x, z: r.minZ - radius },
      { d: r.maxZ + radius - z, x, z: r.maxZ + radius },
    ].sort((a, b) => a.d - b.d)[0];
    x = out.x;
    z = out.z;
  }
  // The fence: inside the site, or outside only in the lane in front of the gate.
  const lane = SITE.gateHalf - radius;
  x = Math.max(SITE.minX, Math.min(SITE.maxX, x));
  z = Math.max(SITE.minZ, Math.min(SITE.outsideZ, z));
  // Next to the lane, step into it; further along the fence, stay inside.
  if (z > SITE.maxZ && Math.abs(x) > lane) {
    if (z > SITE.fenceZ - 0.5 && Math.abs(x) < lane + 2) x = Math.sign(x) * lane;
    else z = SITE.maxZ;
  }
  return { x, z };
}

/** The first block the straight line a→b crosses (sampled every 0.4 m; the blocks are larger). */
function firstBlock(a: P2, b: P2): Rect | null {
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.4);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p = { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t };
    const r = BLOCKS.find(r => inside(p, r, 0.3));
    if (r) return r;
  }
  return null;
}

const length = (pts: P2[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.z - pts[i].z), 0);

/**
 * Waypoints from a to b round whatever is in the way, not including a. For the first block
 * on the line it tries one or two of its corners, finds the rest of the way from there the
 * same way (a few levels deep), and keeps the shortest.
 */
function detour(a: P2, b: P2, depth: number): P2[] {
  const r = firstBlock(a, b);
  if (!r || depth > 2) return [b];
  // The four corners in order round the block (a corner that is not free is left out).
  const corners = [
    { x: r.minX - MARGIN, z: r.minZ - MARGIN }, { x: r.maxX + MARGIN, z: r.minZ - MARGIN },
    { x: r.maxX + MARGIN, z: r.maxZ + MARGIN }, { x: r.minX - MARGIN, z: r.maxZ + MARGIN },
  ].map(c => (walkable(c) ? c : null));
  const vias: P2[][] = [];
  corners.forEach((c, i) => {
    const n = corners[(i + 1) % 4];
    if (c) vias.push([c]);
    // Two neighbouring corners: going round one side.
    if (c && n) vias.push([c, n], [n, c]);
  });
  let best: P2[] | null = null;
  for (const via of vias) {
    // The legs next to this block must not cross it; the rest is found recursively.
    const pts = [a, ...via, b];
    if (pts.slice(0, -1).some((p, i) => firstBlock(p, pts[i + 1]) === r)) continue;
    const path: P2[] = [];
    let from = a;
    for (const p of [...via, b]) { path.push(...detour(from, p, depth + 1)); from = p; }
    if (!best || length([a, ...path]) < length([a, ...best])) best = path;
  }
  return best ?? [b];
}

/** Waypoints from a to b round the pit, buildings and machines (and in through the gate), not including a. */
export function route(a: P2, b: P2): P2[] {
  const pre: P2[] = [];
  let from = a;
  // From outside the fence, in through the gate first.
  if (a.z > SITE.maxZ && b.z <= SITE.maxZ) {
    from = { x: 0, z: SITE.maxZ - 2 };
    pre.push(from);
  }
  return [...pre, ...detour(from, b, 0)];
}

/** Where each foreman waits on the ground, next to their work (always outside the pit). */
export function foremanSpot(taskId: string): P2 {
  const south = PIT.d / 2 + 4.5;
  const north = -PIT.d / 2 - 4.5;
  const east = PIT.w / 2 + 4.5;
  const west = -PIT.w / 2 - 4.5;
  switch (taskId) {
    case 'A': return { x: SPOTS.office.x + 16, z: SPOTS.office.z - 6 };
    case 'C': return { x: -9, z: south };
    case 'D': return { x: -3, z: south };
    case 'E': return { x: 4, z: south };
    case 'L': return { x: 10, z: south };
    case 'F': return { x: east, z: 5 };
    case 'O': return { x: east, z: -4 };
    case 'G': return { x: west, z: 5 };
    case 'H': return { x: west, z: -4 };
    case 'I': return { x: 8, z: north };
    case 'K': return { x: -8, z: north };
    case 'J': return { x: 0, z: north };
    case 'N': return { x: 0, z: south + 2 };
    default: return { x: 0, z: south };
  }
}

/** Where Elisabeth and Hedda wait for the start-up meeting: outside the site offices. */
export const OFFICE_MEET: P2 = { x: SPOTS.office.x + 7, z: SPOTS.office.z - 6 };

/**
 * A meeting circle round a centre: the host (whoever the player came to see) faces the player
 * across a table, the others stand at the sides. Returns positions and the direction the camera
 * looks from (away from the pit, so the shot is never blocked by the building).
 */
export function meetingLayout(host: P2, ids: string[]): { center: P2; spots: Record<string, P2>; view: P2 } {
  // The meeting is held a little away from the host's spot, on the side away from the pit.
  const away = norm({ x: host.x, z: host.z });
  const center = resolve({ x: host.x + away.x * 2.5, z: host.z + away.z * 2.5 }, 3);
  const r = 3.2;
  const spots: Record<string, P2> = {};
  // The first id is the host (towards the pit), the player stands opposite; the rest share the sides.
  const base = Math.atan2(-away.z, -away.x);
  const angles = [base, base + Math.PI, base + Math.PI * 0.5, base - Math.PI * 0.5, base + Math.PI * 0.75, base - Math.PI * 0.75];
  ids.forEach((id, i) => {
    const a = angles[i % angles.length];
    spots[id] = { x: center.x + Math.cos(a) * r, z: center.z + Math.sin(a) * r };
  });
  // The camera looks in between two people (over the player's shoulder), so no one blocks the table.
  const side = base + Math.PI * 0.75;
  return { center, spots, view: { x: Math.cos(side), z: Math.sin(side) } };
}

function norm(p: P2): P2 {
  const l = Math.hypot(p.x, p.z);
  return l < 1e-6 ? { x: 0, z: 1 } : { x: p.x / l, z: p.z / l };
}

/** Is the point free to stand on (not in the pit, a hut or outside the site)? */
export const walkable = (p: P2, radius = 0.5) => {
  const r = resolve(p, radius);
  return Math.abs(r.x - p.x) < 1e-9 && Math.abs(r.z - p.z) < 1e-9;
};
