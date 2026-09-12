import { scanEmailForSpaces } from './gmail-scan'
import { extractFileListFromResult } from './file-list'
import { parseReminderInput } from './reminder-parse'
import { buildToolContext } from './tool-context'
import { isKnownFolderName, resolveUserPath } from './path-utils'
import { isLikelyAppName, runTool, toolResultMessage } from './tools'
import type { FileListItem, PendingEmailFiling, PendingToolContext } from '@/lib/types'

function extractOpenTarget(input: string): string {
  return input
    .replace(/^(?:please\s+)?(?:can you\s+)?(?:open|launch|show|go to)\s+(?:the\s+)?(?:file\s+)?(?:named\s+)?/i, '')
    .replace(/^(?:my\s+)/i, '')
    .replace(/\s+folder$/i, '')
    .trim()
}

function extractFileOpenQuery(input: string): string | null {
  const match = input.match(
    /(?:can you|could you|would you|please)?\s*(?:open|launch)\s+(?:the\s+)?(?:file\s+)?(?:named\s+)?(.+?)(?:\s+(?:on|for)\s+(?:my\s+)?(?:mac(?:book)?|computer|laptop|device))?(?:\s+please)?$/i
  )
  if (!match?.[1]) return null
  return match[1]
    .replace(/^(?:my\s+)/i, '')
    .replace(/\s+folder$/i, '')
    .replace(/\s+(?:for me|please)$/i, '')
    .trim() || null
}

/** "find a file name apple", "find file named report", etc. */
export function extractFileSearchQuery(input: string): string | null {
  const lower = input.toLowerCase()
  if (!lower.includes('find') && !lower.includes('search')) return null
  if (lower.includes('email') || lower.includes('inbox')) return null

  const patterns = [
    /find\s+(?:a\s+)?(?:any\s+)?(?:the\s+)?(?:files?\s+)?(?:name(?:d)?|called|matching)\s+(.+?)(?:\s+and\s+(?:list|show)|[?.!]|$)/i,
    /find\s+(?:me\s+)?(?:a\s+)?file\s+name\s+(.+?)(?:[?.!]|$)/i,
    /search\s+(?:for\s+)?(?:files?\s+)?(?:name(?:d)?|called|matching)\s+(.+?)(?:[?.!]|$)/i,
    /(?:look|search)\s+for\s+(?:a\s+)?(?:file\s+)?(?:name(?:d)?\s+)?(.+?)(?:[?.!]|$)/i,
  ]

  for (const pattern of patterns) {
    const m = input.match(pattern)
    if (m?.[1]?.trim()) return m[1].trim()
  }
  return null
}

function isFolderOpenIntent(input: string, query: string): boolean {
  const lower = input.toLowerCase()
  const q = query.toLowerCase().replace(/\s+folder$/i, '').trim()
  if (lower.includes('folder')) return true
  if (isKnownFolderName(q) || isKnownFolderName(query)) return true
  if (/\b(downloads?|desktop|documents?)\b/i.test(q) && !q.includes('.')) return true
  return false
}

function matchFolderOpen(lower: string, input: string): FastPathResult | null {
  const folderMatch = lower.match(
    /(?:open|show|go to|launch)\s+(?:my\s+)?(?:the\s+)?(downloads?(?:\s+folder)?|desktop(?:\s+folder)?|documents?(?:\s+folder)?|home)\b/
  )
  if (folderMatch) {
    const target = resolveUserPath(folderMatch[1])
    if (target) return { tool: 'open_folder', params: { path: target } }
  }

  if (lower.includes('open') || lower.includes('launch')) {
    const query =
      extractFileOpenQuery(input) ??
      (lower.startsWith('open ') || lower.startsWith('launch ') ? extractOpenTarget(input) : null)
    if (query && isFolderOpenIntent(input, query)) {
      const target = resolveUserPath(query)
      if (target) return { tool: 'open_folder', params: { path: target } }
    }
  }

  return null
}

export interface FastPathResult {
  tool: string
  params: Record<string, unknown>
}

