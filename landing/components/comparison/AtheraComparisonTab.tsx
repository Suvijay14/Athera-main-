'use client'

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import clsx from 'clsx'
import {
  comparisonEntityGroups,
  comparisonGroupByCopy,
  getPersonaDemo,
  ICON_BY_ITEM_TYPE,
  spaceItemCounts,
  WEEKDAY_LABELS,
  type PersonaKey,
} from '@/demo-data'
import {
  atheraComparisonDurationMs,
  atheraComparisonFlagsFromElapsed,
  ATHERA_CALENDAR_SUGGESTION,
  atheraQuietSuggestion,
  comparisonTasksForPersona,
  COMPARISON_TAB_DURATION_MS,
  type ComparisonTask,
} from '@/lib/landing/comparison-demo'
import { quietDraftEmailBody } from '@/demo-data'
import {
  CommandBar,
  DraftCard,
  SuggestionCard,
} from '@/src/components/athera-ui'
import {
  comparisonCalendarEventLabel,
  GRID_TIME_LABELS,
  parseTimeMinutesFromText,
  timeToTopPercent,
} from '@/lib/landing/calendar-demo'
import DemoItemIcon from '@/components/landing/DemoItemIcon'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import DemoReshapeGridFlash from '@/components/landing/DemoReshapeGridFlash'
import DemoPointer from '@/components/landing/comparison/DemoPointer'
import { useComparisonTimeline } from '@/components/landing/comparison/useComparisonTimeline'

const DURATION = COMPARISON_TAB_DURATION_MS.athera

const ENTITY_TONES = [
  'border-l-sage bg-sage-light/35 border-l-[3px]',
  'border-l-terracotta/50 bg-terracotta-light/25 border-l-[3px]',
  'border-l-border-delicate bg-surface-container/80 border-l-[3px]',
] as const

function entityToneIndex(entity: string, entities: string[]) {
  const i = entities.indexOf(entity)
  return i >= 0 ? i : 0
}

function taskIconType(task: ComparisonTask, persona: PersonaKey) {
  const item = getPersonaDemo(persona).items.find((i) => i.id === task.id)
  return item ? ICON_BY_ITEM_TYPE[item.type] : undefined
}

function TaskRow({
  task,
  persona,
  toneClass,
  layoutId,
}: {
  task: ComparisonTask
  persona: PersonaKey
  toneClass?: string
  layoutId?: string
}) {
  const icon = taskIconType(task, persona)
  return (
    <motion.div
      layout
      layoutId={layoutId ?? `cmp-${task.id}`}
      className={clsx('landing-card px-3 py-2.5', toneClass)}
    >
      <div className="flex items-start gap-2">
        <DemoItemIcon icon={icon} className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <p className="text-sm text-ink-primary leading-snug min-w-0">{task.text}</p>
      </div>
    </motion.div>
  )
}

