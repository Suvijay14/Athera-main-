import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { Space, SpaceFile } from '@/lib/types'

export type { Space, SpaceFile }

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'spaces.json')

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureDataFile(): { spaces: Space[] } {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(DATA_FILE)) {
    const empty = { spaces: [] }
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2))
    return empty
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as { spaces: Space[] }
}

function writeData(data: { spaces: Space[] }) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

export function listSpaces(): Space[] {
  return ensureDataFile().spaces
}

export function createSpace(
  name: string,
  options?: { files?: SpaceFile[]; source?: string }
): Space {
  const data = ensureDataFile()
  const slug = slugify(name)
  const now = new Date().toISOString()
  const existingIndex = data.spaces.findIndex((s) => s.slug === slug)

  let space: Space

  if (existingIndex >= 0) {
    const existing = data.spaces[existingIndex]
    const incoming = options?.files ?? []
    const merged = [...existing.files]
    for (const f of incoming) {
      if (!merged.some((m) => m.path === f.path)) merged.push(f)
    }
    space = {
      ...existing,
      name,
      source: options?.source ?? existing.source,
      files: merged,
      updatedAt: now,
    }
    data.spaces[existingIndex] = space
  } else {
    space = {
      id: randomUUID(),
      slug,
      name,
      source: options?.source ?? 'voice',
      files: options?.files ?? [],
      createdAt: now,
      updatedAt: now,
    }
    data.spaces.push(space)
  }

  writeData(data)
  return space
}

export function getSpaceBySlug(slug: string): Space | null {
  return ensureDataFile().spaces.find((s) => s.slug === slug) ?? null
}

export function deleteSpace(slug: string): boolean {
  const data = ensureDataFile()
  const index = data.spaces.findIndex((s) => s.slug === slug)
  if (index < 0) return false
  data.spaces.splice(index, 1)
  writeData(data)
  return true
}

export function addFilesToSpace(
  slug: string,
  newFiles: SpaceFile[],
  spaceName?: string
): Space | null {
  const data = ensureDataFile()
  const index = data.spaces.findIndex((s) => s.slug === slug)
  const now = new Date().toISOString()

  if (index < 0) {
    const created = createSpace(spaceName ?? slug.replace(/-/g, ' '), {
      source: 'voice',
      files: newFiles,
    })
    return created
  }

  const existing = data.spaces[index]
  const merged = [...existing.files]
  for (const f of newFiles) {
    if (!merged.some((m) => m.path === f.path)) merged.push(f)
  }

  const space: Space = { ...existing, files: merged, updatedAt: now }
  data.spaces[index] = space
  writeData(data)
  return space
}
