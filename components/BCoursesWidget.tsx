'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import type { CanvasConnectionStatus, CanvasCourseWithAssignments } from '@/lib/types'

function formatDueDate(iso?: string): string {
  if (!iso) return 'No due date'
  const due = new Date(iso)
  const now = new Date()
  const sameYear = due.getFullYear() === now.getFullYear()
  return due.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
  })
}

function isOverdue(iso?: string, submitted?: boolean): boolean {
  if (!iso || submitted) return false
  return new Date(iso).getTime() < Date.now()
}

function assignmentStatusLabel(dueAt?: string, submitted?: boolean, graded?: boolean): string {
  if (graded) return 'Graded'
  if (submitted) return 'Submitted'
  if (isOverdue(dueAt, submitted)) return 'Overdue'
  return 'Due'
}

export default function BCoursesWidget() {
  const [status, setStatus] = useState<CanvasConnectionStatus | null>(null)
  const [courses, setCourses] = useState<CanvasCourseWithAssignments[]>([])
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const statusRes = await fetch('/api/auth/canvas/status')
      const statusData = (await statusRes.json()) as CanvasConnectionStatus
      setStatus(statusData)

      if (!statusData.connected) {
        setCourses([])
        setError('')
        return
      }

      const res = await fetch('/api/canvas/assignments')
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setCourses([])
        setError(data.error === 'invalid_token' ? 'expired' : 'fetch_failed')
        return
      }

      const data = (await res.json()) as { courses: CanvasCourseWithAssignments[] }
      setCourses(data.courses ?? [])
      setError('')
    } catch {
      setError('fetch_failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  const assignmentCount = courses.reduce((sum, c) => sum + c.assignments.length, 0)
  const pendingCount = courses.reduce(
    (sum, c) => sum + c.assignments.filter((a) => !a.submitted).length,
    0
  )

  function toggleCourse(courseId: number) {
    setExpanded((prev) => ({ ...prev, [courseId]: !prev[courseId] }))
  }

  return (
    <div className="card-vellum p-5 border-l-2 border-l-slate-stone h-full w-full min-h-0 min-w-0 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="label-caps text-slate-stone">bCourses</div>
        {status?.connected && (
          <span className="text-[9px] font-semibold text-sage bg-sage-light px-2 py-0.5 rounded-full uppercase">
            Connected
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-9 bg-surface-container rounded animate-pulse" />
            ))}
          </div>
        ) : !status?.connected ? (
          <div className="space-y-3">
            <p className="text-xs text-ink-muted leading-relaxed">
              Link your UC Berkeley bCourses account to see active courses here.
            </p>
            <Link href="/setup" className="btn-primary text-sm inline-block">
              Connect bCourses →
            </Link>
          </div>
        ) : error === 'expired' ? (
          <div className="space-y-3">
            <p className="text-xs text-red-700">
              Your bCourses token expired. Re-link to refresh your courses.
            </p>
            <Link href="/setup" className="btn-primary text-sm inline-block">
              Re-link bCourses →
            </Link>
          </div>
        ) : courses.length === 0 ? (
          <p className="text-xs text-ink-muted">No active courses found this semester.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((course) => {
              const open = expanded[course.id] ?? false
              const pending = course.assignments.filter((a) => !a.submitted).length

              return (
                <div key={course.id} className="rounded-lg bg-surface-container overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-light transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-ink-primary truncate">{course.name}</div>
                      <div className="text-[10px] text-ink-faint truncate">
                        {course.assignments.length} assignment
                        {course.assignments.length === 1 ? '' : 's'}
                        {pending > 0 ? ` · ${pending} pending` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-faint flex-shrink-0">
                      {open ? '▾' : '▸'}
                    </span>
                  </button>

                  {open && (
                    <div className="border-t border-border-delicate px-2 py-2 space-y-1">
                      {course.assignments.length === 0 ? (
                        <p className="text-[10px] text-ink-faint px-2 py-1">No assignments listed.</p>
                      ) : (
                        course.assignments.map((assignment) => {
                          const overdue = isOverdue(assignment.dueAt, assignment.submitted)
                          const statusLabel = assignmentStatusLabel(
                            assignment.dueAt,
                            assignment.submitted,
                            assignment.graded
                          )

                          return (
                            <a
                              key={assignment.id}
                              href={assignment.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-start justify-between gap-2 px-2 py-1.5 rounded hover:bg-white/60 transition-colors group"
                            >
                              <div className="min-w-0">
                                <div className="text-xs text-ink-primary truncate group-hover:text-slate-stone">
                                  {assignment.name}
                                </div>
                                <div
                                  className={clsx(
                                    'text-[10px] truncate',
                                    overdue ? 'text-red-600' : 'text-ink-faint'
                                  )}
                                >
                                  {formatDueDate(assignment.dueAt)}
                                </div>
                              </div>
                              <span
                                className={clsx(
                                  'text-[9px] font-medium px-1.5 py-0.5 rounded flex-shrink-0',
                                  assignment.graded && 'bg-sage-light text-sage',
                                  assignment.submitted &&
                                    !assignment.graded &&
                                    'bg-slate-light text-slate-stone',
                                  !assignment.submitted && overdue && 'bg-red-100 text-red-700',
                                  !assignment.submitted && !overdue && 'bg-ochre-light text-ochre'
                                )}
                              >
                                {statusLabel}
                              </span>
                            </a>
                          )
                        })
                      )}
                      <a
                        href={`${course.url}/assignments`}
                        target="_blank"
                        rel="noreferrer"
                        className="block text-[10px] text-terracotta px-2 pt-1 hover:underline"
                      >
                        Open all in bCourses ↗
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {status?.connected && (
        <p
          className={clsx(
            'text-[10px] mt-3 pt-3 border-t border-border-delicate flex-shrink-0',
            status.needsRelink ? 'text-ochre' : 'text-ink-faint'
          )}
        >
          {status.needsRelink
            ? `Re-link soon — token expires in ${status.daysRemaining} day${status.daysRemaining === 1 ? '' : 's'}`
            : `${courses.length} course${courses.length === 1 ? '' : 's'} · ${assignmentCount} assignment${assignmentCount === 1 ? '' : 's'} · ${pendingCount} pending`}
        </p>
      )}
    </div>
  )
}
