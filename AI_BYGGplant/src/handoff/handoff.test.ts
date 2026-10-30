import { afterEach, describe, expect, it, vi } from 'vitest';
import { budgetRange, budgetTotal } from '../budget';
import { LEAD_SCHEMA_ID, type Brand, type Lead } from '../contract/brand';
import { DIALOGS } from '../contract/fixtures';
import { addUser, applyTurn, newSession, type Session } from '../session';
import { formatM } from '../format';
import { siteBounds } from '../types';
import { projectWeeks } from '../ui/gantt';
import { INBOX_KEY, INBOX_LABEL, loadInbox, renderInbox, saveInbox } from './inbox';
import { buildLead, leadFileName, OFFLINE_NOTE, sendToDealer } from './lead';

const brand: Brand = {
  name: 'Nordlys Garasjeplanlegger',
  company: 'Nordlys Byggsystem AS',
  tagline: 'Test',
  logo: 'brand/logo.svg',
  colors: { accent: '#1f6f5c', accent_dark: '#134a3d' },
  dealer: { name: 'Nordlys Bygg Bergen', email: 'salg@example.no', phone: '+47 55 00 00 00' },
  catalogue: [],
};

function sessions(): Session[] {
  const out: Session[] = [];
  for (const steps of Object.values(DIALOGS)) {
    let s = newSession();
    for (const st of steps) {
      s = applyTurn(addUser(s, st.user), st.turn);
      out.push(s);
    }
  }
  return out;
}

const last = () => sessions().at(-1)!;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('buildLead', () => {
  for (const [i, s] of sessions().entries()) {
    it(`step ${i + 1}: totals, range, weeks and transcript match the session`, () => {
      const lead = buildLead(s, brand);
      const [low, high] = budgetRange(s.project);
      expect(lead.schema).toBe(LEAD_SCHEMA_ID);
      expect(lead.budget.total_nok).toBe(Math.round(budgetTotal(s.project)));
      expect(lead.budget.low_nok).toBe(Math.round(low));
      expect(lead.budget.high_nok).toBe(Math.round(high));
      expect(lead.budget.lines).toHaveLength(s.project.budget.length);
      expect(lead.schedule_weeks).toBe(projectWeeks(s.project.schedule));
      expect(lead.risks).toHaveLength(s.project.risks.length);
      expect(lead.transcript).toHaveLength(s.entries.length);
      expect(lead.transcript[0].role).toBe('assistant');
      expect(lead.brand).toBe(brand.name);
      expect(JSON.parse(JSON.stringify(lead))).toEqual(lead);
    });
  }

  it('fills the customer with nulls and trims what is given', () => {
    const lead = buildLead(last(), brand, { name: '  Kari Nordmann ', phone: '' });
    expect(lead.customer).toEqual({ name: 'Kari Nordmann', email: null, phone: null, note: null });
  });

  it('gives every lead its own id and an ISO time', () => {
    const a = buildLead(last(), brand);
    const b = buildLead(last(), brand);
    expect(a.id).not.toBe(b.id);
    expect(new Date(a.created).toISOString()).toBe(a.created);
  });

  it('fills the size from the volumes: overall extent, tallest floors, the main volume roof', () => {
    const s: Session = structuredClone(last());
    const roof = { kind: 'saltak' as const, pitch_deg: 30, ridge_along: 'lengde' as const, overhang_m: null };
    const v = { name: 'V', x_m: 0, y_m: 0, floor_height_m: 2.5, basement_floors: 0, exterior: null };
    s.project.building = {
      ...s.project.building,
      volumes: [
        { ...v, id: 'hus', length_m: 10, width_m: 8, floors: 2, basement_floors: 1, roof },
        { ...v, id: 'garasje', x_m: 10, length_m: 6.5, width_m: 6, floors: 1, roof: null },
        { ...v, id: 'bod', x_m: 30, length_m: null, width_m: 3, floors: 3, roof: null },
      ],
    };
    const lead = buildLead(s, brand);
    expect(lead.project.length_m).toBe(16.5);
    expect(lead.project.width_m).toBe(8);
    expect(lead.project.floors).toBe(3);
    expect(lead.project.roof).toBe('Saltak 30°, møne langs lengden');
    s.project.building = { ...s.project.building, volumes: [] };
    expect(buildLead(s, brand).project).toMatchObject({ length_m: null, width_m: null, floors: null, roof: null });
  });

  for (const [i, s] of sessions().entries()) {
    it(`step ${i + 1}: the lead size matches siteBounds`, () => {
      const bb = siteBounds(s.project.building);
      const lead = buildLead(s, brand);
      expect(lead.project.length_m).toBe(bb ? Math.round((bb.x1 - bb.x0) * 100) / 100 : null);
      expect(lead.project.width_m).toBe(bb ? Math.round((bb.y1 - bb.y0) * 100) / 100 : null);
    });
  }

  it('names the file after the project', () => {
    const lead = buildLead(last(), brand);
    expect(leadFileName({ ...lead, project: { ...lead.project, name: 'Dobbelgarasje med loft' } })).toBe('lead-dobbelgarasje-med-loft.json');
    expect(leadFileName({ ...lead, project: { ...lead.project, name: 'Hytte på Ål' } })).toBe('lead-hytte-pa-al.json');
    expect(leadFileName({ ...lead, project: { ...lead.project, name: '' } })).toBe('lead-prosjekt.json');
  });
});

