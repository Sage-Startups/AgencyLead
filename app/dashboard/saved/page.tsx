'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'

type Lead = {
  id: string
  businessName: string
  niche: string
  city: string
  state: string
  opportunityScore: number
  recommendedService: string | null
  status: string
  generalNotes: string | null
}

function statusVariant(s: string) {
  if (s === 'saved') return 'info'
  if (s === 'contacted') return 'warning'
  if (s === 'interested') return 'success'
  if (s === 'not_suitable') return 'danger'
  return 'default'
}

const STATUSES = ['new', 'saved', 'contacted', 'interested', 'not_suitable']

export default function SavedLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads?status=saved')
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const filtered = leads.filter(l =>
    search === '' ||
    l.businessName.toLowerCase().includes(search.toLowerCase()) ||
    l.niche.toLowerCase().includes(search.toLowerCase())
  )

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    toast(`Status updated to ${status.replace('_', ' ')}`)
    fetchLeads()
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    toast('Lead deleted', 'error')
    fetchLeads()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Saved Leads</h1>
          <p className="text-slate-400 text-sm">{filtered.length} saved leads</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/leads/export"><Button variant="secondary" size="sm">Export CSV</Button></a>
        </div>
      </div>

      <div className="mb-4">
        <input type="text" placeholder="Search saved leads..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm w-64" />
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-3">No saved leads yet.</p>
            <Link href="/dashboard/leads"><Button>Go to Lead Scanner</Button></Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  {['Business', 'Niche', 'Location', 'Score', 'Recommended Service', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={lead.id} className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-white hover:text-blue-300 font-medium transition-colors">{lead.businessName}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{lead.niche}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{lead.city}, {lead.state}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><ScoreBadge score={lead.opportunityScore} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{lead.recommendedService || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none">
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/leads/${lead.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                        <Button size="sm" variant="danger" onClick={() => deleteLead(lead.id, lead.businessName)}>Del</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
