import { describe, expect, it } from 'vitest';
import type { Fact } from './contract';
import { guard, numbersIn, unknownFigures } from './guard';

const facts: Fact[] = [
  { id: 'cost', label: 'Kostnad', value: '171,0 MNOK' },
  { id: 'week', label: 'Ferdig', value: 'uke 67' },
  { id: 'area', label: 'BTA', value: '12 400 m²' },
  { id: 'reserve', label: 'Reserve (10 % av kostnad)', value: '17,1 MNOK' },
];

describe('numbersIn', () => {
  it('reads Norwegian decimals and grouped thousands', () => {
    expect(numbersIn('171,0 MNOK, 12 400 m² og 1 234,5')).toEqual([171, 12400, 1234.5]);
  });
  it('reads a range as two figures, not a negative one', () => {
    expect(numbersIn('10–12 uker')).toEqual([10, 12]);
  });
  it('keeps "2, 5" as two figures', () => {
    expect(numbersIn('2, 5')).toEqual([2, 5]);
  });
});

describe('guard (FR-17 figure check)', () => {
  it('passes a reply with only approved figures', () => {
    expect(guard(['Planen koster 171,0 MNOK og er ferdig i uke 67.'], facts)).toBe(true);
  });
  it('accepts the same figure written differently (171 = 171,0, 12 400 = 12400)', () => {
    expect(guard(['Omtrent 171 MNOK på 12400 m².'], facts)).toBe(true);
  });
  it('accepts a figure from a fact label', () => {
    expect(guard(['Reserven er 10 % av kostnaden.'], facts)).toBe(true);
  });
  it('passes a reply with no figures', () => {
    expect(guard(['Det avhenger av bæresystemet du velger.'], facts)).toBe(true);
  });
  it('fails a reply with one wrong figure', () => {
    expect(guard(['Planen koster 171,0 MNOK og er ferdig i uke 70.'], facts)).toBe(false);
    expect(unknownFigures('ferdig i uke 70', facts)).toEqual([70]);
  });
  it('fails a calculated figure that is not in the facts', () => {
    // 171,0 + 17,1 = 188,1: right arithmetic, but not an approved fact.
    expect(guard(['Med reserve blir det 188,1 MNOK.'], facts)).toBe(false);
  });
  it('checks every text it is given, including the basis', () => {
    expect(guard(['Ingen tall her.', 'Bygger på 3 kilder.'], facts)).toBe(false);
  });
});
