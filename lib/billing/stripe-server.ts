import 'server-only'

import Stripe from 'stripe'

import type { BillingPlan } from './plans'

let stripeClient: Stripe | null = null

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  }
  return stripeClient
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return secret
}

export function priceIdForPlan(plan: Exclude<BillingPlan, 'free'>): string {
  const envKey =
    plan === 'personal' ? 'STRIPE_PRICE_PERSONAL_MONTHLY' : 'STRIPE_PRICE_BUSINESS_MONTHLY'
  const priceId = process.env[envKey]
  if (!priceId) {
    throw new Error(`${envKey} is not configured`)
  }
  return priceId
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
}