function GroupedList({
  persona,
  tasks,
  entities,
}: {
  persona: PersonaKey
  tasks: ComparisonTask[]
  entities: string[]
}) {
  const groups = useMemo(() => comparisonEntityGroups(persona), [persona])
  const taskById = useMemo(() => Object.fromEntries(tasks.map((t) => [t.id, t])), [tasks])

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        const groupTasks = group.items
          .map((i) => taskById[i.id])
          .filter(Boolean) as ComparisonTask[]
        if (!groupTasks.length) return null
        const tone = ENTITY_TONES[entityToneIndex(group.entity, entities) % ENTITY_TONES.length]
        return (
          <motion.div
            key={group.entity}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: gi * 0.06 }}
            className="space-y-1.5"
          >
            <p className="text-[11px] font-semibold text-ink-secondary px-0.5">
              {group.entity}{' '}
              <span className="font-normal text-ink-muted">· {groupTasks.length}</span>
            </p>
            <div className="space-y-1.5">
              {groupTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  persona={persona}
                  toneClass={tone}
                  layoutId={`cmp-${task.id}`}
                />
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function CalendarView({
  tasks,
  entities,
}: {
  tasks: ComparisonTask[]
  entities: string[]
}) {
  const scheduled = tasks.filter((t) => t.hasDay && t.timeLabel)
  const unscheduled = tasks.filter((t) => !t.hasDay || !t.timeLabel)

  return (
    <div className="flex flex-col h-[min(280px,42vh)] min-h-[220px]">
      <div className="flex gap-0.5 shrink-0 mb-0.5 pl-7">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="flex-1 text-center text-[9px] font-semibold text-ink-muted">
            {d}
          </div>
        ))}
      </div>
      <div className="flex-1 min-h-0 flex gap-0.5">
        <div className="w-7 shrink-0 relative text-[10px] text-ink-faint">
          {GRID_TIME_LABELS.map((label, i) => (
            <span
              key={label}
              className="absolute right-0.5 -translate-y-1/2 leading-none"
              style={{ top: `${(i / (GRID_TIME_LABELS.length - 1)) * 100}%` }}
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
              {GRID_TIME_LABELS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-border-delicate/40 pointer-events-none"
                  style={{ top: `${(i / (GRID_TIME_LABELS.length - 1)) * 100}%` }}
                />
              ))}
              {scheduled
                .filter((t) => t.weekday === day)
                .map((t) => {
                  const tone =
                    ENTITY_TONES[entityToneIndex(t.entity, entities) % ENTITY_TONES.length]
                  const top = timeToTopPercent(
                    parseTimeMinutesFromText(`${t.timeLabel} ${t.text}`)
                  )
                  return (
                    <motion.div
                      key={t.id}
                      layoutId={`cmp-${t.id}`}
                      className={clsx(
                        'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] leading-tight shadow-sm',
                        tone
                      )}
                      style={{ top: `calc(${top}% - 3px)`, maxHeight: '2.5rem' }}
                    >
                      <span className="line-clamp-2 text-ink-primary">
                        {comparisonCalendarEventLabel(t)}
                      </span>
                    </motion.div>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
      {unscheduled.length ? (
        <div className="shrink-0 mt-1.5 pt-1 border-t border-border-delicate/80">
          <p className="text-[9px] font-semibold text-ink-muted mb-1">Unscheduled</p>
          <div className="flex flex-wrap gap-1">
            {unscheduled.map((t) => {
              const tone =
                ENTITY_TONES[entityToneIndex(t.entity, entities) % ENTITY_TONES.length]
              return (
                <div
                  key={t.id}
                  className={clsx('rounded px-1.5 py-0.5 text-[9px] max-w-[140px] truncate', tone)}
                >
                  {t.text}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function WeeksLaterDivider({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.85 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex items-center gap-3 mb-3"
    >
      <span className="h-px flex-1 bg-border-delicate" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted whitespace-nowrap">
        3 weeks later
      </span>
      <span className="h-px flex-1 bg-border-delicate" />
    </motion.div>
  )
}

const ViewTab = forwardRef<
  HTMLButtonElement,
  { label: string; active: boolean; entering?: boolean }
>(function ViewTab({ label, active, entering }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      className={clsx(
        'px-2.5 py-1 text-[10px] font-medium rounded-full transition-colors',
        active ? 'bg-terracotta text-white' : 'text-ink-muted hover:text-ink-secondary',
        entering && 'ring-1 ring-terracotta/30'
      )}
    >
      {label}
    </button>
  )
})

export default function AtheraComparisonTab({
  paused,
  reducedMotion,
  onComplete,
  onLabelsChange,
  runKey,
}: {
  paused: boolean
  reducedMotion: boolean
  onComplete: () => void
  onLabelsChange: (labels: string[]) => void
  runKey: string
}) {
  const { persona } = useLandingPersona()
  const containerRef = useRef<HTMLDivElement>(null)
  const groupBtnRef = useRef<HTMLButtonElement>(null)
  const quietRemindRef = useRef<HTMLButtonElement>(null)
  const calendarShowRef = useRef<HTMLButtonElement>(null)
  const calendarTabRef = useRef<HTMLButtonElement>(null)
  const [elapsed, setElapsed] = useState(reducedMotion ? DURATION : 0)
  const [flash, setFlash] = useState(0)
  const wasGroupedRef = useRef(false)
  const wasCalendarRef = useRef(false)

  const data = getPersonaDemo(persona)
  const [primarySpace, secondarySpace] = data.spaceNames
  const spaceCounts = spaceItemCounts(persona)
  const groupCopy = useMemo(() => comparisonGroupByCopy(persona), [persona])
  const tasks = useMemo(() => comparisonTasksForPersona(persona), [persona])
  const entities = useMemo(
    () => comparisonEntityGroups(persona).map((g) => g.entity),
    [persona]
  )

  const onTick = useCallback((e: number) => setElapsed(e), [])
  useComparisonTimeline(
    `${runKey}-${persona}`,
    atheraComparisonDurationMs(),
    !reducedMotion,
    paused,
    onTick,
    onComplete
  )

  const flags = useMemo(
    () =>
      atheraComparisonFlagsFromElapsed(
        reducedMotion ? DURATION : elapsed,
        !!reducedMotion,
        groupCopy.sideLabel
      ),
    [elapsed, reducedMotion, groupCopy.sideLabel]
  )

  useEffect(() => {
    onLabelsChange(flags.labels)
  }, [flags.labels, onLabelsChange])

  useEffect(() => {
    wasGroupedRef.current = false
    wasCalendarRef.current = false
    setFlash(0)
  }, [runKey, persona])

  useEffect(() => {
    if (flags.grouped && !wasGroupedRef.current) {
      wasGroupedRef.current = true
      setFlash((n) => n + 1)
    }
    if (flags.activeView === 'calendar' && flags.showCalendarTab && !wasCalendarRef.current) {
      wasCalendarRef.current = true
      setFlash((n) => n + 1)
    }
  }, [flags.activeView, flags.grouped, flags.showCalendarTab])

  const cursorTargetRef =
    flags.cursorTarget === 'quietRemind'
      ? quietRemindRef
      : flags.cursorTarget === 'group'
        ? groupBtnRef
        : flags.cursorTarget === 'calendarShow'
          ? calendarShowRef
          : flags.cursorTarget === 'calendarTab'
            ? calendarTabRef
            : groupBtnRef

  const quietSuggestion = atheraQuietSuggestion(persona)
  const quietDraft = quietDraftEmailBody(persona)

  const countPrimary = spaceCounts.find((s) => s.name === primarySpace)?.count ?? tasks.length
  const countSecondary = spaceCounts.find((s) => s.name === secondarySpace)?.count ?? 0

  return (
    <div ref={containerRef} className="relative min-h-[360px] pointer-events-none select-none">
      <DemoReshapeGridFlash trigger={flash} />
      <div className="relative z-[2] flex gap-3 min-h-[320px]">
        <aside className="w-[128px] shrink-0 border-r border-border-delicate pr-2.5 pt-0.5">
          <p className="text-[9px] font-semibold tracking-widest uppercase text-ink-muted mb-2">
            Spaces
          </p>
          <nav className="space-y-0.5 text-[11px]">
            <SidebarLine label="Overview" muted />
            <SidebarLine label={`${primarySpace} · ${countPrimary}`} active />
            <SidebarLine label={`${secondarySpace} · ${countSecondary}`} muted />
            <SidebarLine label="+ Add a space" muted className="text-ink-faint mt-1" />
          </nav>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          <WeeksLaterDivider visible={flags.showWeeksLater} />

          {!flags.showWorkspace ? (
            <div className="flex-1 min-h-[200px] flex flex-col justify-end gap-3">
              <AnimatePresence mode="wait">
                {flags.showQuietSuggestion ? (
                  <motion.div
                    key="quiet-suggest"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <SuggestionCard
                      ref={quietRemindRef}
                      message={quietSuggestion}
                      primaryLabel="Remind me to follow up"
                      primaryPressed={
                        flags.cursorClick && flags.cursorTarget === 'quietRemind'
                      }
                    />
                  </motion.div>
                ) : null}
                {flags.showQuietDraft ? (
                  <motion.div
                    key="quiet-draft"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                  >
                    <DraftCard body={quietDraft} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <>
          <CommandBar className="mb-2.5" />

          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-sm font-semibold text-ink-primary">{primarySpace}</p>
            <div className="flex items-center gap-1 rounded-full border border-border-delicate px-0.5 py-0.5">
              <ViewTab label="List" active={flags.activeView === 'list'} />
              <AnimatePresence initial={false}>
                {flags.showCalendarTab ? (
                  <motion.span
                    key="cal-tab"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden inline-flex"
                  >
                    <ViewTab
                      ref={calendarTabRef}
                      label="Calendar"
                      active={flags.activeView === 'calendar'}
                      entering
                    />
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          <LayoutGroup id={`comparison-athera-${persona}-${runKey}`}>
            <AnimatePresence mode="wait" initial={false}>
              {flags.activeView === 'calendar' ? (
                <motion.div
                  key="calendar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <CalendarView tasks={tasks} entities={entities} />
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {!flags.grouped ? (
                    <div className="space-y-1.5">
                      {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} persona={persona} layoutId={`cmp-${task.id}`} />
                      ))}
                    </div>
                  ) : (
                    <GroupedList persona={persona} tasks={tasks} entities={entities} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence>
            {flags.showGroupSuggestion ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3"
                data-persona-conflict-zone
              >
                <SuggestionCard
                  ref={groupBtnRef}
                  message={groupCopy.suggestion}
                  primaryLabel={groupCopy.buttonLabel}
                  primaryPressed={flags.cursorClick && flags.cursorTarget === 'group'}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence>
            {flags.showCalendarSuggestion ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3"
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
            </>
          )}
        </div>
      </div>

      <DemoPointer
        active={flags.cursorActive}
        containerRef={containerRef}
        targetRef={cursorTargetRef}
      />
    </div>
  )
}

function SidebarLine({
  label,
  active,
  muted,
  className,
}: {
  label: string
  active?: boolean
  muted?: boolean
  className?: string
}) {
  return (
    <div
      className={clsx(
        'px-2 py-1 rounded-md truncate',
        active && 'bg-surface-container font-medium text-ink-primary',
        muted && !active && 'text-ink-muted',
        className
      )}
    >
      {label}
    </div>
  )
}
