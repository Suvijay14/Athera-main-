import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

import type { WorkspaceBillingPatch } from './stripe-webhook-sync'

export async function updateWorkspaceBillingAdmin(
  workspaceId: string,
  patch: WorkspaceBillingPatch
): Promise<void> {
  const admin = createAdminClient()
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (patch.stripeCustomerId !== undefined) row.stripe_customer_id = patch.stripeCustomerId
  if (patch.stripeSubscriptionId !== undefined) row.stripe_subscription_id = patch.stripeSubscriptionId
  if (patch.plan !== undefined) row.plan = patch.plan
  if (patch.subscriptionStatus !== undefined) row.subscription_status = patch.subscriptionStatus
  if (patch.currentPeriodEnd !== undefined) row.current_period_end = patch.currentPeriodEnd
  if (patch.trialEndsAt !== undefined) row.trial_ends_at = patch.trialEndsAt

  const { error } = await admin.from('workspaces').update(row).eq('id', workspaceId)
  if (error) {
    throw new Error(`Failed to update workspace billing: ${error.message}`)
  }
}
