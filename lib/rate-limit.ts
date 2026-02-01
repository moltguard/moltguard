import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from "./constants";

const windowMap = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean; remaining: number; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  let timestamps = windowMap.get(key) || [];
  // Remove expired entries
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + RATE_LIMIT_WINDOW_MS - now;
    windowMap.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  timestamps.push(now);
  windowMap.set(key, timestamps);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - timestamps.length };
}
