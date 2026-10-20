/**
 * Smoke-test Postgres connectivity variants for SUPABASE_TEST_DB_URL.
 *
 *   npm run test:pg
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'
import { Client, type ClientConfig } from 'pg'

config({ path: resolve(process.cwd(), '.env.local') })

const PG_CONNECT_TIMEOUT_MS = 10_000

function appendSslModeRequire(connectionString: string): string {
  const sep = connectionString.includes('?') ? '&' : '?'
  return `${connectionString}${sep}sslmode=require`
}

function printFullError(error: unknown): void {
  if (error instanceof Error) {
    const withCode = error as Error & { code?: string }
    console.error('error.message:', withCode.message)
    console.error('error.code:', withCode.code ?? '(none)')
    console.error('error.stack:', withCode.stack ?? '(none)')
    console.error('error (full):', error)
    return
  }
  console.error('error (non-Error):', error)
}

async function runVariant(
  label: string,
  clientConfig: ClientConfig
): Promise<boolean> {
  console.log('\n---', label, '---')
  const client = new Client({
    connectionTimeoutMillis: PG_CONNECT_TIMEOUT_MS,
    ...clientConfig,
  })
  try {
    await client.connect()
    const result = await client.query('SELECT 1 AS ok')
    console.log('SUCCESS. Query result:', result.rows)
    return true
  } catch (error) {
    console.error('FAILED.')
    printFullError(error)
    return false
  } finally {
    await client.end().catch(() => undefined)
  }
}

async function main(): Promise<void> {
  const baseUrl = process.env.SUPABASE_TEST_DB_URL?.trim()
  if (!baseUrl) {
    console.error('SUPABASE_TEST_DB_URL is not set in .env.local')
    process.exit(1)
  }

  const variant1Ok = await runVariant(
    'Variant 1: connectionString ?sslmode=require, no Client ssl option',
    {
      connectionString: appendSslModeRequire(baseUrl),
    }
  )

  const variant2Ok = await runVariant('Variant 2: ssl: true (boolean), base connectionString', {
    connectionString: baseUrl,
    ssl: true,
  })

  console.log('\n=== Summary ===')
  console.log('Variant 1:', variant1Ok ? 'OK' : 'FAILED')
  console.log('Variant 2:', variant2Ok ? 'OK' : 'FAILED')

  if (!variant1Ok && !variant2Ok) {
    process.exit(1)
  }
}

main().catch((error) => {
  printFullError(error)
  process.exit(1)
})
