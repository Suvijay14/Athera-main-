import { execFile, execSync, spawnSync } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createSpace, listSpaces } from './spaces'
import { checkEmail, scanEmailForSpacesTool, searchEmail, sendEmail } from './gmail-tools'
import { formatCompactFileList, pathsToFileList } from './file-list'
import { resolveUserPath, safeUserPath } from './path-utils'
import {
  buildReminderAppleScript,
  formatReminderTime,
  parseReminderInput,
} from './reminder-parse'

const exec = promisify(execFile)

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export const TOOL_CATALOG = `
Available tools (return JSON to use one):
- time: Current local time and date. params: {}
- take_screenshot: Capture the screen. params: {}
- list_files: List files in a folder. params: { "path": "~/Desktop" }
- search_files: Search files by name on Desktop, Documents, Downloads. params: { "query": "report" }
- read_file: Read a text file (max 8KB). params: { "path": "~/Documents/note.txt" }
- find_file: Search for files by name via Spotlight. params: { "name": "report", "directory": "~" }
- get_system_info: Mac system info. params: {}
- open_folder: Reveal folder in Finder. params: { "path": "~/Downloads" }
- open_app: Open a Mac application. params: { "app": "Safari" }
- open_file: Find a file by name or path and open it in the default app. params: { "query": "Berkeley syllabus" }
- create_note: Save a note to ~/Documents/athena-notes/. params: { "title": "My Note", "content": "..." }
- set_reminder: Create a Reminders item. params: { "text": "Buy milk", "dueAt": "ISO date optional" }
- web_search: Open Google search in browser. params: { "query": "Berkeley CS189" }
- get_battery: Battery level and charging status. params: {}
- get_wifi: Current WiFi network name. params: {}
- get_clipboard: Read clipboard contents. params: {}
- set_clipboard: Copy text to clipboard. params: { "text": "hello" }
- get_volume: Get system volume level. params: {}
- set_volume: Set system volume 0-100. params: { "level": 50 }
- capabilities: List everything Athena can do. params: {}
- create_space: Create a new Athena space. params: { "name": "My Project" }
- list_spaces: List all Athena spaces. params: {}
- check_email: Read recent unread Gmail inbox emails. params: { "count": 5 }
- search_email: Search Gmail by query. params: { "query": "from:rheanna", "count": 5 }
- send_email: Send an email via Gmail. params: { "to": "user@example.com", "subject": "Hi", "body": "..." }
- scan_email_for_spaces: Scan recent Gmail and match emails to existing spaces. params: { "days": 2 }
`.trim()

const APP_MAP: Record<string, string> = {
  chrome: 'Google Chrome',
  safari: 'Safari',
  notes: 'Notes',
  finder: 'Finder',
  terminal: 'Terminal',
  calendar: 'Calendar',
  reminders: 'Reminders',
  mail: 'Mail',
  messages: 'Messages',
  spotify: 'Spotify',
  slack: 'Slack',
  vscode: 'Visual Studio Code',
  cursor: 'Cursor',
  xcode: 'Xcode',
  figma: 'Figma',
}

export function isLikelyAppName(name: string): boolean {
  const t = name.toLowerCase().trim()
  if (APP_MAP[t]) return true
  return Object.values(APP_MAP).some((v) => v.toLowerCase() === t)
}

function ok(message: string, extra?: Record<string, unknown>): ToolResult {
  return { success: true, data: { message, ...extra } }
}

function fail(error: string): ToolResult {
  return { success: false, error }
}

export function toolResultMessage(result: ToolResult): string {
  if (!result.success) return result.error ?? 'Something went wrong.'
  const data = result.data as { message?: string } | undefined
  if (data?.message) return data.message
  return typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
}

function safePath(input: string): string | null {
  return safeUserPath(input)
}

function sanitizeFindQuery(query: string): string {
  return query.replace(/[^a-zA-Z0-9._\- ]/g, '').trim()
}

const DEFAULT_SEARCH_DIRS = () => {
  const home = os.homedir()
  return [path.join(home, 'Desktop'), path.join(home, 'Documents'), path.join(home, 'Downloads')]
}

/** Filesystem search — reliable for Desktop files (Spotlight mdfind often misses them) */
function searchPathsByName(query: string, dirs?: string[], maxDepth = 6): string[] {
  const safe = sanitizeFindQuery(query)
  if (!safe) return []

  const searchDirs = dirs?.length ? dirs : DEFAULT_SEARCH_DIRS()
  const results: string[] = []

  for (const dir of searchDirs) {
    try {
      const out = execSync(`find "${dir}" -maxdepth ${maxDepth} -iname "*${safe}*" 2>/dev/null`, {
        encoding: 'utf8',
        timeout: 10000,
      }).trim()
      if (out) results.push(...out.split('\n').filter(Boolean))
    } catch {
      // no matches in this directory
    }
  }

  return Array.from(new Set(results.filter((p) => safeUserPath(p))))
}

