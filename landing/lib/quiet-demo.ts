import { scaleLandingDemoMs } from '@/lib/landing/constants'

export const QUIET_DEMO_TIMING = {
  initialHold: scaleLandingDemoMs(2000),
  suggestionHold: scaleLandingDemoMs(4500),
  cursorGlide: scaleLandingDemoMs(650),
  clickDuration: scaleLandingDemoMs(220),
  resultHold: scaleLandingDemoMs(3000),
} as const

export type QuietDemoVariant = 'remind' | 'archive'

export type QuietDemoFlags = {
  spotlight: boolean
  showUsually: boolean
  showSuggestion: boolean
  cursorTarget: 'none' | 'remind' | 'archive'
  cursorActive: boolean
  cursorClick: boolean
  showFollowUp: boolean
  archived: boolean
  sideLabel: string | null
  rowDimmed: (isQuiet: boolean) => boolean
}

export function quietDemoHalfDurationMs(): number {
  const t = QUIET_DEMO_TIMING
  const cursorEnd = t.initialHold + t.suggestionHold + t.cursorGlide + t.clickDuration
  return cursorEnd + t.resultHold
}

export function quietDemoLoopDurationMs(): number {
  return quietDemoHalfDurationMs() * 2
}

export function quietDemoFlagsFromElapsed(
  elapsed: number,
  variant: QuietDemoVariant,
  reduced: boolean
): QuietDemoFlags {
  const t = QUIET_DEMO_TIMING

  if (reduced) {
    return {
      spotlight: true,
      showUsually: true,
      showSuggestion: false,
      cursorTarget: 'none',
      cursorActive: false,
      cursorClick: false,
      showFollowUp: variant === 'remind',
      archived: variant === 'archive',
      sideLabel: variant === 'remind' ? '+ Follow-up added' : null,
      rowDimmed: (isQuiet) => !isQuiet,
    }
  }

  const spotlightAt = t.initialHold
  const suggestAt = spotlightAt
  const cursorStart = suggestAt + t.suggestionHold
  const actionAt = cursorStart + t.cursorGlide + t.clickDuration

  const spotlight = elapsed >= spotlightAt
  const showSuggestion = elapsed >= suggestAt && elapsed < actionAt
  const showUsually = spotlight && elapsed >= spotlightAt && elapsed < actionAt

  let cursorTarget: QuietDemoFlags['cursorTarget'] = 'none'
  let cursorActive = false
  let cursorClick = false

  if (elapsed >= cursorStart && elapsed < actionAt) {
    cursorTarget = variant === 'remind' ? 'remind' : 'archive'
    cursorActive = true
    cursorClick = elapsed >= cursorStart + t.cursorGlide
  }

  const showFollowUp = variant === 'remind' && elapsed >= actionAt
  const archived = variant === 'archive' && elapsed >= actionAt
  const sideLabel =
    elapsed >= actionAt && variant === 'remind' ? '+ Follow-up added' : null

  const rowDimmed = (isQuiet: boolean) => {
    if (!spotlight || elapsed >= actionAt) return false
    return !isQuiet
  }

  return {
    spotlight,
    showUsually,
    showSuggestion,
    cursorTarget,
    cursorActive,
    cursorClick,
    showFollowUp,
    archived,
    sideLabel,
    rowDimmed,
  }
}

export function quietDemoVariantAtElapsed(elapsed: number): QuietDemoVariant {
  const half = quietDemoHalfDurationMs()
  const inSecondHalf = elapsed >= half
  return inSecondHalf ? 'archive' : 'remind'
}

export function quietDemoElapsedInHalf(elapsed: number): number {
  const half = quietDemoHalfDurationMs()
  return elapsed >= half ? elapsed - half : elapsed
}
