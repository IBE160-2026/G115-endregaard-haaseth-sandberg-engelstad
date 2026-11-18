import { describe, expect, it } from 'vitest';
import { partialReply, ReplyExtractor } from './partial.ts';

const samples = [
  'Hei! Enkel tekst.',
  'Linje 1\nLinje 2\t"sitat" \\ skråstrek / og \b\f\r',
  'Æøå – «garasje» 8 × 7 m, 35°',
  'Emoji \u{1F3E0}\u{1F697} og ➡️ pil',
  'Kontroll \u0001 og \u001f',
  '',
];

/** JSON text that escapes everything non-ASCII as \uXXXX (what some encoders do). */
const asciiJson = (s: string) =>
  JSON.stringify(s).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

const encoders = [
  ['plain', (s: string) => JSON.stringify(s)],
  ['ascii-escaped', asciiJson],
] as const;

describe('ReplyExtractor', () => {
  for (const reply of samples) {
    for (const [name, encode] of encoders) {
      const label = `${JSON.stringify(reply).slice(0, 30)} (${name})`;

      it(`decodes every prefix of ${label} and never throws`, () => {
        const text = `{ "reply" : ${encode(reply)}, "questions": [], "phase": "tomt", "x": "\\"reply\\": nope" }`;
        let previous = '';
        for (let i = 0; i <= text.length; i++) {
          const value = partialReply(text.slice(0, i));
          expect(reply.startsWith(value), `prefix ${i}`).toBe(true);
          expect(value.length).toBeGreaterThanOrEqual(previous.length);
          previous = value;
        }
        expect(previous).toBe(reply);
      });

      it(`streams ${label} one character at a time, and the deltas add up exactly`, () => {
        const text = `{"reply":${encode(reply)},"phase":"tomt"}`;
        const x = new ReplyExtractor();
        let out = '';
        for (const ch of text) out += x.push(ch);
        expect(out).toBe(reply);
        expect(x.complete).toBe(true);
        expect(x.push('"reply":"igjen"')).toBe('');
      });
    }
  }

  it('does not split a surrogate pair across deltas', () => {
    const text = '{"reply":"\\ud83c\\udfe0"}';
    const x = new ReplyExtractor();
    const deltas = Array.from(text, (ch) => x.push(ch)).filter(Boolean);
    expect(deltas).toEqual(['\u{1F3E0}']);
  });

  it('finds the key after other fields, and tolerates broken escapes without throwing', () => {
    expect(partialReply('{"phase":"tomt","reply":"hei')).toBe('hei');
    expect(() => partialReply('{"reply":"a\\uZZZZb\\q"')).not.toThrow();
    expect(partialReply('{"reply":"a\\uZZZZb"')).toBe('a\\uZZZZb');
    expect(partialReply('{"reply":"\\ud83c\\n"')).toBe('\ud83c\n');
    expect(partialReply('{"repl')).toBe('');
    expect(partialReply('')).toBe('');
  });

  it('returns only the new characters per push', () => {
    const x = new ReplyExtractor();
    expect(x.push('{"rep')).toBe('');
    expect(x.push('ly": "Hei')).toBe('Hei');
    expect(x.push(' der\\')).toBe(' der');
    expect(x.push('n!"}')).toBe('\n!');
    expect(x.reply).toBe('Hei der\n!');
  });
});
