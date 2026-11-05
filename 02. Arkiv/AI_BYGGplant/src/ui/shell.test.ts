import { describe, expect, it } from 'vitest';
import { FALLBACK_BRAND } from '../brand/brand';
import { DEMO_LABEL, type AppConfig } from '../contract/stream';
import { addProject, loadStore, type Store } from '../projects';
import { DIALOGS } from '../contract/fixtures';
import { emptyProject, type Volume } from '../contract/types';
import { addUser, newSession } from '../session';
import {
  clampDialogWidth,
  customerFrom,
  demoChoices,
  demoDialogFor,
  demoScriptFor,
  fallbackTab,
  glowSet,
  hasFootprint,
  setDemo,
  setSession,
  sessionOf,
  shellHtml,
  tabsHtml,
  toastText,
} from './shell';

const dialogs = [
  { id: 'garage', title: 'Dobbelgarasje med loft', script: ['g1', 'g2'] },
  { id: 'enebolig', title: 'Enebolig med dobbelgarasje', script: ['e1', 'e2', 'e3'] },
];
const demo: AppConfig = { provider: 'demo', demoLabel: DEMO_LABEL, demoScript: ['g1', 'g2'], demoDialogs: dialogs };
const live: AppConfig = { provider: 'claude', demoLabel: DEMO_LABEL, demoScript: [], demoDialogs: [] };

describe('the 3D placeholder', () => {
  const vol = (v: Partial<Volume>): Volume => ({
    id: 'v', name: 'V', x_m: 0, y_m: 0, length_m: null, width_m: null, floors: null, floor_height_m: null, basement_floors: 0, roof: null, exterior: null, ...v,
  });
  const withVolumes = (volumes: Volume[]) => ({ ...emptyProject(), building: { ...emptyProject().building, volumes } });
  it('stays until a volume is sized (length, width and floors)', () => {
    expect(hasFootprint(emptyProject())).toBe(false);
    expect(hasFootprint(withVolumes([vol({ length_m: 8, width_m: 7 })]))).toBe(false);
    expect(hasFootprint(withVolumes([vol({ length_m: 8, width_m: 7, floors: 1 })]))).toBe(true);
  });
  it('goes away for every sized demo dialog step', () => {
    for (const [name, steps] of Object.entries(DIALOGS)) {
      const sized = steps.map((s) => hasFootprint({ ...emptyProject(), ...s.turn.project } as never));
      expect(sized.at(-1), name).toBe(true);
    }
  });
});

describe('the demo chooser', () => {
  const fresh = { session: newSession() };
  it('offers every dialog under the greeting of a new project in demo mode', () => {
    expect(demoChoices(demo, fresh).map((d) => d.id)).toEqual(['garage', 'enebolig']);
    expect(demoChoices(live, fresh)).toEqual([]);
  });
  it('hides the chips once a dialog is chosen or the first line is sent', () => {
    expect(demoChoices(demo, { ...fresh, demo: 'enebolig' })).toEqual([]);
    expect(demoChoices(demo, { session: addUser(newSession(), 'Hei') })).toEqual([]);
  });
  it('plays the chosen dialog, or the first one by default', () => {
    expect(demoDialogFor(demo, 'enebolig')?.id).toBe('enebolig');
    expect(demoDialogFor(demo, undefined)?.id).toBe('garage');
    expect(demoDialogFor(demo, 'borte')?.id).toBe('garage');
    expect(demoDialogFor(live, 'garage')).toBeNull();
    expect(demoScriptFor(demo, 'enebolig')).toEqual(['e1', 'e2', 'e3']);
    expect(demoScriptFor(demo, undefined)).toEqual(['g1', 'g2']);
    expect(demoScriptFor({ ...demo, demoDialogs: [] }, 'x')).toEqual(['g1', 'g2']);
  });
  it('stores the choice with that project only, and it survives a save', () => {
    let store: Store = addProject({ active: '', projects: [] });
    const first = store.active;
    store = addProject(store);
    store = setDemo(store, first, 'enebolig');
    expect(store.projects.find((p) => p.id === first)?.demo).toBe('enebolig');
    expect(store.projects.find((p) => p.id === store.active)?.demo).toBeUndefined();
    const again = loadStore(JSON.stringify(store), null);
    expect(again.projects.find((p) => p.id === first)?.demo).toBe('enebolig');
  });
});

