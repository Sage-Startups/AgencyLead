import Link from 'next/link'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'
import { PLANS } from '@/lib/plans'

export const metadata = {
  title: 'Create your account — AgencyLead Radar',
  description: 'Start finding local businesses that need your web design or SEO services.',
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; plan?: string }>
}) {
  const { error, plan } = await searchParams
  const free = PLANS.free

  const fields = [
    { name: 'fullName', label: 'Full Name', type: 'text', required: false, placeholder: 'Jane Smith', autoComplete: 'name' },
    { name: 'companyName', label: 'Company Name', type: 'text', required: false, placeholder: 'Smith Digital', autoComplete: 'organization' },
    { name: 'email', label: 'Email Address', type: 'email', required: true, placeholder: 'you@agency.com', autoComplete: 'email' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
            <p className="text-slate-400 text-sm">
              Start on the {free.name} plan — no card required. Upgrade any time.
            </p>
          </div>

          <form action="/api/auth/signup" method="POST" className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 space-y-5">
            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}
            {plan && (
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg px-4 py-3 text-blue-200 text-sm">
                Create your account first — you&apos;ll be taken to checkout for the{' '}
                <span className="font-semibold">{plan}</span> plan straight after.
              </div>
            )}
            {plan && <input type="hidden" name="plan" value={plan} />}

            {fields.map(f => (
              <div key={f.name}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  name={f.name}
                  type={f.type}
                  required={f.required}
                  placeholder={f.placeholder}
                  autoComplete={f.autoComplete}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>

            <Button type="submit" size="lg" className="w-full">Create Account</Button>

            <p className="text-slate-500 text-xs text-center">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">Terms</Link> and{' '}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>.
            </p>
          </form>

          <p className="text-slate-500 text-sm text-center mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">Log in</Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
