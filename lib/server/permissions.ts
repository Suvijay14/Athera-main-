import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const exec = promisify(execFile)

export interface PermissionStatus {
  id: string
  label: string
  description: string
  granted: boolean | 'unknown'
  settingsUrl?: string
}

export async function checkPermissions(): Promise<PermissionStatus[]> {
  const [screenshot, files] = await Promise.all([
    checkScreenshotPermission(),
    checkFilesPermission(),
  ])

  return [
    {
      id: 'microphone',
      label: 'Microphone (browser)',
      description: 'Allow when Chrome asks after you click the mic.',
      granted: 'unknown',
    },
    screenshot,
    files,
    {
      id: 'automation',
      label: 'Automation',
      description: 'Optional — for opening Finder folders.',
      granted: 'unknown',
      settingsUrl:
        'x-apple.systempreferences:com.apple.preference.security?Privacy_Automation',
    },
  ]
}

async function checkScreenshotPermission(): Promise<PermissionStatus> {
  let granted: boolean | 'unknown' = 'unknown'
  try {
    const tmp = path.join(os.tmpdir(), `athera-perm-${Date.now()}.png`)
    await exec('/usr/sbin/screencapture', ['-x', tmp])
    await fs.unlink(tmp).catch(() => {})
    granted = true
  } catch {
    granted = false
  }

  return {
    id: 'screen_recording',
    label: 'Screen Recording',
    description:
      'Enable for Node or Terminal (the app running npm run dev) — needed for screenshots.',
    granted,
    settingsUrl:
      'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture',
  }
}

async function checkFilesPermission(): Promise<PermissionStatus> {
  let granted = true
  try {
    await fs.readdir(os.homedir())
  } catch {
    granted = false
  }

  return {
    id: 'files',
    label: 'Files & Folders',
    description: 'Enable for Node or Terminal — needed to read Desktop/Documents.',
    granted,
    settingsUrl:
      'x-apple.systempreferences:com.apple.preference.security?Privacy_FilesAndFolders',
  }
}
