// The «Tegning» tab: a site plan of every bygningskropp and the four elevations of the whole building,
// as SVG, drawn only from what the AI returned. Owner: WS4.
//
// Site coordinates (the contract, src/contract/types.ts): x runs to the right along the main front,
// y from the front towards the back; (x_m, y_m) is a volume's front-left corner. Each opening sits on
// one wall of one volume, offset_m from that wall's left corner seen from outside, sill_m above its
// floor. An opening without a position or size, on a volume or floor that does not exist, or on a
// wall shared with another volume is listed under «Ikke plassert ennå» instead, never placed by the app.
//
// Floors per volume: `floors` counts whole storeys only; floor = floors + 1 is the loft (see loftKind):
// in a gable the sill is measured from the top of the wall, on an eave wall it is a roof window whose
// sill is measured along the roof from the top of the wall and projected. 0, −1 … are basement levels,
// drawn dashed below the ground line.
//
// Elevations: seen from one side, every volume's wall facing that side is drawn at its position along
// the side, farthest first (painter's order), the ones further back slightly lighter.
//
// Every SVG carries its colours as attributes (hex from the AI via hexColor, greys otherwise), so it
// prints and renders without any stylesheet. Only the glow animation needs TAB_CSS (src/ui/tabs.ts).
import { esc, formatM, formatNum } from '../format';
import {
  footprintArea,
  grossArea,
  hexColor,
  isSized,
  siteBounds,
  volumeOf,
  type Building,
  type Exterior,
  type Opening,
  type OpeningKind,
  type Roof,
  type SizedVolume,
  type Volume,
  type Wall,
} from '../types';

const VIEW_W = 380;
const VIEW_H = 280;
const DEFAULT_FLOOR_H = 2.4;
const DEFAULT_PITCH = 30;
const FASCIA = 0.25;
const EPS = 0.01;

const GREY = { wall: '#d9d9d6', roof: '#7d7d7d', trim: '#5c5c5c' };
const KIND_FILL: Record<OpeningKind, string> = { vindu: '#c7dceb', dor: '#a7a7a3', port: '#bdbdb8', annet: '#cfcfcb' };

export const WALLS: { id: Wall; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'bak', label: 'Bak' },
  { id: 'venstre', label: 'Venstre' },
  { id: 'hoyre', label: 'Høyre' },
];
export const WALL_LABEL: Record<Wall, string> = { front: 'Front', bak: 'Bak', venstre: 'Venstre', hoyre: 'Høyre' };
export const KIND_LABEL: Record<OpeningKind, string> = { dor: 'Dør', vindu: 'Vindu', port: 'Port', annet: 'Annet' };
const ROOF_LABEL: Record<Roof['kind'], string> = { saltak: 'Saltak', pulttak: 'Pulttak', valm: 'Valmtak', flatt: 'Flatt tak', annet: 'Annet tak' };
const OPPOSITE: Record<Wall, Wall> = { front: 'bak', bak: 'front', venstre: 'hoyre', hoyre: 'venstre' };

const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);
const pos = (n: number | null | undefined): n is number => ok(n) && n > 0;
const label = <K extends string>(map: Record<K, string>, k: K) => map[k] ?? esc(k);
const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;
const plural = (n: number, one: string, many: string) => `${formatNum(n)} ${n === 1 ? one : many}`;

/** «Saltak 35°, møne langs lengden» — for the KPIs, the report and the lead. */
export function roofText(roof: Roof | null): string {
  if (!roof) return '–';
  const pitch = ok(roof.pitch_deg) && roof.kind !== 'flatt' ? ` ${formatNum(roof.pitch_deg)}°` : '';
  const along = roof.ridge_along === 'bredde' ? 'bredden' : 'lengden';
  const dir = roof.kind === 'saltak' || roof.kind === 'valm' ? `, møne langs ${along}` : roof.kind === 'pulttak' ? `, fall langs ${along}` : '';
  return `${label(ROOF_LABEL, roof.kind)}${pitch}${dir}`;
}

// ---- volumes ----

/** A volume that can be drawn: sized, with a finite site position. */
const drawable = (v: Volume): v is SizedVolume => isSized(v) && ok(v.x_m) && ok(v.y_m);
const drawables = (b: Building) => b.volumes.filter(drawable);
/** The site rectangle of the drawable volumes (siteBounds over those only, so a bad position never gives NaN). */
const bounds = (b: Building) => siteBounds({ ...b, volumes: drawables(b) });

/** Whole storeys above ground (a loft is not counted, per the contract). */
const storeys = (v: SizedVolume) => Math.max(1, Math.round(v.floors));
const basements = (v: Volume) => (ok(v.basement_floors) && v.basement_floors > 0 ? Math.round(v.basement_floors) : 0);
const floorH = (v: Volume) => (pos(v.floor_height_m) ? v.floor_height_m : DEFAULT_FLOOR_H);
const overhang = (roof: Roof | null) => (roof && ok(roof.overhang_m) ? Math.max(0, Math.min(roof.overhang_m, 2)) : 0);
const pitchOf = (roof: Roof | null) => (roof && ok(roof.pitch_deg) ? Math.max(0, Math.min(roof.pitch_deg, 75)) : DEFAULT_PITCH);

/** «2 etg. + 1 U» */
function floorsText(v: Volume): string {
  const B = basements(v);
  const F = pos(v.floors) ? `${formatNum(Math.round(v.floors))} etg.` : '– etg.';
  return B ? `${F} + ${B} U` : F;
}

