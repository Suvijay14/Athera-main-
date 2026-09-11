'use client'

import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { fetchDeviceProfile, type DeviceProfile } from '@/lib/agent'

export default function SettingsPage() {
  const [device, setDevice] = useState<DeviceProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const profile = await fetchDeviceProfile()
    setDevice(profile)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [load])

  if (loading && !device) {
    return (
      <div className="p-8 max-w-2xl">
        <div className="h-8 w-48 bg-surface-container rounded animate-pulse" />
      </div>
    )
  }

  if (!device) {
    return (
      <div className="p-8 max-w-2xl">
        <p className="text-sm text-red-600">Could not load device settings. Is the dev server running?</p>
      </div>
    )
  }

  const { live } = device

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <span className="label-caps">This device</span>
          <h1 className="font-newsreader text-3xl text-ink-primary mt-2">Settings</h1>
          <p className="text-xs text-ink-muted mt-2">
            Settings below are for <strong>{device.hostname}</strong> only — not shared with other
            machines.
          </p>
        </div>
        <button type="button" onClick={load} className="btn-secondary text-xs">
          Refresh
        </button>
      </div>

      <div className="card-vellum p-5 space-y-4 mb-4">
        <Section title="Device">
          <Row label="Hostname" value={device.hostname} />
          <Row label="Device ID" value={device.deviceId} mono />
          <Row label="Platform" value={`${device.platform} · ${device.arch}`} />
          <Row label="User" value={device.username} />
          <Row label="Home" value={device.homedir} mono />
        </Section>
      </div>

      <div className="card-vellum p-5 space-y-4 mb-4">
        <Section title="AI on this Mac">
          <StatusRow
            label="LLM ready"
            ok={live.llm.llmReady}
            detail={
              live.llm.provider
                ? `${live.llm.provider === 'ollama' ? 'Ollama' : 'Groq'} · ${live.llm.model}`
                : 'Not available'
            }
          />
          <StatusRow
            label="Ollama installed"
            ok={live.ollama.installed}
            detail={live.ollama.path ?? (live.ollama.installed ? 'Ollama.app' : 'Not installed')}
          />
          <StatusRow
            label="Ollama running"
            ok={live.ollama.running}
            detail={live.ollama.message}
          />
          <StatusRow
            label="Groq fallback"
            ok={live.llm.groq}
            detail={live.llm.groq ? 'Configured in .env.local' : 'Not configured'}
          />
        </Section>
      </div>

      <div className="card-vellum p-5 space-y-4 mb-4">
        <Section title="Voice (Kokoro) on this Mac">
          <StatusRow
            label="Kokoro running"
            ok={live.kokoro.running}
            detail={live.kokoro.running ? live.kokoro.voice : 'Offline'}
          />
          <StatusRow
            label="Kokoro installed"
            ok={live.kokoro.scriptFound && live.kokoro.modelsFound}
            detail={live.kokoro.installDir}
            mono
          />
          <Row label="Models" value={live.kokoro.modelsFound ? 'Found' : 'Missing'} />
        </Section>
      </div>

      <div className="card-vellum p-5 space-y-4 mb-4">
        <Section title="Integrations on this Mac">
          <StatusRow
            label="Gmail"
            ok={live.gmail.connected}
            detail={live.gmail.connected ? live.gmail.email : 'Not connected'}
          />
        </Section>
      </div>

      <div className="card-vellum p-5 space-y-3">
        <Section title="macOS permissions (this device)">
          {live.permissions.map((p) => (
            <StatusRow
              key={p.id}
              label={p.label}
              ok={p.granted === true}
              unknown={p.granted === 'unknown'}
              detail={p.granted === true ? 'Granted' : p.granted === false ? 'Needed' : 'Browser / optional'}
            />
          ))}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-ink-primary mb-3">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <span className="text-ink-muted flex-shrink-0">{label}</span>
      <span className={clsx('text-ink-primary text-right break-all', mono && 'font-mono text-[10px]')}>
        {value}
      </span>
    </div>
  )
}

function StatusRow({
  label,
  ok,
  unknown,
  detail,
  mono,
}: {
  label: string
  ok?: boolean
  unknown?: boolean
  detail: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={clsx(
            'w-2 h-2 rounded-full flex-shrink-0',
            ok && 'bg-sage',
            !ok && !unknown && 'bg-red-500',
            unknown && 'bg-ink-faint'
          )}
        />
        <span className="text-ink-muted">{label}</span>
      </div>
      <span className={clsx('text-ink-primary text-right break-all', mono && 'font-mono text-[10px]')}>
        {detail}
      </span>
    </div>
  )
}
