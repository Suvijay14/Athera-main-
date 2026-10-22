'use client'

import { useRef } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { quietDraftEmailBody, quietEntitySuggestion } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import { DraftCard, SuggestionCard } from '@/src/components/athera-ui'

const CAPTIONS = [
  'Athera spots what is slipping',
  'Draft ready — nothing sends without you',
] as const

export default function FeatureQuietDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const suggestion = quietEntitySuggestion(persona)
  const draft = quietDraftEmailBody(persona)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })

  const playback = useFeatureDemoSteps({
    resetKey: `feature-quiet-${persona}`,
    stepCount: 2,
    stepDurationMs: 6000,
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'quiet',
  })

  const showDraft = playback.step >= 1

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-4 sm:p-5 min-h-[340px]"
        stepCount={2}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={CAPTIONS}
        analyticsLabel="Feature quiet demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <AnimatePresence mode="wait">
          {!showDraft ? (
            <motion.div key="suggest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <SuggestionCard
                message={suggestion}
                primaryLabel="Remind me to follow up"
              />
            </motion.div>
          ) : (
            <motion.div
              key="draft"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.32, ease: 'easeOut' }}
            >
              <DraftCard body={draft} />
            </motion.div>
          )}
        </AnimatePresence>
      </FeatureDemoShell>
    </div>
  )
}
