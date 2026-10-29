// Generates the Gantt chart as an SVG string from a simulation result.
import type { Scenario } from '../engine/scenario';
import type { SimulationResult } from '../engine/simulate';
import { iconUrl } from './tabs/context';

const LABEL_W = 230;
const PX_PER_WEEK = 6;
const ROW_H = 30;
const TOP = 34;
const MODE_LABEL = { normal: '', overtime: 'Overtid', hire: 'Ekstra innleie' } as const;

export function ganttSvg(s: Scenario, r: SimulationResult, baseline: SimulationResult, week?: number): string {
  const maxWeeks = Math.max(r.weeks, baseline.weeks);
  const chartW = Math.ceil(maxWeeks / 10) * 10 * PX_PER_WEEK;
  const width = LABEL_W + chartW + 80;
  const rows = s.tasks.length + 1; // + milestone row
  const height = TOP + rows * ROW_H + 12;
  const x = (week: number) => LABEL_W + week * PX_PER_WEEK;

  const parts: string[] = [];

  // Week axis and grid.
  for (let w = 0; w <= maxWeeks + 9; w += 10) {
    parts.push(`<line x1="${x(w)}" y1="${TOP - 6}" x2="${x(w)}" y2="${height - 8}" class="g-grid"/>`);
    parts.push(`<text x="${x(w)}" y="${TOP - 12}" class="g-axis" text-anchor="middle">Uke ${w}</text>`);
  }
  parts.push(`<line x1="${x(s.overhead.fromWeek)}" y1="${TOP - 6}" x2="${x(s.overhead.fromWeek)}" y2="${height - 8}" class="g-start"/>`);

  s.tasks.forEach((task, i) => {
    const t = r.tasks[i];
    const b = baseline.tasks[i];
    const y = TOP + i * ROW_H;
    if (i % 2 === 0) parts.push(`<rect x="0" y="${y}" width="${width}" height="${ROW_H}" class="g-stripe"/>`);
    parts.push(`<image href="${iconUrl(task.icon)}" x="8" y="${y + 5}" width="20" height="20"/>`);
    parts.push(`<text x="36" y="${y + 19}" class="g-label"><tspan class="g-id">${task.id}</tspan> ${task.name}</text>`);

    // Baseline position as a dashed outline when this run differs from it.
    if (b.start !== t.start || b.weeks !== t.weeks) {
      parts.push(`<rect x="${x(b.start)}" y="${y + 6}" width="${b.weeks * PX_PER_WEEK}" height="${ROW_H - 12}" rx="4" class="g-ghost"/>`);
    }
    parts.push(`<rect x="${x(t.start)}" y="${y + 6}" width="${t.weeks * PX_PER_WEEK}" height="${ROW_H - 12}" rx="4" class="${t.critical ? 'g-bar g-critical' : 'g-bar'}"><title>${task.id} ${task.name}: uke ${t.start}–${t.finish} (${t.weeks} uker)${t.critical ? ', kritisk' : `, slakk ${t.slack} uker`}</title></rect>`);
    // Done part of the bar, up to the current week.
    if (week !== undefined && week > t.start) {
      const doneTo = Math.min(week, t.finish);
      parts.push(`<rect x="${x(t.start)}" y="${y + 6}" width="${(doneTo - t.start) * PX_PER_WEEK}" height="${ROW_H - 12}" rx="4" class="g-done"/>`);
    }
    if (t.weeks * PX_PER_WEEK >= 34) {
      parts.push(`<text x="${x(t.start) + 6}" y="${y + 19}" class="g-bar-text">${t.weeks} u</text>`);
    }
    const mode = MODE_LABEL[t.mode];
    // Placed after the outline as well, so the two never overlap.
    if (mode) parts.push(`<text x="${x(Math.max(t.finish, b.finish)) + 6}" y="${y + 19}" class="g-mode">${mode}</text>`);
  });

  if (week !== undefined) {
    parts.push(`<line x1="${x(week)}" y1="${TOP - 6}" x2="${x(week)}" y2="${height - 8}" class="g-today"/>`);
    parts.push(`<text x="${x(week) + 4}" y="${height - 12}" class="g-axis">I dag</text>`);
  }

  // Handover milestone.
  const my = TOP + s.tasks.length * ROW_H;
  const cx = x(r.weeks);
  const cy = my + ROW_H / 2;
  parts.push(`<image href="${iconUrl('schedule/milestone.svg')}" x="8" y="${my + 5}" width="20" height="20"/>`);
  parts.push(`<text x="36" y="${my + 19}" class="g-label">Ferdigstillelse – uke ${r.weeks}</text>`);
  parts.push(`<line x1="${cx}" y1="${TOP}" x2="${cx}" y2="${my}" class="g-finish"/>`);
  parts.push(`<path d="M${cx} ${cy - 8} L${cx + 8} ${cy} L${cx} ${cy + 8} L${cx - 8} ${cy} Z" class="g-milestone"/>`);

  // Scales to the container width (CSS sets a minimum so labels stay readable).
  return `<svg class="gantt" viewBox="0 0 ${width} ${height}" role="img" aria-label="Gantt-diagram, ${r.weeks} uker">${parts.join('')}</svg>`;
}