describe('toastText', () => {
  const c = (text: string) => ({ section: 'bygg' as const, text, ref_id: null });
  it('joins the changes with a dot', () => {
    expect(toastText([c('Port 2,5 m'), c('Takvindu lagt til')])).toBe('Port 2,5 m · Takvindu lagt til');
  });
  it('shortens a long list', () => {
    expect(toastText([c('a'), c('b'), c('c'), c('d'), c('e')])).toBe('a · b · c · +2 til');
  });
  it('is empty when nothing changed', () => {
    expect(toastText([])).toBe('');
    expect(toastText([c('  ')])).toBe('');
  });
});

describe('per-project state', () => {
  it('puts a late reply into the project that asked, not the one on screen', () => {
    let store: Store = addProject({ active: '', projects: [] });
    const asking = store.active;
    store = addProject(store); // the user switched to a new project
    const s = addUser(newSession(), 'Hytte');
    store = setSession(store, asking, s);
    expect(sessionOf(store, asking)).toBe(s);
    expect(sessionOf(store, store.active)?.entries).toHaveLength(1);
    expect(store.active).not.toBe(asking);
  });
  it('a clicked reference wins over the turn highlight', () => {
    expect([...glowSet(new Set(['a', 'b']), null)]).toEqual(['a', 'b']);
    expect([...glowSet(new Set(['a', 'b']), 'r1')]).toEqual(['r1']);
  });
  it('falls back to the drawing tab without WebGL', () => {
    expect(fallbackTab([{ id: 'oversikt', label: '' }, { id: 'tegning', label: '' }])).toBe('tegning');
    expect(fallbackTab([{ id: 'oversikt', label: '' }])).toBe('oversikt');
  });
});

describe('lead form', () => {
  it('trims and nulls empty fields', () => {
    expect(customerFrom({ name: ' Kari ', phone: '', email: null, note: 'Snart' })).toEqual({ name: 'Kari', phone: null, email: null, note: 'Snart' });
  });
});

describe('layout', () => {
  it('shows the demo badge only in demo mode', () => {
    expect(shellHtml(FALLBACK_BRAND, demo)).toContain(DEMO_LABEL);
    expect(shellHtml(FALLBACK_BRAND, demo)).toContain('id="demo-next"');
    expect(shellHtml(FALLBACK_BRAND, live)).not.toContain('demo-badge');
  });
  it('has the split screen, a live log and labelled controls', () => {
    const html = shellHtml(FALLBACK_BRAND, live);
    for (const part of ['class="dialog', 'id="stage"', 'role="tablist"', 'aria-live="polite"', 'Send til forhandler', 'Rapport', 'id="print"', 'Forhandlerens innboks']) {
      expect(html).toContain(part);
    }
    expect(html).toContain(FALLBACK_BRAND.name);
  });
  it('escapes the brand', () => {
    expect(shellHtml({ ...FALLBACK_BRAND, name: '<x>' }, live)).toContain('&lt;x&gt;');
  });
  it('marks the selected tab for assistive tech', () => {
    const html = tabsHtml([{ id: 'oversikt', label: 'Oversikt' }, { id: 'risiko', label: 'Risiko' }], 'risiko');
    expect(html).toContain('data-tab="risiko" aria-controls="panel" aria-selected="true" tabindex="0"');
    expect(html).toContain('data-tab="oversikt" aria-controls="panel" aria-selected="false" tabindex="-1"');
  });
  it('keeps the dialog column within bounds', () => {
    expect(clampDialogWidth(100, 1280)).toBe(300);
    expect(clampDialogWidth(2000, 1280)).toBe(640);
    expect(clampDialogWidth(420, 1280)).toBe(420);
  });
});
