import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PLANS, PAID_PLAN_IDS, effectivePlan } from '@/lib/plans'
import { isStripeConfigured } from '@/lib/stripe'
import { AccountsTable } from './AccountsTable'
import type { AdminUser } from './EditUserModal'

export const metadata = { title: 'Super Admin — AgencyLead Radar' }

// Always read fresh: this page is an administrative view of live state.
export const dynamic = 'force-dynamic'

/** Cutoff for "new in the last 30 days". Kept out of the render body so the
 *  clock read is part of data loading rather than rendering. */
function thirtyDaysAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
}

export default async function SuperAdminOverviewPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')
  // Hard gate: this page is superadmin-only, above the normal admin role.
  if (me.role !== 'superadmin') redirect('/admin')

  const [
    rawUsers,
    totalLeads,
    totalAudits,
    totalWaitlist,
    totalImports,
    recentActivity,
    recentUsers,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { leads: true, aiAudits: true } } },
    }),
    prisma.lead.count(),
    prisma.aiAudit.count(),
    prisma.waitlistSignup.count(),
    prisma.importBatch.count(),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 25 }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo() } } }),
  ])

  // Serialise for the client table (dates to ISO, drop the password hash).
  const users: AdminUser[] = rawUsers.map(u => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    companyName: u.companyName,
    role: u.role,
    plan: u.plan,
    subscriptionStatus: u.subscriptionStatus,
    currentPeriodEnd: u.currentPeriodEnd ? u.currentPeriodEnd.toISOString() : null,
    cancelAtPeriodEnd: u.cancelAtPeriodEnd,
    createdAt: u.createdAt.toISOString(),
    stripeCustomerId: u.stripeCustomerId,
    stripeSubscriptionId: u.stripeSubscriptionId,
    leadCount: u._count.leads,
    auditCount: u._count.aiAudits,
  }))

  // MRR is derived, never stored: the sum of plan prices for accounts whose
  // subscription is currently live. Editing a plan or status changes it.
  const subscribers = rawUsers.filter(u => effectivePlan(u).id !== 'free')
  const mrr = subscribers.reduce((sum, u) => sum + effectivePlan(u).priceUsd, 0)

  const planCounts = Object.fromEntries(
    (['free', ...PAID_PLAN_IDS] as const).map(id => [
      id,
      rawUsers.filter(u => effectivePlan(u).id === id).length,
    ])
  ) as Record<string, number>

  const stats = [
    { label: 'Total Accounts', value: users.length, color: 'text-white' },
    { label: 'Paying Subscribers', value: subscribers.length, color: 'text-green-400' },
    { label: 'MRR (USD)', value: `$${mrr.toLocaleString()}`, color: 'text-green-400' },
    { label: 'New (30 days)', value: recentUsers, color: 'text-blue-400' },
    { label: 'Total Leads', value: totalLeads, color: 'text-white' },
    { label: 'AI Audits', value: totalAudits, color: 'text-purple-400' },
    { label: 'Waitlist', value: totalWaitlist, color: 'text-amber-400' },
    { label: 'CSV Imports', value: totalImports, color: 'text-slate-300' },
  ]

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <Badge variant="warning">Full site access</Badge>
        </div>
        <p className="text-slate-400 text-sm">
          Whole-platform overview. Every account is editable — click Edit on any row.
        </p>
      </div>

      {!isStripeConfigured() && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 mb-6 text-amber-200 text-sm">
          Stripe is not configured. You can still set plans and statuses by hand here, but nothing
          will be charged and Stripe will not send subscription updates. Set <code>STRIPE_SECRET_KEY</code> and
          the plan price IDs to take real payments.
        </div>
      )}

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <Card key={s.label} className="py-4">
            <p className="text-slate-500 text-xs mb-2">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Revenue breakdown */}
      <Card className="mb-8">
        <div className="flex items-start justify-between mb-4 gap-4">
          <div>
            <h2 className="text-white font-semibold">Revenue &amp; plan distribution</h2>
            <p className="text-slate-500 text-xs mt-1">
              MRR is calculated live from accounts with an active, trialing or past-due
              subscription. It is not a stored figure — change an account&apos;s plan or status
              to change it.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-slate-500 text-xs">Monthly recurring</p>
            <p className="text-2xl font-bold text-green-400">${mrr.toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['free', ...PAID_PLAN_IDS] as const).map(id => {
            const p = PLANS[id]
            const count = planCounts[id] || 0
            const revenue = count * p.priceUsd
            return (
              <div key={id} className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-xs mb-1">{p.name}</p>
                <p className="text-xl font-bold text-white">{count}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {p.priceUsd === 0 ? 'No revenue' : `$${revenue.toLocaleString()}/mo`}
                </p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Accounts — editable */}
      <Card className="mb-8">
        <h2 className="text-white font-semibold mb-4">All accounts ({users.length})</h2>
        <AccountsTable users={users} />
      </Card>

      {/* Activity */}
      <Card>
        <h2 className="text-white font-semibold mb-4">Recent platform activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-slate-500 text-sm py-2">No activity recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(a => (
              <div key={a.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-700/50 last:border-0">
                <div className="min-w-0">
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded mr-2 whitespace-nowrap">{a.actionType}</span>
                  <span className="text-slate-300 text-sm">{a.description}</span>
                </div>
                <span className="text-slate-600 text-xs whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
