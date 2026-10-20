'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  defaultDashboardWidgets,
  mergeLocalLabState,
  readLocalLabState,
} from '@/lib/components/local-cache'
import { COMPONENT_REGISTRY, getComponentMeta, isLiveComponent } from '@/lib/components/registry-meta'
import type { ComponentDefinitionMeta, ComponentId, DashboardWidgetRow, SidebarPinRow } from '@/lib/components/types'
import { PROFILE_STORAGE_KEY } from '@/lib/profile/constants'

type CatalogResponse = {
  profileId: string | null
  supabaseConfigured: boolean
  syncWarning?: string | null
  components: ComponentDefinitionMeta[]
  approvedIds: ComponentId[]
  dashboardWidgets: DashboardWidgetRow[]
  sidebarPins: SidebarPinRow[]
}

type ComponentLabContextValue = {
  loading: boolean
  error: string | null
  syncWarning: string | null
  catalog: ComponentDefinitionMeta[]
  approvedIds: ComponentId[]
  dashboardWidgets: DashboardWidgetRow[]
  sidebarPins: SidebarPinRow[]
  profileId: string | null
  supabaseConfigured: boolean
  refresh: () => Promise<void>
  approve: (componentId: ComponentId) => Promise<void>
  unapprove: (componentId: ComponentId) => Promise<void>
  isApproved: (id: ComponentId) => boolean
  saveDashboardLayout: (widgets: DashboardWidgetRow[]) => Promise<void>
  addDashboardWidget: (componentId: ComponentId) => Promise<void>
  removeDashboardWidget: (componentId: ComponentId) => Promise<void>
}

const ComponentLabContext = createContext<ComponentLabContextValue | null>(null)

