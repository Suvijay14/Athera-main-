import { runAssistant, type AssistantResult, type ChatMessage } from './assistant'
import { extractFileSearchQuery, runFastPath } from './fast-path'
import { classifyIntent } from './intent-router'
import { queryLifeReasoning } from './life-reasoning'
import {
  executeLifeAction,
  isAffirmative,
  isNegative,
  writeLifeNote,
} from './life-actions'
import {
  dismissEmailFiling,
  executeEmailFiling,
} from './gmail-scan'
import { extractFileListFromResult } from './file-list'
import { isReminderCommand, parseReminderInput } from './reminder-parse'
import {
  buildToolContext,
  contextForAssistant,
  isFollowUp,
  resolveFollowUp,
} from './tool-context'
import { runTool, toolResultMessage } from './tools'
import type { FileListItem, PendingEmailFiling, PendingLifeAction, PendingToolContext } from '@/lib/types'

export interface VoiceCommandResult extends AssistantResult {
  pendingLifeAction?: PendingLifeAction
  pendingEmailFiling?: PendingEmailFiling
  pendingToolContext?: PendingToolContext | null
  fileList?: FileListItem[]
}

/** Routes life updates through Athera reasoning; otherwise uses tool assistant */
export async function runVoiceCommand(
  text: string,
  history: ChatMessage[] = [],
  pendingLife?: PendingLifeAction | null,
  pendingEmail?: PendingEmailFiling | null,
  pendingTool?: PendingToolContext | null
): Promise<VoiceCommandResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { response: 'I did not catch that.', toolsUsed: [] }
  }

  if (pendingEmail) {
    if (isAffirmative(trimmed)) {
      const response = await executeEmailFiling(pendingEmail)
      return { response, toolsUsed: ['email_filing'] }
    }
    if (isNegative(trimmed)) {
      dismissEmailFiling(pendingEmail)
      return { response: 'Okay, skipped those.', toolsUsed: [] }
    }
    return {
      response: pendingEmail.userMessage,
      toolsUsed: [],
      pendingEmailFiling: pendingEmail,
    }
  }

  if (pendingLife) {
    if (isAffirmative(trimmed)) {
      const response = await executeLifeAction(pendingLife)
      return { response, toolsUsed: ['life_action'] }
    }
    if (isNegative(trimmed)) {
      return { response: 'No problem, noted.', toolsUsed: [] }
    }
    return {
      response: pendingLife.userMessage,
      toolsUsed: [],
      pendingLifeAction: pendingLife,
    }
  }

  // Reminders always bypass LLM — deterministic parse + AppleScript
  if (isReminderCommand(trimmed)) {
    const parsed = parseReminderInput(trimmed)
    if (parsed) {
      const result = await runTool('set_reminder', {
        text: parsed.text,
        ...(parsed.dueAt ? { dueAt: parsed.dueAt.toISOString() } : {}),
      })
      return {
        response: toolResultMessage(result),
        toolsUsed: ['set_reminder'],
        pendingToolContext: null,
      }
    }
  }

  // File search bypasses LLM — same as reminders
  const fileQuery = extractFileSearchQuery(trimmed)
  if (fileQuery) {
    const result = await runTool('search_files', { query: fileQuery })
    const pendingToolContext = buildToolContext('search_files', fileQuery, result)
    const fileList = extractFileListFromResult(result)
    let response = toolResultMessage(result)
    if (pendingToolContext && fileList.length > 1) {
      response = `${response}\n\nTap a file below, or say "open 1".`
    }
    return {
      response,
      toolsUsed: ['search_files'],
      pendingToolContext,
      fileList: fileList.length > 0 ? fileList : undefined,
    }
  }

  if (pendingTool && isFollowUp(trimmed, pendingTool)) {
    const followUp = await resolveFollowUp(trimmed, pendingTool)
    if (followUp.handled) {
      return {
        response: followUp.response,
        toolsUsed: followUp.toolsUsed,
        pendingToolContext: followUp.pendingToolContext,
        fileList: followUp.fileList,
      }
    }
  }

  if (classifyIntent(trimmed) === 'lifeUpdate') {
    const result = await queryLifeReasoning(trimmed)
    if (!result) {
      return { response: "Got it, I've noted that.", toolsUsed: ['life_reasoning'] }
    }

    writeLifeNote(result)

    if (result.shouldAdapt && result.actionType !== 'no_action') {
      return {
        response: result.userMessage,
        toolsUsed: ['life_reasoning'],
        pendingLifeAction: result,
      }
    }

    return { response: result.userMessage, toolsUsed: ['life_reasoning'] }
  }

  const fast = await runFastPath(trimmed)
  if (fast) {
    return {
      response: fast.response,
      toolsUsed: [fast.tool],
      pendingEmailFiling: fast.pendingEmailFiling,
      pendingToolContext: fast.pendingToolContext ?? null,
      fileList: fast.fileList,
    }
  }

  const contextHint = pendingTool ? contextForAssistant(pendingTool) : undefined
  const assistantResult = await runAssistant(trimmed, history, contextHint)

  let pendingToolContext: PendingToolContext | null = pendingTool ?? null
  const lastTool = assistantResult.toolsUsed.at(-1)
  if (lastTool && assistantResult.lastToolResult) {
    const built = buildToolContext(lastTool, trimmed, assistantResult.lastToolResult)
    if (built) pendingToolContext = built
  }

  const fileList = assistantResult.lastToolResult
    ? extractFileListFromResult(assistantResult.lastToolResult)
    : undefined

  return {
    ...assistantResult,
    pendingToolContext,
    fileList: fileList && fileList.length > 0 ? fileList : undefined,
  }
}
