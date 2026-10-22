'use client'

import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import clsx from 'clsx'
import { trackLandingEvent } from '@/lib/landing/analytics'
import { scaleLandingDemoSec } from '@/lib/landing/constants'
import { heroStoryPack, WEEKDAY_LABELS, type HeroStoryItem, type PersonaKey } from '@/demo-data'
import {
  ATHERA_CALENDAR_SUGGESTION,
  buildHeroStoryDemo,
  heroStepHoldElapsed,
  heroStepStart,
  heroStoryDurationMs,
  heroStoryFlagsFromElapsed,
  heroStoryProgressInStep,
  HERO_STORY_MS,
  HERO_STORY_STEPS,
  type HeroStoryPack,
  type HeroStoryStep,
} from '@/lib/landing/hero-demo'
import { heroCalendarEventLabel } from '@/lib/landing/calendar-demo'
import DemoReshapeGridFlash from '@/components/landing/DemoReshapeGridFlash'
import DemoItemIcon from '@/components/landing/DemoItemIcon'
import { SuggestionCard } from '@/src/components/athera-ui'
import AtheraMark from '@/components/brand/AtheraMark'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'

const ROW = 'flex items-center gap-2 h-10 px-3.5 min-w-0 text-[15px] leading-none'

function heroItemTitle(
  item: HeroStoryItem,
  showClean: boolean,
  underPrimarySpaceHeader: boolean,
  primarySpaceLabel: string
) {
  const raw = showClean ? item.cleanTitle : item.messyTitle
  const prefix = `${primarySpaceLabel} · `
  if (showClean && underPrimarySpaceHeader && raw.startsWith(prefix)) {
    return raw.slice(prefix.length)
  }
  return raw
}

const TIME_LABELS = ['10am', '12pm', '2pm', '4pm', '6pm'] as const
const GRID_START_MIN = 10 * 60
const GRID_END_MIN = 18 * 60

const STUDENT_STYLE: Record<string, { border: string; bg: string; dot: string }> = {
  'Maya Chen': { border: 'border-l-sage', bg: 'bg-sage-light/40', dot: 'text-sage' },
  'Leo Park': { border: 'border-l-terracotta/80', bg: 'bg-terracotta-light/35', dot: 'text-terracotta' },
  Admin: { border: 'border-l-[#8a9bb5]', bg: 'bg-[#eef1f6]', dot: 'text-[#6b7c9e]' },
  'Rivera Bakery': { border: 'border-l-sage', bg: 'bg-sage-light/40', dot: 'text-sage' },
  'Lumen Health': { border: 'border-l-terracotta/80', bg: 'bg-terracotta-light/35', dot: 'text-terracotta' },
  'Sarah Lee (Seed Fund)': { border: 'border-l-sage', bg: 'bg-sage-light/40', dot: 'text-sage' },
  Hiring: { border: 'border-l-terracotta/80', bg: 'bg-terracotta-light/35', dot: 'text-terracotta' },
  Company: { border: 'border-l-[#8a9bb5]', bg: 'bg-[#eef1f6]', dot: 'text-[#6b7c9e]' },
  Ops: { border: 'border-l-[#8a9bb5]', bg: 'bg-[#eef1f6]', dot: 'text-[#6b7c9e]' },
  Emma: { border: 'border-l-sage', bg: 'bg-sage-light/40', dot: 'text-sage' },
  Jake: { border: 'border-l-terracotta/80', bg: 'bg-terracotta-light/35', dot: 'text-terracotta' },
  Activities: { border: 'border-l-[#8a9bb5]', bg: 'bg-[#eef1f6]', dot: 'text-[#6b7c9e]' },
  Personal: { border: 'border-l-border-delicate', bg: 'bg-surface-container/80', dot: 'text-ink-muted' },
  Home: { border: 'border-l-border-delicate', bg: 'bg-surface-container/80', dot: 'text-ink-muted' },
}

function studentStyle(group: string) {
  return STUDENT_STYLE[group] ?? STUDENT_STYLE.Personal
}

