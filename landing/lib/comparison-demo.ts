import {
  formatDemoItemLine,
  getPersonaDemo,
  listItemsForComparison,
  primaryGroupForPersona,
  quietEntitySuggestion,
  weekdayIndex,
  workspaceLabel,
  type PersonaKey,
} from '@/demo-data'
import { ATHERA_COMMAND_PLACEHOLDER } from '@/src/components/athera-ui'
import { scaleLandingDemoMs } from '@/lib/landing/constants'
import { todoTabDurationMs } from '@/lib/landing/todo-tab-demo'

export type ComparisonTask = {
  id: string
  text: string
  room: boolean
  entity: string
  weekday: number
  timeLabel: string
  hasDay: boolean
  sortOrder: number
}

export function comparisonHeader(persona: PersonaKey): string {
  return workspaceLabel(persona, 'This week')
}

export function comparisonTasksForPersona(persona: PersonaKey): ComparisonTask[] {
  const items = listItemsForComparison(persona)
  return items.map((item, index) => ({
    id: item.id,
    text: formatDemoItemLine(item),
    room:
      (persona === 'coach' || persona === 'freelancer') &&
      item.space === getPersonaDemo(persona).spaceNames[0],
    entity: item.entity || 'Other',
    weekday: weekdayIndex(item.day),
    timeLabel: item.time,
    hasDay: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(item.day),
    sortOrder: index,
  }))
}

export const COMPARISON_USER_WEEK_PROMPT = "Here's my week, organize it"

export function comparisonChatOrganizedList(persona: PersonaKey): string {
  return comparisonTasksForPersona(persona)
    .map((t) => `• ${t.text}`)
    .join('\n')
}

export function comparisonChatQuietTag(persona: PersonaKey): string {
  const tag = getPersonaDemo(persona).quietEntity.quietTag
  if (tag) return tag
  if (persona === 'coach') return 'no sessions in 3 weeks'
  return 'no reply in 3 weeks'
}

export function comparisonChatCaption(persona: PersonaKey): string {
  const q = getPersonaDemo(persona).quietEntity
  const name = q.name.split(' ')[0]
  if (persona === 'coach') {
    return `It answered on Monday. Nobody told you ${name} stopped coming.`
  }
  if (persona === 'freelancer' || persona === 'founder') {
    return `It answered on Monday. Nobody told you ${name} went quiet.`
  }
  return `It answered on Monday. Nobody told you ${name} slipped off the radar.`
}

export const COMPARISON_CAPTIONS = {
  todo: 'Every list, label, and calendar, built by hand.',
  chat: '', // use comparisonChatCaption(persona)
  athera: 'Athera noticed, drafted the check-in, and kept your week organized. You just said yes.',
} as const

export function comparisonCaption(tab: ComparisonTabId, persona: PersonaKey): string {
  if (tab === 'chat') return comparisonChatCaption(persona)
  return COMPARISON_CAPTIONS[tab]
}

export const ATHERA_CALENDAR_SUGGESTION =
  'Most of these have times. See them on a calendar?'

export const COMMAND_BAR_PLACEHOLDER = ATHERA_COMMAND_PLACEHOLDER

export const ATHERA_QUIET_TIMING = {
  weeksLaterHold: scaleLandingDemoMs(700),
  quietSuggestHold: scaleLandingDemoMs(3500),
  cursorGlide: scaleLandingDemoMs(650),
  clickDuration: scaleLandingDemoMs(220),
  draftHold: scaleLandingDemoMs(2800),
  afterQuietHold: scaleLandingDemoMs(900),
} as const

export const ATHERA_VIEW_TIMING = {
  messyHold: scaleLandingDemoMs(2000),
  suggestHold: scaleLandingDemoMs(4000),
  cursorGlide: scaleLandingDemoMs(650),
  clickDuration: scaleLandingDemoMs(220),
  afterGroupHold: scaleLandingDemoMs(1200),
  calendarSuggestHold: scaleLandingDemoMs(3500),
  calendarHold: scaleLandingDemoMs(3000),
} as const

export function atheraQuietPhaseEndMs(): number {
  const q = ATHERA_QUIET_TIMING
  return (
    q.weeksLaterHold +
    q.quietSuggestHold +
    q.cursorGlide +
    q.clickDuration +
    q.draftHold +
    q.afterQuietHold
  )
}

export function atheraComparisonDurationMs(): number {
  const t = ATHERA_VIEW_TIMING
  const base = atheraQuietPhaseEndMs()
  const groupEnd = base + t.messyHold + t.suggestHold + t.cursorGlide + t.clickDuration
  const calSuggestStart = groupEnd + t.afterGroupHold
  const calClickEnd = calSuggestStart + t.calendarSuggestHold + t.cursorGlide + t.clickDuration
  return calClickEnd + t.calendarHold
}

export type AtheraComparisonFlags = {
  showWeeksLater: boolean
  showQuietSuggestion: boolean
  showQuietDraft: boolean
  showWorkspace: boolean
  grouped: boolean
  activeView: 'list' | 'calendar'
  showCalendarTab: boolean
  showGroupSuggestion: boolean
  showCalendarSuggestion: boolean
  labels: string[]
  cursorTarget: 'none' | 'quietRemind' | 'group' | 'calendarShow' | 'calendarTab'
  cursorActive: boolean
  cursorClick: boolean
}

