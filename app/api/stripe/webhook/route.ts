import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe, isStripeConfigured, planForPriceId } from '@/lib/stripe'
import { PlanId } from '@/lib/plans'

/**
 * Stripe webhook receiver. This is the only place subscription state is
 * written, so the database always reflects what Stripe believes, rather than
 * what the browser reported after checkout.
 *
 * Configure in the Stripe dashboard:
 *   URL:    https://your-domain/api/stripe/webhook
 *   Events: checkout.session.completed,
 *           customer.subscription.created,
 *           customer.subscription.updated,
 *           customer.subscription.deleted
 */
export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Billing is not configured.' }, { status: 503 })
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set; refusing to process webhook.')
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  // The raw body is required for signature verification — do not parse first.
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        if (s.mode === 'subscription' && s.subscription) {
          const sub = await getStripe().subscriptions.retrieve(String(s.subscription))
          await applySubscription(sub, s.metadata?.userId)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object as Stripe.Subscription)
        break
      }

      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err)
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/** Write a Stripe subscription's state onto the matching user record. */
async function applySubscription(sub: Stripe.Subscription, fallbackUserId?: string) {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  const metaUserId = (sub.metadata?.userId as string | undefined) || fallbackUserId

  const user =
    (metaUserId ? await prisma.user.findUnique({ where: { id: metaUserId } }) : null) ??
    (customerId ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } }) : null)

  if (!user) {
    console.error('Stripe webhook: no matching user for subscription', sub.id)
    return
  }

  // Determine the plan from the subscribed price, falling back to metadata.
  const priceId = sub.items.data[0]?.price?.id
  const planFromPrice = priceId ? planForPriceId(priceId) : undefined
  const metaPlan = sub.metadata?.plan as PlanId | undefined
  const plan: PlanId = planFromPrice || metaPlan || 'free'

  // A subscription that is gone or unpaid drops the account back to Free.
  const dead = sub.status === 'canceled' || sub.status === 'incomplete_expired' || sub.status === 'unpaid'

  const periodEndSeconds = (sub as unknown as { current_period_end?: number }).current_period_end

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: dead ? 'free' : plan,
      stripeCustomerId: customerId ?? user.stripeCustomerId,
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
      currentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null,
    },
  })

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      actionType: 'subscription_updated',
      description: `${user.email} subscription ${sub.status} (plan: ${dead ? 'free' : plan})`,
    },
  })
}
