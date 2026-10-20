import 'server-only'

import { formatISO } from 'date-fns'

import type { Entity, FieldDefinition } from '@/lib/db/schemas'
import { extractJSON, llmCacheKey } from '@/lib/llm/client'
import { getCachedLlmResponse, setCachedLlmResponse } from '@/lib/db/llm-cache'
import {
  llmViewRequestResponseSchema,
  type LlmViewRequestResponse,
  type ViewRequestSpec,
} from '@/lib/workspace/view-request-types'

const VIEW_REQUEST_SYSTEM = `You parse natural-language view requests for a small business workspace command bar.

Rules:
- Return JSON only, matching the schema you were given.
- Only use field keys and entity names from the lists in the user message. Never invent fields or entities.
- type is "list" or "calendar". Use "calendar" when the user asks for calendar/week/month schedule views.
- range is "week" or "month" for calendar requests, otherwise null.
- group_by and color_by are field keys from the list, or null.
- filters: array of { field, op, value } where op is is | is_not | before | after. value is a literal string (entity name or select option), not a field key.
- save: true by default whenever the user asks to show, open, or switch to a list or calendar view. Use save: false only when they explicitly ask for a temporary or one-off look without saving.
- If the request is not about viewing/filtering/grouping items (e.g. food, jokes, unrelated tasks), return { "unsupported": true }.
- If you cannot map the request using only listed fields and entities, return { "unsupported": true }.`

export type ViewRequestPromptContext = {
  spaceId: string
  spaceName: string
  fields: FieldDefinition[]
  entities: Entity[]
  todayIso: string
  timezone: string
}

function buildUserPrompt(text: string, ctx: ViewRequestPromptContext): string {
  const fieldLines =
    ctx.fields.length === 0
      ? '(none)'
      : ctx.fields
          .map(
            (f) =>
              `- key=${f.key} label="${f.label}" type=${f.type}${f.type === 'select' ? ` options=[${f.options.join(', ')}]` : ''}${f.type === 'entity' ? ` entityKind=${f.entityKind ?? ''}` : ''}`
          )
          .join('\n')

  const entityLines =
    ctx.entities.length === 0
      ? '(none)'
      : ctx.entities.map((e) => `- name="${e.name}" kind=${e.kind} id=${e.id}`).join('\n')

  return `Space: "${ctx.spaceName}" (id=${ctx.spaceId})
Today's date: ${ctx.todayIso}
Timezone: ${ctx.timezone}

Fields:
${fieldLines}

Entities:
${entityLines}

User request: "${text.trim()}"

Return either { "unsupported": true } or:
{
  "type": "list" | "calendar",
  "range": "week" | "month" | null,
  "group_by": string | null,
  "color_by": string | null,
  "save": boolean,
  "filters": [{ "field": string, "op": "is"|"is_not"|"before"|"after", "value": string }]
}`
}

function normalizeFieldKey(fields: FieldDefinition[], raw: string | null): string | null {
  if (!raw?.trim()) {
    return null
  }
  const norm = raw.trim().toLowerCase()
  const hit = fields.find((f) => f.key.toLowerCase() === norm || f.label.toLowerCase() === norm)
  return hit?.key ?? null
}

function entityNameValid(entities: Entity[], name: string): boolean {
  const n = name.trim().toLowerCase()
  return entities.some(
    (e) =>
      e.name.toLowerCase() === n || e.aliases.some((a) => a.toLowerCase() === n)
  )
}

export function validateLlmViewRequest(
  raw: LlmViewRequestResponse,
  ctx: ViewRequestPromptContext
): ViewRequestSpec {
  if (!('type' in raw)) {
    return { unsupported: true }
  }

  const groupBy = normalizeFieldKey(ctx.fields, raw.group_by)
  const colorBy = normalizeFieldKey(ctx.fields, raw.color_by)

  if (raw.group_by && !groupBy) {
    return { unsupported: true }
  }
  if (raw.color_by && !colorBy) {
    return { unsupported: true }
  }

  const validatedFilters: typeof raw.filters = []
  for (const filter of raw.filters) {
    const fieldKey = normalizeFieldKey(ctx.fields, filter.field)
    if (!fieldKey) {
      return { unsupported: true }
    }
    const field = ctx.fields.find((f) => f.key === fieldKey)!
    if (field.type === 'entity' && !entityNameValid(ctx.entities, filter.value)) {
      return { unsupported: true }
    }
    if (field.type === 'select' && !field.options.includes(filter.value)) {
      return { unsupported: true }
    }
    if (field.type === 'date' && filter.op !== 'before' && filter.op !== 'after') {
      return { unsupported: true }
    }
    validatedFilters.push({ ...filter, field: fieldKey })
  }

  if (raw.type === 'calendar' && raw.range === null) {
    return {
      spaceId: ctx.spaceId,
      type: 'calendar',
      range: 'week',
      groupBy: null,
      colorBy,
      filters: validatedFilters,
      save: raw.save,
    }
  }

  return {
    spaceId: ctx.spaceId,
    type: raw.type,
    range: raw.type === 'calendar' ? raw.range ?? 'week' : null,
    groupBy,
    colorBy,
    filters: validatedFilters,
    save: raw.save,
  }
}

/** Skip Groq for common calendar phrasing (chips + obvious user text). */
export function tryDeterministicViewRequest(
  text: string,
  ctx: ViewRequestPromptContext
): ViewRequestSpec | null {
  const n = text.trim().toLowerCase()
  if (!n) {
    return null
  }
  const wantsCalendar =
    n.includes('calendar') || n.includes('schedule') || n.includes('this week') || n.includes('this month')
  if (!wantsCalendar) {
    return null
  }
  const range: 'week' | 'month' = n.includes('month') ? 'month' : 'week'
  return {
    spaceId: ctx.spaceId,
    type: 'calendar',
    range,
    groupBy: null,
    colorBy: null,
    filters: [],
    save: true,
  }
}

export async function parseViewRequestFromText(
  text: string,
  ctx: ViewRequestPromptContext
): Promise<ViewRequestSpec> {
  const deterministic = tryDeterministicViewRequest(text, ctx)
  if (deterministic) {
    return deterministic
  }

  const normalized = text.trim().toLowerCase()
  const userPrompt = buildUserPrompt(normalized, ctx)
  const cacheKey = llmCacheKey(`${VIEW_REQUEST_SYSTEM}\n${ctx.spaceId}`, userPrompt)

  let llmRaw: LlmViewRequestResponse
  const cached = await getCachedLlmResponse(cacheKey)
  if (cached) {
    const parsed = llmViewRequestResponseSchema.safeParse(cached)
    if (parsed.success) {
      llmRaw = parsed.data
      return validateLlmViewRequest(llmRaw, ctx)
    }
  }

  llmRaw = await extractJSON(
    VIEW_REQUEST_SYSTEM,
    userPrompt,
    llmViewRequestResponseSchema,
    'parse_view_request'
  )
  await setCachedLlmResponse(cacheKey, llmRaw)
  return validateLlmViewRequest(llmRaw, ctx)
}

export function viewRequestPromptContext(
  spaceId: string,
  spaceName: string,
  fields: FieldDefinition[],
  entities: Entity[],
  now = new Date(),
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
): ViewRequestPromptContext {
  return {
    spaceId,
    spaceName,
    fields: fields.filter((f) => f.visible),
    entities,
    todayIso: formatISO(now, { representation: 'date' }),
    timezone,
  }
}
