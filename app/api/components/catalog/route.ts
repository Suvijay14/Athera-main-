import { NextResponse } from 'next/server'

import { COMPONENT_REGISTRY } from '@/lib/components/registry-meta'
import {
  fetchApprovals,
  fetchSidebarPins,
  seedDashboardIfEmpty,
  syncCatalogToSupabase,
} from '@/lib/components/server-store'
import { withTimeout } from '@/lib/components/supabase-timeout'
import type { DashboardWidgetRow, SidebarPinRow } from '@/lib/components/types'
import { defaultDashboardWidgets } from '@/lib/components/local-cache'
import { getProfileIdFromCookies } from '@/lib/profile/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'

const PROFILE_SYNC_MS = 4_000

export async function GET() {
  const profileId = await getProfileIdFromCookies()
  const supabaseConfigured = isSupabaseConfigured()

  let approvedIds: string[] = []
  let dashboardWidgets: DashboardWidgetRow[] = defaultDashboardWidgets()
  let sidebarPins: SidebarPinRow[] = []
  let syncWarning: string | null = null

  if (supabaseConfigured && profileId) {
    const syncResult = await withTimeout(
      (async () => {
        await syncCatalogToSupabase()
        approvedIds = await fetchApprovals(profileId)
        dashboardWidgets = await seedDashboardIfEmpty(profileId)
        sidebarPins = await fetchSidebarPins(profileId)
        return true
      })(),
      PROFILE_SYNC_MS,
      () => false
    )
    if (!syncResult) {
      syncWarning =
        'Supabase sync timed out (check network or run supabase/sql/component_lab.sql). Using local layout.'
    }
  }

  return NextResponse.json({
    profileId,
    supabaseConfigured,
    syncWarning,
    components: COMPONENT_REGISTRY,
    approvedIds,
    dashboardWidgets,
    sidebarPins,
  })
}
