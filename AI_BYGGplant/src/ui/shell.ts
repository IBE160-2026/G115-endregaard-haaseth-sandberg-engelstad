// The split screen: header, dialog (left), 3D stage and tabs (right), plus the toast, lead dialog,
// inbox drawer and print container. The markup and the small decisions are pure; main.ts wires them.
import type { AppConfig } from '../contract/stream';
import type { Brand } from '../contract/brand';
import { siteBounds, type Change, type Project } from '../contract/types';
import { esc } from '../format';
import type { Session } from '../session';
import type { Store } from '../projects';
import { assetUrl } from '../brand/brand';

export interface TabInfo {
  id: string;
  label: string;
  icon?: string;
}

/** «Port 2,5 m · Takvindu lagt til · +2 til» — the turn's changes in one short line, or '' if none. */
export function toastText(changes: Change[], max = 3): string {
  const lines = changes.map((c) => c.text.trim()).filter(Boolean);
  if (!lines.length) return '';
  const shown = lines.slice(0, max).join(' · ');
  return lines.length > max ? `${shown} · +${lines.length - max} til` : shown;
}

/** Stores a session in the project with this id (which may not be the one on screen). */
export function setSession(store: Store, id: string, session: Session): Store {
  return {
    ...store,
    projects: store.projects.map((p) => (p.id === id ? { ...p, session, updated: new Date().toISOString() } : p)),
  };
}

export const sessionOf = (store: Store, id: string): Session | undefined => store.projects.find((p) => p.id === id)?.session;

/** What glows: a clicked reference wins over what the newest turn changed. */
export const glowSet = (turnIds: Set<string>, focus: string | null): Set<string> => (focus ? new Set([focus]) : turnIds);

/** The 3D view has something to draw once the AI has sized at least one volume (length, width and floors). */
export const hasFootprint = (p: Project) => siteBounds(p.building) !== null;

// ---- the demo chooser (demo mode only) ----

export type DemoDialog = AppConfig['demoDialogs'][number];

/** Remembers which scripted demo dialog a project plays. */
export function setDemo(store: Store, id: string, demo: string): Store {
  return { ...store, projects: store.projects.map((p) => (p.id === id ? { ...p, demo } : p)) };
}

/** The dialog a project plays: its chosen one if the server still offers it, otherwise the default (first). */
export function demoDialogFor(config: AppConfig, chosen: string | undefined): DemoDialog | null {
  return config.demoDialogs.find((d) => d.id === chosen) ?? config.demoDialogs[0] ?? null;
}

/** The user lines «Neste demo-replikk» offers for this project. */
export const demoScriptFor = (config: AppConfig, chosen: string | undefined): string[] =>
  demoDialogFor(config, chosen)?.script ?? config.demoScript;

/** The chips under the greeting: in demo mode, for a new project nobody has chosen a dialog for yet. */
export function demoChoices(config: AppConfig, project: { session: Session; demo?: string }): DemoDialog[] {
  if (config.provider !== 'demo' || project.demo) return [];
  return project.session.entries.some((e) => e.role === 'user') ? [] : config.demoDialogs;
}

/** The tab to fall back to when 3D cannot run (the 2D drawing), if the tab strip has it. */
export const fallbackTab = (tabs: TabInfo[]) => (tabs.find((t) => t.id === 'tegning') ?? tabs.find((t) => t.id === 'bygget') ?? tabs[0])?.id;

/** Customer fields from the lead form: trimmed, and null when left empty. */
export function customerFrom(fields: Record<string, string | null | undefined>) {
  const v = (k: string) => (fields[k] ?? '').trim() || null;
  return { name: v('name'), phone: v('phone'), email: v('email'), note: v('note') };
}

/** Width of the dialog column when the splitter is dragged or moved with the keyboard. */
export const clampDialogWidth = (px: number, viewport: number) => Math.round(Math.max(300, Math.min(px, viewport * 0.55, 640)));

export function tabsHtml(tabs: TabInfo[], active: string): string {
  return tabs
    .map((t) => {
      const sel = t.id === active;
      const icon = t.icon ? `<img src="${assetUrl(`icons/${t.icon}`)}" width="18" height="18" alt="">` : '';
      return `<button type="button" role="tab" id="tab-${esc(t.id)}" data-tab="${esc(t.id)}" aria-controls="panel" aria-selected="${sel}" tabindex="${sel ? 0 : -1}">${icon}<span>${esc(t.label)}</span></button>`;
    })
    .join('');
}

