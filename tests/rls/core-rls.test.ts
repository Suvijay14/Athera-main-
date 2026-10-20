import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

import type { Database } from '@/lib/db/database.types'

import {
  adminClient,
  anonClient,
  createTestUser,
  createWorkspaceForOwner,
  getTestEnv,
} from './helpers'

describe('core RLS', () => {
  const env = getTestEnv()
  if (!env) {
    it.skip('Set NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY in .env.local', () => {})
    return
  }

  const createdUserIds: string[] = []
  let userA: { id: string; client: SupabaseClient<Database> }
  let userB: { id: string; client: SupabaseClient<Database> }
  let workspaceA: string
  let workspaceB: string

  beforeAll(async () => {
    if (!env) return
    const suffix = Date.now()
    userA = await createTestUser(env, `rls-a-${suffix}@example.com`, 'test-password-123')
    userB = await createTestUser(env, `rls-b-${suffix}@example.com`, 'test-password-123')
    createdUserIds.push(userA.id, userB.id)
    workspaceA = await createWorkspaceForOwner(userA.client, userA.id)
    workspaceB = await createWorkspaceForOwner(userB.client, userB.id)
  })

  afterAll(async () => {
    if (!env) return
    const admin = adminClient(env)
    for (const id of createdUserIds) {
      await admin.auth.admin.deleteUser(id)
    }
  })

  it('user A cannot read user B workspace', async () => {
    const { data, error } = await userA.client.from('workspaces').select('*').eq('id', workspaceB)
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  async function defaultSpaceId(workspaceId: string): Promise<string> {
    const { data, error } = await userA.client
      .from('spaces')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('is_default', true)
      .single()
    if (error) {
      throw error
    }
    return data.id
  }

  it('user A cannot insert into B workspace', async () => {
    const spaceB = await defaultSpaceId(workspaceB)
    const { error } = await userA.client.from('work_items').insert({
      workspace_id: workspaceB,
      space_id: spaceB,
      title: 'Cross tenant',
    })
    expect(error).not.toBeNull()
  })

  it('user A CRUD on own work_items; cannot move row to B workspace', async () => {
    const spaceA = await defaultSpaceId(workspaceA)
    const { data: created, error: createError } = await userA.client
      .from('work_items')
      .insert({ workspace_id: workspaceA, space_id: spaceA, title: 'Owned item' })
      .select('id')
      .single()
    expect(createError).toBeNull()
    expect(created?.id).toBeTruthy()

    const { data: listed } = await userA.client
      .from('work_items')
      .select('id')
      .eq('workspace_id', workspaceA)
    expect(listed?.some((r) => r.id === created?.id)).toBe(true)

    const { error: updateWorkspaceError } = await userA.client
      .from('work_items')
      .update({ workspace_id: workspaceB })
      .eq('id', created!.id)
    expect(updateWorkspaceError).not.toBeNull()

    const { count } = await userB.client
      .from('work_items')
      .select('*', { count: 'exact', head: true })
      .eq('id', created!.id)
    expect(count).toBe(0)

    const { error: deleteError } = await userA.client.from('work_items').delete().eq('id', created!.id)
    expect(deleteError).toBeNull()
  })

  it('events are append-only for owner', async () => {
    const { data: event, error: insertError } = await userA.client
      .from('events')
      .insert({
        workspace_id: workspaceA,
        user_id: userA.id,
        name: 'item_created',
      })
      .select('id')
      .single()
    expect(insertError).toBeNull()

    const { error: updateError } = await userA.client
      .from('events')
      .update({ name: 'item_edited' })
      .eq('id', event!.id)
    expect(updateError).not.toBeNull()

    const { error: deleteError } = await userA.client.from('events').delete().eq('id', event!.id)
    expect(deleteError).not.toBeNull()
  })

  it('events cannot use another user_id', async () => {
    const { error } = await userA.client.from('events').insert({
      workspace_id: workspaceA,
      user_id: userB.id,
      name: 'item_created',
    })
    expect(error).not.toBeNull()
  })

  it('suggestions dedupe while pending; allowed after dismissed', async () => {
    const dedupe = `dedupe-${Date.now()}`
    const base = {
      workspace_id: workspaceA,
      type: 'test',
      reason: 'Because 3 items',
      confidence: 0.8,
      operations: [],
      dedupe_key: dedupe,
    }
    const first = await userA.client.from('suggestions').insert(base).select('id').single()
    expect(first.error).toBeNull()

    const dup = await userA.client.from('suggestions').insert(base).select('id').single()
    expect(dup.error).not.toBeNull()

    await userA.client
      .from('suggestions')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
      .eq('id', first.data!.id)

    const second = await userA.client.from('suggestions').insert(base).select('id').single()
    expect(second.error).toBeNull()
  })

  it('change_log composite FK rejects wrong workspace suggestion', async () => {
    const { data: suggestion, error: sugError } = await userB.client
      .from('suggestions')
      .insert({
        workspace_id: workspaceB,
        type: 'test',
        reason: 'Because 2 items',
        confidence: 0.5,
        operations: [],
        dedupe_key: `b-${Date.now()}`,
      })
      .select('id')
      .single()
    expect(sugError).toBeNull()

    const { error } = await userA.client.from('change_log').insert({
      workspace_id: workspaceA,
      suggestion_id: suggestion!.id,
      operations: [],
      inverse_operations: [],
    })
    expect(error).not.toBeNull()
  })

  it('view_definitions require existing group field; field delete restricted', async () => {
    const { error: badViewError } = await userA.client.from('view_definitions').insert({
      workspace_id: workspaceA,
      name: 'Bad board',
      type: 'board',
      group_by_field: 'missing_field',
      source: 'user',
    })
    expect(badViewError).not.toBeNull()

    await userA.client.from('field_definitions').insert({
      workspace_id: workspaceA,
      key: 'lane',
      label: 'Lane',
      type: 'select',
      source: 'user',
    })

    const { error: goodViewError } = await userA.client.from('view_definitions').insert({
      workspace_id: workspaceA,
      name: 'Good board',
      type: 'board',
      group_by_field: 'lane',
      source: 'user',
    })
    expect(goodViewError).toBeNull()

    const { error: deleteFieldError } = await userA.client
      .from('field_definitions')
      .delete()
      .eq('workspace_id', workspaceA)
      .eq('key', 'lane')
    expect(deleteFieldError).not.toBeNull()
  })

  it('spaces and entities are workspace-scoped', async () => {
    const spaceA = await defaultSpaceId(workspaceA)

    const { data: space, error: spaceReadError } = await userA.client
      .from('spaces')
      .select('id')
      .eq('id', spaceA)
      .single()
    expect(spaceReadError).toBeNull()
    expect(space?.id).toBe(spaceA)

    const { data: crossSpace, error: crossReadError } = await userA.client
      .from('spaces')
      .select('id')
      .eq('workspace_id', workspaceB)
    expect(crossReadError).toBeNull()
    expect(crossSpace).toEqual([])

    const { data: entity, error: entityError } = await userA.client
      .from('entities')
      .insert({
        workspace_id: workspaceA,
        space_id: spaceA,
        kind: 'client',
        name: 'RLS Client',
      })
      .select('id')
      .single()
    expect(entityError).toBeNull()

    const { count } = await userB.client
      .from('entities')
      .select('*', { count: 'exact', head: true })
      .eq('id', entity!.id)
    expect(count).toBe(0)

    await userA.client.from('entities').delete().eq('id', entity!.id)
  })

  it('user B cannot modify user A spaces', async () => {
    const spaceA = await defaultSpaceId(workspaceA)
    const { error: updateError } = await userB.client
      .from('spaces')
      .update({ name: 'Hacked' })
      .eq('id', spaceA)
    expect(updateError).not.toBeNull()
  })

  it('anon cannot read or insert', async () => {
    const anon = anonClient(env!)
    const { data: readData, error: readError } = await anon.from('workspaces').select('*')
    expect(readError).toBeNull()
    expect(readData).toEqual([])

    const spaceA = await defaultSpaceId(workspaceA)
    const { error: insertError } = await anon.from('work_items').insert({
      workspace_id: workspaceA,
      space_id: spaceA,
      title: 'Anon item',
    })
    expect(insertError).not.toBeNull()
  })
})
