import type { Mode } from '../../engine/scenario';
import { formatFactor, formatInt, formatMnok } from '../format';
import { icon, type TabContext } from './context';

const MODES: [Mode, string, string][] = [
  ['normal', 'Normal', 'decisions/mode-normal.svg'],
  ['overtime', 'Overtid', 'decisions/mode-overtime.svg'],
  ['hire', 'Ekstra innleie', 'decisions/mode-hire.svg'],
];

export function renderDisciplines({ scenario, result }: TabContext): string {
  const f = scenario.factors;
  const rows = scenario.tasks.map((task, i) => {
    const t = result.tasks[i];
    const seg = MODES.map(([mode, label, ic]) =>
      `<button type="button" data-task="${task.id}" data-mode="${mode}" aria-pressed="${t.mode === mode}" title="${label}">${icon(ic, 16)}<span>${label}</span></button>`).join('');
    const crew = t.hiredCrew ? `${t.ownCrew} + ${t.hiredCrew}` : `${t.ownCrew}`;
    return `<tr>
      <td><div class="name">${icon(task.icon, 24)}<span><b>${task.id}</b> ${task.name}</span></div></td>
      <td class="num">${formatInt(task.hours)}</td>
      <td class="num">${crew}</td>
      <td class="num">${t.weeks}</td>
      <td><div class="seg" role="group" aria-label="Arbeidsmodus ${task.id}">${seg}</div></td>
      <td class="num">${formatMnok(t.labour)}</td>
      <td>${t.critical ? '<span class="chip chip-crit">Kritisk</span>' : `<span class="chip">Slakk ${t.slack} u</span>`}</td>
    </tr>`;
  });
  return `<p class="lead">Velg arbeidsmodus per disiplin. Kostfaktoren gjelder timene det gjelder: normaltid ${formatFactor(f.normal)}, overtidstimer ${formatFactor(f.overtime)}, innleide timer ${formatFactor(f.hire)}.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Disiplin</th><th class="num">Timer</th><th class="num">Mannskap</th><th class="num">Uker</th><th>Arbeidsmodus</th><th class="num">Arbeid MNOK</th><th>Status</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;
}
