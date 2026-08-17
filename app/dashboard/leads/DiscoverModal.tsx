'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

interface Suggestion {
  businessName: string
  niche: string
  city: string
  state: string
  whyProspect: string
  verifyFirst: string
}

interface Props {
  onClose: () => void
  onSaved: () => void
}

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const SERVICES = [
  'Website design & build',
  'Website redesign',
  'Local SEO',
  'SEO content marketing',
  'Google Business Profile optimization',
  'Conversion optimization',
  'Full digital marketing',
]

const NICHE_IDEAS = [
  'Roofing Contractor', 'Plumbing', 'Electrician', 'HVAC Contractor', 'Landscaper',
  'Dentist', 'Med Spa', 'Hair Salon', 'Auto Repair', 'Cleaning Company',
  'Chiropractor', 'Home Remodeling', 'Accountant', 'Dog Groomer',
]

type Step = 'questions' | 'loading' | 'results'

export function DiscoverModal({ onClose, onSaved }: Props) {
  const [step, setStep] = useState<Step>('questions')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    service: SERVICES[0],
    niche: '',
    city: '',
    state: '',
    idealClient: '',
    count: '8',
  })

  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [strategy, setStrategy] = useState('')
  const [searchTerms, setSearchTerms] = useState<string[]>([])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  async function runDiscovery(e: React.FormEvent) {
    e.preventDefault()
    setStep('loading')
    try {
      const res = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.error || 'Discovery failed', 'error')
        setStep('questions')
        return
      }
      if (!data.suggestions?.length) {
        toast('No suggestions came back. Try a broader niche or city.', 'error')
        setStep('questions')
        return
      }
      setSuggestions(data.suggestions)
      setSelected(new Set(data.suggestions.map((_: Suggestion, i: number) => i)))
      setStrategy(data.searchStrategy || '')
      setSearchTerms(data.suggestedSearchTerms || [])
      setStep('results')
    } catch {
      toast('Discovery failed', 'error')
      setStep('questions')
    }
  }

  function toggle(i: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  async function saveSelected() {
    const chosen = suggestions.filter((_, i) => selected.has(i))
    if (chosen.length === 0) {
      toast('Select at least one prospect to save', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/leads/discover/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestions: chosen }),
      })
      const data = await res.json()
      setSaving(false)
      if (!res.ok) {
        toast(data.error || 'Could not save prospects', 'error')
        return
      }
      toast(`Saved ${data.saved} prospects — verify them before making contact`)
      onSaved()
    } catch {
      setSaving(false)
      toast('Could not save prospects', 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Find Prospects with AI</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {step === 'results' ? 'Review and select which to save' : 'Answer a few questions to build a shortlist'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0">✕</button>
        </div>

        {/* ---------- Questions ---------- */}
        {step === 'questions' && (
          <form onSubmit={runDiscovery} className="p-6 space-y-4 overflow-y-auto">
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 text-amber-200 text-xs leading-relaxed">
              <strong>How this works.</strong> The AI cannot browse the web, so it suggests
              candidate businesses and where to look — it does not check live websites, ratings
              or reviews. Treat every result as a research starting point and verify it before
              contacting anyone.
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                What service are you selling? <span className="text-red-400">*</span>
              </label>
              <select
                value={form.service}
                onChange={e => set('service', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
              >
                {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                What industry do you want to target? <span className="text-red-400">*</span>
              </label>
              <input
                required
                list="niche-ideas"
                value={form.niche}
                onChange={e => set('niche', e.target.value)}
                placeholder="e.g. Roofing Contractor"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <datalist id="niche-ideas">
                {NICHE_IDEAS.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="e.g. Austin"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  State <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={form.state}
                  onChange={e => set('state', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">—</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                What makes a good client for you? <span className="text-slate-500">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={form.idealClient}
                onChange={e => set('idealClient', e.target.value)}
                placeholder="e.g. Family-run, 5-20 staff, already spending on ads"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">How many suggestions?</label>
              <select
                value={form.count}
                onChange={e => set('count', e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
              >
                {['5', '8', '10', '15'].map(n => <option key={n} value={n}>{n} prospects</option>)}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">✦ Find Prospects</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </form>
        )}

        {/* ---------- Loading ---------- */}
        {step === 'loading' && (
          <div className="p-12 text-center">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-sm">Building your prospect shortlist…</p>
            <p className="text-slate-500 text-xs mt-1">This usually takes 10–20 seconds.</p>
          </div>
        )}

        {/* ---------- Results ---------- */}
        {step === 'results' && (
          <>
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 text-amber-200 text-xs leading-relaxed">
                <strong>Unverified suggestions.</strong> These were generated from the model&apos;s
                training data, not a live business directory. Some may be out of date or may not
                exist. Confirm each business and look up its real website and reviews before you
                contact anyone. Saved prospects are flagged <em>Unverified</em> until you edit them.
              </div>

              <div className="flex items-center justify-between">
                <p className="text-slate-400 text-xs">
                  {selected.size} of {suggestions.length} selected
                </p>
                <button
                  onClick={() =>
                    setSelected(
                      selected.size === suggestions.length
                        ? new Set()
                        : new Set(suggestions.map((_, i) => i))
                    )
                  }
                  className="text-blue-400 hover:text-blue-300 text-xs"
                >
                  {selected.size === suggestions.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <label
                    key={i}
                    className={`block rounded-lg border p-3 cursor-pointer transition-colors ${
                      selected.has(i)
                        ? 'bg-blue-600/10 border-blue-500/50'
                        : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(i)}
                        onChange={() => toggle(i)}
                        className="mt-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium">{s.businessName}</p>
                        <p className="text-slate-500 text-xs mt-0.5">
                          {s.niche} · {s.city}, {s.state}
                        </p>
                        {s.whyProspect && (
                          <p className="text-slate-400 text-xs mt-2">{s.whyProspect}</p>
                        )}
                        {s.verifyFirst && (
                          <p className="text-amber-300/80 text-xs mt-1.5">
                            <strong>Verify:</strong> {s.verifyFirst}
                          </p>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {strategy && (
                <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
                    How to find more like these
                  </p>
                  <p className="text-slate-300 text-sm leading-relaxed">{strategy}</p>
                  {searchTerms.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {searchTerms.map(t => (
                        <span key={t} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2 py-1 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex gap-3 shrink-0">
              <Button onClick={saveSelected} disabled={saving || selected.size === 0}>
                {saving ? 'Saving…' : `Save ${selected.size} for verification`}
              </Button>
              <Button variant="secondary" onClick={() => setStep('questions')}>Back</Button>
              <Button variant="ghost" onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
