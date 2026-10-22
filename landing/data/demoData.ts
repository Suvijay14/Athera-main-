export type PersonaKey = 'freelancer' | 'coach' | 'founder' | 'personal'

export const PERSONA_URL_ALIASES: Record<string, PersonaKey> = {
  tutoring: 'coach',
}

export const DEFAULT_PERSONA: PersonaKey = 'freelancer'

export type DemoItemType =
  | 'session'
  | 'class'
  | 'appointment'
  | 'errand'
  | 'car'
  | 'form'
  | 'invoice'
  | 'event'
  | 'party'
  | 'job'
  | 'client_work'
  | 'call'
  | 'investor'
  | 'hiring'

/** Lucide icon keys used across landing demos */
export type DemoIconKey =
  | 'graduation-cap'
  | 'book-open'
  | 'heart-pulse'
  | 'shopping-cart'
  | 'car'
  | 'file-text'
  | 'receipt'
  | 'calendar'
  | 'gift'
  | 'briefcase'
  | 'phone'
  | 'trending-up'
  | 'user-plus'

export const ICON_BY_ITEM_TYPE: Record<DemoItemType, DemoIconKey> = {
  session: 'graduation-cap',
  class: 'book-open',
  appointment: 'heart-pulse',
  errand: 'shopping-cart',
  car: 'car',
  form: 'file-text',
  invoice: 'receipt',
  event: 'calendar',
  party: 'gift',
  job: 'briefcase',
  client_work: 'briefcase',
  call: 'phone',
  investor: 'trending-up',
  hiring: 'user-plus',
}

export type DemoItem = {
  id: string
  title: string
  entity: string
  day: string
  time: string
  space: string
  type: DemoItemType
}

export type RepeatItem = {
  label: string
  schedule: string
  /** Matches DemoItem.id when applicable */
  itemId?: string
}

export type QuietEntity = {
  name: string
  usually: string
  lastActivity: string
  /** Full line in quiet suggestion cards (optional). */
  suggestionLine?: string
  /** Gray tag in AI chatbots sidebar (optional). */
  quietTag?: string
}

export type PersonaDemoData = {
  workspaceName: string
  spaceNames: [string, string]
  entityKind: string
  items: DemoItem[]
  repeatItem: RepeatItem
  quietEntity: QuietEntity
}