/**
 * How the loft level (floor = floors + 1) meets a wall:
 * 'gable' = the wall rises into the roof (saltak gable, pulttak sides and high end): the sill is
 *           measured up from the top of the wall;
 * 'plane' = the roof surface faces this wall (saltak eaves, valm, pulttak low end): a roof window,
 *           the sill measured along the roof from the eave (the roof edge) and projected;
 * null    = there is no loft to put it in (no roof, flatt, annet).
 */
export function loftKind(roof: Roof | null, wall: Wall): 'gable' | 'plane' | null {
  if (!roof) return null;
  const along = roof.ridge_along === 'bredde' ? 'bredde' : 'lengde';
  const parallel = along === (wall === 'front' || wall === 'bak' ? 'lengde' : 'bredde');
  switch (roof.kind) {
    case 'saltak':
      return parallel ? 'plane' : 'gable';
    case 'valm':
      return 'plane';
    case 'pulttak':
      return parallel || (along === 'lengde' ? wall === 'venstre' : wall === 'front') ? 'gable' : 'plane';
    default:
      return null;
  }
}

/** A point `s` metres along a volume's wall from its left corner seen from outside, in site coordinates. */
function wallPoint(v: SizedVolume, wall: Wall, s: number): [number, number] {
  switch (wall) {
    case 'front':
      return [v.x_m + s, v.y_m];
    case 'bak':
      return [v.x_m + v.length_m - s, v.y_m + v.width_m];
    case 'venstre':
      return [v.x_m, v.y_m + v.width_m - s];
    default:
      return [v.x_m + v.length_m, v.y_m + s];
  }
}

/** The line a wall lies on: front/bak run along x at y = `at`, venstre/høyre along y at x = `at`. */
function lineOf(v: SizedVolume, wall: Wall): { alongX: boolean; at: number; lo: number; hi: number } {
  switch (wall) {
    case 'front':
      return { alongX: true, at: v.y_m, lo: v.x_m, hi: v.x_m + v.length_m };
    case 'bak':
      return { alongX: true, at: v.y_m + v.width_m, lo: v.x_m, hi: v.x_m + v.length_m };
    case 'venstre':
      return { alongX: false, at: v.x_m, lo: v.y_m, hi: v.y_m + v.width_m };
    default:
      return { alongX: false, at: v.x_m + v.length_m, lo: v.y_m, hi: v.y_m + v.width_m };
  }
}

/** Where an opening sits on its wall, in metres up from the ground (0 = ground line; negative = basement). */
function openingBox(v: SizedVolume, o: Opening): { y: number; h: number } {
  const F = storeys(v);
  const fh = floorH(v);
  const H = F * fh;
  const loft = o.floor === F + 1 ? loftKind(v.roof, o.wall) : null;
  const sin = Math.sin((pitchOf(v.roof) * Math.PI) / 180);
  if (loft === 'plane') return { y: H + o.sill_m! * sin, h: o.height_m! * sin };
  if (loft === 'gable') return { y: H + o.sill_m!, h: o.height_m! };
  return { y: (o.floor - 1) * fh + o.sill_m!, h: o.height_m! };
}

/**
 * The other volume an opening's stretch of wall is shared with (attached volumes share a wall line),
 * or undefined. Only where the neighbour actually stands: above its walls or below its basement the
 * wall is an outer wall again (a first-floor window above an attached garage is fine).
 */
function sharedWith(b: Building, v: SizedVolume, o: Opening): SizedVolume | undefined {
  const me = lineOf(v, o.wall);
  const p = wallPoint(v, o.wall, o.offset_m!);
  const q = wallPoint(v, o.wall, o.offset_m! + o.width_m!);
  const k = me.alongX ? 0 : 1;
  const lo = Math.min(p[k], q[k]);
  const hi = Math.max(p[k], q[k]);
  const box = openingBox(v, o);
  return drawables(b).find((n) => {
    if (n === v) return false;
    const other = lineOf(n, OPPOSITE[o.wall]);
    if (Math.abs(other.at - me.at) > EPS || Math.min(hi, other.hi) - Math.max(lo, other.lo) <= EPS) return false;
    const bottom = -basements(n) * floorH(n);
    const top = storeys(n) * floorH(n);
    return Math.min(box.y + box.h, top) - Math.max(box.y, bottom) > EPS;
  });
}

/** Why an opening is not drawn, or null when it can be drawn exactly where the AI put it. */
export function unplacedReason(o: Opening, b?: Building): string | null {
  const missing: string[] = [];
  if (!ok(o.offset_m)) missing.push('avstand fra hjørnet');
  if (!ok(o.sill_m)) missing.push('høyde over gulv');
  if (!pos(o.width_m) || !pos(o.height_m)) missing.push('mål');
  if (missing.length) return `Mangler ${missing.join(', ')}`;
  if (!b) return null;
  const v = volumeOf(b, o);
  if (!v) return `Bygningskroppen «${esc(o.volume_id)}» finnes ikke`;
  if (!drawable(v)) return `${esc(v.name)} mangler lengde, bredde, etasjer eller plassering`;
  const F = storeys(v);
  const B = basements(v);
  if (!ok(o.floor)) return 'Etasjen er ikke oppgitt';
  if (o.floor < 1 - B) {
    return `Etasje ${formatNum(o.floor)} finnes ikke (${esc(v.name)} har ${B ? plural(B, 'kjelleretasje', 'kjelleretasjer') : 'ingen kjeller'})`;
  }
  if (o.floor > F + 1) return `Etasje ${formatNum(o.floor)} finnes ikke (${esc(v.name)} har ${plural(F, 'etasje', 'etasjer')} pluss loft)`;
  if (o.floor === F + 1 && !loftKind(v.roof, o.wall)) return 'Står på loftet, men taket har ingen loftsetasje å plassere den i';
  const n = sharedWith(b, v, o);
  if (n) return `Står på en vegg som deles med ${esc(n.name)}`;
  return null;
}

