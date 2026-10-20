import type { DbClient } from './db-client'
import { wrapSupabaseError } from './errors'

export type SuggestionTypeMetricsRow = {
  type: string
  shown: number
  accepted: number
  dismissed: number
  undone: number
  acceptanceRate: string
  undoRate: string
  retentionRate: string
}

export function formatMetricRate(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return '—'
  }
  return `${Math.round((numerator / denominator) * 1000) / 10}%`
}

type StatusCounts = Map<string, number>

function bump(map: StatusCounts, status: string, delta = 1) {
  map.set(status, (map.get(status) ?? 0) + delta)
}

export async function getSuggestionTypeMetrics(
  client: DbClient,
  workspaceId: string
): Promise<SuggestionTypeMetricsRow[]> {
  const [suggestionsRes, eventsRes] = await Promise.all([
    client
      .from('suggestions')
      .select('id, type, status')
      .eq('workspace_id', workspaceId),
    client
      .from('events')
      .select('name, props')
      .eq('workspace_id', workspaceId)
      .in('name', ['adaptation_retained', 'adaptation_abandoned', 'suggestion_shown']),
  ])

  if (suggestionsRes.error) {
    throw wrapSupabaseError('Failed to load suggestions for metrics', suggestionsRes.error)
  }
  if (eventsRes.error) {
    throw wrapSupabaseError('Failed to load events for metrics', eventsRes.error)
  }

  const byType = new Map<string, StatusCounts>()
  const suggestionTypeById = new Map<string, string>()

  for (const row of suggestionsRes.data ?? []) {
    suggestionTypeById.set(row.id, row.type)
    const counts = byType.get(row.type) ?? new Map<string, number>()
    switch (row.status) {
      case 'shown':
        bump(counts, 'shown')
        break
      case 'accepted':
        bump(counts, 'shown')
        bump(counts, 'accepted')
        break
      case 'dismissed':
        bump(counts, 'shown')
        bump(counts, 'dismissed')
        break
      case 'undone':
        bump(counts, 'shown')
        bump(counts, 'accepted')
        bump(counts, 'undone')
        break
      default:
        break
    }
    byType.set(row.type, counts)
  }

  const retainedByType = new Map<string, number>()
  const abandonedByType = new Map<string, number>()

  for (const event of eventsRes.data ?? []) {
    const props = event.props as Record<string, unknown>
    const suggestionId = props.suggestion_id
    const type =
      typeof props.suggestion_type === 'string'
        ? props.suggestion_type
        : typeof suggestionId === 'string'
          ? suggestionTypeById.get(suggestionId)
          : undefined
    if (!type) {
      continue
    }
    if (event.name === 'adaptation_retained') {
      retainedByType.set(type, (retainedByType.get(type) ?? 0) + 1)
    }
    if (event.name === 'adaptation_abandoned') {
      abandonedByType.set(type, (abandonedByType.get(type) ?? 0) + 1)
    }
  }

  const types = [...new Set([...byType.keys(), ...retainedByType.keys(), ...abandonedByType.keys()])]
  types.sort()

  return types.map((type) => {
    const counts = byType.get(type) ?? new Map<string, number>()
    const shown = counts.get('shown') ?? 0
    const accepted = counts.get('accepted') ?? 0
    const dismissed = counts.get('dismissed') ?? 0
    const undone = counts.get('undone') ?? 0
    const retained = retainedByType.get(type) ?? 0
    const abandoned = abandonedByType.get(type) ?? 0
    const evaluated = retained + abandoned

    return {
      type,
      shown,
      accepted,
      dismissed,
      undone,
      acceptanceRate: formatMetricRate(accepted, shown),
      undoRate: formatMetricRate(undone, accepted),
      retentionRate: formatMetricRate(retained, evaluated),
    }
  })
}
