// The message feed and dialogs (start, decision, fork card, final report).
import { CHAPTERS } from '../engine/chapters';
import { KIND_LABEL, eventById, type EventOption } from '../engine/events';
import {
  forecast, verdict,
  type Decision, type Difficulty, type GameState, type LogEntry, type Outcome, type StaffingChange, type Story, type Verdict,
} from '../engine/game';
import type { Scenario } from '../engine/scenario';
import { budgetOf } from './budgetLines';
import { formatDelta, formatFactor, formatMnok } from './format';
import { icon } from './tabs/context';
import { VERSION } from '../version';

export type Speed = 1 | 2 | 4;

export interface PlayUi {
  playing: boolean;
  speed: Speed;
  menu: boolean;
  finalSeen: boolean;
  /** How many fork cards the player has closed (one per decision). */
  forkSeen: number;
}

export const DIFFICULTIES: { id: Difficulty; label: string; text: string }[] = [
  { id: 'easy', label: 'Enkel', text: 'AI-rollene anbefaler alltid det beste valget.' },
  { id: 'medium', label: 'Medium', text: 'AI-rollene har rett omtrent 8 av 10 ganger.' },
  { id: 'hard', label: 'Vanskelig', text: 'AI-rollene har rett omtrent 6 av 10 ganger. Tenk selv.' },
];

const dialog = (inner: string, label: string) =>
  `<div class="backdrop"><div class="dialog" role="dialog" aria-modal="true" aria-label="${label}">${inner}</div></div>`;

export function renderStart(s: Scenario): string {
  return dialog(`<h2>Nytt prosjekt: ${s.name} <small class="version">${VERSION}</small></h2>
    <p>Du er <b>prosjekteier</b>. Prosjektleder, Site manager og formennene er AI-roller som melder fra om utfordringer og anbefaler tiltak. Målet er å bygge ferdig innen <b>${formatMnok(s.target.total)} MNOK</b> og <b>${s.target.weeks} uker</b>.</p>
    <p class="meta">Velg mannskap og arbeidsmodus per disiplin, eller la prosjektlederen bemanne. Hver uke ekstra koster ${formatFactor(s.overhead.perWeek)} MNOK i rigg og drift. Underveis kommer strategivalg, risikoer, muligheter og endringsønsker, og hver av dem er et dilemma mellom penger og tid.</p>
    <p class="meta">Ved hvert valg gir tre AI-roller sitt råd, og du ser hva hvert alternativ gir nå, senere og i prognosen. Etter valget viser et veivalgkort din vei ved siden av prosjektlederens anbefaling.</p>
    <p class="meta">Hvert spill er en historie som <b>kan</b> løses innenfor begge målene. I sluttrapporten ser du hvordan, og hvordan AI-veien gikk.</p>
    <div class="choices">${DIFFICULTIES.map(d => `<button type="button" class="choice" data-action="start" data-difficulty="${d.id}"><b>${d.label}</b><span>${d.text}</span></button>`).join('')}</div>`, 'Nytt prosjekt');
}

const signedWeeks = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');
const weeksWord = (n: number) => `${n} uke${Math.abs(n) === 1 ? '' : 'r'}`;

/** A person's display name, e.g. "Formann F" or "Prosjektleder". */
export function personName(s: Scenario, id: string): string {
  const p = s.people.find(x => x.id === id);
  if (!p) return id;
  return p.taskId ? `${p.role} ${p.taskId}` : p.role;
}

/** End week and total, coloured against the targets. */
function outcomeText(s: Scenario, r: Outcome): string {
  const late = r.weeks > s.target.weeks;
  const over = Math.round(r.total * 100) > Math.round(s.target.total * 100);
  return `<span class="${late ? 'bad' : 'good'}">uke <b>${r.weeks}</b></span> · <span class="${over ? 'bad' : 'good'}"><b>${formatMnok(r.total)}</b> MNOK</span>`;
}

/** The difference between two outcomes, e.g. "+2 uker, +0,45 MNOK". */
const deltaText = (a: Outcome, b: Outcome) => `${signedWeeks(a.weeks - b.weeks)} uker, ${formatDelta(a.total - b.total)} MNOK`;