export const isPlaced = (o: Opening, b?: Building) => unplacedReason(o, b) === null;

// ---- roof geometry ----

interface Shape {
  /** [x, y] in metres: x from the wall's left corner seen from outside, y up from the ground. */
  pts: [number, number][];
  kind: 'face' | 'infill' | 'rake';
}

/** The roof as seen on one wall of one volume. Pure geometry from roof.kind/pitch_deg/ridge_along/overhang_m. */
function roofShapes(roof: Roof | null, wall: Wall, L: number, H: number, v: SizedVolume): { shapes: Shape[]; rise: number } {
  if (!roof) return { shapes: [], rise: 0 };
  const o = overhang(roof);
  const t = Math.tan((pitchOf(roof) * Math.PI) / 180);
  const along = roof.ridge_along === 'bredde' ? 'bredde' : 'lengde';
  const wallAlong = wall === 'front' || wall === 'bak' ? 'lengde' : 'bredde';
  const parallel = along === wallAlong;
  const span = along === 'lengde' ? v.width_m : v.length_m;
  const drop = o * t;
  const flat = (): Shape[] => [{ kind: 'face', pts: [[-o, H], [L + o, H], [L + o, H + FASCIA], [-o, H + FASCIA]] }];

  switch (roof.kind) {
    case 'saltak':
    case 'valm': {
      const R = (span / 2) * t;
      if (!parallel) {
        // The wall the ridge ends at: a gable (saltak) or the hip's triangular face (valm).
        const apex: [number, number] = [L / 2, H + R];
        const eaves: [number, number][] = [[-o, H - drop], apex, [L + o, H - drop]];
        return roof.kind === 'saltak'
          ? { rise: R, shapes: [{ kind: 'infill', pts: [[0, H], apex, [L, H]] }, { kind: 'rake', pts: eaves }] }
          : { rise: R, shapes: [{ kind: 'face', pts: eaves }] };
      }
      if (roof.kind === 'saltak') return { rise: R, shapes: [{ kind: 'face', pts: [[-o, H - drop], [L + o, H - drop], [L + o, H + R], [-o, H + R]] }] };
      const inset = Math.min(span / 2, L / 2);
      return { rise: R, shapes: [{ kind: 'face', pts: [[-o, H - drop], [L + o, H - drop], [L - inset, H + R], [inset, H + R]] }] };
    }
    case 'pulttak': {
      // The slope falls along ridge_along. Lengde: high at the venstre end; bredde: high at the front
      // (the same convention as the 3D model, src/three/model.ts).
      const R = (along === 'lengde' ? v.length_m : v.width_m) * t;
      if (parallel) {
        const highLeft = along === 'lengde' ? wall === 'front' : wall === 'hoyre';
        const top = (x: number) => H + R * (highLeft ? 1 - x / L : x / L);
        return {
          rise: R,
          shapes: [
            { kind: 'infill', pts: [[0, H], [0, top(0)], [L, top(L)], [L, H]] },
            { kind: 'rake', pts: [[-o, top(-o)], [L + o, top(L + o)]] },
          ],
        };
      }
      const highEnd = along === 'lengde' ? wall === 'venstre' : wall === 'front';
      return highEnd
        ? { rise: R, shapes: [{ kind: 'infill', pts: [[0, H], [L, H], [L, H + R], [0, H + R]] }, { kind: 'rake', pts: [[-o, H + R], [L + o, H + R]] }] }
        : { rise: R, shapes: [{ kind: 'face', pts: [[-o, H - drop], [L + o, H - drop], [L + o, H + R], [-o, H + R]] }] };
    }
    default:
      return { rise: FASCIA, shapes: flat() };
  }
}

interface Colors {
  wall: string;
  roof: string;
  trim: string;
}

/** A volume's colours: its own exterior when given, else the building's, else greys. */
const colors = (b: Building, v?: Volume): Colors => {
  const ex: Exterior | null = v?.exterior ?? b.exterior;
  return {
    wall: hexColor(ex?.wall_color) ?? GREY.wall,
    roof: hexColor(ex?.roof_color) ?? GREY.roof,
    trim: hexColor(ex?.trim_color) ?? GREY.trim,
  };
};

const cls = (base: string, id: string, highlight: Set<string>) => `${base}${highlight.has(id) ? ' glow' : ''}`;

/** A horizontal dimension line with ticks and a centred label (pixels). */
function hDim(x1: number, x2: number, y: number, text: string, minPx = 20): string {
  const t = `<line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}"/><line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}"/>`;
  const lab = x2 - x1 >= minPx ? `<text x="${r1((x1 + x2) / 2)}" y="${y - 3}" text-anchor="middle" stroke="none" fill="currentColor">${text}</text>` : '';
  return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>${t}${lab}`;
}

function vDim(x: number, y1: number, y2: number, text: string): string {
  const mid = r1((y1 + y2) / 2);
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}"/><line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}"/><text x="${x + 4}" y="${mid}" transform="rotate(-90 ${x + 4} ${mid})" text-anchor="middle" dy="-2" stroke="none" fill="currentColor">${text}</text>`;
}

const pts = (list: [number, number][], X: (m: number) => number, Y: (m: number) => number) =>
  list.map(([x, y]) => `${r1(X(x))},${r1(Y(y))}`).join(' ');

