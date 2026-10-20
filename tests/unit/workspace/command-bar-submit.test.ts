import { describe, expect, it } from 'vitest'

import { decideCommandBarSubmit } from '@/lib/workspace/command-bar-submit'
import type { CommandBarJumpTarget } from '@/lib/workspace/command-bar-search'

describe('decideCommandBarSubmit', () => {
  it('creates when no jump matches', () => {
    expect(decideCommandBarSubmit('Dentist Tue 3pm', [], null)).toEqual({
      action: 'create',
      text: 'Dentist Tue 3pm',
    })
  })

  it('jumps when strong match and not preferring create', () => {
    const target: CommandBarJumpTarget = {
      type: 'item',
      id: 'i1',
      title: 'Rivera quote',
      score: 85,
    }
    expect(decideCommandBarSubmit('rivera', [target], null)).toEqual({
      action: 'jump',
      target,
    })
  })

  it('respects explicit create row', () => {
    expect(
      decideCommandBarSubmit('x', [{ type: 'item', id: '1', title: 'x', score: 100 }], {
        kind: 'create',
        label: 'x',
      })
    ).toEqual({ action: 'create', text: 'x' })
  })
})