export const DEMO_BY_PERSONA: Record<PersonaKey, PersonaDemoData> = {
  freelancer: {
    workspaceName: 'North Studio',
    spaceNames: ['Clients', 'Personal'],
    entityKind: 'Client',
    items: [
      {
        id: 'rivera-site',
        title: 'Site review',
        entity: 'Rivera Bakery',
        day: 'Tue',
        time: '2pm',
        space: 'Clients',
        type: 'client_work',
      },
      {
        id: 'dentist',
        title: 'Dentist',
        entity: '',
        day: 'Tue',
        time: '3pm',
        space: 'Personal',
        type: 'appointment',
      },
      {
        id: 'lumen-update',
        title: 'Weekly update',
        entity: 'Lumen Health',
        day: 'Fri',
        time: '',
        space: 'Clients',
        type: 'client_work',
      },
      {
        id: 'rivera-call',
        title: 'Call with Maria',
        entity: 'Rivera Bakery',
        day: 'Thu',
        time: '11am',
        space: 'Clients',
        type: 'call',
      },
      {
        id: 'groceries',
        title: 'Groceries',
        entity: '',
        day: 'Thu',
        time: '',
        space: 'Personal',
        type: 'errand',
      },
      {
        id: 'rivera-invoice',
        title: 'Invoice',
        entity: 'Rivera Bakery',
        day: '',
        time: '',
        space: 'Clients',
        type: 'invoice',
      },
      {
        id: 'lumen-kickoff',
        title: 'Kickoff',
        entity: 'Lumen Health',
        day: 'Mon',
        time: '10am',
        space: 'Clients',
        type: 'client_work',
      },
    ],
    repeatItem: {
      label: 'Lumen Health · Weekly update',
      schedule: 'Fridays',
      itemId: 'lumen-update',
    },
    quietEntity: {
      name: 'Rivera Bakery',
      usually: 'usually replies within days',
      lastActivity: "hasn't replied in 3 weeks",
      quietTag: 'no reply in 3 weeks',
      suggestionLine:
        "Rivera Bakery hasn't replied in 3 weeks. They usually reply within days.",
    },
  },
  coach: {
    workspaceName: 'Bright Path Tutoring',
    spaceNames: ['Tutoring', 'Personal'],
    entityKind: 'Student',
    items: [
      {
        id: 'chem',
        title: 'Chemistry',
        entity: 'Maya Chen',
        day: 'Mon',
        time: '3:30pm',
        space: 'Tutoring',
        type: 'session',
      },
      {
        id: 'algebra',
        title: 'Algebra',
        entity: 'Maya Chen',
        day: 'Tue',
        time: '4pm',
        space: 'Tutoring',
        type: 'session',
      },
      {
        id: 'leo-sat',
        title: 'SAT prep',
        entity: 'Leo Park',
        day: 'Tue',
        time: '5pm',
        space: 'Tutoring',
        type: 'session',
      },
      {
        id: 'reading',
        title: 'Reading',
        entity: 'Maya Chen',
        day: 'Thu',
        time: '5pm',
        space: 'Tutoring',
        type: 'session',
      },
      {
        id: 'invoice-martinez',
        title: 'Invoice',
        entity: 'Martinez family',
        day: '',
        time: '',
        space: 'Tutoring',
        type: 'invoice',
      },
      {
        id: 'ava-geo',
        title: 'Geometry',
        entity: 'Ava Nguyen',
        day: 'Sun',
        time: '2pm',
        space: 'Tutoring',
        type: 'session',
      },
      {
        id: 'dentist',
        title: 'Dentist',
        entity: '',
        day: 'Tue',
        time: '3pm',
        space: 'Personal',
        type: 'appointment',
      },
      {
        id: 'groceries',
        title: 'Groceries',
        entity: 'Costco',
        day: 'Thu',
        time: '',
        space: 'Personal',
        type: 'errand',
      },
      {
        id: 'oil',
        title: 'Oil change',
        entity: '',
        day: 'Sat',
        time: '',
        space: 'Personal',
        type: 'car',
      },
    ],
    repeatItem: { label: 'Leo Park · SAT prep', schedule: 'Tuesdays 5pm', itemId: 'leo-sat' },
    quietEntity: {
      name: 'Max Rivera',
      usually: 'usually weekly',
      lastActivity: 'last session 5 weeks ago',
      quietTag: 'no sessions in 3 weeks',
      suggestionLine: "Max Rivera hasn't had a session in 3 weeks. He usually comes weekly.",
    },
  },
  founder: {
    workspaceName: 'Acme',
    spaceNames: ['Company', 'Personal'],
    entityKind: 'Contact',
    items: [
      {
        id: 'sarah-follow',
        title: 'Investor follow-up',
        entity: 'Sarah Lee (Seed Fund)',
        day: 'Tue',
        time: '',
        space: 'Company',
        type: 'investor',
      },
      {
        id: 'lumen-call',
        title: 'Customer call',
        entity: 'Lumen Health',
        day: 'Wed',
        time: '10am',
        space: 'Company',
        type: 'call',
      },
      {
        id: 'hire-design',
        title: 'Designer interview',
        entity: 'Hiring',
        day: 'Thu',
        time: '2pm',
        space: 'Company',
        type: 'hiring',
      },
      {
        id: 'sarah-update',
        title: 'Send update',
        entity: 'Sarah Lee (Seed Fund)',
        day: 'Fri',
        time: '',
        space: 'Company',
        type: 'investor',
      },
      {
        id: 'rent',
        title: 'Rent',
        entity: '',
        day: '1st',
        time: '',
        space: 'Personal',
        type: 'invoice',
      },
      {
        id: 'gym',
        title: 'Gym',
        entity: '',
        day: 'Mon',
        time: '',
        space: 'Personal',
        type: 'appointment',
      },
      {
        id: 'roadmap',
        title: 'Product roadmap',
        entity: 'Company',
        day: 'Wed',
        time: '',
        space: 'Company',
        type: 'client_work',
      },
    ],
    repeatItem: {
      label: 'Investor update',
      schedule: 'First Friday monthly',
      itemId: 'sarah-update',
    },
    quietEntity: {
      name: 'Sarah Lee (Seed Fund)',
      usually: 'usually replies within a week',
      lastActivity: 'no reply in 4 weeks',
      quietTag: 'no reply in 4 weeks',
      suggestionLine:
        "Sarah Lee (Seed Fund) hasn't replied in 4 weeks. They usually reply within a week.",
    },
  },
  personal: {
    workspaceName: 'Our house',
    spaceNames: ['Kids', 'Home'],
    entityKind: 'Kid',
    items: [
      {
        id: 'soccer',
        title: 'Soccer practice',
        entity: 'Emma',
        day: 'Mon',
        time: '4pm',
        space: 'Kids',
        type: 'event',
      },
      {
        id: 'jake-dentist',
        title: 'Dentist',
        entity: 'Jake',
        day: 'Tue',
        time: '3pm',
        space: 'Kids',
        type: 'appointment',
      },
      {
        id: 'form',
        title: 'School form',
        entity: 'Emma',
        day: 'Wed',
        time: '',
        space: 'Kids',
        type: 'form',
      },
      {
        id: 'piano',
        title: 'Piano',
        entity: 'Emma',
        day: 'Thu',
        time: '5pm',
        space: 'Kids',
        type: 'event',
      },
      {
        id: 'party',
        title: 'Birthday',
        entity: 'Emma',
        day: 'Sun',
        time: '',
        space: 'Kids',
        type: 'party',
      },
      {
        id: 'groceries-home',
        title: 'Groceries',
        entity: 'Costco',
        day: 'Thu',
        time: '',
        space: 'Home',
        type: 'errand',
      },
      {
        id: 'oil-home',
        title: 'Oil change',
        entity: '',
        day: 'Sat',
        time: '',
        space: 'Home',
        type: 'car',
      },
      {
        id: 'rent',
        title: 'Pay rent',
        entity: '',
        day: '1st',
        time: '',
        space: 'Home',
        type: 'invoice',
      },
    ],
    repeatItem: { label: 'Emma · Piano', schedule: 'Thursdays 5pm', itemId: 'piano' },
    quietEntity: {
      name: 'Gym with Alex',
      usually: 'usually weekly',
      lastActivity: 'last went 4 weeks ago',
      quietTag: 'no visits in 4 weeks',
      suggestionLine: "Gym with Alex hasn't happened in 4 weeks. You usually go weekly.",
    },
  },
}

export function getPersonaDemo(persona: PersonaKey): PersonaDemoData {
  return DEMO_BY_PERSONA[persona]
}

export function parsePersonaParam(value: string | null | undefined): PersonaKey | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (PERSONA_URL_ALIASES[normalized]) return PERSONA_URL_ALIASES[normalized]
  if (normalized in DEMO_BY_PERSONA) return normalized as PersonaKey
  return null
}

export function formatDemoItemLine(item: DemoItem): string {
  const when = [item.day, item.time].filter(Boolean).join(' ')
  if (item.type === 'invoice' && item.entity && item.title === 'Invoice') {
    return `${item.title} · ${item.entity}`
  }
  if (item.type === 'invoice' && item.title === 'Pay rent') {
    return when ? `${item.title} · ${when}` : item.title
  }
  if (item.type === 'errand' && item.entity) {
    return when ? `${item.title} · ${item.entity} · ${when}` : `${item.title} · ${item.entity}`
  }
  if (item.entity && item.title) {
    return when ? `${item.entity} · ${item.title} · ${when}` : `${item.entity} · ${item.title}`
  }
  return when ? `${item.title} · ${when}` : item.title
}

export function workspaceLabel(persona: PersonaKey, suffix = 'This week'): string {
  const name = DEMO_BY_PERSONA[persona].workspaceName.toUpperCase()
  return `${name} · ${suffix}`
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
}

