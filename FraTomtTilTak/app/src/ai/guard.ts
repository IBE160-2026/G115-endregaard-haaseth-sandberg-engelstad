// The figure check (FR-17, AD-12): every number in a reply must equal a number in the
// approved facts. One miss and the reply is discarded.
import type { Fact } from './contract';

// A number in Norwegian or plain format: "171,0", "1 234,5" (nb-NO groups with a
// no-break space), "20", "0.5". The sign is ignored, so "−3" and "3" are the same figure;
// that keeps ranges such as "10–12" from reading as negative numbers.
const NUMBER = /\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;

/** All numbers in a text, as plain numbers. */
export function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? []).map(s => Number(s.replace(/[   ]/g, '').replace(',', '.')));
}

const EPS = 1e-9;

/** The numbers in a reply that are not among the approved facts (labels and values). */
export function unknownFigures(reply: string, facts: Fact[]): number[] {
  const allowed = facts.flatMap(f => [...numbersIn(f.value), ...numbersIn(f.label)]);
  return numbersIn(reply).filter(n => !allowed.some(a => Math.abs(a - n) < EPS));
}

/** True when every number in the texts is an approved figure. */
export function guard(texts: string[], facts: Fact[]): boolean {
  return texts.every(t => unknownFigures(t, facts).length === 0);
}
