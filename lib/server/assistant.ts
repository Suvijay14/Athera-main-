import { randomUUID } from 'node:crypto'
import { llmChat } from './llm'
import { runTool, TOOL_CATALOG, type ToolResult } from './tools'
import type { PendingApproval, PendingFileItem } from '@/lib/types'

const SYSTEM = `You are Athena, an intelligent personal assistant running on the user's Mac. You have access to these tools:

- time: get current time and date
- list_files: list files in a directory
- search_files: search files by name
- take_screenshot: take a screenshot
- open_app: open any Mac application
- open_file: find and open a file by name or path on your Mac
- create_note: save a note to Documents
- set_reminder: create a reminder
- web_search: search Google in browser
- get_battery: check battery level
- get_wifi: check WiFi network
- get_clipboard: read clipboard
- set_clipboard: write to clipboard
- get_volume / set_volume: control audio
- capabilities: list what you can do
- create_space: create a project workspace
- check_email: read unread Gmail inbox
- search_email: search Gmail
- send_email: send Gmail message
- scan_email_for_spaces: scan recent Gmail and match to spaces
- read_file, find_file, open_folder, get_system_info, list_spaces

Use tools whenever they match the user's request. Be concise. Speak naturally — your reply will be read aloud by a TTS voice.

${TOOL_CATALOG}

Rules:
- Reply with ONLY valid JSON, no markdown fences.
- To speak to the user: {"action":"respond","text":"your short spoken reply"}
- To use a tool: {"action":"tool","tool":"tool_name","params":{}}
- After tool results, decide next step (another tool or respond).
- Keep spoken replies under 2 sentences. Be direct.
- When you list files, tell the user a floating widget appeared — they can drag it into a Space to save the files.
- Never mention Dex or vault.
- If you cannot do something, respond honestly.`

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantResult {
  response: string
  toolsUsed: string[]
  pendingApproval?: PendingApproval
}

interface AgentAction {
  action: 'respond' | 'tool'
  text?: string
  tool?: string
  params?: Record<string, unknown>
}

function parseAction(raw: string): AgentAction | null {
  const jsonMatch = raw.trim().match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try {
    return JSON.parse(jsonMatch[0]) as AgentAction
  } catch {
    return null
  }
}

function pendingFromListFiles(result: ToolResult): PendingApproval | undefined {
  if (!result.success || !result.data) return undefined
  const data = result.data as {
    path?: string
    folder?: string
    files?: PendingFileItem[]
  }
  if (!data.files?.length) return undefined

  return {
    id: randomUUID(),
    label: data.folder ?? 'Desktop',
    sourcePath: data.path ?? '',
    files: data.files,
  }
}

function spokenFromToolResult(result: ToolResult): string {
  if (!result.success) return result.error ?? 'That tool failed.'
  const data = result.data as { message?: string; content?: string; matches?: string[] }
  if (data.message) return data.message
  if (data.content) return data.content.slice(0, 500)
  return 'Done.'
}

export async function runAssistant(
  userText: string,
  history: ChatMessage[] = []
): Promise<AssistantResult> {
  const toolsUsed: string[] = []
  let pendingApproval: PendingApproval | undefined

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: SYSTEM },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userText },
  ]

  for (let step = 0; step < 5; step++) {
    const raw = await llmChat(messages)
    const action = parseAction(raw)

    if (!action) return { response: raw || 'I could not process that.', toolsUsed, pendingApproval }

    if (action.action === 'respond' && action.text) {
      return { response: action.text, toolsUsed, pendingApproval }
    }

    if (action.action === 'tool' && action.tool) {
      toolsUsed.push(action.tool)
      const result = await runTool(action.tool, action.params ?? {})

      if (action.tool === 'list_files' && result.success) {
        pendingApproval = pendingFromListFiles(result)
      }

      const toolMessage = spokenFromToolResult(result)

      messages.push({ role: 'assistant', content: raw })
      messages.push({
        role: 'user',
        content: `Tool result for ${action.tool}: ${JSON.stringify(result)}`,
      })

      if (pendingApproval && action.tool === 'list_files') {
        return {
          response: `${toolMessage} A floating widget appeared — drag it onto a Space to save these files.`,
          toolsUsed,
          pendingApproval,
        }
      }

      if (step === 4) {
        return { response: toolMessage, toolsUsed, pendingApproval }
      }

      continue
    }

    return {
      response: raw.trim() || 'I could not process that. Try saying "open [filename]".',
      toolsUsed,
      pendingApproval,
    }
  }

  return { response: 'I hit my step limit. Try a simpler request.', toolsUsed, pendingApproval }
}
