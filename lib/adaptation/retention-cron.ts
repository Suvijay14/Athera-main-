import type { AppEvent } from '@/lib/db/schemas'

const RETENTION_EVENT_NAMES = ['adaptation_retained', 'adaptation_abandoned'] as const

export function hasRetentionDecisionLogged(
  events: AppEvent[],
  suggestionId: string
): boolean {
  return events.some((e) => {
    if (!RETENTION_EVENT_NAMES.includes(e.name as (typeof RETENTION_EVENT_NAMES)[number])) {
      return false
    }
    return e.props.suggestion_id === suggestionId
  })
}
