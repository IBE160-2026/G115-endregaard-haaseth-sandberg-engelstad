// The «Tegning» tab: four elevations and a plan, as SVG, drawn only from what the AI returned.
// Openings are drawn at offset_m/sill_m exactly as given; an opening without a position or size is
// listed under «Ikke plassert ennå» instead, never placed by the app. Owner: WS4.
// Floors: `floors` counts whole storeys only; floor = floors + 1 is the loft (see loftKind): in a gable
// the sill is measured from the top of the wall, on an eave wall it is a roof window whose sill is
// measured along the roof from the top of the wall and projected. Higher floors are not drawn.
//
// Every SVG carries its colours as attributes (hex from the AI via hexColor, greys otherwise), so it
// prints and renders without any stylesheet. Only the glow animation needs TAB_CSS (src/ui/tabs.ts).
import { esc, formatM, formatNum } from '../format';
import { hexColor, type Building, type Opening, type OpeningKind, type Roof, type Wall } from '../types';

const VIEW_W = 380;
const VIEW_H = 280;
const DEFAULT_FLOOR_H = 2.4;
const DEFAULT_PITCH = 30;
const FASCIA = 0.25;

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

const ok = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);
const pos = (n: number | null | undefined): n is number => ok(n) && n > 0;
const label = <K extends string>(map: Record<K, string>, k: K) => map[k] ?? esc(k);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** «Saltak 35°, møne langs lengden» — for the KPIs, the report and the lead. */
export function roofText(roof: Roof | null): string {
  if (!roof) return '–';
  const pitch = ok(roof.pitch_deg) && roof.kind !== 'flatt' ? ` ${formatNum(roof.pitch_deg)}°` : '';
  const along = roof.ridge_along === 'bredde' ? 'bredden' : 'lengden';
  const dir = roof.kind === 'saltak' || roof.kind === 'valm' ? `, møne langs ${along}` : roof.kind === 'pulttak' ? `, fall langs ${along}` : '';
  return `${label(ROOF_LABEL, roof.kind)}${pitch}${dir}`;
}

/** Whole storeys below the roof (a loft is not counted, per the contract). */
const storeys = (b: Building) => (pos(b.floors) ? Math.round(b.floors) : 1);

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

/** Why an opening is not drawn, or null when it can be drawn exactly where the AI put it. */
export function unplacedReason(o: Opening, b?: Building): string | null {
  const missing: string[] = [];
  if (!ok(o.offset_m)) missing.push('avstand fra hjørnet');
  if (!ok(o.sill_m)) missing.push('høyde over gulv');
  if (!pos(o.width_m) || !pos(o.height_m)) missing.push('mål');
  if (missing.length) return `Mangler ${missing.join(', ')}`;
  if (!b) return null;
  const F = storeys(b);
  if (!ok(o.floor) || o.floor < 1) return `Etasje ${esc(o.floor)} kan ikke tegnes`;
  if (o.floor > F + 1) return `Etasje ${formatNum(o.floor)} finnes ikke (bygget har ${F} etasje${F === 1 ? '' : 'r'} pluss loft)`;
  if (o.floor === F + 1 && !loftKind(b.roof, o.wall)) return 'Står på loftet, men taket har ingen loftsetasje å plassere den i';
  return null;
}

export const isPlaced = (o: Opening, b?: Building) => unplacedReason(o, b) === null;

/** The size of a wall seen from outside: its length and the building's depth behind it. */
function wallSize(b: Building, wall: Wall): [number, number] | null {
  if (!pos(b.length_m) || !pos(b.width_m)) return null;
  return wall === 'front' || wall === 'bak' ? [b.length_m, b.width_m] : [b.width_m, b.length_m];
}

interface Shape {
  /** [x, y] in metres: x from the wall's left corner seen from outside, y up from the ground. */
  pts: [number, number][];
  kind: 'face' | 'infill' | 'rake';
}