/** One opening as an SVG group (rect + panels), at pixel position x/yTop with size w/h. */
function openingSvg(op: Opening, x: number, yTop: number, w: number, h: number, c: Colors, highlight: Set<string>, title: string): string {
  const panels =
    op.kind === 'port'
      ? Array.from({ length: 3 }, (_, i) => `<line x1="${r1(x)}" y1="${r1(yTop + ((i + 1) * h) / 4)}" x2="${r1(x + w)}" y2="${r1(yTop + ((i + 1) * h) / 4)}" stroke="${c.trim}" stroke-opacity="0.6"/>`).join('')
      : op.kind === 'vindu'
        ? `<line x1="${r1(x + w / 2)}" y1="${r1(yTop)}" x2="${r1(x + w / 2)}" y2="${r1(yTop + h)}" stroke="${c.trim}" stroke-opacity="0.6"/>`
        : '';
  return `<g class="${cls('dw-open', op.id, highlight)}" data-id="${esc(op.id)}"><title>${title}</title><rect x="${r1(x)}" y="${r1(yTop)}" width="${r1(w)}" height="${r1(h)}" fill="${KIND_FILL[op.kind] ?? KIND_FILL.annet}" stroke="${c.trim}" stroke-width="1.5"/>${panels}</g>`;
}

// ---- elevations ----

/** A volume seen from one side: where its facing wall starts along that side (u), its length and its depth. */
interface Facing {
  v: SizedVolume;
  /** Metres from the building's left corner seen from outside that side. */
  u: number;
  /** Length of the facing wall. */
  L: number;
  /** Metres behind the building's outermost line on that side (0 = in front). */
  depth: number;
}

/** Every drawable volume as seen from one side, farthest first; null when nothing can be drawn. */
export function facingVolumes(b: Building, side: Wall): { span: number; list: Facing[] } | null {
  const bb = bounds(b);
  if (!bb) return null;
  const { x0, y0, x1, y1 } = bb;
  const list = drawables(b).map((v): Facing => {
    switch (side) {
      case 'front':
        return { v, L: v.length_m, u: v.x_m - x0, depth: v.y_m - y0 };
      case 'bak':
        return { v, L: v.length_m, u: x1 - v.x_m - v.length_m, depth: y1 - v.y_m - v.width_m };
      case 'venstre':
        return { v, L: v.width_m, u: y1 - v.y_m - v.width_m, depth: v.x_m - x0 };
      default:
        return { v, L: v.width_m, u: v.y_m - y0, depth: x1 - v.x_m - v.length_m };
    }
  });
  list.sort((a, c) => c.depth - a.depth);
  return { span: side === 'front' || side === 'bak' ? x1 - x0 : y1 - y0, list };
}

