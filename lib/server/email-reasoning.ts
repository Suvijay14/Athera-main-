import { llmGenerateJSON } from './llm'
import type { Space } from '@/lib/types'

export interface EmailForClassification {
  id: string
  from: string
  subject: string
  snippet: string
}

export interface EmailClassification {
  messageId: string
  spaceSlug: string | null
  confidence: number
  reason: string
}

const CONFIDENCE_THRESHOLD = 0.7
const BATCH_SIZE = 8

const SYSTEM = `You classify Gmail messages into the user's existing Athera spaces.

Return ONLY valid JSON:
{
  "classifications": [
    {
      "messageId": "abc123",
      "spaceSlug": "fall-2026-berkeley",
      "confidence": 0.92,
      "reason": "CS189 syllabus from professor"
    }
  ]
}

Rules:
- spaceSlug MUST be one of the provided slugs, or null if no good match
- Never invent new space slugs
- confidence is 0.0 to 1.0
- Only assign spaceSlug when confidence >= 0.7; otherwise use null
- Match by sender domain, subject keywords, and snippet content
- Berkeley / CS189 / syllabus / course → academic spaces like fall-2026-berkeley
- Generic academic materials → academic-materials
- Return ONLY JSON. No explanation.`

function parseJson<T>(raw: string): T | null {
  const match = raw.trim().match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}

function buildSpaceCatalog(spaces: Space[]) {
  return spaces.map((s) => ({
    slug: s.slug,
    name: s.name,
    source: s.source,
    fileCount: s.files.length,
  }))
}

export async function classifyEmailsToSpaces(
  spaces: Space[],
  emails: EmailForClassification[]
): Promise<EmailClassification[]> {
  if (emails.length === 0 || spaces.length === 0) return []

  const validSlugs = new Set(spaces.map((s) => s.slug))
  const catalog = buildSpaceCatalog(spaces)
  const results: EmailClassification[] = []

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const batch = emails.slice(i, i + BATCH_SIZE)
    const prompt = `Spaces:\n${JSON.stringify(catalog, null, 2)}\n\nEmails:\n${JSON.stringify(batch, null, 2)}`

    const raw = await llmGenerateJSON(SYSTEM, prompt)
    const parsed = parseJson<{ classifications?: EmailClassification[] }>(raw)
    const classifications = parsed?.classifications ?? []

    for (const c of classifications) {
      if (!c.messageId) continue
      const slug =
        c.spaceSlug && validSlugs.has(c.spaceSlug) && c.confidence >= CONFIDENCE_THRESHOLD
          ? c.spaceSlug
          : null
      results.push({
        messageId: c.messageId,
        spaceSlug: slug,
        confidence: typeof c.confidence === 'number' ? c.confidence : 0,
        reason: c.reason ?? '',
      })
    }
  }

  return results
}
