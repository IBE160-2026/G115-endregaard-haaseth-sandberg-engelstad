import { describe, expect, it } from 'vitest';
import tsconfigText from '../tsconfig.json?raw';
import { parked } from '../vite.config';

describe('parked v0.5 files (story 1.6)', () => {
  it('are the same in tsconfig.json exclude and vite.config.ts parked', () => {
    // tsconfig.json allows // comments; drop whole comment lines before parsing.
    const json = tsconfigText.split('\n').filter(line => !line.trim().startsWith('//')).join('\n');
    const exclude: string[] = JSON.parse(json).exclude;
    expect([...exclude].sort()).toEqual([...parked].sort());
  });
});