export function weekdayIndex(day: string): number {
  return WEEKDAY_INDEX[day] ?? 0
}

const WEEKDAY_LONG: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
}

export function weekdayLongLabel(day: string): string {
  return WEEKDAY_LONG[day] ?? day
}

export const SCROLL_CALENDAR_ROW_LABELS = [
  '3 weeks ago',
  '2 weeks ago',
  'Last week',
  'This week',
  'Next week',
] as const

export type ScrollRepeatStory = {
  workspaceTitle: string
  cellLabel: string
  weekdayIndex: number
  weekdayLong: string
  time: string
  suggestion: string
  repeatLabel: string
  icon: DemoIconKey
  type: DemoItemType
}

export function scrollRepeatStoryForPersona(persona: PersonaKey): ScrollRepeatStory {
  const data = DEMO_BY_PERSONA[persona]
  const repeat = data.repeatItem
  const item = repeat.itemId ? data.items.find((i) => i.id === repeat.itemId) : undefined
  const day = item?.day ?? 'Tue'
  const weekdayLong = weekdayLongLabel(day)
  const scheduleTail = repeat.schedule.replace(/^[^\s]+\s*/, '').trim()
  const time = item?.time || scheduleTail || '5pm'
  const title = repeat.label
  return {
    workspaceTitle: workspaceLabel(persona, 'This week'),
    cellLabel: title,
    weekdayIndex: weekdayIndex(day),
    weekdayLong,
    time,
    suggestion: `${title} is every ${weekdayLong} at ${time}. Make it repeat?`,
    repeatLabel: `Every ${weekdayLong} · ${time}`,
    icon: item ? ICON_BY_ITEM_TYPE[item.type] : 'calendar',
    type: item?.type ?? 'event',
  }
}

export type PrimaryGroup = {
  highlightPhrase: string
  groupedItemIds: string[]
  groupTitle: string
  viewTabLabel: string
  highlightNote: string
  suggestion: string
}

function countByEntity(items: DemoItem[], space?: string): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const item of items) {
    if (space && item.space !== space) continue
    if (!item.entity || item.type === 'invoice') continue
    const key = item.entity
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item.id)
  }
  return map
}

export function primaryGroupForPersona(persona: PersonaKey): PrimaryGroup {
  const data = DEMO_BY_PERSONA[persona]
  const primarySpace = data.spaceNames[0]
  const counts = countByEntity(data.items, primarySpace)
  let bestEntity = ''
  let bestIds: string[] = []
  for (const [entity, ids] of counts) {
    if (ids.length > bestIds.length) {
      bestEntity = entity
      bestIds = ids
    }
  }

  const kind = data.entityKind
  const plural =
    kind === 'Student'
      ? 'Students'
      : kind === 'Client'
        ? 'Clients'
        : kind === 'Contact'
          ? 'Contacts'
          : kind === 'Kid'
            ? 'Family'
            : `${kind}s`

  const n = bestIds.length
  const groupTitle = `${bestEntity} · ${kind}`

  const highlightNoteByPersona: Record<PersonaKey, string> = {
    freelancer: `${n} deliverables, same client`,
    coach: `${n} sessions, same student`,
    founder: `${n} threads, same contact`,
    personal: `${n} tasks, same kid`,
  }

  const suggestionByPersona: Record<PersonaKey, string> = {
    freelancer: `${bestEntity} has ${n} things this week. Give them a client page?`,
    coach: `${bestEntity} has ${n} sessions this week. Give her a student page?`,
    founder: `${bestEntity} has ${n} items this week. Give them a contact page?`,
    personal: `${bestEntity} has ${n} things this week. Give her a family page?`,
  }

  const highlightNote = highlightNoteByPersona[persona]
  const suggestion = suggestionByPersona[persona]

  return {
    highlightPhrase: bestEntity,
    groupedItemIds: bestIds,
    groupTitle,
    viewTabLabel: plural,
    highlightNote,
    suggestion,
  }
}

const HERO_ITEM_IDS: Record<PersonaKey, string[]> = {
  freelancer: [
    'rivera-site',
    'dentist',
    'lumen-update',
    'rivera-call',
    'groceries',
    'rivera-invoice',
    'lumen-kickoff',
  ],
  coach: [
    'algebra',
    'dentist',
    'leo-sat',
    'reading',
    'groceries',
    'invoice-martinez',
    'chem',
  ],
  founder: [
    'sarah-follow',
    'gym',
    'lumen-call',
    'hire-design',
    'sarah-update',
    'rent',
    'roadmap',
  ],
  personal: [
    'soccer',
    'jake-dentist',
    'piano',
    'form',
    'party',
    'groceries-home',
    'oil-home',
  ],
}

export type HeroStoryItem = {
  id: string
  messyTitle: string
  cleanTitle: string
  space: string
  spaceSlot: 0 | 1
  studentGroup: string
  icon: DemoIconKey
  weekday: number
  unscheduled?: boolean
}

export type HeroStoryPack = {
  persona: PersonaKey
  spaceNames: [string, string]
  clusterLabels: [string, string]
  splitSuggestion: string
  splitButtonLabel: string
  studentGroups: { label: string; ids: string[] }[]
  items: HeroStoryItem[]
  personalListIds: string[]
  captions: readonly [string, string, string, string, string]
}

