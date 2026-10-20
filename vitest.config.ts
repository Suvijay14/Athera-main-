import path from 'node:path'

import dotenv from 'dotenv'
import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'vitest/config'

// Load before Vitest collects test files (describe callbacks run at import time).
dotenv.config({ path: path.resolve(__dirname, '.env.local') })
loadEnvConfig(path.resolve(__dirname))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['./tests/setup-env.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/mocks/server-only.ts'),
    },
  },
})
