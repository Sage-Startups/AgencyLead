import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">AL</span>
              </div>
              <span className="text-white font-semibold">AgencyLead Radar</span>
            </div>
            <p className="text-slate-500 text-sm">AI-powered lead scoring and outreach for US web design and SEO agencies.</p>
          </div>
          <div>
            <h4 className="text-slate-300 font-medium mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/#how-it-works" className="text-slate-500 hover:text-slate-300 transition-colors">How It Works</Link></li>
              <li><Link href="/pricing" className="text-slate-500 hover:text-slate-300 transition-colors">Pricing</Link></li>
              <li><Link href="/demo" className="text-slate-500 hover:text-slate-300 transition-colors">Try Demo</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-300 font-medium mb-3 text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/waitlist" className="text-slate-500 hover:text-slate-300 transition-colors">Join Waitlist</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-600 text-xs">
          <p>© {new Date().getFullYear()} AgencyLead Radar. Pre-revenue MVP. Demo data only.</p>
        </div>
      </div>
    </footer>
  )
}
