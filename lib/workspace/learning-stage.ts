import { describe } from '@/lib/adaptation/operations'
import { parseSuggestionOperations } from '@/lib/adaptation/preview-build'
import type { ChangeLogListItem } from '@/lib/db/change-log'

export type LearningStage = 1 | 2 | 3

export type LearningStageInfo = {
  stage: LearningStage
  label: string
  itemCount: number
  activeAdaptationCount: number
}

export function computeLearningStage(
  itemCount: number,
  activeAdaptationCount: number
): LearningStageInfo {
  let stage: LearningStage = 1
  let label = 'Getting to know you'

  if (itemCount >= 10 && activeAdaptationCount >= 2) {
    stage = 3
    label = 'Tailored to you'
  } else if (itemCount >= 10) {
    stage = 2
    label = 'Learning your patterns'
  }

  return {
    stage,
    label,
    itemCount,
    activeAdaptationCount,
  }
}

export function summarizeActiveChange(entry: ChangeLogListItem): string {
  const ops = parseSuggestionOperations(entry.operations)
  if (ops.length === 0) {
    return entry.suggestionReason
  }
  return ops.map((op) => describe(op)).join(', ')
}
