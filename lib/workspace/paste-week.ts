import { format, parseISO } from 'date-fns'

import { normalizeEntityKey } from '@/lib/adaptation/detector-utils'
import type { Entity, Space } from '@/lib/db/schemas'
import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { resolveEntitySpaceOnCreate } from '@/lib/workspace/entity-match-on-create'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

export type PasteWeekLineResult = {
  line: string
  title: string
  skipped: boolean
}

export type PasteWeekParsedItem = ReturnType<typeof quickAddParseToCreatePayload> & {
  line: string
}

export type PasteWeekPreviewItem = {
  /** Stable id for React keys / edits (client-generated). */
  id: string
  line: string
  included: boolean
  title: string
  dueDate: string | null
  startAt: string | null
  endAt: string | null
  allDay: boolean
  spaceId: string
  entityId: string | null
  entityName: string | null
  kind: 'task' | 'appointment'
  whenLabel: string
  spaceLabel: string
  spaceTag: string
}

export type PasteWeekParseContext = {
  spaces: Space[]
  entities: Entity[]
  entityFieldKeys: string[]
  defaultSpaceId: string
  personalSpaceId: string
}

const GIBBERISH = /^[^a-zA-Z0-9]{0,2}$/

/** Split pasted text into non-empty lines and parse each with parseQuickAdd. */
export function parsePasteWeekLines(input: string, now: Date): PasteWeekParsedItem[] {
  const lines = input.split(/\r?\n/)
  const out: PasteWeekParsedItem[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      continue
    }
    const parsed = parseQuickAdd(line, now)
    if (!parsed.title.trim() || GIBBERISH.test(parsed.title.trim())) {
      continue
    }
    const payload = quickAddParseToCreatePayload(parsed)
    out.push({ ...payload, line })
  }

  return out
}

function findEntityInLine(line: string, entities: Entity[]): Entity | null {
  const normLine = normalizeEntityKey(line)
  let best: Entity | null = null
  let bestLen = 0

  for (const entity of entities) {
    if (entity.archivedAt) {
      continue
    }
    const names = [entity.name, ...entity.aliases]
    for (const name of names) {
      const norm = normalizeEntityKey(name)
      if (norm.length < 3) {
        continue
      }
      if (normLine.includes(norm) && norm.length > bestLen) {
        best = entity
        bestLen = norm.length
        continue
      }
      for (const word of norm.split(/\s+/)) {
        if (word.length >= 4 && normLine.includes(word) && word.length > bestLen) {
          best = entity
          bestLen = word.length
        }
      }
    }
  }
  return best
}

function findSpaceInLine(line: string, spaces: Space[]): Space | null {
  const normLine = normalizeEntityKey(line)
  let best: Space | null = null
  let bestLen = 0
  for (const space of spaces) {
    if (space.archivedAt) {
      continue
    }
    const norm = normalizeEntityKey(space.name)
    if (norm.length < 3) {
      continue
    }
    if (normLine.includes(norm) && norm.length > bestLen) {
      best = space
      bestLen = norm.length
    }
  }
  return best
}

/** Strip "from/with/for/w/ …" client phrases and tighten title when entity is known. */
export function refineTitleForEntity(title: string, entityName: string | null): string {
  if (!entityName) {
    return title.trim()
  }
  let t = title.trim()
  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  t = t.replace(new RegExp(`\\b(?:from|with|for|w\\/|w\\\\)\\s+${escaped}\\b`, 'i'), '').trim()
  t = t.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '').replace(/\s+/g, ' ').trim()
  return t.length > 0 ? t : title.trim()
}

export function formatPasteWeekWhen(payload: {
  startAt: string | null
  endAt: string | null
  dueDate: string | null
  allDay: boolean
}): string {
  if (payload.startAt) {
    const start = parseISO(payload.startAt)
    const day = format(start, 'EEE')
    const fmt = (d: Date) =>
      format(d, 'h:mm a')
        .replace(':00', '')
        .replace(' AM', 'am')
        .replace(' PM', 'pm')
        .toLowerCase()
    const startT = fmt(start)
    if (payload.endAt) {
      const end = parseISO(payload.endAt)
      const endT = fmt(end)
      return `${day} · ${startT}–${endT}`
    }
    return `${day} · ${startT}`
  }
  if (payload.dueDate) {
    const d = parseISO(`${payload.dueDate}T12:00:00`)
    return `Due ${format(d, 'EEE')}`
  }
  return 'No date'
}