function buildFileSearchResult(query: string, results: string[], title?: string): ToolResult {
  if (results.length === 0) {
    return ok(`No files found matching "${query}".`)
  }
  const fileList = pathsToFileList(results.slice(0, 20))
  const items = fileList.map((f, i) => ({
    label: `${i + 1}. ${f.name}`,
    value: f.path,
    kind: f.kind ?? ('file' as const),
  }))
  return ok(formatCompactFileList(fileList, title ?? `Matches for "${query}"`), {
    matches: results,
    items,
    fileList,
  })
}

export async function runTool(name: string, params: Record<string, unknown>): Promise<ToolResult> {
  const tool = name === 'screenshot' ? 'take_screenshot' : name
  try {
    switch (tool) {
      case 'time':
        return getTime()
      case 'take_screenshot':
        return await takeScreenshot()
      case 'list_files':
        return await listFiles(String(params.path ?? '~/Desktop'))
      case 'search_files':
        return searchFiles(String(params.query ?? ''), String(params.extension ?? ''))
      case 'read_file':
        return await readFile(String(params.path ?? ''))
      case 'find_file':
        return await findFile(String(params.name ?? ''), String(params.directory ?? os.homedir()))
      case 'get_system_info':
        return getSystemInfo()
      case 'open_folder':
        return await openFolder(String(params.path ?? '~/Desktop'))
      case 'open_app':
        return await openApp(String(params.app ?? ''))
      case 'open_file':
        return await openFile(String(params.query ?? params.name ?? params.path ?? ''))
      case 'create_note':
        return createNote(String(params.title ?? ''), String(params.content ?? ''))
      case 'set_reminder':
        return await setReminder(String(params.text ?? ''), parseReminderDueAt(params))
      case 'web_search':
        return await webSearch(String(params.query ?? ''))
      case 'get_battery':
        return getBattery()
      case 'get_wifi':
        return getWifi()
      case 'get_clipboard':
        return getClipboard()
      case 'set_clipboard':
        return setClipboard(String(params.text ?? ''))
      case 'get_volume':
        return getVolume()
      case 'set_volume':
        return setVolume(Number(params.level))
      case 'capabilities':
        return getCapabilities()
      case 'create_space':
        return createSpaceTool(String(params.name ?? ''))
      case 'list_spaces':
        return { success: true, data: { message: 'Spaces listed.', spaces: listSpaces() } }
      case 'check_email':
        return await checkEmail(Number(params.count) || 5)
      case 'search_email':
        return await searchEmail(String(params.query ?? ''), Number(params.count) || 5)
      case 'send_email':
        return await sendEmail(
          String(params.to ?? ''),
          String(params.subject ?? ''),
          String(params.body ?? '')
        )
      case 'scan_email_for_spaces':
        return await scanEmailForSpacesTool(Number(params.days) || 2)
      default:
        return fail(`Unknown tool: ${name}`)
    }
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'Tool failed')
  }
}

