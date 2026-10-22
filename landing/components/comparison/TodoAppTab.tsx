'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion, useInView } from 'framer-motion'
import clsx from 'clsx'
import { COMPARISON_TAB_DURATION_MS } from '@/lib/landing/comparison-demo'
import { useComparisonTimeline } from '@/components/landing/comparison/useComparisonTimeline'
import { useLandingPersona } from '@/components/landing/LandingPersonaContext'
import { todoMessyRows, todoTabAnimConfig } from '@/demo-data'
import {
  TODO_NEW_TASK_ID,
  todoTabDurationMs,
  todoTimerMin,
  TODO_TAB_TIMING,
} from '@/lib/landing/todo-tab-demo'

const DURATION = COMPARISON_TAB_DURATION_MS.todo

function reorderWithInsert(order: string[], dragId: string, afterId: string): string[] {
  if (!order.includes(dragId)) return order
  const next = order.filter((id) => id !== dragId)
  const idx = next.indexOf(afterId)
  if (idx < 0) return order
  next.splice(idx + 1, 0, dragId)
  return next
}

type AnimState = {
  rowOrder: string[]
  newTaskText: string
  showNewRow: boolean
  checkedId: string | null
  removedId: string | null
  timerMin: number
  cursor: { x: string; y: string } | null
}

function stateFromElapsed(
  ms: number,
  reduced: boolean,
  baseOrder: string[],
  config: ReturnType<typeof todoTabAnimConfig>,
  newTaskFull: string
): AnimState {
  const t = TODO_TAB_TIMING
  const addStart = t.initialHold
  const typeStart = addStart + t.addCursorMs
  const typeEnd = typeStart + t.typeMs
  const dragStart = typeEnd + t.afterAddMs
  const dragEnd = dragStart + t.dragMs
  const checkStart = dragEnd
  const checkEnd = checkStart + t.checkMs

  const base = [...baseOrder]

  if (reduced) {
    let order = [...base, TODO_NEW_TASK_ID]
    order = reorderWithInsert(order, config.dragId, config.insertAfterId)
    return {
      rowOrder: order.filter((id) => id !== config.checkOffId),
      newTaskText: newTaskFull,
      showNewRow: true,
      checkedId: config.checkOffId,
      removedId: config.checkOffId,
      timerMin: 21,
      cursor: null,
    }
  }

  if (ms <= 0) {
    return {
      rowOrder: base,
      newTaskText: '',
      showNewRow: false,
      checkedId: null,
      removedId: null,
      timerMin: 0,
      cursor: null,
    }
  }

  let rowOrder = [...base]
  let newTaskText = ''
  let showNewRow = false
  let checkedId: string | null = null
  let removedId: string | null = null
  let cursor: AnimState['cursor'] = null

  if (ms >= addStart) {
    if (ms < typeStart) {
      cursor = { x: '38%', y: '92%' }
    } else if (ms < typeEnd) {
      showNewRow = true
      rowOrder = [...base, TODO_NEW_TASK_ID]
      const p = (ms - typeStart) / t.typeMs
      const chars = Math.max(1, Math.ceil(newTaskFull.length * p))
      newTaskText = newTaskFull.slice(0, chars)
      cursor = { x: '42%', y: `${78 + (1 - p) * 6}%` }
    } else {
      showNewRow = true
      rowOrder = [...base, TODO_NEW_TASK_ID]
      newTaskText = newTaskFull
    }
  }

  if (ms >= dragStart) {
    showNewRow = true
    newTaskText = newTaskFull
    rowOrder = [...base, TODO_NEW_TASK_ID]
    const dragP = Math.min(1, (ms - dragStart) / t.dragMs)
    if (dragP >= 0.55) {
      rowOrder = reorderWithInsert(rowOrder, config.dragId, config.insertAfterId)
    }
    if (ms < dragEnd) {
      const fromY = 52
      const toY = 28
      cursor = {
        x: `${34 + dragP * 8}%`,
        y: `${fromY - dragP * (fromY - toY)}%`,
      }
    }
  }

  if (ms >= checkStart) {
    rowOrder = reorderWithInsert([...base, TODO_NEW_TASK_ID], config.dragId, config.insertAfterId)
    newTaskText = newTaskFull
    showNewRow = true
    checkedId = config.checkOffId
    const checkP = (ms - checkStart) / t.checkMs
    if (ms < checkEnd) {
      cursor = { x: '14%', y: '18%' }
      if (checkP > 0.5) removedId = config.checkOffId
    } else {
      removedId = config.checkOffId
      rowOrder = rowOrder.filter((id) => id !== config.checkOffId)
    }
  }

  return {
    rowOrder,
    newTaskText,
    showNewRow,
    checkedId,
    removedId,
    timerMin: todoTimerMin(ms),
    cursor,
  }
}

function rowLabel(
  id: string,
  state: AnimState,
  textById: Record<string, string>,
  newTaskFull: string
): string {
  if (id === TODO_NEW_TASK_ID) {
    return state.newTaskText || newTaskFull.slice(0, 1) || '…'
  }
  const text = textById[id]
  return text && text.trim().length > 0 ? text : 'Task'
}

