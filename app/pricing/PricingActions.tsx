'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import type { PlanId } from '@/lib/plans'

/**
 * Single CTA used on every pricing card.
 * - Signed out  -> send to signup, remembering the chosen plan
 * - Signed in   -> start Stripe checkout directly
 * - No Stripe   -> fall back to the waitlist so the page is never a dead end
 */
export function PlanCta({
  plan,
  planName,
  signedIn,
  purchasable,
  highlighted,
}: {
  plan: PlanId
  planName: string
  signedIn: boolean
  purchasable: boolean
  highlighted?: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const variant = highlighted ? 'primary' : 'secondary'

  if (!purchasable) {
    return (
      <Button className="w-full" variant={variant} onClick={() => router.push('/waitlist')}>
        Join Waitlist
      </Button>
    )
  }

  if (!signedIn) {
    return (
      <Button
        className="w-full"
        variant={variant}
        onClick={() => router.push(`/signup?plan=${plan}`)}
      >
        Get {planName}
      </Button>
    )
  }

  async function checkout() {
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
    <Button className="w-full" variant={variant} onClick={checkout} disabled={loading}>
      {loading ? 'Opening checkout…' : `Get ${planName}`}
    </Button>
  )
}
