export type RateLimiter = {
  allow(key: string): boolean
}

/**
 * In-memory sliding window. Fine for a single Railway `next start` instance.
 * `now` is injectable so tests can advance the clock.
 */
export function createSlidingWindowLimiter(options: {
  limit: number
  windowMs: number
  now?: () => number
}): RateLimiter {
  const timesByKey = new Map<string, number[]>()
  const now = options.now ?? Date.now

  return {
    allow(key: string): boolean {
      const t = now()
      const previous = timesByKey.get(key) ?? []
      const fresh = previous.filter((stamp) => t - stamp < options.windowMs)
      if (fresh.length >= options.limit) {
        timesByKey.set(key, fresh)
        return false
      }
      fresh.push(t)
      timesByKey.set(key, fresh)
      return true
    },
  }
}
