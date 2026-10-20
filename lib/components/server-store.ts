import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/env'
import { catalogRowsForSync, getComponentMeta, isComponentId } from './registry-meta'
import { withTimeout } from './supabase-timeout'
import type { ComponentId, DashboardWidgetRow, SidebarPinRow } from './types'
import { defaultDashboardWidgets } from './local-cache'

const SUPABASE_OP_MS = 3_500

async function getSupabase() {
  if (!isSupabaseConfigured()) return null
  try {
    return await createClient()
  } catch {
    return null
  }
}

export async function syncCatalogToSupabase(): Promise<void> {
  const supabase = await getSupabase()
  if (!supabase) return
  const rows = catalogRowsForSync()
  await withTimeout(
    (async () => {
      const { error } = await supabase.from('component_catalog').upsert(rows, { onConflict: 'id' })
      if (error) console.warn('[component-lab] syncCatalogToSupabase:', error.message)
    })(),
    SUPABASE_OP_MS,
    () => {
      console.warn('[component-lab] syncCatalogToSupabase: timed out')
    }
  )
}

export async function fetchApprovals(profileId: string): Promise<ComponentId[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profile_component_approvals')
    .select('component_id')
    .eq('profile_id', profileId)
  if (error) {
    console.error('[component-lab] fetchApprovals', error.message)
    return []
  }
  return (data ?? [])
    .map((r) => r.component_id as string)
    .filter(isComponentId)
}

export async function setApproval(profileId: string, componentId: ComponentId, approved: boolean) {
  const supabase = await getSupabase()
  if (!supabase) return { ok: true as const }

  await syncCatalogToSupabase()

  if (approved) {
    const { error } = await supabase.from('profile_component_approvals').upsert(
      {
        profile_id: profileId,
        component_id: componentId,
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,component_id' }
    )
    if (error) return { ok: false as const, error: error.message }

    const meta = getComponentMeta(componentId)
    if (meta?.surfaces.includes('page')) {
      const pins = await fetchSidebarPins(profileId)
      if (!pins.some((p) => p.componentId === componentId)) {
        await supabase.from('profile_sidebar_pins').upsert(
          {
            profile_id: profileId,
            component_id: componentId,
            sort_order: pins.length,
          },
          { onConflict: 'profile_id,component_id' }
        )
      }
    }
    return { ok: true as const }
  }

  await supabase
    .from('profile_component_approvals')
    .delete()
    .eq('profile_id', profileId)
    .eq('component_id', componentId)
  await supabase
    .from('profile_sidebar_pins')
    .delete()
    .eq('profile_id', profileId)
    .eq('component_id', componentId)
  await supabase
    .from('profile_dashboard_widgets')
    .delete()
    .eq('profile_id', profileId)
    .eq('component_id', componentId)

  return { ok: true as const }
}

export async function fetchDashboardWidgets(profileId: string): Promise<DashboardWidgetRow[]> {
  const supabase = await getSupabase()
  if (!supabase) return defaultDashboardWidgets()
  const { data, error } = await supabase
    .from('profile_dashboard_widgets')
    .select('component_id, sort_order, config')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[component-lab] fetchDashboardWidgets', error.message)
    return defaultDashboardWidgets()
  }
  if (!data?.length) return []

  return data
    .map((row) => ({
      componentId: row.component_id as string,
      sortOrder: row.sort_order as number,
      config: (row.config as Record<string, unknown>) ?? {},
    }))
    .filter((r): r is DashboardWidgetRow => isComponentId(r.componentId))
}

export async function saveDashboardWidgets(
  profileId: string,
  widgets: DashboardWidgetRow[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabase()
  if (!supabase) return { ok: true }

  await syncCatalogToSupabase()

  await supabase.from('profile_dashboard_widgets').delete().eq('profile_id', profileId)

  if (widgets.length === 0) return { ok: true }

  const rows = widgets.map((w) => ({
    profile_id: profileId,
    component_id: w.componentId,
    sort_order: w.sortOrder,
    config: w.config,
  }))

  const { error } = await supabase.from('profile_dashboard_widgets').insert(rows)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function fetchSidebarPins(profileId: string): Promise<SidebarPinRow[]> {
  const supabase = await getSupabase()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profile_sidebar_pins')
    .select('component_id, sort_order')
    .eq('profile_id', profileId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('[component-lab] fetchSidebarPins', error.message)
    return []
  }

  return (data ?? [])
    .map((row) => ({
      componentId: row.component_id as string,
      sortOrder: row.sort_order as number,
    }))
    .filter((r): r is SidebarPinRow => isComponentId(r.componentId))
}

export async function saveSidebarPins(
  profileId: string,
  pins: SidebarPinRow[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await getSupabase()
  if (!supabase) return { ok: true }

  await supabase.from('profile_sidebar_pins').delete().eq('profile_id', profileId)
  if (pins.length === 0) return { ok: true }

  const rows = pins.map((p) => ({
    profile_id: profileId,
    component_id: p.componentId,
    sort_order: p.sortOrder,
  }))
  const { error } = await supabase.from('profile_sidebar_pins').insert(rows)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function seedDashboardIfEmpty(profileId: string): Promise<DashboardWidgetRow[]> {
  const existing = await fetchDashboardWidgets(profileId)
  if (existing.length > 0) return existing

  const seeded = defaultDashboardWidgets()
  await saveDashboardWidgets(profileId, seeded)
  return seeded
}