function getTime(): ToolResult {
  const now = new Date()
  const timeStr = now.toLocaleString('en-US', {
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return ok(`It is currently ${timeStr}.`)
}

async function takeScreenshot(): Promise<ToolResult> {
  const dir = path.join(os.homedir(), 'Desktop')
  await fs.mkdir(dir, { recursive: true })
  const filename = `athena-screenshot-${Date.now()}.png`
  const out = path.join(dir, filename)
  await exec('/usr/sbin/screencapture', ['-x', out])
  return ok(`Screenshot saved to ~/Desktop/${filename}`, {
    path: out,
    filename,
    desktopPath: `~/Desktop/${filename}`,
  })
}

async function listFiles(folder: string): Promise<ToolResult> {
  const resolved = safePath(folder)
  if (!resolved) return fail('Path must be inside your home directory')
  const entries = await fs.readdir(resolved, { withFileTypes: true })
  const files = entries.slice(0, 100).map((e) => ({
    name: e.name,
    path: path.join(resolved, e.name),
    type: e.isDirectory() ? ('directory' as const) : ('file' as const),
  }))
  const folderLabel =
    resolved === path.join(os.homedir(), 'Desktop') ? 'Desktop' : path.basename(resolved)
  return { success: true, data: { path: resolved, folder: folderLabel, files, message: `Listed ${files.length} items.` } }
}

function searchFiles(query: string, extension = ''): ToolResult {
  const wantsPdf = /\bpdf\b/i.test(query) || extension === 'pdf'

  if (wantsPdf) {
    const home = os.homedir()
    let results: string[] = []
    for (const p of DEFAULT_SEARCH_DIRS()) {
      try {
        const out = execSync(`find "${p}" -maxdepth 6 -iname "*.pdf" 2>/dev/null`, {
          encoding: 'utf8',
          timeout: 10000,
        }).trim()
        if (out) results.push(...out.split('\n').filter(Boolean))
      } catch {
        // no matches
      }
    }
    results = Array.from(new Set(results.filter((p) => safeUserPath(p))))
    return buildFileSearchResult('pdf', results, 'PDF files')
  }

  const safe = sanitizeFindQuery(
    query.replace(/\b(pdf|pdfs)\b/gi, '').replace(/\bfiles?\b/gi, '').trim()
  )
  if (!safe) return fail('query is required')

  let results = searchPathsByName(safe)
  if (extension) {
    results = results.filter((p) => p.toLowerCase().endsWith(`.${extension.toLowerCase()}`))
  }
  return buildFileSearchResult(query, results)
}

async function readFileAtPath(resolved: string): Promise<ToolResult> {
  const stat = await fs.stat(resolved)
  if (!stat.isFile()) return fail('Not a file')
  if (stat.size === 0) {
    return ok('The file is empty.', { path: resolved, content: '' })
  }
  if (stat.size > 8192) return fail('File too large (max 8KB)')
  const content = await fs.readFile(resolved, 'utf-8')
  const preview = content.length > 500 ? `${content.slice(0, 500)}…` : content
  return ok(`Contents of ${path.basename(resolved)}:\n${preview}`, { path: resolved, content })
}

async function readFile(filePath: string): Promise<ToolResult> {
  const trimmed = filePath.trim()
  if (!trimmed) return fail('path is required')

  const direct = safePath(trimmed)
  if (direct && fsSync.existsSync(direct)) {
    return readFileAtPath(direct)
  }

  const matches = await searchFilePaths(trimmed)
  const files = matches.filter((p) => {
    try {
      return fsSync.statSync(p).isFile()
    } catch {
      return false
    }
  })

  if (files.length === 0) {
    return fail(`No file found matching "${trimmed}".`)
  }

  const target = pickBestFileMatch(files, trimmed)
  return readFileAtPath(target)
}

async function findFile(name: string, directory: string): Promise<ToolResult> {
  if (!name.trim()) return fail('name is required')

  const resolved = safePath(directory) ?? safePath(os.homedir())
  if (!resolved) return fail('Directory must be inside your home directory')

  const home = os.homedir()
  const dirs =
    resolved === home || resolved === path.join(home, '')
      ? DEFAULT_SEARCH_DIRS()
      : [resolved]

  const matches = searchPathsByName(name, dirs)
  return buildFileSearchResult(name, matches)
}

function getSystemInfo(): ToolResult {
  return {
    success: true,
    data: {
      message: 'System info retrieved.',
      platform: process.platform,
      hostname: os.hostname(),
      homedir: os.homedir(),
      cpus: os.cpus().length,
      memoryGB: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    },
  }
}

async function openFolder(folder: string): Promise<ToolResult> {
  const resolved = resolveUserPath(folder)
  if (!resolved || !resolved.startsWith(os.homedir())) {
    return fail('Path must be inside your home directory')
  }
  if (!fsSync.existsSync(resolved)) {
    return fail(`Folder not found: ${folder}`)
  }
  const stat = fsSync.statSync(resolved)
  if (!stat.isDirectory()) {
    return fail(`That is a file, not a folder. Say "open ${path.basename(resolved)}" to open the file.`)
  }
  await exec('open', [resolved])
  const label = path.basename(resolved) || folder
  return ok(`Opened ${label} in Finder.`, { path: resolved })
}

async function openApp(app: string): Promise<ToolResult> {
  const appName = app.trim()
  if (!appName) return fail('app is required')
  const resolved = APP_MAP[appName.toLowerCase()] ?? appName
  await exec('open', ['-a', resolved])
  return ok(`Opened ${resolved}.`)
}

function pickBestFileMatch(matches: string[], query: string): string {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter(Boolean)
  const scored = matches.map((p) => {
    const base = path.basename(p).toLowerCase()
    const normalized = base.replace(/[-_.]/g, ' ')
    let score = 0
    if (base === q || normalized === q) score += 100
    else if (base.includes(q) || normalized.includes(q)) score += 50
    for (const word of words) {
      if (base.includes(word) || normalized.includes(word)) score += 12
    }
    if (/\.(app|framework)$/i.test(p)) score -= 40
    if (/(desktop|documents|downloads)/i.test(p)) score += 15
    try {
      const stat = fsSync.statSync(p)
      if (stat.isFile()) score += 10
      if (stat.isDirectory()) score += 2
    } catch {
      score -= 100
    }
    return { p, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.p ?? matches[0]
}

function collectValidPaths(paths: string[]): string[] {
  return paths.filter((p) => {
    if (!safePath(p)) return false
    try {
      fsSync.accessSync(p)
      return true
    } catch {
      return false
    }
  })
}

async function spotlightSearch(home: string, query: string): Promise<string[]> {
  try {
    const { stdout } = await exec('mdfind', ['-onlyin', home, query])
    return collectValidPaths(stdout.trim().split('\n').filter(Boolean))
  } catch {
    return []
  }
}

async function findSearch(home: string, query: string): Promise<string[]> {
  const words = query
    .split(/\s+/)
    .map(sanitizeFindQuery)
    .filter((w) => w.length > 0)
  if (words.length === 0) return []

  const pattern = words.join('*')
  const searchDirs = [
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Downloads'),
  ]
  const results: string[] = []

  for (const dir of searchDirs) {
    try {
      const out = execSync(`find "${dir}" -maxdepth 6 -iname "*${pattern}*" 2>/dev/null`, {
        encoding: 'utf8',
        timeout: 8000,
      }).trim()
      if (out) results.push(...out.split('\n').filter(Boolean))
    } catch {
      // no matches in this path
    }
  }

  return collectValidPaths(results)
}

async function searchFilePaths(query: string): Promise<string[]> {
  const trimmed = query.trim()
  if (!trimmed) return []

  const home = os.homedir()
  let results: string[] = []

  // Spotlight free-text (handles "athena demo notes" → Athena-demo-notes.txt)
  results = await spotlightSearch(home, trimmed)

  // Spotlight per-word intersection for multi-word queries
  if (results.length === 0 && trimmed.includes(' ')) {
    const words = trimmed.split(/\s+/).map(sanitizeFindQuery).filter((w) => w.length > 2)
    if (words.length > 0) {
      const sets = await Promise.all(words.map((w) => spotlightSearch(home, w)))
      const counts = new Map<string, number>()
      for (const set of sets) {
        for (const p of set) counts.set(p, (counts.get(p) ?? 0) + 1)
      }
      results = [...counts.entries()]
        .filter(([, count]) => count >= Math.min(2, words.length))
        .sort((a, b) => b[1] - a[1])
        .map(([p]) => p)
    }
  }

  // Filesystem find fallback (*athena*demo*notes*)
  if (results.length === 0) {
    results = await findSearch(home, trimmed)
  }

  return [...new Set(results)]
}

async function openFile(query: string): Promise<ToolResult> {
  const trimmed = query.trim()
  if (!trimmed) return fail('query is required')

  const asPath = safePath(trimmed)
  if (asPath && fsSync.existsSync(asPath)) {
    await exec('open', [asPath])
    return ok(`Opened ${path.basename(asPath)}.`, { path: asPath, opened: asPath })
  }

  const matches = await searchFilePaths(trimmed)
  if (matches.length === 0) {
    return fail(`No file found matching "${trimmed}".`)
  }

  const toOpen = pickBestFileMatch(matches, trimmed)
  await exec('open', [toOpen])

  const openedName = path.basename(toOpen)
  if (matches.length === 1) {
    return ok(`Opened ${openedName}.`, { path: toOpen, opened: toOpen, matches })
  }

  const listed = matches
    .slice(0, 8)
    .map((p) => `• ${path.basename(p)} (${p})`)
    .join('\n')

  const items = matches.slice(0, 20).map((p, i) => ({
    label: `${i + 1}. ${path.basename(p)}`,
    value: p,
    kind: 'file' as const,
  }))

  return ok(
    `Found ${matches.length} matches. Opened ${openedName}.\n${listed}`,
    { path: toOpen, opened: toOpen, matches, items }
  )
}

function createNote(title: string, content: string): ToolResult {
  const trimmedTitle = title.trim() || 'Untitled'
  const dir = path.join(os.homedir(), 'Documents', 'athena-notes')
  if (!fsSync.existsSync(dir)) fsSync.mkdirSync(dir, { recursive: true })
  const filename = `${trimmedTitle.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.txt`
  const filepath = path.join(dir, filename)
  const body = `# ${trimmedTitle}\n${new Date().toLocaleString()}\n\n${content}`
  fsSync.writeFileSync(filepath, body)
  return ok(`Note saved: "${trimmedTitle}" at ~/Documents/athena-notes/${filename}`)
}

function parseReminderDueAt(params: Record<string, unknown>): Date | undefined {
  if (params.dueAt) {
    const d = new Date(String(params.dueAt))
    if (!Number.isNaN(d.getTime())) return d
  }
  if (params.time) {
    const t = String(params.time).trim()
    const clock = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
    if (clock) {
      const d = new Date()
      d.setHours(Number(clock[1]), Number(clock[2]), 0, 0)
      return d
    }
    const parsed = parseReminderInput(`reminder for ${t}`)
    if (parsed?.dueAt) return parsed.dueAt
  }
  return undefined
}

async function setReminder(text: string, dueAt?: Date): Promise<ToolResult> {
  const reminderText = text.trim()
  if (!reminderText) return fail('text is required')

  const due = dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : undefined
  const script = buildReminderAppleScript(reminderText, due)

  try {
    await exec('osascript', ['-e', script])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Reminders app failed'
    return fail(`Could not create reminder: ${msg}`)
  }

  return ok(
    due
      ? `Reminder set: "${reminderText}" for ${formatReminderTime(due)}.`
      : `Reminder added: "${reminderText}" (no time set).`
  )
}

async function webSearch(query: string): Promise<ToolResult> {
  const trimmed = query.trim()
  if (!trimmed) return fail('query is required')
  const encoded = encodeURIComponent(trimmed)
  await exec('open', [`https://www.google.com/search?q=${encoded}`])
  return ok(`Searching the web for: "${trimmed}"`)
}

function getBattery(): ToolResult {
  const out = execSync("pmset -g batt | grep -o '[0-9]*%.*'", { encoding: 'utf8' }).trim()
  return ok(`Battery: ${out || 'unknown'}`)
}

function getWifi(): ToolResult {
  let ssid = ''
  try {
    ssid = execSync("networksetup -getairportnetwork en0 | awk -F': ' '{print $2}'", {
      encoding: 'utf8',
    }).trim()
  } catch {
    ssid = ''
  }
  return ok(ssid ? `Connected to WiFi: ${ssid}` : 'Not connected to WiFi.')
}

function getClipboard(): ToolResult {
  const content = execSync('pbpaste', { encoding: 'utf8' }).trim()
  return ok(content ? `Clipboard contents:\n${content}` : 'Clipboard is empty.')
}

function setClipboard(text: string): ToolResult {
  if (!text.trim()) return fail('text is required')
  spawnSync('pbcopy', { input: text })
  return ok(`Copied to clipboard: "${text}"`)
}

function getVolume(): ToolResult {
  const vol = execSync("osascript -e 'output volume of (get volume settings)'", {
    encoding: 'utf8',
  }).trim()
  return ok(`Volume is at ${vol}%.`)
}

async function setVolume(level: number): Promise<ToolResult> {
  const clamped = Math.max(0, Math.min(100, Math.round(level)))
  await exec('osascript', ['-e', `set volume output volume ${clamped}`])
  return ok(`Volume set to ${clamped}%.`)
}

function getCapabilities(): ToolResult {
  return ok(`Here is what I can do:

🕐 Time & Info
- Tell you the current time and date
- Check battery level
- Check your WiFi network

📁 Files
- List files on your Desktop, Documents, Downloads
- Search for files by name
- Open any file by name or path (finds it and opens on your Mac)
- Scan files related to a project or topic

🗂 Spaces
- Create a new space for a project
- Add files to a space
- Archive a space when you're done

📝 Notes & Reminders
- Save a note to your Documents
- Create a reminder in Reminders app

🖥 System
- Open any app by name
- Take a screenshot
- Get or set volume
- Read or write clipboard

🌐 Web
- Search Google in your browser

📧 Gmail
- Check unread inbox emails
- Search emails by query
- Send emails (when connected at /setup)
- Scan recent email and file into spaces

🎙 Life Updates
- Understand life changes ("I started a new project")
- Create a workspace space automatically
- Ask for confirmation before taking action

Just speak or type naturally. I understand context.`)
}

function createSpaceTool(name: string): ToolResult {
  const trimmed = name.trim()
  if (!trimmed) return fail('name is required')
  const space = createSpace(trimmed, { source: 'voice' })
  return ok(
    `Created space "${space.name}". It will appear in the Spaces panel and top nav tabs.`,
    { name: space.name, slug: space.slug }
  )
}
