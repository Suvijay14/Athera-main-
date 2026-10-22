import fs from 'fs/promises'
import path from 'path'

export type WaitlistEntry = {
  email: string
  source: string
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), '.data')
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json')

async function readLocalEntries(): Promise<WaitlistEntry[]> {
  try {
    const raw = await fs.readFile(WAITLIST_FILE, 'utf8')
    const parsed = JSON.parse(raw) as WaitlistEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveLocal(entry: WaitlistEntry): Promise<{ duplicate: boolean }> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const entries = await readLocalEntries()
  const normalized = entry.email.toLowerCase()
  if (entries.some((e) => e.email.toLowerCase() === normalized)) {
    return { duplicate: true }
  }
  entries.push(entry)
  await fs.writeFile(WAITLIST_FILE, JSON.stringify(entries, null, 2), 'utf8')
  return { duplicate: false }
}

async function saveSupabase(entry: WaitlistEntry): Promise<{ ok: boolean; duplicate: boolean }> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return { ok: false, duplicate: false }
  }

  const table = process.env.SUPABASE_WAITLIST_TABLE ?? 'waitlist_signups'
  const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      email: entry.email,
      source: entry.source,
      created_at: entry.createdAt,
    }),
  })

  if (res.status === 409) {
    return { ok: true, duplicate: true }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase waitlist insert failed (${res.status}): ${text}`)
  }
  return { ok: true, duplicate: false }
}

export async function saveWaitlistSignup(
  email: string,
  source: string
): Promise<{ duplicate: boolean }> {
  const entry: WaitlistEntry = {
    email: email.trim().toLowerCase(),
    source,
    createdAt: new Date().toISOString(),
  }

  const supabase = await saveSupabase(entry)
  if (supabase.ok) {
    return { duplicate: supabase.duplicate }
  }

  return saveLocal(entry)
}
