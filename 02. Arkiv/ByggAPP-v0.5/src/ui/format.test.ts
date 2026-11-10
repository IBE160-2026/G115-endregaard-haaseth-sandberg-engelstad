import { describe, expect, it } from 'vitest';
import { formatDelta, formatMnok } from './format';

// nb-NO uses a non-breaking space as thousands separator and U+2212 as minus sign.
const norm = (s: string) => s.replace(/ | /g, ' ').replace('−', '-');

describe('formatMnok', () => {
  it('shows 2 decimals with a decimal comma', () => {
    expect(formatMnok(283.1)).toBe('283,10');
    expect(formatMnok(0)).toBe('0,00');
  });

  it('rounds half up despite floating-point noise', () => {
    expect(formatMnok(282.515)).toBe('282,52');
    expect(formatMnok(282.51499999999993)).toBe('282,52');
  });

  it('groups thousands', () => {
    expect(norm(formatMnok(24700))).toBe('24 700,00');
  });

  it('signs deltas', () => {
    expect(formatDelta(2.16)).toBe('+2,16');
    expect(norm(formatDelta(-0.585))).toBe('-0,59');
    expect(formatDelta(0)).toBe('0,00');
  });
});
