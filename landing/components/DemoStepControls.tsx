'use client'

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import clsx from 'clsx'

export type DemoStepControlsProps = {
  stepCount: number
  step: number
  progress: number
  autoplay: boolean
  playDisabled?: boolean
  captions: readonly string[]
  ariaLabel?: string
  onStep: (step: number) => void
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
}

export default function DemoStepControls({
  stepCount,
  step,
  progress,
  autoplay,
  playDisabled,
  captions,
  ariaLabel = 'Demo playback',
  onStep,
  onPrev,
  onNext,
  onTogglePlay,
}: DemoStepControlsProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      onPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      onNext()
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault()
      onTogglePlay()
    }
  }

  const iconBtn =
    'inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:text-ink-secondary transition-colors'

  const steps = Array.from({ length: stepCount }, (_, i) => i)

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button type="button" className={iconBtn} aria-label="Previous step" onClick={onPrev}>
        <ChevronLeft className="w-4 h-4" strokeWidth={2} aria-hidden />
      </button>

      <div className="flex items-center gap-1.5" role="tablist" aria-label="Demo steps">
        {steps.map((i) => {
          const active = step === i
          const caption = captions[i] ?? `Step ${i + 1}`
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Step ${i + 1}: ${caption}`}
              title={caption}
              onClick={() => onStep(i)}
              className="flex h-8 min-w-[2rem] items-center justify-center px-0.5 rounded-md hover:bg-surface-container/80 transition-colors"
            >
              {active ? (
                <span
                  className="relative h-2 w-6 rounded-full bg-border-delicate overflow-hidden"
                  aria-hidden
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-terracotta rounded-full transition-[width] duration-75 ease-linear"
                    style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
                  />
                </span>
              ) : (
                <span className="h-2 w-2 rounded-full bg-border-delicate" aria-hidden />
              )}
            </button>
          )
        })}
      </div>

      <button type="button" className={iconBtn} aria-label="Next step" onClick={onNext}>
        <ChevronRight className="w-4 h-4" strokeWidth={2} aria-hidden />
      </button>

      <button
        type="button"
        className={clsx(iconBtn, playDisabled && 'opacity-40 pointer-events-none')}
        aria-label={autoplay ? 'Pause autoplay' : 'Resume autoplay'}
        aria-pressed={autoplay}
        disabled={playDisabled}
        onClick={onTogglePlay}
      >
        {autoplay ? (
          <Pause className="w-4 h-4" strokeWidth={2} aria-hidden />
        ) : (
          <Play className="w-4 h-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  )
}
