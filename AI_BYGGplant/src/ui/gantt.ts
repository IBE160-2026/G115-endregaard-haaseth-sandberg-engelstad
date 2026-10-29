// The AI's schedule as a Gantt chart (SVG), in the same look as ByggAPP's.
import { esc } from '../format';
import type { Task } from '../types';

const LABEL_W = 220;
const ROW_H = 30;
const TOP = 34;

export const projectWeeks = (tasks: Task[]) => Math.max(0, ...tasks.map((t) => t.start_week + t.duration_weeks));

export function ganttSvg(tasks: Task[]): string {
  const weeks = Math.max(1, Math.ceil(projectWeeks(tasks)));
  const pxPerWeek = Math.max(14, Math.min(48, 640 / weeks));
  const step = weeks <= 12 ? 1 : weeks <= 30 ? 2 : 5;
  const width = LABEL_W + weeks * pxPerWeek + 40;
  const height = TOP + tasks.length * ROW_H + 12;
  const x = (w: number) => LABEL_W + w * pxPerWeek;
  const parts: string[] = [];

  for (let w = 0; w <= weeks; w += step) {
    parts.push(`<line x1="${x(w)}" y1="${TOP - 6}" x2="${x(w)}" y2="${height - 8}" class="g-grid"/>`);
    parts.push(`<text x="${x(w)}" y="${TOP - 12}" class="g-axis" text-anchor="middle">Uke ${w}</text>`);
  }
  tasks.forEach((t, i) => {
    const y = TOP + i * ROW_H;
    if (i % 2 === 0) parts.push(`<rect x="0" y="${y}" width="${width}" height="${ROW_H}" class="g-stripe"/>`);
    parts.push(`<text x="10" y="${y + 19}" class="g-label">${esc(t.name)}</text>`);
    const after = t.depends_on.length ? `\nEtter: ${t.depends_on.map((id) => tasks.find((o) => o.id === id)?.name ?? id).join(', ')}` : '';
    parts.push(
      `<rect x="${x(t.start_week)}" y="${y + 6}" width="${Math.max(3, t.duration_weeks * pxPerWeek)}" height="${ROW_H - 12}" rx="4" class="g-bar"><title>${esc(t.name)}: uke ${t.start_week}–${t.start_week + t.duration_weeks}${esc(after)}</title></rect>`,
    );
  });
  return `<svg class="gantt" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Fremdriftsplan">${parts.join('')}</svg>`;
}