/** One elevation of the whole building, seen from outside. Null when no volume has a size yet. */
export function renderElevation(b: Building, wall: Wall, highlight: Set<string> = new Set()): string | null {
  const seen = facingVolumes(b, wall);
  if (!seen) return null;
  const geo = seen.list.map((f) => {
    const F = storeys(f.v);
    const fh = floorH(f.v);
    const H = F * fh;
    const { shapes, rise } = roofShapes(f.v.roof, wall, f.L, H, f.v);
    return { ...f, F, fh, H, shapes, rise, o: overhang(f.v.roof), B: basements(f.v), below: basements(f.v) * fh };
  });
  const top = Math.max(...geo.map((g) => g.H + Math.max(g.rise, 0)));
  const below = Math.max(0, ...geo.map((g) => g.below));
  const minU = Math.min(0, ...geo.map((g) => g.u - g.o));
  const maxU = Math.max(seen.span, ...geo.map((g) => g.u + g.L + g.o));

  const left = 22;
  const right = 52;
  const head = 30;
  const foot = 56;
  const scale = Math.min((VIEW_W - left - right) / (maxU - minU), (VIEW_H - head - foot) / Math.max(top + below, 0.5));
  const x0 = left + (VIEW_W - left - right - (maxU - minU) * scale) / 2 - minU * scale;
  const ground = VIEW_H - foot - below * scale;
  const X = (m: number) => x0 + m * scale;
  const Y = (m: number) => ground - m * scale;
  const title = `Fasade ${label(WALL_LABEL, wall).toLowerCase()}`;
  const nearest = Math.min(...geo.map((g) => g.depth));

  const out: string[] = [`<text x="${VIEW_W / 2}" y="18" text-anchor="middle" class="dw-title" font-weight="600" fill="currentColor">${title}</text>`];
  out.push(`<line x1="6" y1="${r1(ground)}" x2="${VIEW_W - 6}" y2="${r1(ground)}" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.5"/>`);

  for (const g of geo) {
    const c = colors(b, g.v);
    const XL = (m: number) => X(g.u + m);
    const parts: string[] = [];
    // The basement: dashed outline below the ground line, its floor lines dashed too.
    if (g.below > 0) {
      parts.push(`<rect class="dw-basement" x="${r1(XL(0))}" y="${r1(Y(0))}" width="${r1(g.L * scale)}" height="${r1(g.below * scale)}" fill="${c.wall}" fill-opacity="0.18" stroke="${c.trim}" stroke-width="1" stroke-dasharray="5 3"/>`);
      for (let k = 1; k < g.B; k++) parts.push(`<line x1="${r1(XL(0))}" y1="${r1(Y(-k * g.fh))}" x2="${r1(XL(g.L))}" y2="${r1(Y(-k * g.fh))}" stroke="${c.trim}" stroke-opacity="0.5" stroke-dasharray="4 3"/>`);
    }
    // Wall infill under the roof first, then the wall, then the roof faces and rakes on top.
    for (const s of g.shapes.filter((s) => s.kind === 'infill')) parts.push(`<polygon points="${pts(s.pts, XL, Y)}" fill="${c.wall}" stroke="${c.trim}" stroke-width="1"/>`);
    parts.push(`<rect class="dw-wall" x="${r1(XL(0))}" y="${r1(Y(g.H))}" width="${r1(g.L * scale)}" height="${r1(g.H * scale)}" fill="${c.wall}" stroke="${c.trim}" stroke-width="1.2"/>`);
    for (let f = 1; f < g.F; f++) parts.push(`<line x1="${r1(XL(0))}" y1="${r1(Y(f * g.fh))}" x2="${r1(XL(g.L))}" y2="${r1(Y(f * g.fh))}" stroke="${c.trim}" stroke-opacity="0.5" stroke-dasharray="4 3"/>`);
    for (const s of g.shapes) {
      if (s.kind === 'face') parts.push(`<polygon points="${pts(s.pts, XL, Y)}" fill="${c.roof}" stroke="${c.trim}" stroke-width="1"/>`);
      if (s.kind === 'rake') parts.push(`<polyline points="${pts(s.pts, XL, Y)}" fill="none" stroke="${c.roof}" stroke-width="${r1(Math.max(3, 0.22 * scale))}" stroke-linejoin="round" stroke-linecap="round"/>`);
    }
    for (const op of b.openings.filter((op) => op.volume_id === g.v.id && op.wall === wall && isPlaced(op, b))) {
      const box = openingBox(g.v, op);
      parts.push(openingSvg(op, XL(op.offset_m!), Y(box.y + box.h), op.width_m! * scale, box.h * scale, c, highlight, `${esc(op.label)} – ${formatM(op.width_m)} × ${formatM(op.height_m)}`));
    }
    const behind = g.depth > nearest + EPS ? ' opacity="0.78"' : '';
    out.push(`<g class="${cls('dw-vol', g.v.id, highlight)}" data-id="${esc(g.v.id)}"${behind}><title>${esc(g.v.name)}</title>${parts.join('')}</g>`);
  }

  // Dimension chain: with one volume the openings' edges along the wall (as given), with several the
  // volumes' extents along the side; then the whole side.
  const edges = new Set<number>([0, r2(seen.span)]);
  const addEdge = (e: number) => {
    if (e > EPS && e < seen.span - EPS) edges.add(r2(e));
  };
  if (geo.length === 1) {
    for (const op of b.openings.filter((op) => op.volume_id === geo[0].v.id && op.wall === wall && isPlaced(op, b))) {
      addEdge(geo[0].u + op.offset_m!);
      addEdge(geo[0].u + op.offset_m! + op.width_m!);
    }
  } else {
    for (const g of geo) {
      addEdge(g.u);
      addEdge(g.u + g.L);
    }
  }
  const sorted = [...edges].sort((a, c) => a - c);
  const base = VIEW_H - foot;
  const dims: string[] = [];
  if (sorted.length > 2) {
    for (let i = 0; i < sorted.length - 1; i++) dims.push(hDim(r1(X(sorted[i])), r1(X(sorted[i + 1])), base + 18, formatNum(r2(sorted[i + 1] - sorted[i])), 18));
  }
  dims.push(hDim(r1(X(0)), r1(X(seen.span)), base + 40, formatM(r2(seen.span))));
  const dimX = r1(X(maxU) + 16);
  const Hmax = Math.max(...geo.map((g) => g.H));
  dims.push(vDim(dimX, r1(Y(0)), r1(Y(Hmax)), formatM(r2(Hmax))));
  if (top > Hmax + FASCIA + EPS) dims.push(vDim(r1(dimX + 20), r1(Y(0)), r1(Y(top)), formatM(r2(top))));
  if (below > 0) dims.push(vDim(dimX, r1(Y(-below)), r1(Y(0)), formatM(r2(below))));
  out.push(`<g class="dw-dim" stroke="currentColor" stroke-opacity="0.7" stroke-width="0.8" fill="none" font-size="10">${dims.join('')}</g>`);

  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="dw-svg" font-family="inherit" font-size="11" role="img" aria-label="${title}">${out.join('')}</svg>`;
}

// ---- site plan ----

/** The ridge (dashed) or the fall arrow of one volume's roof, inside its plan rectangle (pixels). */
function roofHint(roof: Roof | null, x0: number, y0: number, w: number, h: number, c: Colors): string {
  if (!roof) return '';
  const out: string[] = [];
  if (roof.kind === 'saltak' || roof.kind === 'valm') {
    const alongL = roof.ridge_along !== 'bredde';
    const inset = roof.kind === 'valm' ? Math.min(alongL ? h / 2 : w / 2, alongL ? w / 2 : h / 2) : 0;
    const [rx1, ry1, rx2, ry2] = alongL ? [x0 + inset, y0 + h / 2, x0 + w - inset, y0 + h / 2] : [x0 + w / 2, y0 + inset, x0 + w / 2, y0 + h - inset];
    out.push(`<line x1="${r1(rx1)}" y1="${r1(ry1)}" x2="${r1(rx2)}" y2="${r1(ry2)}" stroke="${c.roof}" stroke-width="1.5" stroke-dasharray="6 4"/>`);
    if (roof.kind === 'valm') {
      const corners: [number, number, number, number][] = alongL
        ? [[x0, y0, rx1, ry1], [x0, y0 + h, rx1, ry1], [x0 + w, y0, rx2, ry2], [x0 + w, y0 + h, rx2, ry2]]
        : [[x0, y0, rx1, ry1], [x0 + w, y0, rx1, ry1], [x0, y0 + h, rx2, ry2], [x0 + w, y0 + h, rx2, ry2]];
      for (const [a, bb, cc, d] of corners) out.push(`<line x1="${r1(a)}" y1="${r1(bb)}" x2="${r1(cc)}" y2="${r1(d)}" stroke="${c.roof}" stroke-width="1" stroke-dasharray="3 3"/>`);
    }
  } else if (roof.kind === 'pulttak') {
    const alongL = roof.ridge_along !== 'bredde';
    // High at the venstre end (lengde) or at the front (bredde); the arrow points downhill.
    const [ax1, ay1, ax2, ay2] = alongL ? [x0 + w * 0.15, y0 + h * 0.8, x0 + w * 0.45, y0 + h * 0.8] : [x0 + w * 0.12, y0 + h * 0.85, x0 + w * 0.12, y0 + h * 0.55];
    const head = alongL ? `${r1(ax2)},${r1(ay2)} ${r1(ax2 - 7)},${r1(ay2 - 4)} ${r1(ax2 - 7)},${r1(ay2 + 4)}` : `${r1(ax2)},${r1(ay2)} ${r1(ax2 - 4)},${r1(ay2 + 7)} ${r1(ax2 + 4)},${r1(ay2 + 7)}`;
    out.push(`<line x1="${r1(ax1)}" y1="${r1(ay1)}" x2="${r1(ax2)}" y2="${r1(ay2)}" stroke="${c.roof}" stroke-width="1.5"/><polygon points="${head}" fill="${c.roof}"/>`);
  }
  return out.join('');
}

/** The site plan seen from above: every volume at its position, front at the bottom, venstre to the left. */
export function renderPlan(b: Building, highlight: Set<string> = new Set()): string | null {
  const vols = drawables(b);
  const bb = bounds(b);
  if (!vols.length || !bb) return null;
  const Lm = bb.x1 - bb.x0;
  const Wm = bb.y1 - bb.y0;
  const scale = Math.min((VIEW_W - 100) / Lm, (VIEW_H - 100) / Wm);
  const w = Lm * scale;
  const h = Wm * scale;
  const px0 = (VIEW_W - w) / 2;
  const py0 = (VIEW_H - h) / 2 + 4;
  const X = (x: number) => px0 + (x - bb.x0) * scale;
  const Y = (y: number) => py0 + h - (y - bb.y0) * scale;
  const t = Math.max(2, Math.min(0.2 * scale, 5));
  const out: string[] = [`<text x="${VIEW_W / 2}" y="18" text-anchor="middle" font-weight="600" fill="currentColor">Situasjonsplan</text>`];
  const text = (x: number, y: number, s: string, extra = '') =>
    `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" font-size="9" fill="currentColor" stroke="#ffffff" stroke-width="3" stroke-opacity="0.8" paint-order="stroke"${extra}>${s}</text>`;

  for (const v of vols) {
    const c = colors(b, v);
    const rx = X(v.x_m);
    const ry = Y(v.y_m + v.width_m);
    const rw = v.length_m * scale;
    const rh = v.width_m * scale;
    const size = `${formatNum(v.length_m)} × ${formatNum(v.width_m)} m`;
    const lines = [`${esc(v.name)}`, size, floorsText(v)];
    const fit = rh >= 42 && rw >= 50 ? 3 : rh >= 28 && rw >= 40 ? 2 : rw >= 24 && rh >= 12 ? 1 : 0;
    const cy = ry + rh / 2 - ((fit - 1) * 11) / 2 + 3;
    const labels = lines.slice(0, fit).map((s, i) => text(rx + rw / 2, cy + i * 11, s, i === 0 ? ' font-weight="600"' : '')).join('');
    out.push(
      `<g class="${cls('dw-vol', v.id, highlight)}" data-id="${esc(v.id)}"><title>${esc(v.name)} – ${size}, ${floorsText(v)}${v.roof ? `, ${roofText(v.roof)}` : ''}</title><rect x="${r1(rx)}" y="${r1(ry)}" width="${r1(rw)}" height="${r1(rh)}" fill="#ffffff" fill-opacity="0.6" stroke="${c.trim}" stroke-width="${r1(t)}"/>${roofHint(v.roof, rx, ry, rw, rh, c)}${labels}</g>`,
    );
  }

  // Openings on the storeys as gaps in the outer walls (loft and basement openings: elevations only).
  for (const op of b.openings) {
    if (!isPlaced(op, b)) continue;
    const v = volumeOf(b, op) as SizedVolume;
    if (op.floor < 1 || op.floor > storeys(v)) continue;
    const c = colors(b, v);
    const [ax, ay] = wallPoint(v, op.wall, op.offset_m!);
    const [bx, by] = wallPoint(v, op.wall, op.offset_m! + op.width_m!);
    const rect =
      op.wall === 'front' || op.wall === 'bak'
        ? [X(Math.min(ax, bx)), Y(ay) - t, Math.abs(bx - ax) * scale, 2 * t]
        : [X(ax) - t, Y(Math.max(ay, by)), 2 * t, Math.abs(by - ay) * scale];
    out.push(
      `<g class="${cls('dw-open', op.id, highlight)}" data-id="${esc(op.id)}"><title>${esc(op.label)}</title><rect x="${r1(rect[0])}" y="${r1(rect[1])}" width="${r1(rect[2])}" height="${r1(rect[3])}" fill="${KIND_FILL[op.kind] ?? KIND_FILL.annet}" stroke="${c.trim}" stroke-width="1"/></g>`,
    );
  }

  const dims = [hDim(r1(px0), r1(px0 + w), r1(py0 + h + 30), formatM(r2(Lm))), vDim(r1(px0 - 30), r1(py0 + h), r1(py0), formatM(r2(Wm)))];
  out.push(`<g class="dw-dim" stroke="currentColor" stroke-opacity="0.7" stroke-width="0.8" fill="none" font-size="10">${dims.join('')}</g>`);
  const lab = (x: number, y: number, s: string, anchor = 'middle') => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}" font-size="10" fill="currentColor" fill-opacity="0.75">${s}</text>`;
  out.push(lab(px0 + w / 2, py0 + h + 16, 'Front'), lab(px0 + w / 2, py0 - 9, 'Bak'), lab(px0 - 10, py0 - 9, 'Venstre', 'start'), lab(px0 + w + 10, py0 - 9, 'Høyre', 'end'));
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="dw-svg" font-family="inherit" font-size="11" role="img" aria-label="Situasjonsplan">${out.join('')}</svg>`;
}

// ---- the tab ----

function swatch(name: string, c: string | null | undefined): string {
  const hex = hexColor(c);
  if (!c) return '';
  return `<span class="dw-swatch"><i style="background:${hex ?? GREY.wall}"></i>${esc(name)}${hex ? '' : ` <small>(${esc(c)} – vist grå)</small>`}</span>`;
}

const areaText = (m2: number) => `${formatNum(Math.round(m2 * 10) / 10)} m²`;

/** The building's key figures from the contract helpers (shared by the tabs and the report). */
export function buildingFigures(b: Building) {
  const bb = bounds(b);
  const vols = drawables(b);
  return {
    /** Overall extent [along x, along y] in metres, or null. */
    extent: bb ? ([r2(bb.x1 - bb.x0), r2(bb.y1 - bb.y0)] as [number, number]) : null,
    footprint: footprintArea({ ...b, volumes: vols }),
    gross: grossArea({ ...b, volumes: vols }),
    /** The tallest volume's storeys (0 when none is sized). */
    floors: Math.max(0, ...vols.map(storeys)),
    basement: b.volumes.some((v) => basements(v) > 0),
    volumes: b.volumes.length,
  };
}

/** The «Bygningskropper» card: one row per volume (name, L × B, floors, basement, roof). */
export function volumesCard(b: Building, highlight: Set<string> = new Set()): string {
  if (!b.volumes.length) return '';
  const rows = b.volumes
    .map((v) => {
      const own = v.exterior ? [swatch('Vegg', v.exterior.wall_color), v.exterior.cladding ? `<span class="sub">${esc(v.exterior.cladding)}</span>` : ''].join(' ') : '';
      return `<tr class="${cls('dw-row', v.id, highlight)}" data-id="${esc(v.id)}"><td><b>${esc(v.name)}</b>${own ? `<div class="sub">${own}</div>` : ''}</td><td class="num">${formatM(v.length_m)} × ${formatM(v.width_m)}</td><td class="num">${pos(v.floors) ? formatNum(Math.round(v.floors)) : '–'}</td><td class="num">${basements(v) ? formatNum(basements(v)) : '–'}</td><td>${roofText(v.roof)}</td></tr>`;
    })
    .join('');
  return `<section class="card dw-volumes"><h3>Bygningskropper</h3><div class="table-wrap"><table class="dw-table"><thead><tr><th>Navn</th><th class="num">L × B</th><th class="num">Etasjer</th><th class="num">Kjeller</th><th>Tak</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}

