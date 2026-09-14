import { NextRequest, NextResponse } from 'next/server'
import { validateAndSaveToken } from '@/lib/server/canvas'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { token?: string }
    const token = body.token?.trim()
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const status = await validateAndSaveToken(token)
    return NextResponse.json(status)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'connect_failed'
    const status = message === 'invalid_token' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
