import { describe, expect, it, beforeAll, afterAll } from 'vitest'

import {
  applyOperations,
  applySuggestion,
  undoChange,
} from '@/lib/adaptation/apply'
import { SuggestionStateError } from '@/lib/adaptation/errors'
import { resetPgPoolForTests } from '@/lib/adaptation/pg-transaction'
import type { Operation } from '@/lib/adaptation/types'
import { getPgPool } from '@/lib/adaptation/pg-transaction'

import {
  createEntityFieldForTests,
  createWorkItems,
  defaultSpaceIdForWorkspace,
  ensurePgEnv,
  getAdaptationTestEnv,
  insertEntityForTests,
  insertLinkedWorkItem,
  insertSuggestion,
  keyAbsentInData,
} from './helpers'
import { createTestUser, createWorkspaceForOwner } from '@/tests/rls/helpers'

describe(
  'adaptation apply/undo (integration)',
  () => {
  const env = getAdaptationTestEnv()
  if (!env) {
    it.skip('Set SUPABASE_DB_URL (postgresql URI) plus Supabase API keys in .env.local', () => {})
    return
  }

  beforeAll(() => {
    ensurePgEnv(env.dbUrl)
    resetPgPoolForTests()
  })

  const createdUserIds: string[] = []
  let userClient: Awaited<ReturnType<typeof createTestUser>>['client']
  let userId: string
  let workspaceId: string
  const tag = Date.now()

  beforeAll(async () => {
    const user = await createTestUser(env, `adapt-${tag}@example.com`, 'test-password-123')
    userClient = user.client
    userId = user.id
    createdUserIds.push(userId)
    workspaceId = await createWorkspaceForOwner(userClient, userId)
  })

  afterAll(async () => {
    const { adminClient } = await import('@/tests/rls/helpers')
    const admin = adminClient(env)
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id)
    }
    await getPgPool().end()
    resetPgPoolForTests()
  })

  describe('case 1: each operation round-trips via inverse', () => {
    it('create_field / delete_field', async () => {
      const key = `rt_field_${tag}`
      const op: Operation = {
        op: 'create_field',
        field: { key, label: 'Roundtrip', type: 'text' },
      }
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [op])
      const { data: after } = await userClient
        .from('field_definitions')
        .select('key')
        .eq('workspace_id', workspaceId)
        .eq('key', key)
      expect(after?.length).toBe(1)

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: gone } = await userClient
        .from('field_definitions')
        .select('key')
        .eq('workspace_id', workspaceId)
        .eq('key', key)
      expect(gone?.length).toBe(0)
    })

    it('set_field_visibility', async () => {
      const key = `rt_vis_${tag}`
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Vis', type: 'text' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'set_field_visibility', key, visible: false },
      ])
      const { data: hidden } = await userClient
        .from('field_definitions')
        .select('visible')
        .eq('key', key)
        .single()
      expect(hidden?.visible).toBe(false)

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: restored } = await userClient
        .from('field_definitions')
        .select('visible')
        .eq('key', key)
        .single()
      expect(restored?.visible).toBe(true)
    })

    it('update_field', async () => {
      const key = `rt_upd_${tag}`
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Before', type: 'text' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'update_field', key, patch: { label: 'After' } },
      ])
      const { data: row } = await userClient
        .from('field_definitions')
        .select('label')
        .eq('key', key)
        .single()
      expect(row?.label).toBe('After')

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: back } = await userClient
        .from('field_definitions')
        .select('label')
        .eq('key', key)
        .single()
      expect(back?.label).toBe('Before')
    })

    it('backfill_field', async () => {
      const key = `rt_bf_${tag}`
      const [itemId] = await createWorkItems(userClient, workspaceId, ['Backfill me'])
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'BF', type: 'text' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'backfill_field', key, values: { [itemId]: 'filled' } },
      ])
      const { data: item } = await userClient
        .from('work_items')
        .select('data')
        .eq('id', itemId)
        .single()
      expect((item?.data as Record<string, unknown>)[key]).toBe('filled')

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: restored } = await userClient
        .from('work_items')
        .select('data')
        .eq('id', itemId)
        .single()
      expect(keyAbsentInData(restored?.data as Record<string, unknown>, key)).toBe(true)
    })

    it('create_view / delete_view', async () => {
      const key = `rt_view_${tag}`
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Lane', type: 'text' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        {
          op: 'create_view',
          view: { name: `Board ${tag}`, type: 'board', groupByField: key },
        },
      ])
      const { data: views } = await userClient
        .from('view_definitions')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('name', `Board ${tag}`)
      expect(views?.length).toBe(1)

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: gone } = await userClient
        .from('view_definitions')
        .select('id')
        .eq('name', `Board ${tag}`)
      expect(gone?.length).toBe(0)
    })

    it('create_recurrence_rule / delete_recurrence_rule', async () => {
      const spaceId = await defaultSpaceIdForWorkspace(userClient, workspaceId)
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        {
          op: 'create_recurrence_rule',
          rule: {
            spaceId,
            templateItem: { title: 'Weekly' },
            freq: 'weekly',
            intervalCount: 1,
            byWeekday: [1],
            timeOfDay: null,
            startsOn: '2026-12-01',
            endsOn: null,
            exceptions: [],
          },
        },
      ])
      const { data: rules } = await userClient
        .from('recurrence_rules')
        .select('id')
        .eq('workspace_id', workspaceId)
      expect(rules?.length).toBeGreaterThan(0)

      await applyOperations(userClient, workspaceId, inverseOperations)
    })

    it('delete_field restores snapshots', async () => {
      const key = `rt_del_${tag}`
      const [itemId] = await createWorkItems(userClient, workspaceId, ['Delete field item'])
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Del', type: 'text' } },
        { op: 'backfill_field', key, values: { [itemId]: 'keep' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'delete_field', key },
      ])
      const { data: noField } = await userClient
        .from('field_definitions')
        .select('id')
        .eq('key', key)
      expect(noField?.length).toBe(0)

      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: fieldBack } = await userClient
        .from('field_definitions')
        .select('key')
        .eq('key', key)
      expect(fieldBack?.length).toBe(1)
      const { data: item } = await userClient
        .from('work_items')
        .select('data')
        .eq('id', itemId)
        .single()
      expect((item?.data as Record<string, unknown>)[key]).toBe('keep')
    })
  })

  describe('case 2: chain + undoChange', () => {
    it('create_field → backfill (5 items) → grouped view; undo removes key from data', async () => {
      const key = `chain_${tag}`
      const itemIds = await createWorkItems(
        userClient,
        workspaceId,
        Array.from({ length: 5 }, (_, i) => `Chain item ${i}`)
      )
      const values = Object.fromEntries(itemIds.map((id, i) => [id, `v${i}`]))
      const operations: Operation[] = [
        { op: 'create_field', field: { key, label: 'Chain', type: 'text' } },
        { op: 'backfill_field', key, values },
        {
          op: 'create_view',
          view: { name: `Chain view ${tag}`, type: 'grouped', groupByField: key },
        },
      ]
      const suggestionId = await insertSuggestion(
        userClient,
        workspaceId,
        operations,
        `chain-${tag}`
      )
      await applySuggestion(userClient, workspaceId, suggestionId, userId)

      const { data: changeRows } = await userClient
        .from('change_log')
        .select('id')
        .eq('suggestion_id', suggestionId)
        .single()
      expect(changeRows?.id).toBeTruthy()

      await undoChange(userClient, workspaceId, changeRows!.id, userId)

      for (const itemId of itemIds) {
        const { data: row } = await userClient
          .from('work_items')
          .select('data')
          .eq('id', itemId)
          .single()
        expect(keyAbsentInData(row?.data as Record<string, unknown>, key)).toBe(true)
      }

      const pool = getPgPool()
      const verify = await pool.query(
        `select id, data ? $2 as has_key, data->$2 as val
         from public.work_items
         where workspace_id = $1 and id = any($3::uuid[])`,
        [workspaceId, key, itemIds]
      )
      // Acceptance check 4: paste-friendly output
      console.log(
        'case 2 post-undo jsonb key check:',
        JSON.stringify(verify.rows, null, 2)
      )
      for (const row of verify.rows) {
        expect(row.has_key).toBe(false)
        expect(row.val).toBeNull()
      }

      const { data: views } = await userClient
        .from('view_definitions')
        .select('id')
        .eq('name', `Chain view ${tag}`)
      expect(views?.length).toBe(0)

      const { data: fields } = await userClient
        .from('field_definitions')
        .select('id')
        .eq('key', key)
      expect(fields?.length).toBe(0)
    })
  })

  describe('case 3: partial failure rolls back', () => {
    it('invalid third op leaves suggestion pending and no field', async () => {
      const key = `partial_${tag}`
      const operations: Operation[] = [
        { op: 'create_field', field: { key, label: 'Partial', type: 'text' } },
        {
          op: 'backfill_field',
          key,
          values: {},
        },
        {
          op: 'create_view',
          view: {
            name: 'Bad',
            type: 'board',
            groupByField: 'no_such_field_xyz',
          },
        },
      ]
      const suggestionId = await insertSuggestion(
        userClient,
        workspaceId,
        operations,
        `partial-${tag}`
      )

      await expect(
        applySuggestion(userClient, workspaceId, suggestionId, userId)
      ).rejects.toThrow()

      const { data: field } = await userClient
        .from('field_definitions')
        .select('key')
        .eq('key', key)
      expect(field?.length).toBe(0)

      const { data: sug } = await userClient
        .from('suggestions')
        .select('status')
        .eq('id', suggestionId)
        .single()
      expect(sug?.status).toBe('pending')
    })
  })

  describe('case 4: backfill null vs absent', () => {
    it('undo removes key that was absent before backfill', async () => {
      const key = `absent_${tag}`
      const [itemId] = await createWorkItems(userClient, workspaceId, ['Absent key item'])
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Absent', type: 'text' } },
      ])
      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'backfill_field', key, values: { [itemId]: 'temp' } },
      ])
      await applyOperations(userClient, workspaceId, inverseOperations)
      const { data: row } = await userClient
        .from('work_items')
        .select('data')
        .eq('id', itemId)
        .single()
      const data = row?.data as Record<string, unknown>
      expect(keyAbsentInData(data, key)).toBe(true)
      expect(data[key]).toBeUndefined()
    })
  })

  describe('case 5: double-apply rejected', () => {
    it('second applySuggestion throws SuggestionStateError', async () => {
      const suggestionId = await insertSuggestion(
        userClient,
        workspaceId,
        [{ op: 'create_field', field: { key: `dbl_${tag}`, label: 'D', type: 'text' } }],
        `dbl-${tag}`
      )
      await applySuggestion(userClient, workspaceId, suggestionId, userId)
      await expect(
        applySuggestion(userClient, workspaceId, suggestionId, userId)
      ).rejects.toBeInstanceOf(SuggestionStateError)
    })
  })

  describe('case 6: double-undo rejected', () => {
    it('second undoChange throws SuggestionStateError', async () => {
      const key = `undbl_${tag}`
      const suggestionId = await insertSuggestion(
        userClient,
        workspaceId,
        [{ op: 'create_field', field: { key, label: 'U', type: 'text' } }],
        `undbl-${tag}`
      )
      await applySuggestion(userClient, workspaceId, suggestionId, userId)
      const { data: log } = await userClient
        .from('change_log')
        .select('id')
        .eq('suggestion_id', suggestionId)
        .single()
      await undoChange(userClient, workspaceId, log!.id, userId)
      await expect(
        undoChange(userClient, workspaceId, log!.id, userId)
      ).rejects.toBeInstanceOf(SuggestionStateError)
    })
  })

  describe('case 7: cross-workspace guard', () => {
    it('applySuggestion with wrong workspaceId throws', async () => {
      const other = await createTestUser(env, `adapt-b-${tag}@example.com`, 'test-password-123')
      createdUserIds.push(other.id)
      const otherWs = await createWorkspaceForOwner(other.client, other.id)
      const suggestionId = await insertSuggestion(
        other.client,
        otherWs,
        [{ op: 'create_field', field: { key: `xws_${tag}`, label: 'X', type: 'text' } }],
        `xws-${tag}`
      )
      await expect(
        applySuggestion(userClient, workspaceId, suggestionId, userId)
      ).rejects.toBeInstanceOf(SuggestionStateError)

      const { data: field } = await other.client
        .from('field_definitions')
        .select('key')
        .eq('key', `xws_${tag}`)
      expect(field?.length).toBe(0)
    })
  })

  describe('case 9: entity archive / follow-up / draft round-trips', () => {
    async function snapshotEntityArchiveFixture(
      entityId: string,
      entityFieldKey: string,
      itemIds: string[]
    ) {
      const pool = getPgPool()
      const ent = await pool.query(
        `select archived_at from public.entities where workspace_id = $1 and id = $2`,
        [workspaceId, entityId]
      )
      const items = await pool.query(
        `select id, archived_at, due_date, start_at, data
         from public.work_items
         where workspace_id = $1 and id = any($2::uuid[])
         order by id`,
        [workspaceId, itemIds]
      )
      const drafts = await pool.query(
        `select id, entity_id, channel, body, status
         from public.drafts
         where workspace_id = $1 and entity_id = $2
         order by id`,
        [workspaceId, entityId]
      )
      return JSON.stringify({
        entity: ent.rows[0],
        items: items.rows,
        drafts: drafts.rows,
      })
    }

    it('archive_entity restores only undated linked items on undo', async () => {
      const fieldKey = `ent_${tag}`
      const spaceId = await defaultSpaceIdForWorkspace(userClient, workspaceId)
      await createEntityFieldForTests(userClient, workspaceId, fieldKey)
      const entityId = await insertEntityForTests(userClient, workspaceId, spaceId, 'Max Test')
      const undatedA = await insertLinkedWorkItem(userClient, workspaceId, spaceId, fieldKey, entityId, {
        title: 'Open note A',
      })
      const undatedB = await insertLinkedWorkItem(userClient, workspaceId, spaceId, fieldKey, entityId, {
        title: 'Open note B',
      })
      const dated = await insertLinkedWorkItem(userClient, workspaceId, spaceId, fieldKey, entityId, {
        title: 'Past session',
        dueDate: '2026-01-01',
      })
      const unrelated = await createWorkItems(userClient, workspaceId, ['No entity link'])
      const itemIds = [undatedA, undatedB, dated, unrelated[0]!]

      const before = await snapshotEntityArchiveFixture(entityId, fieldKey, itemIds)

      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'archive_entity', entityId },
      ])

      const pool = getPgPool()
      const entAfter = await pool.query(
        `select archived_at from public.entities where id = $1`,
        [entityId]
      )
      expect(entAfter.rows[0]?.archived_at).toBeTruthy()

      const archivedItems = await pool.query(
        `select id, archived_at from public.work_items where id = any($1::uuid[])`,
        [[undatedA, undatedB, dated]]
      )
      const byId = Object.fromEntries(
        archivedItems.rows.map((r) => [r.id as string, r.archived_at])
      )
      expect(byId[undatedA]).toBeTruthy()
      expect(byId[undatedB]).toBeTruthy()
      expect(byId[dated]).toBeNull()

      await applyOperations(userClient, workspaceId, inverseOperations)
      const after = await snapshotEntityArchiveFixture(entityId, fieldKey, itemIds)
      expect(after).toBe(before)
    })

    it('unarchive_entity round-trips via archive_entity inverse', async () => {
      const fieldKey = `unarch_${tag}`
      const spaceId = await defaultSpaceIdForWorkspace(userClient, workspaceId)
      await createEntityFieldForTests(userClient, workspaceId, fieldKey)
      const entityId = await insertEntityForTests(userClient, workspaceId, spaceId, 'Unarchive RT')
      const undated = await insertLinkedWorkItem(userClient, workspaceId, spaceId, fieldKey, entityId, {
        title: 'Undated',
      })
      const itemIds = [undated]

      await applyOperations(userClient, workspaceId, [{ op: 'archive_entity', entityId }])
      const before = await snapshotEntityArchiveFixture(entityId, fieldKey, itemIds)

      const { inverseOperations } = await applyOperations(userClient, workspaceId, [
        { op: 'unarchive_entity', entityId, restoreItemIds: [undated] },
      ])
      await applyOperations(userClient, workspaceId, inverseOperations)
      const after = await snapshotEntityArchiveFixture(entityId, fieldKey, itemIds)
      expect(after).toBe(before)
    })

    it('create_followup_item and create_draft round-trip', async () => {
      const fieldKey = `fu_${tag}`
      const spaceId = await defaultSpaceIdForWorkspace(userClient, workspaceId)
      await createEntityFieldForTests(userClient, workspaceId, fieldKey)
      const entityId = await insertEntityForTests(userClient, workspaceId, spaceId, 'Follow Up')
      const before = await snapshotEntityArchiveFixture(entityId, fieldKey, [])

      const ops: Operation[] = [
        {
          op: 'create_followup_item',
          entityId,
          spaceId,
          entityFieldKey: fieldKey,
          title: 'Follow up with Follow Up',
          dueDate: '2026-12-15',
        },
        {
          op: 'create_draft',
          entityId,
          channel: 'email',
          body: 'Hi there — checking in.',
        },
      ]
      const { inverseOperations } = await applyOperations(userClient, workspaceId, ops)

      const pool = getPgPool()
      const items = await pool.query(
        `select id from public.work_items where workspace_id = $1 and title = $2`,
        [workspaceId, 'Follow up with Follow Up']
      )
      expect(items.rows.length).toBe(1)
      const drafts = await pool.query(
        `select id from public.drafts where workspace_id = $1 and entity_id = $2`,
        [workspaceId, entityId]
      )
      expect(drafts.rows.length).toBe(1)

      await applyOperations(userClient, workspaceId, inverseOperations)
      const after = await snapshotEntityArchiveFixture(entityId, fieldKey, [])
      expect(after).toBe(before)
    })

    it('follow-up accept + undoChange via suggestion removes item and draft', async () => {
      const fieldKey = `fu_sug_${tag}`
      const spaceId = await defaultSpaceIdForWorkspace(userClient, workspaceId)
      await createEntityFieldForTests(userClient, workspaceId, fieldKey)
      const entityId = await insertEntityForTests(userClient, workspaceId, spaceId, 'Undo FU')
      const before = await snapshotEntityArchiveFixture(entityId, fieldKey, [])

      const operations: Operation[] = [
        {
          op: 'create_followup_item',
          entityId,
          spaceId,
          entityFieldKey: fieldKey,
          title: 'Follow up with Undo FU',
          dueDate: '2026-12-20',
        },
        {
          op: 'create_draft',
          entityId,
          channel: 'text',
          body: 'Quick text check-in',
        },
      ]
      const suggestionId = await insertSuggestion(
        userClient,
        workspaceId,
        operations,
        `fu-${tag}`
      )
      await applySuggestion(userClient, workspaceId, suggestionId, userId)

      const { data: log } = await userClient
        .from('change_log')
        .select('id')
        .eq('suggestion_id', suggestionId)
        .single()
      await undoChange(userClient, workspaceId, log!.id, userId)

      const after = await snapshotEntityArchiveFixture(entityId, fieldKey, [])
      expect(after).toBe(before)
    })
  })

  describe('case 8: delete_field blocked by view', () => {
    it('throws OperationError without deleting field', async () => {
      const key = `dep_${tag}`
      await applyOperations(userClient, workspaceId, [
        { op: 'create_field', field: { key, label: 'Dep', type: 'text' } },
        {
          op: 'create_view',
          view: { name: `Dep view ${tag}`, type: 'grouped', groupByField: key },
        },
      ])
      await expect(
        applyOperations(userClient, workspaceId, [{ op: 'delete_field', key }])
      ).rejects.toMatchObject({ name: 'OperationError' })

      const { data: field } = await userClient
        .from('field_definitions')
        .select('key')
        .eq('key', key)
      expect(field?.length).toBe(1)
    })
  })
  },
  30_000
)
