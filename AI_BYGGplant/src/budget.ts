import type { Project } from './types';

export const budgetTotal = (p: Project) => p.budget.reduce((sum, l) => sum + l.amount_nok, 0);

/** The total as a range from each line's uncertainty (± %). */
export function budgetRange(p: Project): [number, number] {
  let low = 0;
  let high = 0;
  for (const l of p.budget) {
    const u = Math.max(0, l.uncertainty_pct ?? 0) / 100;
    low += l.amount_nok * Math.max(0, 1 - u);
    high += l.amount_nok * (1 + u);
  }
  return [low, high];
}

/** What the risks cost if every one of them happens (the app does not guess at chances). */
export const riskTotal = (p: Project) => p.risks.reduce((sum, r) => sum + r.cost_nok, 0);
