'use client'

import { useMemo, useRef } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { entityNotesForPersona, entityProfileForPersona } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import { EntityPage, NotesPage } from '@/src/components/athera-ui'

const CAPTIONS = [
  'Client page with the people around them',
  'Notes where you already write',
  'Bracket tasks land on the timeline',
] as const

export default function FeaturePeopleDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const profile = entityProfileForPersona(persona)
  const notes = entityNotesForPersona(persona)
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })

  const playback = useFeatureDemoSteps({
    resetKey: `feature-people-${persona}`,
    stepCount: 3,
    stepDurationMs: 5200,
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'people',
  })

  const typedLen = useMemo(() => {
    if (playback.step === 0) return 0
    if (playback.step === 1) {
      const p = playback.stepProgress
      return Math.floor(notes.bracketInput.length * Math.min(1, p * 1.2))
    }
    return notes.bracketInput.length
  }, [playback.step, playback.stepProgress, notes.bracketInput.length])

  const timeline = useMemo(() => {
    const base = profile.timeline.slice(0, playback.step >= 0 ? 2 : 0)
    if (playback.step >= 2) {
      return [notes.taskEntry, ...base]
    }
    return base
  }, [playback.step, profile.timeline, notes.taskEntry])

  const pageLabel =
    persona === 'coach' ? 'Student page' : persona === 'founder' ? 'Contact page' : 'Client page'

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-4 sm:p-5 min-h-[400px]"
        stepCount={3}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={CAPTIONS}
        analyticsLabel="Feature people demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <EntityPage
          entityName={profile.entityName}
          avatarTone={profile.avatarTone}
          chips={profile.chips}
          timeline={timeline}
          pageLabel={pageLabel}
        />
        <AnimatePresence>
          {playback.step >= 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <NotesPage
                typedText={notes.bracketInput.slice(0, typedLen)}
                showCursor={playback.step === 1 && typedLen < notes.bracketInput.length}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </FeatureDemoShell>
    </div>
  )
}
