import { isOnboardingV1Complete } from './persona'

/** Brand-new empty workspace → show persona onboarding once. */
export function needsColdStartOnboarding(
  onboardingAnswers: Record<string, unknown>,
  totalItemCount: number
): boolean {
  if (totalItemCount > 0) {
    return false
  }
  return !isOnboardingV1Complete(onboardingAnswers)
}
