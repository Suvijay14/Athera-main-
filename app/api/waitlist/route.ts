import { NextResponse } from 'next/server'
import { z } from 'zod'

import { saveWaitlistSignup } from '@/lib/server/waitlist'

const bodySchema = z.object({
  email: z.string().trim().email(),
  source: z.string().trim().min(1).max(64),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid email or source' }, { status: 400 })
  }

  try {
    const { duplicate } = await saveWaitlistSignup(parsed.data.email, parsed.data.source)
    return NextResponse.json({ ok: true, duplicate })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Waitlist save failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
