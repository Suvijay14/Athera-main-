import { execFile, spawn } from 'node:child_process'
import fs from 'node:fs'
import { createWriteStream } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { promisify } from 'node:util'
import { patchDeviceSettings, readDeviceSettings } from './device-settings'
import {
  DEFAULT_KOKORO_VOICE,
  isKokoroRunning,
  KOKORO_URL,
} from './kokoro'

const exec = promisify(execFile)

const PYTHON_PATHS = [
  '/Library/Frameworks/Python.framework/Versions/3.13/bin/python3',
  '/opt/homebrew/bin/python3',
  '/usr/local/bin/python3',
  '/usr/bin/python3',
]

const LEGACY_DEX_DIR = path.join(os.homedir(), 'Documents/Dex')

const MODEL_FILES = ['kokoro-v0_19.onnx', 'voices.bin'] as const

/** Official kokoro-onnx release — no Dex required */
const MODEL_URLS: Record<(typeof MODEL_FILES)[number], string> = {
  'kokoro-v0_19.onnx':
    'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/kokoro-v0_19.onnx',
  'voices.bin':
    'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files/voices.bin',
}

const MIN_MODEL_BYTES: Record<(typeof MODEL_FILES)[number], number> = {
  'kokoro-v0_19.onnx': 80 * 1024 * 1024,
  'voices.bin': 1024 * 1024,
}

export function getKokoroInstallDir(): string {
  const settings = readDeviceSettings()
  if (settings.kokoro?.installDir && fs.existsSync(settings.kokoro.installDir)) {
    return settings.kokoro.installDir
  }
  return path.join(process.cwd(), '.data', 'kokoro')
}

export function getKokoroScriptPath(): string {
  return path.join(getKokoroInstallDir(), 'kokoro_server.py')
}

function findPython(): string | null {
  return PYTHON_PATHS.find((p) => fs.existsSync(p)) ?? null
}

function bundledScriptPath(): string {
  return path.join(process.cwd(), 'scripts', 'kokoro_server.py')
}

function modelValid(dir: string, file: (typeof MODEL_FILES)[number]): boolean {
  const p = path.join(dir, file)
  if (!fs.existsSync(p)) return false
  try {
    return fs.statSync(p).size >= MIN_MODEL_BYTES[file]
  } catch {
    return false
  }
}

function modelsPresent(dir: string): boolean {
  return MODEL_FILES.every((f) => modelValid(dir, f))
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const partPath = `${destPath}.part`
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15 * 60 * 1000),
  })
  if (!res.ok || !res.body) {
    throw new Error(`Download failed (${res.status}): ${url}`)
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  await pipeline(
    Readable.fromWeb(res.body as import('stream/web').ReadableStream),
    createWriteStream(partPath)
  )
  fs.renameSync(partPath, destPath)
}

async function ensureModels(installDir: string): Promise<{ ok: boolean; message?: string }> {
  if (modelsPresent(installDir)) return { ok: true }

  fs.mkdirSync(installDir, { recursive: true })

  // Fast path: copy from Dex if user happens to have it
  if (modelsPresent(LEGACY_DEX_DIR)) {
    for (const f of MODEL_FILES) {
      const dest = path.join(installDir, f)
      if (!modelValid(installDir, f)) {
        fs.copyFileSync(path.join(LEGACY_DEX_DIR, f), dest)
      }
    }
    if (modelsPresent(installDir)) return { ok: true }
  }

  for (const file of MODEL_FILES) {
    if (modelValid(installDir, file)) continue
    const dest = path.join(installDir, file)
    const partial = `${dest}.part`
    if (fs.existsSync(partial)) fs.unlinkSync(partial)

    try {
      await downloadFile(MODEL_URLS[file], dest)
    } catch (err) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      const msg = err instanceof Error ? err.message : 'download failed'
      return {
        ok: false,
        message: `Could not download ${file}. Check internet connection. ${msg}`,
      }
    }

    if (!modelValid(installDir, file)) {
      if (fs.existsSync(dest)) fs.unlinkSync(dest)
      return { ok: false, message: `Downloaded ${file} but file looks incomplete. Try again.` }
    }
  }

  return { ok: true }
}

