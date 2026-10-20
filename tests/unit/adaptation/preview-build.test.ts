import { describe, expect, it } from 'vitest'

import {
  assertPreviewableSuggestionStatus,
  buildSuggestionPreview,
} from '@/lib/adaptation/preview-build'
import type { Operation } from '@/lib/adaptation/types'
import { SuggestionStateError } from '@/lib/adaptation/errors'

describe('buildSuggestionPreview', () => {
  const ops: Operation[] = [
    { op: 'create_field', field: { key: 'client', label: 'Client', type: 'text' } },
    {
      op: 'backfill_field',
      key: 'client',
      values: {
        '00000000-0000-4000-8000-000000000001': 'Rivera Plumbing',
        '00000000-0000-4000-8000-000000000002': 'Acme',
        '00000000-0000-4000-8000-000000000003': 'Beta',
      },
    },
    {
      op: 'create_view',
      view: { name: 'Clients', type: 'grouped', groupByField: 'client' },
    },
  ]

  it('orders operation descriptions and counts backfill items', () => {
    const titles = new Map([
      ['00000000-0000-4000-8000-000000000001', 'Rivera Plumbing — send quote'],
      ['00000000-0000-4000-8000-000000000002', 'Acme invoice'],
      ['00000000-0000-4000-8000-000000000003', 'Beta job'],
    ])
    const preview = buildSuggestionPreview(ops, { count: 99 }, titles)
    expect(preview.operationDescriptions).toEqual([
      "Add a 'Client' field",
      "Fill in 'client' for 3 items",
      "Add a 'Clients' view, grouped by client",
    ])
    expect(preview.affectedItemCount).toBe(3)
    expect(preview.sampleItems).toHaveLength(3)
    expect(preview.summary).toContain('Client')
  })

  it('handles suggestions without backfill (zero affected items)', () => {
    const viewOnly: Operation[] = [
      { op: 'create_view', view: { name: 'All jobs', type: 'list' } },
    ]
    const preview = buildSuggestionPreview(viewOnly, {}, new Map())
    expect(preview.affectedItemCount).toBe(0)
    expect(preview.sampleItems).toEqual([])
    expect(preview.operationDescriptions).toHaveLength(1)
  })
})

describe('assertPreviewableSuggestionStatus', () => {
  it('throws SuggestionStateError for non-previewable status', () => {
    expect(() => assertPreviewableSuggestionStatus('accepted')).toThrow(SuggestionStateError)
    expect(() => assertPreviewableSuggestionStatus('pending')).not.toThrow()
  })
})
