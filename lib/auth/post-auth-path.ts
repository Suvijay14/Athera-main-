import { isOnboardingV1Complete } from '@/lib/onboarding/persona'

/** Where to send a user immediately after sign-in or sign-up. */
export function resolvePostAuthPath(onboardingAnswers: Record<string, unknown>): string {
  return isOnboardingV1Complete(onboardingAnswers) ? '/' : '/onboarding'
}