const HERO_STORY: Record<PersonaKey, Omit<HeroStoryPack, 'persona'>> = {
  freelancer: {
    spaceNames: ['Clients', 'Personal'],
    clusterLabels: ['Clients · 5', 'Personal · 2'],
    splitSuggestion: 'Two kinds of things here. Split into spaces?',
    splitButtonLabel: 'Split into Clients + Personal',
    studentGroups: [
      { label: 'Rivera Bakery · 2', ids: ['rivera-site', 'rivera-call'] },
      { label: 'Lumen Health · 2', ids: ['lumen-update', 'lumen-kickoff'] },
      { label: 'Admin · 1', ids: ['rivera-invoice'] },
    ],
    items: [
      {
        id: 'rivera-site',
        messyTitle: 'rivera bakery site review tue 2pm',
        cleanTitle: 'Clients · Rivera Bakery · Site review · Tue 2pm',
        space: 'Clients',
        spaceSlot: 0,
        studentGroup: 'Rivera Bakery',
        icon: 'briefcase',
        weekday: 1,
      },
      {
        id: 'dentist',
        messyTitle: 'dentist tue 3',
        cleanTitle: 'Dentist · Tue 3pm',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'heart-pulse',
        weekday: 1,
      },
      {
        id: 'lumen-update',
        messyTitle: 'lumen weekly update fri',
        cleanTitle: 'Clients · Lumen Health · Weekly update · Fri',
        space: 'Clients',
        spaceSlot: 0,
        studentGroup: 'Lumen Health',
        icon: 'briefcase',
        weekday: 4,
      },
      {
        id: 'rivera-call',
        messyTitle: 'call maria rivera thu 11',
        cleanTitle: 'Clients · Rivera Bakery · Call with Maria · Thu 11am',
        space: 'Clients',
        spaceSlot: 0,
        studentGroup: 'Rivera Bakery',
        icon: 'phone',
        weekday: 3,
      },
      {
        id: 'groceries',
        messyTitle: 'groceries',
        cleanTitle: 'Groceries · Thu',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'shopping-cart',
        weekday: 3,
      },
      {
        id: 'rivera-invoice',
        messyTitle: 'invoice rivera bakery',
        cleanTitle: 'Invoice · Rivera Bakery',
        space: 'Clients',
        spaceSlot: 0,
        studentGroup: 'Admin',
        icon: 'receipt',
        weekday: 0,
        unscheduled: true,
      },
      {
        id: 'lumen-kickoff',
        messyTitle: 'lumen health kickoff mon 10',
        cleanTitle: 'Clients · Lumen Health · Kickoff · Mon 10am',
        space: 'Clients',
        spaceSlot: 0,
        studentGroup: 'Lumen Health',
        icon: 'briefcase',
        weekday: 0,
      },
    ],
    personalListIds: ['dentist', 'groceries'],
    captions: [
      'Your everyday to-do list',
      'Athera groups what belongs together',
      '…turns them into spaces',
      '…and each space gets its own list and calendar',
      'Switch spaces anytime',
    ],
  },
  coach: {
    spaceNames: ['Tutoring', 'Personal'],
    clusterLabels: ['Tutoring · 5', 'Personal · 2'],
    splitSuggestion: 'Two kinds of things here. Split into spaces?',
    splitButtonLabel: 'Split into Tutoring + Personal',
    studentGroups: [
      { label: 'Maya Chen · 3', ids: ['algebra', 'reading', 'chem'] },
      { label: 'Leo Park · 1', ids: ['leo-sat'] },
      { label: 'Admin · 1', ids: ['invoice-martinez'] },
    ],
    items: [
      {
        id: 'algebra',
        messyTitle: 'tutoring maya algebra tue 4pm',
        cleanTitle: 'Tutoring · Maya Chen · Algebra · Tue 4pm',
        space: 'Tutoring',
        spaceSlot: 0,
        studentGroup: 'Maya Chen',
        icon: 'graduation-cap',
        weekday: 1,
      },
      {
        id: 'dentist',
        messyTitle: 'dentist tue 3',
        cleanTitle: 'Dentist · Tue 3pm',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'heart-pulse',
        weekday: 1,
      },
      {
        id: 'leo-sat',
        messyTitle: 'tutoring leo sat prep tue 5',
        cleanTitle: 'Tutoring · Leo Park · SAT prep · Tue 5pm',
        space: 'Tutoring',
        spaceSlot: 0,
        studentGroup: 'Leo Park',
        icon: 'graduation-cap',
        weekday: 1,
      },
      {
        id: 'reading',
        messyTitle: 'maya tutoring reading thu 5pm',
        cleanTitle: 'Tutoring · Maya Chen · Reading · Thu 5pm',
        space: 'Tutoring',
        spaceSlot: 0,
        studentGroup: 'Maya Chen',
        icon: 'graduation-cap',
        weekday: 3,
      },
      {
        id: 'groceries',
        messyTitle: 'groceries',
        cleanTitle: 'Groceries · Thu',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'shopping-cart',
        weekday: 3,
      },
      {
        id: 'invoice-martinez',
        messyTitle: 'invoice martinez (tutoring)',
        cleanTitle: 'Invoice · Martinez family (tutoring)',
        space: 'Tutoring',
        spaceSlot: 0,
        studentGroup: 'Admin',
        icon: 'receipt',
        weekday: 0,
        unscheduled: true,
      },
      {
        id: 'chem',
        messyTitle: 'tutor maya chem mon 3:30',
        cleanTitle: 'Tutoring · Maya Chen · Chemistry · Mon 3:30',
        space: 'Tutoring',
        spaceSlot: 0,
        studentGroup: 'Maya Chen',
        icon: 'graduation-cap',
        weekday: 0,
      },
    ],
    personalListIds: ['dentist', 'groceries'],
    captions: [
      'Your everyday to-do list',
      'Athera groups what belongs together',
      '…turns them into spaces',
      '…and each space gets its own list and calendar',
      'Switch spaces anytime',
    ],
  },
  founder: {
    spaceNames: ['Company', 'Personal'],
    clusterLabels: ['Company · 5', 'Personal · 2'],
    splitSuggestion: 'Two kinds of things here. Split into spaces?',
    splitButtonLabel: 'Split into Company + Personal',
    studentGroups: [
      { label: 'Sarah Lee · 2', ids: ['sarah-follow', 'sarah-update'] },
      { label: 'Lumen Health · 1', ids: ['lumen-call'] },
      { label: 'Ops · 2', ids: ['hire-design', 'roadmap'] },
    ],
    items: [
      {
        id: 'sarah-follow',
        messyTitle: 'sarah lee investor follow up tue',
        cleanTitle: 'Company · Sarah Lee (Seed Fund) · Investor follow-up · Tue',
        space: 'Company',
        spaceSlot: 0,
        studentGroup: 'Sarah Lee (Seed Fund)',
        icon: 'trending-up',
        weekday: 1,
      },
      {
        id: 'gym',
        messyTitle: 'gym mon',
        cleanTitle: 'Gym · Mon',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'heart-pulse',
        weekday: 0,
      },
      {
        id: 'lumen-call',
        messyTitle: 'lumen customer call wed 10',
        cleanTitle: 'Company · Lumen Health · Customer call · Wed 10am',
        space: 'Company',
        spaceSlot: 0,
        studentGroup: 'Lumen Health',
        icon: 'phone',
        weekday: 2,
      },
      {
        id: 'hire-design',
        messyTitle: 'designer interview thu 2',
        cleanTitle: 'Company · Hiring · Designer interview · Thu 2pm',
        space: 'Company',
        spaceSlot: 0,
        studentGroup: 'Hiring',
        icon: 'user-plus',
        weekday: 3,
      },
      {
        id: 'sarah-update',
        messyTitle: 'send sarah update fri',
        cleanTitle: 'Company · Sarah Lee (Seed Fund) · Send update · Fri',
        space: 'Company',
        spaceSlot: 0,
        studentGroup: 'Sarah Lee (Seed Fund)',
        icon: 'trending-up',
        weekday: 4,
      },
      {
        id: 'rent',
        messyTitle: 'rent 1st',
        cleanTitle: 'Rent · 1st',
        space: 'Personal',
        spaceSlot: 1,
        studentGroup: 'Personal',
        icon: 'receipt',
        weekday: 0,
        unscheduled: true,
      },
      {
        id: 'roadmap',
        messyTitle: 'product roadmap wed',
        cleanTitle: 'Company · Product roadmap · Wed',
        space: 'Company',
        spaceSlot: 0,
        studentGroup: 'Company',
        icon: 'briefcase',
        weekday: 2,
      },
    ],
    personalListIds: ['gym', 'rent'],
    captions: [
      'Your everyday to-do list',
      'Athera groups what belongs together',
      '…turns them into spaces',
      '…and each space gets its own list and calendar',
      'Switch spaces anytime',
    ],
  },
  personal: {
    spaceNames: ['Kids', 'Home'],
    clusterLabels: ['Kids · 5', 'Home · 2'],
    splitSuggestion: 'Two kinds of things here. Split into spaces?',
    splitButtonLabel: 'Split into Kids + Home',
    studentGroups: [
      { label: 'Emma · 3', ids: ['soccer', 'form', 'party'] },
      { label: 'Jake · 1', ids: ['jake-dentist'] },
      { label: 'Activities · 1', ids: ['piano'] },
    ],
    items: [
      {
        id: 'soccer',
        messyTitle: 'emma soccer mon',
        cleanTitle: 'Emma · Soccer · Mon 4pm',
        space: 'Kids',
        spaceSlot: 0,
        studentGroup: 'Emma',
        icon: 'calendar',
        weekday: 0,
      },
      {
        id: 'jake-dentist',
        messyTitle: 'jake dentist tue 3',
        cleanTitle: 'Jake · Dentist · Tue 3pm',
        space: 'Kids',
        spaceSlot: 0,
        studentGroup: 'Jake',
        icon: 'heart-pulse',
        weekday: 1,
      },
      {
        id: 'piano',
        messyTitle: 'emma piano thu 5',
        cleanTitle: 'Emma · Piano · Thu 5pm',
        space: 'Kids',
        spaceSlot: 0,
        studentGroup: 'Emma',
        icon: 'gift',
        weekday: 3,
      },
      {
        id: 'form',
        messyTitle: 'school form wed',
        cleanTitle: 'Emma · School form · Wed',
        space: 'Kids',
        spaceSlot: 0,
        studentGroup: 'Emma',
        icon: 'file-text',
        weekday: 2,
      },
      {
        id: 'party',
        messyTitle: 'emma bday party sun',
        cleanTitle: 'Emma · Birthday · Sun',
        space: 'Kids',
        spaceSlot: 0,
        studentGroup: 'Emma',
        icon: 'gift',
        weekday: 6,
      },
      {
        id: 'groceries-home',
        messyTitle: 'costco run',
        cleanTitle: 'Groceries · Thu',
        space: 'Home',
        spaceSlot: 1,
        studentGroup: 'Home',
        icon: 'shopping-cart',
        weekday: 3,
      },
      {
        id: 'oil-home',
        messyTitle: 'oil change sat',
        cleanTitle: 'Oil change · Sat',
        space: 'Home',
        spaceSlot: 1,
        studentGroup: 'Home',
        icon: 'car',
        weekday: 5,
      },
    ],
    personalListIds: ['groceries-home', 'oil-home'],
    captions: [
      'Your everyday to-do list',
      'Athera groups what belongs together',
      '…turns them into spaces',
      '…and each space gets its own list and calendar',
      'Switch spaces anytime',
    ],
  },
}

