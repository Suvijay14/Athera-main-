import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { User } from '@supabase/supabase-js'

import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse
  user: User | null
}> {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { response: supabaseResponse, user }
}
