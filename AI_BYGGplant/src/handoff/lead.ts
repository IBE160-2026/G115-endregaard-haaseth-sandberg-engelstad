// «Send til forhandler»: the lead that goes to the dealer, as a JSON file and as the webhook body.
// Format: src/contract/brand.ts (Lead, LEAD_SCHEMA_ID); documented for CRM teams in ./README.md. Owner: WS4.
import { budgetRange, budgetTotal } from '../budget';
import { LEAD_SCHEMA_ID, type Brand, type Lead } from '../contract/brand';
import type { Session } from '../session';
import { isSized, siteBounds } from '../types';
import { roofText } from '../ui/building';

const round2 = (n: number) => Math.round(n * 100) / 100;
import { projectWeeks } from '../ui/gantt';

export const OFFLINE_NOTE = 'Kunne ikke nå serveren – leadet er lagret lokalt';

function newId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `lead-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const clean = (v: string | null | undefined) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function buildLead(s: Session, brand: Brand, customer?: Partial<Lead['customer']>): Lead {
  const p = s.project;
  const b = p.building;
  const [low, high] = budgetRange(p);
  const sized = b.volumes.filter((v) => isSized(v) && Number.isFinite(v.x_m) && Number.isFinite(v.y_m));
  const bounds = siteBounds({ ...b, volumes: sized });
  const floors = b.volumes.flatMap((v) => (typeof v.floors === 'number' && Number.isFinite(v.floors) && v.floors > 0 ? [v.floors] : []));
  const main = b.volumes[0];
  return {
    schema: LEAD_SCHEMA_ID,
    id: newId(),
    created: new Date().toISOString(),
    brand: brand.name,
    customer: {
      name: clean(customer?.name),
      email: clean(customer?.email),
      phone: clean(customer?.phone),
      note: clean(customer?.note),
    },
    project: {
      name: p.name,
      type: p.type,
      summary: p.summary,
      // Overall extent of the sized volumes, the tallest volume's storeys, the main (first) volume's roof.
      length_m: bounds ? round2(bounds.x1 - bounds.x0) : null,
      width_m: bounds ? round2(bounds.y1 - bounds.y0) : null,
      floors: floors.length ? Math.max(...floors) : null,
      roof: main?.roof ? roofText(main.roof) : null,
    },
    budget: {
      total_nok: Math.round(budgetTotal(p)),
      low_nok: Math.round(low),
      high_nok: Math.round(high),
      lines: p.budget.map((l) => ({ id: l.id, post: l.post, amount_nok: l.amount_nok, sku: l.sku ?? null })),
    },
    schedule_weeks: projectWeeks(p.schedule),
    risks: p.risks.map((r) => ({ title: r.title, probability: r.probability, cost_nok: r.cost_nok })),
    transcript: s.entries.map((e) => ({ role: e.role, text: e.text })),
  };
}

/** POST /api/lead. Never throws: a network or server failure comes back as delivered:false. */
export async function sendToDealer(lead: Lead): Promise<{ delivered: boolean; note: string }> {
  try {
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    });
    const body = (await res.json().catch(() => null)) as { delivered?: unknown; note?: unknown } | null;
    if (!res.ok) {
      return { delivered: false, note: typeof body?.note === 'string' ? body.note : `Serveren svarte ${res.status} – leadet er lagret lokalt` };
    }
    return {
      delivered: body?.delivered !== false,
      note: typeof body?.note === 'string' ? body.note : 'Leadet er sendt til forhandleren.',
    };
  } catch {
    return { delivered: false, note: OFFLINE_NOTE };
  }
}

/** lead-<project>.json, e.g. lead-dobbelgarasje-med-loft.json */
export function leadFileName(lead: Lead): string {
  const slug = (lead.project.name || 'prosjekt')
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `lead-${slug || 'prosjekt'}.json`;
}

export function downloadLead(lead: Lead): void {
  const blob = new Blob([JSON.stringify(lead, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = leadFileName(lead);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
