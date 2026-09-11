const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b'

const MODEL_PREFERENCE = ['llama3.1:8b', 'llama3.1', 'phi3.5', 'mistral', 'llama2']

export function getModel() {
  return MODEL
}

export async function isOllamaRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

export async function listModels(): Promise<string[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`)
    if (!res.ok) return []
    const data = (await res.json()) as { models?: Array<{ name: string }> }
    return (data.models ?? []).map((m) => m.name)
  } catch {
    return []
  }
}

export function pickBestModel(installed: string[]): string {
  for (const pref of MODEL_PREFERENCE) {
    const match = installed.find((m) => m === pref || m.startsWith(`${pref}:`))
    if (match) return match
  }
  return installed[0] ?? MODEL
}

/** JSON-mode generate (matches Ember AthenaReasoning /api/generate) */
export async function ollamaGenerateJSON(system: string, prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      system,
      prompt,
      stream: false,
      format: 'json',
    }),
    signal: AbortSignal.timeout(45000),
  })

  if (!res.ok) throw new Error(`Ollama generate error: ${res.status}`)

  const data = (await res.json()) as { response?: string }
  return data.response?.trim() ?? ''
}

export async function ollamaChat(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; numPredict?: number }
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.2,
        num_predict: options?.numPredict ?? 400,
      },
    }),
  })

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}
