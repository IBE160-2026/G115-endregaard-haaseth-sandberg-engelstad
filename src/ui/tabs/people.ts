// Menneskene as an interactive org chart: the owner (player) at the top, two AI
// roles reporting to the owner, and the foremen under one of them.
import { adviceFor } from '../../engine/advisor';
import { eventById } from '../../engine/events';
import type { Person } from '../../engine/scenario';
import { formatFactor } from '../format';
import { planText } from '../play';
import { crewControl, modeControl } from './controls';
import { icon, type TabContext } from './context';

function node(ctx: TabContext, p: Person): string {
  const { scenario, game, selected } = ctx;
  let status = p.player ? '<span class="chip chip-on">Du</span>' : '<span class="chip">AI-rolle</span>';
  let bar = '';
  if (p.taskId && game) {
    const i = scenario.tasks.findIndex(t => t.id === p.taskId);
    const t = game.tasks[i];
    const share = t.hoursDone / scenario.tasks[i].hours;
    status = t.finish !== null ? '<span class="chip chip-on">Ferdig</span>' : t.start !== null ? '<span class="chip chip-busy">Pågår</span>' : '<span class="chip">Venter</span>';
    bar = `<div class="progress" aria-hidden="true"><i style="width:${Math.round(share * 100)}%"></i></div>`;
  }
  const alert = game?.pending && eventById(game.pending.eventId).raisedBy === p.id ? '<span class="alert" title="Trenger beslutning">!</span>' : '';
  const title = p.taskId ? `${p.role} ${p.taskId}` : p.role;
  const sub = p.taskId ? p.description : p.player ? 'Spiller' : 'AI-rolle';
  return `<button type="button" class="org-node${selected === p.id ? ' selected' : ''}${p.player ? ' player' : ''}" data-person="${p.id}" aria-pressed="${selected === p.id}">
    ${icon(p.icon, 32)}<span class="org-text"><b>${title}</b><small>${sub}</small>${bar}</span>${status}${alert}</button>`;
}

function details(ctx: TabContext): string {
  const { scenario, game, result, selected } = ctx;
  const p = scenario.people.find(x => x.id === (selected ?? 'owner'))!;
  const lines = game && !p.player ? adviceFor(p.id, scenario, game, result) : [];
  let controls = '';
  if (p.taskId) {
    const i = scenario.tasks.findIndex(t => t.id === p.taskId);
    const t = result.tasks[i];
    const locked = !game || game.tasks[i].finish !== null || game.done;
    controls = `<h3>Mannskap og arbeidsmodus</h3>
      ${crewControl(scenario, p.taskId, t.ownCrew, locked)}
      ${modeControl(p.taskId, t.mode, locked)}
      <p class="meta">${t.hiredCrew ? `+ ${t.hiredCrew} innleid · ` : ''}${formatFactor(t.hoursPerWeek)} t/uke · uke ${t.start}–${t.finish} i prognosen</p>`;
  }
  const plan = p.id === 'pm' && ctx.plan?.length
    ? `<h3>Bemanningsplan</h3><p class="meta">Prosjektlederen vil bruke mannskapene slik: ${planText(ctx.plan)}.</p>
       <button type="button" class="tool" data-action="pm-plan">${icon('people/project-manager.svg', 20)}<span>Følg prosjektlederens plan</span></button>`
    : p.id === 'pm' && game ? '<p class="meta">Bemanningen er allerede den beste prosjektlederen finner.</p>' : '';
  const reports = scenario.people.filter(x => x.reportsTo === p.id).map(x => x.taskId ?? x.role).join(', ');
  const ev = game?.pending ? eventById(game.pending.eventId) : null;
  const challenge = ev && ev.raisedBy === p.id
    ? `<h3>Aktiv utfordring</h3><p class="meta"><b>${ev.title}</b> (${game!.pending!.taskId}). Anbefaler «${ev.options.find(o => o.id === game!.pending!.recommended)!.label}».</p>`
    : !p.player && game ? '<p class="meta">Ingen aktive utfordringer.</p>' : '';
  return `<aside class="details card">
    <div class="details-head">${icon(p.icon, 48)}<div><h2>${p.taskId ? `${p.role} ${p.taskId}` : p.role}</h2><p>${p.description}</p></div></div>
    ${p.player ? '<p class="meta">Du tar de endelige beslutningene. Prosjektleder og Site manager rapporterer til deg.</p>' : `<p class="meta">AI-rolle (regelbasert) · rapporterer til ${scenario.people.find(x => x.id === p.reportsTo)?.role}</p>`}
    ${reports ? `<p class="meta">Har ansvar for: ${reports}</p>` : ''}
    ${challenge}
    ${plan}
    ${lines.length ? `<h3>Rapport</h3><ul class="advice">${lines.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}
    ${controls}
  </aside>`;
}

export function renderPeople(ctx: TabContext): string {
  const { scenario } = ctx;
  const children = (id: string) => scenario.people.filter(p => p.reportsTo === id);
  const branch = (p: Person): string => {
    const kids = children(p.id);
    return `<li>${node(ctx, p)}${kids.length ? `<ul>${kids.map(branch).join('')}</ul>` : ''}</li>`;
  };
  const owner = scenario.people.find(p => p.player)!;
  return `<p class="lead">Klikk på en person for å se rapporten deres og styre mannskap og arbeidsmodus.</p>
    <div class="org-layout"><div class="org"><ul class="tree">${branch(owner)}</ul></div>${details(ctx)}</div>`;
}
