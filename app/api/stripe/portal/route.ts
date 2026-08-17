import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getStripe, isStripeConfigured, baseUrl } from '@/lib/stripe'

/**
 * Opens the Stripe customer portal, where a subscriber can change plan,
 * update their card, download invoices, or cancel. Using Stripe's hosted
 * portal avoids rebuilding all of that here.
 */
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No billing account yet. Choose a plan to get started.' },
      { status: 400 }
    )
  }

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl()}/dashboard/billing`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'Could not open the billing portal.' }, { status: 500 })
  }
}
