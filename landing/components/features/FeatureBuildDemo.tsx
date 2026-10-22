'use client'

import { useMemo, useRef } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  comparisonEntityGroups,
  comparisonGroupByCopy,
  getPersonaDemo,
  ICON_BY_ITEM_TYPE,
} from '@/demo-data'
import {
  ATHERA_CALENDAR_SUGGESTION,
  comparisonHeader,
  comparisonTasksForPersona,
} from '@/lib/landing/comparison-demo'
import { LANDING_FEATURE_STEP_MS } from '@/lib/landing/constants'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import {
  CalendarWeek,
  CommandBar,
  ListView,
  SuggestionCard,
  ViewTabs,
} from '@/src/components/athera-ui'
import type { AtheraEntityGroup, AtheraListItem, CalendarWeekEvent } from '@/src/components/athera-ui'

const CAPTIONS = [
  'Your list, as you typed it',
  'Grouped by client with one tap',
  'Most of these have times — open a calendar?',
  'Calendar view for the week',
] as const

const TONES = [
  'border-l-sage bg-sage-light/35 border-l-[3px]',
  'border-l-terracotta/50 bg-terracotta-light/25 border-l-[3px]',
  'border-l-border-delicate bg-surface-container/80 border-l-[3px]',
]

export default function FeatureBuildDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })

  const playback = useFeatureDemoSteps({
    resetKey: `feature-build-${persona}`,
    stepCount: 4,
    stepDurationMs: LANDING_FEATURE_STEP_MS,
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'build',
  })

  const header = useMemo(() => comparisonHeader(persona), [persona])
  const groupCopy = useMemo(() => comparisonGroupByCopy(persona), [persona])
  const flatItems: AtheraListItem[] = useMemo(() => {
    const tasks = comparisonTasksForPersona(persona)
    return tasks.map((t) => {
      const item = getPersonaDemo(persona).items.find((i) => i.id === t.id)
      return {
        id: t.id,
        title: t.text,
        icon: item ? ICON_BY_ITEM_TYPE[item.type] : undefined,
      }
    })
  }, [persona])

  const groups: AtheraEntityGroup[] = useMemo(() => {
    const tasks = comparisonTasksForPersona(persona)
    const taskById = Object.fromEntries(tasks.map((t) => [t.id, t]))
    return comparisonEntityGroups(persona).map((g, gi) => ({
      entity: g.entity,
      count: g.items.length,
      items: g.items.map((item) => ({
        id: item.id,
        title: taskById[item.id]?.text ?? item.title,
        icon: ICON_BY_ITEM_TYPE[item.type],
        toneClass: TONES[gi % TONES.length],
      })),
    }))
  }, [persona])

  const calendarEvents: CalendarWeekEvent[] = useMemo(() => {
    const entities = groups.map((g) => g.entity)
    return comparisonTasksForPersona(persona)
      .filter((t) => t.hasDay)
      .map((t) => ({
        id: t.id,
        label: t.text.split(' · ').slice(-2).join(' · '),
        weekday: t.weekday,
        timeHint: t.timeLabel,
        toneClass: TONES[entities.indexOf(t.entity) % TONES.length],
      }))
  }, [persona, groups])

  const step = playback.step
  const showGroupSuggest = step === 0
  const showGrouped = step >= 1
  const showCalSuggest = step === 2
  const showCalendar = step >= 3

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-4 sm:p-5 min-h-[380px]"
        stepCount={4}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={CAPTIONS}
        analyticsLabel="Feature build demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <CommandBar className="mb-3" />
        <div className="flex items-center justify-between gap-2 mb-3">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-secondary truncate">
            {header}
          </p>
          <ViewTabs active={showCalendar ? 'calendar' : 'list'} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${persona}-${step >= 3 ? 'cal' : showGrouped ? 'grouped' : 'flat'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {showCalendar ? (
              <CalendarWeek events={calendarEvents} compact />
            ) : showGrouped ? (
              <ListView groups={groups} />
            ) : (
              <ListView items={flatItems} />
            )}
          </motion.div>
        </AnimatePresence>

        {showGroupSuggest ? (
          <div className="mt-3">
            <SuggestionCard
              message={groupCopy.suggestion}
              primaryLabel={groupCopy.buttonLabel}
            />
          </div>
        ) : null}
        {showCalSuggest ? (
          <div className="mt-3">
            <SuggestionCard message={ATHERA_CALENDAR_SUGGESTION} primaryLabel="Show calendar" />
          </div>
        ) : null}
      </FeatureDemoShell>
    </div>
  )
}
