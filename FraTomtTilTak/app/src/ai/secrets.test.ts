// NFR-2: the key and the SDK stay on the server. The client code may not name the key,
// expose it through a VITE_ variable, import the SDK or call Claude directly.
import { describe, expect, it } from 'vitest';

const sources = import.meta.glob(['../**/*.ts', '!../**/*.test.ts'], { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('client code holds no key (NFR-2)', () => {
  it('scans the client sources', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(5);
  });

  it.each([
    ['the key name', /FTTT_API_KEY/],
    ['a VITE_ variable', /VITE_/],
    ['process.env', /process\.env/],
    ['the Anthropic SDK', /@anthropic-ai\/sdk/],
    ['the Claude API host', /api\.anthropic\.com/],
  ])('no file mentions %s', (_name, pattern) => {
    const hits = Object.entries(sources).filter(([, text]) => pattern.test(text)).map(([file]) => file);
    expect(hits).toEqual([]);
  });
});
