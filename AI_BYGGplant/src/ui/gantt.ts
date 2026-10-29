// The AI's schedule as a Gantt chart (SVG) with thin dependency connectors. Owner: WS4.
// Colours are SVG attributes, so the chart prints without a stylesheet; the glow needs TAB_CSS.
import { esc, formatNum } from '../format';
import type { Task } from '../types';

const LABEL_W = 210;
const ROW_H = 30;
const TOP = 34;
const BAR = '#6d9fe0';
const LINK = '#8a8f98';

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

/** The week the last task ends (0 for no tasks). */
export const projectWeeks = (tasks: Task[]) => Math.max(0, ...tasks.map((t) => num(t.start_week) + Math.max(0, num(t.duration_weeks))));

const short = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function ganttSvg(tasks: Task[], highlight: Set<string> = new Set()): string {
  const weeks = Math.max(1, Math.ceil(projectWeeks(tasks)));
  const pxPerWeek = Math.max(14, Math.min(48, 640 / weeks));
  const step = weeks <= 12 ? 1 : weeks <= 30 ? 2 : 5;
  const width = Math.round(LABEL_W + weeks * pxPerWeek + 40);
  const height = TOP + tasks.length * ROW_H + 12;
  const x = (w: number) => Math.round((LABEL_W + Math.max(0, w) * pxPerWeek) * 10) / 10;
  const row = new Map(tasks.map((t, i) => [t.id, i]));
  const parts: string[] = [];

  tasks.forEach((_, i) => {
    if (i % 2 === 0) parts.push(`<rect x="0" y="${TOP + i * ROW_H}" width="${width}" height="${ROW_H}" fill="currentColor" fill-opacity="0.035"/>`);
  });
  for (let w = 0; w <= weeks; w += step) {
    parts.push(`<line x1="${x(w)}" y1="${TOP - 6}" x2="${x(w)}" y2="${height - 8}" stroke="currentColor" stroke-opacity="0.1"/>`);
    parts.push(`<text x="${x(w)}" y="${TOP - 12}" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.7">Uke ${w}</text>`);
  }

  // Connectors: from the end of each prerequisite to the start of the task that waits for it.
  tasks.forEach((t, i) => {
    for (const dep of t.depends_on ?? []) {
      const j = row.get(dep);
      if (j === undefined) continue;
      const d = tasks[j];
      const x1 = x(num(d.start_week) + Math.max(0, num(d.duration_weeks)));
      const y1 = TOP + j * ROW_H + ROW_H / 2;
      const x2 = x(num(t.start_week));
      const y2 = TOP + i * ROW_H + ROW_H / 2;
      const yTip = y2 + (y2 > y1 ? -ROW_H / 2 + 6 : ROW_H / 2 - 6);
      const elbow = Math.max(x1 + 6, x2 - 4);
      const dir = y2 > y1 ? 1 : -1;
      parts.push(
        `<path class="gt-link" data-from="${esc(dep)}" data-to="${esc(t.id)}" d="M${x1},${y1} H${elbow} V${yTip}" fill="none" stroke="${LINK}" stroke-width="1"/><polygon points="${elbow},${yTip} ${elbow - 3},${yTip - 5 * dir} ${elbow + 3},${yTip - 5 * dir}" fill="${LINK}"/>`,
      );
    }
  });

  tasks.forEach((t, i) => {
    const y = TOP + i * ROW_H;
    const name = String(t.name ?? '');
    parts.push(`<text x="10" y="${y + 19}" font-size="12" fill="currentColor">${esc(short(name))}</text>`);
    const after = (t.depends_on ?? []).length ? `\nEtter: ${t.depends_on.map((id) => tasks.find((o) => o.id === id)?.name ?? id).join(', ')}` : '';
    const start = num(t.start_week);
    const dur = Math.max(0, num(t.duration_weeks));
    parts.push(
      `<g class="gt-bar${highlight.has(t.id) ? ' glow' : ''}" data-id="${esc(t.id)}"><title>${esc(name)}: uke ${formatNum(start)}–${formatNum(start + dur)}${esc(after)}</title><rect x="${x(start)}" y="${y + 7}" width="${Math.max(3, Math.round(dur * pxPerWeek * 10) / 10)}" height="${ROW_H - 14}" rx="4" fill="${BAR}"/></g>`,
    );
  });
  return `<svg class="gantt gt-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="inherit" role="img" aria-label="Fremdriftsplan">${parts.join('')}</svg>`;
}
