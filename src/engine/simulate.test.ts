// Expected values are the worked examples in Appendix A of the product brief.
import { describe, expect, it } from 'vitest';
import { scenario } from './scenario';
import { simulate } from './simulate';

const task = (r: ReturnType<typeof simulate>, id: string) => r.tasks.find(t => t.id === id)!;

describe('simulate – Regjeringskvartalet Light', () => {
  it('baseline: 114 weeks, 283.10 MNOK, critical path A-C-D-E-F-G-I-J-N', () => {
    const r = simulate(scenario);
    expect(r.weeks).toBe(114);
    expect(r.labour).toBeCloseTo(106.17, 9);
    expect(r.materials).toBeCloseTo(132.83, 9);
    expect(r.overhead).toBeCloseTo(44.1, 9);
    expect(r.total).toBeCloseTo(283.1, 9);
    expect(r.criticalPath).toEqual(['A', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'N']);
    expect(task(r, 'H').slack).toBe(8);
    expect(task(r, 'K').slack).toBe(10);
  });

  it('critical overtime: F overtime gives F 17 weeks, 111 weeks, 282.515 MNOK', () => {
    const r = simulate(scenario, { F: 'overtime' });
    expect(task(r, 'F').weeks).toBe(17);
    expect(task(r, 'F').labour).toBeCloseTo(16.065, 9);
    expect(r.weeks).toBe(111);
    expect(r.total).toBeCloseTo(282.515, 9);
  });

  it('critical hire: F extra hire gives F 14 weeks, 108 weeks, 282.95 MNOK', () => {
    const r = simulate(scenario, { F: 'hire' });
    expect(task(r, 'F').hiredCrew).toBe(17);
    expect(task(r, 'F').weeks).toBe(14);
    expect(task(r, 'F').labour).toBeCloseTo(17.85, 9);
    expect(r.weeks).toBe(108);
    expect(r.total).toBeCloseTo(282.95, 9);
    expect(r.criticalPath).toEqual(['A', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'N']);
  });

  it('non-critical hire: H extra hire gives H 12 weeks, still 114 weeks, 285.26 MNOK', () => {
    const r = simulate(scenario, { H: 'hire' });
    expect(task(r, 'H').weeks).toBe(12);
    expect(r.weeks).toBe(114);
    expect(r.total).toBeCloseTo(285.26, 9);
  });

  it('non-critical overtime: H overtime gives H 15 weeks, 283.748 MNOK', () => {
    const r = simulate(scenario, { H: 'overtime' });
    expect(task(r, 'H').weeks).toBe(15);
    expect(r.weeks).toBe(114);
    expect(r.total).toBeCloseTo(283.748, 9);
  });

  it('critical-path shift: I extra hire gives I 11 weeks, 109 weeks, 282.77 MNOK, H slack 3', () => {
    const r = simulate(scenario, { I: 'hire' });
    expect(task(r, 'I').weeks).toBe(11);
    expect(task(r, 'J').finish).toBe(105);
    expect(r.weeks).toBe(109);
    expect(r.total).toBeCloseTo(282.77, 9);
    expect(task(r, 'H').slack).toBe(3);
    expect(r.criticalPath).toEqual(['A', 'C', 'D', 'E', 'F', 'G', 'I', 'J', 'N']);
  });

  it('parallel critical tasks: I and J extra hire make H critical too', () => {
    // I 84–95, J ⌈6750 / (27 × 37.5)⌉ = 7 → 95–102, H 84–102: both chains end in week 102.
    const r = simulate(scenario, { I: 'hire', J: 'hire' });
    expect(r.weeks).toBe(106);
    expect(task(r, 'H').critical).toBe(true);
    expect(r.criticalPath).toEqual(['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'N']);
  });

  it('combined modes add up task by task', () => {
    // F hire (−6 weeks, +2.55 labour) and H overtime (non-critical, +0.648 labour).
    const r = simulate(scenario, { F: 'hire', H: 'overtime' });
    expect(r.weeks).toBe(108);
    expect(r.total).toBeCloseTo(283.1 + 2.55 + 0.648 - 6 * 0.45, 9);
  });

  it('I overtime gives I 14 weeks, 112 weeks, 282.776 MNOK', () => {
    const r = simulate(scenario, { I: 'overtime' });
    expect(task(r, 'I').weeks).toBe(14);
    expect(r.weeks).toBe(112);
    expect(r.total).toBeCloseTo(282.776, 9);
  });

  it('rounding: durations round up, labour is paid for actual hours only', () => {
    // F overtime: 25,500 / (34 × 45) = 16.67 weeks → 17, but labour stays 25,500 h × 600 × 1.05.
    const r = simulate(scenario, { F: 'overtime' });
    expect(task(r, 'F').weeks).toBe(17);
    expect(task(r, 'F').labour).toBeCloseTo((25500 * 600 * 1.05) / 1e6, 9);
  });

  it('is deterministic: the same modes give the same result', () => {
    expect(simulate(scenario, { F: 'hire', H: 'overtime' })).toEqual(simulate(scenario, { F: 'hire', H: 'overtime' }));
  });
});
