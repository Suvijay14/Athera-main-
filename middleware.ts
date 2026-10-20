import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import {
  isAuthEntryPath,
  isAuthExemptApiPath,
  isPublicPath,
} from '@/lib/auth/public-paths'
import { resolvePostAuthPath } from '@/lib/auth/post-auth-path'
import { workspaceNeedsOnboarding } from '@/lib/auth/middleware-onboarding'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  if (isAuthExemptApiPath(pathname)) {
    return supabaseResponse
  }

  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  if (user && isAuthEntryPath(pathname)) {
    const { data: ws } = await supabase
      .from('workspaces')
      .select('onboarding_answers')
      .eq('owner_id', user.id)
      .maybeSingle()
    const answers =
      ws?.onboarding_answers && typeof ws.onboarding_answers === 'object'
        ? (ws.onboarding_answers as Record<string, unknown>)
        : {}
    const dest = request.nextUrl.clone()
    dest.pathname = resolvePostAuthPath(answers)
    dest.search = ''
    return NextResponse.redirect(dest)
  }

  if (isPublicPath(pathname)) {
    if (!user) {
      return supabaseResponse
    }
    if (pathname === '/') {
      const needsOnboarding = await workspaceNeedsOnboarding(supabase, user.id)
      if (needsOnboarding) {
        const onboardingUrl = request.nextUrl.clone()
        onboardingUrl.pathname = '/onboarding'
        onboardingUrl.search = ''
        return NextResponse.redirect(onboardingUrl)
      }
    }
    return supabaseResponse
  }

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const needsOnboarding = await workspaceNeedsOnboarding(supabase, user.id)
  if (needsOnboarding && !pathname.startsWith('/onboarding')) {
    const onboardingUrl = request.nextUrl.clone()
    onboardingUrl.pathname = '/onboarding'
    onboardingUrl.search = ''
    return NextResponse.redirect(onboardingUrl)
  }

  if (!needsOnboarding && pathname.startsWith('/onboarding')) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
