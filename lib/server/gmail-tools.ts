import type { ToolResult } from './tools'
import { scanEmailForSpaces } from './gmail-scan'
import {
  formatMessageDate,
  getGmailClient,
  headerValue,
} from './gmail'

const NOT_CONNECTED =
  'Gmail not connected. Go to /setup to connect your account.'

function ok(message: string): ToolResult {
  return { success: true, data: { message } }
}

function fail(error: string): ToolResult {
  return { success: false, error }
}

export async function checkEmail(count = 5): Promise<ToolResult> {
  const client = await getGmailClient()
  if (!client) return fail(NOT_CONNECTED)

  const max = Math.min(Math.max(count, 1), 20)
  const list = await client.gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread',
    labelIds: ['INBOX'],
    maxResults: max,
  })

  const messages = list.data.messages ?? []
  if (messages.length === 0) {
    return ok('You have no unread emails in your inbox.')
  }

  const lines: string[] = [`You have ${messages.length} unread email${messages.length === 1 ? '' : 's'}:`]

  for (let i = 0; i < messages.length; i++) {
    const msg = await client.gmail.users.messages.get({
      userId: 'me',
      id: messages[i].id!,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    })

    const headers = msg.data.payload?.headers
    const from = headerValue(headers, 'From')
    const subject = headerValue(headers, 'Subject') || '(no subject)'
    const date = formatMessageDate(msg.data.internalDate)
    const snippet = (msg.data.snippet ?? '').slice(0, 120)

    lines.push(`${i + 1}. From: ${from} — ${subject} (${date})`)
    if (snippet) lines.push(`   ${snippet}`)
  }

  return ok(lines.join('\n'))
}

export async function searchEmail(query: string, count = 5): Promise<ToolResult> {
  const trimmed = query.trim()
  if (!trimmed) return fail('query is required')

  const client = await getGmailClient()
  if (!client) return fail(NOT_CONNECTED)

  const max = Math.min(Math.max(count, 1), 20)
  const list = await client.gmail.users.messages.list({
    userId: 'me',
    q: trimmed,
    maxResults: max,
  })

  const messages = list.data.messages ?? []
  if (messages.length === 0) {
    return ok(`No emails found matching "${trimmed}".`)
  }

  const lines: string[] = [`Found ${messages.length} email${messages.length === 1 ? '' : 's'} for "${trimmed}":`]

  for (let i = 0; i < messages.length; i++) {
    const msg = await client.gmail.users.messages.get({
      userId: 'me',
      id: messages[i].id!,
      format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    })

    const headers = msg.data.payload?.headers
    const from = headerValue(headers, 'From')
    const subject = headerValue(headers, 'Subject') || '(no subject)'
    const date = formatMessageDate(msg.data.internalDate)
    const snippet = (msg.data.snippet ?? '').slice(0, 120)

    lines.push(`${i + 1}. From: ${from} — ${subject} (${date})`)
    if (snippet) lines.push(`   ${snippet}`)
  }

  return ok(lines.join('\n'))
}

export async function scanEmailForSpacesTool(days = 2): Promise<ToolResult> {
  const result = await scanEmailForSpaces(days)
  if (result.pending) {
    return {
      success: true,
      data: {
        message: result.message,
        pendingEmailFiling: result.pending,
      },
    }
  }
  return { success: true, data: { message: result.message } }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<ToolResult> {
  const toAddr = to.trim()
  const subj = subject.trim()
  const text = body.trim()
  if (!toAddr || !subj || !text) return fail('to, subject, and body are required')

  const client = await getGmailClient()
  if (!client) return fail(NOT_CONNECTED)

  const raw = [
    `To: ${toAddr}`,
    `Subject: ${subj}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    text,
  ].join('\r\n')

  const encoded = Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  await client.gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded },
  })

  return ok(`Email sent to ${toAddr}`)
}
