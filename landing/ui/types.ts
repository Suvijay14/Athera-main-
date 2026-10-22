import type { DemoIconKey } from '@/demo-data'

export type AtheraListItem = {
  id: string
  title: string
  icon?: DemoIconKey
  toneClass?: string
}

export type AtheraEntityGroup = {
  entity: string
  count: number
  items: AtheraListItem[]
}

export type AtheraTimelineEntry = {
  id: string
  title: string
  subtitle: string
}

export type AtheraSpaceNavItem = {
  id: string
  label: string
  active?: boolean
}
