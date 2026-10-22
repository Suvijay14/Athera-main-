'use client'

import { useRef } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import {
  SCROLL_REPEAT_STORY_STEPS,
  ScrollRepeatStoryMock,
} from '@/components/landing/ScrollStoryHowItWorks'
import { scaleLandingDemoMs } from '@/lib/landing/constants'

const CAPTIONS = SCROLL_REPEAT_STORY_STEPS.map((s) => s.short)

export default function FeatureRepeatDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })

  const playback = useFeatureDemoSteps({
    resetKey: `feature-repeat-${persona}`,
    stepCount: 3,
    stepDurationMs: scaleLandingDemoMs(6500),
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'repeat',
  })

  const storyStep = Math.min(2, playback.step) as 0 | 1 | 2

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-0 min-h-0 border-0 shadow-none bg-transparent"
        stepCount={3}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={CAPTIONS}
        analyticsLabel="Feature repeat demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <ScrollRepeatStoryMock step={storyStep} />
      </FeatureDemoShell>
    </div>
  )
}
