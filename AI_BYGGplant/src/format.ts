// Everything the AI writes is shown as text, never as HTML.
export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const nok = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

/** 1234567 → "1 234 567 kr" */
export const formatNok = (n: number) => `${nok.format(Math.round(n)).replace(/ /g, ' ')} kr`;

/** 2.5 → "2,5 m"; null → "–" */
export const formatM = (n: number | null) => (n == null ? '–' : `${String(n).replace('.', ',')} m`);