export function heroStoryPack(persona: PersonaKey): HeroStoryPack {
  return { persona, ...HERO_STORY[persona] }
}

/** Eight hero items (5 + 3 across spaces), fixed order for the spaces-split demo. */
export function heroItemsForPersona(persona: PersonaKey): DemoItem[] {
  const data = DEMO_BY_PERSONA[persona]
  const byId = Object.fromEntries(data.items.map((i) => [i.id, i]))
  return HERO_ITEM_IDS[persona].map((id) => byId[id]).filter(Boolean)
}

export function spaceItemCounts(persona: PersonaKey): { name: string; count: number }[] {
  const data = DEMO_BY_PERSONA[persona]
  return data.spaceNames.map((name) => ({
    name,
    count: data.items.filter((i) => i.space === name).length,
  }))
}

export function listItemsForHero(persona: PersonaKey): DemoItem[] {
  const data = DEMO_BY_PERSONA[persona]
  const primary = data.spaceNames[0]
  return heroItemsForPersona(persona).filter(
    (i) =>
      i.space === primary ||
      ((persona === 'coach' || persona === 'freelancer') && i.type === 'invoice')
  )
}

export function listItemsForScroll(persona: PersonaKey): DemoItem[] {
  return listItemsForHero(persona)
}

export function listItemsForComparison(persona: PersonaKey): DemoItem[] {
  const data = DEMO_BY_PERSONA[persona]
  if (persona === 'coach' || persona === 'freelancer') {
    return listItemsForHero(persona)
  }
  return data.items.filter((i) => i.space === data.spaceNames[0])
}

