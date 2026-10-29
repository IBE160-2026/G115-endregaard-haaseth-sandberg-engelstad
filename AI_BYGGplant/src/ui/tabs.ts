// The tabs and the report. Each returns HTML for the current session; the AI's text is always escaped.
import { budgetRange, budgetTotal, riskTotal } from '../budget';
import { esc, formatNok } from '../format';
import type { Session } from '../session';
import { PHASES, type Level, type Phase, type Project } from '../types';
import { renderBuilding } from './building';
import { ganttSvg, projectWeeks } from './gantt';

export type TabId = 'oversikt' | 'bygget' | 'budsjett' | 'fremdrift' | 'risiko' | 'endringer';

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'oversikt', label: 'Oversikt', icon: 'disciplines.svg' },
  { id: 'bygget', label: 'Bygget', icon: 'buildings.svg' },
  { id: 'budsjett', label: 'Budsjett', icon: 'budget.svg' },
  { id: 'fremdrift', label: 'Fremdrift', icon: 'schedule.svg' },
  { id: 'risiko', label: 'Risiko', icon: 'risks.svg' },
  { id: 'endringer', label: 'Endringer', icon: 'changes.svg' },
];

export const iconUrl = (file: string) => `${import.meta.env.BASE_URL}icons/${file}`;

const LEVEL: Record<Level, string> = { lav: 'Lav', middels: 'Middels', hoy: 'Høy' };

const range = (p: Project) => {
  const [low, high] = budgetRange(p);
  return `${formatNok(low)} – ${formatNok(high)}`;
};

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
      <div class="kpi"><span>Budsjett</span><b>${p.budget.length ? formatNok(budgetTotal(p)) : '–'}</b>${p.budget.length ? `<small>${range(p)}</small>` : ''}</div>
      <div class="kpi"><span>Byggetid</span><b>${p.schedule.length ? `${projectWeeks(p.schedule)} uker` : '–'}</b></div>
      <div class="kpi"><span>Risikoer</span><b>${p.risks.length || '–'}</b></div>
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
        <td class="num">± ${Math.round(l.uncertainty_pct)} %</td>
        <td class="num">${formatNok(l.amount_nok)}</td></tr>`;
    })
    .join('');
  return `<div class="kpis">
      <div class="kpi"><span>Totalt (inkl. mva)</span><b>${formatNok(total)}</b><small>grovt overslag fra AI</small></div>
      <div class="kpi"><span>Spenn</span><b>${range(p)}</b><small>fra usikkerheten per post</small></div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Post</th><th>Andel</th><th class="num">Usikkerhet</th><th class="num">Beløp</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td><b>Sum</b></td><td></td><td></td><td class="num"><b>${formatNok(total)}</b></td></tr></tfoot></table></div>`;
}

function schedule(p: Project): string {
  if (!p.schedule.length) return `<p class="empty">Fremdriftsplanen lages sammen med budsjettet.</p>`;
  return `<div class="kpis"><div class="kpi"><span>Byggetid</span><b>${projectWeeks(p.schedule)} uker</b></div><div class="kpi"><span>Aktiviteter</span><b>${p.schedule.length}</b></div></div>
    <div class="gantt-wrap">${ganttSvg(p.schedule)}</div>`;
}

function risks(p: Project): string {
  if (!p.risks.length) return `<p class="empty">Risikoene kommer sammen med budsjettet.</p>`;
  const order: Level[] = ['hoy', 'middels', 'lav'];
  const sorted = [...p.risks].sort((a, b) => order.indexOf(a.probability) - order.indexOf(b.probability));
  const rows = sorted
    .map(
      (r) => `<tr><td><b>${esc(r.title)}</b><div class="sub">${esc(r.consequence)}</div></td>
        <td><span class="level level-${r.probability}">${LEVEL[r.probability] ?? esc(r.probability)}</span></td>
        <td>${esc(r.measure)}</td>
        <td class="num">${formatNok(r.cost_nok)}</td></tr>`,
    )
    .join('');
  return `<div class="kpis">
      <div class="kpi"><span>Risikoer</span><b>${p.risks.length}</b><small>${p.risks.filter((r) => r.probability === 'hoy').length} med høy sannsynlighet</small></div>
      <div class="kpi"><span>Hvis alle inntreffer</span><b>${formatNok(riskTotal(p))}</b><small>i tillegg til budsjettet</small></div>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Risiko og konsekvens</th><th>Sannsynlighet</th><th>Tiltak</th><th class="num">Kostnad</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function changes(s: Session): string {
  if (!s.log.length) return `<p class="empty">Her vises hva hver runde i dialogen endret, og hva det gjorde med budsjettet.</p>`;
  return `<ol class="changelog">${[...s.log]
    .reverse()
    .map((c) => {
      const d = c.totalAfter - c.totalBefore;
      const delta = Math.abs(d) < 1 ? '' : `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : '−'}${formatNok(Math.abs(d))}</span>`;
      return `<li><div class="change-head"><b>Runde ${c.turn}</b>${delta}</div>
        <p class="sub">«${esc(c.request.length > 160 ? `${c.request.slice(0, 160)}…` : c.request)}»</p>
        <ul>${c.changes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></li>`;
    })
    .join('')}</ol>`;
}

export function renderTab(tab: TabId, s: Session): string {
  switch (tab) {
    case 'oversikt':
      return overview(s.project, s.phase);
    case 'bygget':
      return renderBuilding(s.project.building);
    case 'budsjett':
      return budget(s.project);
    case 'fremdrift':
      return schedule(s.project);
    case 'risiko':
      return risks(s.project);
    case 'endringer':
      return changes(s);
  }
}

/** The whole project on paper (the browser's print dialog saves it as PDF). */
export function renderReport(s: Session): string {
  const date = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<header class="report-head"><h1>${esc(s.project.name || 'Byggeprosjekt')}</h1><p>Prosjektrapport fra AI Byggplan · ${date}</p></header>
    ${TABS.map((t) => `<section class="report-section"><h2>${t.label}</h2>${renderTab(t.id, s)}</section>`).join('')}
    <p class="note">Tallene er et grovt overslag laget av AI og må kontrolleres av fagfolk før bestilling.</p>`;
}
