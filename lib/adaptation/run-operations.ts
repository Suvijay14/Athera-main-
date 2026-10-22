import { randomUUID } from 'node:crypto'

import type { PoolClient } from 'pg'

import type { FieldDefinition, FieldType } from '@/lib/db/schemas'
import { fieldKeySchema } from '@/lib/db/schemas'
import { validateItemData } from '@/lib/db/validate-item-data'

import { isKeyAbsent, readDataKey, setDataKey } from './data-json'
import { OperationError, ValidationError, wrapPgError } from './errors'
import { fieldFromRow, parseDataObject } from './pg-rows'
import type { Operation } from './types'
import { operationSchema, operationsSchema } from './types'

async function loadFields(tx: PoolClient, workspaceId: string): Promise<FieldDefinition[]> {
  const { rows } = await tx.query(
    `select * from public.field_definitions where workspace_id = $1 order by position asc, created_at asc`,
    [workspaceId]
  )
  return rows.map((row) => fieldFromRow(row as Parameters<typeof fieldFromRow>[0]))
}

async function assertFieldExists(
  tx: PoolClient,
  workspaceId: string,
  key: string
): Promise<FieldDefinition> {
  const { rows } = await tx.query(
    `select * from public.field_definitions where workspace_id = $1 and key = $2`,
    [workspaceId, key]
  )
  if (rows.length === 0) {
    throw new ValidationError(`Field "${key}" does not exist in this workspace`)
  }
  return fieldFromRow(rows[0] as Parameters<typeof fieldFromRow>[0])
}

async function validateBackfillValues(
  fields: FieldDefinition[],
  key: string,
  values: Record<string, unknown | null>
): Promise<void> {
  for (const [itemId, value] of Object.entries(values)) {
    if (value === null) {
      continue
    }
    const result = validateItemData({ [key]: value }, fields)
    if (!result.ok) {
      throw new ValidationError(
        `Invalid backfill for item ${itemId}: ${result.errors.map((e) => e.message).join('; ')}`
      )
    }
  }
}

