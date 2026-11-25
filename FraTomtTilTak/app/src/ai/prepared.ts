// Picks the nearest prepared answer for a free-text question (FR-16, FR-17, AD-12).
// The answers themselves come from src/content (story 3.5); this file only chooses.
import type { Fact } from './contract';

export interface PreparedAnswer {
  id: string;
  /** The step this answer belongs to. */
  step: string;
  /** The suggested question, also used for matching. */
  question: string;
  /** Extra words that should match this answer. */
  keywords?: string[];
  /** A template filled from the approved facts, never a literal figure. */
  render(facts: Fact[]): string;
}

const words = (s: string) =>
  new Set(s.toLowerCase().normalize('NFC').split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 2));

/**
 * The prepared answer whose words overlap most with the question. Answers for the
 * current step win ties and come first; with no overlap, the step's first answer.
 * Returns null only when there are no prepared answers at all.
 */
export function nearestPrepared(question: string, step: string, answers: PreparedAnswer[]): PreparedAnswer | null {
  if (answers.length === 0) return null;
  const q = words(question);
  const ordered = [...answers.filter(a => a.step === step), ...answers.filter(a => a.step !== step)];
  let best = ordered[0];
  let bestScore = -1;
  for (const a of ordered) {
    const own = words([a.question, ...(a.keywords ?? [])].join(' '));
    let score = 0;
    for (const w of q) if (own.has(w)) score++;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
