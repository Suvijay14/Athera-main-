import { NextResponse } from 'next/server'
import { getGmailStatus } from '@/lib/server/gmail'

export async function GET() {
  return NextResponse.json(getGmailStatus())
}
