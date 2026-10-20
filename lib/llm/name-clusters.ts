import 'server-only'

import { z } from 'zod'

import { extractJSON, llmCacheKey } from '@/lib/llm/client'
import { getCachedLlmResponse, setCachedLlmResponse } from '@/lib/db/llm-cache'

/** Prompt: cluster naming (product spec Feature 4d). */
export const CLUSTER_NAMING_SYSTEM = `You name groups of similar work items for a small business owner.

You will receive up to 10 sample titles per cluster. Return short, plain-language space names (2–4 words) that describe what those items are about.

Rules:
- One name per cluster, in the same order as the input clusters.
- No jargon, no "AI", no emoji.
- Respond with JSON only: { "names": ["Name one", "Name two", ...] }`

const clusterNamesSchema = z.object({
  names: z.array(z.string().min(1)),
})

export async function nameClustersFromSamples(
  clusters: string[][],
  opts?: { useCache?: boolean }
): Promise<string[]> {
  const userPrompt = clusters
    .map(
      (samples, i) =>
        `Cluster ${i + 1} samples:\n${samples.map((t) => `- "${t}"`).join('\n')}`
    )
    .join('\n\n')

  const cacheKey = llmCacheKey(CLUSTER_NAMING_SYSTEM, userPrompt)
  if (opts?.useCache !== false) {
    const cached = await getCachedLlmResponse(cacheKey)
    if (cached) {
      const parsed = clusterNamesSchema.safeParse(cached)
      if (parsed.success && parsed.data.names.length === clusters.length) {
        return parsed.data.names
      }
    }
  }

  const result = await extractJSON(
    CLUSTER_NAMING_SYSTEM,
    userPrompt,
    clusterNamesSchema,
    'name_clusters'
  )
  if (result.names.length !== clusters.length) {
    throw new Error('Cluster naming returned wrong number of names')
  }
  await setCachedLlmResponse(cacheKey, result)
  return result.names
}
