import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  Calendar,
  Car,
  Coffee,
  Folder,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  Laptop,
  Leaf,
  MapPin,
  Package,
  Palette,
  Phone,
  Plane,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
  Wrench,
} from 'lucide-react'

export const SPACE_COLOR_SWATCHES = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
] as const

export const SPACE_ICON_OPTIONS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'home', Icon: Home, label: 'Home' },
  { id: 'briefcase', Icon: Briefcase, label: 'Work' },
  { id: 'wrench', Icon: Wrench, label: 'Service' },
  { id: 'hammer', Icon: Hammer, label: 'Build' },
  { id: 'folder', Icon: Folder, label: 'Folder' },
  { id: 'users', Icon: Users, label: 'People' },
  { id: 'calendar', Icon: Calendar, label: 'Calendar' },
  { id: 'phone', Icon: Phone, label: 'Calls' },
  { id: 'truck', Icon: Truck, label: 'Delivery' },
  { id: 'car', Icon: Car, label: 'Vehicle' },
  { id: 'plane', Icon: Plane, label: 'Travel' },
  { id: 'map-pin', Icon: MapPin, label: 'Location' },
  { id: 'shopping-bag', Icon: ShoppingBag, label: 'Shop' },
  { id: 'package', Icon: Package, label: 'Orders' },
  { id: 'laptop', Icon: Laptop, label: 'Tech' },
  { id: 'graduation-cap', Icon: GraduationCap, label: 'School' },
  { id: 'heart', Icon: Heart, label: 'Personal' },
  { id: 'coffee', Icon: Coffee, label: 'Cafe' },
  { id: 'leaf', Icon: Leaf, label: 'Garden' },
  { id: 'palette', Icon: Palette, label: 'Creative' },
  { id: 'star', Icon: Star, label: 'Star' },
  { id: 'sparkles', Icon: Sparkles, label: 'Special' },
]

export function spaceIconComponent(iconId: string | null | undefined): LucideIcon {
  const found = SPACE_ICON_OPTIONS.find((o) => o.id === iconId)
  return found?.Icon ?? Folder
}
