import { NextResponse } from 'next/server'
import { readDeviceSettings, getDeviceInfo } from '@/lib/server/device-settings'
import { getOllamaSetupStatus } from '@/lib/server/ollama-setup'
import { getKokoroSetupStatus } from '@/lib/server/kokoro-setup'
import { getActiveLLMInfo } from '@/lib/server/llm'
import { isKokoroRunning } from '@/lib/server/kokoro'
import { checkPermissions } from '@/lib/server/permissions'
import { getGmailStatus } from '@/lib/server/gmail'

export async function GET() {
  const info = getDeviceInfo()
  const settings = readDeviceSettings()
  const ollama = await getOllamaSetupStatus()
  const kokoroSetup = getKokoroSetupStatus()
  const llm = await getActiveLLMInfo()
  const kokoroRunning = await isKokoroRunning()
  const permissions = await checkPermissions()
  const gmail = getGmailStatus()

  return NextResponse.json({
    ...info,
    settings,
    live: {
      llm,
      ollama,
      kokoro: {
        ...kokoroSetup,
        running: kokoroRunning,
        voice: settings.kokoro?.voice ?? 'af_bella',
      },
      gmail,
      permissions,
    },
  })
}
