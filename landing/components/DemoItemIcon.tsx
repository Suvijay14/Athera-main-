'use client'

import {
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  FileText,
  Gift,
  GraduationCap,
  HeartPulse,
  Phone,
  Receipt,
  ShoppingCart,
  TrendingUp,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import type { DemoIconKey, DemoItemType } from '@/demo-data'
import { ICON_BY_ITEM_TYPE } from '@/demo-data'

const ICONS: Record<DemoIconKey, LucideIcon> = {
  'graduation-cap': GraduationCap,
  'book-open': BookOpen,
  'heart-pulse': HeartPulse,
  'shopping-cart': ShoppingCart,
  car: Car,
  'file-text': FileText,
  receipt: Receipt,
  calendar: Calendar,
  gift: Gift,
  briefcase: Briefcase,
  phone: Phone,
  'trending-up': TrendingUp,
  'user-plus': UserPlus,
}

export default function DemoItemIcon({
  icon,
  type,
  className = 'w-4 h-4 text-ink-muted shrink-0 mt-0.5',
  strokeWidth = 2,
}: {
  icon?: DemoIconKey
  type?: DemoItemType
  className?: string
  strokeWidth?: number
}) {
  const key = icon ?? (type ? ICON_BY_ITEM_TYPE[type] : 'calendar')
  const Icon = ICONS[key]
  return <Icon className={className} strokeWidth={strokeWidth} />
}
