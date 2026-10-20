const STORAGE_KEY = 'athera_onboarding_v2'

export type OnboardingStep = 1 | 2 | 3 | 4

export interface OnboardingProgress {
  completed: boolean
  skipped: boolean
  lastStep: OnboardingStep
}

const defaultProgress: OnboardingProgress = {
  completed: false,
  skipped: false,
  lastStep: 1,
}

export function readOnboardingProgress(): OnboardingProgress {
  if (typeof window === 'undefined') return defaultProgress
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultProgress
    return { ...defaultProgress, ...JSON.parse(raw) } as OnboardingProgress
  } catch {
    return defaultProgress
  }
}

export function writeOnboardingProgress(patch: Partial<OnboardingProgress>) {
  const next = { ...readOnboardingProgress(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function markOnboardingComplete() {
  return writeOnboardingProgress({ completed: true, lastStep: 4 })
}

export function markOnboardingSkipped() {
  return writeOnboardingProgress({ skipped: true })
}
