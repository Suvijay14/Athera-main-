import fs from 'node:fs'
import path from 'node:path'
import type { FileListItem, ToolContextItem } from '@/lib/types'

interface ToolResultLike {
  success: boolean
  data?: unknown
}

export function itemsToFileList(items: ToolContextItem[]): FileListItem[] {
  return items.map((item) => ({
    name: path.basename(item.value) || item.label,
    path: item.value,
    kind: item.kind === 'directory' ? 'directory' : 'file',
  }))
}

export function pathsToFileList(paths: string[]): FileListItem[] {
  return paths.map((p) => {
    let kind: 'file' | 'directory' = 'file'
    try {
      kind = fs.statSync(p).isDirectory() ? 'directory' : 'file'
    } catch {
      // default file
    }
    return { name: path.basename(p), path: p, kind }
  })
}

export function formatCompactFileList(
  items: FileListItem[],
  title: string,
  max = 8
): string {
  if (items.length === 0) return `No files found for "${title}".`
  const shown = items.slice(0, max)
  const lines = shown.map((item, i) => {
    const icon = item.kind === 'directory' ? '📁' : '📄'
    return `${i + 1}. ${icon} ${item.name}`
  })
  const more = items.length > max ? `\n+${items.length - max} more` : ''
  return `${title} (${items.length}):\n${lines.join('\n')}${more}`
}

export function extractFileListFromResult(result: ToolResultLike): FileListItem[] {
  if (!result.success || !result.data) return []
  const data = result.data as {
    items?: ToolContextItem[]
    matches?: string[]
    files?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  }

  if (Array.isArray(data.items) && data.items.length > 0) {
    return itemsToFileList(data.items)
  }
  if (Array.isArray(data.matches) && data.matches.length > 0) {
    return pathsToFileList(data.matches)
  }
  if (Array.isArray(data.files) && data.files.length > 0) {
    return data.files.map((f) => ({
      name: f.name,
      path: f.path,
      kind: f.type,
    }))
  }
  return []
}
