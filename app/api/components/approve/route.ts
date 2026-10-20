import { NextResponse } from 'next/server'

import { isComponentId, isLiveComponent } from '@/lib/components/registry-meta'
import { setApproval } from '@/lib/components/server-store'
import { getProfileIdFromCookies } from '@/lib/profile/server'

export async function POST(request: Request) {
  const profileId = await getProfileIdFromCookies()
  if (!profileId) {
    return NextResponse.json({ error: 'Profile not bootstrapped. Call /api/profile/bootstrap first.' }, { status: 401 })
  }

  let componentId: string | undefined
  try {
    const body = (await request.json()) as { componentId?: string }
    componentId = body.componentId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!componentId || !isComponentId(componentId)) {
    return NextResponse.json({ error: 'Unknown componentId' }, { status: 400 })
  }

  if (!isLiveComponent(componentId)) {
    return NextResponse.json({ error: 'Component is not live yet' }, { status: 400 })
  }

  const result = await setApproval(profileId, componentId, true)
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Approve failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, componentId })
}
