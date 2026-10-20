import 'server-only'

import { Pool, type PoolClient } from 'pg'

export type PgTx = PoolClient

let pool: Pool | null = null

export function getPgConnectionString(): string {
  const url =
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_TEST_DB_URL?.trim() ||
    process.env.SUPABASE_DB_URL_NON_POOLING?.trim()
  if (!url) {
    throw new Error(
      'Missing database URL: set SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_TEST_DB_URL'
    )
  }
  return url
}

const PG_CONNECT_TIMEOUT_MS = 10_000

/** Supabase (and most cloud Postgres) require TLS; `pg` may hang/time out without this. */
function sslOptionForConnectionString(connectionString: string): { rejectUnauthorized: false } | undefined {
  const lower = connectionString.toLowerCase()
  if (lower.includes('sslmode=disable')) {
    return undefined
  }
  if (
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('host.docker.internal')
  ) {
    return undefined
  }
  return { rejectUnauthorized: false }
}

export function getPgPool(): Pool {
  if (!pool) {
    const connectionString = getPgConnectionString()
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: PG_CONNECT_TIMEOUT_MS,
      ssl: sslOptionForConnectionString(connectionString),
    })
  }
  return pool
}

export async function withPgTransaction<T>(fn: (tx: PgTx) => Promise<T>): Promise<T> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/** @internal Test helper to reset pool after env changes. */
export function resetPgPoolForTests(): void {
  pool = null
}
