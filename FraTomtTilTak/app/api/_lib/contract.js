// The adviser contract (AD-13), shared by the server function and the client.
// Plain JavaScript on purpose: Vercel's Node builder cannot compile with the app's
// TypeScript 7, so nothing under api/ is TypeScript. The client mirrors these types in
// src/ai/contract.ts.
//
// GET  /api/adviser/status -> { live: boolean }
// POST /api/adviser        -> 200 AdviserReply
// Any other status (400, 405, 413, 429, 502, 503, 504) means: use the prepared answer.

/**
 * @typedef {{ id: string, label: string, value: string }} Fact
 * @typedef {{ role: 'user' | 'adviser', text: string }} Turn
 * @typedef {{
 *   v: 1,
 *   playthroughId: string,
 *   step: string,
 *   question: string,
 *   history: Turn[],
 *   facts: Fact[],
 * }} AdviserRequest
 * @typedef {{ answer: string, basis: string, onTopic: boolean }} AdviserReply
 */

export const LIMITS = Object.freeze({
  bodyBytes: 32 * 1024,
  questionChars: 500,
  historyItems: 6,
  historyChars: 2000,
  facts: 100,
  factChars: 200,
  idChars: 64,
  /** Calls per playthrough id (PRD §6, AD-14). The client stops at the same number. */
  callsPerPlaythrough: 20,
  /** Calls per IP address per hour. Best effort: each function instance has its own memory. */
  callsPerIpPerHour: 60,
  /** SDK timeout. The client aborts at 8 s, so the server must give up first. */
  modelTimeoutMs: 7000,
});

const isString = (x, max, min = 0) => typeof x === 'string' && x.length >= min && x.length <= max;

/**
 * Checks the shape of a parsed request body. Returns the request or null.
 * @param {unknown} body
 * @returns {AdviserRequest | null}
 */
export function parseRequest(body) {
  if (!body || typeof body !== 'object') return null;
  const b = /** @type {Record<string, unknown>} */ (body);
  if (b.v !== 1) return null;
  if (!isString(b.playthroughId, LIMITS.idChars, 1)) return null;
  if (!isString(b.step, LIMITS.idChars, 1)) return null;
  if (!isString(b.question, LIMITS.questionChars, 1) || !b.question.trim()) return null;
  if (!Array.isArray(b.history) || b.history.length > LIMITS.historyItems) return null;
  for (const t of b.history) {
    if (!t || (t.role !== 'user' && t.role !== 'adviser') || !isString(t.text, LIMITS.historyChars)) return null;
  }
  if (!Array.isArray(b.facts) || b.facts.length > LIMITS.facts) return null;
  for (const f of b.facts) {
    if (!f || !isString(f.id, LIMITS.idChars, 1) || !isString(f.label, LIMITS.factChars) || !isString(f.value, LIMITS.factChars)) {
      return null;
    }
  }
  return {
    v: 1,
    playthroughId: b.playthroughId,
    step: b.step,
    question: b.question,
    history: b.history.map(t => ({ role: t.role, text: t.text })),
    facts: b.facts.map(f => ({ id: f.id, label: f.label, value: f.value })),
  };
}

/**
 * Checks the model's JSON reply. Returns the reply or null.
 * @param {unknown} x
 * @returns {AdviserReply | null}
 */
export function parseReply(x) {
  if (!x || typeof x !== 'object') return null;
  const r = /** @type {Record<string, unknown>} */ (x);
  if (!isString(r.answer, 4000, 1) || !isString(r.basis, 2000) || typeof r.onTopic !== 'boolean') return null;
  return { answer: r.answer, basis: r.basis, onTopic: r.onTopic };
}
