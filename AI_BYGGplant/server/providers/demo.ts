// The demo provider: a hand-written, scripted dialog (fixtures/<dialog>/NN.json), clearly labelled
// DEMO_LABEL in the app. It is not a recording of real AI. It ignores what the user actually typed
// and plays step N for the N-th user message, streaming the reply with a believable pace.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AiTurn, ChatMessage } from '../../src/contract/types.ts';
import { schemaErrors } from '../../src/contract/validate.ts';
import { aborted, type Provider } from './types.ts';

export interface DemoStep {
  user: string;
  turn: AiTurn;
}

/** Reads fixtures/<dialog>/NN.json in file order; throws if the dialog is missing or breaks the contract. */
export function loadDialog(fixturesDir: string, dialog: string): DemoStep[] {
  if (!/^[a-z0-9-]+$/i.test(dialog)) throw new Error(`Ugyldig demodialog: ${dialog}`);
  const dir = join(fixturesDir, dialog);
  if (!existsSync(dir)) throw new Error(`Fant ikke demodialogen ${dir}`);
  const files = readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).sort();
  if (!files.length) throw new Error(`Demodialogen ${dir} er tom`);
  return files.map((f) => {
    const step = JSON.parse(readFileSync(join(dir, f), 'utf8')) as DemoStep;
    const errors = schemaErrors(step.turn);
    if (typeof step.user !== 'string' || errors.length) throw new Error(`${dialog}/${f} følger ikke kontrakten: ${errors.slice(0, 3).join('; ')}`);
    return step;
  });
}

/** The turn after the script has run out: polite, no changes, the last project kept. */
export function endOfScript(steps: DemoStep[]): AiTurn {
  const last = steps[steps.length - 1].turn;
  return {
    reply:
      'Demodialogen er ferdig her – dette er et forhåndsskrevet manus, så jeg kan ikke svare på nye spørsmål. Start et nytt prosjekt for å kjøre demoen på nytt, eller koble til Claude med en API-nøkkel for en ekte samtale.',
    questions: [],
    phase: last.phase,
    changes: [],
    project: structuredClone(last.project),
  };
}

/**
 * Which scripted turn answers this dialog: the number of turns already answered (assistant messages).
 * Counting answers, not user messages, means a stopped or failed turn (two user messages in a row)
 * never skips a step of the script.
 */
export function demoTurn(steps: DemoStep[], messages: ChatMessage[]): AiTurn {
  const step = messages.filter((m) => m.role === 'assistant').length;
  return step < steps.length ? structuredClone(steps[step].turn) : endOfScript(steps);
}

/** Splits text into 35–80 small chunks (whole code points), so it reads like typing. */
export function chunkText(text: string): string[] {
  const chars = Array.from(text);
  if (!chars.length) return [];
  const n = Math.min(chars.length, Math.max(35, Math.min(80, Math.ceil(chars.length / 3))));
  const size = Math.ceil(chars.length / n);
  const chunks: string[] = [];
  for (let i = 0; i < chars.length; i += size) chunks.push(chars.slice(i, i + size).join(''));
  return chunks;
}

export interface Pacing {
  /** Waits ms (rejects or returns early is fine when the signal fires). */
  sleep(ms: number, signal: AbortSignal): Promise<void>;
  /** 0..1 */
  random(): number;
}

const realSleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(done, ms);
    function done() {
      clearTimeout(t);
      signal.removeEventListener('abort', done);
      resolve();
    }
    signal.addEventListener('abort', done, { once: true });
  });

export const REAL_PACING: Pacing = { sleep: realSleep, random: Math.random };
/** No waiting at all (tests, and the non-streaming /api/turn). */
export const NO_PACING: Pacing = { sleep: async () => {}, random: () => 0.5 };

export function createDemoProvider(opts: { fixturesDir: string; dialog?: string; pacing?: Pacing }): Provider & { script: string[] } {
  const steps = loadDialog(opts.fixturesDir, opts.dialog ?? 'garage');
  const pacing = opts.pacing ?? REAL_PACING;

  return {
    name: 'demo',
    script: steps.map((s) => s.user),
    async turn(messages, onReplyDelta, signal) {
      const turn = demoTurn(steps, messages);
      // A short "thinking" pause first, then the reply at 20–40 ms per chunk.
      await pacing.sleep(400 + pacing.random() * 400, signal);
      for (const chunk of chunkText(turn.reply)) {
        if (signal.aborted) throw aborted();
        onReplyDelta(chunk);
        await pacing.sleep(20 + pacing.random() * 20, signal);
      }
      if (signal.aborted) throw aborted();
      return turn;
    },
  };
}