export function atheraComparisonFlagsFromElapsed(
  elapsed: number,
  reduced: boolean,
  groupSideLabel: string
): AtheraComparisonFlags {
  const q = ATHERA_QUIET_TIMING
  const t = ATHERA_VIEW_TIMING
  const quietEnd = atheraQuietPhaseEndMs()

  if (reduced) {
    return {
      showWeeksLater: false,
      showQuietSuggestion: false,
      showQuietDraft: true,
      showWorkspace: true,
      grouped: true,
      activeView: 'calendar',
      showCalendarTab: true,
      showGroupSuggestion: false,
      showCalendarSuggestion: false,
      labels: [groupSideLabel, '+ Calendar view'],
      cursorTarget: 'none',
      cursorActive: false,
      cursorClick: false,
    }
  }

  const quietSuggestStart = q.weeksLaterHold
  const quietCursorStart = quietSuggestStart + q.quietSuggestHold
  const quietClickEnd = quietCursorStart + q.cursorGlide + q.clickDuration
  const showWeeksLater = elapsed < quietEnd
  const showQuietSuggestion = elapsed >= quietSuggestStart && elapsed < quietClickEnd
  const showQuietDraft = elapsed >= quietClickEnd && elapsed < quietEnd
  const showWorkspace = elapsed >= quietEnd

  const workspaceElapsed = Math.max(0, elapsed - quietEnd)
  const suggestStart = t.messyHold
  const groupCursorStart = suggestStart + t.suggestHold
  const groupClickEnd = groupCursorStart + t.cursorGlide + t.clickDuration
  const calSuggestStart = groupClickEnd + t.afterGroupHold
  const calCursorStart = calSuggestStart + t.calendarSuggestHold
  const calClickEnd = calCursorStart + t.cursorGlide + t.clickDuration

  const grouped = showWorkspace && workspaceElapsed >= groupClickEnd
  const showCalendarTab = showWorkspace && workspaceElapsed >= calClickEnd
  const activeView: 'list' | 'calendar' =
    showWorkspace && workspaceElapsed >= calClickEnd ? 'calendar' : 'list'

  const labels: string[] = []
  if (grouped) labels.push(groupSideLabel)
  if (showCalendarTab) labels.push('+ Calendar view')

  let cursorTarget: AtheraComparisonFlags['cursorTarget'] = 'none'
  let cursorActive = false
  let cursorClick = false

  if (elapsed >= quietCursorStart && elapsed < quietClickEnd) {
    cursorTarget = 'quietRemind'
    cursorActive = true
    cursorClick = elapsed >= quietCursorStart + q.cursorGlide
  } else if (showWorkspace && workspaceElapsed >= groupCursorStart && workspaceElapsed < groupClickEnd) {
    cursorTarget = 'group'
    cursorActive = true
    cursorClick = workspaceElapsed >= groupCursorStart + t.cursorGlide
  } else if (showWorkspace && workspaceElapsed >= calCursorStart && workspaceElapsed < calClickEnd) {
    cursorTarget = 'calendarShow'
    cursorActive = true
    cursorClick = workspaceElapsed >= calCursorStart + t.cursorGlide
  }

  return {
    showWeeksLater,
    showQuietSuggestion,
    showQuietDraft,
    showWorkspace,
    grouped,
    activeView,
    showCalendarTab,
    showGroupSuggestion:
      showWorkspace && workspaceElapsed >= suggestStart && workspaceElapsed < groupClickEnd,
    showCalendarSuggestion:
      grouped && showWorkspace && workspaceElapsed >= calSuggestStart && workspaceElapsed < calClickEnd,
    labels,
    cursorTarget,
    cursorActive,
    cursorClick,
  }
}

export const COMPARISON_TAB_DURATION_MS = {
  todo: todoTabDurationMs(),
  chat: scaleLandingDemoMs(14_000),
  athera: atheraComparisonDurationMs(),
} as const

export type ComparisonTabId = 'todo' | 'chat' | 'athera'

export const COMPARISON_TABS: { id: ComparisonTabId; label: string }[] = [
  { id: 'todo', label: 'To-do app' },
  { id: 'chat', label: 'AI chatbots' },
  { id: 'athera', label: 'Athera' },
]

export function groupedItemIdsForPersona(persona: PersonaKey): string[] {
  return primaryGroupForPersona(persona).groupedItemIds
}

export function flatTaskBullets(persona: PersonaKey): string {
  return comparisonTasksForPersona(persona)
    .map((t) => `• ${t.text}`)
    .join('\n')
}

export function groupedTaskBullets(persona: PersonaKey): string {
  const tasks = comparisonTasksForPersona(persona)
  const byKey = new Map<string, ComparisonTask[]>()
  for (const t of tasks) {
    const key = t.entity
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(t)
  }
  const lines: string[] = []
  for (const [name, group] of byKey) {
    lines.push(name)
    for (const t of group) lines.push(`  • ${t.text}`)
    lines.push('')
  }
  return lines.join('\n').trim()
}

export function atheraQuietSuggestion(persona: PersonaKey): string {
  return quietEntitySuggestion(persona)
}
