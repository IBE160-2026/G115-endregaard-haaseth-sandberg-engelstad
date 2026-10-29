import { afterEach, describe, expect, it, vi } from 'vitest';
import { budgetRange, budgetTotal } from '../budget';
import { LEAD_SCHEMA_ID, type Brand, type Lead } from '../contract/brand';
import { DIALOGS } from '../contract/fixtures';
import { addUser, applyTurn, newSession, type Session } from '../session';
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

  it('shows an empty state', () => {
    const html = renderInbox([], brand, '');
    expect(html).toContain('Ingen leads ennå');
    expect(html).toContain(INBOX_LABEL);
  });
});
