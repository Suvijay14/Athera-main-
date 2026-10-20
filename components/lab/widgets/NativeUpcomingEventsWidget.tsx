'use client'

import UpcomingEventsCard from '@/components/dashboard/UpcomingEventsCard'
import { useDashboardData } from '@/lib/hooks/useDashboardData'

export default function NativeUpcomingEventsWidget() {
  const { events, eventsFromApi, calendarConnected } = useDashboardData()

  return (
    <UpcomingEventsCard
      events={events}
      fromApi={eventsFromApi}
      calendarConnected={calendarConnected}
    />
  )
}