/** What an option does now and later, in words. */
function effectsOf(s: Scenario, o: EventOption, taskId: string): { now: string; later: string } {
  const modeText = o.setMode === 'hire' ? `ekstra innleie (innleide timer × ${formatFactor(s.factors.hire)})` : o.setMode === 'overtime' ? `overtid (overtidstimer × ${formatFactor(s.factors.overtime)})` : '';
  const costText = o.cost ? `${formatDelta(o.cost)} MNOK` : o.setMode ? 'høyere timekost resten av disiplinen' : 'ingen ekstra kostnad';
  const workText = o.work ? `${o.work > 0 ? '+' : '−'}${Math.round(Math.abs(o.work) * 100)} % timer igjen på ${taskId}` : '';
  const now = [costText, o.delay ? `${taskId} står ${weeksWord(o.delay)}` : 'ingen stans', modeText, workText].filter(Boolean).join(' · ');
  const l = o.later;
  const later = l
    ? `Om ${weeksWord(l.weeks)}: ${formatDelta(l.cost)} MNOK${l.delay ? `, ${l.taskId ?? taskId} står ${weeksWord(l.delay)}` : ''}. ${l.text}.`
    : '';
  return { now, later };
}

export function renderEvent(s: Scenario, g: GameState): string {
  const p = g.pending!;
  const ev = eventById(p.eventId);
  const task = s.tasks.find(t => t.id === p.taskId)!;
  const label = (id: string) => ev.options.find(o => o.id === id)!.label;
  const voices = p.voices.map(v => {
    const person = s.people.find(x => x.id === v.personId)!;
    return `<div class="voice${v.personId === 'pm' ? ' official' : ''}">${icon(person.icon, 32)}<div>
      <b>${personName(s, v.personId)}</b>${v.raised ? ' <span class="chip">meldte saken</span>' : ''}
      <p class="voice-pick">Anbefaler «${label(v.optionId)}»</p><p>${v.reason}</p></div></div>`;
  }).join('');
  const options = ev.options.map(o => {
    const isRec = o.id === p.recommended;
    const r = p.outcomes.find(x => x.optionId === o.id)!;
    const { now, later } = effectsOf(s, o, p.taskId);
    const backers = p.voices.filter(v => v.optionId === o.id).map(v => personName(s, v.personId));
    // Δ against today's forecast on every option; the recommended one is also marked.
    const delta = `<em class="delta">Δ ${deltaText(r, p.before)} mot i dag</em>${isRec ? '<span class="chip chip-on">anbefalt</span>' : ''}`;
    return `<button type="button" class="choice${isRec ? ' recommended' : ''}" data-action="choose" data-option="${o.id}">
      <b>${o.label}</b>${backers.length ? `<span class="backers">${backers.join(' · ')}</span>` : ''}
      <span class="effect"><i>Nå:</i> ${now}</span>
      ${later ? `<span class="effect later"><i>Senere:</i> ${later}</span>` : ''}
      <span class="preview">Prognose ${outcomeText(s, r)} ${delta}</span>
      <small>${o.note}</small></button>`;
  }).join('');
  return dialog(`<div class="dialog-head">${icon(ev.icon, 48)}<div><h2>${ev.title}</h2><p class="meta"><span class="chip kind kind-${ev.kind}">${KIND_LABEL[ev.kind]}</span> Uke ${g.week} · rammer ${task.id} ${task.name}</p></div></div>
    <p>${ev.description}</p>
    <p class="dilemma">${p.dilemma}</p>
    <p class="meta">Prognose i dag: ${outcomeText(s, p.before)} · mål ${s.target.weeks} uker og ${formatMnok(s.target.total)} MNOK. Prognosene forutsetter ingen nye hendelser.</p>
    <div class="voices">${voices}</div>
    <div class="choices">${options}</div>`, ev.title);
}

