import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { DemoLoginButton } from './DemoLoginButton'

export default function DemoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-400 text-2xl">🎯</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Try the Demo</h1>
            <p className="text-slate-400">Explore a fully functional demo of AgencyLead Radar using sample data. No signup required.</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 mb-6">
            <p className="text-slate-400 text-sm mb-5 text-center">Use these credentials to access the demo dashboard:</p>
            <div className="space-y-3 mb-6">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                <span className="text-slate-500 text-xs">Email</span>
                <span className="text-slate-200 text-sm font-mono">demo@agencyleadradar.com</span>
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex justify-between items-center">
                <span className="text-slate-500 text-xs">Password</span>
                <span className="text-slate-200 text-sm font-mono">demo123</span>
              </div>
            </div>
            <DemoLoginButton />
          </div>
          <p className="text-slate-600 text-xs text-center">This demo uses safe, pre-loaded sample data only. No real business data is included.</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