/** The roof as seen on one wall. Pure geometry from roof.kind/pitch_deg/ridge_along/overhang_m. */
function roofShapes(roof: Roof | null, wall: Wall, L: number, H: number, b: Building): { shapes: Shape[]; rise: number } {
  if (!roof) return { shapes: [], rise: 0 };
  const o = ok(roof.overhang_m) ? Math.max(0, Math.min(roof.overhang_m, 2)) : 0;
  const pitch = ok(roof.pitch_deg) ? Math.max(0, Math.min(roof.pitch_deg, 75)) : DEFAULT_PITCH;
  const t = Math.tan((pitch * Math.PI) / 180);
  const along = roof.ridge_along === 'bredde' ? 'bredde' : 'lengde';
  const wallAlong = wall === 'front' || wall === 'bak' ? 'lengde' : 'bredde';
  const parallel = along === wallAlong;
  const lengthM = b.length_m ?? L;
  const widthM = b.width_m ?? L;
  const span = along === 'lengde' ? widthM : lengthM;
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
      const R = (along === 'lengde' ? lengthM : widthM) * t;
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

const colors = (b: Building): Colors => ({
  wall: hexColor(b.exterior?.wall_color) ?? GREY.wall,
  roof: hexColor(b.exterior?.roof_color) ?? GREY.roof,
  trim: hexColor(b.exterior?.trim_color) ?? GREY.trim,
});

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

/** One elevation, seen from outside. Null when length or width is not known yet. */
export function renderElevation(b: Building, wall: Wall, highlight: Set<string> = new Set()): string | null {
  const size = wallSize(b, wall);
  if (!size) return null;
  const [L] = size;
  const floors = pos(b.floors) ? Math.round(b.floors) : 1;
  const fh = pos(b.floor_height_m) ? b.floor_height_m : DEFAULT_FLOOR_H;
  const H = floors * fh;
  const c = colors(b);
  const { shapes, rise } = roofShapes(b.roof, wall, L, H, b);
  const o = b.roof && ok(b.roof.overhang_m) ? Math.max(0, Math.min(b.roof.overhang_m, 2)) : 0;

  const top = H + Math.max(rise, 0);
  const left = 22;
  const right = 52;
  const head = 30;
  const foot = 56;
  const scale = Math.min((VIEW_W - left - right) / (L + 2 * o), (VIEW_H - head - foot) / Math.max(top, 0.5));
  const x0 = left + (VIEW_W - left - right - (L + 2 * o) * scale) / 2 + o * scale;
  const ground = VIEW_H - foot;
  const X = (m: number) => x0 + m * scale;
  const Y = (m: number) => ground - m * scale;
  const title = `Fasade ${label(WALL_LABEL, wall).toLowerCase()}`;

  const out: string[] = [`<text x="${VIEW_W / 2}" y="18" text-anchor="middle" class="dw-title" font-weight="600" fill="currentColor">${title}</text>`];
  out.push(`<line x1="6" y1="${ground}" x2="${VIEW_W - 6}" y2="${ground}" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.5"/>`);
  // Wall infill under the roof first, then the wall, then the roof faces and rakes on top.
  for (const s of shapes.filter((s) => s.kind === 'infill')) {
    out.push(`<polygon points="${pts(s.pts, X, Y)}" fill="${c.wall}" stroke="${c.trim}" stroke-width="1"/>`);
  }
  out.push(`<rect x="${r1(X(0))}" y="${r1(Y(H))}" width="${r1(L * scale)}" height="${r1(H * scale)}" fill="${c.wall}" stroke="${c.trim}" stroke-width="1.2"/>`);
  for (let f = 1; f < floors; f++) {
    out.push(`<line x1="${r1(X(0))}" y1="${r1(Y(f * fh))}" x2="${r1(X(L))}" y2="${r1(Y(f * fh))}" stroke="${c.trim}" stroke-opacity="0.5" stroke-dasharray="4 3"/>`);
  }
  for (const s of shapes) {
    if (s.kind === 'face') out.push(`<polygon points="${pts(s.pts, X, Y)}" fill="${c.roof}" stroke="${c.trim}" stroke-width="1"/>`);
    if (s.kind === 'rake') out.push(`<polyline points="${pts(s.pts, X, Y)}" fill="none" stroke="${c.roof}" stroke-width="${r1(Math.max(3, 0.22 * scale))}" stroke-linejoin="round" stroke-linecap="round"/>`);
  }

  const placed = b.openings.filter((op) => op.wall === wall && isPlaced(op, b));
  const pitch = b.roof && ok(b.roof.pitch_deg) ? Math.max(0, Math.min(b.roof.pitch_deg, 75)) : DEFAULT_PITCH;
  const sin = Math.sin((pitch * Math.PI) / 180);
  for (const op of placed) {
    // Storeys: sill from that floor. Loft in a gable: sill from the top of the wall.
    // Roof window: sill along the roof from the top of the wall (the contract), projected onto the elevation.
    const loft = op.floor === floors + 1 ? loftKind(b.roof, wall) : null;
    const y = loft === 'plane' ? H + op.sill_m! * sin : loft === 'gable' ? H + op.sill_m! : (op.floor - 1) * fh + op.sill_m!;
    const hM = loft === 'plane' ? op.height_m! * sin : op.height_m!;
    const x = X(op.offset_m!);
    const w = op.width_m! * scale;
    const h = hM * scale;
    const yTop = Y(y + hM);
    const panels =
      op.kind === 'port'
        ? Array.from({ length: 3 }, (_, i) => `<line x1="${r1(x)}" y1="${r1(yTop + ((i + 1) * h) / 4)}" x2="${r1(x + w)}" y2="${r1(yTop + ((i + 1) * h) / 4)}" stroke="${c.trim}" stroke-opacity="0.6"/>`).join('')
        : op.kind === 'vindu'
          ? `<line x1="${r1(x + w / 2)}" y1="${r1(yTop)}" x2="${r1(x + w / 2)}" y2="${r1(yTop + h)}" stroke="${c.trim}" stroke-opacity="0.6"/>`
          : '';
    out.push(
      `<g class="${cls('dw-open', op.id, highlight)}" data-id="${esc(op.id)}"><title>${esc(op.label)} – ${formatM(op.width_m)} × ${formatM(op.height_m)}</title><rect x="${r1(x)}" y="${r1(yTop)}" width="${r1(w)}" height="${r1(h)}" fill="${KIND_FILL[op.kind] ?? KIND_FILL.annet}" stroke="${c.trim}" stroke-width="1.5"/>${panels}</g>`,
    );
  }

  // Dimension chain: the openings' edges along the wall (as given), then the whole wall.
  const edges = new Set<number>([0, L]);
  for (const op of placed) {
    for (const e of [op.offset_m!, op.offset_m! + op.width_m!]) if (e > 0 && e < L) edges.add(Math.round(e * 100) / 100);
  }
  const sorted = [...edges].sort((a, b) => a - b);
  const dims: string[] = [];
  if (sorted.length > 2) {
    for (let i = 0; i < sorted.length - 1; i++) dims.push(hDim(r1(X(sorted[i])), r1(X(sorted[i + 1])), ground + 18, formatNum(sorted[i + 1] - sorted[i]), 18));
  }
  dims.push(hDim(r1(X(0)), r1(X(L)), ground + 40, formatM(L)));
  const dimX = r1(X(L + o) + 16);
  dims.push(vDim(dimX, r1(Y(0)), r1(Y(H)), formatM(H)));
  if (rise > FASCIA + 0.01) dims.push(vDim(r1(dimX + 20), r1(Y(0)), r1(Y(H + rise)), formatM(Math.round((H + rise) * 100) / 100)));
  out.push(`<g class="dw-dim" stroke="currentColor" stroke-opacity="0.7" stroke-width="0.8" fill="none" font-size="10">${dims.join('')}</g>`);

  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="dw-svg" font-family="inherit" font-size="11" role="img" aria-label="${title}">${out.join('')}</svg>`;
}

/** The plan seen from above: front at the bottom, venstre to the left. */
export function renderPlan(b: Building, highlight: Set<string> = new Set()): string | null {
  if (!pos(b.length_m) || !pos(b.width_m)) return null;
  const Lm = b.length_m;
  const Wm = b.width_m;
  const c = colors(b);
  const scale = Math.min((VIEW_W - 100) / Lm, (VIEW_H - 100) / Wm);
  const w = Lm * scale;
  const h = Wm * scale;
  const x0 = (VIEW_W - w) / 2;
  const y0 = (VIEW_H - h) / 2 + 4;
  const t = Math.max(3, 0.2 * scale);
  const out: string[] = [`<text x="${VIEW_W / 2}" y="18" text-anchor="middle" font-weight="600" fill="currentColor">Plan</text>`];
  out.push(`<rect x="${r1(x0)}" y="${r1(y0)}" width="${r1(w)}" height="${r1(h)}" fill="#ffffff" fill-opacity="0.6" stroke="${c.trim}" stroke-width="${r1(t)}"/>`);

  // The ridge (dashed) or the fall direction, from the roof object only.
  const roof = b.roof;
  if (roof && (roof.kind === 'saltak' || roof.kind === 'valm')) {
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
  } else if (roof && roof.kind === 'pulttak') {
    const alongL = roof.ridge_along !== 'bredde';
    // High at the venstre end (lengde) or at the front (bredde); the arrow points downhill.
    const [ax1, ay1, ax2, ay2] = alongL ? [x0 + w * 0.3, y0 + h / 2, x0 + w * 0.7, y0 + h / 2] : [x0 + w / 2, y0 + h * 0.7, x0 + w / 2, y0 + h * 0.3];
    const head = alongL ? `${r1(ax2)},${r1(ay2)} ${r1(ax2 - 7)},${r1(ay2 - 4)} ${r1(ax2 - 7)},${r1(ay2 + 4)}` : `${r1(ax2)},${r1(ay2)} ${r1(ax2 - 4)},${r1(ay2 + 7)} ${r1(ax2 + 4)},${r1(ay2 + 7)}`;
    out.push(`<line x1="${r1(ax1)}" y1="${r1(ay1)}" x2="${r1(ax2)}" y2="${r1(ay2)}" stroke="${c.roof}" stroke-width="1.5"/><polygon points="${head}" fill="${c.roof}"/>`);
    out.push(`<text x="${r1((ax1 + ax2) / 2)}" y="${r1((ay1 + ay2) / 2 - 6)}" text-anchor="middle" font-size="10" fill="currentColor">fall</text>`);
  }

  // Openings as gaps in the wall, measured from the left corner seen from outside that wall.
  for (const op of b.openings.filter((op) => isPlaced(op, b) && op.floor <= storeys(b))) {
    const off = op.offset_m! * scale;
    const ow = op.width_m! * scale;
    let rect: [number, number, number, number];
    switch (op.wall) {
      case 'front':
        rect = [x0 + off, y0 + h - t, ow, 2 * t];
        break;
      case 'bak':
        rect = [x0 + w - off - ow, y0 - t, ow, 2 * t];
        break;
      case 'venstre':
        rect = [x0 - t, y0 + off, 2 * t, ow];
        break;
      default:
        rect = [x0 + w - t, y0 + h - off - ow, 2 * t, ow];
    }
    out.push(
      `<g class="${cls('dw-open', op.id, highlight)}" data-id="${esc(op.id)}"><title>${esc(op.label)}</title><rect x="${r1(rect[0])}" y="${r1(rect[1])}" width="${r1(rect[2])}" height="${r1(rect[3])}" fill="${KIND_FILL[op.kind] ?? KIND_FILL.annet}" stroke="${c.trim}" stroke-width="1"/></g>`,
    );
  }

  const dims = [hDim(r1(x0), r1(x0 + w), r1(y0 + h + 30), formatM(Lm)), vDim(r1(x0 - 30), r1(y0 + h), r1(y0), formatM(Wm))];
  out.push(`<g stroke="currentColor" stroke-opacity="0.7" stroke-width="0.8" fill="none" font-size="10">${dims.join('')}</g>`);
  const lab = (x: number, y: number, s: string, anchor = 'middle') => `<text x="${r1(x)}" y="${r1(y)}" text-anchor="${anchor}" font-size="10" fill="currentColor" fill-opacity="0.75">${s}</text>`;
  out.push(lab(x0 + w / 2, y0 + h + 16, 'Front'), lab(x0 + w / 2, y0 - 9, 'Bak'), lab(x0 - 10, y0 - 9, 'Venstre', 'start'), lab(x0 + w + 10, y0 - 9, 'Høyre', 'end'));
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="dw-svg" font-family="inherit" font-size="11" role="img" aria-label="Plan">${out.join('')}</svg>`;
}

function swatch(name: string, c: string | null | undefined): string {
  const hex = hexColor(c);
  if (!c) return '';
  return `<span class="dw-swatch"><i style="background:${hex ?? GREY.wall}"></i>${esc(name)}${hex ? '' : ` <small>(${esc(c)} – vist grå)</small>`}</span>`;
}

/** The whole «Tegning» tab (and the report's drawing section). */
export function renderBuilding(b: Building, highlight: Set<string> = new Set()): string {
  if (!pos(b.length_m) && !pos(b.width_m) && b.openings.length === 0 && !b.roof) {
    return `<p class="empty">Tegningen kommer når størrelsen er avklart. Fortell for eksempel «ca. 8 × 7 meter» i dialogen.</p>`;
  }
  const area = pos(b.length_m) && pos(b.width_m) ? `${formatNum(Math.round(b.length_m * b.width_m * 10) / 10)} m²` : '–';
  const ex = b.exterior;
  const notes: string[] = [];
  if (!pos(b.floor_height_m)) notes.push(`Etasjehøyden er ikke avklart – veggene er tegnet med ${formatM(DEFAULT_FLOOR_H)}.`);
  if (b.roof && !ok(b.roof.pitch_deg) && b.roof.kind !== 'flatt' && b.roof.kind !== 'annet') notes.push(`Takvinkelen er ikke avklart – taket er tegnet med ${DEFAULT_PITCH}°.`);
  if (b.roof?.kind === 'annet') notes.push('Taktypen er «annet» og vises bare som en enkel takkant.');
  if (b.roof?.kind === 'pulttak') notes.push('Pulttaket er tegnet høyest i venstre ende (fall langs lengden) eller foran (fall langs bredden).');
  const F = storeys(b);
  const loft = b.openings.filter((o) => o.floor === F + 1 && isPlaced(o, b));
  if (loft.some((o) => loftKind(b.roof, o.wall) === 'plane')) notes.push('Takvinduer er tegnet i takflaten sett rett forfra, så høyden ser kortere ut enn den er.');
  if (loft.length) notes.push('Loftsåpninger vises bare på fasadene, ikke i planen.');
  const floorText = (o: Opening) => (!ok(o.floor) ? '–' : o.floor === F + 1 && b.roof && loftKind(b.roof, o.wall) ? 'Loft' : formatNum(o.floor));

  const svgs = WALLS.map((w) => renderElevation(b, w.id, highlight)).filter((s): s is string => s !== null);
  const plan = renderPlan(b, highlight);
  const drawings = svgs.length
    ? `<div class="dw-grid">${[...svgs, plan ?? ''].map((s) => `<figure class="dw-fig">${s}</figure>`).join('')}</div>`
    : `<p class="empty">Fasadene tegnes når både lengde og bredde er avklart.</p>`;

  const unplaced = b.openings.filter((o) => !isPlaced(o, b) || !svgs.length);
  const unplacedHtml = unplaced.length
    ? `<section class="card dw-unplaced"><h3>Ikke plassert ennå</h3><p class="sub">Disse åpningene er med i prosjektet, men AI-en har ikke oppgitt nøyaktig plassering eller mål. De tegnes når det er avklart.</p><ul>${unplaced
        .map(
          (o) =>
            `<li class="${cls('dw-item', o.id, highlight)}" data-unplaced="${esc(o.id)}"><b>${esc(o.label)}</b> · ${label(KIND_LABEL, o.kind)} · ${label(WALL_LABEL, o.wall)} · ${unplacedReason(o, b) ?? 'Mangler lengde og bredde på bygget'}</li>`,
        )
        .join('')}</ul></section>`
    : '';

  const rows = b.openings
    .map(
      (o) =>
        `<tr class="${cls('dw-row', o.id, highlight)}" data-id="${esc(o.id)}"><td><b>${esc(o.label)}</b><div class="sub">${label(KIND_LABEL, o.kind)}</div></td><td>${label(WALL_LABEL, o.wall)}</td><td class="num">${floorText(o)}</td><td class="num">${formatM(o.width_m)} × ${formatM(o.height_m)}</td><td class="num">${isPlaced(o, b) ? `${formatM(o.offset_m)} / ${formatM(o.sill_m)}` : '<span class="sub">Ikke plassert</span>'}</td></tr>`,
    )
    .join('');
  const swatches = [swatch('Vegg', ex?.wall_color), swatch('Tak', ex?.roof_color), swatch('Detaljer', ex?.trim_color)].join('');

  return `<div class="kpis">
      <div class="kpi"><span>Lengde × bredde</span><b>${formatM(b.length_m)} × ${formatM(b.width_m)}</b><small>Grunnflate ${area}</small></div>
      <div class="kpi"><span>Etasjer</span><b>${pos(b.floors) ? formatNum(b.floors) : '–'}</b><small>Etasjehøyde ${formatM(b.floor_height_m)}</small></div>
      <div class="kpi"><span>Tak</span><b>${roofText(b.roof)}</b>${b.roof && ok(b.roof.overhang_m) ? `<small>Utstikk ${formatM(b.roof.overhang_m)}</small>` : ''}</div>
      <div class="kpi"><span>Åpninger</span><b>${b.openings.length}</b><small>${b.openings.length - b.openings.filter((o) => isPlaced(o, b)).length} ikke plassert</small></div>
    </div>
    ${ex && (ex.cladding || swatches) ? `<div class="dw-exterior">${ex.cladding ? `<span class="chip">${esc(ex.cladding)}</span>` : ''}${swatches}</div>` : ''}
    ${notes.map((n) => `<p class="note">${n}</p>`).join('')}
    ${drawings}
    ${unplacedHtml}
    ${rows ? `<div class="table-wrap"><table class="dw-table"><thead><tr><th>Åpning</th><th>Vegg</th><th class="num">Etg.</th><th class="num">B × H</th><th class="num">Fra hjørnet / over gulv</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}`;
}
