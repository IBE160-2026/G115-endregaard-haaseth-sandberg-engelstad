// The playable story around the simulation: the intro at the gate, Oskar's HMS checks, the
// start-up and staffing meetings, and the script of every challenge meeting with the foreman.
// Pure (no DOM, no three.js): main.ts keeps the state and the scene shows it.
import { CHAPTERS } from '../engine/chapters';
import { eventById } from '../engine/events';
import type { GameState, Pending } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import type { SimulationResult } from '../engine/simulate';
import { formatMnok } from './format';
import { GATE_IN, OFFICE_MEET, foremanSpot, type P2 } from './scene/walk';

/** Protective gear. The player arrives with the first three; Oskar makes sure of the rest. */
export type Ppe = 'helmet' | 'vest' | 'boots' | 'glasses' | 'ears' | 'strap' | 'gloves';
export const PPE_LABEL: Record<Ppe, string> = {
  helmet: 'Hjelm', vest: 'Refleksvest', boots: 'Vernesko', glasses: 'Vernebriller', ears: 'Hørselvern', strap: 'Hakestropp', gloves: 'Arbeidshansker',
};
export const BASE_PPE: Ppe[] = ['helmet', 'vest', 'boots'];

export type Phase = 'intro' | 'kickoff' | 'play';

/** The story's state in the UI (presentation only: it never changes the simulation). */
export interface StoryUi {
  phase: Phase;
  /** The player has walked to the open challenge, and the meeting is on. */
  meeting: boolean;
  /** Line shown in the current scene (meeting, kickoff, staffing review or HMS check). */
  line: number;
  /** The HMS check in progress, and the ones done. */
  hms: string | null;
  hmsSeen: string[];
  /** The answer chosen in the HMS check in progress. */
  hmsReply: string | null;
  /** Times Oskar had to tell the player off. */
  scolded: number;
  /** The latest chapter whose staffing review is closed (−1 = none). */
  reviewed: number;
  /** The person the player is talking to. */
  talk: string | null;
}

export const newStory = (skipIntro = false): StoryUi => ({
  phase: skipIntro ? 'play' : 'intro', meeting: false, line: 0, hms: null, hmsSeen: skipIntro ? ['intro'] : [], hmsReply: null, scolded: 0, reviewed: -1, talk: null,
});

/** The gear the player wears after the checks so far. */
export const ppeOf = (ui: Pick<StoryUi, 'hmsSeen'>): Ppe[] =>
  [...BASE_PPE, ...HMS_CHECKS.filter(c => ui.hmsSeen.includes(c.id)).map(c => c.item)];

export interface HmsReply { id: string; label: string; answer: string; scolded: boolean }
export interface HmsCheck {
  id: string;
  /** The chapter that opens the check (−1 = at the gate). */
  chapter: number;
  item: Ppe;
  opener: string;
  replies: HmsReply[];
  outro: string;
}

