// Draws the building the AI has described: four elevations and a plan, as SVG.
// Missing measures get drawing defaults only, so the picture never invents facts in the data.
import { esc, formatM } from '../format';
import type { Building, Opening, OpeningKind, Wall } from '../types';

const DEFAULT_SIZE: Record<OpeningKind, [number, number]> = {
  dor: [1.0, 2.1],
  vindu: [1.2, 1.2],
  port: [2.5, 2.2],
  annet: [1.0, 1.0],
};
const SILL: Record<OpeningKind, number> = { dor: 0, vindu: 0.9, port: 0, annet: 0.9 };
const VIEW_W = 300;
const VIEW_H = 220;

export interface PlacedOpening {
  kind: OpeningKind;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Spreads the openings on one wall evenly along it, floor by floor (metres, y from the ground). */
export function placeOpenings(openings: Opening[], wallLength: number, floorHeight: number): PlacedOpening[] {
  const byFloor = new Map<number, Opening[]>();
  for (const o of openings) {
    const floor = Math.max(1, o.floor || 1);
    for (let i = 0; i < Math.max(0, Math.min(o.count, 40)); i++) byFloor.set(floor, [...(byFloor.get(floor) ?? []), o]);
  }
  const placed: PlacedOpening[] = [];
  for (const [floor, list] of byFloor) {
    const gap = wallLength / (list.length + 1);
    list.forEach((o, i) => {
      const [dw, dh] = DEFAULT_SIZE[o.kind];
      const w = Math.min(o.width_m ?? dw, gap * 0.9, wallLength * 0.9);
      const h = Math.min(o.height_m ?? dh, floorHeight * 0.95);
      const sill = Math.min(SILL[o.kind], floorHeight - h);
      placed.push({ kind: o.kind, label: o.label, x: gap * (i + 1) - w / 2, y: (floor - 1) * floorHeight + sill, w, h });
    });
  }
  return placed;
}

const roofKind = (roof: string | null) => {
  const r = (roof ?? '').toLowerCase();
  if (r.includes('sal')) return 'saltak';
  if (r.includes('pult')) return 'pulttak';
  return 'flatt';
};

function elevation(title: string, b: Building, wall: Wall, wallLength: number, depth: number): string {
  const floors = Math.max(1, b.floors ?? 1);
  const fh = b.floor_height_m ?? 2.7;
  const height = floors * fh;
  const roof = roofKind(b.roof);
  // A gable (saltak) shows as a triangle on the short walls and a low band on the long ones.
  const gableHere = roof === 'saltak' && (wall === 'venstre' || wall === 'hoyre');
  const roofH = roof === 'saltak' ? Math.max(1.2, depth * 0.35) : roof === 'pulttak' ? Math.max(0.6, depth * 0.15) : 0.3;
  const scale = Math.min((VIEW_W - 40) / wallLength, (VIEW_H - 50) / (height + roofH));
  const x0 = (VIEW_W - wallLength * scale) / 2;
  const ground = VIEW_H - 24;
  const X = (m: number) => x0 + m * scale;
  const Y = (m: number) => ground - m * scale;

  const parts = [`<text x="${VIEW_W / 2}" y="16" class="b-title" text-anchor="middle">${title}</text>`];
  parts.push(`<line x1="8" y1="${ground}" x2="${VIEW_W - 8}" y2="${ground}" class="b-ground"/>`);
  parts.push(`<rect x="${X(0)}" y="${Y(height)}" width="${wallLength * scale}" height="${height * scale}" class="b-wall"/>`);
  for (let f = 1; f < floors; f++) parts.push(`<line x1="${X(0)}" y1="${Y(f * fh)}" x2="${X(wallLength)}" y2="${Y(f * fh)}" class="b-floor"/>`);

  if (gableHere) {
    parts.push(`<polygon points="${X(0)},${Y(height)} ${X(wallLength / 2)},${Y(height + roofH)} ${X(wallLength)},${Y(height)}" class="b-roof"/>`);
  } else if (roof === 'pulttak' && (wall === 'venstre' || wall === 'hoyre')) {
    parts.push(`<polygon points="${X(0)},${Y(height)} ${X(0)},${Y(height + roofH)} ${X(wallLength)},${Y(height)}" class="b-roof"/>`);
  } else {
    const band = roof === 'saltak' ? roofH : roof === 'pulttak' ? roofH / 2 : 0.3;
    parts.push(`<rect x="${X(-0.2)}" y="${Y(height + band)}" width="${(wallLength + 0.4) * scale}" height="${band * scale}" class="b-roof"/>`);
  }

  // Openings the AI did not place on a wall are drawn on the front.
  const here = b.openings.filter((o) => o.wall === wall || (wall === 'front' && o.wall === 'ukjent'));
  for (const p of placeOpenings(here, wallLength, fh)) {
    parts.push(
      `<rect x="${X(p.x)}" y="${Y(p.y + p.h)}" width="${p.w * scale}" height="${p.h * scale}" class="b-${p.kind}"><title>${esc(p.label)}</title></rect>`,
    );
  }
  parts.push(`<text x="${VIEW_W / 2}" y="${VIEW_H - 6}" class="b-dim" text-anchor="middle">${formatM(wallLength)}</text>`);
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="elevation" role="img" aria-label="${title}">${parts.join('')}</svg>`;
}

function plan(b: Building, length: number, width: number): string {
  const scale = Math.min((VIEW_W - 60) / length, (VIEW_H - 60) / width);
  const w = length * scale;
  const h = width * scale;
  const x0 = (VIEW_W - w) / 2;
  const y0 = (VIEW_H - h) / 2 + 6;
  const count = (wall: Wall) => b.openings.filter((o) => o.wall === wall).reduce((n, o) => n + o.count, 0);
  return `<svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="elevation" role="img" aria-label="Plan">
    <text x="${VIEW_W / 2}" y="16" class="b-title" text-anchor="middle">Plan</text>
    <rect x="${x0}" y="${y0}" width="${w}" height="${h}" class="b-wall"/>
    <text x="${VIEW_W / 2}" y="${y0 + h + 16}" class="b-dim" text-anchor="middle">Front · ${formatM(length)} · ${count('front') + count('ukjent')} åpn.</text>
    <text x="${VIEW_W / 2}" y="${y0 - 6}" class="b-dim" text-anchor="middle">Bak · ${count('bak')} åpn.</text>
    <text x="${x0 - 6}" y="${y0 + h / 2}" class="b-dim" text-anchor="end">${formatM(width)}</text>
    <text x="${VIEW_W / 2}" y="${y0 + h / 2 + 4}" class="b-dim" text-anchor="middle">${b.floors ?? '?'} etg.</text>
  </svg>`;
}

export function renderBuilding(b: Building): string {
  if (b.length_m == null && b.width_m == null && b.floors == null && b.openings.length === 0) {
    return `<p class="empty">Bygget tegnes her når størrelsen er avklart i dialogen.</p>`;
  }
  const length = b.length_m ?? 8;
  const width = b.width_m ?? 6;
  const guessed = b.length_m == null || b.width_m == null;
  const rows = b.openings
    .map(
      (o) => `<tr><td>${esc(o.label)}</td><td class="num">${o.count}</td><td>${formatM(o.width_m)} × ${formatM(o.height_m)}</td><td>${esc(o.wall)}</td><td class="num">${o.floor}</td></tr>`,
    )
    .join('');
  return `<div class="kpis">
      <div class="kpi"><span>Lengde × bredde</span><b>${formatM(b.length_m)} × ${formatM(b.width_m)}</b></div>
      <div class="kpi"><span>Etasjer</span><b>${b.floors ?? '–'}</b></div>
      <div class="kpi"><span>Grunnflate</span><b>${b.length_m && b.width_m ? `${Math.round(b.length_m * b.width_m)} m²` : '–'}</b></div>
      <div class="kpi"><span>Tak</span><b>${esc(b.roof ?? '–')}</b></div>
    </div>
    ${guessed ? '<p class="note">Mål som ikke er avklart ennå er tegnet med standardmål.</p>' : ''}
    <div class="elevations">
      ${elevation('Fasade front', b, 'front', length, width)}
      ${elevation('Fasade bak', b, 'bak', length, width)}
      ${elevation('Fasade venstre', b, 'venstre', width, length)}
      ${elevation('Fasade høyre', b, 'hoyre', width, length)}
      ${plan(b, length, width)}
    </div>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th>Åpning</th><th class="num">Antall</th><th>B × H</th><th>Vegg</th><th class="num">Etg.</th></tr></thead><tbody>${rows}</tbody></table></div>` : ''}`;
}
