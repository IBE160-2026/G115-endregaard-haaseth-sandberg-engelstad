// Budget lines in whole øre: each line is rounded first and every sum is built
// from the rounded lines, so what the budget shows always adds up.
import type { SimulationResult } from '../engine/simulate';
import { roundMnok } from './format';

export interface BudgetLine { id: string; labour: number; materials: number; cost: number }

export interface Budget {
  lines: BudgetLine[];
  labour: number;
  materials: number;
  tasks: number;
  overhead: number;
  total: number;
}

const sum = (xs: number[]) => roundMnok(xs.reduce((a, b) => a + b, 0));

export function budgetOf(r: SimulationResult): Budget {
  const lines = r.tasks.map(t => {
    const labour = roundMnok(t.labour);
    const materials = roundMnok(t.materials);
    return { id: t.id, labour, materials, cost: roundMnok(labour + materials) };
  });
  const tasks = sum(lines.map(l => l.cost));
  const overhead = roundMnok(r.overhead);
  return {
    lines,
    labour: sum(lines.map(l => l.labour)),
    materials: sum(lines.map(l => l.materials)),
    tasks,
    overhead,
    total: roundMnok(tasks + overhead),
  };
}
