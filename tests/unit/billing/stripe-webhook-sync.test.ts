import { describe, expect, it } from 'vitest'

import { mapStripeSubscriptionStatus, planFromStripePriceId } from '@/lib/billing/stripe-webhook-sync'

describe('stripe-webhook-sync', () => {
  it('maps subscription statuses', () => {
    expect(mapStripeSubscriptionStatus('trialing')).toBe('trialing')
    expect(mapStripeSubscriptionStatus('past_due')).toBe('past_due')
    expect(mapStripeSubscriptionStatus('canceled')).toBe('canceled')
  })

  it('resolves plan from env price ids', () => {
    const prevP = process.env.STRIPE_PRICE_PERSONAL_MONTHLY
    const prevB = process.env.STRIPE_PRICE_BUSINESS_MONTHLY
    process.env.STRIPE_PRICE_PERSONAL_MONTHLY = 'price_personal_test'
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = 'price_business_test'
    expect(planFromStripePriceId('price_business_test')).toBe('business')
    expect(planFromStripePriceId('price_personal_test')).toBe('personal')
    process.env.STRIPE_PRICE_PERSONAL_MONTHLY = prevP
    process.env.STRIPE_PRICE_BUSINESS_MONTHLY = prevB
  })
})
