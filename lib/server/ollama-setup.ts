import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import { promisify } from 'node:util'
import { isOllamaRunning, listModels, pickBestModel, getModel } from './ollama'
import { patchDeviceSettings } from './device-settings'

const exec = promisify(execFile)

const OLLAMA_PATHS = [
  '/opt/homebrew/bin/ollama',
  '/usr/local/bin/ollama',
  '/usr/bin/ollama',
]

const OLLAMA_APP = '/Applications/Ollama.app'

export interface OllamaSetupStatus {
  installed: boolean
  running: boolean
  path?: string
  appInstalled: boolean
  models: string[]
  suggestedModel: string
  message: string
}

export async function findOllamaBinary(): Promise<string | null> {
  for (const p of OLLAMA_PATHS) {
    if (fs.existsSync(p)) return p
  }
  try {
    const { stdout } = await exec('which', ['ollama'])
    const found = stdout.trim()
    if (found && fs.existsSync(found)) return found
  } catch {
    // not in PATH
  }
  return null
}

export function isOllamaAppInstalled(): boolean {
  return fs.existsSync(OLLAMA_APP)
}

export async function getOllamaSetupStatus(): Promise<OllamaSetupStatus> {
  const binary = await findOllamaBinary()
  const appInstalled = isOllamaAppInstalled()
  const installed = Boolean(binary) || appInstalled
  const running = await isOllamaRunning()
  const models = running ? await listModels() : []

  let message = 'Ollama not installed.'
  if (installed && running) message = 'Ollama is running.'
  else if (installed && !running) message = 'Ollama installed but not running — click Start Ollama.'
  else if (!installed) message = 'Install from ollama.com, then click Start Ollama.'

  return {
    installed,
    running,
    path: binary ?? undefined,
    appInstalled,
    models,
    suggestedModel: models.length ? pickBestModel(models) : getModel(),
    message,
  }
}

async function waitForOllama(maxMs = 20000): Promise<boolean> {
  const start = Date.now()
  while Date.now() - start < maxMs) {
    if (await isOllamaRunning()) return true
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

export async function startOllamaServer(): Promise<{ ok: boolean; message: string }> {
  if (await isOllamaRunning()) {
    return { ok: true, message: 'Ollama already running on port 11434.' }
  }

  const binary = await findOllamaBinary()
  const appInstalled = isOllamaAppInstalled()

  if (!binary && !appInstalled) {
    return {
      ok: false,
      message: 'Ollama not installed. Download from https://ollama.com and run setup again.',
    }
  }

  try {
    if (binary) {
      spawn(binary, ['serve'], {
        detached: true,
        stdio: 'ignore',
        env: process.env,
      }).unref()
    } else {
      await exec('open', ['-a', 'Ollama'])
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to start Ollama',
    }
  }

  const started = await waitForOllama()
  if (!started) {
    return {
      ok: false,
      message: appInstalled
        ? 'Opened Ollama app — wait a few seconds and click Refresh status.'
        : 'Started ollama serve — wait a few seconds and click Refresh status.',
    }
  }

  patchDeviceSettings({
    ollama: {
      installed: true,
      path: binary ?? OLLAMA_APP,
      lastStarted: new Date().toISOString(),
    },
  })

  const models = await listModels()
  const model = getModel()
  if (!models.some((m) => m.startsWith(model.split(':')[0]))) {
    try {
      if (binary) {
        spawn(binary, ['pull', model], { detached: true, stdio: 'ignore' }).unref()
      }
    } catch {
      // pull is best-effort
    }
  }

  return {
    ok: true,
    message: `Ollama running${binary ? ` (${binary})` : ''}. Model: ${model}`,
  }
}
