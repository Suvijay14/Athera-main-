const STORAGE_KEY = 'athera-widget-sizes'

// Keys written by earlier versions, before the Athena -> Athera rename. These
// are literal historical strings — they must keep the old spelling or the saved
// layouts in existing browsers become unreachable.
const LEGACY_SIZES_KEY = 'athena-widget-sizes'
const LEGACY_HEIGHTS_KEY = 'athena-widget-heights'

/** Widget ids that were renamed alongside the product. */
const LEGACY_WIDGET_IDS: Record<string, string> = {
  'athenas-note': 'atheras-note',
}

function remapIds(sizes: WidgetSizes): WidgetSizes {
  const out: WidgetSizes = {}
  for (const [id, size] of Object.entries(sizes)) {
    out[LEGACY_WIDGET_IDS[id] ?? id] = size
  }
  return out
}

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

    const legacySizes = localStorage.getItem(LEGACY_SIZES_KEY)
    if (legacySizes) {
      const migrated = remapIds(JSON.parse(legacySizes) as WidgetSizes)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_SIZES_KEY)
      return migrated
    }

    const legacyHeights = localStorage.getItem(LEGACY_HEIGHTS_KEY)
    if (!legacyHeights) return {}

    const heights = JSON.parse(legacyHeights) as Record<string, number>
    const migrated: WidgetSizes = {}
    for (const [id, height] of Object.entries(heights)) {
      migrated[id] = { height }
    }
    const remapped = remapIds(migrated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remapped))
    localStorage.removeItem(LEGACY_HEIGHTS_KEY)
    return remapped
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