describe('sendToDealer', () => {
  it('falls back when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    expect(await sendToDealer(buildLead(last(), brand))).toEqual({ delivered: false, note: OFFLINE_NOTE });
  });

  it('posts the lead as JSON to /api/lead and passes on the server note', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ delivered: true, note: 'Sendt' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const lead = buildLead(last(), brand);
    expect(await sendToDealer(lead)).toEqual({ delivered: true, note: 'Sendt' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/lead');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(lead);
  });

  it('reports a server error as not delivered', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('oops', { status: 500 })));
    const r = await sendToDealer(buildLead(last(), brand));
    expect(r.delivered).toBe(false);
    expect(r.note).toContain('500');
  });
});

describe('inbox', () => {
  it('survives a localStorage that throws', () => {
    const boom = () => {
      throw new Error('SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: boom, setItem: boom, removeItem: boom });
    expect(loadInbox()).toEqual([]);
    expect(() => saveInbox([buildLead(last(), brand)])).not.toThrow();
  });

  it('survives no localStorage and garbage in it', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(loadInbox()).toEqual([]);
    expect(() => saveInbox([])).not.toThrow();
    vi.stubGlobal('localStorage', { getItem: () => '{not json', setItem: () => {} });
    expect(loadInbox()).toEqual([]);
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify([{ hello: 1 }, null]), setItem: () => {} });
    expect(loadInbox()).toEqual([]);
  });

  it('saves and loads leads', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    const leads = [buildLead(last(), brand, { name: 'Kari' })];
    saveInbox(leads);
    expect(store.has(INBOX_KEY)).toBe(true);
    expect(loadInbox()).toEqual(leads);
  });

  it('renders lead cards with the demo label and wired buttons, escaped', () => {
    const lead: Lead = buildLead(last(), brand, { name: '<script>x</script>', phone: '+47 900 00 000', note: '"><img onerror=1>' });
    const html = renderInbox([lead], brand, 'Leadet er sendt.');
    expect(html).toContain(INBOX_LABEL);
    expect(html).toContain(`data-lead-call="${lead.id}"`);
    expect(html).toContain('data-phone="+47 900 00 000"');
    expect(html).toContain(`data-lead-open="${lead.id}"`);
    expect(html).toContain('Ring kunden');
    expect(html).toContain('Åpne lead.json');
    expect(html).toContain('Leadet er sendt.');
    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/\b(NaN|undefined|null)\b/);
  });

  it('shows the overall size, and the number of volumes when the lead carries it', () => {
    const lead = buildLead(last(), brand);
    const sized: Lead = { ...lead, project: { ...lead.project, length_m: 16, width_m: 8 } };
    const html = renderInbox([sized], brand, '');
    expect(html).toContain(`${formatM(16)} × ${formatM(8)}`);
    expect(html).not.toContain('bygningskropper');
    const many = { ...sized, project: { ...sized.project, volumes: 3 } } as Lead;
    expect(renderInbox([many], brand, '')).toContain('3 bygningskropper');
    const none: Lead = { ...lead, project: { ...lead.project, length_m: null, width_m: null, floors: null, roof: null } };
    const empty = renderInbox([none], brand, '');
    expect(empty).toContain('Størrelse ikke avklart');
    expect(empty).not.toMatch(/\b(NaN|undefined|null)\b/);
  });

  it('shows an empty state', () => {
    const html = renderInbox([], brand, '');
    expect(html).toContain('Ingen leads ennå');
    expect(html).toContain(INBOX_LABEL);
  });
});
