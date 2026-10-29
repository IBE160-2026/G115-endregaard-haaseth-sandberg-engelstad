// «Forhandlerens innboks»: a demo of the dealer's side. In production the lead goes by e-mail or
// webhook to the dealer's CRM; here it is kept in localStorage. Owner: WS4.
//
// The shell wires the buttons: [data-lead-call="<lead id>"] (ring the customer; the button also has
// data-phone, empty when unknown) and [data-lead-open="<lead id>"] (show or download lead.json).
// Styles: INBOX_CSS, injected by the shell together with TAB_CSS.
import { LEAD_SCHEMA_ID, type Brand, type Lead } from '../contract/brand';
import { esc, formatDateTime, formatM, formatNok, formatNum } from '../format';

export const INBOX_KEY = 'ai-byggplant.inbox';
export const INBOX_LABEL = 'Demo – i produksjon: e-post/webhook til deres CRM';
const MAX_LEADS = 50;

const isLead = (x: unknown): x is Lead =>
  !!x &&
  typeof x === 'object' &&
  (x as Lead).schema === LEAD_SCHEMA_ID &&
  typeof (x as Lead).id === 'string' &&
  !!(x as Lead).budget &&
  !!(x as Lead).project &&
  Array.isArray((x as Lead).transcript) &&
  Array.isArray((x as Lead).risks);

export function loadInbox(): Lead[] {
  try {
    const raw = globalThis.localStorage?.getItem(INBOX_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    return Array.isArray(list) ? list.filter(isLead) : [];
  } catch {
    return [];
  }
}

export function saveInbox(leads: Lead[]): void {
  try {
    globalThis.localStorage?.setItem(INBOX_KEY, JSON.stringify(leads.slice(0, MAX_LEADS)));
  } catch {
    // Private mode or a full quota: the inbox is a demo, so it is simply not kept.
  }
}

function card(l: Lead): string {
  const c = l.customer ?? { name: null, email: null, phone: null, note: null };
  const p = l.project;
  const known = p.length_m != null && p.width_m != null;
  const size = known ? `${formatM(p.length_m)} × ${formatM(p.width_m)} · ${formatNum(Math.round(p.length_m! * p.width_m! * 10) / 10)} m²` : 'Størrelse ikke avklart';
  const contact = [c.phone, c.email].filter((v): v is string => !!v).map((v) => esc(v)).join(' · ');
  const total = l.budget.total_nok > 0;
  return `<article class="ib-card" data-lead-id="${esc(l.id)}">
    <header><b>${esc(c.name ?? 'Kunde uten navn')}</b><time datetime="${esc(l.created)}">${esc(formatDateTime(l.created))}</time></header>
    ${contact ? `<p class="ib-contact">${contact}</p>` : '<p class="ib-contact sub">Ingen kontaktinfo oppgitt</p>'}
    <p class="ib-project"><b>${esc(p.name || 'Prosjekt uten navn')}</b>${p.type ? ` <span class="chip">${esc(p.type)}</span>` : ''}</p>
    <p class="sub">${size}${p.floors != null ? ` · ${formatNum(p.floors)} etg.` : ''}${p.roof ? ` · ${esc(p.roof)}` : ''}</p>
    <p class="ib-budget"><b>${total ? formatNok(l.budget.total_nok) : 'Budsjett ikke laget'}</b>${total ? ` <small>${formatNok(l.budget.low_nok)} – ${formatNok(l.budget.high_nok)}</small>` : ''}</p>
    <p class="sub">${l.schedule_weeks > 0 ? `${formatNum(l.schedule_weeks)} uker byggetid · ` : ''}${l.risks.length} risikoer · ${l.transcript.length} meldinger i dialogen</p>
    ${c.note ? `<p class="ib-note">«${esc(c.note)}»</p>` : ''}
    <div class="ib-actions">
      <button type="button" class="accent" data-lead-call="${esc(l.id)}" data-phone="${esc(c.phone ?? '')}"${c.phone ? '' : ' disabled title="Kunden har ikke oppgitt telefon"'}>Ring kunden</button>
      <button type="button" class="ghost" data-lead-open="${esc(l.id)}">Åpne lead.json</button>
    </div>
  </article>`;
}

export function renderInbox(leads: Lead[], brand: Brand, note: string): string {
  const sorted = [...leads].sort((a, b) => String(b.created).localeCompare(String(a.created)));
  return `<section class="ib">
    <header class="ib-head"><h2>Forhandlerens innboks</h2><span class="ib-demo">${INBOX_LABEL}</span></header>
    <p class="sub">${esc(brand.dealer?.name ?? brand.company)} · ${sorted.length === 1 ? '1 lead' : `${sorted.length} leads`}</p>
    ${note ? `<p class="note ib-status">${esc(note)}</p>` : ''}
    ${sorted.length ? `<div class="ib-list">${sorted.map(card).join('')}</div>` : '<p class="empty">Ingen leads ennå. Trykk «Send til forhandler» når kunden er fornøyd med prosjektet.</p>'}
  </section>`;
}

/** Styles for the inbox panel. */
export const INBOX_CSS = `
.ib-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px 12px; }
.ib-head h2 { margin: 0; }
.ib-demo { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: #fff4ce; color: #5c4400; border: 1px solid #e8d48a; }
.ib-list { display: grid; gap: 10px; margin-top: 10px; }
.ib-card { border: 1px solid var(--stroke-strong, rgba(0,0,0,0.14)); border-radius: 10px; padding: 10px 12px; background: var(--layer, #fbfbfb); }
.ib-card header { display: flex; justify-content: space-between; gap: 8px; }
.ib-card time { font-size: 12px; opacity: 0.7; }
.ib-card p { margin: 4px 0; }
.ib-note { font-style: italic; }
.ib-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
`;
