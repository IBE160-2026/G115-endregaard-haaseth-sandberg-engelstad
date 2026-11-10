import { describe, expect, it } from 'vitest';
import { schemaErrors } from '../../src/contract/validate.ts';
import { emptyProject, type ChatMessage } from '../../src/contract/types.ts';
import { FIXTURES_DIR } from '../http.ts';
import { addUser, GREETING as CLIENT_GREETING, newSession, toApiMessages } from '../../src/session.ts';
import {
  chunkText,
  createDemoProvider,
  demoTurn,
  endOfScript,
  GREETING,
  loadDialog,
  offScript,
  ownText,
  PROJECT_SUFFIX,
  type Pacing,
} from './demo.ts';

const steps = loadDialog(FIXTURES_DIR, 'garage');
/** The first `users` scripted lines with an answer between them, ending on a user line. */
const dialog = (users: number): ChatMessage[] =>
  Array.from({ length: users * 2 - 1 }, (_, i) =>
    i % 2 ? { role: 'assistant', content: `svar ${i}` } : { role: 'user', content: steps[i / 2]?.user ?? `ekstra ${i}` },
  );

describe('the demo provider', () => {
  it('loads the garage script (7 steps) and rejects bad dialog names', () => {
    expect(steps).toHaveLength(7);
    expect(() => loadDialog(FIXTURES_DIR, '../server')).toThrow();
    expect(() => loadDialog(FIXTURES_DIR, 'finnes-ikke')).toThrow();
  });

  it('plays step N when the user sends the N-th scripted line', () => {
    for (let n = 1; n <= steps.length; n++) expect(demoTurn(steps, dialog(n))).toEqual(steps[n - 1].turn);
  });

  it('never plays a building the user did not ask for: free text gets an honest reply and no changes', () => {
    const t = demoTurn(steps, [{ role: 'user', content: 'Hei, hva skal bygges?\n\nEn liten hytte' }]);
    expect(t).toEqual(offScript(steps, 0));
    expect(t.changes).toEqual([]);
    expect(t.project).toEqual(emptyProject());
    expect(t.reply).toContain('forhåndsskrevet demo');
    expect(schemaErrors(t)).toEqual([]);
  });

  it('keeps the project and the place in the script after free text mid-dialog', () => {
    const free: ChatMessage[] = [...dialog(2), { role: 'assistant', content: 'svar' }, { role: 'user', content: 'Kan den være blå?' }];
    const t = demoTurn(steps, free);
    expect(t.changes).toEqual([]);
    expect(t.project).toEqual(steps[1].turn.project);
    const back: ChatMessage[] = [...free, { role: 'assistant', content: t.reply }, { role: 'user', content: steps[2].user }];
    expect(demoTurn(steps, back)).toEqual(steps[2].turn);
  });

  it('strips exactly the greeting and the project JSON that toApiMessages adds', () => {
    expect(GREETING).toBe(CLIENT_GREETING);
    let s = addUser(newSession(), 'Dobbelgarasje med loft');
    s = { ...s, entries: [...s.entries, { role: 'assistant', text: 'svar', questions: [] }] };
    const sent = toApiMessages(addUser(s, 'Gjør den lengre'));
    expect(sent.at(-1)!.content).toContain(PROJECT_SUFFIX);
    expect(sent.map((m) => ownText(m.content))).toEqual(['Dobbelgarasje med loft', 'svar', 'Gjør den lengre']);
  });

  it('starts in oppstart when free text comes before any scripted step', () => {
    expect(offScript(steps, 0).phase).toBe('oppstart');
  });

  it('matches the user\'s own words inside the greeting and the project JSON the client adds', () => {
    expect(ownText('Hei, hva skal bygges?\n\nDobbelgarasje med loft')).toBe('Dobbelgarasje med loft');
    expect(ownText('Gjør den lengre\n\n[Prosjektet slik det står nå, som JSON]\n{"name":"x"}')).toBe('Gjør den lengre');
    const wrapped: ChatMessage[] = [
      { role: 'user', content: `Hei, hva skal bygges?\n\n${steps[0].user}` },
      { role: 'assistant', content: 'svar' },
      { role: 'user', content: `${steps[1].user.toUpperCase()}\n\n[Prosjektet slik det står nå, som JSON]\n{}` },
    ];
    expect(demoTurn(steps, wrapped)).toEqual(steps[1].turn);
  });

  it('does not skip a step after a stopped or failed turn (two user messages in a row)', () => {
    const afterStop: ChatMessage[] = [
      { role: 'user', content: steps[0].user },
      { role: 'assistant', content: 'svar 1' },
      { role: 'user', content: steps[1].user },
      { role: 'user', content: steps[1].user },
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
