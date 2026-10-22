import { z } from 'zod'

export const RESERVED_FIELD_KEYS = [
  'title',
  'due_date',
  'notes',
  'id',
  'created_at',
  'updated_at',
] as const

export const fieldKeySchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,39}$/, 'Invalid field key format')
  .refine((key) => !RESERVED_FIELD_KEYS.includes(key as (typeof RESERVED_FIELD_KEYS)[number]), {
    message: 'Field key is reserved',
  })

export const fieldTypeSchema = z.enum([
  'text',
  'number',
  'date',
  'select',
  'checkbox',
  'entity',
])
export const fieldSourceSchema = z.enum(['onboarding', 'user', 'athera'])
export const viewTypeSchema = z.enum(['list', 'grouped', 'board', 'calendar'])
export const itemSourceSchema = z.enum(['manual', 'import', 'recurrence', 'routine'])
export const workItemElementKindSchema = z.enum(['task', 'event', 'reminder', 'note'])
export type WorkItemElementKind = z.infer<typeof workItemElementKindSchema>
export const calendarRangeSchema = z.enum(['week', 'month'])
export const suggestionStatusSchema = z.enum([
  'pending',
  'shown',
  'accepted',
  'dismissed',
  'undone',
  'expired',
])

export const appEventNameSchema = z.enum([
  'onboarding_completed',
  'persona_selected',
  'item_created',
  'item_edited',
  'suggestion_shown',
  'suggestion_previewed',
  'suggestion_accepted',
  'suggestion_dismissed',
  'suggestion_undone',
  'view_opened',
  'adaptation_retained',
  'adaptation_abandoned',
  'command_unsupported',
  'command_request',
  'item_moved_space',
  'notes_updated',
])

const isoDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected yyyy-mm-dd')

export const workspaceSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(1),
  businessType: z.string().nullable(),
  itemLabel: z.string().min(1),
  onboardingAnswers: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const spaceSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  parentSpaceId: z.string().uuid().nullable(),
  name: z.string().min(1),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  sortOrder: z.number().int(),
  isDefault: z.boolean(),
  archivedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const entitySchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  spaceId: z.string().uuid(),
  kind: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()),
  color: z.string().nullable(),
  archivedAt: z.string().nullable(),
  lastActivityAt: z.string().nullable(),
  typicalGapDays: z.number().nullable(),
  excludedFromSuggestions: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const fieldDefinitionSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  key: fieldKeySchema,
  label: z.string().min(1),
  type: fieldTypeSchema,
  options: z.array(z.string()),
  entityKind: z.string().nullable(),
  visible: z.boolean(),
  position: z.number().int(),
  source: fieldSourceSchema,
  createdAt: z.string(),
})

export const workItemSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  spaceId: z.string().uuid(),
  title: z.string().min(1),
  dueDate: isoDateString.nullable(),
  notes: z.string().nullable(),
  data: z.record(z.string(), z.unknown()),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  allDay: z.boolean(),
  source: itemSourceSchema,
  spaceConfidence: z.number().nullable(),
  archivedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
  recurrenceId: z.string().uuid().nullable(),
  recurrenceInstanceDate: isoDateString.nullable(),
  externalProvider: z.string().nullable(),
  externalId: z.string().nullable(),
  elementKind: workItemElementKindSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const viewDefinitionSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  name: z.string().min(1),
  type: viewTypeSchema,
  groupByField: fieldKeySchema.nullable(),
  colorByField: fieldKeySchema.nullable(),
  calendarRange: calendarRangeSchema.nullable(),
  filters: z.record(z.string(), z.unknown()),
  visible: z.boolean(),
  position: z.number().int(),
  source: fieldSourceSchema,
  createdAt: z.string(),
})

export const recurrenceRuleSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  spaceId: z.string().uuid(),
  templateItem: z.record(z.string(), z.unknown()),
  freq: z.literal('weekly'),
  intervalCount: z.union([z.literal(1), z.literal(2)]),
  byWeekday: z.array(z.number().int().min(0).max(6)),
  timeOfDay: z.string().nullable(),
  durationMin: z.number().int().positive().nullable(),
  startsOn: isoDateString,
  endsOn: isoDateString.nullable(),
  exceptions: z.array(isoDateString),
  active: z.boolean(),
  source: fieldSourceSchema,
  createdAt: z.string(),
})

export const suggestionSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  type: z.string().min(1),
  status: suggestionStatusSchema,
  reason: z.string().min(1),
  evidence: z.record(z.string(), z.unknown()),
  confidence: z.number().min(0).max(1),
  operations: z.array(z.unknown()),
  dedupeKey: z.string().min(1),
  createdAt: z.string(),
  resolvedAt: z.string().nullable(),
})

export const changeLogEntrySchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  suggestionId: z.string().uuid(),
  operations: z.array(z.unknown()),
  inverseOperations: z.array(z.unknown()),
  appliedAt: z.string(),
  undoneAt: z.string().nullable(),
})

