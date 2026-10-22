'use client'

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Repeat2 } from 'lucide-react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import clsx from 'clsx'
import { SCROLL_CALENDAR_ROW_LABELS, WEEKDAY_LABELS } from '@/demo-data'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { trackLandingEvent } from '@/lib/landing/analytics'
import DemoReshapeGridFlash from '@/components/landing/DemoReshapeGridFlash'
import DemoItemIcon from '@/components/landing/DemoItemIcon'
import { scaleLandingDemoMs, scaleLandingDemoSec } from '@/lib/landing/constants'

type StoryStep = 0 | 1 | 2

const TAP_ARROW_DELAY = scaleLandingDemoSec(0.4)
const TAP_ARROW_DURATION = scaleLandingDemoSec(0.48)
const TAP_NOTE_DELAY = TAP_ARROW_DELAY + TAP_ARROW_DURATION + scaleLandingDemoSec(0.06)
const AUTO_REPEAT_MS = scaleLandingDemoMs(5000)
const SPOTLIGHT_FADE = scaleLandingDemoSec(0.4)
const TYPE_CHAR_MS = scaleLandingDemoMs(42)
const TYPE_ROW_PAUSE_MS = scaleLandingDemoMs(380)

const PAST_HISTORY_ROWS = [0, 1, 2] as const
const THIS_WEEK_ROW = 3
const NEXT_WEEK_ROW = 4

export const SCROLL_REPEAT_STORY_STEPS = [
  {
    label: 'Add things',
    short: 'Just start adding things.',
    body: 'You type the same thing in, week after week.',
  },
  {
    label: 'Athera notices',
    short: 'Athera notices.',
    body: 'Same thing, same day, same time, three weeks in a row.',
  },
  {
    label: 'You say yes',
    short: 'You say yes, it repeats.',
    body: 'One tap, and you never type it again. Change one week anytime.',
  },
] as const

function StepNumber({ n }: { n: string }) {
  return (
    <span className="font-[family-name:var(--font-caveat)] text-3xl text-terracotta leading-none block mb-2">
      {n}
    </span>
  )
}

function StoryStepBar({ step }: { step: StoryStep }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[11px] sm:text-xs font-medium mb-4 pb-3 border-b border-border-delicate/80">
      {SCROLL_REPEAT_STORY_STEPS.map((s, i) => {
        const idx = i as StoryStep
        const isPast = step > idx
        const isCurrent = step === idx
        return (
          <Fragment key={s.label}>
            {i > 0 ? <span className="text-ink-faint/70 mx-0.5">→</span> : null}
            <span
              className={clsx(
                'inline-flex items-center gap-1.5 transition-opacity duration-[400ms]',
                isCurrent && 'text-terracotta',
                isPast && 'text-sage',
                !isCurrent && !isPast && 'text-ink-muted opacity-50'
              )}
            >
              <span
                className={clsx(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0',
                  isCurrent && 'bg-terracotta text-white',
                  isPast && 'bg-sage text-white',
                  !isCurrent && !isPast && 'border border-border-delicate text-ink-muted'
                )}
              >
                {isPast ? <Check className="w-3 h-3" strokeWidth={2.5} /> : i + 1}
              </span>
              <span>{s.label}</span>
            </span>
          </Fragment>
        )
      })}
    </div>
  )
}

function PromptHalo({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-block px-1.5 py-0.5 rounded-sm bg-[var(--bg)]/95',
        '[text-shadow:0_0_10px_var(--bg),0_0_18px_var(--bg)]',
        'shadow-[0_0_0_6px_var(--bg)]'
      )}
    >
      {children}
    </span>
  )
}

