import { formatFactor } from '../format';
import { icon, type TabContext } from './context';

export function renderPeople({ scenario, result }: TabContext): string {
  const cards = scenario.people.map(p => {
    let crew = '';
    if (p.taskId) {
      const t = result.tasks.find(t => t.id === p.taskId)!;
      const hired = t.hiredCrew ? ` + ${t.hiredCrew} innleid` : '';
      crew = `<div class="meta">Mannskap: ${t.ownCrew}${hired} · ${formatFactor(t.hoursPerWeek)} t/uke</div>`;
    }
    const title = p.taskId ? `${p.role} – ${p.taskId}` : p.role;
    return `<article class="card person">${icon(p.icon, 40)}<div><h3>${title}</h3><p>${p.description}</p>${crew}</div></article>`;
  });
  return `<p class="lead">Prosjektets nøkkelpersoner og én formann per disiplin.</p><div class="cards">${cards.join('')}</div>`;
}
