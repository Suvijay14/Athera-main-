import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'

const DATA_DIR = path.join(process.cwd(), '.data')
const DEVICES_DIR = path.join(DATA_DIR, 'devices')

export interface DeviceSettings {
  deviceId: string
  hostname: string
  platform: string
  arch: string
  homedir: string
  ollama?: {
    installed: boolean
    path?: string
    lastStarted?: string
  }
  kokoro?: {
    installed: boolean
    installDir?: string
    voice?: string
    lastStarted?: string
  }
  groq?: {
    configured: boolean
  }
  updatedAt: string
}

export function getDeviceId(): string {
  const raw = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.userInfo().username}`
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

export function getDeviceInfo() {
  return {
    deviceId: getDeviceId(),
    hostname: os.hostname(),
    platform: process.platform,
    arch: os.arch(),
    homedir: os.homedir(),
    username: os.userInfo().username,
  }
}

function settingsPath(deviceId: string): string {
  return path.join(DEVICES_DIR, `${deviceId}.json`)
}

function ensureDevicesDir() {
  if (!fs.existsSync(DEVICES_DIR)) fs.mkdirSync(DEVICES_DIR, { recursive: true })
}

export function readDeviceSettings(): DeviceSettings {
  ensureDevicesDir()
  const info = getDeviceInfo()
  const file = settingsPath(info.deviceId)

  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf-8')) as DeviceSettings
    } catch {
      // fall through
    }
  }

  const defaults: DeviceSettings = {
    ...info,
    groq: { configured: Boolean(process.env.GROQ_API_KEY?.trim()) },
    updatedAt: new Date().toISOString(),
  }
  writeDeviceSettings(defaults)
  return defaults
}

export function writeDeviceSettings(settings: DeviceSettings): void {
  ensureDevicesDir()
  settings.updatedAt = new Date().toISOString()
  fs.writeFileSync(settingsPath(settings.deviceId), JSON.stringify(settings, null, 2), 'utf-8')
}

export function patchDeviceSettings(patch: Partial<DeviceSettings>): DeviceSettings {
  const current = readDeviceSettings()
  const merged: DeviceSettings = {
    ...current,
    ...patch,
    ollama: { ...current.ollama, ...patch.ollama },
    kokoro: { ...current.kokoro, ...patch.kokoro },
    groq: { ...current.groq, ...patch.groq },
    updatedAt: new Date().toISOString(),
  }
  writeDeviceSettings(merged)
  return merged
}
