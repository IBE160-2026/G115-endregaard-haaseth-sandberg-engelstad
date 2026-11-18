// The bank-ready project report: HTML for #print, printed (or saved as PDF) via window.print(). Owner: WS4.
//
// CSS: the shell (WS3) injects REPORT_CSS once next to TAB_CSS, e.g.
//   document.head.insertAdjacentHTML('beforeend', `<style>${TAB_CSS}${REPORT_CSS}</style>`)
// Everything is scoped under .rp; drawings carry their own colours, so the PDF looks the same in any theme.
import { budgetTotal } from '../budget';
import type { Brand } from '../contract/brand';
import { esc, formatDate, formatDelta, formatNok, formatNum } from '../format';
import type { Session } from '../session';
import { hexColor, PHASES } from '../types';
import { renderBuilding, renderElevation } from '../ui/building';
import { projectWeeks } from '../ui/gantt';
import { assumptionsList, budgetTable, changeLog, factCards, phaseStepper, projectKpis, rangeText, riskTable, scheduleBody } from '../ui/tabs';

export const DISCLAIMER = 'Tallene er et grovt overslag laget av AI og må kontrolleres av fagfolk før bestilling.';

const NONE = new Set<string>();

const section = (id: string, title: string, body: string) => `<section class="rp-section" id="rp-${id}"><h2>${title}</h2>${body}</section>`;
const empty = (text: string) => `<p class="rp-empty">${text}</p>`;

