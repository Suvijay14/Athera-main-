import { NextResponse } from 'next/server'

import { isComponentId } from '@/lib/components/registry-meta'
import { saveDashboardWidgets, seedDashboardIfEmpty } from '@/lib/components/server-store'
import type { DashboardWidgetRow } from '@/lib/components/types'
import { getProfileIdFromCookies } from '@/lib/profile/server'

function parseWidgets(body: unknown): DashboardWidgetRow[] | null {
  if (!body || typeof body !== 'object') return null
  const widgets = (body as { widgets?: unknown }).widgets
  if (!Array.isArray(widgets)) return null
  const out: DashboardWidgetRow[] = []
  for (let i = 0; i < widgets.length; i++) {
    const w = widgets[i] as Record<string, unknown>
    const componentId = w.componentId
    if (typeof componentId !== 'string' || !isComponentId(componentId)) return null
    out.push({
      componentId,
      sortOrder: typeof w.sortOrder === 'number' ? w.sortOrder : i,
      config: typeof w.config === 'object' && w.config !== null ? (w.config as Record<string, unknown>) : {},
    })
  }
  return out
}

export async function GET() {
  const profileId = await getProfileIdFromCookies()
  if (!profileId) {
    return NextResponse.json({ error: 'Profile not bootstrapped' }, { status: 401 })
  }
  const widgets = await seedDashboardIfEmpty(profileId)
  return NextResponse.json({ widgets })
}

export async function PUT(request: Request) {
  const profileId = await getProfileIdFromCookies()
  if (!profileId) {
    return NextResponse.json({ error: 'Profile not bootstrapped' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const widgets = parseWidgets(body)
  if (!widgets) {
    return NextResponse.json({ error: 'Invalid widgets array' }, { status: 400 })
  }

  const result = await saveDashboardWidgets(profileId, widgets)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Save failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, widgets })
}
