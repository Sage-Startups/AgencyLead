'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ScoreBadge } from '@/components/ui/ScoreBadge'
import { Card } from '@/components/ui/Card'
import { toast } from '@/components/ui/Toast'

type AiAudit = {
  id: string
  auditSummary: string
  mainIssues: string
  opportunityReason: string
  recommendedService: string
  suggestedOffer: string
  coldEmail: string
  dmMessage: string
  callOpener: string
  followUpMessage: string
  createdAt: string
}

type Lead = {
  id: string
  businessName: string
  niche: string
  city: string
  state: string
  zipCode: string | null
  websiteUrl: string | null
  email: string | null
  phone: string | null
  googleRating: number | null
  reviewCount: number | null
  websiteQuality: string
  hasClearCta: boolean
  hasQuoteForm: boolean
  seoNotes: string | null
  generalNotes: string | null
  opportunityScore: number
  recommendedService: string | null
  status: string
  aiAudits: AiAudit[]
}

function statusVariant(s: string) {
  if (s === 'saved') return 'info'
  if (s === 'contacted') return 'warning'
  if (s === 'interested') return 'success'
  if (s === 'not_suitable') return 'danger'
  return 'default'
}

const STATUSES = ['new', 'saved', 'contacted', 'interested', 'not_suitable']

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</span>
        <button onClick={copy} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className="bg-slate-900/70 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
        {value}
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingAudit, setGeneratingAudit] = useState(false)
  const [activeTab, setActiveTab] = useState<'cold-email' | 'dm' | 'call' | 'follow-up'>('cold-email')

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(r => r.json())
      .then(data => { setLead(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  async function generateAudit() {
    setGeneratingAudit(true)
    const res = await fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: id }),
    })
    const data = await res.json()
    setGeneratingAudit(false)
    if (!res.ok) {
      toast(data.error || 'Audit generation failed', 'error')
      return
    }
    toast('AI audit generated!')
    const updated = await fetch(`/api/leads/${id}`).then(r => r.json())
    setLead(updated)
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.error || 'Update failed', 'error')
      return
    }
    setLead(prev => prev ? { ...prev, status } : prev)
    toast(`Status updated to ${status.replace('_', ' ')}`)
  }

  if (loading) return <div className="p-8 text-slate-400">Loading...</div>
  if (!lead) return <div className="p-8 text-slate-400">Lead not found. <Link href="/dashboard/leads" className="text-blue-400">Back to leads</Link></div>

  const latestAudit = lead.aiAudits?.[0]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/dashboard/leads" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">← Lead Scanner</Link>
          <h1 className="text-2xl font-bold text-white mt-1">{lead.businessName}</h1>
          <p className="text-slate-400 text-sm">{lead.niche} · {lead.city}, {lead.state}{lead.zipCode ? ` ${lead.zipCode}` : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={lead.opportunityScore} />
          <Badge variant={statusVariant(lead.status)}>{lead.status.replace('_', ' ')}</Badge>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button size="sm" onClick={() => updateStatus('saved')}>Save Lead</Button>
        <Button size="sm" variant="secondary" onClick={() => updateStatus('contacted')}>Mark Contacted</Button>
        <select
          value={lead.status}
          onChange={e => updateStatus(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-300 text-sm focus:outline-none focus:border-blue-500"
        >
          {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <a href="/api/leads/export"><Button size="sm" variant="ghost">Export All</Button></a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Business overview */}
        <Card className="lg:col-span-2">
          <h2 className="text-white font-semibold mb-4">Business Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Website', value: lead.websiteUrl ? <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block">{lead.websiteUrl}</a> : <span className="text-red-400">None found</span> },
              { label: 'Email', value: lead.email || '—' },
              { label: 'Phone', value: lead.phone || '—' },
              { label: 'Google Rating', value: lead.googleRating ? `${lead.googleRating} ★` : '—' },
              { label: 'Review Count', value: lead.reviewCount ?? '—' },
              { label: 'Website Quality', value: <span className={`capitalize font-medium ${lead.websiteQuality === 'poor' || lead.websiteQuality === 'missing' ? 'text-red-400' : lead.websiteQuality === 'average' ? 'text-amber-400' : lead.websiteQuality === 'good' ? 'text-green-400' : 'text-slate-400'}`}>{lead.websiteQuality}</span> },
              { label: 'Has Clear CTA', value: lead.hasClearCta ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span> },
              { label: 'Has Quote Form', value: lead.hasQuoteForm ? <span className="text-green-400">Yes</span> : <span className="text-red-400">No</span> },
            ].map(item => (
              <div key={item.label}>
                <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
                <p className="text-slate-200 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
          {lead.seoNotes && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-slate-500 text-xs mb-1">SEO Notes</p>
              <p className="text-slate-300 text-sm">{lead.seoNotes}</p>
            </div>
          )}
          {lead.generalNotes && (
            <div className="mt-3">
              <p className="text-slate-500 text-xs mb-1">General Notes</p>
              <p className="text-slate-300 text-sm">{lead.generalNotes}</p>
            </div>
          )}
        </Card>

        {/* Score card */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-white font-semibold mb-3">Opportunity Score</h2>
            <div className="text-center py-2">
              <div className={`text-5xl font-bold mb-2 ${lead.opportunityScore >= 80 ? 'text-green-400' : lead.opportunityScore >= 60 ? 'text-amber-400' : 'text-slate-400'}`}>
                {lead.opportunityScore}
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all ${lead.opportunityScore >= 80 ? 'bg-green-500' : lead.opportunityScore >= 60 ? 'bg-amber-500' : 'bg-slate-500'}`}
                  style={{ width: `${lead.opportunityScore}%` }}
                />
              </div>
              <p className="text-slate-400 text-sm">{lead.opportunityScore >= 80 ? 'High' : lead.opportunityScore >= 60 ? 'Medium' : 'Low'} opportunity</p>
            </div>
          </Card>
          {lead.recommendedService && (
            <Card>
              <p className="text-slate-500 text-xs mb-1">Recommended Service</p>
              <p className="text-blue-300 font-medium text-sm">{lead.recommendedService}</p>
            </Card>
          )}
        </div>
      </div>

      {/* AI Audit section */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">AI Audit & Outreach</h2>
          <Button
            onClick={generateAudit}
            disabled={generatingAudit}
            size="sm"
          >
            {generatingAudit ? '⏳ Generating...' : latestAudit ? '↻ Regenerate Audit' : '✦ Generate AI Audit'}
          </Button>
        </div>

        {generatingAudit && (
          <div className="py-8 text-center">
            <p className="text-slate-400 text-sm">Generating AI audit — this takes about 10-15 seconds...</p>
            <div className="mt-3 w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!latestAudit && !generatingAudit && (
          <div className="py-8 text-center text-slate-500">
            <p className="mb-3">No AI audit generated yet.</p>
            <p className="text-xs">Click "Generate AI Audit" to create a personalized audit and outreach pack for this lead.</p>
          </div>
        )}

        {latestAudit && !generatingAudit && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Business Summary</p>
                <p className="text-slate-300 text-sm leading-relaxed">{latestAudit.auditSummary}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Why This Prospect</p>
                <p className="text-slate-300 text-sm leading-relaxed">{latestAudit.opportunityReason}</p>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Main Issues</p>
              <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm whitespace-pre-wrap">{latestAudit.mainIssues}</div>
            </div>
            <div className="mb-6">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Suggested Offer</p>
              <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg p-4 text-blue-200 text-sm">{latestAudit.suggestedOffer}</div>
            </div>

            {/* Outreach tabs */}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">Outreach Templates</p>
              <div className="flex gap-1 mb-4 border-b border-slate-700">
                {[
                  { key: 'cold-email', label: 'Cold Email' },
                  { key: 'dm', label: 'DM' },
                  { key: 'call', label: 'Call Opener' },
                  { key: 'follow-up', label: 'Follow-Up' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${
                      activeTab === tab.key
                        ? 'text-blue-400 border-blue-400'
                        : 'text-slate-500 border-transparent hover:text-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'cold-email' && <CopyBlock label="Cold Email" value={latestAudit.coldEmail} />}
              {activeTab === 'dm' && <CopyBlock label="DM Message" value={latestAudit.dmMessage} />}
              {activeTab === 'call' && <CopyBlock label="Call Opener" value={latestAudit.callOpener} />}
              {activeTab === 'follow-up' && <CopyBlock label="Follow-Up Message" value={latestAudit.followUpMessage} />}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