function HandDrawnArrowhead({ tipX, tipY, angleDeg }: { tipX: number; tipY: number; angleDeg: number }) {
  const rad = (angleDeg * Math.PI) / 180
  const back = 10
  const spread = 0.55
  const x1 = tipX - back * Math.cos(rad - spread)
  const y1 = tipY - back * Math.sin(rad - spread)
  const x2 = tipX - back * Math.cos(rad + spread)
  const y2 = tipY - back * Math.sin(rad + spread)
  return (
    <path
      d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${tipX} ${tipY} L ${x2.toFixed(1)} ${y2.toFixed(1)}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

function TapYesPrompt({
  active,
  cardRef,
  yesRef,
}: {
  active: boolean
  cardRef: React.RefObject<HTMLDivElement | null>
  yesRef: React.RefObject<HTMLButtonElement | null>
}) {
  const noteRef = useRef<HTMLSpanElement>(null)
  const [arrowPath, setArrowPath] = useState<string | null>(null)
  const [tip, setTip] = useState<{ x: number; y: number; angle: number } | null>(null)

  const remeasure = useCallback(() => {
    const card = cardRef.current
    const note = noteRef.current
    const yes = yesRef.current
    if (!card || !note || !yes) return

    const cr = card.getBoundingClientRect()
    const nr = note.getBoundingClientRect()
    const yr = yes.getBoundingClientRect()

    const startX = nr.left - cr.left + 4
    const startY = nr.top - cr.top + nr.height * 0.55
    const endX = yr.left - cr.left + yr.width / 2
    const endY = yr.top - cr.top + yr.height / 2
    const ctrlX = (startX + endX) / 2
    const ctrlY = Math.min(startY, endY) - 18

    setArrowPath(
      `M ${startX.toFixed(1)} ${startY.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`
    )
    setTip({ x: endX, y: endY, angle: Math.atan2(endY - ctrlY, endX - ctrlX) * (180 / Math.PI) })
  }, [cardRef, yesRef])

  useLayoutEffect(() => {
    if (!active) {
      setArrowPath(null)
      setTip(null)
      return
    }
    remeasure()
    const frame = requestAnimationFrame(() => remeasure())
    return () => cancelAnimationFrame(frame)
  }, [active, remeasure])

  useEffect(() => {
    if (!active) return
    window.addEventListener('resize', remeasure)
    return () => window.removeEventListener('resize', remeasure)
  }, [active, remeasure])

  if (!active) return null

  return (
    <>
      {arrowPath ? (
        <svg
          className="absolute inset-0 w-full h-full text-terracotta pointer-events-none z-[1]"
          aria-hidden
        >
          <motion.path
            d={arrowPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: TAP_ARROW_DELAY, duration: TAP_ARROW_DURATION, ease: 'easeInOut' }}
          />
          {tip ? (
            <motion.g
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: TAP_ARROW_DELAY + TAP_ARROW_DURATION * 0.82, duration: 0.12 }}
            >
              <HandDrawnArrowhead tipX={tip.x} tipY={tip.y} angleDeg={tip.angle} />
            </motion.g>
          ) : null}
        </svg>
      ) : null}

      <motion.span
        ref={noteRef}
        className="relative z-[2] shrink-0 max-w-[7.5rem] sm:max-w-none sm:ml-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: TAP_NOTE_DELAY, duration: 0.35 }}
      >
        <PromptHalo>
          <span className="font-[family-name:var(--font-caveat)] text-[24px] text-terracotta -rotate-[3deg] leading-[1.1] block">
            go on, tap yes
          </span>
        </PromptHalo>
      </motion.span>
    </>
  )
}

