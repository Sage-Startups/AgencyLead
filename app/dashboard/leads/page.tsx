'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { toast } from '@/components/ui/Toast'
import { AddLeadModal, type EditableLead } from './AddLeadModal'
import { ImportModal } from './ImportModal'

type Lead = {
  id: string
  businessName: string
  niche: string
  city: string
  state: string
  websiteUrl: string | null
  googleRating: number | null
  reviewCount: number | null
  websiteQuality: string
  opportunityScore: number
  recommendedService: string | null
  status: string
}

const STATUSES = ['new', 'saved', 'contacted', 'interested', 'not_suitable']
const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [niche, setNiche] = useState('')
  const [state, setState] = useState('')
  const [status, setStatus] = useState('')
  const [minScore, setMinScore] = useState('')
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === '1')
  const [showImport, setShowImport] = useState(false)
  const [editLead, setEditLead] = useState<EditableLead | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (niche) params.set('niche', niche)
    if (state) params.set('state', state)
    if (status) params.set('status', status)
    if (minScore) params.set('minScore', minScore)
    const res = await fetch(`/api/leads?${params}`)
    const data = await res.json()
    setLeads(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, niche, state, status, minScore])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  async function updateStatus(id: string, newStatus: string) {
    await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    toast(`Status updated to ${newStatus.replace('_', ' ')}`)
    fetchLeads()
  }

  async function deleteLead(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    toast('Lead deleted', 'error')
    fetchLeads()
  }

  async function openEdit(id: string) {
    const res = await fetch(`/api/leads/${id}`)
    if (!res.ok) { toast('Could not load lead', 'error'); return }
    setEditLead(await res.json())
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Lead Scanner</h1>
          <p className="text-slate-400 text-sm">{leads.length} leads found</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>Import CSV</Button>
          <a href="/api/leads/export"><Button variant="secondary" size="sm">Export CSV</Button></a>
          <Button size="sm" onClick={() => setShowAdd(true)}>+ Add Lead</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search business name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm w-52"
        />
        <input
          type="text"
          placeholder="Filter by niche..."
          value={niche}
          onChange={e => setNiche(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm w-40"
        />
        <select
          value={state}
          onChange={e => setState(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select
          value={minScore}
          onChange={e => setMinScore(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-sm"
        >
          <option value="">All Scores</option>
          <option value="80">High (80+)</option>
          <option value="60">Medium+ (60+)</option>
          <option value="40">Low+ (40+)</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setNiche(''); setState(''); setStatus(''); setMinScore('') }}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading leads...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-3">No leads found.</p>
            <Button onClick={() => setShowAdd(true)}>+ Add Your First Lead</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  {['Business', 'Niche', 'Location', 'Website Quality', 'Rating', 'Score', 'Service', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead.id} className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/leads/${lead.id}`} className="text-white hover:text-blue-300 font-medium transition-colors">{lead.businessName}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{lead.niche}</td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{lead.city}, {lead.state}</td>
                    <td className="px-4 py-3">
                      <span className={`capitalize text-xs font-medium ${
                        lead.websiteQuality === 'poor' || lead.websiteQuality === 'missing' ? 'text-red-400' :
                        lead.websiteQuality === 'average' ? 'text-amber-400' :
                        lead.websiteQuality === 'good' ? 'text-green-400' : 'text-slate-400'
                      }`}>{lead.websiteQuality}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {lead.googleRating ? `${lead.googleRating} ★` : '—'} {lead.reviewCount ? `(${lead.reviewCount})` : ''}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><ScoreBadge score={lead.opportunityScore} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-32 truncate">{lead.recommendedService || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={e => updateStatus(lead.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Link href={`/dashboard/leads/${lead.id}`}><Button size="sm" variant="ghost">View</Button></Link>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(lead.id)}>Edit</Button>
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

      {showAdd && <AddLeadModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); fetchLeads(); toast('Lead added!') }} />}
      {editLead && <AddLeadModal lead={editLead} onClose={() => setEditLead(null)} onSaved={() => { setEditLead(null); fetchLeads(); toast('Lead updated!') }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); fetchLeads(); }} />}
    </div>
  )
}
