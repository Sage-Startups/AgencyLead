import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Log In</h1>
            <p className="text-slate-400 text-sm">Access your AgencyLead Radar dashboard.</p>
          </div>

          <form action="/api/auth/login" method="POST" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@agency.com"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">Log In</Button>
          </form>

          <p className="text-slate-500 text-xs text-center mt-6">
            Just exploring? <Link href="/demo" className="text-blue-400 hover:text-blue-300">Try the demo →</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
