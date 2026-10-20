import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { toJsonValue } from '@/lib/db/json'

export async function getCachedLlmResponse(cacheKey: string): Promise<unknown | null> {
  const client = createAdminClient()
  const { data, error } = await client
    .from('llm_cache')
    .select('response')
    .eq('cache_key', cacheKey)
    .maybeSingle()

  if (error || !data) {
    return null
  }
  return data.response
}

export async function setCachedLlmResponse(cacheKey: string, response: unknown): Promise<void> {
  const client = createAdminClient()
  const { error } = await client.from('llm_cache').upsert({
    cache_key: cacheKey,
    response: toJsonValue(response),
  })
  if (error) {
    console.error('llm_cache upsert failed', error.message)
  }
}
