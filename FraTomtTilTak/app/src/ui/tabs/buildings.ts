import { formatInt } from '../format';
import { icon, type TabContext } from './context';

export function renderBuildings({ scenario }: TabContext): string {
  const phases = [...new Set(scenario.buildings.map(b => b.phase))];
  const sections = phases.map(phase => {
    const cards = scenario.buildings.filter(b => b.phase === phase).map(b => {
      const chip = b.simulation
        ? '<span class="chip chip-on">I simulering</span>'
        : '<span class="chip">Ikke i scenarioet</span>';
      const sim = b.simulation
        ? `<div class="meta">Light-beregning: ${formatInt(b.simulation.areaM2)} m² BTA · Disipliner: ${b.simulation.taskIds.join(', ')}</div>`
        : '';
      const facts = b.facts ? `<ul class="facts">${b.facts.map(f => `<li>${f}</li>`).join('')}</ul>` : '';
      return `<article class="card building${b.simulation ? ' in-sim' : ''}${b.facts ? ' wide' : ''}">${icon(b.icon, 40)}<div><h3>${b.name}</h3><p>${b.kind} · ${b.status}</p>${facts}${sim}${chip}</div></article>`;
    });
    return `<h2>${phase}</h2><div class="cards">${cards.join('')}</div>`;
  });
  return `<p class="lead">Byggetrinnene i det virkelige Nytt regjeringskvartal. Scenarioet <b>${scenario.name}</b> simulerer A-blokka med kjelleranlegget.</p>
    <p class="note">Faktaene og 3D-visningen viser byggene slik de er bygget (A-blokka: 11 etasjer). Kostnad og fremdrift regnes med Light-versjonen (11 000 m² kontor + 4 000 m² kjeller).</p>
    ${sections.join('')}`;
}
