import fs from 'node:fs'
import path from 'node:path'

const COMMANDS_PATH = path.join(process.cwd(), 'COMMANDS.md')

export interface ConfirmedRow {
  command: string
  phrase: string
  tool: string
  notes: string
}

export interface BrokenRow {
  command: string
  phrase: string
  error: string
  fixNeeded: string
}

export interface UntestedRow {
  command: string
  phrase: string
  tool: string
}

export interface CommandsData {
  lastUpdated: string
  confirmed: ConfirmedRow[]
  broken: BrokenRow[]
  untested: UntestedRow[]
}

export interface CommandFeedback {
  phrase: string
  response: string
  tool?: string
  status: 'confirmed' | 'broken'
  error?: string
  timestamp: string
}

export function detectTool(phrase: string): string {
  const lower = phrase.toLowerCase()
  if (/\b(time|clock|what day|date)\b/.test(lower)) return 'time'
  if (lower.includes('battery') || lower.includes('charge')) return 'get_battery'
  if (lower.includes('wifi') || lower.includes('wi-fi') || lower.includes('network'))
    return 'get_wifi'
  if (lower.includes('open') && (lower.includes('file') || lower.includes('document')))
    return 'open_file'
  if (lower.includes('find') && lower.includes('open')) return 'open_file'
  if (lower.startsWith('open ') || lower.startsWith('launch ')) return 'open_app'
  if (lower.includes('note')) return 'create_note'
  if (lower.includes('remind')) return 'set_reminder'
  if (lower.includes('search') || lower.includes('find file')) return 'search_files'
  if (lower.includes('copy') && lower.includes('clipboard')) return 'set_clipboard'
  if (lower.includes('clipboard')) return 'get_clipboard'
  if (lower.includes('folder') && lower.includes('open')) return 'open_folder'
  if (lower.includes('volume')) return 'set_volume / get_volume'
  if (lower.includes('screenshot')) return 'take_screenshot'
  if (lower.includes('semester') || lower.includes('life') || lower.includes('started'))
    return 'life_action'
  if (lower.includes('space')) return 'create_space'
  if (lower.includes('file') || lower.includes('desktop')) return 'list_files'
  if (lower.includes('capabilities') || lower.includes('what can you do')) return 'capabilities'
  if (lower.includes('scan') && (lower.includes('email') || lower.includes('inbox')))
    return 'scan_email_for_spaces'
  if (lower.includes('check') && (lower.includes('email') || lower.includes('inbox')))
    return 'check_email'
  if (lower.includes('search') && lower.includes('email')) return 'search_email'
  if (lower.includes('send') && lower.includes('email')) return 'send_email'
  return 'unknown'
}

function parseTableLines(sectionLines: string[]): string[][] {
  const rows: string[][] = []
  for (const line of sectionLines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    if (trimmed.includes('---')) continue
    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1)
    if (cells.length > 0 && cells[0].toLowerCase() !== 'command') rows.push(cells)
  }
  return rows
}

