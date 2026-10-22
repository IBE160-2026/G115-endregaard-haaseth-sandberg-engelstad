import { budgetOf } from '../budgetLines';
import { formatDelta, formatMnok } from '../format';
import { icon, type TabContext } from './context';

const delta = (x: number) => (Math.abs(x) < 0.005 ? '' : formatDelta(x));

export function renderBudget({ scenario, result, baseline }: TabContext): string {
  const now = budgetOf(result);
  const plan = budgetOf(baseline);
  const rows = scenario.tasks.map((task, i) => {
    const l = now.lines[i];
    return `<tr>
      <td><div class="name">${icon(task.icon, 24)}<span><b>${task.id}</b> ${task.name}</span></div></td>
      <td class="num">${formatMnok(l.labour)}</td>
      <td class="num">${formatMnok(l.materials)}</td>
      <td class="num"><b>${formatMnok(l.cost)}</b></td>
      <td class="num delta">${delta(l.cost - plan.lines[i].cost)}</td>
    </tr>`;
  });
  const perWeek = formatMnok(scenario.overhead.perWeek);

  return `<div class="kpis">
      <div class="kpi"><span>Totalt</span><b>${formatMnok(now.total)}</b><small>MNOK eks. mva</small></div>
      <div class="kpi"><span>Endring mot plan</span><b>${formatDelta(now.total - plan.total)}</b><small>MNOK</small></div>
      <div class="kpi"><span>Prosjekttid</span><b>${result.weeks}</b><small>uker (plan ${baseline.weeks})</small></div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Post</th><th class="num">Arbeid</th><th class="num">Materiell og utstyr</th><th class="num">Sum</th><th class="num">Δ plan</th></tr></thead>
      <tbody>${rows.join('')}</tbody>
      <tfoot>
        <tr><td>Sum disipliner</td><td class="num">${formatMnok(now.labour)}</td><td class="num">${formatMnok(now.materials)}</td><td class="num">${formatMnok(now.tasks)}</td><td class="num delta">${delta(now.tasks - plan.tasks)}</td></tr>
        <tr><td>Rigg og drift (${result.overheadWeeks} uker × ${perWeek})</td><td></td><td></td><td class="num">${formatMnok(now.overhead)}</td><td class="num delta">${delta(now.overhead - plan.overhead)}</td></tr>
        <tr class="total"><td>Totalt</td><td></td><td></td><td class="num">${formatMnok(now.total)}</td><td class="num delta">${delta(now.total - plan.total)}</td></tr>
      </tfoot>
    </table></div>
    <p class="note">Alle beløp i millioner kroner (MNOK), prisnivå 2017, eks. mva. Hver linje er avrundet til hele øre, og summene er summen av linjene. Rigg og drift løper fra uke ${scenario.overhead.fromWeek} til prosjektet er ferdig.</p>`;
}
