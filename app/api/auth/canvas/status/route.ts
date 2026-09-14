import { NextResponse } from 'next/server'
import { getCanvasStatus } from '@/lib/server/canvas'

export async function GET() {
  return NextResponse.json(getCanvasStatus())
}
