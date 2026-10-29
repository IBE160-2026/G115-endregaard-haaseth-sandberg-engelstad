// A per-key (per-IP) token bucket in memory. Pure apart from the injected clock, so it is unit-tested.
// Guards the API key (and the dealer webhook) before any public URL (team meeting 2).

export interface RateLimitOptions {
  /** Requests allowed in a burst (the bucket size). */
  capacity: number;
  /** How long it takes to refill the whole bucket. */
  windowMs: number;
  now?: () => number;
  /** Buckets kept before the full (idle) ones are dropped. */
  maxKeys?: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until one more request is allowed (0 when ok). */
  retryAfterS: number;
}

export interface RateLimiter {
  take(key: string): RateLimitResult;
  /** How many buckets are tracked (for tests). */
  readonly size: number;
}

export function createRateLimiter(opts: RateLimitOptions): RateLimiter {
  const now = opts.now ?? Date.now;
  const perMs = opts.capacity / opts.windowMs;
  const maxKeys = opts.maxKeys ?? 10_000;
  const buckets = new Map<string, { tokens: number; at: number }>();

  const refill = (b: { tokens: number; at: number }, t: number) => {
    b.tokens = Math.min(opts.capacity, b.tokens + Math.max(0, t - b.at) * perMs);
    b.at = t;
  };

  function prune(t: number) {
    for (const [key, b] of buckets) {
      refill(b, t);
      if (b.tokens >= opts.capacity) buckets.delete(key);
    }
    // Still too many (a flood of distinct keys): drop the oldest.
    while (buckets.size >= maxKeys) buckets.delete(buckets.keys().next().value as string);
  }

  return {
    take(key) {
      const t = now();
      let b = buckets.get(key);
      if (!b) {
        if (buckets.size >= maxKeys) prune(t);
        b = { tokens: opts.capacity, at: t };
        buckets.set(key, b);
      }
      refill(b, t);
      if (b.tokens >= 1) {
        b.tokens -= 1;
        return { ok: true, retryAfterS: 0 };
      }
      return { ok: false, retryAfterS: Math.ceil((1 - b.tokens) / perMs / 1000) };
    },
    get size() {
      return buckets.size;
    },
  };
}
