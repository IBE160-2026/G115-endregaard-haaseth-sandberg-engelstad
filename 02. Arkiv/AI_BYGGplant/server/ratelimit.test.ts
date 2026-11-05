import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './ratelimit.ts';

describe('the rate limiter', () => {
  const setup = (capacity = 20, windowMs = 600_000, maxKeys?: number) => {
    let t = 1_000_000;
    const clock = { advance: (ms: number) => (t += ms) };
    return { limiter: createRateLimiter({ capacity, windowMs, now: () => t, maxKeys }), clock };
  };

  it('allows a burst of `capacity`, then refuses with a retry time', () => {
    const { limiter } = setup();
    for (let i = 0; i < 20; i++) expect(limiter.take('1.2.3.4').ok).toBe(true);
    const r = limiter.take('1.2.3.4');
    expect(r.ok).toBe(false);
    expect(r.retryAfterS).toBe(30); // one token per 30 s
  });

  it('refills over time and keeps IPs apart', () => {
    const { limiter, clock } = setup();
    for (let i = 0; i < 20; i++) limiter.take('a');
    expect(limiter.take('a').ok).toBe(false);
    expect(limiter.take('b').ok).toBe(true);
    clock.advance(29_000);
    expect(limiter.take('a').ok).toBe(false);
    clock.advance(1_000);
    expect(limiter.take('a').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(false);
    clock.advance(10 * 600_000);
    for (let i = 0; i < 20; i++) expect(limiter.take('a').ok).toBe(true);
    expect(limiter.take('a').ok).toBe(false);
  });

  it('does not grow without bound', () => {
    const { limiter, clock } = setup(2, 1000, 100);
    for (let i = 0; i < 1000; i++) {
      limiter.take(`ip-${i}`);
      clock.advance(1);
    }
    expect(limiter.size).toBeLessThanOrEqual(100);
  });
});
