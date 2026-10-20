import type { SupabaseClient } from '@supabase/supabase-js'

import { isOnboardingV1Complete } from '@/lib/onboarding/persona'

export async function workspaceNeedsOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('onboarding_answers')
    .eq('owner_id', userId)
    .maybeSingle()

  if (error || !data) {
    return true
  }

  const answers =
    data.onboarding_answers && typeof data.onboarding_answers === 'object'
      ? (data.onboarding_answers as Record<string, unknown>)
      : {}

  return !isOnboardingV1Complete(answers)
}
