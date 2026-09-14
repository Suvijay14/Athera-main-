const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function safeFetch(url: string, options?: RequestInit) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch {
    return null
  }
}

export async function fetchTasks() {
  const data = await safeFetch(`${API_URL}/api/tasks`)
  return { tasks: data?.tasks ?? [], fromAPI: !!data }
}

export async function fetchCalendar(day = 'today') {
  const data = await safeFetch(`${API_URL}/api/calendar?day=${day}`)
  return { events: data?.events ?? [], fromAPI: !!data }
}

export async function fetchNote(space = 'school') {
  const data = await safeFetch(`${API_URL}/api/note?space=${space}`)
  return { note: data?.note ?? '', fromAPI: !!data }
}

export async function checkHealth() {
  const data = await safeFetch(`${API_URL}/health`)
  return !!data
}

export async function sendCommand(text: string, space = 'school') {
  const data = await safeFetch(`${API_URL}/api/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, space }),
  })
  return {
    response:
      data?.response ??
      `Athera is offline. Start the API server at ${API_URL} to get real responses.`,
    fromAPI: !!data,
  }
}

export async function* streamCommand(text: string, space = 'school'): AsyncGenerator<string> {
  try {
    const res = await fetch(`${API_URL}/api/command/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, space }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok || !res.body) {
      yield `Athera is offline. Start the API server at ${API_URL} to get real responses.`
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
      for (const line of lines) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.chunk) yield parsed.chunk
        } catch {
          // skip malformed SSE
        }
      }
    }
  } catch {
    yield `Athera is offline. Start the API server at ${API_URL} to get real responses.`
  }
}

export async function addTask(title: string, source = 'manual') {
  const data = await safeFetch(`${API_URL}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, source }),
  })
  return { success: !!data, title }
}
