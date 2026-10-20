import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

import { PROFILE_COOKIE_MAX_AGE, PROFILE_COOKIE_NAME, PROFILE_STORAGE_KEY } from '@/lib/profile/constants'

export async function GET() {
  const cookieStore = await cookies()
  let profileId = cookieStore.get(PROFILE_COOKIE_NAME)?.value?.trim()

  if (!profileId) {
    profileId = randomUUID()
  }

  cookieStore.set(PROFILE_COOKIE_NAME, profileId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: PROFILE_COOKIE_MAX_AGE,
  })

  return NextResponse.json({
    profileId,
    storageKey: PROFILE_STORAGE_KEY,
  })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  let profileId = cookieStore.get(PROFILE_COOKIE_NAME)?.value?.trim()

  if (!profileId) {
    try {
      const body = (await request.json()) as { profileId?: string }
      if (body.profileId && /^[0-9a-f-]{36}$/i.test(body.profileId)) {
        profileId = body.profileId
      }
    } catch {
      /* use new uuid */
    }
    if (!profileId) profileId = randomUUID()
    cookieStore.set(PROFILE_COOKIE_NAME, profileId, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: PROFILE_COOKIE_MAX_AGE,
    })
  }

  return NextResponse.json({ profileId, storageKey: PROFILE_STORAGE_KEY })
}