const names = (list: Volume[]) => list.map((v) => `«${esc(v.name)}»`).join(', ');

/** The whole «Tegning» tab (and the report's drawing section). */
export function renderBuilding(b: Building, highlight: Set<string> = new Set()): string {
  if (!b.volumes.length && !b.openings.length) {
    return `<p class="empty">Tegningen kommer når størrelsen er avklart. Fortell for eksempel «ca. 8 × 7 meter» i dialogen.</p>`;
  }
  const fig = buildingFigures(b);
  const vols = drawables(b);
  const ex = b.exterior;
  const notes: string[] = [];
  const noHeight = vols.filter((v) => !pos(v.floor_height_m));
  if (noHeight.length) notes.push(`Etasjehøyden er ikke avklart for ${names(noHeight)} – veggene er tegnet med ${formatM(DEFAULT_FLOOR_H)}.`);
  const noPitch = vols.filter((v) => v.roof && !ok(v.roof.pitch_deg) && v.roof.kind !== 'flatt' && v.roof.kind !== 'annet');
  if (noPitch.length) notes.push(`Takvinkelen er ikke avklart for ${names(noPitch)} – taket er tegnet med ${DEFAULT_PITCH}°.`);
  const other = vols.filter((v) => v.roof?.kind === 'annet');
  if (other.length) notes.push(`Taktypen er «annet» for ${names(other)} og vises bare som en enkel takkant.`);
  if (vols.some((v) => v.roof?.kind === 'pulttak')) notes.push('Pulttak er tegnet høyest i venstre ende (fall langs lengden) eller foran (fall langs bredden).');
  const unsized = b.volumes.filter((v) => !drawable(v));
  if (unsized.length) notes.push(`${names(unsized)} mangler mål eller plassering og er ikke tegnet ennå.`);
  if (vols.length > 1) notes.push('Fasadene viser alle bygningskroppene sett fra samme side; de som ligger lenger bak er tegnet lysere, bak de fremre.');
  if (vols.some((v) => basements(v) > 0)) notes.push('Kjelleretasjer er tegnet stiplet under terrenglinjen.');
  const placed = b.openings.filter((o) => isPlaced(o, b));
  const loftOf = (o: Opening) => {
    const v = volumeOf(b, o) as SizedVolume;
    return o.floor === storeys(v) + 1 ? loftKind(v.roof, o.wall) : null;
  };
  if (placed.some((o) => loftOf(o) === 'plane')) notes.push('Takvinduer er tegnet i takflaten sett rett forfra, så høyden ser kortere ut enn den er.');
  if (placed.some((o) => loftOf(o) !== null || o.floor < 1)) notes.push('Loft- og kjelleråpninger vises bare på fasadene, ikke i situasjonsplanen.');

  const floorText = (o: Opening) => {
    if (!ok(o.floor)) return '–';
    const v = volumeOf(b, o);
    if (v && drawable(v) && o.floor === storeys(v) + 1 && loftKind(v.roof, o.wall)) return 'Loft';
    return o.floor < 1 ? `U${formatNum(1 - o.floor)}` : formatNum(o.floor);
  };

  const svgs = WALLS.map((w) => renderElevation(b, w.id, highlight)).filter((s): s is string => s !== null);
  const plan = renderPlan(b, highlight);
  const drawings = svgs.length
    ? `<div class="dw-grid">${[plan ?? '', ...svgs].map((s) => `<figure class="dw-fig">${s}</figure>`).join('')}</div>`
    : `<p class="empty">Situasjonsplan og fasader tegnes når minst én bygningskropp har lengde, bredde og etasjer.</p>`;

  const unplaced = b.openings.filter((o) => !isPlaced(o, b) || !svgs.length);
  const unplacedHtml = unplaced.length
    ? `<section class="card dw-unplaced"><h3>Ikke plassert ennå</h3><p class="sub">Disse åpningene er med i prosjektet, men kan ikke tegnes nøyaktig der AI-en har beskrevet dem. De tegnes når det er avklart.</p><ul>${unplaced
        .map(
          (o) =>
            `<li class="${cls('dw-item', o.id, highlight)}" data-unplaced="${esc(o.id)}"><b>${esc(o.label)}</b> · ${label(KIND_LABEL, o.kind)} · ${esc(volumeOf(b, o)?.name ?? o.volume_id)} · ${label(WALL_LABEL, o.wall)} · ${unplacedReason(o, b) ?? 'Bygget mangler mål'}</li>`,
        )
        .join('')}</ul></section>`
    : '';

  const rows = b.openings
    .map((o) => {
      const v = volumeOf(b, o);
      return `<tr class="${cls('dw-row', o.id, highlight)}" data-id="${esc(o.id)}"><td><b>${esc(o.label)}</b><div class="sub">${label(KIND_LABEL, o.kind)}</div></td><td>${v ? esc(v.name) : `<span class="sub">Ukjent (${esc(o.volume_id)})</span>`}</td><td>${label(WALL_LABEL, o.wall)}</td><td class="num">${floorText(o)}</td><td class="num">${formatM(o.width_m)} × ${formatM(o.height_m)}</td><td class="num">${isPlaced(o, b) ? `${formatM(o.offset_m)} / ${formatM(o.sill_m)}` : '<span class="sub">Ikke plassert</span>'}</td></tr>`;
    })
    .join('');
  const swatches = [swatch('Vegg', ex?.wall_color), swatch('Tak', ex?.roof_color), swatch('Detaljer', ex?.trim_color)].join('');
  const main = b.volumes[0];

  return `<div class="kpis">
      <div class="kpi"><span>Utstrekning (L × B)</span><b>${fig.extent ? `${formatM(fig.extent[0])} × ${formatM(fig.extent[1])}` : '–'}</b><small>Grunnflate ${fig.footprint > 0 ? areaText(fig.footprint) : '–'}</small></div>
      <div class="kpi"><span>BRA (ca.)</span><b>${fig.gross > 0 ? areaText(fig.gross) : '–'}</b><small>over terreng${fig.basement ? ', kjeller ikke medregnet' : ''}</small></div>
      <div class="kpi"><span>Etasjer</span><b>${fig.floors ? formatNum(fig.floors) : '–'}</b><small>${fig.basement ? 'høyeste bygningskropp, + kjeller' : 'høyeste bygningskropp'}</small></div>
      <div class="kpi"><span>Bygningskropper</span><b>${fig.volumes}</b><small>${main?.roof ? roofText(main.roof) : 'tak ikke avklart'}</small></div>
      <div class="kpi"><span>Åpninger</span><b>${b.openings.length}</b><small>${b.openings.length - placed.length} ikke plassert</small></div>
    </div>
    ${ex && (ex.cladding || swatches) ? `<div class="dw-exterior">${ex.cladding ? `<span class="chip">${esc(ex.cladding)}</span>` : ''}${swatches}</div>` : ''}
    ${notes.map((n) => `<p class="note">${n}</p>`).join('')}
    ${drawings}
    ${volumesCard(b, highlight)}
    ${unplacedHtml}
    ${rows ? `<div class="table-wrap"><table class="dw-table"><thead><tr><th>Åpning</th><th>Bygningskropp</th><th>Vegg</th><th class="num">Etg.</th><th class="num">B × H</th><th class="num">Fra hjørnet / over gulv</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}`;
}
