import type { Suggestion } from '@/lib/db/schemas'

/** Whether the card should call markShown on first render. */
export function shouldMarkSuggestionShown(status: Suggestion['status']): boolean {
  return status === 'pending'
}
