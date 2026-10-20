import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'

const STATE_TTL_MS = 15 * 60 * 1000

export type CalendarOAuthStatePayload = {
  workspaceId: string
  spaceId: string
  issuedAt: number
}

function stateSecret(): string {
  const secret = process.env.CRON_SECRET ?? process.env.GOOGLE_CLIENT_SECRET
  if (!secret) {
    throw new Error('CRON_SECRET or GOOGLE_CLIENT_SECRET required for OAuth state signing')
  }
  return secret
}

function signPayload(encoded: string): string {
  return createHmac('sha256', stateSecret()).update(encoded).digest('base64url')
}

export function encodeCalendarOAuthState(payload: CalendarOAuthStatePayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const sig = signPayload(encoded)
  return `${encoded}.${sig}`
}

export function decodeCalendarOAuthState(token: string): CalendarOAuthStatePayload | null {
  const [encoded, sig] = token.split('.')
  if (!encoded || !sig) {
    return null
  }
  const expected = signPayload(encoded)
  try {
    const a = Buffer.from(sig, 'base64url')
    const b = Buffer.from(expected, 'base64url')
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return null
    }
  } catch {
    return null
  }
  try {
    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as CalendarOAuthStatePayload
    if (
      typeof payload.workspaceId !== 'string' ||
      typeof payload.spaceId !== 'string' ||
      typeof payload.issuedAt !== 'number'
    ) {
      return null
    }
    if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
