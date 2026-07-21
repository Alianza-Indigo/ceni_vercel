/**
 * In-memory sliding-window rate limiter (per key, usually per IP).
 * Sufficient for a single-instance deployment; swap for Redis when scaling out.
 */
const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 20;

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, limit = DEFAULT_LIMIT): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= limit) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  // Opportunistic cleanup to keep the map bounded.
  if (hits.size > 10_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return true;
}
