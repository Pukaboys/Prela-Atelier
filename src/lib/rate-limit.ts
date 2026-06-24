/**
 * Simple in-memory rate limiter for the admin login endpoint.
 * Tracks failed attempts per IP address.
 * Resets on server restart — acceptable for a single-admin panel.
 */

interface Entry {
  failedAttempts: number
  resetAt: number // epoch ms
}

const store = new Map<string, Entry>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/** Returns the current entry for an IP, creating it if absent. */
function getEntry(ip: string): Entry {
  const now = Date.now()
  let entry = store.get(ip)

  if (!entry || now >= entry.resetAt) {
    entry = { failedAttempts: 0, resetAt: now + WINDOW_MS }
    store.set(ip, entry)
  }

  return entry
}

/**
 * Check whether this IP is currently rate-limited.
 * Call this BEFORE validating credentials.
 */
export function isRateLimited(ip: string): { limited: boolean; resetIn: number } {
  const entry = getEntry(ip)
  if (entry.failedAttempts >= MAX_ATTEMPTS) {
    return { limited: true, resetIn: Math.ceil((entry.resetAt - Date.now()) / 1000) }
  }
  return { limited: false, resetIn: 0 }
}

/**
 * Record a failed login attempt for this IP.
 */
export function recordFailedAttempt(ip: string): void {
  const entry = getEntry(ip)
  entry.failedAttempts += 1
  store.set(ip, entry)
}

/**
 * Reset the failed attempt counter on successful login.
 */
export function resetAttempts(ip: string): void {
  store.delete(ip)
}
