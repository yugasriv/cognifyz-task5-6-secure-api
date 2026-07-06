// Lightweight in-memory cache with TTL (time-to-live).
// Used to avoid hammering external APIs on every request — a classic
// server-side caching pattern. Swap this for Redis in production by
// keeping the same get/set/has interface.

class TTLCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs = 5 * 60 * 1000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  has(key) {
    return this.get(key) !== undefined;
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }
}

module.exports = new TTLCache(); // singleton — shared across the app