function parseHeroTimeMinutes(cleanTitle: string): number {
  const withMinutes = cleanTitle.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (withMinutes) {
    let h = parseInt(withMinutes[1], 10)
    const min = parseInt(withMinutes[2], 10)
    const ap = withMinutes[3]?.toLowerCase()
    if (!ap && h >= 1 && h <= 7) h += 12
    else if (ap === 'pm' && h !== 12) h += 12
    else if (ap === 'am' && h === 12) h = 0
    return h * 60 + min
  }
  const simple = cleanTitle.match(/(\d{1,2})\s*(am|pm)/i)
  if (simple) {
    let h = parseInt(simple[1], 10)
    if (simple[2].toLowerCase() === 'pm' && h !== 12) h += 12
    if (simple[2].toLowerCase() === 'am' && h === 12) h = 0
    return h * 60
  }
  return 12 * 60
}

function timeToTopPercent(minutes: number): number {
  const clamped = Math.min(GRID_END_MIN, Math.max(GRID_START_MIN, minutes))
  return ((clamped - GRID_START_MIN) / (GRID_END_MIN - GRID_START_MIN)) * 100
}

function CrossfadeMain({
  viewKey,
  calendarEnter,
  instant,
  children,
}: {
  viewKey: string
  calendarEnter?: boolean
  instant?: boolean
  children: React.ReactNode
}) {
  const enterMs = instant ? 0 : calendarEnter ? scaleLandingDemoSec(0.25) : scaleLandingDemoSec(0.2)
  const exitMs = instant ? 0 : scaleLandingDemoSec(0.2)
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={viewKey}
        className="h-full min-h-0 flex flex-col"
        initial={{ opacity: instant ? 1 : 0, y: instant ? 0 : calendarEnter ? 6 : 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: instant ? 1 : 0, transition: { duration: exitMs } }}
        transition={{
          opacity: { duration: enterMs },
          y: { duration: enterMs, ease: 'easeOut' },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function ViewTabs({
  mode,
  showCalendarTab,
  calendarTabRef,
}: {
  mode: 'list' | 'calendar'
  showCalendarTab: boolean
  calendarTabRef: React.Ref<HTMLSpanElement>
}) {
  const tabs = showCalendarTab ? (['list', 'calendar'] as const) : (['list'] as const)
  return (
    <LayoutGroup id="hero-view-tabs">
      <div className="relative flex rounded-full border border-border-delicate p-0.5 shrink-0">
      {tabs.map((tab) => {
        const active = mode === tab
        return (
          <span
            key={tab}
            ref={tab === 'calendar' ? calendarTabRef : undefined}
            className={clsx(
              'relative z-10 px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-colors duration-200',
              active ? 'text-white' : 'text-ink-muted'
            )}
          >
            {active ? (
              <motion.span
                layoutId="hero-view-tab-pill"
                className="absolute inset-0 rounded-full bg-terracotta -z-10"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            {tab === 'list' ? 'List' : 'Calendar'}
          </span>
        )
      })}
      </div>
    </LayoutGroup>
  )
}

function PointerCursorSvg() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" className="block overflow-visible" aria-hidden>
      <path
        d="M0 0 L0 16.5 L3.4 12.4 L6.6 20.6 L8.9 19.4 L5.9 11.2 L10.2 11.2 Z"
        fill="#b85d3f"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeroCursor({
  active,
  containerRef,
  targetRef,
}: {
  active: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  targetRef: React.RefObject<HTMLElement | null>
}) {
  const [pos, setPos] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(
    null
  )
  const [phase, setPhase] = useState<'glide' | 'click'>('glide')
  const glideMs = HERO_STORY_MS.cursorMs * 0.65

  const remeasure = useCallback(() => {
    const container = containerRef.current
    const target = targetRef.current
    if (!container || !target) return
    const cr = container.getBoundingClientRect()
    const tr = target.getBoundingClientRect()
    setPos({
      from: { x: cr.width * 0.7, y: cr.height * 0.42 },
      to: { x: tr.left - cr.left + tr.width / 2, y: tr.top - cr.top + tr.height / 2 },
    })
  }, [containerRef, targetRef])

  useLayoutEffect(() => {
    if (!active) {
      setPos(null)
      setPhase('glide')
      return
    }
    remeasure()
    const id = requestAnimationFrame(remeasure)
    return () => cancelAnimationFrame(id)
  }, [active, remeasure])

  useEffect(() => {
    if (!active) return
    const t = window.setTimeout(() => setPhase('click'), glideMs)
    return () => window.clearTimeout(t)
  }, [active, glideMs])

  if (!active || !pos) return null

  return (
    <motion.div
      className="absolute left-0 top-0 z-50 pointer-events-none"
      initial={{ x: pos.from.x, y: pos.from.y, opacity: 0 }}
      animate={{ x: pos.to.x, y: pos.to.y, opacity: 1 }}
      transition={{ duration: glideMs / 1000, ease: 'easeOut' }}
      aria-hidden
    >
      <motion.div
        className="relative origin-top-left"
        animate={phase === 'click' ? { scale: [1, 0.85, 1] } : { scale: 1 }}
        transition={{ duration: scaleLandingDemoSec(0.22) }}
      >
        <PointerCursorSvg />
      </motion.div>
      <span className="absolute text-[10px] px-2 py-0.5 rounded whitespace-nowrap bg-terracotta text-white font-semibold left-[14px] top-[20px]">
        Athera
      </span>
    </motion.div>
  )
}

function useHeroStoryClock({
  resetKey,
  enabled,
  autoplay,
  hoverPaused,
  stepOnceTarget,
  onStepOnceDone,
  durationMs,
  onLoop,
  setElapsed,
}: {
  resetKey: string
  enabled: boolean
  autoplay: boolean
  hoverPaused: boolean
  stepOnceTarget: number | null
  onStepOnceDone: () => void
  durationMs: number
  onLoop: () => void
  setElapsed: (n: number) => void
}) {
  const autoplayRef = useRef(autoplay)
  const stepOnceRef = useRef(stepOnceTarget)
  const hoverRef = useRef(hoverPaused)
  const anchorRef = useRef({ wall: Date.now(), elapsed: 0 })

  const syncAnchor = useCallback((e: number) => {
    anchorRef.current = { wall: Date.now(), elapsed: e }
  }, [])

  useEffect(() => {
    autoplayRef.current = autoplay
  }, [autoplay])
  useEffect(() => {
    stepOnceRef.current = stepOnceTarget
  }, [stepOnceTarget])
  useEffect(() => {
    hoverRef.current = hoverPaused
    if (!hoverPaused) {
      syncAnchor(anchorRef.current.elapsed)
    }
  }, [hoverPaused, syncAnchor])

  useEffect(() => {
    syncAnchor(0)
  }, [resetKey, syncAnchor])

  useEffect(() => {
    if (!enabled) return

    const id = window.setInterval(() => {
      if (hoverRef.current) return

      const { wall, elapsed: base } = anchorRef.current
      let next = base + (Date.now() - wall)

      const target = stepOnceRef.current
      if (target !== null) {
        if (next >= target) {
          next = target
          stepOnceRef.current = null
          onStepOnceDone()
        }
        anchorRef.current = { wall: Date.now(), elapsed: next }
        setElapsed(next)
        return
      }

      if (!autoplayRef.current) return

      if (next >= durationMs) {
        next = 0
        onLoop()
      }
      anchorRef.current = { wall: Date.now(), elapsed: next }
      setElapsed(next)
    }, 40)

    return () => window.clearInterval(id)
  }, [durationMs, enabled, onLoop, onStepOnceDone, setElapsed, syncAnchor])

  return syncAnchor
}

function HeroDemoControls({
  pack,
  step,
  progress,
  autoplay,
  playDisabled,
  onStep,
  onPrev,
  onNext,
  onTogglePlay,
}: {
  pack: HeroStoryPack
  step: HeroStoryStep
  progress: number
  autoplay: boolean
  playDisabled?: boolean
  onStep: (step: HeroStoryStep) => void
  onPrev: () => void
  onNext: () => void
  onTogglePlay: () => void
}) {
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

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-3"
      role="group"
      aria-label="Hero demo playback"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <button type="button" className={iconBtn} aria-label="Previous step" onClick={onPrev}>
        <ChevronLeft className="w-4 h-4" strokeWidth={2} aria-hidden />
      </button>

      <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero story steps">
        {HERO_STORY_STEPS.map((i) => {
          const active = step === i
          const caption = pack.captions[i]
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

function TaskRow({
  item,
  index,
  flags,
  plain,
  underTutoringHeader = false,
  primarySpaceLabel,
}: {
  item: HeroStoryItem
  index: number
  flags: ReturnType<typeof heroStoryFlagsFromElapsed>
  plain: boolean
  underTutoringHeader?: boolean
  primarySpaceLabel: string
}) {
  const showClean = !plain && index < flags.cleanIndex
  const title = heroItemTitle(item, showClean, underTutoringHeader, primarySpaceLabel)

  return (
    <div className={clsx(ROW, 'landing-card rounded-[10px]')}>
      {plain || !showClean ? (
        <span
          className="w-4 h-4 rounded-full border border-[#b8b4ac] bg-[#fafafa] shrink-0"
          aria-hidden
        />
      ) : (
        <DemoItemIcon icon={item.icon} className="w-4 h-4 text-ink-muted shrink-0" />
      )}
      <motion.p
        key={showClean ? 'clean' : 'messy'}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: scaleLandingDemoSec(0.18) }}
        className="truncate flex-1 min-w-0 text-ink-primary"
      >
        {title}
      </motion.p>
    </div>
  )
}

function CalendarGrid({ items, pack }: { items: HeroStoryItem[]; pack: HeroStoryPack }) {
  const scheduled = items.filter((i) => !i.unscheduled)
  const unscheduled = items.filter((i) => i.unscheduled)
  const legendNames = pack.studentGroups
    .map((g) => g.label.split(' · ')[0])
    .filter((n) => n !== 'Admin' && n !== 'Campus' && n !== 'Activities')
    .slice(0, 2)

  return (
    <div className="flex flex-col h-full min-h-0">
      {legendNames.length ? (
        <p className="text-[10px] text-ink-muted mb-1 shrink-0">
          {legendNames.map((name, i) => (
            <span key={name} className={clsx('mr-2', studentStyle(name).dot)}>
              ● {name}
            </span>
          ))}
        </p>
      ) : null}

      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex gap-0.5 shrink-0 mb-0.5 pl-8">
          {WEEKDAY_LABELS.map((d) => (
            <div key={d} className="flex-1 text-center text-[9px] font-semibold text-ink-muted">
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 flex gap-0.5">
          <div className="w-8 shrink-0 relative text-[11px] text-ink-faint">
            {TIME_LABELS.map((label, i) => (
              <span
                key={label}
                className="absolute right-1 -translate-y-1/2 leading-none"
                style={{ top: `${(i / (TIME_LABELS.length - 1)) * 100}%` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-7 gap-0.5">
            {WEEKDAY_LABELS.map((_, day) => (
              <div
                key={day}
                className="relative h-full rounded-sm border border-border-delicate/70 bg-surface-container/25 overflow-hidden"
              >
                {TIME_LABELS.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-border-delicate/40 pointer-events-none"
                    style={{ top: `${(i / (TIME_LABELS.length - 1)) * 100}%` }}
                  />
                ))}
                {scheduled
                  .filter((i) => i.weekday === day)
                  .map((item) => {
                    const top = timeToTopPercent(parseHeroTimeMinutes(item.cleanTitle))
                    const style = studentStyle(item.studentGroup)
                    const short = heroCalendarEventLabel(item.cleanTitle)
                    return (
                      <div
                        key={item.id}
                        className={clsx(
                          'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[12px] leading-tight border-l-[3px] shadow-sm',
                          style.border,
                          style.bg
                        )}
                        style={{ top: `calc(${top}% - 4px)`, maxHeight: '2.75rem' }}
                      >
                        <span className="line-clamp-2 text-ink-primary">{short}</span>
                      </div>
                    )
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {unscheduled.length ? (
        <div className="shrink-0 mt-1.5 pt-1.5 border-t border-border-delicate/80">
          <p className="text-[9px] font-semibold text-ink-muted mb-1">Unscheduled</p>
          <div className="flex flex-wrap gap-1">
            {unscheduled.map((item) => {
              const style = studentStyle(item.studentGroup)
              return (
                <div
                  key={item.id}
                  className={clsx(
                    'rounded px-1.5 py-0.5 text-[11px] max-w-[140px] truncate border-l-[3px]',
                    style.border,
                    style.bg
                  )}
                >
                  {item.cleanTitle}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

const SidebarRow = forwardRef<
  HTMLButtonElement,
  { label: string; active: boolean }
>(function SidebarRow({ label, active }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      className={clsx(
        'w-full h-8 text-left px-2 rounded-md pointer-events-none text-[13px] leading-none flex items-center truncate',
        active ? 'bg-surface-container font-medium text-ink-primary' : 'text-ink-muted'
      )}
    >
      {label}
    </button>
  )
})

export function HeroStoryShell({
  pack,
  flags,
  splitRef,
  calendarShowRef,
  calendarTabRef,
  personalSpaceRef,
  instantMotion,
  stepShellKey,
}: {
  pack: HeroStoryPack
  flags: ReturnType<typeof heroStoryFlagsFromElapsed>
  splitRef: React.Ref<HTMLButtonElement>
  calendarShowRef: React.Ref<HTMLButtonElement>
  calendarTabRef: React.Ref<HTMLSpanElement>
  personalSpaceRef: React.Ref<HTMLButtonElement>
  instantMotion?: boolean
  stepShellKey?: string
}) {
  const [space0, space1] = pack.spaceNames
  const plain = flags.plainTodo

  const primaryItems = pack.items.filter((i) => i.spaceSlot === 0)
  const secondaryItems = pack.items.filter((i) => i.spaceSlot === 1)
  const personalItems = pack.items.filter((i) => pack.personalListIds.includes(i.id))

  let mainItems: HeroStoryItem[] = pack.items
  if (flags.splitApplied && flags.activeSpace === 0) mainItems = primaryItems
  if (flags.splitApplied && flags.activeSpace === 1) mainItems = personalItems

  const showSecondaryCluster = flags.showClusters && !flags.splitApplied
  const prevViewKeyRef = useRef<string | null>(null)

  return (
    <motion.div
      key={stepShellKey}
      className="relative flex h-full min-h-0 overflow-hidden"
      initial={{ opacity: instantMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: instantMotion ? 0 : scaleLandingDemoSec(0.25) }}
    >
      <AnimatePresence initial={false}>
        {flags.sidebarVisible ? (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 130, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: instantMotion ? 0 : HERO_STORY_MS.sidebarMs / 1000, ease: 'easeOut' }}
            className="shrink-0 border-r border-[var(--border)] overflow-hidden flex flex-col pt-1 pr-2"
          >
            <AtheraMark size={24} className="mb-2 shrink-0" />
            <p className="text-[9px] font-semibold tracking-widest uppercase text-ink-muted mb-1">
              Spaces
            </p>
            <nav className="space-y-0.5">
              <SidebarRow
                label={`${space0} · ${primaryItems.length}`}
                active={flags.activeSpace === 0}
              />
              <SidebarRow
                ref={personalSpaceRef}
                label={`${space1} · ${secondaryItems.length}`}
                active={flags.activeSpace === 1}
              />
            </nav>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <div className="flex-1 min-w-0 flex flex-col min-h-0 pl-3 pt-0.5 pb-16">
        <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-ink-secondary truncate">
            {flags.headerTitle}
          </p>
          {flags.showViewTabs ? (
            <ViewTabs
              mode={flags.viewMode}
              showCalendarTab={flags.showCalendarTab}
              calendarTabRef={calendarTabRef}
            />
          ) : null}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {(() => {
            const isCalendar = flags.viewMode === 'calendar' && flags.activeSpace === 0
            const viewKey = flags.plainTodo
              ? 'todo'
              : showSecondaryCluster
                ? 'clusters'
                : flags.studentGrouped
                  ? 's0-list-grouped'
                  : isCalendar
                    ? 's0-calendar'
                    : `s${flags.activeSpace}-list`

            const calendarEnter =
              viewKey.endsWith('-calendar') && !prevViewKeyRef.current?.endsWith('-calendar')
            prevViewKeyRef.current = viewKey

            const flatPreCluster =
              !flags.plainTodo && !showSecondaryCluster && !flags.splitApplied && !flags.studentGrouped
            const centerListInCard = flags.plainTodo || flatPreCluster

            const tutoringListContext =
              showSecondaryCluster ||
              (flags.splitApplied && flags.activeSpace === 0 && !isCalendar)

            let body: React.ReactNode = null
            if (isCalendar) {
              body = <CalendarGrid items={primaryItems} pack={pack} />
            } else if (flags.studentGrouped) {
              body = (
                <div className="space-y-2">
                  {pack.studentGroups.map((group) => (
                    <div key={group.label} className="space-y-1">
                      <p className="text-[10px] font-semibold text-ink-muted px-0.5 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-surface-container text-[9px] font-bold flex items-center justify-center text-ink-secondary">
                          {group.label.charAt(0)}
                        </span>
                        {group.label}
                      </p>
                      <div className="space-y-1.5">
                        {group.ids.map((id) => {
                          const item = pack.items.find((i) => i.id === id)
                          if (!item) return null
                          return (
                            <TaskRow
                              key={item.id}
                              item={item}
                              index={pack.items.indexOf(item)}
                              flags={flags}
                              plain={false}
                              underTutoringHeader
                              primarySpaceLabel={space0}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            } else if (!showSecondaryCluster) {
              body = (
                <div className="space-y-1.5">
                  {mainItems.map((item) => (
                    <TaskRow
                      key={item.id}
                      item={item}
                      index={pack.items.indexOf(item)}
                      flags={flags}
                      plain={plain}
                      underTutoringHeader={
                        tutoringListContext && item.spaceSlot === 0 && !plain
                      }
                      primarySpaceLabel={space0}
                    />
                  ))}
                </div>
              )
            } else {
              body = (
                <div className="space-y-1.5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-ink-muted px-0.5">
                      {pack.clusterLabels[0]}
                    </p>
                    <div className="space-y-1.5">
                      {primaryItems.map((item) => (
                        <TaskRow
                          key={item.id}
                          item={item}
                          index={pack.items.indexOf(item)}
                          flags={flags}
                          plain={plain}
                          underTutoringHeader={!plain}
                          primarySpaceLabel={space0}
                        />
                      ))}
                    </div>
                  </div>
                  <AnimatePresence>
                    {showSecondaryCluster ? (
                      <motion.div
                        key="sec-cluster"
                        initial={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 overflow-hidden"
                      >
                        <p className="text-[10px] font-semibold text-ink-muted px-0.5">
                          {pack.clusterLabels[1]}
                        </p>
                        <div className="space-y-1.5">
                          {secondaryItems.map((item) => (
                            <TaskRow
                              key={item.id}
                              item={item}
                              index={pack.items.indexOf(item)}
                              flags={flags}
                              plain={plain}
                              primarySpaceLabel={space0}
                            />
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )
            }

            return (
              <CrossfadeMain viewKey={viewKey} calendarEnter={calendarEnter} instant={instantMotion}>
                <div
                  className={clsx(
                    'min-h-0',
                    centerListInCard ? 'h-full flex flex-col justify-center' : 'h-full'
                  )}
                >
                  {body}
                </div>
              </CrossfadeMain>
            )
          })()}
        </div>
      </div>

      <AnimatePresence>
        {flags.showSuggestion ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: instantMotion ? 0 : scaleLandingDemoSec(0.32), ease: 'easeOut' }}
            className="absolute left-4 right-4 bottom-4 z-30 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
            data-persona-conflict-zone
          >
            <SuggestionCard
              ref={splitRef}
              message={pack.splitSuggestion}
              primaryLabel={pack.splitButtonLabel}
              primaryPressed={flags.cursorClick && flags.cursorTarget === 'split'}
            />
          </motion.div>
        ) : null}
        {flags.showCalendarSuggestion ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: instantMotion ? 0 : scaleLandingDemoSec(0.32), ease: 'easeOut' }}
            className="absolute left-4 right-4 bottom-4 z-30 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
            data-persona-conflict-zone
          >
            <SuggestionCard
              ref={calendarShowRef}
              message={ATHERA_CALENDAR_SUGGESTION}
              primaryLabel="Show calendar"
              primaryPressed={flags.cursorClick && flags.cursorTarget === 'calendarShow'}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default function HeroProductDemo() {
  const reducedMotion = useReducedMotion()
  const instantMotion = !!reducedMotion
  const { persona, setPersona } = useLandingPersona()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35, once: false })
  const [elapsed, setElapsed] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [stepOnceTarget, setStepOnceTarget] = useState<number | null>(null)
  const [stepShellKey, setStepShellKey] = useState('0')
  const [reshapeFlash, setReshapeFlash] = useState(0)
  const wasSplitRef = useRef(false)
  const elapsedRef = useRef(0)
  elapsedRef.current = elapsed

  const mockRef = useRef<HTMLDivElement>(null)
  const splitRef = useRef<HTMLButtonElement>(null)
  const calendarShowRef = useRef<HTMLButtonElement>(null)
  const calendarTabRef = useRef<HTMLSpanElement>(null)
  const personalSpaceRef = useRef<HTMLButtonElement>(null)

  const pack = buildHeroStoryDemo(persona)
  const durationMs = heroStoryDurationMs()

  const flags = heroStoryFlagsFromElapsed(elapsed, pack)
  const stepProgress = heroStoryProgressInStep(elapsed, flags.step)

  const onLoop = useCallback(() => {
    setPersona(persona, { syncOnly: true, track: false })
  }, [persona, setPersona])

  const onStepOnceDone = useCallback(() => {
    setStepOnceTarget(null)
  }, [])

  const syncAnchor = useHeroStoryClock({
    resetKey: `hero-story-${persona}`,
    enabled: inView,
    autoplay: autoplay && !reducedMotion,
    hoverPaused,
    stepOnceTarget,
    onStepOnceDone,
    durationMs,
    onLoop,
    setElapsed,
  })

  useEffect(() => {
    if (inView) syncAnchor(elapsedRef.current)
  }, [inView, syncAnchor])

  const goToStep = useCallback(
    (step: HeroStoryStep, track = true) => {
      if (track) {
        trackLandingEvent('demo_step_clicked', { step: String(step + 1) })
      }
      setAutoplay(false)
      const start = heroStepStart(step)
      const hold = heroStepHoldElapsed(step)
      setStepOnceTarget(hold)
      setElapsed(start)
      syncAnchor(start)
      setStepShellKey(`${persona}-${step}-${Date.now()}`)
    },
    [persona, syncAnchor]
  )

  useEffect(() => {
    setElapsed(0)
    setAutoplay(!reducedMotion)
    setStepOnceTarget(null)
    setStepShellKey(`${persona}-0`)
    wasSplitRef.current = false
    syncAnchor(0)
  }, [persona, reducedMotion, syncAnchor])

  useEffect(() => {
    if (reducedMotion) setAutoplay(false)
  }, [reducedMotion])

  useEffect(() => {
    if (flags.splitApplied && !wasSplitRef.current) {
      setReshapeFlash((n) => n + 1)
    }
    wasSplitRef.current = flags.splitApplied
  }, [flags.splitApplied, persona])

  const handlePrev = useCallback(() => {
    const next = Math.max(0, flags.step - 1) as HeroStoryStep
    goToStep(next)
  }, [flags.step, goToStep])

  const handleNext = useCallback(() => {
    const next = Math.min(4, flags.step + 1) as HeroStoryStep
    goToStep(next)
  }, [flags.step, goToStep])

  const handleTogglePlay = useCallback(() => {
    if (reducedMotion) return
    if (autoplay) {
      setAutoplay(false)
      setStepOnceTarget(null)
      syncAnchor(elapsed)
      return
    }
    trackLandingEvent('demo_autoplay_resumed')
    setStepOnceTarget(null)
    syncAnchor(elapsed)
    setAutoplay(true)
  }, [autoplay, elapsed, reducedMotion, syncAnchor])

  const handleCardEnter = useCallback(() => {
    if (autoplay && !reducedMotion) {
      syncAnchor(elapsed)
      setHoverPaused(true)
    }
  }, [autoplay, elapsed, reducedMotion, syncAnchor])

  const handleCardLeave = useCallback(() => {
    setHoverPaused(false)
  }, [])

  const cursorTargetRef: React.RefObject<HTMLElement | null> =
    flags.cursorTarget === 'split'
      ? splitRef
      : flags.cursorTarget === 'calendarShow'
        ? calendarShowRef
        : flags.cursorTarget === 'personalSpace'
          ? personalSpaceRef
          : splitRef

  const caption = pack.captions[flags.step]
  const compactStep1Card = flags.step === 0

  return (
    <div ref={rootRef} className="w-full max-w-[560px] flex flex-col items-center">
      <div
        ref={mockRef}
        className={clsx(
          'demo-frame w-full overflow-hidden relative p-4 transition-[height] duration-150',
          compactStep1Card ? 'h-[392px] min-[900px]:h-[432px]' : 'h-[440px] min-[900px]:h-[500px]'
        )}
        onMouseEnter={handleCardEnter}
        onMouseLeave={handleCardLeave}
      >
        <DemoReshapeGridFlash trigger={reshapeFlash} />
        <div className="relative z-[2] h-full min-h-0">
          <HeroStoryShell
            pack={pack}
            flags={flags}
            splitRef={splitRef}
            calendarShowRef={calendarShowRef}
            calendarTabRef={calendarTabRef}
            personalSpaceRef={personalSpaceRef}
            instantMotion={instantMotion}
            stepShellKey={stepShellKey}
          />
          <HeroCursor
            active={
              !instantMotion &&
              flags.cursorTarget !== 'none' &&
              !hoverPaused &&
              (autoplay || stepOnceTarget !== null)
            }
            containerRef={mockRef}
            targetRef={cursorTargetRef}
          />
        </div>
      </div>

      <div className="w-full mt-4 flex flex-col items-center gap-3" data-persona-conflict-zone>
        <HeroDemoControls
          pack={pack}
          step={flags.step}
          progress={stepProgress}
          autoplay={autoplay && !reducedMotion}
          playDisabled={!!reducedMotion}
          onStep={goToStep}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={handleTogglePlay}
        />
        <AnimatePresence mode="wait">
          <motion.p
            key={`${flags.step}-${persona}-${stepShellKey}`}
            initial={{ opacity: instantMotion ? 1 : 0, y: instantMotion ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: instantMotion ? 1 : 0, y: instantMotion ? 0 : -4 }}
            transition={{ duration: instantMotion ? 0 : scaleLandingDemoSec(0.25) }}
            className="text-center text-[15px] sm:text-[16px] text-ink-secondary leading-snug px-2 min-h-[2.5rem]"
          >
            {caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
