'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_UI_VERSION,
  UI_VERSION_STORAGE_KEY,
  type UiVersion,
  parseUiVersion,
} from '@/lib/ui-version'

export function useUiVersion(): UiVersion {
  const [version, setVersion] = useState<UiVersion>(DEFAULT_UI_VERSION)

  useEffect(() => {
    setVersion(parseUiVersion(localStorage.getItem(UI_VERSION_STORAGE_KEY)))
    const onStorage = (e: StorageEvent) => {
      if (e.key === UI_VERSION_STORAGE_KEY) {
        setVersion(parseUiVersion(e.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return version
}

export function useSetUiVersion() {
  return useCallback((version: UiVersion) => {
    localStorage.setItem(UI_VERSION_STORAGE_KEY, version)
    window.location.reload()
  }, [])
}
