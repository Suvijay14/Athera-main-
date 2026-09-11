import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const KOKORO_URL = process.env.KOKORO_URL || 'http://127.0.0.1:7532'
export const DEFAULT_KOKORO_VOICE = process.env.KOKORO_VOICE || 'af_bella'

const KOKORO_SCRIPT = path.join(os.homedir(), 'Documents/Dex/kokoro_server.py')
const KOKORO_CWD = path.join(os.homedir(), 'Documents/Dex')

const PYTHON_PATHS = [
  '/Library/Frameworks/Python.framework/Versions/3.13/bin/python3',
  '/opt/homebrew/bin/python3',
  '/usr/local/bin/python3',
  '/usr/bin/python3',
]

export function estimateSpeechDuration(text: string): number {
  return Math.max(0.5, text.length * 0.05)
}

export async function isKokoroRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${KOKORO_URL}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
      signal: AbortSignal.timeout(800),
    })
    // Empty text returns 400 — server is up
    return res.status === 400 || res.ok
  } catch {
    return false
  }
}

export async function kokoroSpeak(text: string, voice = DEFAULT_KOKORO_VOICE): Promise<boolean> {
  const trimmed = text.trim()
  if (!trimmed) return false

  const res = await fetch(`${KOKORO_URL}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed, voice }),
    signal: AbortSignal.timeout(15000),
  })

  return res.ok
}

export async function kokoroStop(): Promise<void> {
  try {
    await fetch(`${KOKORO_URL}/stop`, { method: 'DELETE', signal: AbortSignal.timeout(2000) })
  } catch {
    // ignore
  }
}

export function kokoroScriptExists(): boolean {
  return fs.existsSync(KOKORO_SCRIPT)
}

export async function startKokoroServer(): Promise<{ ok: boolean; message: string }> {
  if (await isKokoroRunning()) {
    return { ok: true, message: 'Kokoro already running on port 7532' }
  }

  if (!kokoroScriptExists()) {
    return {
      ok: false,
      message: `Kokoro script not found at ${KOKORO_SCRIPT}`,
    }
  }

  const python = PYTHON_PATHS.find((p) => fs.existsSync(p))
  if (!python) {
    return { ok: false, message: 'Python 3 not found' }
  }

  const logOut = fs.openSync('/tmp/kokoro.log', 'a')
  const logErr = fs.openSync('/tmp/kokoro.error.log', 'a')

  spawn(python, [KOKORO_SCRIPT], {
    cwd: KOKORO_CWD,
    detached: true,
    stdio: ['ignore', logOut, logErr],
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ''}`,
    },
  }).unref()

  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await isKokoroRunning()) {
      return { ok: true, message: `Kokoro started · voice ${DEFAULT_KOKORO_VOICE}` }
    }
  }

  return { ok: false, message: 'Kokoro did not start — check /tmp/kokoro.error.log' }
}
