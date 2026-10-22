import { isOnboardingV1Complete } from '@/lib/onboarding/persona'
import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

/** Where to send a user immediately after sign-in or sign-up. */
export function resolvePostAuthPath(onboardingAnswers: Record<string, unknown>): string {
  return isOnboardingV1Complete(onboardingAnswers) ? PRODUCT_ENTRY_PATH : '/onboarding'
}