const TODO_MESSY_BY_PERSONA: Record<PersonaKey, { id: string; text: string }[]> = {
  freelancer: [
    { id: 'rivera-site', text: 'rivera bakery site review tue 2pm' },
    { id: 'dentist', text: 'dentist tue 3' },
    { id: 'lumen-update', text: 'lumen weekly update fri' },
    { id: 'rivera-call', text: 'call maria rivera thu 11' },
    { id: 'groceries', text: 'groceries' },
    { id: 'rivera-invoice', text: 'invoice rivera bakery' },
    { id: 'lumen-kickoff', text: 'lumen health kickoff mon 10' },
  ],
  coach: [
    { id: 'invoice', text: 'Send invoice to Martinez family' },
    { id: 'algebra', text: 'Maya algebra Tue 4pm' },
    { id: 'ava-geo', text: 'Ava geometry Sun 2pm' },
    { id: 'leo-sat', text: 'Leo SAT prep Tue' },
    { id: 'reading', text: 'Maya reading Thu 5pm' },
    { id: 'essay', text: 'Maya essay Sat 10am' },
    { id: 'chem', text: 'Maya chemistry Mon 3:30' },
  ],
  founder: [
    { id: 'sarah-follow', text: 'sarah investor follow up tue' },
    { id: 'lumen-call', text: 'lumen call wed 10am' },
    { id: 'hire-design', text: 'designer interview thu 2pm' },
    { id: 'sarah-update', text: 'send sarah update fri' },
    { id: 'rent', text: 'rent due 1st' },
    { id: 'gym', text: 'gym mon' },
    { id: 'roadmap', text: 'roadmap draft wed' },
  ],
  personal: [
    { id: 'soccer', text: 'emma soccer mon' },
    { id: 'jake-dentist', text: 'jake dentist tue 3' },
    { id: 'form', text: 'school form wed' },
    { id: 'groceries', text: 'costco run' },
    { id: 'piano', text: 'emma piano thu 5' },
    { id: 'oil', text: 'oil change sat' },
    { id: 'party', text: 'emma bday party sun' },
  ],
}

export type TodoTabAnimConfig = {
  newTaskText: string
  /** Row dragged up beside a related row */
  dragId: string
  insertAfterId: string
  checkOffId: string
}

const TODO_TAB_ANIM: Record<PersonaKey, TodoTabAnimConfig> = {
  freelancer: {
    newTaskText: 'lumen weekly update next fri',
    dragId: 'rivera-call',
    insertAfterId: 'rivera-site',
    checkOffId: 'rivera-invoice',
  },
  coach: {
    newTaskText: 'Leo SAT prep next Tue',
    dragId: 'reading',
    insertAfterId: 'algebra',
    checkOffId: 'invoice',
  },
  founder: {
    newTaskText: 'board deck fri',
    dragId: 'roadmap',
    insertAfterId: 'lumen-call',
    checkOffId: 'rent',
  },
  personal: {
    newTaskText: 'pack lunches mon',
    dragId: 'piano',
    insertAfterId: 'soccer',
    checkOffId: 'groceries',
  },
}

/** Messy hand-typed to-do strings for comparison tab 1 */
export function todoMessyRows(persona: PersonaKey): { id: string; text: string }[] {
  return TODO_MESSY_BY_PERSONA[persona]
}

export function todoTabAnimConfig(persona: PersonaKey): TodoTabAnimConfig {
  return TODO_TAB_ANIM[persona]
}

export const PERSONA_DOT_LABELS: Record<PersonaKey, string> = {
  freelancer: 'Freelance studio',
  coach: 'Coach or tutor',
  founder: 'Startup week',
  personal: 'Busy parent',
}

export type ComparisonGroupByCopy = {
  suggestion: string
  buttonLabel: string
  sideLabel: string
}

export function comparisonGroupByCopy(persona: PersonaKey): ComparisonGroupByCopy {
  const data = DEMO_BY_PERSONA[persona]
  const top = primaryGroupForPersona(persona).highlightPhrase
  const items = listItemsForComparison(persona)
  const n = items.filter((i) => i.entity === top).length
  const itemWord =
    persona === 'coach' ? 'sessions' : persona === 'founder' ? 'items' : 'things'
  const kindLower = data.entityKind.toLowerCase()
  return {
    suggestion: `${top} has ${n} ${itemWord} this week. Group by ${kindLower}?`,
    buttonLabel: `Group by ${kindLower}`,
    sideLabel: `+ Grouped by ${kindLower}`,
  }
}

export type QuietSectionEntityRow = {
  id: string
  name: string
  nextDay?: string
  isQuiet?: boolean
  lastLabel?: string
}

const QUIET_AVATAR_TONES = [
  'bg-sage text-white',
  'bg-terracotta text-white',
  'bg-[#6b7c9e] text-white',
  'bg-sage/80 text-white',
] as const

export function quietEntityAvatarTone(index: number): string {
  return QUIET_AVATAR_TONES[index % QUIET_AVATAR_TONES.length]
}

function weeksAgoFromActivity(activity: string): number {
  const m = activity.match(/(\d+)\s+weeks?\s+ago/i)
  return m ? Number(m[1]) : 5
}

function lastLabelFromActivity(activity: string): string {
  const weeks = weeksAgoFromActivity(activity)
  return `Last: ${weeks} weeks ago`
}

