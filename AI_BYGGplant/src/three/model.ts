// The parametric 3D model: turns the AI's Building JSON into plain parts (boxes and flat polygons).
// PURE: no three.js, no DOM. The app has no building rules; this draws exactly what the JSON says and
// lists a warning for everything it cannot place (never invents a position or a size).
//
// A building is a set of rectangular, axis-aligned volumes (bygningskropper) on the site. Each sized
// volume gets its own walls (panels around its openings), corner trims, slab and roof.
//
// Frame: metres, Y up, origin at the front-left ground corner of the SITE rectangle (siteBounds),
// X along the main front (site x), Z into the depth (site y). Boxes are axis-aligned: (x, y, z) is the
// MIN corner. Polygons are planar and convex, wound counter-clockwise seen from outside (normal =
// outward/up); the renderer gives each poly a thickness behind it (see POLY_DEPTH).
//
// Display-only assumptions (each one comments itself below): wall thickness, trims, a plinth, and
// fallbacks that warn. A loft (opening floor = floors + 1) sits in the gable or lies in the roof plane.
// Where two volumes stand wall to wall, the shared wall is drawn once: each volume leaves out the part
// of its wall that the neighbour's wall covers (up to the neighbour's wall height).
import { hexColor, isSized, siteBounds, type Building, type Opening, type SizedVolume, type Wall } from '../contract/types';

export interface Part {
  id: string;
  /** The opening id for an opening; the volume id for every other part of a volume; null for site parts. */
  refId: string | null;
  kind: 'slab' | 'wall' | 'trim' | 'roof' | 'gable' | 'opening' | 'frame' | 'ground';
  box?: { x: number; y: number; z: number; w: number; h: number; d: number };
  poly?: { points: [number, number, number][] };
  color: string;
}

export interface BuildingModel {
  parts: Part[];
  /** Site rectangle (w along x, d along z) and the highest point incl. roofs. */
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
/** The plinth of a volume with a basement: a dark band (basement walls and windows are not drawn). */
export const PLINTH = '#57544f';
export const DEFAULT_FH = 2.5;
const DEFAULT_PITCH = 30;
const DEFAULT_OVERHANG = 0.3;
const FRAME = 0.07;
const EPS = 1e-6;

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const nb = (n: string) => n.replace('.', ',');
const fmt = (n: number) => nb(String(Math.round(n * 10) / 10));
const valid = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: number | null | undefined): n is number => valid(n) && n > 0;
const nameOf = (v: { name?: string; id: string }) => v.name?.trim() || v.id;
const labelOf = (o: Opening) => o.label?.trim() || o.id;

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
/** Part of a volume's wall that a neighbour's wall stands against: u range on this wall, up to height h. */
export interface Cover { u0: number; u1: number; h: number; name: string; id: string }

/** Storeys drawn for a sized volume and its floor height (fallback 2.5 m, the caller warns). */
const storeys = (v: SizedVolume) => Math.max(1, Math.round(v.floors));
const floorH = (v: SizedVolume) => (positive(v.floor_height_m) ? v.floor_height_m : DEFAULT_FH);

/**
 * For each wall of `v`, the stretches where another sized volume's opposite wall lies on the same line
 * (in u: metres from the wall's left corner seen from outside), with that neighbour's wall height.
 */
export function wallCovers(v: SizedVolume, all: SizedVolume[]): Record<Wall, Cover[]> {
  const out: Record<Wall, Cover[]> = { front: [], bak: [], hoyre: [], venstre: [] };
  const same = (a: number, b: number) => Math.abs(a - b) < 1e-3;
  for (const n of all) {
    if (n === v) continue;
    const h = storeys(n) * floorH(n);
    const add = (w: Wall, a0: number, a1: number, map: (a: number) => number) => {
      const lo = Math.max(a0, w === 'front' || w === 'bak' ? v.x_m : v.y_m);
      const hi = Math.min(a1, w === 'front' || w === 'bak' ? v.x_m + v.length_m : v.y_m + v.width_m);
      if (hi - lo < 1e-3) return;
      const u0 = map(lo), u1 = map(hi);
      out[w].push({ u0: r3(Math.min(u0, u1)), u1: r3(Math.max(u0, u1)), h, name: nameOf(n), id: n.id });
    };
    if (same(n.y_m + n.width_m, v.y_m)) add('front', n.x_m, n.x_m + n.length_m, (x) => x - v.x_m);
    if (same(n.y_m, v.y_m + v.width_m)) add('bak', n.x_m, n.x_m + n.length_m, (x) => v.x_m + v.length_m - x);
    if (same(n.x_m, v.x_m + v.length_m)) add('hoyre', n.y_m, n.y_m + n.width_m, (y) => y - v.y_m);
    if (same(n.x_m + n.length_m, v.x_m)) add('venstre', n.y_m, n.y_m + n.width_m, (y) => v.y_m + v.width_m - y);
  }
  return out;
}

