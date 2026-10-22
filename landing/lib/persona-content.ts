import {
  DEFAULT_PERSONA,
  DEMO_BY_PERSONA,
  formatDemoItemLine,
  listItemsForComparison,
  primaryGroupForPersona,
  scrollRepeatStoryForPersona,
  workspaceLabel,
  type DemoIconKey,
  type DemoItemType,
  type PersonaKey,
} from '@/demo-data'

export type LandingPersona = PersonaKey
export { DEFAULT_PERSONA }

export type MondayDemoTask = {
  id: string
  text: string
  showRoomLine?: boolean
  weeklyRepeat?: boolean
}

export type MondayDemoConfig = {
  header: string
  tasks: MondayDemoTask[]
  mayaGroupTitle: string
  mayaTaskIds: string[]
  invoiceTaskId: string
  recurringTaskId: string
  recurringLabel: string
  chatbotCaption: string
  agentCaption: string
  atheraCaption: string
  chatAiReply: string
}

export type ScrollTaskItem = {
  id: string
  text: string
  icon: DemoIconKey
  type: DemoItemType
}

export type ScrollStoryConfig = {
  workspaceTitle: string
  cellLabel: string
  weekdayIndex: number
  weekdayLong: string
  time: string
  highlightNote: string
  suggestion: string
  repeatLabel: string
  icon: DemoIconKey
  type: DemoItemType
}

export type PersonaPack = {
  mondayDemo: MondayDemoConfig
  scrollStory: ScrollStoryConfig
  examples: { title: string; before: string; after: string }[]
}

const EXAMPLES: Record<LandingPersona, PersonaPack['examples']> = {
  freelancer: [
    {
      title: 'New views when you need them',
      before: 'Client work and invoices in one long list.',
      after: 'Rivera Bakery (and others) get their own view when the pattern is obvious.',
    },
    {
      title: 'Repeat tasks that repeat themselves',
      before: 'You re-type the same Friday client update every week.',
      after: 'Athera asks once — then it repeats on its own.',
    },
    {
      title: "Clutter disappears when you don't use it",
      before: 'Contract fields you never fill in.',
      after: 'Unused fields step aside until you need them.',
    },
  ],
  coach: [
    {
      title: 'New views when you need them',
      before: 'Sessions and invoices in one long list.',
      after: 'Chen family (and others) get their own view when the pattern is obvious.',
    },
    {
      title: 'Repeat tasks that repeat themselves',
      before: 'You re-type the same Tuesday SAT block every week.',
      after: 'Athera asks once — then it repeats on its own.',
    },
    {
      title: "Clutter disappears when you don't use it",
      before: 'Tax ID and invoice fields you never fill in.',
      after: 'Unused fields step aside until you need them.',
    },
  ],
  founder: [
    {
      title: 'New views when you need them',
      before: 'Investors, customers, and hiring in one pile.',
      after: 'Sarah Lee (and others) get a clear thread when you need it.',
    },
    {
      title: 'Repeat tasks that repeat themselves',
      before: 'Same investor update every first Friday.',
      after: 'Tap yes once — it comes back on schedule.',
    },
    {
      title: "Clutter disappears when you don't use it",
      before: 'Extra CRM fields you never touch.',
      after: 'Quiet fields hide until a deal needs them.',
    },
  ],
  personal: [
    {
      title: 'New views when you need them',
      before: 'Sports, forms, and errands all mixed together.',
      after: 'Emma and Jake each get a clear list.',
    },
    {
      title: 'Repeat tasks that repeat themselves',
      before: 'Same piano reminder every Thursday.',
      after: 'Confirm once — it repeats for you.',
    },
    {
      title: "Clutter disappears when you don't use it",
      before: 'Budget tags and notes you never touch.',
      after: 'They fade out until you actually need them.',
    },
  ],
}

function buildMondayDemo(persona: LandingPersona): MondayDemoConfig {
  const data = DEMO_BY_PERSONA[persona]
  const group = primaryGroupForPersona(persona)
  const list = listItemsForComparison(persona)
  const repeatId = data.repeatItem.itemId ?? list[0]?.id ?? ''
  const invoice = list.find((i) => i.type === 'invoice')

  const chatAiByPersona: Record<LandingPersona, string> = {
    freelancer: 'Try grouping your client work by client!',
    coach: 'Try grouping your sessions by student!',
    founder: 'Try grouping company tasks by contact!',
    personal: 'Try grouping errands by person!',
  }

  const atheraCaptionByPersona: Record<LandingPersona, string> = {
    freelancer: 'A calendar, client pages, repeats, and less clutter. You just said yes.',
    coach: 'A calendar, student pages, repeats, and less clutter. You just said yes.',
    founder: 'A calendar, contact pages, repeats, and less clutter. You just said yes.',
    personal: 'A calendar, family pages, repeats, and less clutter. You just said yes.',
  }

  return {
    header: workspaceLabel(persona, 'Monday'),
    tasks: list.map((item) => ({
      id: item.id,
      text: formatDemoItemLine(item),
      showRoomLine:
        (persona === 'coach' || persona === 'freelancer') &&
        item.space === data.spaceNames[0],
      weeklyRepeat: item.id === repeatId,
    })),
    mayaGroupTitle: group.groupTitle,
    mayaTaskIds: group.groupedItemIds,
    invoiceTaskId: invoice?.id ?? list[0]?.id ?? '',
    recurringTaskId: repeatId,
    recurringLabel: `Every ${data.repeatItem.schedule.split(' ')[0]?.replace(/s$/, '') ?? 'week'}`,
    chatAiReply: chatAiByPersona[persona],
    chatbotCaption: "Good advice. Your list didn't change.",
    agentCaption: 'One task done. The mess is still there.',
    atheraCaption: atheraCaptionByPersona[persona],
  }
}

function buildScrollStory(persona: LandingPersona): ScrollStoryConfig {
  const repeat = scrollRepeatStoryForPersona(persona)
  return {
    workspaceTitle: repeat.workspaceTitle,
    cellLabel: repeat.cellLabel,
    weekdayIndex: repeat.weekdayIndex,
    weekdayLong: repeat.weekdayLong,
    time: repeat.time,
    highlightNote: '3 weeks in a row',
    suggestion: repeat.suggestion,
    repeatLabel: repeat.repeatLabel,
    icon: repeat.icon,
    type: repeat.type,
  }
}

function buildPack(persona: LandingPersona): PersonaPack {
  return {
    mondayDemo: buildMondayDemo(persona),
    scrollStory: buildScrollStory(persona),
    examples: EXAMPLES[persona],
  }
}

export const PERSONA_PACKS: Record<LandingPersona, PersonaPack> = {
  freelancer: buildPack('freelancer'),
  coach: buildPack('coach'),
  founder: buildPack('founder'),
  personal: buildPack('personal'),
}
