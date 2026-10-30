// The tabs next to the 3D view. Each returns HTML for the current session; the AI's text is always
// escaped. Items whose id is in `highlight` get the class "glow" (styled by TAB_CSS). Owner: WS4.
//
// CSS: the shell (WS3) injects TAB_CSS once, e.g.
//   document.head.insertAdjacentHTML('beforeend', `<style>${TAB_CSS}</style>`)
// It only adds classes the tabs introduce (glow, ref buttons, SKU chips, drawing grid ...); the
// shared look (.kpis, .card, .chip, .table-wrap, .phases, .changelog, .empty, .note) stays in styles.css.
// Clicks: every `[data-ref]` button in «Endringer» carries the id the shell should make glow.
import { budgetRange, budgetTotal, riskTotal } from '../budget';
import { esc, formatDelta, formatNok, formatNum } from '../format';
import type { Session } from '../session';
import { PHASES, type Level, type Phase, type Project, type Section } from '../types';
import { buildingFigures, renderBuilding, roofText, volumesCard } from './building';
import { ganttSvg, projectWeeks } from './gantt';

export type TabId = 'oversikt' | 'tegning' | 'budsjett' | 'fremdrift' | 'risiko' | 'endringer';

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'oversikt', label: 'Oversikt', icon: 'disciplines.svg' },
  { id: 'tegning', label: 'Tegning', icon: 'buildings.svg' },
  { id: 'budsjett', label: 'Budsjett', icon: 'budget.svg' },
  { id: 'fremdrift', label: 'Fremdrift', icon: 'schedule.svg' },
  { id: 'risiko', label: 'Risiko', icon: 'risks.svg' },
  { id: 'endringer', label: 'Endringer', icon: 'changes.svg' },
];

/** assets/icons/<file> as served (publicDir is assets/). */
export const iconUrl = (file: string) => `${import.meta.env.BASE_URL}icons/${file}`;

export const LEVEL: Record<Level, string> = { lav: 'Lav', middels: 'Middels', hoy: 'Høy' };
export const SECTION_LABEL: Record<Section, string> = {
  tomt: 'Tomt',
  bygg: 'Bygg',
  apninger: 'Åpninger',
  materialer: 'Materialer',
  budsjett: 'Budsjett',
  fremdrift: 'Fremdrift',
  risiko: 'Risiko',
  annet: 'Annet',
};
const LEVEL_ORDER: Level[] = ['hoy', 'middels', 'lav'];

const glow = (base: string, id: string, h: Set<string>) => `${base}${h.has(id) ? ' glow' : ''}`;
const levelLabel = (l: Level) => LEVEL[l] ?? esc(l);

export const rangeText = (p: Project) => {
  const [low, high] = budgetRange(p);
  return `${formatNok(low)} – ${formatNok(high)}`;
};

const rank = (l: Level) => (LEVEL_ORDER.includes(l) ? LEVEL_ORDER.indexOf(l) : LEVEL_ORDER.length);
/** Høy → middels → lav, then the most expensive first. */
export const sortRisks = (p: Project) => [...p.risks].sort((a, b) => rank(a.probability) - rank(b.probability) || b.cost_nok - a.cost_nok);