export function buildModel(b: Building): BuildingModel {
  const warnings: string[] = [];
  const warn = (w: string) => { if (!warnings.includes(w)) warnings.push(w); };
  if (valid(b.terrain_slope_pct) && b.terrain_slope_pct > 0) warn('Terrenghelling vises ikke i 3D ennå');

  const volumes = b.volumes ?? [];
  for (const v of volumes) if (!isSized(v)) warn(`Størrelsen på ${nameOf(v)} er ikke avklart`);
  const ids = new Set(volumes.map((v) => v.id));
  for (const o of b.openings ?? []) if (!ids.has(o.volume_id)) warn(`${labelOf(o)} hører ikke til noen bygningskropp`);

  const sized = volumes.filter(isSized).filter((v) => valid(v.x_m) && valid(v.y_m));
  const site = siteBounds({ ...b, volumes: sized });
  if (!site) return { parts: [], bounds: { w: 0, h: 0, d: 0 }, warnings, empty: true };

  for (let i = 0; i < sized.length; i++) {
    for (let j = i + 1; j < sized.length; j++) {
      const a = sized[i], c = sized[j];
      const ox = Math.min(a.x_m + a.length_m, c.x_m + c.length_m) - Math.max(a.x_m, c.x_m);
      const oy = Math.min(a.y_m + a.width_m, c.y_m + c.width_m) - Math.max(a.y_m, c.y_m);
      if (ox > 1e-3 && oy > 1e-3) warn(`${nameOf(a)} og ${nameOf(c)} overlapper hverandre`);
    }
  }

  const parts: Part[] = [];
  const used = new Set<string>();
  for (const v of sized) {
    // Volume ids should be unique; if not, keep part ids unique anyway (refId stays the volume id).
    let key = v.id, k = 2;
    while (used.has(key)) key = `${v.id}~${k++}`;
    used.add(key);
    buildVolume(b, v, key, sized, site.x0, site.y0, sized.length > 1, parts, warn);
  }

  let h = 0;
  for (const p of parts) {
    if (p.box) h = Math.max(h, p.box.y + p.box.h);
    if (p.poly) for (const q of p.poly.points) h = Math.max(h, q[1]);
  }
  return { parts, bounds: { w: r3(site.x1 - site.x0), h: r3(h), d: r3(site.y1 - site.y0) }, warnings, empty: false };
}

