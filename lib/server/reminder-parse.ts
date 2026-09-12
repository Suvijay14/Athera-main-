/** Parse natural-language reminder commands into text + optional due date */

function normalizeInput(input: string): string {
  return input
    .replace(/\bp\.m\./gi, 'pm')
    .replace(/\ba\.m\./gi, 'am')
    .replace(/\s+/g, ' ')
    .trim()
}

const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i

const TIME_ONLY_BODY =
  /^(?:(today|tomorrow|tonight)\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s+(today|tomorrow|tonight))?$/i

function parseClockTime(hour: number, minute: number, ampm?: string): { hours: number; minutes: number } {
  let h = hour
  const m = minute
  if (ampm) {
    const lower = ampm.toLowerCase()
    if (lower === 'pm' && h < 12) h += 12
    if (lower === 'am' && h === 12) h = 0
  }
  return { hours: h, minutes: m }
}

function applyTimeToDate(base: Date, timeStr: string): Date | null {
  const match = timeStr.trim().match(TIME_RE)
  if (!match) return null
  const hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  const ampm = match[3]
  const { hours, minutes } = parseClockTime(hour, minute, ampm)

  const d = new Date(base)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function baseDateFromPhrase(phrase: string): Date {
  const lower = phrase.toLowerCase()
  const d = new Date()
  d.setSeconds(0, 0)

  if (lower.includes('tomorrow')) {
    d.setDate(d.getDate() + 1)
    return d
  }
  if (lower.includes('today') || lower.includes('tonight')) {
    return d
  }
  return d
}

function extractTimePhrase(input: string): string | null {
  const patterns = [
    /\bfor\s+(today|tomorrow|tonight)\s+at\s+(.+?)$/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s+(today|tomorrow|tonight)\b/i,
    /\b(today|tomorrow|tonight)\s+at\s+(.+?)$/i,
    /\b(today|tomorrow|tonight)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
    /\bat\s+(.+?)$/i,
    /\bfor\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*$/i,
  ]

  for (const pattern of patterns) {
    const m = input.match(pattern)
    if (!m) continue
    if (m[2] && /^(today|tomorrow|tonight)$/i.test(m[1])) {
      return `${m[1]} ${m[2]}`
    }
    if (m[2] && /^(today|tomorrow|tonight)$/i.test(m[2])) {
      return `${m[2]} ${m[1]}`
    }
    if (m[2]) return `${m[1]} at ${m[2]}`
    return m[1]
  }

  const clockOnly = input.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i)
  if (clockOnly) return clockOnly[1]

  return null
}

function stripTimeFromText(input: string): string {
  return input
    .replace(/\s+(?:at|by|on|for)\s+(?:today|tomorrow|tonight)\s+at\s+.+$/i, '')
    .replace(/\s+(?:at|by|on)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?.*$/i, '')
    .replace(/\s+for\s+(?:today|tomorrow|tonight)\s*$/i, '')
    .replace(/\s+for\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?:\s+(?:today|tomorrow|tonight))?\s*$/i, '')
    .replace(/^\d{1,2}(?::\d{2})?\s*(?:am|pm)\s+(today|tomorrow|tonight)$/i, '')
    .replace(/^(today|tomorrow|tonight)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)$/i, '')
    .trim()
}

function isTimeOnlyBody(body: string): boolean {
  return TIME_ONLY_BODY.test(body.trim())
}

export function parseReminderInput(input: string): { text: string; dueAt?: Date } | null {
  const trimmed = normalizeInput(input)
  const lower = trimmed.toLowerCase()

  if (!/\b(remind|reminder)\b/.test(lower)) return null

  let body = trimmed

  const prefixPatterns = [
    /^(?:please\s+)?(?:can you\s+)?(?:set\s+(?:a\s+)?reminder\s+(?:to|for)\s+)/i,
    /^(?:please\s+)?(?:can you\s+)?(?:remind me to\s+)/i,
    /^(?:please\s+)?(?:can you\s+)?(?:set\s+(?:a\s+)?reminder\s+)/i,
    /^reminder:\s*/i,
  ]

  for (const p of prefixPatterns) {
    if (p.test(body)) {
      body = body.replace(p, '').trim()
      break
    }
  }

  let dueAt: Date | undefined
  let text = body

  // "6 pm today to eat food" / "today at 6 pm to eat food"
  const timeThenTo = body.match(
    /^(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s+(today|tomorrow|tonight)\s+to\s+(.+)$/i
  )
  const todayAtTimeTo = body.match(
    /^(today|tomorrow|tonight)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s+to\s+(.+)$/i
  )
  const toAtEnd = body.match(/^(.+?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm))(?:\s+(today|tomorrow|tonight))?$/i)

  if (timeThenTo) {
    const parsed = applyTimeToDate(baseDateFromPhrase(timeThenTo[2]), timeThenTo[1])
    if (parsed) dueAt = parsed
    text = timeThenTo[3].trim()
  } else if (todayAtTimeTo) {
    const parsed = applyTimeToDate(baseDateFromPhrase(todayAtTimeTo[1]), todayAtTimeTo[2])
    if (parsed) dueAt = parsed
    text = todayAtTimeTo[3].trim()
  } else if (toAtEnd) {
    const day = toAtEnd[3] ?? 'today'
    const parsed = applyTimeToDate(baseDateFromPhrase(day), toAtEnd[2])
    if (parsed) dueAt = parsed
    text = toAtEnd[1].trim()
  } else {
    const timePhrase = extractTimePhrase(trimmed) ?? extractTimePhrase(body)
    if (timePhrase) {
      const base = baseDateFromPhrase(timePhrase)
      const clockMatch = timePhrase.match(TIME_RE)
      if (clockMatch) {
        const parsed = applyTimeToDate(base, clockMatch[0])
        if (parsed) dueAt = parsed
      }
    }
    text = stripTimeFromText(body)
    text = text.replace(/^(?:for|to)\s+/i, '').trim()
  }

  if (!text || /^(today|tomorrow|tonight)$/i.test(text) || isTimeOnlyBody(text)) {
    text = 'Reminder'
  } else {
    text = text.charAt(0).toUpperCase() + text.slice(1)
  }

  return { text, dueAt }
}

/** Run reminder tool directly — bypasses LLM entirely */
export function isReminderCommand(input: string): boolean {
  return /\b(remind|reminder)\b/i.test(normalizeInput(input))
}

export function formatReminderTime(d: Date): string {
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function buildReminderAppleScript(name: string, due?: Date): string {
  const escaped = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  if (!due) {
    return `tell application "Reminders" to make new reminder with properties {name:"${escaped}"}`
  }

  const month = due.getMonth() + 1
  const day = due.getDate()
  const year = due.getFullYear()
  const hours = due.getHours()
  const minutes = due.getMinutes()

  return `
tell application "Reminders"
  set newReminder to make new reminder with properties {name:"${escaped}"}
  set d to current date
  set year of d to ${year}
  set month of d to ${month}
  set day of d to ${day}
  set hours of d to ${hours}
  set minutes of d to ${minutes}
  set seconds of d to 0
  set due date of newReminder to d
end tell`.trim()
}
