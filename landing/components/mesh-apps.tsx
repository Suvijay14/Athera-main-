import type { ComponentType } from 'react'
import {
  SiCalendly,
  SiCanvas,
  SiDropbox,
  SiGmail,
  SiGooglecalendar,
  SiGoogledocs,
  SiGoogledrive,
  SiGooglesheets,
  SiInstagram,
  SiNotion,
  SiPaypal,
  SiQuickbooks,
  SiSquare,
  SiTrello,
  SiVenmo,
  SiWhatsapp,
  SiZelle,
  SiZoom,
} from 'react-icons/si'
import { BiLogoSlack } from 'react-icons/bi'
import { BsFileExcelFill } from 'react-icons/bs'
import { FaMicrosoft } from 'react-icons/fa6'
import { CheckSquare, MessageCircle, Notebook } from 'lucide-react'

export type MeshIconProps = { size?: number; className?: string; color?: string }

export type MeshAppDef = {
  id: string
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Icon: ComponentType<any>
  color?: string
  badge?: number
}

export const MESH_APPS_ALL: MeshAppDef[] = [
  { id: 'notes', name: 'Notes', Icon: Notebook, color: '#f5e6a8' },
  { id: 'reminders', name: 'Reminders', Icon: CheckSquare, color: '#ffe8cc', badge: 12 },
  { id: 'gdocs', name: 'Google Docs', Icon: SiGoogledocs },
  { id: 'gsheets', name: 'Google Sheets', Icon: SiGooglesheets },
  { id: 'gcal', name: 'Google Calendar', Icon: SiGooglecalendar, badge: 3 },
  { id: 'gmail', name: 'Gmail', Icon: SiGmail, badge: 7 },
  { id: 'gdrive', name: 'Google Drive', Icon: SiGoogledrive },
  { id: 'excel', name: 'Excel', Icon: BsFileExcelFill, color: '#217346' },
  { id: 'outlook', name: 'Outlook', Icon: FaMicrosoft, color: '#0078d4' },
  { id: 'imessage', name: 'iMessage', Icon: MessageCircle, color: '#34c759' },
  { id: 'whatsapp', name: 'WhatsApp', Icon: SiWhatsapp },
  { id: 'slack', name: 'Slack', Icon: BiLogoSlack, badge: 1 },
  { id: 'zoom', name: 'Zoom', Icon: SiZoom },
  { id: 'notion', name: 'Notion', Icon: SiNotion },
  { id: 'trello', name: 'Trello', Icon: SiTrello, badge: 5 },
  { id: 'dropbox', name: 'Dropbox', Icon: SiDropbox },
  { id: 'venmo', name: 'Venmo', Icon: SiVenmo },
  { id: 'zelle', name: 'Zelle', Icon: SiZelle },
  { id: 'paypal', name: 'PayPal', Icon: SiPaypal },
  { id: 'square', name: 'Square', Icon: SiSquare },
  { id: 'quickbooks', name: 'QuickBooks', Icon: SiQuickbooks, badge: 2 },
  { id: 'calendly', name: 'Calendly', Icon: SiCalendly },
  { id: 'instagram', name: 'Instagram', Icon: SiInstagram, badge: 99 },
  { id: 'canva', name: 'Canva', Icon: SiCanvas },
]

export const MESH_APPS_MOBILE_IDS = [
  'notes',
  'reminders',
  'gcal',
  'gmail',
  'imessage',
  'slack',
  'zoom',
  'notion',
  'gdrive',
  'venmo',
  'instagram',
  'canva',
]

export function meshAppsForViewport(mobile: boolean): MeshAppDef[] {
  if (!mobile) return MESH_APPS_ALL
  return MESH_APPS_MOBILE_IDS.map(
    (id) => MESH_APPS_ALL.find((a) => a.id === id)!
  ).filter(Boolean)
}