export const HMS_CHECKS: HmsCheck[] = [
  {
    id: 'intro', chapter: -1, item: 'glasses',
    opener: 'STOPP der! Oskar, HMS. Ingen kommer inn porten før jeg har sett på utstyret. Hjelm, ja. Vest, ja. Vernesko, ja … Og vernebrillene? Har du tenkt å se på sprengningen med de blå øynene dine?',
    replies: [
      { id: 'sorry', label: '«Beklager, Oskar. Jeg tar på et par nå.»', answer: 'Flott! Her, rett fra kassen. Sånn, ja. Nå ser du ut som en som skal bygge regjeringskvartal.', scolded: false },
      { id: 'boss', label: '«Jeg er byggherren. Jeg skal bare titte litt.»', answer: 'Byggherre? Da er du den som skal gå foran med et godt eksempel! Steinflis bryr seg ikke om stillingstittelen din. Brillene på, takk.', scolded: true },
      { id: 'sun', label: '«Jeg har solbriller i lomma, holder ikke det?»', answer: 'Solbriller stopper sola, ikke en spikerbit. Her, ta disse. Og solbrillene kan du bruke på ferie når bygget er ferdig.', scolded: true },
    ],
    outro: 'Takk! Trygg dag. Husk: vi bygger for at alle skal gå hjem hele. Elisabeth og Hedda venter på deg ved brakkeriggen.',
  },
  {
    id: 'ground', chapter: 0, item: 'ears',
    opener: 'Hei igjen! Det smeller i gropa i dag, 130 desibel på det meste. Hvor er hørselvernet ditt?',
    replies: [
      { id: 'thanks', label: '«Takk for at du minner meg på det.»', answer: 'Det er jobben min. Øreklokker på, så kan du nyte sprengningen i stereo.', scolded: false },
      { id: 'fingers', label: '«Jeg holder meg for ørene når det smeller.»', answer: 'Med begge hendene? Og hvem holder kaffen da? Øreklokker på, sjef.', scolded: true },
    ],
    outro: 'Sånn. Og hold deg bak sperringen når de roper «salve!».',
  },
];
export const hmsById = (id: string) => HMS_CHECKS.find(c => c.id === id)!;

/** The next HMS check that is due: a chapter that has been reviewed and has a check not yet done. */
export function hmsDue(ui: Pick<StoryUi, 'hmsSeen' | 'reviewed' | 'phase'>): HmsCheck | null {
  if (ui.phase !== 'play') return null;
  return HMS_CHECKS.find(c => c.chapter >= 0 && c.chapter <= ui.reviewed && !ui.hmsSeen.includes(c.id)) ?? null;
}

/** Where the player should go now, and who waits there (marked with «!» on site). */
export interface Objective { id: string; spot: P2; title: string; text: string }

export function objectiveFor(s: Scenario, g: GameState | undefined, ui: StoryUi): Objective | null {
  if (!g || g.done) return null;
  if (ui.phase === 'intro') {
    if (!ui.hmsSeen.includes('intro')) return { id: 'hms', spot: GATE_IN, title: 'Gå inn på byggeplassen', text: 'Gå inn porten. Oskar fra HMS står ved porten.' };
    return { id: 'pm', spot: OFFICE_MEET, title: 'Oppstartsmøte', text: 'Gå til brakkeriggen. Elisabeth og Hedda venter på deg.' };
  }
  if (g.pending && !ui.meeting) {
    const ev = eventById(g.pending.eventId);
    const host = `foreman-${g.pending.taskId}`;
    return { id: host, spot: foremanSpot(g.pending.taskId), title: ev.title, text: `${personName(s, host)} har en utfordring. Gå dit sammen med Elisabeth og Hedda.` };
  }
  return null;
}

const personName = (s: Scenario, id: string) => s.people.find(p => p.id === id)?.name ?? id;

/** One line in a scene. */
export interface Line { who: string; text: string }

/** The meeting about the open challenge: the raiser explains, the dilemma, the foreman's input, then the two proposals. */
export function meetingLines(s: Scenario, g: GameState): Line[] {
  const p = g.pending!;
  const ev = eventById(p.eventId);
  const host = `foreman-${p.taskId}`;
  const lines: Line[] = [];
  const hello = ev.kind === 'strategy' ? 'Godt dere kom. Vi starter snart, og metoden må bestemmes nå.' : ev.kind === 'opportunity' ? 'Godt dere kom. Jeg har en mulighet til dere.' : ev.kind === 'change' ? 'Godt dere kom. Det har kommet et endringsønske.' : 'Godt dere kom. Vi har et problem.';
  lines.push({ who: host, text: `${hello} ${ev.raisedBy === host ? ev.description : ''}`.trim() });
  if (ev.raisedBy !== host) lines.push({ who: ev.raisedBy, text: ev.description });
  lines.push({ who: 'pm', text: p.dilemma.replace(/^Dilemma: /, 'Dilemmaet er: ') });
  // The foreman's view (cost now) goes to Elisabeth and Hedda as input, not to the player:
  // Hedda passes it on, then Hedda (time) and Elisabeth (both targets) give their proposals.
  const input = foremanInput(p);
  if (input) lines.push({ who: 'site', text: `${personName(s, input.personId)} har gitt Elisabeth og meg sitt innspill om hva som er billigst for laget nå. Det har vi tatt med i rådene våre.` });
  const site = p.voices.find(v => v.personId === 'site');
  if (site) lines.push({ who: 'site', text: `Fra plassen: ${site.reason}` });
  const pm = p.voices.find(v => v.personId === 'pm');
  if (pm) lines.push({ who: 'pm', text: pm.reason });
  return lines;
}

