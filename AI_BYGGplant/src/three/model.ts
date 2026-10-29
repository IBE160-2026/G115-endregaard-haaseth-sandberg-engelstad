// The parametric 3D model: turns the AI's Building JSON into plain parts (boxes and flat polygons).
// PURE: no three.js, no DOM. The app has no building rules; this draws exactly what the JSON says and
// lists a warning for everything it cannot place (never invents a position).
//
// Frame: metres, Y up, origin at the building's front-left ground corner (seen from the front),
// X along the length (front wall), Z into the depth. Boxes are axis-aligned: (x, y, z) is the MIN corner.
// Polygons are planar and convex, wound counter-clockwise seen from outside (normal = outward/up); the
// renderer gives each poly a thickness behind it (see POLY_DEPTH).
//
// Display-only assumptions (each one comments itself below): wall thickness, trims, a plinth, and
// fallbacks that warn. A loft (opening floor = floors + 1) sits in the gable or lies in the roof plane.
import { hexColor, type Building, type Opening, type Wall } from '../contract/types';

export interface Part {
  id: string;
  refId: string | null;
  kind: 'slab' | 'wall' | 'trim' | 'roof' | 'gable' | 'opening' | 'frame' | 'ground';
  box?: { x: number; y: number; z: number; w: number; h: number; d: number };
  poly?: { points: [number, number, number][] };
  color: string;
}

export interface BuildingModel {
  parts: Part[];
  bounds: { w: number; h: number; d: number };
  warnings: string[];
  empty: boolean;
}

type V3 = [number, number, number];

export const WALL_T = 0.15;
export const ROOF_T = 0.15;
/** How deep the renderer makes each poly (behind its outward face). */
export const POLY_DEPTH: Record<Part['kind'], number> = {
  slab: 0.1, wall: WALL_T, gable: WALL_T, roof: ROOF_T, trim: 0.04, frame: 0.03, opening: 0.03, ground: 0.02,
};
export const GREY = { wall: '#d9d6d0', roof: '#4a4d52', trim: '#f2f2f2' } as const;
export const GLASS = '#25313b';
export const GRAVEL = '#9a958c';
export const SLAB = '#b4b0a8';
const DEFAULT_FH = 2.5;
const DEFAULT_PITCH = 30;
const DEFAULT_OVERHANG = 0.3;
const FRAME = 0.07;
const EPS = 1e-6;

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const nb = (n: string) => n.replace('.', ',');
const fmt = (n: number) => nb(String(Math.round(n * 10) / 10));
const valid = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: number | null | undefined): n is number => valid(n) && n > 0;

/** #rrggbb scaled towards black (k < 1). */
export function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k))).toString(16).padStart(2, '0');
  return `#${c(16)}${c(8)}${c(0)}`;
}