export function phaseStepper(current: Phase): string {
  const at = PHASES.findIndex((p) => p.id === current);
  return `<ol class="phases">${PHASES.map((p, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}">${p.label}</li>`).join('')}</ol>`;
}

/** The KPI row shared by Oversikt and the report. */
export function projectKpis(p: Project): string {
  const b = p.building;
  const fig = buildingFigures(b);
  const m2 = (n: number) => `${formatNum(Math.round(n * 10) / 10)} m²`;
  const size = fig.extent ? `${formatNum(fig.extent[0])} × ${formatNum(fig.extent[1])} m` : '–';
  const area = fig.footprint > 0 ? `Grunnflate ${m2(fig.footprint)} · BRA ca. ${m2(fig.gross)}` : 'ikke avklart';
  const volumes = fig.volumes === 1 ? '1 bygningskropp' : `${fig.volumes} bygningskropper`;
  const main = b.volumes[0];
  const high = p.risks.filter((r) => r.probability === 'hoy').length;
  return `<div class="kpis">
      <div class="kpi"><span>Størrelse</span><b>${size}</b><small>${area}</small></div>
      <div class="kpi"><span>Etasjer</span><b>${fig.floors ? `${formatNum(fig.floors)}${fig.basement ? ' + kjeller' : ''}` : '–'}</b><small>${fig.volumes ? `${volumes}${main?.roof ? ` · ${roofText(main.roof)}` : ''}` : 'ingen bygningskropp ennå'}</small></div>
      <div class="kpi"><span>Budsjett</span><b>${p.budget.length ? formatNok(budgetTotal(p)) : '–'}</b><small>${p.budget.length ? rangeText(p) : 'ikke laget ennå'}</small></div>
      <div class="kpi"><span>Byggetid</span><b>${p.schedule.length ? `${formatNum(projectWeeks(p.schedule))} uker` : '–'}</b><small>${p.schedule.length ? `${p.schedule.length} aktiviteter` : 'ikke planlagt ennå'}</small></div>
      <div class="kpi"><span>Risikoer</span><b>${p.risks.length || '–'}</b><small>${p.risks.length ? `${high} med høy sannsynlighet` : 'ikke vurdert ennå'}</small></div>
    </div>`;
}

export function factCards(p: Project): string {
  const groups = new Map<string, Project['facts']>();
  for (const f of p.facts) groups.set(f.category, [...(groups.get(f.category) ?? []), f]);
  return `<div class="cards">${[...groups]
    .map(([cat, list]) => `<section class="card"><h3>${esc(cat)}</h3><dl>${list.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd>`).join('')}</dl></section>`)
    .join('')}</div>`;
}

export const assumptionsList = (p: Project) => `<ul class="tb-assumptions">${p.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`;

function overview(s: Session, highlight: Set<string>): string {
  const p = s.project;
  return `${phaseStepper(s.phase)}
    <header class="project-head">
      <h2>${esc(p.name || 'Nytt byggeprosjekt')}</h2>
      ${p.type ? `<span class="chip">${esc(p.type)}</span>` : ''}
      ${p.summary ? `<p>${esc(p.summary)}</p>` : '<p class="empty">Fortell i dialogen hva som skal bygges, for eksempel «dobbelgarasje med loft».</p>'}
    </header>
    ${projectKpis(p)}
    ${volumesCard(p.building, highlight)}
    ${p.facts.length ? factCards(p) : '<p class="empty">Det AI-en har avklart om tomt, bygg og materialer samles her.</p>'}
    ${p.assumptions.length ? `<section class="card"><h3>Antakelser</h3>${assumptionsList(p)}</section>` : ''}`;
}

export function budgetTable(p: Project, highlight: Set<string> = new Set()): string {
  const total = budgetTotal(p);
  const rows = p.budget
    .map((l) => {
      const share = total > 0 ? Math.max(0, (l.amount_nok / total) * 100) : 0;
      const sku = l.sku != null && l.sku !== '' ? ` <span class="tb-sku" title="Varenummer">${esc(l.sku)}</span>` : '';
      return `<tr class="${glow('tb-row', l.id, highlight)}" data-id="${esc(l.id)}"><td><b>${esc(l.post)}</b>${sku}<div class="sub">${esc(l.description)}</div></td>
        <td class="share"><div class="tb-share"><i style="width:${share.toFixed(1)}%"></i></div><small>${formatNum(Math.round(share))} %</small></td>
        <td class="num">± ${formatNum(Math.round(l.uncertainty_pct ?? 0))} %</td>
        <td class="num">${formatNok(l.amount_nok)}</td></tr>`;
    })
    .join('');
  return `<div class="table-wrap"><table class="tb-budget"><thead><tr><th>Post</th><th>Andel</th><th class="num">Usikkerhet</th><th class="num">Beløp</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td><b>Sum</b></td><td></td><td class="num"><small>${rangeText(p)}</small></td><td class="num"><b>${formatNok(total)}</b></td></tr></tfoot></table></div>`;
}

