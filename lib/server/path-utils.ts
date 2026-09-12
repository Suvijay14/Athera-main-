import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const FOLDER_ALIASES: Record<string, string> = {
  home: '~',
  desktop: '~/Desktop',
  documents: '~/Documents',
  document: '~/Documents',
  downloads: '~/Downloads',
  download: '~/Downloads',
}

/** Normalize user-facing paths: ~, ~/Downloads, "my downloads", Documents/foo */
export function resolveUserPath(input: string): string | null {
  let raw = input.trim()
  if (!raw) return null

  raw = raw
    .replace(/^(?:my|the)\s+/i, '')
    .replace(/\s+folder$/i, '')
    .trim()

  const lower = raw.toLowerCase()
  if (FOLDER_ALIASES[lower]) {
    raw = FOLDER_ALIASES[lower]
  } else {
    for (const [alias, target] of Object.entries(FOLDER_ALIASES)) {
      if (lower === alias || lower.endsWith(` ${alias}`) || lower.startsWith(`${alias} `)) {
        raw = target
        break
      }
    }
  }

  if (raw === '~') return os.homedir()

  if (raw.startsWith('~/')) {
    return path.resolve(os.homedir(), raw.slice(2))
  }

  if (path.isAbsolute(raw)) {
    const resolved = path.resolve(raw)
    if (!resolved.startsWith(os.homedir())) return null
    return resolved
  }

  const underHome = path.resolve(os.homedir(), raw)
  if (underHome.startsWith(os.homedir())) {
    return underHome
  }

  return null
}

export function safeUserPath(input: string): string | null {
  const resolved = resolveUserPath(input)
  if (!resolved || !resolved.startsWith(os.homedir())) return null
  return resolved
}

export function isKnownFolderName(query: string): boolean {
  const normalized = query
    .toLowerCase()
    .replace(/^(?:my|the)\s+/i, '')
    .replace(/\s+folder$/i, '')
    .trim()
  return normalized in FOLDER_ALIASES
}

export function pathExists(target: string): boolean {
  try {
    fs.accessSync(target)
    return true
  } catch {
    return false
  }
}
