import { NextResponse } from 'next/server'

import { appBaseUrl, getStripe } from '@/lib/billing/stripe-server'
import { getWorkspaceBilling } from '@/lib/billing/workspace-billing'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export async function POST() {
  try {
    const { workspace } = await getCurrentWorkspace()
    const client = await createClient()
    const billing = await getWorkspaceBilling(client, workspace.id)
    if (!billing?.stripeCustomerId) {
      return NextResponse.json({ error: 'no_customer' }, { status: 400 })
    }

    const session = await stripePortalSession(billing.stripeCustomerId)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'portal_failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function stripePortalSession(customerId: string) {
  const stripe = getStripe()
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appBaseUrl()}/workspace/settings`,
  })
}