function buildVolume(
  b: Building, v: SizedVolume, key: string, all: SizedVolume[], sx: number, sy: number, multi: boolean,
  parts: Part[], warn: (w: string) => void,
) {
  const vName = nameOf(v);
  /** With several volumes, per-volume fallback warnings name the volume. */
  const tag = (s: string) => (multi ? `${vName}: ${s}` : s);
  const L = v.length_m, W = v.width_m;
  const floors = storeys(v);
  const fh = floorH(v);
  if (!positive(v.floor_height_m)) warn(tag(`Etasjehøyde ikke avklart – vist med ${fmt(DEFAULT_FH)} m`));
  const ox = v.x_m - sx, oz = v.y_m - sy;
  const basements = valid(v.basement_floors) ? Math.max(0, Math.round(v.basement_floors)) : 0;

  // ---------- Roof parameters (display fallbacks warn, except the cosmetic overhang) ----------
  const roof = v.roof;
  let kind: 'saltak' | 'pulttak' | 'valm' | 'flatt' | 'slab' = 'slab';
  if (!roof || roof.kind === 'annet') warn(tag('Takform ikke avklart'));
  else kind = roof.kind;
  const pitched = kind === 'saltak' || kind === 'pulttak' || kind === 'valm';
  let pitch = DEFAULT_PITCH;
  if (pitched) {
    if (!valid(roof!.pitch_deg)) warn(tag(`Takvinkel ikke avklart – vist med ${DEFAULT_PITCH}°`));
    else if (roof!.pitch_deg < 3 || roof!.pitch_deg > 70) {
      pitch = Math.min(70, Math.max(3, roof!.pitch_deg));
      warn(tag(`Takvinkel ${fmt(roof!.pitch_deg)}° vises som ${fmt(pitch)}°`));
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

  // Colours: the volume's own exterior wins field by field, then the building's, then neutral greys.
  const ve = v.exterior, be = b.exterior;
  const wallC = hexColor(ve?.wall_color) ?? hexColor(be?.wall_color) ?? GREY.wall;
  const roofC = hexColor(ve?.roof_color) ?? hexColor(be?.roof_color) ?? GREY.roof;
  const trimC = hexColor(ve?.trim_color) ?? hexColor(be?.trim_color) ?? GREY.trim;
  const doorC = shade(wallC, 0.78);

  const ref = v.id;
  const pid = (s: string) => `${key}:${s}`;
  const box = (id: string, kind: Part['kind'], color: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, refId: string | null = ref) => {
    parts.push({
      id: pid(id), refId, kind, color,
      box: { x: r3(Math.min(x0, x1) + ox), y: r3(Math.min(y0, y1)), z: r3(Math.min(z0, z1) + oz), w: r3(Math.abs(x1 - x0)), h: r3(Math.abs(y1 - y0)), d: r3(Math.abs(z1 - z0)) },
    });
  };
  const poly = (id: string, kind: Part['kind'], color: string, pts: V3[], want: V3, refId: string | null = ref) => {
    const p = orient(pts, want);
    if (p.length >= 3) parts.push({ id: pid(id), refId, kind, color, poly: { points: p.map((q) => [r3(q[0] + ox), r3(q[1]), r3(q[2] + oz)] as V3) } });
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
  const wallBox = (id: string, kind: Part['kind'], color: string, w: Wall, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, refId: string | null = ref) => {
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

  // ---------- Neighbours: the stretches of each wall another volume's wall stands against ----------
  const covers = wallCovers(v, all);
  const coverAt = (w: Wall, u0: number, u1: number) =>
    covers[w].reduce((h, c) => (c.u0 < u1 - 1e-3 && u0 < c.u1 - 1e-3 ? Math.max(h, c.h) : h), 0);

  // ---------- Openings ----------
  const holes: Record<Wall, (Rect & { op: Opening })[]> = { front: [], bak: [], hoyre: [], venstre: [] };
  const roofWins: (Rect & { op: Opening; wall: Wall })[] = [];
  /** The pitched plane above a wall: eave height and slope towards its top, for roof windows. */
  const planeAbove = (w: Wall): { s: number; top: number } => {
    const along = lengde ? w === 'venstre' || w === 'hoyre' : w === 'front' || w === 'bak';
    if (kind === 'valm' && along) { const ah = Math.min(S / 2, A / 2); return { s: (ridgeTop - eave) / (ah + o), top: ridgeTop }; }
    return { s: t, top: ridgeTop };
  };

  for (const op of (b.openings ?? []).filter((q) => q.volume_id === v.id)) {
    const label = labelOf(op);
    if (!valid(op.offset_m) || !valid(op.sill_m)) { warn(`Plassering av ${label} er ikke avklart`); continue; }
    if (!positive(op.width_m) || !positive(op.height_m)) { warn(`Størrelse på ${label} er ikke avklart`); continue; }
    const f = Math.round(op.floor);
    // Basement levels (1 − basement_floors … 0) are below ground: never drawn.
    if (f <= 0 && f >= 1 - basements && WALLS.includes(op.wall)) { warn('Kjelleråpninger vises ikke i 3D'); continue; }
    // Contract: the loft is not counted in `floors`; floor = floors + 1 is the loft/roof level, and only a
    // pitched roof has one. Anything higher (or a loft under a flat roof) is not drawn.
    const loft = f === floors + 1;
    if (!(f >= 1 && (f <= floors || (loft && pitched))) || !WALLS.includes(op.wall)) {
      warn(`${label} ligger i etasje ${op.floor}, som ${multi ? vName : 'bygget'} ikke har`);
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
    if (!inRoof) {
      // A wall another volume stands against is inside the building: an opening there is not drawn.
      const c = covers[op.wall].find((q) => q.u0 < r.u1 - 1e-3 && r.u0 < q.u1 - 1e-3 && r.y0 < q.h - 1e-3);
      if (c) { warn(`${label} ligger i en vegg som står inntil ${c.name}`); continue; }
    }
    if (r.u0 > want.u0 + EPS || r.u1 < want.u1 - EPS || r.y0 > want.y0 + EPS || r.y1 < want.y1 - EPS) {
      warn(`${label} går utenfor veggen og er tegnet avkortet`);
    }
    const list = inRoof ? roofWins.filter((q) => q.wall === op.wall) : holes[op.wall];
    for (const q of list) {
      if (q.u0 < r.u1 - EPS && r.u0 < q.u1 - EPS && q.y0 < r.y1 - EPS && r.y0 < q.y1 - EPS) warn(`${label} overlapper ${labelOf(q.op)}`);
    }
    if (inRoof) roofWins.push({ ...r, op, wall: op.wall });
    else holes[op.wall].push({ ...r, op });
  }

  // ---------- Slab (a low plinth, display only; dark and wider when the volume has a basement) ----------
  if (basements > 0) box('slab', 'slab', PLINTH, -0.08, L + 0.08, -0.1, 0.06, -0.08, W + 0.08);
  else box('slab', 'slab', SLAB, -0.05, L + 0.05, -0.1, 0.05, -0.05, W + 0.05);

  // ---------- Walls: panels around the holes, no CSG; covered stretches are left out up to the cover ----------
  for (const w of WALLS) {
    const [us, ue] = range(w);
    const hs = holes[w];
    const bps = [us, ue, ...hs.flatMap((h) => [h.u0, h.u1]), ...covers[w].flatMap((c) => [c.u0, c.u1])].map((u) => Math.min(ue, Math.max(us, u)));
    if (kind === 'saltak' && hasGable(w)) bps.push(wallLen(w) / 2);
    const cuts = [...new Set(bps.map(r3))].sort((p, q) => p - q);
    let n = 0;
    for (let i = 0; i + 1 < cuts.length; i++) {
      const a = cuts[i], c = cuts[i + 1];
      if (c - a < 1e-3) continue;
      const mid = (a + c) / 2;
      const cover = coverAt(w, a, c);
      const panel = (y0: number, y1: number) => {
        const lo = Math.max(y0, cover);
        if (y1 - lo > 1e-3) wallBox(`wall-${w}-${n++}`, 'wall', wallC, w, a, c, lo, y1, 0, WALL_T);
      };
      const ys = hs.filter((h) => h.u0 <= mid && h.u1 >= mid).map((h) => [h.y0, h.y1]).sort((p, q) => p[0] - q[0]);
      let y = 0;
      for (const [h0, h1] of ys) {
        if (h0 > y + 1e-3) panel(y, h0);
        y = Math.max(y, h1);
      }
      if (y < wallH - 1e-3) panel(y, wallH);
      // Gable (or the high wall of a shed roof) above the wall top, clipped above a neighbour's wall.
      const yb = Math.max(y, wallH, cover), ta = topAt(w, a), tc = topAt(w, c);
      if (ta > yb + 1e-3 || tc > yb + 1e-3) {
        let pts: V3[];
        if (ta >= yb && tc >= yb) pts = [wallPt(w, a, yb), wallPt(w, c, yb), wallPt(w, c, tc), wallPt(w, a, ta)];
        else if (ta < yb) { const ua = a + ((c - a) * (yb - ta)) / (tc - ta); pts = [wallPt(w, ua, yb), wallPt(w, c, yb), wallPt(w, c, tc)]; }
        else { const uc = a + ((c - a) * (ta - yb)) / (ta - tc); pts = [wallPt(w, a, yb), wallPt(w, uc, yb), wallPt(w, a, ta)]; }
        poly(`gable-${w}-${n++}`, 'gable', wallC, pts, OUT[w]);
      }
    }
  }

  // ---------- Corner trims (from a neighbour's wall top up, where a neighbour stands at the corner) ----------
  const k = 0.1, out = 0.02;
  /** Each corner and the two walls (with u) that meet there. */
  const corners: [number, number, Wall, number, Wall, number][] = [
    [0, 0, 'front', 0, 'venstre', W], [L, 0, 'front', L, 'hoyre', 0], [L, W, 'hoyre', W, 'bak', 0], [0, W, 'bak', L, 'venstre', 0],
  ];
  corners.forEach(([cx, cz, w1, u1, w2, u2], i) => {
    const y0 = Math.max(0.05, coverAt(w1, u1 - 0.01, u1 + 0.01), coverAt(w2, u2 - 0.01, u2 + 0.01));
    if (wallH - y0 < 0.05) return;
    const x0 = cx === 0 ? -out : L - k, z0 = cz === 0 ? -out : W - k;
    box(`trim-corner-${i}`, 'trim', trimC, x0, x0 + k + out, y0, wallH, z0, z0 + k + out);
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
      if (op.kind === 'port' && Math.round(op.floor) === 1) wallBox(`drive-${op.id}`, 'ground', GRAVEL, w, h.u0 - 0.4, h.u1 + 0.4, 0, 0.015, -6, -0.06, null);
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
    // Parapets, except along a side where a neighbour's wall rises at least to this roof (it would be inside).
    const p0 = wallH + 0.25, p1 = p0 + 0.3, pt = 0.12;
    const full = (w: Wall) => covers[w].some((c) => c.u0 <= 1e-3 && c.u1 >= wallLen(w) - 1e-3 && c.h >= p1);
    if (!full('front')) box('parapet-0', 'trim', trimC, -0.05, L + 0.05, p0, p1, -0.05, -0.05 + pt);
    if (!full('bak')) box('parapet-1', 'trim', trimC, -0.05, L + 0.05, p0, p1, W + 0.05 - pt, W + 0.05);
    if (!full('venstre')) box('parapet-2', 'trim', trimC, -0.05, -0.05 + pt, p0, p1, -0.05 + pt, W + 0.05 - pt);
    if (!full('hoyre')) box('parapet-3', 'trim', trimC, L + 0.05 - pt, L + 0.05, p0, p1, -0.05 + pt, W + 0.05 - pt);
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
}
