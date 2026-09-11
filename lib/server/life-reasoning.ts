import { llmGenerateJSON } from './llm'
import type { PendingLifeAction } from '@/lib/types'

const PHASE1_SYSTEM = `You are a life reasoning engine. The user shared something about their life. Return ONLY valid JSON:

{
  "signal": "plain English: what happened",
  "kind": "semester_started | semester_ended | employment_started | employment_ended | residence_changed | relationship_started | relationship_ended | job_search_started | major_routine_change | upcoming_exam | upcoming_interview | new_project | falling_behind | no_transition",
  "certainty": 0.95,
  "modality": "confirmed | hypothetical",
  "facts": ["fact 1", "fact 2"],
  "userMessage": "warm 1-sentence spoken reply"
}

Rules:
- Casual chat with no life change → kind: no_transition
- "I might", "thinking about" → modality: hypothetical
- Return ONLY JSON. No explanation.`

const PHASE2_SYSTEM = `You are a life adaptation engine. A confirmed life change was detected. Decide what software adaptation is needed.

Return ONLY valid JSON:
{
  "shouldAdapt": true,
  "adaptation": "what should change",
  "actionType": "create_space",
  "actionTarget": "name of space or folder",
  "scanPaths": ["~/Desktop", "~/Documents", "~/Downloads"],
  "lifeNote": "2-3 sentence markdown summary of this life update",
  "userMessage": "spoken confirmation asking user if they want this"
}

Important: userMessage should ASK the user for confirmation.
Example: "I can create a new Athena space and scan your files for anything related. Want me to do that?"

For semester_started: use actionType "create_space" with actionTarget like "Fall 2026 Berkeley" and scan for course files.

CRITICAL: actionType must be EXACTLY ONE of: create_space, archive_space, add_to_space, scan_files, no_action. Never combine with | or and.

Return ONLY JSON. No explanation.`

const VALID_ACTIONS = [
  'create_space',
  'archive_space',
  'add_to_space',
  'scan_files',
  'no_action',
] as const

export function normalizeActionType(raw: string): string {
  const lower = raw.toLowerCase().trim()
  for (const action of VALID_ACTIONS) {
    if (lower.includes(action)) return action
  }
  return 'no_action'
}

interface Phase1Response {
  signal: string
  kind: string
  certainty: number
  modality: string
  facts?: string[]
  userMessage: string
}

interface Phase2Response {
  shouldAdapt: boolean
  actionType: string
  actionTarget: string
  scanPaths?: string[]
  lifeNote: string
  userMessage: string
}

function parseJson<T>(raw: string): T | null {
  const match = raw.trim().match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as T
  } catch {
    return null
  }
}

export async function queryLifeReasoning(input: string): Promise<PendingLifeAction | null> {
  const raw1 = await llmGenerateJSON(PHASE1_SYSTEM, input)
  const phase1 = parseJson<Phase1Response>(raw1)
  if (!phase1?.signal || !phase1.kind) return null

  let shouldAdapt = false
  let actionType = 'no_action'
  let actionTarget = ''
  let lifeNote = `Noted: ${phase1.signal}`
  let userMessage = phase1.userMessage
  let scanPaths: string[] | undefined

  if (
    phase1.certainty > 0.7 &&
    phase1.modality === 'confirmed' &&
    phase1.kind !== 'no_transition'
  ) {
    const raw2 = await llmGenerateJSON(PHASE2_SYSTEM, phase1.signal)
    const phase2 = parseJson<Phase2Response>(raw2)
    if (phase2) {
      shouldAdapt = phase2.shouldAdapt
      actionType = normalizeActionType(phase2.actionType)
      actionTarget = phase2.actionTarget
      lifeNote = phase2.lifeNote
      userMessage = phase2.userMessage
      scanPaths = phase2.scanPaths
    }
  }

  return {
    signal: phase1.signal,
    kind: phase1.kind,
    certainty: phase1.certainty,
    modality: phase1.modality,
    facts: phase1.facts ?? [],
    shouldAdapt,
    actionType,
    actionTarget,
    lifeNote,
    userMessage,
    scanPaths,
  }
}
