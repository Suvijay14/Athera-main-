import { Suspense } from 'react'

import { AccountSettings } from '@/components/workspace/account-settings'
import { GoogleCalendarConnection } from '@/components/workspace/google-calendar-connection'
import { getWorkspaceBilling } from '@/lib/billing/workspace-billing'
import {
  getCalendarConnectionForSpace,
  toCalendarConnectionSummary,
} from '@/lib/db/calendar-connections'
import { getDefaultSpaceId } from '@/lib/db/spaces'
import { createClient } from '@/lib/supabase/server'
import { getCurrentWorkspace } from '@/lib/supabase/get-current-workspace'

export default async function WorkspaceAccountSettingsPage() {
  const { workspace } = await getCurrentWorkspace()
  const client = await createClient()
  const [billing, defaultSpaceId] = await Promise.all([
    getWorkspaceBilling(client, workspace.id),
    getDefaultSpaceId(client, workspace.id),
  ])
  const calendarRow = await getCalendarConnectionForSpace(client, workspace.id, defaultSpaceId)
  const calendarConnection = calendarRow ? toCalendarConnectionSummary(calendarRow) : null

  return (
    <Suspense fallback={null}>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <section>
          <h2 className="text-lg font-medium text-neutral-900">Google Calendar</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Imports events into your default space. You can also connect from any space page.
          </p>
          <div className="mt-3">
            <GoogleCalendarConnection spaceId={defaultSpaceId} connection={calendarConnection} />
          </div>
        </section>
        <AccountSettings
          plan={billing?.plan ?? 'free'}
          subscriptionStatus={billing?.subscriptionStatus ?? 'active'}
          hasStripeCustomer={Boolean(billing?.stripeCustomerId)}
        />
      </div>
    </Suspense>
  )
}
