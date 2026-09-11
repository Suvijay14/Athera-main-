import { scanEmailForSpaces } from './gmail-scan'
import { isLikelyAppName, runTool, toolResultMessage } from './tools'
import type { PendingEmailFiling } from '@/lib/types'

function extractOpenTarget(input: string): string {
  return input
    .replace(/^(?:please\s+)?(?:can you\s+)?(?:open|launch)\s+(?:the\s+)?(?:file\s+)?(?:named\s+)?/i, '')
    .replace(/^(?:my\s+)/i, '')
    .trim()
}

/** "can you open X on my macbook", "please open the file X", etc. */
function extractFileOpenQuery(input: string): string | null {
  const match = input.match(
    /(?:can you|could you|would you|please)?\s*(?:open|launch)\s+(?:the\s+)?(?:file\s+)?(?:named\s+)?(.+?)(?:\s+(?:on|for)\s+(?:my\s+)?(?:mac(?:book)?|computer|laptop|device))?(?:\s+please)?$/i
  )
  if (!match?.[1]) return null
  return match[1]
    .replace(/^(?:my\s+)/i, '')
    .replace(/\s+(?:for me|please)$/i, '')
    .trim() || null
}

export interface FastPathResult {
  tool: string
  params: Record<string, unknown>
}

/** Instant tool detection — bypasses Ollama. Life updates must be checked first. */
export function matchFastPath(input: string): FastPathResult | null {
  const lower = input.toLowerCase().trim()

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

  if (
    lower.includes('clipboard') ||
    lower.includes('copy that') ||
    lower.includes('what did i copy')
  ) {
    return { tool: 'get_clipboard', params: {} }
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

export async function runFastPath(
  input: string
): Promise<{ response: string; tool: string; pendingEmailFiling?: PendingEmailFiling } | null> {
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
  return { response: toolResultMessage(result), tool: match.tool }
}
