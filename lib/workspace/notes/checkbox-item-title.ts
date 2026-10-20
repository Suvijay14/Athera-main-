import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

/** Strip task-marker prefixes from checkbox line text before parseQuickAdd. */
export function normalizeCheckboxLineText(raw: string): string {
  return raw
    .replace(/^\[\s*[xX]?\s*\]\s*/, '')
    .replace(/^[-*]\s*\[\s*[xX]?\s*\]\s*/, '')
    .trim()
}

export function checkboxLineToCreatePayload(text: string, now = new Date()) {
  const title = normalizeCheckboxLineText(text)
  if (!title) {
    return null
  }
  const parsed = parseQuickAdd(title, now)
  return quickAddParseToCreatePayload(parsed)
}
