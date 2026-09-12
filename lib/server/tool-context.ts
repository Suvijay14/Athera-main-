import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { formatCompactFileList, itemsToFileList } from './file-list'
import { runTool, toolResultMessage, type ToolResult } from './tools'
import type { FileListItem, PendingToolContext, ToolContextItem } from '@/lib/types'

const CONTEXT_TTL_MS = 10 * 60 * 1000

const LIST_PATTERNS = [
  /^list them\b/i,
  /^show them\b/i,
  /^what are they\b/i,
  /^what did you find\b/i,
  /^can you list\b/i,
  /^list (?:those|these|the results?)\b/i,
  /^show (?:those|these|the results?)\b/i,
]

const DISMISS_PATTERNS = [
  /^never mind\b/i,
  /^no thanks\b/i,
  /^forget it\b/i,
  /^cancel\b/i,
  /^stop\b/i,
]

const INDEX_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  sixth: 6,
  seventh: 7,
  eighth: 8,
  ninth: 9,
  tenth: 10,
  last: -1,
}

const CONTEXT_TOOLS = new Set([
  'search_files',
  'find_file',
  'check_email',
  'search_email',
  'list_files',
  'open_file',
])

function isExpired(ctx: PendingToolContext): boolean {
  return Date.now() > new Date(ctx.expiresAt).getTime()
}

function itemsFromMatches(matches: string[]): ToolContextItem[] {
  return matches.map((p, i) => ({
    label: `${i + 1}. ${path.basename(p)}`,
    value: p,
    kind: 'file' as const,
  }))
}

export function buildToolContext(
  tool: string,
  query: string,
  result: ToolResult
): PendingToolContext | null {
  if (!CONTEXT_TOOLS.has(tool) || !result.success || !result.data) return null

  const data = result.data as {
    items?: ToolContextItem[]
    matches?: string[]
    files?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  }

  let items: ToolContextItem[] = []

  if (Array.isArray(data.items) && data.items.length > 0) {
    items = data.items
  } else if (Array.isArray(data.matches) && data.matches.length > 1) {
    items = itemsFromMatches(data.matches)
  } else if (Array.isArray(data.files) && data.files.length > 0) {
    items = data.files.map((f, i) => ({
      label: `${i + 1}. ${f.name} (${f.type})`,
      value: f.path,
      kind: f.type,
    }))
  }

  if (items.length < 2) return null

  return {
    id: randomUUID(),
    sourceTool: tool,
    query,
    items,
    expiresAt: new Date(Date.now() + CONTEXT_TTL_MS).toISOString(),
    userMessage: `I found ${items.length} results. Say "list them", "open the first one", or pick a number.`,
  }
}

export function isFollowUp(text: string, ctx?: PendingToolContext | null): boolean {
  if (!ctx || isExpired(ctx)) return false
  const trimmed = text.trim()
  if (DISMISS_PATTERNS.some((p) => p.test(trimmed))) return true
  if (LIST_PATTERNS.some((p) => p.test(trimmed))) return true
  if (parseIndex(trimmed) !== null) return true
  if (/\b(them|those|these|that one|it)\b/i.test(trimmed)) return true
  if (/^(?:open|read)\s+(?:the\s+)?(?:first|second|third|\d+|last)\b/i.test(trimmed)) return true
  return false
}

function parseIndex(text: string): number | null {
  const lower = text.toLowerCase().trim()

  const numMatch = lower.match(/\b(?:number|#|item)?\s*(\d{1,2})\b/)
  if (numMatch) return Number(numMatch[1])

  for (const [word, index] of Object.entries(INDEX_WORDS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) {
      return index
    }
  }

  return null
}

function resolveIndex(index: number, total: number): number {
  if (index === -1) return total
  return Math.max(1, Math.min(index, total))
}

function listItems(ctx: PendingToolContext): string {
  return formatCompactFileList(itemsToFileList(ctx.items), `${ctx.items.length} results`)
}

async function actOnItem(
  ctx: PendingToolContext,
  item: ToolContextItem,
  action: 'open' | 'read'
): Promise<{ response: string; toolsUsed: string[] }> {
  if (item.kind === 'email') {
    return {
      response: `Email: ${item.label}`,
      toolsUsed: ['tool_context'],
    }
  }

  if (item.kind === 'directory') {
    const result = await runTool('open_folder', { path: item.value })
    return { response: toolResultMessage(result), toolsUsed: ['open_folder'] }
  }

  const tool = action === 'read' ? 'read_file' : 'open_file'
  const result = await runTool(tool, action === 'read' ? { path: item.value } : { query: item.value })
  return { response: toolResultMessage(result), toolsUsed: [tool] }
}

export async function resolveFollowUp(
  text: string,
  ctx: PendingToolContext
): Promise<{
  response: string
  toolsUsed: string[]
  pendingToolContext?: PendingToolContext | null
  fileList?: FileListItem[]
  handled: boolean
}> {
  if (isExpired(ctx)) {
    return {
      response: 'That context expired. Please run the search again.',
      toolsUsed: [],
      pendingToolContext: null,
      handled: true,
    }
  }

  const trimmed = text.trim()

  if (DISMISS_PATTERNS.some((p) => p.test(trimmed))) {
    return {
      response: 'Okay, cleared.',
      toolsUsed: [],
      pendingToolContext: null,
      handled: true,
    }
  }

  if (LIST_PATTERNS.some((p) => p.test(trimmed)) || /^list\b/i.test(trimmed)) {
    return {
      response: listItems(ctx),
      toolsUsed: ['tool_context'],
      pendingToolContext: ctx,
      fileList: itemsToFileList(ctx.items),
      handled: true,
    }
  }

  const index = parseIndex(trimmed)
  if (index !== null) {
    const resolved = resolveIndex(index, ctx.items.length)
    const item = ctx.items[resolved - 1]
    if (!item) {
      return {
        response: `I only have ${ctx.items.length} results.`,
        toolsUsed: [],
        pendingToolContext: ctx,
        handled: true,
      }
    }
    const action = /\bread\b/i.test(trimmed) ? 'read' : 'open'
    const result = await actOnItem(ctx, item, action)
    return { ...result, pendingToolContext: ctx, handled: true }
  }

  if (/\b(them|those|these)\b/i.test(trimmed) && /\blist\b/i.test(trimmed)) {
    return {
      response: listItems(ctx),
      toolsUsed: ['tool_context'],
      pendingToolContext: ctx,
      fileList: itemsToFileList(ctx.items),
      handled: true,
    }
  }

  return { response: '', toolsUsed: [], handled: false }
}

export function contextForAssistant(ctx: PendingToolContext): string {
  const items = ctx.items.map((item, i) => `${i + 1}. ${item.label} → ${item.value}`).join('\n')
  return `Previous ${ctx.sourceTool} for "${ctx.query}" returned:\n${items}\nUse this when the user refers to "them", "those", or a number.`
}