/** The fork card after a choice: the player's path next to the recommendation from the same state. */
export function renderFork(s: Scenario, d: Decision): string {
  const ev = eventById(d.eventId);
  const label = (id: string) => ev.options.find(o => o.id === id)!.label;
  const col = (head: string, optionId: string, r: Outcome) =>
    `<div class="fork-col"><span class="meta">${head}</span><b>«${label(optionId)}»</b><span>${outcomeText(s, r)}</span></div>`;
  const body = d.followed
    ? `<p class="fork-same">Du fulgte anbefalingen.</p><div class="fork one">${col('Ditt valg = Prosjektlederens anbefaling', d.chosen, d.chosenOutcome)}</div>`
    : `<div class="fork">${col('Ditt valg', d.chosen, d.chosenOutcome)}${col('Prosjektlederens anbefaling', d.recommended, d.recommendedOutcome)}</div>
       <p class="dilemma">Ditt valg gir ${deltaText(d.chosenOutcome, d.recommendedOutcome)} mot anbefalingen.</p>`;
  return dialog(`<h2>Veivalg: ${ev.title}</h2>
    <p class="meta"><span class="chip kind kind-${ev.kind}">${KIND_LABEL[ev.kind]}</span> Uke ${d.week} · mål ${s.target.weeks} uker og ${formatMnok(s.target.total)} MNOK</p>
    ${body}
    <p class="meta">Begge veiene er regnet frem fra samme tilstand, uten nye hendelser.</p>
    <div class="choices"><button type="button" class="choice" data-action="fork-continue"><b>Fortsett</b></button></div>`, 'Veivalg');
}

/** The message feed: what the AI roles report, newest first. */
export function renderFeed(s: Scenario, g: GameState | undefined, limit = 40): string {
  if (!g) return '<h2>Meldinger</h2><p class="meta">Meldingene fra AI-rollene kommer her når spillet starter.</p>';
  const items = g.log.slice(-limit).reverse().map(l => {
    const from = l.from ?? 'pm';
    const person = s.people.find(x => x.id === from);
    return `<li>${person ? icon(person.icon, 24) : ''}<div><b>${personName(s, from)}</b> <small>Uke ${l.week}</small><p>${l.text}</p></div></li>`;
  }).join('');
  // The latest chapter announced: it never goes back, also when a task runs late or between tasks.
  const chapter = g.chapter >= 0 ? CHAPTERS[g.chapter] : null;
  return `<h2>Meldinger</h2><p class="meta">${g.done ? 'Prosjektet er ferdig' : chapter ? `Kapittel: <b>${chapter.title}</b>` : 'Prolog: prosjektering'}</p><ol class="feed-list">${items}</ol>`;
}

/** The Prosjektleder's latest "forecast changed" message and the forecast it started from. */
export interface ForecastNote { entry: LogEntry; base: Outcome }

/**
 * Works out the feed after a choice or a staffing change (pure: returns a new log).
 * One change adds one message from the Prosjektleder; more changes in a row in the same week
 * merge into it, measured from the first baseline; a change back to that baseline removes it.
 */
export function noteForecastChange(log: LogEntry[], week: number, before: Outcome, after: Outcome, prev: ForecastNote | null): { log: LogEntry[]; note: ForecastNote | null } {
  const merging = prev !== null && log[log.length - 1] === prev.entry && prev.entry.week === week;
  const base = merging ? prev!.base : before;
  const same = after.weeks === base.weeks && Math.round(after.total * 100) === Math.round(base.total * 100);
  if (same) return merging ? { log: log.slice(0, -1), note: null } : { log, note: prev };
  const entry: LogEntry = { week, from: 'pm', text: `Prognosen er endret: uke ${base.weeks} → ${after.weeks}, ${formatMnok(base.total)} → ${formatMnok(after.total)} MNOK.` };
  return { log: [...(merging ? log.slice(0, -1) : log), entry], note: { entry, base } };
}

/** Which dialog to show. A fork card comes before a queued decision, so no fork is skipped. */
export function dialogFor(g: GameState | undefined, ui: Pick<PlayUi, 'forkSeen' | 'finalSeen'>): 'start' | 'fork' | 'event' | 'final' | null {
  if (!g) return 'start';
  if (g.decisions.length > ui.forkSeen) return 'fork';
  if (g.pending) return 'event';
  if (g.done && !ui.finalSeen) return 'final';
  return null;
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
  return `<details class="story-wrap"><summary><b>${head}</b>: steg for steg</summary><p class="meta">Med full oversikt over hendelsene kunne prosjektet endt i uke ${story.weeks} på ${formatMnok(story.total)} MNOK:</p><ol class="story">${steps}</ol></details>`;
}

