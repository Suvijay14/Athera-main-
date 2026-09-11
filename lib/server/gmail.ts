import fs from 'node:fs'
import path from 'node:path'
import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'

const DATA_DIR = path.join(process.cwd(), '.data')
const TOKEN_PATH = path.join(DATA_DIR, 'gmail-token.json')

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
]

export interface GmailTokenStore {
  access_token?: string
  refresh_token?: string
  scope?: string
  token_type?: string
  expiry_date?: number
  email?: string
}

export function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/gmail/callback'
  )
}

export function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local')
  }
  return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri())
}

export function getAuthUrl(): string {
  const client = createOAuthClient()
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  })
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

export function readGmailTokens(): GmailTokenStore | null {
  if (!fs.existsSync(TOKEN_PATH)) return null
  try {
    return JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')) as GmailTokenStore
  } catch {
    return null
  }
}

export function writeGmailTokens(tokens: GmailTokenStore): void {
  ensureDataDir()
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8')
}

export function deleteGmailTokens(): void {
  if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH)
}

export function getGmailStatus(): { connected: boolean; email: string } {
  const tokens = readGmailTokens()
  if (!tokens?.refresh_token && !tokens?.access_token) {
    return { connected: false, email: '' }
  }
  return { connected: true, email: tokens.email ?? '' }
}

export async function saveTokensFromCode(code: string): Promise<{ email: string }> {
  const client = createOAuthClient()
  const { tokens } = await client.getToken(code)
  client.setCredentials(tokens)

  const oauth2 = google.oauth2({ version: 'v2', auth: client })
  const profile = await oauth2.userinfo.get()
  const email = profile.data.email ?? ''

  writeGmailTokens({
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token ?? undefined,
    scope: tokens.scope,
    token_type: tokens.token_type ?? undefined,
    expiry_date: tokens.expiry_date ?? undefined,
    email,
  })

  return { email }
}

/** Returns authenticated Gmail client or null if not connected */
export async function getGmailClient(): Promise<{
  gmail: ReturnType<typeof google.gmail>
  email: string
} | null> {
  const stored = readGmailTokens()
  if (!stored?.refresh_token && !stored?.access_token) return null

  const client = createOAuthClient()
  client.setCredentials({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    scope: stored.scope,
    token_type: stored.token_type,
    expiry_date: stored.expiry_date,
  })

  client.on('tokens', (tokens) => {
    const current = readGmailTokens() ?? {}
    writeGmailTokens({
      ...current,
      access_token: tokens.access_token ?? current.access_token,
      refresh_token: tokens.refresh_token ?? current.refresh_token,
      expiry_date: tokens.expiry_date ?? current.expiry_date,
    })
  })

  if (client.credentials.expiry_date && client.credentials.expiry_date <= Date.now()) {
    await client.refreshAccessToken()
  }

  const gmail = google.gmail({ version: 'v1', auth: client })
  return { gmail, email: stored.email ?? '' }
}

export function headerValue(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string
): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ''
}

export function formatMessageDate(internalDate?: string | null): string {
  if (!internalDate) return ''
  return new Date(Number(internalDate)).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
