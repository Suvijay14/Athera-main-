import { Suspense } from 'react'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
