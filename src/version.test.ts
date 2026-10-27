import { describe, expect, it } from 'vitest';
import { version } from '../package.json';
import { VERSION } from './version';

describe('VERSION', () => {
  it('is v0.5, from package.json', () => {
    expect(version).toBe('0.5.0');
    expect(VERSION).toBe('v0.5');
  });
});
