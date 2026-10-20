'use client'

import { useEffect, useState } from 'react'
import { fetchTasks } from '@/lib/api'
import type { Task } from '@/lib/types'
import { useUiVersion } from '@/lib/hooks/useUiVersion'

interface GreetingHeaderProps {
  space: string
}

export default function GreetingHeader({ space }: GreetingHeaderProps) {
  const uiVersion = useUiVersion()
  const [openTaskCount, setOpenTaskCount] = useState<number | null>(null)

  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const mood = hour < 9 ? 'Quiet morning' : hour < 17 ? 'Active' : 'Calm evening'

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

  if (uiVersion === '2') {
    return (
      <div className="px-8 pt-8 pb-6 border-b border-border-serenity bg-surface-container-lowest/40">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-secondary-container text-primary text-label-sm font-jakarta uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                {mood}
              </span>
            </div>
            <h1 className="font-jakarta text-headline-xl-mobile md:text-headline-xl text-primary leading-tight mb-2">
              Good {timeOfDay}.{' '}
              {openTaskCount !== null && openTaskCount > 0 ? (
                <>
                  You have{' '}
                  <span className="text-primary-container">{openTaskCount} open tasks</span> in{' '}
                  {space}.
                </>
              ) : (
                <>
                  Your <span className="text-primary-container">{space}</span> workspace.
                </>
              )}
            </h1>
            <p className="text-body-md text-secondary max-w-2xl">
              Unified overview — tasks, calendar, and Athera notes stay wired to your existing voice
              and API tools.
            </p>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="flex items-center gap-2 text-body-sm text-secondary">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
              <span>{date}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 pt-8 pb-6 border-b border-border-delicate">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-sage-light text-sage text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full">
              ● {mood.toUpperCase()}
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
