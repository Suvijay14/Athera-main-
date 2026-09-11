import { NextRequest, NextResponse } from 'next/server'
import { saveTokensFromCode } from '@/lib/server/gmail'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/setup?gmail=error&message=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/setup?gmail=error&message=missing_code', req.url)
    )
  }

  try {
    await saveTokensFromCode(code)
    return NextResponse.redirect(new URL('/setup?gmail=connected', req.url))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'token_exchange_failed'
    return NextResponse.redirect(
      new URL(`/setup?gmail=error&message=${encodeURIComponent(message)}`, req.url)
    )
  }
}
