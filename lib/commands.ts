export interface CommandsStatus {
  confirmed: Array<{ command: string; phrase: string; tool: string; notes: string }>
  broken: Array<{ command: string; phrase: string; error: string; fix: string }>
  untested: Array<{ command: string; phrase: string; tool: string }>
  lastUpdated: string
}

export async function fetchCommandsStatus(): Promise<CommandsStatus | null> {
  try {
    const res = await fetch('/api/commands/feedback', { cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as CommandsStatus
  } catch {
    return null
  }
}

export async function submitCommandFeedback(payload: {
  phrase: string
  response: string
  tool: string
  status: 'confirmed' | 'broken'
  error?: string
}): Promise<{ success: boolean; command?: string } | null> {
  try {
    const res = await fetch('/api/commands/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as { success: boolean; command?: string }
  } catch {
    return null
  }
}
