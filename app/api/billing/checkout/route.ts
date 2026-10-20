import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { appBaseUrl, getStripe, priceIdForPlan } from '@/lib/billing/stripe-server'
import { getWorkspaceBilling } from '@/lib/billing/workspace-billing'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

const bodySchema = z.object({
  plan: z.enum(['personal', 'business']),
})

export async function POST(req: NextRequest) {
  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  try {
    const { workspace, user } = await getCurrentWorkspace()
    const client = await createClient()
    const billing = await getWorkspaceBilling(client, workspace.id)
    if (billing?.deletedAt) {
      return NextResponse.json({ error: 'account_pending_deletion' }, { status: 403 })
    }

    const stripe = getStripe()
    let customerId = billing?.stripeCustomerId ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { workspace_id: workspace.id, user_id: user.id },
      })
      customerId = customer.id
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      await admin
        .from('workspaces')
        .update({ stripe_customer_id: customerId })
        .eq('id', workspace.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceIdForPlan(parsed.plan), quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { workspace_id: workspace.id, plan: parsed.plan },
      },
      metadata: { workspace_id: workspace.id, plan: parsed.plan },
      success_url: `${appBaseUrl()}/workspace/settings?checkout=success`,
      cancel_url: `${appBaseUrl()}/workspace/settings?checkout=canceled`,
    })

    if (!session.url) {
      return NextResponse.json({ error: 'no_checkout_url' }, { status: 500 })
    }
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'checkout_failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
