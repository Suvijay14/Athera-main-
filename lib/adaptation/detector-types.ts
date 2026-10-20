import type { StoredItemExtraction } from '@/lib/db/item-entity-extractions'
import type {
  FieldDefinition,
  RecurrenceRule,
  Suggestion,
  ViewDefinition,
  WorkItem,
} from '@/lib/db/schemas'

import type { Operation } from './types'

export type DetectionContext = {
  workspaceId: string
  workspaceCreatedAt: string
  /** True when workspace is younger than 7 days — lowers entity + calendar thresholds only. */
  isFirstWeek: boolean
  items: WorkItem[]
  fields: FieldDefinition[]
  views: ViewDefinition[]
  recurrenceRules: RecurrenceRule[]
  recentSuggestions: Suggestion[]
  itemExtractions?: StoredItemExtraction[]
  now: Date
}

export type SuggestionDraft = {
  type: string
  reason: string
  evidence: Record<string, unknown>
  confidence: number
  operations: Operation[]
  dedupeKey: string
}

export type Detector = (ctx: DetectionContext) => SuggestionDraft | null
