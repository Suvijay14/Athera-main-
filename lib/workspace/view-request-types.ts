import { z } from 'zod'

export const viewRequestFilterSchema = z.object({
  field: z.string().min(1),
  op: z.enum(['is', 'is_not', 'before', 'after']),
  value: z.string(),
})

export type ViewRequestFilter = z.infer<typeof viewRequestFilterSchema>

export type ViewRequestSpec =
  | {
      spaceId: string
      type: 'list' | 'calendar'
      range: 'week' | 'month' | null
      groupBy: string | null
      colorBy: string | null
      filters: ViewRequestFilter[]
      save: boolean
    }
  | { unsupported: true }

/** Raw LLM JSON shape (snake_case). */
export const llmViewRequestResponseSchema = z.union([
  z.object({ unsupported: z.literal(true) }),
  z.object({
    type: z.enum(['list', 'calendar']),
    range: z.enum(['week', 'month']).nullable(),
    group_by: z.string().nullable(),
    color_by: z.string().nullable(),
    save: z.boolean(),
    filters: z.array(viewRequestFilterSchema).default([]),
  }),
])

export type LlmViewRequestResponse = z.infer<typeof llmViewRequestResponseSchema>
