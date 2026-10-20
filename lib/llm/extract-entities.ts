import { z } from 'zod'

import { extractJSON, llmCacheKey } from '@/lib/llm/client'
import { getCachedLlmResponse, setCachedLlmResponse } from '@/lib/db/llm-cache'

export const extractedEntitySchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1),
  matches_existing_id: z.string().uuid().nullable(),
  confidence: z.number().min(0).max(1),
})

export const entityExtractionResponseSchema = z.object({
  entities: z.array(extractedEntitySchema),
})

export type ExtractedEntity = z.infer<typeof extractedEntitySchema>

export type ExistingEntityForPrompt = {
  id: string
  name: string
  kind: string
  aliases: string[]
}

const ENTITY_EXTRACTION_SYSTEM = `You extract named entities from work item titles for a small business workspace.

Rules:
- Return only real people, businesses, clients, patients, vendors, or other proper-name entities.
- Never return dates, times, or generic words like "session", "meeting", "call", "task", "follow up", "review", "billing", or "consultation" as entity names.
- If the name matches one of the existing entities below (including aliases), set matches_existing_id to that entity's id.
- Otherwise set matches_existing_id to null.
- kind should be a short slug like "client", "patient", "vendor", "student" when obvious; otherwise "contact".
- confidence is 0-1 for how sure you are this is a real named entity in the title.`

function buildUserPrompt(title: string, existing: ExistingEntityForPrompt[]): string {
  const existingBlock =
    existing.length === 0
      ? 'Existing entities: (none)'
      : `Existing entities:\n${existing
          .map(
            (e) =>
              `- id=${e.id} kind=${e.kind} name="${e.name}" aliases=[${e.aliases.map((a) => `"${a}"`).join(', ')}]`
          )
          .join('\n')}`

  return `${existingBlock}

Item title: "${title}"

Extract entities from the title only.`
}

export async function extractEntitiesFromTitle(
  title: string,
  existingEntities: ExistingEntityForPrompt[],
  opts?: { useCache?: boolean }
): Promise<ExtractedEntity[]> {
  const userPrompt = buildUserPrompt(title.trim(), existingEntities)
  const cacheKey = llmCacheKey(ENTITY_EXTRACTION_SYSTEM, userPrompt)

  if (opts?.useCache !== false) {
    const cached = await getCachedLlmResponse(cacheKey)
    if (cached) {
      const parsed = entityExtractionResponseSchema.safeParse(cached)
      if (parsed.success) {
        return parsed.data.entities
      }
    }
  }

  const result = await extractJSON(
    ENTITY_EXTRACTION_SYSTEM,
    userPrompt,
    entityExtractionResponseSchema,
    'extract_entities'
  )

  await setCachedLlmResponse(cacheKey, result)
  return result.entities
}
