import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { addFilesToSpace, createSpace, getSpaceBySlug, slugify } from './spaces'
import { normalizeActionType } from './life-reasoning'
import type { PendingLifeAction, SpaceFile } from '@/lib/types'

const DATA_DIR = path.join(process.cwd(), '.data', 'life-notes')

function expandHome(p: string): string {
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2))
  return p
}

const DEFAULT_SCAN_PATHS = ['~/Desktop', '~/Documents', '~/Downloads']

function effectiveScanPaths(scanPaths?: string[]): string[] {
  return scanPaths?.length ? scanPaths : DEFAULT_SCAN_PATHS
}

/** Port of Ember AthenaActions.scanForFiles */
export function scanForFiles(keyword: string, scanPaths?: string[]): SpaceFile[] {
  const bases = effectiveScanPaths(scanPaths)
  const found: SpaceFile[] = []
  const needle = keyword.toLowerCase().trim()
  if (!needle) return found

  for (const base of bases) {
    const expanded = expandHome(base)
    let entries: string[]
    try {
      entries = fs.readdirSync(expanded)
    } catch {
      continue
    }
    for (const item of entries) {
      if (!item.toLowerCase().includes(needle)) continue
      const full = path.join(expanded, item)
      let isDirectory = false
      try {
        isDirectory = fs.statSync(full).isDirectory()
      } catch {
        continue
      }
      found.push({ name: item, path: full, isDirectory, source: base })
    }
  }
  return found
}

function scanForFilesMulti(keywords: string[], scanPaths?: string[]): SpaceFile[] {
  const seen = new Set<string>()
  const merged: SpaceFile[] = []
  for (const kw of keywords) {
    for (const f of scanForFiles(kw, scanPaths)) {
      if (seen.has(f.path)) continue
      seen.add(f.path)
      merged.push(f)
    }
  }
  return merged
}

/** Life note storage (replaces Dex write — no Dex dependency) */
export function writeLifeNote(result: PendingLifeAction): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const safeName = result.kind.replace(/_/g, '-')
  const filePath = path.join(DATA_DIR, `${safeName}-${date.replace(/,/g, '')}.md`)

  const content = `# ${result.signal}
**Date:** ${date}
**Type:** ${result.kind}

${result.lifeNote}
`
  fs.writeFileSync(filePath, content, 'utf-8')
}

const STOP_WORDS = new Set([
  'spring',
  'fall',
  'summer',
  'winter',
  'semester',
  '2024',
  '2025',
  '2026',
  '2027',
  'the',
  'and',
  'for',
  'new',
  'just',
  'started',
])

function scanKeywords(result: PendingLifeAction): string[] {
  const text = [result.signal, ...result.facts, result.actionTarget].join(' ').toLowerCase()
  const keywords: string[] = []

  if (result.kind.includes('semester')) {
    keywords.push('semester', 'syllabus', 'berkeley', 'course', 'academic', 'cs')
  }

  for (const word of text.split(/[\s,.-]+/)) {
    const w = word.trim()
    if (w.length > 3 && !STOP_WORDS.has(w)) keywords.push(w)
  }

  if (result.actionTarget.trim()) {
    for (const w of result.actionTarget.split(/[\s,.-]+/)) {
      const lower = w.toLowerCase()
      if (lower.length > 3 && !STOP_WORDS.has(lower)) keywords.push(lower)
    }
  }

  return Array.from(new Set(keywords)).slice(0, 8)
}

/** Port of Ember handleAction — executes after user confirms */
export async function executeLifeAction(result: PendingLifeAction): Promise<string> {
  const actionType = normalizeActionType(result.actionType)
  const keywords = scanKeywords(result)

  switch (actionType) {
    case 'create_space': {
      const name = result.actionTarget.trim() || result.signal
      const files = scanForFilesMulti(keywords, result.scanPaths)
      const slug = slugify(name)
      const existing = getSpaceBySlug(slug)

      if (existing) {
        addFilesToSpace(slug, files, name)
      } else {
        createSpace(name, { files, source: 'life_update' })
      }

      if (files.length === 0) {
        return existing
          ? `Your ${name} space already exists but I couldn't find new matching files. Try "list files on my desktop" and drag them in.`
          : `Done. Your ${name} space is ready — check the Spaces panel.`
      }
      return `Found ${files.length} related files. Your ${name} space is ready — check the Spaces panel.`
    }

    case 'add_to_space': {
      const slug = result.actionTarget.trim()
      if (!slug) return 'Done. Noted.'
      const files = scanForFilesMulti(keywords, result.scanPaths)
      addFilesToSpace(slug, files, slug)
      return files.length
        ? `Added ${files.length} files to ${slug}.`
        : `Updated ${slug}. No matching files found on disk.`
    }

    case 'scan_files': {
      const files = scanForFilesMulti(keywords, result.scanPaths)
      return files.length
        ? `Found ${files.length} files matching your update. Say "create a space" to save them.`
        : `No related files found on disk.`
    }

    case 'archive_space':
      return `${result.actionTarget || 'That space'} noted for archiving. Your files on disk are safe.`

    default:
      return 'Noted. I could not run that adaptation — try asking me to create a space directly.'
  }
}

export function isAffirmative(text: string): boolean {
  const lower = text.toLowerCase()
  return [
    'yes',
    'yeah',
    'sure',
    'yep',
    'do it',
    'do that',
    'go ahead',
    'please',
    'absolutely',
    'sounds good',
    'ok',
    'okay',
  ].some((w) => lower.includes(w))
}

export function isNegative(text: string): boolean {
  const lower = text.toLowerCase()
  return lower.includes('no') || lower.includes("don't") || lower.includes('skip')
}
