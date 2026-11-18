// The story arc: six chapters, each opened by the Prosjektleder. Task A (Prosjektering)
// is the prologue and not a chapter of its own.
import type { GameState } from './game';
import type { Scenario } from './scenario';

export interface Chapter {
  id: string;
  title: string;
  taskIds: string[];
  /** The Prosjektleder's intro when the chapter opens. */
  intro: string;
}

export const PROLOGUE =
  'Velkommen, prosjekteier. Prosjekteringen og byggesøknaden er i gang. Når byggegropen kan åpnes, starter den første etappen. Jeg melder fra underveis.';

export const CHAPTERS: Chapter[] = [
  {
    id: 'ground', title: 'Grunnarbeid', taskIds: ['C', 'D'],
    intro: 'Kapittel 1 – Grunnarbeid. Vi sprenger ut gropen og fundamenterer. Grunnen i sentrum skjuler overraskelser: vann, forurensning og dårlig fjell.',
  },
  {
    id: 'basement', title: 'Kjeller', taskIds: ['E', 'L'],
    intro: 'Kapittel 2 – Kjeller. Kjellerkonstruksjonen ligger på kritisk linje, og kjellerteknikken har god slakk. Følg med på vær og grunnvann.',
  },
  {
    id: 'structure', title: 'Råbygg', taskIds: ['F', 'O'],
    intro: 'Kapittel 3 – Råbygg. Kontorblokka reiser seg. Råbygget er den største disiplinen på kritisk linje: hver uke her koster rigg og drift.',
  },
  {
    id: 'envelope', title: 'Tett bygg', taskIds: ['G'],
    intro: 'Kapittel 4 – Tett bygg. Tak og fasade gjør bygget tett. Leveranser og kran styrer tempoet nå.',
  },
  {
    id: 'services', title: 'Teknikk og innredning', taskIds: ['H', 'I', 'J', 'K'],
    intro: 'Kapittel 5 – Teknikk og innredning. Flest folk på plassen. Elkraft og automasjon er kritiske, VVS og innredning har slakk.',
  },
  {
    id: 'handover', title: 'Overlevering', taskIds: ['N'],
    intro: 'Kapittel 6 – Overlevering. Prøvedrift og overtakelse. Nå avgjøres om vi treffer budsjett og plan.',
  },
];

const chapterIndexOf = (taskId: string) => CHAPTERS.findIndex(c => c.taskIds.includes(taskId));

/**
 * The chapter of the earliest unfinished non-A task that has started (earliest start,
 * then task order), or null in the prologue and after completion.
 */
export function chapterOf(s: Scenario, g: GameState): Chapter | null {
  let best: { start: number; i: number } | null = null;
  s.tasks.forEach((task, i) => {
    const t = g.tasks[i];
    if (task.id === 'A' || t.start === null || t.finish !== null) return;
    if (!best || t.start < best.start) best = { start: t.start, i };
  });
  if (!best) return null;
  const k = chapterIndexOf(s.tasks[(best as { i: number }).i].id);
  return k < 0 ? null : CHAPTERS[k];
}
