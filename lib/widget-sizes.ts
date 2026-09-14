const STORAGE_KEY = 'athena-widget-sizes'
const LEGACY_HEIGHTS_KEY = 'athena-widget-heights'

export interface WidgetSize {
  height?: number
  width?: number
}

export type WidgetSizes = Record<string, WidgetSize>

export const LAYOUT_SIDEBAR_ID = 'layout-sidebar'

function readRaw(): WidgetSizes {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as WidgetSizes

    const legacy = localStorage.getItem(LEGACY_HEIGHTS_KEY)
    if (!legacy) return {}

    const heights = JSON.parse(legacy) as Record<string, number>
    const migrated: WidgetSizes = {}
    for (const [id, height] of Object.entries(heights)) {
      migrated[id] = { height }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
    localStorage.removeItem(LEGACY_HEIGHTS_KEY)
    return migrated
  } catch {
    return {}
  }
}

export function readWidgetSizes(): WidgetSizes {
  return readRaw()
}

export function readWidgetSize(id: string): WidgetSize {
  return readRaw()[id] ?? {}
}

export function saveWidgetSize(id: string, patch: WidgetSize): void {
  if (typeof window === 'undefined') return
  const current = readRaw()
  current[id] = { ...current[id], ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function clearWidgetSize(id: string): void {
  if (typeof window === 'undefined') return
  const current = readRaw()
  delete current[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

export function removeWidgetSizeFields(id: string, fields: (keyof WidgetSize)[]): void {
  if (typeof window === 'undefined') return
  const current = readRaw()
  if (!current[id]) return
  for (const field of fields) delete current[id][field]
  if (Object.keys(current[id]).length === 0) delete current[id]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
}

/** @deprecated use saveWidgetSize */
export function readWidgetHeights(): Record<string, number> {
  const sizes = readRaw()
  const out: Record<string, number> = {}
  for (const [id, size] of Object.entries(sizes)) {
    if (size.height != null) out[id] = size.height
  }
  return out
}

/** @deprecated use saveWidgetSize */
export function saveWidgetHeight(id: string, height: number): void {
  saveWidgetSize(id, { height })
}

/** @deprecated use clearWidgetSize */
export function clearWidgetHeight(id: string): void {
  clearWidgetSize(id)
}
