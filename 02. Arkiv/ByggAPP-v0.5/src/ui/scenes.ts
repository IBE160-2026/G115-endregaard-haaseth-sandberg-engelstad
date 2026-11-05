// The story scenes as HTML: the start-up meeting with the plan review, the staffing review when a
// chapter opens, Oskar's HMS check, the talk card, and the objective and team in the left rail.
import { CHAPTERS } from '../engine/chapters';
import type { GameState, StaffingChange } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import type { SimulationResult } from '../engine/simulate';
import { budgetOf } from './budgetLines';
import { formatInt, formatMnok } from './format';
import { personName, planText, scenePanel, speechHtml } from './play';
import { HMS_CHECKS, PPE_LABEL, hmsById, kickoffLines, ppeOf, reviewLine, foremanPitch, type Objective, type StoryUi } from './story';
import { crewControl, modeControl } from './tabs/controls';
import { icon, type TabContext } from './tabs/context';
import { details } from './tabs/people';

/** The forecast against both targets, as the head of a plan review. */
function targetLine(s: Scenario, f: SimulationResult): string {
  const total = budgetOf(f).total;
  const late = f.weeks > s.target.weeks;
  const over = Math.round(total * 100) > Math.round(s.target.total * 100);
  return `<div class="plan-target">
    <span class="${late ? 'bad' : 'good'}"><small>Ferdig</small><b>uke ${f.weeks}</b><small>mål ${s.target.weeks}</small></span>
    <span class="${over ? 'bad' : 'good'}"><small>Prognose</small><b>${formatMnok(total)}</b><small>mål ${formatMnok(s.target.total)} MNOK</small></span>
    <p>${!late && !over ? (f.weeks === s.target.weeks ? 'Planen treffer målene akkurat. Ingen buffer hvis noe går galt.' : 'Planen treffer begge målene, med litt buffer.') : 'Planen bommer på målet. Juster bemanning eller arbeidsmodus.'}</p>
  </div>`;
}