function CalendarCell({
  row,
  col,
  step,
  weekdayIndex,
  cellLabel,
  icon,
  itemType,
  typingRow,
  typingChars,
  pastRowsDone,
  highlighted,
  repeating,
  dimmed,
}: {
  row: number
  col: number
  step: StoryStep
  weekdayIndex: number
  cellLabel: string
  icon: ReturnType<typeof useLandingPersona>['pack']['scrollStory']['icon']
  itemType: ReturnType<typeof useLandingPersona>['pack']['scrollStory']['type']
  typingRow: number | null
  typingChars: number
  pastRowsDone: number
  highlighted: boolean
  repeating: boolean
  dimmed: boolean
}) {
  const isRepeatCol = col === weekdayIndex
  const isPastSlot = isRepeatCol && PAST_HISTORY_ROWS.includes(row as (typeof PAST_HISTORY_ROWS)[number])
  const isFutureSlot =
    isRepeatCol && repeating && (row === THIS_WEEK_ROW || row === NEXT_WEEK_ROW)

  let text = ''
  let showCursor = false

  if (isPastSlot) {
    if (typingRow === row) {
      text = cellLabel.slice(0, typingChars)
      showCursor = typingChars < cellLabel.length
    } else if (row < pastRowsDone) {
      text = cellLabel
    }
  } else if (isFutureSlot) {
    text = cellLabel
  }

  const hasEntry = Boolean(text)

  return (
    <motion.div
      animate={{ opacity: dimmed && !hasEntry ? 0.35 : dimmed && hasEntry && !highlighted && !isFutureSlot ? 0.35 : 1 }}
      transition={{ duration: SPOTLIGHT_FADE }}
      className={clsx(
        'min-h-[34px] rounded border px-0.5 py-0.5 text-[7px] leading-tight flex flex-col justify-center',
        hasEntry ? 'border-border-delicate bg-surface-container/50' : 'border-transparent bg-transparent',
        highlighted && hasEntry && 'border-terracotta/55 bg-terracotta-light/25 shadow-[0_0_0_1px_rgba(184,93,63,0.25)]',
        isFutureSlot && 'border-sage/35 bg-sage-light/20'
      )}
    >
      {hasEntry ? (
        <motion.div
          initial={isFutureSlot ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex items-start gap-0.5 min-w-0"
        >
          {isFutureSlot ? (
            <Repeat2 className="w-2.5 h-2.5 text-terracotta shrink-0 mt-px" aria-hidden />
          ) : (
            <DemoItemIcon icon={icon} type={itemType} className="w-2.5 h-2.5 text-ink-muted shrink-0 mt-px" />
          )}
          <span className="line-clamp-3 text-ink-primary">{text}</span>
        </motion.div>
      ) : step === 0 && isRepeatCol && typingRow === row && showCursor ? (
        <span className="inline-flex items-center h-3 px-0.5">
          <motion.span
            className="w-px h-2.5 bg-terracotta"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.85, repeat: Infinity }}
            aria-hidden
          />
        </span>
      ) : null}
    </motion.div>
  )
}

