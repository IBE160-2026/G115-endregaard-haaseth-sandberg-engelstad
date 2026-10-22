// Play controls, scenario buttons and dialogs (start, event decision, final report).
import { EVENTS, eventById } from '../engine/events';
import { canTrigger, forecast, spent, verdict, type Difficulty, type GameState, type StaffingChange, type Story } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import type { SimulationResult } from '../engine/simulate';
import { budgetOf } from './budgetLines';
import { formatFactor, formatMnok } from './format';
import { icon } from './tabs/context';
import { VERSION } from '../version';

export type Speed = 1 | 2 | 4;

export interface PlayUi {
  playing: boolean;
  speed: Speed;
  menu: boolean;
  show3d: boolean;
  finalSeen: boolean;
}

export const DIFFICULTIES: { id: Difficulty; label: string; text: string }[] = [
  { id: 'easy', label: 'Enkel', text: 'AI-rollene anbefaler alltid det beste valget.' },
  { id: 'medium', label: 'Medium', text: 'AI-rollene har rett omtrent 8 av 10 ganger.' },
  { id: 'hard', label: 'Vanskelig', text: 'AI-rollene har rett omtrent 6 av 10 ganger. Tenk selv.' },
];

const btn = (action: string, label: string, ic: string, extra = '') =>
  `<button type="button" class="tool" data-action="${action}" title="${label}" ${extra}>${icon(ic, 20)}<span>${label}</span></button>`;

export function renderToolbar(s: Scenario, g: GameState | undefined, f: SimulationResult, ui: PlayUi): string {
  const off = !g || g.done || !!g.pending ? 'disabled' : '';
  const week = g?.week ?? 0;
  const share = Math.min(1, week / Math.max(f.weeks, 1));
  const total = budgetOf(f).total;
  const speeds = ([1, 2, 4] as Speed[]).map(v =>
    `<button type="button" data-action="speed" data-speed="${v}" aria-pressed="${ui.speed === v}">${v}×</button>`).join('');
  const menu = ui.menu && g
    ? `<div class="menu" role="menu">${EVENTS.filter(e => e.button).map(e =>
      `<button type="button" role="menuitem" data-action="trigger" data-event="${e.id}"${canTrigger(s, g, e.id) ? '' : ' disabled'}>${icon(e.icon, 20)}<span>${e.title}<small>${e.taskIds.join(', ')}</small></span></button>`).join('')}</div>`
    : '';
  return `<div class="toolbar">
    ${ui.playing ? btn('pause', 'Pause', 'controls/pause.svg') : btn('play', 'Spill av', 'controls/play.svg', off)}
    ${btn('step', 'Neste uke', 'controls/step.svg', off)}
    <div class="seg speed" role="group" aria-label="Hastighet">${speeds}</div>
    <div class="weekbar" title="Uke ${week} av prognose ${f.weeks}">
      <span>Uke <b>${week}</b> / ${f.weeks}</span><div class="progress wide"><i style="width:${Math.round(share * 100)}%"></i></div>
    </div>
    <div class="money">
      <span>Påløpt <b>${formatMnok(g ? spent(g) : 0)}</b></span>
      <span class="${total > s.target.total + 0.005 ? 'bad' : 'good'}">Prognose <b>${formatMnok(total)}</b> / ${formatMnok(s.target.total)}</span>
      <span class="${f.weeks > s.target.weeks ? 'bad' : 'good'}"><b>${f.weeks}</b> / ${s.target.weeks} uker</span>
    </div>
    <div class="tool-group">
      <div class="menu-wrap">${btn('menu', 'Scenarioer', 'risks/R6-water.svg', `aria-expanded="${ui.menu}" ${g && !g.done ? '' : 'disabled'}`)}${menu}</div>
      ${btn('toggle3d', '3D', 'apps/view3d.svg', `aria-pressed="${ui.show3d}"`)}
      ${btn('new', 'Nytt spill', 'controls/new-game.svg')}
    </div>
  </div>`;
}

const dialog = (inner: string, label: string) =>
  `<div class="backdrop"><div class="dialog" role="dialog" aria-modal="true" aria-label="${label}">${inner}</div></div>`;

export function renderStart(s: Scenario): string {
  return dialog(`<h2>Nytt prosjekt: ${s.name} <small class="version">${VERSION}</small></h2>
    <p>Du er <b>prosjekteier</b>. Prosjektleder, Site manager og formennene er AI-roller som melder fra om utfordringer og anbefaler tiltak. Målet er å bygge ferdig innen <b>${formatMnok(s.target.total)} MNOK</b> og <b>${s.target.weeks} uker</b>.</p>
    <p class="meta">Velg mannskap og arbeidsmodus per disiplin, eller la prosjektlederen bemanne. Hver uke ekstra koster ${formatFactor(s.overhead.perWeek)} MNOK i rigg og drift. Underveis kommer risikoer og muligheter, og hver av dem er et dilemma mellom penger og tid.</p>
    <p class="meta">Hvert spill er en historie som <b>kan</b> løses innenfor begge målene. I sluttrapporten ser du hvordan.</p>
    <div class="choices">${DIFFICULTIES.map(d => `<button type="button" class="choice" data-action="start" data-difficulty="${d.id}"><b>${d.label}</b><span>${d.text}</span></button>`).join('')}</div>`, 'Nytt prosjekt');
}

