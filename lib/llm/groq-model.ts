import { LlmExtractionError } from '@/lib/llm/errors'

const GROQ_MODELS_URL = 'https://api.groq.com/openai/v1/models'

/** Fallback order when GROQ_MODEL is unset or not available on the account. */
export const GROQ_ENTITY_MODEL_PREFERENCES = [
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
] as const

export type GroqModelListing = {
  id: string
  name: string | null
  jsonMode: boolean
}

type GroqModelsApiModel = {
  id: string
  name?: string
  active?: boolean
  input_modalities?: string[]
  supported_features?: string[]
}

export async function fetchGroqModelList(apiKey: string): Promise<GroqModelListing[]> {
  let res: Response
  try {
    res = await fetch(GROQ_MODELS_URL, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(30_000),
    })
  } catch (err) {
    throw new LlmExtractionError('api', 'Failed to fetch Groq model list', err)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new LlmExtractionError(
      'api',
      `Groq model list failed (${res.status})${body ? `: ${body.slice(0, 200)}` : ''}`
    )
  }

  const payload = (await res.json()) as { data?: GroqModelsApiModel[] }
  const rows = payload.data ?? []

  return rows
    .filter((m) => m.active !== false)
    .filter((m) => !m.input_modalities || m.input_modalities.includes('text'))
    .map((m) => ({
      id: m.id,
      name: m.name ?? null,
      jsonMode: Boolean(m.supported_features?.includes('json_mode')),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function pickGroqEntityModel(
  models: GroqModelListing[],
  explicitEnv?: string
): string {
  const ids = new Set(models.map((m) => m.id))
  const trimmed = explicitEnv?.trim()

  if (trimmed) {
    if (ids.has(trimmed)) {
      return trimmed
    }
    console.warn(
      `[groq] GROQ_MODEL="${trimmed}" is not in your account's model list; picking a fallback.`
    )
  }

  for (const pref of GROQ_ENTITY_MODEL_PREFERENCES) {
    if (ids.has(pref)) {
      return pref
    }
  }

  const jsonCapable = models.filter((m) => m.jsonMode)
  if (jsonCapable.length > 0) {
    return jsonCapable[0]!.id
  }

  if (models.length > 0) {
    return models[0]!.id
  }

  throw new LlmExtractionError('api', 'No Groq models available for this API key')
}

let resolvedModelPromise: Promise<string> | null = null

/** Resolves once per process: env override if listed, else first available preferred json_mode model. */
export async function resolveGroqEntityModel(apiKey: string): Promise<string> {
  if (!resolvedModelPromise) {
    resolvedModelPromise = (async () => {
      const models = await fetchGroqModelList(apiKey)
      return pickGroqEntityModel(models, process.env.GROQ_MODEL)
    })()
  }
  return resolvedModelPromise
}

/** Test helper — reset cached resolution between cases. */
export function resetGroqEntityModelCacheForTests(): void {
  resolvedModelPromise = null
}
