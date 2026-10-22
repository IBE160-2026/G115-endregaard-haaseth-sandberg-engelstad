import { ganttSvg } from '../gantt';
import { criticalList, type TabContext } from './context';

export function renderSchedule({ scenario, result, baseline }: TabContext): string {
  return `<p class="lead">Prosjekttid <b>${result.weeks} uker</b> (plan ${baseline.weeks}). Kritiske aktiviteter: ${criticalList(result)}.</p>
    <div class="legend"><span><i class="sw sw-crit"></i>Kritisk</span><span><i class="sw sw-bar"></i>Har slakk</span><span><i class="sw sw-ghost"></i>Opprinnelig plan</span><span><i class="sw sw-start"></i>Rigg og drift fra uke ${scenario.overhead.fromWeek}</span></div>
    <div class="gantt-wrap">${ganttSvg(scenario, result, baseline)}</div>`;
}
