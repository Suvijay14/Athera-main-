export type BillingPlan = 'free' | 'personal' | 'business'

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export const FREE_MAX_SPACES = 1
export const FREE_MAX_OPEN_ITEMS = 100

export const PLAN_LABELS: Record<BillingPlan, string> = {
  free: 'Free',
  personal: 'Personal',
  business: 'Business',
}

export const PLAN_PRICING_COPY: Record<BillingPlan, string> = {
  free: '$0 — 1 space, 100 open items',
  personal: '$8/mo — unlimited spaces & items, Google Calendar import',
  business: '$20/mo + $8/seat — team seats coming later (tier only for now)',
}

/** Paid plans with active or trialing status can use paid features. */
export function isPaidPlanActive(
  plan: BillingPlan,
  status: SubscriptionStatus
): boolean {
  if (plan === 'free') {
    return false
  }
  return status === 'active' || status === 'trialing'
}

export function canUseCalendarImport(plan: BillingPlan, status: SubscriptionStatus): boolean {
  return isPaidPlanActive(plan, status)
}
