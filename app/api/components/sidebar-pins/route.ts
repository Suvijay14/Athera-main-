import { NextResponse } from 'next/server'

import { isComponentId } from '@/lib/components/registry-meta'
import { fetchSidebarPins, saveSidebarPins } from '@/lib/components/server-store'
import type { SidebarPinRow } from '@/lib/components/types'
import { getProfileIdFromCookies } from '@/lib/profile/server'

function parsePins(body: unknown): SidebarPinRow[] | null {
  if (!body || typeof body !== 'object') return null
  const pins = (body as { pins?: unknown }).pins
  if (!Array.isArray(pins)) return null
  const out: SidebarPinRow[] = []
  for (let i = 0; i < pins.length; i++) {
    const p = pins[i] as Record<string, unknown>
    const componentId = p.componentId
    if (typeof componentId !== 'string' || !isComponentId(componentId)) return null
    out.push({
      componentId,
      sortOrder: typeof p.sortOrder === 'number' ? p.sortOrder : i,
    })
  }
  return out
}

export async function GET() {
  const profileId = await getProfileIdFromCookies()
  if (!profileId) {
    return NextResponse.json({ error: 'Profile not bootstrapped' }, { status: 401 })
  }
  const pins = await fetchSidebarPins(profileId)
  return NextResponse.json({ pins })
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

  const pins = parsePins(body)
  if (!pins) {
    return NextResponse.json({ error: 'Invalid pins array' }, { status: 400 })
  }

  const result = await saveSidebarPins(profileId, pins)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Save failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, pins })
}
