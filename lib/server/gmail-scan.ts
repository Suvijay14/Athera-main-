import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  formatMessageDate,
  getGmailClient,
  headerValue,
} from './gmail'
import { classifyEmailsToSpaces, type EmailForClassification } from './email-reasoning'
import { addFilesToSpace, listSpaces } from './spaces'
import type {
  EmailFilingSuggestion,
  PendingEmailFiling,
  SpaceFile,
} from '@/lib/types'

const DATA_DIR = path.join(process.cwd(), '.data')
const PROCESSED_PATH = path.join(DATA_DIR, 'gmail-processed.json')
const MAX_MESSAGES = 30

const NOT_CONNECTED =
  'Gmail not connected. Go to /setup to connect your account.'

export interface ScanEmailResult {
  message: string
  pending?: PendingEmailFiling
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readProcessedIds(): Set<string> {
  if (!fs.existsSync(PROCESSED_PATH)) return new Set()
  try {
    const data = JSON.parse(fs.readFileSync(PROCESSED_PATH, 'utf-8')) as {
      messageIds?: string[]
    }
    return new Set(data.messageIds ?? [])
  } catch {
    return new Set()
  }
}

function writeProcessedIds(ids: Set<string>) {
  ensureDataDir()
  fs.writeFileSync(
    PROCESSED_PATH,
    JSON.stringify({ messageIds: [...ids] }, null, 2),
    'utf-8'
  )
}

function markProcessed(messageIds: string[]) {
  const ids = readProcessedIds()
  for (const id of messageIds) ids.add(id)
  writeProcessedIds(ids)
}

function gmailUrl(messageId: string): string {
  return `https://mail.google.com/mail/u/0/#inbox/${messageId}`
}

function buildUserMessage(
  scannedDays: number,
  suggestions: EmailFilingSuggestion[]
): string {
  if (suggestions.length === 0) {
    return `I scanned your last ${scannedDays} day${scannedDays === 1 ? '' : 's'} of email but found nothing to file into your spaces.`
  }

  const bySpace = new Map<string, { name: string; count: number }>()
  for (const s of suggestions) {
    const existing = bySpace.get(s.spaceSlug)
    if (existing) {
      existing.count++
    } else {
      bySpace.set(s.spaceSlug, { name: s.spaceName, count: 1 })
    }
  }

  const parts = [...bySpace.values()].map(
    (g) => `${g.count} for ${g.name}`
  )
  const summary =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`

  return `I scanned your last ${scannedDays} day${scannedDays === 1 ? '' : 's'} of email. I found ${summary}. Want me to add them?`
}

export async function scanEmailForSpaces(days = 2): Promise<ScanEmailResult> {
  const client = await getGmailClient()
  if (!client) return { message: NOT_CONNECTED }

  const spaces = listSpaces()
  if (spaces.length === 0) {
    return { message: 'Create a space first, then scan again.' }
  }

  const scannedDays = Math.min(Math.max(days, 1), 14)
  const processed = readProcessedIds()

  const list = await client.gmail.users.messages.list({
    userId: 'me',
    q: `newer_than:${scannedDays}d in:inbox`,
    maxResults: MAX_MESSAGES,
  })

  const messageRefs = (list.data.messages ?? []).filter((m) => m.id && !processed.has(m.id))
  if (messageRefs.length === 0) {
    return {
      message: `No new emails from the last ${scannedDays} day${scannedDays === 1 ? '' : 's'} to file.`,
    }
  }

  const emails: EmailForClassification[] = []
  const emailMeta = new Map<
    string,
    { from: string; subject: string; snippet: string; date: string; threadId?: string }
  >()

  for (const ref of messageRefs) {
    const msg = await client.gmail.users.messages.get({
      userId: 'me',
      id: ref.id!,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    })

    const headers = msg.data.payload?.headers
    const from = headerValue(headers, 'From')
    const subject = headerValue(headers, 'Subject') || '(no subject)'
    const snippet = (msg.data.snippet ?? '').slice(0, 200)
    const date = formatMessageDate(msg.data.internalDate)

    emails.push({ id: ref.id!, from, subject, snippet })
    emailMeta.set(ref.id!, {
      from,
      subject,
      snippet,
      date,
      threadId: msg.data.threadId ?? undefined,
    })
  }

  const classifications = await classifyEmailsToSpaces(spaces, emails)
  const spaceBySlug = new Map(spaces.map((s) => [s.slug, s]))

  const suggestions: EmailFilingSuggestion[] = []
  for (const c of classifications) {
    if (!c.spaceSlug) continue
    const space = spaceBySlug.get(c.spaceSlug)
    const meta = emailMeta.get(c.messageId)
    if (!space || !meta) continue

    suggestions.push({
      messageId: c.messageId,
      from: meta.from,
      subject: meta.subject,
      snippet: meta.snippet,
      date: meta.date,
      spaceSlug: c.spaceSlug,
      spaceName: space.name,
      confidence: c.confidence,
      reason: c.reason,
    })
  }

  if (suggestions.length === 0) {
    return {
      message: `I scanned ${emails.length} email${emails.length === 1 ? '' : 's'} from the last ${scannedDays} day${scannedDays === 1 ? '' : 's'} but none matched your spaces confidently enough.`,
    }
  }

  const pending: PendingEmailFiling = {
    id: randomUUID(),
    scannedDays,
    suggestions,
    userMessage: buildUserMessage(scannedDays, suggestions),
  }

  return { message: pending.userMessage, pending }
}

function suggestionToSpaceFile(s: EmailFilingSuggestion): SpaceFile {
  return {
    name: s.subject,
    path: `gmail://${s.messageId}`,
    source: 'Gmail',
    email: {
      messageId: s.messageId,
      from: s.from,
      subject: s.subject,
      snippet: s.snippet,
      date: s.date,
      gmailUrl: gmailUrl(s.messageId),
    },
  }
}

export async function executeEmailFiling(pending: PendingEmailFiling): Promise<string> {
  const bySpace = new Map<string, EmailFilingSuggestion[]>()
  for (const s of pending.suggestions) {
    const group = bySpace.get(s.spaceSlug) ?? []
    group.push(s)
    bySpace.set(s.spaceSlug, group)
  }

  const parts: string[] = []
  for (const [slug, group] of bySpace) {
    const files = group.map(suggestionToSpaceFile)
    const space = addFilesToSpace(slug, files, group[0].spaceName)
    if (space) {
      parts.push(`${group.length} to ${space.name}`)
    }
  }

  markProcessed(pending.suggestions.map((s) => s.messageId))

  if (parts.length === 0) return 'Could not file those emails.'
  return `Added ${parts.join(' and ')}.`
}

export function dismissEmailFiling(pending: PendingEmailFiling): void {
  markProcessed(pending.suggestions.map((s) => s.messageId))
}
