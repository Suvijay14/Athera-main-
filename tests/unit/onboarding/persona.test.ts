import { describe, expect, it } from 'vitest'

import {
  defaultSpaceNameForPersona,
  isOnboardingV1Complete,
  ONBOARDING_V1_COMPLETE_KEY,
} from '@/lib/onboarding/persona'

describe('defaultSpaceNameForPersona', () => {
  it('maps personas to default space names only', () => {
    expect(defaultSpaceNameForPersona('freelance')).toBe('Clients')
    expect(defaultSpaceNameForPersona('tutoring')).toBe('Tutoring')
    expect(defaultSpaceNameForPersona('startup')).toBe('Company')
    expect(defaultSpaceNameForPersona('personal')).toBe('My space')
  })
})

describe('isOnboardingV1Complete', () => {
  it('reads completion flag from onboarding answers', () => {
    expect(isOnboardingV1Complete({})).toBe(false)
    expect(isOnboardingV1Complete({ [ONBOARDING_V1_COMPLETE_KEY]: true })).toBe(true)
  })
})
