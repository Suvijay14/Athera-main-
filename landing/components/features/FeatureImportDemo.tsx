'use client'

import { useMemo, useRef } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import {
  comparisonEntityGroups,
  getPersonaDemo,
  ICON_BY_ITEM_TYPE,
  spaceItemCounts,
  todoMessyRows,
} from '@/demo-data'
import { comparisonTasksForPersona } from '@/lib/landing/comparison-demo'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { useFeatureDemoSteps } from '@/lib/landing/useFeatureDemoSteps'
import FeatureDemoShell from '@/components/landing/features/FeatureDemoShell'
import { ListView, Sidebar } from '@/src/components/athera-ui'
import type { AtheraEntityGroup } from '@/src/components/athera-ui'

const CAPTIONS = [
  'Paste your messy week',
  'Athera organizes into clients and spaces',
  'Optional: pull in Google Calendar next',
] as const

const TONES = [
  'border-l-sage bg-sage-light/35 border-l-[3px]',
  'border-l-terracotta/50 bg-terracotta-light/25 border-l-[3px]',
  'border-l-border-delicate bg-surface-container/80 border-l-[3px]',
]

export default function FeatureImportDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })
  const data = getPersonaDemo(persona)
  const [primarySpace, secondarySpace] = data.spaceNames
  const counts = spaceItemCounts(persona)

  const playback = useFeatureDemoSteps({
    resetKey: `feature-import-${persona}`,
    stepCount: 3,
    stepDurationMs: 5500,
    inView,
    reducedMotion: !!reducedMotion,
    analyticsPrefix: 'import',
  })

  const messyBlob = useMemo(
    () => todoMessyRows(persona).map((r) => r.text).join('\n'),
    [persona]
  )

  const typed = useMemo(() => {
    if (playback.step > 0) return messyBlob
    return messyBlob.slice(0, Math.floor(messyBlob.length * Math.min(1, playback.stepProgress * 1.1)))
  }, [messyBlob, playback.step, playback.stepProgress])

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

  const showOrganized = playback.step >= 1

  return (
    <div ref={rootRef}>
      <FeatureDemoShell
        className="p-4 sm:p-5 min-h-[380px]"
        stepCount={3}
        step={playback.step}
        progress={playback.stepProgress}
        autoplay={playback.autoplay}
        playDisabled={playback.playDisabled}
        captions={CAPTIONS}
        analyticsLabel="Feature import demo"
        onStep={playback.goToStep}
        onPrev={playback.onPrev}
        onNext={playback.onNext}
        onTogglePlay={playback.onTogglePlay}
        onMouseEnter={playback.onCardEnter}
        onMouseLeave={playback.onCardLeave}
      >
        <AnimatePresence mode="wait">
          {!showOrganized ? (
            <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                Paste your week
              </label>
              <textarea
                readOnly
                value={typed}
                className="mt-2 w-full h-40 rounded-lg border border-border-delicate bg-surface-paper p-3 text-sm text-ink-primary font-mono leading-relaxed resize-none pointer-events-none"
              />
            </motion.div>
          ) : (
            <motion.div
              key="organized"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 min-h-[260px]"
            >
              <Sidebar
                showMark={false}
                spaces={[
                  {
                    id: 'primary',
                    label: `${primarySpace} · ${counts.find((c) => c.name === primarySpace)?.count ?? 0}`,
                    active: true,
                  },
                  {
                    id: 'secondary',
                    label: `${secondarySpace} · ${counts.find((c) => c.name === secondarySpace)?.count ?? 0}`,
                  },
                ]}
              />
              <div className="flex-1 min-w-0">
                <ListView groups={groups} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {playback.step >= 2 ? (
          <button
            type="button"
            tabIndex={-1}
            className="mt-4 w-full sm:w-auto rounded-md border border-border-delicate bg-surface-paper px-4 py-2 text-sm font-semibold text-ink-secondary"
          >
            Import Google Calendar
          </button>
        ) : null}
      </FeatureDemoShell>
    </div>
  )
}
