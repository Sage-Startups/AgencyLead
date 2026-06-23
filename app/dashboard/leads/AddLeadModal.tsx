'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props { onClose: () => void; onSaved: () => void }

const QUALITIES = ['unknown', 'good', 'average', 'poor', 'missing']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export function AddLeadModal({ onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    businessName: '', niche: '', city: '', state: '', zipCode: '',
    websiteUrl: '', email: '', phone: '', googleRating: '', reviewCount: '',
    websiteQuality: 'unknown', hasClearCta: false, hasQuoteForm: false,
    seoNotes: '', generalNotes: '', recommendedService: '',
  })

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (res.ok) onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-white font-bold text-lg">Add New Lead</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: 'businessName', l: 'Business Name', req: true },
              { k: 'niche', l: 'Niche / Industry', req: true },
              { k: 'city', l: 'City', req: true },
              { k: 'zipCode', l: 'ZIP Code', req: false },
              { k: 'websiteUrl', l: 'Website URL', req: false },
              { k: 'email', l: 'Email', req: false },
              { k: 'phone', l: 'Phone', req: false },
              { k: 'googleRating', l: 'Google Rating', req: false },
              { k: 'reviewCount', l: 'Review Count', req: false },
              { k: 'recommendedService', l: 'Recommended Service', req: false },
            ].map(f => (
              <div key={f.k}>
                <label className="block text-xs font-medium text-slate-400 mb-1">{f.l}{f.req && <span className="text-red-400 ml-1">*</span>}</label>
                <input type="text" required={f.req} value={form[f.k as keyof typeof form] as string} onChange={e => set(f.k, e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">State <span className="text-red-400">*</span></label>
              <select required value={form.state} onChange={e => set('state', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm">
                <option value="">Select state</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Website Quality</label>
              <select value={form.websiteQuality} onChange={e => set('websiteQuality', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm">
                {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.hasClearCta} onChange={e => set('hasClearCta', e.target.checked)} className="rounded" />
              Has Clear CTA
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={form.hasQuoteForm} onChange={e => set('hasQuoteForm', e.target.checked)} className="rounded" />
              Has Quote/Contact Form
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">SEO Notes</label>
            <textarea rows={2} value={form.seoNotes} onChange={e => set('seoNotes', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">General Notes</label>
            <textarea rows={2} value={form.generalNotes} onChange={e => set('generalNotes', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500 text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Lead'}</Button>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
