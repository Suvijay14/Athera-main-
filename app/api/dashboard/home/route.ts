import { NextResponse } from 'next/server'

import {
  workItemsToDashboardTasks,
  workItemsToUpcomingEvents,
} from '@/lib/dashboard/from-workspace-items'
import { listCalendarConnectionsForWorkspace } from '@/lib/db/calendar-connections'
import { listItems } from '@/lib/db/items'
import { getPendingSuggestion } from '@/lib/db/suggestions'
import { getWorkspaceForUser } from '@/lib/db/workspaces'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const client = await createClient()
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workspace = await getWorkspaceForUser(client, user.id)
  if (!workspace) {
    return NextResponse.json({ error: 'No workspace' }, { status: 404 })
  }

  const now = new Date()
  const [{ items }, pendingSuggestion, connections] = await Promise.all([
    listItems(client, workspace.id, { limit: 500 }),
    getPendingSuggestion(client, workspace.id),
    listCalendarConnectionsForWorkspace(client, workspace.id),
  ])

  const tasks = workItemsToDashboardTasks(items, now)
  const events = workItemsToUpcomingEvents(items, now, 3)

  return NextResponse.json({
    tasks,
    events,
    fromWorkspace: true,
    calendarConnected: connections.length > 0,
    calendarLastSyncedAt: connections[0]?.lastSyncedAt ?? null,
    suggestionNote: pendingSuggestion?.reason ?? '',
  })
}
