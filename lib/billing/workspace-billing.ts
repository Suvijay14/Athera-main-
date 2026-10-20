import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { wrapSupabaseError } from '@/lib/db/errors'
import type { BillingPlan, SubscriptionStatus } from '@/lib/billing/plans'

export type WorkspaceBilling = {
  plan: BillingPlan
  subscriptionStatus: SubscriptionStatus
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  deletedAt: string | null
}

export function mapWorkspaceBillingRow(row: {
  plan: string
  subscription_status: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  current_period_end: string | null
  trial_ends_at: string | null
  deleted_at: string | null
}): WorkspaceBilling {
  return {
    plan: row.plan as BillingPlan,
    subscriptionStatus: row.subscription_status as SubscriptionStatus,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
    trialEndsAt: row.trial_ends_at,
    deletedAt: row.deleted_at,
  }
}

export async function getWorkspaceBilling(
  client: DbClient,
  workspaceId: string
): Promise<WorkspaceBilling | null> {
  const { data, error } = await client
    .from('workspaces')
    .select(
      'plan, subscription_status, stripe_customer_id, stripe_subscription_id, current_period_end, trial_ends_at, deleted_at'
    )
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) {
    throw wrapSupabaseError('Failed to load workspace billing', error)
  }
  if (!data) {
    return null
  }
  return mapWorkspaceBillingRow(data)
}

export async function countOpenWorkItems(
  client: DbClient,
  workspaceId: string
): Promise<number> {
  const { count, error } = await client
    .from('work_items')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)
    .is('completed_at', null)

  if (error) {
    throw wrapSupabaseError('Failed to count open items', error)
  }
  return count ?? 0
}

export async function countNonArchivedSpaces(
  client: DbClient,
  workspaceId: string
): Promise<number> {
  const { count, error } = await client
    .from('spaces')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .is('archived_at', null)

  if (error) {
    throw wrapSupabaseError('Failed to count spaces', error)
  }
  return count ?? 0
}
