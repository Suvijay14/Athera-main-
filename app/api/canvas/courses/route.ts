import { NextResponse } from 'next/server'
import { getCanvasCourses, getCanvasStatus } from '@/lib/server/canvas'

export async function GET() {
  const status = getCanvasStatus()
  if (!status.connected) {
    return NextResponse.json({ error: 'not_connected', courses: [] }, { status: 401 })
  }

  try {
    const courses = await getCanvasCourses()
    return NextResponse.json({ courses })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch_failed'
    const code = message === 'not_connected' || message === 'invalid_token' ? 401 : 500
    return NextResponse.json({ error: message, courses: [] }, { status: code })
  }
}
