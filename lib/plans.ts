import { prisma } from './prisma'

export type PlanId = 'free' | 'starter' | 'agency' | 'pro'

export interface Plan {
  id: PlanId
  name: string
  priceUsd: number
  /** New leads that may be added per calendar month. */
  leadsPerMonth: number
  /** AI audit generations per calendar month. */
  auditsPerMonth: number
  /** Env var holding the Stripe Price ID. Null for the free plan. */
  stripePriceEnv: string | null
  features: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    leadsPerMonth: 10,
    auditsPerMonth: 3,
    stripePriceEnv: null,
    features: ['10 leads per month', '3 AI audits per month', 'CSV export', 'Saved leads'],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceUsd: 29,
    leadsPerMonth: 100,
    auditsPerMonth: 50,
    stripePriceEnv: 'STRIPE_PRICE_STARTER',
    features: ['100 leads per month', '50 AI audits per month', 'CSV import & export', 'Saved leads', 'Email support'],
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceUsd: 79,
    leadsPerMonth: 500,
    auditsPerMonth: 250,
    stripePriceEnv: 'STRIPE_PRICE_AGENCY',
    features: ['500 leads per month', '250 AI audits per month', 'All Starter features', 'Advanced filters', 'Priority roadmap access'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceUsd: 149,
    leadsPerMonth: 2000,
    auditsPerMonth: 1000,
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    features: ['2,000 leads per month', '1,000 AI audits per month', 'All Agency features', 'Bulk lead tools', 'Priority support'],
  },
}

export const PAID_PLAN_IDS: PlanId[] = ['starter', 'agency', 'pro']

export function isPlanId(value: string): value is PlanId {
  return value in PLANS
}

/**
 * The plan a user is actually entitled to right now.
 *
 * A stored plan only counts while the subscription is live. If Stripe reports
 * the subscription as canceled or unpaid we fall back to Free, so access
 * downgrades automatically without needing a cleanup job.
 */
export function effectivePlan(user: {
  plan?: string | null
  subscriptionStatus?: string | null
}): Plan {
  const stored = user.plan && isPlanId(user.plan) ? user.plan : 'free'
  if (stored === 'free') return PLANS.free

  const status = user.subscriptionStatus
  const live = status === 'active' || status === 'trialing' || status === 'past_due'
  return live ? PLANS[stored] : PLANS.free
}

function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

export interface Usage {
  leadsThisMonth: number
  auditsThisMonth: number
}

export async function getUsage(userId: string): Promise<Usage> {
  const since = startOfMonth()
  const [leadsThisMonth, auditsThisMonth] = await Promise.all([
    prisma.lead.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.aiAudit.count({ where: { userId, createdAt: { gte: since } } }),
  ])
  return { leadsThisMonth, auditsThisMonth }
}

export interface QuotaCheck {
  allowed: boolean
  used: number
  limit: number
  planName: string
  message?: string
}

/**
 * Check whether a user may add `count` more leads this month.
 * Admins and superadmins are not metered.
 */
export async function checkLeadQuota(
  user: { id: string; role?: string | null; plan?: string | null; subscriptionStatus?: string | null },
  count = 1
): Promise<QuotaCheck> {
  const plan = effectivePlan(user)
  if (user.role === 'admin' || user.role === 'superadmin') {
    return { allowed: true, used: 0, limit: Infinity, planName: plan.name }
  }

  const { leadsThisMonth } = await getUsage(user.id)
  const allowed = leadsThisMonth + count <= plan.leadsPerMonth

  return {
    allowed,
    used: leadsThisMonth,
    limit: plan.leadsPerMonth,
    planName: plan.name,
    message: allowed
      ? undefined
      : `Your ${plan.name} plan allows ${plan.leadsPerMonth} new leads per month and you have used ${leadsThisMonth}. Upgrade your plan to add more.`,
  }
}

/** Check whether a user may generate another AI audit this month. */
export async function checkAuditQuota(user: {
  id: string
  role?: string | null
  plan?: string | null
  subscriptionStatus?: string | null
}): Promise<QuotaCheck> {
  const plan = effectivePlan(user)
  if (user.role === 'admin' || user.role === 'superadmin') {
    return { allowed: true, used: 0, limit: Infinity, planName: plan.name }
  }

  const { auditsThisMonth } = await getUsage(user.id)
  const allowed = auditsThisMonth < plan.auditsPerMonth

  return {
    allowed,
    used: auditsThisMonth,
    limit: plan.auditsPerMonth,
    planName: plan.name,
    message: allowed
      ? undefined
      : `Your ${plan.name} plan includes ${plan.auditsPerMonth} AI audits per month and you have used ${auditsThisMonth}. Upgrade your plan to generate more.`,
  }
}
