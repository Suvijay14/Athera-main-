import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/server/gmail'

export async function GET(req: NextRequest) {
  try {
    const url = getAuthUrl()
    return NextResponse.redirect(url)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gmail OAuth not configured'
    return NextResponse.redirect(
      new URL(`/setup?gmail=error&message=${encodeURIComponent(message)}`, req.nextUrl.origin)
    )
  }
}
