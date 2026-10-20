const COLLAPSED_KEY = 'athera_sidebar_collapsed'

export function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(COLLAPSED_KEY) === '1'
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0')
}
