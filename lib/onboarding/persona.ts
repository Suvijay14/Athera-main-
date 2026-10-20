import { z } from 'zod'

export const onboardingPersonaSchema = z.enum([
  'freelance',
  'tutoring',
  'startup',
  'personal',
])

export type OnboardingPersona = z.infer<typeof onboardingPersonaSchema>

/** Default space display name only — no other scaffolding per spec. */
export function defaultSpaceNameForPersona(persona: OnboardingPersona): string {
  switch (persona) {
    case 'freelance':
      return 'Clients'
    case 'tutoring':
      return 'Tutoring'
    case 'startup':
      return 'Company'
    case 'personal':
      return 'My space'
  }
}

export const ONBOARDING_V1_COMPLETE_KEY = 'onboarding_v1_completed'

export function isOnboardingV1Complete(answers: Record<string, unknown>): boolean {
  return answers[ONBOARDING_V1_COMPLETE_KEY] === true
}
