'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import type { PlanId } from '@/lib/plans'

export function UpgradeButton({
  plan,
  label,
  variant = 'primary',
  disabled,
}: {
  plan: PlanId
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function start() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast(data.error || 'Could not start checkout', 'error')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      toast('Could not start checkout', 'error')
      setLoading(false)
    }
  }

  return (
    <Button onClick={start} disabled={loading || disabled} variant={variant} className="w-full">
      {loading ? 'Opening checkout…' : label}
    </Button>
  )
}

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false)

  async function open() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.url) {
        toast(data.error || 'Could not open the billing portal', 'error')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      toast('Could not open the billing portal', 'error')
      setLoading(false)
    }
  }

  return (
    <Button onClick={open} disabled={loading} variant="secondary" size="sm">
      {loading ? 'Opening…' : 'Manage billing & invoices'}
    </Button>
  )
}
