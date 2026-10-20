import { cookies } from 'next/headers'

import { PROFILE_COOKIE_NAME } from './constants'

export async function getProfileIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(PROFILE_COOKIE_NAME)?.value?.trim()
  return value || null
}
