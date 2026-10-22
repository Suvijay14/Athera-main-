import { describe, expect, it } from 'vitest'

import { isAuthEntryPath, isAuthExemptApiPath, isPublicPath } from '@/lib/auth/public-paths'
import { resolvePostAuthPath } from '@/lib/auth/post-auth-path'
import { ONBOARDING_V1_COMPLETE_KEY } from '@/lib/onboarding/persona'
import { PRODUCT_ENTRY_PATH } from '@/lib/routes/product-entry'

describe('auth public paths', () => {
  it('treats landing and auth pages as public', () => {
    expect(isPublicPath('/')).toBe(true)
    expect(isPublicPath('/login')).toBe(true)
    expect(isPublicPath('/signup')).toBe(true)
    expect(isPublicPath('/privacy')).toBe(true)
    expect(isPublicPath('/workspace')).toBe(false)
  })

  it('detects auth entry paths', () => {
    expect(isAuthEntryPath('/login')).toBe(true)
    expect(isAuthEntryPath('/privacy')).toBe(false)
  })

  it('exempts webhook and oauth callback APIs', () => {
    expect(isAuthExemptApiPath('/api/webhooks/stripe')).toBe(true)
    expect(isAuthExemptApiPath('/api/integrations/google-calendar/callback')).toBe(true)
    expect(isAuthExemptApiPath('/api/dashboard/home')).toBe(false)
  })
})

describe('resolvePostAuthPath', () => {
  it('sends incomplete onboarding to onboarding flow', () => {
    expect(resolvePostAuthPath({})).toBe('/onboarding')
  })

  it('sends completed onboarding to home dashboard', () => {
    expect(resolvePostAuthPath({ [ONBOARDING_V1_COMPLETE_KEY]: true })).toBe(PRODUCT_ENTRY_PATH)
  })
})
