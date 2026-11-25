// In-memory call limits per playthrough and per IP (AD-14). Best effort only: every
// serverless instance has its own memory and forgets on a cold start. The hard cap on
// cost is the monthly spend limit in the Claude Console.

import { LIMITS } from './contract.js';

const HOUR_MS = 60 * 60 * 1000;

/**
 * @param {{ perPlaythrough?: number, perIpPerHour?: number, now?: () => number }} [opts]
 */
export function createLimiter(opts = {}) {
  const perPlaythrough = opts.perPlaythrough ?? LIMITS.callsPerPlaythrough;
  const perIp = opts.perIpPerHour ?? LIMITS.callsPerIpPerHour;
  const now = opts.now ?? Date.now;
  /** @type {Map<string, number>} */
  const playthroughs = new Map();
  /** @type {Map<string, number[]>} */
  const ips = new Map();

  return {
    /**
     * Counts one call if it is allowed. Returns false when a limit is reached.
     * @param {string} playthroughId
     * @param {string} ip
     */
    take(playthroughId, ip) {
      const t = now();
      const recent = (ips.get(ip) ?? []).filter(at => t - at < HOUR_MS);
      const used = playthroughs.get(playthroughId) ?? 0;
      if (used >= perPlaythrough || recent.length >= perIp) {
        ips.set(ip, recent);
        return false;
      }
      playthroughs.set(playthroughId, used + 1);
      recent.push(t);
      ips.set(ip, recent);
      // Keep memory bounded on a long-lived instance.
      if (playthroughs.size > 10_000) playthroughs.clear();
      if (ips.size > 10_000) ips.clear();
      return true;
    },
  };
}

/** The caller's IP as Vercel passes it. Unknown callers share one bucket. */
export function clientIp(/** @type {Request} */ request) {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
