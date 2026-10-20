import type Stripe from 'stripe'

import type { BillingPlan, SubscriptionStatus } from './plans'

export function planFromStripePriceId(priceId: string | undefined): BillingPlan {
  const personal = process.env.STRIPE_PRICE_PERSONAL_MONTHLY
  const business = process.env.STRIPE_PRICE_BUSINESS_MONTHLY
  if (priceId && business && priceId === business) {
    return 'business'
  }
  if (priceId && personal && priceId === personal) {
    return 'personal'
  }
  return 'personal'
}

export function mapStripeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'active'
  }
}

export type WorkspaceBillingPatch = {
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  plan?: BillingPlan
  subscriptionStatus?: SubscriptionStatus
  currentPeriodEnd?: string | null
  trialEndsAt?: string | null
}

export function patchFromSubscription(
  subscription: Stripe.Subscription,
  customerId: string
): WorkspaceBillingPatch {
  const priceId = subscription.items.data[0]?.price.id
  return {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    plan: planFromStripePriceId(priceId),
    subscriptionStatus: mapStripeSubscriptionStatus(subscription.status),
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    trialEndsAt: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  }
}
