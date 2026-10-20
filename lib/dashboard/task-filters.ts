import type { Task } from '@/lib/types'

function isTodayLabel(dueDate?: string): boolean {
  if (!dueDate) return false
  const lower = dueDate.toLowerCase()
  if (lower.includes('today')) return true
  const now = new Date()
  const today = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return dueDate.includes(today) || dueDate.includes(String(now.getDate()))
}

export function filterUrgentTasks(tasks: Task[]): Task[] {
  return tasks.filter(
    (t) => !t.completed && (t.urgency === 'high' || (t.dueDate && isTodayLabel(t.dueDate)))
  )
}

export function filterTodayTasks(tasks: Task[]): Task[] {
  const urgentIds = new Set(filterUrgentTasks(tasks).map((t) => t.id))
  const rest = tasks.filter((t) => !t.completed && !urgentIds.has(t.id))
  const todayish = rest.filter((t) => isTodayLabel(t.dueDate) || t.urgency === 'medium')
  if (todayish.length > 0) return todayish.slice(0, 8)
  return rest.slice(0, 5)
}

export function openTaskCount(tasks: Task[]): number {
  return tasks.filter((t) => !t.completed).length
}
