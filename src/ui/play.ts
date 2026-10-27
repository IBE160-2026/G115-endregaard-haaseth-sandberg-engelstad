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
import { foremanInput, meetingLines, proposals, type StoryUi } from './story';
import { icon } from './tabs/context';
import { VERSION } from '../version';

export type Speed = 1 | 2 | 4;

export interface PlayUi extends StoryUi {
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
    <p>Du er <b>Statsbygg</b>, byggherren for A-blokka. Målet er å bygge ferdig innen <b>${formatMnok(s.target.total)} MNOK</b> og <b>${s.target.weeks} uker</b>.</p>
    <div class="cast-intro">
      <div>${icon('people/project-manager.svg', 32)}<span><b>Elisabeth</b> prosjektleder. Følger plan og budsjett, og gir deg et råd ved hvert veivalg.</span></div>
      <div>${icon('people/site-manager.svg', 32)}<span><b>Hedda</b> site manager. Kjenner plassen og formennene, og går med deg rundt.</span></div>
      <div>${icon('people/hms.svg', 32)}<span><b>Oskar</b> HMS-leder. Sjekker verneutstyret. Også ditt.</span></div>
      <div>${icon('people/foreman.svg', 32)}<span><b>Formennene</b> Formann VVS, Formann Elektro, Formann Heis … Står det et <b class="bang">!</b> over hodet deres, har de en utfordring til deg.</span></div>
    </div>
    <p class="meta">Gå rundt på byggeplassen med <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> eller piltastene, eller klikk på bakken. <kbd>E</kbd> snakker med den du står ved, <kbd>G</kbd> går til neste oppdrag. Hver uke ekstra koster ${formatFactor(s.overhead.perWeek)} MNOK i rigg og drift, og hvert veivalg er et dilemma mellom penger og tid.</p>
    <p class="meta">Hvert spill er en historie som <b>kan</b> løses innenfor begge målene. I sluttrapporten ser du hvordan, og hvordan AI-veien gikk.</p>
    <div class="choices">${DIFFICULTIES.map(d => `<button type="button" class="choice" data-action="start" data-difficulty="${d.id}"><b>${d.label}</b><span>${d.text}</span></button>`).join('')}</div>
    <label class="skip"><input type="checkbox" id="skip-intro"> Hopp over introen (rett til byggingen)</label>`, 'Nytt prosjekt');
}

const signedWeeks = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0');
const weeksWord = (n: number) => `${n} uke${Math.abs(n) === 1 ? '' : 'r'}`;

/** A person's display name, e.g. "Formann VVS" or "Elisabeth". */
export function personName(s: Scenario, id: string): string {
  return s.people.find(x => x.id === id)?.name ?? id;
}

/** The role under the name, e.g. "Prosjektleder" or "H VVS". */
export function personRole(s: Scenario, id: string): string {
  const p = s.people.find(x => x.id === id);
  if (!p) return '';
  return p.player ? 'Prosjekteier, Statsbygg' : p.taskId ? `${p.taskId} ${s.tasks.find(t => t.id === p.taskId)!.name}` : p.role;
}

/** End week and total, coloured against the targets. */
function outcomeText(s: Scenario, r: Outcome): string {
  const late = r.weeks > s.target.weeks;
  const over = Math.round(r.total * 100) > Math.round(s.target.total * 100);
  return `<span class="${late ? 'bad' : 'good'}">uke <b>${r.weeks}</b></span> · <span class="${over ? 'bad' : 'good'}"><b>${formatMnok(r.total)}</b> MNOK</span>`;
}

/** An option's effect on the end result in a few words, e.g. "+2 uker · +1,70 MNOK" or "Ingen endring". */
function shortDelta(a: Outcome, b: Outcome): string {
  const dw = a.weeks - b.weeks;
  const dm = Math.round((a.total - b.total) * 100) / 100;
  const parts = [dw ? `${signedWeeks(dw)} uke${Math.abs(dw) === 1 ? '' : 'r'}` : '', dm ? `${formatDelta(dm)} MNOK` : ''].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Ingen endring';
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

/** The panel at the bottom of the screen while the camera shows a scene on site. */
export const scenePanel = (inner: string, label: string, wide = false) =>
  `<div class="scene-panel glass${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${label}">${inner}</div>`;

const portrait = (s: Scenario, id: string, size = 56) => {
  const p = s.people.find(x => x.id === id);
  return p ? `<span class="portrait who-${id.startsWith('foreman-') ? 'foreman' : id}">${icon(p.icon, size)}</span>` : '';
};

/** One line in a scene: who speaks, in a speech panel, with «Neste». */
export function speechHtml(s: Scenario, who: string, text: string, step: number, steps: number, skip?: string): string {
  const dots = Array.from({ length: steps }, (_, i) => `<i class="${i === step ? 'on' : i < step ? 'done' : ''}"></i>`).join('');
  return `<div class="sp-line">${portrait(s, who)}<div class="sp-text"><b>${personName(s, who)}</b><small>${personRole(s, who)}</small><p>${text}</p></div></div>
    <div class="sp-actions"><span class="sp-dots" aria-hidden="true">${dots}</span>${skip ? `<button type="button" class="link" data-action="${skip}">Hopp over</button>` : ''}<button type="button" class="primary" data-action="line-next">Neste ▸</button></div>`;
}

function eventHead(s: Scenario, g: GameState): string {
  const p = g.pending!;
  const ev = eventById(p.eventId);
  const task = s.tasks.find(t => t.id === p.taskId)!;
  return `<div class="sp-head">${icon(ev.icon, 40)}<div><h2>${ev.title}</h2><p class="meta"><span class="chip kind kind-${ev.kind}">${KIND_LABEL[ev.kind]}</span> Uke ${g.week} · rammer ${task.id} ${task.name}</p></div></div>`;
}

/**
 * The challenge meeting with the foreman: first the lines (who raised it, the dilemma and the three
 * proposals, one at a time), then the decision with every proposal next to the option it backs.
 * Without a line (or past the last one) it shows the decision.
 */
export function renderEvent(s: Scenario, g: GameState, line = Infinity): string {
  const p = g.pending!;
  const ev = eventById(p.eventId);
  const lines = meetingLines(s, g);
  if (line < lines.length) {
    return scenePanel(`${eventHead(s, g)}${speechHtml(s, lines[line].who, lines[line].text, line, lines.length + 1, 'line-skip')}`, ev.title);
  }
  const label = (id: string) => ev.options.find(o => o.id === id)!.label;
  const input = foremanInput(p);
  // Only Elisabeth and Hedda propose to the player; the foreman's input is part of their basis.
  const voices = proposals(p).map(v => {
    const person = s.people.find(x => x.id === v.personId)!;
    return `<div class="voice${v.personId === 'pm' ? ' official' : ''}" title="${v.reason}">${icon(person.icon, 28)}<div>
      <b>${personName(s, v.personId)}</b>${v.raised ? ' <span class="chip">meldte saken</span>' : ''}
      <p class="voice-pick">Anbefaler «${label(v.optionId)}»</p></div></div>`;
  }).join('');
  const options = ev.options.map(o => {
    const isRec = o.id === p.recommended;
    const r = p.outcomes.find(x => x.optionId === o.id)!;
    const { now, later } = effectsOf(s, o, p.taskId);
    const backers = proposals(p).filter(v => v.optionId === o.id);
    // One short change against today per option (the totals are in the top bar); the recommended one is marked.
    const delta = `<em class="delta">${shortDelta(r, p.before)}</em>${isRec ? '<span class="chip chip-on">anbefalt</span>' : ''}`;
    const faces = backers.map(v => `<span class="backer" title="${personName(s, v.personId)}: ${v.reason}">${icon(s.people.find(x => x.id === v.personId)!.icon, 20)}${personName(s, v.personId)}</span>`).join('');
    return `<button type="button" class="choice${isRec ? ' recommended' : ''}" data-action="choose" data-option="${o.id}">
      <b>${o.label}</b>${backers.length ? `<span class="backers">${faces}</span>` : '<span class="backers none">Ingen foreslår dette</span>'}
      <span class="effect"><i>Nå:</i> ${now}</span>
      ${later ? `<span class="effect later"><i>Senere:</i> ${later}</span>` : ''}
      <span class="preview">${delta}</span></button>`;
  }).join('');
  return scenePanel(`${eventHead(s, g)}
    <p class="dilemma">${p.dilemma}</p>
    <div class="voices">${voices}</div>
    ${input ? `<p class="meta input">${icon(s.people.find(x => x.id === input.personId)!.icon, 20)} ${personName(s, input.personId)}${input.raised ? ' meldte saken og' : ''} ga Elisabeth og Hedda sitt innspill (lavest kostnad nå). Det er med i rådene deres.</p>` : ''}
    <div class="choices options">${options}</div>
    <p class="meta sp-foot">Du bestemmer. Hold musa over et navn for å se begrunnelsen. <button type="button" class="link" data-action="line-replay">Hør forslagene igjen</button></p>`, ev.title, true);
}

/** The fork card after a choice: the player's path next to the recommendation from the same state. */
export function renderFork(s: Scenario, d: Decision): string {
  const ev = eventById(d.eventId);
  const label = (id: string) => ev.options.find(o => o.id === id)!.label;
  const col = (head: string, optionId: string, r: Outcome) =>
    `<div class="fork-col"><span class="meta">${head}</span><b>«${label(optionId)}»</b><span>${outcomeText(s, r)}</span></div>`;
  const body = d.followed
    ? `<p class="fork-same">Du fulgte anbefalingen.</p><div class="fork one">${col('Ditt valg = Elisabeths anbefaling', d.chosen, d.chosenOutcome)}</div>`
    : `<div class="fork">${col('Ditt valg', d.chosen, d.chosenOutcome)}${col('Elisabeths anbefaling', d.recommended, d.recommendedOutcome)}</div>
       <p class="dilemma">Ditt valg gir ${deltaText(d.chosenOutcome, d.recommendedOutcome)} mot anbefalingen.</p>`;
  return scenePanel(`<div class="sp-head">${icon('decisions/decision-point.svg', 40)}<div><h2>Veivalg: ${ev.title}</h2>
    <p class="meta"><span class="chip kind kind-${ev.kind}">${KIND_LABEL[ev.kind]}</span> Uke ${d.week} · mål ${s.target.weeks} uker og ${formatMnok(s.target.total)} MNOK</p></div></div>
    ${body}
    <p class="meta">Begge veiene er regnet frem fra samme tilstand, uten nye hendelser.</p>
    <div class="sp-actions"><button type="button" class="primary" data-action="fork-continue">Avslutt møtet ▸</button></div>`, 'Veivalg');
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

export type DialogId = 'start' | 'hms' | 'kickoff' | 'fork' | 'event' | 'review' | 'final' | 'talk';

/**
 * Which dialog or scene to show. A fork card comes before a queued decision, so no fork is skipped.
 * A decision only opens when the player has walked to the foreman (the meeting is on); until then
 * the open challenge is an objective on site.
 */
export function dialogFor(g: GameState | undefined, ui: Pick<PlayUi, 'forkSeen' | 'finalSeen' | 'phase' | 'meeting' | 'hms' | 'reviewed' | 'talk'>): DialogId | null {
  if (!g) return 'start';
  if (ui.hms) return 'hms';
  if (ui.phase === 'intro') return null;
  if (ui.phase === 'kickoff') return 'kickoff';
  if (g.decisions.length > ui.forkSeen) return 'fork';
  if (g.pending) return ui.meeting ? 'event' : null;
  if (!g.done && g.chapter > ui.reviewed) return 'review';
  if (g.done && !ui.finalSeen) return 'final';
  if (ui.talk) return 'talk';
  return null;
}

/** Dialogs that stop the clock until they are closed. */
export const BLOCKING: DialogId[] = ['hms', 'kickoff', 'fork', 'event', 'review'];

const MODE_NAME = { normal: 'normaltid', overtime: 'overtid', hire: 'ekstra innleie' } as const;

export const planText = (changes: StaffingChange[]) =>
  changes.map(c => `${c.taskId} ${MODE_NAME[c.mode]}`).join(', ');

function storyHtml(story: Story | undefined): string {
  if (!story) return '';
  const steps = story.steps.map(st => {
    if (st.kind === 'plan') return `<li>Uke ${st.week}: Elisabeth bemanner (${planText(st.changes)}).</li>`;
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
    ${ai ? '<p class="meta">AI-veien spiller samme scenario med Elisabeths bemanning og anbefaling ved hvert valg. Den kan møte andre hendelser enn du gjorde.</p>' : ''}`;
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

export function renderFinal(s: Scenario, g: GameState, story?: Story, ai?: Story, scolded = 0): string {
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
    <p class="meta">${icon('people/hms.svg', 20)} HMS: ${scolded === 0 ? 'Oskar ga deg aldri tilsnakk. Et forbilde på plassen!' : `Oskar måtte gi deg tilsnakk ${scolded} gang${scolded === 1 ? '' : 'er'}. Alle gikk likevel hjem hele.`}</p>
    ${compareHtml(s, { weeks: g.week, total, decisions }, ai, story)}
    ${decisionsHtml(g)}
    ${storyHtml(story)}
    <div class="choices row"><button type="button" class="choice" data-action="close-final"><b>Se resultatet</b></button><button type="button" class="choice" data-action="new"><b>Nytt spill</b></button></div>`, 'Sluttrapport');
}