export function ScrollRepeatStoryMock({ step }: { step: StoryStep }) {
  const { pack, persona } = useLandingPersona()
  const story = pack.scrollStory
  const [clickedYes, setClickedYes] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [pastRowsDone, setPastRowsDone] = useState(0)
  const [typingRow, setTypingRow] = useState<number | null>(null)
  const [typingChars, setTypingChars] = useState(0)
  const [reshapeFlash, setReshapeFlash] = useState(0)

  const suggestionCardRef = useRef<HTMLDivElement>(null)
  const yesButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setClickedYes(false)
    setDismissed(false)
    setPastRowsDone(0)
    setTypingRow(null)
    setTypingChars(0)
  }, [persona])

  useEffect(() => {
    if (step !== 2) {
      setClickedYes(false)
      setDismissed(false)
    }
  }, [step])

  useEffect(() => {
    if (step !== 0) {
      setPastRowsDone(3)
      setTypingRow(null)
      setTypingChars(0)
      return
    }

    setPastRowsDone(0)
    setTypingRow(0)
    setTypingChars(0)

    const label = story.cellLabel
    let row = 0
    let charIndex = 0
    let rowTimer: number | null = null
    let charTimer: number | null = null

    const startRow = (r: number) => {
      setTypingRow(r)
      setTypingChars(0)
      charIndex = 0
      charTimer = window.setInterval(() => {
        charIndex += 1
        setTypingChars(charIndex)
        if (charIndex >= label.length) {
          if (charTimer) window.clearInterval(charTimer)
          setPastRowsDone(r + 1)
          row = r + 1
          if (row < 3) {
            rowTimer = window.setTimeout(() => startRow(row), TYPE_ROW_PAUSE_MS)
          } else {
            setTypingRow(null)
          }
        }
      }, TYPE_CHAR_MS)
    }

    rowTimer = window.setTimeout(() => startRow(0), 180)

    return () => {
      if (rowTimer) window.clearTimeout(rowTimer)
      if (charTimer) window.clearInterval(charTimer)
    }
  }, [step, persona, story.cellLabel])

  const repeating = step >= 2 && clickedYes
  const showSuggestion = step >= 2 && !clickedYes && !dismissed
  const showHighlightNote = step === 1 && !repeating
  const showTapPrompt = showSuggestion
  const stepThreeSpotlight = step === 2 && !repeating

  const applyYes = useCallback((source: 'user' | 'auto') => {
    setClickedYes(true)
    setReshapeFlash((n) => n + 1)
    if (source === 'user') {
      trackLandingEvent('demo_yes_clicked')
    }
  }, [])

  useEffect(() => {
    if (step !== 2 || clickedYes || dismissed) return
    const timer = window.setTimeout(() => applyYes('auto'), AUTO_REPEAT_MS)
    return () => window.clearTimeout(timer)
  }, [step, clickedYes, dismissed, applyYes, persona])

  const handleUndo = () => {
    setClickedYes(false)
    setDismissed(false)
  }

  const mobileStep = SCROLL_REPEAT_STORY_STEPS[step]

  const cellDimmed = (row: number, col: number) => {
    const isRepeatCol = col === story.weekdayIndex
    const isPastEntry =
      isRepeatCol && PAST_HISTORY_ROWS.includes(row as (typeof PAST_HISTORY_ROWS)[number]) && row < pastRowsDone
    const isFutureEntry =
      repeating && isRepeatCol && (row === THIS_WEEK_ROW || row === NEXT_WEEK_ROW)

    if (step === 1) {
      return !isPastEntry
    }
    if (stepThreeSpotlight) {
      return true
    }
    if (repeating) {
      return !isPastEntry && !isFutureEntry
    }
    if (step === 0 && !isRepeatCol) {
      return true
    }
    return false
  }

  return (
    <div className="demo-frame p-4 sm:p-5 min-h-[380px] w-full max-w-md mx-auto min-[900px]:mx-0">
      <DemoReshapeGridFlash trigger={reshapeFlash} />
      <div className="relative z-[2]">
        <StoryStepBar step={step} />

        <div className="min-[900px]:hidden mb-4">
          <p className="font-newsreader text-xl text-ink-primary leading-snug">{mobileStep.short}</p>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed">{mobileStep.body}</p>
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="label-caps text-[10px] text-ink-secondary tracking-wide">{story.workspaceTitle}</p>
          {repeating ? (
            <motion.span
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-light/90 text-sage border border-sage/25"
            >
              {story.repeatLabel}
            </motion.span>
          ) : null}
        </div>

        {showHighlightNote ? (
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: SPOTLIGHT_FADE }}
            className="font-[family-name:var(--font-caveat)] text-lg text-terracotta mb-2 -rotate-1"
          >
            {story.highlightNote}
          </motion.p>
        ) : (
          <div className="h-7 mb-1" />
        )}

        <div className="mb-1 flex gap-1 items-end">
          <span className="w-[4.75rem] shrink-0 text-[8px] text-ink-faint" aria-hidden />
          <div className="grid grid-cols-7 flex-1 gap-0.5">
            {WEEKDAY_LABELS.map((d) => (
              <span key={d} className="text-[8px] font-semibold text-center text-ink-muted pb-0.5">
                {d}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          {SCROLL_CALENDAR_ROW_LABELS.map((rowLabel, row) => (
            <div key={rowLabel} className="flex gap-1 items-stretch">
              <span className="w-[4.75rem] shrink-0 text-[8px] text-ink-muted leading-tight pr-1 self-center">
                {rowLabel}
              </span>
              <div className="grid grid-cols-7 flex-1 gap-0.5">
              {WEEKDAY_LABELS.map((_, col) => (
                <CalendarCell
                  key={`${row}-${col}`}
                  row={row}
                  col={col}
                  step={step}
                  weekdayIndex={story.weekdayIndex}
                  cellLabel={story.cellLabel}
                  icon={story.icon}
                  itemType={story.type}
                  typingRow={typingRow}
                  typingChars={typingChars}
                  pastRowsDone={pastRowsDone}
                  highlighted={
                    step === 1 &&
                    col === story.weekdayIndex &&
                    PAST_HISTORY_ROWS.includes(row as (typeof PAST_HISTORY_ROWS)[number]) &&
                    row < pastRowsDone
                  }
                  repeating={repeating}
                  dimmed={cellDimmed(row, col)}
                />
              ))}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {showSuggestion ? (
            <motion.div
              key="suggestion"
              ref={suggestionCardRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.28 }}
              style={{ opacity: stepThreeSpotlight ? 1 : undefined }}
              className="relative mt-4 landing-card border-l-4 border-l-terracotta px-3 py-2.5 overflow-visible"
              data-persona-conflict-zone
            >
              <p className="text-sm text-ink-secondary">{story.suggestion}</p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2 relative">
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <span className="relative inline-flex">
                    {showTapPrompt ? (
                      <motion.span
                        className="absolute -inset-1 rounded-md border-2 border-terracotta/45 pointer-events-none"
                        animate={{ scale: [1, 1.28], opacity: [0.55, 0] }}
                        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                        aria-hidden
                      />
                    ) : null}
                    <button
                      ref={yesButtonRef}
                      type="button"
                      onClick={() => applyYes('user')}
                      className="relative text-xs font-semibold bg-terracotta text-white px-3 py-1.5 rounded-md hover:bg-terracotta-soft transition-colors"
                    >
                      Repeat weekly
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    className="text-xs font-medium text-ink-secondary px-2 py-1.5 rounded-md hover:text-ink-primary transition-colors"
                  >
                    Not now
                  </button>
                </div>
                <TapYesPrompt active={showTapPrompt} cardRef={suggestionCardRef} yesRef={yesButtonRef} />
              </div>
            </motion.div>
          ) : null}

          {step >= 2 && dismissed && !clickedYes ? (
            <motion.button
              key="show-again"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-xs font-medium text-terracotta hover:text-terracotta-soft transition-colors"
              style={{ opacity: stepThreeSpotlight ? 1 : undefined }}
              onClick={() => setDismissed(false)}
            >
              Show suggestion again
            </motion.button>
          ) : null}

          {repeating ? (
            <motion.p
              key="undo-line"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-sm text-ink-secondary"
            >
              Repeating ·{' '}
              <button
                type="button"
                onClick={handleUndo}
                className="font-medium text-terracotta hover:text-terracotta-soft underline-offset-2 hover:underline"
              >
                Undo
              </button>
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

function StoryBlock({
  stepIndex,
  onActive,
  children,
}: {
  stepIndex: StoryStep
  onActive: (s: StoryStep) => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-42% 0px -42% 0px', amount: 0.2 })

  useEffect(() => {
    if (inView) onActive(stepIndex)
  }, [inView, onActive, stepIndex])

  return (
    <div ref={ref} className="min-h-[70vh] flex items-center py-8">
      <div className="max-w-md">{children}</div>
    </div>
  )
}

export default function ScrollStoryHowItWorks() {
  const [step, setStep] = useState<StoryStep>(0)

  const onActive = useCallback((s: StoryStep) => setStep(s), [])

  return (
    <section className="landing-section-alt px-5 sm:px-8 py-14 sm:py-20 max-w-6xl mx-auto border-t border-[var(--border)]">
      <div className="grid min-[900px]:grid-cols-[minmax(0,40fr)_minmax(0,60fr)] gap-10 min-[900px]:gap-16">
        <div className="hidden min-[900px]:block">
          <StoryBlock stepIndex={0} onActive={onActive}>
            <StepNumber n="1" />
            <p className="font-newsreader text-2xl sm:text-3xl text-ink-primary leading-snug">
              {SCROLL_REPEAT_STORY_STEPS[0].short}
            </p>
            <p className="mt-3 text-ink-secondary leading-relaxed">{SCROLL_REPEAT_STORY_STEPS[0].body}</p>
          </StoryBlock>
          <StoryBlock stepIndex={1} onActive={onActive}>
            <StepNumber n="2" />
            <p className="font-newsreader text-2xl sm:text-3xl text-ink-primary leading-snug">
              {SCROLL_REPEAT_STORY_STEPS[1].short}
            </p>
            <p className="mt-3 text-ink-secondary leading-relaxed">{SCROLL_REPEAT_STORY_STEPS[1].body}</p>
          </StoryBlock>
          <StoryBlock stepIndex={2} onActive={onActive}>
            <StepNumber n="3" />
            <p className="font-newsreader text-2xl sm:text-3xl text-ink-primary leading-snug">
              {SCROLL_REPEAT_STORY_STEPS[2].short}
            </p>
            <p className="mt-3 text-ink-secondary leading-relaxed">{SCROLL_REPEAT_STORY_STEPS[2].body}</p>
          </StoryBlock>
        </div>
        <div className="min-[900px]:sticky min-[900px]:top-24 min-[900px]:self-start h-fit w-full">
          <ScrollRepeatStoryMock step={step} />
        </div>
      </div>
    </section>
  )
}
