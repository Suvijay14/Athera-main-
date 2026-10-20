export type ComponentSurface = 'lab' | 'dashboard' | 'page'

export type ComponentCategory =
  | 'native'
  | 'ui'
  | 'tasks'
  | 'notes'
  | 'documents'
  | 'ai'
  | 'tools'
  | 'general'

export type ComponentImplementation = 'live' | 'planned'

export interface ComponentLayoutDefaults {
  colSpan?: 1 | 2 | 3
  minHeight?: number
}

export interface ComponentDefinitionMeta {
  id: string
  title: string
  description: string
  category: ComponentCategory
  surfaces: ComponentSurface[]
  implementation: ComponentImplementation
  portWave?: string
  pagePath?: string
  sidebarIcon?: string
  requiresSupabase?: boolean
  requiresGroq?: boolean
  ctcOriginPath?: string
  defaultLayout?: ComponentLayoutDefaults
}

/** Registry entry id — validated via isComponentId(). */
export type ComponentId = string

export interface DashboardWidgetRow {
  componentId: ComponentId
  sortOrder: number
  config: Record<string, unknown>
}

export interface SidebarPinRow {
  componentId: ComponentId
  sortOrder: number
}

export interface ComponentLabState {
  profileId: string | null
  approvedIds: ComponentId[]
  dashboardWidgets: DashboardWidgetRow[]
  sidebarPins: SidebarPinRow[]
}
