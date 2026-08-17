import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PLANS, PAID_PLAN_IDS, effectivePlan } from '@/lib/plans'
import { isStripeConfigured } from '@/lib/stripe'

export const metadata = { title: 'Super Admin — AgencyLead Radar' }

/** Cutoff for "new in the last 30 days". Kept out of the render body so the
 *  clock read is part of data loading rather than rendering. */
function thirtyDaysAgo(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
}

function planBadge(planId: string) {
  if (planId === 'pro') return 'success'
  if (planId === 'agency') return 'info'
  if (planId === 'starter') return 'warning'
  return 'default'
}

export default async function SuperAdminOverviewPage() {
  const me = await getCurrentUser()
  if (!me) redirect('/login')
  // Hard gate: this page is superadmin-only, above the normal admin role.
  if (me.role !== 'superadmin') redirect('/admin')

  const [
    users,
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

  // Monthly recurring revenue from accounts whose subscription is live.
  const subscribers = users.filter(u => {
    const p = effectivePlan(u)
    return p.id !== 'free'
  })
  const mrr = subscribers.reduce((sum, u) => sum + effectivePlan(u).priceUsd, 0)

  const planCounts = Object.fromEntries(
    (['free', ...PAID_PLAN_IDS] as const).map(id => [
      id,
      users.filter(u => effectivePlan(u).id === id).length,
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
        <p className="text-slate-400 text-sm">Whole-platform overview: accounts, subscriptions, revenue, and activity.</p>
      </div>

      {!isStripeConfigured() && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 mb-6 text-amber-200 text-sm">
          Stripe is not configured, so revenue figures will stay at zero. Set <code>STRIPE_SECRET_KEY</code> and the plan price IDs to enable billing.
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

      {/* Plan distribution */}
      <Card className="mb-8">
        <h2 className="text-white font-semibold mb-4">Plan distribution</h2>
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

      {/* Accounts */}
      <Card className="mb-8">
        <h2 className="text-white font-semibold mb-4">All accounts ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                {['Email', 'Name', 'Role', 'Plan', 'Status', 'Leads', 'Audits', 'Joined'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const p = effectivePlan(u)
                return (
                  <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{u.email}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{u.fullName || '—'}</td>
                    <td className="px-3 py-2">
                      <Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'warning' : 'default'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-3 py-2"><Badge variant={planBadge(p.id)}>{p.name}</Badge></td>
                    <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                      {u.subscriptionStatus || '—'}
                      {u.cancelAtPeriodEnd && <span className="text-amber-400"> (cancelling)</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-300">{u._count.leads}</td>
                    <td className="px-3 py-2 text-slate-300">{u._count.aiAudits}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
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
