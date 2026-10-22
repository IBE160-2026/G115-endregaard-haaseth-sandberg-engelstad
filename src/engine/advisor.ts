// Rule-based status and advice from the AI roles, read from the game and its forecast.
import { crewBounds, type GameState } from './game';
import type { Scenario } from './scenario';
import type { SimulationResult } from './simulate';

const pct = (x: number) => `${Math.round(x * 100)} %`;

export function adviceFor(personId: string, s: Scenario, g: GameState, f: SimulationResult): string[] {
  const open = s.tasks.filter((_, i) => g.tasks[i].finish === null);
  const critical = new Set(f.criticalPath);

  if (personId === 'pm') {
    const out: string[] = [];
    const late = f.weeks - s.target.weeks;
    const over = f.total - s.target.total;
    out.push(late > 0 ? `Prognosen er ${late} uker etter planen.` : late < 0 ? `Prognosen er ${-late} uker foran planen.` : 'Prognosen treffer planlagt ferdigstillelse.');
    out.push(over > 0.005 ? `Prognosen er ${over.toFixed(2).replace('.', ',')} MNOK over budsjett.` : 'Prognosen er innenfor budsjett.');
    const nextCritical = open.find(t => critical.has(t.id) && g.tasks[s.tasks.indexOf(t)].mode === 'normal');
    if (nextCritical) {
      out.push(`Hver uke på kritisk linje koster ${String(s.overhead.perWeek).replace('.', ',')} MNOK i rigg og drift. Vurder overtid eller innleie på ${nextCritical.id} ${nextCritical.name}.`);
    }
    const wasted = open.filter(t => critical.has(t.id) === false && g.tasks[s.tasks.indexOf(t)].mode !== 'normal');
    if (wasted.length) out.push(`${wasted.map(t => t.id).join(', ')} har slakk. Ekstra innsats der gir ingen tid, bare kostnad.`);
    return out;
  }

  if (personId === 'site') {
    const active = s.tasks.filter((_, i) => g.tasks[i].start !== null && g.tasks[i].finish === null);
    const out = [active.length ? `Pågår nå: ${active.map(t => `${t.id} ${t.name}`).join(', ')}.` : 'Ingen arbeid pågår akkurat nå.'];
    for (const t of active) {
      const st = g.tasks[s.tasks.indexOf(t)];
      if (st.stall > 0) out.push(`${t.id} står stille i ${st.stall} uker til.`);
      if (st.crew < t.crew && critical.has(t.id)) out.push(`${t.id} er underbemannet på kritisk linje (${st.crew} av ${t.crew}).`);
    }
    return out;
  }

  const taskId = personId.replace('foreman-', '');
  const i = s.tasks.findIndex(t => t.id === taskId);
  if (i < 0) return [];
  const task = s.tasks[i];
  const st = g.tasks[i];
  if (st.finish !== null) return [`Ferdig i uke ${st.finish}.`];
  const out = [st.start === null ? `Starter i uke ${f.tasks[i].start} etter planen.` : `${pct(st.hoursDone / task.hours)} ferdig.`];
  const { min, max } = crewBounds(s, task);
  if (st.crew < task.crew) out.push(`Underbemannet: ${st.crew} av ${task.crew}. Det går saktere, og forsinkelse koster rigg og drift.`);
  if (st.crew > task.crew) out.push(`Overbemannet: ${st.crew} av ${task.crew}. Folk går i veien for hverandre, så timene blir dyrere.`);
  if (st.crew === task.crew) out.push(`Grunnbemanning ${task.crew} (kan velge ${min}–${max}).`);
  out.push(critical.has(task.id) ? 'Ligger på kritisk linje.' : `Har ${f.tasks[i].slack} uker slakk.`);
  return out;
}
