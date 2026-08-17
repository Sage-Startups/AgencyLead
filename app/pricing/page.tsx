import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { getSession } from '@/lib/auth'
import { PLANS, PAID_PLAN_IDS } from '@/lib/plans'
import { purchasablePlans, isStripeConfigured } from '@/lib/stripe'
import { PlanCta } from './PricingActions'

export const metadata = {
  title: 'Pricing — AgencyLead Radar',
  description: 'Simple USD pricing for US web design and SEO agencies. Start free, upgrade any time.',
}

export default async function PricingPage() {
  const session = await getSession()
  const signedIn = Boolean(session)
  const buyable = purchasablePlans()
  const stripeOn = isStripeConfigured()
  const free = PLANS.free

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Simple Pricing</h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              All prices in USD. Start free with no card required, and upgrade whenever you need more volume.
            </p>
            {!stripeOn && (
              <div className="mt-4 inline-flex items-center gap-2 bg-amber-950/40 border border-amber-800/40 rounded-full px-4 py-1.5">
                <span className="text-amber-400 text-sm font-medium">
                  Early access — checkout is not live yet. Join the waitlist.
                </span>
              </div>
            )}
          </div>

          {/* Free plan */}
          <div className="max-w-md mx-auto mb-8">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-6 text-center">
              <h2 className="text-white font-bold text-lg mb-1">{free.name}</h2>
              <p className="text-3xl font-bold text-white mb-2">
                $0<span className="text-slate-400 text-sm font-normal">/month</span>
              </p>
              <p className="text-slate-400 text-sm mb-4">
                {free.leadsPerMonth} leads and {free.auditsPerMonth} AI audits per month. No card required.
              </p>
              <Link
                href="/signup"
                className="inline-block bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 rounded-lg px-6 py-2 text-sm font-medium transition-colors"
              >
                Create free account
              </Link>
            </div>
          </div>

          {/* Paid plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAID_PLAN_IDS.map(id => {
              const plan = PLANS[id]
              const highlighted = id === 'agency'
              return (
                <div
                  key={id}
                  className={`rounded-2xl border p-8 flex flex-col ${
                    highlighted
                      ? 'bg-blue-600/10 border-blue-500/50 shadow-xl shadow-blue-900/20'
                      : 'bg-slate-800/40 border-slate-700/50'
                  }`}
                >
                  {highlighted && (
                    <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">
                      Most Popular
                    </span>
                  )}
                  <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-4xl font-bold text-white">${plan.priceUsd}</span>
                    <span className="text-slate-400 text-sm">/month</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-green-400 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <PlanCta
                    plan={id}
                    planName={plan.name}
                    signedIn={signedIn}
                    purchasable={buyable.includes(id)}
                    highlighted={highlighted}
                  />
                </div>
              )
            })}
          </div>

          <p className="text-center text-slate-600 text-sm mt-8">
            {stripeOn
              ? 'Secure payment handled by Stripe. Cancel any time from your billing page.'
              : 'Payment is not active yet — the pricing above is indicative and no card is collected.'}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