/** The plan table: one row per discipline, the foreman's estimate and pitch, and the controls. */
function planTable(s: Scenario, g: GameState, f: SimulationResult, ids: string[]): string {
  const rows = ids.map(id => {
    const i = s.tasks.findIndex(t => t.id === id);
    const task = s.tasks[i];
    const st = g.tasks[i];
    const r = f.tasks[i];
    const person = s.people.find(p => p.id === `foreman-${id}`)!;
    const locked = st.finish !== null || g.done;
    return `<tr>
      <td><div class="plan-who">${icon(person.icon, 32)}<div><b>${person.name}</b><small>${task.id} ${task.name}</small><q>${foremanPitch(s, g, f, id)}</q></div></div></td>
      <td class="num"><b>${formatInt(Math.round(st.work))}</b><small>timer</small></td>
      <td>${crewControl(s, id, st.crew, locked)}${r.hiredCrew ? `<div class="meta">+ ${r.hiredCrew} innleid</div>` : ''}</td>
      <td>${modeControl(id, st.mode, locked)}</td>
      <td class="num"><b>${r.weeks}</b><small>uke ${r.start}–${r.finish}</small></td>
      <td>${r.critical ? '<span class="chip chip-crit">Kritisk</span>' : `<span class="chip">Slakk ${r.slack} u</span>`}</td>
    </tr>`;
  }).join('');
  return `<div class="table-wrap"><table class="plan">
    <thead><tr><th>Formann og forslag</th><th class="num">Estimat</th><th>Mannskap</th><th>Arbeidsmodus</th><th class="num">Uker</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

function planBar(plan: StaffingChange[]): string {
  return plan.length
    ? `<div class="planbar">${icon('people/project-manager.svg', 24)}<span><b>Elisabeth foreslår:</b> ${planText(plan)}.</span><button type="button" class="tool" data-action="pm-plan"><span>Følg Elisabeths forslag</span></button></div>`
    : `<div class="planbar calm">${icon('people/project-manager.svg', 24)}<span><b>Elisabeth:</b> Jeg finner ingen bemanning som treffer målene bedre enn denne.</span></div>`;
}

/** The start-up meeting: Elisabeth and Hedda introduce themselves, then the whole plan is reviewed. */
export function renderKickoff(s: Scenario, g: GameState, f: SimulationResult, line: number, plan: StaffingChange[]): string {
  const lines = kickoffLines(s);
  const head = `<div class="sp-head">${icon('apps/disciplines.svg', 40)}<div><h2>Oppstartsmøte i brakkeriggen</h2><p class="meta">Uke ${g.week} · Elisabeth, Hedda og formennene</p></div></div>`;
  if (line < lines.length) return scenePanel(`${head}${speechHtml(s, lines[line].who, lines[line].text, line, lines.length + 1, 'line-skip')}`, 'Oppstartsmøte');
  return scenePanel(`${head}
    <p class="lead">Formennenes forslag til timer og bemanning. Treffer vi på timene? Skal vi sette på flere?</p>
    ${targetLine(s, f)}
    ${planBar(plan)}
    ${planTable(s, g, f, s.tasks.map(t => t.id))}
    <div class="sp-actions"><button type="button" class="primary" data-action="kickoff-done">Godkjenn planen og start byggingen ▸</button></div>`, 'Oppstartsmøte', true);
}

/** The staffing review when a chapter opens: Hedda brings the foremen of the new disciplines. */
export function renderReview(s: Scenario, g: GameState, f: SimulationResult, ids: string[], line: number, plan: StaffingChange[]): string {
  const c = CHAPTERS[g.chapter];
  const head = `<div class="sp-head">${icon('apps/people.svg', 40)}<div><h2>Bemanningsmøte: ${c.title}</h2><p class="meta">Uke ${g.week} · ${ids.map(id => personName(s, `foreman-${id}`)).join(', ')}</p></div></div>`;
  if (line < 2) {
    const l = line === 0 ? { who: 'pm', text: c.intro } : reviewLine(s, g, ids);
    return scenePanel(`${head}${speechHtml(s, l.who, l.text, line, 3, 'line-skip')}`, 'Bemanningsmøte');
  }
  const mine = plan.filter(p => ids.includes(p.taskId));
  return scenePanel(`${head}
    ${targetLine(s, f)}
    ${planBar(mine)}
    ${planTable(s, g, f, ids)}
    <div class="sp-actions"><button type="button" class="primary" data-action="review-done">Godkjenn bemanningen ▸</button></div>`, 'Bemanningsmøte', true);
}

/** Oskar's HMS check: the gear list, the player's answer, and Oskar's reply. */
export function renderHms(s: Scenario, ui: StoryUi): string {
  const check = hmsById(ui.hms!);
  const had = ppeOf(ui);
  const list = [...had, check.item].map(p => `<li class="${p === check.item ? (ui.hmsReply ? 'fixed' : 'missing') : 'ok'}">${p === check.item && !ui.hmsReply ? '✗' : '✓'} ${PPE_LABEL[p]}</li>`).join('');
  const head = `<div class="sp-head">${icon('people/hms.svg', 40)}<div><h2>HMS-sjekk</h2><p class="meta">Oskar sjekker verneutstyret ditt</p></div><ul class="ppe">${list}</ul></div>`;
  if (!ui.hmsReply) {
    const replies = check.replies.map(r => `<button type="button" class="choice reply" data-action="hms-reply" data-reply="${r.id}"><b>${r.label}</b></button>`).join('');
    return scenePanel(`${head}<div class="sp-line">${portraitOf(s, 'hms')}<div class="sp-text"><b>Oskar</b><small>HMS-leder</small><p>${check.opener}</p></div></div>
      <div class="choices replies">${replies}</div>`, 'HMS-sjekk');
  }
  const reply = check.replies.find(r => r.id === ui.hmsReply)!;
  return scenePanel(`${head}
    <div class="sp-line me">${portraitOf(s, 'owner')}<div class="sp-text"><b>Du</b><small>Statsbygg</small><p>${reply.label}</p></div></div>
    <div class="sp-line">${portraitOf(s, 'hms')}<div class="sp-text"><b>Oskar</b><small>HMS-leder</small><p>${reply.answer} ${check.outro}</p></div>${reply.scolded ? '<span class="stamp">Tilsnakk!</span>' : ''}</div>
    <div class="sp-actions"><button type="button" class="primary" data-action="hms-done">Ta på ${PPE_LABEL[check.item].toLowerCase()} ▸</button></div>`, 'HMS-sjekk');
}
const portraitOf = (s: Scenario, id: string) => `<span class="portrait who-${id}">${icon(s.people.find(p => p.id === id)!.icon, 56)}</span>`;

/** Talking to someone on site: their card, with the controls for a foreman's crew. */
export function renderTalk(ctx: TabContext): string {
  return `<div class="talk glass" role="dialog" aria-label="Samtale">
    <button type="button" class="icon-btn" data-action="talk-close" aria-label="Lukk">✕</button>
    ${details(ctx)}</div>`;
}

/** The objective card at the top of the left rail. */
export function renderObjective(o: Objective | null, ui: StoryUi, g: GameState | undefined, canWalk: boolean): string {
  if (!g) return '';
  if (!o) {
    const text = g.done ? 'Bygget er ferdig. Se sluttrapporten.' : g.pending ? 'Møtet pågår.' : 'Byggingen går. Gå rundt og snakk med folk, eller følg med på tallene.';
    return `<div class="quest calm"><small>Oppdrag</small><p>${text}</p></div>`;
  }
  return `<div class="quest"><small>Oppdrag</small><b>${o.title}</b><p>${o.text}</p>
    <div class="quest-actions">${canWalk ? '<button type="button" class="primary" data-action="goto">Gå dit <kbd>G</kbd></button>' : '<button type="button" class="primary" data-action="arrive">Start møtet</button>'}
    ${ui.phase === 'intro' ? '<button type="button" class="link" data-action="skip-intro">Hopp over intro</button>' : ''}</div></div>`;
}

/** The team in the left rail: the player and the three named AI roles, with a «!» when they wait. */
export function renderTeam(s: Scenario, g: GameState | undefined, ui: StoryUi, objective: Objective | null): string {
  if (!g) return '';
  const ids = ['owner', 'pm', 'site', 'hms'];
  return `<div class="team" aria-label="Teamet">${ids.map(id => {
    const p = s.people.find(x => x.id === id)!;
    const waits = objective?.id === id || (g.pending?.voices.some(v => v.personId === id) ?? false);
    const status = id === 'owner' ? `${ppeOf(ui).length}/${3 + HMS_CHECKS.length} verneutstyr` : id === 'hms' ? (ui.scolded ? `${ui.scolded} tilsnakk` : 'Fornøyd') : ui.phase === 'play' ? 'Følger deg' : 'Venter i brakka';
    return `<button type="button" class="mate${waits ? ' waits' : ''}" data-action="talk" data-who="${id}" title="Snakk med ${p.name}">${icon(p.icon, 28)}<span><b>${p.name}</b><small>${status}</small></span>${waits ? '<em class="bang">!</em>' : ''}</button>`;
  }).join('')}</div>`;
}
