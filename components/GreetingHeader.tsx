'use client'

import { useEffect, useState } from 'react'
import { fetchTasks } from '@/lib/api'
import type { Task } from '@/lib/types'

interface GreetingHeaderProps {
  space: string
}

export default function GreetingHeader({ space }: GreetingHeaderProps) {
  const [openTaskCount, setOpenTaskCount] = useState<number | null>(null)

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const mood = hour < 9 ? 'QUIET MORNING' : hour < 17 ? 'ACTIVE' : 'CALM EVENING'

  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  useEffect(() => {
    fetchTasks()
      .then((data) =>
        setOpenTaskCount(data.tasks.filter((t: Task) => !t.completed).length)
      )
      .catch(() => setOpenTaskCount(0))
  }, [])

  return (
    <div className="px-8 pt-8 pb-6 border-b border-border-delicate">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-sage-light text-sage text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full">
              ● {mood}
            </span>
          </div>

          <h1 className="font-newsreader text-4xl text-ink-primary leading-tight mb-2">
            Good {timeOfDay}.{' '}
            {openTaskCount !== null && openTaskCount > 0 ? (
              <>
                You have{' '}
                <em className="not-italic text-terracotta">{openTaskCount} open tasks</em> in{' '}
                {space}.
              </>
            ) : (
              <>
                Your <em className="not-italic text-terracotta">{space}</em> workspace.
              </>
            )}
          </h1>
        </div>

        <div className="text-right ml-8 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <span>📅</span>
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
