'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CalendarEvent, Task } from '@/lib/types'

type DashboardHomeResponse = {
  tasks: Task[]
  events: CalendarEvent[]
  fromWorkspace: boolean
  calendarConnected: boolean
  calendarLastSyncedAt: string | null
  suggestionNote: string
}

export function useDashboardData() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [suggestionNote, setSuggestionNote] = useState('')
  const [tasksFromApi, setTasksFromApi] = useState(false)
  const [eventsFromApi, setEventsFromApi] = useState(false)
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/home')
      if (!res.ok) {
        setTasks([])
        setEvents([])
        setTasksFromApi(false)
        setEventsFromApi(false)
        setLoading(false)
        return
      }
      const data = (await res.json()) as DashboardHomeResponse
      setTasks(data.tasks)
      setEvents(data.events)
      setTasksFromApi(data.fromWorkspace)
      setEventsFromApi(data.fromWorkspace)
      setCalendarConnected(data.calendarConnected)
      setSuggestionNote(data.suggestionNote ?? '')
    } catch {
      setTasks([])
      setEvents([])
      setTasksFromApi(false)
      setEventsFromApi(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [refresh])

  return {
    tasks,
    events,
    suggestionNote,
    tasksFromApi,
    eventsFromApi,
    calendarConnected,
    loading,
    refresh,
  }
}
