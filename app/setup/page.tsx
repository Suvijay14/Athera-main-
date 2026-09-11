'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import {
  checkAgentHealth,
  checkKokoroHealth,
  fetchPermissions,
  startKokoro,
  startOllama,
  type AgentHealth,
  type KokoroHealth,
  type PermissionStatus,
} from '@/lib/agent'

export default function SetupPage() {
  const [health, setHealth] = useState<AgentHealth | null>(null)
  const [kokoro, setKokoro] = useState<KokoroHealth | null>(null)
  const [permissions, setPermissions] = useState<PermissionStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [ollamaMsg, setOllamaMsg] = useState('')
  const [kokoroMsg, setKokoroMsg] = useState('')
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailEmail, setGmailEmail] = useState('')
  const [gmailMsg, setGmailMsg] = useState('')

  const refreshGmail = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/gmail/status')
      if (!res.ok) return
      const data = (await res.json()) as { connected: boolean; email: string }
      setGmailConnected(data.connected)
      setGmailEmail(data.email ?? '')
    } catch {
      setGmailConnected(false)
      setGmailEmail('')
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    const [h, k, p] = await Promise.all([
      checkAgentHealth(),
      checkKokoroHealth(),
      fetchPermissions(),
    ])
    setHealth(h)
    setKokoro(k)
    setPermissions(p)
    await refreshGmail()
    setLoading(false)
  }, [refreshGmail])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [refresh])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gmail = params.get('gmail')
    if (gmail === 'connected') {
      setGmailMsg('Gmail connected successfully.')
      refreshGmail()
    } else if (gmail === 'error') {
      setGmailMsg(`Gmail error: ${params.get('message') ?? 'unknown'}`)
    }
  }, [refreshGmail])

  async function handleDisconnectGmail() {
    setGmailMsg('Disconnecting…')
    await fetch('/api/auth/gmail/disconnect', { method: 'POST' })
    setGmailMsg('Gmail disconnected.')
    await refreshGmail()
  }

  async function handleStartOllama() {
    setOllamaMsg('Checking Ollama on this Mac…')
    const res = await startOllama()
    setOllamaMsg(res?.message ?? 'Could not start Ollama')
    setTimeout(refresh, 2000)
    setTimeout(refresh, 6000)
  }

  async function handleStartKokoro() {
    setKokoroMsg(
      kokoro?.modelsFound
        ? 'Starting Kokoro…'
        : 'Setting up Kokoro — downloading voice models (~315MB), may take a few minutes…'
    )
    const res = await startKokoro()
    setKokoroMsg(res?.message ?? 'Could not start Kokoro')
    setTimeout(refresh, 2000)
    setTimeout(refresh, 8000)
  }

  const llmReady = Boolean(health?.llmReady ?? health?.ollama ?? health?.groq)
  const ready = llmReady && kokoro?.running === true

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <span className="label-caps">Voice assistant</span>
        <h1 className="font-newsreader text-3xl text-ink-primary mt-2">Setup</h1>
        <p className="text-sm text-ink-muted mt-2">
          Everything runs inside this web app — just keep <code className="text-xs">npm run dev</code>{' '}
          running. No separate installer needed.
        </p>
      </div>

      {/* Step 1: Ollama */}
      <div className="card-vellum p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-ink-primary">1. AI (Ollama or Groq)</h2>
          <StatusBadge ok={llmReady} loading={loading} />
        </div>
        <p className="text-xs text-ink-muted mb-3">
          <strong>Ollama</strong> runs locally if installed — preferred. If Ollama is off, Athena
          automatically uses <strong>Groq</strong> cloud (set <code className="text-[10px]">GROQ_API_KEY</code>{' '}
          in <code className="text-[10px]">.env.local</code>). Install Ollama from{' '}
          <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-terracotta underline">
            ollama.com
          </a>{' '}
          if you want local-only.
        </p>
        {health?.provider && (
          <p className="text-xs text-sage mb-2">
            Active on this Mac: {health.provider === 'ollama' ? 'Ollama' : 'Groq'} · {health.model}
          </p>
        )}
        {health?.ollamaInstalled === false && !health?.groq && (
          <p className="text-xs text-red-700 mb-2">
            Ollama not found on this device. Install from ollama.com or add GROQ_API_KEY to .env.local.
          </p>
        )}
        {health?.ollamaInstalled && !health?.ollama && health?.groq && (
          <p className="text-xs text-ink-muted mb-2">
            Ollama installed but offline — using Groq cloud on this device.
          </p>
        )}
        <button type="button" onClick={handleStartOllama} className="btn-primary text-sm">
          {health?.ollama ? 'Ollama running ✓' : 'Start Ollama on this Mac'}
        </button>
        {ollamaMsg && <p className="text-xs text-ink-muted mt-2">{ollamaMsg}</p>}
        {health?.ollamaPath && (
          <p className="text-xs text-ink-faint mt-2 font-mono">{health.ollamaPath}</p>
        )}
        {health?.model && (
          <p className="text-xs text-ink-faint mt-1">Model: {health.model}</p>
        )}
      </div>

      {/* Step 2: Kokoro TTS */}
      <div className="card-vellum p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-ink-primary">2. Start Kokoro (voice)</h2>
          <StatusBadge ok={kokoro?.running} loading={loading} />
        </div>
        <p className="text-xs text-ink-muted mb-3">
          One click sets up everything on <strong>this Mac</strong>: Python packages, voice models
          (~315MB download first time), and starts the speaker (voice <strong>af_bella</strong>).
          No Dex or Ember required.
        </p>
        <button type="button" onClick={handleStartKokoro} className="btn-primary text-sm">
          {kokoro?.running ? 'Kokoro running ✓' : 'Start Kokoro'}
        </button>
        {kokoroMsg && <p className="text-xs text-ink-muted mt-2">{kokoroMsg}</p>}
        {kokoro?.installDir && (
          <p className="text-xs text-ink-faint mt-2 font-mono break-all">{kokoro.installDir}</p>
        )}
        {kokoro?.running && (
          <p className="text-xs text-ink-faint mt-1">Voice: {kokoro.voice}</p>
        )}
      </div>

      {/* Step 3: Permissions */}
      <div className="card-vellum p-5 mb-4">
        <h2 className="font-medium text-ink-primary mb-3">3. Allow macOS permissions</h2>
        <p className="text-xs text-ink-muted mb-4">
          Click each button to open System Settings. Enable access for{' '}
          <strong>Node</strong>, <strong>Terminal</strong>, or <strong>Cursor</strong> — whichever
          runs your dev server.
        </p>
        <div className="space-y-3">
          {permissions
            .filter((p) => p.settingsUrl)
            .map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-ink-primary">{p.label}</div>
                  <div className="text-[10px] text-ink-faint">{p.description}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PermBadge granted={p.granted} />
                  <a href={p.settingsUrl} className="btn-secondary text-xs py-1.5 px-3">
                    Open Settings
                  </a>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Step 4: Gmail */}
      <div className="card-vellum p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-ink-primary">4. Connect Gmail</h2>
          <StatusBadge ok={gmailConnected} loading={loading} />
        </div>
        <p className="text-xs text-ink-muted mb-3">
          One-click Google OAuth — no MCP, no CLI. Add credentials to{' '}
          <code className="text-[10px]">.env.local</code> first (see below).
        </p>

        {gmailConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-sage" />
              <span className="text-sage font-medium">Gmail connected</span>
            </div>
            {gmailEmail && (
              <p className="text-xs text-ink-secondary">
                Account: <strong>{gmailEmail}</strong>
              </p>
            )}
            <button type="button" onClick={handleDisconnectGmail} className="btn-secondary text-sm">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <span className="w-2 h-2 rounded-full bg-ink-faint" />
              Gmail not connected
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/gmail'
              }}
              className="btn-primary text-sm"
            >
              Connect Gmail →
            </button>
            <details className="text-[10px] text-ink-faint">
              <summary className="cursor-pointer text-ink-muted">Google Cloud setup</summary>
              <ol className="list-decimal ml-4 mt-2 space-y-1">
                <li>Go to console.cloud.google.com</li>
                <li>Create project → Enable Gmail API</li>
                <li>OAuth consent screen → External</li>
                <li>Credentials → OAuth 2.0 Client ID → Web app</li>
                <li>
                  Redirect URI:{' '}
                  <code>http://localhost:3000/api/auth/gmail/callback</code>
                </li>
                <li>Copy Client ID + Secret into .env.local</li>
              </ol>
            </details>
          </div>
        )}
        {gmailMsg && <p className="text-xs text-ink-muted mt-2">{gmailMsg}</p>}
      </div>

      {/* Step 5: Mic */}
      <div className="card-vellum p-5 mb-6">
        <h2 className="font-medium text-ink-primary mb-2">5. Microphone (in browser)</h2>
        <p className="text-xs text-ink-muted">
          Use Chrome. When you click Voice, allow microphone access in the browser prompt.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={refresh} className="btn-secondary text-sm">
          Refresh status
        </button>
        {ready ? (
          <Link href="/" className="btn-primary text-sm">
            Voice is ready →
          </Link>
        ) : (
          <span className="text-xs text-ink-faint">Start AI (Ollama or Groq) and Kokoro first</span>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ ok, loading }: { ok?: boolean; loading?: boolean }) {
  if (loading) return <span className="text-[10px] text-ink-faint">Checking…</span>
  return (
    <span
      className={clsx(
        'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
        ok ? 'text-sage bg-sage-light' : 'text-red-700 bg-red-100'
      )}
    >
      {ok ? 'Online' : 'Offline'}
    </span>
  )
}

function PermBadge({ granted }: { granted: boolean | 'unknown' }) {
  return (
    <span
      className={clsx(
        'text-[10px] font-medium w-5 text-center',
        granted === true && 'text-sage',
        granted === false && 'text-red-600',
        granted === 'unknown' && 'text-ink-faint'
      )}
    >
      {granted === true ? '✓' : granted === false ? '✗' : '—'}
    </span>
  )
}
