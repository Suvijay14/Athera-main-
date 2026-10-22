'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { trackLandingEvent } from '@/lib/landing/analytics'

export function useFeatureDemoSteps({
  resetKey,
  stepCount,
  stepDurationMs,
  inView,
  reducedMotion,
  analyticsPrefix,
}: {
  resetKey: string
  stepCount: number
  stepDurationMs: number
  inView: boolean
  reducedMotion: boolean
  analyticsPrefix?: string
}) {
  const [step, setStep] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [hoverPaused, setHoverPaused] = useState(false)
  const anchorRef = useRef({ wall: Date.now(), progress: 0 })

  const syncAnchor = useCallback((progress: number) => {
    anchorRef.current = { wall: Date.now(), progress }
  }, [])

  useEffect(() => {
    setStep(0)
    setStepProgress(0)
    setAutoplay(!reducedMotion)
    syncAnchor(0)
  }, [resetKey, reducedMotion, syncAnchor])

  useEffect(() => {
    if (reducedMotion) setAutoplay(false)
  }, [reducedMotion])

  useEffect(() => {
    if (!inView || reducedMotion) return
    if (hoverPaused || !autoplay) return

    const id = window.setInterval(() => {
      const { wall, progress: base } = anchorRef.current
      let next = base + (Date.now() - wall) / stepDurationMs
      if (next >= 1) {
        next = 0
        anchorRef.current = { wall: Date.now(), progress: 0 }
        setStepProgress(0)
        setStep((s) => (s + 1 >= stepCount ? 0 : s + 1))
        return
      }
      anchorRef.current = { wall: Date.now(), progress: next }
      setStepProgress(next)
    }, 40)

    return () => window.clearInterval(id)
  }, [autoplay, hoverPaused, inView, reducedMotion, stepCount, stepDurationMs])

  const goToStep = useCallback(
    (next: number, track = true) => {
      const clamped = Math.max(0, Math.min(stepCount - 1, next))
      if (track && analyticsPrefix) {
        trackLandingEvent('demo_step_clicked', {
          step: String(clamped + 1),
          feature: analyticsPrefix,
        })
      }
      setAutoplay(false)
      setStep(clamped)
      setStepProgress(1)
      syncAnchor(1)
    },
    [analyticsPrefix, stepCount, syncAnchor]
  )

  const onPrev = useCallback(() => goToStep(step - 1), [goToStep, step])
  const onNext = useCallback(() => goToStep(step + 1), [goToStep, step])

  const onTogglePlay = useCallback(() => {
    if (reducedMotion) return
    if (autoplay) {
      setAutoplay(false)
      syncAnchor(stepProgress)
      return
    }
    trackLandingEvent('demo_autoplay_resumed', {
      feature: analyticsPrefix ?? 'feature',
    })
    syncAnchor(stepProgress)
    setAutoplay(true)
  }, [analyticsPrefix, autoplay, reducedMotion, stepProgress, syncAnchor])

  const onCardEnter = useCallback(() => {
    if (autoplay && !reducedMotion) {
      syncAnchor(stepProgress)
      setHoverPaused(true)
    }
  }, [autoplay, reducedMotion, stepProgress, syncAnchor])

  const onCardLeave = useCallback(() => {
    setHoverPaused(false)
    syncAnchor(stepProgress)
  }, [stepProgress, syncAnchor])

  return {
    step,
    stepProgress: autoplay && !hoverPaused ? stepProgress : stepProgress >= 1 ? 1 : stepProgress,
    autoplay: autoplay && !reducedMotion,
    playDisabled: !!reducedMotion,
    goToStep,
    onPrev,
    onNext,
    onTogglePlay,
    onCardEnter,
    onCardLeave,
  }
}
