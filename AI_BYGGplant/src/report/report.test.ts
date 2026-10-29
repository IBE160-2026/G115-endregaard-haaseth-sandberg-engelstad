import { describe, expect, it } from 'vitest';
import type { Brand } from '../contract/brand';
import { DIALOGS } from '../contract/fixtures';
import { addUser, applyTurn, newSession, type Session } from '../session';
import { DISCLAIMER, renderReport, REPORT_CSS } from './report';

const XSS = '<script>alert(1)</script>';

const brand: Brand = {
  name: 'Nordlys Garasjeplanlegger',
  company: 'Nordlys Byggsystem AS',
  tagline: 'Test',
  logo: 'brand/logo.svg',
  colors: { accent: '#1f6f5c', accent_dark: '#134a3d' },
  dealer: { name: 'Nordlys Bygg Bergen', email: 'salg@example.no', phone: '+47 55 00 00 00' },
  catalogue: [],
};

function sessions(): [string, Session][] {
  const out: [string, Session][] = [];
  for (const [name, steps] of Object.entries(DIALOGS)) {
    let s = newSession();
    steps.forEach((st, i) => {
      s = applyTurn(addUser(s, st.user), st.turn);
      out.push([`${name}/${i + 1}`, s]);
    });
  }
  return out;
}

const SECTIONS = ['Oversikt', 'Tegning', 'Budsjett', 'Fremdrift', 'Risiko', 'Endringer', 'Antakelser'];
const BAD = /\b(NaN|undefined|null|Infinity)\b|\[object Object\]/;

describe('renderReport', () => {
  for (const [label, s] of [['tom', newSession()] as [string, Session], ...sessions()]) {
    it(`${label}: every section, the disclaimer and the dealer`, () => {
      const html = renderReport(s, brand);
      for (const name of SECTIONS) expect(html).toContain(`<h2>${name}</h2>`);
      expect(html).toContain(DISCLAIMER);
      expect(html).toContain(brand.dealer.phone);
      expect(html).toContain(brand.dealer.email);
      expect(html).toContain(`src="${import.meta.env.BASE_URL}brand/logo.svg"`);
      expect(html).not.toMatch(BAD);
      expect(html).not.toContain(' glow');
    });
  }

  it('uses the 3D snapshot on the cover when given, else the front elevation', () => {
    const [, s] = sessions().at(-1)!;
    const png = 'data:image/png;base64,AAAA';
    expect(renderReport(s, brand, png)).toContain(`<img class="rp-hero" src="${png}"`);
    const plain = renderReport(s, brand);
    expect(plain).not.toContain('rp-hero" src');
    if (s.project.building.length_m && s.project.building.width_m) expect(plain).toContain('rp-hero-svg');
  });

  it('lists the budget development per turn, the range and the task table', () => {
    // A real fixture with a budget when WS1's turns 03–07 exist, otherwise a synthetic one.
    const real = sessions().find(([, s]) => s.project.budget.length > 0)?.[1];
    const s: Session = real ?? structuredClone(sessions().at(-1)![1]);
    if (!real) {
      s.project.budget = [{ id: 'p1', post: 'Port', description: 'Leddport', amount_nok: 30000, uncertainty_pct: 10, sku: 'NB-1' }];
      s.project.schedule = [{ id: 't1', name: 'Montering', start_week: 1, duration_weeks: 2, depends_on: [] }];
      s.log = [...s.log, { turn: s.log.length + 1, request: 'Budsjett', changes: [{ section: 'budsjett', text: 'Budsjett', ref_id: 'p1' }], totalBefore: 0, totalAfter: 30000 }];
    }
    const html = renderReport(s, brand);
    expect(html).not.toMatch(BAD);
    if (!real) {
      expect(html).toContain('<td>Montering</td>');
      expect(html).toContain('27 000 kr – 33 000 kr');
    }
    expect(html).toContain('Budsjettutvikling');
    for (const e of s.log) expect(html).toContain(`<td>Runde ${e.turn}</td>`);
  });

  it('escapes the AI text and the brand', () => {
    const [, base] = sessions().at(-1)!;
    const s: Session = structuredClone(base);
    s.project.name += XSS;
    s.project.summary += XSS;
    s.project.assumptions.push(XSS);
    s.log = s.log.map((e) => ({ ...e, request: XSS }));
    const html = renderReport(s, { ...brand, name: XSS, company: XSS, dealer: { name: XSS, email: XSS, phone: XSS } }, `x" onerror="alert(1)`);
    expect(html).not.toContain('<script');
    expect(html).not.toContain('" onerror="');
  });

  it('ships print CSS for A4 with page breaks and no dark backgrounds', () => {
    expect(REPORT_CSS).toContain('@media print');
    expect(REPORT_CSS).toMatch(/size:\s*A4/);
    expect(REPORT_CSS).toContain('break-before: page');
    expect(REPORT_CSS).not.toMatch(/background:\s*#(0|1|2)/);
  });
});
