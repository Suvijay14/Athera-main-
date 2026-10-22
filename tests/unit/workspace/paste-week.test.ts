import { describe, expect, it } from 'vitest'

import type { Entity, Space } from '@/lib/db/schemas'
import {
  buildPasteWeekPreview,
  PASTE_WEEK_MOCKUP_SAMPLE,
  parsePasteWeekLines,
} from '@/lib/workspace/paste-week'

/** Tuesday, Oct 13, 2026 — matches mockup overview date. */
const now = new Date('2026-10-13T12:00:00.000Z')

const clientsSpaceId = '00000000-0000-4000-8000-000000000010'
const personalSpaceId = '00000000-0000-4000-8000-000000000020'

const ts = '2026-01-01T00:00:00Z'

const mockSpaces = [
  {
    id: clientsSpaceId,
    workspaceId: '00000000-0000-4000-8000-000000000001',
    parentSpaceId: null,
    name: 'Clients',
    icon: 'folder',
    color: '#6366f1',
    sortOrder: 0,
    isDefault: false,
    archivedAt: null,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: personalSpaceId,
    workspaceId: '00000000-0000-4000-8000-000000000001',
    parentSpaceId: null,
    name: 'Personal',
    icon: 'folder',
    color: '#c49746',
    sortOrder: 1,
    isDefault: true,
    archivedAt: null,
    createdAt: ts,
    updatedAt: ts,
  },
] satisfies Space[]

const mockEntities = [
  {
    id: '00000000-0000-4000-8000-000000000100',
    workspaceId: '00000000-0000-4000-8000-000000000001',
    spaceId: clientsSpaceId,
    name: 'Rivera Bakery',
    kind: 'client',
    aliases: ['rivera'],
    color: '#b85d3f',
    archivedAt: null,
    lastActivityAt: null,
    typicalGapDays: null,
    excludedFromSuggestions: false,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: '00000000-0000-4000-8000-000000000101',
    workspaceId: '00000000-0000-4000-8000-000000000001',
    spaceId: clientsSpaceId,
    name: 'Lumen Health',
    kind: 'client',
    aliases: ['lumen'],
    color: '#5c6f84',
    archivedAt: null,
    lastActivityAt: null,
    typicalGapDays: null,
    excludedFromSuggestions: false,
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    workspaceId: '00000000-0000-4000-8000-000000000001',
    spaceId: clientsSpaceId,
    name: 'Oak & Iron',
    kind: 'client',
    aliases: ['oak & iron'],
    color: '#4e644c',
    archivedAt: null,
    lastActivityAt: null,
    typicalGapDays: null,
    excludedFromSuggestions: false,
    createdAt: ts,
    updatedAt: ts,
  },
] satisfies Entity[]

let idSeq = 0

describe('parsePasteWeekLines', () => {
  it('skips empty lines and parses dates per line', () => {
    const rows = parsePasteWeekLines(
      'Follow up Dana Kim\n\nDentist Tue 3pm\n   \nInvoice only',
      now
    )
    expect(rows).toHaveLength(3)
    expect(rows[0]?.title).toBe('Follow up Dana Kim')
    expect(rows[1]?.startAt).toBeTruthy()
    expect(rows[2]?.title).toBe('Invoice only')
  })

  it('returns empty for whitespace-only input', () => {
    expect(parsePasteWeekLines('\n\n  \n', now)).toEqual([])
  })
})

describe('buildPasteWeekPreview — mockup 9-line sample', () => {
  it('produces 9 preview rows with space and timing hints', () => {
    const rows = buildPasteWeekPreview(
      PASTE_WEEK_MOCKUP_SAMPLE,
      {
        spaces: mockSpaces,
        entities: mockEntities,
        entityFieldKeys: ['client'],
        defaultSpaceId: personalSpaceId,
        personalSpaceId,
      },
      now,
      () => `id-${++idSeq}`
    )

    expect(rows).toHaveLength(9)

    const siteReview = rows.find((r) => r.line.toLowerCase().includes('site review'))
    expect(siteReview?.entityName).toBe('Rivera Bakery')
    expect(siteReview?.spaceId).toBe(clientsSpaceId)
    expect(siteReview?.kind).toBe('appointment')
    expect(siteReview?.whenLabel.toLowerCase()).toMatch(/tue/)

    const dentist = rows.find((r) => r.line.toLowerCase().includes('dentist'))
    expect(dentist?.spaceId).toBe(personalSpaceId)
    expect(dentist?.startAt).toBeTruthy()

    const groceries = rows.find((r) => r.line === 'groceries')
    expect(groceries?.spaceId).toBe(personalSpaceId)
    expect(groceries?.whenLabel).toBe('No date')

    const lumenKickoff = rows.find((r) => r.line.toLowerCase().includes('lumen kickoff'))
    expect(lumenKickoff?.entityName).toBe('Lumen Health')
    expect(lumenKickoff?.kind).toBe('appointment')

    const oakLogo = rows.find((r) => r.line.toLowerCase().includes('oak & iron'))
    expect(oakLogo?.entityName).toBe('Oak & Iron')
    expect(oakLogo?.dueDate).toBeTruthy()
  })
})
