import fs from 'node:fs'
import path from 'node:path'
import type {
  CanvasAssignment,
  CanvasConnectionStatus,
  CanvasCourse,
  CanvasCourseWithAssignments,
} from '@/lib/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const TOKEN_PATH = path.join(DATA_DIR, 'canvas-token.json')
const TOKEN_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000
const RELINK_WARNING_DAYS = 7

export interface CanvasTokenStore {
  access_token: string
  created_at: string
  expires_at: string
  user_id?: number
  name?: string
  login_id?: string
}

interface CanvasUserProfile {
  id: number
  name: string
  login_id: string
  primary_email?: string
}

interface CanvasCourseRaw {
  id: number
  name: string
  course_code: string
  enrollment_term_id?: number
  term?: { name?: string }
}

interface CanvasAssignmentRaw {
  id: number
  name: string
  due_at?: string | null
  html_url: string
  points_possible?: number
  submission?: {
    workflow_state?: string
    score?: number
    graded_at?: string | null
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function getCanvasBaseUrl(): string {
  return process.env.CANVAS_BASE_URL ?? 'https://bcourses.berkeley.edu'
}

export function readCanvasTokens(): CanvasTokenStore | null {
  if (!fs.existsSync(TOKEN_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')) as CanvasTokenStore
  } catch {
    return null
  }
}

export function writeCanvasTokens(tokens: CanvasTokenStore): void {
  ensureDataDir()
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8')
}

export function deleteCanvasTokens(): void {
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH)
}

function daysUntil(isoDate: string): number {
  const ms = new Date(isoDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)))
}

export function getCanvasStatus(): CanvasConnectionStatus {
  const tokens = readCanvasTokens()
  if (!tokens?.access_token) {
    return {
      connected: false,
      name: '',
      loginId: '',
      expiresAt: '',
      daysRemaining: 0,
      needsRelink: false,
    }
  }

  const daysRemaining = daysUntil(tokens.expires_at)
  const expired = daysRemaining === 0 && new Date(tokens.expires_at).getTime() <= Date.now()

  if (expired) {
    return {
      connected: false,
      name: tokens.name ?? '',
      loginId: tokens.login_id ?? '',
      expiresAt: tokens.expires_at,
      daysRemaining: 0,
      needsRelink: true,
    }
  }

  return {
    connected: true,
    name: tokens.name ?? '',
    loginId: tokens.login_id ?? '',
    expiresAt: tokens.expires_at,
    daysRemaining,
    needsRelink: daysRemaining <= RELINK_WARNING_DAYS,
  }
}

async function canvasFetch<T>(pathSuffix: string, token: string): Promise<T> {
  const base = getCanvasBaseUrl()
  const res = await fetch(`${base}${pathSuffix}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    if (res.status === 401) {
      throw new Error('invalid_token')
    }
    throw new Error(body || `Canvas API error (${res.status})`)
  }

  return res.json() as Promise<T>
}

function requireConnectedToken(): string {
  const tokens = readCanvasTokens()
  const status = getCanvasStatus()
  if (!tokens?.access_token || !status.connected) {
    throw new Error('not_connected')
  }
  return tokens.access_token
}

function mapAssignment(
  raw: CanvasAssignmentRaw,
  course: CanvasCourse,
  base: string
): CanvasAssignment {
  const workflow = raw.submission?.workflow_state ?? 'unsubmitted'
  const submitted = workflow === 'submitted' || workflow === 'graded' || workflow === 'pending_review'
  const graded = workflow === 'graded' || Boolean(raw.submission?.graded_at)

  return {
    id: raw.id,
    courseId: course.id,
    courseName: course.name,
    name: raw.name,
    dueAt: raw.due_at ?? undefined,
    submitted,
    graded,
    score: raw.submission?.score,
    pointsPossible: raw.points_possible,
    url: raw.html_url || `${base}/courses/${course.id}/assignments/${raw.id}`,
  }
}

export async function validateAndSaveToken(token: string): Promise<CanvasConnectionStatus> {
  const trimmed = token.trim()
  if (!trimmed) throw new Error('Token is required')

  const profile = await canvasFetch<CanvasUserProfile>(
    '/api/v1/users/self/profile',
    trimmed
  )

  const createdAt = new Date()
  const expiresAt = new Date(createdAt.getTime() + TOKEN_LIFETIME_MS)

  writeCanvasTokens({
    access_token: trimmed,
    created_at: createdAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    user_id: profile.id,
    name: profile.name,
    login_id: profile.login_id ?? profile.primary_email ?? '',
  })

  return getCanvasStatus()
}

export async function getCanvasCourses(): Promise<CanvasCourse[]> {
  const token = requireConnectedToken()
  const base = getCanvasBaseUrl()
  const raw = await canvasFetch<CanvasCourseRaw[]>(
    '/api/v1/courses?enrollment_state=active&per_page=100',
    token
  )

  return raw
    .filter((c) => c.name && c.id)
    .map((c) => ({
      id: c.id,
      name: c.name,
      courseCode: c.course_code || c.name,
      term: c.term?.name,
      url: `${base}/courses/${c.id}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getCanvasAssignmentsForCourse(
  course: CanvasCourse
): Promise<CanvasAssignment[]> {
  const token = requireConnectedToken()
  const base = getCanvasBaseUrl()

  try {
    const raw = await canvasFetch<CanvasAssignmentRaw[]>(
      `/api/v1/courses/${course.id}/assignments?include[]=submission&order_by=due_at&per_page=100`,
      token
    )
    return raw
      .filter((a) => a.name && a.id)
      .map((a) => mapAssignment(a, course, base))
  } catch {
    return []
  }
}

export async function getCanvasCoursesWithAssignments(): Promise<CanvasCourseWithAssignments[]> {
  const courses = await getCanvasCourses()
  const withAssignments = await Promise.all(
    courses.map(async (course) => ({
      ...course,
      assignments: await getCanvasAssignmentsForCourse(course),
    }))
  )

  return withAssignments.sort((a, b) => a.name.localeCompare(b.name))
}
