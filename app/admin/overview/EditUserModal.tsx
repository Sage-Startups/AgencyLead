'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { PLANS } from '@/lib/plans'

export interface AdminUser {
  id: string
  email: string
  fullName: string | null
  companyName: string | null
  role: string
  plan: string
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  leadCount?: number
  auditCount?: number
}

const ROLES = ['user', 'admin', 'superadmin']
const SUB_STATUSES = ['', 'active', 'trialing', 'past_due', 'canceled', 'incomplete', 'unpaid']

/** Format an ISO timestamp for a datetime-local input. */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditUserModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser
  onClose: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    fullName: user.fullName ?? '',
    companyName: user.companyName ?? '',
    email: user.email,
    role: user.role,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus ?? '',
    cancelAtPeriodEnd: user.cancelAtPeriodEnd,
    currentPeriodEnd: toLocalInput(user.currentPeriodEnd),
    createdAt: toLocalInput(user.createdAt),
    password: '',
  })

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }))

  const plan = PLANS[form.plan as keyof typeof PLANS] ?? PLANS.free
  const statusCountsAsLive =
    form.subscriptionStatus === 'active' ||
    form.subscriptionStatus === 'trialing' ||
    form.subscriptionStatus === 'past_due'
  const contributesMrr = form.plan !== 'free' && statusCountsAsLive

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const payload: Record<string, unknown> = {
      fullName: form.fullName,
      companyName: form.companyName,
      email: form.email,
      role: form.role,
      plan: form.plan,
      subscriptionStatus: form.subscriptionStatus,
      cancelAtPeriodEnd: form.cancelAtPeriodEnd,
      currentPeriodEnd: form.currentPeriodEnd ? new Date(form.currentPeriodEnd).toISOString() : '',
      createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined,
    }
    if (form.password) payload.password = form.password

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      toast(data.error || 'Could not save changes', 'error')
      return
    }
    toast('Account updated')
    onSaved()
  }

  async function remove() {
    if (!confirm(`Delete ${user.email}? This permanently removes the account and all of its leads and audits. This cannot be undone.`)) return
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setDeleting(false)
    if (!res.ok) {
      toast(data.error || 'Could not delete account', 'error')
      return
    }
    toast('Account deleted', 'error')
    onSaved()
  }

  const field = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm'
  const label = 'block text-xs font-medium text-slate-400 mb-1'

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
          <div className="min-w-0">
            <h2 className="text-white font-bold text-lg truncate">Edit account</h2>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0">✕</button>
        </div>

        <form onSubmit={save} className="p-6 space-y-5 overflow-y-auto">
          {/* Profile */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Profile</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Full name</label>
                <input className={field} value={form.fullName} onChange={e => set('fullName', e.target.value)} />
              </div>
              <div>
                <label className={label}>Company</label>
                <input className={field} value={form.companyName} onChange={e => set('companyName', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={label}>Email</label>
                <input className={field} type="email" value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Access */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Access</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Role</label>
                <select className={field} value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Set new password <span className="text-slate-600">(optional)</span></label>
                <input
                  className={field}
                  type="text"
                  autoComplete="off"
                  placeholder="Leave blank to keep current"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Subscription</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={label}>Plan</label>
                <select className={field} value={form.plan} onChange={e => set('plan', e.target.value)}>
                  {Object.values(PLANS).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (${p.priceUsd}/mo)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Status</label>
                <select
                  className={field}
                  value={form.subscriptionStatus}
                  onChange={e => set('subscriptionStatus', e.target.value)}
                >
                  {SUB_STATUSES.map(s => <option key={s} value={s}>{s || '— none —'}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>Renews / ends</label>
                <input
                  className={field}
                  type="datetime-local"
                  value={form.currentPeriodEnd}
                  onChange={e => set('currentPeriodEnd', e.target.value)}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.cancelAtPeriodEnd}
                    onChange={e => set('cancelAtPeriodEnd', e.target.checked)}
                    className="rounded"
                  />
                  Cancels at period end
                </label>
              </div>
            </div>

            <div className={`mt-3 rounded-lg px-3 py-2 text-xs border ${
              contributesMrr
                ? 'bg-green-950/30 border-green-800/40 text-green-300'
                : 'bg-slate-900/60 border-slate-700 text-slate-400'
            }`}>
              {contributesMrr
                ? `Counts toward MRR: +$${plan.priceUsd}/mo`
                : form.plan === 'free'
                  ? 'Free plan — contributes $0 to MRR.'
                  : `Plan is ${plan.name} but status is "${form.subscriptionStatus || 'none'}", so it does not count toward MRR and the account is limited to Free quotas.`}
            </div>

            {(user.stripeCustomerId || user.stripeSubscriptionId) && (
              <p className="text-slate-600 text-[11px] mt-2 break-all">
                Stripe: {user.stripeCustomerId || '—'} / {user.stripeSubscriptionId || '—'}
              </p>
            )}
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-slate-300 text-sm font-semibold mb-3">Dates</h3>
            <div>
              <label className={label}>Joined</label>
              <input
                className={field}
                type="datetime-local"
                value={form.createdAt}
                onChange={e => set('createdAt', e.target.value)}
              />
            </div>
          </div>

          {(user.leadCount !== undefined || user.auditCount !== undefined) && (
            <p className="text-slate-500 text-xs">
              This account owns {user.leadCount ?? 0} leads and {user.auditCount ?? 0} AI audits.
            </p>
          )}

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-700">
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
              <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
            <div className="pt-4">
              <Button type="button" variant="danger" onClick={remove} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
