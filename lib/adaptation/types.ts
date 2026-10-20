import { z } from 'zod'

import { fieldKeySchema, fieldTypeSchema } from '@/lib/db/schemas'

export type { FieldType } from '@/lib/db/schemas'

const fieldPayloadSchema = z
  .object({
    key: fieldKeySchema,
    label: z.string().min(1),
    type: fieldTypeSchema,
    options: z.array(z.string()).optional(),
    entityKind: z.string().min(1).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'entity' && !val.entityKind) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'entityKind is required when type is entity',
        path: ['entityKind'],
      })
    }
  })

const viewFilterClauseSchema = z.object({
  field: fieldKeySchema,
  op: z.enum(['is', 'is_not', 'before', 'after']),
  value: z.string(),
})

const viewPayloadSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['list', 'grouped', 'board', 'calendar']),
  groupByField: fieldKeySchema.optional(),
  colorByField: fieldKeySchema.optional(),
  calendarRange: z.enum(['week', 'month']).optional(),
  filters: z.object({ clauses: z.array(viewFilterClauseSchema) }).optional(),
})

const createEntityPayloadSchema = z.object({
  spaceId: z.string().uuid(),
  kind: z.string().min(1),
  name: z.string().min(1),
  color: z.string().nullable().optional(),
  aliases: z.array(z.string()).optional(),
})

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const recurrenceRulePayloadSchema = z.object({
  spaceId: z.string().uuid(),
  templateItem: z.record(z.string(), z.unknown()),
  freq: z.literal('weekly'),
  intervalCount: z.union([z.literal(1), z.literal(2)]),
  byWeekday: z.array(z.number().int().min(0).max(6)).min(1),
  timeOfDay: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  durationMin: z.number().int().positive().nullable().optional(),
  startsOn: isoDate,
  endsOn: isoDate.nullable().optional(),
  exceptions: z.array(isoDate).optional(),
  linkItemIds: z.array(z.string().uuid()).optional(),
  preserveRuleId: z.string().uuid().optional(),
})

export const operationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('create_field'), field: fieldPayloadSchema }),
  z.object({ op: z.literal('delete_field'), key: fieldKeySchema }),
  z.object({
    op: z.literal('set_field_visibility'),
    key: fieldKeySchema,
    visible: z.boolean(),
  }),
  z.object({
    op: z.literal('update_field'),
    key: fieldKeySchema,
    patch: z.object({
      label: z.string().min(1).optional(),
      options: z.array(z.string()).optional(),
    }),
  }),
  z.object({ op: z.literal('create_entity'), entity: createEntityPayloadSchema }),
  z.object({ op: z.literal('delete_entity'), entityId: z.string().uuid() }),
  z.object({ op: z.literal('create_view'), view: viewPayloadSchema }),
  z.object({ op: z.literal('delete_view'), viewId: z.string().uuid() }),
  z.object({
    op: z.literal('backfill_field'),
    key: fieldKeySchema,
    values: z.record(z.string().uuid(), z.union([z.null(), z.unknown()])),
  }),
  z.object({ op: z.literal('create_recurrence_rule'), rule: recurrenceRulePayloadSchema }),
  z.object({ op: z.literal('delete_recurrence_rule'), ruleId: z.string().uuid() }),
  z.object({
    op: z.literal('set_recurrence_exception'),
    ruleId: z.string().uuid(),
    date: isoDate,
  }),
  z.object({
    op: z.literal('end_recurrence_rule'),
    ruleId: z.string().uuid(),
    endsOn: isoDate,
  }),
  z.object({
    op: z.literal('clear_item_recurrence'),
    itemIds: z.array(z.string().uuid()),
    ruleId: z.string().uuid().optional(),
  }),
  z.object({
    op: z.literal('link_items_recurrence'),
    ruleId: z.string().uuid(),
    itemIds: z.array(z.string().uuid()),
  }),
  z.object({
    op: z.literal('remove_recurrence_exception'),
    ruleId: z.string().uuid(),
    date: isoDate,
  }),
  z.object({
    op: z.literal('restore_recurrence_ends_on'),
    ruleId: z.string().uuid(),
    endsOn: isoDate.nullable(),
  }),
  z.object({ op: z.literal('archive_entity'), entityId: z.string().uuid() }),
  z.object({
    op: z.literal('unarchive_entity'),
    entityId: z.string().uuid(),
    restoreItemIds: z.array(z.string().uuid()).optional(),
  }),
  z.object({
    op: z.literal('create_followup_item'),
    entityId: z.string().uuid(),
    spaceId: z.string().uuid(),
    entityFieldKey: fieldKeySchema,
    title: z.string().min(1),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
  z.object({ op: z.literal('delete_work_item'), itemId: z.string().uuid() }),
  z.object({
    op: z.literal('restore_work_item'),
    itemId: z.string().uuid(),
    spaceId: z.string().uuid(),
    title: z.string().min(1),
    dueDate: z.string().nullable(),
    notes: z.string().nullable(),
    data: z.record(z.string(), z.unknown()),
    startAt: z.string().nullable().optional(),
    endAt: z.string().nullable().optional(),
    allDay: z.boolean().optional(),
    source: z.string().optional(),
    archivedAt: z.string().nullable().optional(),
  }),
  z.object({
    op: z.literal('create_draft'),
    entityId: z.string().uuid(),
    channel: z.enum(['email', 'text']),
    body: z.string().min(1),
  }),
  z.object({ op: z.literal('delete_draft'), draftId: z.string().uuid() }),
  z.object({
    op: z.literal('create_space'),
    space: z.object({
      name: z.string().min(1),
      icon: z.string().nullable().optional(),
      color: z.string().nullable().optional(),
      sortOrder: z.number().int().optional(),
      preserveSpaceId: z.string().uuid().optional(),
    }),
  }),
  z.object({ op: z.literal('delete_space'), spaceId: z.string().uuid() }),
  z.object({
    op: z.literal('move_work_item_space'),
    itemId: z.string().uuid(),
    spaceId: z.string().uuid(),
  }),
  z.object({
    op: z.literal('move_entity_space'),
    entityId: z.string().uuid(),
    spaceId: z.string().uuid(),
  }),
])

export type Operation = z.infer<typeof operationSchema>

export const operationsSchema = z.array(operationSchema)
