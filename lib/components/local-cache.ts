import type { ComponentId, ComponentLabState, DashboardWidgetRow, SidebarPinRow } from './types'
import { DEFAULT_DASHBOARD_WIDGET_IDS } from './registry-meta'

const CACHE_KEY = 'athera_component_lab_state_v1'

export function defaultDashboardWidgets(): DashboardWidgetRow[] {
  return DEFAULT_DASHBOARD_WIDGET_IDS.map((componentId, sortOrder) => ({
    componentId,
    sortOrder,
    config: {},
  }))
}

export function readLocalLabState(): ComponentLabState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ComponentLabState
  } catch {
    return null
  }
}

export function writeLocalLabState(state: ComponentLabState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

export function mergeLocalLabState(partial: Partial<ComponentLabState>): ComponentLabState {
  const prev = readLocalLabState()
  const next: ComponentLabState = {
    profileId: partial.profileId ?? prev?.profileId ?? null,
    approvedIds: partial.approvedIds ?? prev?.approvedIds ?? [],
    dashboardWidgets: partial.dashboardWidgets ?? prev?.dashboardWidgets ?? defaultDashboardWidgets(),
    sidebarPins: partial.sidebarPins ?? prev?.sidebarPins ?? [],
  }
  writeLocalLabState(next)
  return next
}

export function setLocalApproved(ids: ComponentId[]): void {
  mergeLocalLabState({ approvedIds: ids })
}

export function setLocalDashboard(widgets: DashboardWidgetRow[]): void {
  mergeLocalLabState({ dashboardWidgets: widgets })
}

export function setLocalSidebarPins(pins: SidebarPinRow[]): void {
  mergeLocalLabState({ sidebarPins: pins })
}
