import Stripe from 'stripe'
import { PLANS, PlanId, PAID_PLAN_IDS } from './plans'

/**
 * Stripe is optional. The app builds and runs fully without it — the pricing
 * page simply falls back to waitlist links and the billing screen explains
 * that checkout is not configured. Nothing here is constructed at module
 * scope, so a missing key can never break a build.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set. Billing is not configured.')
  }
  return new Stripe(key)
}

/** The Stripe Price ID configured for a plan, if any. */
export function priceIdForPlan(plan: PlanId): string | undefined {
  const envName = PLANS[plan].stripePriceEnv
  if (!envName) return undefined
  return process.env[envName] || undefined
}

/** Plans that are actually purchasable: Stripe configured AND a price ID set. */
export function purchasablePlans(): PlanId[] {
  if (!isStripeConfigured()) return []
  return PAID_PLAN_IDS.filter(p => Boolean(priceIdForPlan(p)))
}

/** Reverse lookup: which plan does this Stripe Price ID correspond to? */
export function planForPriceId(priceId: string): PlanId | undefined {
  return PAID_PLAN_IDS.find(p => priceIdForPlan(p) === priceId)
}

/** Absolute base URL for building Stripe redirect targets. */
export function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return /^https?:\/\//.test(raw) ? raw.replace(/\/$/, '') : `https://${raw.replace(/\/$/, '')}`
}