const VERDICT_TEXT: Record<Verdict, string> = { 'on-target': 'I mål', 'over-budget': 'Over budsjett', late: 'Forsinket', 'over-and-late': 'Over budsjett og forsinket' };

function verdictOf(s: Scenario, r: Outcome): Verdict {
  const over = Math.round(r.total * 100) > Math.round(s.target.total * 100);
  const late = r.weeks > s.target.weeks;
  return over && late ? 'over-and-late' : over ? 'over-budget' : late ? 'late' : 'on-target';
}

/** Player vs AI path vs story, side by side. */
function compareHtml(s: Scenario, you: Outcome & { decisions: number }, ai?: Story, story?: Story): string {
  const cols: { head: string; r: Outcome; decisions: number }[] = [{ head: 'Du', r: you, decisions: you.decisions }];
  const choicesIn = (st: Story) => st.steps.filter(x => x.kind === 'choice').length;
  if (ai) cols.push({ head: 'AI-veien', r: ai, decisions: choicesIn(ai) });
  if (story) cols.push({ head: story.solved ? 'Historiens løsning' : 'Beste kjente løsning', r: story, decisions: choicesIn(story) });
  const row = (label: string, cell: (c: typeof cols[number]) => string) => `<tr><th scope="row">${label}</th>${cols.map(c => `<td>${cell(c)}</td>`).join('')}</tr>`;
  return `<h3>Du mot AI-veien og historien</h3>
    <div class="table-wrap"><table class="compare">
      <thead><tr><th></th>${cols.map(c => `<th scope="col">${c.head}</th>`).join('')}</tr></thead>
      <tbody>
        ${row('Ferdig', c => `<span class="${c.r.weeks > s.target.weeks ? 'bad' : 'good'}">uke ${c.r.weeks}</span>`)}
        ${row('Sluttkostnad', c => `<span class="${verdictOf(s, c.r) === 'over-budget' || verdictOf(s, c.r) === 'over-and-late' ? 'bad' : 'good'}">${formatMnok(c.r.total)} MNOK</span>`)}
        ${row('Beslutninger', c => String(c.decisions))}
        ${row('Resultat', c => VERDICT_TEXT[verdictOf(s, c.r)])}
      </tbody>
    </table></div>
    ${ai ? '<p class="meta">AI-veien spiller samme scenario med prosjektlederens bemanning og anbefaling ved hvert valg. Den kan møte andre hendelser enn du gjorde.</p>' : ''}`;
}

/** Every decision with the Δ between the player's and the recommended outcome (from the fork records). */
function decisionsHtml(g: GameState): string {
  if (!g.decisions.length) return '';
  const items = g.decisions.map(d => {
    const ev = eventById(d.eventId);
    const label = (id: string) => ev.options.find(o => o.id === id)!.label;
    const tail = d.followed
      ? '<span class="good">fulgte anbefalingen</span>'
      : `anbefalt «${label(d.recommended)}» · Δ ${deltaText(d.chosenOutcome, d.recommendedOutcome)}`;
    return `<li><b>Uke ${d.week}: ${ev.title}</b> <span class="chip kind kind-${ev.kind}">${KIND_LABEL[ev.kind]}</span><br>Du valgte «${label(d.chosen)}» · ${tail}</li>`;
  }).join('');
  return `<h3>Dine beslutninger</h3><ol class="decisions">${items}</ol>`;
}

export function renderFinal(s: Scenario, g: GameState, story?: Story, ai?: Story): string {
  const total = budgetOf(forecast(s, g)).total;
  const v = verdict(s, g);
  const decisions = g.decisions.length;
  const followed = g.decisions.filter(d => d.followed).length;
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
    ${compareHtml(s, { weeks: g.week, total, decisions }, ai, story)}
    ${decisionsHtml(g)}
    ${storyHtml(story)}
    <div class="choices row"><button type="button" class="choice" data-action="close-final"><b>Se resultatet</b></button><button type="button" class="choice" data-action="new"><b>Nytt spill</b></button></div>`, 'Sluttrapport');
}
