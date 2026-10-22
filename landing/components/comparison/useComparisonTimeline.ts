'use client'

import { useEffect, useRef } from 'react'

export function useComparisonTimeline(
  key: string,
  durationMs: number,
  enabled: boolean,
  paused: boolean,
  onTick: (elapsed: number) => void,
  onComplete: () => void
) {
  const startRef = useRef(0)
  const pauseStartedRef = useRef(0)
  const pausedRef = useRef(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (paused) {
      if (!pausedRef.current) pauseStartedRef.current = Date.now()
      pausedRef.current = true
    } else {
      if (pausedRef.current && pauseStartedRef.current) {
        startRef.current += Date.now() - pauseStartedRef.current
        pauseStartedRef.current = 0
      }
      pausedRef.current = false
    }
  }, [paused])

  useEffect(() => {
    if (!enabled) {
      onTick(0)
      return
    }
    startRef.current = Date.now()
    pauseStartedRef.current = 0
    pausedRef.current = false
    completedRef.current = false
    onTick(0)

    const id = window.setInterval(() => {
      if (pausedRef.current) return
      const elapsed = Date.now() - startRef.current
      onTick(elapsed)
      if (!completedRef.current && elapsed >= durationMs) {
        completedRef.current = true
        onComplete()
      }
    }, 40)

    return () => window.clearInterval(id)
  }, [key, durationMs, enabled, onComplete, onTick])
}