async function installPythonPackages(python: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await exec(
      python,
      ['-m', 'pip', 'install', 'kokoro-onnx', 'sounddevice', '--quiet', '--upgrade'],
      {
        timeout: 180000,
        env: {
          ...process.env,
          PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ''}`,
        },
      }
    )
    return { ok: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'pip install failed'
    return {
      ok: false,
      message: `Could not install Python packages. Try: pip3 install kokoro-onnx sounddevice — ${msg}`,
    }
  }
}

/** Full one-click setup: script + pip + model download + device link */
export async function installKokoro(): Promise<{ ok: boolean; message: string; installDir?: string }> {
  const installDir = getKokoroInstallDir()
  fs.mkdirSync(installDir, { recursive: true })

  const python = findPython()
  if (!python) {
    return { ok: false, message: 'Python 3 not found. Install from python.org or Homebrew (brew install python).' }
  }

  const scriptSrc = bundledScriptPath()
  if (!fs.existsSync(scriptSrc)) {
    return { ok: false, message: `Missing bundled script at ${scriptSrc}` }
  }

  fs.copyFileSync(scriptSrc, path.join(installDir, 'kokoro_server.py'))

  const pip = await installPythonPackages(python)
  if (!pip.ok) return { ok: false, message: pip.message ?? 'pip failed' }

  const models = await ensureModels(installDir)
  if (!models.ok) {
    return { ok: false, message: models.message ?? 'Model download failed' }
  }

  patchDeviceSettings({
    kokoro: {
      installed: true,
      installDir,
      voice: DEFAULT_KOKORO_VOICE,
    },
  })

  return {
    ok: true,
    message: `Kokoro ready in ${installDir}`,
    installDir,
  }
}

export async function startKokoroServer(): Promise<{ ok: boolean; message: string }> {
  if (await isKokoroRunning()) {
    return { ok: true, message: `Kokoro already running at ${KOKORO_URL}` }
  }

  const installDir = getKokoroInstallDir()
  const needsSetup = !fs.existsSync(getKokoroScriptPath()) || !modelsPresent(installDir)

  if (needsSetup) {
    const installed = await installKokoro()
    if (!installed.ok) {
      return {
        ok: false,
        message: installed.message.includes('download')
          ? installed.message
          : `${installed.message} (first run downloads ~315MB of voice models — may take a few minutes)`,
      }
    }
  }

  const scriptPath = getKokoroScriptPath()
  const python = findPython()
  if (!python) {
    return { ok: false, message: 'Python 3 not found.' }
  }

  if (!modelsPresent(installDir)) {
    const models = await ensureModels(installDir)
    if (!models.ok) return { ok: false, message: models.message ?? 'Models missing' }
  }

  const logOut = fs.openSync('/tmp/kokoro.log', 'a')
  const logErr = fs.openSync('/tmp/kokoro.error.log', 'a')

  spawn(python, [scriptPath], {
    cwd: installDir,
    detached: true,
    stdio: ['ignore', logOut, logErr],
    env: {
      ...process.env,
      KOKORO_VOICE: DEFAULT_KOKORO_VOICE,
      PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ''}`,
    },
  }).unref()

  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await isKokoroRunning()) {
      patchDeviceSettings({
        kokoro: {
          installed: true,
          installDir,
          voice: DEFAULT_KOKORO_VOICE,
          lastStarted: new Date().toISOString(),
        },
      })
      return {
        ok: true,
        message: `Kokoro started · voice ${DEFAULT_KOKORO_VOICE}`,
      }
    }
  }

  return { ok: false, message: 'Kokoro did not start — check /tmp/kokoro.error.log' }
}

export function getKokoroSetupStatus() {
  const installDir = getKokoroInstallDir()
  const scriptPath = getKokoroScriptPath()
  return {
    installDir,
    scriptFound: fs.existsSync(scriptPath),
    modelsFound: modelsPresent(installDir),
    bundledScript: fs.existsSync(bundledScriptPath()),
  }
}
