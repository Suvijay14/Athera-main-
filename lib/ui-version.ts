export type UiVersion = '1' | '2'

export const DEFAULT_UI_VERSION: UiVersion = '2'
export const UI_VERSION_STORAGE_KEY = 'athera_ui_version'

export function parseUiVersion(value: string | null | undefined): UiVersion {
  return value === '1' ? '1' : '2'
}
