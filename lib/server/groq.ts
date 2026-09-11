const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim())
}

export function getGroqModel(): string {
  return DEFAULT_MODEL
}

function groqHeaders(): HeadersInit {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) throw new Error('GROQ_API_KEY is not set')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  }
}

export async function groqChat(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: groqHeaders(),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: options?.temperature ?? 0.2,
      max_tokens: options?.maxTokens ?? 400,
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Groq error: ${res.status}${err ? ` — ${err.slice(0, 200)}` : ''}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

/** JSON-mode generate for life/email reasoning */
export async function groqGenerateJSON(system: string, prompt: string): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: groqHeaders(),
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60000),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Groq generate error: ${res.status}${err ? ` — ${err.slice(0, 200)}` : ''}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}
