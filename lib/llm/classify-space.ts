import 'server-only'

import { z } from 'zod'

import { extractJSON, llmCacheKey } from '@/lib/llm/client'
import { getCachedLlmResponse, setCachedLlmResponse } from '@/lib/db/llm-cache'
import type { SpaceMoveCorrection } from '@/lib/db/space-move-corrections'

export type SpaceExampleForPrompt = {
  id: string
  name: string
  recentTitles: string[]
}

export const spaceClassificationResponseSchema = z.object({
  space_id: z.string().uuid(),
  confidence: z.number().min(0).max(1),
})

export type SpaceClassificationResult = z.infer<typeof spaceClassificationResponseSchema>

/**
 * Prompt: space classification (product spec Feature 4c).
 * Classify a new item into exactly one existing space using names, examples, and corrections.
 */
export const SPACE_CLASSIFICATION_SYSTEM = `You classify which space a new work item belongs in.

You will receive:
- The new item's title
- Each space's name and up to 5 recent example titles from that space
- Up to 20 recent corrections where the user moved an item with a given title into a specific space

Rules:
- Pick exactly one space_id from the provided spaces list. Never invent an id.
- confidence is 0–1 for how sure you are the item belongs in that space.
- Use corrections as strong hints when the new title is similar to a corrected title.
- If the title could plausibly fit multiple spaces, lower confidence below 0.8 rather than guessing.
- Respond with JSON only: { "space_id": "<uuid>", "confidence": <number> }`

function normalizeTitleForCache(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

function buildUserPrompt(
  title: string,
  spaces: SpaceExampleForPrompt[],
  corrections: SpaceMoveCorrection[]
): string {
  const spaceBlock = spaces
    .map(
      (s) =>
        `Space id=${s.id} name="${s.name}"\n  Recent examples:\n${s.recentTitles
          .map((t) => `  - "${t}"`)
          .join('\n') || '  (none)'}`
    )
    .join('\n\n')

  const correctionBlock =
    corrections.length === 0
      ? 'User corrections: (none)'
      : `User corrections (title → space id):\n${corrections
          .map((c) => `- "${c.title}" → ${c.toSpaceId}`)
          .join('\n')}`

  return `${spaceBlock}

${correctionBlock}

New item title: "${title.trim()}"

Which space should this item live in?`
}

export async function classifyItemSpace(
  title: string,
  spaces: SpaceExampleForPrompt[],
  corrections: SpaceMoveCorrection[],
  opts?: { useCache?: boolean }
): Promise<SpaceClassificationResult> {
  const userPrompt = buildUserPrompt(title, spaces, corrections)
  const cacheKey = llmCacheKey(
    SPACE_CLASSIFICATION_SYSTEM,
    `${normalizeTitleForCache(title)}\n${userPrompt}`
  )

  if (opts?.useCache !== false) {
    const cached = await getCachedLlmResponse(cacheKey)
    if (cached) {
      const parsed = spaceClassificationResponseSchema.safeParse(cached)
      if (parsed.success) {
        return parsed.data
      }
    }
  }

  const result = await extractJSON(
    SPACE_CLASSIFICATION_SYSTEM,
    userPrompt,
    spaceClassificationResponseSchema,
    'classify_space'
  )

  const validIds = new Set(spaces.map((s) => s.id))
  if (!validIds.has(result.space_id)) {
    return { space_id: spaces[0]!.id, confidence: 0 }
  }

  await setCachedLlmResponse(cacheKey, result)
  return result
}
