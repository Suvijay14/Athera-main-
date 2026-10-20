import type { BillingPlan } from './plans'
import { FREE_MAX_OPEN_ITEMS, FREE_MAX_SPACES, isPaidPlanActive } from './plans'
import type { SubscriptionStatus } from './plans'

export type LimitAction = 'create_space' | 'create_item'

export type PlanLimitInput = {
  plan: BillingPlan
  subscriptionStatus: SubscriptionStatus
  nonArchivedSpaceCount: number
  openItemCount: number
}

export type PlanLimitResult =
  | { allowed: true }
  | {
      allowed: false
      code: 'upgrade_required'
      message: string
      limit: 'spaces' | 'open_items'
    }

export function checkPlanLimit(
  input: PlanLimitInput,
  action: LimitAction
): PlanLimitResult {
  if (isPaidPlanActive(input.plan, input.subscriptionStatus)) {
    return { allowed: true }
  }

  if (action === 'create_space') {
    if (input.nonArchivedSpaceCount >= FREE_MAX_SPACES) {
      return {
        allowed: false,
        code: 'upgrade_required',
        message: `Free plan includes ${FREE_MAX_SPACES} space. Upgrade to Personal for unlimited spaces.`,
        limit: 'spaces',
      }
    }
    return { allowed: true }
  }

  if (input.openItemCount >= FREE_MAX_OPEN_ITEMS) {
    return {
      allowed: false,
      code: 'upgrade_required',
      message: `Free plan includes ${FREE_MAX_OPEN_ITEMS} open items. Upgrade to Personal to add more.`,
      limit: 'open_items',
    }
  }
  return { allowed: true }
}
