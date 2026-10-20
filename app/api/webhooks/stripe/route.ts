import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'

import { updateWorkspaceBillingAdmin } from '@/lib/billing/update-workspace-billing-admin'
import { getStripe, getStripeWebhookSecret } from '@/lib/billing/stripe-server'
import { patchFromSubscription } from '@/lib/billing/stripe-webhook-sync'

export const runtime = 'nodejs'

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const workspaceId = session.metadata?.workspace_id
  if (!workspaceId || !session.subscription || !session.customer) {
    return
  }
  const stripe = getStripe()
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription.id
  const customerId =
    typeof session.customer === 'string' ? session.customer : session.customer.id
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await updateWorkspaceBillingAdmin(workspaceId, patchFromSubscription(subscription, customerId))
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspace_id
  if (!workspaceId) {
    return
  }
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  await updateWorkspaceBillingAdmin(workspaceId, patchFromSubscription(subscription, customerId))
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = subscription.metadata?.workspace_id
  if (!workspaceId) {
    return
  }
  await updateWorkspaceBillingAdmin(workspaceId, {
    plan: 'free',
    subscriptionStatus: 'canceled',
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    trialEndsAt: null,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret())
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err) {
    console.error('stripe webhook handler failed', err)
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