export function quietSectionRowsForPersona(persona: PersonaKey): QuietSectionEntityRow[] {
  const data = DEMO_BY_PERSONA[persona]
  const space = data.spaceNames[0]
  const items = data.items.filter((i) => i.space === space)
  const nextByEntity = new Map<string, string>()

  for (const item of items) {
    if (!item.entity || !item.day) continue
    if (!['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].includes(item.day)) continue
    const prev = nextByEntity.get(item.entity)
    if (!prev || weekdayIndex(item.day) < weekdayIndex(prev)) {
      nextByEntity.set(item.entity, item.day)
    }
  }

  const active: QuietSectionEntityRow[] = [...nextByEntity.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, day]) => ({ id: name, name, nextDay: day }))

  const q = data.quietEntity
  if (!active.some((r) => r.name === q.name)) {
    active.push({
      id: 'quiet-entity',
      name: q.name,
      isQuiet: true,
      lastLabel: lastLabelFromActivity(q.lastActivity),
    })
  }

  return active
}

export function quietEntitySuggestion(persona: PersonaKey): string {
  const q = DEMO_BY_PERSONA[persona].quietEntity
  if (q.suggestionLine) return q.suggestionLine
  const weeks = weeksAgoFromActivity(q.lastActivity)
  const noun = persona === 'coach' ? 'session' : 'visit'
  const usually = q.usually.startsWith('usually') ? `They ${q.usually}` : q.usually
  return `${q.name} hasn't had a ${noun} in ${weeks} weeks. ${usually}.`
}

export function quietFollowUpLine(persona: PersonaKey): string {
  const name = DEMO_BY_PERSONA[persona].quietEntity.name
  return `Follow up with ${name} · Wed`
}

export type EntityProfileTimelineEntry = {
  id: string
  title: string
  subtitle: string
}

export type EntityProfileDemo = {
  entityName: string
  avatarTone: string
  chips: string[]
  timeline: EntityProfileTimelineEntry[]
}

export type EntityNotesDemo = {
  bracketInput: string
  taskEntry: EntityProfileTimelineEntry
}

export function entityNotesForPersona(persona: PersonaKey): EntityNotesDemo {
  const byPersona: Record<PersonaKey, EntityNotesDemo> = {
    freelancer: {
      bracketInput: '[] send revised mockups fri',
      taskEntry: {
        id: 'notes-task',
        title: 'Send revised mockups · Fri',
        subtitle: 'Task · From notes',
      },
    },
    coach: {
      bracketInput: '[] send practice set thu',
      taskEntry: {
        id: 'notes-task',
        title: 'Send practice set · Thu',
        subtitle: 'Task · From notes',
      },
    },
    founder: {
      bracketInput: '[] investor deck fri',
      taskEntry: {
        id: 'notes-task',
        title: 'Investor deck · Fri',
        subtitle: 'Task · From notes',
      },
    },
    personal: {
      bracketInput: '[] permission slip wed',
      taskEntry: {
        id: 'notes-task',
        title: 'Permission slip · Wed',
        subtitle: 'Task · From notes',
      },
    },
  }
  return byPersona[persona]
}

export function entityProfileForPersona(persona: PersonaKey): EntityProfileDemo {
  const data = DEMO_BY_PERSONA[persona]
  const primary = primaryGroupForPersona(persona).highlightPhrase

  if (persona === 'freelancer') {
    return {
      entityName: 'Rivera Bakery',
      avatarTone: 'bg-sage text-white',
      chips: ['Maria Rivera · Owner', 'Jon Park · Marketing'],
      timeline: [
        { id: 't1', title: 'Call with Maria · Thu 11am', subtitle: 'Call · Scheduled' },
        { id: 't2', title: 'Site review · Tue 2pm', subtitle: 'Client work · Today' },
        { id: 't3', title: 'Invoice · Rivera Bakery', subtitle: 'Billing · Due this week' },
        { id: 't4', title: 'Homepage mock v2', subtitle: 'Deliverable · Sent 2 weeks ago' },
      ],
    }
  }

  if (persona === 'coach') {
    return {
      entityName: 'Maya Chen',
      avatarTone: 'bg-sage text-white',
      chips: ['Chen family', 'Ms. Ortiz · IEP teacher', 'Tutor: Sam'],
      timeline: [
        { id: 't1', title: 'Algebra · Tue 4pm', subtitle: 'Session · Today · Notes added' },
        { id: 't2', title: 'Reading · Thu 5pm', subtitle: 'Session · Last Thu' },
        { id: 't3', title: 'Chemistry · Mon 3:30', subtitle: 'Session · Mon' },
        { id: 't4', title: 'Parent check-in', subtitle: 'Note · 2 weeks ago' },
      ],
    }
  }

  if (persona === 'founder') {
    return {
      entityName: 'Sarah Lee (Seed Fund)',
      avatarTone: 'bg-terracotta text-white',
      chips: ['Seed round', 'Board observer', 'Intro: Alex @ Lumen'],
      timeline: [
        { id: 't1', title: 'Investor follow-up · Tue', subtitle: 'Investor · This week' },
        { id: 't2', title: 'Send update · Fri', subtitle: 'Update · Due Fri' },
        { id: 't3', title: 'Customer call · Wed', subtitle: 'Lumen Health · Wed 10am' },
        { id: 't4', title: 'Monthly investor note', subtitle: 'Draft · Last month' },
      ],
    }
  }

  return {
    entityName: primary,
    avatarTone: 'bg-sage text-white',
    chips: ['School', 'Pediatric dentist', 'Coach Mike'],
    timeline: [
      { id: 't1', title: 'Soccer · Mon 4pm', subtitle: 'Practice · Today' },
      { id: 't2', title: 'Piano · Thu 5pm', subtitle: 'Lesson · Weekly' },
      { id: 't3', title: 'School form · Wed', subtitle: 'Errand · Due Wed' },
      { id: 't4', title: 'Birthday party · Sun', subtitle: 'Event · This Sun' },
    ],
  }
}

export function quietDraftEmailBody(persona: PersonaKey): string {
  const q = DEMO_BY_PERSONA[persona].quietEntity
  const first = q.name.split(' ')[0]
  if (persona === 'freelancer') {
    return `Hi Maria — checking in on the site review. Haven't heard back in a few weeks. Want to find 15 minutes this week?`
  }
  if (persona === 'coach') {
    return `Hi ${first}, it's been a few weeks since our last session. Want to pick a time this week?`
  }
  if (persona === 'founder') {
    return `Hi Sarah — quick ping on the investor update. Happy to send a draft if useful. Do you have 10 minutes this week?`
  }
  return `Hi ${first}! It's been a few weeks — want to get something on the calendar?`
}

