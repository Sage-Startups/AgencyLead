import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { ScoreBadge } from '@/components/ui/ScoreBadge'

const demoLead = {
  businessName: 'Lone Star Roofing Co.',
  niche: 'Roofing Contractor',
  city: 'Austin',
  state: 'TX',
  websiteQuality: 'Poor',
  googleRating: 3.8,
  reviewCount: 14,
  opportunityScore: 86,
  recommendedService: 'Website Redesign + Local SEO',
  status: 'New',
}

const steps = [
  { num: '01', title: 'Add or Import Leads', desc: 'Paste in local business details or upload a CSV of prospects from any US city.' },
  { num: '02', title: 'Score Online Weaknesses', desc: 'Our algorithm scores each lead 0–100 based on website quality, reviews, SEO gaps, and missing CTAs.' },
  { num: '03', title: 'Generate AI Outreach', desc: 'One click generates a cold email, DM, call opener, and follow-up — personalized to each business.' },
  { num: '04', title: 'Close More Clients', desc: 'Save leads, track status, export to CSV, and move prospects through your pipeline.' },
]

const benefits = [
  { title: 'Instant Lead Scoring', desc: 'Know which businesses need you most before you pick up the phone.' },
  { title: 'AI-Powered Outreach', desc: 'Professional, personalized messages generated in seconds — not hours.' },
  { title: 'US Market Focus', desc: 'Built for agencies targeting local businesses across American cities and ZIP codes.' },
  { title: 'CSV Import & Export', desc: 'Bring in your prospect lists and export qualified leads with full audit data.' },
  { title: 'No Scraping Needed', desc: 'Add leads manually or via CSV. Clean, compliant, and simple.' },
  { title: 'Demo-Ready Dashboard', desc: 'Show clients a live audit in minutes with a polished, professional interface.' },
]

const targetUsers = ['Web Designers', 'SEO Agencies', 'Freelancers', 'Marketing Agencies', 'Local Marketing Consultants', 'Growth Agencies']

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-800/50 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-blue-300 text-sm font-medium">Early Access — Join the Waitlist</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Find local businesses that need your{' '}
            <span className="text-blue-400">web design or SEO</span> services.
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            AgencyLead Radar helps agencies score local business leads, spot online weaknesses, and generate personalized outreach in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo"><Button size="lg">Try Demo →</Button></Link>
            <Link href="/waitlist"><Button size="lg" variant="secondary">Join Waitlist</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-slate-500 text-sm mb-6 uppercase tracking-wider">Example Lead</p>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-white font-semibold text-lg">{demoLead.businessName}</h3>
                <p className="text-slate-400 text-sm">{demoLead.niche} · {demoLead.city}, {demoLead.state}</p>
              </div>
              <ScoreBadge score={demoLead.opportunityScore} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Website Quality', value: demoLead.websiteQuality, bad: true },
                { label: 'Google Rating', value: `${demoLead.googleRating} ★`, bad: true },
                { label: 'Review Count', value: demoLead.reviewCount },
                { label: 'Status', value: demoLead.status },
              ].map(item => (
                <div key={item.label} className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-slate-500 text-xs mb-1">{item.label}</p>
                  <p className={`font-medium text-sm ${item.bad ? 'text-red-400' : 'text-slate-200'}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-950/40 border border-blue-800/30 rounded-lg p-3">
              <p className="text-blue-300 text-xs font-medium mb-1">Recommended Service</p>
              <p className="text-blue-200 text-sm">{demoLead.recommendedService}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 px-4 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
          <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">Four steps from prospect to personalized outreach.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map(s => (
              <div key={s.num} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <span className="text-blue-500 text-xs font-bold tracking-wider mb-3 block">{s.num}</span>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Built for US Agencies</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map(b => (
              <div key={b.title} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-2">{b.title}</h3>
                <p className="text-slate-400 text-sm">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-slate-900/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Perfect For</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {targetUsers.map(u => (
              <span key={u} className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm">{u}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-400 mb-6">Plans starting at $29/month. Early access coming soon.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-6 py-4 text-sm"><span className="text-white font-bold">Starter</span> · $29/mo</div>
            <div className="bg-blue-600/20 border border-blue-500/50 rounded-xl px-6 py-4 text-sm"><span className="text-white font-bold">Agency</span> · $79/mo</div>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-6 py-4 text-sm"><span className="text-white font-bold">Pro</span> · $149/mo</div>
          </div>
          <Link href="/pricing" className="inline-block mt-6 text-blue-400 hover:text-blue-300 text-sm transition-colors">View full pricing →</Link>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-blue-950/20 to-slate-950">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Get Early Access</h2>
          <p className="text-slate-400 mb-8">Join the waitlist and be first to know when AgencyLead Radar opens for business.</p>
          <Link href="/waitlist"><Button size="lg">Join the Waitlist →</Button></Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