/** The foreman's input to Elisabeth and Hedda (part of the AI's basis, not a proposal to the player). */
export const foremanInput = (p: Pending) => p.voices.find(v => v.personId.startsWith('foreman-'));

/** The proposals the player gets: Elisabeth's and Hedda's. */
export const proposals = (p: Pending) => p.voices.filter(v => v.personId === 'pm' || v.personId === 'site');

/** Who stands in the meeting: the host foreman first, then the player and the two leaders. */
export function meetingCast(p: Pending): string[] {
  return [`foreman-${p.taskId}`, 'owner', 'pm', 'site'];
}

/** The start-up meeting at the site offices, before the plan review. */
export function kickoffLines(s: Scenario): Line[] {
  return [
    { who: 'pm', text: 'Velkommen til Regjeringskvartalet! Fint at Oskar fikk brillene på deg. Jeg er Elisabeth, prosjektleder. Jeg følger plan, budsjett og prognose, og gir deg et råd ved hvert veivalg.' },
    { who: 'site', text: 'Og jeg er Hedda, site manager. Jeg har formennene og alt som skjer på plassen. Når en formann står med et utropstegn over hodet, går vi dit sammen.' },
    { who: 'pm', text: `Målet er ${s.target.weeks} uker og ${formatMnok(s.target.total)} MNOK. Formennene har estimert timene for hver disiplin. Se over forslagene deres: treffer vi på timene, eller skal vi sette på flere folk?` },
    { who: 'site', text: 'Husk at flere folk ikke alltid gir mer fart. Over grunnbemanningen går de i veien for hverandre, og overtid og innleie koster mer per time.' },
  ];
}

/** The staffing review when a chapter opens: Hedda brings the chapter's foremen. */
export function reviewTasks(s: Scenario, g: GameState, ui: Pick<StoryUi, 'reviewed'>): string[] {
  const ids: string[] = [];
  for (let k = ui.reviewed + 1; k <= g.chapter; k++) ids.push(...CHAPTERS[k].taskIds);
  return ids.filter(id => g.tasks[s.tasks.findIndex(t => t.id === id)].finish === null);
}

export function reviewLine(s: Scenario, g: GameState, ids: string[]): Line {
  const c = CHAPTERS[g.chapter];
  const names = ids.map(id => personName(s, `foreman-${id}`));
  const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} og ${names[names.length - 1]}` : names[0] ?? 'formennene';
  return { who: 'site', text: `${c.title}! ${list} er klare. Se over timene og bemanningen før vi kjører videre.` };
}

/**
 * A foreman's pitch for the plan, in a few words. The hours and weeks are in the table next to
 * it, so the pitch only says what they mean.
 */
export function foremanPitch(s: Scenario, g: GameState | undefined, f: SimulationResult, taskId: string): string {
  const i = s.tasks.findIndex(t => t.id === taskId);
  const task = s.tasks[i];
  const st = g?.tasks[i];
  if (st && st.crew < task.crew) return 'Vi er for få. Det tar lengre tid.';
  if (st && st.crew > task.crew) return 'Vi er for mange. Folk går i veien for hverandre.';
  return f.tasks[i].critical ? 'Kritisk linje: hver uke vi sparer, sparer hele prosjektet.' : 'Slakk: fart her gir ingenting.';
}
