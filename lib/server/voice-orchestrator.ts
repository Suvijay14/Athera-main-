import { runAssistant, type AssistantResult, type ChatMessage } from './assistant'
import { runFastPath } from './fast-path'
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
import type { PendingEmailFiling, PendingLifeAction } from '@/lib/types'

export interface VoiceCommandResult extends AssistantResult {
  pendingLifeAction?: PendingLifeAction
  pendingEmailFiling?: PendingEmailFiling
}

/** Routes life updates through Athena reasoning; otherwise uses tool assistant */
export async function runVoiceCommand(
  text: string,
  history: ChatMessage[] = [],
  pendingLife?: PendingLifeAction | null,
  pendingEmail?: PendingEmailFiling | null
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
    }
  }

  return runAssistant(trimmed, history)
}
