import { NextRequest } from 'next/server'

/**
 * Lightweight in-memory rate limiter.
 *
 * Scope: per serverless instance. It resets on cold starts and is not shared
 * across instances, so it is a speed bump against brute force and abuse loops,
 * not a hard guarantee. For stricter limits in production, back this with a
 * shared store (e.g. Upstash Redis) or a WAF rule.
 */
const buckets = new Map<string, number[]>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter(t => now - t < windowMs)

  if (hits.length >= max) {
    buckets.set(key, hits)
    return true // limited
  }

  hits.push(now)
  buckets.set(key, hits)

  // Opportunistic cleanup so the map can't grow without bound.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every(t => now - t >= windowMs)) buckets.delete(k)
    }
  }

  return false
}

/** Best-effort client IP, used to scope limits for unauthenticated routes. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}
