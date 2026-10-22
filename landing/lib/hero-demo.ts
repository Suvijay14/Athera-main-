import { heroStoryPack, type HeroStoryPack, type PersonaKey } from '@/demo-data'
import { ATHERA_CALENDAR_SUGGESTION } from '@/lib/landing/comparison-demo'

export { ATHERA_CALENDAR_SUGGESTION }

export type { HeroStoryPack }

export function buildHeroStoryDemo(persona: PersonaKey): HeroStoryPack {
  return heroStoryPack(persona)
}

export const HERO_STORY_MS = {
  step1End: 2000,
  step2End: 5500,
  step3End: 10000,
  step4End: 15500,
  loopEnd: 18000,
  cleanStagger: 100,
  clusterAt: 2700,
  suggestHold: 3000,
  cursorMs: 600,
  sidebarMs: 600,
  calendarSuggestHold: 3500,
  calendarHold: 2000,
  personalHold: 1500,
  loopFade: 1000,
} as const

export function heroStoryDurationMs(): number {
  return HERO_STORY_MS.loopEnd
}

export type HeroStoryStep = 0 | 1 | 2 | 3 | 4

export const HERO_STORY_STEPS: HeroStoryStep[] = [0, 1, 2, 3, 4]

export function heroStoryStepIndex(elapsed: number): HeroStoryStep {
  if (elapsed < HERO_STORY_MS.step1End) return 0
  if (elapsed < HERO_STORY_MS.step2End) return 1
  if (elapsed < HERO_STORY_MS.step3End) return 2
  if (elapsed < HERO_STORY_MS.step4End) return 3
  return 4
}

export function heroStepStart(step: HeroStoryStep): number {
  switch (step) {
    case 0:
      return 0
    case 1:
      return HERO_STORY_MS.step1End
    case 2:
      return HERO_STORY_MS.step2End
    case 3:
      return HERO_STORY_MS.step3End
    case 4:
      return HERO_STORY_MS.step4End
  }
}

export function heroStepEndExclusive(step: HeroStoryStep): number {
  switch (step) {
    case 0:
      return HERO_STORY_MS.step1End
    case 1:
      return HERO_STORY_MS.step2End
    case 2:
      return HERO_STORY_MS.step3End
    case 3:
      return HERO_STORY_MS.step4End
    case 4:
      return HERO_STORY_MS.loopEnd
  }
}

/** Elapsed time that holds the final frame of a story step (for manual navigation). */
export function heroStepHoldElapsed(step: HeroStoryStep): number {
  return heroStepEndExclusive(step) - 1
}

export function heroStoryProgressInStep(elapsed: number, step: HeroStoryStep): number {
  const start = heroStepStart(step)
  const end = heroStepEndExclusive(step)
  if (elapsed <= start) return 0
  if (elapsed >= end - 1) return 1
  return (elapsed - start) / (end - start)
}

export type HeroStoryFlags = {
  step: HeroStoryStep
  plainTodo: boolean
  cleanIndex: number
  showClusters: boolean
  showSuggestion: boolean
  splitApplied: boolean
  sidebarVisible: boolean
  activeSpace: 0 | 1
  headerTitle: string
  showViewTabs: boolean
  showCalendarTab: boolean
  viewMode: 'list' | 'calendar'
  studentGrouped: boolean
  showCalendarSuggestion: boolean
  cursorTarget: 'none' | 'split' | 'calendarShow' | 'personalSpace'
  cursorClick: boolean
}

export function heroStoryFlagsFromElapsed(elapsed: number, pack: HeroStoryPack): HeroStoryFlags {
  const t = HERO_STORY_MS
  const [space0, space1] = pack.spaceNames

  const step = heroStoryStepIndex(elapsed)
  const plainTodo = elapsed < t.step1End

  let cleanIndex = 0
  if (elapsed >= t.step1End) {
    cleanIndex = Math.min(
      pack.items.length,
      Math.floor((elapsed - t.step1End) / t.cleanStagger) + 1
    )
  }

  const showClusters = elapsed >= t.clusterAt && elapsed < t.step3End
  const suggestStart = t.step2End
  const cursorStart = suggestStart + t.suggestHold
  const splitAt = cursorStart + t.cursorMs
  const splitApplied = elapsed >= splitAt
  const showSuggestion = elapsed >= suggestStart && elapsed < splitAt

  const sidebarVisible = splitApplied
  const activeSpace: 0 | 1 = elapsed >= t.step4End ? 1 : 0

  let headerTitle = 'My tasks'
  if (showClusters && !splitApplied) headerTitle = 'My tasks'
  else if (splitApplied && activeSpace === 0) headerTitle = space0
  else if (splitApplied && activeSpace === 1) headerTitle = space1

  const showViewTabs = splitApplied && elapsed >= t.step3End
  const calSuggestStart = t.step3End
  const calCursorStart = calSuggestStart + t.calendarSuggestHold
  const calendarApplied = calCursorStart + t.cursorMs
  const showCalendarTab =
    showViewTabs && activeSpace === 0 && elapsed >= calendarApplied && elapsed < t.step4End
  const viewMode: 'list' | 'calendar' =
    activeSpace === 0 && showViewTabs && elapsed >= calendarApplied && elapsed < t.step4End
      ? 'calendar'
      : 'list'

  const studentGrouped =
    showViewTabs &&
    viewMode === 'list' &&
    elapsed >= t.step3End &&
    elapsed < calendarApplied

  const showCalendarSuggestion =
    showViewTabs &&
    activeSpace === 0 &&
    elapsed >= calSuggestStart &&
    elapsed < calendarApplied

  let cursorTarget: HeroStoryFlags['cursorTarget'] = 'none'
  let cursorClick = false
  if (elapsed >= cursorStart && elapsed < splitAt) {
    cursorTarget = 'split'
    cursorClick = elapsed >= cursorStart + t.cursorMs * 0.65
  } else if (elapsed >= calCursorStart && elapsed < calendarApplied) {
    cursorTarget = 'calendarShow'
    cursorClick = elapsed >= calCursorStart + t.cursorMs * 0.65
  } else if (elapsed >= t.step4End && elapsed < t.step4End + t.personalHold * 0.4) {
    cursorTarget = 'personalSpace'
    cursorClick = elapsed >= t.step4End + 180
  }

  return {
    step,
    plainTodo,
    cleanIndex,
    showClusters,
    showSuggestion,
    splitApplied,
    sidebarVisible,
    activeSpace,
    headerTitle,
    showViewTabs,
    showCalendarTab,
    viewMode,
    studentGrouped,
    showCalendarSuggestion,
    cursorTarget,
    cursorClick,
  }
}