export const appEventSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
  name: appEventNameSchema,
  props: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
})

export type Workspace = z.infer<typeof workspaceSchema>
export type Space = z.infer<typeof spaceSchema>
export type Entity = z.infer<typeof entitySchema>
export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>
export type WorkItem = z.infer<typeof workItemSchema>
export type ViewDefinition = z.infer<typeof viewDefinitionSchema>
export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>
export type Suggestion = z.infer<typeof suggestionSchema>
export type ChangeLogEntry = z.infer<typeof changeLogEntrySchema>
export type AppEvent = z.infer<typeof appEventSchema>
export type FieldType = z.infer<typeof fieldTypeSchema>

export const updateWorkspaceInputSchema = z.object({
  name: z.string().min(1).optional(),
  businessType: z.string().nullable().optional(),
  itemLabel: z.string().min(1).optional(),
  onboardingAnswers: z.record(z.string(), z.unknown()).optional(),
})

export const createFieldInputSchema = z
  .object({
    key: fieldKeySchema,
    label: z.string().min(1),
    type: fieldTypeSchema,
    options: z.array(z.string()).default([]),
    entityKind: z.string().min(1).nullable().optional(),
    visible: z.boolean().default(true),
    position: z.number().int().default(0),
    source: fieldSourceSchema,
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

export const createWorkItemSpaceResolutionSchema = z.object({
  fromSpaceView: z.boolean(),
  contextSpaceId: z.string().uuid().nullable().optional(),
})

export const createWorkItemInputSchema = z.object({
  title: z.string().trim().min(1),
  spaceId: z.string().uuid().optional(),
  dueDate: isoDateString.nullable().optional(),
  notes: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).default({}),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  source: itemSourceSchema.optional(),
  spaceConfidence: z.number().min(0).max(1).nullable().optional(),
  elementKind: workItemElementKindSchema.optional(),
  /** When set, resolves space via hard rules + classification instead of using spaceId alone. */
  spaceResolution: createWorkItemSpaceResolutionSchema.optional(),
})

export const updateWorkItemInputSchema = z.object({
  completedAt: z.string().nullable().optional(),
  title: z.string().trim().min(1).optional(),
  spaceId: z.string().uuid().optional(),
  dueDate: isoDateString.nullable().optional(),
  notes: z.string().nullable().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  startAt: z.string().datetime().nullable().optional(),
  endAt: z.string().datetime().nullable().optional(),
  allDay: z.boolean().optional(),
  source: itemSourceSchema.optional(),
  spaceConfidence: z.number().min(0).max(1).nullable().optional(),
})

export const createViewInputSchema = z
  .object({
    name: z.string().min(1),
    type: viewTypeSchema,
    groupByField: fieldKeySchema.nullable().optional(),
    colorByField: fieldKeySchema.nullable().optional(),
    calendarRange: calendarRangeSchema.nullable().optional(),
    filters: z.record(z.string(), z.unknown()).default({}),
    visible: z.boolean().default(true),
    position: z.number().int().default(0),
    source: fieldSourceSchema,
  })
  .superRefine((val, ctx) => {
    if ((val.type === 'grouped' || val.type === 'board') && !val.groupByField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'groupByField is required for grouped and board views',
        path: ['groupByField'],
      })
    }
  })

export const createSpaceInputSchema = z.object({
  name: z.string().trim().min(1),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
  parentSpaceId: z.string().uuid().nullable().optional(),
})

export const updateSpaceInputSchema = z.object({
  name: z.string().trim().min(1).optional(),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().int().optional(),
  parentSpaceId: z.string().uuid().nullable().optional(),
})

export const createEntityInputSchema = z.object({
  spaceId: z.string().uuid(),
  kind: z.string().trim().min(1),
  name: z.string().trim().min(1),
  aliases: z.array(z.string()).default([]),
  color: z.string().nullable().optional(),
  lastActivityAt: z.string().datetime().nullable().optional(),
  typicalGapDays: z.number().nullable().optional(),
})

export const updateEntityInputSchema = z.object({
  kind: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  aliases: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
  lastActivityAt: z.string().datetime().nullable().optional(),
  typicalGapDays: z.number().nullable().optional(),
})

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>
export type CreateFieldInput = z.infer<typeof createFieldInputSchema>
export type CreateWorkItemInput = z.infer<typeof createWorkItemInputSchema>
export type UpdateWorkItemInput = z.infer<typeof updateWorkItemInputSchema>
export type CreateViewInput = z.infer<typeof createViewInputSchema>
export type CreateSpaceInput = z.infer<typeof createSpaceInputSchema>
export type UpdateSpaceInput = z.infer<typeof updateSpaceInputSchema>
export type CreateEntityInput = z.infer<typeof createEntityInputSchema>
export type UpdateEntityInput = z.infer<typeof updateEntityInputSchema>

export const signUpInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const signInInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
