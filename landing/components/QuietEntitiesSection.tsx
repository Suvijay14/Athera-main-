'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import clsx from 'clsx'
import { Bell } from 'lucide-react'
import {
  getPersonaDemo,
  quietEntityAvatarTone,
  quietEntitySuggestion,
  quietFollowUpLine,
  quietSectionRowsForPersona,
} from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import DemoPointer from '@/components/landing/comparison/DemoPointer'
import {
  quietDemoElapsedInHalf,
  quietDemoFlagsFromElapsed,
  quietDemoHalfDurationMs,
  quietDemoLoopDurationMs,
  quietDemoVariantAtElapsed,
  QUIET_DEMO_TIMING,
} from '@/lib/landing/quiet-demo'

function useQuietTimeline(enabled: boolean, paused: boolean, onTick: (ms: number) => void) {
  const startRef = useRef(0)
  const pauseStartedRef = useRef(0)
  const pausedRef = useRef(false)

  useEffect(() => {
    if (paused) {
      if (!pausedRef.current) pauseStartedRef.current = Date.now()
      pausedRef.current = true
    } else {
      if (pausedRef.current && pauseStartedRef.current) {
        startRef.current += Date.now() - pauseStartedRef.current
      }
      pausedRef.current = false
    }
  }, [paused])

  useEffect(() => {
    if (!enabled) return
    startRef.current = Date.now()
    pausedRef.current = false

    const id = window.setInterval(() => {
      if (pausedRef.current) return
      let elapsed = Date.now() - startRef.current
      if (elapsed >= quietDemoLoopDurationMs()) {
        startRef.current = Date.now()
        elapsed = 0
      }
      onTick(elapsed)
    }, 40)

    return () => window.clearInterval(id)
  }, [enabled, onTick])
}

function EntityRow({
  name,
  subline,
  extra,
  toneClass,
  dimmed,
  layout,
}: {
  name: string
  subline: string
  extra?: string
  toneClass: string
  dimmed: boolean
  layout?: boolean
}) {
  const initial = name.trim().charAt(0).toUpperCase()
  return (
    <motion.div
      layout={layout}
      animate={{ opacity: dimmed ? 0.35 : 1 }}
      transition={{ duration: 0.35 }}
      className="landing-card px-3 py-2.5 flex items-center gap-3"
    >
      <span
        className={clsx(
          'w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold',
          toneClass
        )}
      >
        {initial}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-primary truncate">{name}</p>
        <p className="text-xs text-ink-muted">{subline}</p>
        {extra ? <p className="text-[11px] text-ink-faint mt-0.5">{extra}</p> : null}
      </div>
    </motion.div>
  )
}

