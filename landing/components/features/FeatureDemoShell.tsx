'use client'

import clsx from 'clsx'
import DemoStepControls from '@/components/landing/DemoStepControls'

export default function FeatureDemoShell({
  children,
  className,
  stepCount,
  step,
  progress,
  autoplay,
  playDisabled,
  captions,
  analyticsLabel,
  onStep,
  onPrev,
  onNext,
  onTogglePlay,
  onMouseEnter,
  onMouseLeave,
}: {
  children: React.ReactNode
  className?: string
  stepCount: number
  step: number
  progress: number
  autoplay: boolean
  playDisabled?: boolean
  captions: readonly string[]
  analyticsLabel: string
  onStep: (step: number) => void
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-[560px] mx-auto lg:mx-0 lg:max-w-none">
      <div
        className={clsx('demo-frame w-full overflow-hidden relative', className)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {children}
      </div>
      <DemoStepControls
        stepCount={stepCount}
        step={step}
        progress={progress}
        autoplay={autoplay}
        playDisabled={playDisabled}
        captions={captions}
        ariaLabel={analyticsLabel}
        onStep={onStep}
        onPrev={onPrev}
        onNext={onNext}
        onTogglePlay={onTogglePlay}
      />
    </div>
  )
}
