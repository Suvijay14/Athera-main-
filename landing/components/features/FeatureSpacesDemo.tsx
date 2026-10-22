'use client'

import { useRef } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { buildHeroStoryDemo, heroStoryFlagsFromElapsed } from '@/lib/landing/hero-demo'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import { HeroStoryShell } from '@/components/landing/HeroProductDemo'
import { LANDING_FEATURE_COPY } from '@/demo-data'

const CAPTION_PREFIX = [
  'One mixed list',
  'Athera groups what belongs together',
  'Split into spaces',
] as const

const STEP_ELAPSED = [1999, 5499, 9999, 17999] as const

export default function FeatureSpacesDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const pack = buildHeroStoryDemo(persona)
  const rootRef = useRef<HTMLDivElement>(null)
  const splitRef = useRef<HTMLButtonElement>(null)
  const calendarShowRef = useRef<HTMLButtonElement>(null)
  const calendarTabRef = useRef<HTMLSpanElement>(null)
  const personalSpaceRef = useRef<HTMLButtonElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })

  const playback = useFeatureDemoSteps({
    resetKey: `feature-spaces-${persona}`,
    stepCount: 4,
    stepDurationMs: 5500,
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'spaces',
  })

  const elapsed = STEP_ELAPSED[Math.min(3, playback.step)] ?? STEP_ELAPSED[3]
  const flags = heroStoryFlagsFromElapsed(elapsed, pack)
  const captions = [
    ...CAPTION_PREFIX,
    LANDING_FEATURE_COPY[persona].spacesDemoCaption,
  ] as const

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-3 sm:p-4 h-[440px] overflow-hidden"
        stepCount={4}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={captions}
        analyticsLabel="Feature spaces demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <HeroStoryShell
          pack={pack}
          flags={flags}
          splitRef={splitRef}
          calendarShowRef={calendarShowRef}
          calendarTabRef={calendarTabRef}
          personalSpaceRef={personalSpaceRef}
          instantMotion={!!reducedMotion}
        />
      </FeatureDemoShell>
    </div>
  )
}
