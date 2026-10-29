// The tabs. Each returns HTML for the current project; the AI's text is always escaped.
import { esc, formatNok } from '../format';
import { PHASES, type Phase, type Project } from '../types';
import { renderBuilding } from './building';
import { ganttSvg, projectWeeks } from './gantt';

export type TabId = 'oversikt' | 'bygget' | 'budsjett' | 'fremdrift';

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'oversikt', label: 'Oversikt', icon: 'disciplines.svg' },
  { id: 'bygget', label: 'Bygget', icon: 'buildings.svg' },
  { id: 'budsjett', label: 'Budsjett', icon: 'budget.svg' },
  { id: 'fremdrift', label: 'Fremdrift', icon: 'schedule.svg' },
];

export const iconUrl = (file: string) => `${import.meta.env.BASE_URL}icons/${file}`;

export const budgetTotal = (p: Project) => p.budget.reduce((sum, l) => sum + l.amount_nok, 0);

function phases(current: Phase): string {
  const at = PHASES.findIndex((p) => p.id === current);
  return `<ol class="phases">${PHASES.map(
    (p, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}">${p.label}</li>`,
  ).join('')}</ol>`;
}

function overview(p: Project, phase: Phase): string {
  const groups = new Map<string, Project['facts']>();
  for (const f of p.facts) groups.set(f.category, [...(groups.get(f.category) ?? []), f]);
  const facts = [...groups]
    .map(
      ([cat, list]) => `<section class="card"><h3>${esc(cat)}</h3><dl>${list
        .map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`)
        .join('')}</dl></section>`,
    )
    .join('');
  return `${phases(phase)}
    <header class="project-head">
      <h2>${esc(p.name || 'Nytt byggeprosjekt')}</h2>
      ${p.type ? `<span class="chip">${esc(p.type)}</span>` : ''}
      ${p.summary ? `<p>${esc(p.summary)}</p>` : '<p class="empty">Fortell i dialogen hva som skal bygges.</p>'}
    </header>
    <div class="kpis">
      <div class="kpi"><span>Avklarte punkter</span><b>${p.facts.length}</b></div>
      <div class="kpi"><span>Budsjett</span><b>${p.budget.length ? formatNok(budgetTotal(p)) : '–'}</b></div>
      <div class="kpi"><span>Byggetid</span><b>${p.schedule.length ? `${projectWeeks(p.schedule)} uker` : '–'}</b></div>
    </div>
    <div class="cards">${facts}</div>
    ${p.assumptions.length ? `<section class="card"><h3>Antakelser</h3><ul>${p.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></section>` : ''}`;
}

function budget(p: Project): string {
  if (!p.budget.length) return `<p class="empty">Budsjettet lages når størrelse, etasjer og åpninger er avklart.</p>`;
  const total = budgetTotal(p);
  const rows = p.budget
    .map((l) => {
      const share = total > 0 ? (l.amount_nok / total) * 100 : 0;
      return `<tr><td><b>${esc(l.post)}</b><div class="sub">${esc(l.description)}</div></td>
        <td class="share"><div class="bar" style="width:${share.toFixed(1)}%"></div></td>
        <td class="num">${formatNok(l.amount_nok)}</td></tr>`;
    })
    .join('');
  return `<div class="kpis"><div class="kpi"><span>Totalt (inkl. mva)</span><b>${formatNok(total)}</b><small>grovt overslag fra AI</small></div></div>
    <div class="table-wrap"><table><thead><tr><th>Post</th><th>Andel</th><th class="num">Beløp</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td><b>Sum</b></td><td></td><td class="num"><b>${formatNok(total)}</b></td></tr></tfoot></table></div>`;
}

function schedule(p: Project): string {
  if (!p.schedule.length) return `<p class="empty">Fremdriftsplanen lages sammen med budsjettet.</p>`;
  return `<div class="kpis"><div class="kpi"><span>Byggetid</span><b>${projectWeeks(p.schedule)} uker</b></div><div class="kpi"><span>Aktiviteter</span><b>${p.schedule.length}</b></div></div>
    <div class="gantt-wrap">${ganttSvg(p.schedule)}</div>`;
}

export function renderTab(tab: TabId, p: Project, phase: Phase): string {
  switch (tab) {
    case 'oversikt':
      return overview(p, phase);
    case 'bygget':
      return renderBuilding(p.building);
    case 'budsjett':
      return budget(p);
    case 'fremdrift':
      return schedule(p);
  }
}