function QuietEntitiesDemo() {
  const reducedMotion = useReducedMotion()
  const { persona } = useLandingPersona()
  const rows = quietSectionRowsForPersona(persona)
  const usually = getPersonaDemo(persona).quietEntity.usually
  const suggestion = quietEntitySuggestion(persona)
  const followUp = quietFollowUpLine(persona)

  const rootRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const remindRef = useRef<HTMLButtonElement>(null)
  const archiveRef = useRef<HTMLButtonElement>(null)
  const inView = useInView(rootRef, { amount: 0.4, once: false })
  const [elapsed, setElapsed] = useState(0)
  const [hovered, setHovered] = useState(false)

  const onTick = useCallback((ms: number) => setElapsed(ms), [])

  useQuietTimeline(inView && !reducedMotion, hovered, onTick)

  const variant = quietDemoVariantAtElapsed(reducedMotion ? 0 : elapsed)
  const halfElapsed = quietDemoElapsedInHalf(
    reducedMotion ? quietDemoHalfDurationMs() - 500 : elapsed
  )

  const flags = quietDemoFlagsFromElapsed(halfElapsed, variant, !!reducedMotion)

  const cursorTargetRef =
    flags.cursorTarget === 'remind'
      ? remindRef
      : flags.cursorTarget === 'archive'
        ? archiveRef
        : remindRef

  useEffect(() => {
    setElapsed(0)
  }, [persona])

  const visibleRows = rows.filter((r) => !(flags.archived && r.isQuiet))

  return (
    <div ref={rootRef} className="relative max-w-lg mx-auto overflow-visible">
      <div
        className="relative overflow-visible min-[900px]:pr-[168px]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          ref={containerRef}
          className="demo-frame p-4 sm:p-5 min-h-[320px] relative pointer-events-none select-none"
        >
          <AnimatePresence initial={false}>
            {flags.showFollowUp ? (
              <motion.div
                key="upcoming"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
                  Upcoming
                </p>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.38, ease: 'easeOut' }}
                  className="landing-card px-3 py-2 flex items-center gap-2 border-l-[3px] border-l-terracotta/50"
                >
                  <Bell className="w-4 h-4 text-terracotta shrink-0" aria-hidden />
                  <p className="text-sm text-ink-primary">{followUp}</p>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {visibleRows.map((row, index) => {
                const isQuiet = Boolean(row.isQuiet)
                const dimmed = flags.rowDimmed(isQuiet)
                const showUsuallyLine = isQuiet && flags.showUsually
                return (
                  <motion.div
                    key={row.id}
                    layout
                    initial={false}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <EntityRow
                      name={row.name}
                      subline={
                        isQuiet && row.lastLabel
                          ? row.lastLabel
                          : row.nextDay
                            ? `Next: ${row.nextDay}`
                            : ''
                      }
                      extra={showUsuallyLine ? usually : undefined}
                      toneClass={quietEntityAvatarTone(index)}
                      dimmed={dimmed}
                      layout
                    />
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {flags.showSuggestion ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 landing-card border-l-4 border-l-terracotta px-3 py-2.5"
                data-persona-conflict-zone
              >
                <p className="text-sm text-ink-secondary leading-snug">{suggestion}</p>
                <div className="mt-2.5 flex flex-wrap gap-2 items-center">
                  <button
                    ref={archiveRef}
                    type="button"
                    tabIndex={-1}
                    className={clsx(
                      'h-8 px-2.5 text-[11px] font-semibold rounded-md border border-border-delicate text-ink-secondary bg-surface-container/60',
                      flags.cursorClick && flags.cursorTarget === 'archive' && 'scale-95 opacity-90'
                    )}
                  >
                    Archive
                  </button>
                  <button
                    ref={remindRef}
                    type="button"
                    tabIndex={-1}
                    className={clsx(
                      'h-8 px-2.5 text-[11px] font-semibold rounded-md text-white bg-terracotta transition-transform',
                      flags.cursorClick && flags.cursorTarget === 'remind' && 'scale-95 bg-terracotta-soft'
                    )}
                  >
                    Remind me to follow up
                  </button>
                  <span className="text-[11px] text-ink-secondary px-1">Not now</span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {flags.archived ? (
              <motion.div
                key="archived-pill"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 flex items-center gap-2"
              >
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-surface-container border border-border-delicate text-ink-secondary">
                  Archived · 1
                </span>
                <span className="text-[11px] font-medium text-terracotta">Undo</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <DemoPointer
            active={flags.cursorActive}
            containerRef={containerRef}
            targetRef={cursorTargetRef}
          />
        </div>

        {flags.sideLabel ? (
          <div
            className="hidden min-[900px]:flex absolute right-0 top-16 translate-x-[calc(100%+12px)] pointer-events-none"
            data-persona-conflict-zone
          >
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs font-semibold text-sage bg-sage-light/80 border border-sage/25 rounded-full px-2.5 py-1 whitespace-nowrap"
            >
              {flags.sideLabel}
            </motion.span>
          </div>
        ) : null}
      </div>

      {flags.sideLabel ? (
        <div className="min-[900px]:hidden flex justify-center mt-3 pointer-events-none" data-persona-conflict-zone>
          <span className="text-xs font-semibold text-sage bg-sage-light/80 border border-sage/25 rounded-full px-2.5 py-1">
            {flags.sideLabel}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default function QuietEntitiesSection() {
  return (
    <section className="landing-section-alt px-5 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto border-t border-[var(--border)]">
      <h2 className="font-newsreader text-2xl sm:text-3xl text-center text-ink-primary leading-snug max-w-3xl mx-auto">
        It notices what&apos;s gone quiet, too.
      </h2>
      <p className="mt-3 text-center text-ink-secondary text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
        Clean up what&apos;s done, or win back what&apos;s slipping. Your call.
      </p>

      <div className="mt-10">
        <QuietEntitiesDemo />
      </div>

      <p
        className="mt-8 text-center text-[18px] text-ink-primary font-medium leading-snug max-w-xl mx-auto px-2"
        data-persona-conflict-zone
      >
        Nothing gets deleted. Archived things come back the moment you need them.
      </p>
    </section>
  )
}
