import { scaleLandingDemoMs } from '@/lib/landing/constants'

export const TODO_TAB_TIMING = {
  initialHold: scaleLandingDemoMs(1500),
  addCursorMs: scaleLandingDemoMs(450),
  typeMs: scaleLandingDemoMs(2000),
  afterAddMs: scaleLandingDemoMs(350),
  dragMs: scaleLandingDemoMs(2200),
  checkMs: scaleLandingDemoMs(2000),
  finalHold: scaleLandingDemoMs(2500),
} as const

export const TODO_NEW_TASK_ID = 'todo-new-task'

export function todoTabDurationMs(): number {
  const t = TODO_TAB_TIMING
  return (
    t.initialHold +
    t.addCursorMs +
    t.typeMs +
    t.afterAddMs +
    t.dragMs +
    t.checkMs +
    t.finalHold
  )
}

export function todoTimerMin(elapsed: number): number {
  const t = TODO_TAB_TIMING
  const addEnd = t.initialHold + t.addCursorMs + t.typeMs + t.afterAddMs
  const dragEnd = addEnd + t.dragMs
  const checkEnd = dragEnd + t.checkMs

  if (elapsed < addEnd) {
    const p = Math.max(0, elapsed - t.initialHold) / (addEnd - t.initialHold)
    return Math.round(p * 6)
  }
  if (elapsed < dragEnd) {
    const p = (elapsed - addEnd) / t.dragMs
    return Math.round(6 + p * 8)
  }
  if (elapsed < checkEnd) {
    const p = (elapsed - dragEnd) / t.checkMs
    return Math.round(14 + p * 7)
  }
  return 21
}

export type TodoTabAnimPhase = 'hold' | 'add' | 'type' | 'drag' | 'check' | 'done'

export function todoTabPhase(elapsed: number): TodoTabAnimPhase {
  const t = TODO_TAB_TIMING
  if (elapsed < t.initialHold) return 'hold'
  if (elapsed < t.initialHold + t.addCursorMs) return 'add'
  if (elapsed < t.initialHold + t.addCursorMs + t.typeMs) return 'type'
  if (elapsed < t.initialHold + t.addCursorMs + t.typeMs + t.afterAddMs + t.dragMs) return 'drag'
  if (elapsed < todoTabDurationMs() - t.finalHold) return 'check'
  return 'done'
}
