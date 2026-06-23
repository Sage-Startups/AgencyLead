'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'

type Stats = { users: number; leads: number; audits: number; waitlist: number; imports: number; recentActivity: { id: string; actionType: string; description: string; createdAt: string }[] }
type Signup = { id: string; name: string; email: string; companyName: string | null; buyerType: string | null; mainService: string | null; message: string | null; status: string; createdAt: string }

const SIGNUP_STATUSES = ['new', 'contacted', 'interested', 'not_interested']

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [signups, setSignups] = useState<Signup[]>([])
  const [search, setSearch] = useState('')
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(data => { setStats(data); setLoadingStats(false) })
    fetchSignups()
  }, [])

  async function fetchSignups() {
    const res = await fetch(`/api/admin/waitlist?search=${encodeURIComponent(search)}`)
    const data = await res.json()
    setSignups(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchSignups() }, [search])

  async function updateSignupStatus(id: string, status: string) {
    await fetch('/api/admin/waitlist', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    toast('Status updated')
    fetchSignups()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">Platform overview and waitlist management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {loadingStats ? (
          <div className="col-span-5 text-slate-500 text-sm">Loading stats...</div>
        ) : stats && [
          { label: 'Total Users', value: stats.users },
          { label: 'Total Leads', value: stats.leads },
          { label: 'AI Audits', value: stats.audits },
          { label: 'Waitlist', value: stats.waitlist },
          { label: 'Imports', value: stats.imports },
        ].map(s => (
          <Card key={s.label} className="py-4">
            <p className="text-slate-500 text-xs mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold">Waitlist Signups</h2>
          <a href="/api/admin/waitlist?format=csv">
            <Button size="sm" variant="secondary">Export CSV</Button>
          </a>
        </div>
        <input type="text" placeholder="Search by name, email, or company..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm w-64 mb-4" />
        {signups.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No waitlist signups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  {['Name', 'Email', 'Company', 'Type', 'Service', 'Date', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-slate-500 text-xs uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {signups.map(s => (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                    <td className="px-3 py-2 text-slate-200">{s.name}</td>
                    <td className="px-3 py-2 text-slate-400">{s.email}</td>
                    <td className="px-3 py-2 text-slate-400">{s.companyName || '—'}</td>
                    <td className="px-3 py-2 text-slate-400">{s.buyerType || '—'}</td>
                    <td className="px-3 py-2 text-slate-400">{s.mainService || '—'}</td>
                    <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2">
                      <select value={s.status} onChange={e => updateSignupStatus(s.id, e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none">
                        {SIGNUP_STATUSES.map(st => <option key={st} value={st}>{st.replace('_', ' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <h2 className="text-white font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {stats.recentActivity.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                <div>
                  <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded mr-2">{a.actionType}</span>
                  <span className="text-slate-300 text-sm">{a.description}</span>
                </div>
                <span className="text-slate-600 text-xs">{new Date(a.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
