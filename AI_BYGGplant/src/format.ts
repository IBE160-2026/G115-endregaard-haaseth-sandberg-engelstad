// Everything the AI writes is shown as text, never as HTML. Owner: WS4.
export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const nok = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
const dec = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 });

/** Intl uses narrow no-break spaces; plain no-break spaces print more reliably. */
const spaces = (s: string) => s.replace(/[   ]/g, ' ').replace(/−/g, '−');

/** 1234567 → "1 234 567 kr"; anything that is not a number → "–" */
export const formatNok = (n: number) => (Number.isFinite(n) ? `${spaces(nok.format(Math.round(n)))} kr` : '–');

/** 2.5 → "2,5"; at most two decimals; not a number → "–" */
export const formatNum = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '–' : spaces(dec.format(n)));

/** 2.5 → "2,5 m"; null → "–" */
export const formatM = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? '–' : `${formatNum(n)} m`);

/** +18 000 kr / −5 000 kr; zero → "±0 kr" */
export const formatDelta = (n: number) =>
  !Number.isFinite(n) ? '–' : Math.abs(n) < 1 ? '±0 kr' : `${n > 0 ? '+' : '−'}${formatNok(Math.abs(n))}`;

/** 29. oktober 2026 */
export const formatDate = (d: Date) => d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' });

/** 29.10.2026 kl. 14:05 (an ISO string that does not parse → as written) */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
  return `${date} kl. ${time}`;
}
