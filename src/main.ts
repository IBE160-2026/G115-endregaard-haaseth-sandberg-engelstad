// The in-game Windows-style desktop: one app window with five tabs and a taskbar.
import './styles.css';
import { scenario, type Mode } from './engine/scenario';
import { simulate, type Modes } from './engine/simulate';
import { budgetOf } from './ui/budgetLines';
import { formatMnok } from './ui/format';
import { criticalList, icon, type TabContext } from './ui/tabs/context';
import { renderBuildings } from './ui/tabs/buildings';
import { renderBudget } from './ui/tabs/budget';
import { renderDisciplines } from './ui/tabs/disciplines';
import { renderPeople } from './ui/tabs/people';
import { renderSchedule } from './ui/tabs/schedule';

type TabId = 'people' | 'buildings' | 'disciplines' | 'budget' | 'schedule';

const TABS: { id: TabId; label: string; render: (ctx: TabContext) => string }[] = [
  { id: 'people', label: 'Menneskene', render: renderPeople },
  { id: 'buildings', label: 'Byggene', render: renderBuildings },
  { id: 'disciplines', label: 'Disiplinene', render: renderDisciplines },
  { id: 'budget', label: 'Budsjett', render: renderBudget },
  { id: 'schedule', label: 'Fremdriftsplan', render: renderSchedule },
];

// Title-bar glyphs as inline SVG, so they render on every OS (not only with Segoe Fluent Icons).
const glyph = (d: string) => `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1">${d}</svg>`;
const CAPTION = {
  min: glyph('<path d="M0 5.5h10"/>'),
  max: glyph('<rect x=".5" y=".5" width="9" height="9" rx="1"/>'),
  close: glyph('<path d="M.5 .5l9 9M9.5 .5l-9 9"/>'),
};

const baseline = simulate(scenario);
const state: { tab: TabId; modes: Modes } = { tab: 'people', modes: {} };

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="desktop">
    <div class="window">
      <header class="titlebar">
        ${icon('apps/schedule.svg', 16)}<span>${scenario.name} – Prosjektsimulator</span>
        <div class="caption" aria-hidden="true"><span>${CAPTION.min}</span><span>${CAPTION.max}</span><span class="close">${CAPTION.close}</span></div>
      </header>
      <div class="body">
        <nav class="nav" role="tablist" aria-label="Faner">
          ${TABS.map(t => `<button type="button" role="tab" id="tab-${t.id}" aria-controls="tabpanel" data-tab="${t.id}">${icon(`apps/${t.id}.svg`, 20)}<span>${t.label}</span></button>`).join('')}
        </nav>
        <main class="content" role="tabpanel" id="tabpanel">
          <h1 id="tab-title"></h1>
          <div id="tab-body"></div>
        </main>
      </div>
      <footer class="statusbar" aria-live="polite"></footer>
    </div>
    <div class="taskbar">
      <div class="apps">
        ${TABS.map(t => `<button type="button" data-tab="${t.id}" title="${t.label}">${icon(`apps/${t.id}.svg`, 24)}</button>`).join('')}
      </div>
      <div class="tray"><span id="clock"></span></div>
    </div>
  </div>`;

const title = app.querySelector<HTMLHeadingElement>('#tab-title')!;
const body = app.querySelector<HTMLDivElement>('#tab-body')!;
const statusbar = app.querySelector<HTMLElement>('.statusbar')!;
const panel = app.querySelector<HTMLElement>('#tabpanel')!;

function render() {
  // The tab body is rebuilt, so remember which of its buttons had focus.
  const focused = document.activeElement as HTMLElement | null;
  const refocus = focused && body.contains(focused) && focused.dataset.task
    ? `[data-task="${focused.dataset.task}"][data-mode="${focused.dataset.mode}"]`
    : null;

  const result = simulate(scenario, state.modes);
  const tab = TABS.find(t => t.id === state.tab)!;
  title.textContent = tab.label;
  body.innerHTML = tab.render({ scenario, modes: state.modes, result, baseline });
  panel.setAttribute('aria-labelledby', `tab-${tab.id}`);
  if (refocus) body.querySelector<HTMLElement>(refocus)?.focus();
  app.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(b => {
    const active = b.dataset.tab === state.tab;
    b.classList.toggle('active', active);
    if (b.getAttribute('role') === 'tab') b.setAttribute('aria-selected', String(active));
  });
  const changed = Object.values(state.modes).some(m => m && m !== 'normal');
  statusbar.innerHTML = `<span>Prosjekttid <b>${result.weeks} uker</b></span>
    <span>Totalt <b>${formatMnok(budgetOf(result).total)} MNOK</b></span>
    <span class="crit">Kritiske aktiviteter ${criticalList(result)}</span>
    ${changed ? '<button type="button" id="reset">Tilbakestill til normaltid</button>' : ''}`;
}

app.addEventListener('click', e => {
  const target = e.target as HTMLElement;
  const tabBtn = target.closest<HTMLButtonElement>('[data-tab]');
  if (tabBtn) {
    state.tab = tabBtn.dataset.tab as TabId;
    render();
    return;
  }
  const modeBtn = target.closest<HTMLButtonElement>('[data-mode]');
  if (modeBtn) {
    state.modes = { ...state.modes, [modeBtn.dataset.task!]: modeBtn.dataset.mode as Mode };
    render();
    return;
  }
  if (target.closest('#reset')) {
    state.modes = {};
    render();
  }
});

const clock = app.querySelector<HTMLSpanElement>('#clock')!;
const tick = () => {
  const now = new Date();
  clock.innerHTML = `${now.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}<br>${now.toLocaleDateString('nb-NO')}`;
};
tick();
setInterval(tick, 30_000);

render();
