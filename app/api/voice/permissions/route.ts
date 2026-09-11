import { NextResponse } from 'next/server'
import { checkPermissions } from '@/lib/server/permissions'

export async function GET() {
  return NextResponse.json({ permissions: await checkPermissions() })
}
