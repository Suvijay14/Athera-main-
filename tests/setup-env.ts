import path from 'node:path'

import { loadEnvConfig } from '@next/env'

loadEnvConfig(path.resolve(__dirname, '..'))