export function renderEvent(s: Scenario, g: GameState): string {
  const p = g.pending!;
  const ev = eventById(p.eventId);
  const by = s.people.find(x => x.id === ev.raisedBy)!;
  const task = s.tasks.find(t => t.id === p.taskId)!;
  const options = ev.options.map(o => {
    const rec = o.id === p.recommended;
    // A mode change has no fixed price, but makes every remaining hour dearer.
    const modeText = o.setMode === 'hire' ? `Ekstra innleie: innleide timer × ${formatFactor(s.factors.hire)}` : o.setMode === 'overtime' ? `Overtid: overtidstimer × ${formatFactor(s.factors.overtime)}` : '';
    const costText = o.cost ? `+${formatMnok(o.cost)} MNOK` : o.setMode ? 'Høyere timekost resten av disiplinen' : 'Ingen ekstra kostnad';
    const effect = [costText, o.delay ? `${o.delay} uker stans` : 'Ingen stans', modeText].filter(Boolean).join(' · ');
    return `<button type="button" class="choice${rec ? ' recommended' : ''}" data-action="choose" data-option="${o.id}">
      <b>${o.label}</b>${rec ? '<span class="chip chip-on">Anbefalt</span>' : ''}<span>${effect}</span><small>${o.note}</small></button>`;
  }).join('');
  return dialog(`<div class="dialog-head">${icon(ev.icon, 48)}<div><h2>${ev.title}</h2><p class="meta">Uke ${g.week} · rammer ${task.id} ${task.name}</p></div></div>
    <p>${ev.description}</p>
    <p class="dilemma">${p.dilemma}</p>
    <div class="advice-box">${icon(by.icon, 32)}<div><b>${by.taskId ? `${by.role} ${by.taskId}` : by.role}</b> <small>(AI-rolle)</small><p>${p.reasoning}</p></div></div>
    <div class="choices">${options}</div>`, ev.title);
}

const MODE_NAME = { normal: 'normaltid', overtime: 'overtid', hire: 'ekstra innleie' } as const;

export const planText = (changes: StaffingChange[]) =>
  changes.map(c => `${c.taskId} ${MODE_NAME[c.mode]}`).join(', ');

function storyHtml(story: Story | undefined): string {
  if (!story) return '';
  const steps = story.steps.map(st => {
    if (st.kind === 'plan') return `<li>Uke ${st.week}: prosjektlederen bemanner (${planText(st.changes)}).</li>`;
    const ev = eventById(st.eventId);
    return `<li>Uke ${st.week}: ${ev.title} (${st.taskId}) → «${ev.options.find(o => o.id === st.optionId)!.label}».</li>`;
  }).join('');
  const head = story.solved ? 'Historiens løsning' : 'Beste kjente løsning';
  return `<h3>${head}</h3><p class="meta">Med full oversikt over hendelsene kunne prosjektet endt i uke ${story.weeks} på ${formatMnok(story.total)} MNOK:</p><ol class="story">${steps}</ol>`;
}

export function renderFinal(s: Scenario, g: GameState, story?: Story): string {
  const total = budgetOf(forecast(s, g)).total;
  const v = verdict(s, g);
  const decisions = g.log.filter(l => l.text.startsWith('Valgte')).length;
  const followed = g.log.filter(l => l.text.includes('fulgte anbefalingen')).length;
  const headline = { 'on-target': 'I mål: innenfor budsjett og plan!', 'over-budget': 'Ferdig i tide, men over budsjett', late: 'Innenfor budsjett, men forsinket', 'over-and-late': 'Over budsjett og forsinket' }[v];
  const dTotal = total - s.target.total;
  const dWeeks = g.week - s.target.weeks;
  return dialog(`<h2>${headline}</h2>
    <div class="kpis">
      <div class="kpi"><span>Sluttkostnad</span><b>${formatMnok(total)}</b><small>${dTotal > 0.005 ? `+${formatMnok(dTotal)}` : formatMnok(dTotal)} mot mål ${formatMnok(s.target.total)}</small></div>
      <div class="kpi"><span>Ferdigstilt</span><b>uke ${g.week}</b><small>${dWeeks > 0 ? `${dWeeks} uker for sent` : dWeeks < 0 ? `${-dWeeks} uker tidlig` : 'på dagen'}</small></div>
      <div class="kpi"><span>Beslutninger</span><b>${decisions}</b><small>${followed} fulgte AI-anbefalingen</small></div>
    </div>
    <p class="meta">Vanskelighetsgrad: ${DIFFICULTIES.find(d => d.id === g.difficulty)!.label} · Scenario-nr. ${g.seed} · Simulator ${VERSION}</p>
    ${storyHtml(story)}
    <div class="choices row"><button type="button" class="choice" data-action="close-final"><b>Se resultatet</b></button><button type="button" class="choice" data-action="new"><b>Nytt spill</b></button></div>`, 'Sluttrapport');
}