export function shellHtml(brand: Brand, config: AppConfig): string {
  const demo = config.provider === 'demo';
  return `
  <header class="topbar glass">
    <div class="brand">
      <img class="brand-logo" src="${assetUrl(brand.logo)}" width="40" height="40" alt="${esc(brand.company)}">
      <div class="brand-text"><b>${esc(brand.name)}</b><small title="${esc(brand.tagline)}">${esc(brand.tagline)}</small></div>
    </div>
    ${demo ? `<p class="demo-badge" role="note"><b>DEMO</b><span>${esc(config.demoLabel)}</span></p>` : ''}
    <div class="project-bar" role="group" aria-label="Prosjekter">
      <select id="project" aria-label="Velg prosjekt"></select>
      <button type="button" id="new" class="ghost" title="Nytt prosjekt">Ny</button>
      <button type="button" id="delete" class="ghost" title="Slett prosjektet">Slett</button>
      <button type="button" id="export" class="ghost compact" title="Last ned prosjektet som fil" aria-label="Eksporter prosjektet"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 3v10m-4-4 4 4 4-4M4 16h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="lbl">Eksporter</span></button>
      <button type="button" id="import" class="ghost compact" title="Åpne en prosjektfil" aria-label="Importer et prosjekt"><svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M10 13V3m-4 4 4-4 4 4M4 16h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="lbl">Importer</span></button>
      <input id="file" type="file" accept=".json,application/json" hidden>
    </div>
    <div class="actions">
      <button type="button" id="report" class="ghost" title="Skriv ut eller lagre som PDF">Rapport</button>
      <button type="button" id="inbox-open" class="ghost icon-btn" title="Forhandlerens innboks" aria-label="Forhandlerens innboks">
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M3 11l2-7h10l2 7v5H3z M3 11h4l1 2h4l1-2h4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
        <span class="count" id="inbox-count" hidden></span>
      </button>
      <button type="button" id="lead-open" class="accent">Send til forhandler</button>
    </div>
  </header>

  <aside class="dialog glass" aria-label="Dialog med AI">
    <div id="log" class="log" role="log" aria-live="polite" aria-relevant="additions text"></div>
    ${demo ? `<div id="demo-next" class="demo-next-wrap"></div>` : ''}
    <form id="form" class="composer">
      <label class="sr-only" for="input">Melding</label>
      <textarea id="input" rows="2" placeholder="Beskriv bygget eller en endring … (Enter sender, Shift+Enter gir ny linje)"></textarea>
      <button id="send" type="submit" class="accent">Send</button>
      <button id="stop" type="button" class="danger" hidden>Stopp</button>
    </form>
  </aside>

  <div id="splitter" class="splitter" role="separator" aria-orientation="vertical" aria-label="Endre bredden på dialogen" tabindex="0"></div>

  <main class="workspace">
    <section id="stage" class="stage glass" aria-label="3D-modell">
      <div id="view" class="view"></div>
      <div id="stage-placeholder" class="stage-placeholder" aria-hidden="true">
        <svg viewBox="0 0 120 80" class="ghost-house"><path d="M14 72 V40 L60 12 L106 40 V72 Z" /><path d="M40 72 V52 H80 V72" /></svg>
        <span id="stage-hint">Laster 3D …</span>
      </div>
      <div class="stage-tools">
        <button type="button" id="maximize" class="glass-btn" aria-pressed="false" title="Vis 3D-modellen større">Maksimer 3D</button>
      </div>
      <div id="toasts" class="toasts" role="status" aria-live="polite"></div>
    </section>
    <section class="tabs-panel glass">
      <nav class="tabs" role="tablist" aria-label="Prosjektet"></nav>
      <div id="tab-note" class="tab-note" hidden></div>
      <section id="panel" class="panel" role="tabpanel" tabindex="0"></section>
    </section>
  </main>

  <dialog id="lead-dialog" class="lead-dialog" aria-labelledby="lead-title">
    <form method="dialog" id="lead-form">
      <h2 id="lead-title">Send til forhandler</h2>
      <p class="sub">Prosjektet, budsjettet og hele dialogen går til ${esc(brand.dealer.name)}. Alle felt er valgfrie.</p>
      <label>Navn<input name="name" autocomplete="name"></label>
      <label>Telefon<input name="phone" type="tel" autocomplete="tel"></label>
      <label>E-post<input name="email" type="email" autocomplete="email"></label>
      <label>Merknad<textarea name="note" rows="3" placeholder="F.eks. når du vil bygge, eller hva du lurer på"></textarea></label>
      <div class="dialog-actions">
        <button type="button" class="ghost" data-action="download-lead">Last ned lead.json</button>
        <span class="spacer"></span>
        <button value="cancel" formnovalidate class="ghost">Avbryt</button>
        <button value="send" class="accent">Send</button>
      </div>
    </form>
  </dialog>

  <aside id="inbox" class="drawer glass" aria-labelledby="inbox-title" hidden>
    <header class="drawer-head">
      <h2 id="inbox-title" class="sr-only">Forhandlerens innboks</h2><span class="sub">Slik forhandleren ser det</span>
      <button type="button" class="ghost icon-btn" id="inbox-close" aria-label="Lukk innboksen">✕</button>
    </header>
    <div id="inbox-body" class="drawer-body"></div>
  </aside>

  <article id="print" class="report"></article>`;
}
