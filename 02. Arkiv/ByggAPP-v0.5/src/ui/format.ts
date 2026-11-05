const nb = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Rounds to whole øre (2 decimals), half away from zero (282.515 → 282.52). */
export function roundMnok(x: number): number {
  // The nudge stops binary noise (282.51499999…) from rounding the wrong way.
  const rounded = Math.sign(x) * Math.round(Math.abs(x) * 100 + 1e-6) / 100;
  return rounded === 0 ? 0 : rounded;
}

/** MNOK with 2 decimals in Norwegian format, e.g. "282,52". */
export function formatMnok(x: number): string {
  return nb.format(roundMnok(x));
}

/** Signed difference, e.g. "+2,16" or "−0,59". */
export function formatDelta(x: number): string {
  const s = formatMnok(x);
  return s.startsWith('−') || s.startsWith('-') || s === nb.format(0) ? s : `+${s}`;
}

export const formatInt = (x: number) => new Intl.NumberFormat('nb-NO').format(x);

/** At least one decimal, e.g. 1 → "1,0", 37.5 → "37,5". */
export const formatFactor = (x: number) =>
  new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(x);