function budget(p: Project, highlight: Set<string>): string {
  if (!p.budget.length) return `<p class="empty">Budsjettet lages når størrelse, etasjer og åpninger er avklart. Spør gjerne «hva vil dette koste?» i dialogen.</p>`;
  const skus = p.budget.filter((l) => l.sku != null && l.sku !== '').length;
  return `<div class="kpis">
      <div class="kpi"><span>Totalt (inkl. mva)</span><b>${formatNok(budgetTotal(p))}</b><small>grovt overslag fra AI</small></div>
      <div class="kpi"><span>Spenn</span><b>${rangeText(p)}</b><small>fra usikkerheten per post</small></div>
      <div class="kpi"><span>Poster</span><b>${p.budget.length}</b><small>${skus} med varenummer</small></div>
    </div>
    ${budgetTable(p, highlight)}`;
}

export function scheduleBody(p: Project, highlight: Set<string> = new Set()): string {
  return `<div class="gantt-wrap">${ganttSvg(p.schedule, highlight)}</div>`;
}

function schedule(p: Project, highlight: Set<string>): string {
  if (!p.schedule.length) return `<p class="empty">Fremdriftsplanen lages sammen med budsjettet, når bygget er avklart.</p>`;
  return `<div class="kpis"><div class="kpi"><span>Byggetid</span><b>${formatNum(projectWeeks(p.schedule))} uker</b></div><div class="kpi"><span>Aktiviteter</span><b>${p.schedule.length}</b><small>tynne linjer viser hva som må være ferdig først</small></div></div>
    ${scheduleBody(p, highlight)}`;
}

