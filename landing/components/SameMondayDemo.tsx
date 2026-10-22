'use client'

import { useCallback, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import {
  comparisonCaption,
  COMPARISON_TABS,
  COMPARISON_TAB_DURATION_MS,
  type ComparisonTabId,
} from '@/lib/landing/comparison-demo'
import TodoAppTab from '@/components/landing/comparison/TodoAppTab'
import ChatAgentsTab from '@/components/landing/comparison/ChatAgentsTab'
import AtheraComparisonTab from '@/components/landing/comparison/AtheraComparisonTab'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { BellRing, LayoutTemplate, Users } from 'lucide-react'

const TAB_ORDER: ComparisonTabId[] = ['todo', 'chat', 'athera']

function BenefitLabels({ labels, placement }: { labels: string[]; placement: 'side' | 'below' }) {
  if (!labels.length) return null
  if (placement === 'below') {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-3 pointer-events-none">
        {labels.map((label) => (
          <span
            key={label}
            className="text-xs font-semibold text-sage bg-sage-light/80 border border-sage/25 rounded-full px-2.5 py-1"
          >
            {label}
          </span>
        ))}
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 w-[148px] pointer-events-none">
      <AnimatePresence initial={false}>
        {labels.map((label) => (
          <motion.span
            key={label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xs font-semibold text-sage bg-sage-light/80 border border-sage/25 rounded-full px-2.5 py-1 whitespace-nowrap"
          >
            {label}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  )
}

const DEMO_BENEFITS = [
  { label: 'Remembers every client', icon: Users },
  { label: 'Notices without being asked', icon: BellRing },
  { label: 'Changes your workspace, not just the chat', icon: LayoutTemplate },
] as const

export default function SameMondayDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const [tab, setTab] = useState<ComparisonTabId>('todo')
  const [autoAdvance, setAutoAdvance] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [atheraLabels, setAtheraLabels] = useState<string[]>([])

  const [todoRun, setTodoRun] = useState(0)
  const [atheraRun, setAtheraRun] = useState(0)

  const pickTab = (id: ComparisonTabId) => {
    setAutoAdvance(false)
    setTab(id)
    if (id === 'todo') setTodoRun((n) => n + 1)
    if (id === 'athera') setAtheraRun((n) => n + 1)
    if (id !== 'athera') setAtheraLabels([])
  }

  const advanceTab = useCallback(() => {
    if (!autoAdvance) return
    setTab((current) => {
      const i = TAB_ORDER.indexOf(current)
      const next = TAB_ORDER[(i + 1) % TAB_ORDER.length]
      if (next === 'todo') setTodoRun((n) => n + 1)
      if (next === 'athera') setAtheraRun((n) => n + 1)
      if (next !== 'athera') setAtheraLabels([])
      return next
    })
  }, [autoAdvance])

  const paused = hovered
  const onLabelsChange = useCallback((labels: string[]) => {
    setAtheraLabels(labels)
  }, [])

  const caption = comparisonCaption(tab, persona)

  return (
    <div className="max-w-3xl mx-auto overflow-visible">
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {COMPARISON_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pickTab(t.id)}
            className={clsx(
              'space-pill text-sm',
              tab === t.id
                ? t.id === 'athera'
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'bg-sage text-white shadow-sm'
                : 'space-pill-inactive bg-surface-paper border border-border-delicate text-ink-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="relative overflow-visible min-[900px]:pr-[168px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative demo-frame p-4 sm:p-5 min-h-[360px] overflow-hidden min-[900px]:static">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
            >
              {tab === 'todo' ? (
                <TodoAppTab
                  key={`todo-${todoRun}`}
                  paused={paused}
                  reducedMotion={!!reducedMotion}
                  onComplete={advanceTab}
                />
              ) : null}
              {tab === 'chat' ? (
                <ChatAgentsTab
                  paused={paused}
                  reducedMotion={!!reducedMotion}
                  onComplete={advanceTab}
                />
              ) : null}
              {tab === 'athera' ? (
                <AtheraComparisonTab
                  key={`athera-${atheraRun}`}
                  runKey={`athera-${atheraRun}`}
                  paused={paused}
                  reducedMotion={!!reducedMotion}
                  onComplete={advanceTab}
                  onLabelsChange={onLabelsChange}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        {tab === 'athera' ? (
          <div
            className="hidden min-[900px]:flex absolute right-0 top-12 translate-x-[calc(100%+12px)] pointer-events-none"
            data-persona-conflict-zone
          >
            <BenefitLabels labels={atheraLabels} placement="side" />
          </div>
        ) : null}
      </div>

      {tab === 'athera' ? (
        <div className="min-[900px]:hidden" data-persona-conflict-zone>
          <BenefitLabels labels={atheraLabels} placement="below" />
        </div>
      ) : null}

      <div
        className="relative min-h-[4rem] mt-5 flex items-center justify-center pointer-events-none"
        data-persona-conflict-zone
      >
        <AnimatePresence mode="wait">
          <motion.p
            key={`${tab}-${persona}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28 }}
            className="text-[18px] text-center text-ink-primary font-medium absolute inset-x-0 leading-snug px-4"
          >
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-3 text-xs sm:text-sm text-ink-secondary pointer-events-none">
        {DEMO_BENEFITS.map((item, i) => {
          const Icon = item.icon
          return (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              {i > 0 ? (
                <span className="hidden sm:inline text-ink-faint" aria-hidden>
                  ·
                </span>
              ) : null}
              <Icon className="w-3.5 h-3.5 text-sage shrink-0" aria-hidden />
              {item.label}
            </span>
          )
        })}
      </div>

      <p className="sr-only">
        Tab durations: todo {COMPARISON_TAB_DURATION_MS.todo / 1000}s, chat{' '}
        {COMPARISON_TAB_DURATION_MS.chat / 1000}s, Athera {COMPARISON_TAB_DURATION_MS.athera / 1000}s
      </p>
    </div>
  )
}