/** Newell normal of a polygon (not normalised). */
export function polyNormal(p: V3[]): V3 {
  const n: V3 = [0, 0, 0];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    n[0] += (a[1] - b[1]) * (a[2] + b[2]);
    n[1] += (a[2] - b[2]) * (a[0] + b[0]);
    n[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return n;
}

/** Drops repeated points and winds the polygon so its normal points along `want`. */
function orient(points: V3[], want: V3): V3[] {
  const p = points.filter((q, i) => {
    const o = points[(i + points.length - 1) % points.length];
    return Math.abs(q[0] - o[0]) + Math.abs(q[1] - o[1]) + Math.abs(q[2] - o[2]) > EPS;
  });
  const n = polyNormal(p);
  return n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0 ? p.reverse() : p;
}

const OUT: Record<Wall, V3> = { front: [0, 0, -1], bak: [0, 0, 1], hoyre: [1, 0, 0], venstre: [-1, 0, 0] };
const WALLS: Wall[] = ['front', 'hoyre', 'bak', 'venstre'];

interface Rect { u0: number; u1: number; y0: number; y1: number }

export function buildModel(b: Building): BuildingModel {
  const warnings: string[] = [];
  const warn = (w: string) => { if (!warnings.includes(w)) warnings.push(w); };
  if (valid(b.terrain_slope_pct) && b.terrain_slope_pct > 0) warn('Terrenghelling vises ikke i 3D ennå');

  const L = b.length_m, W = b.width_m, F = b.floors;
  if (!positive(L) || !positive(W) || !positive(F)) {
    return { parts: [], bounds: { w: 0, h: 0, d: 0 }, warnings, empty: true };
  }
  const floors = Math.max(1, Math.round(F));
  let fh = DEFAULT_FH;
  if (positive(b.floor_height_m)) fh = b.floor_height_m;
  else warn(`Etasjehøyde ikke avklart – vist med ${fmt(DEFAULT_FH)} m`);

  // ---------- Roof parameters (display fallbacks warn, except the cosmetic overhang) ----------
  const roof = b.roof;
  let kind: 'saltak' | 'pulttak' | 'valm' | 'flatt' | 'slab' = 'slab';
  if (!roof || roof.kind === 'annet') warn('Takform ikke avklart');
  else kind = roof.kind;
  const pitched = kind === 'saltak' || kind === 'pulttak' || kind === 'valm';
  let pitch = DEFAULT_PITCH;
  if (pitched) {
    if (!valid(roof!.pitch_deg)) warn(`Takvinkel ikke avklart – vist med ${DEFAULT_PITCH}°`);
    else if (roof!.pitch_deg < 3 || roof!.pitch_deg > 70) {
      pitch = Math.min(70, Math.max(3, roof!.pitch_deg));
      warn(`Takvinkel ${fmt(roof!.pitch_deg)}° vises som ${fmt(pitch)}°`);
    } else pitch = roof!.pitch_deg;
  }
  const o = roof && valid(roof.overhang_m) ? Math.min(2, Math.max(0, roof.overhang_m)) : DEFAULT_OVERHANG;
  const t = Math.tan((pitch * Math.PI) / 180);
  const lift = ROOF_T / Math.cos((pitch * Math.PI) / 180);
  const lengde = !roof || roof.ridge_along !== 'bredde';
  /** Along the ridge (a) and across it (c). */
  const A = lengde ? L : W, S = lengde ? W : L;
  const P = (a: number, c: number, y: number): V3 => (lengde ? [a, y, c] : [c, y, a]);

  // Walls are floors × floor height; a loft (floor = floors + 1) lives inside a pitched roof.
  const wallH = floors * fh;
  const eave = wallH - o * t;
  const ridgeTop = kind === 'pulttak' ? wallH + A * t : wallH + (S / 2) * t;

  const ext = b.exterior;
  const wallC = hexColor(ext?.wall_color) ?? GREY.wall;
  const roofC = hexColor(ext?.roof_color) ?? GREY.roof;
  const trimC = hexColor(ext?.trim_color) ?? GREY.trim;
  const doorC = shade(wallC, 0.78);

  const parts: Part[] = [];
  const box = (id: string, kind: Part['kind'], color: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, refId: string | null = null) => {
    parts.push({
      id, refId, kind, color,
      box: { x: r3(Math.min(x0, x1)), y: r3(Math.min(y0, y1)), z: r3(Math.min(z0, z1)), w: r3(Math.abs(x1 - x0)), h: r3(Math.abs(y1 - y0)), d: r3(Math.abs(z1 - z0)) },
    });
  };
  const poly = (id: string, kind: Part['kind'], color: string, pts: V3[], want: V3, refId: string | null = null) => {
    const p = orient(pts, want);
    if (p.length >= 3) parts.push({ id, refId, kind, color, poly: { points: p.map((q) => [r3(q[0]), r3(q[1]), r3(q[2])] as V3) } });
  };

  // ---------- Wall frames: u from the wall's left corner seen from outside, d inwards from the outer face ----------
  const wallLen = (w: Wall) => (w === 'front' || w === 'bak' ? L : W);
  const toXZ = (w: Wall, u: number, d: number): [number, number] => {
    switch (w) {
      case 'front': return [u, d];
      case 'bak': return [L - u, W - d];
      case 'hoyre': return [L - d, u];
      case 'venstre': return [d, W - u];
    }
  };
  const wallBox = (id: string, kind: Part['kind'], color: string, w: Wall, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, refId: string | null = null) => {
    const [x0, z0] = toXZ(w, u0, d0), [x1, z1] = toXZ(w, u1, d1);
    box(id, kind, color, x0, x1, y0, y1, z0, z1, refId);
  };
  const wallPt = (w: Wall, u: number, y: number, d = 0): V3 => { const [x, z] = toXZ(w, u, d); return [x, y, z]; };

  /** How far the wall profile rises above wallH at a point on the outer wall line (gables, shed walls). */
  const riseAt = (x: number, z: number) => {
    const a = lengde ? x : z, c = lengde ? z : x;
    if (kind === 'saltak') return t * Math.max(0, Math.min(c, S - c));
    if (kind === 'pulttak') return t * Math.max(0, A - a);
    return 0;
  };
  const topAt = (w: Wall, u: number) => { const [x, z] = toXZ(w, u, 0); return wallH + riseAt(x, z); };
  const hasGable = (w: Wall) => {
    const n = 9;
    for (let i = 0; i <= n; i++) if (topAt(w, (wallLen(w) * i) / n) > wallH + EPS) return true;
    return false;
  };
  // The walls that carry a gable (or a shed wall) run the full length; the other pair fits between them.
  // (saltak: the gable walls; pulttak: the two walls under the sloping edges; otherwise front and back.)
  const ends: Wall[] = lengde ? ['venstre', 'hoyre'] : ['front', 'bak'];
  const sides: Wall[] = lengde ? ['front', 'bak'] : ['venstre', 'hoyre'];
  const fullWalls: Wall[] = kind === 'saltak' ? ends : kind === 'pulttak' ? sides : ['front', 'bak'];
  const range = (w: Wall): [number, number] => (fullWalls.includes(w) ? [0, wallLen(w)] : [WALL_T, wallLen(w) - WALL_T]);

  // ---------- Openings ----------
  const holes: Record<Wall, (Rect & { op: Opening })[]> = { front: [], bak: [], hoyre: [], venstre: [] };
  const roofWins: (Rect & { op: Opening; wall: Wall })[] = [];
  /** The pitched plane above a wall: eave height and slope towards its top, for roof windows. */
  const planeAbove = (w: Wall): { s: number; top: number } => {
    const along = lengde ? w === 'venstre' || w === 'hoyre' : w === 'front' || w === 'bak';
    if (kind === 'valm' && along) { const ah = Math.min(S / 2, A / 2); return { s: (ridgeTop - eave) / (ah + o), top: ridgeTop }; }
    return { s: t, top: ridgeTop };
  };

  for (const op of b.openings ?? []) {
    const label = op.label?.trim() || op.id;
    if (!valid(op.offset_m) || !valid(op.sill_m)) { warn(`Plassering av ${label} er ikke avklart`); continue; }
    if (!positive(op.width_m) || !positive(op.height_m)) { warn(`Størrelse på ${label} er ikke avklart`); continue; }
    const f = Math.round(op.floor);
    // Contract: the loft is not counted in `floors`; floor = floors + 1 is the loft/roof level, and only a
    // pitched roof has one. Anything higher (or a loft under a flat roof) is not drawn.
    const loft = f === floors + 1;
    if (!(f >= 1 && (f <= floors || (loft && pitched))) || !WALLS.includes(op.wall)) {
      warn(`${label} ligger i etasje ${op.floor}, som bygget ikke har`);
      continue;
    }
    // Openings stay inside the wall's own extent (an inset wall stops at the corner walls' thickness).
    const [us, ue] = range(op.wall);
    const inRoof = loft && !hasGable(op.wall);
    let want: Rect;
    if (inRoof) {
      // A roof window: sill_m and height_m run along the roof surface from the eave (top of the wall).
      const s = planeAbove(op.wall).s, sin = s / Math.hypot(1, s);
      want = { u0: op.offset_m, u1: op.offset_m + op.width_m, y0: wallH + op.sill_m * sin, y1: wallH + (op.sill_m + op.height_m) * sin };
    } else {
      // Loft openings in a gable are measured vertically from the top of the wall.
      const base = loft ? wallH : (f - 1) * fh;
      want = { u0: op.offset_m, u1: op.offset_m + op.width_m, y0: base + op.sill_m, y1: base + op.sill_m + op.height_m };
    }
    const r: Rect = { u0: Math.max(us, want.u0), u1: Math.min(ue, want.u1), y0: Math.max(loft ? wallH : (f - 1) * fh, want.y0), y1: want.y1 };
    if (inRoof) {
      r.y1 = Math.min(r.y1, planeAbove(op.wall).top - 0.1);
    } else if (!loft) {
      r.y1 = Math.min(r.y1, f * fh);
    } else {
      // The gable triangle (or a shed roof's high wall): keep the clip rectangular under the roof line.
      r.y1 = Math.min(r.y1, topAt(op.wall, r.u0) - 0.05, topAt(op.wall, r.u1) - 0.05);
    }
    if (r.u1 - r.u0 < 0.05 || r.y1 - r.y0 < 0.05) { warn(`${label} får ikke plass på veggen og er ikke tegnet`); continue; }
    if (r.u0 > want.u0 + EPS || r.u1 < want.u1 - EPS || r.y0 > want.y0 + EPS || r.y1 < want.y1 - EPS) {
      warn(`${label} går utenfor veggen og er tegnet avkortet`);
    }
    const list = inRoof ? roofWins.filter((q) => q.wall === op.wall) : holes[op.wall];
    for (const q of list) {
      if (q.u0 < r.u1 - EPS && r.u0 < q.u1 - EPS && q.y0 < r.y1 - EPS && r.y0 < q.y1 - EPS) warn(`${label} overlapper ${q.op.label?.trim() || q.op.id}`);
    }
    if (inRoof) roofWins.push({ ...r, op, wall: op.wall });
    else holes[op.wall].push({ ...r, op });
  }

  // ---------- Slab (a low plinth, display only) ----------
  box('slab', 'slab', SLAB, -0.05, L + 0.05, -0.1, 0.05, -0.05, W + 0.05);

  // ---------- Walls: panels around the holes, no CSG ----------
  for (const w of WALLS) {
    const [us, ue] = range(w);
    const hs = holes[w];
    const bps = [us, ue, ...hs.flatMap((h) => [h.u0, h.u1])].map((u) => Math.min(ue, Math.max(us, u)));
    if (kind === 'saltak' && hasGable(w)) bps.push(wallLen(w) / 2);
    const cuts = [...new Set(bps.map(r3))].sort((p, q) => p - q);
    let n = 0;
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], c = cuts[i + 1];
      if (c - a < 1e-3) continue;
      const mid = (a + c) / 2;
      const ys = hs.filter((h) => h.u0 <= mid && h.u1 >= mid).map((h) => [h.y0, h.y1]).sort((p, q) => p[0] - q[0]);
      let y = 0;
      for (const [h0, h1] of ys) {
        if (h0 > y + 1e-3) wallBox(`wall-${w}-${n++}`, 'wall', wallC, w, a, c, y, h0, 0, WALL_T);
        y = Math.max(y, h1);
      }
      if (y < wallH - 1e-3) wallBox(`wall-${w}-${n++}`, 'wall', wallC, w, a, c, y, wallH, 0, WALL_T);
      const yy = Math.max(y, wallH), ta = topAt(w, a), tc = topAt(w, c);
      if (ta > yy + 1e-3 || tc > yy + 1e-3) {
        poly(`gable-${w}-${n++}`, 'gable', wallC, [wallPt(w, a, yy), wallPt(w, c, yy), wallPt(w, c, Math.max(yy, tc)), wallPt(w, a, Math.max(yy, ta))], OUT[w]);
      }
    }
  }

  // ---------- Corner trims ----------
  const k = 0.1, out = 0.02;
  ([[0, 0], [L, 0], [L, W], [0, W]] as const).forEach(([cx, cz], i) => {
    const x0 = cx === 0 ? -out : L - k, z0 = cz === 0 ? -out : W - k;
    box(`trim-corner-${i}`, 'trim', trimC, x0, x0 + k + out, 0.05, wallH, z0, z0 + k + out);
  });

  // ---------- Wall openings: one part per opening (refId), frames around it ----------
  for (const w of WALLS) {
    for (const h of holes[w]) {
      const { op } = h;
      const glazed = op.kind === 'vindu';
      const color = glazed ? GLASS : doorC;
      const [d0, d1] = glazed ? [WALL_T * 0.4, WALL_T * 0.4 + 0.04] : [0.04, 0.09];
      wallBox(`opening-${op.id}`, 'opening', color, w, h.u0, h.u1, h.y0, h.y1, d0, d1, op.id);
      const fid = `frame-${op.id}`;
      const bottom = glazed ? h.y0 - FRAME : h.y0;
      wallBox(`${fid}-l`, 'frame', trimC, w, h.u0 - FRAME, h.u0, bottom, h.y1 + FRAME, -0.03, 0.06);
      wallBox(`${fid}-r`, 'frame', trimC, w, h.u1, h.u1 + FRAME, bottom, h.y1 + FRAME, -0.03, 0.06);
      wallBox(`${fid}-t`, 'frame', trimC, w, h.u0, h.u1, h.y1, h.y1 + FRAME, -0.03, 0.06);
      if (glazed) wallBox(`${fid}-b`, 'frame', trimC, w, h.u0 - FRAME, h.u1 + FRAME, h.y0 - FRAME, h.y0, -0.07, 0.06);
      // Presentation tied to an opening the AI defined: a gravel drive in front of a ground-floor port.
      if (op.kind === 'port' && op.floor === 1) wallBox(`drive-${op.id}`, 'ground', GRAVEL, w, h.u0 - 0.4, h.u1 + 0.4, 0, 0.015, -6, -0.06);
    }
  }

  // ---------- Roof ----------
  const boxAC = (id: string, kind: Part['kind'], color: string, a0: number, a1: number, c0: number, c1: number, y0: number, y1: number) => {
    const p = P(a0, c0, y0), q = P(a1, c1, y1);
    box(id, kind, color, p[0], q[0], p[1], q[1], p[2], q[2]);
  };
  const up: V3 = [0, 1, 0];
  if (kind === 'saltak') {
    const e = eave + lift, top = ridgeTop + lift;
    poly('roof-0', 'roof', roofC, [P(-o, -o, e), P(A + o, -o, e), P(A + o, S / 2, top), P(-o, S / 2, top)], up);
    poly('roof-1', 'roof', roofC, [P(-o, S + o, e), P(A + o, S + o, e), P(A + o, S / 2, top), P(-o, S / 2, top)], up);
    boxAC('fascia-0', 'trim', trimC, -o, A + o, -o - 0.03, -o, eave - 0.05, e + 0.02);
    boxAC('fascia-1', 'trim', trimC, -o, A + o, S + o, S + o + 0.03, eave - 0.05, e + 0.02);
    [-o - 0.01, A + o + 0.01].forEach((a, i) => {
      const dir = (i === 0 ? P(-1, 0, 0) : P(1, 0, 0)) as V3;
      for (const [c0, c1] of [[-o, S / 2], [S + o, S / 2]]) {
        poly(`rake-${i}-${c0 < 0 ? 0 : 1}`, 'trim', trimC,
          [P(a, c0, eave - 0.05), P(a, c1, ridgeTop - 0.05), P(a, c1, top + 0.02), P(a, c0, e + 0.02)], dir);
      }
    });
  } else if (kind === 'pulttak') {
    const hA = (a: number) => wallH + (A - a) * t + lift;
    poly('roof-0', 'roof', roofC, [P(-o, -o, hA(-o)), P(A + o, -o, hA(A + o)), P(A + o, S + o, hA(A + o)), P(-o, S + o, hA(-o))], up);
    boxAC('fascia-0', 'trim', trimC, A + o, A + o + 0.03, -o, S + o, hA(A + o) - lift - 0.05, hA(A + o) + 0.02);
    boxAC('fascia-1', 'trim', trimC, -o - 0.03, -o, -o, S + o, hA(-o) - lift - 0.05, hA(-o) + 0.02);
    [-o - 0.01, S + o + 0.01].forEach((c, i) => {
      poly(`rake-${i}`, 'trim', trimC, [P(-o, c, hA(-o) - lift - 0.05), P(A + o, c, hA(A + o) - lift - 0.05), P(A + o, c, hA(A + o) + 0.02), P(-o, c, hA(-o) + 0.02)],
        (i === 0 ? P(0, -1, 0) : P(0, 1, 0)) as V3);
    });
  } else if (kind === 'valm') {
    const e = eave + lift, top = ridgeTop + lift, ah = Math.min(S / 2, A / 2);
    poly('roof-0', 'roof', roofC, [P(-o, -o, e), P(A + o, -o, e), P(A - ah, S / 2, top), P(ah, S / 2, top)], up);
    poly('roof-1', 'roof', roofC, [P(-o, S + o, e), P(A + o, S + o, e), P(A - ah, S / 2, top), P(ah, S / 2, top)], up);
    poly('roof-2', 'roof', roofC, [P(-o, -o, e), P(-o, S + o, e), P(ah, S / 2, top)], up);
    poly('roof-3', 'roof', roofC, [P(A + o, -o, e), P(A + o, S + o, e), P(A - ah, S / 2, top)], up);
    const y0 = eave - 0.05, y1 = e + 0.02;
    boxAC('fascia-0', 'trim', trimC, -o, A + o, -o - 0.03, -o, y0, y1);
    boxAC('fascia-1', 'trim', trimC, -o, A + o, S + o, S + o + 0.03, y0, y1);
    boxAC('fascia-2', 'trim', trimC, -o - 0.03, -o, -o, S + o, y0, y1);
    boxAC('fascia-3', 'trim', trimC, A + o, A + o + 0.03, -o, S + o, y0, y1);
  } else if (kind === 'flatt') {
    box('roof-0', 'roof', roofC, -0.05, L + 0.05, wallH, wallH + 0.25, -0.05, W + 0.05);
    const p0 = wallH + 0.25, p1 = p0 + 0.3, pt = 0.12;
    box('parapet-0', 'trim', trimC, -0.05, L + 0.05, p0, p1, -0.05, -0.05 + pt);
    box('parapet-1', 'trim', trimC, -0.05, L + 0.05, p0, p1, W + 0.05 - pt, W + 0.05);
    box('parapet-2', 'trim', trimC, -0.05, -0.05 + pt, p0, p1, -0.05 + pt, W + 0.05 - pt);
    box('parapet-3', 'trim', trimC, L + 0.05 - pt, L + 0.05, p0, p1, -0.05 + pt, W + 0.05 - pt);
  } else {
    box('roof-0', 'roof', roofC, -o, L + o, wallH, wallH + 0.25, -o, W + o);
  }

  // ---------- Roof windows: glazed panels lying in the roof plane above an eave wall ----------
  for (const r of roofWins) {
    const { s } = planeAbove(r.wall);
    const d = (y: number) => (y - eave) / s - o;
    const pt = (u: number, y: number, extra: number): V3 => wallPt(r.wall, u, y + lift + extra, d(y));
    const glazed = r.op.kind === 'vindu';
    const want: V3 = [OUT[r.wall][0], 1, OUT[r.wall][2]];
    poly(`frame-${r.op.id}`, 'frame', trimC,
      [pt(r.u0 - FRAME, r.y0 - FRAME * s, 0.01), pt(r.u1 + FRAME, r.y0 - FRAME * s, 0.01), pt(r.u1 + FRAME, r.y1 + FRAME * s, 0.01), pt(r.u0 - FRAME, r.y1 + FRAME * s, 0.01)], want);
    poly(`opening-${r.op.id}`, 'opening', glazed ? GLASS : doorC,
      [pt(r.u0, r.y0, 0.04), pt(r.u1, r.y0, 0.04), pt(r.u1, r.y1, 0.04), pt(r.u0, r.y1, 0.04)], want, r.op.id);
  }

  let h = 0;
  for (const p of parts) {
    if (p.box) h = Math.max(h, p.box.y + p.box.h);
    if (p.poly) for (const q of p.poly.points) h = Math.max(h, q[1]);
  }
  return { parts, bounds: { w: L, h: r3(h), d: W }, warnings, empty: false };
}
