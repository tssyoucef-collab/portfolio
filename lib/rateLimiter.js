// ======================================================================
// lib/rateLimiter.js — IP-based rate limiter with temporary blocking
// ======================================================================

const store = new Map();
const MAX_FAILURES = 10;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(ip) {
  const record = store.get(ip);
  if (!record) return { blocked: false };

  if (record.blockedUntil && Date.now() < record.blockedUntil) {
    const remaining = Math.ceil((record.blockedUntil - Date.now()) / 1000);
    return {
      blocked: true,
      reason: `Too many failed attempts. Try again in ${remaining} seconds.`,
    };
  }

  if (record.blockedUntil && Date.now() >= record.blockedUntil) {
    store.delete(ip);
    return { blocked: false };
  }

  return { blocked: false };
}

export function recordFailure(ip) {
  const now = Date.now();
  const record = store.get(ip);

  if (!record) {
    store.set(ip, { failures: 1, firstFailure: now, blockedUntil: null });
    return false;
  }

  if (now - record.firstFailure > WINDOW_MS) {
    store.set(ip, { failures: 1, firstFailure: now, blockedUntil: null });
    return false;
  }

  record.failures += 1;
  if (record.failures >= MAX_FAILURES) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    store.set(ip, record);
    console.warn(`🔒 IP ${ip} blocked for 15 minutes.`);
    return true;
  }

  store.set(ip, record);
  return false;
}

export function resetFailures(ip) {
  if (store.has(ip)) store.delete(ip);
}

// Cleanup expired records every minute
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of store.entries()) {
    if (record.blockedUntil && now >= record.blockedUntil) store.delete(ip);
    if (!record.blockedUntil && now - record.firstFailure > WINDOW_MS) {
      store.delete(ip);
    }
  }
}, 60 * 1000);