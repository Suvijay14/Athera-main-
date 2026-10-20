import 'server-only'

import type { DbClient } from '@/lib/db/db-client'
import { track } from '@/lib/events'

import { OperationError, SuggestionStateError, ValidationError } from './errors'
import { withPgTransaction, type PgTx } from './pg-transaction'
import { runOperationsInTransaction } from './run-operations'
import type { Operation } from './types'
import { operationsSchema } from './types'

export async function applyOperations(
  _client: DbClient,
  workspaceId: string,
  operations: Operation[]
): Promise<{ inverseOperations: Operation[] }> {
  return withPgTransaction((tx) => runOperationsInTransaction(tx, workspaceId, operations))
}

async function loadSuggestionForUpdate(
  tx: PgTx,
  suggestionId: string
): Promise<{
  id: string
  workspace_id: string
  type: string
  status: string
  operations: unknown
}> {
  const { rows } = await tx.query(
    `select id, workspace_id, type, status, operations
     from public.suggestions
     where id = $1
     for update`,
    [suggestionId]
  )
  if (rows.length === 0) {
    throw new SuggestionStateError(`Suggestion "${suggestionId}" not found`)
  }
  return rows[0] as {
    id: string
    workspace_id: string
    type: string
    status: string
    operations: unknown
  }
}

export async function applySuggestionWithOperations(
  client: DbClient,
  workspaceId: string,
  suggestionId: string,
  userId: string,
  operations: Operation[]
): Promise<{ changeLogId: string }> {
  let eventInput: Parameters<typeof track>[1] | null = null
  let changeLogId = ''

  await withPgTransaction(async (tx) => {
    const suggestion = await loadSuggestionForUpdate(tx, suggestionId)
    if (suggestion.workspace_id !== workspaceId) {
      throw new SuggestionStateError('Suggestion does not belong to this workspace')
    }
    if (suggestion.status !== 'pending' && suggestion.status !== 'shown') {
      throw new SuggestionStateError(
        `Cannot apply suggestion in status "${suggestion.status}"`
      )
    }

    const parsed = operationsSchema.parse(operations)
    const { inverseOperations } = await runOperationsInTransaction(tx, workspaceId, parsed)

    const logInsert = await tx.query(
      `insert into public.change_log
        (workspace_id, suggestion_id, operations, inverse_operations)
       values ($1, $2, $3::jsonb, $4::jsonb)
       returning id`,
      [
        workspaceId,
        suggestionId,
        JSON.stringify(parsed),
        JSON.stringify(inverseOperations),
      ]
    )
    changeLogId = logInsert.rows[0]?.id as string

    await tx.query(
      `update public.suggestions
       set status = 'accepted', resolved_at = now()
       where id = $1 and workspace_id = $2`,
      [suggestionId, workspaceId]
    )

    eventInput = {
      workspaceId,
      userId,
      name: 'suggestion_accepted',
      props: { suggestion_id: suggestionId, suggestion_type: suggestion.type },
    }
  })

  if (eventInput) {
    try {
      await track(client, eventInput)
    } catch (error) {
      console.error('suggestion_accepted event failed', error)
    }
  }

  if (!changeLogId) {
    throw new SuggestionStateError('Change log entry missing after apply')
  }
  return { changeLogId }
}

export async function applySuggestion(
  client: DbClient,
  workspaceId: string,
  suggestionId: string,
  userId: string
): Promise<void> {
  let eventInput: Parameters<typeof track>[1] | null = null

  await withPgTransaction(async (tx) => {
    const suggestion = await loadSuggestionForUpdate(tx, suggestionId)
    if (suggestion.workspace_id !== workspaceId) {
      throw new SuggestionStateError('Suggestion does not belong to this workspace')
    }
    if (suggestion.status !== 'pending' && suggestion.status !== 'shown') {
      throw new SuggestionStateError(
        `Cannot apply suggestion in status "${suggestion.status}"`
      )
    }

    const operations = operationsSchema.parse(suggestion.operations)
    const { inverseOperations } = await runOperationsInTransaction(tx, workspaceId, operations)

    await tx.query(
      `insert into public.change_log
        (workspace_id, suggestion_id, operations, inverse_operations)
       values ($1, $2, $3::jsonb, $4::jsonb)`,
      [
        workspaceId,
        suggestionId,
        JSON.stringify(operations),
        JSON.stringify(inverseOperations),
      ]
    )

    await tx.query(
      `update public.suggestions
       set status = 'accepted', resolved_at = now()
       where id = $1 and workspace_id = $2`,
      [suggestionId, workspaceId]
    )

    eventInput = {
      workspaceId,
      userId,
      name: 'suggestion_accepted',
      props: { suggestion_id: suggestionId, suggestion_type: suggestion.type },
    }
  })

  if (eventInput) {
    try {
      await track(client, eventInput)
    } catch (error) {
      console.error('suggestion_accepted event failed', error)
    }
  }
}

