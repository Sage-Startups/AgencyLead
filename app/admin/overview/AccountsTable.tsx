'use client'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'
import { EditUserModal, type AdminUser } from './EditUserModal'
import { PLANS } from '@/lib/plans'

function planBadge(planId: string) {
  if (planId === 'pro') return 'success'
  if (planId === 'agency') return 'info'
  if (planId === 'starter') return 'warning'
  return 'default'
}

/** Mirrors effectivePlan() on the server: a paid plan only counts while live. */
function effectivePlanId(u: AdminUser): string {
  if (!u.plan || u.plan === 'free') return 'free'
  const live =
    u.subscriptionStatus === 'active' ||
    u.subscriptionStatus === 'trialing' ||
    u.subscriptionStatus === 'past_due'
  return live ? u.plan : 'free'
}

export function AccountsTable({ users }: { users: AdminUser[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(u => {
      if (roleFilter && u.role !== roleFilter) return false
      if (planFilter && effectivePlanId(u) !== planFilter) return false
      if (!q) return true
      return (
        u.email.toLowerCase().includes(q) ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.companyName || '').toLowerCase().includes(q)
      )
    })
  }, [users, query, roleFilter, planFilter])

  function onSaved() {
    setEditing(null)
    router.refresh()
  }

  const input = 'bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm'

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          className={`${input} w-56`}
          placeholder="Search email, name, company…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <select className={input} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {['user', 'admin', 'superadmin'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={input} value={planFilter} onChange={e => setPlanFilter(e.target.value)}>
          <option value="">All plans</option>
          {Object.values(PLANS).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        {(query || roleFilter || planFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setRoleFilter(''); setPlanFilter('') }}>
            Clear
          </Button>
        )}
        <span className="text-slate-500 text-xs self-center ml-auto">
          {filtered.length} of {users.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {['Email', 'Name', 'Role', 'Plan', 'Status', 'Renews', 'Leads', 'Audits', 'Joined', ''].map(h => (
                <th key={h} className="text-left px-3 py-2 text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const eff = effectivePlanId(u)
              const p = PLANS[eff as keyof typeof PLANS] ?? PLANS.free
              return (
                <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-200 whitespace-nowrap">{u.email}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{u.fullName || '—'}</td>
                  <td className="px-3 py-2">
                    <Badge variant={u.role === 'superadmin' ? 'danger' : u.role === 'admin' ? 'warning' : 'default'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2"><Badge variant={planBadge(eff)}>{p.name}</Badge></td>
                  <td className="px-3 py-2 text-slate-400 text-xs whitespace-nowrap">
                    {u.subscriptionStatus || '—'}
                    {u.cancelAtPeriodEnd && <span className="text-amber-400"> (cancelling)</span>}
                  </td>
                  <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                    {u.currentPeriodEnd ? new Date(u.currentPeriodEnd).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-300">{u.leadCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-300">{u.auditCount ?? 0}</td>
                  <td className="px-3 py-2 text-slate-500 text-xs whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>Edit</Button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-500 text-sm">
                  No accounts match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
      )}
    </>
  )
}
