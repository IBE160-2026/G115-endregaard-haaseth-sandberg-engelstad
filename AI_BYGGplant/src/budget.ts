// Sums over what the AI returned. No prices or rules of our own. Owner: WS4.
import type { Project } from './types';

const num = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? n : 0);

export const budgetTotal = (p: Project) => p.budget.reduce((sum, l) => sum + num(l.amount_nok), 0);

/** The total as a range from each line's uncertainty (± %). */
export function budgetRange(p: Project): [number, number] {
  let low = 0;
  let high = 0;
  for (const l of p.budget) {
    const u = Math.max(0, num(l.uncertainty_pct)) / 100;
    const a = num(l.amount_nok);
    low += a * Math.max(0, 1 - u);
    high += a * (1 + u);
  }
  return [low, high];
}

/** What the risks cost if every one of them happens (the app does not guess at chances). */
export const riskTotal = (p: Project) => p.risks.reduce((sum, r) => sum + num(r.cost_nok), 0);
