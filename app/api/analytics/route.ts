import { NextResponse } from 'next/server'
import { z } from 'zod'

const bodySchema = z.object({
  event: z.string().trim().min(1).max(64),
  ts: z.string().optional(),
}).passthrough()

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (process.env.NODE_ENV === 'development') {
    console.info('[landing-analytics]', parsed.data)
  }

  return new NextResponse(null, { status: 204 })
}
