import { afterEach, describe, expect, it, vi } from 'vitest'

import { legacyFilesystemApiEnabled } from '@/lib/legacy/filesystem-api'

describe('legacyFilesystemApiEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is false in production even when env flag is set', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('LEGACY_FILESYSTEM_API', 'true')
    expect(legacyFilesystemApiEnabled()).toBe(false)
  })

  it('is false in development unless LEGACY_FILESYSTEM_API=true', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LEGACY_FILESYSTEM_API', '')
    expect(legacyFilesystemApiEnabled()).toBe(false)
  })

  it('is true in development when LEGACY_FILESYSTEM_API=true', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('LEGACY_FILESYSTEM_API', 'true')
    expect(legacyFilesystemApiEnabled()).toBe(true)
  })
})