export async function executeOperation(
  tx: PoolClient,
  workspaceId: string,
  rawOp: Operation
): Promise<Operation[]> {
  const op = operationSchema.parse(rawOp)

  try {
    switch (op.op) {
      case 'create_field': {
        fieldKeySchema.parse(op.field.key)
        const existing = await tx.query(
          `select 1 from public.field_definitions where workspace_id = $1 and key = $2`,
          [workspaceId, op.field.key]
        )
        if (existing.rowCount && existing.rowCount > 0) {
          throw new OperationError(op, `Field "${op.field.key}" already exists`)
        }
        const entityKind = op.field.type === 'entity' ? op.field.entityKind ?? null : null
        await tx.query(
          `insert into public.field_definitions
            (workspace_id, key, label, type, options, entity_kind, visible, position, source)
           values ($1, $2, $3, $4, $5::jsonb, $6, true, 0, 'athera')`,
          [
            workspaceId,
            op.field.key,
            op.field.label,
            op.field.type,
            JSON.stringify(op.field.options ?? []),
            entityKind,
          ]
        )
        return [{ op: 'delete_field', key: op.field.key }]
      }

      case 'delete_field': {
        const viewDep = await tx.query(
          `select name from public.view_definitions
           where workspace_id = $1 and group_by_field = $2 limit 1`,
          [workspaceId, op.key]
        )
        if (viewDep.rowCount && viewDep.rowCount > 0) {
          const name = viewDep.rows[0]?.name as string
          throw new OperationError(
            op,
            `Cannot delete field "${op.key}" while view "${name}" groups by it`
          )
        }

        const fieldRow = await tx.query(
          `select * from public.field_definitions where workspace_id = $1 and key = $2`,
          [workspaceId, op.key]
        )
        if (fieldRow.rowCount === 0) {
          throw new OperationError(op, `Field "${op.key}" not found`)
        }
        const field = fieldFromRow(fieldRow.rows[0] as Parameters<typeof fieldFromRow>[0])

        const items = await tx.query(
          `select id, data from public.work_items where workspace_id = $1`,
          [workspaceId]
        )
        const backfillValues: Record<string, unknown | null> = {}
        for (const row of items.rows) {
          const data = parseDataObject(row.data)
          const itemId = row.id as string
          if (isKeyAbsent(data, op.key)) {
            backfillValues[itemId] = null
          } else {
            backfillValues[itemId] = readDataKey(data, op.key)
          }
        }

        await tx.query(
          `delete from public.field_definitions where workspace_id = $1 and key = $2`,
          [workspaceId, op.key]
        )

        return [
          {
            op: 'create_field',
            field: {
              key: field.key,
              label: field.label,
              type: field.type as FieldType,
              options: field.options,
              ...(field.type === 'entity' && field.entityKind
                ? { entityKind: field.entityKind }
                : {}),
            },
          },
          { op: 'backfill_field', key: op.key, values: backfillValues },
        ]
      }

      case 'set_field_visibility': {
        const current = await tx.query(
          `select visible from public.field_definitions where workspace_id = $1 and key = $2`,
          [workspaceId, op.key]
        )
        if (current.rowCount === 0) {
          throw new OperationError(op, `Field "${op.key}" not found`)
        }
        const previous = current.rows[0]?.visible as boolean
        if (previous !== op.visible) {
          await tx.query(
            `update public.field_definitions set visible = $3
             where workspace_id = $1 and key = $2`,
            [workspaceId, op.key, op.visible]
          )
        }
        return [{ op: 'set_field_visibility', key: op.key, visible: previous }]
      }

      case 'update_field': {
        const current = await assertFieldExists(tx, workspaceId, op.key)
        const nextLabel = op.patch.label ?? current.label
        const nextOptions = op.patch.options ?? current.options
        await tx.query(
          `update public.field_definitions
           set label = $3, options = $4::jsonb
           where workspace_id = $1 and key = $2`,
          [workspaceId, op.key, nextLabel, JSON.stringify(nextOptions)]
        )
        const patch: { label?: string; options?: string[] } = {}
        if (op.patch.label !== undefined) {
          patch.label = current.label
        }
        if (op.patch.options !== undefined) {
          patch.options = current.options
        }
        return [{ op: 'update_field', key: op.key, patch }]
      }

      case 'create_view': {
        const noGroupTypes = op.view.type === 'list' || op.view.type === 'calendar'
        if (noGroupTypes && op.view.groupByField) {
          throw new ValidationError(`${op.view.type} views cannot have groupByField`)
        }
        if (!noGroupTypes) {
          if (!op.view.groupByField) {
            throw new ValidationError('groupByField is required for grouped and board views')
          }
          await assertFieldExists(tx, workspaceId, op.view.groupByField)
        }
        const inserted = await tx.query(
          `insert into public.view_definitions
            (workspace_id, name, type, group_by_field, color_by_field, calendar_range, filters, visible, position, source)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb, true, 0, 'athera')
           returning id`,
          [
            workspaceId,
            op.view.name,
            op.view.type,
            noGroupTypes ? null : op.view.groupByField ?? null,
            op.view.colorByField ?? null,
            op.view.type === 'calendar' ? op.view.calendarRange ?? 'week' : null,
            JSON.stringify(op.view.filters ?? {}),
          ]
        )
        const viewId = inserted.rows[0]?.id as string
        return [{ op: 'delete_view', viewId }]
      }

      case 'delete_view': {
        const row = await tx.query(
          `select * from public.view_definitions where workspace_id = $1 and id = $2`,
          [workspaceId, op.viewId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `View "${op.viewId}" not found`)
        }
        const v = row.rows[0] as {
          name: string
          type: 'list' | 'grouped' | 'board' | 'calendar'
          group_by_field: string | null
          color_by_field: string | null
          calendar_range: 'week' | 'month' | null
        }
        await tx.query(
          `delete from public.view_definitions where workspace_id = $1 and id = $2`,
          [workspaceId, op.viewId]
        )
        return [
          {
            op: 'create_view',
            view: {
              name: v.name,
              type: v.type,
              groupByField: v.group_by_field ?? undefined,
              colorByField: v.color_by_field ?? undefined,
              calendarRange: v.calendar_range ?? undefined,
            },
          },
        ]
      }

      case 'create_entity': {
        const inserted = await tx.query(
          `insert into public.entities
            (workspace_id, space_id, kind, name, aliases, color)
           values ($1, $2, $3, $4, $5::text[], $6)
           returning id`,
          [
            workspaceId,
            op.entity.spaceId,
            op.entity.kind,
            op.entity.name.trim(),
            op.entity.aliases ?? [],
            op.entity.color ?? null,
          ]
        )
        const entityId = inserted.rows[0]?.id as string
        return [{ op: 'delete_entity', entityId }]
      }

      case 'delete_entity': {
        const row = await tx.query(
          `select space_id, kind, name, aliases, color from public.entities
           where workspace_id = $1 and id = $2`,
          [workspaceId, op.entityId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Entity "${op.entityId}" not found`)
        }
        const e = row.rows[0] as {
          space_id: string
          kind: string
          name: string
          aliases: string[]
          color: string | null
        }
        await tx.query(
          `delete from public.entities where workspace_id = $1 and id = $2`,
          [workspaceId, op.entityId]
        )
        return [
          {
            op: 'create_entity',
            entity: {
              spaceId: e.space_id,
              kind: e.kind,
              name: e.name,
              aliases: e.aliases,
              color: e.color,
            },
          },
        ]
      }

      case 'backfill_field': {
        const fields = await loadFields(tx, workspaceId)
        const fieldDef = fields.find((f) => f.key === op.key)
        const resolvedValues: Record<string, unknown | null> = {}

        for (const [itemId, rawValue] of Object.entries(op.values)) {
          let newValue: unknown = rawValue
          if (fieldDef?.type === 'entity' && typeof rawValue === 'string') {
            const isUuid = /^[0-9a-f-]{36}$/i.test(rawValue)
            if (!isUuid) {
              const itemRow = await tx.query(
                `select space_id from public.work_items where id = $1 and workspace_id = $2`,
                [itemId, workspaceId]
              )
              const spaceId = itemRow.rows[0]?.space_id as string | undefined
              if (spaceId) {
                const ent = await tx.query(
                  `select id from public.entities
                   where workspace_id = $1 and space_id = $2 and lower(name) = lower($3)
                   limit 1`,
                  [workspaceId, spaceId, rawValue]
                )
                const entityId = ent.rows[0]?.id as string | undefined
                if (!entityId) {
                  throw new OperationError(
                    op,
                    `Entity "${rawValue}" not found for backfill on item ${itemId}`
                  )
                }
                newValue = entityId
              }
            }
          }
          resolvedValues[itemId] = newValue
        }

        await validateBackfillValues(fields, op.key, resolvedValues)

        const inverseValues: Record<string, unknown | null> = {}

        for (const [itemId, newValue] of Object.entries(resolvedValues)) {
          const itemRow = await tx.query(
            `select data from public.work_items where id = $1 and workspace_id = $2`,
            [itemId, workspaceId]
          )
          if (itemRow.rowCount === 0) {
            throw new OperationError(op, `Work item "${itemId}" not in this workspace`)
          }
          const data = parseDataObject(itemRow.rows[0]?.data)
          if (isKeyAbsent(data, op.key)) {
            inverseValues[itemId] = null
          } else {
            inverseValues[itemId] = readDataKey(data, op.key)
          }

          const nextData = setDataKey(data, op.key, newValue)
          await tx.query(
            `update public.work_items set data = $3::jsonb where id = $1 and workspace_id = $2`,
            [itemId, workspaceId, JSON.stringify(nextData)]
          )
        }

        return [{ op: 'backfill_field', key: op.key, values: inverseValues }]
      }

      case 'create_recurrence_rule': {
        const ruleId = op.rule.preserveRuleId ?? randomUUID()
        await tx.query(
          `insert into public.recurrence_rules
            (id, workspace_id, space_id, template_item, freq, interval_count, by_weekday,
             time_of_day, duration_min, starts_on, ends_on, exceptions, active, source)
           values ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, true, 'athera')`,
          [
            ruleId,
            workspaceId,
            op.rule.spaceId,
            JSON.stringify(op.rule.templateItem),
            op.rule.freq,
            op.rule.intervalCount,
            op.rule.byWeekday,
            op.rule.timeOfDay,
            op.rule.durationMin ?? null,
            op.rule.startsOn,
            op.rule.endsOn ?? null,
            op.rule.exceptions ?? [],
          ]
        )
        const linkIds = op.rule.linkItemIds ?? []
        if (linkIds.length > 0) {
          await tx.query(
            `update public.work_items set recurrence_id = $3
             where workspace_id = $1 and id = any($2::uuid[])`,
            [workspaceId, linkIds, ruleId]
          )
        }
        return [
          { op: 'delete_recurrence_rule', ruleId },
          ...(linkIds.length > 0
            ? [{ op: 'clear_item_recurrence' as const, itemIds: linkIds, ruleId }]
            : []),
        ]
      }

      case 'delete_recurrence_rule': {
        const row = await tx.query(
          `select space_id, template_item, freq, interval_count, by_weekday, time_of_day,
                  duration_min, starts_on, ends_on, exceptions
           from public.recurrence_rules where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Recurrence rule "${op.ruleId}" not found`)
        }
        const linked = await tx.query(
          `select id from public.work_items where workspace_id = $1 and recurrence_id = $2`,
          [workspaceId, op.ruleId]
        )
        const linkItemIds = linked.rows.map((r) => r.id as string)
        const r = row.rows[0] as {
          space_id: string
          template_item: unknown
          freq: string
          interval_count: number
          by_weekday: number[]
          time_of_day: string | null
          duration_min: number | null
          starts_on: string
          ends_on: string | null
          exceptions: string[]
        }
        await tx.query(
          `delete from public.recurrence_rules where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId]
        )
        return [
          {
            op: 'create_recurrence_rule',
            rule: {
              spaceId: r.space_id,
              templateItem: parseDataObject(r.template_item),
              freq: 'weekly' as const,
              intervalCount: r.interval_count as 1 | 2,
              byWeekday: r.by_weekday,
              timeOfDay: r.time_of_day,
              durationMin: r.duration_min,
              startsOn: r.starts_on,
              endsOn: r.ends_on,
              exceptions: r.exceptions ?? [],
              linkItemIds,
              preserveRuleId: op.ruleId,
            },
          },
        ]
      }

      case 'set_recurrence_exception': {
        const row = await tx.query(
          `select exceptions from public.recurrence_rules where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Recurrence rule "${op.ruleId}" not found`)
        }
        const prev = (row.rows[0]?.exceptions as string[]) ?? []
        if (prev.includes(op.date)) {
          return []
        }
        const next = [...prev, op.date]
        await tx.query(
          `update public.recurrence_rules set exceptions = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId, next]
        )
        return [
          {
            op: 'remove_recurrence_exception',
            ruleId: op.ruleId,
            date: op.date,
          },
        ]
      }

      case 'remove_recurrence_exception': {
        const row = await tx.query(
          `select exceptions from public.recurrence_rules where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Recurrence rule "${op.ruleId}" not found`)
        }
        const prev = (row.rows[0]?.exceptions as string[]) ?? []
        const next = prev.filter((d) => d !== op.date)
        await tx.query(
          `update public.recurrence_rules set exceptions = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId, next]
        )
        return [{ op: 'set_recurrence_exception', ruleId: op.ruleId, date: op.date }]
      }

      case 'end_recurrence_rule': {
        const row = await tx.query(
          `select ends_on from public.recurrence_rules where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Recurrence rule "${op.ruleId}" not found`)
        }
        const prevEnds = row.rows[0]?.ends_on as string | null
        await tx.query(
          `update public.recurrence_rules set ends_on = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId, op.endsOn]
        )
        return [
          {
            op: 'restore_recurrence_ends_on',
            ruleId: op.ruleId,
            endsOn: prevEnds,
          },
        ]
      }

      case 'restore_recurrence_ends_on': {
        await tx.query(
          `update public.recurrence_rules set ends_on = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.ruleId, op.endsOn]
        )
        return []
      }

      case 'clear_item_recurrence': {
        if (op.itemIds.length === 0) {
          return []
        }
        let ruleId = op.ruleId
        if (!ruleId) {
          const snap = await tx.query(
            `select distinct recurrence_id from public.work_items
             where workspace_id = $1 and id = any($2::uuid[]) and recurrence_id is not null`,
            [workspaceId, op.itemIds]
          )
          ruleId = snap.rows[0]?.recurrence_id as string | undefined
        }
        await tx.query(
          `update public.work_items
           set recurrence_id = null, recurrence_instance_date = null
           where workspace_id = $1 and id = any($2::uuid[])`,
          [workspaceId, op.itemIds]
        )
        if (ruleId) {
          return [{ op: 'link_items_recurrence', ruleId, itemIds: op.itemIds }]
        }
        return []
      }

      case 'link_items_recurrence': {
        if (op.itemIds.length === 0) {
          return []
        }
        await tx.query(
          `update public.work_items set recurrence_id = $3
           where workspace_id = $1 and id = any($2::uuid[])`,
          [workspaceId, op.itemIds, op.ruleId]
        )
        return [{ op: 'clear_item_recurrence', itemIds: op.itemIds, ruleId: op.ruleId }]
      }

      case 'archive_entity': {
        const ent = await tx.query(
          `select archived_at from public.entities where workspace_id = $1 and id = $2`,
          [workspaceId, op.entityId]
        )
        if (ent.rowCount === 0) {
          throw new OperationError(op, `Entity "${op.entityId}" not found`)
        }
        const wasArchived = ent.rows[0]?.archived_at
        if (wasArchived) {
          throw new OperationError(op, 'Entity is already archived')
        }

        const fieldRows = await tx.query(
          `select key from public.field_definitions
           where workspace_id = $1 and type = 'entity'`,
          [workspaceId]
        )
        const keys = fieldRows.rows.map((r) => r.key as string)
        const itemRows = await tx.query(
          `select id, data, start_at, due_date, archived_at from public.work_items
           where workspace_id = $1`,
          [workspaceId]
        )
        const restoreItemIds: string[] = []
        const nowIso = new Date().toISOString()
        for (const row of itemRows.rows) {
          const data = parseDataObject(row.data)
          const linked = keys.some((k) => readDataKey(data, k) === op.entityId)
          if (!linked) {
            continue
          }
          const hasDate = Boolean(row.start_at) || Boolean(row.due_date)
          if (hasDate || row.archived_at) {
            continue
          }
          await tx.query(
            `update public.work_items set archived_at = $3 where id = $1 and workspace_id = $2`,
            [row.id, workspaceId, nowIso]
          )
          restoreItemIds.push(row.id as string)
        }

        await tx.query(
          `update public.entities set archived_at = $3 where id = $1 and workspace_id = $2`,
          [op.entityId, workspaceId, nowIso]
        )

        return [
          {
            op: 'unarchive_entity',
            entityId: op.entityId,
            restoreItemIds,
          },
        ]
      }

      case 'unarchive_entity': {
        await tx.query(
          `update public.entities set archived_at = null where id = $1 and workspace_id = $2`,
          [op.entityId, workspaceId]
        )
        if (op.restoreItemIds?.length) {
          for (const itemId of op.restoreItemIds) {
            await tx.query(
              `update public.work_items set archived_at = null where id = $1 and workspace_id = $2`,
              [itemId, workspaceId]
            )
          }
        }
        return [{ op: 'archive_entity', entityId: op.entityId }]
      }

      case 'create_followup_item': {
        const inserted = await tx.query(
          `insert into public.work_items
            (workspace_id, space_id, title, due_date, notes, data, source)
           values ($1, $2, $3, $4, null, $5::jsonb, 'manual')
           returning id`,
          [
            workspaceId,
            op.spaceId,
            op.title,
            op.dueDate,
            JSON.stringify({ [op.entityFieldKey]: op.entityId }),
          ]
        )
        const itemId = inserted.rows[0]?.id as string
        return [{ op: 'delete_work_item', itemId }]
      }

      case 'delete_work_item': {
        const row = await tx.query(
          `select title, space_id, due_date, notes, data, start_at, end_at, all_day, source, archived_at
           from public.work_items where workspace_id = $1 and id = $2`,
          [workspaceId, op.itemId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Work item "${op.itemId}" not found`)
        }
        const w = row.rows[0] as {
          title: string
          space_id: string
          due_date: string | null
          notes: string | null
          data: unknown
          start_at: string | null
          end_at: string | null
          all_day: boolean
          source: string
          archived_at: string | null
        }
        await tx.query(
          `delete from public.work_items where workspace_id = $1 and id = $2`,
          [workspaceId, op.itemId]
        )
        const data = parseDataObject(w.data)
        return [
          {
            op: 'restore_work_item',
            itemId: op.itemId,
            spaceId: w.space_id,
            title: w.title,
            dueDate: w.due_date,
            notes: w.notes,
            data,
            startAt: w.start_at,
            endAt: w.end_at,
            allDay: w.all_day,
            source: w.source,
            archivedAt: w.archived_at,
          },
        ]
      }

      case 'restore_work_item': {
        await tx.query(
          `insert into public.work_items
            (id, workspace_id, space_id, title, due_date, notes, data, start_at, end_at, all_day, source, archived_at)
           values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11, $12)`,
          [
            op.itemId,
            workspaceId,
            op.spaceId,
            op.title,
            op.dueDate,
            op.notes,
            JSON.stringify(op.data),
            op.startAt ?? null,
            op.endAt ?? null,
            op.allDay ?? false,
            op.source ?? 'manual',
            op.archivedAt ?? null,
          ]
        )
        return [{ op: 'delete_work_item', itemId: op.itemId }]
      }

      case 'create_draft': {
        const inserted = await tx.query(
          `insert into public.drafts (workspace_id, entity_id, channel, body, status)
           values ($1, $2, $3, $4, 'draft')
           returning id`,
          [workspaceId, op.entityId, op.channel, op.body]
        )
        const draftId = inserted.rows[0]?.id as string
        return [{ op: 'delete_draft', draftId }]
      }

      case 'delete_draft': {
        const row = await tx.query(
          `select entity_id, channel, body from public.drafts
           where workspace_id = $1 and id = $2`,
          [workspaceId, op.draftId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Draft "${op.draftId}" not found`)
        }
        const d = row.rows[0] as {
          entity_id: string
          channel: string
          body: string
        }
        await tx.query(
          `delete from public.drafts where workspace_id = $1 and id = $2`,
          [workspaceId, op.draftId]
        )
        return [
          {
            op: 'create_draft',
            entityId: d.entity_id,
            channel: d.channel as 'email' | 'text',
            body: d.body,
          },
        ]
      }

      case 'create_space': {
        const spaceId = op.space.preserveSpaceId ?? randomUUID()
        await tx.query(
          `insert into public.spaces
            (id, workspace_id, parent_space_id, name, icon, color, sort_order, is_default)
           values ($1, $2, $3, $4, $5, $6, $7, false)`,
          [
            spaceId,
            workspaceId,
            op.space.parentSpaceId ?? null,
            op.space.name,
            op.space.icon ?? null,
            op.space.color ?? null,
            op.space.sortOrder ?? 0,
          ]
        )
        return [{ op: 'delete_space', spaceId }]
      }

      case 'update_space': {
        const row = await tx.query(
          `select name, parent_space_id from public.spaces
           where workspace_id = $1 and id = $2`,
          [workspaceId, op.spaceId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Space "${op.spaceId}" not found`)
        }
        const prev = row.rows[0] as { name: string; parent_space_id: string | null }
        const patch: string[] = []
        const values: unknown[] = [workspaceId, op.spaceId]
        let idx = 3
        if (op.patch.name !== undefined) {
          patch.push(`name = $${idx}`)
          values.push(op.patch.name)
          idx += 1
        }
        if (op.patch.parentSpaceId !== undefined) {
          patch.push(`parent_space_id = $${idx}`)
          values.push(op.patch.parentSpaceId)
          idx += 1
        }
        if (patch.length === 0) {
          throw new ValidationError('update_space requires at least one patch field')
        }
        await tx.query(
          `update public.spaces set ${patch.join(', ')} where workspace_id = $1 and id = $2`,
          values
        )
        const inversePatch: { name?: string; parentSpaceId?: string | null } = {}
        if (op.patch.name !== undefined) {
          inversePatch.name = prev.name
        }
        if (op.patch.parentSpaceId !== undefined) {
          inversePatch.parentSpaceId = prev.parent_space_id
        }
        return [{ op: 'update_space', spaceId: op.spaceId, patch: inversePatch }]
      }

      case 'delete_space': {
        const row = await tx.query(
          `select name, icon, color, sort_order, parent_space_id from public.spaces
           where workspace_id = $1 and id = $2 and is_default = false`,
          [workspaceId, op.spaceId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Space "${op.spaceId}" not found or is default`)
        }
        const movedItems = await tx.query(
          `select id, space_id from public.work_items where workspace_id = $1 and space_id = $2`,
          [workspaceId, op.spaceId]
        )
        const movedEntities = await tx.query(
          `select id, space_id from public.entities where workspace_id = $1 and space_id = $2`,
          [workspaceId, op.spaceId]
        )
        if ((movedItems.rowCount ?? 0) > 0 || (movedEntities.rowCount ?? 0) > 0) {
          throw new OperationError(op, 'Cannot delete space that still has items or entities')
        }
        await tx.query(
          `delete from public.spaces where workspace_id = $1 and id = $2`,
          [workspaceId, op.spaceId]
        )
        const s = row.rows[0] as {
          name: string
          icon: string | null
          color: string | null
          sort_order: number
          parent_space_id: string | null
        }
        return [
          {
            op: 'create_space',
            space: {
              name: s.name,
              icon: s.icon,
              color: s.color,
              sortOrder: s.sort_order,
              parentSpaceId: s.parent_space_id,
              preserveSpaceId: op.spaceId,
            },
          },
        ]
      }

      case 'move_work_item_space': {
        const row = await tx.query(
          `select space_id from public.work_items where workspace_id = $1 and id = $2`,
          [workspaceId, op.itemId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Work item "${op.itemId}" not found`)
        }
        const fromSpaceId = row.rows[0]?.space_id as string
        await tx.query(
          `update public.work_items set space_id = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.itemId, op.spaceId]
        )
        return [{ op: 'move_work_item_space', itemId: op.itemId, spaceId: fromSpaceId }]
      }

      case 'move_entity_space': {
        const row = await tx.query(
          `select space_id from public.entities where workspace_id = $1 and id = $2`,
          [workspaceId, op.entityId]
        )
        if (row.rowCount === 0) {
          throw new OperationError(op, `Entity "${op.entityId}" not found`)
        }
        const fromSpaceId = row.rows[0]?.space_id as string
        await tx.query(
          `update public.entities set space_id = $3 where workspace_id = $1 and id = $2`,
          [workspaceId, op.entityId, op.spaceId]
        )
        return [{ op: 'move_entity_space', entityId: op.entityId, spaceId: fromSpaceId }]
      }

      default: {
        const _exhaustive: never = op
        throw new ValidationError(`Unknown operation: ${String(_exhaustive)}`)
      }
    }
  } catch (error) {
    if (error instanceof OperationError || error instanceof ValidationError) {
      throw error
    }
    throw wrapPgError(op, error)
  }
}

export async function runOperationsInTransaction(
  tx: PoolClient,
  workspaceId: string,
  rawOperations: Operation[]
): Promise<{ inverseOperations: Operation[] }> {
  const operations = operationsSchema.parse(rawOperations)
  const perOpInverses: Operation[][] = []

  for (const operation of operations) {
    const inverseSteps = await executeOperation(tx, workspaceId, operation)
    perOpInverses.push(inverseSteps)
  }

  const inverseOperations: Operation[] = []
  for (let i = perOpInverses.length - 1; i >= 0; i--) {
    inverseOperations.push(...perOpInverses[i]!)
  }

  return { inverseOperations }
}
