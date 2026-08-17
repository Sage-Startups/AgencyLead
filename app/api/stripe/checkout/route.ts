import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { isPlanId, PLANS } from '@/lib/plans'
import { getStripe, isStripeConfigured, priceIdForPlan, baseUrl } from '@/lib/stripe'
import { isDemoUser, DEMO_READONLY_MESSAGE } from '@/lib/demo'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (await isDemoUser(session.userId)) {
    return NextResponse.json({ error: DEMO_READONLY_MESSAGE }, { status: 403 })
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured. Set STRIPE_SECRET_KEY to enable checkout.' },
      { status: 503 }
    )
  }

  const { plan } = await req.json()
  if (!plan || !isPlanId(plan) || plan === 'free') {
    return NextResponse.json({ error: 'Choose a valid paid plan.' }, { status: 400 })
  }

  const priceId = priceIdForPlan(plan)
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for the ${PLANS[plan].name} plan. Set ${PLANS[plan].stripePriceEnv}.` },
      { status: 503 }
    )
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

  try {
    const stripe = getStripe()

    // Reuse the Stripe customer so a user's billing history stays in one place.
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl()}/dashboard/billing?checkout=success`,
      cancel_url: `${baseUrl()}/dashboard/billing?checkout=cancelled`,
      allow_promotion_codes: true,
      // Carried through to the webhook so we know who and what to upgrade,
      // even if the subscription object arrives before the session does.
      subscription_data: { metadata: { userId: user.id, plan } },
      metadata: { userId: user.id, plan },
    })

    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Could not start checkout. Please try again.' }, { status: 500 })
  }
}