async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  timeoutMs = 8_000
): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, credentials: 'same-origin' })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error ?? `HTTP ${res.status}`)
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export function ComponentLabProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [catalog, setCatalog] = useState<ComponentDefinitionMeta[]>(COMPONENT_REGISTRY)
  const [approvedIds, setApprovedIds] = useState<ComponentId[]>([])
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidgetRow[]>(defaultDashboardWidgets())
  const [sidebarPins, setSidebarPins] = useState<SidebarPinRow[]>([])
  const [profileId, setProfileId] = useState<string | null>(null)
  const [supabaseConfigured, setSupabaseConfigured] = useState(false)
  const inflight = useRef<Promise<void> | null>(null)

  const hydrateFromLocal = useCallback(() => {
    const local = readLocalLabState()
    if (!local) return
    setApprovedIds(local.approvedIds)
    setDashboardWidgets(local.dashboardWidgets)
    setSidebarPins(local.sidebarPins)
    setProfileId(local.profileId)
  }, [])

  const applyCatalogResponse = useCallback((data: CatalogResponse, bootProfileId?: string) => {
    setProfileId(data.profileId ?? bootProfileId ?? null)
    setSupabaseConfigured(data.supabaseConfigured)
    setSyncWarning(data.syncWarning ?? null)
    setCatalog(data.components?.length ? data.components : COMPONENT_REGISTRY)
    const local = readLocalLabState()
    setApprovedIds(data.approvedIds?.length ? data.approvedIds : (local?.approvedIds ?? []))
    setDashboardWidgets(
      data.dashboardWidgets?.length
        ? data.dashboardWidgets
        : (local?.dashboardWidgets ?? defaultDashboardWidgets())
    )
    setSidebarPins(data.sidebarPins?.length ? data.sidebarPins : (local?.sidebarPins ?? []))
    mergeLocalLabState({
      profileId: data.profileId ?? bootProfileId ?? null,
      approvedIds: data.approvedIds?.length ? data.approvedIds : (local?.approvedIds ?? []),
      dashboardWidgets: data.dashboardWidgets?.length
        ? data.dashboardWidgets
        : (local?.dashboardWidgets ?? defaultDashboardWidgets()),
      sidebarPins: data.sidebarPins?.length ? data.sidebarPins : (local?.sidebarPins ?? []),
    })
  }, [])

  const refresh = useCallback(async () => {
    if (inflight.current) {
      await inflight.current
      return
    }

    const run = async () => {
      setLoading(true)
      setError(null)
      hydrateFromLocal()

      try {
        const config = await fetchJson<{ supabaseConfigured: boolean }>(
          '/api/components/config',
          undefined,
          3_000
        ).catch(() => ({ supabaseConfigured: false }))
        setSupabaseConfigured(config.supabaseConfigured)

        let storedId: string | null = null
        try {
          storedId = localStorage.getItem(PROFILE_STORAGE_KEY)
        } catch {
          storedId = null
        }

        const [bootResult, catalogResult] = await Promise.allSettled([
          fetchJson<{ profileId?: string }>(
            '/api/profile/bootstrap',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(storedId ? { profileId: storedId } : {}),
            },
            5_000
          ),
          fetchJson<CatalogResponse>('/api/components/catalog', undefined, 6_000),
        ])

        let bootProfileId: string | undefined
        if (bootResult.status === 'fulfilled' && bootResult.value.profileId) {
          bootProfileId = bootResult.value.profileId
          setProfileId(bootProfileId)
          try {
            localStorage.setItem(PROFILE_STORAGE_KEY, bootProfileId)
          } catch {
            /* ignore */
          }
        }

        if (catalogResult.status === 'fulfilled') {
          applyCatalogResponse(catalogResult.value, bootProfileId)
          setError(null)
        } else {
          setSyncWarning(
            catalogResult.reason instanceof Error &&
              catalogResult.reason.name === 'AbortError'
              ? 'Catalog sync timed out — using offline catalog and saved approvals.'
              : 'Could not sync with server — using offline catalog.'
          )
          setCatalog(COMPONENT_REGISTRY)
          hydrateFromLocal()
        }
      } catch (e) {
        setCatalog(COMPONENT_REGISTRY)
        hydrateFromLocal()
        setError(e instanceof Error ? e.message : 'Failed to load component lab')
      } finally {
        setLoading(false)
      }
    }

    inflight.current = run().finally(() => {
      inflight.current = null
    })
    await inflight.current
  }, [applyCatalogResponse, hydrateFromLocal])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const approve = useCallback(async (componentId: ComponentId) => {
    if (!isLiveComponent(componentId)) {
      throw new Error('This component is not live yet — port it first (see port wave on the card).')
    }

    try {
      await fetchJson(
        '/api/components/approve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId }),
        },
        5_000
      )
    } catch {
      /* local-only fallback */
    }

    setApprovedIds((prev) => {
      const next = Array.from(new Set([...prev, componentId]))
      mergeLocalLabState({ approvedIds: next })
      return next
    })

    const meta = getComponentMeta(componentId)
    if (meta?.surfaces.includes('page')) {
      setSidebarPins((prev) => {
        if (prev.some((p) => p.componentId === componentId)) return prev
        const nextPins = [...prev, { componentId, sortOrder: prev.length }]
        mergeLocalLabState({ sidebarPins: nextPins })
        void fetchJson('/api/components/sidebar-pins', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pins: nextPins }),
        }).catch(() => {})
        return nextPins
      })
    }
  }, [])

  const unapprove = useCallback(async (componentId: ComponentId) => {
    try {
      await fetchJson(
        '/api/components/unapprove',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ componentId }),
        },
        5_000
      )
    } catch {
      /* local fallback */
    }

    setApprovedIds((prev) => {
      const next = prev.filter((id) => id !== componentId)
      mergeLocalLabState({ approvedIds: next })
      return next
    })
    setDashboardWidgets((prev) => {
      const next = prev.filter((w) => w.componentId !== componentId)
      mergeLocalLabState({ dashboardWidgets: next })
      return next
    })
    setSidebarPins((prev) => {
      const next = prev.filter((p) => p.componentId !== componentId)
      mergeLocalLabState({ sidebarPins: next })
      return next
    })
  }, [])

  const saveDashboardLayout = useCallback(async (widgets: DashboardWidgetRow[]) => {
    setDashboardWidgets(widgets)
    mergeLocalLabState({ dashboardWidgets: widgets })
    try {
      await fetchJson(
        '/api/components/dashboard-layout',
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgets }),
        },
        5_000
      )
    } catch {
      /* saved locally */
    }
  }, [])

  const addDashboardWidget = useCallback(
    async (componentId: ComponentId) => {
      if (!isLiveComponent(componentId)) return
      if (dashboardWidgets.some((w) => w.componentId === componentId)) return
      const widgets: DashboardWidgetRow[] = [
        ...dashboardWidgets,
        { componentId, sortOrder: dashboardWidgets.length, config: {} },
      ]
      setDashboardWidgets(widgets)
      mergeLocalLabState({ dashboardWidgets: widgets })
      await saveDashboardLayout(widgets)
    },
    [dashboardWidgets, saveDashboardLayout]
  )

  const removeDashboardWidget = useCallback(
    async (componentId: ComponentId) => {
      const widgets = dashboardWidgets
        .filter((w) => w.componentId !== componentId)
        .map((w, i) => ({ ...w, sortOrder: i }))
      setDashboardWidgets(widgets)
      mergeLocalLabState({ dashboardWidgets: widgets })
      await saveDashboardLayout(widgets)
    },
    [dashboardWidgets, saveDashboardLayout]
  )

  const isApproved = useCallback(
    (id: ComponentId) => approvedIds.includes(id),
    [approvedIds]
  )

  const value = useMemo(
    () => ({
      loading,
      error,
      syncWarning,
      catalog,
      approvedIds,
      dashboardWidgets,
      sidebarPins,
      profileId,
      supabaseConfigured,
      refresh,
      approve,
      unapprove,
      isApproved,
      saveDashboardLayout,
      addDashboardWidget,
      removeDashboardWidget,
    }),
    [
      loading,
      error,
      syncWarning,
      catalog,
      approvedIds,
      dashboardWidgets,
      sidebarPins,
      profileId,
      supabaseConfigured,
      refresh,
      approve,
      unapprove,
      isApproved,
      saveDashboardLayout,
      addDashboardWidget,
      removeDashboardWidget,
    ]
  )

  return <ComponentLabContext.Provider value={value}>{children}</ComponentLabContext.Provider>
}

export function useComponentLab(): ComponentLabContextValue {
  const ctx = useContext(ComponentLabContext)
  if (!ctx) {
    throw new Error('useComponentLab must be used within ComponentLabProvider')
  }
  return ctx
}
