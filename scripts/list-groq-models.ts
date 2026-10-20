/**
 * Print Groq models available for GROQ_API_KEY in .env.local.
 * Usage: npm run groq:models
 */
import { config } from 'dotenv'
import { resolve } from 'node:path'

import {
  fetchGroqModelList,
  GROQ_ENTITY_MODEL_PREFERENCES,
  pickGroqEntityModel,
} from '../lib/llm/groq-model'

config({ path: resolve(process.cwd(), '.env.local') })

async function main() {
  const key = process.env.GROQ_API_KEY?.trim()
  if (!key) {
    console.error('Set GROQ_API_KEY in .env.local')
    process.exit(1)
  }

  const models = await fetchGroqModelList(key)
  const chosen = pickGroqEntityModel(models, process.env.GROQ_MODEL)

  console.log(`Models (${models.length} text-capable, active):\n`)
  for (const m of models) {
    const flags = [m.jsonMode ? 'json_mode' : null].filter(Boolean).join(', ')
    console.log(`  ${m.id}${m.name ? ` (${m.name})` : ''}${flags ? ` [${flags}]` : ''}`)
  }

  console.log('\nEntity extraction preference order:', GROQ_ENTITY_MODEL_PREFERENCES.join(' → '))
  console.log('GROQ_MODEL env:', process.env.GROQ_MODEL?.trim() || '(unset)')
  console.log('Resolved model for entity extraction:', chosen)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
