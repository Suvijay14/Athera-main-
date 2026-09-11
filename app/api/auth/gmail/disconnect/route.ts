import { NextResponse } from 'next/server'
import { deleteGmailTokens } from '@/lib/server/gmail'

export async function POST() {
  deleteGmailTokens()
  return NextResponse.json({ success: true })
}