function extractSection(content: string, header: string): string[] {
  const idx = content.indexOf(header)
  if (idx < 0) return []
  const rest = content.slice(idx + header.length)
  const next = rest.search(/\n## /)
  const body = next >= 0 ? rest.slice(0, next) : rest
  return body.split('\n')
}

export function readCommandsFile(): CommandsData {
  if (!fs.existsSync(COMMANDS_PATH)) {
    return { lastUpdated: '', confirmed: [], broken: [], untested: [] }
  }

  const content = fs.readFileSync(COMMANDS_PATH, 'utf-8')
  const lastMatch = content.match(/Last updated:\s*(.+)/i)
  const lastUpdated = lastMatch?.[1]?.trim() ?? ''

  const confirmedRows = parseTableLines(
    extractSection(content, '## ✅ Confirmed Working')
  ).map((c) => ({
    command: c[0] ?? '',
    phrase: c[1] ?? '',
    tool: c[2] ?? '',
    notes: c[3] ?? '',
  }))

  const brokenRows = parseTableLines(
    extractSection(content, '## ❌ Broken / Not Working')
  ).map((c) => ({
    command: c[0] ?? '',
    phrase: c[1] ?? '',
    error: c[2] ?? '',
    fixNeeded: c[3] ?? '',
  }))

  const untestedRows = parseTableLines(
    extractSection(content, '## ⏳ Not Yet Tested')
  ).map((c) => ({
    command: c[0] ?? '',
    phrase: c[1] ?? '',
    tool: c[2] ?? '',
  }))

  return {
    lastUpdated,
    confirmed: confirmedRows,
    broken: brokenRows,
    untested: untestedRows,
  }
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function writeCommandsFile(data: CommandsData): void {
  const lines = [
    '# Athera Agent — Command Status',
    '',
    `Last updated: ${data.lastUpdated}`,
    '',
    '## ✅ Confirmed Working',
    '',
    '| Command | Example phrase | Tool called | Notes |',
    '|---------|---------------|-------------|-------|',
    ...data.confirmed.map(
      (r) =>
        `| ${escapeCell(r.command)} | ${escapeCell(r.phrase)} | ${escapeCell(r.tool)} | ${escapeCell(r.notes)} |`
    ),
    '',
    '## ❌ Broken / Not Working',
    '',
    '| Command | Example phrase | Error | Fix needed |',
    '|---------|---------------|-------|------------|',
    ...data.broken.map(
      (r) =>
        `| ${escapeCell(r.command)} | ${escapeCell(r.phrase)} | ${escapeCell(r.error)} | ${escapeCell(r.fixNeeded)} |`
    ),
    '',
    '## ⏳ Not Yet Tested',
    '',
    '| Command | Example phrase | Tool |',
    '|---------|---------------|------|',
    ...data.untested.map(
      (r) =>
        `| ${escapeCell(r.command)} | ${escapeCell(r.phrase)} | ${escapeCell(r.tool)} |`
    ),
    '',
  ]
  fs.writeFileSync(COMMANDS_PATH, lines.join('\n'), 'utf-8')
}

function toolsMatch(a: string, b: string): boolean {
  const na = a.toLowerCase().trim()
  const nb = b.toLowerCase().trim()
  if (na === nb) return true
  if (na.includes(nb) || nb.includes(na)) return true
  return false
}

function phrasesMatch(a: string, b: string): boolean {
  const clean = (s: string) => s.toLowerCase().replace(/["']/g, '').trim()
  const ca = clean(a)
  const cb = clean(b)
  return ca === cb || ca.includes(cb) || cb.includes(ca)
}

function commandLabelFromTool(tool: string): string {
  const map: Record<string, string> = {
    time: 'Time',
    get_battery: 'Battery',
    get_wifi: 'WiFi',
    open_app: 'Open app',
    open_file: 'Open file',
    create_note: 'Create note',
    set_reminder: 'Set reminder',
    search_files: 'Search files',
    get_clipboard: 'Clipboard read',
    set_clipboard: 'Clipboard write',
    get_volume: 'Volume get',
    set_volume: 'Volume set',
    'set_volume / get_volume': 'Volume',
    web_search: 'Web search',
    take_screenshot: 'Screenshot',
    capabilities: 'Capabilities',
    read_file: 'Read file',
    find_file: 'Find file',
    open_folder: 'Open folder',
    get_system_info: 'System info',
    list_spaces: 'List spaces',
    list_files: 'List files',
    create_space: 'Create space',
    life_action: 'Life update',
    scan_email_for_spaces: 'Scan email to spaces',
    email_filing: 'Email filing',
    unknown: 'Unknown',
  }
  return map[tool] ?? tool
}

export function applyFeedback(
  data: CommandsData,
  feedback: CommandFeedback
): { data: CommandsData; command: string } {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const tool = feedback.tool?.trim() || detectTool(feedback.phrase)
  const phraseQuoted = feedback.phrase.includes('"')
    ? feedback.phrase
    : `"${feedback.phrase}"`

  const untestedIdx = data.untested.findIndex(
    (r) => toolsMatch(r.tool, tool) || phrasesMatch(r.phrase, feedback.phrase)
  )

  let commandName = commandLabelFromTool(tool)
  if (untestedIdx >= 0) {
    commandName = data.untested[untestedIdx].command
    data.untested.splice(untestedIdx, 1)
  }

  if (feedback.status === 'confirmed') {
    const exactIdx = data.confirmed.findIndex((r) =>
      phrasesMatch(r.phrase, feedback.phrase)
    )
    if (exactIdx >= 0) {
      data.confirmed[exactIdx].notes = `${data.confirmed[exactIdx].notes}; User confirmed ${today}`
    } else {
      data.confirmed.push({
        command: commandName,
        phrase: phraseQuoted,
        tool,
        notes: `User confirmed ${today}. Response: ${feedback.response.slice(0, 80)}`,
      })
    }
  } else {
    data.broken.push({
      command: commandName,
      phrase: phraseQuoted,
      error: feedback.error?.trim() || 'User reported broken',
      fixNeeded: `Reported ${today}`,
    })
  }

  data.lastUpdated = today
  return { data, command: commandName }
}
