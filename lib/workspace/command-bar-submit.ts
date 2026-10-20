import type { CommandBarJumpTarget } from '@/lib/workspace/command-bar-search'
import { shouldPreferCreateOverJump } from '@/lib/workspace/command-bar-search'

export type CommandBarSubmitRow =
  | { kind: 'chip'; requestText: string | null }
  | { kind: 'jump'; target: CommandBarJumpTarget }
  | { kind: 'create'; label: string }

export type CommandBarSubmitDecision =
  | { action: 'create'; text: string }
  | { action: 'jump'; target: CommandBarJumpTarget }
  | { action: 'viewRequest'; text: string }
  | { action: 'none' }

/**
 * Mirrors command-bar Enter routing: search vs quick-add vs view request.
 */
export function decideCommandBarSubmit(
  query: string,
  jumpResults: CommandBarJumpTarget[],
  activeRow: CommandBarSubmitRow | null
): CommandBarSubmitDecision {
  const trimmed = query.trim()
  if (!trimmed) {
    return { action: 'none' }
  }

  if (activeRow?.kind === 'create') {
    return { action: 'create', text: activeRow.label }
  }

  if (
    activeRow?.kind === 'jump' &&
    !shouldPreferCreateOverJump(trimmed, jumpResults)
  ) {
    return { action: 'jump', target: activeRow.target }
  }

  if (activeRow?.kind === 'chip' && activeRow.requestText) {
    return { action: 'viewRequest', text: activeRow.requestText }
  }

  if (shouldPreferCreateOverJump(trimmed, jumpResults)) {
    return { action: 'create', text: trimmed }
  }

  const bestJump = jumpResults[0]
  if (bestJump && bestJump.score >= 70) {
    return { action: 'jump', target: bestJump }
  }

  return { action: 'viewRequest', text: trimmed }
}