function budgetHistory(s: Session): string {
  if (!s.log.length) return '';
  const rows = s.log
    .map((c) => {
      const d = c.totalAfter - c.totalBefore;
      const req = c.request.length > 90 ? `${c.request.slice(0, 90)}…` : c.request;
      return `<tr><td>Runde ${c.turn}</td><td>${req ? `«${esc(req)}»` : ''}</td><td class="num">${Math.abs(d) < 1 ? '' : formatDelta(d)}</td><td class="num">${c.totalAfter > 0 ? formatNok(c.totalAfter) : '–'}</td></tr>`;
    })
    .join('');
  return `<h3>Budsjettutvikling</h3><table class="rp-table"><thead><tr><th>Runde</th><th>Forespørsel</th><th class="num">Endring</th><th class="num">Totalt etter</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function taskTable(s: Session): string {
  const tasks = s.project.schedule;
  const name = (id: string) => tasks.find((t) => t.id === id)?.name ?? id;
  return `<table class="rp-table"><thead><tr><th>Aktivitet</th><th class="num">Uke</th><th class="num">Varighet</th><th>Etter</th></tr></thead><tbody>${tasks
    .map(
      (t) =>
        `<tr><td>${esc(t.name)}</td><td class="num">${formatNum(t.start_week)}–${formatNum(t.start_week + t.duration_weeks)}</td><td class="num">${formatNum(t.duration_weeks)} uker</td><td>${(t.depends_on ?? []).map((id) => esc(name(id))).join(', ')}</td></tr>`,
    )
    .join('')}</tbody></table>`;
}

export function renderReport(s: Session, brand: Brand, snapshot?: string): string {
  const p = s.project;
  const date = formatDate(new Date());
  const accent = hexColor(brand.colors?.accent) ?? '#005fb8';
  const front = renderElevation(p.building, 'front', NONE);
  const image = snapshot
    ? `<img class="rp-hero" src="${esc(snapshot)}" alt="3D-modell av bygget">`
    : front
      ? `<div class="rp-hero rp-hero-svg">${front}</div>`
      : '';
  const phase = PHASES.find((x) => x.id === s.phase)?.label ?? '';
  const dealer = brand.dealer;
  const contact = dealer
    ? `${esc(dealer.name)} · ${esc(dealer.phone)} · ${esc(dealer.email)}`
    : esc(brand.company);

  const cover = `<header class="rp-cover">
      <div class="rp-brand"><img class="rp-logo" src="${esc(`${import.meta.env.BASE_URL}${brand.logo}`)}" alt="${esc(brand.company)}"><div><b>${esc(brand.name)}</b><small>${esc(brand.company)}</small></div></div>
      <p class="rp-kicker">Prosjektrapport</p>
      <h1>${esc(p.name || 'Byggeprosjekt')}</h1>
      ${p.type ? `<p class="rp-type">${esc(p.type)}${phase ? ` · Fase: ${phase}` : ''}</p>` : ''}
      ${p.summary ? `<p class="rp-summary">${esc(p.summary)}</p>` : ''}
      ${image}
      <dl class="rp-meta">
        <div><dt>Dato</dt><dd>${date}</dd></div>
        <div><dt>Budsjett</dt><dd>${p.budget.length ? `${formatNok(budgetTotal(p))}<small>${rangeText(p)}</small>` : '–'}</dd></div>
        <div><dt>Byggetid</dt><dd>${p.schedule.length ? `${formatNum(projectWeeks(p.schedule))} uker` : '–'}</dd></div>
        <div><dt>Forhandler</dt><dd>${dealer ? esc(dealer.name) : '–'}</dd></div>
      </dl>
    </header>`;

  const sections = [
    section('oversikt', 'Oversikt', `${phaseStepper(s.phase)}${projectKpis(p)}${p.facts.length ? factCards(p) : empty('Ingen avklarte punkter ennå.')}`),
    section('tegning', 'Tegning', `${renderBuilding(p.building, NONE)}<p class="rp-small">Fasadene er sett utenfra. Åpninger er tegnet der AI-en har plassert dem; resten er listet som ikke plassert.</p>`),
    section(
      'budsjett',
      'Budsjett',
      p.budget.length
        ? `<p class="rp-lead">Totalt <b>${formatNok(budgetTotal(p))}</b> inkl. mva, med et spenn på <b>${rangeText(p)}</b> ut fra usikkerheten per post.</p>${budgetTable(p, NONE)}${budgetHistory(s)}`
        : `${empty('Budsjettet er ikke laget ennå.')}${budgetHistory(s)}`,
    ),
    section('fremdrift', 'Fremdrift', p.schedule.length ? `<p class="rp-lead">Byggetid ca. <b>${formatNum(projectWeeks(p.schedule))} uker</b>.</p>${scheduleBody(p, NONE)}${taskTable(s)}` : empty('Fremdriftsplanen er ikke laget ennå.')),
    section('risiko', 'Risiko', p.risks.length ? riskTable(p, NONE) : empty('Risikoene er ikke vurdert ennå.')),
    section('endringer', 'Endringer', s.log.length ? changeLog(s, false) : empty('Ingen endringer registrert.')),
    section('antakelser', 'Antakelser', p.assumptions.length ? assumptionsList(p) : empty('Ingen antakelser registrert.')),
  ];

  return `<article class="rp" style="--rp-accent:${accent}">
    ${cover}
    ${sections.join('')}
    <footer class="rp-footer">
      <p class="rp-disclaimer">${DISCLAIMER}</p>
      <p>Kontakt: ${contact}</p>
      <p class="rp-small">Laget med ${esc(brand.name)} · ${date}</p>
    </footer>
  </article>`;
}

/** Print/PDF styles for the report. Light only, A4, a page break before each major section. */
export const REPORT_CSS = `
.rp { --rp-accent: #005fb8; color: #1b1b1b; background: #fff; font: 11pt/1.45 'Segoe UI', system-ui, sans-serif; max-width: 190mm; margin: 0 auto; }
.rp h1 { font-size: 26pt; line-height: 1.15; margin: 4mm 0 2mm; }
.rp h2 { font-size: 16pt; color: var(--rp-accent); border-bottom: 2px solid var(--rp-accent); padding-bottom: 2mm; margin: 0 0 4mm; }
.rp h3 { font-size: 12pt; margin: 5mm 0 2mm; }
.rp-cover { min-height: 250mm; display: flex; flex-direction: column; gap: 3mm; }
.rp-brand { display: flex; align-items: center; gap: 4mm; padding-bottom: 4mm; border-bottom: 1px solid #ddd; }
.rp-brand b { display: block; font-size: 13pt; }
.rp-brand small { color: #5d5d5d; }
.rp-logo { height: 14mm; width: auto; }
.rp-kicker { margin: 10mm 0 0; text-transform: uppercase; letter-spacing: 0.12em; font-size: 9pt; color: var(--rp-accent); font-weight: 600; }
.rp-type { margin: 0; color: #5d5d5d; }
.rp-summary { font-size: 12pt; max-width: 150mm; }
.rp-hero { display: block; width: 100%; max-height: 110mm; object-fit: contain; border: 1px solid #e3e3e3; border-radius: 3mm; background: #f7f7f7; }
.rp-hero-svg { padding: 4mm; box-sizing: border-box; }
.rp-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: auto 0 0; }
.rp-meta div { border-top: 2px solid var(--rp-accent); padding-top: 2mm; }
.rp-meta dt { font-size: 8.5pt; color: #5d5d5d; text-transform: uppercase; letter-spacing: 0.06em; }
.rp-meta dd { margin: 0; font-weight: 600; }
.rp-meta small { display: block; font-weight: 400; font-size: 8.5pt; color: #5d5d5d; }
.rp-section { margin-top: 10mm; }
.rp-lead { font-size: 11.5pt; }
.rp-empty, .rp-small { color: #5d5d5d; font-size: 9.5pt; }
.rp table, .rp-table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 2mm 0; }
.rp th { text-align: left; font-weight: 600; border-bottom: 1.5px solid #999; padding: 1.5mm 2mm; }
.rp td { border-bottom: 1px solid #e3e3e3; padding: 1.5mm 2mm; vertical-align: top; }
.rp tfoot td { border-top: 1.5px solid #999; border-bottom: 0; }
.rp .num { text-align: right; white-space: nowrap; }
.rp .sub { color: #5d5d5d; font-size: 8.5pt; }
.rp .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 3mm 0; }
.rp .kpi { border: 1px solid #e3e3e3; border-radius: 2mm; padding: 2mm 3mm; display: flex; flex-direction: column; }
.rp .kpi span, .rp .kpi small { font-size: 8.5pt; color: #5d5d5d; }
.rp .cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
.rp .card { border: 1px solid #e3e3e3; border-radius: 2mm; padding: 2mm 3mm; break-inside: avoid; background: #fff; }
.rp .card h3 { margin: 0 0 1mm; }
.rp dl { display: grid; grid-template-columns: auto 1fr; gap: 0.5mm 3mm; margin: 0; }
.rp dd { margin: 0; }
.rp .phases { display: flex; flex-wrap: wrap; gap: 1mm; list-style: none; padding: 0; margin: 0 0 3mm; font-size: 8.5pt; }
.rp .phases li { padding: 0.5mm 2mm; border: 1px solid #ddd; border-radius: 999px; color: #5d5d5d; background: #fff; }
.rp .phases li.done { color: #1b1b1b; }
.rp .phases li.now { border-color: var(--rp-accent); color: var(--rp-accent); font-weight: 600; }
.rp .chip, .rp .tb-sku, .rp .tb-sec { display: inline-block; padding: 0 2mm; border: 1px solid #ccc; border-radius: 999px; font-size: 8pt; background: #fff; color: #1b1b1b; }
.rp .tb-share { height: 2mm; min-width: 20mm; background: #eee; border-radius: 1mm; overflow: hidden; }
.rp .tb-share i { display: block; height: 100%; background: var(--rp-accent); }
.rp .level { font-weight: 600; }
.rp .level-hoy { color: #c42b1c; }
.rp .changelog { padding-left: 0; list-style: none; }
.rp .changelog > li { border-left: 2px solid var(--rp-accent); padding: 0 0 2mm 3mm; margin-bottom: 2mm; break-inside: avoid; }
.rp .change-head { display: flex; gap: 3mm; }
.rp .tb-changes { list-style: none; padding: 0; margin: 1mm 0; }
.rp .up { color: #c42b1c; }
.rp .down { color: #0f7b0f; }
.rp .dw-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 3mm; }
.rp .dw-fig { margin: 0; border: 1px solid #e3e3e3; border-radius: 2mm; padding: 2mm; background: #fff; break-inside: avoid; }
.rp svg { max-width: 100%; height: auto; color: #1b1b1b; }
.rp .gantt-wrap { overflow: visible; }
.rp .glow { animation: none !important; background: none !important; box-shadow: none !important; }
.rp .note { font-size: 9pt; color: #5d5d5d; }
.rp-footer { margin-top: 10mm; padding-top: 3mm; border-top: 2px solid var(--rp-accent); font-size: 9.5pt; break-inside: avoid; }
.rp-disclaimer { font-weight: 600; }
@media print {
  @page { size: A4; margin: 14mm 12mm 16mm; }
  .rp { max-width: none; font-size: 10.5pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .rp-cover { min-height: 255mm; break-after: page; }
  .rp-section { margin-top: 0; break-before: page; }
  .rp-section#rp-risiko, .rp-section#rp-antakelser { break-before: auto; margin-top: 10mm; }
  .rp tr, .rp .kpi, .rp figure { break-inside: avoid; }
  .rp h2, .rp h3 { break-after: avoid; }
}
`;