function TodoListRow({
  id,
  text,
  checked,
  fadingOut,
}: {
  id: string
  text: string
  checked?: boolean
  fadingOut?: boolean
}) {
  return (
    <motion.div
      layout
      layoutId={`todo-row-${id}`}
      role="listitem"
      initial={false}
      animate={{ opacity: fadingOut ? 0 : 1, height: fadingOut ? 0 : 'auto' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="flex items-center gap-3 px-3 py-2.5 border-b border-[#e8e4dc] last:border-b-0 overflow-hidden"
    >
      <span
        className={clsx(
          'w-[18px] h-[18px] rounded-full border shrink-0 flex items-center justify-center',
          checked
            ? 'border-[#9a958c] bg-[#9a958c]'
            : 'border-[#b8b4ac] bg-[#fafafa]'
        )}
        aria-hidden
      >
        {checked ? (
          <svg width="10" height="8" viewBox="0 0 10 8" className="text-white">
            <path
              d="M1 4 L3.5 6.5 L9 1"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <p
        className={clsx(
          'text-[13px] text-[#3d3a36] leading-snug min-w-0 flex-1',
          checked && 'line-through text-[#9a958c]'
        )}
      >
        {text}
      </p>
    </motion.div>
  )
}

export default function TodoAppTab({
  paused,
  reducedMotion,
  onComplete,
}: {
  paused: boolean
  reducedMotion: boolean
  onComplete: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const { persona } = useLandingPersona()
  const inView = useInView(rootRef, { amount: 0.35, once: false })
  const [elapsed, setElapsed] = useState(0)

  const initialRows = useMemo(() => todoMessyRows(persona), [persona])
  const config = useMemo(() => todoTabAnimConfig(persona), [persona])
  const baseOrder = useMemo(() => initialRows.map((r) => r.id), [initialRows])
  const textById = useMemo(
    () => Object.fromEntries(initialRows.map((r) => [r.id, r.text])),
    [initialRows]
  )
  const newTaskFull = config.newTaskText

  const enabled = inView && !reducedMotion

  const onTick = useCallback((e: number) => setElapsed(e), [])
  useComparisonTimeline(`todo-tab-${persona}`, DURATION, enabled, paused, onTick, onComplete)

  const state = useMemo(
    () =>
      stateFromElapsed(
        reducedMotion ? todoTabDurationMs() : elapsed,
        !!reducedMotion,
        baseOrder,
        config,
        newTaskFull
      ),
    [elapsed, reducedMotion, baseOrder, config, newTaskFull]
  )

  const displayOrder = state.rowOrder.filter((id) => {
    if (id === TODO_NEW_TASK_ID) return state.showNewRow
    return Boolean(textById[id] || id === TODO_NEW_TASK_ID)
  })

  const taskCount = state.showNewRow ? initialRows.length + 1 : initialRows.length

  return (
    <div ref={rootRef} className="relative min-h-[300px] pointer-events-none select-none">
      <div className="absolute top-0 right-0 text-[11px] text-[#6b6560] font-medium tabular-nums z-10">
        Time spent organizing: <span className="text-[#3d3a36]">{state.timerMin} min</span>
      </div>

      <div className="pt-6 max-w-[92%]">
        <div className="flex items-baseline justify-between gap-3 mb-1 pr-2">
          <h3 className="text-[15px] font-semibold text-[#3d3a36]">My Tasks</h3>
          <span className="text-[11px] text-[#9a958c]">{taskCount} tasks</span>
        </div>

        <LayoutGroup id={`todo-comparison-${persona}`}>
          <div
            role="list"
            className="border border-[#e8e4dc] rounded-md bg-white overflow-hidden"
          >
            <AnimatePresence initial={false}>
              {displayOrder.map((id) => {
                const text = rowLabel(id, state, textById, newTaskFull)
                const isChecked = state.checkedId === id
                const fading = state.removedId === id
                if (!text.trim()) return null
                return (
                  <TodoListRow
                    key={id}
                    id={id}
                    text={text}
                    checked={isChecked}
                    fadingOut={fading}
                  />
                )
              })}
            </AnimatePresence>
            <div
              role="listitem"
              className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-[#9a958c] border-t border-[#e8e4dc] bg-[#fafafa]"
            >
              <span className="text-lg leading-none font-light text-[#b8b4ac]" aria-hidden>
                +
              </span>
              Add task
            </div>
          </div>
        </LayoutGroup>
      </div>

      {state.cursor ? (
        <motion.div
          className="absolute z-30 pointer-events-none"
          animate={{ left: state.cursor.x, top: state.cursor.y }}
          transition={{ type: 'spring', stiffness: 160, damping: 22 }}
        >
          <svg width="14" height="22" viewBox="0 0 14 22" className="drop-shadow-sm">
            <path
              d="M0 0 L0 16.5 L3.4 12.4 L6.6 20.6 L8.9 19.4 L5.9 11.2 L10.2 11.2 Z"
              fill="#6b6560"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </motion.div>
      ) : null}
    </div>
  )
}