export async function undoChange(
  client: DbClient,
  workspaceId: string,
  changeLogId: string,
  userId: string
): Promise<void> {
  let eventInput: Parameters<typeof track>[1] | null = null
  let suggestionId: string | null = null

  await withPgTransaction(async (tx) => {
    const { rows } = await tx.query(
      `select id, workspace_id, suggestion_id, inverse_operations, undone_at
       from public.change_log
       where id = $1
       for update`,
      [changeLogId]
    )
    if (rows.length === 0) {
      throw new SuggestionStateError(`Change log "${changeLogId}" not found`)
    }
    const row = rows[0] as {
      workspace_id: string
      suggestion_id: string
      inverse_operations: unknown
      undone_at: string | null
    }
    if (row.workspace_id !== workspaceId) {
      throw new SuggestionStateError('Change log does not belong to this workspace')
    }
    if (row.undone_at !== null) {
      throw new SuggestionStateError('Change has already been undone')
    }

    suggestionId = row.suggestion_id
    const inverseOps = operationsSchema.parse(row.inverse_operations)
    await runOperationsInTransaction(tx, workspaceId, inverseOps)

    await tx.query(
      `update public.change_log set undone_at = now() where id = $1 and workspace_id = $2`,
      [changeLogId, workspaceId]
    )

    const sug = await tx.query(
      `select type from public.suggestions where id = $1 and workspace_id = $2`,
      [row.suggestion_id, workspaceId]
    )
    const suggestionType = (sug.rows[0]?.type as string) ?? 'unknown'

    await tx.query(
      `update public.suggestions set status = 'undone' where id = $1 and workspace_id = $2`,
      [row.suggestion_id, workspaceId]
    )

    eventInput = {
      workspaceId,
      userId,
      name: 'suggestion_undone',
      props: { suggestion_id: row.suggestion_id, suggestion_type: suggestionType },
    }
  })

  if (eventInput) {
    try {
      await track(client, eventInput)
    } catch (error) {
      console.error('suggestion_undone event failed', error)
    }
  }

  void suggestionId
}

export async function dismissSuggestion(
  client: DbClient,
  workspaceId: string,
  suggestionId: string,
  userId: string
): Promise<void> {
  const { data, error } = await client
    .from('suggestions')
    .select('id, workspace_id, status, type')
    .eq('id', suggestionId)
    .single()

  if (error || !data) {
    throw new SuggestionStateError(`Suggestion "${suggestionId}" not found`)
  }
  if (data.workspace_id !== workspaceId) {
    throw new SuggestionStateError('Suggestion does not belong to this workspace')
  }
  if (data.status !== 'pending' && data.status !== 'shown') {
    throw new SuggestionStateError(`Cannot dismiss suggestion in status "${data.status}"`)
  }

  const { error: updateError } = await client
    .from('suggestions')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', suggestionId)
    .eq('workspace_id', workspaceId)

  if (updateError) {
    throw new SuggestionStateError('Failed to dismiss suggestion')
  }

  try {
    await track(client, {
      workspaceId,
      userId,
      name: 'suggestion_dismissed',
      props: { suggestion_id: suggestionId, suggestion_type: data.type },
    })
  } catch (trackError) {
    console.error('suggestion_dismissed event failed', trackError)
  }
}

export { ValidationError, OperationError, SuggestionStateError }
