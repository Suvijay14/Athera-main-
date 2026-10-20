import { parseQuickAdd } from '@/lib/workspace/parse-quick-add'
import { quickAddParseToCreatePayload } from '@/lib/workspace/quick-add-submit'

export type PasteWeekLineResult = {
  line: string
  title: string
  skipped: boolean
}

export type PasteWeekParsedItem = ReturnType<typeof quickAddParseToCreatePayload> & {
  line: string
}

/**
 * Splits pasted text into non-empty lines and parses each with parseQuickAdd.
 */
export function parsePasteWeekLines(input: string, now: Date): PasteWeekParsedItem[] {
  const lines = input.split(/\r?\n/)
  const out: PasteWeekParsedItem[] = []

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      continue
    }
    const parsed = parseQuickAdd(line, now)
    if (!parsed.title.trim()) {
      continue
    }
    const payload = quickAddParseToCreatePayload(parsed)
    out.push({ ...payload, line })
  }

  return out
}
