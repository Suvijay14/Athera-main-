/** Voice assistant API — built into athena-web (same origin, no separate agent install) */

export interface AgentHealth {
  status: string
  ollama: boolean
  ollamaInstalled?: boolean
  ollamaPath?: string
  groq?: boolean
  provider?: 'ollama' | 'groq' | null
  llmReady?: boolean
  model: string
  installedModels: string[]
  suggestedModel: string
  platform?: string
  integrated?: boolean
}

export interface PermissionStatus {
  id: string
  label: string
  description: string
  granted: boolean | 'unknown'
  settingsUrl?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

async function voiceFetch<T>(path: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      ...options,
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function isLlmReady(health: AgentHealth | null | undefined): boolean {
  return Boolean(health?.llmReady ?? health?.ollama ?? health?.groq)
}

export function llmStatusLabel(health: AgentHealth | null | undefined): string {
  if (!health) return 'AI offline'
  if (health.provider === 'groq') return `Groq · ${health.model}`
  if (health.provider === 'ollama') return `Ollama · ${health.model}`
  if (health.groq) return `Groq configured · ${health.model}`
  return 'AI offline'
}

export async function checkAgentHealth(): Promise<AgentHealth | null> {
  return voiceFetch<AgentHealth>('/api/voice/health')
}

export async function fetchPermissions(): Promise<PermissionStatus[]> {
  const data = await voiceFetch<{ permissions: PermissionStatus[] }>('/api/voice/permissions')
  return data?.permissions ?? []
}

export async function startOllama(): Promise<{ ok: boolean; message: string } | null> {
  try {
    const res = await fetch('/api/voice/ollama/start', { method: 'POST' })
    return (await res.json()) as { ok: boolean; message: string }
  } catch {
    return null
  }
}

export interface KokoroHealth {
  running: boolean
  voice: string
  scriptFound: boolean
  modelsFound?: boolean
  installDir?: string
  installed?: boolean
  url: string
}

export interface DeviceProfile {
  deviceId: string
  hostname: string
  platform: string
  arch: string
  homedir: string
  username: string
  settings: Record<string, unknown>
  live: {
    llm: {
      llmReady?: boolean
      provider?: 'ollama' | 'groq' | null
      model: string
      ollama: boolean
      groq?: boolean
    }
    ollama: {
      installed: boolean
      running: boolean
      path?: string
      message: string
    }
    kokoro: {
      running: boolean
      installDir: string
      scriptFound: boolean
      modelsFound: boolean
      voice: string
    }
    gmail: { connected: boolean; email: string }
    permissions: PermissionStatus[]
  }
}

export async function checkKokoroHealth(): Promise<KokoroHealth | null> {
  return voiceFetch<KokoroHealth>('/api/voice/kokoro/health')
}

export async function startKokoro(
  options?: { install?: boolean }
): Promise<{ ok: boolean; message: string } | null> {
  try {
    const res = await fetch('/api/voice/kokoro/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ install: options?.install ?? false }),
    })
    return (await res.json()) as { ok: boolean; message: string }
  } catch {
    return null
  }
}

export async function installKokoro(): Promise<{ ok: boolean; message: string } | null> {
  try {
    const res = await fetch('/api/voice/kokoro/install', { method: 'POST' })
    return (await res.json()) as { ok: boolean; message: string }
  } catch {
    return null
  }
}

export async function fetchDeviceProfile(): Promise<DeviceProfile | null> {
  return voiceFetch<DeviceProfile>('/api/device')
}

/** Speak via Kokoro TTS (plays on Mac speakers). Falls back to browser speech if offline. */
export async function speakWithKokoro(
  text: string,
  voice?: string
): Promise<{ engine: 'kokoro' | 'browser'; durationMs?: number }> {
  try {
    const res = await fetch('/api/voice/kokoro/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    })
    if (res.ok) {
      const data = (await res.json()) as { durationMs?: number }
      return { engine: 'kokoro', durationMs: data.durationMs }
    }
  } catch {
    // fall through to browser
  }

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    window.speechSynthesis.speak(utter)
    return { engine: 'browser' }
  }

  return { engine: 'browser' }
}

export async function stopKokoroSpeech(): Promise<void> {
  try {
    await fetch('/api/voice/kokoro/stop', { method: 'POST' })
  } catch {
    // ignore
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}

import type {
  FileListItem,
  PendingApproval,
  PendingEmailFiling,
  PendingLifeAction,
  PendingToolContext,
} from '@/lib/types'

export interface VoiceCommandResult {
  response: string
  toolsUsed: string[]
  pendingApproval?: PendingApproval
  pendingLifeAction?: PendingLifeAction
  pendingEmailFiling?: PendingEmailFiling
  pendingToolContext?: PendingToolContext | null
  fileList?: FileListItem[]
}

export async function sendVoiceCommand(
  text: string,
  history: ChatMessage[] = [],
  pendingLifeAction?: PendingLifeAction | null,
  pendingEmailFiling?: PendingEmailFiling | null,
  pendingToolContext?: PendingToolContext | null
): Promise<VoiceCommandResult | null> {
  try {
    const res = await fetch('/api/voice/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        history,
        pendingLifeAction: pendingLifeAction ?? null,
        pendingEmailFiling: pendingEmailFiling ?? null,
        pendingToolContext: pendingToolContext ?? null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return {
        response: (err as { error?: string }).error ?? 'Voice request failed. Go to /setup.',
        toolsUsed: [],
      }
    }
    return (await res.json()) as VoiceCommandResult
  } catch {
    return null
  }
}