export function riskTable(p: Project, highlight: Set<string> = new Set()): string {
  const rows = sortRisks(p)
    .map(
      (r) => `<tr class="${glow('tb-row', r.id, highlight)}" data-id="${esc(r.id)}"><td><b>${esc(r.title)}</b><div class="sub">${esc(r.consequence)}</div></td>
        <td><span class="level level-${esc(r.probability)}">${levelLabel(r.probability)}</span></td>
        <td>${esc(r.measure)}</td>
        <td class="num">${formatNok(r.cost_nok)}</td></tr>`,
    )
    .join('');
  return `<div class="table-wrap"><table class="tb-risks"><thead><tr><th>Risiko og konsekvens</th><th>Sannsynlighet</th><th>Tiltak</th><th class="num">Kostnad</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function risks(p: Project, highlight: Set<string>): string {
  if (!p.risks.length) return `<p class="empty">Risikoene vurderes sammen med budsjettet. Spør gjerne «hva kan gå galt?» i dialogen.</p>`;
  return `<div class="kpis">
      <div class="kpi"><span>Risikoer</span><b>${p.risks.length}</b><small>${p.risks.filter((r) => r.probability === 'hoy').length} med høy sannsynlighet</small></div>
      <div class="kpi"><span>Hvis alle inntreffer</span><b>${formatNok(riskTotal(p))}</b><small>i tillegg til budsjettet</small></div>
    </div>
    ${riskTable(p, highlight)}`;
}

const deltaHtml = (d: number) => (Math.abs(d) < 1 ? '<span class="tb-delta">±0 kr</span>' : `<span class="tb-delta ${d > 0 ? 'up' : 'down'}">${formatDelta(d)}</span>`);

/** The change log, newest first. `interactive` renders ref buttons; the report passes false. */
export function changeLog(s: Session, interactive = true): string {
  return `<ol class="changelog">${[...s.log]
    .reverse()
    .map((c) => {
      const items = c.changes
        .map((x) => {
          const chip = `<span class="tb-sec tb-sec-${esc(x.section)}">${SECTION_LABEL[x.section] ?? esc(x.section)}</span>`;
          const text = esc(x.text);
          const body = x.ref_id && interactive ? `<button type="button" class="tb-ref" data-ref="${esc(x.ref_id)}" title="Vis i tegning og tabeller">${text}</button>` : text;
          return `<li>${chip} ${body}</li>`;
        })
        .join('');
      return `<li><div class="change-head"><b>Runde ${c.turn}</b>${deltaHtml(c.totalAfter - c.totalBefore)}</div>
        ${c.request ? `<p class="sub">«${esc(c.request.length > 200 ? `${c.request.slice(0, 200)}…` : c.request)}»</p>` : ''}
        <ul class="tb-changes">${items}</ul></li>`;
    })
    .join('')}</ol>`;
}

function changes(s: Session): string {
  if (!s.log.length) return `<p class="empty">Her vises hva hver runde i dialogen endret og hva det gjorde med budsjettet. Prøv for eksempel «gjør den én meter lengre».</p>`;
  return `<p class="note">Klikk på en endring med lenke for å se den lyse opp i 3D-modellen og tabellene.</p>${changeLog(s)}`;
}

export function renderTab(tab: TabId, s: Session, highlight: Set<string>): string {
  switch (tab) {
    case 'oversikt':
      return overview(s, highlight);
    case 'tegning':
      return renderBuilding(s.project.building, highlight);
    case 'budsjett':
      return budget(s.project, highlight);
    case 'fremdrift':
      return schedule(s.project, highlight);
    case 'risiko':
      return risks(s.project, highlight);
    case 'endringer':
      return changes(s);
    default:
      return '';
  }
}

/** The CSS the tabs need beyond styles.css. Injected once by the shell (see the top of this file). */
export const TAB_CSS = `
@keyframes ab-glow { 0%,100% { filter: drop-shadow(0 0 0 transparent); } 50% { filter: drop-shadow(0 0 6px var(--accent, #005fb8)); } }
@keyframes ab-glow-row { 0%,100% { box-shadow: inset 3px 0 0 var(--accent, #005fb8); } 50% { box-shadow: inset 3px 0 0 var(--accent, #005fb8), 0 0 0 2px var(--accent, #005fb8); } }
svg .glow > rect, svg .glow > polygon { stroke: var(--accent, #005fb8) !important; stroke-width: 3px !important; }
svg .glow { animation: ab-glow 1.4s ease-in-out 4; }
tr.glow, li.glow { background: var(--accent-soft, rgba(0,95,184,0.1)); animation: ab-glow-row 1.4s ease-in-out 4; box-shadow: inset 3px 0 0 var(--accent, #005fb8); }
@media (prefers-reduced-motion: reduce) { svg .glow, tr.glow, li.glow { animation: none; } }
.dw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; margin: 12px 0; }
.dw-fig { margin: 0; padding: 8px; border-radius: 8px; background: var(--layer, #fbfbfb); border: 1px solid var(--stroke, rgba(0,0,0,0.06)); }
.dw-svg { width: 100%; height: auto; display: block; color: var(--text, #1b1b1b); }
.dw-exterior { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 8px 0; }
.dw-swatch { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; }
.dw-swatch i { width: 16px; height: 16px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.25); display: inline-block; }
.dw-unplaced ul { margin: 6px 0 0; padding-left: 18px; }
.dw-unplaced li { padding: 2px 4px; border-radius: 4px; }
.tb-sku { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 999px; font-size: 11px; font-family: ui-monospace, Consolas, monospace; background: var(--accent-soft, rgba(0,95,184,0.1)); color: var(--accent, #005fb8); vertical-align: 1px; }
.tb-share { height: 8px; min-width: 80px; border-radius: 4px; background: var(--stripe, rgba(0,0,0,0.05)); overflow: hidden; }
.tb-share i { display: block; height: 100%; background: var(--bar, #6d9fe0); border-radius: 4px; }
.tb-share + small { font-size: 11px; opacity: 0.7; }
.tb-delta { margin-left: 8px; font-weight: 600; }
.tb-changes { list-style: none; padding-left: 0; }
.tb-changes li { margin: 4px 0; }
.tb-sec { display: inline-block; min-width: 72px; text-align: center; padding: 0 6px; border-radius: 999px; font-size: 11px; background: var(--stripe, rgba(0,0,0,0.06)); border: 1px solid var(--stroke-strong, rgba(0,0,0,0.14)); }
.tb-ref { font: inherit; color: var(--accent, #005fb8); background: none; border: 0; padding: 0; text-decoration: underline dotted; text-underline-offset: 3px; cursor: pointer; text-align: left; }
.tb-ref:hover, .tb-ref:focus-visible { text-decoration-style: solid; }
.gt-svg { color: var(--text, #1b1b1b); }
`;
