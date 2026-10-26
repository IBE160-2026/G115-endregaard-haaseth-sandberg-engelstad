// The game HUD that floats over the full-screen 3D site: the top bar with week and money gauges,
// the panel rail on the left and the play dock at the bottom.
import { CHAPTERS } from '../engine/chapters';
import { EVENTS } from '../engine/events';
import { canTrigger, spent, type GameState } from '../engine/game';
import type { Scenario } from '../engine/scenario';
import type { SimulationResult } from '../engine/simulate';
import { VERSION } from '../version';
import { budgetOf } from './budgetLines';
import { formatMnok } from './format';
import type { PlayUi, Speed } from './play';
import { icon } from './tabs/context';

export type TabId = 'people' | 'buildings' | 'disciplines' | 'budget' | 'schedule';

export const TABS: { id: TabId; label: string }[] = [
  { id: 'people', label: 'Menneskene' },
  { id: 'buildings', label: 'Byggene' },
  { id: 'disciplines', label: 'Disiplinene' },
  { id: 'budget', label: 'Budsjett' },
  { id: 'schedule', label: 'Fremdriftsplan' },
];

/** Which gauge changed since the last render, so it can flash once. */
export interface Flash { money?: 'up' | 'down'; weeks?: 'up' | 'down' }

const pct = (x: number) => `${Math.max(0, Math.min(100, x * 100)).toFixed(1)}%`;

export function renderTop(s: Scenario, g: GameState | undefined, f: SimulationResult, flash: Flash): string {
  const week = g?.week ?? 0;
  const total = budgetOf(f).total;
  const used = g ? spent(g) : 0;
  const over = total > s.target.total + 0.005;
  const late = f.weeks > s.target.weeks;
  // Both gauges share a scale with room above the target, so the target mark sits at a fixed place.
  const moneyMax = Math.max(s.target.total * 1.08, total);
  const weekMax = Math.max(s.target.weeks * 1.15, f.weeks);
  const chapter = g && g.chapter >= 0 ? CHAPTERS[g.chapter].title : g ? 'Prolog: prosjektering' : 'Ikke startet';
  const status = !g ? '' : g.done ? '<span class="pill">Ferdig</span>' : g.pending ? '<span class="pill warn">Beslutning</span>' : '';
  return `
    <div class="brand">
      <span class="logo" aria-hidden="true"></span>
      <div><b>${s.name}</b><small>Prosjektsimulator ${VERSION}</small></div>
    </div>
    <div class="weekcard">
      <span class="label">Uke</span><b class="big">${week}</b>
      <div class="chapter"><small>${chapter}</small>${status}</div>
    </div>
    <div class="gauge ${late ? 'bad' : 'good'}${flash.weeks ? ` flash-${flash.weeks}` : ''}" title="Uke ${week} · prognose ferdig uke ${f.weeks} · mål ${s.target.weeks}">
      <div class="gauge-head"><span>Ferdig</span><b>uke ${f.weeks}</b><small>mål ${s.target.weeks}</small></div>
      <div class="bar"><i class="fill" style="width:${pct(week / weekMax)}"></i><i class="ghost" style="width:${pct(f.weeks / weekMax)}"></i><i class="mark" style="left:${pct(s.target.weeks / weekMax)}"></i></div>
    </div>
    <div class="gauge ${over ? 'bad' : 'good'}${flash.money ? ` flash-${flash.money}` : ''}" title="Påløpt ${formatMnok(used)} · prognose ${formatMnok(total)} · mål ${formatMnok(s.target.total)} MNOK">
      <div class="gauge-head"><span>Prognose</span><b>${formatMnok(total)}</b><small>/ ${formatMnok(s.target.total)} MNOK</small></div>
      <div class="bar"><i class="fill" style="width:${pct(used / moneyMax)}"></i><i class="ghost" style="width:${pct(total / moneyMax)}"></i><i class="mark" style="left:${pct(s.target.total / moneyMax)}"></i></div>
    </div>`;
}

export function renderRail(open: TabId | null, feedOpen: boolean, alerts: number): string {
  return `${TABS.map(t => `<button type="button" class="rail-btn${open === t.id ? ' active' : ''}" data-tab="${t.id}" title="${t.label}" aria-pressed="${open === t.id}">${icon(`apps/${t.id}.svg`, 24)}<span>${t.label}</span></button>`).join('')}
    <span class="rail-sep"></span>
    <button type="button" class="rail-btn${feedOpen ? ' active' : ''}" data-action="feed" title="Meldinger" aria-pressed="${feedOpen}">${icon('ai/ai-advisor.svg', 24)}<span>Meldinger</span>${alerts ? `<em class="badge">${alerts}</em>` : ''}</button>`;
}

const dockBtn = (action: string, label: string, ic: string, extra = '') =>
  `<button type="button" class="dock-btn" data-action="${action}" title="${label}" ${extra}>${icon(ic, 22)}<span>${label}</span></button>`;

export function renderDock(s: Scenario, g: GameState | undefined, ui: PlayUi): string {
  const off = !g || g.done || !!g.pending ? 'disabled' : '';
  const speeds = ([1, 2, 4] as Speed[]).map(v =>
    `<button type="button" data-action="speed" data-speed="${v}" aria-pressed="${ui.speed === v}">${v}×</button>`).join('');
  const menu = ui.menu && g
    ? `<div class="menu" role="menu">${EVENTS.filter(e => e.button).map(e =>
      `<button type="button" role="menuitem" data-action="trigger" data-event="${e.id}"${canTrigger(s, g, e.id) ? '' : ' disabled'}>${icon(e.icon, 20)}<span>${e.title}<small>${e.taskIds.join(', ')}</small></span></button>`).join('')}</div>`
    : '';
  // White glyphs on the round accent button.
  const glyph = ui.playing ? '<rect x="7" y="5" width="4" height="14" rx="1"/><rect x="13" y="5" width="4" height="14" rx="1"/>' : '<path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/>';
  const play = `<button type="button" class="play-btn" data-action="${ui.playing ? 'pause' : 'play'}" title="${ui.playing ? 'Pause' : 'Spill av'} (mellomrom)" aria-label="${ui.playing ? 'Pause' : 'Spill av'}" ${ui.playing ? '' : off}><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">${glyph}</svg></button>`;
  return `
    ${dockBtn('step', 'Neste uke', 'controls/step.svg', `${off} title="Neste uke (N)"`)}
    ${play}
    <div class="seg speed" role="group" aria-label="Hastighet">${speeds}</div>
    <span class="dock-sep"></span>
    <div class="menu-wrap">${dockBtn('menu', 'Scenarioer', 'risks/R6-water.svg', `aria-expanded="${ui.menu}" ${g && !g.done ? '' : 'disabled'}`)}${menu}</div>
    ${dockBtn('camera', 'Kamera', 'apps/view3d.svg', 'title="Tilbake til oversikt (C)"')}
    ${dockBtn('new', 'Nytt spill', 'controls/new-game.svg')}`;
}
