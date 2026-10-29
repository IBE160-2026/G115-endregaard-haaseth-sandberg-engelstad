import { describe, expect, it } from 'vitest';
import { schemaErrors } from '../../src/contract/validate.ts';
import type { ChatMessage } from '../../src/contract/types.ts';
import { FIXTURES_DIR } from '../http.ts';
import { chunkText, createDemoProvider, demoTurn, endOfScript, loadDialog, type Pacing } from './demo.ts';

const steps = loadDialog(FIXTURES_DIR, 'garage');
const dialog = (users: number): ChatMessage[] =>
  Array.from({ length: users * 2 - 1 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `melding ${i}` }));

describe('the demo provider', () => {
  it('loads the garage script (7 steps) and rejects bad dialog names', () => {
    expect(steps).toHaveLength(7);
    expect(() => loadDialog(FIXTURES_DIR, '../server')).toThrow();
    expect(() => loadDialog(FIXTURES_DIR, 'finnes-ikke')).toThrow();
  });

  it('picks step = turns already answered (assistant messages), whatever the user typed', () => {
    for (let n = 1; n <= steps.length; n++) expect(demoTurn(steps, dialog(n))).toEqual(steps[n - 1].turn);
  });

  it('does not skip a step after a stopped or failed turn (two user messages in a row)', () => {
    const afterStop: ChatMessage[] = [
      { role: 'user', content: 'Dobbelgarasje med loft' },
      { role: 'assistant', content: 'svar 1' },
      { role: 'user', content: 'første forsøk (stoppet)' },
      { role: 'user', content: 'andre forsøk' },
    ];
    expect(demoTurn(steps, afterStop)).toEqual(steps[1].turn);
  });

  it('ends politely after the script, keeping the last project and changing nothing', () => {
    const t = demoTurn(steps, dialog(steps.length + 1));
    expect(t).toEqual(endOfScript(steps));
    expect(t.changes).toEqual([]);
    expect(t.reply).toContain('nytt prosjekt');
    expect(t.project).toEqual(steps.at(-1)!.turn.project);
    expect(schemaErrors(t)).toEqual([]);
  });

  it('streams the reply in 20-40 ms chunks after a 400-800 ms pause, and returns a valid turn', async () => {
    const waits: number[] = [];
    const pacing: Pacing = { sleep: async (ms) => void waits.push(ms), random: () => 0.5 };
    const provider = createDemoProvider({ fixturesDir: FIXTURES_DIR, pacing });
    expect(provider.name).toBe('demo');
    expect(provider.script[0]).toBe('Dobbelgarasje med loft');
    let streamed = '';
    const turn = await provider.turn(dialog(3), (d) => (streamed += d), new AbortController().signal);
    expect(streamed).toBe(steps[2].turn.reply);
    expect(turn).toEqual(steps[2].turn);
    expect(waits[0]).toBe(600);
    expect(waits.slice(1).every((w) => w >= 20 && w <= 40)).toBe(true);
    const total = waits.reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThanOrEqual(1000);
    expect(total).toBeLessThanOrEqual(4000);
  });

  it('stops when the client aborts', async () => {
    const ac = new AbortController();
    const provider = createDemoProvider({ fixturesDir: FIXTURES_DIR, pacing: { sleep: async () => {}, random: () => 0 } });
    let n = 0;
    const onDelta = () => {
      if (++n === 3) ac.abort();
    };
    await expect(provider.turn(dialog(1), onDelta, ac.signal)).rejects.toThrow('avbrutt');
    expect(n).toBe(3);
  });

  it('chunks on whole code points and keeps the text', () => {
    const text = 'Garasje \u{1F3E0} med loft '.repeat(10);
    const chunks = chunkText(text);
    expect(chunks.join('')).toBe(text);
    expect(chunks.length).toBeGreaterThanOrEqual(35);
    expect(chunks.length).toBeLessThanOrEqual(80);
    expect(chunks.every((c) => !/[\ud800-\udbff]$/.test(c))).toBe(true);
    expect(chunkText('')).toEqual([]);
  });
});