export type WeekWithAtheraEntry = {
  day: string
  title: string
  body: string
  comingSoon?: boolean
}

export const WEEK_WITH_ATHERA: Record<PersonaKey, WeekWithAtheraEntry[]> = {
  freelancer: [
    {
      day: 'Monday, 8am',
      title: 'Your week, ready.',
      body: "Today's client work, what's due, and who needs you, in one view.",
      comingSoon: true,
    },
    {
      day: 'Tuesday',
      title: 'A client goes quiet.',
      body: '"Rivera Bakery hasn\'t replied in 3 weeks." The check-in is already drafted.',
    },
    {
      day: 'Wednesday',
      title: 'Repeat work disappears.',
      body: "You sent Lumen's weekly update three Fridays in a row. Now it repeats.",
    },
    {
      day: 'Thursday',
      title: 'Your system grows.',
      body: 'New clients get their own pages. Work and personal split into spaces.',
    },
    {
      day: 'Friday',
      title: 'Your week, in numbers.',
      body: '"18 billable items, 3 more than last week." Your wins, surfaced.',
      comingSoon: true,
    },
  ],
  coach: [
    {
      day: 'Monday, 8am',
      title: 'Your week, ready.',
      body: "Today's sessions, what's due, and who needs you, in one view.",
      comingSoon: true,
    },
    {
      day: 'Tuesday',
      title: 'A client goes quiet.',
      body: '"Max hasn\'t booked in 3 weeks." The check-in is already drafted.',
    },
    {
      day: 'Wednesday',
      title: 'Repeat work disappears.',
      body: "You typed Leo's SAT prep three Tuesdays in a row. Now it repeats.",
    },
    {
      day: 'Thursday',
      title: 'Your system grows.',
      body: 'New students get their own pages. Work and personal split into spaces.',
    },
    {
      day: 'Friday',
      title: 'Your week, in numbers.',
      body: '"32 sessions, 4 more than last week." Your wins, surfaced.',
      comingSoon: true,
    },
  ],
  founder: [
    {
      day: 'Monday, 8am',
      title: 'Your week, ready.',
      body: "Today's calls, what's due, and who needs you, in one view.",
      comingSoon: true,
    },
    {
      day: 'Tuesday',
      title: 'A contact goes quiet.',
      body: '"Sarah Lee hasn\'t replied in 4 weeks." The investor ping is already drafted.',
    },
    {
      day: 'Wednesday',
      title: 'Repeat work disappears.',
      body: 'You sent the investor update three first Fridays in a row. Now it repeats.',
    },
    {
      day: 'Thursday',
      title: 'Your system grows.',
      body: 'Customers and hires get their own pages. Company and personal split into spaces.',
    },
    {
      day: 'Friday',
      title: 'Your week, in numbers.',
      body: '"12 company tasks closed, 2 more than last week." Your wins, surfaced.',
      comingSoon: true,
    },
  ],
  personal: [
    {
      day: 'Monday, 8am',
      title: 'Your week, ready.',
      body: "Today's activities, what's due, and who needs you, in one view.",
      comingSoon: true,
    },
    {
      day: 'Tuesday',
      title: 'Someone goes quiet.',
      body: '"Alex hasn\'t been to the gym in 4 weeks." The check-in is already drafted.',
    },
    {
      day: 'Wednesday',
      title: 'Repeat work disappears.',
      body: "You logged Emma's piano three Thursdays in a row. Now it repeats.",
    },
    {
      day: 'Thursday',
      title: 'Your system grows.',
      body: 'Each kid gets their own page. Kids and home split into spaces.',
    },
    {
      day: 'Friday',
      title: 'Your week, in numbers.',
      body: '"14 errands done, 2 more than last week." Your wins, surfaced.',
      comingSoon: true,
    },
  ],
}

export type LandingFeatureCopy = {
  peopleBody: string
  spacesHeadline: string
  spacesBody: string
  spacesDemoCaption: string
}

export const LANDING_FEATURE_COPY: Record<PersonaKey, LandingFeatureCopy> = {
  freelancer: {
    peopleBody:
      'Each client gets a page that pulls in work, notes, and the people around them—so you never dig through five apps for context.',
    spacesHeadline: 'Clients here. Groceries there.',
    spacesBody:
      'When your list mixes client work and life, Athera suggests a split into spaces—each with its own list and calendar, one tap away.',
    spacesDemoCaption: 'Clients here, personal there',
  },
  coach: {
    peopleBody:
      'Each student gets a page that pulls in sessions, notes, and the people around them—so you never dig through five apps for context.',
    spacesHeadline: 'Tutoring here. Groceries there.',
    spacesBody:
      'When your list mixes tutoring and life, Athera suggests a split into spaces—each with its own list and calendar, one tap away.',
    spacesDemoCaption: 'Tutoring here, personal there',
  },
  founder: {
    peopleBody:
      'Each contact gets a page that pulls in calls, notes, and the people around them—so you never dig through five apps for context.',
    spacesHeadline: 'Company here. Personal there.',
    spacesBody:
      'When your list mixes company work and life, Athera suggests a split into spaces—each with its own list and calendar, one tap away.',
    spacesDemoCaption: 'Company here, personal there',
  },
  personal: {
    peopleBody:
      'Each person gets a page that pulls in activities, notes, and the people around them—so you never dig through five apps for context.',
    spacesHeadline: 'Kids here. Home there.',
    spacesBody:
      'When your list mixes family and home, Athera suggests a split into spaces—each with its own list and calendar, one tap away.',
    spacesDemoCaption: 'Kids here, home there',
  },
}

export function comparisonEntityGroups(
  persona: PersonaKey
): { entity: string; items: DemoItem[] }[] {
  const items = listItemsForComparison(persona)
  const map = new Map<string, DemoItem[]>()
  for (const item of items) {
    const key = item.entity || 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return [...map.entries()]
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([entity, groupItems]) => ({ entity, items: groupItems }))
}