export function abbrevPasteWeekTag(label: string): string {
  const trimmed = label.trim()
  if (trimmed.length <= 14) {
    return trimmed
  }
  return `${trimmed.slice(0, 2)}…`
}

export function resolvePasteWeekSpace(
  line: string,
  title: string,
  data: Record<string, unknown>,
  ctx: PasteWeekParseContext
): { spaceId: string; entityId: string | null; entityName: string | null } {
  const activeSpaces = ctx.spaces.filter((s) => !s.archivedAt)
  const entityFromLine = findEntityInLine(line, ctx.entities)
  if (entityFromLine) {
    return {
      spaceId: entityFromLine.spaceId,
      entityId: entityFromLine.id,
      entityName: entityFromLine.name,
    }
  }

  const entitySpace = resolveEntitySpaceOnCreate(
    `${line} ${title}`,
    data,
    ctx.entityFieldKeys,
    ctx.entities
  )
  if (entitySpace) {
    const ent = ctx.entities.find((e) => e.spaceId === entitySpace && normalizeEntityKey(line).includes(normalizeEntityKey(e.name)))
    return {
      spaceId: entitySpace,
      entityId: ent?.id ?? null,
      entityName: ent?.name ?? null,
    }
  }

  const space = findSpaceInLine(line, activeSpaces)
  if (space) {
    return { spaceId: space.id, entityId: null, entityName: null }
  }

  return {
    spaceId: ctx.personalSpaceId || ctx.defaultSpaceId,
    entityId: null,
    entityName: null,
  }
}

export function buildPasteWeekPreview(
  input: string,
  ctx: PasteWeekParseContext,
  now: Date,
  idFactory: () => string = () => crypto.randomUUID()
): PasteWeekPreviewItem[] {
  const parsedLines = parsePasteWeekLines(input, now)
  const spaceById = new Map(ctx.spaces.map((s) => [s.id, s]))

  return parsedLines.map((row) => {
    const resolution = resolvePasteWeekSpace(row.line, row.title, row.data ?? {}, ctx)
    const title = refineTitleForEntity(row.title, resolution.entityName)
    const startAt = row.startAt ?? null
    const endAt = row.endAt ?? null
    const dueDate = row.dueDate ?? null
    const kind: 'task' | 'appointment' = startAt ? 'appointment' : 'task'
    const space = spaceById.get(resolution.spaceId)
    const spaceLabel = space?.name ?? 'Space'
    const whenLabel = formatPasteWeekWhen({ startAt, endAt, dueDate, allDay: row.allDay ?? false })

    return {
      id: idFactory(),
      line: row.line,
      included: true,
      title,
      dueDate,
      startAt,
      endAt,
      allDay: row.allDay ?? false,
      spaceId: resolution.spaceId,
      entityId: resolution.entityId,
      entityName: resolution.entityName,
      kind,
      whenLabel,
      spaceLabel,
      spaceTag: abbrevPasteWeekTag(resolution.entityName ?? spaceLabel),
    }
  })
}

/** Mockup demo fixture (9 lines). */
export const PASTE_WEEK_MOCKUP_SAMPLE = `Site review w/ Rivera Bakery tue 2-3pm
dentist tuesday at 3
Thu 11-11:45 call Maria
lumen kickoff monday 10 to 11:30am
lumen weekly update fri 4pm
logo concepts for oak & iron due wed
send revised mockups to rivera by friday
invoice rivera
groceries`

export const PASTE_WEEK_TEXTAREA_PLACEHOLDER = `Site review w/ Rivera Bakery tue 2-3pm
dentist tuesday at 3
Thu 11-11:45 call Maria
lumen kickoff monday 10 to 11:30am
lumen weekly update fri 4pm
logo concepts for oak & iron due wed
send revised mockups to rivera by friday
invoice rivera
groceries`
