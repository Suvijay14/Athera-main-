import 'server-only'

import { z } from 'zod'

import { extractJSON, llmCacheKey } from '@/lib/llm/client'
import { getCachedLlmResponse, setCachedLlmResponse } from '@/lib/db/llm-cache'

const draftCheckinResponseSchema = z.object({
  body: z.string().min(1),
})

export type DraftCheckinTimelineRow = {
  title: string
  dateLabel: string
}

export type DraftCheckinInput = {
  entityName: string
  entityKind: string
  weeksSinceLastActivity: number
  cadenceLabel: string | null
  recentItems: DraftCheckinTimelineRow[]
}

const DRAFT_CHECKIN_SYSTEM = `You write short, friendly check-in messages a small business owner might send to a client or student they haven't seen in a while.

Rules:
- Return JSON only: { "body": string }.
- 1–3 sentences, warm and plain language, no marketing fluff.
- Reference the person by first name when obvious from the entity name.
- Mention it's been a while since the last session or visit when relevant.
- Optionally suggest getting something on the calendar — do not invent specific dates unless the user timeline includes them.
- Never claim an email was sent; this is a draft only.
- Do not use the word "AI".`

function buildUserPrompt(input: DraftCheckinInput): string {
  const timeline =
    input.recentItems.length === 0
      ? '(no recent items)'
      : input.recentItems.map((r) => `- ${r.dateLabel}: ${r.title}`).join('\n')

  return `Entity: ${input.entityName} (${input.entityKind})
Weeks since last activity: ${input.weeksSinceLastActivity}
Usual cadence: ${input.cadenceLabel ?? 'unknown'}

Recent linked items:
${timeline}

Write one check-in draft message.`
}

export async function draftCheckinMessage(input: DraftCheckinInput): Promise<string> {
  const userPrompt = buildUserPrompt(input)
  const cacheKey = llmCacheKey(DRAFT_CHECKIN_SYSTEM, userPrompt)

  const cached = await getCachedLlmResponse(cacheKey)
  if (cached) {
    const parsed = draftCheckinResponseSchema.safeParse(cached)
    if (parsed.success) {
      return parsed.data.body.trim()
    }
  }

  const raw = await extractJSON(
    DRAFT_CHECKIN_SYSTEM,
    userPrompt,
    draftCheckinResponseSchema,
    'draft_checkin'
  )
  await setCachedLlmResponse(cacheKey, raw)
  return raw.body.trim()
}
