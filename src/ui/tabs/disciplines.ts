import { formatFactor, formatInt, formatMnok } from '../format';
import { crewControl, modeControl } from './controls';
import { icon, type TabContext } from './context';

export function renderDisciplines({ scenario, result, game }: TabContext): string {
  const f = scenario.factors;
  const rows = scenario.tasks.map((task, i) => {
    const t = result.tasks[i];
    const st = game?.tasks[i];
    const locked = !game || game.done || st!.finish !== null;
    const share = st ? st.hoursDone / task.hours : 0;
    const status = st?.finish != null
      ? '<span class="chip chip-on">Ferdig</span>'
      : t.critical ? '<span class="chip chip-crit">Kritisk</span>' : `<span class="chip">Slakk ${t.slack} u</span>`;
    return `<tr>
      <td><div class="name">${icon(task.icon, 24)}<span><b>${task.id}</b> ${task.name}</span></div></td>
      <td class="num">${formatInt(task.hours)}</td>
      <td><div class="progress wide" title="${Math.round(share * 100)} %"><i style="width:${Math.round(share * 100)}%"></i></div></td>
      <td>${crewControl(scenario, task.id, t.ownCrew, locked)}${t.hiredCrew ? `<div class="meta">+ ${t.hiredCrew} innleid</div>` : ''}</td>
      <td>${modeControl(task.id, t.mode, locked)}</td>
      <td class="num">${t.weeks}</td>
      <td class="num">${formatMnok(t.labour)}</td>
      <td>${status}${st && st.stall > 0 ? ` <span class="chip chip-busy">Stans ${st.stall} u</span>` : ''}</td>
    </tr>`;
  });
  return `<p class="lead">Velg mannskap og arbeidsmodus per disiplin. Grunnbemanningen lønner seg: for få gir lengre tid (rigg og drift løper), for mange går i veien for hverandre (hver ekstra arbeider gir ${formatFactor(scenario.crowdingProductivity)} av en full). Kostfaktor: normaltid ${formatFactor(f.normal)}, overtidstimer ${formatFactor(f.overtime)}, innleide timer ${formatFactor(f.hire)}.</p>
    <div class="table-wrap"><table>
      <thead><tr><th>Disiplin</th><th class="num">Timer</th><th>Framdrift</th><th>Mannskap</th><th>Arbeidsmodus</th><th class="num">Uker</th><th class="num">Arbeid MNOK</th><th>Status</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
    </table></div>`;
}
