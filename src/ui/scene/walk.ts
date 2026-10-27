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

/** The pit (later the tower over it) with a railing, the site offices, the site hut and the crane foot. */
export const BLOCKS: Rect[] = [
  rect(0, 0, PIT.w / 2 + 1, PIT.d / 2 + 1),
  rect(SPOTS.office.x, SPOTS.office.z, 5, 3.6),
  rect(SPOTS.hut.x + 3.2, SPOTS.hut.z, 6.4, 1.8),
  rect(TOWER.w / 2 + 6, -TOWER.d / 2 - 2, 1.6, 1.6),
];
const PIT_RECT = BLOCKS[0];
/** How far paths keep from the pit corners. */
const MARGIN = 2.2;

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

/** Does the straight line a→b cross the pit? */
function crossesPit(a: P2, b: P2): boolean {
  const r = PIT_RECT;
  // Sample the segment: the pit is large compared with the step, so this is exact enough.
  const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.5);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (inside({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, r)) return true;
  }
  return false;
}

const length = (pts: P2[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.z - pts[i].z), 0);

/**
 * Waypoints from a to b round the pit (and in through the gate), not including a.
 * Tries the direct line, then one or two of the pit's corners, and keeps the shortest.
 */
export function route(a: P2, b: P2): P2[] {
  const pre: P2[] = [];
  let from = a;
  // From outside the fence, in through the gate first.
  if (a.z > SITE.maxZ && b.z <= SITE.maxZ) {
    from = { x: 0, z: SITE.maxZ - 2 };
    pre.push(from);
  }
  if (!crossesPit(from, b)) return [...pre, b];
  const r = PIT_RECT;
  const corners: P2[] = [
    { x: r.minX - MARGIN, z: r.minZ - MARGIN }, { x: r.maxX + MARGIN, z: r.minZ - MARGIN },
    { x: r.maxX + MARGIN, z: r.maxZ + MARGIN }, { x: r.minX - MARGIN, z: r.maxZ + MARGIN },
  ];
  let best: P2[] | null = null;
  const consider = (via: P2[]) => {
    const pts = [from, ...via, b];
    for (let i = 0; i < pts.length - 1; i++) if (crossesPit(pts[i], pts[i + 1])) return;
    if (!best || length(pts) < length([from, ...best, b])) best = via;
  };
  for (const c of corners) consider([c]);
  // Two neighbouring corners (going round one side of the pit).
  for (let i = 0; i < 4; i++) {
    consider([corners[i], corners[(i + 1) % 4]]);
    consider([corners[(i + 1) % 4], corners[i]]);
  }
  return [...pre, ...(best ?? []), b];
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
