'use client'
import { useState } from 'react'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/Button'

const buyerTypes = ['Web Designer', 'SEO Agency', 'Freelancer', 'Marketing Agency', 'Consultant', 'Other']

export default function WaitlistPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', companyName: '', buyerType: '', mainService: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-green-400 text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">You're on the list!</h1>
            <p className="text-slate-400">We'll be in touch when AgencyLead Radar opens for early access. Thank you for your interest.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Nav />
      <main className="flex-1 py-20 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">Join the Waitlist</h1>
            <p className="text-slate-400">Get early access to AgencyLead Radar when we launch.</p>
          </div>
          <form onSubmit={handleSubmit} className="bg-slate-800/40 border border-slate-700 rounded-2xl p-8 space-y-5">
            {[
              { id: 'name', label: 'Full Name', type: 'text', required: true },
              { id: 'email', label: 'Email Address', type: 'email', required: true },
              { id: 'companyName', label: 'Company Name', type: 'text', required: false },
              { id: 'mainService', label: 'Main Service You Sell', type: 'text', required: false, placeholder: 'e.g. Web design, Local SEO, Google Ads' },
            ].map(field => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={field.type}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={form[field.id as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">I am a...</label>
              <select value={form.buyerType} onChange={e => setForm(prev => ({ ...prev, buyerType: e.target.value }))} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm">
                <option value="">Select type</option>
                {buyerTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Message (optional)</label>
              <textarea rows={3} value={form.message} onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))} placeholder="Anything you'd like us to know..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm resize-none" />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? 'Submitting...' : 'Join the Waitlist'}</Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
