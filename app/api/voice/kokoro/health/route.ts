import { NextResponse } from 'next/server'
import { isKokoroRunning, DEFAULT_KOKORO_VOICE, KOKORO_URL } from '@/lib/server/kokoro'
import { getKokoroSetupStatus } from '@/lib/server/kokoro-setup'
import { readDeviceSettings } from '@/lib/server/device-settings'

export async function GET() {
  const running = await isKokoroRunning()
  const setup = getKokoroSetupStatus()
  const settings = readDeviceSettings()

  return NextResponse.json({
    running,
    voice: settings.kokoro?.voice ?? DEFAULT_KOKORO_VOICE,
    scriptFound: setup.scriptFound,
    modelsFound: setup.modelsFound,
    installDir: setup.installDir,
    installed: settings.kokoro?.installed ?? setup.scriptFound,
    url: KOKORO_URL,
  })
}
