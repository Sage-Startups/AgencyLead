import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

const plans = [
  { name: 'Starter', price: '$29', period: '/month', desc: 'For freelancers and solo web designers getting started.', features: ['100 leads/month', 'AI audit generation', 'CSV export', 'Saved leads', 'Email support'], highlighted: false },
  { name: 'Agency', price: '$79', period: '/month', desc: 'For growing agencies handling multiple clients.', features: ['500 leads/month', 'All Starter features', 'Advanced filters', 'Saved campaigns', 'Priority roadmap access'], highlighted: true },
  { name: 'Pro', price: '$149', period: '/month', desc: 'For established agencies at scale.', features: ['2,000 leads/month', 'All Agency features', 'White-label report (roadmap)', 'Team access (roadmap)', 'Bulk lead tools (roadmap)'], highlighted: false },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Simple Pricing</h1>
            <p className="text-slate-400 max-w-xl mx-auto">All prices in USD. Early access coming soon — join the waitlist to be notified at launch.</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-950/40 border border-amber-800/40 rounded-full px-4 py-1.5">
              <span className="text-amber-400 text-sm font-medium">Early access coming soon. Join the waitlist.</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.name} className={`rounded-2xl border p-8 flex flex-col ${ plan.highlighted ? 'bg-blue-600/10 border-blue-500/50 shadow-xl shadow-blue-900/20' : 'bg-slate-800/40 border-slate-700/50' }`}>
                {plan.highlighted && <span className="inline-block bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 self-start">Most Popular</span>}
                <h2 className="text-white font-bold text-xl mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-slate-400 text-sm">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.desc}</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/waitlist">
                  <Button className="w-full" variant={plan.highlighted ? 'primary' : 'secondary'}>Join Waitlist</Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-sm mt-8">No credit card required. Payment not active — waitlist only.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
