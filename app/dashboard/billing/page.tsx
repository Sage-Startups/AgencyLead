import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PLANS, PAID_PLAN_IDS, effectivePlan, getUsage } from '@/lib/plans'
import { purchasablePlans, isStripeConfigured } from '@/lib/stripe'
import { UpgradeButton, ManageBillingButton } from './BillingActions'

export const metadata = { title: 'Billing — AgencyLead Radar' }

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const tone = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { checkout } = await searchParams
  const plan = effectivePlan(user)
  const usage = await getUsage(user.id)
  const buyable = purchasablePlans()
  const stripeOn = isStripeConfigured()
  const isDemo = user.email === (process.env.DEMO_EMAIL || 'demo@agencyleadradar.com')

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Billing & Plan</h1>
        <p className="text-slate-400 text-sm">Manage your subscription and see this month&apos;s usage.</p>
      </div>

      {checkout === 'success' && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl px-4 py-3 mb-6 text-green-300 text-sm">
          Payment received. Your plan updates as soon as Stripe confirms the subscription — refresh in a moment if it still shows the old plan.
        </div>
      )}
      {checkout === 'cancelled' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 mb-6 text-slate-300 text-sm">
          Checkout cancelled. No charge was made.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Current plan</h2>
            <Badge variant={plan.id === 'free' ? 'default' : 'success'}>{plan.name}</Badge>
          </div>
          <p className="text-3xl font-bold text-white mb-1">
            ${plan.priceUsd}
            <span className="text-slate-400 text-sm font-normal">/month</span>
          </p>
          {user.subscriptionStatus && (
            <p className="text-slate-400 text-xs mt-2">
              Status: <span className="text-slate-300">{user.subscriptionStatus}</span>
              {user.currentPeriodEnd && (
                <> · {user.cancelAtPeriodEnd ? 'Ends' : 'Renews'} {new Date(user.currentPeriodEnd).toLocaleDateString()}</>
              )}
            </p>
          )}
          {user.stripeCustomerId && stripeOn && (
            <div className="mt-4"><ManageBillingButton /></div>
          )}
        </Card>

        <Card>
          <h2 className="text-white font-semibold mb-4">This month&apos;s usage</h2>
          <UsageBar label="Leads added" used={usage.leadsThisMonth} limit={plan.leadsPerMonth} />
          <UsageBar label="AI audits" used={usage.auditsThisMonth} limit={plan.auditsPerMonth} />
          <p className="text-slate-500 text-xs mt-2">Usage resets on the first day of each calendar month.</p>
        </Card>
      </div>

      {!stripeOn && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 mb-6 text-amber-200 text-sm">
          <strong>Billing is not configured.</strong> Set <code className="text-amber-100">STRIPE_SECRET_KEY</code> and the plan
          price IDs to enable checkout. Everything else in the app works without it.
        </div>
      )}

      {isDemo && (
        <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl px-4 py-3 mb-6 text-blue-200 text-sm">
          This is the shared read-only demo account, so checkout is disabled. Create your own account to subscribe.
        </div>
      )}

      <h2 className="text-white font-semibold mb-4">Available plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PAID_PLAN_IDS.map(id => {
          const p = PLANS[id]
          const current = plan.id === id
          const canBuy = buyable.includes(id) && !current && !isDemo
          return (
            <div
              key={id}
              className={`rounded-xl border p-5 flex flex-col ${
                current ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-800/40 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold">{p.name}</h3>
                {current && <Badge variant="info">Current</Badge>}
              </div>
              <p className="text-2xl font-bold text-white mb-3">
                ${p.priceUsd}<span className="text-slate-400 text-xs font-normal">/mo</span>
              </p>
              <ul className="space-y-1.5 flex-1 mb-4">
                {p.features.map(f => (
                  <li key={f} className="text-slate-300 text-xs flex gap-1.5">
                    <span className="text-green-400">✓</span>{f}
                  </li>
                ))}
              </ul>
              {current ? (
                <p className="text-slate-500 text-xs text-center py-2">Your current plan</p>
              ) : canBuy ? (
                <UpgradeButton plan={id} label={`Upgrade to ${p.name}`} />
              ) : (
                <p className="text-slate-600 text-xs text-center py-2">
                  {isDemo ? 'Unavailable on the demo account' : 'Not available — billing not configured'}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