export function matchFastPath(input: string): FastPathResult | null {
  const lower = input.toLowerCase().trim()

  if (lower.includes('screenshot') || lower.includes('screen shot') || lower.includes('screen capture')) {
    return { tool: 'take_screenshot', params: {} }
  }

  const reminder = parseReminderInput(input)
  if (reminder) {
    return {
      tool: 'set_reminder',
      params: {
        text: reminder.text,
        ...(reminder.dueAt ? { dueAt: reminder.dueAt.toISOString() } : {}),
      },
    }
  }

  const folder = matchFolderOpen(lower, input)
  if (folder) return folder

  if (lower.includes('what day') || lower.includes("today's date") || lower.includes('what date')) {
    return { tool: 'time', params: {} }
  }

  if (/\b(time|clock)\b/.test(lower) && !lower.includes('timeout')) {
    return { tool: 'time', params: {} }
  }

  if (lower.includes('battery') || lower.includes('charge')) {
    return { tool: 'get_battery', params: {} }
  }

  if (
    lower.includes('wifi') ||
    lower.includes('wi-fi') ||
    lower.includes('internet') ||
    lower.includes('network')
  ) {
    return { tool: 'get_wifi', params: {} }
  }

  const setVolMatch = lower.match(/(?:set volume|volume to)\s*(?:to\s*)?(\d+)/)
  if (setVolMatch) {
    return { tool: 'set_volume', params: { level: Number(setVolMatch[1]) } }
  }

  if (lower.includes('volume') || lower.includes('how loud')) {
    return { tool: 'get_volume', params: {} }
  }

  const copyMatch = input.match(/^copy\s+(.+?)\s+to\s+clipboard\.?$/i)
  if (copyMatch?.[1]) {
    return { tool: 'set_clipboard', params: { text: copyMatch[1].trim() } }
  }

  if (
    lower.includes('clipboard') ||
    lower.includes('copy that') ||
    lower.includes('what did i copy') ||
    lower.includes("what's in my clipboard")
  ) {
    return { tool: 'get_clipboard', params: {} }
  }

  if (
    (lower.includes('pdf') || lower.includes('.pdf')) &&
    (lower.includes('file') || lower.includes('any') || lower.includes('find') || lower.includes('list') || lower.includes('is there'))
    && !lower.includes('email')
  ) {
    return { tool: 'search_files', params: { query: 'pdf', extension: 'pdf' } }
  }

  const fileQuery = extractFileSearchQuery(input)
  if (fileQuery && !lower.includes('email')) {
    return { tool: 'search_files', params: { query: fileQuery } }
  }

  if (
    (lower.includes('scan') || lower.includes('file')) &&
    (lower.includes('email') || lower.includes('inbox') || lower.includes('mail'))
  ) {
    const daysMatch = lower.match(/(?:past|last)\s+(\d+)\s+days?/)
    return {
      tool: 'scan_email_for_spaces',
      params: { days: daysMatch ? Number(daysMatch[1]) : 2 },
    }
  }

  if (
    lower.includes('check') &&
    (lower.includes('email') || lower.includes('inbox') || lower.includes('mail'))
  ) {
    return { tool: 'check_email', params: { count: 5 } }
  }

  if (lower.includes('search') && lower.includes('email')) {
    const query = input
      .replace(/^.*search\s+(?:my\s+)?(?:email|emails|inbox)\s+(?:for\s+)?/i, '')
      .trim()
    return { tool: 'search_email', params: { query: query || input } }
  }

  if (lower.includes('open') || lower.includes('launch')) {
    const query =
      extractFileOpenQuery(input) ??
      (lower.startsWith('open ') || lower.startsWith('launch ') ? extractOpenTarget(input) : null)

    if (query) {
      if (isLikelyAppName(query)) {
        return { tool: 'open_app', params: { app: query } }
      }
      return { tool: 'open_file', params: { query } }
    }
  }

  if (lower.includes('find') && lower.includes('open')) {
    const query = input
      .replace(/^.*find\s+(?:and\s+open\s+)?(?:the\s+)?(?:file\s+)?(?:named\s+)?/i, '')
      .replace(/\s+(?:for me|please)$/i, '')
      .trim()
    if (query) return { tool: 'open_file', params: { query } }
  }

  if (lower.startsWith('read ') || lower.startsWith('read the ')) {
    const fileQuery = input.replace(/^read\s+(?:the\s+)?(?:file\s+)?/i, '').trim()
    if (fileQuery) return { tool: 'read_file', params: { path: fileQuery } }
  }

  if (lower.startsWith('search for ') && !lower.includes('email')) {
    return { tool: 'web_search', params: { query: input.slice(11).trim() } }
  }

  if (lower.startsWith('google ')) {
    return { tool: 'web_search', params: { query: input.slice(7).trim() } }
  }

  if (
    lower.includes('what can you do') ||
    lower.includes('capabilities') ||
    lower === 'help' ||
    lower.startsWith('help ')
  ) {
    return { tool: 'capabilities', params: {} }
  }

  return null
}

function queryFromParams(tool: string, params: Record<string, unknown>): string {
  if (typeof params.query === 'string') return params.query
  if (typeof params.path === 'string') return params.path
  if (typeof params.name === 'string') return params.name
  return tool
}

export async function runFastPath(
  input: string
): Promise<{
  response: string
  tool: string
  pendingEmailFiling?: PendingEmailFiling
  pendingToolContext?: PendingToolContext | null
  fileList?: FileListItem[]
} | null> {
  const match = matchFastPath(input)
  if (!match) return null

  if (match.tool === 'scan_email_for_spaces') {
    const days = Number(match.params.days) || 2
    const result = await scanEmailForSpaces(days)
    if (result.pending) {
      return {
        response: result.pending.userMessage,
        tool: match.tool,
        pendingEmailFiling: result.pending,
      }
    }
    return { response: result.message, tool: match.tool }
  }

  const result = await runTool(match.tool, match.params)
  const response = toolResultMessage(result)
  const query = queryFromParams(match.tool, match.params)
  const pendingToolContext = buildToolContext(match.tool, query, result)
  const fileList = extractFileListFromResult(result)

  let finalResponse = response
  if (pendingToolContext && fileList.length > 1) {
    finalResponse = `${response}\n\nTap a file below, or say "open 1".`
  }

  return {
    response: finalResponse,
    tool: match.tool,
    pendingToolContext,
    fileList: fileList.length > 0 ? fileList : undefined,
  }
}
