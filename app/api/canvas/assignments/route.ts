import { NextResponse } from 'next/server'
import { getCanvasCoursesWithAssignments, getCanvasStatus } from '@/lib/server/canvas'

export async function GET() {
  const status = getCanvasStatus()
  if (!status.connected) {
    return NextResponse.json({ error: 'not_connected', courses: [] }, { status: 401 })
  }

  try {
    const courses = await getCanvasCoursesWithAssignments()
    const assignmentCount = courses.reduce((sum, c) => sum + c.assignments.length, 0)
    return NextResponse.json({ courses, assignmentCount })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'fetch_failed'
    const code = message === 'not_connected' || message === 'invalid_token' ? 401 : 500
    return NextResponse.json({ error: message, courses: [] }, { status: code })
  }
}
